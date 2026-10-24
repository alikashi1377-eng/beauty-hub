import express, { Express, Request, Response, NextFunction } from 'express';
import { loadServerEnv, ServerEnvConfig } from './config/env';
import { checkDatabaseHealth } from './db/pool';

export function createApiApp(customEnv?: ServerEnvConfig): Express {
  const app = express();

  app.disable('x-powered-by');
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

      next();
    }
  );

  /** پاسخ استاندارد 404 برای مسیرهای API که هنوز پیاده‌سازی نشده‌اند */
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({
      ok: false,
      errorCode: 'API_ENDPOINT_NOT_FOUND',
      message: 'مسیر API درخواستی در این فاز تعریف نشده است.',
    });
  });

  return app;
}
