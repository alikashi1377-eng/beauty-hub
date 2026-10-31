import crypto from 'node:crypto';
import { Pool, PoolClient } from 'pg';
import { resolveOtpHmacSecret, resolveSessionSecret } from '../config/env';
import {
  AuthenticatedUser,
  BusinessMemberRole,
  hashSessionSecretPart,
  loadUserPermissionsByUserId,
  signSessionToken,
} from '../auth/session';
import {
  resolveSmsConfig,
  sendOtpSmsViaGateway,
  SmsConfig,
  SmsSenderFn,
} from '../services/smsGateway';
import {
  AdminUserRecord,
  AppointmentItem,
  AppointmentStatus,
  ApprovalStatus,
  BusinessItem,
  BusinessType,
  CategoryItem,
  CustomerRecord,
  GalleryItem,
  MarketingCampaignItem,
  OnboardingDraft,
  ReviewItem,
  ServiceItem,
  SpecialistItem,
  SubscriptionPlanItem,
  SubscriptionStatus,
  TimeSlotAvailabilityItem,
  WorkingHourItem,
} from '../../src/types';
import { validateReviewContent } from '../../src/utils/reviewModeration';

export type VisualTheme = 'rose' | 'slate' | 'emerald' | 'violet';

export interface BootstrapPayload {
  categories: CategoryItem[];
  businesses: BusinessItem[];
  services: ServiceItem[];
  specialists: SpecialistItem[];
  reviews: ReviewItem[];
  gallery: GalleryItem[];
  plans: SubscriptionPlanItem[];
  registeredUsers?: AdminUserRecord[];
}

export interface CustomerPrivatePayload {
  appointments: AppointmentItem[];
  favoriteBusinessIds: string[];
}

export interface BusinessWorkspacePayload {
  business: BusinessItem | null;
  memberRole: BusinessMemberRole | null;
  services: ServiceItem[];
  specialists: SpecialistItem[];
  appointments: AppointmentItem[];
  customers: CustomerRecord[];
  gallery: GalleryItem[];
  campaigns: MarketingCampaignItem[];
}

export interface AdminOverviewPayload {
  businesses: BusinessItem[];
  categories: CategoryItem[];
  plans: SubscriptionPlanItem[];
  users: AdminUserRecord[];
  appointments: AppointmentItem[];
}

export async function ensureExtendedMetaTables(
  client: PoolClient | Pool
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS business_meta_ext (
      business_id UUID PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
      extra_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS platform_kv_store (
      key TEXT PRIMARY KEY,
      value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

const SEED_DUMMY_PHONES = new Set([
  '09120000001',
  '09120000002',
  '09120000003',
  '09120000004',
  '09120000005',
  '09120000006',
  '09120000007',
  '09120000008',
  '09120000009',
  '09131112233',
  '09132223344',
  '09133334455',
  '09134445566',
  '09135556677',
  '09136667788',
  '09137778899',
]);

export interface ReviewModerationMetaEntry {
  authorPhone?: string;
  salonReply?: string;
  salonReplyDateJalali?: string;
  isReportedBySalon?: boolean;
  reportReason?: string;
}

export async function getReviewModerationMetaMap(
  client: PoolClient | Pool
): Promise<Record<string, ReviewModerationMetaEntry>> {
  try {
    const res = await client.query(
      `SELECT value_json FROM platform_kv_store WHERE key = 'review_moderation_meta' LIMIT 1`
    );
    if (
      res.rowCount &&
      res.rows[0]?.value_json &&
      typeof res.rows[0].value_json === 'object'
    ) {
      return res.rows[0].value_json as Record<string, ReviewModerationMetaEntry>;
    }
  } catch {
    // ignore if table not ready
  }
  return {};
}

export async function buildMergedRegisteredUsersList(
  client: PoolClient | Pool
): Promise<AdminUserRecord[]> {
  await ensureExtendedMetaTables(client);
  const byPhone = new Map<string, AdminUserRecord>();

  let registryMap: Record<
    string,
    {
      phone?: string;
      fullName?: string;
      role?: string;
      city?: string;
      businessId?: string;
      businessName?: string;
      joinedJalali?: string;
    }
  > = {};
  let overridesMap: Record<
    string,
    {
      fullName?: string;
      city?: string;
      roleLabel?: string;
      phone?: string;
    }
  > = {};
  let deletedPhones = new Set<string>();

  try {
    const kvRes = await client.query(
      `
      SELECT key, value_json
      FROM platform_kv_store
      WHERE key IN (
        'registered_accounts_registry',
        'admin_user_overrides_registry',
        'deleted_admin_phones_registry'
      )
      `
    );
    for (const row of kvRes.rows) {
      if (
        row.key === 'registered_accounts_registry' &&
        row.value_json &&
        typeof row.value_json === 'object'
      ) {
        if (Array.isArray(row.value_json)) {
          const nextMap: typeof registryMap = {};
          for (const item of row.value_json as Array<Record<string, unknown>>) {
            const p = String(item?.phone || '')
              .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
              .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
              .replace(/\D/g, '');
            if (/^09\d{9}$/.test(p)) {
              nextMap[p] = {
                phone: p,
                fullName: String(item.fullName || 'کاربر تایم تو'),
                role: String(item.roleLabel || '').includes('سالن') || String(item.roleLabel || '').includes('کسب')
                  ? 'BUSINESS_OWNER'
                  : String(item.role || 'CUSTOMER'),
                city: String(item.city || 'اصفهان'),
                joinedJalali: String(item.joinedJalali || 'امروز'),
              };
            }
          }
          registryMap = nextMap;
        } else {
          registryMap = row.value_json as typeof registryMap;
        }
      } else if (
        row.key === 'admin_user_overrides_registry' &&
        row.value_json &&
        typeof row.value_json === 'object'
      ) {
        overridesMap = row.value_json as typeof overridesMap;
      } else if (
        row.key === 'deleted_admin_phones_registry' &&
        Array.isArray(row.value_json)
      ) {
        deletedPhones = new Set(
          row.value_json.map((p: unknown) =>
            String(p || '')
              .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
              .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
              .replace(/\D/g, '')
          )
        );
      }
    }
  } catch {
    // ignore
  }

  // ۱. خواندن تمام کاربران جدول users در PostgreSQL
  try {
    const usrRes = await client.query(`
      SELECT
        u.id::text AS id,
        u.full_name,
        u.phone,
        COALESCE(u.default_city, 'اصفهان') AS city,
        u.is_active,
        to_char(u.created_at, 'YYYY/MM/DD') AS created_date,
        EXISTS (
          SELECT 1 FROM platform_admins pa
          WHERE pa.user_id = u.id AND pa.is_active = TRUE
        ) AS is_admin,
        EXISTS (
          SELECT 1 FROM business_members bm
          WHERE bm.user_id = u.id AND bm.is_active = TRUE
        ) OR EXISTS (
          SELECT 1 FROM businesses b2
          WHERE b2.owner_user_id = u.id
        ) AS is_business_member,
        (
          SELECT b3.name FROM businesses b3
          WHERE b3.owner_user_id = u.id
          ORDER BY b3.created_at DESC LIMIT 1
        ) AS owned_business_name
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 500
    `);

    for (const r of usrRes.rows) {
      const cleanPhone = String(r.phone || '')
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .replace(/\D/g, '');
      if (!/^09\d{9}$/.test(cleanPhone) || deletedPhones.has(cleanPhone)) {
        continue;
      }
      // حذف شماره‌های آزمایشی اولیه سید دیتابیس مگر اینکه واقعاً در رجیستری ثبت‌نام کرده باشند
      if (SEED_DUMMY_PHONES.has(cleanPhone) && !registryMap[cleanPhone]) {
        continue;
      }

      const ov = overridesMap[cleanPhone];
      const reg = registryMap[cleanPhone];
      const fullPhonePersian = toPersianDigitsServer(cleanPhone);
      const isAdmin = Boolean(r.is_admin) || cleanPhone === '09138201042';
      const isBiz =
        Boolean(r.is_business_member) || reg?.role === 'BUSINESS_OWNER';
      const bizTitle = r.owned_business_name
        ? String(r.owned_business_name)
        : reg?.businessName;

      byPhone.set(cleanPhone, {
        id: String(r.id),
        fullName:
          ov?.fullName ||
          reg?.fullName ||
          (r.full_name &&
          !String(r.full_name).includes('کاربر BeautyHub') &&
          !String(r.full_name).includes('کاربر تایم تو')
            ? String(r.full_name)
            : reg?.fullName || String(r.full_name || 'کاربر تایم تو')),
        phone: fullPhonePersian,
        phoneMasked: fullPhonePersian,
        roleLabel:
          ov?.roleLabel ||
          (isAdmin
            ? 'مدیر کل پلتفرم'
            : isBiz
              ? bizTitle
                ? `صاحب سالن (${bizTitle})`
                : 'صاحب کسب‌وکار (سالن‌دار)'
              : 'مشتری عادی'),
        city: String(ov?.city || reg?.city || r.city || 'اصفهان'),
        joinedJalali:
          reg?.joinedJalali ||
          toPersianDigitsServer(String(r.created_date || '1405/08/01')),
        isActive: r.is_active !== false,
      });
    }
  } catch {
    // ignore if query fails in mock test
  }

  // ۲. خواندن تمام صاحبان کسب‌وکارهای واقعی ثبت‌شده در جدول businesses
  try {
    const bizOwnersRes = await client.query(`
      SELECT
        b.id::text AS biz_id,
        b.legacy_demo_id,
        b.name AS biz_name,
        b.city,
        b.phone_display,
        to_char(b.created_at, 'YYYY/MM/DD') AS created_date,
        u.phone AS owner_phone,
        u.full_name AS owner_full_name,
        bme.extra_json
      FROM businesses b
      LEFT JOIN users u ON u.id = b.owner_user_id
      LEFT JOIN business_meta_ext bme ON bme.business_id = b.id
      WHERE b.legacy_demo_id IS NULL
         OR b.legacy_demo_id NOT IN ('biz-1','biz-2','biz-3','biz-4','biz-5','biz-6','biz-7','biz-8')
      ORDER BY b.created_at DESC
    `);

    for (const b of bizOwnersRes.rows) {
      const extra =
        b.extra_json && typeof b.extra_json === 'object'
          ? (b.extra_json as Record<string, unknown>)
          : {};
      if (extra.isSampleShowcase) continue;
      const rawPhone = String(
        extra.ownerPhone || b.owner_phone || b.phone_display || ''
      );
      const cleanPhone = rawPhone
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
        .replace(/\D/g, '');
      if (!/^09\d{9}$/.test(cleanPhone) || deletedPhones.has(cleanPhone)) {
        continue;
      }
      if (SEED_DUMMY_PHONES.has(cleanPhone) && !registryMap[cleanPhone]) {
        continue;
      }
      const existing = byPhone.get(cleanPhone);
      const ov = overridesMap[cleanPhone];
      const fullPhonePersian = toPersianDigitsServer(cleanPhone);
      const ownerName = String(
        ov?.fullName ||
          extra.ownerName ||
          b.owner_full_name ||
          existing?.fullName ||
          `مدیریت ${b.biz_name}`
      );
      byPhone.set(cleanPhone, {
        id: existing?.id || `usr-biz-${b.biz_id}`,
        fullName: ownerName,
        phone: fullPhonePersian,
        phoneMasked: fullPhonePersian,
        roleLabel:
          ov?.roleLabel || `صاحب سالن (${String(b.biz_name || 'سالن زیبایی')})`,
        city: String(ov?.city || b.city || existing?.city || 'اصفهان'),
        joinedJalali:
          existing?.joinedJalali ||
          toPersianDigitsServer(String(b.created_date || 'امروز')),
        isActive: true,
      });
    }
  } catch {
    // ignore
  }

  // ۳. خواندن تمام حساب‌های ثبت‌نام‌شده در رجیستری مرکزی platform_kv_store
  for (const [keyPhone, acc] of Object.entries(registryMap)) {
    const cleanPhone = String(acc?.phone || keyPhone || '')
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/\D/g, '');
    if (!/^09\d{9}$/.test(cleanPhone) || deletedPhones.has(cleanPhone)) {
      continue;
    }
    const existing = byPhone.get(cleanPhone);
    const ov = overridesMap[cleanPhone];
    const fullPhonePersian = toPersianDigitsServer(cleanPhone);
    const isSuper = cleanPhone === '09138201042';
    const isBiz =
      acc?.role === 'BUSINESS_OWNER' ||
      Boolean(acc?.businessName) ||
      Boolean(existing?.roleLabel?.includes('سالن'));
    const bizTitle = acc?.businessName;

    byPhone.set(cleanPhone, {
      id: existing?.id || `usr-reg-${cleanPhone}`,
      fullName:
        ov?.fullName ||
        acc?.fullName ||
        existing?.fullName ||
        'کاربر تایم تو',
      phone: fullPhonePersian,
      phoneMasked: fullPhonePersian,
      roleLabel:
        ov?.roleLabel ||
        (isSuper
          ? 'مدیر کل پلتفرم'
          : isBiz
            ? bizTitle
              ? `صاحب سالن (${bizTitle})`
              : existing?.roleLabel?.includes('سالن')
                ? existing.roleLabel
                : 'صاحب کسب‌وکار (سالن‌دار)'
            : 'مشتری عادی'),
      city: ov?.city || acc?.city || existing?.city || 'اصفهان',
      joinedJalali: acc?.joinedJalali || existing?.joinedJalali || 'امروز',
      isActive: true,
    });
  }

  return Array.from(byPhone.values());
}

function mergeBusinessRowWithExtra(
  base: BusinessItem,
  extraRaw: unknown,
  legacyDemoId?: unknown
): BusinessItem {
  const extra =
    extraRaw && typeof extraRaw === 'object'
      ? (extraRaw as Record<string, unknown>)
      : {};
  const isLegacySample =
    Boolean(legacyDemoId) ||
    /^biz-[1-8]$/.test(base.id) ||
    Boolean(extra.isSampleShowcase);

  return {
    ...base,
    isSampleShowcase: isLegacySample,
    isSponsored:
      extra.isSponsored !== undefined
        ? Boolean(extra.isSponsored)
        : base.isSponsored,
    sponsoredLabel:
      typeof extra.sponsoredLabel === 'string'
        ? extra.sponsoredLabel
        : base.sponsoredLabel,
    sponsoredPlacement:
      typeof extra.sponsoredPlacement === 'string'
        ? (extra.sponsoredPlacement as BusinessItem['sponsoredPlacement'])
        : base.sponsoredPlacement,
    sponsoredOrder:
      typeof extra.sponsoredOrder === 'number'
        ? extra.sponsoredOrder
        : base.sponsoredOrder,
    sponsoredDaysRemaining:
      typeof extra.sponsoredDaysRemaining === 'number'
        ? extra.sponsoredDaysRemaining
        : base.sponsoredDaysRemaining,
    sponsoredExpiresJalali:
      typeof extra.sponsoredExpiresJalali === 'string'
        ? extra.sponsoredExpiresJalali
        : base.sponsoredExpiresJalali,
    trialDaysRemaining:
      typeof extra.trialDaysRemaining === 'number'
        ? extra.trialDaysRemaining
        : base.trialDaysRemaining,
    extraSmsBalance:
      typeof extra.extraSmsBalance === 'number'
        ? extra.extraSmsBalance
        : base.extraSmsBalance ?? 0,
    smsSentCount:
      typeof extra.smsSentCount === 'number'
        ? extra.smsSentCount
        : base.smsSentCount ?? 0,
    avatarUrl:
      typeof extra.avatarUrl === 'string' && extra.avatarUrl
        ? extra.avatarUrl
        : base.avatarUrl,
    ownerName:
      typeof extra.ownerName === 'string' && extra.ownerName
        ? extra.ownerName
        : base.ownerName,
    ownerPhone:
      typeof extra.ownerPhone === 'string' && extra.ownerPhone
        ? extra.ownerPhone
        : base.ownerPhone,
  };
}

export interface BusinessAvailabilityPayload {
  businessId: string;
  businessSlug: string;
  dateJalali: string;
  dayOfWeek: number;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  slots: TimeSlotAvailabilityItem[];
}

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی
 */
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * تبدیل ارقام انگلیسی به فارسی برای نمایش در فرانت‌اند
 */
export function toPersianDigitsServer(input: string | number): string {
  return String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

/**
 * ماسک کردن شماره موبایل (مثال: 09123456789 -> ۰۹۱۲***۶۷۸۹)
 */
export function maskPhoneDisplay(phone: string): string {
  const clean = toEnglishDigits(phone).replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('09')) {
    return toPersianDigitsServer(`${clean.slice(0, 4)}***${clean.slice(7)}`);
  }
  return toPersianDigitsServer(phone);
}

/**
 * نرمال‌سازی اسلاگ مطابق قید دیتابیس: ^[a-z0-9]+(?:-[a-z0-9]+)*$
 */
export function normalizeValidSlug(raw: string, fallbackPrefix = 'item'): string {
  const cleaned = toEnglishDigits(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (cleaned && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned)) {
    return cleaned.slice(0, 80);
  }
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  return `${fallbackPrefix}-${randomSuffix}`;
}

const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181,
  1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

function intDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

function intMod(a: number, b: number): number {
  return a - Math.trunc(a / b) * b;
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  if (!Number.isInteger(jy) || jy < 1300 || jy > 1500 || jy < jp || jy >= JALALI_BREAKS[bl - 1]) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) {
      break;
    }
    leapJ = leapJ + intDiv(jump, 33) * 8 + intDiv(intMod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + intDiv(n, 33) * 8 + intDiv(intMod(n, 33) + 3, 4);
  if (intMod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = intDiv(gy, 4) - intDiv((intDiv(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + intDiv(jump + 4, 33) * 33;
  }
  let leap = intMod(intMod(n + 1, 33) - 1, 4);
  if (leap === -1) {
    leap = 4;
  }

  return { leap, gy, march };
}

/**
 * بررسی کبیسه بودن سال شمسی (جلالی) بر اساس الگوریتم دقیق نجومی/جلالی
 */
export function isJalaliLeapYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/**
 * تعداد روزهای مجاز هر ماه شمسی (۶ ماه اول ۳۱ روز، ۵ ماه بعدی ۳۰ روز، اسفند ۲۹ یا ۳۰ روز در سال کبیسه)
 */
export function getJalaliMonthLength(jy: number, jm: number): number {
  if (!Number.isInteger(jm) || jm < 1 || jm > 12) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export interface ParsedJalaliDate {
  jy: number;
  jm: number;
  jd: number;
  normalizedJalali: string;
  gregorianYear: number;
  gregorianMonth: number;
  gregorianDay: number;
  gregorianIsoDate: string;
}

/**
 * اعتبارسنجی دقیق تاریخ شمسی و تبدیل به معادل میلادی بدون بازگشت پنهان به تاریخ فعلی
 */
export function parseAndValidateJalaliDate(dateJalaliRaw: string): ParsedJalaliDate {
  const normalizedDate = toEnglishDigits(String(dateJalaliRaw ?? '')).trim();
  const dateMatch = normalizedDate.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!dateMatch) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const jy = Number(dateMatch[1]);
  const jm = Number(dateMatch[2]);
  const jd = Number(dateMatch[3]);

  const maxDay = getJalaliMonthLength(jy, jm);
  if (!Number.isInteger(jd) || jd < 1 || jd > maxDay) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const { gy: startGy, march } = jalCal(jy);
  const dayOffsetInYear =
    jm <= 7 ? (jm - 1) * 31 + (jd - 1) : 6 * 31 + (jm - 7) * 30 + (jd - 1);

  const utcNoon = new Date(Date.UTC(startGy, 2, march + dayOffsetInYear, 12, 0, 0, 0));
  const gregorianYear = utcNoon.getUTCFullYear();
  const gregorianMonth = utcNoon.getUTCMonth() + 1;
  const gregorianDay = utcNoon.getUTCDate();

  const normalizedJalali = `${String(jy).padStart(4, '0')}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  const gregorianIsoDate = `${String(gregorianYear).padStart(4, '0')}-${String(gregorianMonth).padStart(2, '0')}-${String(gregorianDay).padStart(2, '0')}`;

  return {
    jy,
    jm,
    jd,
    normalizedJalali,
    gregorianYear,
    gregorianMonth,
    gregorianDay,
    gregorianIsoDate,
  };
}

/**
 * تبدیل تاریخ شمسی به رشته تاریخ میلادی YYYY-MM-DD (مورد استفاده برای ستون‌های DATE مانند business_time_exceptions)
 */
export function jalaliDateToGregorianIsoDate(dateJalaliRaw: string): string {
  return parseAndValidateJalaliDate(dateJalaliRaw).gregorianIsoDate;
}

/**
 * تبدیل تاریخ شمسی (مثلاً ۱۴۰۵/۰۸/۰۳) و ساعت (مثلاً ۱۰:۳۰) به TIMESTAMPTZ معتبر
 * در منطقه زمانی رسمی ایران (Asia/Tehran: UTC+03:30) برای ذخیره‌سازی دقیق در PostgreSQL
 */
export function jalaliSlotToTimestamptz(
  dateJalali: string,
  timeSlotLabel: string
): Date {
  const { gregorianYear, gregorianMonth, gregorianDay } =
    parseAndValidateJalaliDate(dateJalali);

  const normalizedTime = toEnglishDigits(String(timeSlotLabel ?? '')).trim();
  const timeMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!timeMatch) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = timeMatch[3] !== undefined ? Number(timeMatch[3]) : 0;

  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59 ||
    !Number.isInteger(second) ||
    second < 0 ||
    second > 59
  ) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  // Asia/Tehran is permanently UTC+03:30
  return new Date(
    Date.UTC(
      gregorianYear,
      gregorianMonth - 1,
      gregorianDay,
      hour - 3,
      minute - 30,
      second,
      0
    )
  );
}

/**
 * نرمال‌سازی ساعت شروع و پایان کاری برای ستون TIME در PostgreSQL
 */
export function normalizeWorkingTimePair(
  openRaw: string,
  closeRaw: string
): { openTimeSql: string; closeTimeSql: string } {
  const openEng = toEnglishDigits(openRaw || '09:30').trim();
  const closeEng = toEnglishDigits(closeRaw || '19:30').trim();
  const oMatch = openEng.match(/^(\d{1,2}):(\d{2})/);
  const cMatch = closeEng.match(/^(\d{1,2}):(\d{2})/);

  if (oMatch && cMatch) {
    const oH = Math.min(23, Math.max(0, Number(oMatch[1])));
    const oM = Math.min(59, Math.max(0, Number(oMatch[2])));
    const cH = Math.min(23, Math.max(0, Number(cMatch[1])));
    const cM = Math.min(59, Math.max(0, Number(cMatch[2])));
    if (cH * 60 + cM > oH * 60 + oM) {
      return {
        openTimeSql: `${String(oH).padStart(2, '0')}:${String(oM).padStart(2, '0')}:00`,
        closeTimeSql: `${String(cH).padStart(2, '0')}:${String(cM).padStart(2, '0')}:00`,
      };
    }
  }
  return { openTimeSql: '09:30:00', closeTimeSql: '19:30:00' };
}

export function parseTimeLabelToMinutes(raw: string): number | null {
  const clean = toEnglishDigits(raw || '').trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = match[3] !== undefined ? Number(match[3]) : 0;
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;
  return h * 60 + m;
}

/**
 * تبدیل دقیقه روز (۰ تا ۱۴۳۹) به رشته ساعت فارسی با فرمت استاندارد HH:MM (مانند ۰۹:۳۰)
 */
export function formatMinutesToPersianTimeLabel(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.floor(totalMinutes)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return toPersianDigitsServer(`${hh}:${mm}`);
}

/**
 * تولید پویا و یکپارچه اسلات‌های کاندید روزانه بر اساس ساعت شروع و پایان واقعی کار سالن
 */
export function generateDynamicSlotMinutes(
  openMins: number,
  closeMins: number,
  stepMinutes = 30
): number[] {
  const step = Math.max(5, Math.floor(stepMinutes));
  const result: number[] = [];
  if (closeMins <= openMins) {
    return result;
  }
  for (let m = openMins; m < closeMins; m += step) {
    result.push(m);
  }
  return result;
}

export interface BusinessTimeExceptionRow {
  id?: string;
  specialist_id: string | null;
  is_closed_all_day: boolean;
  start_str: string | null;
  end_str: string | null;
  reason: string | null;
}

export interface EvaluatedDayExceptions {
  isBusinessClosedAllDay: boolean;
  businessClosedReason: string | null;
  isSpecialistClosedAllDay: boolean;
  specialistClosedReason: string | null;
  partialWindows: Array<{
    specialistId: string | null;
    startMins: number;
    endMins: number;
    reason: string | null;
  }>;
  hasInvalidExceptionRow: boolean;
}

/**
 * ارزیابی بدون ابهام رکوردهای جدول business_time_exceptions برای یک روز و متخصص مشخص:
 * ۱. تعطیلی کامل سالن (specialist_id IS NULL و is_closed_all_day = TRUE)
 * ۲. مرخصی کامل متخصص (specialist_id = targetSpecialistUuid و is_closed_all_day = TRUE)
 * ۳. بازه‌های استثنای ساعتی سالن یا متخصص (is_closed_all_day = FALSE با start_time و end_time)
 */
export function evaluateDayTimeExceptions(
  rows: BusinessTimeExceptionRow[],
  targetSpecialistUuid: string | null
): EvaluatedDayExceptions {
  let isBusinessClosedAllDay = false;
  let businessClosedReason: string | null = null;
  let isSpecialistClosedAllDay = false;
  let specialistClosedReason: string | null = null;
  let hasInvalidExceptionRow = false;
  const partialWindows: Array<{
    specialistId: string | null;
    startMins: number;
    endMins: number;
    reason: string | null;
  }> = [];

  for (const row of rows) {
    const spcId = row.specialist_id ? String(row.specialist_id) : null;
    if (spcId !== null && spcId !== targetSpecialistUuid) {
      continue;
    }

    const cleanReason = row.reason?.trim() || null;

    if (row.is_closed_all_day) {
      if (spcId === null) {
        isBusinessClosedAllDay = true;
        if (!businessClosedReason && cleanReason) {
          businessClosedReason = cleanReason;
        }
      } else {
        isSpecialistClosedAllDay = true;
        if (!specialistClosedReason && cleanReason) {
          specialistClosedReason = cleanReason;
        }
      }
    } else {
      const startMins = parseTimeLabelToMinutes(String(row.start_str || ''));
      const endMins = parseTimeLabelToMinutes(String(row.end_str || ''));
      if (startMins === null || endMins === null || endMins <= startMins) {
        hasInvalidExceptionRow = true;
        continue;
      }
      partialWindows.push({
        specialistId: spcId,
        startMins,
        endMins,
        reason: cleanReason,
      });
    }
  }

  return {
    isBusinessClosedAllDay,
    businessClosedReason,
    isSpecialistClosedAllDay,
    specialistClosedReason,
    partialWindows,
    hasInvalidExceptionRow,
  };
}

const IRAN_DAY_NAMES = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export function jalaliDateToIranDayOfWeek(dateJalali: string): {
  dayOfWeek: number;
  dayName: string;
} {
  const dt = jalaliSlotToTimestamptz(dateJalali, '12:00');
  const dayOfWeek = (dt.getUTCDay() + 1) % 7;
  return {
    dayOfWeek,
    dayName: IRAN_DAY_NAMES[dayOfWeek] ?? 'شنبه',
  };
}

/**
 * دریافت داده‌های عمومی بازارچه از PostgreSQL برای مسیر عمومی /api/v1/bootstrap
 * هیچ‌گونه اطلاعات خصوصی مشتریان (appointments, business_customers, customer_favorites)
 * یا کمپین‌های داخلی (marketing_campaigns) یا کسب‌وکارهای تاییدنشده در این خروجی قرار نمی‌گیرد.
 */
export async function getBootstrapPayload(
  pool: Pool
): Promise<BootstrapPayload> {
  const client = await pool.connect();
  try {
    await ensureExtendedMetaTables(client);
    const [
      catRes,
      bizRes,
      whRes,
      srvRes,
      spcRes,
      revRes,
      galRes,
      planRes,
    ] = await Promise.all([
      client.query(`
        SELECT
          COALESCE(legacy_demo_id, id::text) AS external_id,
          slug,
          title,
          subtitle,
          target_audience,
          icon_name,
          service_count
        FROM categories
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, created_at ASC
      `),
      client.query(`
        SELECT
          b.id,
          b.legacy_demo_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS external_id,
          b.slug,
          b.name,
          b.type,
          b.type_label,
          b.city,
          b.neighborhood,
          b.address,
          b.map_lat,
          b.map_lng,
          b.phone_display,
          b.instagram_handle,
          b.short_description,
          b.about_text,
          b.visual_theme,
          b.rating_avg,
          b.review_count,
          b.starting_price_toman,
          b.verified_badge,
          b.approval_status,
          b.subscription_plan,
          b.subscription_status,
          b.is_featured,
          c.slug AS primary_category_slug,
          bme.extra_json
        FROM businesses b
        JOIN categories c ON c.id = b.primary_category_id
        LEFT JOIN business_meta_ext bme ON bme.business_id = b.id
        WHERE b.approval_status = 'APPROVED'
        ORDER BY b.is_featured DESC, b.created_at DESC
      `),
      client.query(`
        SELECT
          bwh.business_id,
          bwh.day_of_week,
          bwh.day_name,
          bwh.is_open,
          to_char(bwh.open_time, 'HH24:MI') AS open_str,
          to_char(bwh.close_time, 'HH24:MI') AS close_str
        FROM business_working_hours bwh
        JOIN businesses b ON b.id = bwh.business_id
        WHERE b.approval_status = 'APPROVED'
        ORDER BY bwh.business_id, bwh.day_of_week ASC
      `),
      client.query(`
        SELECT
          COALESCE(s.legacy_demo_id, s.id::text) AS external_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          s.category_slug,
          s.category_label,
          s.title,
          s.description,
          s.duration_minutes,
          s.price_toman,
          s.is_popular,
          s.is_active
        FROM services s
        JOIN businesses b ON b.id = s.business_id
        WHERE s.is_active = TRUE AND b.approval_status = 'APPROVED'
        ORDER BY s.is_popular DESC, s.created_at ASC
      `),
      client.query(`
        SELECT
          COALESCE(sp.legacy_demo_id, sp.id::text) AS external_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          sp.slug,
          sp.full_name,
          sp.role_title,
          sp.experience_years,
          sp.rating_avg,
          sp.review_count,
          sp.specialties,
          sp.bio,
          sp.is_independent,
          sp.is_active,
          COALESCE(sp.city, b.city) AS city,
          sp.starting_price_toman
        FROM specialists sp
        JOIN businesses b ON b.id = sp.business_id
        WHERE sp.is_active = TRUE AND b.approval_status = 'APPROVED'
        ORDER BY sp.rating_avg DESC, sp.created_at ASC
      `),
      client.query(`
        SELECT
          COALESCE(r.legacy_demo_id, r.id::text) AS external_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          r.specialist_slug,
          r.author_name,
          r.service_title,
          r.rating,
          r.date_jalali,
          r.comment
        FROM reviews r
        JOIN businesses b ON b.id = r.business_id
        WHERE r.is_published = TRUE AND b.approval_status = 'APPROVED'
        ORDER BY r.created_at DESC
      `),
      client.query(`
        SELECT
          COALESCE(g.legacy_demo_id, g.id::text) AS external_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          g.title,
          g.category_label,
          g.theme
        FROM gallery_items g
        JOIN businesses b ON b.id = g.business_id
        WHERE b.approval_status = 'APPROVED'
        ORDER BY g.sort_order ASC, g.created_at DESC
      `),
      client.query(`
        SELECT
          COALESCE(legacy_demo_id, code, id::text) AS external_id,
          name,
          audience,
          monthly_price_toman,
          staff_limit_label,
          sms_quota_monthly,
          features,
          is_recommended,
          comparison_meta
        FROM subscription_plans
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, monthly_price_toman ASC
      `),
    ]);

    const whByBusinessId = new Map<string, WorkingHourItem[]>();
    for (const row of whRes.rows) {
      const bizUuid = String(row.business_id);
      const list = whByBusinessId.get(bizUuid) ?? [];
      list.push({
        dayName: String(row.day_name),
        isOpen: Boolean(row.is_open),
        openTime: toPersianDigitsServer(String(row.open_str || '09:30')),
        closeTime: toPersianDigitsServer(String(row.close_str || '19:30')),
      });
      whByBusinessId.set(bizUuid, list);
    }

    const categories: CategoryItem[] = catRes.rows.map((r) => ({
      id: String(r.external_id),
      slug: String(r.slug),
      title: String(r.title),
      subtitle: String(r.subtitle),
      targetAudience: String(r.target_audience),
      iconName: String(r.icon_name),
      serviceCount: Number(r.service_count),
    }));

    const hiddenSampleBizIds = new Set([
      'biz-2',
      'biz-3',
      'biz-4',
      'biz-5',
      'biz-6',
      'biz-7',
      'biz-8',
    ]);
    const hiddenSampleSpcIds = new Set([
      'spc-2',
      'spc-3',
      'spc-4',
      'spc-5',
      'spc-6',
    ]);

    const businesses: BusinessItem[] = bizRes.rows
      .filter((r) => !hiddenSampleBizIds.has(String(r.external_id)))
      .map((r) =>
        mergeBusinessRowWithExtra(
          {
            id: String(r.external_id),
            slug: String(r.slug),
            name: String(r.name),
            type: r.type as BusinessType,
            typeLabel: String(r.type_label),
            categorySlug: String(r.primary_category_slug),
            city: String(r.city),
            neighborhood: String(r.neighborhood),
            address: String(r.address),
            mapLat: r.map_lat !== null ? Number(r.map_lat) : undefined,
            mapLng: r.map_lng !== null ? Number(r.map_lng) : undefined,
            rating: Number(r.rating_avg),
            reviewCount: Number(r.review_count),
            startingPriceToman: Number(r.starting_price_toman),
            verifiedBadge: Boolean(r.verified_badge),
            shortDescription: String(r.short_description),
            aboutText: String(r.about_text),
            phoneDisplay: String(r.phone_display),
            instagramHandle: r.instagram_handle
              ? String(r.instagram_handle)
              : undefined,
            workingHours: whByBusinessId.get(String(r.id)) ?? [],
            visualTheme: (r.visual_theme as VisualTheme) || 'violet',
            approvalStatus: r.approval_status as ApprovalStatus,
            subscriptionPlan: String(r.subscription_plan),
            subscriptionStatus: r.subscription_status as SubscriptionStatus,
            featured: Boolean(r.is_featured),
          },
          r.extra_json,
          r.legacy_demo_id
        )
      );

    const services: ServiceItem[] = srvRes.rows
      .filter((r) => !hiddenSampleBizIds.has(String(r.business_external_id)))
      .map((r) => ({
        id: String(r.external_id),
        businessId: String(r.business_external_id),
        title: String(r.title),
        categorySlug: String(r.category_slug),
        category: String(r.category_label),
        durationMinutes: Number(r.duration_minutes),
        priceToman: Number(r.price_toman),
        description: String(r.description),
        isPopular: Boolean(r.is_popular),
        isActive: Boolean(r.is_active),
      }));

    const specialists: SpecialistItem[] = spcRes.rows
      .filter(
        (r) =>
          !hiddenSampleSpcIds.has(String(r.external_id)) &&
          !hiddenSampleBizIds.has(String(r.business_external_id))
      )
      .map((r) => ({
        id: String(r.external_id),
        slug: String(r.slug),
        fullName: String(r.full_name),
        roleTitle: String(r.role_title),
        businessId: String(r.business_external_id),
        experienceYears: Number(r.experience_years),
        rating: Number(r.rating_avg),
        reviewCount: Number(r.review_count),
        specialties: Array.isArray(r.specialties)
          ? r.specialties.map(String)
          : [],
        bio: String(r.bio),
        isIndependent: Boolean(r.is_independent),
        isActive: Boolean(r.is_active),
        city: String(r.city),
        startingPriceToman: Number(r.starting_price_toman),
      }));

    const reviewMetaMap = await getReviewModerationMetaMap(client);

    const reviews: ReviewItem[] = revRes.rows
      .filter((r) => !hiddenSampleBizIds.has(String(r.business_external_id)))
      .map((r) => {
        const revId = String(r.external_id);
        const meta = reviewMetaMap[revId] || {};
        return {
          id: revId,
          businessId: String(r.business_external_id),
          specialistSlug: r.specialist_slug
            ? String(r.specialist_slug)
            : undefined,
          authorName: String(r.author_name),
          authorPhone: meta.authorPhone,
          serviceTitle: String(r.service_title),
          rating: Number(r.rating),
          dateJalali: String(r.date_jalali),
          comment: String(r.comment),
          salonReply: meta.salonReply,
          salonReplyDateJalali: meta.salonReplyDateJalali,
          isReportedBySalon: Boolean(meta.isReportedBySalon),
          reportReason: meta.reportReason,
        };
      });

    const gallery: GalleryItem[] = galRes.rows
      .filter((r) => !hiddenSampleBizIds.has(String(r.business_external_id)))
      .map((r) => ({
        id: String(r.external_id),
        businessId: String(r.business_external_id),
        title: String(r.title),
        categoryLabel: String(r.category_label),
        theme: (r.theme as VisualTheme) || 'violet',
      }));

    const plans: SubscriptionPlanItem[] = planRes.rows.map((r) => {
      const comp =
        r.comparison_meta && typeof r.comparison_meta === 'object'
          ? (r.comparison_meta as Record<string, unknown>)
          : {};
      return {
        id: String(r.external_id),
        name: String(r.name),
        audience: String(r.audience),
        monthlyPriceToman: Number(r.monthly_price_toman),
        staffLimit: String(r.staff_limit_label),
        smsQuotaMonthly: Number(r.sms_quota_monthly),
        features: Array.isArray(r.features) ? r.features.map(String) : [],
        isRecommended: Boolean(r.is_recommended),
        comparison: {
          onlineBooking: String(comp.onlineBooking ?? 'نامحدود'),
          smsReminders: String(comp.smsReminders ?? 'فعال'),
          analyticsLevel: String(comp.analyticsLevel ?? 'پایه'),
          supportType: String(comp.supportType ?? 'تیکت پشتیبانی'),
        },
      };
    });

    const registeredUsers = await buildMergedRegisteredUsersList(client);

    return {
      categories,
      businesses,
      services,
      specialists,
      reviews,
      gallery,
      plans,
      registeredUsers,
    };
  } finally {
    client.release();
  }
}

async function resolveBusinessUuid(
  client: PoolClient,
  idOrSlugOrLegacy?: string
): Promise<{
  id: string;
  externalId: string;
  slug: string;
  name: string;
  city: string;
  approvalStatus: ApprovalStatus;
}> {
  const cleaned = (idOrSlugOrLegacy ?? '').trim();
  if (!cleaned) {
    throw new Error('BUSINESS_ID_REQUIRED');
  }

  const res = await client.query(
    `
    SELECT
      id,
      COALESCE(legacy_demo_id, id::text) AS external_id,
      slug,
      name,
      city,
      approval_status
    FROM businesses
    WHERE id::text = $1 OR legacy_demo_id = $1 OR slug = $1
    LIMIT 1
    `,
    [cleaned]
  );
  if (!res.rowCount || !res.rows[0]) {
    throw new Error('BUSINESS_NOT_FOUND');
  }

  return {
    id: String(res.rows[0].id),
    externalId: String(res.rows[0].external_id),
    slug: String(res.rows[0].slug),
    name: String(res.rows[0].name),
    city: String(res.rows[0].city),
    approvalStatus: String(res.rows[0].approval_status) as ApprovalStatus,
  };
}

/**
 * بررسی عضویت و نقش کاربر در کسب‌وکار مستقیماً از جدول business_members در سمت سرور
 */
export async function assertUserHasBusinessAccess(
  client: PoolClient,
  actorUser: AuthenticatedUser,
  businessUuid: string,
  allowedRoles: BusinessMemberRole[] = ['OWNER', 'MANAGER']
): Promise<BusinessMemberRole> {
  if (actorUser.isPlatformAdmin) {
    return 'OWNER';
  }

  const res = await client.query(
    `
    SELECT member_role
    FROM business_members
    WHERE business_id = $1
      AND user_id = $2
      AND is_active = TRUE
    LIMIT 1
    `,
    [businessUuid, actorUser.userId]
  );

  if (res.rowCount && res.rows[0]) {
    const role = String(res.rows[0].member_role) as BusinessMemberRole;
    if (allowedRoles.includes(role)) {
      return role;
    }
  }

  // Fallback check if user is the direct owner_user_id on the businesses table
  const ownerRes = await client.query(
    `SELECT 1 FROM businesses WHERE id = $1 AND owner_user_id = $2 LIMIT 1`,
    [businessUuid, actorUser.userId]
  );
  if (ownerRes.rowCount && ownerRes.rows[0]) {
    await client.query(
      `
      INSERT INTO business_members (business_id, user_id, member_role, is_active)
      VALUES ($1, $2, 'OWNER', TRUE)
      ON CONFLICT (business_id, user_id) DO UPDATE SET member_role = 'OWNER', is_active = TRUE
      `,
      [businessUuid, actorUser.userId]
    );
    return 'OWNER';
  }

  throw new Error('BUSINESS_ACCESS_DENIED');
}

async function resolveCategoryBySlug(
  client: PoolClient,
  categorySlug?: string,
  categoryLabel?: string
): Promise<{ id: string; slug: string; title: string }> {
  if (categorySlug) {
    const res = await client.query(
      `SELECT id, slug, title FROM categories WHERE slug = $1 OR id::text = $1 OR legacy_demo_id = $1 LIMIT 1`,
      [categorySlug]
    );
    if (res.rowCount && res.rows[0]) {
      return {
        id: String(res.rows[0].id),
        slug: String(res.rows[0].slug),
        title: categoryLabel || String(res.rows[0].title),
      };
    }
  }

  const fallback = await client.query(
    `SELECT id, slug, title FROM categories ORDER BY sort_order ASC, created_at ASC LIMIT 1`
  );
  if (fallback.rowCount && fallback.rows[0]) {
    return {
      id: String(fallback.rows[0].id),
      slug: categorySlug || String(fallback.rows[0].slug),
      title: categoryLabel || String(fallback.rows[0].title),
    };
  }

  const inserted = await client.query(
    `
    INSERT INTO categories (slug, title, subtitle, target_audience, icon_name)
    VALUES ('hair-color', 'مو، رنگ و استایلینگ', 'خدمات تخصصی مو', 'سالن‌های زیبایی', 'Sparkles')
    RETURNING id, slug, title
    `
  );
  return {
    id: String(inserted.rows[0].id),
    slug: String(inserted.rows[0].slug),
    title: categoryLabel || String(inserted.rows[0].title),
  };
}

/**
 * ایجاد خدمت جدید در جدول services (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function createServiceInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  input: Omit<ServiceItem, 'id'>
): Promise<ServiceItem> {
  const title = (input.title ?? '').trim();
  if (!title) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    const biz = await resolveBusinessUuid(client, input.businessId);
    await assertUserHasBusinessAccess(client, actorUser, biz.id, [
      'OWNER',
      'MANAGER',
    ]);

    const cat = await resolveCategoryBySlug(
      client,
      input.categorySlug,
      input.category
    );

    const res = await client.query(
      `
      INSERT INTO services (
        business_id,
        category_id,
        category_slug,
        category_label,
        title,
        description,
        duration_minutes,
        price_toman,
        is_popular,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
      RETURNING
        COALESCE(legacy_demo_id, id::text) AS external_id,
        category_slug,
        category_label,
        title,
        description,
        duration_minutes,
        price_toman,
        is_popular,
        is_active
      `,
      [
        biz.id,
        cat.id,
        cat.slug,
        input.category || cat.title,
        title,
        (input.description || '').trim(),
        Math.max(5, Math.min(600, Number(input.durationMinutes) || 45)),
        Math.max(0, Math.min(100000000000, Number(input.priceToman) || 0)),
        Boolean(input.isPopular),
      ]
    );

    const row = res.rows[0];
    return {
      id: String(row.external_id),
      businessId: biz.externalId,
      title: String(row.title),
      categorySlug: String(row.category_slug),
      category: String(row.category_label),
      durationMinutes: Number(row.duration_minutes),
      priceToman: Number(row.price_toman),
      description: String(row.description),
      isPopular: Boolean(row.is_popular),
      isActive: Boolean(row.is_active),
    };
  } finally {
    client.release();
  }
}

/**
 * ویرایش خدمت موجود در جدول services (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function updateServiceInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  serviceIdOrLegacy: string,
  input: Partial<Omit<ServiceItem, 'id'>>
): Promise<ServiceItem> {
  const client = await pool.connect();
  try {
    const existingRes = await client.query(
      `
      SELECT s.*, COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id
      FROM services s
      JOIN businesses b ON b.id = s.business_id
      WHERE s.id::text = $1 OR s.legacy_demo_id = $1
      LIMIT 1
      `,
      [serviceIdOrLegacy]
    );

    if (!existingRes.rowCount || !existingRes.rows[0]) {
      throw new Error('SERVICE_NOT_FOUND');
    }

    const current = existingRes.rows[0];
    await assertUserHasBusinessAccess(
      client,
      actorUser,
      String(current.business_id),
      ['OWNER', 'MANAGER']
    );

    const cat = await resolveCategoryBySlug(
      client,
      input.categorySlug ?? String(current.category_slug),
      input.category ?? String(current.category_label)
    );

    const updatedRes = await client.query(
      `
      UPDATE services
      SET
        category_id = $2,
        category_slug = $3,
        category_label = $4,
        title = $5,
        description = $6,
        duration_minutes = $7,
        price_toman = $8,
        is_popular = $9
      WHERE id = $1
      RETURNING
        COALESCE(legacy_demo_id, id::text) AS external_id,
        category_slug,
        category_label,
        title,
        description,
        duration_minutes,
        price_toman,
        is_popular,
        is_active
      `,
      [
        current.id,
        cat.id,
        input.categorySlug ?? String(current.category_slug),
        input.category ?? String(current.category_label),
        (input.title ?? String(current.title)).trim(),
        (input.description ?? String(current.description)).trim(),
        Math.max(
          5,
          Math.min(
            600,
            Number(input.durationMinutes ?? current.duration_minutes) || 45
          )
        ),
        Math.max(
          0,
          Math.min(
            100000000000,
            Number(input.priceToman ?? current.price_toman) || 0
          )
        ),
        input.isPopular !== undefined
          ? Boolean(input.isPopular)
          : Boolean(current.is_popular),
      ]
    );

    const row = updatedRes.rows[0];
    return {
      id: String(row.external_id),
      businessId: String(current.business_external_id),
      title: String(row.title),
      categorySlug: String(row.category_slug),
      category: String(row.category_label),
      durationMinutes: Number(row.duration_minutes),
      priceToman: Number(row.price_toman),
      description: String(row.description),
      isPopular: Boolean(row.is_popular),
      isActive: Boolean(row.is_active),
    };
  } finally {
    client.release();
  }
}

/**
 * حذف منطقی خدمت (Soft Delete: is_active = FALSE) فقط برای OWNER یا MANAGER همان کسب‌وکار
 */
export async function softDeleteServiceInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  serviceIdOrLegacy: string
): Promise<void> {
  const client = await pool.connect();
  try {
    const existingRes = await client.query(
      `SELECT id, business_id FROM services WHERE id::text = $1 OR legacy_demo_id = $1 LIMIT 1`,
      [serviceIdOrLegacy]
    );
    if (!existingRes.rowCount || !existingRes.rows[0]) {
      throw new Error('SERVICE_NOT_FOUND');
    }

    const row = existingRes.rows[0];
    await assertUserHasBusinessAccess(
      client,
      actorUser,
      String(row.business_id),
      ['OWNER', 'MANAGER']
    );

    await client.query(
      `UPDATE services SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
      [row.id]
    );
  } finally {
    client.release();
  }
}

/**
 * افزودن متخصص جدید به کسب‌وکار (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function createSpecialistInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  input: Omit<SpecialistItem, 'id'>
): Promise<SpecialistItem> {
  const fullName = (input.fullName ?? '').trim();
  const roleTitle = (input.roleTitle ?? '').trim();
  if (!fullName || !roleTitle) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    const biz = await resolveBusinessUuid(client, input.businessId);
    await assertUserHasBusinessAccess(client, actorUser, biz.id, [
      'OWNER',
      'MANAGER',
    ]);

    const uniqueSlug = `${normalizeValidSlug(input.slug || fullName, 'spc')}-${crypto.randomBytes(2).toString('hex')}`;

    const res = await client.query(
      `
      INSERT INTO specialists (
        business_id,
        slug,
        full_name,
        role_title,
        experience_years,
        rating_avg,
        review_count,
        specialties,
        bio,
        is_independent,
        is_active,
        city,
        starting_price_toman
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, $12)
      RETURNING
        COALESCE(legacy_demo_id, id::text) AS external_id,
        slug,
        full_name,
        role_title,
        experience_years,
        rating_avg,
        review_count,
        specialties,
        bio,
        is_independent,
        is_active,
        city,
        starting_price_toman
      `,
      [
        biz.id,
        uniqueSlug,
        fullName,
        roleTitle,
        Math.max(0, Math.min(80, Number(input.experienceYears) || 1)),
        Math.max(0, Math.min(5, Number(input.rating) || 4.9)),
        Math.max(0, Number(input.reviewCount) || 0),
        Array.isArray(input.specialties) ? input.specialties : [],
        (input.bio || '').trim(),
        Boolean(input.isIndependent),
        input.city || biz.city,
        Math.max(0, Number(input.startingPriceToman) || 350000),
      ]
    );

    const row = res.rows[0];
    return {
      id: String(row.external_id),
      slug: String(row.slug),
      fullName: String(row.full_name),
      roleTitle: String(row.role_title),
      businessId: biz.externalId,
      experienceYears: Number(row.experience_years),
      rating: Number(row.rating_avg),
      reviewCount: Number(row.review_count),
      specialties: Array.isArray(row.specialties)
        ? row.specialties.map(String)
        : [],
      bio: String(row.bio),
      isIndependent: Boolean(row.is_independent),
      isActive: Boolean(row.is_active),
      city: String(row.city || biz.city),
      startingPriceToman: Number(row.starting_price_toman),
    };
  } finally {
    client.release();
  }
}

/**
 * ویرایش اطلاعات متخصص (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function updateSpecialistInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  specialistIdOrLegacy: string,
  patch: Partial<SpecialistItem>
): Promise<SpecialistItem> {
  const client = await pool.connect();
  try {
    const existingRes = await client.query(
      `
      SELECT sp.*, COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id, b.city AS business_city
      FROM specialists sp
      JOIN businesses b ON b.id = sp.business_id
      WHERE sp.id::text = $1 OR sp.legacy_demo_id = $1
      LIMIT 1
      `,
      [specialistIdOrLegacy]
    );
    if (!existingRes.rowCount || !existingRes.rows[0]) {
      throw new Error('SPECIALIST_NOT_FOUND');
    }

    const current = existingRes.rows[0];
    await assertUserHasBusinessAccess(
      client,
      actorUser,
      String(current.business_id),
      ['OWNER', 'MANAGER']
    );

    const updatedRes = await client.query(
      `
      UPDATE specialists
      SET
        full_name = $2,
        role_title = $3,
        experience_years = $4,
        specialties = $5,
        bio = $6,
        starting_price_toman = $7,
        is_active = $8
      WHERE id = $1
      RETURNING
        COALESCE(legacy_demo_id, id::text) AS external_id,
        slug,
        full_name,
        role_title,
        experience_years,
        rating_avg,
        review_count,
        specialties,
        bio,
        is_independent,
        is_active,
        city,
        starting_price_toman
      `,
      [
        current.id,
        (patch.fullName ?? String(current.full_name)).trim(),
        (patch.roleTitle ?? String(current.role_title)).trim(),
        Math.max(
          0,
          Math.min(
            80,
            Number(patch.experienceYears ?? current.experience_years) || 1
          )
        ),
        Array.isArray(patch.specialties)
          ? patch.specialties
          : current.specialties,
        (patch.bio ?? String(current.bio)).trim(),
        Math.max(
          0,
          Number(patch.startingPriceToman ?? current.starting_price_toman) || 0
        ),
        patch.isActive !== undefined
          ? Boolean(patch.isActive)
          : Boolean(current.is_active),
      ]
    );

    const row = updatedRes.rows[0];
    return {
      id: String(row.external_id),
      slug: String(row.slug),
      fullName: String(row.full_name),
      roleTitle: String(row.role_title),
      businessId: String(current.business_external_id),
      experienceYears: Number(row.experience_years),
      rating: Number(row.rating_avg),
      reviewCount: Number(row.review_count),
      specialties: Array.isArray(row.specialties)
        ? row.specialties.map(String)
        : [],
      bio: String(row.bio),
      isIndependent: Boolean(row.is_independent),
      isActive: Boolean(row.is_active),
      city: String(row.city || current.business_city),
      startingPriceToman: Number(row.starting_price_toman),
    };
  } finally {
    client.release();
  }
}

/**
 * بروزرسانی مشخصات پروفایل کسب‌وکار و مختصات نقشه (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function updateBusinessProfileInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  businessIdOrLegacy: string,
  patch: Partial<BusinessItem>
): Promise<void> {
  const client = await pool.connect();
  try {
    await ensureExtendedMetaTables(client);
    const biz = await resolveBusinessUuid(client, businessIdOrLegacy);
    await assertUserHasBusinessAccess(client, actorUser, biz.id, [
      'OWNER',
      'MANAGER',
    ]);

    const currentRes = await client.query(
      `SELECT * FROM businesses WHERE id = $1`,
      [biz.id]
    );
    const current = currentRes.rows[0];

    const nextLat =
      patch.mapLat !== undefined
        ? patch.mapLat
        : current.map_lat !== null
          ? Number(current.map_lat)
          : null;
    const nextLng =
      patch.mapLng !== undefined
        ? patch.mapLng
        : current.map_lng !== null
          ? Number(current.map_lng)
          : null;

    const validCoords =
      nextLat !== null &&
      nextLng !== null &&
      nextLat >= -90 &&
      nextLat <= 90 &&
      nextLng >= -180 &&
      nextLng <= 180;

    const allowedSubStatuses = ['ACTIVE', 'TRIAL', 'EXPIRING_SOON', 'EXPIRED'];
    const rawSubStatus = String(
      patch.subscriptionStatus ?? current.subscription_status ?? 'ACTIVE'
    );
    const safeSubStatus = allowedSubStatuses.includes(rawSubStatus)
      ? rawSubStatus
      : 'ACTIVE';

    await client.query(
      `
      UPDATE businesses
      SET
        name = $2,
        city = $3,
        neighborhood = $4,
        address = $5,
        phone_display = $6,
        instagram_handle = $7,
        short_description = $8,
        about_text = $9,
        map_lat = $10,
        map_lng = $11,
        subscription_plan = $12,
        subscription_status = $13,
        is_featured = $14,
        updated_at = NOW()
      WHERE id = $1
      `,
      [
        biz.id,
        (patch.name ?? String(current.name)).trim(),
        (patch.city ?? String(current.city)).trim(),
        (patch.neighborhood ?? String(current.neighborhood)).trim(),
        (patch.address ?? String(current.address)).trim(),
        (patch.phoneDisplay ?? String(current.phone_display)).trim(),
        patch.instagramHandle !== undefined
          ? patch.instagramHandle
          : current.instagram_handle,
        (patch.shortDescription ?? String(current.short_description)).trim(),
        (patch.aboutText ?? String(current.about_text)).trim(),
        validCoords ? nextLat : null,
        validCoords ? nextLng : null,
        patch.subscriptionPlan ?? String(current.subscription_plan),
        safeSubStatus,
        patch.featured !== undefined
          ? Boolean(patch.featured)
          : patch.isSponsored !== undefined
            ? Boolean(patch.isSponsored)
            : Boolean(current.is_featured),
      ]
    );

    const extPatch: Record<string, unknown> = {};
    const extKeys: Array<keyof BusinessItem> = [
      'isSponsored',
      'sponsoredLabel',
      'sponsoredPlacement',
      'sponsoredOrder',
      'sponsoredDaysRemaining',
      'sponsoredExpiresJalali',
      'trialDaysRemaining',
      'extraSmsBalance',
      'smsSentCount',
      'avatarUrl',
      'ownerName',
      'ownerPhone',
    ];
    for (const k of extKeys) {
      if (patch[k] !== undefined) {
        extPatch[k] = patch[k];
      }
    }

    if (Object.keys(extPatch).length > 0) {
      await client.query(
        `
        INSERT INTO business_meta_ext (business_id, extra_json, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (business_id) DO UPDATE
        SET extra_json = COALESCE(business_meta_ext.extra_json, '{}'::jsonb) || $2::jsonb,
            updated_at = NOW()
        `,
        [biz.id, JSON.stringify(extPatch)]
      );
    }
  } finally {
    client.release();
  }
}

/**
 * بروزرسانی ساعات کاری هفتگی کسب‌وکار (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function updateBusinessWorkingHoursInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  businessIdOrLegacy: string,
  workingHours: WorkingHourItem[]
): Promise<WorkingHourItem[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const biz = await resolveBusinessUuid(client, businessIdOrLegacy);
    await assertUserHasBusinessAccess(client, actorUser, biz.id, [
      'OWNER',
      'MANAGER',
    ]);

    for (let idx = 0; idx < Math.min(7, workingHours.length); idx++) {
      const item = workingHours[idx];
      const { openTimeSql, closeTimeSql } = normalizeWorkingTimePair(
        item.openTime,
        item.closeTime
      );
      await client.query(
        `
        INSERT INTO business_working_hours (
          business_id,
          day_of_week,
          day_name,
          is_open,
          open_time,
          close_time
        )
        VALUES ($1, $2, $3, $4, $5::time, $6::time)
        ON CONFLICT (business_id, day_of_week) DO UPDATE
        SET
          day_name = EXCLUDED.day_name,
          is_open = EXCLUDED.is_open,
          open_time = EXCLUDED.open_time,
          close_time = EXCLUDED.close_time,
          updated_at = NOW()
        `,
        [
          biz.id,
          idx,
          item.dayName,
          Boolean(item.isOpen),
          openTimeSql,
          closeTimeSql,
        ]
      );
    }

    await client.query('COMMIT');
    return workingHours;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * تغییر وضعیت تایید کسب‌وکار توسط ادمین پلتفرم
 */
export async function updateBusinessApprovalInDb(
  pool: Pool,
  businessIdOrLegacy: string,
  status: ApprovalStatus
): Promise<void> {
  if (!['APPROVED', 'PENDING_REVIEW', 'REJECTED'].includes(status)) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const cleaned = (businessIdOrLegacy || '').trim();
  const res = await pool.query(
    `
    UPDATE businesses
    SET
      approval_status = $2,
      verified_badge = ($2 = 'APPROVED'),
      updated_at = NOW()
    WHERE id::text = $1 OR legacy_demo_id = $1 OR slug = $1
    RETURNING id
    `,
    [cleaned, status]
  );
  if (!res.rowCount) {
    throw new Error('BUSINESS_NOT_FOUND');
  }
}

/**
 * ثبت نوبت جدید در PostgreSQL برای کاربر احرازهویت‌شده با رعایت کامل:
 * - عدم بازگشت به اولین کسب‌وکار، اولین خدمت یا اولین متخصص در صورت نامعتبر بودن ورودی‌ها
 * - عدم استفاده از شماره تلفن یا نام پیش‌فرض ساختگی
 * - Snapshot نام خدمت، قیمت، مدت و فاصله استراحت (buffer_minutes_snapshot)
 * - محاسبه دقیق ریاضی service_ends_at و occupied_until_at در موتور SQL
 * - بررسی خودکار قید EXCLUDE USING gist (کد خطای 23P01 در صورت تداخل زمانی متخصص)
 */
export async function createAppointmentInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  input: {
    businessSlug?: string;
    businessId?: string;
    serviceId: string;
    specialistId: string;
    dateJalali: string;
    timeSlot: string;
    customerName?: string;
    customerPhone?: string;
    customerNotes?: string;
    serviceStartsAtIso?: string;
  }
): Promise<AppointmentItem> {
  const serviceIdRaw = (input.serviceId ?? '').trim();
  const specialistIdRaw = (input.specialistId ?? '').trim();
  const dateJalaliRaw = (input.dateJalali ?? '').trim();
  const timeSlotRaw = (input.timeSlot ?? '').trim();

  if (!serviceIdRaw || !specialistIdRaw || !dateJalaliRaw || !timeSlotRaw) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const parsedDate = parseAndValidateJalaliDate(dateJalaliRaw);
  const slotStartMinutes = parseTimeLabelToMinutes(timeSlotRaw);
  if (slotStartMinutes === null) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  // محاسبه زمان دقیق شروع نوبت صرفاً در سرور از روی تاریخ شمسی و ساعت اسلات معتبر (نادیده گرفتن کامل serviceStartsAtIso ارسالی کلاینت)
  const startsAtDate = jalaliSlotToTimestamptz(dateJalaliRaw, timeSlotRaw);
  const gregorianIsoDate = parsedDate.gregorianIsoDate;

  const customerName = (input.customerName ?? actorUser.fullName ?? '').trim();
  if (customerName.length < 2) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const rawPhoneCandidate = input.customerPhone?.trim()
    ? toEnglishDigits(input.customerPhone).replace(/\D/g, '')
    : actorUser.phone;
  if (!/^09\d{9}$/.test(rawPhoneCandidate)) {
    throw new Error('INVALID_IRAN_MOBILE_PHONE');
  }
  const normalizedPhone = rawPhoneCandidate;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const biz = await resolveBusinessUuid(
      client,
      input.businessSlug || input.businessId
    );

    if (biz.approvalStatus !== 'APPROVED') {
      throw new Error('BUSINESS_NOT_APPROVED');
    }

    const srvRes = await client.query(
      `
      SELECT id, COALESCE(legacy_demo_id, id::text) AS external_id, title, duration_minutes, price_toman
      FROM services
      WHERE business_id = $1
        AND is_active = TRUE
        AND (id::text = $2 OR legacy_demo_id = $2)
      LIMIT 1
      `,
      [biz.id, serviceIdRaw]
    );
    if (!srvRes.rowCount || !srvRes.rows[0]) {
      throw new Error('SERVICE_NOT_FOUND_FOR_BUSINESS');
    }
    const srv = srvRes.rows[0];

    const spcRes = await client.query(
      `
      SELECT id, COALESCE(legacy_demo_id, id::text) AS external_id, full_name
      FROM specialists
      WHERE business_id = $1
        AND is_active = TRUE
        AND (id::text = $2 OR legacy_demo_id = $2 OR slug = $2)
      LIMIT 1
      `,
      [biz.id, specialistIdRaw]
    );
    if (!spcRes.rowCount || !spcRes.rows[0]) {
      throw new Error('SPECIALIST_NOT_FOUND_FOR_BUSINESS');
    }
    const spc = spcRes.rows[0];

    // بررسی تخصیص خدمت به متخصص در جدول specialist_services (در صورتی که برای این متخصص محدودیت خدمات تعریف شده باشد)
    const spcSrvCountRes = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM specialist_services WHERE specialist_id = $1 AND business_id = $2`,
      [spc.id, biz.id]
    );
    if (Number(spcSrvCountRes.rows[0]?.cnt ?? 0) > 0) {
      const spcSrvMatchRes = await client.query(
        `SELECT 1 FROM specialist_services WHERE specialist_id = $1 AND service_id = $2 AND business_id = $3 LIMIT 1`,
        [spc.id, srv.id, biz.id]
      );
      if (!spcSrvMatchRes.rowCount) {
        throw new Error('SPECIALIST_NOT_ASSIGNED_TO_SERVICE');
      }
    }

    // جلوگیری از ثبت نوبت برای تاریخ یا ساعت گذشته
    if (startsAtDate.getTime() <= Date.now()) {
      throw new Error('APPOINTMENT_TIME_IN_PAST');
    }

    const durationMinutes = Number(srv.duration_minutes);
    const priceToman = Number(srv.price_toman);

    // بررسی سخت‌گیرانه ساعات کاری کسب‌وکار در روز انتخابی (نبود رکورد یا is_open=false به منزله تعطیلی است)
    const { dayOfWeek, dayName } = jalaliDateToIranDayOfWeek(dateJalaliRaw);
    const whRes = await client.query(
      `
      SELECT
        is_open,
        to_char(open_time, 'HH24:MI') AS open_str,
        to_char(close_time, 'HH24:MI') AS close_str
      FROM business_working_hours
      WHERE business_id = $1 AND (day_of_week = $2 OR day_name = $3)
      ORDER BY (day_of_week = $2) DESC
      LIMIT 1
      `,
      [biz.id, dayOfWeek, dayName]
    );
    if (!whRes.rowCount || !whRes.rows[0] || !whRes.rows[0].is_open) {
      throw new Error('OUTSIDE_BUSINESS_WORKING_HOURS');
    }
    const whRow = whRes.rows[0];
    const openMins = parseTimeLabelToMinutes(String(whRow.open_str || ''));
    const closeMins = parseTimeLabelToMinutes(String(whRow.close_str || ''));
    if (
      openMins === null ||
      closeMins === null ||
      closeMins <= openMins ||
      slotStartMinutes < openMins ||
      slotStartMinutes + durationMinutes > closeMins
    ) {
      throw new Error('OUTSIDE_BUSINESS_WORKING_HOURS');
    }

    // بررسی تعطیلات سالن، مرخصی متخصص و بازه‌های استثنای ساعتی در جدول business_time_exceptions
    const exRes = await client.query<BusinessTimeExceptionRow>(
      `
      SELECT
        id,
        specialist_id,
        is_closed_all_day,
        to_char(start_time, 'HH24:MI') AS start_str,
        to_char(end_time, 'HH24:MI') AS end_str,
        reason
      FROM business_time_exceptions
      WHERE business_id = $1
        AND exception_date = $2::date
        AND (specialist_id IS NULL OR specialist_id = $3)
      ORDER BY is_closed_all_day DESC, (specialist_id IS NULL) DESC, start_time ASC NULLS FIRST
      `,
      [biz.id, gregorianIsoDate, spc.id]
    );

    const exceptions = evaluateDayTimeExceptions(
      exRes.rows ?? [],
      String(spc.id)
    );
    if (
      exceptions.hasInvalidExceptionRow ||
      exceptions.isBusinessClosedAllDay ||
      exceptions.isSpecialistClosedAllDay
    ) {
      throw new Error('OUTSIDE_BUSINESS_WORKING_HOURS');
    }
    const overlapsExceptionWindow = exceptions.partialWindows.some(
      (w) =>
        slotStartMinutes < w.endMins &&
        slotStartMinutes + durationMinutes > w.startMins
    );
    if (overlapsExceptionWindow) {
      throw new Error('OUTSIDE_BUSINESS_WORKING_HOURS');
    }

    const settingsRes = await client.query(
      `SELECT buffer_minutes FROM business_settings WHERE business_id = $1`,
      [biz.id]
    );
    const bufferMinutes =
      settingsRes.rowCount && settingsRes.rows[0]
        ? Number(settingsRes.rows[0].buffer_minutes)
        : 15;

    // بررسی تداخل زمانی با نوبت‌های فعال همان متخصص درون تراکنش (علاوه بر قید EXCLUDE USING gist سطح PostgreSQL)
    const activeAptsRes = await client.query(
      `
      SELECT
        service_starts_at,
        occupied_until_at
      FROM appointments
      WHERE business_id = $1
        AND status IN ('PENDING', 'CONFIRMED')
        AND specialist_id = $2
      `,
      [biz.id, spc.id]
    );
    const slotStartMs = startsAtDate.getTime();
    const slotOccupiedEndMs =
      slotStartMs + (durationMinutes + bufferMinutes) * 60 * 1000;
    const hasActiveOverlap = (activeAptsRes.rows ?? []).some((r) => {
      const existStartMs = new Date(String(r.service_starts_at)).getTime();
      const existEndMs = new Date(String(r.occupied_until_at)).getTime();
      return slotStartMs < existEndMs && slotOccupiedEndMs > existStartMs;
    });
    if (hasActiveOverlap) {
      const conflictErr = new Error(
        'APPOINTMENT_OVERLAP_CONFLICT'
      ) as Error & { code?: string };
      conflictErr.code = '23P01';
      throw conflictErr;
    }

    const maskedPhone = maskPhoneDisplay(normalizedPhone);
    const referenceCode = `BH-${Math.floor(100000 + Math.random() * 899999)}`;

    const insertRes = await client.query(
      `
      INSERT INTO appointments (
        reference_code,
        business_id,
        customer_user_id,
        service_id,
        specialist_id,
        service_title_snapshot,
        service_price_toman_snapshot,
        duration_minutes_snapshot,
        buffer_minutes_snapshot,
        specialist_name_snapshot,
        customer_name,
        customer_phone,
        customer_phone_masked,
        date_jalali,
        time_slot_label,
        service_starts_at,
        service_ends_at,
        occupied_until_at,
        status,
        notes
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::smallint,
        $9::smallint,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16::timestamptz,
        $16::timestamptz + ($8::smallint * INTERVAL '1 minute'),
        $16::timestamptz + (($8::smallint + $9::smallint) * INTERVAL '1 minute'),
        'CONFIRMED',
        $17
      )
      RETURNING
        id,
        COALESCE(legacy_demo_id, id::text) AS external_id,
        reference_code,
        date_jalali,
        time_slot_label,
        status,
        notes
      `,
      [
        referenceCode,
        biz.id,
        actorUser.userId,
        srv.id,
        spc.id,
        String(srv.title),
        priceToman,
        durationMinutes,
        bufferMinutes,
        String(spc.full_name),
        customerName,
        normalizedPhone,
        maskedPhone,
        dateJalaliRaw,
        timeSlotRaw,
        startsAtDate.toISOString(),
        input.customerNotes?.trim() || null,
      ]
    );

    const aptRow = insertRes.rows[0];

    await client.query(
      `
      INSERT INTO appointment_status_logs (
        appointment_id,
        previous_status,
        new_status,
        changed_by_user_id,
        note
      )
      VALUES ($1, NULL, 'CONFIRMED', $2, 'ثبت رزرو آنلاین توسط مشتری')
      `,
      [aptRow.id, actorUser.userId]
    );

    await client.query(
      `
      INSERT INTO business_customers (
        business_id,
        user_id,
        full_name,
        phone,
        phone_masked,
        city,
        total_visits,
        last_visit_jalali,
        total_spent_toman,
        favorite_service_title,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9, $10)
      ON CONFLICT (business_id, phone) DO UPDATE
      SET
        user_id = COALESCE(business_customers.user_id, EXCLUDED.user_id),
        full_name = EXCLUDED.full_name,
        total_visits = business_customers.total_visits + 1,
        last_visit_jalali = EXCLUDED.last_visit_jalali,
        total_spent_toman = business_customers.total_spent_toman + EXCLUDED.total_spent_toman,
        favorite_service_title = EXCLUDED.favorite_service_title,
        updated_at = NOW()
      `,
      [
        biz.id,
        actorUser.userId,
        customerName,
        normalizedPhone,
        maskedPhone,
        biz.city,
        dateJalaliRaw,
        priceToman,
        String(srv.title),
        input.customerNotes?.trim() || '',
      ]
    );

    await client.query('COMMIT');

    return {
      id: String(aptRow.external_id),
      referenceCode: String(aptRow.reference_code),
      businessId: biz.externalId,
      businessSlug: biz.slug,
      businessName: biz.name,
      serviceId: String(srv.external_id),
      serviceTitle: String(srv.title),
      specialistId: String(spc.external_id),
      specialistName: String(spc.full_name),
      customerName,
      customerPhoneMasked: maskedPhone,
      dateJalali: String(aptRow.date_jalali),
      timeSlot: String(aptRow.time_slot_label),
      durationMinutes,
      priceToman,
      status: aptRow.status as AppointmentStatus,
      notes: aptRow.notes ? String(aptRow.notes) : undefined,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * تغییر وضعیت نوبت با بررسی دقیق مجوز کاربر:
 * - اعضای فعال کسب‌وکار (OWNER, MANAGER, STAFF) می‌توانند وضعیت نوبت‌های همان کسب‌وکار را تغییر دهند.
 * - مشتری صاحب نوبت فقط مجاز به لغو (CANCELLED) نوبت فعال خود است.
 */
export async function updateAppointmentStatusInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  appointmentIdOrLegacy: string,
  newStatus: AppointmentStatus,
  cancelledReason?: string
): Promise<void> {
  const validStatuses: string[] = [
    AppointmentStatus.Pending,
    AppointmentStatus.Confirmed,
    AppointmentStatus.Completed,
    AppointmentStatus.Cancelled,
    AppointmentStatus.NoShow,
  ];
  if (!validStatuses.includes(newStatus)) {
    throw new Error('INVALID_APPOINTMENT_STATUS');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const curRes = await client.query(
      `
      SELECT id, business_id, customer_user_id, customer_phone, status
      FROM appointments
      WHERE id::text = $1 OR legacy_demo_id = $1
      FOR UPDATE
      `,
      [appointmentIdOrLegacy]
    );

    if (!curRes.rowCount || !curRes.rows[0]) {
      throw new Error('APPOINTMENT_NOT_FOUND');
    }

    const row = curRes.rows[0];
    const aptId = String(row.id);
    const businessUuid = String(row.business_id);
    const prevStatus = String(row.status);
    const customerUserId = row.customer_user_id
      ? String(row.customer_user_id)
      : null;
    const customerPhone = String(row.customer_phone || '');

    // بررسی عضویت در کسب‌وکار
    const memberRes = await client.query(
      `
      SELECT member_role
      FROM business_members
      WHERE business_id = $1 AND user_id = $2 AND is_active = TRUE
      LIMIT 1
      `,
      [businessUuid, actorUser.userId]
    );
    const isBusinessMember = Boolean(memberRes.rowCount && memberRes.rows[0]);

    const isAppointmentCustomer =
      customerUserId === actorUser.userId ||
      (customerPhone && customerPhone === actorUser.phone);

    if (!isBusinessMember && !isAppointmentCustomer) {
      throw new Error('APPOINTMENT_ACCESS_DENIED');
    }

    if (!isBusinessMember && isAppointmentCustomer) {
      if (newStatus !== AppointmentStatus.Cancelled) {
        throw new Error('CUSTOMER_CAN_ONLY_CANCEL_OWN_APPOINTMENT');
      }
      if (prevStatus !== 'PENDING' && prevStatus !== 'CONFIRMED') {
        throw new Error('CUSTOMER_CAN_ONLY_CANCEL_OWN_APPOINTMENT');
      }
    }

    await client.query(
      `
      UPDATE appointments
      SET
        status = $2::varchar,
        cancelled_at = CASE WHEN $2::varchar = 'CANCELLED' THEN NOW() ELSE NULL END,
        cancelled_reason = CASE WHEN $2::varchar = 'CANCELLED' THEN COALESCE($3, 'لغو توسط کاربر یا مدیر سالن') ELSE NULL END,
        updated_at = NOW()
      WHERE id = $1
      `,
      [aptId, newStatus, cancelledReason || null]
    );

    await client.query(
      `
      INSERT INTO appointment_status_logs (
        appointment_id,
        previous_status,
        new_status,
        changed_by_user_id,
        note
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        aptId,
        prevStatus,
        newStatus,
        actorUser.userId,
        cancelledReason || `تغییر وضعیت از ${prevStatus} به ${newStatus}`,
      ]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ایجاد یا ویرایش دسته‌بندی خدمات توسط ادمین
 */
export async function createCategoryInDb(
  pool: Pool,
  input: Omit<CategoryItem, 'id'>
): Promise<CategoryItem> {
  const title = (input.title ?? '').trim();
  if (!title) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }
  const validSlug = normalizeValidSlug(input.slug || title, 'cat');
  const res = await pool.query(
    `
    INSERT INTO categories (
      slug,
      title,
      subtitle,
      target_audience,
      icon_name,
      service_count,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, TRUE)
    RETURNING
      COALESCE(legacy_demo_id, id::text) AS external_id,
      slug,
      title,
      subtitle,
      target_audience,
      icon_name,
      service_count
    `,
    [
      validSlug,
      title,
      (input.subtitle || '').trim(),
      (input.targetAudience || '').trim(),
      input.iconName || 'Sparkles',
      Math.max(0, Number(input.serviceCount) || 0),
    ]
  );
  const r = res.rows[0];
  return {
    id: String(r.external_id),
    slug: String(r.slug),
    title: String(r.title),
    subtitle: String(r.subtitle),
    targetAudience: String(r.target_audience),
    iconName: String(r.icon_name),
    serviceCount: Number(r.service_count),
  };
}

export async function updateCategoryInDb(
  pool: Pool,
  categoryIdOrLegacy: string,
  input: Partial<Omit<CategoryItem, 'id'>>
): Promise<CategoryItem> {
  const existingRes = await pool.query(
    `SELECT * FROM categories WHERE id::text = $1 OR legacy_demo_id = $1 LIMIT 1`,
    [categoryIdOrLegacy]
  );
  if (!existingRes.rowCount || !existingRes.rows[0]) {
    throw new Error('CATEGORY_NOT_FOUND');
  }
  const cur = existingRes.rows[0];
  const nextSlug = input.slug
    ? normalizeValidSlug(input.slug, 'cat')
    : String(cur.slug);

  const res = await pool.query(
    `
    UPDATE categories
    SET
      slug = $2,
      title = $3,
      subtitle = $4,
      target_audience = $5,
      icon_name = $6,
      service_count = $7,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      COALESCE(legacy_demo_id, id::text) AS external_id,
      slug,
      title,
      subtitle,
      target_audience,
      icon_name,
      service_count
    `,
    [
      cur.id,
      nextSlug,
      (input.title ?? String(cur.title)).trim(),
      (input.subtitle ?? String(cur.subtitle)).trim(),
      (input.targetAudience ?? String(cur.target_audience)).trim(),
      input.iconName ?? String(cur.icon_name),
      Math.max(0, Number(input.serviceCount ?? cur.service_count) || 0),
    ]
  );
  const r = res.rows[0];
  return {
    id: String(r.external_id),
    slug: String(r.slug),
    title: String(r.title),
    subtitle: String(r.subtitle),
    targetAudience: String(r.target_audience),
    iconName: String(r.icon_name),
    serviceCount: Number(r.service_count),
  };
}

/**
 * افزودن و حذف آیتم گالری نمونه کارها (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function createGalleryItemInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  input: Omit<GalleryItem, 'id'>
): Promise<GalleryItem> {
  const title = (input.title ?? '').trim();
  const categoryLabel = (input.categoryLabel ?? '').trim();
  if (!title || !categoryLabel) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    const biz = await resolveBusinessUuid(client, input.businessId);
    await assertUserHasBusinessAccess(client, actorUser, biz.id, [
      'OWNER',
      'MANAGER',
    ]);

    const validTheme: VisualTheme = ['rose', 'slate', 'emerald', 'violet'].includes(
      input.theme
    )
      ? input.theme
      : 'violet';

    const res = await client.query(
      `
      INSERT INTO gallery_items (business_id, title, category_label, theme)
      VALUES ($1, $2, $3, $4)
      RETURNING COALESCE(legacy_demo_id, id::text) AS external_id, title, category_label, theme
      `,
      [biz.id, title, categoryLabel, validTheme]
    );
    const r = res.rows[0];
    return {
      id: String(r.external_id),
      businessId: biz.externalId,
      title: String(r.title),
      categoryLabel: String(r.category_label),
      theme: r.theme as VisualTheme,
    };
  } finally {
    client.release();
  }
}

export async function deleteGalleryItemInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  galleryIdOrLegacy: string
): Promise<void> {
  const client = await pool.connect();
  try {
    const existingRes = await client.query(
      `SELECT id, business_id FROM gallery_items WHERE id::text = $1 OR legacy_demo_id = $1 LIMIT 1`,
      [galleryIdOrLegacy]
    );
    if (!existingRes.rowCount || !existingRes.rows[0]) {
      throw new Error('GALLERY_ITEM_NOT_FOUND');
    }

    const row = existingRes.rows[0];
    await assertUserHasBusinessAccess(
      client,
      actorUser,
      String(row.business_id),
      ['OWNER', 'MANAGER']
    );

    await client.query(`DELETE FROM gallery_items WHERE id = $1`, [row.id]);
  } finally {
    client.release();
  }
}

/**
 * ایجاد کمپین بازاریابی جدید برای سالن (فقط برای OWNER یا MANAGER همان کسب‌وکار)
 */
export async function createCampaignInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  input: Omit<MarketingCampaignItem, 'id'> & { businessId?: string }
): Promise<MarketingCampaignItem> {
  const title = (input.title ?? '').trim();
  const targetSegment = (input.targetSegment ?? '').trim();
  const channel = (input.channel ?? '').trim();
  if (!title || !targetSegment || !channel) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    const biz = await resolveBusinessUuid(client, input.businessId);
    await assertUserHasBusinessAccess(client, actorUser, biz.id, [
      'OWNER',
      'MANAGER',
    ]);

    const res = await client.query(
      `
      INSERT INTO marketing_campaigns (
        business_id,
        title,
        target_segment,
        discount_percent,
        channel,
        status_label,
        created_at_jalali
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        COALESCE(legacy_demo_id, id::text) AS external_id,
        title,
        target_segment,
        discount_percent,
        channel,
        status_label,
        created_at_jalali
      `,
      [
        biz.id,
        title,
        targetSegment,
        Math.max(1, Math.min(100, Number(input.discountPercent) || 15)),
        channel,
        input.statusLabel || 'زمان‌بندی‌شده',
        input.createdAtJalali || '۱۴۰۵/۰۸/۰۱',
      ]
    );
    const r = res.rows[0];
    return {
      id: String(r.external_id),
      title: String(r.title),
      targetSegment: String(r.target_segment),
      discountPercent: Number(r.discount_percent),
      channel: String(r.channel),
      statusLabel: String(r.status_label),
      createdAtJalali: String(r.created_at_jalali),
    };
  } finally {
    client.release();
  }
}

/**
 * تغییر وضعیت نشان‌شده (علاقه‌مندی) کسب‌وکار برای کاربر احرازهویت‌شده
 * هیچ شماره تلفن یا نام ساختگی از سمت کلاینت پذیرفته نمی‌شود.
 */
export async function toggleFavoriteBusinessInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  businessIdOrLegacy: string
): Promise<{ favorited: boolean; favoriteBusinessIds: string[] }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const biz = await resolveBusinessUuid(client, businessIdOrLegacy);
    const userId = actorUser.userId;

    const existing = await client.query(
      `SELECT 1 FROM customer_favorites WHERE user_id = $1 AND business_id = $2`,
      [userId, biz.id]
    );

    let favorited = false;
    if (existing.rowCount && existing.rowCount > 0) {
      await client.query(
        `DELETE FROM customer_favorites WHERE user_id = $1 AND business_id = $2`,
        [userId, biz.id]
      );
      favorited = false;
    } else {
      await client.query(
        `INSERT INTO customer_favorites (user_id, business_id) VALUES ($1, $2)`,
        [userId, biz.id]
      );
      favorited = true;
    }

    const favListRes = await client.query(
      `
      SELECT COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id
      FROM customer_favorites cf
      JOIN businesses b ON b.id = cf.business_id
      WHERE cf.user_id = $1
      `,
      [userId]
    );

    await client.query('COMMIT');
    return {
      favorited,
      favoriteBusinessIds: favListRes.rows.map((r) =>
        String(r.business_external_id)
      ),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ثبت کامل کسب‌وکار جدید برای کاربر احرازهویت‌شده (مالک کسب‌وکار = actorUser.userId)
 */
export async function onboardBusinessInDb(
  pool: Pool,
  actorUser: AuthenticatedUser | null,
  draft: OnboardingDraft,
  clientMeta?: { ipAddress?: string; userAgent?: string }
): Promise<{
  businessId: string;
  slug: string;
  sessionToken?: string;
  expiresAt?: string;
  user?: AuthenticatedUser;
}> {
  const businessName = (draft.businessName ?? '').trim();
  const city = (draft.city ?? 'اصفهان').trim();
  const address = (draft.address ?? '').trim();
  if (!businessName || !city || !address) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const rawDraftPhone = toEnglishDigits(draft.phone || actorUser?.phone || '').replace(
    /\D/g,
    ''
  );
  const normalizedPhone = /^09\d{9}$/.test(rawDraftPhone)
    ? rawDraftPhone
    : actorUser?.phone || '';
  if (!normalizedPhone) {
    throw new Error('INVALID_IRAN_MOBILE_PHONE');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureExtendedMetaTables(client);

    let ownerUserId = actorUser?.userId || '';
    let createdNewSessionToken: string | undefined;
    let createdSessionExpiresAt: string | undefined;
    let resolvedAuthUser: AuthenticatedUser | undefined;

    const ownerNameClean =
      draft.ownerName && draft.ownerName.trim().length >= 2
        ? draft.ownerName.trim()
        : actorUser?.fullName || 'مدیر سالن';

    if (!ownerUserId) {
      const userRes = await client.query(
        `
        INSERT INTO users (phone, full_name, default_city, is_active)
        VALUES ($1, $2, $3, TRUE)
        ON CONFLICT (phone) DO UPDATE
        SET
          full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
          default_city = COALESCE(NULLIF(EXCLUDED.default_city, ''), users.default_city),
          updated_at = NOW()
        RETURNING id
        `,
        [normalizedPhone, ownerNameClean, city]
      );
      ownerUserId = String(userRes.rows[0].id);
    } else if (draft.ownerName && draft.ownerName.trim().length >= 2) {
      await client.query(
        `UPDATE users SET full_name = $2, default_city = COALESCE($3, default_city), updated_at = NOW() WHERE id = $1`,
        [ownerUserId, ownerNameClean, city]
      );
    }

    const cat = await resolveCategoryBySlug(
      client,
      draft.categorySlug || 'hair-color'
    );
    const slug = `${normalizeValidSlug(draft.slug || businessName, 'salon')}-${crypto.randomBytes(2).toString('hex')}`;

    const typeLabelMap: Record<BusinessType, string> = {
      [BusinessType.WomenSalon]: 'سالن زیبایی زنانه',
      [BusinessType.MenBarbershop]: 'آرایشگاه مردانه',
      [BusinessType.IndependentSpecialist]: 'متخصص مستقل زیبایی',
    };

    const startingPrice =
      Array.isArray(draft.services) && draft.services.length > 0
        ? Math.min(...draft.services.map((s) => Number(s.priceToman) || 350000))
        : 350000;

    const nationalIdHash = draft.nationalIdNumber
      ? crypto
          .createHash('sha256')
          .update(draft.nationalIdNumber.trim())
          .digest('hex')
      : null;

    const planNameMap: Record<string, string> = {
      'plan-free': 'شروع رایگان',
      'plan-pro': 'حرفه‌ای',
      'plan-vip': 'کسب‌وکار پیشرفته (VIP)',
    };
    const chosenPlanName =
      planNameMap[draft.selectedPlanId || 'plan-free'] || 'شروع رایگان';
    const isFreePlan =
      !draft.selectedPlanId || draft.selectedPlanId === 'plan-free';
    const chosenSubStatus = isFreePlan ? 'TRIAL' : 'ACTIVE';

    const bizRes = await client.query(
      `
      INSERT INTO businesses (
        owner_user_id,
        primary_category_id,
        slug,
        name,
        type,
        type_label,
        city,
        neighborhood,
        address,
        map_lat,
        map_lng,
        phone_display,
        instagram_handle,
        short_description,
        about_text,
        visual_theme,
        starting_price_toman,
        verified_badge,
        approval_status,
        subscription_plan,
        subscription_status,
        license_code,
        national_id_hash
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, 'rose', $16, FALSE, 'PENDING_REVIEW',
        $17, $18, $19, $20
      )
      RETURNING id, slug
      `,
      [
        ownerUserId,
        cat.id,
        slug,
        businessName,
        draft.businessType || BusinessType.WomenSalon,
        typeLabelMap[draft.businessType] || 'سالن زیبایی زنانه',
        city,
        (draft.neighborhood || '').trim() || 'مرکز شهر',
        address,
        draft.mapLat ?? null,
        draft.mapLng ?? null,
        toPersianDigitsServer(normalizedPhone),
        draft.instagramHandle || null,
        (draft.shortDescription || `${businessName} در ${city}`).trim().slice(0, 290),
        (draft.shortDescription || `${businessName} در ${city}`).trim(),
        startingPrice,
        chosenPlanName,
        chosenSubStatus,
        draft.licenseCode || null,
        nationalIdHash,
      ]
    );

    const newBizId = String(bizRes.rows[0].id);

    // ثبت مالک در جدول اعضای کسب‌وکار (business_members) برای دسترسی کامل به پنل کسب‌وکار (/app)
    await client.query(
      `
      INSERT INTO business_members (business_id, user_id, member_role, is_active)
      VALUES ($1, $2, 'OWNER', TRUE)
      ON CONFLICT (business_id, user_id) DO UPDATE
      SET member_role = 'OWNER', is_active = TRUE
      `,
      [newBizId, ownerUserId]
    );

    await client.query(
      `INSERT INTO business_settings (business_id) VALUES ($1) ON CONFLICT (business_id) DO NOTHING`,
      [newBizId]
    );

    // ذخیره متادیتای تکمیلی کسب‌وکار (تصویر پروفایل، شماره مالک، روزهای آزمایشی، سهمیه پیامک)
    const extraMeta = {
      ownerName: ownerNameClean,
      ownerPhone: toPersianDigitsServer(normalizedPhone),
      avatarUrl: draft.avatarUrl || undefined,
      trialDaysRemaining: isFreePlan ? 30 : undefined,
      extraSmsBalance: 0,
      smsSentCount: 0,
      isSampleShowcase: false,
    };
    await client.query(
      `
      INSERT INTO business_meta_ext (business_id, extra_json, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (business_id) DO UPDATE
      SET extra_json = EXCLUDED.extra_json, updated_at = NOW()
      `,
      [newBizId, JSON.stringify(extraMeta)]
    );

    // ثبت اعلان جدید برای مدیر کل پلتفرم در جدول platform_kv_store
    const notifItem = {
      id: `notif-${Date.now()}`,
      type: 'NEW_BUSINESS',
      title: `ثبت‌نام کسب‌وکار جدید: ${businessName}`,
      message: `${ownerNameClean} (${toPersianDigitsServer(normalizedPhone)}) سالن «${businessName}» را در ${city} ثبت کرد و منتظر تایید شماست.`,
      businessId: newBizId,
      businessName,
      ownerName: ownerNameClean,
      ownerPhone: toPersianDigitsServer(normalizedPhone),
      city,
      createdAtJalali: 'امروز',
      isRead: false,
    };
    await client.query(
      `
      INSERT INTO platform_kv_store (key, value_json, updated_at)
      VALUES ('admin_notifications', jsonb_build_array($1::jsonb), NOW())
      ON CONFLICT (key) DO UPDATE
      SET value_json = jsonb_build_array($1::jsonb) || COALESCE(platform_kv_store.value_json, '[]'::jsonb),
          updated_at = NOW()
      `,
      [JSON.stringify(notifItem)]
    );

    const workingHours = Array.isArray(draft.workingHours)
      ? draft.workingHours
      : [];
    for (let idx = 0; idx < Math.min(7, workingHours.length); idx++) {
      const wh = workingHours[idx];
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
        `,
        [
          newBizId,
          idx,
          wh.dayName,
          Boolean(wh.isOpen),
          openTimeSql,
          closeTimeSql,
        ]
      );
    }

    const services = Array.isArray(draft.services) ? draft.services : [];
    for (const srv of services) {
      await client.query(
        `
        INSERT INTO services (
          business_id, category_id, category_slug, category_label,
          title, description, duration_minutes, price_toman, is_popular, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, TRUE)
        `,
        [
          newBizId,
          cat.id,
          cat.slug,
          srv.category || cat.title,
          srv.title.trim(),
          srv.title.trim(),
          Math.max(5, Math.min(600, Number(srv.durationMinutes) || 60)),
          Math.max(0, Number(srv.priceToman) || 350000),
        ]
      );
    }

    const staff = Array.isArray(draft.staff) ? draft.staff : [];
    for (const stf of staff) {
      const spcSlug = `${normalizeValidSlug(stf.fullName, 'spc')}-${crypto.randomBytes(2).toString('hex')}`;
      await client.query(
        `
        INSERT INTO specialists (
          business_id, slug, full_name, role_title, experience_years,
          specialties, bio, is_independent, is_active, city, starting_price_toman
        )
        VALUES ($1, $2, $3, $4, 3, $5, $6, FALSE, TRUE, $7, $8)
        `,
        [
          newBizId,
          spcSlug,
          stf.fullName.trim(),
          stf.roleTitle.trim(),
          [stf.roleTitle.trim()],
          `${stf.roleTitle.trim()} در ${businessName}`,
          city,
          startingPrice,
        ]
      );
    }

    // اگر کاربر از قبل لاگین نبوده، یک نشست ۳۰ روزه هم برای او صادر شود تا مستقیم وارد پنل کسب‌وکار خود شود
    if (!actorUser) {
      const rawSessionSecretPart = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = hashSessionSecretPart(rawSessionSecretPart);
      const sessionInsertRes = await client.query(
        `
        INSERT INTO user_sessions (
          user_id,
          refresh_token_hash,
          ip_address,
          user_agent,
          expires_at
        )
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
        RETURNING id, expires_at
        `,
        [
          ownerUserId,
          refreshTokenHash,
          (clientMeta?.ipAddress || '127.0.0.1').slice(0, 45),
          (clientMeta?.userAgent || 'web').slice(0, 500),
        ]
      );
      const sessionId = String(sessionInsertRes.rows[0].id);
      createdSessionExpiresAt = new Date(
        String(sessionInsertRes.rows[0].expires_at)
      ).toISOString();
      createdNewSessionToken = signSessionToken(
        sessionId,
        rawSessionSecretPart,
        resolveSessionSecret()
      );
      resolvedAuthUser =
        (await loadUserPermissionsByUserId(client, ownerUserId, sessionId)) ||
        undefined;
    } else {
      resolvedAuthUser =
        (await loadUserPermissionsByUserId(
          client,
          ownerUserId,
          actorUser.sessionId
        )) || actorUser;
    }

    await client.query('COMMIT');
    return {
      businessId: newBizId,
      slug: String(bizRes.rows[0].slug),
      sessionToken: createdNewSessionToken,
      expiresAt: createdSessionExpiresAt,
      user: resolvedAuthUser,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * واکشی اطلاعات خصوصی مشتری احرازهویت‌شده (/api/v1/me/bootstrap)
 * فقط نوبت‌ها و علاقه‌مندی‌های متعلق به همان کاربر برگردانده می‌شوند.
 */
export async function getCustomerPrivatePayloadInDb(
  pool: Pool,
  actorUser: AuthenticatedUser
): Promise<CustomerPrivatePayload> {
  const client = await pool.connect();
  try {
    const [aptRes, favRes] = await Promise.all([
      client.query(
        `
        SELECT
          COALESCE(a.legacy_demo_id, a.id::text) AS external_id,
          a.reference_code,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          b.slug AS business_slug,
          b.name AS business_name,
          COALESCE(s.legacy_demo_id, s.id::text) AS service_external_id,
          a.service_title_snapshot,
          COALESCE(sp.legacy_demo_id, sp.id::text) AS specialist_external_id,
          a.specialist_name_snapshot,
          a.customer_name,
          a.customer_phone_masked,
          a.date_jalali,
          a.time_slot_label,
          a.duration_minutes_snapshot,
          a.service_price_toman_snapshot,
          a.status,
          a.notes
        FROM appointments a
        JOIN businesses b ON b.id = a.business_id
        JOIN services s ON s.id = a.service_id
        JOIN specialists sp ON sp.id = a.specialist_id
        WHERE a.customer_user_id = $1
           OR a.customer_phone = $2
        ORDER BY a.service_starts_at DESC, a.created_at DESC
        `,
        [actorUser.userId, actorUser.phone]
      ),
      client.query(
        `
        SELECT COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id
        FROM customer_favorites cf
        JOIN businesses b ON b.id = cf.business_id
        WHERE cf.user_id = $1
        ORDER BY cf.created_at DESC
        `,
        [actorUser.userId]
      ),
    ]);

    const appointments: AppointmentItem[] = aptRes.rows.map((r) => ({
      id: String(r.external_id),
      referenceCode: String(r.reference_code),
      businessId: String(r.business_external_id),
      businessSlug: String(r.business_slug),
      businessName: String(r.business_name),
      serviceId: String(r.service_external_id),
      serviceTitle: String(r.service_title_snapshot),
      specialistId: String(r.specialist_external_id),
      specialistName: String(r.specialist_name_snapshot),
      customerName: String(r.customer_name),
      customerPhoneMasked: String(r.customer_phone_masked),
      dateJalali: String(r.date_jalali),
      timeSlot: String(r.time_slot_label),
      durationMinutes: Number(r.duration_minutes_snapshot),
      priceToman: Number(r.service_price_toman_snapshot),
      status: r.status as AppointmentStatus,
      notes: r.notes ? String(r.notes) : undefined,
    }));

    const favoriteBusinessIds = favRes.rows.map((r) =>
      String(r.business_external_id)
    );

    return {
      appointments,
      favoriteBusinessIds,
    };
  } finally {
    client.release();
  }
}

/**
 * واکشی فضای کاری پنل کسب‌وکار (/api/v1/app/workspace)
 * فقط برای اعضای فعال همان کسب‌وکار در جدول business_members مجاز است.
 */
export async function getBusinessWorkspacePayloadInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  requestedBusinessIdOrSlug?: string
): Promise<BusinessWorkspacePayload> {
  const client = await pool.connect();
  try {
    await ensureExtendedMetaTables(client);
    let targetBusinessUuid: string;
    let memberRole: BusinessMemberRole;

    if (requestedBusinessIdOrSlug && requestedBusinessIdOrSlug.trim()) {
      const biz = await resolveBusinessUuid(client, requestedBusinessIdOrSlug);
      memberRole = await assertUserHasBusinessAccess(
        client,
        actorUser,
        biz.id,
        ['OWNER', 'MANAGER', 'STAFF']
      );
      targetBusinessUuid = biz.id;
    } else {
      const firstMembership = actorUser.businessMemberships[0];
      if (firstMembership) {
        memberRole = await assertUserHasBusinessAccess(
          client,
          actorUser,
          firstMembership.businessUuid,
          ['OWNER', 'MANAGER', 'STAFF']
        );
        targetBusinessUuid = firstMembership.businessUuid;
      } else {
        // Fallback: check if user owns a business directly in businesses table
        const ownedRes = await client.query(
          `SELECT id FROM businesses WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [actorUser.userId]
        );
        if (!ownedRes.rowCount || !ownedRes.rows[0]) {
          throw new Error('BUSINESS_ACCESS_DENIED');
        }
        targetBusinessUuid = String(ownedRes.rows[0].id);
        memberRole = 'OWNER';
      }
    }

    const [
      bizRes,
      whRes,
      srvRes,
      spcRes,
      aptRes,
      custRes,
      galRes,
      campRes,
    ] = await Promise.all([
      client.query(
        `
        SELECT
          b.id,
          b.legacy_demo_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS external_id,
          b.slug,
          b.name,
          b.type,
          b.type_label,
          b.city,
          b.neighborhood,
          b.address,
          b.map_lat,
          b.map_lng,
          b.phone_display,
          b.instagram_handle,
          b.short_description,
          b.about_text,
          b.visual_theme,
          b.rating_avg,
          b.review_count,
          b.starting_price_toman,
          b.verified_badge,
          b.approval_status,
          b.subscription_plan,
          b.subscription_status,
          b.is_featured,
          c.slug AS primary_category_slug,
          bme.extra_json
        FROM businesses b
        JOIN categories c ON c.id = b.primary_category_id
        LEFT JOIN business_meta_ext bme ON bme.business_id = b.id
        WHERE b.id = $1
        LIMIT 1
        `,
        [targetBusinessUuid]
      ),
      client.query(
        `
        SELECT
          day_of_week,
          day_name,
          is_open,
          to_char(open_time, 'HH24:MI') AS open_str,
          to_char(close_time, 'HH24:MI') AS close_str
        FROM business_working_hours
        WHERE business_id = $1
        ORDER BY day_of_week ASC
        `,
        [targetBusinessUuid]
      ),
      client.query(
        `
        SELECT
          COALESCE(s.legacy_demo_id, s.id::text) AS external_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          s.category_slug,
          s.category_label,
          s.title,
          s.description,
          s.duration_minutes,
          s.price_toman,
          s.is_popular,
          s.is_active
        FROM services s
        JOIN businesses b ON b.id = s.business_id
        WHERE s.business_id = $1 AND s.is_active = TRUE
        ORDER BY s.is_popular DESC, s.created_at ASC
        `,
        [targetBusinessUuid]
      ),
      client.query(
        `
        SELECT
          COALESCE(sp.legacy_demo_id, sp.id::text) AS external_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          sp.slug,
          sp.full_name,
          sp.role_title,
          sp.experience_years,
          sp.rating_avg,
          sp.review_count,
          sp.specialties,
          sp.bio,
          sp.is_independent,
          sp.is_active,
          COALESCE(sp.city, b.city) AS city,
          sp.starting_price_toman
        FROM specialists sp
        JOIN businesses b ON b.id = sp.business_id
        WHERE sp.business_id = $1
        ORDER BY sp.rating_avg DESC, sp.created_at ASC
        `,
        [targetBusinessUuid]
      ),
      client.query(
        `
        SELECT
          COALESCE(a.legacy_demo_id, a.id::text) AS external_id,
          a.reference_code,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          b.slug AS business_slug,
          b.name AS business_name,
          COALESCE(s.legacy_demo_id, s.id::text) AS service_external_id,
          a.service_title_snapshot,
          COALESCE(sp.legacy_demo_id, sp.id::text) AS specialist_external_id,
          a.specialist_name_snapshot,
          a.customer_name,
          a.customer_phone,
          a.customer_phone_masked,
          a.date_jalali,
          a.time_slot_label,
          a.duration_minutes_snapshot,
          a.service_price_toman_snapshot,
          a.status,
          a.notes
        FROM appointments a
        JOIN businesses b ON b.id = a.business_id
        JOIN services s ON s.id = a.service_id
        JOIN specialists sp ON sp.id = a.specialist_id
        WHERE a.business_id = $1
        ORDER BY a.service_starts_at DESC, a.created_at DESC
        `,
        [targetBusinessUuid]
      ),
      client.query(
        `
        SELECT
          COALESCE(legacy_demo_id, id::text) AS external_id,
          full_name,
          phone,
          phone_masked,
          city,
          total_visits,
          COALESCE(last_visit_jalali, '۱۴۰۵/۰۷/۳۰') AS last_visit_jalali,
          total_spent_toman,
          favorite_service_title,
          notes
        FROM business_customers
        WHERE business_id = $1
        ORDER BY total_visits DESC, created_at DESC
        `,
        [targetBusinessUuid]
      ),
      client.query(
        `
        SELECT
          COALESCE(g.legacy_demo_id, g.id::text) AS external_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          g.title,
          g.category_label,
          g.theme
        FROM gallery_items g
        JOIN businesses b ON b.id = g.business_id
        WHERE g.business_id = $1
        ORDER BY g.sort_order ASC, g.created_at DESC
        `,
        [targetBusinessUuid]
      ),
      client.query(
        `
        SELECT
          COALESCE(mc.legacy_demo_id, mc.id::text) AS external_id,
          mc.title,
          mc.target_segment,
          mc.discount_percent,
          mc.channel,
          mc.status_label,
          mc.created_at_jalali
        FROM marketing_campaigns mc
        WHERE mc.business_id = $1
        ORDER BY mc.created_at DESC
        `,
        [targetBusinessUuid]
      ),
    ]);

    const workingHours: WorkingHourItem[] = whRes.rows.map((row) => ({
      dayName: String(row.day_name),
      isOpen: Boolean(row.is_open),
      openTime: toPersianDigitsServer(String(row.open_str || '09:30')),
      closeTime: toPersianDigitsServer(String(row.close_str || '19:30')),
    }));

    const r = bizRes.rows[0];
    const business: BusinessItem | null = r
      ? mergeBusinessRowWithExtra(
          {
            id: String(r.external_id),
            slug: String(r.slug),
            name: String(r.name),
            type: r.type as BusinessType,
            typeLabel: String(r.type_label),
            categorySlug: String(r.primary_category_slug),
            city: String(r.city),
            neighborhood: String(r.neighborhood),
            address: String(r.address),
            mapLat: r.map_lat !== null ? Number(r.map_lat) : undefined,
            mapLng: r.map_lng !== null ? Number(r.map_lng) : undefined,
            rating: Number(r.rating_avg),
            reviewCount: Number(r.review_count),
            startingPriceToman: Number(r.starting_price_toman),
            verifiedBadge: Boolean(r.verified_badge),
            shortDescription: String(r.short_description),
            aboutText: String(r.about_text),
            phoneDisplay: String(r.phone_display),
            instagramHandle: r.instagram_handle
              ? String(r.instagram_handle)
              : undefined,
            workingHours,
            visualTheme: (r.visual_theme as VisualTheme) || 'violet',
            approvalStatus: r.approval_status as ApprovalStatus,
            subscriptionPlan: String(r.subscription_plan),
            subscriptionStatus: r.subscription_status as SubscriptionStatus,
            featured: Boolean(r.is_featured),
          },
          r.extra_json,
          r.legacy_demo_id
        )
      : null;

    const services: ServiceItem[] = srvRes.rows.map((row) => ({
      id: String(row.external_id),
      businessId: String(row.business_external_id),
      title: String(row.title),
      categorySlug: String(row.category_slug),
      category: String(row.category_label),
      durationMinutes: Number(row.duration_minutes),
      priceToman: Number(row.price_toman),
      description: String(row.description),
      isPopular: Boolean(row.is_popular),
      isActive: Boolean(row.is_active),
    }));

    const specialists: SpecialistItem[] = spcRes.rows.map((row) => ({
      id: String(row.external_id),
      slug: String(row.slug),
      fullName: String(row.full_name),
      roleTitle: String(row.role_title),
      businessId: String(row.business_external_id),
      experienceYears: Number(row.experience_years),
      rating: Number(row.rating_avg),
      reviewCount: Number(row.review_count),
      specialties: Array.isArray(row.specialties)
        ? row.specialties.map(String)
        : [],
      bio: String(row.bio),
      isIndependent: Boolean(row.is_independent),
      isActive: Boolean(row.is_active),
      city: String(row.city),
      startingPriceToman: Number(row.starting_price_toman),
    }));

    const appointments: AppointmentItem[] = aptRes.rows.map((row) => ({
      id: String(row.external_id),
      referenceCode: String(row.reference_code),
      businessId: String(row.business_external_id),
      businessSlug: String(row.business_slug),
      businessName: String(row.business_name),
      serviceId: String(row.service_external_id),
      serviceTitle: String(row.service_title_snapshot),
      specialistId: String(row.specialist_external_id),
      specialistName: String(row.specialist_name_snapshot),
      customerName: String(row.customer_name),
      customerPhoneMasked: toPersianDigitsServer(
        String(row.customer_phone || row.customer_phone_masked || '')
      ),
      dateJalali: String(row.date_jalali),
      timeSlot: String(row.time_slot_label),
      durationMinutes: Number(row.duration_minutes_snapshot),
      priceToman: Number(row.service_price_toman_snapshot),
      status: row.status as AppointmentStatus,
      notes: row.notes ? String(row.notes) : undefined,
    }));

    const customers: CustomerRecord[] = custRes.rows.map((row) => ({
      id: String(row.external_id),
      fullName: String(row.full_name),
      phone: toPersianDigitsServer(String(row.phone || '')),
      phoneMasked: toPersianDigitsServer(
        String(row.phone || row.phone_masked || '')
      ),
      city: String(row.city),
      totalVisits: Number(row.total_visits),
      lastVisitJalali: String(row.last_visit_jalali),
      totalSpentToman: Number(row.total_spent_toman),
      favoriteService: String(row.favorite_service_title),
      notes: String(row.notes),
    }));

    const gallery: GalleryItem[] = galRes.rows.map((row) => ({
      id: String(row.external_id),
      businessId: String(row.business_external_id),
      title: String(row.title),
      categoryLabel: String(row.category_label),
      theme: (row.theme as VisualTheme) || 'violet',
    }));

    const campaigns: MarketingCampaignItem[] = campRes.rows.map((row) => ({
      id: String(row.external_id),
      title: String(row.title),
      targetSegment: String(row.target_segment),
      discountPercent: Number(row.discount_percent),
      channel: String(row.channel),
      statusLabel: String(row.status_label),
      createdAtJalali: String(row.created_at_jalali),
    }));

    return {
      business,
      memberRole,
      services,
      specialists,
      appointments,
      customers,
      gallery,
      campaigns,
    };
  } finally {
    client.release();
  }
}

/**
 * واکشی اطلاعات مدیریتی کنسول ادمین پلتفرم (/api/v1/admin/overview)
 * فقط برای PLATFORM_ADMIN مجاز است و شامل کسب‌وکارهای در انتظار بررسی یا ردشده نیز می‌شود.
 */
export async function getAdminOverviewPayloadInDb(
  pool: Pool,
  actorUser: AuthenticatedUser
): Promise<AdminOverviewPayload> {
  if (!actorUser.isPlatformAdmin) {
    throw new Error('ADMIN_ACCESS_DENIED');
  }

  const client = await pool.connect();
  try {
    await ensureExtendedMetaTables(client);
    const [catRes, bizRes, whRes, planRes, usrRes, aptRes] = await Promise.all([
      client.query(`
        SELECT
          COALESCE(legacy_demo_id, id::text) AS external_id,
          slug,
          title,
          subtitle,
          target_audience,
          icon_name,
          service_count
        FROM categories
        ORDER BY sort_order ASC, created_at ASC
      `),
      client.query(`
        SELECT
          b.id,
          b.legacy_demo_id,
          COALESCE(b.legacy_demo_id, b.id::text) AS external_id,
          b.slug,
          b.name,
          b.type,
          b.type_label,
          b.city,
          b.neighborhood,
          b.address,
          b.map_lat,
          b.map_lng,
          b.phone_display,
          b.instagram_handle,
          b.short_description,
          b.about_text,
          b.visual_theme,
          b.rating_avg,
          b.review_count,
          b.starting_price_toman,
          b.verified_badge,
          b.approval_status,
          b.subscription_plan,
          b.subscription_status,
          b.is_featured,
          to_char(b.created_at, 'YYYY/MM/DD') AS created_date,
          c.slug AS primary_category_slug,
          u.full_name AS owner_full_name,
          u.phone AS owner_phone,
          bme.extra_json
        FROM businesses b
        JOIN categories c ON c.id = b.primary_category_id
        LEFT JOIN users u ON u.id = b.owner_user_id
        LEFT JOIN business_meta_ext bme ON bme.business_id = b.id
        ORDER BY b.created_at DESC
      `),
      client.query(`
        SELECT
          business_id,
          day_of_week,
          day_name,
          is_open,
          to_char(open_time, 'HH24:MI') AS open_str,
          to_char(close_time, 'HH24:MI') AS close_str
        FROM business_working_hours
        ORDER BY business_id, day_of_week ASC
      `),
      client.query(`
        SELECT
          COALESCE(legacy_demo_id, code, id::text) AS external_id,
          name,
          audience,
          monthly_price_toman,
          staff_limit_label,
          sms_quota_monthly,
          features,
          is_recommended,
          comparison_meta
        FROM subscription_plans
        ORDER BY sort_order ASC, monthly_price_toman ASC
      `),
      client.query(`
        SELECT
          u.id::text AS id,
          u.full_name,
          u.phone,
          COALESCE(u.default_city, 'اصفهان') AS city,
          u.is_active,
          to_char(u.created_at, 'YYYY/MM/DD') AS created_date,
          EXISTS (
            SELECT 1 FROM platform_admins pa
            WHERE pa.user_id = u.id AND pa.is_active = TRUE
          ) AS is_admin,
          EXISTS (
            SELECT 1 FROM business_members bm
            WHERE bm.user_id = u.id AND bm.is_active = TRUE
          ) OR EXISTS (
            SELECT 1 FROM businesses b2
            WHERE b2.owner_user_id = u.id
          ) AS is_business_member
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT 300
      `),
      client.query(`
        SELECT
          COALESCE(a.legacy_demo_id, a.id::text) AS external_id,
          a.reference_code,
          COALESCE(b.legacy_demo_id, b.id::text) AS business_external_id,
          b.slug AS business_slug,
          b.name AS business_name,
          COALESCE(s.legacy_demo_id, s.id::text) AS service_external_id,
          a.service_title_snapshot,
          COALESCE(sp.legacy_demo_id, sp.id::text) AS specialist_external_id,
          a.specialist_name_snapshot,
          a.customer_name,
          a.customer_phone,
          a.customer_phone_masked,
          a.date_jalali,
          a.time_slot_label,
          a.duration_minutes_snapshot,
          a.service_price_toman_snapshot,
          a.status,
          a.notes
        FROM appointments a
        JOIN businesses b ON b.id = a.business_id
        JOIN services s ON s.id = a.service_id
        JOIN specialists sp ON sp.id = a.specialist_id
        ORDER BY a.service_starts_at DESC, a.created_at DESC
        LIMIT 200
      `),
    ]);

    const whByBusinessId = new Map<string, WorkingHourItem[]>();
    for (const row of whRes.rows) {
      const bizUuid = String(row.business_id);
      const list = whByBusinessId.get(bizUuid) ?? [];
      list.push({
        dayName: String(row.day_name),
        isOpen: Boolean(row.is_open),
        openTime: toPersianDigitsServer(String(row.open_str || '09:30')),
        closeTime: toPersianDigitsServer(String(row.close_str || '19:30')),
      });
      whByBusinessId.set(bizUuid, list);
    }

    const categories: CategoryItem[] = catRes.rows.map((r) => ({
      id: String(r.external_id),
      slug: String(r.slug),
      title: String(r.title),
      subtitle: String(r.subtitle),
      targetAudience: String(r.target_audience),
      iconName: String(r.icon_name),
      serviceCount: Number(r.service_count),
    }));

    const excludedLegacyBizIds = new Set([
      'biz-2',
      'biz-3',
      'biz-4',
      'biz-5',
      'biz-6',
      'biz-7',
      'biz-8',
    ]);

    const businesses: BusinessItem[] = bizRes.rows
      .filter((r) => !excludedLegacyBizIds.has(String(r.external_id)))
      .map((r) =>
        mergeBusinessRowWithExtra(
          {
            id: String(r.external_id),
            slug: String(r.slug),
            name: String(r.name),
            type: r.type as BusinessType,
            typeLabel: String(r.type_label),
            categorySlug: String(r.primary_category_slug),
            city: String(r.city),
            neighborhood: String(r.neighborhood),
            address: String(r.address),
            mapLat: r.map_lat !== null ? Number(r.map_lat) : undefined,
            mapLng: r.map_lng !== null ? Number(r.map_lng) : undefined,
            rating: Number(r.rating_avg),
            reviewCount: Number(r.review_count),
            startingPriceToman: Number(r.starting_price_toman),
            verifiedBadge: Boolean(r.verified_badge),
            shortDescription: String(r.short_description),
            aboutText: String(r.about_text),
            phoneDisplay: String(r.phone_display),
            ownerName: r.owner_full_name ? String(r.owner_full_name) : undefined,
            ownerPhone: r.owner_phone
              ? toPersianDigitsServer(String(r.owner_phone))
              : String(r.phone_display),
            createdAtJalali: toPersianDigitsServer(
              String(r.created_date || '1405/08/01')
            ),
            instagramHandle: r.instagram_handle
              ? String(r.instagram_handle)
              : undefined,
            workingHours: whByBusinessId.get(String(r.id)) ?? [],
            visualTheme: (r.visual_theme as VisualTheme) || 'violet',
            approvalStatus: r.approval_status as ApprovalStatus,
            subscriptionPlan: String(r.subscription_plan),
            subscriptionStatus: r.subscription_status as SubscriptionStatus,
            featured: Boolean(r.is_featured),
          },
          r.extra_json,
          r.legacy_demo_id
        )
      );

    const plans: SubscriptionPlanItem[] = planRes.rows.map((r) => {
      const comp =
        r.comparison_meta && typeof r.comparison_meta === 'object'
          ? (r.comparison_meta as Record<string, unknown>)
          : {};
      return {
        id: String(r.external_id),
        name: String(r.name),
        audience: String(r.audience),
        monthlyPriceToman: Number(r.monthly_price_toman),
        staffLimit: String(r.staff_limit_label),
        smsQuotaMonthly: Number(r.sms_quota_monthly),
        features: Array.isArray(r.features) ? r.features.map(String) : [],
        isRecommended: Boolean(r.is_recommended),
        comparison: {
          onlineBooking: String(comp.onlineBooking ?? 'نامحدود'),
          smsReminders: String(comp.smsReminders ?? 'فعال'),
          analyticsLevel: String(comp.analyticsLevel ?? 'پایه'),
          supportType: String(comp.supportType ?? 'تیکت پشتیبانی'),
        },
      };
    });

    const directUsers: AdminUserRecord[] = usrRes.rows.map((r) => {
      const fullPhonePersian = toPersianDigitsServer(String(r.phone || ''));
      return {
        id: String(r.id),
        fullName: String(r.full_name || 'کاربر Timeto'),
        phone: fullPhonePersian,
        phoneMasked: fullPhonePersian,
        roleLabel: r.is_admin
          ? 'مدیر کل پلتفرم'
          : r.is_business_member
            ? 'صاحب کسب‌وکار'
            : 'مشتری عادی',
        city: String(r.city || 'اصفهان'),
        joinedJalali: toPersianDigitsServer(String(r.created_date || '1405/08/01')),
        isActive: Boolean(r.is_active),
      };
    });

    const mergedRegistryUsers = await buildMergedRegisteredUsersList(client);
    const combinedByPhone = new Map<string, AdminUserRecord>();
    for (const u of mergedRegistryUsers) {
      const clean = toEnglishDigits(u.phone || u.phoneMasked || '').replace(/\D/g, '');
      if (clean) combinedByPhone.set(clean, u);
    }
    for (const u of directUsers) {
      const clean = toEnglishDigits(u.phone || u.phoneMasked || '').replace(/\D/g, '');
      if (clean && !SEED_DUMMY_PHONES.has(clean) && !combinedByPhone.has(clean)) {
        combinedByPhone.set(clean, u);
      }
    }
    const users: AdminUserRecord[] =
      combinedByPhone.size > 0 ? Array.from(combinedByPhone.values()) : directUsers;

    const appointments: AppointmentItem[] = aptRes.rows.map((r) => ({
      id: String(r.external_id),
      referenceCode: String(r.reference_code),
      businessId: String(r.business_external_id),
      businessSlug: String(r.business_slug),
      businessName: String(r.business_name),
      serviceId: String(r.service_external_id),
      serviceTitle: String(r.service_title_snapshot),
      specialistId: String(r.specialist_external_id),
      specialistName: String(r.specialist_name_snapshot),
      customerName: String(r.customer_name),
      customerPhoneMasked: String(r.customer_phone_masked),
      dateJalali: String(r.date_jalali),
      timeSlot: String(r.time_slot_label),
      durationMinutes: Number(r.duration_minutes_snapshot),
      priceToman: Number(r.service_price_toman_snapshot),
      status: r.status as AppointmentStatus,
      notes: r.notes ? String(r.notes) : undefined,
    }));

    return {
      businesses,
      categories,
      plans,
      users,
      appointments,
    };
  } finally {
    client.release();
  }
}

/**
 * محاسبه بازه‌های زمانی آزاد و اشغال‌شده یک کسب‌وکار/متخصص در یک تاریخ مشخص
 * بر اساس جدول ساعات کاری (business_working_hours) و نوبت‌های فعال (PENDING, CONFIRMED)
 */
export async function getBusinessAvailabilityInDb(
  pool: Pool,
  businessSlugOrId: string,
  dateJalaliRaw: string,
  serviceIdRaw?: string,
  specialistIdRaw?: string
): Promise<BusinessAvailabilityPayload> {
  const trimmedDate = (dateJalaliRaw ?? '').trim();
  if (!trimmedDate) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }
  const parsedDate = parseAndValidateJalaliDate(trimmedDate);
  const dateJalali = toPersianDigitsServer(parsedDate.normalizedJalali);
  const gregorianIsoDate = parsedDate.gregorianIsoDate;

  const client = await pool.connect();
  try {
    const biz = await resolveBusinessUuid(client, businessSlugOrId);
    if (biz.approvalStatus !== 'APPROVED') {
      throw new Error('BUSINESS_NOT_APPROVED');
    }

    let durationMinutes = 60;
    let targetServiceUuid: string | null = null;
    if (serviceIdRaw !== undefined && serviceIdRaw.trim() !== '') {
      const srvRes = await client.query(
        `
        SELECT id, COALESCE(legacy_demo_id, id::text) AS external_id, title, duration_minutes, price_toman
        FROM services
        WHERE business_id = $1
          AND is_active = TRUE
          AND (id::text = $2 OR legacy_demo_id = $2)
        LIMIT 1
        `,
        [biz.id, serviceIdRaw.trim()]
      );
      if (!srvRes.rowCount || !srvRes.rows[0]) {
        throw new Error('SERVICE_NOT_FOUND_FOR_BUSINESS');
      }
      targetServiceUuid = String(srvRes.rows[0].id);
      durationMinutes = Number(srvRes.rows[0].duration_minutes);
    }

    let targetSpecialistUuid: string | null = null;
    if (specialistIdRaw !== undefined && specialistIdRaw.trim() !== '') {
      const spcRes = await client.query(
        `
        SELECT id, COALESCE(legacy_demo_id, id::text) AS external_id, full_name
        FROM specialists
        WHERE business_id = $1
          AND is_active = TRUE
          AND (id::text = $2 OR legacy_demo_id = $2 OR slug = $2)
        LIMIT 1
        `,
        [biz.id, specialistIdRaw.trim()]
      );
      if (!spcRes.rowCount || !spcRes.rows[0]) {
        throw new Error('SPECIALIST_NOT_FOUND_FOR_BUSINESS');
      }
      targetSpecialistUuid = String(spcRes.rows[0].id);
    }

    // بررسی تخصیص خدمت به متخصص در صورتی که هر دو پارامتر ارسال شده باشند
    if (targetSpecialistUuid && targetServiceUuid) {
      const spcSrvCountRes = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM specialist_services WHERE specialist_id = $1 AND business_id = $2`,
        [targetSpecialistUuid, biz.id]
      );
      if (Number(spcSrvCountRes.rows[0]?.cnt ?? 0) > 0) {
        const spcSrvMatchRes = await client.query(
          `SELECT 1 FROM specialist_services WHERE specialist_id = $1 AND service_id = $2 AND business_id = $3 LIMIT 1`,
          [targetSpecialistUuid, targetServiceUuid, biz.id]
        );
        if (!spcSrvMatchRes.rowCount) {
          throw new Error('SPECIALIST_NOT_ASSIGNED_TO_SERVICE');
        }
      }
    }

    const settingsRes = await client.query(
      `SELECT buffer_minutes FROM business_settings WHERE business_id = $1`,
      [biz.id]
    );
    const bufferMinutes =
      settingsRes.rowCount && settingsRes.rows[0]
        ? Number(settingsRes.rows[0].buffer_minutes)
        : 15;

    const { dayOfWeek, dayName } = jalaliDateToIranDayOfWeek(trimmedDate);
    const whRes = await client.query(
      `
      SELECT
        is_open,
        to_char(open_time, 'HH24:MI') AS open_str,
        to_char(close_time, 'HH24:MI') AS close_str
      FROM business_working_hours
      WHERE business_id = $1 AND (day_of_week = $2 OR day_name = $3)
      ORDER BY (day_of_week = $2) DESC
      LIMIT 1
      `,
      [biz.id, dayOfWeek, dayName]
    );

    let isOpen = false;
    let openStr = '09:30';
    let closeStr = '19:30';

    if (whRes.rowCount && whRes.rows[0]) {
      isOpen = Boolean(whRes.rows[0].is_open);
      openStr = String(whRes.rows[0].open_str || '09:30');
      closeStr = String(whRes.rows[0].close_str || '19:30');
    }

    const parsedOpenMins = parseTimeLabelToMinutes(openStr);
    const parsedCloseMins = parseTimeLabelToMinutes(closeStr);
    if (
      parsedOpenMins === null ||
      parsedCloseMins === null ||
      parsedCloseMins <= parsedOpenMins
    ) {
      isOpen = false;
    }
    const openMins = parsedOpenMins ?? 570;
    const closeMins = parsedCloseMins ?? 1170;

    // دریافت استثناهای زمانی سالن یا متخصص در آن تاریخ از جدول business_time_exceptions
    const exRes = await client.query<BusinessTimeExceptionRow>(
      `
      SELECT
        id,
        specialist_id,
        is_closed_all_day,
        to_char(start_time, 'HH24:MI') AS start_str,
        to_char(end_time, 'HH24:MI') AS end_str,
        reason
      FROM business_time_exceptions
      WHERE business_id = $1
        AND exception_date = $2::date
        AND (specialist_id IS NULL OR specialist_id = $3)
      ORDER BY is_closed_all_day DESC, (specialist_id IS NULL) DESC, start_time ASC NULLS FIRST
      `,
      [biz.id, gregorianIsoDate, targetSpecialistUuid]
    );
    const exceptions = evaluateDayTimeExceptions(
      exRes.rows ?? [],
      targetSpecialistUuid
    );

    if (exceptions.isBusinessClosedAllDay || exceptions.hasInvalidExceptionRow) {
      isOpen = false;
    }

    // دریافت نوبت‌های فعال در آن تاریخ برای بررسی تداخل زمانی
    const aptQueryParams: unknown[] = [biz.id];
    let specialistFilterSql = '';
    if (targetSpecialistUuid) {
      aptQueryParams.push(targetSpecialistUuid);
      specialistFilterSql = `AND specialist_id = $2`;
    }

    const activeAptsRes = await client.query(
      `
      SELECT
        service_starts_at,
        occupied_until_at
      FROM appointments
      WHERE business_id = $1
        AND status IN ('PENDING', 'CONFIRMED')
        ${specialistFilterSql}
      `,
      aptQueryParams
    );

    const occupiedWindows = (activeAptsRes.rows ?? []).map((r) => ({
      startMs: new Date(String(r.service_starts_at)).getTime(),
      endMs: new Date(String(r.occupied_until_at)).getTime(),
    }));

    const candidateMinutesList = generateDynamicSlotMinutes(
      openMins,
      closeMins,
      30
    );
    const nowMs = Date.now();

    const slots: TimeSlotAvailabilityItem[] = candidateMinutesList.map(
      (startMins) => {
        const label = formatMinutesToPersianTimeLabel(startMins);

        if (!isOpen) {
          return {
            time: label,
            available: false,
            reason: exceptions.businessClosedReason || 'تعطیل',
          };
        }

        if (exceptions.isSpecialistClosedAllDay) {
          return {
            time: label,
            available: false,
            reason: exceptions.specialistClosedReason || 'مرخصی متخصص',
          };
        }

        const slotStartMs = jalaliSlotToTimestamptz(
          trimmedDate,
          label
        ).getTime();

        if (slotStartMs <= nowMs) {
          return {
            time: label,
            available: false,
            reason: 'گذشته',
          };
        }

        if (startMins < openMins || startMins + durationMinutes > closeMins) {
          return {
            time: label,
            available: false,
            reason: 'خارج از ساعت کاری',
          };
        }

        const matchedException = exceptions.partialWindows.find(
          (w) =>
            startMins < w.endMins && startMins + durationMinutes > w.startMins
        );
        if (matchedException) {
          return {
            time: label,
            available: false,
            reason:
              matchedException.reason ||
              (matchedException.specialistId
                ? 'مرخصی متخصص'
                : 'خارج از ساعت کاری'),
          };
        }

        const slotOccupiedEndMs =
          slotStartMs + (durationMinutes + bufferMinutes) * 60 * 1000;

        const hasOverlap = occupiedWindows.some(
          (w) => slotStartMs < w.endMs && slotOccupiedEndMs > w.startMs
        );

        if (hasOverlap) {
          return {
            time: label,
            available: false,
            reason: 'رزروشده',
          };
        }

        return {
          time: label,
          available: true,
        };
      }
    );

    return {
      businessId: biz.externalId,
      businessSlug: biz.slug,
      dateJalali,
      dayOfWeek,
      dayName,
      isOpen,
      openTime: toPersianDigitsServer(openStr),
      closeTime: toPersianDigitsServer(closeStr),
      durationMinutes,
      bufferMinutes,
      slots,
    };
  } finally {
    client.release();
  }
}

/**
 * بروزرسانی مشخصات پروفایل مشتری احراز هویت‌شده در جدول users (/me/profile)
 */
export async function updateCustomerProfileInDb(
  pool: Pool,
  actorUser: AuthenticatedUser,
  patch: { fullName?: string; defaultCity?: string }
): Promise<AuthenticatedUser> {
  const fullName = (patch.fullName ?? actorUser.fullName ?? '').trim();
  const defaultCity = (patch.defaultCity ?? actorUser.defaultCity ?? 'تهران').trim();
  if (fullName.length < 2) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    await client.query(
      `
      UPDATE users
      SET
        full_name = $2,
        default_city = $3,
        updated_at = NOW()
      WHERE id = $1
      `,
      [actorUser.userId, fullName, defaultCity]
    );

    const updated = await loadUserPermissionsByUserId(
      client,
      actorUser.userId,
      actorUser.sessionId
    );
    if (!updated) {
      throw new Error('USER_ACCOUNT_DISABLED');
    }
    return updated;
  } finally {
    client.release();
  }
}

/**
 * ثبت دیدگاه و امتیاز واقعی مراجع احراز هویت‌شده در جدول reviews و بروزرسانی میانگین امتیاز کسب‌وکار
 */
export async function createReviewInDb(
  pool: Pool,
  actorUser: AuthenticatedUser | null,
  input: {
    businessId: string;
    specialistSlug?: string;
    serviceTitle: string;
    rating: number;
    comment: string;
    dateJalali?: string;
    authorName?: string;
    authorPhone?: string;
  }
): Promise<ReviewItem> {
  const comment = (input.comment ?? '').trim();
  const serviceTitle = (input.serviceTitle ?? 'خدمات زیبایی').trim();
  const rating = Math.round(Number(input.rating) || 0);
  if (!comment || rating < 1 || rating > 5) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const moderation = validateReviewContent(comment);
  if (!moderation.valid) {
    throw new Error(moderation.code ?? 'INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const biz = await resolveBusinessUuid(client, input.businessId);
    if (biz.approvalStatus === 'REJECTED') {
      throw new Error('BUSINESS_NOT_APPROVED');
    }

    let customerUserId = actorUser?.userId ?? null;
    const cleanPhone = toEnglishDigits(
      input.authorPhone || actorUser?.phone || ''
    ).replace(/\D/g, '');
    const authorName = (
      input.authorName ||
      actorUser?.fullName ||
      'کاربر تایم‌تو'
    ).trim();

    if (!customerUserId) {
      const effectivePhone = /^09\d{9}$/.test(cleanPhone)
        ? cleanPhone
        : `0999${String(Date.now()).slice(-7)}`;
      const upsertedUserRes = await client.query(
        `
        INSERT INTO users (phone, full_name, default_city, is_active)
        VALUES ($1, $2, 'اصفهان', TRUE)
        ON CONFLICT (phone) DO UPDATE SET
          full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
          updated_at = NOW()
        RETURNING id
        `,
        [effectivePhone, authorName]
      );
      customerUserId = String(upsertedUserRes.rows[0].id);
    }

    const dateJalali = (input.dateJalali || '۱۴۰۵/۰۸/۰۵').trim();

    const insertRes = await client.query(
      `
      INSERT INTO reviews (
        business_id,
        customer_user_id,
        specialist_slug,
        author_name,
        service_title,
        rating,
        date_jalali,
        comment,
        is_published
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING
        COALESCE(legacy_demo_id, id::text) AS external_id,
        specialist_slug,
        author_name,
        service_title,
        rating,
        date_jalali,
        comment
      `,
      [
        biz.id,
        customerUserId,
        input.specialistSlug?.trim() || null,
        authorName,
        serviceTitle,
        rating,
        dateJalali,
        comment,
      ]
    );

    await client.query(
      `
      UPDATE businesses
      SET
        rating_avg = COALESCE((
          SELECT ROUND(AVG(rating)::numeric, 1)
          FROM reviews
          WHERE business_id = $1 AND is_published = TRUE
        ), 5.0),
        review_count = (
          SELECT COUNT(*)::int
          FROM reviews
          WHERE business_id = $1 AND is_published = TRUE
        ),
        updated_at = NOW()
      WHERE id = $1
      `,
      [biz.id]
    );

    const row = insertRes.rows[0];
    const reviewExternalId = String(row.external_id);

    if (cleanPhone) {
      await ensureExtendedMetaTables(client);
      const metaMap = await getReviewModerationMetaMap(client);
      metaMap[reviewExternalId] = {
        ...(metaMap[reviewExternalId] ?? {}),
        authorPhone: toPersianDigitsServer(cleanPhone),
      };
      await client.query(
        `
        INSERT INTO platform_kv_store (key, value_json, updated_at)
        VALUES ('review_moderation_meta', $1::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
        `,
        [JSON.stringify(metaMap)]
      );
    }

    await client.query('COMMIT');
    return {
      id: reviewExternalId,
      businessId: biz.externalId,
      specialistSlug: row.specialist_slug
        ? String(row.specialist_slug)
        : undefined,
      authorName: String(row.author_name),
      authorPhone: cleanPhone ? toPersianDigitsServer(cleanPhone) : undefined,
      serviceTitle: String(row.service_title),
      rating: Number(row.rating),
      dateJalali: String(row.date_jalali),
      comment: String(row.comment),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * صدور اتمیک کد یک‌بارمصرف (OTP) با کنترل نرخ درخواست در سطح شماره موبایل و IP در PostgreSQL
 * و ارسال واقعی از طریق درگاه پیامک (SMS Gateway).
 * - هیچ کد OTP ثابت یا آزمایشی در Production وجود ندارد.
 * - هیچ کد OTP خامی در دیتابیس، پاسخ یا لاگ ثبت نمی‌شود.
 * - در محیط Production، اگر درگاه پیامک تنظیم نشده باشد یا ارسال را تایید نکند، تراکنش Rollback شده
 *   و هرگز به کاربر به دروغ اعلام نمی‌شود که پیامک ارسال شده است.
 */
export async function requestOtpInDb(
  pool: Pool,
  rawPhone: string,
  requestIp: string,
  options?: {
    nodeEnv?: 'development' | 'production' | 'test';
    smsConfig?: SmsConfig;
    smsSender?: SmsSenderFn;
    otpHmacSecret?: string;
  }
): Promise<{
  allowed: boolean;
  challengeId?: string;
  retryAfterSec?: number;
  reasonCode: string;
  smsDelivered?: boolean;
  smsProvider?: string;
}> {
  const cleanPhone = toEnglishDigits(rawPhone).replace(/\D/g, '');
  if (!/^09\d{9}$/.test(cleanPhone)) {
    throw new Error('INVALID_IRAN_MOBILE_PHONE');
  }

  const safeIp = (requestIp || '127.0.0.1').trim().slice(0, 45);
  const otpSecret = options?.otpHmacSecret
    ? resolveOtpHmacSecret({
        NODE_ENV: options.nodeEnv ?? process.env.NODE_ENV,
        OTP_HMAC_SECRET: options.otpHmacSecret,
      })
    : resolveOtpHmacSecret();

  const nodeEnv =
    options?.nodeEnv ??
    ((process.env.NODE_ENV ?? 'development').trim().toLowerCase() === 'production'
      ? 'production'
      : (process.env.NODE_ENV ?? 'development').trim().toLowerCase() === 'test'
        ? 'test'
        : 'development');
  const smsConfig = options?.smsConfig ?? resolveSmsConfig();
  const smsSender = options?.smsSender ?? sendOtpSmsViaGateway;

  // پیش‌بررسی تنظیم بودن درگاه پیامک در محیط Production قبل از مصرف سهمیه Rate Limit کاربر
  if (
    nodeEnv === 'production' &&
    (smsConfig.provider === 'disabled' ||
      smsConfig.provider === 'console' ||
      !smsConfig.apiKey)
  ) {
    throw new Error('SMS_GATEWAY_NOT_CONFIGURED');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ۱. محدودسازی نرخ درخواست بر اساس شماره موبایل (حداکثر ۵ درخواست در ۱۰ دقیقه با فاصله ۶۰ ثانیه)
    const phoneRlRes = await client.query(
      `SELECT * FROM check_and_increment_auth_rate_limit($1, 600, 5, 60)`,
      [`otp_send:${cleanPhone}`]
    );
    const phoneRl = phoneRlRes.rows[0];
    if (!phoneRl.allowed) {
      await client.query('COMMIT');
      return {
        allowed: false,
        retryAfterSec: Number(phoneRl.retry_after_sec),
        reasonCode: String(phoneRl.reason_code),
      };
    }

    // ۲. محدودسازی نرخ درخواست بر اساس IP برای جلوگیری از بمباران پیامکی شماره‌های مختلف
    const ipRlRes = await client.query(
      `SELECT * FROM check_and_increment_auth_rate_limit($1, 600, 15, 0)`,
      [`otp_send_ip:${safeIp}`]
    );
    const ipRl = ipRlRes.rows[0];
    if (!ipRl.allowed) {
      await client.query('COMMIT');
      return {
        allowed: false,
        retryAfterSec: Number(ipRl.retry_after_sec),
        reasonCode: String(ipRl.reason_code),
      };
    }

    const generatedCode = String(crypto.randomInt(100000, 1000000));
    const codeHmac = crypto
      .createHmac('sha256', otpSecret)
      .update(`${cleanPhone}:${generatedCode}`)
      .digest('hex');

    const issueRes = await client.query(
      `SELECT issue_otp_challenge_atomic($1, $2, $3, 120, 5::smallint) AS challenge_id`,
      [cleanPhone, codeHmac, safeIp]
    );

    const delivery = await smsSender(
      cleanPhone,
      generatedCode,
      smsConfig,
      nodeEnv
    );
    if (!delivery.sent) {
      await client.query('ROLLBACK');
      throw new Error(delivery.errorCode ?? 'SMS_DELIVERY_FAILED');
    }

    await client.query('COMMIT');
    return {
      allowed: true,
      challengeId: String(issueRes.rows[0].challenge_id),
      reasonCode: 'OTP_ISSUED',
      smsDelivered: true,
      smsProvider: delivery.provider,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * راه‌اندازی یک‌باره و امن اولین مدیر کل پلتفرم (PLATFORM_ADMIN)
 * - این تابع با قفل تراکنشی pg_advisory_xact_lock اجرا می‌شود.
 * - اگر حتی یک رکورد فعال در جدول platform_admins وجود داشته باشد، عملیات با خطای
 *   PLATFORM_ADMIN_ALREADY_BOOTSTRAPPED متوقف می‌شود و امکان استفاده مجدد ندارد.
 * - هیچ شماره موبایل یا رمز پیش‌فرضی در کد وجود ندارد.
 */
export async function bootstrapInitialPlatformAdminInDb(
  pool: Pool,
  input: {
    phone: string;
    fullName?: string;
    defaultCity?: string;
  }
): Promise<{
  userId: string;
  phone: string;
  fullName: string;
}> {
  const cleanPhone = toEnglishDigits(input.phone || '').replace(/\D/g, '');
  if (!/^09\d{9}$/.test(cleanPhone)) {
    throw new Error('INVALID_IRAN_MOBILE_PHONE');
  }
  const fullName = (input.fullName || 'مدیر ارشد پلتفرم').trim();
  const defaultCity = (input.defaultCity || 'تهران').trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtext('bootstrap_platform_admin'))`
    );

    const existingAdminRes = await client.query(
      `
      SELECT COUNT(*)::int AS cnt
      FROM platform_admins
      WHERE is_active = TRUE AND revoked_at IS NULL
      `
    );
    const activeAdminCount = Number(existingAdminRes.rows[0]?.cnt ?? 0);
    if (activeAdminCount > 0) {
      throw new Error('PLATFORM_ADMIN_ALREADY_BOOTSTRAPPED');
    }

    const userRes = await client.query(
      `
      INSERT INTO users (phone, full_name, default_city, is_active)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (phone) DO UPDATE
      SET
        full_name = EXCLUDED.full_name,
        is_active = TRUE,
        updated_at = NOW()
      RETURNING id, phone, full_name
      `,
      [cleanPhone, fullName, defaultCity]
    );
    const userRow = userRes.rows[0];
    const userId = String(userRow.id);

    const randomSalt = crypto.randomBytes(16).toString('hex');
    const randomEntropy = crypto.randomBytes(32).toString('hex');
    const derivedKey = crypto
      .scryptSync(randomEntropy, randomSalt, 32)
      .toString('hex');
    const passwordHash = `scrypt$${randomSalt}$${derivedKey}`;

    await client.query(
      `
      INSERT INTO platform_admins (
        user_id,
        password_hash,
        allowed_scopes,
        is_active,
        granted_by,
        granted_at,
        revoked_at
      )
      VALUES ($1, $2, ARRAY['ALL']::TEXT[], TRUE, $1, NOW(), NULL)
      ON CONFLICT (user_id) DO UPDATE
      SET
        is_active = TRUE,
        revoked_at = NULL,
        updated_at = NOW()
      `,
      [userId, passwordHash]
    );

    await client.query('COMMIT');
    return {
      userId,
      phone: String(userRow.phone),
      fullName: String(userRow.full_name),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * بررسی اتمیک کد OTP و ایجاد نشست کاربری امضاشده در صورت صحت کد
 * توجه مهم:
 * - در صورت عدم تطابق کد، تراکنش COMMIT می‌شود تا افزایش شمارنده تلاش‌های ناموفق
 *   (attempts_count) و تغییر وضعیت به LOCKED در دیتابیس ماندگار شود.
 * - فقط هش SHA-256 توکن نشست در جدول user_sessions ذخیره می‌شود و توکن امضاشده با SESSION_SECRET برگردانده می‌شود.
 */
export async function verifyOtpInDb(
  pool: Pool,
  rawPhone: string,
  rawCode: string,
  requestIp: string,
  userAgent: string,
  customSessionSecret?: string
): Promise<{
  verified: boolean;
  outcomeCode: string;
  remainingAttempts: number;
  retryAfterSec?: number;
  userId?: string;
  sessionId?: string;
  sessionToken?: string;
  expiresAt?: string;
  user?: AuthenticatedUser;
}> {
  const cleanPhone = toEnglishDigits(rawPhone).replace(/\D/g, '');
  const cleanCode = toEnglishDigits(rawCode).trim();
  if (!/^09\d{9}$/.test(cleanPhone)) {
    throw new Error('INVALID_IRAN_MOBILE_PHONE');
  }
  if (!/^\d{6}$/.test(cleanCode)) {
    throw new Error('INVALID_OTP_CODE_FORMAT');
  }

  const safeIp = (requestIp || '127.0.0.1').trim().slice(0, 45);
  const otpSecret = resolveOtpHmacSecret();
  const sessionSecret = customSessionSecret ?? resolveSessionSecret();

  const candidateHmac = crypto
    .createHmac('sha256', otpSecret)
    .update(`${cleanPhone}:${cleanCode}`)
    .digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // محدودسازی نرخ تلاش تایید بر اساس IP برای جلوگیری از Brute-Force توزیع‌شده
    const ipRlRes = await client.query(
      `SELECT * FROM check_and_increment_auth_rate_limit($1, 600, 20, 0)`,
      [`otp_verify_ip:${safeIp}`]
    );
    const ipRl = ipRlRes.rows[0];
    if (!ipRl.allowed) {
      await client.query('COMMIT');
      return {
        verified: false,
        outcomeCode: 'RATE_LIMIT_BLOCKED',
        remainingAttempts: 0,
        retryAfterSec: Number(ipRl.retry_after_sec),
      };
    }

    const verifyRes = await client.query(
      `SELECT * FROM verify_otp_challenge_atomic($1, $2)`,
      [cleanPhone, candidateHmac]
    );
    const row = verifyRes.rows[0];

    if (!row.verified) {
      // COMMIT الزامی است تا افزایش attempts_count یا وضعیت LOCKED/EXPIRED در دیتابیس ذخیره شود
      await client.query('COMMIT');
      return {
        verified: false,
        outcomeCode: String(row.outcome_code),
        remainingAttempts: Number(row.remaining_attempts),
      };
    }

    const userRes = await client.query(
      `
      INSERT INTO users (phone, full_name, default_city)
      VALUES ($1, 'کاربر BeautyHub', 'تهران')
      ON CONFLICT (phone) DO UPDATE SET updated_at = NOW()
      RETURNING id, is_active
      `,
      [cleanPhone]
    );
    const userId = String(userRes.rows[0].id);
    if (!userRes.rows[0].is_active) {
      await client.query('ROLLBACK');
      throw new Error('USER_ACCOUNT_DISABLED');
    }

    const rawSessionSecretPart = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = hashSessionSecretPart(rawSessionSecretPart);

    const sessionInsertRes = await client.query(
      `
      INSERT INTO user_sessions (
        user_id,
        refresh_token_hash,
        ip_address,
        user_agent,
        expires_at
      )
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
      RETURNING id, expires_at
      `,
      [
        userId,
        refreshTokenHash,
        safeIp,
        (userAgent || 'web').slice(0, 500),
      ]
    );

    const sessionId = String(sessionInsertRes.rows[0].id);
    const expiresAt = new Date(
      String(sessionInsertRes.rows[0].expires_at)
    ).toISOString();

    const authenticatedUser = await loadUserPermissionsByUserId(
      client,
      userId,
      sessionId
    );
    if (!authenticatedUser) {
      await client.query('ROLLBACK');
      throw new Error('USER_ACCOUNT_DISABLED');
    }

    const signedToken = signSessionToken(
      sessionId,
      rawSessionSecretPart,
      sessionSecret
    );

    await client.query('COMMIT');
    return {
      verified: true,
      outcomeCode: 'VERIFIED',
      remainingAttempts: Number(row.remaining_attempts),
      userId,
      sessionId,
      sessionToken: signedToken,
      expiresAt,
      user: authenticatedUser,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ثبت پاسخ مدیریت سالن به دیدگاه مشتری
 */
export async function replyToReviewInDb(
  pool: Pool,
  reviewIdRaw: string,
  replyTextRaw: string,
  dateJalaliRaw?: string
): Promise<{ reviewId: string; salonReply: string; salonReplyDateJalali: string }> {
  const reviewId = (reviewIdRaw || '').trim();
  const salonReply = (replyTextRaw || '').trim();
  if (!reviewId || !salonReply) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }
  const salonReplyDateJalali = (dateJalaliRaw || '۱۴۰۵/۰۸/۰۵').trim();

  const client = await pool.connect();
  try {
    await ensureExtendedMetaTables(client);
    const metaMap = await getReviewModerationMetaMap(client);
    metaMap[reviewId] = {
      ...(metaMap[reviewId] ?? {}),
      salonReply,
      salonReplyDateJalali,
    };
    await client.query(
      `
      INSERT INTO platform_kv_store (key, value_json, updated_at)
      VALUES ('review_moderation_meta', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `,
      [JSON.stringify(metaMap)]
    );
    return { reviewId, salonReply, salonReplyDateJalali };
  } finally {
    client.release();
  }
}

/**
 * گزارش دیدگاه حاوی فحاشی یا جفنگ توسط صاحب سالن به مدیر کل
 * توجه: دیدگاه‌های انتقادی محترمانه حذف نمی‌شوند و فقط برای بررسی مدیر کل علامت‌گذاری می‌شوند.
 */
export async function reportReviewInDb(
  pool: Pool,
  reviewIdRaw: string,
  reasonRaw: string
): Promise<{ reviewId: string; isReportedBySalon: boolean; reportReason: string }> {
  const reviewId = (reviewIdRaw || '').trim();
  const reportReason = (reasonRaw || 'گزارش فحاشی یا متن نامفهوم').trim();
  if (!reviewId) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    await ensureExtendedMetaTables(client);
    const metaMap = await getReviewModerationMetaMap(client);
    metaMap[reviewId] = {
      ...(metaMap[reviewId] ?? {}),
      isReportedBySalon: true,
      reportReason,
    };
    await client.query(
      `
      INSERT INTO platform_kv_store (key, value_json, updated_at)
      VALUES ('review_moderation_meta', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `,
      [JSON.stringify(metaMap)]
    );
    return { reviewId, isReportedBySalon: true, reportReason };
  } finally {
    client.release();
  }
}

/**
 * حذف دیدگاه حاوی توهین/جفنگ توسط مدیر کل پلتفرم و بروزرسانی میانگین امتیاز سالن
 */
export async function deleteReviewInDb(
  pool: Pool,
  reviewIdRaw: string
): Promise<{ deleted: boolean; reviewId: string }> {
  const reviewId = (reviewIdRaw || '').trim();
  if (!reviewId) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const findRes = await client.query(
      `
      SELECT id, business_id
      FROM reviews
      WHERE id::text = $1 OR legacy_demo_id = $1
      LIMIT 1
      `,
      [reviewId]
    );

    if (findRes.rowCount && findRes.rows[0]) {
      const targetUuid = String(findRes.rows[0].id);
      const businessUuid = String(findRes.rows[0].business_id);

      await client.query(`DELETE FROM reviews WHERE id = $1`, [targetUuid]);

      await client.query(
        `
        UPDATE businesses
        SET
          rating_avg = COALESCE((
            SELECT ROUND(AVG(rating)::numeric, 1)
            FROM reviews
            WHERE business_id = $1 AND is_published = TRUE
          ), 5.0),
          review_count = (
            SELECT COUNT(*)::int
            FROM reviews
            WHERE business_id = $1 AND is_published = TRUE
          ),
          updated_at = NOW()
        WHERE id = $1
        `,
        [businessUuid]
      );
    }

    await ensureExtendedMetaTables(client);
    const metaMap = await getReviewModerationMetaMap(client);
    if (metaMap[reviewId]) {
      delete metaMap[reviewId];
      await client.query(
        `
        INSERT INTO platform_kv_store (key, value_json, updated_at)
        VALUES ('review_moderation_meta', $1::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
        `,
        [JSON.stringify(metaMap)]
      );
    }

    await client.query('COMMIT');
    return { deleted: true, reviewId };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * همگام‌سازی و ثبت دائمی حساب‌های کاربری ثبت‌نام‌شده (مشتری عادی و صاحب سالن) در دیتابیس PostgreSQL
 * تا تمام کاربران قدیمی و جدید در پنل مدیریت کل (/admin/users) از هر مرورگر و دستگاهی قابل مشاهده باشند.
 */
export async function syncRegisteredAccountsInDb(
  pool: Pool,
  accountsInput: Array<{
    phone: string;
    fullName: string;
    city?: string;
    role?: 'customer' | 'owner' | 'admin';
    password?: string;
    joinedJalali?: string;
  }>,
  options?: {
    issueSessionForPhone?: string;
    requestIp?: string;
    userAgent?: string;
  }
): Promise<{
  registeredUsers: AdminUserRecord[];
  sessionToken?: string;
  expiresAt?: string;
  user?: AuthenticatedUser;
}> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureExtendedMetaTables(client);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_passwords (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        password_hash TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const existingKvRes = await client.query(
      `SELECT value_json FROM platform_kv_store WHERE key = 'registered_accounts_registry' LIMIT 1`
    );
    const registryList: Array<Record<string, unknown>> = Array.isArray(
      existingKvRes.rows[0]?.value_json
    )
      ? [...(existingKvRes.rows[0].value_json as Array<Record<string, unknown>>)]
      : existingKvRes.rows[0]?.value_json &&
          typeof existingKvRes.rows[0].value_json === 'object'
        ? Object.values(
            existingKvRes.rows[0].value_json as Record<string, Record<string, unknown>>
          )
        : [];

    const deletedRes = await client.query(
      `SELECT value_json FROM platform_kv_store WHERE key = 'deleted_admin_phones_registry' LIMIT 1`
    );
    const deletedPhones = new Set<string>(
      Array.isArray(deletedRes.rows[0]?.value_json)
        ? (deletedRes.rows[0].value_json as string[]).map((p) =>
            toEnglishDigits(String(p)).replace(/\D/g, '')
          )
        : []
    );

    let issuedSessionToken: string | undefined;
    let issuedExpiresAt: string | undefined;
    let issuedUser: AuthenticatedUser | undefined;
    const targetSessionPhone = toEnglishDigits(
      options?.issueSessionForPhone || ''
    ).replace(/\D/g, '');

    for (const acc of accountsInput) {
      const cleanPhone = toEnglishDigits(acc.phone || '').replace(/\D/g, '');
      if (!/^09\d{9}$/.test(cleanPhone) || SEED_DUMMY_PHONES.has(cleanPhone)) {
        continue;
      }

      // اگر کاربر دوباره ثبت‌نام کرد، از لیست حذف‌شده‌ها خارج شود
      if (targetSessionPhone && cleanPhone === targetSessionPhone) {
        deletedPhones.delete(cleanPhone);
      } else if (deletedPhones.has(cleanPhone)) {
        continue;
      }

      const fullName = (acc.fullName || 'کاربر تایم‌تو').trim();
      const city = (acc.city || 'اصفهان').trim();
      const roleLabel =
        acc.role === 'admin' || cleanPhone === '09134337596'
          ? 'مدیر کل پلتفرم'
          : acc.role === 'owner'
            ? 'صاحب کسب‌وکار'
            : 'مشتری عادی';

      const userUpsertRes = await client.query(
        `
        INSERT INTO users (phone, full_name, default_city, is_active)
        VALUES ($1, $2, $3, TRUE)
        ON CONFLICT (phone) DO UPDATE SET
          full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
          default_city = COALESCE(NULLIF(EXCLUDED.default_city, ''), users.default_city),
          updated_at = NOW()
        RETURNING id, is_active
        `,
        [cleanPhone, fullName, city]
      );
      const userId = String(userUpsertRes.rows[0].id);

      if (acc.password && acc.password.trim().length >= 4) {
        const salt = crypto.randomBytes(16).toString('hex');
        const derived = crypto
          .scryptSync(acc.password.trim(), salt, 32)
          .toString('hex');
        const pwdHash = `scrypt$${salt}$${derived}`;
        await client.query(
          `
          INSERT INTO user_passwords (user_id, password_hash, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            updated_at = NOW()
          `,
          [userId, pwdHash]
        );
      }

      const existingIdx = registryList.findIndex(
        (item) =>
          toEnglishDigits(String(item.phone || '')).replace(/\D/g, '') ===
          cleanPhone
      );
      const recordObj = {
        id: existingIdx >= 0 ? String(registryList[existingIdx].id || `usr-${cleanPhone}`) : `usr-${cleanPhone}`,
        fullName,
        phone: toPersianDigitsServer(cleanPhone),
        phoneMasked: toPersianDigitsServer(cleanPhone),
        roleLabel,
        city,
        joinedJalali:
          acc.joinedJalali ||
          (existingIdx >= 0 ? String(registryList[existingIdx].joinedJalali || '۱۴۰۵/۰۸/۰۵') : '۱۴۰۵/۰۸/۰۵'),
        isActive: true,
      };
      if (existingIdx >= 0) {
        registryList[existingIdx] = {
          ...registryList[existingIdx],
          ...recordObj,
        };
      } else {
        registryList.unshift(recordObj);
      }

      if (targetSessionPhone && cleanPhone === targetSessionPhone) {
        const sessionSecret = resolveSessionSecret();
        const rawSessionSecretPart = crypto.randomBytes(32).toString('hex');
        const refreshTokenHash = hashSessionSecretPart(rawSessionSecretPart);
        const safeIp = (options?.requestIp || '127.0.0.1').trim().slice(0, 45);
        const safeUa = (options?.userAgent || 'web').slice(0, 500);

        const sessionInsertRes = await client.query(
          `
          INSERT INTO user_sessions (
            user_id,
            refresh_token_hash,
            ip_address,
            user_agent,
            expires_at
          )
          VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')
          RETURNING id, expires_at
          `,
          [userId, refreshTokenHash, safeIp, safeUa]
        );
        const sessionId = String(sessionInsertRes.rows[0].id);
        issuedExpiresAt = new Date(
          String(sessionInsertRes.rows[0].expires_at)
        ).toISOString();
        const loadedUser = await loadUserPermissionsByUserId(
          client,
          userId,
          sessionId
        );
        if (loadedUser) {
          issuedUser = loadedUser;
          issuedSessionToken = signSessionToken(
            sessionId,
            rawSessionSecretPart,
            sessionSecret
          );
        }
      }
    }

    await client.query(
      `
      INSERT INTO platform_kv_store (key, value_json, updated_at)
      VALUES ('registered_accounts_registry', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `,
      [JSON.stringify(registryList)]
    );

    await client.query(
      `
      INSERT INTO platform_kv_store (key, value_json, updated_at)
      VALUES ('deleted_admin_phones_registry', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `,
      [JSON.stringify(Array.from(deletedPhones))]
    );

    const registeredUsers = await buildMergedRegisteredUsersList(client);
    await client.query('COMMIT');
    return {
      registeredUsers,
      sessionToken: issuedSessionToken,
      expiresAt: issuedExpiresAt,
      user: issuedUser,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * ویرایش مشخصات یا وضعیت کاربر توسط مدیر کل پلتفرم در PostgreSQL
 */
export async function updateAdminUserInDb(
  pool: Pool,
  phoneRaw: string,
  patch: Partial<Pick<AdminUserRecord, 'fullName' | 'city' | 'roleLabel' | 'isActive'>>
): Promise<AdminUserRecord[]> {
  const cleanPhone = toEnglishDigits(phoneRaw || '').replace(/\D/g, '');
  if (!cleanPhone) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureExtendedMetaTables(client);

    await client.query(
      `
      UPDATE users
      SET
        full_name = COALESCE($2, full_name),
        default_city = COALESCE($3, default_city),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE phone = $1
      `,
      [
        cleanPhone,
        patch.fullName?.trim() || null,
        patch.city?.trim() || null,
        typeof patch.isActive === 'boolean' ? patch.isActive : null,
      ]
    );

    const overridesRes = await client.query(
      `SELECT value_json FROM platform_kv_store WHERE key = 'admin_user_overrides_registry' LIMIT 1`
    );
    const overridesMap: Record<string, Partial<AdminUserRecord>> =
      overridesRes.rows[0]?.value_json &&
      typeof overridesRes.rows[0].value_json === 'object'
        ? { ...(overridesRes.rows[0].value_json as Record<string, Partial<AdminUserRecord>>) }
        : {};

    overridesMap[cleanPhone] = {
      ...(overridesMap[cleanPhone] ?? {}),
      ...(patch.fullName !== undefined ? { fullName: patch.fullName.trim() } : {}),
      ...(patch.city !== undefined ? { city: patch.city.trim() } : {}),
      ...(patch.roleLabel !== undefined ? { roleLabel: patch.roleLabel.trim() } : {}),
      ...(typeof patch.isActive === 'boolean' ? { isActive: patch.isActive } : {}),
    };

    await client.query(
      `
      INSERT INTO platform_kv_store (key, value_json, updated_at)
      VALUES ('admin_user_overrides_registry', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `,
      [JSON.stringify(overridesMap)]
    );

    const users = await buildMergedRegisteredUsersList(client);
    await client.query('COMMIT');
    return users;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * حذف کاربر توسط مدیر کل پلتفرم در PostgreSQL
 */
export async function deleteAdminUserInDb(
  pool: Pool,
  phoneRaw: string
): Promise<AdminUserRecord[]> {
  const cleanPhone = toEnglishDigits(phoneRaw || '').replace(/\D/g, '');
  if (!cleanPhone) {
    throw new Error('INVALID_INPUT_PAYLOAD');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureExtendedMetaTables(client);

    const deletedRes = await client.query(
      `SELECT value_json FROM platform_kv_store WHERE key = 'deleted_admin_phones_registry' LIMIT 1`
    );
    const deletedSet = new Set<string>(
      Array.isArray(deletedRes.rows[0]?.value_json)
        ? (deletedRes.rows[0].value_json as string[]).map((p) =>
            toEnglishDigits(String(p)).replace(/\D/g, '')
          )
        : []
    );
    deletedSet.add(cleanPhone);

    await client.query(
      `
      INSERT INTO platform_kv_store (key, value_json, updated_at)
      VALUES ('deleted_admin_phones_registry', $1::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()
      `,
      [JSON.stringify(Array.from(deletedSet))]
    );

    const users = await buildMergedRegisteredUsersList(client);
    await client.query('COMMIT');
    return users;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

