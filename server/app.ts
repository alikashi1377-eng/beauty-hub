import express, { Express, Request, Response, NextFunction } from 'express';
import {
  assertProductionSecurityEnv,
  loadServerEnv,
  ServerEnvConfig,
} from './config/env';
import { checkDatabaseHealth } from './db/pool';
import { createApiV1Router } from './routes/apiV1';

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

    const smsConfigured =
      config.nodeEnv === 'production'
        ? config.sms.provider !== 'disabled' &&
          config.sms.provider !== 'console' &&
          Boolean(config.sms.apiKey)
        : config.sms.provider !== 'disabled';

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
        provider: config.sms.provider,
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
