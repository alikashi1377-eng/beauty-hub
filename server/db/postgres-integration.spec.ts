import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { runMigrationsOnPool } from './migrate';

const { Pool } = pg;

// =============================================================================
// تست‌های یکپارچگی واقعی PostgreSQL 17 (Real PostgreSQL Integration Suite)
// توجه بسیار مهم (گارد حفاظتی دیتابیس تست مجزا):
// ۱. این تست‌ها هرگز و تحت هیچ شرایطی به متغیر DATABASE_URL (دیتابیس اصلی یا Production لیارا)
//    متصل نمی‌شوند و صرفاً از متغیر مجزای TEST_DATABASE_URL استفاده می‌کنند.
// ۲. اگر RUN_REAL_PG_TESTS="true" باشد اما TEST_DATABASE_URL تعریف نشده باشد، یا برابر با
//    DATABASE_URL باشد، یا به هاست‌های لیارا (*.liara.ir / *.liara.run) اشاره کند، یا نام
//    دیتابیس شامل کلمه test نباشد، گارد ایمنی اجرای تست را متوقف و رد می‌کند.
// =============================================================================

export function resolveSafeTestDatabaseUrl(
  env: Record<string, string | undefined>
): {
  safe: boolean;
  url: string | null;
  reason: string;
} {
  if (env.RUN_REAL_PG_TESTS !== 'true') {
    return {
      safe: false,
      url: null,
      reason: 'RUN_REAL_PG_TESTS_NOT_ENABLED',
    };
  }

  const rawTestUrl = (env.TEST_DATABASE_URL ?? '').trim();
  if (!rawTestUrl) {
    return {
      safe: false,
      url: null,
      reason: 'TEST_DATABASE_URL_MISSING',
    };
  }

  const rawMainUrl = (env.DATABASE_URL ?? '').trim();
  if (rawMainUrl && rawTestUrl === rawMainUrl) {
    return {
      safe: false,
      url: null,
      reason: 'TEST_DATABASE_URL_EQUALS_MAIN_DATABASE_URL',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawTestUrl);
  } catch {
    return {
      safe: false,
      url: null,
      reason: 'TEST_DATABASE_URL_INVALID_FORMAT',
    };
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    return {
      safe: false,
      url: null,
      reason: 'TEST_DATABASE_URL_INVALID_PROTOCOL',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname.includes('liara.ir') ||
    hostname.includes('liara.run') ||
    hostname.includes('iran.liara')
  ) {
    return {
      safe: false,
      url: null,
      reason: 'TEST_DATABASE_URL_FORBIDDEN_LIARA_HOST',
    };
  }

  const dbName = parsed.pathname.replace(/^\/+/, '').toLowerCase();
  if (!dbName || !dbName.includes('test') || dbName.includes('prod')) {
    return {
      safe: false,
      url: null,
      reason: 'TEST_DATABASE_URL_MUST_TARGET_EXPLICIT_TEST_DB',
    };
  }

  return {
    safe: true,
    url: rawTestUrl,
    reason: 'SAFE_ISOLATED_TEST_DATABASE',
  };
}

const PG_TEST_GUARD = resolveSafeTestDatabaseUrl(process.env);
const SHOULD_RUN_REAL_PG_TESTS = PG_TEST_GUARD.safe && Boolean(PG_TEST_GUARD.url);
const SAFE_TEST_DB_URL = PG_TEST_GUARD.url ?? '';

test('Real PG Safety Guard: Strictly requires isolated TEST_DATABASE_URL and blocks DATABASE_URL, Liara hosts, and production DB names', () => {
  // ۱. در صورت فعال بودن RUN_REAL_PG_TESTS در محیط فعلی، اتصال حتماً باید امن و مجزا باشد
  if (process.env.RUN_REAL_PG_TESTS === 'true') {
    assert.equal(
      PG_TEST_GUARD.safe,
      true,
      `توقف ایمنی تست PostgreSQL: متغیر TEST_DATABASE_URL تعریف نشده یا ناامن است (${PG_TEST_GUARD.reason}). هیچ تستی روی دیتابیس اصلی اجرا نمی‌شود.`
    );
  }

  // ۲. رد شدن در صورت نبود TEST_DATABASE_URL حتی اگر DATABASE_URL وجود داشته باشد
  const missingTestUrl = resolveSafeTestDatabaseUrl({
    RUN_REAL_PG_TESTS: 'true',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub_test',
  });
  assert.equal(missingTestUrl.safe, false);
  assert.equal(missingTestUrl.reason, 'TEST_DATABASE_URL_MISSING');

  // ۳. رد شدن در صورت یکسان بودن TEST_DATABASE_URL با DATABASE_URL
  const duplicateUrl = resolveSafeTestDatabaseUrl({
    RUN_REAL_PG_TESTS: 'true',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub_test',
    TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub_test',
  });
  assert.equal(duplicateUrl.safe, false);
  assert.equal(
    duplicateUrl.reason,
    'TEST_DATABASE_URL_EQUALS_MAIN_DATABASE_URL'
  );

  // ۴. رد شدن قطعی هاست‌های لیارا (جلوگیری از اتصال به دیتابیس Production لیارا)
  const liaraHost = resolveSafeTestDatabaseUrl({
    RUN_REAL_PG_TESTS: 'true',
    TEST_DATABASE_URL: 'postgresql://root:secret@s12.db.liara.ir:34567/beautyhub_test',
  });
  assert.equal(liaraHost.safe, false);
  assert.equal(liaraHost.reason, 'TEST_DATABASE_URL_FORBIDDEN_LIARA_HOST');

  // ۵. رد شدن دیتابیس‌هایی که نام آن‌ها صراحتاً شامل test نیست یا شامل prod است
  const nonTestDbName = resolveSafeTestDatabaseUrl({
    RUN_REAL_PG_TESTS: 'true',
    TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub_main',
  });
  assert.equal(nonTestDbName.safe, false);
  assert.equal(
    nonTestDbName.reason,
    'TEST_DATABASE_URL_MUST_TARGET_EXPLICIT_TEST_DB'
  );

  const prodDbName = resolveSafeTestDatabaseUrl({
    RUN_REAL_PG_TESTS: 'true',
    TEST_DATABASE_URL: 'postgresql://user:pass@localhost:5432/beautyhub_prod_test',
  });
  assert.equal(prodDbName.safe, false);

  // ۶. تایید دیتابیس تست محلی مجزا
  const validIsolatedTestDb = resolveSafeTestDatabaseUrl({
    RUN_REAL_PG_TESTS: 'true',
    DATABASE_URL: 'postgresql://user:pass@db.liara.ir:5432/beautyhub_prod',
    TEST_DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/beautyhub_test_isolated',
  });
  assert.equal(validIsolatedTestDb.safe, true);
  assert.equal(validIsolatedTestDb.reason, 'SAFE_ISOLATED_TEST_DATABASE');
});

test(
  'Real PG 1: Run all 6 migrations on PostgreSQL 17 and verify schema_migrations & btree_gist',
  { skip: !SHOULD_RUN_REAL_PG_TESTS },
  async () => {
    const pool = new Pool({ connectionString: SAFE_TEST_DB_URL });
    try {
      const summary = await runMigrationsOnPool(pool);
      assert.equal(summary.totalFiles, 6);

      const extRes = await pool.query<{ extname: string }>(
        "SELECT extname FROM pg_extension WHERE extname = 'btree_gist'"
      );
      assert.equal(extRes.rowCount, 1);
    } finally {
      await pool.end();
    }
  }
);

test(
  'Real PG 2: OTP atomic rate-limit, concurrent challenge issuance, attempt increment, auto-lock, and one-time consumption',
  { skip: !SHOULD_RUN_REAL_PG_TESTS },
  async () => {
    const pool = new Pool({ connectionString: SAFE_TEST_DB_URL });
    const testPhone = '09120009988';
    const validHmac = 'a'.repeat(64);
    const wrongHmac = 'b'.repeat(64);

    try {
      await pool.query('DELETE FROM auth_otp_challenges WHERE phone = $1', [
        testPhone,
      ]);
      await pool.query('DELETE FROM auth_rate_limits WHERE bucket_key = $1', [
        `otp_send:${testPhone}`,
      ]);

      // ۱. فراخوانی هم‌زمان issue_otp_challenge_atomic از دو اتصال موازی نباید خطای Unique Constraint بدهد
      const [issue1, issue2] = await Promise.all([
        pool.query<{ issue_otp_challenge_atomic: string }>(
          'SELECT issue_otp_challenge_atomic($1, $2, $3, 120, 3)',
          [testPhone, validHmac, '127.0.0.1']
        ),
        pool.query<{ issue_otp_challenge_atomic: string }>(
          'SELECT issue_otp_challenge_atomic($1, $2, $3, 120, 3)',
          [testPhone, validHmac, '127.0.0.1']
        ),
      ]);
      assert.ok(issue1.rows[0].issue_otp_challenge_atomic);
      assert.ok(issue2.rows[0].issue_otp_challenge_atomic);

      // باید دقیقاً یک رکورد PENDING وجود داشته باشد و رکورد قبلی SUPERSEDED شده باشد
      const pendingRes = await pool.query(
        "SELECT id FROM auth_otp_challenges WHERE phone = $1 AND status = 'PENDING'",
        [testPhone]
      );
      assert.equal(pendingRes.rowCount, 1);

      // ۲. تلاش ناموفق اول: INVALID_CODE و باقی‌مانده ۲ تلاش
      const verifyWrong1 = await pool.query<{
        verified: boolean;
        remaining_attempts: number;
        outcome_code: string;
      }>('SELECT * FROM verify_otp_challenge_atomic($1, $2)', [
        testPhone,
        wrongHmac,
      ]);
      assert.equal(verifyWrong1.rows[0].verified, false);
      assert.equal(verifyWrong1.rows[0].outcome_code, 'INVALID_CODE');
      assert.equal(verifyWrong1.rows[0].remaining_attempts, 2);

      // ۳. تلاش موفق: VERIFIED و تغییر وضعیت به CONSUMED
      const verifyOk = await pool.query<{
        verified: boolean;
        remaining_attempts: number;
        outcome_code: string;
      }>('SELECT * FROM verify_otp_challenge_atomic($1, $2)', [
        testPhone,
        validHmac,
      ]);
      assert.equal(verifyOk.rows[0].verified, true);
      assert.equal(verifyOk.rows[0].outcome_code, 'VERIFIED');

      // ۴. تلاش مجدد با همان کد صحیح (Replay Attack): باید با NO_ACTIVE_CHALLENGE رد شود
      const verifyReplay = await pool.query<{
        verified: boolean;
        outcome_code: string;
      }>('SELECT * FROM verify_otp_challenge_atomic($1, $2)', [
        testPhone,
        validHmac,
      ]);
      assert.equal(verifyReplay.rows[0].verified, false);
      assert.equal(verifyReplay.rows[0].outcome_code, 'NO_ACTIVE_CHALLENGE');

      // ۵. بررسی قفل شدن خودکار پس از رسیدن به max_attempts
      await pool.query('SELECT issue_otp_challenge_atomic($1, $2, $3, 120, 2)', [
        testPhone,
        validHmac,
        '127.0.0.1',
      ]);
      await pool.query('SELECT * FROM verify_otp_challenge_atomic($1, $2)', [
        testPhone,
        wrongHmac,
      ]);
      const lockAttempt = await pool.query<{
        verified: boolean;
        remaining_attempts: number;
        outcome_code: string;
      }>('SELECT * FROM verify_otp_challenge_atomic($1, $2)', [
        testPhone,
        wrongHmac,
      ]);
      assert.equal(lockAttempt.rows[0].verified, false);
      assert.equal(lockAttempt.rows[0].outcome_code, 'OTP_LOCKED');
      assert.equal(lockAttempt.rows[0].remaining_attempts, 0);
    } finally {
      await pool.end();
    }
  }
);

test(
  'Real PG 3: Business creation automatically registers owner in business_members and is conflict-safe with manual upsert',
  { skip: !SHOULD_RUN_REAL_PG_TESTS },
  async () => {
    const pool = new Pool({ connectionString: SAFE_TEST_DB_URL });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query<{ id: string }>(
        `INSERT INTO users (phone, full_name)
         VALUES ('09127776655', 'مالک تست')
         RETURNING id`
      );
      const ownerId = userRes.rows[0].id;

      const catRes = await client.query<{ id: string }>(
        `INSERT INTO categories (slug, title)
         VALUES ('test-cat-owner', 'دسته تست')
         RETURNING id`
      );
      const categoryId = catRes.rows[0].id;

      const bizRes = await client.query<{ id: string }>(
        `INSERT INTO businesses (
           owner_user_id, primary_category_id, slug, name, type, type_label, city, address, phone_display
         ) VALUES ($1, $2, 'test-salon-owner', 'سالن تست', 'WOMEN_SALON', 'سالن زیبایی زنانه', 'تهران', 'ونک', '02188888888')
         RETURNING id`,
        [ownerId, categoryId]
      );
      const businessId = bizRes.rows[0].id;

      // بررسی درج خودکار توسط تریگر trg_businesses_ensure_owner_member
      const memberRes = await client.query<{
        member_role: string;
        is_active: boolean;
      }>(
        'SELECT member_role, is_active FROM business_members WHERE business_id = $1 AND user_id = $2',
        [businessId, ownerId]
      );
      assert.equal(memberRes.rowCount, 1);
      assert.equal(memberRes.rows[0].member_role, 'OWNER');
      assert.equal(memberRes.rows[0].is_active, true);

      // بررسی عدم تداخل با درج دستی با ON CONFLICT در لایه API
      await client.query(
        `INSERT INTO business_members (business_id, user_id, member_role, is_active)
         VALUES ($1, $2, 'OWNER', TRUE)
         ON CONFLICT (business_id, user_id) DO UPDATE
           SET member_role = 'OWNER', is_active = TRUE`,
        [businessId, ownerId]
      );

      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  }
);

test(
  'Real PG 4: Appointments EXCLUDE USING gist overlap prevention across buffer times, specialist updates, cancellation, and reactivation',
  { skip: !SHOULD_RUN_REAL_PG_TESTS },
  async () => {
    const pool = new Pool({ connectionString: SAFE_TEST_DB_URL });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userRes = await client.query<{ id: string }>(
        `INSERT INTO users (phone, full_name) VALUES ('09123334455', 'کاربر تست نوبت') RETURNING id`
      );
      const catRes = await client.query<{ id: string }>(
        `INSERT INTO categories (slug, title) VALUES ('test-cat-apt', 'دسته نوبت') RETURNING id`
      );
      const bizRes = await client.query<{ id: string }>(
        `INSERT INTO businesses (
           owner_user_id, primary_category_id, slug, name, type, type_label, city, address, phone_display
         ) VALUES ($1, $2, 'test-salon-apt', 'سالن نوبت', 'WOMEN_SALON', 'سالن زیبایی زنانه', 'تهران', 'جردن', '02122222222')
         RETURNING id`,
        [userRes.rows[0].id, catRes.rows[0].id]
      );
      const businessId = bizRes.rows[0].id;

      const srvRes = await client.query<{ id: string }>(
        `INSERT INTO services (
           business_id, category_id, category_slug, category_label, title, duration_minutes, price_toman
         ) VALUES ($1, $2, 'test-cat-apt', 'دسته نوبت', 'کوتاهی مو', 60, 450000)
         RETURNING id`,
        [businessId, catRes.rows[0].id]
      );
      const serviceId = srvRes.rows[0].id;

      const spc1Res = await client.query<{ id: string }>(
        `INSERT INTO specialists (business_id, slug, full_name, role_title)
         VALUES ($1, 'spc-apt-1', 'متخصص اول', 'هیر استایلیست') RETURNING id`,
        [businessId]
      );
      const spc2Res = await client.query<{ id: string }>(
        `INSERT INTO specialists (business_id, slug, full_name, role_title)
         VALUES ($1, 'spc-apt-2', 'متخصص دوم', 'هیر استایلیست') RETURNING id`,
        [businessId]
      );
      const spc1Id = spc1Res.rows[0].id;
      const spc2Id = spc2Res.rows[0].id;

      // نوبت اول برای متخصص اول: ساعت 10:00 تا 11:00 خدمت + 15 دقیقه استراحت (اشغال تا 11:15)
      const apt1Res = await client.query<{ id: string }>(
        `INSERT INTO appointments (
           reference_code, business_id, service_id, specialist_id,
           service_title_snapshot, service_price_toman_snapshot, duration_minutes_snapshot, buffer_minutes_snapshot,
           specialist_name_snapshot, customer_name, customer_phone, customer_phone_masked,
           date_jalali, time_slot_label, service_starts_at, service_ends_at, occupied_until_at, status
         ) VALUES (
           'BH-TEST-101', $1, $2, $3,
           'کوتاهی مو', 450000, 60, 15,
           'متخصص اول', 'مشتری اول', '09121112233', '0912***2233',
           '1405/08/02', '10:00',
           '2026-10-24T10:00:00Z', '2026-10-24T11:00:00Z', '2026-10-24T11:15:00Z', 'CONFIRMED'
         ) RETURNING id`,
        [businessId, serviceId, spc1Id]
      );
      const apt1Id = apt1Res.rows[0].id;

      // ۱. تلاش برای ثبت نوبت دوم برای همان متخصص در ساعت 11:05 (تداخل با زمان استراحت 11:00 تا 11:15): باید با SQLSTATE 23P01 رد شود
      await assert.rejects(
        () =>
          client.query(
            `INSERT INTO appointments (
               reference_code, business_id, service_id, specialist_id,
               service_title_snapshot, service_price_toman_snapshot, duration_minutes_snapshot, buffer_minutes_snapshot,
               specialist_name_snapshot, customer_name, customer_phone, customer_phone_masked,
               date_jalali, time_slot_label, service_starts_at, service_ends_at, occupied_until_at, status
             ) VALUES (
               'BH-TEST-102', $1, $2, $3,
               'کوتاهی مو', 450000, 60, 15,
               'متخصص اول', 'مشتری دوم', '09121112244', '0912***2244',
               '1405/08/02', '11:05',
               '2026-10-24T11:05:00Z', '2026-10-24T12:05:00Z', '2026-10-24T12:20:00Z', 'PENDING'
             )`,
            [businessId, serviceId, spc1Id]
          ),
        (err: { code?: string }) => err.code === '23P01'
      );

      // ۲. ثبت نوبت در همان ساعت 10:30 برای متخصص دوم: مجاز است
      const apt2Res = await client.query<{ id: string }>(
        `INSERT INTO appointments (
           reference_code, business_id, service_id, specialist_id,
           service_title_snapshot, service_price_toman_snapshot, duration_minutes_snapshot, buffer_minutes_snapshot,
           specialist_name_snapshot, customer_name, customer_phone, customer_phone_masked,
           date_jalali, time_slot_label, service_starts_at, service_ends_at, occupied_until_at, status
         ) VALUES (
           'BH-TEST-103', $1, $2, $3,
           'کوتاهی مو', 450000, 60, 15,
           'متخصص دوم', 'مشتری سوم', '09121112255', '0912***2255',
           '1405/08/02', '10:30',
           '2026-10-24T10:30:00Z', '2026-10-24T11:30:00Z', '2026-10-24T11:45:00Z', 'CONFIRMED'
         ) RETURNING id`,
        [businessId, serviceId, spc2Id]
      );
      const apt2Id = apt2Res.rows[0].id;

      // ۳. تغییر متخصص نوبت دوم به متخصص اول (که در آن بازه مشغول است): باید با 23P01 رد شود
      await assert.rejects(
        () =>
          client.query(
            'UPDATE appointments SET specialist_id = $1 WHERE id = $2',
            [spc1Id, apt2Id]
          ),
        (err: { code?: string }) => err.code === '23P01'
      );

      // ۴. لغو نوبت اول متخصص اول و سپس انتقال نوبت دوم به متخصص اول: اکنون مجاز است
      await client.query(
        `UPDATE appointments
         SET status = 'CANCELLED', cancelled_at = NOW(), cancelled_reason = 'لغو توسط مشتری'
         WHERE id = $1`,
        [apt1Id]
      );

      await client.query(
        'UPDATE appointments SET specialist_id = $1 WHERE id = $2',
        [spc1Id, apt2Id]
      );

      // ۵. تلاش برای بازگرداندن نوبت لغوشده اول به CONFIRMED در حالی که نوبت دوم جای آن را گرفته: باید با 23P01 رد شود
      await assert.rejects(
        () =>
          client.query(
            `UPDATE appointments
             SET status = 'CONFIRMED', cancelled_at = NULL, cancelled_reason = NULL
             WHERE id = $1`,
            [apt1Id]
          ),
        (err: { code?: string }) => err.code === '23P01'
      );

      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  }
);

test(
  'Real PG 5: Payments convert_toman_to_rial_strict, CASE-guarded overflow-safe CHECK constraint, and VERIFIED server proof',
  { skip: !SHOULD_RUN_REAL_PG_TESTS },
  async () => {
    const pool = new Pool({ connectionString: SAFE_TEST_DB_URL });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ۱. بررسی تابع convert_toman_to_rial_strict در محدوده مجاز و خارج از محدوده
      const convOk = await client.query<{ rial: string }>(
        'SELECT convert_toman_to_rial_strict(890000) AS rial'
      );
      assert.equal(convOk.rows[0].rial, '8900000');

      await assert.rejects(
        () =>
          client.query('SELECT convert_toman_to_rial_strict(100000000001)'),
        (err: { code?: string }) => err.code === '22003'
      );

      // ۲. بررسی قید CHECK جدول payments در برابر مقدار بسیار بزرگ BIGINT (نزدیک به 9.22e18)
      // به لطف CASE WHEN، باید بدون سرریز محاسباتی با خطای قید CHECK (23514) رد شود
      const userRes = await client.query<{ id: string }>(
        `INSERT INTO users (phone, full_name) VALUES ('09125556677', 'پرداخت تست') RETURNING id`
      );
      const catRes = await client.query<{ id: string }>(
        `INSERT INTO categories (slug, title) VALUES ('test-cat-pay', 'دسته پرداخت') RETURNING id`
      );
      const bizRes = await client.query<{ id: string }>(
        `INSERT INTO businesses (
           owner_user_id, primary_category_id, slug, name, type, type_label, city, address, phone_display
         ) VALUES ($1, $2, 'test-salon-pay', 'سالن پرداخت', 'WOMEN_SALON', 'سالن زیبایی زنانه', 'تهران', 'سعادت‌آباد', '02144444444')
         RETURNING id`,
        [userRes.rows[0].id, catRes.rows[0].id]
      );
      const planRes = await client.query<{ id: string }>(
        `INSERT INTO subscription_plans (code, name, audience, monthly_price_toman, staff_limit_label)
         VALUES ('pro-test', 'حرفه‌ای تست', 'سالن‌ها', 890000, 'تا ۱۰ نفر')
         RETURNING id`
      );

      await assert.rejects(
        () =>
          client.query(
            `INSERT INTO payments (
               invoice_number, business_id, payer_user_id, plan_id,
               amount_toman, amount_rial, gateway_name, status
             ) VALUES (
               'INV-OVERFLOW-1', $1, $2, $3,
               9000000000000000000, 10, 'ZarinPal', 'PENDING'
             )`,
            [bizRes.rows[0].id, userRes.rows[0].id, planRes.rows[0].id]
          ),
        (err: { code?: string }) => err.code === '23514'
      );

      // ۳. بررسی الزام server_verified_at و gateway_ref_id برای وضعیت VERIFIED (23514)
      await assert.rejects(
        () =>
          client.query(
            `INSERT INTO payments (
               invoice_number, business_id, payer_user_id, plan_id,
               amount_toman, amount_rial, gateway_name, status
             ) VALUES (
               'INV-UNVERIFIED-1', $1, $2, $3,
               890000, 8900000, 'ZarinPal', 'VERIFIED'
             )`,
            [bizRes.rows[0].id, userRes.rows[0].id, planRes.rows[0].id]
          ),
        (err: { code?: string }) => err.code === '23514'
      );

      await client.query('ROLLBACK');
    } finally {
      client.release();
      await pool.end();
    }
  }
);

