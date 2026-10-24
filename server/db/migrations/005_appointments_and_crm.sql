-- =============================================================================
-- Migration: 005_appointments_and_crm.sql
-- Purpose:   Appointments with strict btree_gist overlap prevention,
--            immutable service & buffer snapshots, status audit logs,
--            business CRM customers, and customer favorites.
-- Depends:   004_services_and_specialists.sql
-- Requires:  PostgreSQL extension `btree_gist` (strictly required; no fallback)
-- Transactional: YES
-- =============================================================================

-- ۱. بررسی و فعال‌سازی سخت‌گیرانه افزونه btree_gist (گزینه ب)
-- اگر کاربر دیتابیس در محیط هدف مجوز CREATE EXTENSION نداشته باشد و افزونه از قبل
-- فعال نباشد، Migration با پیام خطای صریح متوقف و کل تراکنش Rollback می‌شود.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'btree_gist'
  ) THEN
    BEGIN
      CREATE EXTENSION btree_gist;
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE EXCEPTION 'MIGRATION_005_BTREE_GIST_PRIVILEGE_ERROR: کاربر دیتابیس مجوز ایجاد افزونه btree_gist را ندارد. لطفاً با کاربر دارای دسترسی بالاتر در PostgreSQL دستور CREATE EXTENSION IF NOT EXISTS btree_gist; را اجرا کنید.'
          USING ERRCODE = '42501';
      WHEN OTHERS THEN
        RAISE EXCEPTION 'MIGRATION_005_BTREE_GIST_ERROR: خطا در فعال‌سازی افزونه الزامی btree_gist (%: %).', SQLSTATE, SQLERRM;
    END;
  END IF;
END;
$$;

-- ۲. جدول نوبت‌ها و رزروها (AppointmentItem)
-- پوشش کامل:
--   الف) ذخیره زمان واقعی شروع و پایان خدمت (service_starts_at, service_ends_at)
--   ب) ذخیره Snapshot تغییرناپذیر نام خدمت، قیمت (تومان)، مدت خدمت و فاصله استراحت (buffer_minutes_snapshot)
--   ج) محاسبه زمان پایان اشغال متخصص (occupied_until_at = service_ends_at + buffer_minutes_snapshot)
--   د) جلوگیری از رزرو هم‌زمان در سطح PostgreSQL با EXCLUDE USING gist هنگام درج، تغییر متخصص، یا بازگردانی وضعیت به فعال
CREATE TABLE appointments (
  id                           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id               VARCHAR(64)  NULL UNIQUE,
  reference_code               VARCHAR(24)  NOT NULL UNIQUE,
  business_id                  UUID         NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  customer_user_id             UUID         NULL REFERENCES users(id) ON DELETE SET NULL,
  service_id                   UUID         NOT NULL,
  specialist_id                UUID         NOT NULL,

  -- مقادیر Snapshot شده در لحظه ثبت رزرو (تغییر تنظیمات سالن یا تعرفه خدمت در آینده، این مقادیر را تغییر نمی‌دهد)
  service_title_snapshot       VARCHAR(160) NOT NULL,
  service_price_toman_snapshot BIGINT       NOT NULL,
  duration_minutes_snapshot    SMALLINT     NOT NULL,
  buffer_minutes_snapshot      SMALLINT     NOT NULL DEFAULT 0,
  specialist_name_snapshot     VARCHAR(120) NOT NULL,

  -- مشخصات مراجع
  customer_name                VARCHAR(120) NOT NULL,
  customer_phone               VARCHAR(15)  NOT NULL,
  customer_phone_masked        VARCHAR(20)  NOT NULL,

  -- زمان‌بندی نمایشی و زمان‌بندی دقیق عملیاتی
  date_jalali                  VARCHAR(10)  NOT NULL,
  time_slot_label              VARCHAR(10)  NOT NULL,
  service_starts_at            TIMESTAMPTZ  NOT NULL,
  service_ends_at              TIMESTAMPTZ  NOT NULL,
  occupied_until_at            TIMESTAMPTZ  NOT NULL,
  occupied_range               TSTZRANGE    GENERATED ALWAYS AS (
                                 tstzrange(service_starts_at, occupied_until_at, '[)')
                               ) STORED,

  status                       VARCHAR(24)  NOT NULL DEFAULT 'PENDING',
  notes                        TEXT         NULL,
  cancelled_at                 TIMESTAMPTZ  NULL,
  cancelled_reason             TEXT         NULL,
  created_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- تضمین تعلق خدمت و متخصص به همان کسب‌وکار (حتی در صورت ویرایش بعدی specialist_id یا service_id)
  CONSTRAINT fk_appointments_service_business
    FOREIGN KEY (service_id, business_id)
    REFERENCES services (id, business_id)
    ON DELETE RESTRICT,

  CONSTRAINT fk_appointments_specialist_business
    FOREIGN KEY (specialist_id, business_id)
    REFERENCES specialists (id, business_id)
    ON DELETE RESTRICT,

  CONSTRAINT chk_appointments_status_valid CHECK (
    status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
  ),
  CONSTRAINT chk_appointments_price_snapshot_bounds CHECK (
    service_price_toman_snapshot >= 0 AND service_price_toman_snapshot <= 100000000000
  ),
  CONSTRAINT chk_appointments_duration_snapshot_bounds CHECK (
    duration_minutes_snapshot > 0 AND duration_minutes_snapshot <= 600
  ),
  CONSTRAINT chk_appointments_buffer_snapshot_bounds CHECK (
    buffer_minutes_snapshot >= 0 AND buffer_minutes_snapshot <= 120
  ),
  -- تضمین برابری دقیق ریاضی پایان خدمت با شروع + مدت خدمت
  CONSTRAINT chk_appointments_service_ends_exact CHECK (
    service_ends_at = service_starts_at + make_interval(mins => duration_minutes_snapshot)
  ),
  -- تضمین برابری دقیق ریاضی پایان اشغال متخصص با پایان خدمت + فاصله استراحت Snapshot شده
  CONSTRAINT chk_appointments_occupied_until_exact CHECK (
    occupied_until_at = service_ends_at + make_interval(mins => buffer_minutes_snapshot)
  ),
  -- سازگاری وضعیت لغو با زمان لغو
  CONSTRAINT chk_appointments_cancellation_consistency CHECK (
    (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
    OR (status <> 'CANCELLED')
  ),

  -- قید انحصاری سطح دیتابیس برای جلوگیری قطعی از هم‌پوشانی زمان خدمت + استراحت یک متخصص
  -- این قید در تمام حالات زیر به طور خودکار توسط موتور PostgreSQL بررسی می‌شود:
  -- ۱. ثبت نوبت جدید با وضعیت PENDING یا CONFIRMED
  -- ۲. تغییر متخصص (UPDATE specialist_id) روی نوبت فعال
  -- ۳. تغییر ساعت یا مدت نوبت فعال
  -- ۴. تغییر وضعیت یک نوبت لغوشده (CANCELLED) به وضعیت فعال (PENDING / CONFIRMED)
  -- ۵. با تغییر وضعیت به CANCELLED، سطر از شرط WHERE خارج شده و بازه زمانی بلافاصله آزاد می‌شود
  CONSTRAINT excl_appointments_specialist_active_overlap
    EXCLUDE USING gist (
      specialist_id WITH =,
      occupied_range WITH &&
    )
    WHERE (status IN ('PENDING', 'CONFIRMED'))
);

CREATE INDEX idx_appointments_business_starts_at
ON appointments (business_id, service_starts_at DESC);

CREATE INDEX idx_appointments_customer_user
ON appointments (customer_user_id, service_starts_at DESC)
WHERE (customer_user_id IS NOT NULL);

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۳. جدول ثبت تاریخچه تغییر وضعیت نوبت‌ها (Audit Trail)
CREATE TABLE appointment_status_logs (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id     UUID        NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  previous_status    VARCHAR(24) NULL,
  new_status         VARCHAR(24) NOT NULL,
  changed_by_user_id UUID        NULL REFERENCES users(id) ON DELETE SET NULL,
  note               TEXT        NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_apt_log_new_status_valid CHECK (
    new_status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
  )
);

CREATE INDEX idx_appointment_status_logs_apt
ON appointment_status_logs (appointment_id, created_at DESC);

-- ۴. جدول پرونده CRM مشتریان هر سالن در پنل کسب‌وکار (/app/customers -> CustomerRecord)
CREATE TABLE business_customers (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_demo_id         VARCHAR(64)  NULL UNIQUE,
  business_id            UUID         NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id                UUID         NULL REFERENCES users(id) ON DELETE SET NULL,
  full_name              VARCHAR(120) NOT NULL,
  phone                  VARCHAR(15)  NOT NULL,
  phone_masked           VARCHAR(20)  NOT NULL,
  city                   VARCHAR(60)  NOT NULL DEFAULT '',
  total_visits           INTEGER      NOT NULL DEFAULT 0,
  last_visit_jalali      VARCHAR(10)  NULL,
  total_spent_toman      BIGINT       NOT NULL DEFAULT 0,
  favorite_service_title VARCHAR(160) NOT NULL DEFAULT '',
  notes                  TEXT         NOT NULL DEFAULT '',
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_business_customers_business_phone UNIQUE (business_id, phone),
  CONSTRAINT chk_business_customers_visits_nonneg CHECK (total_visits >= 0),
  CONSTRAINT chk_business_customers_spent_bounds CHECK (
    total_spent_toman >= 0 AND total_spent_toman <= 1000000000000
  )
);

CREATE INDEX idx_business_customers_business
ON business_customers (business_id, total_visits DESC);

CREATE TRIGGER trg_business_customers_updated_at
BEFORE UPDATE ON business_customers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();

-- ۵. جدول سالن‌های منتخب مشتری (/me/favorites -> favoriteBusinessIds)
CREATE TABLE customer_favorites (
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, business_id)
);

CREATE INDEX idx_customer_favorites_business
ON customer_favorites (business_id);
