import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApiApp } from './server/app';
import { loadServerEnv } from './server/config/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const config = loadServerEnv();
  const app = createApiApp(config);

  if (config.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexHtmlPath = path.join(distPath, 'index.html');

    if (fs.existsSync(distPath) && fs.existsSync(indexHtmlPath)) {
      app.use(
        express.static(distPath, {
          index: false,
          maxAge: '1h',
        })
      );

      // پشتیبانی کامل از مسیرهای React Router هنگام Refresh مستقیم صفحه در Production
      app.get('*', (_req, res) => {
        res.sendFile(indexHtmlPath);
      });
    } else {
      console.error(
        '[BeautyHub Server] پوشه dist یافت نشد. پیش از اجرای سرور در حالت Production، دستور npm run build را اجرا کنید.'
      );
      app.get('*', (_req, res) => {
        res.status(503).send(
          'Frontend build artifacts (dist/) not found. Please run "npm run build" before starting in production.'
        );
      });
    }
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(
      `[BeautyHub Server] Listening on http://0.0.0.0:${config.port} (env=${config.nodeEnv}, mode=${config.dataMode})`
    );
  });
}

startServer().catch((err) => {
  console.error(
    '[BeautyHub Server] Failed to start server:',
    err instanceof Error ? err.message : 'Unknown error'
  );
  process.exit(1);
});

