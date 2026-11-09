import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApiApp } from './server/app';
import { loadServerEnv } from './server/config/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPRESSIBLE_CONTENT_TYPE_RE =
  /^(text\/|application\/(javascript|json|manifest\+json|xml|xhtml\+xml)|image\/svg\+xml)/i;

function attachHttpCompression(app: express.Express) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    const supportsGzip = /\bgzip\b/i.test(acceptEncoding);
    if (!supportsGzip) {
      next();
      return;
    }

    const origSend = res.send.bind(res);
    res.send = ((body?: unknown) => {
      if (res.headersSent || res.getHeader('Content-Encoding')) {
        return origSend(body);
      }
      const contentType = String(res.getHeader('Content-Type') || '');
      if (
        contentType &&
        !COMPRESSIBLE_CONTENT_TYPE_RE.test(contentType)
      ) {
        return origSend(body);
      }
      const rawBuffer = Buffer.isBuffer(body)
        ? body
        : typeof body === 'string'
          ? Buffer.from(body, 'utf8')
          : null;
      if (!rawBuffer || rawBuffer.byteLength < 1024) {
        return origSend(body);
      }
      try {
        const compressed = zlib.gzipSync(rawBuffer, {
          level: zlib.constants.Z_BEST_SPEED,
        });
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Length', String(compressed.byteLength));
        return origSend(compressed);
      } catch {
        return origSend(body);
      }
    }) as typeof res.send;

    next();
  });
}

async function startServer() {
  const config = loadServerEnv();
  const app = createApiApp(config);

  attachHttpCompression(app);

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
      // کش ۱ ساله (365d + immutable) برای فایل‌های استاتیک، فونت‌ها و تصاویر جهت رفع کامل هشدار PageSpeed Cache TTL
      app.use(
        '/assets',
        express.static(path.join(distPath, 'assets'), {
          maxAge: '365d',
          immutable: true,
        })
      );
      app.use(
        '/fonts',
        express.static(path.join(distPath, 'fonts'), {
          maxAge: '365d',
          immutable: true,
        })
      );

      // فشرده‌سازی Gzip برای فایل‌های متنی بزرگ استاتیک (JS و CSS) در Production
      app.get(/\.(js|css|svg|json|webmanifest|txt)$/i, (req, res, next) => {
        const acceptEncoding = String(req.headers['accept-encoding'] || '');
        if (!/\bgzip\b/i.test(acceptEncoding)) {
          next();
          return;
        }
        const safeRelPath = path
          .normalize(decodeURIComponent(req.path))
          .replace(/^(\.\.(\/|\\|$))+/, '');
        const fullFilePath = path.join(distPath, safeRelPath);
        if (
          !fullFilePath.startsWith(distPath) ||
          !fs.existsSync(fullFilePath) ||
          !fs.statSync(fullFilePath).isFile()
        ) {
          next();
          return;
        }

        const ext = path.extname(fullFilePath).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.js': 'application/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.svg': 'image/svg+xml',
          '.json': 'application/json; charset=utf-8',
          '.webmanifest': 'application/manifest+json; charset=utf-8',
          '.txt': 'text/plain; charset=utf-8',
        };
        if (mimeMap[ext]) {
          res.setHeader('Content-Type', mimeMap[ext]);
        }
        if (
          req.path.startsWith('/assets/') ||
          req.path.startsWith('/fonts/') ||
          ext === '.svg'
        ) {
          res.setHeader(
            'Cache-Control',
            'public, max-age=31536000, immutable'
          );
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');

        const rawStream = fs.createReadStream(fullFilePath);
        const gzipStream = zlib.createGzip({
          level: zlib.constants.Z_BEST_SPEED,
        });
        rawStream.pipe(gzipStream).pipe(res);
      });

      app.use(
        express.static(distPath, {
          index: false,
          maxAge: '30d',
          setHeaders: (res, filePath) => {
            if (/\.(woff2|webp|jpg|jpeg|png|svg|ico)$/i.test(filePath)) {
              res.setHeader(
                'Cache-Control',
                'public, max-age=31536000, immutable'
              );
            }
          },
        })
      );

      // پشتیبانی کامل از مسیرهای React Router هنگام Refresh مستقیم صفحه در Production
      app.get('*', (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache');
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


