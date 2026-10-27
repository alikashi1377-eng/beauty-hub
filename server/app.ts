import express, { Express, Request, Response, NextFunction } from 'express';
import {
   clearSessionCookie,
  extractSessionTokenFromRequest,
  resolveAuthenticatedSessionFromDb,
  verifySignedSessionToken,
} from './auth/session';
import {
  assertProductionSecurityEnv,
  loadServerEnv,
  resolveSessionSecret,
  ServerEnvConfig,
} from './config/env';
import { checkDatabaseHealth, getOrCreatePool } from './db/pool';
import { createApiV1Router } from './routes/apiV1';
import {
  maskApiKeyForDisplay,
  resolveEffectiveSmsConfig,
  sendOtpSmsViaGateway,
  setRuntimeSmsOverride,
  SmsProviderType,
} from './services/smsGateway';

export function createApiApp(
  customEnv?: ServerEnvConfig,
  customPool?: import('pg').Pool
): Express {
  const initialConfig = customEnv ?? loadServerEnv();
  assertProductionSecurityEnv(initialConfig);

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  /** هدرهای امنیتی استاندارد و سیاست سخت‌گیرانه CORS برای درخواست‌های API */
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const origin = req.headers.origin;
    if (origin) {
      const host = req.headers.host || '';
      try {
        const originUrl = new URL(origin);
        if (originUrl.host === host) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Vary', 'Origin');
        }
      } catch {
        // نادیده گرفتن Origin نامعتبر بدون باز کردن دسترسی Cross-Origin
      }
    }

    next();
  });

  app.use(express.json({ limit: '1mb' }));

  /**
   * اندپوینت بررسی سلامت سرویس و وضعیت اتصال دیتابیس
   * GET /api/v1/health
   * هیچ داده حساس، رمز عبور، Connection String یا Stack Trace در این خروجی قرار نمی‌گیرد.
   */
  app.get('/api/v1/health', async (_req: Request, res: Response) => {
    const config = customEnv ?? loadServerEnv();
    const dbHealth = await checkDatabaseHealth(config);

    const isHealthy =
      config.dataMode === 'mock' ||
      (config.dataMode === 'real' && dbHealth.connected);

    const statusCode = isHealthy ? 200 : 503;

    const effectiveSms = customEnv
      ? config.sms
      : resolveEffectiveSmsConfig(config.sms);

    const smsConfigured =
      config.nodeEnv === 'production'
        ? effectiveSms.provider !== 'disabled' &&
          effectiveSms.provider !== 'console' &&
          Boolean(effectiveSms.apiKey)
        : effectiveSms.provider !== 'disabled';

    res.status(statusCode).json({
      ok: isHealthy,
      service: 'beautyhub-api',
      status: isHealthy ? 'ok' : 'degraded',
      mode: config.dataMode,
      database: {
        configured: dbHealth.configured,
        connected: dbHealth.connected,
        status: dbHealth.status,
        sslMode: dbHealth.sslMode,
        latencyMs: dbHealth.latencyMs,
        ...(dbHealth.errorCode ? { errorCode: dbHealth.errorCode } : {}),
        message: dbHealth.message,
      },
      smsGateway: {
        provider: effectiveSms.provider,
        configured: smsConfigured,
      },
      paymentGateway: {
        provider: config.paymentGatewayProvider,
        onlinePaymentRequiredForBooking: false,
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * بررسی دسترسی مدیر کل برای تنظیمات پیامک در حالت Real
   */
  const ensureSmsAdminAccess = async (
    req: Request,
    res: Response
  ): Promise<boolean> => {
    const config = customEnv ?? loadServerEnv();
    if (config.dataMode === 'mock') {
      return true;
    }

    const rawToken = extractSessionTokenFromRequest(req);
    if (!rawToken) {
      res.status(401).json({
        ok: false,
        errorCode: 'AUTHENTICATION_REQUIRED',
        message: 'برای تغییر تنظیمات پیامک، ابتدا وارد حساب مدیر کل شوید.',
      });
      return false;
    }

    let sessionSecret: string;
    try {
      sessionSecret =
        config.sessionSecret ?? resolveSessionSecret(process.env);
    } catch {
      res.status(500).json({
        ok: false,
        errorCode: 'SESSION_SECRET_NOT_CONFIGURED',
        message: 'کلید SESSION_SECRET تنظیم نشده است.',
      });
      return false;
    }

    const verifiedToken = verifySignedSessionToken(rawToken, sessionSecret);
    if (!verifiedToken) {
      res.status(401).json({
        ok: false,
        errorCode: 'INVALID_SESSION',
        message: 'نشست کاربری معتبر نیست.',
      });
      return false;
    }

    const pool = customPool ?? getOrCreatePool(config);
    if (!pool) {
      res.status(503).json({
        ok: false,
        errorCode: 'REAL_MODE_DATABASE_UNAVAILABLE',
        message: 'اتصال به دیتابیس برقرار نیست.',
      });
      return false;
    }

    const lookup = await resolveAuthenticatedSessionFromDb(
      pool,
      verifiedToken.sessionId,
      verifiedToken.tokenHash
    );
    if (lookup.status !== 'ACTIVE' || !lookup.user.isPlatformAdmin) {
      res.status(403).json({
        ok: false,
        errorCode: 'ADMIN_ACCESS_DENIED',
        message: 'فقط مدیر کل پلتفرم مجاز به تغییر تنظیمات پیامک است.',
      });
      return false;
    }

    return true;
  };

  /**
   * دریافت وضعیت فعلی درگاه پیامکی (ملی‌پیامک و سایر درگاه‌ها)
   * GET /api/v1/sms-gateway/status
   */
  app.get('/api/v1/sms-gateway/status', async (req: Request, res: Response) => {
    const allowed = await ensureSmsAdminAccess(req, res);
    if (!allowed) return;

    const config = customEnv ?? loadServerEnv();
    const effective = resolveEffectiveSmsConfig(config.sms);
    const isReady =
      effective.provider === 'melipayamak'
        ? Boolean(effective.apiKey && effective.template)
        : effective.provider !== 'disabled';

    res.status(200).json({
      ok: true,
      provider: effective.provider,
      configured: isReady,
      maskedApiKey: maskApiKeyForDisplay(effective.apiKey),
      template: effective.template ?? '',
      sender: effective.sender ?? '',
      apiUrl: effective.apiUrl ?? '',
    });
  });

  /**
   * ذخیره و فعال‌سازی آنی تنظیمات ملی‌پیامک بدون نیاز به ری‌استارت سرور
   * POST /api/v1/sms-gateway/configure
   */
  app.post(
    '/api/v1/sms-gateway/configure',
    async (req: Request, res: Response) => {
      const allowed = await ensureSmsAdminAccess(req, res);
      if (!allowed) return;

      const providerRaw = String(
        req.body?.provider ?? 'melipayamak'
      ).toLowerCase() as SmsProviderType;
      const apiKeyRaw = String(req.body?.apiKey ?? '').trim();
      const templateRaw = String(req.body?.template ?? '').trim();
      const senderRaw = String(req.body?.sender ?? '').trim();

      if (providerRaw === 'melipayamak' && (!apiKeyRaw || !templateRaw)) {
        res.status(400).json({
          ok: false,
          errorCode: 'MISSING_MELIPAYAMAK_CREDENTIALS',
          message:
            'لطفاً هم «کلید وب‌سرویس (API Key)» و هم «کد الگوی تاییدشده (bodyId)» ملی‌پیامک را وارد کنید.',
        });
        return;
      }

      const currentEffective = resolveEffectiveSmsConfig(
        (customEnv ?? loadServerEnv()).sms
      );

      const finalApiKey =
        apiKeyRaw === '__KEEP_EXISTING__' && currentEffective.apiKey
          ? currentEffective.apiKey
          : apiKeyRaw;

      const updated = setRuntimeSmsOverride({
        provider: providerRaw,
        apiKey: finalApiKey,
        template: templateRaw,
        sender: senderRaw || null,
      });

      res.status(200).json({
        ok: true,
        provider: updated?.provider ?? providerRaw,
        configured: Boolean(updated?.apiKey && updated?.template),
        maskedApiKey: maskApiKeyForDisplay(updated?.apiKey ?? null),
        template: updated?.template ?? '',
        sender: updated?.sender ?? '',
        message:
          'تنظیمات درگاه ملی‌پیامک با موفقیت ذخیره و به صورت آنی روی سرور فعال شد.',
      });
    }
  );

  /**
   * ارسال پیامک تست زنده از طریق درگاه ملی‌پیامک برای اطمینان از صحت اتصال
   * POST /api/v1/sms-gateway/test-send
   */
  app.post(
    '/api/v1/sms-gateway/test-send',
    async (req: Request, res: Response) => {
      const allowed = await ensureSmsAdminAccess(req, res);
      if (!allowed) return;

      const phone = String(req.body?.phone ?? '').trim();
      if (!/^09\d{9}$/.test(phone)) {
        res.status(400).json({
          ok: false,
          errorCode: 'INVALID_IRAN_MOBILE_PHONE',
          message:
            'لطفاً یک شماره موبایل معتبر ۱۱ رقمی (مثلاً 09123456789) برای دریافت پیامک تست وارد کنید.',
        });
        return;
      }

      const config = customEnv ?? loadServerEnv();
      const effectiveSms = resolveEffectiveSmsConfig(config.sms);
      const testOtpCode = String(Math.floor(100000 + Math.random() * 900000));

      const delivery = await sendOtpSmsViaGateway(
        phone,
        testOtpCode,
        effectiveSms,
        effectiveSms.provider === 'melipayamak' ? 'production' : config.nodeEnv
      );

      if (!delivery.sent) {
        res.status(400).json({
          ok: false,
          sent: false,
          provider: delivery.provider,
          errorCode: delivery.errorCode ?? 'SMS_DELIVERY_FAILED',
          providerStatusText: delivery.providerStatusText ?? '',
          message:
            delivery.errorCode === 'SMS_INVALID_API_KEY'
              ? 'کلید وب‌سرویس (API Key) ملی‌پیامک معتبر نیست. مطمئن شوید توکن وب‌سرویس اشتراکی کنسول (console.melipayamak.com) را وارد کرده‌اید.'
              : delivery.errorCode === 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED'
                ? 'کد الگوی پیامک (bodyId) باید یک عدد صحیح مثبت و تاییدشده در بخش «وب‌سرویس خدماتی -> الگوها» باشد.'
                : delivery.errorCode === 'SMS_ARGS_MISMATCH'
                  ? 'متن الگوی پیامک در ملی‌پیامک باید دقیقاً شامل یک متغیر {0} برای کد تایید باشد.'
                  : delivery.errorCode === 'SMS_INSUFFICIENT_CREDIT'
                    ? 'اعتبار حساب ملی‌پیامک شما برای ارسال پیامک کافی نیست.'
                    : `ارسال پیامک تست انجام نشد (${delivery.errorCode ?? 'خطای وب‌سرویس'}). ${delivery.providerStatusText || ''}`,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        sent: true,
        provider: delivery.provider,
        providerMessageId: delivery.providerMessageId,
        message: `پیامک تست با موفقیت به شماره ${phone} ارسال شد (کد پیگیری: ${delivery.providerMessageId ?? 'ثبت‌شده'}).`,
      });
    }
  );

  /**
   * گارد امنیتی درخواست‌های نوشتن (POST / PUT / PATCH / DELETE) در مسیرهای /api/v1/*
   * - در حالت mock: هیچ داده‌ای نباید در دیتابیس نوشته شود.
   * - در حالت real و قطع بودن دیتابیس: درخواست‌های نوشتن صریحاً با خطای 503 رد می‌شوند و به حالت mock منتقل نمی‌شوند.
   */
  app.use(
    '/api/v1',
    async (req: Request, res: Response, next: NextFunction) => {
      const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
        req.method.toUpperCase()
      );

      if (!isWriteMethod) {
        return next();
      }

      const config = customEnv ?? loadServerEnv();

      if (config.dataMode === 'mock') {
        res.status(403).json({
          ok: false,
          mode: 'mock',
          errorCode: 'MOCK_MODE_DB_WRITE_DISABLED',
          message:
            'سرور در حالت دمو (mock) قرار دارد و هیچ عملیاتی روی دیتابیس انجام نمی‌شود.',
        });
        return;
      }

      if (!customPool) {
        const dbHealth = await checkDatabaseHealth(config);
        if (!dbHealth.connected) {
          res.status(503).json({
            ok: false,
            mode: 'real',
            errorCode: dbHealth.errorCode ?? 'REAL_MODE_DATABASE_UNAVAILABLE',
            message:
              'ارتباط با دیتابیس PostgreSQL برقرار نیست؛ عملیات ثبت داده واقعی انجام نشد و به حالت آزمایشی منتقل نمی‌شود.',
          });
          return;
        }
      }

      next();
    }
  );

  /** مسیریاب اصلی API نسخه ۱ متصل به PostgreSQL */
  app.use('/api/v1', createApiV1Router(customEnv, customPool));

  /** پاسخ استاندارد 404 برای مسیرهای API که تعریف نشده‌اند */
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      ok: false,
      errorCode: 'API_ENDPOINT_NOT_FOUND',
      message: 'مسیر API درخواستی در این فاز تعریف نشده است.',
    });
  });

  /**
   * گارد امنیتی سمت سرور برای مسیرهای کنسول مدیریت (/admin و /admin/*)
   * - هیچ کاربری بدون نشست معتبر سمت سرور (کوکی HttpOnly امضاشده با SESSION_SECRET) و تایید نقش PLATFORM_ADMIN از دیتابیس
   *   امکان دسترسی به صفحات /admin را ندارد.
   * - کاربر احراز هویت‌نشده به صفحه ورود (/login?redirect=...) هدایت می‌شود (یا 401 در صورت درخواست JSON).
   * - کاربر احراز هویت‌شده که نقش PLATFORM_ADMIN ندارد، پاسخ صریح 403 Forbidden دریافت می‌کند.
   */
  app.use(
    '/admin',
    async (req: Request, res: Response, next: NextFunction) => {
      const config = customEnv ?? loadServerEnv();
      const isProd = config.nodeEnv === 'production';
      const acceptHeader = String(req.headers.accept || '');
      const wantsJson =
        acceptHeader.includes('application/json') &&
        !acceptHeader.includes('text/html');

      const handleUnauthenticated = (shouldClearCookie = false) => {
        if (shouldClearCookie) {
          clearSessionCookie(res, isProd);
        }
        if (wantsJson) {
          res.status(401).json({
            ok: false,
            mode: config.dataMode,
            errorCode: 'AUTHENTICATION_REQUIRED',
            message:
              'برای دسترسی به کنسول مدیریت کلان، ورود به حساب کاربری الزامی است.',
          });
          return;
        }
        const targetPath = req.originalUrl?.startsWith('/admin')
          ? req.originalUrl
          : '/admin';
        res.redirect(
          302,
          `/login?redirect=${encodeURIComponent(targetPath)}`
        );
      };

      const handleForbidden = () => {
        if (wantsJson) {
          res.status(403).json({
            ok: false,
            mode: config.dataMode,
            errorCode: 'ADMIN_ACCESS_DENIED',
            message:
              'دسترسی به کنسول مدیریت کلان فقط برای مدیر کل سامانه (PLATFORM_ADMIN) مجاز است.',
          });
          return;
        }
        res
          .status(403)
          .type('html')
          .send(
            `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>۴۰۳ - عدم مجوز دسترسی | BeautyHub</title><style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#FAF9FC;color:#120F1D;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}main{max-width:460px;width:100%;background:#fff;border:1px solid #E6E3EE;border-radius:16px;padding:32px;text-align:center;box-shadow:0 4px 20px rgba(18,15,29,.05)}h1{font-size:20px;margin:0 0 12px;color:#9D174D}p{font-size:14px;line-height:1.8;color:#4A4458;margin:0 0 24px}a{display:inline-block;padding:10px 20px;background:#2A0F54;color:#fff;text-decoration:none;border-radius:12px;font-size:13px;font-weight:600}</style></head><body><main><h1>۴۰۳ — عدم مجوز دسترسی (Forbidden)</h1><p>حساب کاربری شما دارای نقش مدیر کل سامانه (PLATFORM_ADMIN) نیست و مجوز ورود به کنسول مدیریت را ندارد.</p><a href="/">بازگشت به صفحه اصلی</a></main></body></html>`
          );
      };

      if (config.dataMode === 'mock') {
        handleUnauthenticated(false);
        return;
      }

      const rawToken = extractSessionTokenFromRequest(req);
      if (!rawToken) {
        handleUnauthenticated(false);
        return;
      }

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

      const verifiedToken = verifySignedSessionToken(rawToken, sessionSecret);
      if (!verifiedToken) {
        handleUnauthenticated(true);
        return;
      }

      const pool = customPool ?? getOrCreatePool(config);
      if (!pool) {
        res.status(503).json({
          ok: false,
          mode: 'real',
          errorCode: 'REAL_MODE_DATABASE_UNAVAILABLE',
          message: 'اتصال به دیتابیس PostgreSQL برقرار نیست.',
        });
        return;
      }

      try {
        const lookup = await resolveAuthenticatedSessionFromDb(
          pool,
          verifiedToken.sessionId,
          verifiedToken.tokenHash
        );

        if (lookup.status !== 'ACTIVE') {
          handleUnauthenticated(true);
          return;
        }

        if (
          !lookup.user.isPlatformAdmin ||
          !lookup.user.roles.includes('PLATFORM_ADMIN')
        ) {
          handleForbidden();
          return;
        }

        req.authUser = lookup.user;
        next();
      } catch {
        res.status(503).json({
          ok: false,
          mode: 'real',
          errorCode: 'SESSION_VALIDATION_ERROR',
          message: 'خطا در بررسی اعتبار نشست کاربری در دیتابیس.',
        });
      }
    }
  );

  /** مدیریت متمرکز خطا بدون افشای Stack Trace یا جزئیات داخلی سرور */
  app.use(
    (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const isJsonSyntaxError =
        err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400;

      if (isJsonSyntaxError) {
        res.status(400).json({
          ok: false,
          errorCode: 'INVALID_JSON_PAYLOAD',
          message: 'فرمت JSON ارسالی معتبر نیست.',
        });
        return;
      }

      res.status(500).json({
        ok: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'خطای داخلی سرور رخ داد.',
      });
    }
  );

  return app;
}
