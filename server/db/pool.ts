import pg from 'pg';
import { loadServerEnv, ServerEnvConfig, SslMode } from '../config/env';

const { Pool } = pg;

export interface DatabaseHealthReport {
  mode: 'mock' | 'real';
  configured: boolean;
  connected: boolean;
  status:
    | 'not_configured'
    | 'skipped_in_mock_mode'
    | 'connected'
    | 'error';
  sslMode: SslMode;
  latencyMs: number | null;
  errorCode?: string;
  message: string;
}

const SAFE_PG_ERROR_CODES: Record<string, string> = {
  ECONNREFUSED: 'DB_CONNECTION_REFUSED',
  ENOTFOUND: 'DB_HOST_NOT_FOUND',
  ETIMEDOUT: 'DB_CONNECTION_TIMEOUT',
  ECONNRESET: 'DB_CONNECTION_RESET',
  EHOSTUNREACH: 'DB_HOST_UNREACHABLE',
  '28P01': 'DB_AUTHENTICATION_FAILED',
  '28000': 'DB_INVALID_AUTHORIZATION',
  '3D000': 'DB_CATALOG_NOT_FOUND',
  '53300': 'DB_TOO_MANY_CONNECTIONS',
  '57P03': 'DB_CANNOT_CONNECT_NOW',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'DB_SSL_SELF_SIGNED_CERT',
  SELF_SIGNED_CERT_IN_CHAIN: 'DB_SSL_CERT_CHAIN_ERROR',
};

/**
 * تبدیل خطای داخلی درایور دیتابیس به کد امن بدون افشای رمز عبور، میزبان، Connection String یا Stack Trace
 */
export function sanitizeDatabaseError(err: unknown): {
  errorCode: string;
  safeMessage: string;
} {
  if (err && typeof err === 'object') {
    const code =
      'code' in err && typeof (err as { code?: unknown }).code === 'string'
        ? (err as { code: string }).code
        : undefined;

    if (code && SAFE_PG_ERROR_CODES[code]) {
      return {
        errorCode: SAFE_PG_ERROR_CODES[code],
        safeMessage:
          'برقراری ارتباط با دیتابیس PostgreSQL با خطا مواجه شد. لطفاً وضعیت سرویس دیتابیس و متغیرهای محیطی سرور را بررسی کنید.',
      };
    }
  }

  return {
    errorCode: 'DB_CONNECTION_ERROR',
    safeMessage:
      'خطا در اتصال به دیتابیس PostgreSQL. جزئیات فنی در سمت سرور ثبت شده است.',
  };
}

function buildSslConfig(
  sslMode: SslMode
): false | { rejectUnauthorized: boolean } {
  if (sslMode === 'disable') return false;
  if (sslMode === 'require') return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

let activePool: pg.Pool | null = null;
let activePoolUrl: string | null = null;

export function getOrCreatePool(
  config: ServerEnvConfig = loadServerEnv()
): pg.Pool | null {
  // در حالت mock هیچ اتصالی به دیتابیس ایجاد نمی‌شود تا از هرگونه نوشتن یا اتصال ناخواسته جلوگیری شود
  if (config.dataMode === 'mock') {
    return null;
  }

  if (!config.databaseUrl || !config.isDatabaseUrlValid) {
    return null;
  }

  if (activePool && activePoolUrl === config.databaseUrl) {
    return activePool;
  }

  if (activePool) {
    void activePool.end().catch(() => {});
  }

  activePoolUrl = config.databaseUrl;
  activePool = new Pool({
    connectionString: config.databaseUrl,
    ssl: buildSslConfig(config.databaseSslMode),
    max: config.poolMax,
    connectionTimeoutMillis: config.connectionTimeoutMs,
    idleTimeoutMillis: 30000,
    query_timeout: config.connectionTimeoutMs,
  });

  // جلوگیری از کرش پروسه Node در صورت بروز خطای شبکه روی کلاینت‌های Idle در Pool
  activePool.on('error', () => {
    // جزئیات حساس لاگ نمی‌شود
  });

  return activePool;
}

export async function closeDatabasePool(): Promise<void> {
  if (activePool) {
    const poolToClose = activePool;
    activePool = null;
    activePoolUrl = null;
    await poolToClose.end().catch(() => {});
  }
}

/**
 * بررسی سلامت اتصال دیتابیس با کوئری سبک و فقط‌خواندنی SELECT 1
 */
export async function checkDatabaseHealth(
  config: ServerEnvConfig = loadServerEnv()
): Promise<DatabaseHealthReport> {
  const configured = Boolean(config.databaseUrl);

  if (config.dataMode === 'mock') {
    return {
      mode: 'mock',
      configured,
      connected: false,
      status: configured ? 'skipped_in_mock_mode' : 'not_configured',
      sslMode: config.databaseSslMode,
      latencyMs: null,
      message: configured
        ? 'سرور در حالت دمو (mock) قرار دارد و اتصال به دیتابیس غیرفعال است.'
        : 'متغیر DATABASE_URL تنظیم نشده است؛ برنامه در حالت دمو (mock) اجرا می‌شود.',
    };
  }

  // حالت real فعال است اما DATABASE_URL وجود ندارد یا ساختار آن نامعتبر است
  if (!config.databaseUrl || !config.isDatabaseUrlValid) {
    return {
      mode: 'real',
      configured: false,
      connected: false,
      status: 'error',
      sslMode: config.databaseSslMode,
      latencyMs: null,
      errorCode: 'DATABASE_URL_MISSING_OR_INVALID',
      message:
        'حالت داده واقعی (real) فعال است اما متغیر DATABASE_URL تنظیم نشده یا ساختار معتبری ندارد.',
    };
  }

  const startMs = Date.now();
  let tempPool: pg.Pool | null = null;

  try {
    const pool =
      config.databaseUrl === process.env.DATABASE_URL
        ? getOrCreatePool(config)
        : (tempPool = new Pool({
            connectionString: config.databaseUrl,
            ssl: buildSslConfig(config.databaseSslMode),
            max: 1,
            connectionTimeoutMillis: config.connectionTimeoutMs,
            query_timeout: config.connectionTimeoutMs,
          }));

    if (!pool) {
      return {
        mode: 'real',
        configured: false,
        connected: false,
        status: 'error',
        sslMode: config.databaseSslMode,
        latencyMs: null,
        errorCode: 'POOL_NOT_INITIALIZED',
        message: 'استخر اتصال دیتابیس مقداردهی نشده است.',
      };
    }

    await pool.query('SELECT 1 AS ok');
    const latencyMs = Date.now() - startMs;

    return {
      mode: 'real',
      configured: true,
      connected: true,
      status: 'connected',
      sslMode: config.databaseSslMode,
      latencyMs,
      message: 'اتصال به دیتابیس PostgreSQL برقرار است.',
    };
  } catch (err) {
    const { errorCode, safeMessage } = sanitizeDatabaseError(err);
    return {
      mode: 'real',
      configured: true,
      connected: false,
      status: 'error',
      sslMode: config.databaseSslMode,
      latencyMs: null,
      errorCode,
      message: safeMessage,
    };
  } finally {
    if (tempPool) {
      await tempPool.end().catch(() => {});
    }
  }
}
