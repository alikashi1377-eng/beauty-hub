-- =============================================================================
-- Migration: 002_users_auth_and_permissions.sql
-- Purpose:   Users, atomic OTP rate-limiting & challenge lifecycle, sessions,
--            and independent server-side platform admin permissions.
-- Depends:   001_core_helpers.sql
-- Transactional: YES
-- =============================================================================

-- ۱. جدول حساب‌های کاربری پایه
-- هر کاربر به صورت پیش‌فرض قابلیت مشتری (/me/*) را دارد و هم‌زمان می‌تواند
-- از طریق جدول business_members مالک یا عضو یک یا چند کسب‌وکار باشد.
CREATE TABLE users (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                VARCHAR(15)  NOT NULL UNIQUE,
  full_name            VARCHAR(120) NOT NULL,
  default_city         VARCHAR(60)  NULL,
  sms_reminder_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_users_phone_format CHECK (phone ~ '^09[0-9]{9}$'),
  CONSTRAINT chk_users_full_name_nonempty CHECK (char_length(btrim(full_name)) >= 2)
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۲. جدول مجوزهای مستقل مدیران پلتفرم (/admin/*)
-- دسترسی ادمین صرفاً در سمت سرور و از روی این جدول اعتبارسنجی می‌شود و به ادعای کلاینت متکی نیست.
CREATE TABLE platform_admins (
  user_id        UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash  TEXT        NOT NULL,
  allowed_scopes TEXT[]      NOT NULL DEFAULT ARRAY['ALL']::TEXT[],
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  granted_by     UUID        NULL REFERENCES users(id) ON DELETE SET NULL,
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at     TIMESTAMPTZ NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_platform_admins_password_hash_nonempty CHECK (char_length(btrim(password_hash)) >= 32),
  CONSTRAINT chk_platform_admins_revocation_state CHECK (
    (is_active = TRUE AND revoked_at IS NULL)
    OR (is_active = FALSE)
  )
);

CREATE TRIGGER trg_platform_admins_updated_at
BEFORE UPDATE ON platform_admins
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۳. جدول محدودسازی اتمیک نرخ درخواست‌های احراز هویت (OTP Send / Verify Rate Limits)
CREATE TABLE auth_rate_limits (
  bucket_key        VARCHAR(120) PRIMARY KEY,
  window_started_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_hit_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  hits_count        INTEGER      NOT NULL DEFAULT 1,
  blocked_until     TIMESTAMPTZ  NULL,

  CONSTRAINT chk_auth_rate_limits_hits_positive CHECK (hits_count > 0)
);

CREATE INDEX idx_auth_rate_limits_window ON auth_rate_limits (window_started_at);

-- تابع اتمیک بررسی و ثبت محدودیت نرخ درخواست (بر اساس شماره موبایل یا IP)
CREATE OR REPLACE FUNCTION check_and_increment_auth_rate_limit(
  p_bucket_key       VARCHAR(120),
  p_window_seconds   INTEGER,
  p_max_hits         INTEGER,
  p_cooldown_seconds INTEGER DEFAULT 0
)
RETURNS TABLE (
  allowed            BOOLEAN,
  current_hits       INTEGER,
  retry_after_sec    INTEGER,
  reason_code        VARCHAR(40)
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_now         TIMESTAMPTZ := NOW();
  v_row         auth_rate_limits%ROWTYPE;
  v_WaitSeconds INTEGER;
BEGIN
  -- قفل تراکنشی روی کلید باکت برای جلوگیری کامل از Race Condition در درخواست‌های هم‌زمان
  PERFORM pg_advisory_xact_lock(hashtext('auth_rl'), hashtext(p_bucket_key));

  SELECT * INTO v_row
  FROM auth_rate_limits
  WHERE bucket_key = p_bucket_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO auth_rate_limits (bucket_key, window_started_at, last_hit_at, hits_count, blocked_until)
    VALUES (p_bucket_key, v_now, v_now, 1, NULL);

    RETURN QUERY SELECT TRUE, 1, 0, 'OK'::VARCHAR(40);
    RETURN;
  END IF;

  -- ۱. بررسی مسدودیت فعال
  IF v_row.blocked_until IS NOT NULL AND v_row.blocked_until > v_now THEN
    v_WaitSeconds := CEIL(EXTRACT(EPOCH FROM (v_row.blocked_until - v_now)))::INTEGER;
    RETURN QUERY SELECT FALSE, v_row.hits_count, GREATEST(v_WaitSeconds, 1), 'RATE_LIMIT_BLOCKED'::VARCHAR(40);
    RETURN;
  END IF;

  -- ۲. اگر پنجره زمانی قبلی منقضی شده، پنجره را از نو شروع کن
  IF v_row.window_started_at + make_interval(secs => p_window_seconds) <= v_now THEN
    UPDATE auth_rate_limits
    SET window_started_at = v_now,
        last_hit_at       = v_now,
        hits_count        = 1,
        blocked_until     = NULL
    WHERE bucket_key = p_bucket_key;

    RETURN QUERY SELECT TRUE, 1, 0, 'OK'::VARCHAR(40);
    RETURN;
  END IF;

  -- ۳. بررسی فاصله حداقل بین دو ارسال متوالی (Cooldown)
  IF p_cooldown_seconds > 0 AND v_row.last_hit_at + make_interval(secs => p_cooldown_seconds) > v_now THEN
    v_WaitSeconds := CEIL(EXTRACT(EPOCH FROM ((v_row.last_hit_at + make_interval(secs => p_cooldown_seconds)) - v_now)))::INTEGER;
    RETURN QUERY SELECT FALSE, v_row.hits_count, GREATEST(v_WaitSeconds, 1), 'COOLDOWN_ACTIVE'::VARCHAR(40);
    RETURN;
  END IF;

  -- ۴. بررسی سقف تعداد تلاش در پنجره فعلی
  IF v_row.hits_count >= p_max_hits THEN
    UPDATE auth_rate_limits
    SET blocked_until = v_row.window_started_at + make_interval(secs => p_window_seconds)
    WHERE bucket_key = p_bucket_key;

    v_WaitSeconds := CEIL(EXTRACT(EPOCH FROM ((v_row.window_started_at + make_interval(secs => p_window_seconds)) - v_now)))::INTEGER;
    RETURN QUERY SELECT FALSE, v_row.hits_count, GREATEST(v_WaitSeconds, 1), 'WINDOW_LIMIT_EXCEEDED'::VARCHAR(40);
    RETURN;
  END IF;

  -- ۵. افزایش اتمیک شمارنده
  UPDATE auth_rate_limits
  SET hits_count  = v_row.hits_count + 1,
      last_hit_at = v_now
  WHERE bucket_key = p_bucket_key;

  RETURN QUERY SELECT TRUE, v_row.hits_count + 1, 0, 'OK'::VARCHAR(40);
END;
$$;

-- ۴. جدول چالش‌های کد یک‌بارمصرف پیامکی (OTP Challenges)
-- کد خام هرگز ذخیره نمی‌شود؛ فقط HMAC-SHA256 کد ذخیره می‌گردد.
CREATE TABLE auth_otp_challenges (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(15) NOT NULL,
  code_hmac       CHAR(64)    NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  attempts_count  SMALLINT    NOT NULL DEFAULT 0,
  max_attempts    SMALLINT    NOT NULL DEFAULT 5,
  request_ip      VARCHAR(45) NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  last_attempt_at TIMESTAMPTZ NULL,
  consumed_at     TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_otp_phone_format CHECK (phone ~ '^09[0-9]{9}$'),
  CONSTRAINT chk_otp_code_hmac_hex CHECK (code_hmac ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_otp_status_valid CHECK (
    status IN ('PENDING', 'CONSUMED', 'EXPIRED', 'LOCKED', 'SUPERSEDED')
  ),
  CONSTRAINT chk_otp_attempts_bounds CHECK (
    attempts_count >= 0
    AND max_attempts > 0
    AND max_attempts <= 10
    AND attempts_count <= max_attempts
  ),
  CONSTRAINT chk_otp_expires_after_created CHECK (expires_at > created_at),
  CONSTRAINT chk_otp_consumed_consistency CHECK (
    (status = 'CONSUMED' AND consumed_at IS NOT NULL)
    OR (status <> 'CONSUMED' AND consumed_at IS NULL)
  )
);

-- در هر لحظه برای هر شماره موبایل حداکثر یک چالش در وضعیت PENDING می‌تواند وجود داشته باشد
CREATE UNIQUE INDEX uq_otp_single_pending_per_phone
ON auth_otp_challenges (phone)
WHERE (status = 'PENDING');

CREATE INDEX idx_otp_phone_created_at
ON auth_otp_challenges (phone, created_at DESC);

-- تابع اتمیک صدور چالش OTP جدید که با قفل تراکنشی روی شماره موبایل مانع از بروز خطای
-- Unique Constraint در درخواست‌های هم‌زمان ارسال OTP برای یک شماره واحد می‌شود.
CREATE OR REPLACE FUNCTION issue_otp_challenge_atomic(
  p_phone        VARCHAR(15),
  p_code_hmac    CHAR(64),
  p_request_ip   VARCHAR(45),
  p_ttl_seconds  INTEGER DEFAULT 120,
  p_max_attempts SMALLINT DEFAULT 5
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  -- سریال کردن درخواست‌های هم‌زمان صدور OTP برای یک شماره موبایل مشخص
  PERFORM pg_advisory_xact_lock(hashtext('otp_issue'), hashtext(p_phone));

  -- ابطال هرگونه کد PENDING قبلی برای همین شماره پیش از درج کد جدید
  UPDATE auth_otp_challenges
  SET status = 'SUPERSEDED'
  WHERE phone = p_phone
    AND status = 'PENDING';

  INSERT INTO auth_otp_challenges (
    phone,
    code_hmac,
    status,
    attempts_count,
    max_attempts,
    request_ip,
    expires_at
  )
  VALUES (
    p_phone,
    p_code_hmac,
    'PENDING',
    0,
    p_max_attempts,
    p_request_ip,
    NOW() + make_interval(secs => p_ttl_seconds)
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- ۵. جدول نشست‌های کاربری و توکن‌های تمدید (User Sessions)
-- توکن خام در دیتابیس ذخیره نمی‌شود؛ فقط هش SHA-256 آن نگهداری می‌گردد.
CREATE TABLE user_sessions (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash CHAR(64)    NOT NULL UNIQUE,
  ip_address         VARCHAR(45) NULL,
  user_agent         TEXT        NULL,
  expires_at         TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ NULL,
  last_used_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_sessions_token_hash_hex CHECK (refresh_token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_sessions_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX idx_user_sessions_user_active
ON user_sessions (user_id, expires_at DESC)
WHERE (revoked_at IS NULL);
