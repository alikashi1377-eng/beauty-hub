import 'dotenv/config';

export type DataMode = 'mock' | 'real';
export type SslMode = 'disable' | 'no-verify' | 'require';

export interface ServerEnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  dataMode: DataMode;
  databaseUrl: string | null;
  isDatabaseUrlValid: boolean;
  databaseSslMode: SslMode;
  poolMax: number;
  connectionTimeoutMs: number;
}

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) return 3000;
  const parsed = Number.parseInt(rawPort, 10);
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    return 3000;
  }
  return parsed;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  maxLimit: number
): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maxLimit);
}

export function validateDatabaseUrlFormat(url: string | null): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return (
      (parsed.protocol === 'postgres:' || parsed.protocol === 'postgresql:') &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function resolveSslMode(
  rawSsl: string | undefined,
  databaseUrl: string | null,
  nodeEnv: string
): SslMode {
  const normalized = (rawSsl ?? '').trim().toLowerCase();
  if (normalized === 'disable' || normalized === 'false' || normalized === '0') {
    return 'disable';
  }
  if (normalized === 'require' || normalized === 'verify-full' || normalized === 'true') {
    return 'require';
  }
  if (normalized === 'no-verify' || normalized === 'allow') {
    return 'no-verify';
  }

  // بررسی پارامتر sslmode درون DATABASE_URL در صورت وجود
  if (databaseUrl && validateDatabaseUrlFormat(databaseUrl)) {
    try {
      const parsed = new URL(databaseUrl);
      const urlSslMode = parsed.searchParams.get('sslmode')?.toLowerCase();
      if (urlSslMode === 'disable') return 'disable';
      if (urlSslMode === 'require' || urlSslMode === 'verify-full') {
        return 'require';
      }
      if (urlSslMode === 'no-verify' || urlSslMode === 'allow' || urlSslMode === 'prefer') {
        return 'no-verify';
      }
    } catch {
      // نادیده گرفتن خطای پارس URL؛ در بخش اعتبارسنجی بررسی می‌شود
    }
  }

  // در محیط ابری (مانند لیارا) به صورت پیش‌فرض TLS بدون خطای گواهی Self-Signed داخلی فعال است
  return nodeEnv === 'production' ? 'no-verify' : 'disable';
}

export function loadServerEnv(
  envSource: Record<string, string | undefined> = process.env
): ServerEnvConfig {
  const rawNodeEnv = (envSource.NODE_ENV ?? 'development').trim().toLowerCase();
  const nodeEnv: 'development' | 'production' | 'test' =
    rawNodeEnv === 'production'
      ? 'production'
      : rawNodeEnv === 'test'
        ? 'test'
        : 'development';

  const port = parsePort(envSource.PORT);
  const rawDatabaseUrl = envSource.DATABASE_URL?.trim() || null;
  const isDatabaseUrlValid = validateDatabaseUrlFormat(rawDatabaseUrl);

  const rawDataMode = envSource.DATA_MODE?.trim().toLowerCase();
  let dataMode: DataMode;
  if (rawDataMode === 'mock') {
    dataMode = 'mock';
  } else if (rawDataMode === 'real') {
    dataMode = 'real';
  } else {
    // اگر DATA_MODE صراحتاً تعیین نشده باشد: فقط در صورت وجود DATABASE_URL در حالت real قرار می‌گیرد
    dataMode = rawDatabaseUrl ? 'real' : 'mock';
  }

  const databaseSslMode = resolveSslMode(
    envSource.DATABASE_SSL,
    rawDatabaseUrl,
    nodeEnv
  );

  const poolMax = parsePositiveInt(envSource.DB_POOL_MAX, 10, 50);
  const connectionTimeoutMs = parsePositiveInt(
    envSource.DB_CONNECT_TIMEOUT_MS,
    4000,
    30000
  );

  return {
    nodeEnv,
    port,
    dataMode,
    databaseUrl: rawDatabaseUrl,
    isDatabaseUrlValid,
    databaseSslMode,
    poolMax,
    connectionTimeoutMs,
  };
}
