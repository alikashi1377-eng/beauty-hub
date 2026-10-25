/**
 * اسکریپت دستی بارگذاری داده‌های پایه و اولیه (Initial Seed) در دیتابیس PostgreSQL
 * اجرا به صورت کاملاً دستی پس از اجرای Migrationها:
 *   npm run db:seed
 *
 * این اسکریپت کاملاً Idempotent است (با استفاده از ON CONFLICT) و هرگز به صورت خودکار
 * هنگام بالا آمدن سرور اجرا نمی‌شود.
 */
import { loadServerEnv } from '../config/env';
import { closeDatabasePool, getOrCreatePool } from './pool';
import {
  SAMPLE_APPOINTMENTS,
  SAMPLE_BUSINESSES,
  SAMPLE_CAMPAIGNS,
  SAMPLE_CATEGORIES,
  SAMPLE_CUSTOMERS,
  SAMPLE_GALLERY,
  SAMPLE_REVIEWS,
  SAMPLE_SERVICES,
  SAMPLE_SPECIALISTS,
  SAMPLE_SUBSCRIPTION_PLANS,
} from '../../src/mocks/sampleData';
import {
  jalaliSlotToTimestamptz,
  normalizeWorkingTimePair,
  toEnglishDigits,
} from '../repositories/beautyhubRepository';

async function runSeed(): Promise<void> {
  const env = loadServerEnv();
  if (!env.databaseUrl) {
    console.error(
      '[db:seed] خطا: متغیر محیطی DATABASE_URL تنظیم نشده است. امکان بارگذاری داده‌های پایه وجود ندارد.'
    );
    process.exitCode = 1;
    return;
  }

  const pool = getOrCreatePool(env);
  if (!pool) {
    console.error('[db:seed] خطا در ایجاد Pool اتصال به دیتابیس.');
    process.exitCode = 1;
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ۱. تنظیمات کلان پلتفرم
    await client.query(`
      INSERT INTO platform_settings (id, brand_name, default_trial_days)
      VALUES (1, 'BeautyHub', 14)
      ON CONFLICT (id) DO NOTHING
    `);

    // ۲. کاربر مالک نمونه و مشتری نمونه
    const ownerRes = await client.query(`
      INSERT INTO users (phone, full_name, default_city)
      VALUES ('09121112233', 'مدیر نمونه سالن‌های BeautyHub', 'تهران')
      ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const ownerUserId = String(ownerRes.rows[0].id);

    const customerRes = await client.query(`
      INSERT INTO users (phone, full_name, default_city)
      VALUES ('09123456789', 'المیرا شمس', 'تهران')
      ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    const customerUserId = String(customerRes.rows[0].id);

    // ۳. دسته‌بندی‌ها
    const categoryIdBySlug = new Map<string, string>();
    for (let i = 0; i < SAMPLE_CATEGORIES.length; i++) {
      const cat = SAMPLE_CATEGORIES[i];
      const res = await client.query(
        `
        INSERT INTO categories (
          legacy_demo_id, slug, title, subtitle, target_audience, icon_name, service_count, sort_order, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        ON CONFLICT (slug) DO UPDATE
        SET
          legacy_demo_id = EXCLUDED.legacy_demo_id,
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          target_audience = EXCLUDED.target_audience,
          icon_name = EXCLUDED.icon_name,
          service_count = EXCLUDED.service_count,
          sort_order = EXCLUDED.sort_order
        RETURNING id
        `,
        [
          cat.id,
          cat.slug,
          cat.title,
          cat.subtitle,
          cat.targetAudience,
          cat.iconName,
          cat.serviceCount,
          i + 1,
        ]
      );
      categoryIdBySlug.set(cat.slug, String(res.rows[0].id));
    }

    // ۴. پلن‌های اشتراک ماهانه
    for (let i = 0; i < SAMPLE_SUBSCRIPTION_PLANS.length; i++) {
      const plan = SAMPLE_SUBSCRIPTION_PLANS[i];
      await client.query(
        `
        INSERT INTO subscription_plans (
          legacy_demo_id, code, name, audience, monthly_price_toman,
          staff_limit_label, max_staff_count, sms_quota_monthly,
          features, comparison_meta, is_recommended, is_active, sort_order
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, TRUE, $12)
        ON CONFLICT (code) DO UPDATE
        SET
          legacy_demo_id = EXCLUDED.legacy_demo_id,
          name = EXCLUDED.name,
          audience = EXCLUDED.audience,
          monthly_price_toman = EXCLUDED.monthly_price_toman,
          staff_limit_label = EXCLUDED.staff_limit_label,
          sms_quota_monthly = EXCLUDED.sms_quota_monthly,
          features = EXCLUDED.features,
          comparison_meta = EXCLUDED.comparison_meta,
          is_recommended = EXCLUDED.is_recommended
        `,
        [
          plan.id,
          plan.id,
          plan.name,
          plan.audience,
          plan.monthlyPriceToman,
          plan.staffLimit,
          i === 0 ? 1 : i === 1 ? 8 : 50,
          plan.smsQuotaMonthly,
          JSON.stringify(plan.features),
          JSON.stringify(plan.comparison),
          Boolean(plan.isRecommended),
          i + 1,
        ]
      );
    }

    // ۵. کسب‌وکارها و ساعات کاری
    const businessUuidByLegacy = new Map<string, string>();
    const defaultCatId = Array.from(categoryIdBySlug.values())[0];

    for (let i = 0; i < SAMPLE_BUSINESSES.length; i++) {
      const biz = SAMPLE_BUSINESSES[i];
      const catId = categoryIdBySlug.get(biz.categorySlug) ?? defaultCatId;

      const res = await client.query(
        `
        INSERT INTO businesses (
          legacy_demo_id, owner_user_id, primary_category_id, slug, name,
          type, type_label, city, neighborhood, address, map_lat, map_lng,
          phone_display, instagram_handle, short_description, about_text,
          visual_theme, rating_avg, review_count, starting_price_toman,
          verified_badge, approval_status, subscription_plan, subscription_status, is_featured
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
        ON CONFLICT (slug) DO UPDATE
        SET
          legacy_demo_id = EXCLUDED.legacy_demo_id,
          name = EXCLUDED.name,
          city = EXCLUDED.city,
          neighborhood = EXCLUDED.neighborhood,
          address = EXCLUDED.address
        RETURNING id
        `,
        [
          biz.id,
          ownerUserId,
          catId,
          biz.slug,
          biz.name,
          biz.type,
          biz.typeLabel,
          biz.city,
          biz.neighborhood,
          biz.address,
          biz.mapLat ?? null,
          biz.mapLng ?? null,
          biz.phoneDisplay,
          biz.instagramHandle ?? null,
          biz.shortDescription,
          biz.aboutText,
          biz.visualTheme,
          biz.rating,
          biz.reviewCount,
          biz.startingPriceToman,
          biz.verifiedBadge,
          biz.approvalStatus,
          biz.subscriptionPlan,
          biz.subscriptionStatus,
          Boolean(biz.featured ?? i < 3),
        ]
      );

      const bizUuid = String(res.rows[0].id);
      businessUuidByLegacy.set(biz.id, bizUuid);

      await client.query(
        `INSERT INTO business_settings (business_id, buffer_minutes) VALUES ($1, 15) ON CONFLICT (business_id) DO NOTHING`,
        [bizUuid]
      );

      for (let d = 0; d < biz.workingHours.length; d++) {
        const wh = biz.workingHours[d];
        const { openTimeSql, closeTimeSql } = normalizeWorkingTimePair(
          wh.openTime,
          wh.closeTime
        );
        await client.query(
          `
          INSERT INTO business_working_hours (
            business_id, day_of_week, day_name, is_open, open_time, close_time
          )
          VALUES ($1, $2, $3, $4, $5::time, $6::time)
          ON CONFLICT (business_id, day_of_week) DO UPDATE
          SET
            day_name = EXCLUDED.day_name,
            is_open = EXCLUDED.is_open,
            open_time = EXCLUDED.open_time,
            close_time = EXCLUDED.close_time
          `,
          [bizUuid, d, wh.dayName, wh.isOpen, openTimeSql, closeTimeSql]
        );
      }
    }

    // ۶. خدمات
    const serviceUuidByLegacy = new Map<string, string>();
    for (const srv of SAMPLE_SERVICES) {
      const bizUuid = businessUuidByLegacy.get(srv.businessId);
      const catId = categoryIdBySlug.get(srv.categorySlug) ?? defaultCatId;
      if (!bizUuid) continue;

      const res = await client.query(
        `
        INSERT INTO services (
          legacy_demo_id, business_id, category_id, category_slug, category_label,
          title, description, duration_minutes, price_toman, is_popular, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
        ON CONFLICT (legacy_demo_id) DO UPDATE
        SET
          title = EXCLUDED.title,
          price_toman = EXCLUDED.price_toman,
          duration_minutes = EXCLUDED.duration_minutes
        RETURNING id
        `,
        [
          srv.id,
          bizUuid,
          catId,
          srv.categorySlug,
          srv.category,
          srv.title,
          srv.description,
          srv.durationMinutes,
          srv.priceToman,
          Boolean(srv.isPopular),
        ]
      );
      serviceUuidByLegacy.set(srv.id, String(res.rows[0].id));
    }

    // ۷. متخصصان
    const specialistUuidByLegacy = new Map<string, string>();
    for (const spc of SAMPLE_SPECIALISTS) {
      const bizUuid = businessUuidByLegacy.get(spc.businessId);
      if (!bizUuid) continue;

      const res = await client.query(
        `
        INSERT INTO specialists (
          legacy_demo_id, business_id, slug, full_name, role_title,
          experience_years, rating_avg, review_count, specialties, bio,
          is_independent, is_active, city, starting_price_toman
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12, $13)
        ON CONFLICT (slug) DO UPDATE
        SET
          legacy_demo_id = EXCLUDED.legacy_demo_id,
          full_name = EXCLUDED.full_name,
          role_title = EXCLUDED.role_title
        RETURNING id
        `,
        [
          spc.id,
          bizUuid,
          spc.slug,
          spc.fullName,
          spc.roleTitle,
          spc.experienceYears,
          spc.rating,
          spc.reviewCount,
          spc.specialties,
          spc.bio,
          spc.isIndependent,
          spc.city ?? 'تهران',
          spc.startingPriceToman ?? 350000,
        ]
      );
      specialistUuidByLegacy.set(spc.id, String(res.rows[0].id));
    }

    // ۸. نوبت‌های نمونه
    for (const apt of SAMPLE_APPOINTMENTS) {
      const bizUuid = businessUuidByLegacy.get(apt.businessId);
      const srvUuid = serviceUuidByLegacy.get(apt.serviceId);
      const spcUuid = specialistUuidByLegacy.get(apt.specialistId);
      if (!bizUuid || !srvUuid || !spcUuid) continue;

      const startsAt = jalaliSlotToTimestamptz(apt.dateJalali, apt.timeSlot);

      await client.query(
        `
        INSERT INTO appointments (
          legacy_demo_id, reference_code, business_id, customer_user_id,
          service_id, specialist_id, service_title_snapshot,
          service_price_toman_snapshot, duration_minutes_snapshot,
          buffer_minutes_snapshot, specialist_name_snapshot,
          customer_name, customer_phone, customer_phone_masked,
          date_jalali, time_slot_label, service_starts_at,
          service_ends_at, occupied_until_at, status, notes,
          cancelled_at, cancelled_reason
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9::smallint, 15::smallint,
          $10, $11, '09123456789', $12, $13, $14,
          $15::timestamptz,
          $15::timestamptz + ($9::smallint * INTERVAL '1 minute'),
          $15::timestamptz + (($9::smallint + 15) * INTERVAL '1 minute'),
          $16, $17,
          CASE WHEN $16 = 'CANCELLED' THEN NOW() ELSE NULL END,
          CASE WHEN $16 = 'CANCELLED' THEN 'لغو آزمایشی اولیه' ELSE NULL END
        )
        ON CONFLICT (reference_code) DO NOTHING
        `,
        [
          apt.id,
          apt.referenceCode,
          bizUuid,
          customerUserId,
          srvUuid,
          spcUuid,
          apt.serviceTitle,
          apt.priceToman,
          apt.durationMinutes,
          apt.specialistName,
          apt.customerName,
          apt.customerPhoneMasked,
          apt.dateJalali,
          apt.timeSlot,
          startsAt.toISOString(),
          apt.status,
          apt.notes ?? null,
        ]
      );
    }

    // ۹. پرونده مشتریان (CRM)، دیدگاه‌ها، گالری، کمپین‌ها و علاقه‌مندی‌ها
    const primaryBizUuid = businessUuidByLegacy.get('biz-1');
    if (primaryBizUuid) {
      for (let i = 0; i < SAMPLE_CUSTOMERS.length; i++) {
        const cust = SAMPLE_CUSTOMERS[i];
        const fakePhone = `0912345670${i}`;
        await client.query(
          `
          INSERT INTO business_customers (
            legacy_demo_id, business_id, full_name, phone, phone_masked,
            city, total_visits, last_visit_jalali, total_spent_toman,
            favorite_service_title, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (legacy_demo_id) DO NOTHING
          `,
          [
            cust.id,
            primaryBizUuid,
            cust.fullName,
            toEnglishDigits(fakePhone),
            cust.phoneMasked,
            cust.city,
            cust.totalVisits,
            cust.lastVisitJalali,
            cust.totalSpentToman,
            cust.favoriteService,
            cust.notes,
          ]
        );
      }

      for (const camp of SAMPLE_CAMPAIGNS) {
        await client.query(
          `
          INSERT INTO marketing_campaigns (
            legacy_demo_id, business_id, title, target_segment,
            discount_percent, channel, status_label, created_at_jalali
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (legacy_demo_id) DO NOTHING
          `,
          [
            camp.id,
            primaryBizUuid,
            camp.title,
            camp.targetSegment,
            camp.discountPercent,
            camp.channel,
            camp.statusLabel,
            camp.createdAtJalali,
          ]
        );
      }
    }

    for (const rev of SAMPLE_REVIEWS) {
      const bizUuid = businessUuidByLegacy.get(rev.businessId);
      if (!bizUuid) continue;
      await client.query(
        `
        INSERT INTO reviews (
          legacy_demo_id, business_id, specialist_slug, author_name,
          service_title, rating, date_jalali, comment, is_published
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        ON CONFLICT (legacy_demo_id) DO NOTHING
        `,
        [
          rev.id,
          bizUuid,
          rev.specialistSlug ?? null,
          rev.authorName,
          rev.serviceTitle,
          rev.rating,
          rev.dateJalali,
          rev.comment,
        ]
      );
    }

    for (const gal of SAMPLE_GALLERY) {
      const bizUuid = businessUuidByLegacy.get(gal.businessId);
      if (!bizUuid) continue;
      await client.query(
        `
        INSERT INTO gallery_items (
          legacy_demo_id, business_id, title, category_label, theme
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (legacy_demo_id) DO NOTHING
        `,
        [gal.id, bizUuid, gal.title, gal.categoryLabel, gal.theme]
      );
    }

    for (const favLegacyId of ['biz-1', 'biz-2', 'biz-5']) {
      const bizUuid = businessUuidByLegacy.get(favLegacyId);
      if (bizUuid) {
        await client.query(
          `
          INSERT INTO customer_favorites (user_id, business_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, business_id) DO NOTHING
          `,
          [customerUserId, bizUuid]
        );
      }
    }

    await client.query('COMMIT');
    console.log(
      '[db:seed] بارگذاری داده‌های پایه و اولیه در PostgreSQL با موفقیت انجام شد.'
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[db:seed] خطا در اجرای بارگذاری داده‌های پایه:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await closeDatabasePool();
  }
}

void runSeed();
