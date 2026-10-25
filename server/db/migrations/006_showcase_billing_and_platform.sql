-- =============================================================================
-- Migration: 006_showcase_billing_and_platform.sql
-- Purpose:   Reviews, gallery items, marketing campaigns, subscription plans,
--            business subscriptions, subscription payments (v1 scope with
--            overflow-safe Toman/Rial bounds), payment audit logs, and
--            platform settings.
-- Depends:   005_appointments_and_crm.sql
-- Transactional: YES
-- =============================================================================

-- ۱. جدول دیدگاه‌ها و امتیازات مراجعان (ReviewItem)
CREATE TABLE reviews (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id   VARCHAR(64)  NULL UNIQUE,
  business_id      UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  specialist_id    UUID         NULL REFERENCES specialists(id) ON DELETE SET NULL,
  appointment_id   UUID         NULL UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
  customer_user_id UUID         NULL REFERENCES users(id) ON DELETE SET NULL,
  specialist_slug  VARCHAR(100) NULL,
  author_name      VARCHAR(120) NOT NULL,
  service_title    VARCHAR(160) NOT NULL,
  rating           SMALLINT     NOT NULL,
  date_jalali      VARCHAR(10)  NOT NULL,
  comment          TEXT         NOT NULL,
  is_published     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_reviews_rating_bounds CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_reviews_business_published
ON reviews (business_id, created_at DESC)
WHERE (is_published = TRUE);

-- ۲. جدول گالری نمونه کارها (GalleryItem)
CREATE TABLE gallery_items (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id VARCHAR(64)  NULL UNIQUE,
  business_id    UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title          VARCHAR(160) NOT NULL,
  category_label VARCHAR(100) NOT NULL,
  theme          VARCHAR(16)  NOT NULL DEFAULT 'violet',
  image_url      TEXT         NULL,
  sort_order     INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_gallery_theme_valid CHECK (
    theme IN ('rose', 'slate', 'emerald', 'violet')
  )
);

CREATE INDEX idx_gallery_items_business
ON gallery_items (business_id, sort_order ASC, created_at DESC);

-- ۳. جدول کمپین‌های بازاریابی سالن (MarketingCampaignItem)
CREATE TABLE marketing_campaigns (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id    VARCHAR(64)  NULL UNIQUE,
  business_id       UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title             VARCHAR(160) NOT NULL,
  target_segment    VARCHAR(120) NOT NULL,
  discount_percent  SMALLINT     NOT NULL,
  channel           VARCHAR(100) NOT NULL,
  status_label      VARCHAR(60)  NOT NULL,
  created_at_jalali VARCHAR(10)  NOT NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_campaigns_discount_bounds CHECK (
    discount_percent BETWEEN 1 AND 100
  )
);

CREATE INDEX idx_marketing_campaigns_business
ON marketing_campaigns (business_id, created_at DESC);

-- ۴. جدول پلن‌های اشتراک ماهانه پلتفرم (SubscriptionPlanItem)
CREATE TABLE subscription_plans (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id      VARCHAR(64)  NULL UNIQUE,
  code                VARCHAR(50)  NOT NULL UNIQUE,
  name                VARCHAR(100) NOT NULL,
  audience            TEXT         NOT NULL,
  monthly_price_toman BIGINT       NOT NULL,
  staff_limit_label   VARCHAR(60)  NOT NULL,
  max_staff_count     SMALLINT     NOT NULL DEFAULT 1,
  sms_quota_monthly   INTEGER      NOT NULL DEFAULT 0,
  features            JSONB        NOT NULL DEFAULT '[]'::JSONB,
  comparison_meta     JSONB        NOT NULL DEFAULT '{}'::JSONB,
  is_recommended      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order          SMALLINT     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_plans_monthly_price_bounds CHECK (
    monthly_price_toman >= 0 AND monthly_price_toman <= 10000000000
  ),
  CONSTRAINT chk_plans_max_staff_positive CHECK (max_staff_count > 0),
  CONSTRAINT chk_plans_sms_quota_nonneg CHECK (sms_quota_monthly >= 0)
);

CREATE TRIGGER trg_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۵. جدول اشتراک‌های کسب‌وکارها
CREATE TABLE business_subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id             UUID        NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status              VARCHAR(24) NOT NULL DEFAULT 'TRIAL',
  starts_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL,
  remaining_sms_quota INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_business_sub_status_valid CHECK (
    status IN ('ACTIVE', 'TRIAL', 'EXPIRING_SOON', 'EXPIRED')
  ),
  CONSTRAINT chk_business_sub_dates_order CHECK (expires_at > starts_at),
  CONSTRAINT chk_business_sub_sms_nonneg CHECK (remaining_sms_quota >= 0)
);

CREATE INDEX idx_business_subscriptions_business
ON business_subscriptions (business_id, expires_at DESC);

CREATE TRIGGER trg_business_subscriptions_updated_at
BEFORE UPDATE ON business_subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۶. جدول پرداخت‌های حق اشتراک کسب‌وکارها در نسخه اول (/admin/payments)
-- توجه:
--   الف) در نسخه اول فقط پرداخت اشتراک سالن‌ها پیاده‌سازی می‌شود.
--   ب) تبدیل تومان به ریال با کنترل صریح محدوده و جلوگیری قطعی از سرریز عددی (Overflow) انجام می‌شود.
--      سقف مجاز هر صورتحساب: 100,000,000,000 تومان (معادل 1,000,000,000,000 ریال) که
--      بسیار پایین‌تر از سقف BIGINT (9.22e18) است.
--   ج) در قید CHECK، از ساختار CASE WHEN استفاده شده تا ارزیابی ترتیب شروط در PostgreSQL تضمین شود
--      و پیش از ضرب amount_toman * 10، قرار داشتن مقدار در بازه [0, 100,000,000,000] بررسی گردد.
--   د) تغییر وضعیت به VERIFIED بدون ثبت server_verified_at و gateway_ref_id در سطح دیتابیس غیرممکن است.

-- تابع کمکی IMMUTABLE برای تبدیل امن و کنترل‌شده مبلغ تومان به ریال
CREATE OR REPLACE FUNCTION convert_toman_to_rial_strict(p_amount_toman BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
BEGIN
  IF p_amount_toman < 0 OR p_amount_toman > 100000000000 THEN
    RAISE EXCEPTION 'PAYMENT_AMOUNT_OUT_OF_RANGE: مبلغ تومان (%) خارج از بازه مجاز [0 .. 100,000,000,000] است.', p_amount_toman
      USING ERRCODE = '22003';
  END IF;

  RETURN p_amount_toman * 10;
END;
$$;

CREATE TABLE payments (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id     VARCHAR(64)  NULL UNIQUE,
  invoice_number     VARCHAR(32)  NOT NULL UNIQUE,
  business_id        UUID         NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  payer_user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  plan_id            UUID         NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  subscription_id    UUID         NULL REFERENCES business_subscriptions(id) ON DELETE SET NULL,
  amount_toman       BIGINT       NOT NULL,
  amount_rial        BIGINT       NOT NULL,
  gateway_name       VARCHAR(40)  NOT NULL,
  gateway_authority  VARCHAR(128) NULL UNIQUE,
  gateway_ref_id     VARCHAR(128) NULL UNIQUE,
  status             VARCHAR(24)  NOT NULL DEFAULT 'PENDING',
  date_jalali        VARCHAR(10)  NULL,
  server_verified_at TIMESTAMPTZ  NULL,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_payments_status_valid CHECK (
    status IN ('PENDING', 'INITIATED', 'VERIFIED', 'FAILED', 'EXPIRED', 'REFUNDED')
  ),
  -- جلوگیری قطعی از سرریز عددی با تضمین ترتیب ارزیابی (CASE WHEN) و برابری دقیق ریال با ۱۰ برابر تومان
  CONSTRAINT chk_payments_amount_overflow_safe_and_exact CHECK (
    CASE
      WHEN amount_toman >= 0
       AND amount_toman <= 100000000000
       AND amount_rial >= 0
       AND amount_rial <= 1000000000000
      THEN amount_rial = amount_toman * 10
      ELSE FALSE
    END
  ),
  -- پذیرش وضعیت VERIFIED صرفاً پس از اعتبارسنجی سمت سرور درگاه و ثبت شناسه مرجع غیرخالی
  CONSTRAINT chk_payments_verified_requires_server_proof CHECK (
    status <> 'VERIFIED'
    OR (
      server_verified_at IS NOT NULL
      AND gateway_ref_id IS NOT NULL
      AND char_length(btrim(gateway_ref_id)) > 0
    )
  )
);

CREATE INDEX idx_payments_business_created
ON payments (business_id, created_at DESC);

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۷. جدول سوابق تغییر وضعیت پرداخت‌ها (Payment Audit Trail)
CREATE TABLE payment_status_logs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id            UUID        NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  previous_status       VARCHAR(24) NULL,
  new_status            VARCHAR(24) NOT NULL,
  gateway_response_code VARCHAR(60) NULL,
  note                  TEXT        NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_payment_log_new_status_valid CHECK (
    new_status IN ('PENDING', 'INITIATED', 'VERIFIED', 'FAILED', 'EXPIRED', 'REFUNDED')
  )
);

CREATE INDEX idx_payment_status_logs_payment
ON payment_status_logs (payment_id, created_at DESC);

-- ۸. جدول تنظیمات کلان سامانه (/admin/settings)
CREATE TABLE platform_settings (
  id                  SMALLINT     PRIMARY KEY DEFAULT 1,
  brand_name          VARCHAR(100) NOT NULL DEFAULT 'BeautyHub',
  default_trial_days  SMALLINT     NOT NULL DEFAULT 14,
  updated_by_admin_id UUID         NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_platform_settings_singleton CHECK (id = 1),
  CONSTRAINT chk_platform_settings_trial_days_bounds CHECK (
    default_trial_days >= 0 AND default_trial_days <= 365
  )
);

CREATE TRIGGER trg_platform_settings_updated_at
BEFORE UPDATE ON platform_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
