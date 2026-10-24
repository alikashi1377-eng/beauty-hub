-- =============================================================================
-- Migration: 004_services_and_specialists.sql
-- Purpose:   Services, specialists, specialist-service assignments, and
--            calendar time exceptions (business-wide or specialist-specific).
-- Depends:   003_categories_and_businesses.sql
-- Transactional: YES
-- =============================================================================

-- ۱. جدول خدمات هر کسب‌وکار (ServiceItem)
-- سیاست حذف خدمت (Soft Delete):
-- برای حفظ کامل یکپارچگی رزروهای تاریخی و کلید خارجی ترکیبی جدول appointments (ON DELETE RESTRICT)،
-- حذف خدمت از پنل کسب‌وکار (/app/services) در لایه API الزاماً به صورت Soft Delete
-- (UPDATE services SET is_active = FALSE, updated_at = NOW()) انجام می‌شود تا رزروهای قبلی و
-- Snapshotهای ثبت‌شده دست‌نخورده باقی بمانند.
CREATE TABLE services (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id   VARCHAR(64)  NULL UNIQUE,
  business_id      UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id      UUID         NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  category_slug    VARCHAR(80)  NOT NULL,
  category_label   VARCHAR(100) NOT NULL,
  title            VARCHAR(160) NOT NULL,
  description      TEXT         NOT NULL DEFAULT '',
  duration_minutes SMALLINT     NOT NULL,
  price_toman      BIGINT       NOT NULL,
  is_popular       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- قید یکتای ترکیبی جهت استفاده در کلید خارجی ترکیبی جدول appointments
  CONSTRAINT uq_services_id_business UNIQUE (id, business_id),
  CONSTRAINT chk_services_duration_bounds CHECK (
    duration_minutes > 0 AND duration_minutes <= 600
  ),
  CONSTRAINT chk_services_price_toman_bounds CHECK (
    price_toman >= 0 AND price_toman <= 100000000000
  )
);

CREATE INDEX idx_services_business_active
ON services (business_id, is_active, category_slug);

CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۲. جدول متخصصان هر کسب‌وکار (SpecialistItem)
CREATE TABLE specialists (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id       VARCHAR(64)  NULL UNIQUE,
  business_id          UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id              UUID         NULL REFERENCES users(id) ON DELETE SET NULL,
  slug                 VARCHAR(100) NOT NULL UNIQUE,
  full_name            VARCHAR(120) NOT NULL,
  role_title           VARCHAR(120) NOT NULL,
  experience_years     SMALLINT     NOT NULL DEFAULT 1,
  rating_avg           NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  review_count         INTEGER      NOT NULL DEFAULT 0,
  specialties          TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  bio                  TEXT         NOT NULL DEFAULT '',
  is_independent       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  city                 VARCHAR(60)  NULL,
  starting_price_toman BIGINT       NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- قید یکتای ترکیبی جهت تضمین تعلق متخصص به همان کسب‌وکار در جدول appointments
  CONSTRAINT uq_specialists_id_business UNIQUE (id, business_id),
  CONSTRAINT chk_specialists_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT chk_specialists_experience_bounds CHECK (
    experience_years >= 0 AND experience_years <= 80
  ),
  CONSTRAINT chk_specialists_rating_bounds CHECK (
    rating_avg >= 0.0 AND rating_avg <= 5.0
  ),
  CONSTRAINT chk_specialists_review_count_nonneg CHECK (review_count >= 0),
  CONSTRAINT chk_specialists_starting_price_bounds CHECK (
    starting_price_toman >= 0 AND starting_price_toman <= 100000000000
  )
);

CREATE INDEX idx_specialists_business_active
ON specialists (business_id, is_active);

CREATE TRIGGER trg_specialists_updated_at
BEFORE UPDATE ON specialists
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۳. جدول واسط خدمات قابل ارائه توسط هر متخصص
CREATE TABLE specialist_services (
  specialist_id UUID        NOT NULL,
  service_id    UUID        NOT NULL,
  business_id   UUID        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (specialist_id, service_id),
  CONSTRAINT fk_specialist_services_specialist
    FOREIGN KEY (specialist_id, business_id)
    REFERENCES specialists (id, business_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_specialist_services_service
    FOREIGN KEY (service_id, business_id)
    REFERENCES services (id, business_id)
    ON DELETE CASCADE
);

-- ۴. جدول زمان‌های استثنا، تعطیلات موردی سالن یا مرخصی متخصص
CREATE TABLE business_time_exceptions (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  specialist_id     UUID         NULL,
  exception_date    DATE         NOT NULL,
  is_closed_all_day BOOLEAN      NOT NULL DEFAULT TRUE,
  start_time        TIME         NULL,
  end_time          TIME         NULL,
  reason            VARCHAR(200) NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_time_exceptions_specialist_business
    FOREIGN KEY (specialist_id, business_id)
    REFERENCES specialists (id, business_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_time_exceptions_hours_consistency CHECK (
    (is_closed_all_day = TRUE AND start_time IS NULL AND end_time IS NULL)
    OR (is_closed_all_day = FALSE AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

CREATE INDEX idx_time_exceptions_business_date
ON business_time_exceptions (business_id, exception_date);
