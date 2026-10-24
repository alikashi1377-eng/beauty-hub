import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSqlChecksum,
  extractSafeSqlState,
  loadAndValidateMigrationFiles,
  MIGRATION_ADVISORY_LOCK_KEY,
  MigrationClientLike,
  MigrationPoolClientLike,
  MigrationPoolLike,
  runMigrationsOnPool,
  runMigrationsWithClient,
} from './migrate';

// =============================================================================
// توجه مهم: تمام تست‌های این فایل (migrate.test.ts) تست‌های واحد آفلاین و Mock
// برای بررسی منطق اجراکننده Migration، مدیریت اتصال/قفل در لایه Node.js و بررسی ایستای
// فایل‌های SQL هستند و جایگزین تست اجرای واقعی روی موتور PostgreSQL 17 نمی‌باشند.
// تست‌های واقعی دیتابیس به صورت مجزا در فایل postgres-integration.spec.ts طراحی شده‌اند.
// =============================================================================

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

test('extractSafeSqlState returns valid 5-char SQLSTATE codes and rejects unsafe strings', () => {
  assert.equal(extractSafeSqlState({ code: '42501' }), '42501');
  assert.equal(extractSafeSqlState({ code: '23P01' }), '23P01');
  assert.equal(extractSafeSqlState({ code: '22003' }), '22003');
  assert.equal(
    extractSafeSqlState({ code: 'postgres://user:pass@host:5432/db' }),
    null
  );
  assert.equal(extractSafeSqlState(new Error('raw error')), null);
  assert.equal(extractSafeSqlState(null), null);
});

test('static verification of critical security & business constraints across SQL migration files', () => {
  const files = loadAndValidateMigrationFiles();
  const byVersion = new Map(files.map((f) => [f.version, f.sql]));

  // ۱. عدم وابستگی غیرضروری به pgcrypto و استفاده از gen_random_uuid() داخلی PostgreSQL 17
  const allSql = files.map((f) => f.sql).join('\n');
  assert.equal(/CREATE\s+EXTENSION[^;]*pgcrypto/i.test(allSql), false);

  // ۲. بررسی قیدها و توابع اتمیک OTP در Migration 002
  const sql002 = byVersion.get('002_users_auth_and_permissions') ?? '';
  assert.match(sql002, /CREATE UNIQUE INDEX uq_otp_single_pending_per_phone/);
  assert.match(sql002, /chk_otp_pending_has_remaining_attempts/);
  assert.match(sql002, /status <> 'PENDING' OR attempts_count < max_attempts/);
  assert.match(sql002, /issue_otp_challenge_atomic/);
  assert.match(sql002, /verify_otp_challenge_atomic/);
  assert.match(sql002, /check_and_increment_auth_rate_limit/);
  assert.match(sql002, /platform_admins/);

  // ۳. بررسی ایندکس مالک و تریگر اتمیک ثبت مالک در business_members در Migration 003
  const sql003 = byVersion.get('003_categories_and_businesses') ?? '';
  assert.match(sql003, /CREATE INDEX idx_businesses_owner_user_id/);
  assert.match(sql003, /ensure_business_owner_membership/);
  assert.match(sql003, /trg_businesses_ensure_owner_member/);
  assert.match(sql003, /ON CONFLICT \(business_id, user_id\) DO UPDATE/);

  // ۴. بررسی الزام سخت‌گیرانه btree_gist، قید EXCLUDE و قید دوطرفه لغو در Migration 005
  const sql005 = byVersion.get('005_appointments_and_crm') ?? '';
  assert.match(sql005, /MIGRATION_005_BTREE_GIST_PRIVILEGE_ERROR/);
  assert.match(sql005, /excl_appointments_specialist_active_overlap/);
  assert.match(sql005, /EXCLUDE USING gist/);
  assert.match(sql005, /chk_appointments_service_ends_exact/);
  assert.match(sql005, /chk_appointments_occupied_until_exact/);
  assert.match(
    sql005,
    /status <> 'CANCELLED' AND cancelled_at IS NULL AND cancelled_reason IS NULL/
  );
  assert.match(sql005, /service_id\s+UUID\s+NOT NULL/);

  // ۵. بررسی جلوگیری از سرریز عددی با CASE WHEN و تابع convert_toman_to_rial_strict در Migration 006
  const sql006 = byVersion.get('006_showcase_billing_and_platform') ?? '';
  assert.match(sql006, /convert_toman_to_rial_strict/);
  assert.match(sql006, /chk_payments_amount_overflow_safe_and_exact/);
  assert.match(sql006, /CASE\s+WHEN amount_toman >= 0/);
  assert.match(sql006, /amount_toman <= 100000000000/);
  assert.match(sql006, /THEN amount_rial = amount_toman \* 10/);
  assert.match(sql006, /chk_payments_verified_requires_server_proof/);
});

test('runMigrationsOnPool checks out a single dedicated PoolClient, unlocks advisory lock before client.release(), and is idempotent on re-run (offline mock)', async () => {
  const lifecycleEvents: string[] = [];
  const appliedStore = new Map<string, string>();
  let connectCount = 0;

  const mockPool: MigrationPoolLike = {
    async connect(): Promise<MigrationPoolClientLike> {
      connectCount += 1;
      const clientId = connectCount;
      lifecycleEvents.push(`client_${clientId}:connected`);

      return {
        async query<R = Record<string, unknown>>(
          text: string,
          values?: unknown[]
        ) {
          const trimmed = text.trim();

          if (
            trimmed.startsWith('SELECT pg_advisory_lock') &&
            values?.[0] === MIGRATION_ADVISORY_LOCK_KEY
          ) {
            lifecycleEvents.push(`client_${clientId}:advisory_lock`);
            return { rows: [] as R[] };
          }

          if (
            trimmed.startsWith('SELECT pg_advisory_unlock') &&
            values?.[0] === MIGRATION_ADVISORY_LOCK_KEY
          ) {
            lifecycleEvents.push(`client_${clientId}:advisory_unlock`);
            return { rows: [] as R[] };
          }

          if (
            trimmed.startsWith(
              'SELECT version, checksum_sha256 FROM schema_migrations'
            )
          ) {
            const rows = Array.from(appliedStore.entries()).map(
              ([version, checksum_sha256]) => ({ version, checksum_sha256 })
            ) as unknown as R[];
            return { rows };
          }

          if (trimmed.startsWith('INSERT INTO schema_migrations')) {
            const [version, checksum] = values as [string, string, number];
            appliedStore.set(version, checksum);
            lifecycleEvents.push(`client_${clientId}:applied_${version}`);
            return { rows: [] as R[] };
          }

          return { rows: [] as R[] };
        },
        release() {
          lifecycleEvents.push(`client_${clientId}:released`);
        },
      };
    },
  };

  // اجرای بار اول روی Pool
  const firstRun = await runMigrationsOnPool(mockPool);
  assert.equal(firstRun.totalFiles, 6);
  assert.equal(firstRun.alreadyAppliedCount, 0);
  assert.equal(firstRun.newlyAppliedVersions.length, 6);
  assert.equal(connectCount, 1);

  // بررسی ترتیب دقیق آزاد شدن قفل پیش از آزاد شدن اتصال
  const unlockIdx = lifecycleEvents.indexOf('client_1:advisory_unlock');
  const releaseIdx = lifecycleEvents.indexOf('client_1:released');
  assert.ok(unlockIdx > 0, 'advisory_unlock must be called');
  assert.ok(
    releaseIdx > unlockIdx,
    'client.release() must be called strictly AFTER pg_advisory_unlock'
  );

  // اجرای بار دوم: همه ۶ فایل باید رد (Skip) شوند و باز هم قفل و اتصال به ترتیب آزاد شوند
  const secondRun = await runMigrationsOnPool(mockPool);
  assert.equal(secondRun.totalFiles, 6);
  assert.equal(secondRun.alreadyAppliedCount, 6);
  assert.equal(secondRun.newlyAppliedVersions.length, 0);
  assert.equal(connectCount, 2);
  assert.ok(
    lifecycleEvents.indexOf('client_2:released') >
      lifecycleEvents.indexOf('client_2:advisory_unlock')
  );
});

test('runMigrationsOnPool unlocks advisory lock and releases PoolClient when checksum mismatch occurs (offline mock)', async () => {
  const events: string[] = [];

  const mockPool: MigrationPoolLike = {
    async connect(): Promise<MigrationPoolClientLike> {
      events.push('connect');
      return {
        async query<R = Record<string, unknown>>(text: string) {
          const trimmed = text.trim();
          if (trimmed.startsWith('SELECT pg_advisory_lock')) {
            events.push('lock');
          } else if (trimmed.startsWith('SELECT pg_advisory_unlock')) {
            events.push('unlock');
          } else if (
            trimmed.startsWith(
              'SELECT version, checksum_sha256 FROM schema_migrations'
            )
          ) {
            return {
              rows: [
                {
                  version: '001_core_helpers',
                  checksum_sha256: '0'.repeat(64),
                },
              ] as unknown as R[],
            };
          }
          return { rows: [] as R[] };
        },
        release() {
          events.push('release');
        },
      };
    },
  };

  await assert.rejects(
    () => runMigrationsOnPool(mockPool),
    /MIGRATION_CHECKSUM_MISMATCH/
  );

  assert.deepEqual(events, ['connect', 'lock', 'unlock', 'release']);
});

test('runMigrationsOnPool rolls back, preserves SQLSTATE 42501 without leaking secrets, unlocks, and releases client when btree_gist privilege is missing (offline mock)', async () => {
  const events: string[] = [];

  const mockPool: MigrationPoolLike = {
    async connect(): Promise<MigrationPoolClientLike> {
      events.push('connect');
      return {
        async query<R = Record<string, unknown>>(
          text: string,
          values?: unknown[]
        ) {
          const trimmed = text.trim();
          if (
            trimmed.startsWith('SELECT pg_advisory_lock') &&
            values?.[0] === MIGRATION_ADVISORY_LOCK_KEY
          ) {
            events.push('lock');
          }
          if (
            trimmed.startsWith('SELECT pg_advisory_unlock') &&
            values?.[0] === MIGRATION_ADVISORY_LOCK_KEY
          ) {
            events.push('unlock');
          }
          if (trimmed === 'ROLLBACK') {
            events.push('rollback');
          }
          if (trimmed.includes('CREATE EXTENSION btree_gist')) {
            const err = new Error(
              'MIGRATION_005_BTREE_GIST_PRIVILEGE_ERROR: permission denied on postgres://admin:secretPass123@db.liara.ir:5432/beautyhub'
            ) as Error & { code: string };
            err.code = '42501';
            throw err;
          }
          return { rows: [] as R[] };
        },
        release() {
          events.push('release');
        },
      };
    },
  };

  let caughtError: Error | null = null;
  try {
    await runMigrationsOnPool(mockPool);
  } catch (err) {
    caughtError = err as Error;
  }

  assert.ok(caughtError, 'Expected migration failure');
  assert.match(caughtError.message, /MIGRATION_BTREE_GIST_REQUIRED_ERROR/);
  assert.match(caughtError.message, /\[SQLSTATE=42501\]/);
  assert.equal(caughtError.message.includes('secretPass123'), false);
  assert.equal(caughtError.message.includes('db.liara.ir'), false);
  assert.deepEqual(events, ['connect', 'lock', 'rollback', 'unlock', 'release']);
});

test('runMigrationsWithClient preserves generic SQLSTATE code (e.g. 42P01) on unexpected SQL failure without exposing raw error text (offline mock)', async () => {
  const events: string[] = [];

  const mockClient: MigrationClientLike = {
    async query<R = Record<string, unknown>>(text: string) {
      const trimmed = text.trim();
      if (trimmed.startsWith('SELECT pg_advisory_lock')) {
        events.push('lock');
      } else if (trimmed.startsWith('SELECT pg_advisory_unlock')) {
        events.push('unlock');
      } else if (trimmed === 'ROLLBACK') {
        events.push('rollback');
      } else if (trimmed.includes('CREATE OR REPLACE FUNCTION set_updated_at_timestamp')) {
        const err = new Error(
          'syntax or relation error at host internal-pg.liara.run password=topsecret'
        ) as Error & { code: string };
        err.code = '42P01';
        throw err;
      }
      return { rows: [] as R[] };
    },
  };

  let caughtError: Error | null = null;
  try {
    await runMigrationsWithClient(mockClient);
  } catch (err) {
    caughtError = err as Error;
  }

  assert.ok(caughtError);
  assert.match(
    caughtError.message,
    /MIGRATION_EXECUTION_FAILED \(001_core_helpers\.sql\) \[SQLSTATE=42P01\]/
  );
  assert.equal(caughtError.message.includes('topsecret'), false);
  assert.equal(caughtError.message.includes('internal-pg.liara.run'), false);
  assert.deepEqual(events, ['lock', 'rollback', 'unlock']);
});

