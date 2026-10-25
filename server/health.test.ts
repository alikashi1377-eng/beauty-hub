import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { Pool } from 'pg';
import { createApiApp } from './app';
import {
  hashSessionSecretPart,
  signSessionToken,
  verifySignedSessionToken,
} from './auth/session';
import {
  loadServerEnv,
  resolveOtpHmacSecret,
  validateDatabaseUrlFormat,
} from './config/env';
import {
  bootstrapInitialPlatformAdminInDb,
  getBootstrapPayload,
  requestOtpInDb,
  verifyOtpInDb,
} from './repositories/beautyhubRepository';
import {
  classifyMelipayamakFailure,
  resolveSmsConfig,
  sendOtpSmsViaGateway,
} from './services/smsGateway';

async function startEphemeralServer(
  envOverrides: Record<string, string | undefined>,
  customPool?: Pool
) {
  const config = loadServerEnv(envOverrides);
  const app = createApiApp(config, customPool);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

const TEST_SESSION_SECRET = 'test_session_secret_key_at_least_32_chars_long!';
const TEST_OTP_SECRET = 'test_otp_hmac_secret_key_at_least_32_chars_long!';

interface MockDbState {
  sessions: Map<
    string,
    {
      id: string;
      user_id: string;
      refresh_token_hash: string;
      expires_at: Date;
      revoked_at: Date | null;
    }
  >;
  users: Map<
    string,
    {
      id: string;
      phone: string;
      full_name: string;
      default_city: string;
      is_active: boolean;
    }
  >;
  admins: Map<string, { is_active: boolean; revoked_at: Date | null }>;
  memberships: Array<{
    user_id: string;
    business_id: string;
    business_slug: string;
    member_role: 'OWNER' | 'MANAGER' | 'STAFF';
    is_active: boolean;
  }>;
  businesses: Map<
    string,
    {
      id: string;
      slug: string;
      name: string;
      city: string;
      neighborhood: string;
      address: string;
      phone_display: string;
      instagram_handle: string | null;
      short_description: string;
      about_text: string;
      map_lat: number | null;
      map_lng: number | null;
      subscription_plan: string;
      subscription_status: string;
      approval_status: string;
    }
  >;
  services: Map<string, { id: string; business_id: string; title: string }>;
  appointments: Map<
    string,
    {
      id: string;
      business_id: string;
      customer_user_id: string | null;
      customer_phone: string;
      status: string;
    }
  >;
}

function createSecurityTestPool(state: MockDbState): Pool {
  const executeQuery = async (sql: string, params: unknown[] = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    if (
      normalized === 'begin' ||
      normalized === 'commit' ||
      normalized === 'rollback'
    ) {
      return { rows: [], rowCount: 0 };
    }

    // ۱. بررسی نشست در جدول user_sessions (resolveAuthenticatedSessionFromDb)
    if (
      normalized.includes('from user_sessions us') &&
      normalized.includes('join users u on u.id = us.user_id')
    ) {
      const sessionId = String(params[0] || '');
      const tokenHash = String(params[1] || '');
      const sess = state.sessions.get(sessionId);
      if (!sess || sess.refresh_token_hash !== tokenHash) {
        return { rows: [], rowCount: 0 };
      }
      const usr = state.users.get(sess.user_id);
      if (!usr) return { rows: [], rowCount: 0 };
      return {
        rows: [
          {
            session_id: sess.id,
            user_id: sess.user_id,
            expires_at: sess.expires_at.toISOString(),
            revoked_at: sess.revoked_at ? sess.revoked_at.toISOString() : null,
            user_is_active: usr.is_active,
          },
        ],
        rowCount: 1,
      };
    }

    // ۲. ثبت آخرین استفاده از نشست
    if (normalized.startsWith('update user_sessions set last_used_at = now()')) {
      return { rows: [], rowCount: 1 };
    }

    // ۳. بارگذاری پروفایل و نقش ادمین در loadUserPermissionsByUserId
    if (
      normalized.includes('from users u') &&
      normalized.includes('left join platform_admins pa on pa.user_id = u.id')
    ) {
      const userId = String(params[0] || '');
      const usr = state.users.get(userId);
      if (!usr) return { rows: [], rowCount: 0 };
      const adm = state.admins.get(userId);
      return {
        rows: [
          {
            id: usr.id,
            phone: usr.phone,
            full_name: usr.full_name,
            default_city: usr.default_city,
            user_is_active: usr.is_active,
            admin_is_active: adm ? adm.is_active : false,
            admin_revoked_at: adm ? adm.revoked_at : null,
          },
        ],
        rowCount: 1,
      };
    }

    // ۴. بارگذاری عضویت‌های کسب‌وکار در loadUserPermissionsByUserId
    if (
      normalized.includes('from business_members bm') &&
      normalized.includes('join businesses b on b.id = bm.business_id')
    ) {
      const userId = String(params[0] || '');
      const rows = state.memberships
        .filter((m) => m.user_id === userId && m.is_active)
        .map((m) => ({
          business_id: m.business_id,
          business_external_id: m.business_id,
          business_slug: m.business_slug,
          member_role: m.member_role,
        }));
      return { rows, rowCount: rows.length };
    }

    // ۵. بررسی مستقیم عضویت کسب‌وکار در assertUserHasBusinessAccess و updateAppointmentStatusInDb
    if (
      normalized.includes('from business_members') &&
      normalized.includes('where business_id = $1 and user_id = $2')
    ) {
      const bizId = String(params[0] || '');
      const userId = String(params[1] || '');
      const found = state.memberships.find(
        (m) => m.business_id === bizId && m.user_id === userId && m.is_active
      );
      if (!found) return { rows: [], rowCount: 0 };
      return { rows: [{ member_role: found.member_role }], rowCount: 1 };
    }

    // ۶. لغو نشست در revokeSessionInDb
    if (
      normalized.startsWith('update user_sessions') &&
      normalized.includes('set revoked_at = coalesce(revoked_at, now())')
    ) {
      const sessionId = String(params[0] || '');
      const userId = String(params[1] || '');
      const sess = state.sessions.get(sessionId);
      if (sess && sess.user_id === userId) {
        sess.revoked_at = new Date();
        return { rows: [{ id: sess.id }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // ۷. یافتن کسب‌وکار در resolveBusinessUuid
    if (
      normalized.includes('from businesses') &&
      normalized.includes('where id::text = $1 or legacy_demo_id = $1 or slug = $1')
    ) {
      const target = String(params[0] || '');
      for (const biz of state.businesses.values()) {
        if (biz.id === target || biz.slug === target) {
          return {
            rows: [
              {
                id: biz.id,
                external_id: biz.id,
                slug: biz.slug,
                name: biz.name,
                city: biz.city,
                approval_status: biz.approval_status,
              },
            ],
            rowCount: 1,
          };
        }
      }
      return { rows: [], rowCount: 0 };
    }

    // ۸. خواندن ردیف کسب‌وکار برای updateBusinessProfileInDb
    if (normalized === 'select * from businesses where id = $1') {
      const bizId = String(params[0] || '');
      const biz = state.businesses.get(bizId);
      if (!biz) return { rows: [], rowCount: 0 };
      return { rows: [biz], rowCount: 1 };
    }

    // ۹. بروزرسانی پروفایل کسب‌وکار
    if (
      normalized.startsWith('update businesses set name = $2') &&
      normalized.includes('where id = $1')
    ) {
      const bizId = String(params[0] || '');
      const biz = state.businesses.get(bizId);
      if (!biz) return { rows: [], rowCount: 0 };
      biz.name = String(params[1] || biz.name);
      return { rows: [], rowCount: 1 };
    }

    // ۱۰. یافتن دسته‌بندی برای createServiceInDb
    if (normalized.includes('select id, slug, title from categories')) {
      return {
        rows: [{ id: 'cat-1', slug: 'hair-color', title: 'مو و رنگ' }],
        rowCount: 1,
      };
    }

    // ۱۱. درج خدمت جدید در createServiceInDb
    if (normalized.startsWith('insert into services')) {
      const bizId = String(params[0] || '');
      const catSlug = String(params[2] || 'hair-color');
      const catLabel = String(params[3] || 'مو');
      const title = String(params[4] || '');
      const desc = String(params[5] || '');
      const duration = Number(params[6] || 45);
      const price = Number(params[7] || 0);
      const isPopular = Boolean(params[8]);
      const newId = `srv-created-${state.services.size + 1}`;
      state.services.set(newId, { id: newId, business_id: bizId, title });
      return {
        rows: [
          {
            external_id: newId,
            category_slug: catSlug,
            category_label: catLabel,
            title,
            description: desc,
            duration_minutes: duration,
            price_toman: price,
            is_popular: isPopular,
            is_active: true,
          },
        ],
        rowCount: 1,
      };
    }

    // ۱۲. تایید کسب‌وکار توسط ادمین در updateBusinessApprovalInDb
    if (
      normalized.startsWith('update businesses set approval_status = $2') &&
      normalized.includes('verified_badge = ($2 =')
    ) {
      const bizId = String(params[0] || '');
      const status = String(params[1] || '');
      const biz = state.businesses.get(bizId);
      if (!biz) return { rows: [], rowCount: 0 };
      biz.approval_status = status;
      return { rows: [{ id: biz.id }], rowCount: 1 };
    }

    // ۱۳. خواندن نوبت در updateAppointmentStatusInDb
    if (
      normalized.includes(
        'select id, business_id, customer_user_id, customer_phone, status from appointments'
      )
    ) {
      const aptId = String(params[0] || '');
      const apt = state.appointments.get(aptId);
      if (!apt) return { rows: [], rowCount: 0 };
      return { rows: [apt], rowCount: 1 };
    }

    // ۱۴. بروزرسانی وضعیت نوبت در updateAppointmentStatusInDb
    if (normalized.startsWith('update appointments set status = $2::varchar')) {
      const aptId = String(params[0] || '');
      const nextStatus = String(params[1] || '');
      const apt = state.appointments.get(aptId);
      if (!apt) return { rows: [], rowCount: 0 };
      apt.status = nextStatus;
      return { rows: [], rowCount: 1 };
    }

    // ۱۵. ثبت لاگ وضعیت نوبت
    if (normalized.startsWith('insert into appointment_status_logs')) {
      return { rows: [], rowCount: 1 };
    }

    // ۱۶. خواندن نوبت‌های اختصاصی مشتری در getCustomerPrivatePayloadInDb
    if (
      normalized.includes('from appointments a') &&
      normalized.includes('where a.customer_user_id = $1 or a.customer_phone = $2')
    ) {
      const userId = String(params[0] || '');
      const phone = String(params[1] || '');
      const rows = Array.from(state.appointments.values())
        .filter(
          (a) => a.customer_user_id === userId || a.customer_phone === phone
        )
        .map((a) => ({
          external_id: a.id,
          reference_code: 'BH-404111',
          business_external_id: a.business_id,
          business_slug: 'salon-alpha',
          business_name: 'سالن آلفا',
          service_external_id: 'srv-1',
          service_title_snapshot: 'کوتاهی تخصصی',
          specialist_external_id: 'spc-1',
          specialist_name_snapshot: 'متخصص آلفا',
          customer_name: 'مشتری الف',
          customer_phone_masked: '۰۹۱۲***۰۰۰۱',
          date_jalali: '۱۴۰۵/۰۸/۰۵',
          time_slot_label: '۱۱:۰۰',
          duration_minutes_snapshot: 60,
          service_price_toman_snapshot: 450000,
          status: a.status,
          notes: null,
        }));
      return { rows, rowCount: rows.length };
    }

    // ۱۷. خواندن علاقه‌مندی‌های مشتری در getCustomerPrivatePayloadInDb
    if (
      normalized.includes('from customer_favorites cf') &&
      normalized.includes('where cf.user_id = $1')
    ) {
      return {
        rows: [{ business_external_id: 'biz-a' }],
        rowCount: 1,
      };
    }

    // ۱۸. پشتیبانی از قفل و کوئری‌های bootstrapInitialPlatformAdminInDb
    if (normalized.includes('pg_advisory_xact_lock')) {
      return { rows: [], rowCount: 1 };
    }
    if (
      normalized.includes('select count(*)::int as cnt') &&
      normalized.includes('from platform_admins')
    ) {
      let activeCount = 0;
      for (const adm of state.admins.values()) {
        if (adm.is_active && adm.revoked_at === null) {
          activeCount += 1;
        }
      }
      return { rows: [{ cnt: activeCount }], rowCount: 1 };
    }
    if (normalized.startsWith('insert into users (phone, full_name')) {
      const phone = String(params[0] || '');
      const fullName = String(params[1] || 'مدیر ارشد پلتفرم');
      for (const usr of state.users.values()) {
        if (usr.phone === phone) {
          if (fullName) usr.full_name = fullName;
          return {
            rows: [
              {
                id: usr.id,
                phone: usr.phone,
                full_name: usr.full_name,
              },
            ],
            rowCount: 1,
          };
        }
      }
      const newId = `usr-boot-${state.users.size + 1}`;
      const created = {
        id: newId,
        phone,
        full_name: fullName,
        default_city: 'تهران',
        is_active: true,
      };
      state.users.set(newId, created);
      return {
        rows: [
          {
            id: created.id,
            phone: created.phone,
            full_name: created.full_name,
          },
        ],
        rowCount: 1,
      };
    }
    if (normalized.startsWith('insert into platform_admins')) {
      const userId = String(params[0] || '');
      state.admins.set(userId, { is_active: true, revoked_at: null });
      return { rows: [], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  };

  return {
    query: executeQuery,
    connect: async () => ({
      query: executeQuery,
      release: () => {},
    }),
  } as unknown as Pool;
}

function issueTestSession(
  state: MockDbState,
  params: {
    sessionId: string;
    userId: string;
    rawSecret?: string;
    expiresInMs?: number;
    revokedAt?: Date | null;
  }
): string {
  const rawSecret =
    params.rawSecret ?? crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + (params.expiresInMs ?? 3600_000));
  state.sessions.set(params.sessionId, {
    id: params.sessionId,
    user_id: params.userId,
    refresh_token_hash: hashSessionSecretPart(rawSecret),
    expires_at: expiresAt,
    revoked_at: params.revokedAt ?? null,
  });
  return signSessionToken(params.sessionId, rawSecret, TEST_SESSION_SECRET);
}

test('loadServerEnv defaults to mock mode on port 3000 when DATABASE_URL is absent', () => {
  const env = loadServerEnv({});
  assert.equal(env.port, 3000);
  assert.equal(env.dataMode, 'mock');
  assert.equal(env.databaseUrl, null);
  assert.equal(env.isDatabaseUrlValid, false);
});

test('validateDatabaseUrlFormat validates PostgreSQL URLs accurately', () => {
  assert.equal(
    validateDatabaseUrlFormat('postgresql://user:pass@localhost:5432/beautyhub'),
    true
  );
  assert.equal(
    validateDatabaseUrlFormat('postgres://user:pass@db.liara.ir:5432/beautyhub'),
    true
  );
  assert.equal(validateDatabaseUrlFormat('http://example.com'), false);
  assert.equal(validateDatabaseUrlFormat('invalid-url'), false);
});

test('GET /api/v1/health returns 200 OK in mock mode when DATABASE_URL is not set', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATABASE_URL: '',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.mode, 'mock');
    const db = body.database as Record<string, unknown>;
    assert.equal(db.configured, false);
    assert.equal(db.connected, false);
    assert.equal(db.status, 'not_configured');
  } finally {
    await srv.close();
  }
});

test('POST /api/v1/* in mock mode is blocked with 403 so no unintended DB writes occur', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATA_MODE: 'mock',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    assert.equal(res.status, 403);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.mode, 'mock');
    assert.equal(body.errorCode, 'MOCK_MODE_DB_WRITE_DISABLED');
  } finally {
    await srv.close();
  }
});

test('GET /api/v1/health in real mode with unreachable DB returns 503 and never leaks credentials or connection string', async () => {
  const secretPassword = 'SuperSecretPassword_998877!';
  const secretHost = '127.0.0.1';
  const fakeConnectionUrl = `postgresql://admin_user:${secretPassword}@${secretHost}:59999/beautyhub_prod`;

  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATA_MODE: 'real',
    DATABASE_URL: fakeConnectionUrl,
    DATABASE_SSL: 'disable',
    DB_CONNECT_TIMEOUT_MS: '500',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/health`);
    assert.equal(res.status, 503);
    const rawText = await res.text();

    assert.equal(rawText.includes(secretPassword), false);
    assert.equal(rawText.includes('admin_user'), false);
    assert.equal(rawText.includes('59999'), false);
    assert.equal(rawText.includes('beautyhub_prod'), false);

    const body = JSON.parse(rawText) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.mode, 'real');
    assert.equal(body.status, 'degraded');
    const db = body.database as Record<string, unknown>;
    assert.equal(db.configured, true);
    assert.equal(db.connected, false);
    assert.equal(db.status, 'error');
    assert.equal(db.errorCode, 'DB_CONNECTION_REFUSED');
  } finally {
    await srv.close();
  }
});

test('POST /api/v1/* in real mode when DB is disconnected returns 503 and does not fall back to mock', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATA_MODE: 'real',
    DATABASE_URL: 'postgresql://user:secret@127.0.0.1:59999/beautyhub_prod',
    DATABASE_SSL: 'disable',
    DB_CONNECT_TIMEOUT_MS: '500',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'تست' }),
    });
    assert.equal(res.status, 503);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.mode, 'real');
    assert.equal(body.errorCode, 'DB_CONNECTION_REFUSED');
  } finally {
    await srv.close();
  }
});

test('GET /api/v1/bootstrap and GET /api/v1/businesses in real mode when DB is disconnected return 503 and never silently fall back to mock data', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATA_MODE: 'real',
    DATABASE_URL: 'postgresql://user:secret@127.0.0.1:59999/beautyhub_prod',
    DATABASE_SSL: 'disable',
    DB_CONNECT_TIMEOUT_MS: '500',
  });

  try {
    const bootRes = await fetch(`${srv.baseUrl}/api/v1/bootstrap`);
    assert.equal(bootRes.status, 503);
    const bootBody = (await bootRes.json()) as Record<string, unknown>;
    assert.equal(bootBody.ok, false);
    assert.equal(bootBody.mode, 'real');
    assert.equal(bootBody.data, undefined);

    const bizRes = await fetch(`${srv.baseUrl}/api/v1/businesses`);
    assert.equal(bizRes.status, 503);
    const bizBody = (await bizRes.json()) as Record<string, unknown>;
    assert.equal(bizBody.ok, false);
    assert.equal(bizBody.mode, 'real');
    assert.equal(bizBody.items, undefined);
  } finally {
    await srv.close();
  }
});

test('Public source-code ZIP download routes (/api/v1/download-zip and /beautyhub-liara-production.zip) are removed and return 404', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
  });

  try {
    const apiZipRes = await fetch(`${srv.baseUrl}/api/v1/download-zip`);
    assert.equal(apiZipRes.status, 404);
    const apiZipBody = (await apiZipRes.json()) as Record<string, unknown>;
    assert.equal(apiZipBody.ok, false);
    assert.equal(apiZipBody.errorCode, 'API_ENDPOINT_NOT_FOUND');

    const rootZipRes = await fetch(
      `${srv.baseUrl}/beautyhub-liara-production.zip`
    );
    assert.equal(rootZipRes.status, 404);
    assert.notEqual(rootZipRes.headers.get('content-type'), 'application/zip');
  } finally {
    await srv.close();
  }
});

test('getBootstrapPayload excludes private customer/appointment/CRM/campaign data and filters businesses to APPROVED only', async () => {
  const executedSqlQueries: string[] = [];

  const fakePool = {
    connect: async () => ({
      query: async (sql: string) => {
        executedSqlQueries.push(sql);
        return { rows: [], rowCount: 0 };
      },
      release: () => {},
    }),
  } as unknown as Pool;

  const payload = await getBootstrapPayload(fakePool);
  const payloadRecord = payload as unknown as Record<string, unknown>;

  assert.equal('appointments' in payloadRecord, false);
  assert.equal('customers' in payloadRecord, false);
  assert.equal('campaigns' in payloadRecord, false);
  assert.equal('favoriteBusinessIds' in payloadRecord, false);

  assert.deepEqual(Object.keys(payloadRecord).sort(), [
    'businesses',
    'categories',
    'gallery',
    'plans',
    'reviews',
    'services',
    'specialists',
  ]);

  const combinedSql = executedSqlQueries.join('\n').toLowerCase();
  assert.equal(combinedSql.includes('from appointments'), false);
  assert.equal(combinedSql.includes('from business_customers'), false);
  assert.equal(combinedSql.includes('from marketing_campaigns'), false);
  assert.equal(combinedSql.includes('from customer_favorites'), false);
  assert.equal(combinedSql.includes("b.approval_status = 'approved'"), true);
});

test('loadServerEnv and resolveOtpHmacSecret reject missing, weak, or default secrets in production', async () => {
  assert.throws(
    () =>
      loadServerEnv({
        NODE_ENV: 'production',
      }),
    (err: unknown) =>
      err instanceof Error &&
      err.message.includes('PRODUCTION_SECURITY_CONFIG_ERROR') &&
      err.message.includes('OTP_HMAC_SECRET') &&
      err.message.includes('SESSION_SECRET')
  );

  assert.throws(
    () =>
      loadServerEnv({
        NODE_ENV: 'production',
        OTP_HMAC_SECRET: 'beautyhub-otp-hmac-key',
        SESSION_SECRET: 'a'.repeat(32),
      }),
    (err: unknown) =>
      err instanceof Error &&
      err.message.includes('PRODUCTION_SECURITY_CONFIG_ERROR') &&
      err.message.includes('OTP_HMAC_SECRET')
  );

  assert.throws(
    () =>
      loadServerEnv({
        NODE_ENV: 'production',
        OTP_HMAC_SECRET: 'short-otp-secret-key',
        SESSION_SECRET: 'short-session-secret-key',
      }),
    (err: unknown) =>
      err instanceof Error &&
      err.message.includes('PRODUCTION_SECURITY_CONFIG_ERROR')
  );

  const validProdConfig = loadServerEnv({
    NODE_ENV: 'production',
    OTP_HMAC_SECRET: 'k9f8d7s6a5g4h3j2k1l0p9o8i7u6y5t4r3e2w1q0',
    SESSION_SECRET: 'z1x2c3v4b5n6m7l8k9j0h1g2f3d4s5a6p7o8i9u0',
  });
  assert.equal(validProdConfig.nodeEnv, 'production');

  assert.throws(
    () => resolveOtpHmacSecret({ OTP_HMAC_SECRET: '' }),
    (err: unknown) =>
      err instanceof Error && err.message === 'OTP_HMAC_SECRET_NOT_CONFIGURED'
  );
  assert.throws(
    () =>
      resolveOtpHmacSecret({
        OTP_HMAC_SECRET: 'beautyhub-otp-hmac-key',
      }),
    (err: unknown) =>
      err instanceof Error && err.message === 'OTP_HMAC_SECRET_NOT_CONFIGURED'
  );

  const prevSecret = process.env.OTP_HMAC_SECRET;
  delete process.env.OTP_HMAC_SECRET;
  try {
    const fakeOtpPool = {
      connect: async () => ({
        query: async (sql: string) => {
          if (sql.includes('check_and_increment_auth_rate_limit')) {
            return {
              rows: [{ allowed: true, retry_after_sec: 0, reason_code: 'OK' }],
            };
          }
          return { rows: [] };
        },
        release: () => {},
      }),
    } as unknown as Pool;

    await assert.rejects(
      () => requestOtpInDb(fakeOtpPool, '09123456789', '127.0.0.1'),
      (err: unknown) =>
        err instanceof Error && err.message === 'OTP_HMAC_SECRET_NOT_CONFIGURED'
    );

    await assert.rejects(
      () => verifyOtpInDb(fakeOtpPool, '09123456789', '123456', '127.0.0.1', 'test'),
      (err: unknown) =>
        err instanceof Error && err.message === 'OTP_HMAC_SECRET_NOT_CONFIGURED'
    );
  } finally {
    if (prevSecret !== undefined) {
      process.env.OTP_HMAC_SECRET = prevSecret;
    }
  }
});

test('Phase 2 Security: HMAC-signed session token verification rejects tampered signatures, wrong secrets, expired sessions, and revoked sessions (401)', async () => {
  const sessionUuid = '11111111-1111-4111-8111-111111111111';
  const rawSecretHex = crypto.randomBytes(32).toString('hex');
  const token = signSessionToken(sessionUuid, rawSecretHex, TEST_SESSION_SECRET);

  const verified = verifySignedSessionToken(token, TEST_SESSION_SECRET);
  assert.notEqual(verified, null);
  assert.equal(verified?.sessionId, sessionUuid);
  assert.equal(verified?.rawSecret, rawSecretHex);

  // دستکاری امضای توکن یا استفاده از کلید دیگر باید رد شود
  const tamperedToken = `${token.slice(0, -4)}ffff`;
  assert.equal(verifySignedSessionToken(tamperedToken, TEST_SESSION_SECRET), null);
  assert.equal(
    verifySignedSessionToken(token, 'another_different_session_secret_32_chars!'),
    null
  );

  const state: MockDbState = {
    sessions: new Map(),
    users: new Map([
      [
        'user-cust-1',
        {
          id: 'user-cust-1',
          phone: '09121112233',
          full_name: 'سارا محمدی',
          default_city: 'تهران',
          is_active: true,
        },
      ],
    ]),
    admins: new Map(),
    memberships: [],
    businesses: new Map(),
    services: new Map(),
    appointments: new Map(),
  };

  const validToken = issueTestSession(state, {
    sessionId: '22222222-2222-4222-8222-222222222222',
    userId: 'user-cust-1',
    expiresInMs: 60_000,
  });
  const expiredToken = issueTestSession(state, {
    sessionId: '33333333-3333-4333-8333-333333333333',
    userId: 'user-cust-1',
    expiresInMs: -60_000,
  });

  const srv = await startEphemeralServer(
    {
      NODE_ENV: 'test',
      DATA_MODE: 'real',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub',
      SESSION_SECRET: TEST_SESSION_SECRET,
      OTP_HMAC_SECRET: TEST_OTP_SECRET,
    },
    createSecurityTestPool(state)
  );

  try {
    // ۱. نشست معتبر اطلاعات کاربر را برمی‌گرداند
    const meRes = await fetch(`${srv.baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: `bh_session=${encodeURIComponent(validToken)}` },
    });
    assert.equal(meRes.status, 200);
    const meBody = (await meRes.json()) as {
      ok: boolean;
      user: { userId: string; roles: string[] };
    };
    assert.equal(meBody.ok, true);
    assert.equal(meBody.user.userId, 'user-cust-1');
    assert.deepEqual(meBody.user.roles, ['CUSTOMER']);

    // ۲. نشست منقضی‌شده با 401 SESSION_EXPIRED رد می‌شود
    const expRes = await fetch(`${srv.baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(expRes.status, 401);
    const expBody = (await expRes.json()) as { errorCode: string };
    assert.equal(expBody.errorCode, 'SESSION_EXPIRED');

    // ۳. خروج از حساب (/auth/logout) نشست را در دیتابیس باطل می‌کند و استفاده مجدد از همان توکن 401 برمی‌گرداند
    const logoutRes = await fetch(`${srv.baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.equal(logoutRes.status, 200);

    const afterLogoutRes = await fetch(`${srv.baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert.equal(afterLogoutRes.status, 401);
    const afterLogoutBody = (await afterLogoutRes.json()) as {
      errorCode: string;
    };
    assert.equal(afterLogoutBody.errorCode, 'SESSION_REVOKED');
  } finally {
    await srv.close();
  }
});

test('Phase 2 Security: Unauthenticated requests to protected write and private read routes return 401 AUTHENTICATION_REQUIRED', async () => {
  const state: MockDbState = {
    sessions: new Map(),
    users: new Map(),
    admins: new Map(),
    memberships: [],
    businesses: new Map(),
    services: new Map(),
    appointments: new Map(),
  };

  const srv = await startEphemeralServer(
    {
      NODE_ENV: 'test',
      DATA_MODE: 'real',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub',
      SESSION_SECRET: TEST_SESSION_SECRET,
      OTP_HMAC_SECRET: TEST_OTP_SECRET,
    },
    createSecurityTestPool(state)
  );

  try {
    const protectedEndpoints: Array<{ method: string; path: string; body?: object }> = [
      { method: 'GET', path: '/api/v1/me/bootstrap' },
      { method: 'GET', path: '/api/v1/app/workspace' },
      { method: 'GET', path: '/api/v1/admin/overview' },
      { method: 'POST', path: '/api/v1/services', body: { businessId: 'biz-a', title: 'تست' } },
      { method: 'PUT', path: '/api/v1/businesses/biz-a/profile', body: { name: 'تست' } },
      { method: 'PATCH', path: '/api/v1/appointments/apt-1/status', body: { status: 'CANCELLED' } },
      { method: 'PATCH', path: '/api/v1/admin/businesses/biz-a/approval', body: { status: 'APPROVED' } },
      { method: 'POST', path: '/api/v1/customers/favorites/toggle', body: { businessId: 'biz-a' } },
    ];

    for (const ep of protectedEndpoints) {
      const res = await fetch(`${srv.baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        ...(ep.body ? { body: JSON.stringify(ep.body) } : {}),
      });
      assert.equal(
        res.status,
        401,
        `Expected 401 for unauthenticated ${ep.method} ${ep.path}, got ${res.status}`
      );
      const json = (await res.json()) as { errorCode: string };
      assert.equal(json.errorCode, 'AUTHENTICATION_REQUIRED');
    }
  } finally {
    await srv.close();
  }
});

test('Phase 2 Security: Role-based access control (403 ADMIN_ACCESS_DENIED) and Business Ownership enforcement (403 BUSINESS_ACCESS_DENIED)', async () => {
  const state: MockDbState = {
    sessions: new Map(),
    users: new Map([
      [
        'user-customer',
        {
          id: 'user-customer',
          phone: '09120000001',
          full_name: 'مشتری عادی',
          default_city: 'تهران',
          is_active: true,
        },
      ],
      [
        'user-owner-a',
        {
          id: 'user-owner-a',
          phone: '09120000002',
          full_name: 'مالک سالن الف',
          default_city: 'تهران',
          is_active: true,
        },
      ],
      [
        'user-owner-b',
        {
          id: 'user-owner-b',
          phone: '09120000003',
          full_name: 'مالک سالن ب',
          default_city: 'تهران',
          is_active: true,
        },
      ],
      [
        'user-admin',
        {
          id: 'user-admin',
          phone: '09120000009',
          full_name: 'مدیر کل پلتفرم',
          default_city: 'تهران',
          is_active: true,
        },
      ],
    ]),
    admins: new Map([
      ['user-admin', { is_active: true, revoked_at: null }],
    ]),
    memberships: [
      {
        user_id: 'user-owner-a',
        business_id: 'biz-a',
        business_slug: 'salon-alpha',
        member_role: 'OWNER',
        is_active: true,
      },
      {
        user_id: 'user-owner-b',
        business_id: 'biz-b',
        business_slug: 'salon-beta',
        member_role: 'OWNER',
        is_active: true,
      },
    ],
    businesses: new Map([
      [
        'biz-a',
        {
          id: 'biz-a',
          slug: 'salon-alpha',
          name: 'سالن آلفا',
          city: 'تهران',
          neighborhood: 'ونک',
          address: 'تهران، ونک',
          phone_display: '02188888888',
          instagram_handle: '@alpha',
          short_description: 'توضیح کوتاه آلفا',
          about_text: 'درباره آلفا',
          map_lat: 35.75,
          map_lng: 51.41,
          subscription_plan: 'plan-professional',
          subscription_status: 'ACTIVE',
          approval_status: 'PENDING_REVIEW',
        },
      ],
      [
        'biz-b',
        {
          id: 'biz-b',
          slug: 'salon-beta',
          name: 'سالن بتا',
          city: 'تهران',
          neighborhood: 'سعادت‌آباد',
          address: 'تهران، سعادت‌آباد',
          phone_display: '02177777777',
          instagram_handle: '@beta',
          short_description: 'توضیح کوتاه بتا',
          about_text: 'درباره بتا',
          map_lat: 35.78,
          map_lng: 51.37,
          subscription_plan: 'plan-professional',
          subscription_status: 'ACTIVE',
          approval_status: 'APPROVED',
        },
      ],
    ]),
    services: new Map(),
    appointments: new Map(),
  };

  const customerToken = issueTestSession(state, {
    sessionId: '44444444-4444-4444-8444-444444444441',
    userId: 'user-customer',
  });
  const ownerAToken = issueTestSession(state, {
    sessionId: '44444444-4444-4444-8444-444444444442',
    userId: 'user-owner-a',
  });
  const adminToken = issueTestSession(state, {
    sessionId: '44444444-4444-4444-8444-444444444449',
    userId: 'user-admin',
  });

  const srv = await startEphemeralServer(
    {
      NODE_ENV: 'test',
      DATA_MODE: 'real',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub',
      SESSION_SECRET: TEST_SESSION_SECRET,
      OTP_HMAC_SECRET: TEST_OTP_SECRET,
    },
    createSecurityTestPool(state)
  );

  try {
    // ۱. مشتری یا مالک کسب‌وکار اجازه دسترسی به مسیرهای /admin/* را ندارد (403)
    for (const token of [customerToken, ownerAToken]) {
      const adminRes = await fetch(
        `${srv.baseUrl}/api/v1/admin/businesses/biz-a/approval`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'APPROVED' }),
        }
      );
      assert.equal(adminRes.status, 403);
      const adminJson = (await adminRes.json()) as { errorCode: string };
      assert.equal(adminJson.errorCode, 'ADMIN_ACCESS_DENIED');
    }

    // ۲. ادمین واقعی پلتفرم مجاز به تایید کسب‌وکار است (200)
    const adminApproveRes = await fetch(
      `${srv.baseUrl}/api/v1/admin/businesses/biz-a/approval`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      }
    );
    assert.equal(adminApproveRes.status, 200);
    assert.equal(state.businesses.get('biz-a')?.approval_status, 'APPROVED');

    // ۳. مالک سالن آلفا اجازه ویرایش پروفایل یا ثبت خدمت برای سالن بتا را ندارد (403 BUSINESS_ACCESS_DENIED)
    const crossBizProfileRes = await fetch(
      `${srv.baseUrl}/api/v1/businesses/biz-b/profile`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerAToken}`,
        },
        body: JSON.stringify({ name: 'تغییر غیرمجاز سالن بتا' }),
      }
    );
    assert.equal(crossBizProfileRes.status, 403);
    const crossBizProfileJson = (await crossBizProfileRes.json()) as {
      errorCode: string;
    };
    assert.equal(crossBizProfileJson.errorCode, 'BUSINESS_ACCESS_DENIED');

    const crossBizServiceRes = await fetch(`${srv.baseUrl}/api/v1/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerAToken}`,
      },
      body: JSON.stringify({
        businessId: 'biz-b',
        title: 'خدمت غیرمجاز در سالن دیگر',
        category: 'مو',
        durationMinutes: 45,
        priceToman: 350000,
      }),
    });
    assert.equal(crossBizServiceRes.status, 403);

    // ۴. ارسال درخواست بدون businessId دیگر به اولین کسب‌وکار دیتابیس Fallback نمی‌کند (400 BUSINESS_ID_REQUIRED)
    const missingBizIdRes = await fetch(`${srv.baseUrl}/api/v1/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerAToken}`,
      },
      body: JSON.stringify({
        title: 'خدمت بدون شناسه سالن',
        category: 'مو',
        durationMinutes: 45,
        priceToman: 350000,
      }),
    });
    assert.equal(missingBizIdRes.status, 400);
    const missingBizIdJson = (await missingBizIdRes.json()) as {
      errorCode: string;
    };
    assert.equal(missingBizIdJson.errorCode, 'BUSINESS_ID_REQUIRED');

    // ۵. مالک سالن آلفا می‌تواند برای سالن خودش خدمت ثبت کند (201)
    const ownBizServiceRes = await fetch(`${srv.baseUrl}/api/v1/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerAToken}`,
      },
      body: JSON.stringify({
        businessId: 'biz-a',
        title: 'کوتاهی تخصصی آلفا',
        category: 'مو',
        durationMinutes: 45,
        priceToman: 450000,
      }),
    });
    assert.equal(ownBizServiceRes.status, 201);
  } finally {
    await srv.close();
  }
});

test('Phase 2 Security: Appointment status rules enforce customer self-cancel only and business member ownership', async () => {
  const state: MockDbState = {
    sessions: new Map(),
    users: new Map([
      [
        'user-cust-a',
        {
          id: 'user-cust-a',
          phone: '09121110001',
          full_name: 'مشتری الف',
          default_city: 'تهران',
          is_active: true,
        },
      ],
      [
        'user-cust-b',
        {
          id: 'user-cust-b',
          phone: '09121110002',
          full_name: 'مشتری ب',
          default_city: 'تهران',
          is_active: true,
        },
      ],
      [
        'user-owner-a',
        {
          id: 'user-owner-a',
          phone: '09121110003',
          full_name: 'مالک سالن الف',
          default_city: 'تهران',
          is_active: true,
        },
      ],
    ]),
    admins: new Map(),
    memberships: [
      {
        user_id: 'user-owner-a',
        business_id: 'biz-a',
        business_slug: 'salon-alpha',
        member_role: 'OWNER',
        is_active: true,
      },
    ],
    businesses: new Map([
      [
        'biz-a',
        {
          id: 'biz-a',
          slug: 'salon-alpha',
          name: 'سالن آلفا',
          city: 'تهران',
          neighborhood: 'ونک',
          address: 'تهران، ونک',
          phone_display: '02188888888',
          instagram_handle: '@alpha',
          short_description: 'توضیح کوتاه آلفا',
          about_text: 'درباره آلفا',
          map_lat: 35.75,
          map_lng: 51.41,
          subscription_plan: 'plan-professional',
          subscription_status: 'ACTIVE',
          approval_status: 'APPROVED',
        },
      ],
    ]),
    services: new Map(),
    appointments: new Map([
      [
        'apt-cust-a',
        {
          id: 'apt-cust-a',
          business_id: 'biz-a',
          customer_user_id: 'user-cust-a',
          customer_phone: '09121110001',
          status: 'CONFIRMED',
        },
      ],
      [
        'apt-cust-b',
        {
          id: 'apt-cust-b',
          business_id: 'biz-a',
          customer_user_id: 'user-cust-b',
          customer_phone: '09121110002',
          status: 'CONFIRMED',
        },
      ],
    ]),
  };

  const custAToken = issueTestSession(state, {
    sessionId: '55555555-5555-4555-8555-555555555551',
    userId: 'user-cust-a',
  });
  const ownerAToken = issueTestSession(state, {
    sessionId: '55555555-5555-4555-8555-555555555552',
    userId: 'user-owner-a',
  });

  const srv = await startEphemeralServer(
    {
      NODE_ENV: 'test',
      DATA_MODE: 'real',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub',
      SESSION_SECRET: TEST_SESSION_SECRET,
      OTP_HMAC_SECRET: TEST_OTP_SECRET,
    },
    createSecurityTestPool(state)
  );

  try {
    // ۱. مشتری الف نمی‌تواند نوبت مشتری ب را لغو کند (403 APPOINTMENT_ACCESS_DENIED)
    const cancelOtherRes = await fetch(
      `${srv.baseUrl}/api/v1/appointments/apt-cust-b/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custAToken}`,
        },
        body: JSON.stringify({ status: 'CANCELLED' }),
      }
    );
    assert.equal(cancelOtherRes.status, 403);
    const cancelOtherJson = (await cancelOtherRes.json()) as {
      errorCode: string;
    };
    assert.equal(cancelOtherJson.errorCode, 'APPOINTMENT_ACCESS_DENIED');

    // ۲. مشتری الف نمی‌تواند نوبت خودش را به COMPLETED تغییر دهد (403 CUSTOMER_CAN_ONLY_CANCEL_OWN_APPOINTMENT)
    const completeOwnRes = await fetch(
      `${srv.baseUrl}/api/v1/appointments/apt-cust-a/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custAToken}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      }
    );
    assert.equal(completeOwnRes.status, 403);
    const completeOwnJson = (await completeOwnRes.json()) as {
      errorCode: string;
    };
    assert.equal(
      completeOwnJson.errorCode,
      'CUSTOMER_CAN_ONLY_CANCEL_OWN_APPOINTMENT'
    );

    // ۳. مشتری الف می‌تواند نوبت فعال خودش را لغو کند (200)
    const cancelOwnRes = await fetch(
      `${srv.baseUrl}/api/v1/appointments/apt-cust-a/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custAToken}`,
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelledReason: 'لغو توسط مشتری',
        }),
      }
    );
    assert.equal(cancelOwnRes.status, 200);
    assert.equal(state.appointments.get('apt-cust-a')?.status, 'CANCELLED');

    // ۴. مالک سالن آلفا می‌تواند وضعیت نوبت سالن خود را به COMPLETED تغییر دهد (200)
    const ownerCompleteRes = await fetch(
      `${srv.baseUrl}/api/v1/appointments/apt-cust-b/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerAToken}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      }
    );
    assert.equal(ownerCompleteRes.status, 200);
    assert.equal(state.appointments.get('apt-cust-b')?.status, 'COMPLETED');

    // ۵. بررسی اندپوینت خصوصی مشتری (/api/v1/me/bootstrap) که فقط نوبت‌های همان مشتری را برمی‌گرداند
    const meBootstrapRes = await fetch(`${srv.baseUrl}/api/v1/me/bootstrap`, {
      headers: { Authorization: `Bearer ${custAToken}` },
    });
    assert.equal(meBootstrapRes.status, 200);
    const meBootstrapJson = (await meBootstrapRes.json()) as {
      ok: boolean;
      data: { appointments: Array<{ id: string }> };
    };
    assert.equal(meBootstrapJson.data.appointments.length, 1);
    assert.equal(meBootstrapJson.data.appointments[0].id, 'apt-cust-a');
  } finally {
    await srv.close();
  }
});

test('Booking Integrity & Real Flows: Server-side validation of approval status, specialist-service assignment, working hours, DB price/duration snapshot, conflict (409), availability, profile update, and reviews', async () => {
  const state: MockDbState = {
    sessions: new Map(),
    users: new Map([
      [
        'user-cust-1',
        {
          id: 'user-cust-1',
          phone: '09123334455',
          full_name: 'نگار رضایی',
          default_city: 'تهران',
          is_active: true,
        },
      ],
    ]),
    admins: new Map(),
    memberships: [],
    businesses: new Map([
      [
        'biz-approved',
        {
          id: 'biz-approved',
          slug: 'royal-golzar',
          name: 'سالن رویال گلزار',
          city: 'تهران',
          neighborhood: 'فرمانیه',
          address: 'تهران، فرمانیه',
          phone_display: '02122222222',
          instagram_handle: '@royal',
          short_description: 'سالن تخصصی',
          about_text: 'درباره رویال',
          map_lat: 35.79,
          map_lng: 51.46,
          subscription_plan: 'plan-professional',
          subscription_status: 'ACTIVE',
          approval_status: 'APPROVED',
        },
      ],
      [
        'biz-pending',
        {
          id: 'biz-pending',
          slug: 'pending-salon',
          name: 'سالن در انتظار تایید',
          city: 'تهران',
          neighborhood: 'ونک',
          address: 'تهران، ونک',
          phone_display: '02133333333',
          instagram_handle: null,
          short_description: 'در انتظار بررسی',
          about_text: 'درباره سالن',
          map_lat: null,
          map_lng: null,
          subscription_plan: 'plan-starter',
          subscription_status: 'ACTIVE',
          approval_status: 'PENDING_REVIEW',
        },
      ],
    ]),
    services: new Map([
      [
        'srv-haircut',
        {
          id: 'srv-haircut',
          business_id: 'biz-approved',
          title: 'کوتاهی ژورنالی',
        },
      ],
      [
        'srv-nail',
        {
          id: 'srv-nail',
          business_id: 'biz-approved',
          title: 'کاشت ناخن',
        },
      ],
    ]),
    appointments: new Map(),
  };

  const basePool = createSecurityTestPool(state);
  let simulateOverlapConflict = false;
  const activeIntervals: Array<{ startIso: string; occupiedEndIso: string }> = [];

  const bookingPool = {
    query: async (sql: string, params: unknown[] = []) => {
      return (await bookingPool.connect()).query(sql, params);
    },
    connect: async () => {
      const baseClient = await basePool.connect();
      return {
        release: () => baseClient.release(),
        query: async (sql: string, params: unknown[] = []) => {
          const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();

          // ۱. بازیابی خدمت در createAppointmentInDb و getBusinessAvailabilityInDb
          if (
            normalized.includes('from services') &&
            normalized.includes('where business_id = $1')
          ) {
            const bizId = String(params[0] || '');
            const srvId = String(params[1] || '');
            const srv = state.services.get(srvId);
            if (!srv || srv.business_id !== bizId) {
              return { rows: [], rowCount: 0 };
            }
            return {
              rows: [
                {
                  id: srv.id,
                  external_id: srv.id,
                  title: srv.title,
                  duration_minutes: 90,
                  price_toman: 850000,
                },
              ],
              rowCount: 1,
            };
          }

          // ۲. بازیابی متخصص در createAppointmentInDb و getBusinessAvailabilityInDb
          if (
            normalized.includes('from specialists') &&
            normalized.includes('where business_id = $1')
          ) {
            const bizId = String(params[0] || '');
            const spcId = String(params[1] || '');
            if (
              bizId === 'biz-approved' &&
              (spcId === 'spc-restricted' || spcId === 'spc-general')
            ) {
              return {
                rows: [
                  {
                    id: spcId,
                    external_id: spcId,
                    full_name:
                      spcId === 'spc-restricted'
                        ? 'مریم کاظمی (محدود به مو)'
                        : 'سارا احمدی',
                  },
                ],
                rowCount: 1,
              };
            }
            return { rows: [], rowCount: 0 };
          }

          // ۳. بررسی جدول specialist_services
          if (
            normalized.includes('select count(*)::int as cnt from specialist_services')
          ) {
            const spcId = String(params[0] || '');
            return {
              rows: [{ cnt: spcId === 'spc-restricted' ? 1 : 0 }],
              rowCount: 1,
            };
          }
          if (
            normalized.includes(
              'select 1 from specialist_services where specialist_id = $1 and service_id = $2'
            )
          ) {
            const spcId = String(params[0] || '');
            const srvId = String(params[1] || '');
            if (spcId === 'spc-restricted' && srvId === 'srv-haircut') {
              return { rows: [{ '?column?': 1 }], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          }

          // ۴. بررسی ساعات کاری کسب‌وکار (جمعه‌ها تعطیل، سایر روزها ۰۹:۳۰ تا ۱۹:۳۰)
          if (normalized.includes('from business_working_hours')) {
            const dayName = String(params[2] || '');
            if (dayName === 'جمعه') {
              return {
                rows: [
                  {
                    is_open: false,
                    open_str: '09:30',
                    close_str: '19:30',
                  },
                ],
                rowCount: 1,
              };
            }
            return {
              rows: [
                {
                  is_open: true,
                  open_str: '09:30',
                  close_str: '19:30',
                },
              ],
              rowCount: 1,
            };
          }

          // ۵. تنظیمات فاصله استراحت (buffer_minutes)
          if (
            normalized.includes('select buffer_minutes from business_settings')
          ) {
            return { rows: [{ buffer_minutes: 15 }], rowCount: 1 };
          }

          // ۶. درج نوبت در جدول appointments
          if (normalized.startsWith('insert into appointments')) {
            if (simulateOverlapConflict) {
              const pgErr = new Error(
                'conflicting key value violates exclusion constraint "appointments_no_overlap_per_specialist"'
              ) as Error & { code?: string };
              pgErr.code = '23P01';
              throw pgErr;
            }
            const refCode = String(params[0] || 'BH-999111');
            const dateJalali = String(params[13] || '۱۴۰۵/۰۸/۰۳');
            const timeSlot = String(params[14] || '۱۱:۰۰');
            const startsAtIso = String(params[15] || new Date().toISOString());
            const durationMins = Number(params[7] || 90);
            const bufferMins = Number(params[8] || 15);
            const occupiedEndIso = new Date(
              new Date(startsAtIso).getTime() +
                (durationMins + bufferMins) * 60 * 1000
            ).toISOString();
            activeIntervals.push({ startIso: startsAtIso, occupiedEndIso });

            return {
              rows: [
                {
                  id: 'apt-new-1',
                  external_id: 'apt-new-1',
                  reference_code: refCode,
                  date_jalali: dateJalali,
                  time_slot_label: timeSlot,
                  status: 'CONFIRMED',
                  notes: params[16] || null,
                },
              ],
              rowCount: 1,
            };
          }

          if (normalized.startsWith('insert into business_customers')) {
            return { rows: [], rowCount: 1 };
          }

          // ۷. خواندن بازه‌های اشغال‌شده برای getBusinessAvailabilityInDb
          if (
            normalized.includes(
              'select service_starts_at, occupied_until_at from appointments'
            )
          ) {
            return {
              rows: activeIntervals.map((iv) => ({
                service_starts_at: iv.startIso,
                occupied_until_at: iv.occupiedEndIso,
              })),
              rowCount: activeIntervals.length,
            };
          }

          // ۸. بروزرسانی پروفایل مشتری در updateCustomerProfileInDb
          if (
            normalized.startsWith('update users') &&
            normalized.includes('set full_name = $2')
          ) {
            const userId = String(params[0] || '');
            const usr = state.users.get(userId);
            if (usr) {
              usr.full_name = String(params[1] || usr.full_name);
              usr.default_city = String(params[2] || usr.default_city);
            }
            return { rows: [], rowCount: 1 };
          }

          // ۹. درج دیدگاه در createReviewInDb
          if (normalized.startsWith('insert into reviews')) {
            return {
              rows: [
                {
                  external_id: 'rev-new-1',
                  specialist_slug: params[2] || null,
                  author_name: params[3],
                  service_title: params[4],
                  rating: params[5],
                  date_jalali: params[6],
                  comment: params[7],
                },
              ],
              rowCount: 1,
            };
          }
          if (
            normalized.startsWith('update businesses') &&
            normalized.includes('rating_avg = coalesce')
          ) {
            return { rows: [], rowCount: 1 };
          }

          return baseClient.query(sql, params);
        },
      };
    },
  } as unknown as Pool;

  const custToken = issueTestSession(state, {
    sessionId: '66666666-6666-4666-8666-666666666661',
    userId: 'user-cust-1',
  });

  const srv = await startEphemeralServer(
    {
      NODE_ENV: 'test',
      DATA_MODE: 'real',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub',
      SESSION_SECRET: TEST_SESSION_SECRET,
      OTP_HMAC_SECRET: TEST_OTP_SECRET,
    },
    bookingPool
  );

  try {
    // ۱. جلوگیری از رزرو برای کسب‌وکار تاییدنشده (400 BUSINESS_NOT_APPROVED)
    const unapprovedRes = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        businessSlug: 'pending-salon',
        serviceId: 'srv-haircut',
        specialistId: 'spc-general',
        dateJalali: '۱۴۰۵/۰۸/۰۳',
        timeSlot: '۱۱:۰۰',
      }),
    });
    assert.equal(unapprovedRes.status, 400);
    const unapprovedBody = (await unapprovedRes.json()) as { errorCode: string };
    assert.equal(unapprovedBody.errorCode, 'BUSINESS_NOT_APPROVED');

    // ۲. جلوگیری از رزرو خدمتی که به متخصص محدودشده تخصیص نیافته است (400 SPECIALIST_NOT_ASSIGNED_TO_SERVICE)
    const unassignedRes = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        businessSlug: 'royal-golzar',
        serviceId: 'srv-nail',
        specialistId: 'spc-restricted',
        dateJalali: '۱۴۰۵/۰۸/۰۳',
        timeSlot: '۱۱:۰۰',
      }),
    });
    assert.equal(unassignedRes.status, 400);
    const unassignedBody = (await unassignedRes.json()) as { errorCode: string };
    assert.equal(unassignedBody.errorCode, 'SPECIALIST_NOT_ASSIGNED_TO_SERVICE');

    // ۳. جلوگیری از رزرو خارج از ساعت کاری (مثلاً ساعت ۱۸:۳۰ برای خدمت ۹۰ دقیقه‌ای که از ۱۹:۳۰ فراتر می‌رود -> 400 OUTSIDE_BUSINESS_WORKING_HOURS)
    const outsideHoursRes = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        businessSlug: 'royal-golzar',
        serviceId: 'srv-haircut',
        specialistId: 'spc-restricted',
        dateJalali: '۱۴۰۵/۰۸/۰۳',
        timeSlot: '۱۸:۳۰',
      }),
    });
    assert.equal(outsideHoursRes.status, 400);
    const outsideHoursBody = (await outsideHoursRes.json()) as {
      errorCode: string;
    };
    assert.equal(outsideHoursBody.errorCode, 'OUTSIDE_BUSINESS_WORKING_HOURS');

    // ۴. ثبت موفق رزرو با Snapshot قیمت (۸۵۰,۰۰۰) و مدت زمان (۹۰ دقیقه) از دیتابیس، حتی اگر کلاینت قیمت جعلی بفرستد
    const validBookingRes = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        businessSlug: 'royal-golzar',
        serviceId: 'srv-haircut',
        specialistId: 'spc-restricted',
        dateJalali: '۱۴۰۵/۰۸/۰۳',
        timeSlot: '۱۱:۰۰',
        priceToman: 1000, // تلاش برای ارسال قیمت دستکاری‌شده از سمت کلاینت
        durationMinutes: 5,
      }),
    });
    assert.equal(validBookingRes.status, 201);
    const validBookingBody = (await validBookingRes.json()) as {
      ok: boolean;
      item: { priceToman: number; durationMinutes: number; status: string };
    };
    assert.equal(validBookingBody.ok, true);
    assert.equal(validBookingBody.item.priceToman, 850000);
    assert.equal(validBookingBody.item.durationMinutes, 90);
    assert.equal(validBookingBody.item.status, 'CONFIRMED');

    // ۵. بررسی استعلام ظرفیت واقعی (GET /api/v1/businesses/royal-golzar/availability)
    // ساعت ۱۱:۰۰ که به مدت ۹۰+۱۵ دقیقه اشغال شده و ساعت ۱۸:۳۰ که از ۱۹:۳۰ فراتر می‌رود باید غیرقابل انتخاب باشند
    const availRes = await fetch(
      `${srv.baseUrl}/api/v1/businesses/royal-golzar/availability?dateJalali=${encodeURIComponent(
        '۱۴۰۵/۰۸/۰۳'
      )}&serviceId=srv-haircut&specialistId=spc-restricted`
    );
    assert.equal(availRes.status, 200);
    const availBody = (await availRes.json()) as {
      ok: boolean;
      data: {
        slots: Array<{ time: string; available: boolean; reason?: string }>;
      };
    };
    assert.equal(availBody.ok, true);
    const slot11 = availBody.data.slots.find((s) => s.time === '۱۱:۰۰');
    const slot1830 = availBody.data.slots.find((s) => s.time === '۱۸:۳۰');
    const slot1330 = availBody.data.slots.find((s) => s.time === '۱۳:۳۰');
    assert.equal(slot11?.available, false);
    assert.equal(slot11?.reason, 'رزروشده');
    assert.equal(slot1830?.available, false);
    assert.equal(slot1830?.reason, 'خارج از ساعت کاری');
    assert.equal(slot1330?.available, true);

    // ۶. شبیه‌سازی تداخل همزمان در سطح دیتابیس (کد خطای 23P01 -> HTTP 409 TIME_SLOT_CONFLICT)
    simulateOverlapConflict = true;
    const conflictRes = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        businessSlug: 'royal-golzar',
        serviceId: 'srv-haircut',
        specialistId: 'spc-restricted',
        dateJalali: '۱۴۰۵/۰۸/۰۳',
        timeSlot: '۱۱:۰۰',
      }),
    });
    assert.equal(conflictRes.status, 409);
    const conflictBody = (await conflictRes.json()) as { errorCode: string };
    assert.equal(conflictBody.errorCode, 'APPOINTMENT_OVERLAP_CONFLICT');

    // ۷. بروزرسانی واقعی پروفایل مشتری (PATCH /api/v1/me/profile)
    const profileRes = await fetch(`${srv.baseUrl}/api/v1/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        fullName: 'نگار رضایی (ویرایش‌شده)',
        defaultCity: 'شیراز',
      }),
    });
    assert.equal(profileRes.status, 200);
    const profileBody = (await profileRes.json()) as {
      ok: boolean;
      user: { fullName: string; defaultCity: string };
    };
    assert.equal(profileBody.ok, true);
    assert.equal(profileBody.user.fullName, 'نگار رضایی (ویرایش‌شده)');
    assert.equal(profileBody.user.defaultCity, 'شیراز');

    // ۸. ثبت دیدگاه واقعی مشتری برای سالن تاییدشده (POST /api/v1/reviews)
    const reviewRes = await fetch(`${srv.baseUrl}/api/v1/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custToken}`,
      },
      body: JSON.stringify({
        businessId: 'biz-approved',
        serviceTitle: 'کوتاهی ژورنالی',
        rating: 5,
        comment: 'کیفیت خدمات عالی و کاملاً حرفه‌ای بود.',
      }),
    });
    assert.equal(reviewRes.status, 201);
    const reviewBody = (await reviewRes.json()) as {
      ok: boolean;
      item: { authorName: string; rating: number; comment: string };
    };
    assert.equal(reviewBody.ok, true);
    assert.equal(reviewBody.item.authorName, 'نگار رضایی (ویرایش‌شده)');
    assert.equal(reviewBody.item.rating, 5);
  } finally {
    await srv.close();
  }
});

test('Production SMS Enforcement: POST /api/v1/auth/otp/request in production returns 503 SMS_GATEWAY_NOT_CONFIGURED and never reports OTP as sent when SMS provider is not configured', async () => {
  const state: MockDbState = {
    sessions: new Map(),
    users: new Map(),
    admins: new Map(),
    memberships: [],
    businesses: new Map(),
    services: new Map(),
    appointments: new Map(),
  };
  const pool = createSecurityTestPool(state);

  const srv = await startEphemeralServer(
    {
      NODE_ENV: 'production',
      DATA_MODE: 'real',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub',
      SESSION_SECRET: TEST_SESSION_SECRET,
      OTP_HMAC_SECRET: TEST_OTP_SECRET,
      SMS_PROVIDER: 'disabled',
    },
    pool
  );

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '09123456789' }),
    });
    assert.equal(res.status, 503);
    const body = (await res.json()) as {
      ok: boolean;
      errorCode: string;
      message: string;
    };
    assert.equal(body.ok, false);
    assert.equal(body.errorCode, 'SMS_GATEWAY_NOT_CONFIGURED');
  } finally {
    await srv.close();
  }
});

test('One-Time Initial Admin Bootstrap via CLI/DB: bootstrapInitialPlatformAdminInDb promotes the first admin in PostgreSQL and blocks any subsequent attempt with PLATFORM_ADMIN_ALREADY_BOOTSTRAPPED', async () => {
  const state: MockDbState = {
    sessions: new Map(),
    users: new Map([
      [
        'user-customer-1',
        {
          id: 'user-customer-1',
          phone: '09120000001',
          full_name: 'کاربر کاندید ادمین',
          default_city: 'تهران',
          is_active: true,
        },
      ],
    ]),
    admins: new Map(),
    memberships: [],
    businesses: new Map(),
    services: new Map(),
    appointments: new Map(),
  };
  const pool = createSecurityTestPool(state);

  // ۱. اجرای اول از طریق لایه دیتابیس/CLI باید موفق شود و نقش PLATFORM_ADMIN را ثبت کند
  const created = await bootstrapInitialPlatformAdminInDb(pool, {
    phone: '09120000001',
    fullName: 'مدیر ارشد اول',
  });
  assert.equal(created.userId, 'user-customer-1');
  assert.equal(created.phone, '09120000001');
  assert.equal(created.fullName, 'مدیر ارشد اول');

  // ۲. تلاش مجدد پس از وجود ادمین فعال باید با خطای PLATFORM_ADMIN_ALREADY_BOOTSTRAPPED رد شود
  await assert.rejects(
    async () => {
      await bootstrapInitialPlatformAdminInDb(pool, {
        phone: '09120000002',
        fullName: 'تلاش دوم غیرمجاز',
      });
    },
    (err: unknown) =>
      err instanceof Error &&
      err.message === 'PLATFORM_ADMIN_ALREADY_BOOTSTRAPPED'
  );
});

test('Admin Panel Security (/admin & /api/v1/admin/*): Blocks anonymous browser access (302 -> /login), blocks forged cookies (401/302), blocks non-admin users (403), and allows verified PLATFORM_ADMIN via HttpOnly cookie', async () => {
  const state: MockDbState = {
    sessions: new Map(),
    users: new Map([
      [
        'user-regular',
        {
          id: 'user-regular',
          phone: '09120000011',
          full_name: 'کاربر عادی',
          default_city: 'تهران',
          is_active: true,
        },
      ],
      [
        'user-real-admin',
        {
          id: 'user-real-admin',
          phone: '09120000099',
          full_name: 'مدیر کل تاییدشده',
          default_city: 'تهران',
          is_active: true,
        },
      ],
    ]),
    admins: new Map([
      ['user-real-admin', { is_active: true, revoked_at: null }],
    ]),
    memberships: [],
    businesses: new Map(),
    services: new Map(),
    appointments: new Map(),
  };

  const regularUserToken = issueTestSession(state, {
    sessionId: '55555555-5555-4555-8555-555555555511',
    userId: 'user-regular',
  });
  const adminUserToken = issueTestSession(state, {
    sessionId: '55555555-5555-4555-8555-555555555599',
    userId: 'user-real-admin',
  });

  const pool = createSecurityTestPool(state);
  const srv = await startEphemeralServer(
    {
      NODE_ENV: 'production',
      DATA_MODE: 'real',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub',
      SESSION_SECRET: TEST_SESSION_SECRET,
      OTP_HMAC_SECRET: TEST_OTP_SECRET,
      SMS_PROVIDER: 'melipayamak',
      SMS_API_KEY: 'test-api-key',
      SMS_OTP_TEMPLATE: '12345',
    },
    pool
  );

  try {
    // ۱. دسترسی ناشناس (پنجره Incognito بدون کوکی) به مسیر /admin و /admin/businesses باید 302 Redirect به /login برگرداند
    for (const adminPath of ['/admin', '/admin/businesses', '/admin/settings']) {
      const anonPageRes = await fetch(`${srv.baseUrl}${adminPath}`, {
        headers: { Accept: 'text/html' },
        redirect: 'manual',
      });
      assert.equal(anonPageRes.status, 302);
      const locationHeader = anonPageRes.headers.get('location') || '';
      assert.equal(
        locationHeader,
        `/login?redirect=${encodeURIComponent(adminPath)}`
      );
    }

    // ۲. دسترسی با کوکی دستکاری‌شده (Forged Cookie) به /admin باید کوکی را باطل کرده و 302 به /login بدهد
    const forgedCookieRes = await fetch(`${srv.baseUrl}/admin`, {
      headers: {
        Accept: 'text/html',
        Cookie: 'bh_session=v1.55555555-5555-4555-8555-555555555599.deadbeef.forged',
      },
      redirect: 'manual',
    });
    assert.equal(forgedCookieRes.status, 302);
    const setCookieHeader = forgedCookieRes.headers.get('set-cookie') || '';
    assert.equal(setCookieHeader.includes('Max-Age=0'), true);
    assert.equal(setCookieHeader.includes('HttpOnly'), true);

    // ۳. دسترسی ناشناس به تمام APIهای مدیریتی (/api/v1/admin/*) باید با 401 AUTHENTICATION_REQUIRED رد شود
    const anonApiRes = await fetch(`${srv.baseUrl}/api/v1/admin/overview`);
    assert.equal(anonApiRes.status, 401);
    const anonApiBody = (await anonApiRes.json()) as { errorCode: string };
    assert.equal(anonApiBody.errorCode, 'AUTHENTICATION_REQUIRED');

    // ۴. دسترسی کاربر احراز هویت‌شده غیر ادمین (CUSTOMER) به صفحه /admin و /admin/users باید 403 Forbidden دریافت کند
    const nonAdminPageRes = await fetch(`${srv.baseUrl}/admin`, {
      headers: {
        Accept: 'text/html',
        Cookie: `bh_session=${encodeURIComponent(regularUserToken)}`,
      },
      redirect: 'manual',
    });
    assert.equal(nonAdminPageRes.status, 403);
    const nonAdminHtml = await nonAdminPageRes.text();
    assert.equal(nonAdminHtml.includes('۴۰۳'), true);

    // ۵. دسترسی کاربر احراز هویت‌شده غیر ادمین به API مدیریتی (/api/v1/admin/overview) باید 403 ADMIN_ACCESS_DENIED دریافت کند
    const nonAdminApiRes = await fetch(`${srv.baseUrl}/api/v1/admin/overview`, {
      headers: {
        Cookie: `bh_session=${encodeURIComponent(regularUserToken)}`,
      },
    });
    assert.equal(nonAdminApiRes.status, 403);
    const nonAdminApiBody = (await nonAdminApiRes.json()) as {
      errorCode: string;
    };
    assert.equal(nonAdminApiBody.errorCode, 'ADMIN_ACCESS_DENIED');

    // ۶. دسترسی ادمین معتبر (تاییدشده در جدول platform_admins دیتابیس) با کوکی HttpOnly به /api/v1/admin/overview باید 200 OK باشد
    const validAdminApiRes = await fetch(
      `${srv.baseUrl}/api/v1/admin/overview`,
      {
        headers: {
          Cookie: `bh_session=${encodeURIComponent(adminUserToken)}`,
        },
      }
    );
    assert.equal(validAdminApiRes.status, 200);
    const validAdminApiBody = (await validAdminApiRes.json()) as {
      ok: boolean;
      mode: string;
    };
    assert.equal(validAdminApiBody.ok, true);
    assert.equal(validAdminApiBody.mode, 'real');
  } finally {
    await srv.close();
  }
});

test('MelliPayamak Adapter Diagnostics: Normalizes full console URL in SMS_API_KEY, Persian digits in SMS_OTP_TEMPLATE, validates recId & status, and classifies errors accurately', async () => {
  // ۱. بررسی نرمال‌سازی در صورتی که کل URL کنسول ملی‌پیامک در SMS_API_KEY قرار گرفته باشد یا ارقام فارسی در SMS_OTP_TEMPLATE باشد
  const cfg = resolveSmsConfig({
    NODE_ENV: 'production',
    SMS_PROVIDER: '"melipayamak"',
    SMS_API_KEY:
      '"https://console.melipayamak.com/api/send/shared/a1b2c3d4e5f6g7h8"',
    SMS_OTP_TEMPLATE: '"۱۲۳۴۵"',
  });
  assert.equal(cfg.provider, 'melipayamak');
  assert.equal(cfg.apiKey, 'a1b2c3d4e5f6g7h8');
  assert.equal(cfg.template, '12345');
  assert.equal(
    cfg.apiUrl,
    'https://console.melipayamak.com/api/send/shared/a1b2c3d4e5f6g7h8'
  );

  // ۲. بررسی دسته‌بندی خطاهای ملی‌پیامک بر اساس HTTP Status و متن status
  assert.equal(
    classifyMelipayamakFailure(404, 'Not Found', undefined),
    'SMS_INVALID_API_KEY'
  );
  assert.equal(
    classifyMelipayamakFailure(200, 'متن الگو تایید نشده است', undefined),
    'SMS_TEMPLATE_INVALID_OR_UNAPPROVED'
  );
  assert.equal(
    classifyMelipayamakFailure(
      200,
      'تعداد پارامترهای ارسالی با متن الگو همخوانی ندارد',
      undefined
    ),
    'SMS_ARGS_MISMATCH'
  );
  assert.equal(
    classifyMelipayamakFailure(200, 'اعتبار شما کافی نمی باشد', undefined),
    'SMS_INSUFFICIENT_CREDIT'
  );

  // ۳. شبیه‌سازی سرور ملی‌پیامک برای بررسی ساختار دقیق JSON ارسالی (bodyId عددی، to و args) و نیاز به recId معتبر
  let capturedBody: Record<string, unknown> | null = null;
  let mockResponseStatus = 200;
  let mockResponseJson: Record<string, unknown> = {
    recId: 889977665544,
    status: 'ارسال موفق بود',
  };

  const mockSmsServer = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += String(chunk);
    });
    req.on('end', () => {
      capturedBody = JSON.parse(raw) as Record<string, unknown>;
      res.writeHead(mockResponseStatus, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockResponseJson));
    });
  });

  await new Promise<void>((resolve) => {
    mockSmsServer.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = mockSmsServer.address();
  const smsPort = typeof addr === 'object' && addr ? addr.port : 0;
  const mockSmsEndpoint = `http://127.0.0.1:${smsPort}/api/send/shared/test-key`;

  try {
    // ۳-الف: ارسال موفق با HTTP 200 و recId معتبر
    const okResult = await sendOtpSmsViaGateway(
      '09123456789',
      '654321',
      {
        provider: 'melipayamak',
        apiKey: 'test-key',
        sender: null,
        template: '25480',
        apiUrl: mockSmsEndpoint,
      },
      'production'
    );
    assert.equal(okResult.sent, true);
    assert.equal(okResult.providerMessageId, '889977665544');
    assert.deepEqual(capturedBody, {
      bodyId: 25480,
      to: '09123456789',
      args: ['654321'],
    });

    // ۳-ب: پاسخ HTTP 200 ولی بدون recId به دلیل عدم تطابق متغیرهای الگو -> باید sent: false و SMS_ARGS_MISMATCH برگرداند
    mockResponseJson = {
      status: 'تعداد پارامترهای ارسالی با متن الگو همخوانی ندارد',
    };
    const mismatchResult = await sendOtpSmsViaGateway(
      '09123456789',
      '654321',
      {
        provider: 'melipayamak',
        apiKey: 'test-key',
        sender: null,
        template: '25480',
        apiUrl: mockSmsEndpoint,
      },
      'production'
    );
    assert.equal(mismatchResult.sent, false);
    assert.equal(mismatchResult.errorCode, 'SMS_ARGS_MISMATCH');
  } finally {
    await new Promise<void>((resolve) => mockSmsServer.close(() => resolve()));
  }
});




