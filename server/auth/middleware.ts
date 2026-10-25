import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Pool } from 'pg';
import {
  loadServerEnv,
  resolveSessionSecret,
  ServerEnvConfig,
} from '../config/env';
import {
  AuthenticatedUser,
  BusinessMemberRole,
  clearSessionCookie,
  extractSessionTokenFromRequest,
  PlatformRole,
  resolveAuthenticatedSessionFromDb,
  verifySignedSessionToken,
} from './session';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export type PoolResolver = (
  res: Response
) => Promise<{ mode: 'mock' | 'real'; pool: Pool | null }>;

/**
 * میان‌افزار احراز هویت الزامی (requireAuth)
 * - هیچ شناسه کاربری، شماره تلفن یا نقش ارسالی از سمت کلاینت را بدون نشست معتبر نمی‌پذیرد.
 * - امضای توکن را با SESSION_SECRET بررسی کرده و وضعیت نشست (عدم انقضا و عدم ابطال) و نقش‌ها را از دیتابیس می‌خواند.
 */
export function createRequireAuthMiddleware(
  resolvePoolOrFail: PoolResolver,
  customEnv?: ServerEnvConfig
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(401).json({
        ok: false,
        mode: 'mock',
        errorCode: 'AUTHENTICATION_REQUIRED',
        message: 'برای دسترسی به این بخش، ورود به حساب کاربری الزامی است.',
      });
      return;
    }
    if (!pool) return;

    const config = customEnv ?? loadServerEnv();
    let sessionSecret: string;
    try {
      sessionSecret =
        config.sessionSecret ?? resolveSessionSecret(process.env);
    } catch {
      res.status(500).json({
        ok: false,
        mode: 'real',
        errorCode: 'SESSION_SECRET_NOT_CONFIGURED',
        message:
          'کلید امنیتی SESSION_SECRET در متغیرهای محیطی سرور پیکربندی نشده است.',
      });
      return;
    }

    const rawToken = extractSessionTokenFromRequest(req);
    if (!rawToken) {
      res.status(401).json({
        ok: false,
        mode: 'real',
        errorCode: 'AUTHENTICATION_REQUIRED',
        message: 'نشست کاربری یافت نشد. لطفاً ابتدا وارد حساب کاربری خود شوید.',
      });
      return;
    }

    const verifiedToken = verifySignedSessionToken(rawToken, sessionSecret);
    if (!verifiedToken) {
      clearSessionCookie(res, config.nodeEnv === 'production');
      res.status(401).json({
        ok: false,
        mode: 'real',
        errorCode: 'INVALID_SESSION_TOKEN',
        message: 'توکن نشست کاربری نامعتبر یا دستکاری‌شده است.',
      });
      return;
    }

    try {
      const lookup = await resolveAuthenticatedSessionFromDb(
        pool,
        verifiedToken.sessionId,
        verifiedToken.tokenHash
      );

      if (lookup.status === 'NOT_FOUND') {
        clearSessionCookie(res, config.nodeEnv === 'production');
        res.status(401).json({
          ok: false,
          mode: 'real',
          errorCode: 'SESSION_NOT_FOUND',
          message: 'نشست کاربری معتبر یافت نشد. لطفاً مجدداً وارد شوید.',
        });
        return;
      }

      if (lookup.status === 'REVOKED') {
        clearSessionCookie(res, config.nodeEnv === 'production');
        res.status(401).json({
          ok: false,
          mode: 'real',
          errorCode: 'SESSION_REVOKED',
          message: 'این نشست کاربری قبلاً باطل شده است. لطفاً مجدداً وارد شوید.',
        });
        return;
      }

      if (lookup.status === 'EXPIRED') {
        clearSessionCookie(res, config.nodeEnv === 'production');
        res.status(401).json({
          ok: false,
          mode: 'real',
          errorCode: 'SESSION_EXPIRED',
          message: 'مهلت زمانی نشست کاربری شما به پایان رسیده است.',
        });
        return;
      }

      if (lookup.status !== 'ACTIVE') {
        clearSessionCookie(res, config.nodeEnv === 'production');
        res.status(403).json({
          ok: false,
          mode: 'real',
          errorCode: 'USER_ACCOUNT_DISABLED',
          message: 'حساب کاربری شما غیرفعال شده است.',
        });
        return;
      }

      req.authUser = lookup.user;
      next();
    } catch {
      res.status(500).json({
        ok: false,
        mode: 'real',
        errorCode: 'SESSION_VALIDATION_ERROR',
        message: 'خطا در بررسی اعتبار نشست کاربری.',
      });
    }
  };
}

/**
 * میان‌افزار بررسی نقش کاربر در پلتفرم (requireRole)
 * نقش‌ها صرفاً از جداول دیتابیس (users, business_members, platform_admins) استخراج می‌شوند.
 */
export function requireRole(...allowedRoles: PlatformRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({
        ok: false,
        mode: 'real',
        errorCode: 'AUTHENTICATION_REQUIRED',
        message: 'ابتدا وارد حساب کاربری خود شوید.',
      });
      return;
    }

    if (
      allowedRoles.includes('PLATFORM_ADMIN') &&
      allowedRoles.length === 1 &&
      !user.isPlatformAdmin
    ) {
      res.status(403).json({
        ok: false,
        mode: 'real',
        errorCode: 'ADMIN_ACCESS_DENIED',
        message: 'دسترسی به این بخش فقط برای مدیران کلان پلتفرم مجاز است.',
      });
      return;
    }

    const hasRole = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      res.status(403).json({
        ok: false,
        mode: 'real',
        errorCode: 'INSUFFICIENT_ROLE_PERMISSION',
        message: 'سطح دسترسی حساب کاربری شما برای انجام این عملیات کافی نیست.',
      });
      return;
    }

    next();
  };
}

/**
 * بررسی عضویت و سطح مجوز کاربر در یک کسب‌وکار مشخص بر اساس جدول business_members
 */
export function hasBusinessMembership(
  user: AuthenticatedUser,
  businessIdOrUuidOrSlug: string,
  allowedMemberRoles: BusinessMemberRole[] = ['OWNER', 'MANAGER']
): boolean {
  const target = (businessIdOrUuidOrSlug || '').trim();
  if (!target) return false;

  return user.businessMemberships.some(
    (m) =>
      (m.businessUuid === target ||
        m.businessId === target ||
        m.businessSlug === target) &&
      allowedMemberRoles.includes(m.memberRole)
  );
}
