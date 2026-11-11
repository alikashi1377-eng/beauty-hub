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

interface CachedCompressedAsset {
  raw: Buffer;
  gzip: Buffer;
  br: Buffer;
  mtimeMs: number;
}

const staticCompressionCache = new Map<string, CachedCompressedAsset>();

function getCompressedAsset(fullFilePath: string): CachedCompressedAsset {
  const stat = fs.statSync(fullFilePath);
  const existing = staticCompressionCache.get(fullFilePath);
  if (existing && existing.mtimeMs === stat.mtimeMs) {
    return existing;
  }
  const raw = fs.readFileSync(fullFilePath);
  const gzip = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION });
  const br = zlib.brotliCompressSync(raw, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
    },
  });
  const entry: CachedCompressedAsset = {
    raw,
    gzip,
    br,
    mtimeMs: stat.mtimeMs,
  };
  staticCompressionCache.set(fullFilePath, entry);
  return entry;
}

function attachHttpCompression(app: express.Express) {
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    const supportsBrotli = /\bbr\b/i.test(acceptEncoding);
    const supportsGzip = /\bgzip\b/i.test(acceptEncoding);
    if (!supportsBrotli && !supportsGzip) {
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
      if (!rawBuffer || rawBuffer.byteLength < 150) {
        return origSend(body);
      }
      try {
        if (supportsBrotli) {
          const compressed = zlib.brotliCompressSync(rawBuffer, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
            },
          });
          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Vary', 'Accept-Encoding');
          res.setHeader('Content-Length', String(compressed.byteLength));
          return origSend(compressed);
        }
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
      // ۱. فشرده‌سازی فوق‌سریع Brotli / Gzip با کش حافظه برای تمام فایل‌های متنی (قبل از express.static تا /assets/*.css و /assets/*.js حتماً فشرده شوند)
      app.get(/\.(js|css|svg|json|webmanifest|txt)$/i, (req, res, next) => {
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
          req.path === '/sw.js' ||
          req.path === '/manifest.webmanifest'
        ) {
          res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          );
        } else if (
          req.path.startsWith('/assets/') ||
          req.path.startsWith('/fonts/') ||
          ext === '.svg'
        ) {
          res.setHeader(
            'Cache-Control',
            'public, max-age=31536000, immutable'
          );
        } else {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        }
        res.setHeader('Vary', 'Accept-Encoding');

        try {
          const cached = getCompressedAsset(fullFilePath);
          const acceptEncoding = String(req.headers['accept-encoding'] || '');
          if (/\bbr\b/i.test(acceptEncoding)) {
            res.setHeader('Content-Encoding', 'br');
            res.setHeader('Content-Length', String(cached.br.byteLength));
            res.end(cached.br);
            return;
          }
          if (/\bgzip\b/i.test(acceptEncoding)) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', String(cached.gzip.byteLength));
            res.end(cached.gzip);
            return;
          }
          res.setHeader('Content-Length', String(cached.raw.byteLength));
          res.end(cached.raw);
        } catch {
          next();
        }
      });

      // ۲. کش ۱ ساله (365d + immutable) برای فونت‌ها و تصاویر استاتیک
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

      app.use(
        express.static(distPath, {
          index: false,
          maxAge: '30d',
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
              res.setHeader(
                'Cache-Control',
                'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
              );
            } else if (/\.(woff2|webp|jpg|jpeg|png|svg|ico)$/i.test(filePath)) {
              res.setHeader(
                'Cache-Control',
                'public, max-age=31536000, immutable'
              );
            }
          },
        })
      );

      // ۳. ارسال index.html با فشرده‌سازی کامل Brotli / Gzip و جلوگیری کامل از کش شدن نسخه قدیمی HTML
      app.get('*', (req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        );
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Vary', 'Accept-Encoding');
        try {
          const cachedHtml = getCompressedAsset(indexHtmlPath);
          const acceptEncoding = String(req.headers['accept-encoding'] || '');
          if (/\bbr\b/i.test(acceptEncoding)) {
            res.setHeader('Content-Encoding', 'br');
            res.setHeader('Content-Length', String(cachedHtml.br.byteLength));
            res.end(cachedHtml.br);
            return;
          }
          if (/\bgzip\b/i.test(acceptEncoding)) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', String(cachedHtml.gzip.byteLength));
            res.end(cachedHtml.gzip);
            return;
          }
          res.setHeader('Content-Length', String(cachedHtml.raw.byteLength));
          res.end(cachedHtml.raw);
        } catch {
          res.sendFile(indexHtmlPath);
        }
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


