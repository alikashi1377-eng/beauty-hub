import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
export const MIGRATION_ADVISORY_LOCK_KEY = 77391045;

export interface MigrationFileDescriptor {
  version: string;
  sequenceNumber: number;
  fileName: string;
  filePath: string;
  sql: string;
  checksumSha256: string;
}

export interface AppliedMigrationRecord {
  version: string;
  checksum_sha256: string;
  applied_at?: string | Date;
  execution_ms?: number;
}

export interface MigrationClientLike {
  query<R = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<{ rows: R[]; rowCount?: number | null }>;
}

export interface MigrationPoolClientLike extends MigrationClientLike {
  release(err?: Error | boolean): void;
}

export interface MigrationPoolLike {
  connect(): Promise<MigrationPoolClientLike>;
}

export interface MigrationRunSummary {
  totalFiles: number;
  alreadyAppliedCount: number;
  newlyAppliedVersions: string[];
  skippedVersions: string[];
}

interface InternalClientSessionHealth {
  shouldDestroyConnection?: boolean;
}

/**
 * استخراج امن کد استاندارد ۵ کاراکتری SQLSTATE بدون افشای پیام خطا یا اطلاعات اتصال
 */
export function extractSafeSqlState(err: unknown): string | null {
  if (!err || typeof err !== 'object' || !('code' in err)) {
    return null;
  }
  const rawCode = String((err as { code?: unknown }).code ?? '').trim();
  return /^[0-9A-Z]{5}$/.test(rawCode) ? rawCode : null;
}

/**
 * محاسبه هش SHA-256 استاندارد پس از نرمال‌سازی پایان خطوط (CRLF -> LF)
 * تا هش فایل در سیستم‌عامل‌های مختلف (Linux/Windows/macOS) یکسان باشد.
 */
export function computeSqlChecksum(rawSql: string): string {
  const normalized = rawSql.replace(/\r\n/g, '\n').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

/**
 * بارگذاری و بررسی ایستای فایل‌های SQL موجود در پوشه migrations بدون اتصال به دیتابیس
 */
export function loadAndValidateMigrationFiles(
  migrationsDir: string = DEFAULT_MIGRATIONS_DIR
): MigrationFileDescriptor[] {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`پوشه Migration یافت نشد: ${migrationsDir}`);
  }

  const entries = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));

  if (entries.length === 0) {
    throw new Error('هیچ فایل SQL در پوشه migrations یافت نشد.');
  }

  const descriptors: MigrationFileDescriptor[] = [];
  const seenSequenceNumbers = new Set<number>();

  for (let i = 0; i < entries.length; i++) {
    const fileName = entries[i];
    const match = /^(\d{3})_([a-z0-9_]+)\.sql$/.exec(fileName);
    if (!match) {
      throw new Error(
        `نام فایل Migration نامعتبر است (${fileName}). فرمت مجاز: NNN_description.sql`
      );
    }

    const sequenceNumber = Number.parseInt(match[1], 10);
    const expectedSequence = i + 1;
    if (sequenceNumber !== expectedSequence) {
      throw new Error(
        `ترتیب شماره‌گذاری Migration پیوسته نیست: انتظار شماره ${String(expectedSequence).padStart(3, '0')} می‌رفت اما ${fileName} مشاهده شد.`
      );
    }

    if (seenSequenceNumbers.has(sequenceNumber)) {
      throw new Error(`شماره تکرارشونده در فایل‌های Migration: ${fileName}`);
    }
    seenSequenceNumbers.add(sequenceNumber);

    const filePath = path.join(migrationsDir, fileName);
    const rawSql = fs.readFileSync(filePath, 'utf8');
    const trimmedSql = rawSql.trim();

    if (!trimmedSql) {
      throw new Error(`فایل Migration خالی است: ${fileName}`);
    }

    // بررسی ایستای عدم وجود دستورات غیرتراکنشی درون فایل‌های تراکنش‌پذیر
    if (/\bCONCURRENTLY\b/i.test(trimmedSql)) {
      throw new Error(
        `فایل ${fileName} حاوی دستور غیرتراکنشی CONCURRENTLY است که درون بلوک BEGIN...COMMIT مجاز نیست.`
      );
    }

    const version = fileName.replace(/\.sql$/, '');
    const checksumSha256 = computeSqlChecksum(rawSql);

    descriptors.push({
      version,
      sequenceNumber,
      fileName,
      filePath,
      sql: rawSql,
      checksumSha256,
    });
  }

  return descriptors;
}

/**
 * اجرای امن و تراکنش‌پذیر Migrationها روی یک کلاینت اختصاصی دیتابیس (pg.PoolClient)
 * تمام مراحل اخذ قفل، بررسی جدول schema_migrations و تراکنش‌های BEGIN/COMMIT روی همین اتصال واحد اجرا می‌شوند.
 */
export async function runMigrationsWithClient(
  client: MigrationClientLike & InternalClientSessionHealth,
  migrationsDir: string = DEFAULT_MIGRATIONS_DIR
): Promise<MigrationRunSummary> {
  const migrationFiles = loadAndValidateMigrationFiles(migrationsDir);

  // ۱. اخذ قفل انحصاری در سطح نشست (Session-level Advisory Lock) روی همین اتصال
  await client.query('SELECT pg_advisory_lock($1)', [
    MIGRATION_ADVISORY_LOCK_KEY,
  ]);

  try {
    // ۲. ایجاد جدول ثبت نسخه‌های اجراشده در صورت عدم وجود
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version         VARCHAR(120) PRIMARY KEY,
        checksum_sha256 CHAR(64)     NOT NULL,
        applied_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        execution_ms    INTEGER      NOT NULL CHECK (execution_ms >= 0)
      );
    `);

    // ۳. خواندن Migrationهای اجراشده قبلی و بررسی یکپارچگی Checksum
    const existingResult = await client.query<AppliedMigrationRecord>(
      'SELECT version, checksum_sha256 FROM schema_migrations ORDER BY version ASC'
    );

    const appliedMap = new Map<string, string>();
    for (const row of existingResult.rows) {
      appliedMap.set(row.version, row.checksum_sha256.trim());
    }

    const newlyAppliedVersions: string[] = [];
    const skippedVersions: string[] = [];

    for (const migration of migrationFiles) {
      const recordedChecksum = appliedMap.get(migration.version);

      if (recordedChecksum) {
        if (recordedChecksum !== migration.checksumSha256) {
          throw new Error(
            `MIGRATION_CHECKSUM_MISMATCH: فایل ${migration.fileName} پس از اجرا تغییر کرده است (ثبت‌شده=${recordedChecksum.slice(0, 12)}..., فعلی=${migration.checksumSha256.slice(0, 12)}...). اجرای Migration متوقف شد.`
          );
        }
        skippedVersions.push(migration.version);
        continue;
      }

      // ۴. اجرای هر Migration جدید در یک تراکنش مستقل اتمیک روی همان اتصال اختصاصی
      const startMs = Date.now();
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        const executionMs = Math.max(0, Date.now() - startMs);

        await client.query(
          `INSERT INTO schema_migrations (version, checksum_sha256, execution_ms)
           VALUES ($1, $2, $3)`,
          [migration.version, migration.checksumSha256, executionMs]
        );

        await client.query('COMMIT');
        newlyAppliedVersions.push(migration.version);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {
          client.shouldDestroyConnection = true;
        });

        const sqlState = extractSafeSqlState(err);
        const errMsg =
          err instanceof Error ? err.message : 'خطای نامشخص در اجرای Migration';

        if (
          sqlState === '42501' ||
          errMsg.includes('MIGRATION_005_BTREE_GIST')
        ) {
          const stateSuffix = sqlState ? ` [SQLSTATE=${sqlState}]` : '';
          throw new Error(
            `MIGRATION_BTREE_GIST_REQUIRED_ERROR${stateSuffix}: اجرای ${migration.fileName} متوقف شد زیرا افزونه الزامی btree_gist فعال نیست و کاربر دیتابیس مجوز ایجاد آن را ندارد. هیچ راهکار جایگزینی به صورت خودکار فعال نشد.`
          );
        }

        const stateSuffix = sqlState ? ` [SQLSTATE=${sqlState}]` : '';
        throw new Error(
          `MIGRATION_EXECUTION_FAILED (${migration.fileName})${stateSuffix}: اجرای فایل متوقف و تغییرات آن Rollback شد.`
        );
      }
    }

    return {
      totalFiles: migrationFiles.length,
      alreadyAppliedCount: skippedVersions.length,
      newlyAppliedVersions,
      skippedVersions,
    };
  } finally {
    await client
      .query('SELECT pg_advisory_unlock($1)', [MIGRATION_ADVISORY_LOCK_KEY])
      .catch(() => {
        client.shouldDestroyConnection = true;
      });
  }
}

/**
 * اجرای Migrationها با دریافت یک PoolClient اختصاصی از Pool.
 * تضمین می‌کند که pg_advisory_lock، تراکنش‌ها و pg_advisory_unlock همگی روی یک نشست واحد
 * اجرا شوند و در پایان ابتدا قفل آزاد شده و سپس اتصال با client.release() به Pool بازگردانده شود.
 * اگر ROLLBACK یا pg_advisory_unlock با خطا مواجه شده باشد، اتصال با client.release(true) تخریب می‌شود.
 */
export async function runMigrationsOnPool(
  pool: MigrationPoolLike,
  migrationsDir: string = DEFAULT_MIGRATIONS_DIR
): Promise<MigrationRunSummary> {
  // پیش از دریافت اتصال از Pool، صحت فایل‌ها را بررسی می‌کنیم تا در صورت خطای ایستا اتصال بیهوده اشغال نشود
  loadAndValidateMigrationFiles(migrationsDir);

  const client = (await pool.connect()) as MigrationPoolClientLike &
    InternalClientSessionHealth;
  try {
    return await runMigrationsWithClient(client, migrationsDir);
  } finally {
    if (client.shouldDestroyConnection) {
      client.release(true);
    } else {
      client.release();
    }
  }
}

