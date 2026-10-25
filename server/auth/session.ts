import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import type { Pool, PoolClient } from 'pg';

export const SESSION_COOKIE_NAME = 'bh_session';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type PlatformRole = 'CUSTOMER' | 'BUSINESS_OWNER' | 'PLATFORM_ADMIN';
export type BusinessMemberRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface BusinessMembership {
  businessUuid: string;
  businessId: string;
  businessSlug: string;
  memberRole: BusinessMemberRole;
}

export interface AuthenticatedUser {
  sessionId: string;
  userId: string;
  phone: string;
  fullName: string;
  defaultCity: string | null;
  roles: PlatformRole[];
  isPlatformAdmin: boolean;
  businessMemberships: BusinessMembership[];
}

export type SessionLookupResult =
  | { status: 'ACTIVE'; user: AuthenticatedUser }
  | { status: 'NOT_FOUND' | 'REVOKED' | 'EXPIRED' | 'USER_INACTIVE' };

/**
 * هش SHA-256 توکن تصادفی برای ذخیره در ستون user_sessions.refresh_token_hash
 * هیچ‌گاه توکن خام در پایگاه داده یا لاگ ذخیره نمی‌شود.
 */
export function hashSessionSecretPart(rawSecret: string): string {
  return crypto.createHash('sha256').update(rawSecret, 'utf8').digest('hex');
}

/**
 * ساخت توکن نشست امضاشده با HMAC-SHA256 توسط SESSION_SECRET
 * فرمت: v1.<sessionId>.<rawSecret>.<hmacHex>
 */
export function signSessionToken(
  sessionId: string,
  rawSecret: string,
  sessionSecret: string
): string {
  const payload = `v1.${sessionId}.${rawSecret}`;
  const signature = crypto
    .createHmac('sha256', sessionSecret)
    .update(payload, 'utf8')
    .digest('hex');
  return `${payload}.${signature}`;
}

/**
 * اعتبارسنجی امضای HMAC توکن نشست در زمان ثابت (Constant-Time)
 */
export function verifySignedSessionToken(
  token: string,
  sessionSecret: string
): { sessionId: string; rawSecret: string; tokenHash: string } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 4) return null;

  const [version, sessionId, rawSecret, signatureHex] = parts;
  if (version !== 'v1') return null;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      sessionId
    )
  ) {
    return null;
  }
  if (!/^[0-9a-f]{64}$/i.test(rawSecret)) {
    return null;
  }
  if (!/^[0-9a-f]{64}$/i.test(signatureHex)) {
    return null;
  }

  const payload = `v1.${sessionId}.${rawSecret}`;
  const expectedSigHex = crypto
    .createHmac('sha256', sessionSecret)
    .update(payload, 'utf8')
    .digest('hex');

  const sigBuf = Buffer.from(signatureHex, 'hex');
  const expectedBuf = Buffer.from(expectedSigHex, 'hex');
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  return {
    sessionId,
    rawSecret,
    tokenHash: hashSessionSecretPart(rawSecret),
  };
}

/**
 * استخراج توکن نشست از کوکی HttpOnly (اولویت اول) یا هدر Authorization: Bearer
 */
export function extractSessionTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader === 'string' && cookieHeader.trim()) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const key = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      if (key === SESSION_COOKIE_NAME && val) {
        try {
          return decodeURIComponent(val);
        } catch {
          return val;
        }
      }
    }
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }

  return null;
}

/**
 * تنظیم کوکی امن نشست کاربری با ویژگی‌های HttpOnly، SameSite=Lax و Secure در Production
 */
export function setSessionCookie(
  res: Response,
  signedToken: string,
  isProduction: boolean,
  maxAgeSeconds = SESSION_TTL_SECONDS
): void {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(signedToken)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
  ];
  if (isProduction) {
    attributes.push('Secure');
  }
  res.setHeader('Set-Cookie', attributes.join('; '));
}

/**
 * پاک‌سازی کوکی نشست کاربری هنگام خروج یا ابطال نشست
 */
export function clearSessionCookie(res: Response, isProduction: boolean): void {
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (isProduction) {
    attributes.push('Secure');
  }
  res.setHeader('Set-Cookie', attributes.join('; '));
}

/**
 * واکشی پروفایل، نقش‌ها و عضویت‌های کسب‌وکار یک کاربر از روی دیتابیس
 */
export async function loadUserPermissionsByUserId(
  clientOrPool: Pool | PoolClient,
  userId: string,
  sessionId: string
): Promise<AuthenticatedUser | null> {
  const userRes = await clientOrPool.query(
    `
    SELECT
      u.id,
      u.phone,
      u.full_name,
      u.default_city,
      u.is_active AS user_is_active,
      pa.is_active AS admin_is_active,
      pa.revoked_at AS admin_revoked_at
    FROM users u
    LEFT JOIN platform_admins pa ON pa.user_id = u.id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (!userRes.rowCount || !userRes.rows[0]) {
    return null;
  }
  const uRow = userRes.rows[0];
  if (!uRow.user_is_active) {
    return null;
  }

  const memberRes = await clientOrPool.query(
    `
    SELECT
      bm.business_id,
      COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
      b.slug AS business_slug,
      bm.member_role
    FROM business_members bm
    JOIN businesses b ON b.id = bm.business_id
    WHERE bm.user_id = $1
      AND bm.is_active = TRUE
    ORDER BY bm.created_at ASC
    `,
    [userId]
  );

  const businessMemberships: BusinessMembership[] = memberRes.rows.map((m) => ({
    businessUuid: String(m.business_id),
    businessId: String(m.business_external_id),
    businessSlug: String(m.business_slug),
    memberRole: (m.member_role as BusinessMemberRole) || 'STAFF',
  }));

  const isPlatformAdmin =
    Boolean(uRow.admin_is_active) && uRow.admin_revoked_at === null;

  const roles: PlatformRole[] = ['CUSTOMER'];
  if (businessMemberships.length > 0) {
    roles.push('BUSINESS_OWNER');
  }
  if (isPlatformAdmin) {
    roles.push('PLATFORM_ADMIN');
  }

  return {
    sessionId,
    userId: String(uRow.id),
    phone: String(uRow.phone),
    fullName: String(uRow.full_name),
    defaultCity: uRow.default_city ? String(uRow.default_city) : null,
    roles,
    isPlatformAdmin,
    businessMemberships,
  };
}

/**
 * بررسی اعتبار نشست در دیتابیس (عدم ابطال، عدم انقضا، فعال بودن کاربر) و بارگذاری نقش‌های سمت سرور
 */
export async function resolveAuthenticatedSessionFromDb(
  pool: Pool,
  sessionId: string,
  tokenHash: string
): Promise<SessionLookupResult> {
  const sessionRes = await pool.query(
    `
    SELECT
      us.id AS session_id,
      us.user_id,
      us.expires_at,
      us.revoked_at,
      u.is_active AS user_is_active
    FROM user_sessions us
    JOIN users u ON u.id = us.user_id
    WHERE us.id = $1
      AND us.refresh_token_hash = $2
    LIMIT 1
    `,
    [sessionId, tokenHash]
  );

  if (!sessionRes.rowCount || !sessionRes.rows[0]) {
    return { status: 'NOT_FOUND' };
  }

  const row = sessionRes.rows[0];
  if (row.revoked_at !== null && row.revoked_at !== undefined) {
    return { status: 'REVOKED' };
  }

  const expiresAtMs = new Date(String(row.expires_at)).getTime();
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    return { status: 'EXPIRED' };
  }

  if (!row.user_is_active) {
    return { status: 'USER_INACTIVE' };
  }

  const user = await loadUserPermissionsByUserId(
    pool,
    String(row.user_id),
    String(row.session_id)
  );
  if (!user) {
    return { status: 'USER_INACTIVE' };
  }

  // ثبت زمان آخرین استفاده از نشست
  await pool.query(
    `UPDATE user_sessions SET last_used_at = NOW() WHERE id = $1`,
    [sessionId]
  );

  return { status: 'ACTIVE', user };
}

/**
 * ابطال یک نشست مشخص در جدول user_sessions
 */
export async function revokeSessionInDb(
  pool: Pool,
  sessionId: string,
  userId: string
): Promise<boolean> {
  const res = await pool.query(
    `
    UPDATE user_sessions
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE id = $1 AND user_id = $2
    RETURNING id
    `,
    [sessionId, userId]
  );
  return Boolean(res.rowCount && res.rowCount > 0);
}

/**
 * ابطال تمام نشست‌های فعال کاربر در جدول user_sessions
 */
export async function revokeAllUserSessionsInDb(
  pool: Pool,
  userId: string
): Promise<number> {
  const res = await pool.query(
    `
    UPDATE user_sessions
    SET revoked_at = NOW()
    WHERE user_id = $1 AND revoked_at IS NULL
    `,
    [userId]
  );
  return res.rowCount ?? 0;
}
