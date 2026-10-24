-- =============================================================================
-- Migration: 003_categories_and_businesses.sql
-- Purpose:   Categories, businesses, multi-user business_members,
--            business_settings, weekly working hours, and date exceptions.
-- Depends:   002_users_auth_and_permissions.sql
-- Transactional: YES
-- =============================================================================

-- ۱. جدول دسته‌بندی‌های خدمات زیبایی (CategoryItem)
CREATE TABLE categories (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id  VARCHAR(64)  NULL UNIQUE,
  slug            VARCHAR(80)  NOT NULL UNIQUE,
  title           VARCHAR(100) NOT NULL,
  subtitle        TEXT         NOT NULL DEFAULT '',
  target_audience VARCHAR(150) NOT NULL DEFAULT '',
  icon_name       VARCHAR(50)  NOT NULL DEFAULT 'Sparkles',
  service_count   INTEGER      NOT NULL DEFAULT 0,
  sort_order      INTEGER      NOT NULL DEFAULT 0,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_categories_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT chk_categories_service_count_nonneg CHECK (service_count >= 0)
);

CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۲. جدول کسب‌وکارها: سالن‌های زنانه، آرایشگاه‌های مردانه و متخصصان مستقل (BusinessItem + OnboardingDraft)
CREATE TABLE businesses (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id       VARCHAR(64)   NULL UNIQUE,
  owner_user_id        UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  primary_category_id  UUID          NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug                 VARCHAR(100)  NOT NULL UNIQUE,
  name                 VARCHAR(150)  NOT NULL,
  type                 VARCHAR(32)   NOT NULL,
  type_label           VARCHAR(80)   NOT NULL,
  city                 VARCHAR(60)   NOT NULL,
  neighborhood         VARCHAR(100)  NOT NULL DEFAULT '',
  address              TEXT          NOT NULL,
  map_lat              NUMERIC(9,6)  NULL,
  map_lng              NUMERIC(9,6)  NULL,
  phone_display        VARCHAR(40)   NOT NULL,
  instagram_handle     VARCHAR(100)  NULL,
  short_description    VARCHAR(300)  NOT NULL DEFAULT '',
  about_text           TEXT          NOT NULL DEFAULT '',
  visual_theme         VARCHAR(16)   NOT NULL DEFAULT 'violet',
  rating_avg           NUMERIC(2,1)  NOT NULL DEFAULT 0.0,
  review_count         INTEGER       NOT NULL DEFAULT 0,
  starting_price_toman BIGINT        NOT NULL DEFAULT 0,
  verified_badge       BOOLEAN       NOT NULL DEFAULT FALSE,
  approval_status      VARCHAR(24)   NOT NULL DEFAULT 'PENDING_REVIEW',
  subscription_plan    VARCHAR(80)   NOT NULL DEFAULT 'شروع رایگان',
  subscription_status  VARCHAR(24)   NOT NULL DEFAULT 'TRIAL',
  license_code         VARCHAR(60)   NULL,
  national_id_hash     CHAR(64)      NULL,
  is_featured          BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_businesses_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT chk_businesses_type_valid CHECK (
    type IN ('WOMEN_SALON', 'MEN_BARBERSHOP', 'INDEPENDENT_SPECIALIST')
  ),
  CONSTRAINT chk_businesses_visual_theme_valid CHECK (
    visual_theme IN ('rose', 'slate', 'emerald', 'violet')
  ),
  CONSTRAINT chk_businesses_approval_status_valid CHECK (
    approval_status IN ('APPROVED', 'PENDING_REVIEW', 'REJECTED')
  ),
  CONSTRAINT chk_businesses_subscription_status_valid CHECK (
    subscription_status IN ('ACTIVE', 'TRIAL', 'EXPIRING_SOON', 'EXPIRED')
  ),
  CONSTRAINT chk_businesses_rating_bounds CHECK (rating_avg >= 0.0 AND rating_avg <= 5.0),
  CONSTRAINT chk_businesses_review_count_nonneg CHECK (review_count >= 0),
  CONSTRAINT chk_businesses_starting_price_bounds CHECK (
    starting_price_toman >= 0 AND starting_price_toman <= 100000000000
  ),
  CONSTRAINT chk_businesses_map_coords_bounds CHECK (
    (map_lat IS NULL AND map_lng IS NULL)
    OR (map_lat BETWEEN -90.0 AND 90.0 AND map_lng BETWEEN -180.0 AND 180.0)
  )
);

CREATE INDEX idx_businesses_city_type_approval
ON businesses (city, type, approval_status);

CREATE INDEX idx_businesses_category
ON businesses (primary_category_id);

CREATE TRIGGER trg_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۳. جدول اعضای کسب‌وکار و مجوزهای چندکاربره (business_members)
-- منبع حقیقت برای بررسی دسترسی به پنل هر کسب‌وکار (/app/*) در سمت سرور
CREATE TABLE business_members (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_role VARCHAR(24) NOT NULL DEFAULT 'OWNER',
  permissions JSONB       NOT NULL DEFAULT '{}'::JSONB,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_business_members_business_user UNIQUE (business_id, user_id),
  CONSTRAINT chk_business_members_role_valid CHECK (
    member_role IN ('OWNER', 'MANAGER', 'STAFF')
  )
);

CREATE INDEX idx_business_members_user_active
ON business_members (user_id, business_id)
WHERE (is_active = TRUE);

CREATE TRIGGER trg_business_members_updated_at
BEFORE UPDATE ON business_members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۴. جدول تنظیمات عملیاتی هر سالن (/app/settings)
CREATE TABLE business_settings (
  business_id            UUID        PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  buffer_minutes         SMALLINT    NOT NULL DEFAULT 15,
  min_cancel_hours       SMALLINT    NOT NULL DEFAULT 24,
  sms_on_booking_confirm BOOLEAN     NOT NULL DEFAULT TRUE,
  sms_reminder_24h       BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_business_settings_buffer_bounds CHECK (
    buffer_minutes >= 0 AND buffer_minutes <= 120
  ),
  CONSTRAINT chk_business_settings_cancel_hours_bounds CHECK (
    min_cancel_hours >= 0 AND min_cancel_hours <= 168
  )
);

CREATE TRIGGER trg_business_settings_updated_at
BEFORE UPDATE ON business_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۵. جدول ساعات کاری هفتگی هر کسب‌وکار (WorkingHourItem)
-- روزهای هفته: 0=شنبه، 1=یکشنبه، 2=دوشنبه، 3=سه‌شنبه، 4=چهارشنبه، 5=پنج‌شنبه، 6=جمعه
CREATE TABLE business_working_hours (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week SMALLINT    NOT NULL,
  day_name    VARCHAR(20) NOT NULL,
  is_open     BOOLEAN     NOT NULL DEFAULT TRUE,
  open_time   TIME        NOT NULL DEFAULT '09:30:00',
  close_time  TIME        NOT NULL DEFAULT '19:30:00',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_business_working_hours_day UNIQUE (business_id, day_of_week),
  CONSTRAINT chk_working_hours_day_range CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_working_hours_time_order CHECK (
    NOT is_open OR close_time > open_time
  )
);

CREATE TRIGGER trg_business_working_hours_updated_at
BEFORE UPDATE ON business_working_hours
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
