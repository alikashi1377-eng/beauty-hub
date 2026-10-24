import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSqlChecksum,
  loadAndValidateMigrationFiles,
  MIGRATION_ADVISORY_LOCK_KEY,
  MigrationClientLike,
  runMigrationsWithClient,
} from './migrate';

test('loadAndValidateMigrationFiles loads all 6 numbered SQL files in strict sequential order', () => {
  const files = loadAndValidateMigrationFiles();
  assert.equal(files.length, 6);

  const expectedNames = [
    '001_core_helpers.sql',
    '002_users_auth_and_permissions.sql',
    '003_categories_and_businesses.sql',
    '004_services_and_specialists.sql',
    '005_appointments_and_crm.sql',
    '006_showcase_billing_and_platform.sql',
  ];

  assert.deepEqual(
    files.map((f) => f.fileName),
    expectedNames
  );

  for (const file of files) {
    assert.equal(file.checksumSha256.length, 64);
    assert.match(file.checksumSha256, /^[0-9a-f]{64}$/);
  }
});

test('computeSqlChecksum normalizes CRLF and LF identically', () => {
  const lf = 'CREATE TABLE t (\n  id UUID PRIMARY KEY\n);\n';
  const crlf = 'CREATE TABLE t (\r\n  id UUID PRIMARY KEY\r\n);\r\n';
  assert.equal(computeSqlChecksum(lf), computeSqlChecksum(crlf));
});

test('static verification of critical security & business constraints across SQL migration files', () => {
  const files = loadAndValidateMigrationFiles();
  const byVersion = new Map(files.map((f) => [f.version, f.sql]));

  // ۱. عدم وابستگی غیرضروری به pgcrypto و استفاده از gen_random_uuid() داخلی PostgreSQL 17
  const allSql = files.map((f) => f.sql).join('\n');
  assert.equal(/CREATE\s+EXTENSION[^;]*pgcrypto/i.test(allSql), false);

  // ۲. بررسی قفل اتمیک OTP و محدودسازی نرخ در Migration 002
  const sql002 = byVersion.get('002_users_auth_and_permissions') ?? '';
  assert.match(sql002, /CREATE UNIQUE INDEX uq_otp_single_pending_per_phone/);
  assert.match(sql002, /issue_otp_challenge_atomic/);
  assert.match(sql002, /check_and_increment_auth_rate_limit/);
  assert.match(sql002, /platform_admins/);

  // ۳. بررسی الزام سخت‌گیرانه btree_gist و قید EXCLUDE USING gist در Migration 005
  const sql005 = byVersion.get('005_appointments_and_crm') ?? '';
  assert.match(sql005, /MIGRATION_005_BTREE_GIST_PRIVILEGE_ERROR/);
  assert.match(sql005, /excl_appointments_specialist_active_overlap/);
  assert.match(sql005, /EXCLUDE USING gist/);
  assert.match(sql005, /chk_appointments_service_ends_exact/);
  assert.match(sql005, /chk_appointments_occupied_until_exact/);

  // ۴. بررسی جلوگیری از سرریز عددی در تبدیل تومان به ریال و الزام تایید سرور در Migration 006
  const sql006 = byVersion.get('006_showcase_billing_and_platform') ?? '';
  assert.match(sql006, /chk_payments_amount_overflow_safe_and_exact/);
  assert.match(sql006, /amount_toman <= 100000000000/);
  assert.match(sql006, /amount_rial = amount_toman \* 10/);
  assert.match(sql006, /chk_payments_verified_requires_server_proof/);
});

test('runMigrationsWithClient executes pending migrations in transactions, records checksums, and is idempotent on re-run (offline mock client)', async () => {
  const executedQueries: string[] = [];
  const appliedStore = new Map<string, string>();

  const mockClient: MigrationClientLike = {
    async query<R = Record<string, unknown>>(text: string, values?: unknown[]) {
      const trimmed = text.trim();
      executedQueries.push(trimmed.slice(0, 60));

      if (trimmed.startsWith('SELECT version, checksum_sha256 FROM schema_migrations')) {
        const rows = Array.from(appliedStore.entries()).map(
          ([version, checksum_sha256]) => ({ version, checksum_sha256 })
        ) as unknown as R[];
        return { rows };
      }

      if (trimmed.startsWith('INSERT INTO schema_migrations')) {
        const [version, checksum] = values as [string, string, number];
        appliedStore.set(version, checksum);
        return { rows: [] };
      }

      return { rows: [] };
    },
  };

  // اجرای بار اول: باید هر ۶ فایل اجرا و ثبت شوند
  const firstRun = await runMigrationsWithClient(mockClient);
  assert.equal(firstRun.totalFiles, 6);
  assert.equal(firstRun.alreadyAppliedCount, 0);
  assert.equal(firstRun.newlyAppliedVersions.length, 6);

  // اجرای بار دوم: باید تمام ۶ فایل به دلیل تطابق Checksum رد (Skip) شوند
  const secondRun = await runMigrationsWithClient(mockClient);
  assert.equal(secondRun.totalFiles, 6);
  assert.equal(secondRun.alreadyAppliedCount, 6);
  assert.equal(secondRun.newlyAppliedVersions.length, 0);
});

test('runMigrationsWithClient halts with MIGRATION_CHECKSUM_MISMATCH if a previously applied migration checksum differs', async () => {
  const mockClient: MigrationClientLike = {
    async query<R = Record<string, unknown>>(text: string) {
      const trimmed = text.trim();
      if (trimmed.startsWith('SELECT version, checksum_sha256 FROM schema_migrations')) {
        return {
          rows: [
            {
              version: '001_core_helpers',
              checksum_sha256: '0'.repeat(64),
            },
          ] as unknown as R[],
        };
      }
      return { rows: [] };
    },
  };

  await assert.rejects(
    () => runMigrationsWithClient(mockClient),
    /MIGRATION_CHECKSUM_MISMATCH/
  );
});

test('runMigrationsWithClient rolls back and throws explicit MIGRATION_BTREE_GIST_REQUIRED_ERROR when btree_gist privilege is missing', async () => {
  let rolledBack = false;
  let unlocked = false;

  const mockClient: MigrationClientLike = {
    async query<R = Record<string, unknown>>(text: string, values?: unknown[]) {
      const trimmed = text.trim();
      if (
        trimmed.startsWith('SELECT pg_advisory_unlock') &&
        values?.[0] === MIGRATION_ADVISORY_LOCK_KEY
      ) {
        unlocked = true;
      }
      if (trimmed === 'ROLLBACK') {
        rolledBack = true;
      }
      if (trimmed.includes('CREATE EXTENSION btree_gist')) {
        const err = new Error(
          'MIGRATION_005_BTREE_GIST_PRIVILEGE_ERROR: permission denied'
        ) as Error & { code: string };
        err.code = '42501';
        throw err;
      }
      return { rows: [] as R[] };
    },
  };

  await assert.rejects(
    () => runMigrationsWithClient(mockClient),
    /MIGRATION_BTREE_GIST_REQUIRED_ERROR/
  );
  assert.equal(rolledBack, true);
  assert.equal(unlocked, true);
});
