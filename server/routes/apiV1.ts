import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, Request, Response } from 'express';
import {
  createRequireAuthMiddleware,
  requireRole,
} from '../auth/middleware';
import {
  clearSessionCookie,
  revokeAllUserSessionsInDb,
  revokeSessionInDb,
  setSessionCookie,
} from '../auth/session';
import {
  hashPasswordScrypt,
  isRealPasswordHash,
  verifyPasswordAgainstHash,
} from '../auth/passwordHash';
import { loadServerEnv, ServerEnvConfig } from '../config/env';
import {
  checkDatabaseHealth,
  getOrCreatePool,
  sanitizeDatabaseError,
} from '../db/pool';
import {
  createAppointmentInDb,
  createCampaignInDb,
  createCategoryInDb,
  createGalleryItemInDb,
  createReviewInDb,
  createServiceInDb,
  createSpecialistInDb,
  deleteAdminUserInDb,
  deleteBusinessPermanentlyInDb,
  deleteGalleryItemInDb,
  deleteReviewInDb,
  ensureAppointmentFromNotifyBookingInDb,
  getAdminOverviewPayloadInDb,
  getAppointmentPaymentMetaMapInDb,
  getBootstrapPayload,
  getBusinessAvailabilityInDb,
  getBusinessWorkspacePayloadInDb,
  getCustomerPrivatePayloadInDb,
  getCustomerWalletTransactionsInDb,
  getSharedPlatformState,
  getZibalOrdersFromDb,
  onboardBusinessInDb,
  recordCustomerWalletTransactionInDb,
  replyToReviewInDb,
  reportReviewInDb,
  requestOtpInDb,
  saveAppointmentPaymentMetaInDb,
  saveServiceExtendedMetaEntry,
  saveSharedPlatformStateInDb,
  softDeleteServiceInDb,
  syncRegisteredAccountsInDb,
  toggleFavoriteBusinessInDb,
  updateAdminUserInDb,
  updateAppointmentStatusInDb,
  updateBusinessApprovalInDb,
  updateBusinessProfileInDb,
  updateBusinessWorkingHoursInDb,
  updateCategoryInDb,
  updateCustomerProfileInDb,
  updateServiceInDb,
  updateSpecialistInDb,
  upsertZibalOrderInDb,
  verifyOtpInDb,
} from '../repositories/beautyhubRepository';
import { validateCustomerWalletTxInput } from '../services/customerWalletLedger';
import {
  resolveEffectiveSmsConfig,
  sendCancellationNoticeSmsViaGateway,
  sendOtpSmsViaGateway,
  sendPatternSmsViaGateway,
} from '../services/smsGateway';
import { AppointmentStatus, ApprovalStatus } from '../../src/types';

function handleRealModeRouteError(res: Response, err: unknown): void {
  const pgCode =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code ?? '')
      : '';
  const errMsg = err instanceof Error ? err.message : String(err);

  if (pgCode === '23P01') {
    res.status(409).json({
      ok: false,
      mode: 'real',
      errorCode: 'APPOINTMENT_OVERLAP_CONFLICT',
      message:
        'این بازه زمانی (با احتساب فاصله استراحت بین دو نوبت) برای این متخصص قبلاً رزرو شده است. لطفاً ساعت یا متخصص دیگری را انتخاب کنید.',
    });
    return;
  }

  if (pgCode === '42P01') {
    res.status(503).json({
      ok: false,
      mode: 'real',
      errorCode: 'DATABASE_SCHEMA_NOT_MIGRATED',
      message:
        'جداول دیتابیس PostgreSQL هنوز ایجاد نشده‌اند. لطفاً ابتدا دستور npm run db:migrate را اجرا کنید.',
    });
    return;
  }

  if (
    errMsg === 'BUSINESS_NOT_FOUND' ||
    errMsg === 'SERVICE_NOT_FOUND' ||
    errMsg === 'SERVICE_NOT_FOUND_FOR_BUSINESS' ||
    errMsg === 'SPECIALIST_NOT_FOUND' ||
    errMsg === 'SPECIALIST_NOT_FOUND_FOR_BUSINESS' ||
    errMsg === 'APPOINTMENT_NOT_FOUND' ||
    errMsg === 'CATEGORY_NOT_FOUND' ||
    errMsg === 'GALLERY_ITEM_NOT_FOUND'
  ) {
    res.status(404).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message: 'رکورد درخواستی در پایگاه داده یافت نشد.',
    });
    return;
  }

  if (
    errMsg === 'BUSINESS_ACCESS_DENIED' ||
    errMsg === 'APPOINTMENT_ACCESS_DENIED' ||
    errMsg === 'CUSTOMER_CAN_ONLY_CANCEL_OWN_APPOINTMENT' ||
    errMsg === 'ADMIN_ACCESS_DENIED' ||
    errMsg === 'USER_ACCOUNT_DISABLED'
  ) {
    res.status(403).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        errMsg === 'CUSTOMER_CAN_ONLY_CANCEL_OWN_APPOINTMENT'
          ? 'مشتری فقط مجاز به لغو نوبت فعال متعلق به خود است.'
          : 'شما مجوز یا مالکیت لازم برای انجام این عملیات را ندارید.',
    });
    return;
  }

  if (
    errMsg === 'INVALID_IRAN_MOBILE_PHONE' ||
    errMsg === 'INVALID_OTP_CODE_FORMAT' ||
    errMsg === 'BUSINESS_ID_REQUIRED' ||
    errMsg === 'INVALID_INPUT_PAYLOAD' ||
    errMsg === 'INVALID_APPOINTMENT_STATUS' ||
    errMsg === 'BUSINESS_NOT_APPROVED' ||
    errMsg === 'OUTSIDE_BUSINESS_WORKING_HOURS' ||
    errMsg === 'SPECIALIST_NOT_ASSIGNED_TO_SERVICE' ||
    errMsg === 'APPOINTMENT_TIME_IN_PAST' ||
    errMsg === 'PROHIBITED_PROFANITY' ||
    errMsg === 'GIBBERISH' ||
    errMsg === 'TOO_SHORT'
  ) {
    res.status(400).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        errMsg === 'INVALID_IRAN_MOBILE_PHONE'
          ? 'شماره موبایل واردشده معتبر نیست (فرمت صحیح: 09123456789).'
          : errMsg === 'INVALID_OTP_CODE_FORMAT'
            ? 'کد تایید باید یک عدد ۶ رقمی معتبر باشد.'
            : errMsg === 'BUSINESS_ID_REQUIRED'
              ? 'شناسه یا اسلاگ کسب‌وکار (businessId) الزامی است.'
              : errMsg === 'BUSINESS_NOT_APPROVED'
                ? 'این کسب‌وکار هنوز تایید نشده یا غیرفعال است و امکان ثبت نوبت ندارد.'
                : errMsg === 'OUTSIDE_BUSINESS_WORKING_HOURS'
                  ? 'بازه زمانی انتخاب‌شده خارج از ساعات کاری کسب‌وکار است یا سالن در این روز تعطیل است.'
                  : errMsg === 'SPECIALIST_NOT_ASSIGNED_TO_SERVICE'
                    ? 'متخصص انتخاب‌شده ارائه این خدمت را بر عهده ندارد.'
                    : errMsg === 'APPOINTMENT_TIME_IN_PAST'
                      ? 'امکان ثبت نوبت برای تاریخ یا ساعت گذشته وجود ندارد.'
                      : errMsg === 'PROHIBITED_PROFANITY'
                        ? 'دیدگاه شما حاوی الفاظ توهین‌آمیز یا نامناسب است. ثبت انتقاد منصفانه و امتیاز منفی کاملاً آزاد است، اما لطفاً نظر خود را محترمانه بنویسید.'
                        : errMsg === 'GIBBERISH'
                          ? 'متن واردشده نامفهوم یا شامل حروف تکراری و بی‌معنی است. لطفاً تجربه واقعی خود را به صورت خوانا بنویسید.'
                          : errMsg === 'TOO_SHORT'
                            ? 'متن دیدگاه بسیار کوتاه است. لطفاً حداقل چند کلمه درباره تجربه خود بنویسید.'
                            : 'اطلاعات ارسالی نامعتبر یا ناقص است.',
    });
    return;
  }

  if (errMsg === 'PLATFORM_ADMIN_ALREADY_BOOTSTRAPPED') {
    res.status(409).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'اولین مدیر کل پلتفرم قبلاً راه‌اندازی شده است و این مسیر یک‌بارمصرف دیگر غیرفعال است.',
    });
    return;
  }

  if (
    errMsg === 'ADMIN_BOOTSTRAP_DISABLED' ||
    errMsg === 'INVALID_BOOTSTRAP_TOKEN' ||
    errMsg === 'BOOTSTRAP_ADMIN_PHONE_MISMATCH'
  ) {
    res.status(403).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        errMsg === 'ADMIN_BOOTSTRAP_DISABLED'
          ? 'راه‌اندازی اولیه مدیر سامانه در متغیرهای محیطی فعال نشده است.'
          : errMsg === 'BOOTSTRAP_ADMIN_PHONE_MISMATCH'
            ? 'شماره موبایل نشست فعلی با شماره مجاز تعریف‌شده برای مدیر اولیه مطابقت ندارد.'
            : 'توکن راه‌اندازی مدیر اولیه نامعتبر است.',
    });
    return;
  }

  if (errMsg === 'SMS_GATEWAY_NOT_CONFIGURED') {
    res.status(503).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'درگاه ارسال پیامک (SMS Gateway) در محیط Production تنظیم نشده است؛ متغیرهای SMS_PROVIDER، SMS_API_KEY و SMS_OTP_TEMPLATE را بررسی کنید.',
    });
    return;
  }

  if (errMsg === 'SMS_INVALID_API_KEY') {
    res.status(502).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'کلید وب‌سرویس پیامک (SMS_API_KEY) در پنل ملی‌پیامک نامعتبر است یا دسترسی وب‌سرویس خدماتی فعال نیست.',
    });
    return;
  }

  if (errMsg === 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED') {
    res.status(502).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'شناسه الگوی پیامک (SMS_OTP_TEMPLATE / bodyId) نامعتبر است یا الگوی خدماتی در پنل ملی‌پیامک یافت نشد.',
    });
    return;
  }

  if (errMsg === 'SMS_ARGS_MISMATCH') {
    res.status(502).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'تعداد متغیرهای الگوی پیامک در پنل ملی‌پیامک با کد ارسالی همخوانی ندارد (متن الگو باید فقط شامل یک متغیر {0} باشد).',
    });
    return;
  }

  if (errMsg === 'SMS_INSUFFICIENT_CREDIT') {
    res.status(502).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'اعتبار حساب در پنل ملی‌پیامک برای ارسال پیامک کد تایید کافی نیست.',
    });
    return;
  }

  if (errMsg === 'SMS_INVALID_RECIPIENT') {
    res.status(400).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'شماره موبایل گیرنده توسط سرویس‌دهنده پیامک نامعتبر یا مسدود اعلام شد.',
    });
    return;
  }

  if (errMsg === 'SMS_NETWORK_OR_TIMEOUT_ERROR') {
    res.status(502).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'خطای ارتباط شبکه یا Timeout در اتصال سرور به وب‌سرویس ملی‌پیامک (console.melipayamak.com) رخ داد.',
    });
    return;
  }

  if (
    errMsg === 'SMS_PROVIDER_REJECTED' ||
    errMsg === 'SMS_DELIVERY_FAILED'
  ) {
    res.status(502).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'ارسال پیامک از طریق سرویس‌دهنده پیامکی تایید نشد؛ لطفاً لاگ کنسول سرور (Timeto SMS Gateway) و تنظیمات پنل پیامک را بررسی کنید.',
    });
    return;
  }

  if (
    errMsg === 'OTP_HMAC_SECRET_NOT_CONFIGURED' ||
    errMsg === 'SESSION_SECRET_NOT_CONFIGURED'
  ) {
    res.status(500).json({
      ok: false,
      mode: 'real',
      errorCode: errMsg,
      message:
        'کلیدهای امنیتی احراز هویت در متغیرهای محیطی سرور پیکربندی نشده‌اند.',
    });
    return;
  }

  const safe = sanitizeDatabaseError(err);
  res.status(500).json({
    ok: false,
    mode: 'real',
    errorCode: safe.errorCode || 'DATABASE_OPERATION_ERROR',
    message:
      safe.safeMessage ||
      'خطا در اجرای عملیات روی پایگاه داده PostgreSQL. به داده‌های آزمایشی بازگشت داده نمی‌شود.',
  });
}

export function createApiV1Router(
  customEnv?: ServerEnvConfig,
  customPool?: import('pg').Pool
): Router {
  const router = Router();

  const resolvePoolOrFail = async (res: Response) => {
    const config = customEnv ?? loadServerEnv();
    if (config.dataMode === 'mock') {
      return { mode: 'mock' as const, pool: null };
    }

    if (customPool) {
      return { mode: 'real' as const, pool: customPool };
    }

    const health = await checkDatabaseHealth(config);
    const pool = getOrCreatePool(config);
    if (!health.connected || !pool) {
      res.status(503).json({
        ok: false,
        mode: 'real',
        errorCode: health.errorCode ?? 'REAL_MODE_DATABASE_UNAVAILABLE',
        message:
          'اتصال به دیتابیس PostgreSQL برقرار نیست؛ سامانه به صورت خاموش به داده‌های آزمایشی (Mock) برنمی‌گردد.',
      });
      return { mode: 'real' as const, pool: null };
    }

    return { mode: 'real' as const, pool };
  };

  const requireAuth = createRequireAuthMiddleware(resolvePoolOrFail, customEnv);

  const getEnvOverrides = (): Record<string, string | undefined> | undefined => {
    if (!customEnv) return undefined;
    return {
      NODE_ENV: customEnv.nodeEnv,
      OTP_HMAC_SECRET: customEnv.otpHmacSecret ?? undefined,
      SESSION_SECRET: customEnv.sessionSecret ?? undefined,
    };
  };

  const isProdMode = (): boolean => {
    const config = customEnv ?? loadServerEnv();
    return config.nodeEnv === 'production';
  };

  const userOwnsBusiness = (
    authUser: Request['authUser'],
    targetIds: Array<string | null | undefined>
  ): boolean => {
    if (!authUser) return false;
    if (authUser.isPlatformAdmin) return true;
    const cleanTargets = targetIds
      .map((x) => String(x || '').trim())
      .filter(Boolean);
    if (cleanTargets.length === 0) return false;
    return authUser.businessMemberships.some(
      (m) =>
        cleanTargets.includes(m.businessUuid) ||
        cleanTargets.includes(m.businessId) ||
        cleanTargets.includes(m.businessSlug)
    );
  };

  /**
   * ۱. دریافت داده‌های عمومی بازارچه (بدون اطلاعات خصوصی مشتریان و نوبت‌ها)
   * GET /api/v1/bootstrap
   */
  router.get('/bootstrap', async (_req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({
        ok: true,
        mode: 'mock',
        data: null,
        message: 'سرور در حالت نمایشی (mock) فعال است.',
      });
      return;
    }
    if (!pool) return;

    try {
      const data = await getBootstrapPayload(pool);
      res.status(200).json({
        ok: true,
        mode: 'real',
        data,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۱-الف. دریافت داده‌های خصوصی حساب کاربری مشتری احراز هویت‌شده
   * GET /api/v1/me/bootstrap
   */
  router.get(
    '/me/bootstrap',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const data = await getCustomerPrivatePayloadInDb(pool, req.authUser!);
        res.status(200).json({
          ok: true,
          mode: 'real',
          data,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱-الف-۲. بروزرسانی مشخصات پروفایل مشتری احراز هویت‌شده
   * PATCH /api/v1/me/profile
   */
  router.patch(
    '/me/profile',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const user = await updateCustomerProfileInDb(
          pool,
          req.authUser!,
          req.body
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          user,
          message: 'اطلاعات پروفایل کاربری در پایگاه داده بروزرسانی شد.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱-الف-۳. دریافت موجودی و تاریخچه کیف پول مشتری احرازهویت‌شده از دیتابیس PostgreSQL
   * GET /api/v1/me/wallet
   */
  router.get('/me/wallet', requireAuth, async (req: Request, res: Response) => {
    const { pool } = await resolvePoolOrFail(res);
    if (!pool) return;

    try {
      const data = await getCustomerWalletTransactionsInDb(
        pool,
        req.authUser!.phone
      );
      res.status(200).json({
        ok: true,
        mode: 'real',
        data,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۱-الف-۴. ثبت تراکنش معتبر کیف پول مشتری (شارژ، پرداخت رزرو یا استرداد بیعانه لغو نوبت) در دیتابیس
   * برداشت بانکی مستقیم فعلاً غیرفعال است و درخواست WITHDRAWAL_REQUEST با 400 رد می‌شود.
   * POST /api/v1/me/wallet/transactions
   */
  router.post(
    '/me/wallet/transactions',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      const validated = validateCustomerWalletTxInput(req.body);
      if (!validated.ok) {
        res.status(400).json({
          ok: false,
          mode: 'real',
          errorCode: validated.errorCode,
          message: validated.message,
        });
        return;
      }

      try {
        const result = await recordCustomerWalletTransactionInDb(
          pool,
          req.authUser!,
          validated.value
        );
        res.status(result.alreadyRecorded ? 200 : 201).json({
          ok: true,
          mode: 'real',
          alreadyRecorded: result.alreadyRecorded,
          data: {
            transaction: result.transaction,
            balanceToman: result.balanceToman,
            transactions: result.transactions,
          },
        });
      } catch (err) {
        if (err instanceof Error && err.message === 'INSUFFICIENT_WALLET_BALANCE') {
          res.status(400).json({
            ok: false,
            mode: 'real',
            errorCode: 'INSUFFICIENT_WALLET_BALANCE',
            message: 'موجودی کیف پول برای انجام این پرداخت کافی نیست.',
          });
          return;
        }
        if (err instanceof Error && err.message === 'FORBIDDEN_WALLET_TARGET') {
          res.status(403).json({
            ok: false,
            mode: 'real',
            errorCode: 'FORBIDDEN_WALLET_TARGET',
            message: 'شما مجاز به ثبت تراکنش برای کیف پول این کاربر نیستید.',
          });
          return;
        }
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱-ب. دریافت داده‌های اختصاصی پنل مدیریت کسب‌وکار (صرفاً برای مالک یا اعضای فعال همان کسب‌وکار)
   * GET /api/v1/app/workspace
   * GET /api/v1/app/businesses/:id/workspace
   */
  router.get(
    '/app/workspace',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const targetBusinessId =
          typeof req.query.businessId === 'string' && req.query.businessId.trim()
            ? req.query.businessId.trim()
            : undefined;
        const data = await getBusinessWorkspacePayloadInDb(
          pool,
          req.authUser!,
          targetBusinessId
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          data,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.get(
    '/app/businesses/:id/workspace',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const data = await getBusinessWorkspacePayloadInDb(
          pool,
          req.authUser!,
          req.params.id
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          data,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * گارد متمرکز امنیتی روی تمام مسیرهای مدیریتی (/api/v1/admin/*)
   * هیچ زیرمسیری در /admin بدون نشست معتبر سمت سرور (401) و تایید نقش PLATFORM_ADMIN از دیتابیس (403) قابل دسترس نیست.
   */
  router.use('/admin', requireAuth, requireRole('PLATFORM_ADMIN'));

  /**
   * ۱-ج. دریافت داده‌های کلان پنل مدیریت پلتفرم (صرفاً برای PLATFORM_ADMIN)
   * GET /api/v1/admin/overview
   */
  router.get(
    '/admin/overview',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const data = await getAdminOverviewPayloadInDb(pool, req.authUser!);
        let adminNotifications: unknown[] = [];
        try {
          const kvRes = await pool.query(
            `SELECT value_json FROM platform_kv_store WHERE key = 'admin_notifications' LIMIT 1`
          );
          if (kvRes.rowCount && Array.isArray(kvRes.rows[0]?.value_json)) {
            adminNotifications = kvRes.rows[0].value_json;
          }
        } catch {
          // ignore if table not yet populated
        }
        res.status(200).json({
          ok: true,
          mode: 'real',
          data,
          adminNotifications,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۲. فهرست سالن‌ها و مراکز زیبایی
   * GET /api/v1/businesses
   */
  router.get('/businesses', async (req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({ ok: true, mode: 'mock', items: null });
      return;
    }
    if (!pool) return;

    try {
      const payload = await getBootstrapPayload(pool);
      const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
      const category =
        typeof req.query.category === 'string' ? req.query.category.trim() : '';
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      const filtered = payload.businesses.filter((b) => {
        if (city && city !== 'ALL' && b.city !== city) return false;
        if (
          category &&
          category !== 'ALL' &&
          b.categorySlug !== category
        )
          return false;
        if (
          q &&
          !b.name.includes(q) &&
          !b.neighborhood.includes(q) &&
          !b.shortDescription.includes(q)
        )
          return false;
        return true;
      });

      res.status(200).json({
        ok: true,
        mode: 'real',
        items: filtered,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۳. جزئیات یک سالن بر اساس اسلاگ یا شناسه
   * GET /api/v1/businesses/:slug
   */
  router.get('/businesses/:slug', async (req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({ ok: true, mode: 'mock', item: null });
      return;
    }
    if (!pool) return;

    try {
      const payload = await getBootstrapPayload(pool);
      const slug = req.params.slug;
      const business = payload.businesses.find(
        (b) => b.slug === slug || b.id === slug
      );
      if (!business) {
        res.status(404).json({
          ok: false,
          mode: 'real',
          errorCode: 'BUSINESS_NOT_FOUND',
          message: 'مرکز زیبایی مورد نظر یافت نشد.',
        });
        return;
      }

      res.status(200).json({
        ok: true,
        mode: 'real',
        item: business,
        services: payload.services.filter((s) => s.businessId === business.id),
        specialists: payload.specialists.filter(
          (sp) => sp.businessId === business.id
        ),
        reviews: payload.reviews.filter((r) => r.businessId === business.id),
        gallery: payload.gallery.filter((g) => g.businessId === business.id),
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۳-الف. دریافت بازه‌های زمانی آزاد و اشغال‌شده یک کسب‌وکار در تاریخ مشخص
   * GET /api/v1/businesses/:slug/availability
   */
  router.get(
    '/businesses/:slug/availability',
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(200).json({ ok: true, mode: 'mock', data: null });
        return;
      }
      if (!pool) return;

      try {
        const dateJalali =
          typeof req.query.dateJalali === 'string'
            ? req.query.dateJalali.trim()
            : '';
        const serviceId =
          typeof req.query.serviceId === 'string' && req.query.serviceId.trim()
            ? req.query.serviceId.trim()
            : undefined;
        const specialistId =
          typeof req.query.specialistId === 'string' &&
          req.query.specialistId.trim()
            ? req.query.specialistId.trim()
            : undefined;

        const data = await getBusinessAvailabilityInDb(
          pool,
          req.params.slug,
          dateJalali,
          serviceId,
          specialistId
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          data,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۴. فهرست متخصصان
   * GET /api/v1/specialists
   */
  router.get('/specialists', async (_req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({ ok: true, mode: 'mock', items: null });
      return;
    }
    if (!pool) return;

    try {
      const payload = await getBootstrapPayload(pool);
      res.status(200).json({
        ok: true,
        mode: 'real',
        items: payload.specialists,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۵. فهرست دسته‌بندی‌ها و پلن‌ها
   * GET /api/v1/categories
   * GET /api/v1/plans
   */
  router.get('/categories', async (_req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({ ok: true, mode: 'mock', items: null });
      return;
    }
    if (!pool) return;

    try {
      const payload = await getBootstrapPayload(pool);
      res.status(200).json({
        ok: true,
        mode: 'real',
        items: payload.categories,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  router.get('/plans', async (_req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({ ok: true, mode: 'mock', items: null });
      return;
    }
    if (!pool) return;

    try {
      const payload = await getBootstrapPayload(pool);
      res.status(200).json({
        ok: true,
        mode: 'real',
        items: payload.plans,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۶. راه‌اندازی و ثبت کسب‌وکار جدید (پشتیبانی از کاربر لاگین‌شده و ثبت‌نام مستقیم سالن جدید با صدور خودکار نشست)
   * POST /api/v1/businesses/onboard
   */
  router.post(
    '/businesses/onboard',
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(201).json({
          ok: true,
          mode: 'mock',
          businessId: `biz-${Date.now()}`,
          slug: req.body?.slug || `salon-${Date.now()}`,
        });
        return;
      }
      if (!pool) return;

      try {
        const ip = String(req.ip || req.socket.remoteAddress || '127.0.0.1');
        const ua = String(req.headers['user-agent'] || 'web');
        const created = await onboardBusinessInDb(
          pool,
          req.authUser ?? null,
          req.body,
          { ipAddress: ip, userAgent: ua }
        );
        if (created.sessionToken) {
          setSessionCookie(res, created.sessionToken, isProdMode());
        }
        // ارسال پیامک اطلاع‌رسانی آنی به موبایل مدیر کل پلتفرم در صورت فعال بودن درگاه ملی‌پیامک
        const ownerPhone = (
          process.env.INITIAL_ADMIN_PHONE || '09138201042'
        ).trim();
        const config = customEnv ?? loadServerEnv();
        const effectiveSms = customEnv
          ? config.sms
          : resolveEffectiveSmsConfig(config.sms);
        if (effectiveSms.provider !== 'disabled' && effectiveSms.apiKey) {
          const salonTitle = String(
            req.body?.businessName || 'سالن جدید'
          ).slice(0, 30);
          void sendOtpSmsViaGateway(
            ownerPhone,
            `سالن جدید: ${salonTitle}`,
            effectiveSms,
            config.nodeEnv
          ).catch(() => {});
        }
        const data = await getBootstrapPayload(pool);
        res.status(201).json({
          ok: true,
          mode: 'real',
          businessId: created.businessId,
          slug: created.slug,
          sessionToken: created.sessionToken,
          expiresAt: created.expiresAt,
          user: created.user,
          data,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۷. بروزرسانی پروفایل و ساعات کاری کسب‌وکار در پنل مدیریت سالن (/app/profile, /app/hours)
   */
  router.put(
    '/businesses/:id/profile',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        await updateBusinessProfileInDb(
          pool,
          req.authUser!,
          req.params.id,
          req.body
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          message: 'مشخصات پروفایل کسب‌وکار در دیتابیس بروزرسانی شد.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.put(
    '/businesses/:id/working-hours',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const workingHours = Array.isArray(req.body?.workingHours)
          ? req.body.workingHours
          : [];
        const updated = await updateBusinessWorkingHoursInDb(
          pool,
          req.authUser!,
          req.params.id,
          workingHours
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          workingHours: updated,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۸. مدیریت خدمات سالن (/app/services) با سیاست Soft Delete و بررسی مالکیت کسب‌وکار
   */
  router.post(
    '/services',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createServiceInDb(pool, req.authUser!, req.body);
        res.status(201).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.put(
    '/services/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await updateServiceInDb(
          pool,
          req.authUser!,
          req.params.id,
          req.body
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.delete(
    '/services/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        await softDeleteServiceInDb(pool, req.authUser!, req.params.id);
        res.status(200).json({
          ok: true,
          mode: 'real',
          message: 'خدمت به صورت منطقی (Soft Delete) غیرفعال شد.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.post(
    '/services/sync-item',
    requireAuth,
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock' || !pool) {
        res.status(200).json({ ok: true, mode: 'mock' });
        return;
      }

      try {
        const action = String(req.body?.action || 'update');
        const srvId = String(req.body?.id || '').trim();
        const bizId = String(req.body?.businessId || '').trim();

        if (action === 'delete' && srvId) {
          const ownerCheck = await pool.query(
            `SELECT s.id, s.business_id, COALESCE(b.legacy_demo_id, b.id::text) AS biz_ext_id, b.slug AS biz_slug
             FROM services s JOIN businesses b ON b.id = s.business_id
             WHERE s.id::text = $1 OR s.legacy_demo_id = $1 LIMIT 1`,
            [srvId]
          );
          const row = ownerCheck.rows[0];
          if (!row) {
            res.status(404).json({ ok: false, errorCode: 'SERVICE_NOT_FOUND', message: 'خدمت یافت نشد.' });
            return;
          }
          if (!userOwnsBusiness(req.authUser, [row.business_id, row.biz_ext_id, row.biz_slug])) {
            res.status(403).json({ ok: false, errorCode: 'BUSINESS_ACCESS_DENIED', message: 'دسترسی غیرمجاز به خدمات این کسب‌وکار.' });
            return;
          }
          await pool.query(`UPDATE services SET is_active = FALSE WHERE id = $1`, [row.id]);
          res.status(200).json({ ok: true, mode: 'real' });
          return;
        }

        if (srvId) {
          const existingRes = await pool.query(
            `SELECT s.id, COALESCE(s.legacy_demo_id, s.id::text) AS ext_id, s.business_id, COALESCE(b.legacy_demo_id, b.id::text) AS biz_ext_id, b.slug AS biz_slug, s.title, s.description, s.duration_minutes, s.price_toman, s.category_slug, s.category_label, s.is_popular, s.is_active
             FROM services s JOIN businesses b ON b.id = s.business_id
             WHERE s.id::text = $1 OR s.legacy_demo_id = $1 LIMIT 1`,
            [srvId]
          );
          if (existingRes.rowCount && existingRes.rows[0]) {
            const cur = existingRes.rows[0];
            if (!userOwnsBusiness(req.authUser, [cur.business_id, cur.biz_ext_id, cur.biz_slug])) {
              res.status(403).json({ ok: false, errorCode: 'BUSINESS_ACCESS_DENIED', message: 'دسترسی غیرمجاز به خدمات این کسب‌وکار.' });
              return;
            }
            const nextTitle =
              req.body?.title !== undefined
                ? String(req.body.title).trim() || String(cur.title)
                : String(cur.title);
            const nextDesc =
              req.body?.description !== undefined
                ? String(req.body.description).trim()
                : String(cur.description || '');
            const nextDur =
              req.body?.durationMinutes !== undefined
                ? Math.max(5, Math.min(600, Number(req.body.durationMinutes) || 45))
                : Number(cur.duration_minutes) || 45;
            const nextPrice =
              req.body?.priceToman !== undefined
                ? Math.max(0, Math.min(100000000000, Number(req.body.priceToman) || 0))
                : Number(cur.price_toman) || 0;
            const nextCatSlug =
              req.body?.categorySlug !== undefined
                ? String(req.body.categorySlug)
                : String(cur.category_slug);
            const nextCatLabel =
              req.body?.category !== undefined
                ? String(req.body.category)
                : String(cur.category_label);
            const nextPopular =
              req.body?.isPopular !== undefined
                ? Boolean(req.body.isPopular)
                : Boolean(cur.is_popular);
            const nextActive =
              req.body?.isActive !== undefined
                ? Boolean(req.body.isActive)
                : Boolean(cur.is_active);

            await pool.query(
              `
              UPDATE services
              SET title = $2,
                  description = $3,
                  duration_minutes = $4,
                  price_toman = $5,
                  category_slug = $6,
                  category_label = $7,
                  is_popular = $8,
                  is_active = $9
              WHERE id = $1
              `,
              [
                cur.id,
                nextTitle,
                nextDesc,
                nextDur,
                nextPrice,
                nextCatSlug,
                nextCatLabel,
                nextPopular,
                nextActive,
              ]
            );

            const extId = String(cur.ext_id);
            const metaPatch: {
              pricingType?: 'FIXED' | 'RANGE' | 'STARTING_FROM';
              maxPriceToman?: number;
              packageIncludes?: string[];
            } = {};
            if (req.body?.pricingType !== undefined) {
              metaPatch.pricingType = req.body.pricingType;
            }
            if (req.body?.maxPriceToman !== undefined) {
              metaPatch.maxPriceToman = Number(req.body.maxPriceToman) || undefined;
            }
            if (req.body?.packageIncludes !== undefined) {
              metaPatch.packageIncludes = Array.isArray(req.body.packageIncludes)
                ? req.body.packageIncludes
                : undefined;
            }
            if (Object.keys(metaPatch).length > 0) {
              await saveServiceExtendedMetaEntry(pool, extId, metaPatch);
            }

            await pool.query(
              `
              UPDATE businesses
              SET starting_price_toman = COALESCE((
                SELECT MIN(price_toman)
                FROM services
                WHERE business_id = $1 AND is_active = TRUE AND price_toman > 0
              ), starting_price_toman)
              WHERE id = $1
              `,
              [cur.business_id]
            );

            res.status(200).json({ ok: true, mode: 'real', id: extId });
            return;
          }
        }

        if (bizId && req.body?.title) {
          const bizRes = await pool.query(
            `SELECT id, COALESCE(legacy_demo_id, id::text) AS biz_ext_id, slug FROM businesses WHERE id::text = $1 OR legacy_demo_id = $1 OR slug = $1 LIMIT 1`,
            [bizId]
          );
          if (bizRes.rowCount && bizRes.rows[0]) {
            const bUuid = bizRes.rows[0].id;
            if (!userOwnsBusiness(req.authUser, [bUuid, bizRes.rows[0].biz_ext_id, bizRes.rows[0].slug])) {
              res.status(403).json({ ok: false, errorCode: 'BUSINESS_ACCESS_DENIED', message: 'دسترسی غیرمجاز به ثبت خدمت برای این کسب‌وکار.' });
              return;
            }
            const catRes = await pool.query(
              `SELECT id, slug, title FROM categories WHERE slug = $1 OR title = $2 ORDER BY sort_order ASC LIMIT 1`,
              [String(req.body?.categorySlug || 'hair-color'), String(req.body?.category || '')]
            );
            const fallbackCatRes =
              catRes.rowCount && catRes.rows[0]
                ? catRes
                : await pool.query(`SELECT id, slug, title FROM categories ORDER BY sort_order ASC LIMIT 1`);
            if (fallbackCatRes.rowCount && fallbackCatRes.rows[0]) {
              const cat = fallbackCatRes.rows[0];
              const insRes = await pool.query(
                `
                INSERT INTO services (
                  business_id, category_id, category_slug, category_label,
                  title, description, duration_minutes, price_toman, is_popular, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
                RETURNING COALESCE(legacy_demo_id, id::text) AS ext_id
                `,
                [
                  bUuid,
                  cat.id,
                  String(req.body?.categorySlug || cat.slug),
                  String(req.body?.category || cat.title),
                  String(req.body.title).trim(),
                  String(req.body?.description || '').trim(),
                  Math.max(5, Math.min(600, Number(req.body?.durationMinutes) || 45)),
                  Math.max(0, Math.min(100000000000, Number(req.body?.priceToman) || 0)),
                  Boolean(req.body?.isPopular),
                ]
              );
              const createdExtId = String(insRes.rows[0]?.ext_id || '');
              if (createdExtId) {
                await saveServiceExtendedMetaEntry(pool, createdExtId, {
                  pricingType: req.body?.pricingType || 'FIXED',
                  maxPriceToman:
                    req.body?.pricingType === 'RANGE' && req.body?.maxPriceToman
                      ? Number(req.body.maxPriceToman)
                      : undefined,
                  packageIncludes: Array.isArray(req.body?.packageIncludes)
                    ? req.body.packageIncludes
                    : undefined,
                });
              }
              await pool.query(
                `
                UPDATE businesses
                SET starting_price_toman = COALESCE((
                  SELECT MIN(price_toman)
                  FROM services
                  WHERE business_id = $1 AND is_active = TRUE AND price_toman > 0
                ), starting_price_toman)
                WHERE id = $1
                `,
                [bUuid]
              );
              res.status(200).json({ ok: true, mode: 'real', id: createdExtId });
              return;
            }
          }
        }

        res.status(200).json({ ok: true });
      } catch {
        res.status(200).json({ ok: false });
      }
    }
  );

  /**
   * ۹. مدیریت متخصصان و پرسنل (/app/staff) با بررسی مالکیت کسب‌وکار
   */
  router.post(
    '/specialists',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createSpecialistInDb(pool, req.authUser!, req.body);
        res.status(201).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.patch(
    '/specialists/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await updateSpecialistInDb(
          pool,
          req.authUser!,
          req.params.id,
          req.body
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  const recentBookingDispatchMap = new Map<string, number>();

  const normalizeIranMobile = (raw: unknown): string => {
    const digits = String(raw || '')
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('9')) {
      return `0${digits}`;
    }
    if (digits.length === 12 && digits.startsWith('989')) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  };

  const dispatchBookingSmsAndWalletCredit = async (params: {
    businessSlug?: string;
    businessId?: string;
    businessName?: string;
    ownerPhone?: string;
    customerName?: string;
    customerPhone?: string;
    serviceId?: string;
    serviceTitle?: string;
    specialistId?: string;
    priceToman?: number;
    durationMinutes?: number;
    dateJalali?: string;
    timeSlot?: string;
    depositPaidToman?: number;
    paymentMethod?: 'GATEWAY' | 'WALLET';
    paymentTrackingCode?: string;
    zibalTrackId?: string;
    referenceCode?: string;
    dedupKey?: string;
  }): Promise<{ ownerSmsSent: boolean; customerSmsSent: boolean }> => {
    const cleanCustPhone = normalizeIranMobile(params.customerPhone);
    const slugOrId = String(
      params.businessSlug || params.businessId || ''
    ).trim();
    const dateStr = String(params.dateJalali || '').trim();
    const timeStr = String(params.timeSlot || '').trim();
    const dedupKey =
      params.dedupKey || `${slugOrId}|${cleanCustPhone}|${dateStr}|${timeStr}`;

    const now = Date.now();
    for (const [k, ts] of recentBookingDispatchMap.entries()) {
      if (now - ts > 90_000) {
        recentBookingDispatchMap.delete(k);
      }
    }
    if (dedupKey && recentBookingDispatchMap.has(dedupKey)) {
      return { ownerSmsSent: true, customerSmsSent: false };
    }
    if (dedupKey) {
      recentBookingDispatchMap.set(dedupKey, now);
    }

    let resolvedOwnerPhone = normalizeIranMobile(params.ownerPhone);
    let resolvedBizName = String(params.businessName || 'سالن زیبایی').trim();

    try {
      const config = customEnv ?? loadServerEnv();
      const dbPool =
        customPool ??
        (config.dataMode === 'real' ? getOrCreatePool(config) : null);
      if (dbPool && (slugOrId || params.businessName || params.ownerPhone)) {
        await ensureAppointmentFromNotifyBookingInDb(dbPool, {
          businessSlug: params.businessSlug,
          businessId: params.businessId,
          businessName: params.businessName,
          ownerPhone: params.ownerPhone,
          customerName: params.customerName,
          customerPhone: cleanCustPhone || params.customerPhone,
          serviceId: params.serviceId,
          serviceTitle: params.serviceTitle,
          specialistId: params.specialistId,
          priceToman: params.priceToman,
          durationMinutes: params.durationMinutes,
          dateJalali: dateStr,
          timeSlot: timeStr,
          depositPaidToman: params.depositPaidToman,
          paymentMethod: params.paymentMethod,
          paymentTrackingCode: params.paymentTrackingCode,
          zibalTrackId: params.zibalTrackId,
          referenceCode: params.referenceCode,
        });

        const bizNameParam = String(params.businessName || '').trim();
        const bizRes = await dbPool.query(
          `
          SELECT
            b.id,
            b.name,
            b.slug,
            b.phone_display,
            u.phone AS owner_user_phone,
            bme.extra_json
          FROM businesses b
          LEFT JOIN users u ON u.id = b.owner_user_id
          LEFT JOIN business_meta_ext bme ON bme.business_id = b.id
          WHERE ($1 <> '' AND (b.slug = $1 OR b.id::text = $1 OR b.legacy_demo_id = $1))
             OR ($2 <> '' AND (b.name = $2 OR b.name ILIKE '%' || $2 || '%'))
          ORDER BY
            CASE
              WHEN $1 <> '' AND (b.slug = $1 OR b.id::text = $1 OR b.legacy_demo_id = $1) THEN 0
              WHEN $2 <> '' AND b.name = $2 THEN 1
              ELSE 2
            END ASC
          LIMIT 1
          `,
          [slugOrId, bizNameParam]
        );
        const row = bizRes.rows[0];
        const extra =
          row?.extra_json && typeof row.extra_json === 'object'
            ? { ...(row.extra_json as Record<string, unknown>) }
            : {};

        if (row?.name) {
          resolvedBizName = String(row.name);
        }

        const dbOwnerCandidate =
          normalizeIranMobile(extra.ownerPhone) ||
          normalizeIranMobile(row?.owner_user_phone) ||
          normalizeIranMobile(row?.phone_display);
        if (/^09\d{9}$/.test(dbOwnerCandidate)) {
          resolvedOwnerPhone = dbOwnerCandidate;
        }

        if (!/^09\d{9}$/.test(resolvedOwnerPhone)) {
          const kvRes = await dbPool
            .query(
              `SELECT value_json FROM platform_kv_store WHERE key = 'registered_accounts_registry' LIMIT 1`
            )
            .catch(() => ({ rows: [] as Array<{ value_json?: unknown }> }));
          const accountsArr = Array.isArray(kvRes.rows[0]?.value_json)
            ? (kvRes.rows[0].value_json as Array<Record<string, unknown>>)
            : [];
          const matchedAcc = accountsArr.find((acc) => {
            const accBizId = String(acc.businessId || '').trim();
            const accBizSlug = String(acc.businessSlug || '').trim();
            const accSalonName = String(acc.salonName || '').trim();
            return (
              (slugOrId && (accBizId === slugOrId || accBizSlug === slugOrId)) ||
              (row?.id && accBizId === String(row.id)) ||
              (resolvedBizName &&
                accSalonName &&
                (accSalonName === resolvedBizName ||
                  accSalonName.includes(resolvedBizName) ||
                  resolvedBizName.includes(accSalonName)))
            );
          });
          const regPhone = normalizeIranMobile(matchedAcc?.phone);
          if (/^09\d{9}$/.test(regPhone)) {
            resolvedOwnerPhone = regPhone;
          }
        }
      }
    } catch {
      // خطای دیتابیس مانع ارسال پیامک نشود
    }

    let ownerSmsSent = false;
    const customerSmsSent = false;

    try {
      const config = customEnv ?? loadServerEnv();
      const effectiveSms = customEnv
        ? config.sms
        : resolveEffectiveSmsConfig(config.sms);

      if (effectiveSms.provider !== 'disabled' && effectiveSms.apiKey) {
        const ownerPatternId =
          effectiveSms.bookingOwnerTemplate ||
          process.env.SMS_BOOKING_OWNER_TEMPLATE ||
          undefined;

        const custLabel = String(params.customerName || 'مشتری').trim();
        const srvLabel = String(params.serviceTitle || 'خدمات زیبایی').trim();

        // ۱. در لحظه ثبت اولیه نوبت، پیامک اطلاع‌رسانی فقط برای صاحب کسب‌وکار / سالن‌دار ارسال می‌شود.
        // پیامک تایید مشتری صرفاً یک‌بار پس از تایید نوبت توسط صاحب کسب‌وکار ارسال خواهد شد.
        if (/^09\d{9}$/.test(resolvedOwnerPhone)) {
          const ownerDelivery = await sendPatternSmsViaGateway({
            phone: resolvedOwnerPhone,
            args: [custLabel, srvLabel, dateStr, timeStr],
            fallbackSingleArg: `نوبت جدید ${custLabel} (${srvLabel}) در تاریخ ${dateStr} ساعت ${timeStr}`,
            customTemplateId: ownerPatternId,
            config: effectiveSms,
            nodeEnv: config.nodeEnv,
          }).catch(() => ({ sent: false }));
          ownerSmsSent = Boolean(ownerDelivery.sent);
        }
      }
    } catch {
      // خطای ارسال پیامک جانبی مانع ثبت نوبت نشود
    }

    return { ownerSmsSent, customerSmsSent };
  };

  const recentStatusSmsDispatchMap = new Map<string, number>();

  /**
   * ارسال پیامک نتیجه بررسی نوبت (تایید یا رد/لغو توسط صاحب سالن) به شماره موبایل مشتری
   */
  const dispatchCustomerAppointmentStatusSms = async (params: {
    appointmentId?: string;
    status: AppointmentStatus | string;
    customerName?: string;
    customerPhone?: string;
    businessName?: string;
    serviceTitle?: string;
    dateJalali?: string;
    timeSlot?: string;
  }): Promise<{ customerSmsSent: boolean }> => {
    const normalizedStatus = String(params.status || '').toUpperCase();
    if (normalizedStatus !== 'CONFIRMED' && normalizedStatus !== 'CANCELLED') {
      return { customerSmsSent: false };
    }

    let custPhone = normalizeIranMobile(params.customerPhone);
    let custName = String(params.customerName || 'مراجع عزیز').trim();
    let bizName = String(params.businessName || 'سالن زیبایی').trim();
    let dateStr = String(params.dateJalali || '').trim();
    let timeStr = String(params.timeSlot || '').trim();

    try {
      const config = customEnv ?? loadServerEnv();
      const dbPool =
        customPool ??
        (config.dataMode === 'real' ? getOrCreatePool(config) : null);
      if (dbPool && params.appointmentId && (!custPhone || !dateStr)) {
        const aptRes = await dbPool.query(
          `
          SELECT a.customer_name, a.customer_phone, a.date_jalali, a.time_slot_label, b.name AS business_name
          FROM appointments a
          LEFT JOIN businesses b ON b.id = a.business_id
          WHERE a.id::text = $1 OR a.legacy_demo_id = $1 OR a.reference_code = $1
          LIMIT 1
          `,
          [params.appointmentId]
        );
        const aptRow = aptRes.rows[0];
        if (aptRow) {
          custPhone = custPhone || normalizeIranMobile(aptRow.customer_phone);
          custName = String(aptRow.customer_name || custName).trim();
          bizName = String(aptRow.business_name || bizName).trim();
          dateStr = String(aptRow.date_jalali || dateStr).trim();
          timeStr = String(aptRow.time_slot_label || timeStr).trim();
        }
      }
    } catch {
      // ignore db lookup failure
    }

    if (!/^09\d{9}$/.test(custPhone)) {
      return { customerSmsSent: false };
    }

    const statusDedupKey = `${custPhone}|${bizName}|${dateStr}|${timeStr}|${normalizedStatus}`;
    const now = Date.now();
    for (const [k, ts] of recentStatusSmsDispatchMap.entries()) {
      if (now - ts > 90_000) {
        recentStatusSmsDispatchMap.delete(k);
      }
    }
    if (recentStatusSmsDispatchMap.has(statusDedupKey)) {
      return { customerSmsSent: true };
    }
    recentStatusSmsDispatchMap.set(statusDedupKey, now);

    try {
      const config = customEnv ?? loadServerEnv();
      const effectiveSms = customEnv
        ? config.sms
        : resolveEffectiveSmsConfig(config.sms);
      if (effectiveSms.provider !== 'disabled' && effectiveSms.apiKey) {
        if (normalizedStatus === 'CANCELLED') {
          const cancelPatternId =
            effectiveSms.bookingCancelTemplate ||
            process.env.SMS_BOOKING_CANCEL_TEMPLATE ||
            undefined;
          const cancelMessageText = `${custName || 'مراجع عزیز'} عزیز، نوبت شما در ${bizName} برای تاریخ ${dateStr} ساعت ${timeStr} لغو شد. در صورت پرداخت بیعانه، مبلغ به کیف پول شما بازگشت داده شد.`;
          const cancelDelivery = await sendCancellationNoticeSmsViaGateway({
            phone: custPhone,
            args: [
              custName || 'مراجع عزیز',
              bizName,
              dateStr,
              timeStr,
            ],
            messageText: cancelMessageText,
            cancelTemplateId: cancelPatternId,
            config: effectiveSms,
            nodeEnv: config.nodeEnv,
          }).catch(() => ({ sent: false }));
          return { customerSmsSent: Boolean(cancelDelivery.sent) };
        }

        const customerPatternId =
          effectiveSms.bookingCustomerTemplate ||
          process.env.SMS_BOOKING_CUSTOMER_TEMPLATE ||
          undefined;
        const delivery = await sendPatternSmsViaGateway({
          phone: custPhone,
          args: [
            custName || 'مراجع عزیز',
            `${bizName} (تایید نهایی شد)`,
            dateStr,
            timeStr,
          ],
          fallbackSingleArg: `نوبت شما در ${bizName} مورخ ${dateStr} ساعت ${timeStr} تایید شد`,
          customTemplateId: customerPatternId,
          config: effectiveSms,
          nodeEnv: config.nodeEnv,
        }).catch(() => ({ sent: false }));
        return { customerSmsSent: Boolean(delivery.sent) };
      }
    } catch {
      // ignore
    }

    return { customerSmsSent: false };
  };

  /**
   * ۱۰. ثبت نوبت جدید و تغییر وضعیت نوبت (/booking/*, /me/appointments, /app/appointments)
   */
  router.post(
    '/appointments/notify-booking',
    async (req: Request, res: Response) => {
      try {
        const result = await dispatchBookingSmsAndWalletCredit({
          businessSlug: req.body?.businessSlug,
          businessId: req.body?.businessId,
          businessName: req.body?.businessName,
          ownerPhone: req.body?.ownerPhone,
          customerName: req.body?.customerName,
          customerPhone: req.body?.customerPhone || req.authUser?.phone,
          serviceTitle: req.body?.serviceTitle,
          priceToman: Number(req.body?.priceToman) || 0,
          durationMinutes: Number(req.body?.durationMinutes) || 0,
          dateJalali: req.body?.dateJalali,
          timeSlot: req.body?.timeSlot,
          depositPaidToman: Number(req.body?.depositPaidToman) || 0,
          referenceCode: req.body?.referenceCode,
        });
        res.status(200).json({
          ok: true,
          ...result,
        });
      } catch {
        res.status(200).json({
          ok: true,
          ownerSmsSent: false,
          customerSmsSent: false,
        });
      }
    }
  );

  router.post(
    '/appointments/notify-status',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const aptId = String(req.body?.appointmentId || '').trim();
        const nextStatus = String(req.body?.status || '').trim();
        const authUser = req.authUser!;
        if (
          aptId &&
          (nextStatus === 'PENDING' ||
            nextStatus === 'CONFIRMED' ||
            nextStatus === 'COMPLETED' ||
            nextStatus === 'CANCELLED')
        ) {
          try {
            const config = customEnv ?? loadServerEnv();
            const dbPool =
              customPool ??
              (config.dataMode === 'real' ? getOrCreatePool(config) : null);
            if (dbPool) {
              await updateAppointmentStatusInDb(
                dbPool,
                authUser,
                aptId,
                nextStatus as AppointmentStatus
              );
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : '';
            if (
              errMsg === 'APPOINTMENT_ACCESS_DENIED' ||
              errMsg === 'BUSINESS_ACCESS_DENIED' ||
              errMsg === 'CUSTOMER_CAN_ONLY_CANCEL_OWN_APPOINTMENT'
            ) {
              res.status(403).json({
                ok: false,
                errorCode: errMsg,
                message: 'مجوز تغییر وضعیت این نوبت را ندارید.',
              });
              return;
            }
          }
        } else if (!authUser.isPlatformAdmin && authUser.businessMemberships.length === 0) {
          // اگر بدون appointmentId فقط برای ارسال پیامک وضعیت فراخوانی شده، فقط مدیر کسب‌وکار یا مدیر کل مجاز است
          res.status(403).json({
            ok: false,
            errorCode: 'BUSINESS_ACCESS_DENIED',
            message: 'مجوز ارسال پیامک وضعیت نوبت را ندارید.',
          });
          return;
        }

        const result = await dispatchCustomerAppointmentStatusSms({
          appointmentId: req.body?.appointmentId,
          status: req.body?.status,
          customerName: req.body?.customerName,
          customerPhone: req.body?.customerPhone,
          businessName: req.body?.businessName,
          serviceTitle: req.body?.serviceTitle,
          dateJalali: req.body?.dateJalali,
          timeSlot: req.body?.timeSlot,
        });
        res.status(200).json({
          ok: true,
          ...result,
        });
      } catch {
        res.status(200).json({
          ok: true,
          customerSmsSent: false,
        });
      }
    }
  );

  router.post(
    '/appointments',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createAppointmentInDb(pool, req.authUser!, req.body);

        void dispatchBookingSmsAndWalletCredit({
          businessSlug: item.businessSlug || req.body?.businessSlug,
          businessId: item.businessId || req.body?.businessId,
          businessName: item.businessName || req.body?.businessName,
          ownerPhone: req.body?.ownerPhone,
          customerName: item.customerName || req.body?.customerName,
          customerPhone: req.body?.customerPhone || req.authUser?.phone,
          serviceTitle: item.serviceTitle || req.body?.serviceTitle,
          priceToman: item.priceToman || Number(req.body?.priceToman) || 0,
          durationMinutes:
            item.durationMinutes || Number(req.body?.durationMinutes) || 0,
          dateJalali: item.dateJalali,
          timeSlot: item.timeSlot,
          depositPaidToman: Number(req.body?.depositPaidToman) || 0,
          referenceCode: item.referenceCode,
        });

        res.status(201).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.patch(
    '/appointments/:id/status',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const status = req.body?.status as AppointmentStatus;
        const cancelledReason =
          typeof req.body?.cancelledReason === 'string'
            ? req.body.cancelledReason
            : undefined;
        await updateAppointmentStatusInDb(
          pool,
          req.authUser!,
          req.params.id,
          status,
          cancelledReason
        );

        // ارسال پیامک اطلاع‌رسانی تایید یا رد/لغو نوبت به مشتری صرفاً پس از تعیین وضعیت توسط صاحب سالن
        if (status === 'CONFIRMED' || status === 'CANCELLED') {
          void dispatchCustomerAppointmentStatusSms({
            appointmentId: req.params.id,
            status,
            customerName: req.body?.customerName,
            customerPhone: req.body?.customerPhone,
            businessName: req.body?.businessName,
            serviceTitle: req.body?.serviceTitle,
            dateJalali: req.body?.dateJalali,
            timeSlot: req.body?.timeSlot,
          });
        }

        res.status(200).json({
          ok: true,
          mode: 'real',
          status,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۰-الف. ارسال پیامک یادآور خودکار قبل از نوبت (۲۴ ساعت و ۳ ساعت مانده به مراجعه) با پترن SMS_REMINDER_TEMPLATE
   */
  router.post(
    '/appointments/send-reminders',
    requireAuth,
    async (req: Request, res: Response) => {
      if (
        !req.authUser!.isPlatformAdmin &&
        req.authUser!.businessMemberships.length === 0
      ) {
        res.status(403).json({
          ok: false,
          mode: 'real',
          errorCode: 'BUSINESS_ACCESS_DENIED',
          message: 'فقط صاحبان کسب‌وکار یا مدیر سامانه مجاز به ارسال یادآور نوبت هستند.',
        });
        return;
      }
      try {
        const config = customEnv ?? loadServerEnv();
        const effectiveSms = customEnv
          ? config.sms
          : resolveEffectiveSmsConfig(config.sms);
        const items: Array<{
          phone: string;
          customerName: string;
          businessName: string;
          dateJalali: string;
          timeSlot: string;
        }> = Array.isArray(req.body?.items) ? req.body.items : [];

        let sentCount = 0;
        for (const item of items) {
          const cleanPhone = String(item.phone || '')
            .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
            .replace(/\D/g, '');
          if (!/^09\d{9}$/.test(cleanPhone)) continue;
          if (effectiveSms.provider !== 'disabled' && effectiveSms.apiKey) {
            const delivery = await sendPatternSmsViaGateway({
              phone: cleanPhone,
              args: [
                item.customerName || 'مراجع عزیز',
                item.businessName || 'سالن زیبایی',
                item.dateJalali || 'فردا',
                item.timeSlot || '۱۰:۰۰',
              ],
              fallbackSingleArg: `یادآوری نوبت ${item.dateJalali} ساعت ${item.timeSlot}`,
              customTemplateId: process.env.SMS_REMINDER_TEMPLATE,
              config: effectiveSms,
              nodeEnv: config.nodeEnv,
            });
            if (delivery.sent) sentCount += 1;
          } else {
            sentCount += 1;
          }
        }

        res.status(200).json({
          ok: true,
          sentCount,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۱. گالری نمونه کارها و کمپین‌های بازاریابی (/app/gallery, /app/marketing)
   */
  router.post(
    '/gallery',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createGalleryItemInDb(pool, req.authUser!, req.body);
        res.status(201).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.delete(
    '/gallery/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        await deleteGalleryItemInDb(pool, req.authUser!, req.params.id);
        res.status(200).json({
          ok: true,
          mode: 'real',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.post(
    '/campaigns',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createCampaignInDb(pool, req.authUser!, req.body);
        res.status(201).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۲. علاقه‌مندی‌های مشتری (/me/favorites) متصل به کاربر احراز هویت‌شده
   */
  router.post(
    '/customers/favorites/toggle',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const businessId = String(req.body?.businessId || '');
        const result = await toggleFavoriteBusinessInDb(
          pool,
          req.authUser!,
          businessId
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          ...result,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۲-الف. ثبت دیدگاه و امتیاز واقعی مراجعان (/salon/:slug) + پاسخ سالن + گزارش تخلف + حذف دیدگاه توهین‌آمیز توسط مدیر کل
   * POST /api/v1/reviews
   */
  router.post(
    '/reviews',
    (req: Request, res: Response, next) => {
      if (
        req.headers.authorization ||
        req.headers.cookie ||
        (!req.body?.authorPhone && !req.body?.authorName)
      ) {
        return requireAuth(req, res, next);
      }
      next();
    },
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(201).json({ ok: true, mode: 'mock', item: null });
        return;
      }
      if (!pool) return;

      try {
        const item = await createReviewInDb(
          pool,
          req.authUser ?? null,
          req.body
        );
        res.status(201).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.patch(
    '/reviews/:id/reply',
    requireAuth,
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(200).json({ ok: true, mode: 'mock' });
        return;
      }
      if (!pool) return;

      try {
        const revLookup = await pool.query(
          `SELECT r.business_id, COALESCE(b.legacy_demo_id, b.id::text) AS biz_ext_id, b.slug AS biz_slug
           FROM reviews r JOIN businesses b ON b.id = r.business_id
           WHERE r.id::text = $1 OR r.legacy_demo_id = $1 LIMIT 1`,
          [req.params.id]
        );
        const revRow = revLookup.rows[0];
        if (
          revRow &&
          !userOwnsBusiness(req.authUser, [
            revRow.business_id,
            revRow.biz_ext_id,
            revRow.biz_slug,
          ])
        ) {
          res.status(403).json({
            ok: false,
            mode: 'real',
            errorCode: 'BUSINESS_ACCESS_DENIED',
            message: 'فقط مدیر همین کسب‌وکار مجاز به ثبت پاسخ دیدگاه است.',
          });
          return;
        }
        const result = await replyToReviewInDb(
          pool,
          req.params.id,
          String(req.body?.salonReply || ''),
          req.body?.salonReplyDateJalali
            ? String(req.body.salonReplyDateJalali)
            : undefined
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          ...result,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.post(
    '/reviews/:id/report',
    requireAuth,
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(200).json({ ok: true, mode: 'mock' });
        return;
      }
      if (!pool) return;

      try {
        const revLookup = await pool.query(
          `SELECT r.business_id, COALESCE(b.legacy_demo_id, b.id::text) AS biz_ext_id, b.slug AS biz_slug
           FROM reviews r JOIN businesses b ON b.id = r.business_id
           WHERE r.id::text = $1 OR r.legacy_demo_id = $1 LIMIT 1`,
          [req.params.id]
        );
        const revRow = revLookup.rows[0];
        if (
          revRow &&
          !userOwnsBusiness(req.authUser, [
            revRow.business_id,
            revRow.biz_ext_id,
            revRow.biz_slug,
          ])
        ) {
          res.status(403).json({
            ok: false,
            mode: 'real',
            errorCode: 'BUSINESS_ACCESS_DENIED',
            message: 'فقط مدیر همین کسب‌وکار مجاز به گزارش دیدگاه است.',
          });
          return;
        }
        const result = await reportReviewInDb(
          pool,
          req.params.id,
          String(req.body?.reportReason || 'گزارش توهین یا متن جفنگ')
        );
        res.status(200).json({
          ok: true,
          mode: 'real',
          ...result,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.delete(
    '/admin/reviews/:id',
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(200).json({ ok: true, mode: 'mock' });
        return;
      }
      if (!pool) return;

      try {
        const result = await deleteReviewInDb(pool, req.params.id);
        res.status(200).json({
          ok: true,
          mode: 'real',
          ...result,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۳. عملیات پنل مدیریت کلان پلتفرم (/admin/*) محدود به PLATFORM_ADMIN
   */
  router.patch(
    '/admin/businesses/:id/approval',
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const status = req.body?.status as ApprovalStatus;
        const snapshot = req.body?.businessSnapshot as
          | Record<string, unknown>
          | undefined;
        await updateBusinessApprovalInDb(pool, req.params.id, status, snapshot);
        const data = await getBootstrapPayload(pool);
        res.status(200).json({
          ok: true,
          mode: 'real',
          status,
          data,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.delete(
    '/admin/businesses/:id',
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(200).json({ ok: true, mode: 'mock' });
        return;
      }
      if (!pool) return;

      try {
        await deleteBusinessPermanentlyInDb(pool, req.params.id);
        const data = await getBootstrapPayload(pool);
        res.status(200).json({
          ok: true,
          mode: 'real',
          data,
          message: 'کسب‌وکار به طور کامل و دائمی از سامانه حذف شد.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.post(
    '/admin/categories',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createCategoryInDb(pool, req.body);
        res.status(201).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.put(
    '/admin/categories/:id',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await updateCategoryInDb(pool, req.params.id, req.body);
        res.status(200).json({
          ok: true,
          mode: 'real',
          item,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.patch(
    '/admin/notifications/read',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const notifId = String(req.body?.id || '').trim();
        const clearAll = Boolean(req.body?.clearAll);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS platform_kv_store (
            key TEXT PRIMARY KEY,
            value_json JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        const currentRes = await pool.query(
          `SELECT value_json FROM platform_kv_store WHERE key = 'admin_notifications'`
        );
        const list = Array.isArray(currentRes.rows[0]?.value_json)
          ? currentRes.rows[0].value_json
          : [];
        const updated = list.map((item: Record<string, unknown>) =>
          clearAll || item?.id === notifId ? { ...item, isRead: true } : item
        );
        await pool.query(
          `
          INSERT INTO platform_kv_store (key, value_json, updated_at)
          VALUES ('admin_notifications', $1::jsonb, NOW())
          ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
          `,
          [JSON.stringify(updated)]
        );
        res.status(200).json({ ok: true, mode: 'real' });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۴. احراز هویت اتمیک پیامکی (OTP) و مدیریت نشست‌های امن (user_sessions)
   */
  router.post('/auth/otp/request', async (req: Request, res: Response) => {
    const { pool } = await resolvePoolOrFail(res);
    if (!pool) return;

    try {
      const config = customEnv ?? loadServerEnv();
      const phone = String(req.body?.phone || '');
      const ip = String(req.ip || req.socket.remoteAddress || '127.0.0.1');
      const result = await requestOtpInDb(pool, phone, ip, {
        nodeEnv: config.nodeEnv,
        smsConfig: customEnv
          ? config.sms
          : resolveEffectiveSmsConfig(config.sms),
        otpHmacSecret: config.otpHmacSecret ?? undefined,
      });
      if (!result.allowed) {
        res.status(429).json({
          ok: false,
          mode: 'real',
          errorCode: result.reasonCode,
          retryAfterSec: result.retryAfterSec,
          message: `تعداد درخواست‌های ارسال کد بیش از حد مجاز است. لطفاً ${result.retryAfterSec} ثانیه دیگر تلاش کنید.`,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        mode: 'real',
        challengeId: result.challengeId,
        smsDelivered: Boolean(result.smsDelivered),
        message: 'کد تایید یک‌بارمصرف از طریق پیامک ارسال شد.',
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  router.post('/auth/otp/verify', async (req: Request, res: Response) => {
    const { pool } = await resolvePoolOrFail(res);
    if (!pool) return;

    try {
      const config = customEnv ?? loadServerEnv();
      const phone = String(req.body?.phone || '').trim();
      const code = String(req.body?.code || '').trim();
      const ip = String(req.ip || req.socket.remoteAddress || '127.0.0.1');
      const ua = String(req.headers['user-agent'] || 'web');
      const result = await verifyOtpInDb(
        pool,
        phone,
        code,
        ip,
        ua,
        config.sessionSecret ?? undefined,
        config.otpHmacSecret ?? undefined
      );
      if (!result.verified) {
        const isRateLimited =
          result.outcomeCode === 'RATE_LIMIT_BLOCKED' ||
          result.outcomeCode === 'TOO_MANY_VERIFY_ATTEMPTS_FROM_IP';
        res.status(isRateLimited ? 429 : 401).json({
          ok: false,
          mode: 'real',
          errorCode: result.outcomeCode,
          remainingAttempts: result.remainingAttempts,
          retryAfterSec: result.retryAfterSec,
          message:
            result.outcomeCode === 'OTP_LOCKED'
              ? 'کد تایید به دلیل تلاش‌های ناموفق متوالی قفل شد. لطفاً کد جدید درخواست کنید.'
              : result.outcomeCode === 'OTP_EXPIRED'
                ? 'مهلت زمانی کد تایید به پایان رسیده است. لطفاً کد جدید درخواست کنید.'
                : result.outcomeCode === 'NO_ACTIVE_CHALLENGE'
                  ? 'کد تایید فعالی برای این شماره وجود ندارد یا قبلاً مصرف/منقضی شده است. لطفاً کد جدید درخواست کنید.'
                  : isRateLimited
                    ? `تعداد تلاش‌های تایید کد بیش از حد مجاز است.${result.retryAfterSec ? ` لطفاً ${result.retryAfterSec} ثانیه دیگر تلاش کنید.` : ''}`
                    : 'کد واردشده صحیح نیست.',
        });
        return;
      }

      // ارتقای خودکار شماره مدیر اصلی پلتفرم پس از احراز هویت موفق با کد یک‌بارمصرف پیامکی (OTP)
      const ownerPhone = (
        process.env.INITIAL_ADMIN_PHONE || '09138201042'
      ).trim();
      let finalUser = result.user;
      if (
        result.userId &&
        phone === ownerPhone &&
        (!finalUser || !finalUser.isPlatformAdmin)
      ) {
        try {
          const adminPwdHash = crypto
            .createHash('sha256')
            .update(`timeto-otp-admin:${phone}`, 'utf8')
            .digest('hex');
          await pool.query(
            `
            INSERT INTO platform_admins (user_id, password_hash, allowed_scopes, is_active, revoked_at)
            VALUES ($1, $2, ARRAY['ALL']::TEXT[], TRUE, NULL)
            ON CONFLICT (user_id)
            DO UPDATE SET
              is_active = TRUE,
              revoked_at = NULL,
              updated_at = NOW()
            `,
            [result.userId, adminPwdHash]
          );
          if (finalUser) {
            finalUser = {
              ...finalUser,
              isPlatformAdmin: true,
              roles: finalUser.roles.includes('PLATFORM_ADMIN')
                ? finalUser.roles
                : [...finalUser.roles, 'PLATFORM_ADMIN'],
            };
          }
        } catch {
          // نادیده گرفتن در محیط‌های تستی که جدول platform_admins شبیه‌سازی نشده است
        }
      }

      if (result.sessionToken) {
        setSessionCookie(res, result.sessionToken, isProdMode());
      }

      res.status(200).json({
        ok: true,
        mode: 'real',
        userId: result.userId,
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt,
        user: finalUser,
        message: 'احراز هویت با موفقیت انجام شد.',
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۱۴-الف. ورود با رمز عبور ثابت (برای مدیر کل پلتفرم، مدیران سالن و کاربران دارای رمز عبور)
   * POST /api/v1/auth/password/login
   */
  router.post('/auth/password/login', async (req: Request, res: Response) => {
    const { pool } = await resolvePoolOrFail(res);
    if (!pool) return;

    try {
      const rawPhone = String(req.body?.phone || '')
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .replace(/\D/g, '');
      const password = String(req.body?.password || '').trim();

      if (!/^09\d{9}$/.test(rawPhone)) {
        res.status(400).json({
          ok: false,
          mode: 'real',
          errorCode: 'INVALID_IRAN_MOBILE_PHONE',
          message: 'شماره موبایل واردشده معتبر نیست (فرمت صحیح: 09123456789).',
        });
        return;
      }

      if (!password || password.length < 4) {
        res.status(400).json({
          ok: false,
          mode: 'real',
          errorCode: 'INVALID_PASSWORD',
          message: 'رمز عبور باید حداقل ۴ کاراکتر باشد.',
        });
        return;
      }

      const safeLoginIp = String(
        req.ip || req.socket.remoteAddress || '127.0.0.1'
      ).slice(0, 45);
      try {
        const pwdRlRes = await pool.query(
          `SELECT * FROM check_and_increment_auth_rate_limit($1, 600, 15, 0)`,
          [`pwd_login:${rawPhone}:${safeLoginIp}`]
        );
        const pwdRl = pwdRlRes.rows[0];
        if (pwdRl && pwdRl.allowed === false) {
          const waitSec = Number(pwdRl.retry_after_sec || 60);
          res.status(429).json({
            ok: false,
            mode: 'real',
            errorCode: 'RATE_LIMIT_BLOCKED',
            retryAfterSec: waitSec,
            message: `تعداد تلاش‌های ورود با رمز بیش از حد مجاز است. لطفاً ${waitSec} ثانیه دیگر تلاش کنید یا با کد پیامکی وارد شوید.`,
          });
          return;
        }
      } catch {
        // در محیط‌های تستی که تابع SQL محدودساز نرخ وجود ندارد ادامه می‌دهیم
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_passwords (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          password_hash TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      const userLookup = await pool.query(
        `
        SELECT
          u.id,
          u.phone,
          u.is_active,
          up.password_hash AS user_pwd_hash,
          pa.password_hash AS admin_pwd_hash
        FROM users u
        LEFT JOIN user_passwords up ON up.user_id = u.id
        LEFT JOIN platform_admins pa ON pa.user_id = u.id AND pa.is_active = TRUE
        WHERE u.phone = $1
        LIMIT 1
        `,
        [rawPhone]
      );

      if (!userLookup.rowCount || !userLookup.rows[0]) {
        res.status(401).json({
          ok: false,
          mode: 'real',
          errorCode: 'USER_NOT_FOUND',
          message:
            'حساب کاربری با این شماره ثبت نشده است. لطفاً با «ورود با کد» یا «ثبت نام» اقدام کنید.',
        });
        return;
      }

      const uRow = userLookup.rows[0];
      if (!uRow.is_active) {
        res.status(403).json({
          ok: false,
          mode: 'real',
          errorCode: 'USER_ACCOUNT_DISABLED',
          message: 'حساب کاربری غیرفعال است.',
        });
        return;
      }

      const userHashStr = String(uRow.user_pwd_hash || '').trim();
      const adminHashStr = String(uRow.admin_pwd_hash || '').trim();
      const hasUserHash = isRealPasswordHash(userHashStr);
      const hasAdminHash = isRealPasswordHash(adminHashStr);
      const envAdminDefaultPwd = (process.env.ADMIN_DEFAULT_PASSWORD || '').trim();
      const ownerPhone = (
        process.env.INITIAL_ADMIN_PHONE || '09138201042'
      ).trim();

      const userPwdCheck = hasUserHash
        ? verifyPasswordAgainstHash(password, rawPhone, userHashStr)
        : { matched: false, needsUpgradeToScrypt: false };
      const adminPwdCheck =
        !userPwdCheck.matched && hasAdminHash
          ? verifyPasswordAgainstHash(password, rawPhone, adminHashStr)
          : { matched: false, needsUpgradeToScrypt: false };

      const matchesEnvAdminPwd =
        rawPhone === ownerPhone &&
        envAdminDefaultPwd.length >= 8 &&
        password.length === envAdminDefaultPwd.length &&
        crypto.timingSafeEqual(
          Buffer.from(password, 'utf8'),
          Buffer.from(envAdminDefaultPwd, 'utf8')
        );

      if (!userPwdCheck.matched && !adminPwdCheck.matched && !matchesEnvAdminPwd) {
        const hasAnyRealPassword = hasUserHash || hasAdminHash;
        res.status(401).json({
          ok: false,
          mode: 'real',
          errorCode: hasAnyRealPassword
            ? 'INVALID_CREDENTIALS'
            : 'PASSWORD_NOT_SET',
          message: hasAnyRealPassword
            ? 'رمز عبور واردشده صحیح نیست. در صورت فراموشی، روی «رمز عبور را فراموش کردم» بزنید.'
            : 'هنوز رمز عبور ثابتی برای این شماره ثبت نشده است. روی «ورود با کد» یا «رمز عبور را فراموش کردم» بزنید تا با کد پیامکی رمز تعیین کنید.',
        });
        return;
      }

      const userId = String(uRow.id);
      if (userPwdCheck.needsUpgradeToScrypt || adminPwdCheck.needsUpgradeToScrypt) {
        try {
          const upgradedHash = hashPasswordScrypt(password);
          await pool.query(
            `
            INSERT INTO user_passwords (user_id, password_hash, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
            `,
            [userId, upgradedHash]
          );
        } catch {
          // ارتقای بی‌سروصدا در پس‌زمینه
        }
      }
      const ip = safeLoginIp;
      const ua = String(req.headers['user-agent'] || 'web').slice(0, 500);
      const config = customEnv ?? loadServerEnv();
      const sessionSecret =
        config.sessionSecret ??
        process.env.SESSION_SECRET ??
        'timeto-fallback-session-secret';

      const rawSessionSecretPart = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(rawSessionSecretPart, 'utf8')
        .digest('hex');

      const sessionInsertRes = await pool.query(
        `
        INSERT INTO user_sessions (
          user_id,
          refresh_token_hash,
          ip_address,
          user_agent,
          expires_at
        )
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
        RETURNING id, expires_at
        `,
        [userId, refreshTokenHash, ip, ua]
      );

      const sessionId = String(sessionInsertRes.rows[0].id);
      const expiresAt = new Date(
        String(sessionInsertRes.rows[0].expires_at)
      ).toISOString();

      const payload = `v1.${sessionId}.${rawSessionSecretPart}`;
      const sig = crypto
        .createHmac('sha256', sessionSecret)
        .update(payload, 'utf8')
        .digest('hex');
      const signedToken = `${payload}.${sig}`;

      const { loadUserPermissionsByUserId } = await import('../auth/session');
      let authUser = await loadUserPermissionsByUserId(
        pool,
        userId,
        sessionId
      );

      if (rawPhone === ownerPhone && (!authUser || !authUser.isPlatformAdmin)) {
        try {
          const adminScryptHash = hashPasswordScrypt(password);
          await pool.query(
            `
            INSERT INTO platform_admins (user_id, password_hash, allowed_scopes, is_active, revoked_at)
            VALUES ($1, $2, ARRAY['ALL']::TEXT[], TRUE, NULL)
            ON CONFLICT (user_id)
            DO UPDATE SET is_active = TRUE, revoked_at = NULL, updated_at = NOW()
            `,
            [userId, adminScryptHash]
          );
          if (authUser) {
            authUser = {
              ...authUser,
              isPlatformAdmin: true,
              roles: authUser.roles.includes('PLATFORM_ADMIN')
                ? authUser.roles
                : [...authUser.roles, 'PLATFORM_ADMIN'],
            };
          }
        } catch {
          // ignore
        }
      }

      setSessionCookie(res, signedToken, isProdMode());
      res.status(200).json({
        ok: true,
        mode: 'real',
        userId,
        sessionToken: signedToken,
        expiresAt,
        user: authUser,
        message: 'ورود با رمز عبور انجام شد (نشست ۳۰ روزه فعال است).',
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۱۴-ب. تنظیم یا تغییر رمز عبور ثابت برای کاربر احراز هویت‌شده
   * POST /api/v1/auth/password/set
   */
  router.post(
    '/auth/password/set',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const password = String(req.body?.password || '').trim();
        if (!password || password.length < 4) {
          res.status(400).json({
            ok: false,
            mode: 'real',
            errorCode: 'INVALID_PASSWORD',
            message: 'رمز عبور باید حداقل ۴ کاراکتر باشد.',
          });
          return;
        }

        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_passwords (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            password_hash TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);

        const pwdHash = hashPasswordScrypt(password);

        await pool.query(
          `
          INSERT INTO user_passwords (user_id, password_hash, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
          `,
          [req.authUser!.userId, pwdHash]
        );

        res.status(200).json({
          ok: true,
          mode: 'real',
          message:
            'رمز عبور ثابت شما با موفقیت ذخیره شد. از این پس می‌توانید بدون نیاز به پیامک با همین رمز وارد شوید.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۴-ج. بازیابی و تنظیم رمز عبور جدید با کد تایید پیامکی (فراموشی رمز عبور)
   * POST /api/v1/auth/password/reset-with-otp
   */
  router.post(
    '/auth/password/reset-with-otp',
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const phone = String(req.body?.phone || '')
          .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
          .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
          .replace(/\D/g, '');
        const code = String(req.body?.code || '').trim();
        const newPassword = String(req.body?.newPassword || '').trim();

        if (!newPassword || newPassword.length < 4) {
          res.status(400).json({
            ok: false,
            mode: 'real',
            errorCode: 'INVALID_PASSWORD',
            message: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.',
          });
          return;
        }

        const config = customEnv ?? loadServerEnv();
        const ip = String(req.ip || req.socket.remoteAddress || '127.0.0.1');
        const ua = String(req.headers['user-agent'] || 'web');
        const verifyResult = await verifyOtpInDb(
          pool,
          phone,
          code,
          ip,
          ua,
          config.sessionSecret ?? undefined,
          config.otpHmacSecret ?? undefined
        );

        if (!verifyResult.verified || !verifyResult.userId) {
          const isRateLimited =
            verifyResult.outcomeCode === 'RATE_LIMIT_BLOCKED' ||
            verifyResult.outcomeCode === 'TOO_MANY_VERIFY_ATTEMPTS_FROM_IP';
          res.status(isRateLimited ? 429 : 401).json({
            ok: false,
            mode: 'real',
            errorCode: verifyResult.outcomeCode || 'INVALID_OTP',
            message:
              verifyResult.outcomeCode === 'OTP_LOCKED'
                ? 'کد تایید به دلیل تلاش‌های ناموفق قفل شد. لطفاً کد جدید درخواست کنید.'
                : verifyResult.outcomeCode === 'OTP_EXPIRED'
                  ? 'مهلت زمانی کد تایید به پایان رسیده است. لطفاً کد جدید درخواست کنید.'
                  : verifyResult.outcomeCode === 'NO_ACTIVE_CHALLENGE'
                    ? 'کد تایید فعالی یافت نشد یا منقضی شده است. روی «ارسال مجدد کد» بزنید.'
                    : isRateLimited
                      ? 'تعداد تلاش‌های تایید کد بیش از حد مجاز است. کمی بعد مجدداً تلاش کنید.'
                      : 'کد تایید پیامکی واردشده صحیح نیست.',
          });
          return;
        }

        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_passwords (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            password_hash TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);

        const pwdHash = hashPasswordScrypt(newPassword);

        await pool.query(
          `
          INSERT INTO user_passwords (user_id, password_hash, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
          `,
          [verifyResult.userId, pwdHash]
        );

        const ownerPhone = (
          process.env.INITIAL_ADMIN_PHONE || '09138201042'
        ).trim();
        let finalUser = verifyResult.user;
        if (
          verifyResult.userId &&
          phone === ownerPhone &&
          (!finalUser || !finalUser.isPlatformAdmin)
        ) {
          try {
            await pool.query(
              `
              INSERT INTO platform_admins (user_id, password_hash, allowed_scopes, is_active, revoked_at)
              VALUES ($1, $2, ARRAY['ALL']::TEXT[], TRUE, NULL)
              ON CONFLICT (user_id)
              DO UPDATE SET is_active = TRUE, revoked_at = NULL, updated_at = NOW()
              `,
              [verifyResult.userId, pwdHash]
            );
            if (finalUser) {
              finalUser = {
                ...finalUser,
                isPlatformAdmin: true,
                roles: finalUser.roles.includes('PLATFORM_ADMIN')
                  ? finalUser.roles
                  : [...finalUser.roles, 'PLATFORM_ADMIN'],
              };
            }
          } catch {
            // ignore
          }
        }

        if (verifyResult.sessionToken) {
          setSessionCookie(res, verifyResult.sessionToken, isProdMode());
        }

        res.status(200).json({
          ok: true,
          mode: 'real',
          userId: verifyResult.userId,
          sessionToken: verifyResult.sessionToken,
          expiresAt: verifyResult.expiresAt,
          user: finalUser,
          message:
            'رمز عبور جدید شما با موفقیت ثبت شد و وارد حساب کاربری شدید.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۵. ارسال پیامک از پنل کسب‌وکار به مشتریان سالن و ثبت گزارش مصرف پیامک
   * POST /api/v1/app/sms/send
   */
  router.post(
    '/app/sms/send',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const businessId = String(req.body?.businessId || '').trim();
        if (!userOwnsBusiness(req.authUser, [businessId])) {
          res.status(403).json({
            ok: false,
            mode: 'real',
            errorCode: 'BUSINESS_ACCESS_DENIED',
            message: 'مجوز ارسال پیامک از طرف این کسب‌وکار را ندارید.',
          });
          return;
        }
        const messageText = String(req.body?.messageText || '').trim();
        const templateTitle = String(req.body?.templateTitle || 'پیامک سالن').trim();
        const rawPhones: string[] = Array.isArray(req.body?.recipientPhones)
          ? req.body.recipientPhones.map(String)
          : [];

        const cleanPhones = Array.from(
          new Set(
            rawPhones
              .map((p) =>
                p
                  .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                  .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
                  .replace(/\D/g, '')
              )
              .filter((p) => /^09\d{9}$/.test(p))
          )
        );

        if (!messageText || cleanPhones.length === 0) {
          res.status(400).json({
            ok: false,
            mode: 'real',
            errorCode: 'INVALID_SMS_PAYLOAD',
            message: 'لطفاً حداقل یک شماره موبایل معتبر و متن پیامک را وارد کنید.',
          });
          return;
        }

        let newSentCount = cleanPhones.length;
        try {
          const bizLookup = await pool.query(
            `SELECT id FROM businesses WHERE id::text = $1 OR legacy_demo_id = $1 OR slug = $1 LIMIT 1`,
            [businessId]
          );
          if (bizLookup.rowCount && bizLookup.rows[0]) {
            const bizUuid = String(bizLookup.rows[0].id);
            const metaRes = await pool.query(
              `SELECT extra_json FROM business_meta_ext WHERE business_id = $1 LIMIT 1`,
              [bizUuid]
            );
            const prevSent = Number(
              (metaRes.rows[0]?.extra_json as Record<string, unknown>)?.smsSentCount ?? 0
            );
            newSentCount = prevSent + cleanPhones.length;
            await pool.query(
              `
              INSERT INTO business_meta_ext (business_id, extra_json, updated_at)
              VALUES ($1, $2::jsonb, NOW())
              ON CONFLICT (business_id) DO UPDATE
              SET extra_json = COALESCE(business_meta_ext.extra_json, '{}'::jsonb) || $2::jsonb,
                  updated_at = NOW()
              `,
              [bizUuid, JSON.stringify({ smsSentCount: newSentCount })]
            );
          }
        } catch {
          // ignore if showcase business
        }

        res.status(200).json({
          ok: true,
          mode: 'real',
          recipientsCount: cleanPhones.length,
          smsSentCount: newSentCount,
          message: `پیامک شما برای ${cleanPhones.length} شماره در صف ارسال قرار گرفت و در گزارش مصرف ثبت شد.`,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.get('/auth/me', requireAuth, async (req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
      mode: 'real',
      user: req.authUser,
    });
  });

  router.post(
    '/auth/logout',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        await revokeSessionInDb(
          pool,
          req.authUser!.sessionId,
          req.authUser!.userId
        );
        clearSessionCookie(res, isProdMode());
        res.status(200).json({
          ok: true,
          mode: 'real',
          message: 'نشست کاربری با موفقیت لغو و بسته شد.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  router.post(
    '/auth/logout-all',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const revokedCount = await revokeAllUserSessionsInDb(
          pool,
          req.authUser!.userId
        );
        clearSessionCookie(res, isProdMode());
        res.status(200).json({
          ok: true,
          mode: 'real',
          revokedCount,
          message: 'تمامی نشست‌های فعال حساب کاربری لغو شدند.',
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  /**
   * ۱۶. همگام‌سازی حساب‌های کاربری ثبت‌نام‌شده (مشتریان و صاحبان کسب‌وکار) با PostgreSQL
   * POST /api/v1/auth/register-sync
   */
  router.post(
    '/auth/register-sync',
    requireAuth,
    async (req: Request, res: Response) => {
      const { mode, pool } = await resolvePoolOrFail(res);
      if (mode === 'mock') {
        res.status(200).json({ ok: true, mode: 'mock', registeredUsers: [] });
        return;
      }
      if (!pool) return;

      try {
        const authUser = req.authUser!;
        const rawAccounts = Array.isArray(req.body?.accounts)
          ? req.body.accounts
          : req.body?.phone
            ? [req.body]
            : [];

        // فقط مدیر کل مجاز به همگام‌سازی حساب سایر کاربران است؛ کاربر عادی صرفاً حساب خودش را همگام می‌کند
        const scopedAccounts = authUser.isPlatformAdmin
          ? rawAccounts
          : rawAccounts.filter(
              (acc: Record<string, unknown>) =>
                normalizeIranMobile(acc?.phone) ===
                normalizeIranMobile(authUser.phone)
            );

        const ip = String(req.ip || req.socket.remoteAddress || '127.0.0.1');
        const ua = String(req.headers['user-agent'] || 'web');

        // صدور نشست بدون OTP یا رمز عبور تاییدشده کاملاً ممنوع است
        const result = await syncRegisteredAccountsInDb(pool, scopedAccounts, {
          issueSessionForPhone: undefined,
          requestIp: ip,
          userAgent: ua,
        });

      let syncedBusinesses: unknown[] | undefined;
      let syncedServices: unknown[] | undefined;
      let syncedSpecialists: unknown[] | undefined;
      let syncedAppointments: unknown[] | undefined;
      let syncedSettlementRequests: Array<Record<string, unknown>> | undefined;
      let syncedPaymentConfig: Record<string, unknown> | undefined;
      let syncedNotices: Array<Record<string, unknown>> | undefined;
      let syncedPaymentOrders: Array<Record<string, unknown>> | undefined;
      try {
        // دیتابیس PostgreSQL مرجع واحد نوبت‌هاست؛ از تزریق نوبت‌های کش مرورگر (localStorage) جلوگیری می‌شود تا آمار مالی و رزروها کاملاً واقعی و دقیق بماند
        const [bootstrapPayload, sharedState, rejectedBizRes] = await Promise.all([
          getBootstrapPayload(pool),
          getSharedPlatformState(pool),
          pool.query(`
            SELECT
              b.id,
              b.legacy_demo_id,
              COALESCE(b.legacy_demo_id, b.id::text) AS external_id,
              b.slug,
              b.name,
              b.type,
              b.type_label,
              b.city,
              b.neighborhood,
              b.address,
              b.map_lat,
              b.map_lng,
              b.phone_display,
              b.instagram_handle,
              b.short_description,
              b.about_text,
              b.visual_theme,
              b.rating_avg,
              b.review_count,
              b.starting_price_toman,
              b.verified_badge,
              b.approval_status,
              b.subscription_plan,
              b.subscription_status,
              b.is_featured,
              b.created_at,
              u.created_at AS owner_created_at,
              u.full_name AS owner_full_name,
              u.phone AS owner_phone,
              COALESCE(c.slug, 'hair-color') AS primary_category_slug,
              bme.extra_json
            FROM businesses b
            LEFT JOIN categories c ON c.id = b.primary_category_id
            LEFT JOIN users u ON u.id = b.owner_user_id
            LEFT JOIN business_meta_ext bme ON bme.business_id = b.id
            WHERE b.approval_status = 'REJECTED'
              AND COALESCE(b.legacy_demo_id, '') NOT IN ('biz-1','biz-2','biz-3','biz-4','biz-5','biz-6','biz-7','biz-8')
            ORDER BY b.created_at DESC
          `),
        ]);
        const rejectedBusinesses = (rejectedBizRes.rows || []).map((r: Record<string, unknown>) => {
          const extra =
            r.extra_json && typeof r.extra_json === 'object'
              ? (r.extra_json as Record<string, unknown>)
              : {};
          return {
            id: String(r.external_id),
            slug: String(r.slug),
            name: String(r.name),
            type: String(r.type || 'WOMEN_SALON'),
            typeLabel: String(extra.typeLabel || r.type_label || 'سالن زیبایی'),
            categorySlug: String(extra.categorySlug || r.primary_category_slug || 'hair-color'),
            city: String(r.city || 'اصفهان'),
            neighborhood: String(r.neighborhood || ''),
            address: String(r.address || ''),
            mapLat: r.map_lat !== null && r.map_lat !== undefined ? Number(r.map_lat) : undefined,
            mapLng: r.map_lng !== null && r.map_lng !== undefined ? Number(r.map_lng) : undefined,
            rating: Number(r.rating_avg) || 4.8,
            reviewCount: Number(r.review_count) || 0,
            startingPriceToman: Number(r.starting_price_toman) || 0,
            verifiedBadge: false,
            shortDescription: String(r.short_description || ''),
            aboutText: String(r.about_text || ''),
            phoneDisplay: String(r.phone_display || ''),
            ownerName: String(extra.ownerName || r.owner_full_name || ''),
            ownerPhone: String(extra.ownerPhone || r.owner_phone || r.phone_display || ''),
            createdAtJalali:
              typeof extra.createdAtJalali === 'string' && extra.createdAtJalali
                ? extra.createdAtJalali
                : undefined,
            instagramHandle: r.instagram_handle ? String(r.instagram_handle) : undefined,
            workingHours: [],
            visualTheme: String(r.visual_theme || 'violet'),
            approvalStatus: 'REJECTED',
            subscriptionPlan: String(r.subscription_plan || 'شروع رایگان'),
            subscriptionStatus: String(r.subscription_status || 'TRIAL'),
            featured: false,
          };
        });
        syncedBusinesses = [
          ...(bootstrapPayload.businesses || []),
          ...rejectedBusinesses.filter(
            (rb) => !(bootstrapPayload.businesses || []).some((b) => b.id === rb.id || b.slug === rb.slug)
          ),
        ];
        syncedServices = bootstrapPayload.services;
        syncedSpecialists = bootstrapPayload.specialists;
        syncedSettlementRequests = sharedState.settlementRequests;
        syncedPaymentConfig = sharedState.paymentConfig;
        syncedNotices = sharedState.platformBusinessNotices;
        syncedPaymentOrders = sharedState.paymentOrders;
        const bizByIdMap = new Map(
          (bootstrapPayload.businesses || []).map((b) => [b.id, b])
        );
        const srvByIdMap = new Map(
          (bootstrapPayload.services || []).map((s) => [s.id, s])
        );
        const ownedBizUuids = authUser.businessMemberships.map(
          (m) => m.businessUuid
        );
        const cleanUserPhone = normalizeIranMobile(authUser.phone);
        const aptQuery = authUser.isPlatformAdmin
          ? {
              sql: `
                SELECT
                  COALESCE(a.legacy_demo_id, a.id::text) AS external_id,
                  a.reference_code,
                  COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
                  COALESCE(b.slug, '') AS business_slug,
                  COALESCE(b.name, 'سالن زیبایی') AS business_name,
                  COALESCE(s.legacy_demo_id, s.id::text, '') AS service_external_id,
                  a.service_title_snapshot,
                  COALESCE(sp.legacy_demo_id, sp.id::text, '') AS specialist_external_id,
                  a.specialist_name_snapshot,
                  a.customer_name,
                  a.customer_phone,
                  a.customer_phone_masked,
                  a.date_jalali,
                  a.time_slot_label,
                  a.duration_minutes_snapshot,
                  a.service_price_toman_snapshot,
                  a.status,
                  a.notes
                FROM appointments a
                LEFT JOIN businesses b ON b.id = a.business_id
                LEFT JOIN services s ON s.id = a.service_id
                LEFT JOIN specialists sp ON sp.id = a.specialist_id
                WHERE COALESCE(b.legacy_demo_id, '') NOT IN ('biz-1','biz-2','biz-3','biz-4','biz-5','biz-6','biz-7','biz-8')
                  AND COALESCE(a.legacy_demo_id, '') NOT IN ('apt-1','apt-2','apt-3','apt-4','apt-5','apt-6','apt-7','apt-8','apt-9','apt-10','apt-11','apt-12')
                  AND COALESCE(b.approval_status, 'APPROVED') <> 'REJECTED'
                  AND COALESCE(b.name, '') NOT ILIKE '%مهتاب%'
                ORDER BY a.service_starts_at DESC, a.created_at DESC
                LIMIT 1000
              `,
              params: [] as unknown[],
            }
          : {
              sql: `
                SELECT
                  COALESCE(a.legacy_demo_id, a.id::text) AS external_id,
                  a.reference_code,
                  COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
                  COALESCE(b.slug, '') AS business_slug,
                  COALESCE(b.name, 'سالن زیبایی') AS business_name,
                  COALESCE(s.legacy_demo_id, s.id::text, '') AS service_external_id,
                  a.service_title_snapshot,
                  COALESCE(sp.legacy_demo_id, sp.id::text, '') AS specialist_external_id,
                  a.specialist_name_snapshot,
                  a.customer_name,
                  a.customer_phone,
                  a.customer_phone_masked,
                  a.date_jalali,
                  a.time_slot_label,
                  a.duration_minutes_snapshot,
                  a.service_price_toman_snapshot,
                  a.status,
                  a.notes
                FROM appointments a
                LEFT JOIN businesses b ON b.id = a.business_id
                LEFT JOIN services s ON s.id = a.service_id
                LEFT JOIN specialists sp ON sp.id = a.specialist_id
                WHERE (
                    a.customer_user_id = $1::uuid
                    OR a.customer_phone = $2
                    OR ($3::text[] IS NOT NULL AND array_length($3::text[], 1) > 0 AND a.business_id::text = ANY($3::text[]))
                  )
                  AND COALESCE(b.approval_status, 'APPROVED') <> 'REJECTED'
                ORDER BY a.service_starts_at DESC, a.created_at DESC
                LIMIT 500
              `,
              params: [authUser.userId, cleanUserPhone, ownedBizUuids] as unknown[],
            };

        const [aptRes, paymentMetaMap] = await Promise.all([
          pool.query(aptQuery.sql, aptQuery.params),
          getAppointmentPaymentMetaMapInDb(pool),
        ]);
        syncedAppointments = aptRes.rows.map((r: Record<string, unknown>) => {
          const extId = String(r.external_id);
          const refCode = String(r.reference_code);
          const savedMeta = paymentMetaMap[extId] || paymentMetaMap[refCode] || {};
          const rowPrice = Math.max(0, Number(r.service_price_toman_snapshot) || 0);
          const matchedSrv = srvByIdMap.get(String(r.service_external_id));
          const effectivePrice =
            rowPrice > 0 ? rowPrice : Math.max(0, Number(matchedSrv?.priceToman) || 0);
          const matchedBiz = bizByIdMap.get(String(r.business_external_id));
          const rawDepPct = Number(matchedBiz?.depositPercent);
          const depPct =
            Number.isFinite(rawDepPct) && rawDepPct >= 0 && rawDepPct <= 100
              ? Math.round(rawDepPct)
              : 30;
          const exactDeposit =
            typeof savedMeta.depositPaidToman === 'number'
              ? Math.max(0, Math.round(savedMeta.depositPaidToman))
              : matchedBiz?.depositEnabled === false || depPct <= 0 || effectivePrice <= 0
                ? 0
                : Math.max(0, Math.round((effectivePrice * depPct) / 100));
          return {
            id: extId,
            referenceCode: refCode,
            businessId: String(r.business_external_id),
            businessSlug: String(r.business_slug),
            businessName: String(r.business_name),
            serviceId: String(r.service_external_id),
            serviceTitle: String(r.service_title_snapshot),
            specialistId: String(r.specialist_external_id),
            specialistName: String(r.specialist_name_snapshot),
            customerName: String(r.customer_name),
            customerPhone: String(r.customer_phone || ''),
            customerPhoneMasked: String(r.customer_phone_masked || r.customer_phone || ''),
            dateJalali: String(r.date_jalali),
            timeSlot: String(r.time_slot_label),
            durationMinutes: Number(r.duration_minutes_snapshot),
            priceToman: effectivePrice,
            depositPaidToman: exactDeposit,
            paymentMethod: savedMeta.paymentMethod,
            paymentTrackingCode: savedMeta.paymentTrackingCode,
            status: String(r.status),
            notes: r.notes ? String(r.notes) : undefined,
          };
        });
      } catch {
        // ignore fallback
      }

      const safePaymentConfig = authUser.isPlatformAdmin
        ? syncedPaymentConfig
        : syncedPaymentConfig
          ? {
              mode: syncedPaymentConfig.mode,
              platformCommissionPercent:
                syncedPaymentConfig.platformCommissionPercent,
              depositPercent: syncedPaymentConfig.depositPercent,
              customerServiceFeeToman:
                syncedPaymentConfig.customerServiceFeeToman,
            }
          : undefined;

      res.status(200).json({
        ok: true,
        mode: 'real',
        registeredUsers: authUser.isPlatformAdmin ? result.registeredUsers : [],
        businesses: syncedBusinesses,
        services: syncedServices,
        specialists: syncedSpecialists,
        appointments: syncedAppointments,
        settlementRequests: authUser.isPlatformAdmin
          ? syncedSettlementRequests
          : (syncedSettlementRequests || []).filter((sr) =>
              userOwnsBusiness(authUser, [String(sr.businessId || '')])
            ),
        paymentConfig: safePaymentConfig,
        platformBusinessNotices: syncedNotices,
        paymentOrders: authUser.isPlatformAdmin
          ? syncedPaymentOrders
          : (syncedPaymentOrders || []).filter((po) =>
              userOwnsBusiness(authUser, [String(po.businessId || '')])
            ),
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۱۶-الف. وضعیت مشترک پلتفرم در پایگاه داده (درخواست‌های تسویه، تنظیمات کارمزد و اطلاعیه‌های کسب‌وکارها)
   * GET /api/v1/platform/shared-state
   * POST /api/v1/platform/shared-state
   */
  router.get('/platform/shared-state', requireAuth, async (req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock' || !pool) {
      res.status(200).json({ ok: true, mode: 'mock', data: {} });
      return;
    }
    try {
      const data = await getSharedPlatformState(pool);
      const authUser = req.authUser!;
      if (authUser.isPlatformAdmin) {
        res.status(200).json({ ok: true, mode: 'real', data });
        return;
      }
      res.status(200).json({
        ok: true,
        mode: 'real',
        data: {
          settlementRequests: (data.settlementRequests || []).filter((sr) =>
            userOwnsBusiness(authUser, [String(sr.businessId || '')])
          ),
          paymentConfig: data.paymentConfig
            ? {
                mode: data.paymentConfig.mode,
                platformCommissionPercent:
                  data.paymentConfig.platformCommissionPercent,
                depositPercent: data.paymentConfig.depositPercent,
                customerServiceFeeToman:
                  data.paymentConfig.customerServiceFeeToman,
              }
            : undefined,
          platformBusinessNotices: data.platformBusinessNotices,
          paymentOrders: (data.paymentOrders || []).filter((po) =>
            userOwnsBusiness(authUser, [String(po.businessId || '')])
          ),
        },
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  router.post('/platform/shared-state', requireAuth, async (req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock' || !pool) {
      res.status(200).json({ ok: true, mode: 'mock', data: req.body || {} });
      return;
    }
    try {
      const authUser = req.authUser!;
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as {
        settlementRequests?: Array<Record<string, unknown>>;
        paymentConfig?: Record<string, unknown>;
        platformBusinessNotices?: Array<Record<string, unknown>>;
        paymentOrders?: Array<Record<string, unknown>>;
      };

      if (
        !authUser.isPlatformAdmin &&
        (body.paymentConfig !== undefined ||
          body.platformBusinessNotices !== undefined)
      ) {
        res.status(403).json({
          ok: false,
          mode: 'real',
          errorCode: 'ADMIN_ACCESS_DENIED',
          message: 'تغییر تنظیمات مالی پلتفرم و اطلاعیه‌های سراسری فقط توسط مدیر کل مجاز است.',
        });
        return;
      }

      if (
        !authUser.isPlatformAdmin &&
        authUser.businessMemberships.length === 0
      ) {
        res.status(403).json({
          ok: false,
          mode: 'real',
          errorCode: 'BUSINESS_ACCESS_DENIED',
          message: 'شما مجوز ثبت تغییرات در این بخش را ندارید.',
        });
        return;
      }

      await saveSharedPlatformStateInDb(pool, {
        settlementRequests: Array.isArray(body.settlementRequests)
          ? authUser.isPlatformAdmin
            ? body.settlementRequests
            : body.settlementRequests.filter((sr) =>
                userOwnsBusiness(authUser, [String(sr.businessId || '')])
              )
          : undefined,
        paymentConfig:
          authUser.isPlatformAdmin &&
          body.paymentConfig &&
          typeof body.paymentConfig === 'object'
            ? body.paymentConfig
            : undefined,
        platformBusinessNotices:
          authUser.isPlatformAdmin &&
          Array.isArray(body.platformBusinessNotices)
            ? body.platformBusinessNotices
            : undefined,
        paymentOrders: Array.isArray(body.paymentOrders)
          ? authUser.isPlatformAdmin
            ? body.paymentOrders
            : body.paymentOrders.filter((po) =>
                userOwnsBusiness(authUser, [String(po.businessId || '')])
              )
          : undefined,
      });
      const data = await getSharedPlatformState(pool);
      res.status(200).json({ ok: true, mode: 'real', data });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۱۷. ویرایش یا حذف کاربر در پنل مدیریت کل پلتفرم (/admin/users) با ماندگاری در PostgreSQL
   */
  router.patch('/admin/users/:phone', async (req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({ ok: true, mode: 'mock', users: [] });
      return;
    }
    if (!pool) return;

    try {
      const users = await updateAdminUserInDb(pool, req.params.phone, req.body ?? {});
      res.status(200).json({
        ok: true,
        mode: 'real',
        users,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  router.delete('/admin/users/:phone', async (req: Request, res: Response) => {
    const { mode, pool } = await resolvePoolOrFail(res);
    if (mode === 'mock') {
      res.status(200).json({ ok: true, mode: 'mock', users: [] });
      return;
    }
    if (!pool) return;

    try {
      const users = await deleteAdminUserInDb(pool, req.params.phone);
      res.status(200).json({
        ok: true,
        mode: 'real',
        users,
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

  /**
   * ۱۸. درگاه پرداخت اینترنتی زیبال (Zibal) — ایجاد تراکنش، ذخیره مرچنت و تایید پرداخت
   * GET  /api/v1/payments/zibal/config
   * POST /api/v1/payments/zibal/config
   * POST /api/v1/payments/zibal/request
   * POST /api/v1/payments/zibal/verify
   */
  const zibalConfigFilePath = path.resolve(
    process.cwd(),
    'zibal-gateway-config.json'
  );
  const readPersistedZibalMerchant = (): string => {
    try {
      if (fs.existsSync(zibalConfigFilePath)) {
        const raw = fs.readFileSync(zibalConfigFilePath, 'utf-8');
        const parsed = JSON.parse(raw) as { merchantId?: string };
        if (parsed?.merchantId && parsed.merchantId.trim()) {
          return parsed.merchantId.trim();
        }
      }
    } catch {
      // ignore file read error
    }
    return '';
  };

  let runtimeZibalMerchantId =
    readPersistedZibalMerchant() ||
    process.env.ZIBAL_MERCHANT_ID?.trim() ||
    process.env.PAYMENT_MERCHANT_ID?.trim() ||
    '';

  router.get('/payments/zibal/config', (_req: Request, res: Response) => {
    const isCustom = Boolean(
      runtimeZibalMerchantId && runtimeZibalMerchantId !== 'zibal'
    );
    res.status(200).json({
      ok: true,
      provider: 'zibal',
      merchantId: isCustom
        ? `${runtimeZibalMerchantId.slice(0, 4)}****${runtimeZibalMerchantId.slice(-4)}`
        : 'zibal',
      isCustomMerchant: isCustom,
    });
  });

  router.get(
    '/payments/zibal/server-ip',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    async (_req: Request, res: Response) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json', {
            signal: controller.signal,
          });
          const data = (await ipRes.json()) as { ip?: string };
          res.status(200).json({
            ok: true,
            outgoingIp: data?.ip || '',
            domainIp: '185.208.181.150',
          });
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        res.status(200).json({
          ok: true,
          outgoingIp: '',
          domainIp: '185.208.181.150',
        });
      }
    }
  );

  router.post(
    '/payments/zibal/config',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    (req: Request, res: Response) => {
      const incoming = String(req.body?.merchantId || '').trim();
      runtimeZibalMerchantId = incoming;
      try {
        fs.writeFileSync(
          zibalConfigFilePath,
          JSON.stringify(
            { merchantId: incoming, updatedAt: new Date().toISOString() },
            null,
            2
          ),
          'utf-8'
        );
      } catch {
        // ignore write error
      }
      res.status(200).json({
        ok: true,
        provider: 'zibal',
        merchantId: runtimeZibalMerchantId || 'zibal',
        isCustomMerchant: Boolean(
          runtimeZibalMerchantId && runtimeZibalMerchantId !== 'zibal'
        ),
      });
    }
  );

  interface ZibalStoredOrder {
    orderId: string;
    trackId: string;
    purpose: 'booking' | 'wallet_topup';
    businessId: string;
    businessSlug: string;
    businessName: string;
    amountToman: number;
    customerPhone: string;
    customerName: string;
    bookingDraft?: Record<string, unknown>;
    createdAt: string;
    verifiedAt?: string;
    refNumber?: string;
  }

  const zibalOrdersFilePath = path.resolve(
    process.cwd(),
    'zibal-gateway-orders.json'
  );
  const zibalOrdersMap = new Map<string, ZibalStoredOrder>();
  try {
    if (fs.existsSync(zibalOrdersFilePath)) {
      const parsed = JSON.parse(
        fs.readFileSync(zibalOrdersFilePath, 'utf-8')
      ) as ZibalStoredOrder[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.trackId) {
            zibalOrdersMap.set(`track:${item.trackId}`, item);
          }
          if (item && item.orderId) {
            zibalOrdersMap.set(`order:${item.orderId}`, item);
          }
        }
      }
    }
  } catch {
    // ignore read error
  }

  const persistZibalOrders = () => {
    try {
      const uniqueByOrder = new Map<string, ZibalStoredOrder>();
      for (const val of zibalOrdersMap.values()) {
        if (val?.orderId) uniqueByOrder.set(val.orderId, val);
      }
      const list = Array.from(uniqueByOrder.values()).slice(-400);
      fs.writeFileSync(
        zibalOrdersFilePath,
        JSON.stringify(list, null, 2),
        'utf-8'
      );
    } catch {
      // ignore write error
    }
  };

  const resolveActivePoolForZibal = () => {
    const config = customEnv ?? loadServerEnv();
    return customPool ?? (config.dataMode === 'real' ? getOrCreatePool(config) : null);
  };

  const findZibalOrderByTrackOrOrder = async (
    trackId: string,
    orderId?: string
  ): Promise<ZibalStoredOrder | undefined> => {
    const memFound =
      zibalOrdersMap.get(`track:${trackId}`) ||
      (orderId ? zibalOrdersMap.get(`order:${orderId}`) : undefined);
    if (memFound) return memFound;

    const dbPool = resolveActivePoolForZibal();
    if (!dbPool) return undefined;
    const dbOrders = await getZibalOrdersFromDb(dbPool);
    for (const raw of dbOrders) {
      const item = raw as unknown as ZibalStoredOrder;
      if (item?.trackId) zibalOrdersMap.set(`track:${item.trackId}`, item);
      if (item?.orderId) zibalOrdersMap.set(`order:${item.orderId}`, item);
    }
    return (
      zibalOrdersMap.get(`track:${trackId}`) ||
      (orderId ? zibalOrdersMap.get(`order:${orderId}`) : undefined)
    );
  };

  const persistVerifiedZibalBooking = async (
    storedOrder: ZibalStoredOrder,
    refNumStr: string,
    trackId: string
  ): Promise<boolean> => {
    if (storedOrder.purpose !== 'booking') return false;
    const draftObj =
      storedOrder.bookingDraft && typeof storedOrder.bookingDraft === 'object'
        ? storedOrder.bookingDraft
        : {};
    const draftDeposit =
      typeof draftObj.depositAmountToman === 'number' &&
      draftObj.depositAmountToman >= 0
        ? draftObj.depositAmountToman
        : undefined;
    const draftPrice =
      typeof draftObj.servicePriceToman === 'number'
        ? draftObj.servicePriceToman
        : typeof draftObj.priceToman === 'number'
          ? draftObj.priceToman
          : undefined;

    await dispatchBookingSmsAndWalletCredit({
      businessId:
        storedOrder.businessId ||
        (typeof draftObj.businessId === 'string'
          ? draftObj.businessId
          : undefined),
      businessSlug:
        storedOrder.businessSlug ||
        (typeof draftObj.businessSlug === 'string'
          ? draftObj.businessSlug
          : undefined),
      businessName:
        storedOrder.businessName ||
        (typeof draftObj.businessName === 'string'
          ? draftObj.businessName
          : undefined),
      customerName:
        storedOrder.customerName ||
        (typeof draftObj.customerName === 'string'
          ? draftObj.customerName
          : undefined),
      customerPhone:
        storedOrder.customerPhone ||
        (typeof draftObj.customerPhone === 'string'
          ? draftObj.customerPhone
          : undefined),
      serviceId:
        typeof draftObj.serviceId === 'string' ? draftObj.serviceId : undefined,
      serviceTitle:
        typeof draftObj.serviceTitle === 'string'
          ? draftObj.serviceTitle
          : undefined,
      specialistId:
        typeof draftObj.specialistId === 'string'
          ? draftObj.specialistId
          : undefined,
      priceToman: draftPrice,
      durationMinutes:
        typeof draftObj.durationMinutes === 'number'
          ? draftObj.durationMinutes
          : undefined,
      dateJalali:
        typeof draftObj.dateJalali === 'string'
          ? draftObj.dateJalali
          : undefined,
      timeSlot:
        typeof draftObj.timeSlot === 'string' ? draftObj.timeSlot : undefined,
      referenceCode: `ZB-${refNumStr}`,
      depositPaidToman: draftDeposit ?? storedOrder.amountToman,
      paymentMethod: 'GATEWAY',
      paymentTrackingCode: refNumStr,
      zibalTrackId: trackId,
    });
    return true;
  };

  router.post('/payments/zibal/request', async (req: Request, res: Response) => {
    try {
      // مرچنت پرداخت همیشه فقط از پیکربندی امن سرور خوانده می‌شود و هرگز از درخواست کلاینت پذیرفته نمی‌شود
      const preferredMerchant =
        runtimeZibalMerchantId ||
        process.env.ZIBAL_MERCHANT_ID?.trim() ||
        process.env.PAYMENT_MERCHANT_ID?.trim() ||
        'zibal';
      const amountToman = Math.max(1000, Number(req.body?.amountToman) || 0);
      const amountRial = amountToman * 10; // زیبال مبلغ را به ریال دریافت می‌کند
      const description =
        String(req.body?.description || 'پرداخت در پلتفرم تایم تو').trim();
      const orderId = String(
        req.body?.orderId || `ZBL-${Date.now()}`
      ).trim();
      const callbackUrl =
        String(req.body?.callbackUrl || '').trim() ||
        `${req.protocol}://${req.get('host')}/booking/confirm?zibal_booking=1&orderId=${encodeURIComponent(orderId)}`;
      const mobile = String(req.body?.mobile || '').trim() || undefined;

      const requestZibal = async (
        merchantToUse: string,
        cbUrlToUse: string
      ) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const zibalRes = await fetch('https://gateway.zibal.ir/v1/request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              merchant: merchantToUse,
              amount: amountRial,
              callbackUrl: cbUrlToUse,
              description,
              orderId,
              ...(mobile ? { mobile } : {}),
            }),
            signal: controller.signal,
          });
          return (await zibalRes.json()) as {
            trackId?: number | string;
            result?: number;
            message?: string;
          };
        } finally {
          clearTimeout(timeout);
        }
      };

      let usedMerchant = preferredMerchant;
      let data = await requestZibal(preferredMerchant, callbackUrl);

      // اگر مرچنت واقعی روی آدرس پیش‌نمایش به خاطر دامنه callbackUrl خطای 105/113 داد، با دامنه اصلی timeto24.ir و همان مرچنت واقعی تلاش شود تا درگاه اصلی شاپرک باز شود
      if (
        (!data || data.result !== 100 || !data.trackId) &&
        preferredMerchant !== 'zibal'
      ) {
        try {
          const parsedCb = new URL(callbackUrl);
          if (parsedCb.hostname !== 'timeto24.ir') {
            const prodCallbackUrl = `https://timeto24.ir${parsedCb.pathname}${parsedCb.search}`;
            const retryProdDomain = await requestZibal(
              preferredMerchant,
              prodCallbackUrl
            );
            if (retryProdDomain?.result === 100 && retryProdDomain?.trackId) {
              data = retryProdDomain;
            }
          }
        } catch {
          // ignore URL parse error
        }
      }

      // تنها در صورتی که هیچ مرچنت واقعی تنظیم نشده باشد یا مرچنت واقعی غیرفعال باشد، با مرچنت زیبال باز شود
      let fallbackNotice: string | null = null;
      if (
        (!data || data.result !== 100 || !data.trackId) &&
        preferredMerchant !== 'zibal'
      ) {
        fallbackNotice = `مرچنت اختصاصی (${preferredMerchant}) توسط زیبال پذیرفته نشد (کد ${data?.result ?? -1}: ${data?.message || 'عدم تطابق دامنه یا مرچنت'}).`;
        usedMerchant = 'zibal';
        data = await requestZibal('zibal', callbackUrl);
      }

      if (data?.result === 100 && data?.trackId) {
        const trackIdStr = String(data.trackId);
        const orderMeta: ZibalStoredOrder = {
          orderId,
          trackId: trackIdStr,
          purpose:
            req.body?.purpose === 'wallet_topup' ? 'wallet_topup' : 'booking',
          businessId: String(req.body?.businessId || '').trim(),
          businessSlug: String(req.body?.businessSlug || '').trim(),
          businessName: String(req.body?.businessName || '').trim(),
          amountToman,
          customerPhone: String(req.body?.customerPhone || mobile || '').trim(),
          customerName: String(req.body?.customerName || '').trim(),
          bookingDraft:
            req.body?.bookingDraft && typeof req.body.bookingDraft === 'object'
              ? (req.body.bookingDraft as Record<string, unknown>)
              : undefined,
          createdAt: new Date().toISOString(),
        };
        zibalOrdersMap.set(`track:${trackIdStr}`, orderMeta);
        zibalOrdersMap.set(`order:${orderId}`, orderMeta);
        persistZibalOrders();
        const dbPool = resolveActivePoolForZibal();
        if (dbPool) {
          await upsertZibalOrderInDb(
            dbPool,
            orderMeta as unknown as Record<string, unknown>
          );
        }

        res.status(200).json({
          ok: true,
          provider: 'zibal',
          trackId: trackIdStr,
          paymentUrl: `https://gateway.zibal.ir/start/${trackIdStr}`,
          orderId,
          orderMeta,
          isSandbox: usedMerchant === 'zibal',
          fallbackNotice,
        });
        return;
      }

      res.status(400).json({
        ok: false,
        provider: 'zibal',
        trackId: null,
        paymentUrl: null,
        orderId,
        zibalResult: data?.result ?? -1,
        message:
          data?.message ||
          'خطا در دریافت توکن پرداخت از درگاه زیبال. لطفاً کد مرچنت زیبال را بررسی کنید.',
      });
    } catch (err) {
      res.status(502).json({
        ok: false,
        provider: 'zibal',
        trackId: null,
        paymentUrl: null,
        message:
          err instanceof Error
            ? `خطا در ارتباط با سرور درگاه زیبال: ${err.message}`
            : 'خطا در اتصال به درگاه پرداخت اینترنتی زیبال (gateway.zibal.ir).',
      });
    }
  });

  router.post('/payments/zibal/verify', async (req: Request, res: Response) => {
    try {
      const preferredMerchant =
        runtimeZibalMerchantId ||
        process.env.ZIBAL_MERCHANT_ID?.trim() ||
        process.env.PAYMENT_MERCHANT_ID?.trim() ||
        'zibal';
      const trackId = String(req.body?.trackId || '').trim();
      const orderId = String(req.body?.orderId || '').trim();
      if (!trackId) {
        res.status(400).json({
          ok: false,
          message: 'کد رهگیری زیبال (trackId) ارسال نشده است.',
        });
        return;
      }

      const storedOrder = await findZibalOrderByTrackOrOrder(trackId, orderId);
      const dbPool = resolveActivePoolForZibal();

      // اگر قبلاً این تراکنش در سرور تایید شده است، از شارژ مجدد جلوگیری شود اما اطمینان حاصل کنیم نوبت در DB همگام است
      if (storedOrder?.verifiedAt) {
        const existingRef = storedOrder.refNumber || trackId;
        let syncedBookingInDb = false;
        if (storedOrder.purpose === 'booking' && dbPool) {
          syncedBookingInDb = await persistVerifiedZibalBooking(
            storedOrder,
            existingRef,
            trackId
          )
            .then(() => true)
            .catch(() => false);
        }
        res.status(200).json({
          ok: true,
          verified: true,
          alreadyVerified: true,
          bookingSyncedOnServer: syncedBookingInDb,
          refNumber: existingRef,
          trackId,
          orderMeta: storedOrder,
          result: 201,
          status: 1,
          message: 'این تراکنش قبلاً با موفقیت تایید و ثبت شده است.',
        });
        return;
      }

      const verifyWithMerchant = async (merchantToUse: string) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const zibalRes = await fetch('https://gateway.zibal.ir/v1/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              merchant: merchantToUse,
              trackId: Number(trackId) || trackId,
            }),
            signal: controller.signal,
          });
          return (await zibalRes.json()) as {
            result?: number;
            refNumber?: number | string;
            amount?: number;
            status?: number;
            message?: string;
          };
        } finally {
          clearTimeout(timeout);
        }
      };

      let data = await verifyWithMerchant(preferredMerchant);
      if (
        data?.result !== 100 &&
        data?.result !== 201 &&
        preferredMerchant !== 'zibal'
      ) {
        data = await verifyWithMerchant('zibal');
      }

      // در درگاه زیبال: result=100 یعنی تایید موفق، result=201 یعنی قبلاً تایید شده
      const verified = data?.result === 100 || data?.result === 201;
      const refNumStr = data?.refNumber ? String(data.refNumber) : trackId;
      let bookingSyncedOnServer = false;
      if (verified && storedOrder) {
        storedOrder.verifiedAt = new Date().toISOString();
        storedOrder.refNumber = refNumStr;
        zibalOrdersMap.set(`track:${trackId}`, storedOrder);
        if (storedOrder.orderId) {
          zibalOrdersMap.set(`order:${storedOrder.orderId}`, storedOrder);
        }
        persistZibalOrders();
        if (dbPool) {
          await upsertZibalOrderInDb(
            dbPool,
            storedOrder as unknown as Record<string, unknown>
          );
        }

        // اگر تراکنش مربوط به بیعانه نوبت (purpose === 'booking') است، بلافاصله در سرور نوبت را ثبت و فقط به سالن‌دار پیامک بفرست
        if (storedOrder.purpose === 'booking') {
          bookingSyncedOnServer = await persistVerifiedZibalBooking(
            storedOrder,
            refNumStr,
            trackId
          )
            .then(() => Boolean(dbPool))
            .catch(() => false);
        }
      }

      res.status(200).json({
        ok: verified,
        verified,
        alreadyVerified: false,
        bookingSyncedOnServer,
        refNumber: refNumStr,
        trackId,
        orderMeta: storedOrder ?? null,
        result: data?.result,
        status: data?.status,
        message:
          data?.message ||
          (verified
            ? 'پرداخت در درگاه زیبال با موفقیت تایید شد.'
            : 'تراکنش در درگاه زیبال تایید نشد یا توسط کاربر لغو گردیده است.'),
      });
    } catch {
      res.status(502).json({
        ok: false,
        verified: false,
        message: 'خطا در استعلام وضعیت تراکنش از درگاه زیبال.',
      });
    }
  });

  router.post(
    '/payments/zibal/reconcile-pending',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    async (req: Request, res: Response) => {
      try {
        const dbPool = resolveActivePoolForZibal();
        const preferredMerchant =
          runtimeZibalMerchantId ||
          process.env.ZIBAL_MERCHANT_ID?.trim() ||
          process.env.PAYMENT_MERCHANT_ID?.trim() ||
          'zibal';

        const dbOrders = dbPool ? await getZibalOrdersFromDb(dbPool) : [];
        const allOrdersMap = new Map<string, ZibalStoredOrder>();
        for (const item of zibalOrdersMap.values()) {
          if (item?.trackId) allOrdersMap.set(item.trackId, item);
        }
        for (const raw of dbOrders) {
          const item = raw as unknown as ZibalStoredOrder;
          if (item?.trackId) allOrdersMap.set(item.trackId, item);
        }

        const requestedTrackIds = Array.isArray(req.body?.trackIds)
          ? new Set(req.body.trackIds.map((t: unknown) => String(t || '').trim()))
          : null;

        const candidates = Array.from(allOrdersMap.values()).filter((ord) => {
          if (!ord?.trackId) return false;
          if (requestedTrackIds && requestedTrackIds.size > 0) {
            return requestedTrackIds.has(ord.trackId);
          }
          return !ord.verifiedAt;
        });

        const verifyOne = async (trackIdStr: string, merchantToUse: string) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          try {
            const zibalRes = await fetch('https://gateway.zibal.ir/v1/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                merchant: merchantToUse,
                trackId: Number(trackIdStr) || trackIdStr,
              }),
              signal: controller.signal,
            });
            return (await zibalRes.json()) as {
              result?: number;
              refNumber?: number | string;
              status?: number;
            };
          } finally {
            clearTimeout(timeout);
          }
        };

        const recoveredOrders: ZibalStoredOrder[] = [];
        for (const order of candidates.slice(0, 25)) {
          let verifyRes = await verifyOne(order.trackId, preferredMerchant).catch(
            () => null
          );
          if (
            verifyRes?.result !== 100 &&
            verifyRes?.result !== 201 &&
            preferredMerchant !== 'zibal'
          ) {
            verifyRes = await verifyOne(order.trackId, 'zibal').catch(() => null);
          }
          if (verifyRes?.result === 100 || verifyRes?.result === 201) {
            const refNumStr = verifyRes.refNumber
              ? String(verifyRes.refNumber)
              : order.trackId;
            order.verifiedAt = order.verifiedAt || new Date().toISOString();
            order.refNumber = refNumStr;
            zibalOrdersMap.set(`track:${order.trackId}`, order);
            if (order.orderId) zibalOrdersMap.set(`order:${order.orderId}`, order);
            if (dbPool) {
              await upsertZibalOrderInDb(
                dbPool,
                order as unknown as Record<string, unknown>
              );
            }
            if (order.purpose === 'booking') {
              await persistVerifiedZibalBooking(order, refNumStr, order.trackId).catch(
                () => false
              );
            }
            recoveredOrders.push(order);
          }
        }
        if (recoveredOrders.length > 0) {
          persistZibalOrders();
        }

        res.status(200).json({
          ok: true,
          checkedCount: candidates.length,
          recoveredCount: recoveredOrders.length,
          recoveredOrders,
        });
      } catch (err) {
        handleRealModeRouteError(res, err);
      }
    }
  );

  return router;
}
