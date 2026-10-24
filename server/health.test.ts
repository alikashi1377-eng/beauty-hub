import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApiApp } from './app';
import { loadServerEnv, validateDatabaseUrlFormat } from './config/env';

async function startEphemeralServer(envOverrides: Record<string, string | undefined>) {
  const config = loadServerEnv(envOverrides);
  const app = createApiApp(config);
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

test('loadServerEnv defaults to mock mode on port 3000 when DATABASE_URL is absent', () => {
  const env = loadServerEnv({});
  assert.equal(env.port, 3000);
  assert.equal(env.dataMode, 'mock');
  assert.equal(env.databaseUrl, null);
  assert.equal(env.isDatabaseUrlValid, false);
});

test('validateDatabaseUrlFormat validates PostgreSQL URLs accurately', () => {
  assert.equal(
    validateDatabaseUrlFormat('postgresql://user:pass@localhost:5432/beautyhub'),
    true
  );
  assert.equal(
    validateDatabaseUrlFormat('postgres://user:pass@db.liara.ir:5432/beautyhub'),
    true
  );
  assert.equal(validateDatabaseUrlFormat('http://example.com'), false);
  assert.equal(validateDatabaseUrlFormat('invalid-url'), false);
});

test('GET /api/v1/health returns 200 OK in mock mode when DATABASE_URL is not set', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATABASE_URL: '',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.mode, 'mock');
    const db = body.database as Record<string, unknown>;
    assert.equal(db.configured, false);
    assert.equal(db.connected, false);
    assert.equal(db.status, 'not_configured');
  } finally {
    await srv.close();
  }
});

test('POST /api/v1/* in mock mode is blocked with 403 so no unintended DB writes occur', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATA_MODE: 'mock',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    assert.equal(res.status, 403);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.mode, 'mock');
    assert.equal(body.errorCode, 'MOCK_MODE_DB_WRITE_DISABLED');
  } finally {
    await srv.close();
  }
});

test('GET /api/v1/health in real mode with unreachable DB returns 503 and never leaks credentials or connection string', async () => {
  const secretPassword = 'SuperSecretPassword_998877!';
  const secretHost = '127.0.0.1';
  const fakeConnectionUrl = `postgresql://admin_user:${secretPassword}@${secretHost}:59999/beautyhub_prod`;

  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATA_MODE: 'real',
    DATABASE_URL: fakeConnectionUrl,
    DATABASE_SSL: 'disable',
    DB_CONNECT_TIMEOUT_MS: '500',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/health`);
    assert.equal(res.status, 503);
    const rawText = await res.text();

    // اطمینان از عدم نشت رمز عبور، نام کاربری، پورت یا رشته اتصال در پاسخ
    assert.equal(rawText.includes(secretPassword), false);
    assert.equal(rawText.includes('admin_user'), false);
    assert.equal(rawText.includes('59999'), false);
    assert.equal(rawText.includes('beautyhub_prod'), false);

    const body = JSON.parse(rawText) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.mode, 'real');
    assert.equal(body.status, 'degraded');
    const db = body.database as Record<string, unknown>;
    assert.equal(db.configured, true);
    assert.equal(db.connected, false);
    assert.equal(db.status, 'error');
    assert.equal(db.errorCode, 'DB_CONNECTION_REFUSED');
  } finally {
    await srv.close();
  }
});

test('POST /api/v1/* in real mode when DB is disconnected returns 503 and does not fall back to mock', async () => {
  const srv = await startEphemeralServer({
    NODE_ENV: 'test',
    DATA_MODE: 'real',
    DATABASE_URL: 'postgresql://user:secret@127.0.0.1:59999/beautyhub_prod',
    DATABASE_SSL: 'disable',
    DB_CONNECT_TIMEOUT_MS: '500',
  });

  try {
    const res = await fetch(`${srv.baseUrl}/api/v1/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName: 'تست' }),
    });
    assert.equal(res.status, 503);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, false);
    assert.equal(body.mode, 'real');
    assert.equal(body.errorCode, 'DB_CONNECTION_REFUSED');
  } finally {
    await srv.close();
  }
});
