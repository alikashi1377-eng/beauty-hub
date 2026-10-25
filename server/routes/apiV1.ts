import crypto from 'node:crypto';
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
  deleteGalleryItemInDb,
  getAdminOverviewPayloadInDb,
  getBootstrapPayload,
  getBusinessAvailabilityInDb,
  getBusinessWorkspacePayloadInDb,
  getCustomerPrivatePayloadInDb,
  onboardBusinessInDb,
  requestOtpInDb,
  softDeleteServiceInDb,
  toggleFavoriteBusinessInDb,
  updateAppointmentStatusInDb,
  updateBusinessApprovalInDb,
  updateBusinessProfileInDb,
  updateBusinessWorkingHoursInDb,
  updateCategoryInDb,
  updateCustomerProfileInDb,
  updateServiceInDb,
  updateSpecialistInDb,
  verifyOtpInDb,
} from '../repositories/beautyhubRepository';
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
    errMsg === 'SPECIALIST_NOT_ASSIGNED_TO_SERVICE'
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
        'ارسال پیامک از طریق سرویس‌دهنده پیامکی تایید نشد؛ لطفاً لاگ کنسول سرور (BeautyHub SMS Gateway) و تنظیمات پنل پیامک را بررسی کنید.',
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
          typeof req.query.dateJalali === 'string' && req.query.dateJalali.trim()
            ? req.query.dateJalali.trim()
            : '۱۴۰۵/۰۸/۰۵';
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
   * ۶. راه‌اندازی و ثبت کسب‌وکار جدید (نیازمند کاربر احراز هویت‌شده)
   * POST /api/v1/businesses/onboard
   */
  router.post(
    '/businesses/onboard',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const created = await onboardBusinessInDb(
          pool,
          req.authUser!,
          req.body
        );
        const data = await getBootstrapPayload(pool);
        res.status(201).json({
          ok: true,
          mode: 'real',
          businessId: created.businessId,
          slug: created.slug,
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

  /**
   * ۱۰. ثبت نوبت جدید و تغییر وضعیت نوبت (/booking/*, /me/appointments, /app/appointments)
   */
  router.post(
    '/appointments',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createAppointmentInDb(pool, req.authUser!, req.body);
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
   * ۱۲-الف. ثبت دیدگاه و امتیاز واقعی مراجعان (/salon/:slug)
   * POST /api/v1/reviews
   */
  router.post(
    '/reviews',
    requireAuth,
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const item = await createReviewInDb(pool, req.authUser!, req.body);
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
   * ۱۳. عملیات پنل مدیریت کلان پلتفرم (/admin/*) محدود به PLATFORM_ADMIN
   */
  router.patch(
    '/admin/businesses/:id/approval',
    requireAuth,
    requireRole('PLATFORM_ADMIN'),
    async (req: Request, res: Response) => {
      const { pool } = await resolvePoolOrFail(res);
      if (!pool) return;

      try {
        const status = req.body?.status as ApprovalStatus;
        await updateBusinessApprovalInDb(pool, req.params.id, status);
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
        smsConfig: config.sms,
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
      const phone = String(req.body?.phone || '');
      const code = String(req.body?.code || '');
      const ip = String(req.ip || req.socket.remoteAddress || '127.0.0.1');
      const ua = String(req.headers['user-agent'] || 'web');
      const result = await verifyOtpInDb(
        pool,
        phone,
        code,
        ip,
        ua,
        customEnv?.sessionSecret ?? undefined
      );
      if (!result.verified) {
        res.status(401).json({
          ok: false,
          mode: 'real',
          errorCode: result.outcomeCode,
          remainingAttempts: result.remainingAttempts,
          message:
            result.outcomeCode === 'OTP_LOCKED'
              ? 'کد تایید به دلیل تلاش‌های ناموفق متوالی قفل شد. لطفاً کد جدید درخواست کنید.'
              : result.outcomeCode === 'OTP_EXPIRED'
                ? 'مهلت زمانی کد تایید به پایان رسیده است.'
                : result.outcomeCode === 'TOO_MANY_VERIFY_ATTEMPTS_FROM_IP'
                  ? 'تعداد تلاش‌های تایید کد از این آدرس IP بیش از حد مجاز است.'
                  : 'کد واردشده صحیح نیست.',
        });
        return;
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
        user: result.user,
        message: 'احراز هویت با موفقیت انجام شد.',
      });
    } catch (err) {
      handleRealModeRouteError(res, err);
    }
  });

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

  return router;
}
