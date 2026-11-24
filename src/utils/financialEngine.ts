import {
  AppointmentItem,
  AppointmentStatus,
  BusinessItem,
  BusinessType,
  PaymentOrderItem,
  ServiceItem,
  SettlementRequestItem,
} from '../types';
import { getUpcomingJalaliDays, toEnglishDigitsClient } from './formatters';

/** ۴ ضریب استاندارد و پیشنهادی بیعانه آنلاین (حداقل الزامی ۲۰٪ تا ۱۰۰٪) */
export const ALLOWED_DEPOSIT_PERCENTS = [20, 30, 50, 100] as const;
export type AllowedDepositPercent =
  | (typeof ALLOWED_DEPOSIT_PERCENTS)[number]
  | number;

/** تعداد نوبت هدیه شروع فعالیت برای تمام کسب‌وکارها پیش از الزام به خرید اشتراک ماهانه */
export const FREE_TRIAL_BOOKING_QUOTA = 10;

/** کف کارمزد درگاه زیبال (۱٪ با حداقل ۲,۲۰۰ تومان) — پرداخت توسط مشتری */
export const MIN_ZIBAL_GATEWAY_FEE_TOMAN = 2_200;

/** کف مالیات و زیرساخت پیامک رزرو آنلاین (۱٪ با حداقل ۱,۰۰۰ تومان) — پرداخت توسط مشتری */
export const MIN_TAX_AND_INFRA_FEE_TOMAN = 1_000;

/** کف قیمت مجاز ثبت خدمت برای جلوگیری از قیمت‌گذاری صوری */
export const MIN_SERVICE_PRICE_MEN_TOMAN = 80_000;
export const MIN_SERVICE_PRICE_GENERAL_TOMAN = 100_000;

export interface TimetoMonthlyPackageSpec {
  id: 'plan-independent' | 'plan-professional' | 'plan-vip-brand';
  code: 'BASIC' | 'PRO' | 'VIP';
  name: string;
  shortTitle: string;
  badge?: string;
  monthlyPriceToman: number;
  monthlyBookingCap: number;
  monthlyBookingCapLabel: string;
  staffLimitCount: number;
  staffLimitLabel: string;
  canPublishStories: boolean;
  canCreateComboPackages: boolean;
  adDiscountPercent: number;
  freeMarketingSmsMonthly: number;
  isRecommended?: boolean;
  audience: string;
  features: string[];
}

/** ۳ پکیج اشتراک ماهانه تایم‌تو (پس از اتمام ۱۰ نوبت هدیه شروع — با کارمزد ۰٪ روی تمامی نوبت‌ها) */
export const TIMETO_MONTHLY_PACKAGES: TimetoMonthlyPackageSpec[] = [
  {
    id: 'plan-independent',
    code: 'BASIC',
    name: 'پکیج پایه (متخصص مستقل)',
    shortTitle: 'پکیج ۱: پایه (متخصص مستقل)',
    monthlyPriceToman: 690_000,
    monthlyBookingCap: 50,
    monthlyBookingCapLabel: 'تا ۵۰ نوبت آنلاین در ماه',
    staffLimitCount: 1,
    staffLimitLabel: '۱ متخصص فعال (شخصی)',
    canPublishStories: false,
    canCreateComboPackages: true,
    adDiscountPercent: 0,
    freeMarketingSmsMonthly: 0,
    audience:
      'ویژه متخصص‌های مستقل و تک‌نفره (فیشیال، ناخن، مژه، رنگ و لایت، پیرایش و تراپی مو)',
    features: [
      'پذیرش تا ۵۰ نوبت آنلاین در ماه + پیامک تایید و یادآوری خودکار دوطرفه',
      'کارمزد ۰٪ از نوبت‌ها (واریز ۱۰۰٪ بیعانه به کیف پول و تسویه هفتگی شبا)',
      'امکان ساخت «پکیج‌های ترکیبی و تخفیف‌دار خدمات» در پروفایل ✓',
      'تعریف ۱ متخصص فعال + لینک اختصاصی کوتاه بایو اینستاگرام و QR کد',
      'پرونده مشتریان، ثبت دخل روزانه و باشگاه وفاداری خودکار',
    ],
  },
  {
    id: 'plan-professional',
    code: 'PRO',
    name: 'پکیج حرفه‌ای ⭐ (پرفروش)',
    shortTitle: 'پکیج ۲: حرفه‌ای ⭐ (پیشنهادی)',
    badge: '⭐ پرفروش و پیشنهادی',
    monthlyPriceToman: 1_090_000,
    monthlyBookingCap: 130,
    monthlyBookingCapLabel: 'تا ۱۳۰ نوبت آنلاین در ماه',
    staffLimitCount: 3,
    staffLimitLabel: 'تا ۳ متخصص با تقویم مجزا',
    canPublishStories: true,
    canCreateComboPackages: true,
    adDiscountPercent: 15,
    freeMarketingSmsMonthly: 100,
    isRecommended: true,
    audience:
      'انتخاب اول متخصص‌های پرمشتری و تیم‌های زیبایی برای انتشار استوری، تیک آبی و تخفیف تبلیغات',
    features: [
      'پذیرش تا ۱۳۰ نوبت آنلاین در ماه + پیامک تایید و یادآوری خودکار دوطرفه',
      'کارمزد ۰٪ از نوبت‌ها (واریز ۱۰۰٪ بیعانه به کیف پول و تسویه هفتگی شبا)',
      'فعال شدن انتشار «استوری بالای پروفایل» (نمایش نمونه‌کار و تخفیف روز) ✓',
      '۱۵٪ تخفیف دائمی خرید «بنر ویژه صفحه اول» و «صدرنشینی نتایج جست‌وجو»',
      'تعریف تا ۳ متخصص با تقویم مجزا + ساخت پکیج‌های ترکیبی در صدر پروفایل ✓',
      'نشان اعتبار «مجموعه تاییدشده ✓» + ۱۰۰ پیامک تبلیغاتی هدیه ماهانه',
    ],
  },
  {
    id: 'plan-vip-brand',
    code: 'VIP',
    name: 'پکیج سالن و کلینیک VIP 👑',
    shortTitle: 'پکیج ۳: سالن و کلینیک VIP 👑',
    badge: '👑 ویژه سالن‌ها و مراکز بزرگ',
    monthlyPriceToman: 1_690_000,
    monthlyBookingCap: 400,
    monthlyBookingCapLabel: 'نامحدود (تا ۴۰۰ نوبت در ماه)',
    staffLimitCount: 10,
    staffLimitLabel: 'تا ۱۰ متخصص هم‌زمان',
    canPublishStories: true,
    canCreateComboPackages: true,
    adDiscountPercent: 30,
    freeMarketingSmsMonthly: 300,
    audience:
      'ویژه سالن‌های زیبایی، کلینیک‌ها و مجموعه‌های چندنفره با نوبت‌دهی بالا و حداکثر تخفیف بنر',
    features: [
      'نوبت‌دهی آنلاین نامحدود (تا ۴۰۰ نوبت در ماه) + پیامک خودکار دوطرفه',
      'کارمزد ۰٪ از نوبت‌ها (واریز ۱۰۰٪ بیعانه به کیف پول و تسویه هفتگی شبا)',
      '۳۰٪ تخفیف دائمی خرید «بنر ویژه صفحه اول» و «صدرنشینی نتایج جست‌وجو»',
      'انتشار استوری نامحدود با کادر طلایی VIP + نشان طلایی «منتخب شهر ★»',
      'تعریف تا ۱۰ متخصص با تقویم و خدمات مجزا + ساخت پکیج‌های ترکیبی VIP ✓',
      'اولویت نمایش بالاتر در لیست شهر + ۳۰۰ پیامک تبلیغاتی هدیه ماهانه',
    ],
  },
];

export interface BusinessSubscriptionQuotaStatus {
  isFreeTrial: boolean;
  activePackage: TimetoMonthlyPackageSpec | null;
  planId: string;
  planTitle: string;
  monthlyPriceToman: number;
  quotaLimit: number;
  usedBookingsCount: number;
  remainingBookingsCount: number;
  usagePercent: number;
  isQuotaExhausted: boolean;
  requiresSubscriptionPurchase: boolean;
  canPublishStories: boolean;
  canCreateComboPackages: boolean;
  staffLimitCount: number;
  adDiscountPercent: number;
  freeMarketingSmsMonthly: number;
}

/**
 * تشخیص وضعیت فعلی اشتراک کسب‌وکار:
 * - آیا در دوره «۱۰ نوبت هدیه شروع (کارمزد ۰٪)» است یا یکی از ۳ پکیج ماهانه را فعال کرده؟
 * - چند نوبت از سقف مجاز (۱۰ نوبت هدیه یا ۵۰/۱۳۰/۴۰۰ نوبت ماهانه) استفاده شده و چند نوبت باقی مانده است؟
 */
export function resolveBusinessSubscriptionQuotaStatus(params: {
  business?: Pick<
    BusinessItem,
    'id' | 'slug' | 'name' | 'subscriptionPlan' | 'isVipPartner'
  > | null;
  appointments?: Pick<
    AppointmentItem,
    'businessId' | 'businessSlug' | 'businessName' | 'status'
  >[];
  activePlanId?: string;
}): BusinessSubscriptionQuotaStatus {
  const { business, appointments = [], activePlanId } = params;
  const rawPlanText = `${business?.subscriptionPlan || ''} ${activePlanId || ''}`.trim();
  const normalized = rawPlanText.toLowerCase();

  let matchedPackage: TimetoMonthlyPackageSpec | null = null;

  if (
    normalized.includes('plan-vip-brand') ||
    normalized.includes('vip') ||
    rawPlanText.includes('کلینیک') ||
    rawPlanText.includes('پیشرفته') ||
    rawPlanText.includes('سفیر')
  ) {
    matchedPackage = TIMETO_MONTHLY_PACKAGES[2];
  } else if (
    normalized.includes('plan-professional') ||
    rawPlanText.includes('حرفه‌ای') ||
    rawPlanText.includes('حرفه ای') ||
    rawPlanText.includes('پرفروش')
  ) {
    matchedPackage = TIMETO_MONTHLY_PACKAGES[1];
  } else if (
    normalized.includes('plan-independent') ||
    rawPlanText.includes('متخصص مستقل') ||
    rawPlanText.includes('پکیج پایه')
  ) {
    matchedPackage = TIMETO_MONTHLY_PACKAGES[0];
  }

  const bizAppointments = business
    ? appointments.filter(
        (a) =>
          (a.businessId === business.id ||
            (business.slug && a.businessSlug === business.slug) ||
            (business.name && a.businessName === business.name)) &&
          a.status !== AppointmentStatus.Cancelled
      )
    : [];

  const usedBookingsCount = bizAppointments.length;

  if (!matchedPackage) {
    const quotaLimit = FREE_TRIAL_BOOKING_QUOTA;
    const remainingBookingsCount = Math.max(0, quotaLimit - usedBookingsCount);
    const isQuotaExhausted = usedBookingsCount >= quotaLimit;
    const usagePercent = Math.min(
      100,
      Math.round((usedBookingsCount / quotaLimit) * 100)
    );

    return {
      isFreeTrial: true,
      activePackage: null,
      planId: 'plan-free-trial-10',
      planTitle: 'هدیه شروع فعالیت (۱۰ نوبت رایگان با کارمزد ۰٪)',
      monthlyPriceToman: 0,
      quotaLimit,
      usedBookingsCount,
      remainingBookingsCount,
      usagePercent,
      isQuotaExhausted,
      requiresSubscriptionPurchase: isQuotaExhausted,
      canPublishStories: false,
      canCreateComboPackages: true,
      staffLimitCount: 1,
      adDiscountPercent: 0,
      freeMarketingSmsMonthly: 0,
    };
  }

  const quotaLimit = matchedPackage.monthlyBookingCap;
  const remainingBookingsCount = Math.max(0, quotaLimit - usedBookingsCount);
  const isQuotaExhausted = usedBookingsCount >= quotaLimit;
  const usagePercent = Math.min(
    100,
    Math.round((usedBookingsCount / quotaLimit) * 100)
  );

  return {
    isFreeTrial: false,
    activePackage: matchedPackage,
    planId: matchedPackage.id,
    planTitle: matchedPackage.name,
    monthlyPriceToman: matchedPackage.monthlyPriceToman,
    quotaLimit,
    usedBookingsCount,
    remainingBookingsCount,
    usagePercent,
    isQuotaExhausted,
    requiresSubscriptionPurchase: isQuotaExhausted,
    canPublishStories: matchedPackage.canPublishStories,
    canCreateComboPackages: true,
    staffLimitCount: matchedPackage.staffLimitCount,
    adDiscountPercent: matchedPackage.adDiscountPercent,
    freeMarketingSmsMonthly: matchedPackage.freeMarketingSmsMonthly,
  };
}

/** نرمال‌سازی درصد بیعانه واقعی سالن (حفظ دقیق هر ضریب انتخابی بین حداقل ۲۰٪ تا ۱۰۰٪؛ پیش‌فرض ۳۰٪ فقط در صورت نبود مقدار معتبر) */
export function normalizeDepositPercent(raw?: number | null): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return 30;
  return Math.min(100, Math.max(20, Math.round(num)));
}

export interface CategoryCommissionConfig {
  maleCommissionPercent?: number;
  laserCommissionPercent?: number;
  femaleCommissionPercent?: number;
}

export interface ResolvedCommissionMeta {
  segment: 'MEN' | 'LASER' | 'WOMEN';
  commissionPercent: number;
  segmentTitle: string;
  categoryLabel: string;
  minServicePriceToman: number;
}

/**
 * تشخیص حوزه کسب‌وکار و کف قیمت مجاز خدمت.
 * در مدل جدید اشتراکی تایم‌تو (۱۰ نوبت هدیه شروع + اشتراک ماهانه)، کارمزد کسرشده از کسب‌وکار به صورت پیش‌فرض ۰٪ است.
 */
export function resolveBusinessCommissionMeta(
  business?: Pick<
    BusinessItem,
    | 'type'
    | 'typeLabel'
    | 'categorySlug'
    | 'targetGender'
    | 'name'
    | 'isVipPartner'
    | 'vipCommissionPercent'
  > | null,
  _config?: CategoryCommissionConfig
): ResolvedCommissionMeta {
  const combinedText = `${business?.typeLabel || ''} ${business?.categorySlug || ''} ${business?.name || ''}`.toLowerCase();

  // ۱. مراکز لیزر موهای زائد
  if (
    business?.categorySlug === 'laser-hair-removal' ||
    combinedText.includes('لیزر') ||
    combinedText.includes('laser')
  ) {
    const title = 'مرکز لیزر موهای زائد (کارمزد ۰٪ · مدل اشتراکی)';
    return {
      segment: 'LASER',
      commissionPercent: 0,
      segmentTitle: title,
      categoryLabel: title,
      minServicePriceToman: MIN_SERVICE_PRICE_GENERAL_TOMAN,
    };
  }

  // ۲. پیرایش و آرایشگاه آقایان
  if (
    business?.type === BusinessType.MenBarbershop ||
    business?.targetGender === 'MALE' ||
    business?.categorySlug === 'mens-barbershop' ||
    combinedText.includes('مردانه') ||
    combinedText.includes('آقایان') ||
    combinedText.includes('پیرایش')
  ) {
    const title = 'پیرایش و خدمات آقایان (کارمزد ۰٪ · مدل اشتراکی)';
    return {
      segment: 'MEN',
      commissionPercent: 0,
      segmentTitle: title,
      categoryLabel: title,
      minServicePriceToman: MIN_SERVICE_PRICE_MEN_TOMAN,
    };
  }

  // ۳. سالن‌های زیبایی و متخصصان بانوان
  const title = 'سالن زیبایی و خدمات بانوان (کارمزد ۰٪ · مدل اشتراکی)';
  return {
    segment: 'WOMEN',
    commissionPercent: 0,
    segmentTitle: title,
    categoryLabel: title,
    minServicePriceToman: MIN_SERVICE_PRICE_GENERAL_TOMAN,
  };
}

export interface BookingFinancialBreakdown {
  /** قیمت کل خدمات انتخابی مشتری */
  totalServicePriceToman: number;
  /** درصد بیعانه واقعی انتخابی سالن (۲۰ تا ۱۰۰٪) */
  depositPercent: number;
  /** مبلغ پایه بیعانه از کل خدمت (مثلاً ۳۰۰,۰۰۰ تومان از ۱,۰۰۰,۰۰۰ تومان) */
  baseDepositToman: number;
  depositBaseToman: number;
  /** مبلغ الباقی که مشتری حضوری در سالن می‌پردازد (مثلاً ۷۰۰,۰۰۰ تومان) */
  remainingInSalonToman: number;
  /** کارمزد ۱٪ درگاه زیبال (با کف ۲,۲۰۰ تومان) */
  zibalGatewayFeeToman: number;
  /** مالیات و زیرساخت پیامک رزرو آنلاین (۱٪ با کف ۱,۰۰۰ تومان) */
  valueAddedTaxFeeToman: number;
  /** مجموع ۲٪ کارمزد درگاه زیبال و مالیات که در فاکتور آنلاین مشتری لحاظ می‌شود */
  customerGatewayAndTaxFeeToman: number;
  /** مبلغ نهایی قابل پرداخت آنلاین توسط مشتری در درگاه زیبال (بیعانه پایه + ۲٪ درگاه و مالیات) */
  totalCustomerOnlinePayableToman: number;
  /** درصد کارمزد کسرشده از سالن (در مدل اشتراکی: ۰٪) */
  platformCommissionPercent: number;
  /** عنوان حوزه */
  platformCommissionSegmentTitle: string;
  /** مبلغ کارمزد کسرشده از سالن (در مدل اشتراکی: ۰ تومان) */
  platformCommissionToman: number;
  /** مبلغ خالص بیعانه که ۱۰۰٪ وارد کیف پول سالن‌دار می‌شود */
  salonNetDepositCreditedToman: number;
}

/**
 * محاسبه دقیق بیعانه، ۲٪ درگاه زیبال و مالیات مشتری، و واریز ۱۰۰٪ بیعانه (با کارمزد ۰٪) به کیف پول کسب‌وکار
 */
export function calculateBookingFinancialBreakdown(params: {
  totalServicePriceToman?: number;
  servicePriceToman?: number;
  depositPercent?: number | null;
  business?: Pick<
    BusinessItem,
    | 'type'
    | 'typeLabel'
    | 'categorySlug'
    | 'targetGender'
    | 'name'
    | 'isVipPartner'
    | 'vipCommissionPercent'
  > | null;
  commissionConfig?: CategoryCommissionConfig;
  config?: CategoryCommissionConfig;
}): BookingFinancialBreakdown {
  const safeTotalServicePrice = Math.max(
    0,
    Math.round(
      Number(params.totalServicePriceToman ?? params.servicePriceToman) || 0
    )
  );
  const depositPercent = normalizeDepositPercent(params.depositPercent);
  const baseDepositToman = Math.max(
    0,
    Math.round((safeTotalServicePrice * depositPercent) / 100)
  );
  const remainingInSalonToman = Math.max(
    0,
    safeTotalServicePrice - baseDepositToman
  );

  // ۱٪ کارمزد درگاه زیبال (حداقل ۲,۲۰۰ تومان) + ۱٪ مالیات و زیرساخت (حداقل ۱,۰۰۰ تومان) بر عهده مشتری
  const zibalGatewayFeeToman =
    baseDepositToman > 0
      ? Math.max(
          MIN_ZIBAL_GATEWAY_FEE_TOMAN,
          Math.round(baseDepositToman * 0.01)
        )
      : 0;
  const valueAddedTaxFeeToman =
    baseDepositToman > 0
      ? Math.max(
          MIN_TAX_AND_INFRA_FEE_TOMAN,
          Math.round(baseDepositToman * 0.01)
        )
      : 0;
  const customerGatewayAndTaxFeeToman =
    zibalGatewayFeeToman + valueAddedTaxFeeToman;

  const totalCustomerOnlinePayableToman =
    baseDepositToman + customerGatewayAndTaxFeeToman;

  const commMeta = resolveBusinessCommissionMeta(
    params.business,
    params.commissionConfig ?? params.config
  );

  // در مدل جدید (۱۰ نوبت هدیه شروع + اشتراک ماهانه)، کارمزد کسرشده از بیعانه سالن ۰ تومان است و ۱۰۰٪ بیعانه به کیف پول سالن واریز می‌شود
  const platformCommissionToman = 0;
  const salonNetDepositCreditedToman = baseDepositToman;

  return {
    totalServicePriceToman: safeTotalServicePrice,
    depositPercent,
    baseDepositToman,
    depositBaseToman: baseDepositToman,
    remainingInSalonToman,
    zibalGatewayFeeToman,
    valueAddedTaxFeeToman,
    customerGatewayAndTaxFeeToman,
    totalCustomerOnlinePayableToman,
    platformCommissionPercent: 0,
    platformCommissionSegmentTitle: commMeta.segmentTitle,
    platformCommissionToman,
    salonNetDepositCreditedToman,
  };
}

/**
 * قفل ضدتقلب ۱: اعتبارسنجی قیمت خدمت و جلوگیری از درج شماره تماس/آیدی/قیمت توافقی
 */
export function validateServiceAntiFraud(params: {
  title: string;
  description?: string;
  priceToman: number;
  business?: Pick<
    BusinessItem,
    'type' | 'typeLabel' | 'categorySlug' | 'targetGender' | 'name'
  > | null;
}): { valid: boolean; error?: string } {
  const meta = resolveBusinessCommissionMeta(params.business);
  const cleanTitle = (params.title || '').trim();
  const cleanDesc = (params.description || '').trim();
  const combined = toEnglishDigitsClient(`${cleanTitle} ${cleanDesc}`);

  if (params.priceToman < meta.minServicePriceToman) {
    return {
      valid: false,
      error: `کف مجاز قیمت خدمت مبلغ ${meta.minServicePriceToman.toLocaleString('fa-IR')} تومان است (ثبت قیمت‌های صوری یا غیرواقعی مجاز نیست).`,
    };
  }

  if (/(\+?98|0)?9\d{9}/.test(combined.replace(/[\s\-_]/g, ''))) {
    return {
      valid: false,
      error:
        'درج شماره موبایل داخل عنوان یا توضیحات خدمت مجاز نیست. هماهنگی نوبت‌ها صرفاً از طریق سامانه انجام می‌شود.',
    };
  }

  if (/@[a-zA-Z0-9_.]{3,}/.test(combined)) {
    return {
      valid: false,
      error:
        'درج آیدی شبکه اجتماعی (@) داخل عنوان یا توضیحات خدمت مجاز نیست.',
    };
  }

  const circumventionKeywords = [
    'قیمت توافقی',
    'توافقی',
    'بدون بیعانه',
    'کارت به کارت',
    'تماس بگیرید',
    'پیام بدید',
    'دایرکت بدید',
  ];
  for (const kw of circumventionKeywords) {
    if (combined.includes(kw)) {
      return {
        valid: false,
        error: `استفاده از عبارت «${kw}» در عنوان یا توضیحات خدمت مجاز نیست؛ قیمت خدمت باید شفاف و دقیق درج شود.`,
      };
    }
  }

  return { valid: true };
}

/**
 * قفل ضدتقلب ۲: بررسی اینکه آیا زمان انجام نوبت فرا رسیده یا خدمت انجام شده است
 * تا سالن‌دار نتواند بیعانه نوبت‌های آینده را قبل از انجام کار برداشت کند
 */
export function isAppointmentEligibleForSettlement(
  apt: AppointmentItem
): boolean {
  if (apt.status === AppointmentStatus.Cancelled) return false;
  if (apt.status === AppointmentStatus.Completed || apt.inPersonSettled) {
    return true;
  }

  const todayEntry = getUpcomingJalaliDays(1)[0];
  const todayJalali = toEnglishDigitsClient(
    todayEntry?.dateJalali || todayEntry?.date || ''
  ).trim();
  const aptDate = toEnglishDigitsClient(String(apt.dateJalali || '')).trim();

  if (
    /^\d{4}\/\d{2}\/\d{2}$/.test(aptDate) &&
    /^\d{4}\/\d{2}\/\d{2}$/.test(todayJalali)
  ) {
    if (aptDate < todayJalali) return true;
    if (aptDate > todayJalali) return false;
    const aptTime = toEnglishDigitsClient(
      String(apt.timeSlot || '00:00')
    ).trim();
    const [hh, mm] = aptTime.split(':').map((v) => Number(v) || 0);
    const nowTehran = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' })
    );
    const nowMinutes = nowTehran.getHours() * 60 + nowTehran.getMinutes();
    const aptMinutes = hh * 60 + mm;
    return nowMinutes >= aptMinutes;
  }

  if (aptDate.includes('دیروز') || aptDate.includes('گذشته')) return true;
  if (aptDate.includes('فردا')) return false;

  return false;
}

/**
 * استخراج دقیق و بدون خطای بیعانه پرداخت‌شده، خالص سهم سالن (۱۰۰٪ بیعانه با کارمزد ۰٪) و الباقی حضوری برای هر نوبت
 */
export function resolveAppointmentFinancialBreakdown(params: {
  appointment: Pick<
    AppointmentItem,
    | 'priceToman'
    | 'depositPaidToman'
    | 'platformCommissionToman'
    | 'customerGatewayAndTaxFeeToman'
    | 'salonNetDepositCreditedToman'
  >;
  business?: Pick<
    BusinessItem,
    | 'type'
    | 'typeLabel'
    | 'categorySlug'
    | 'targetGender'
    | 'name'
    | 'depositEnabled'
    | 'depositPercent'
    | 'isVipPartner'
    | 'vipCommissionPercent'
  > | null;
  service?: Pick<ServiceItem, 'priceToman'> | null;
  commissionConfig?: CategoryCommissionConfig;
}): BookingFinancialBreakdown {
  const rawPrice = Number(params.appointment.priceToman) || 0;
  const fallbackServicePrice = Number(params.service?.priceToman) || 0;
  const effectiveServicePrice =
    rawPrice > 0 ? rawPrice : fallbackServicePrice > 0 ? fallbackServicePrice : 0;

  const isDepositDisabled = params.business?.depositEnabled === false;
  const savedDeposit = Math.max(0, Number(params.appointment.depositPaidToman) || 0);

  if (isDepositDisabled && savedDeposit <= 0) {
    const standardZero = calculateBookingFinancialBreakdown({
      totalServicePriceToman: effectiveServicePrice,
      depositPercent: 0,
      business: params.business,
      commissionConfig: params.commissionConfig,
    });
    return {
      ...standardZero,
      totalServicePriceToman: effectiveServicePrice,
      depositPercent: 0,
      baseDepositToman: 0,
      depositBaseToman: 0,
      zibalGatewayFeeToman: 0,
      valueAddedTaxFeeToman: 0,
      customerGatewayAndTaxFeeToman: 0,
      totalCustomerOnlinePayableToman: 0,
      remainingInSalonToman: effectiveServicePrice,
      platformCommissionPercent: 0,
      platformCommissionToman: 0,
      salonNetDepositCreditedToman: 0,
    };
  }

  const standard = calculateBookingFinancialBreakdown({
    totalServicePriceToman: effectiveServicePrice,
    depositPercent: params.business?.depositPercent,
    business: params.business,
    commissionConfig: params.commissionConfig,
  });

  if (savedDeposit <= 0) {
    if (effectiveServicePrice <= 0) {
      return {
        ...standard,
        totalServicePriceToman: 0,
        baseDepositToman: 0,
        depositBaseToman: 0,
        zibalGatewayFeeToman: 0,
        valueAddedTaxFeeToman: 0,
        customerGatewayAndTaxFeeToman: 0,
        totalCustomerOnlinePayableToman: 0,
        remainingInSalonToman: 0,
        platformCommissionPercent: 0,
        platformCommissionToman: 0,
        salonNetDepositCreditedToman: 0,
      };
    }
    return standard;
  }

  const baseDepositToman =
    savedDeposit === standard.totalCustomerOnlinePayableToman
      ? standard.baseDepositToman
      : effectiveServicePrice > 0
        ? Math.min(effectiveServicePrice, savedDeposit)
        : savedDeposit;

  const remainingInSalonToman = Math.max(
    0,
    effectiveServicePrice - baseDepositToman
  );

  return {
    ...standard,
    totalServicePriceToman: effectiveServicePrice,
    baseDepositToman,
    depositBaseToman: baseDepositToman,
    remainingInSalonToman,
    platformCommissionPercent: 0,
    platformCommissionToman: 0,
    salonNetDepositCreditedToman: baseDepositToman,
  };
}

function normalizePersianMatchText(value?: string | null): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .toLowerCase();
}

export function isSampleOrHiddenBusiness(
  business: Pick<BusinessItem, 'id' | 'slug' | 'name' | 'ownerName' | 'approvalStatus'>
): boolean {
  if (!business || !business.id) return true;
  if (/^biz-[1-8]$/.test(business.id)) return true;
  if (business.slug === 'royal-golzar') return true;
  if (business.approvalStatus === 'REJECTED') return true;
  if (
    String(business.name || '').includes('مهتاب') ||
    String(business.ownerName || '').includes('مهتاب')
  ) {
    return true;
  }
  return false;
}

export function isSampleOrHiddenAppointment(
  apt: Pick<AppointmentItem, 'id' | 'businessId' | 'businessSlug' | 'businessName'>
): boolean {
  if (!apt || !apt.id) return true;
  if (/^biz-[1-8]$/.test(apt.businessId || '')) return true;
  if (/^apt-(?:[1-9]|1[0-2]|100[1-9])$/.test(apt.id)) return true;
  if (apt.businessSlug === 'royal-golzar') return true;
  if (String(apt.businessName || '').includes('مهتاب')) return true;
  return false;
}

export function filterRealAdminBusinesses(businesses: BusinessItem[]): BusinessItem[] {
  const byKey = new Map<string, BusinessItem>();
  for (const b of businesses || []) {
    if (isSampleOrHiddenBusiness(b)) continue;
    const key = b.id || b.slug;
    if (key && !byKey.has(key)) {
      byKey.set(key, b);
    }
  }
  return Array.from(byKey.values());
}

export function dedupeAppointmentsCanonical(
  appointments: AppointmentItem[]
): AppointmentItem[] {
  const byId = new Map<string, AppointmentItem>();
  const refToId = new Map<string, string>();
  const statusPriority: Record<string, number> = {
    [AppointmentStatus.Completed]: 4,
    [AppointmentStatus.Confirmed]: 3,
    [AppointmentStatus.Pending]: 2,
    [AppointmentStatus.NoShow]: 1,
    [AppointmentStatus.Cancelled]: 0,
  };

  for (const apt of appointments || []) {
    if (isSampleOrHiddenAppointment(apt)) continue;
    const refKey = apt.referenceCode?.trim();
    const existingId = byId.has(apt.id)
      ? apt.id
      : refKey && refToId.has(refKey)
        ? refToId.get(refKey)!
        : undefined;

    if (!existingId) {
      byId.set(apt.id, apt);
      if (refKey) refToId.set(refKey, apt.id);
      continue;
    }

    const prev = byId.get(existingId)!;
    const prevScore =
      (statusPriority[prev.status] ?? 0) * 10 +
      (prev.priceToman > 0 ? 2 : 0) +
      ((prev.depositPaidToman ?? 0) > 0 ? 1 : 0);
    const nextScore =
      (statusPriority[apt.status] ?? 0) * 10 +
      (apt.priceToman > 0 ? 2 : 0) +
      ((apt.depositPaidToman ?? 0) > 0 ? 1 : 0);

    if (nextScore >= prevScore) {
      byId.set(existingId, { ...prev, ...apt, id: existingId });
    }
  }

  return Array.from(byId.values());
}

export function doesAppointmentBelongToBusiness(
  apt: Pick<AppointmentItem, 'businessId' | 'businessSlug' | 'businessName'>,
  biz: Pick<BusinessItem, 'id' | 'slug' | 'name'>
): boolean {
  if (apt.businessId && biz.id && apt.businessId === biz.id) return true;
  if (apt.businessSlug && biz.slug && apt.businessSlug === biz.slug) return true;
  const aptName = normalizePersianMatchText(apt.businessName);
  const bizName = normalizePersianMatchText(biz.name);
  if (aptName && bizName && aptName === bizName) return true;
  return false;
}

export function doesOrderBelongToBusiness(
  order: Pick<PaymentOrderItem, 'businessId' | 'businessName'>,
  biz: Pick<BusinessItem, 'id' | 'name'>
): boolean {
  if (order.businessId && biz.id && order.businessId === biz.id) return true;
  const orderName = normalizePersianMatchText(order.businessName);
  const bizName = normalizePersianMatchText(biz.name);
  return Boolean(orderName && bizName && orderName === bizName);
}

export function doesSettlementBelongToBusiness(
  settlement: Pick<SettlementRequestItem, 'businessId' | 'businessName'>,
  biz: Pick<BusinessItem, 'id' | 'name'>
): boolean {
  if (settlement.businessId && biz.id && settlement.businessId === biz.id) {
    return true;
  }
  const sName = normalizePersianMatchText(settlement.businessName);
  const bizName = normalizePersianMatchText(biz.name);
  return Boolean(sName && bizName && sName === bizName);
}

export interface BusinessFinancialDossierSummary {
  business: BusinessItem;
  bookings: AppointmentItem[];
  cancelledBookingsCount: number;
  bookingsCount: number;
  pendingBookingsCount: number;
  confirmedBookingsCount: number;
  completedBookingsCount: number;
  depositEnabled: boolean;
  depositPercent: number;
  commissionPercent: number;
  totalServiceToman: number;
  totalDepositCollectedToman: number;
  totalRemainingInSalonToman: number;
  totalPlatformCommissionToman: number;
  totalSalonGrossNetToman: number;
  totalAlreadySettledToman: number;
  pendingSettlementRequestsToman: number;
  netPayableToman: number;
  approvedSubscriptionToman: number;
  pendingSubscriptionToman: number;
  freeTrialQuota: number;
  freeTrialUsed: number;
  freeTrialRemaining: number;
  hasActivePaidSubscription: boolean;
  latestPaidSettlement?: SettlementRequestItem;
}

export interface PlatformAdminFinancialSummary {
  businessDossiers: BusinessFinancialDossierSummary[];
  realBusinesses: BusinessItem[];
  activeAppointments: AppointmentItem[];
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalServiceVolumeToman: number;
  totalRemainingInSalonToman: number;
  totalOnlineDepositsToman: number;
  totalPaidSettlementsToman: number;
  totalPendingPayableToman: number;
  approvedOrdersToman: number;
  pendingOrdersToman: number;
  pendingOrdersCount: number;
  /** درآمد خالص پلتفرم تایم‌تو (فقط فروش اشتراک و تبلیغات — کارمزد نوبت ۰٪) */
  platformNetRevenueToman: number;
  /** گردش مالی کل آنلاین (جمع بیعانه‌های امانی سالن‌ها + سفارش‌های تاییدشده اشتراک/تبلیغات، بدون دوباره‌شماری تسویه‌ها) */
  grossOnlineTurnoverToman: number;
}

/**
 * منبع واحد و قطعی محاسبه وضعیت رزروها و مالی یک کسب‌وکار در پنل مدیریت کلان و تسویه شبا
 */
export function computeBusinessFinancialDossier(params: {
  business: BusinessItem;
  appointments: AppointmentItem[];
  services?: ServiceItem[];
  settlementRequests: SettlementRequestItem[];
  paymentOrders?: PaymentOrderItem[];
  commissionConfig?: CategoryCommissionConfig;
}): BusinessFinancialDossierSummary {
  const {
    business,
    appointments,
    services = [],
    settlementRequests,
    paymentOrders = [],
    commissionConfig,
  } = params;

  const dedupedApts = dedupeAppointmentsCanonical(appointments);
  const serviceById = new Map<string, ServiceItem>();
  for (const srv of services) {
    if (srv?.id) serviceById.set(srv.id, srv);
  }

  const allBizApts = dedupedApts.filter((a) =>
    doesAppointmentBelongToBusiness(a, business)
  );
  const cancelledBookingsCount = allBizApts.filter(
    (a) => a.status === AppointmentStatus.Cancelled
  ).length;
  const activeBizApts = allBizApts.filter(
    (a) => a.status !== AppointmentStatus.Cancelled
  );

  let totalServiceToman = 0;
  let totalDepositCollectedToman = 0;
  let totalRemainingInSalonToman = 0;
  let pendingBookingsCount = 0;
  let confirmedBookingsCount = 0;
  let completedBookingsCount = 0;

  for (const apt of activeBizApts) {
    if (apt.status === AppointmentStatus.Pending) pendingBookingsCount += 1;
    else if (apt.status === AppointmentStatus.Confirmed) confirmedBookingsCount += 1;
    else if (apt.status === AppointmentStatus.Completed) completedBookingsCount += 1;

    const matchedService = apt.serviceId ? serviceById.get(apt.serviceId) : undefined;
    const breakdown = resolveAppointmentFinancialBreakdown({
      appointment: apt,
      business,
      service: matchedService,
      commissionConfig,
    });
    totalServiceToman += breakdown.totalServicePriceToman;
    totalDepositCollectedToman += breakdown.baseDepositToman;
    totalRemainingInSalonToman += breakdown.remainingInSalonToman;
  }

  const bizSettlements = (settlementRequests || []).filter((s) =>
    doesSettlementBelongToBusiness(s, business)
  );
  const paidSettlements = bizSettlements.filter((s) => s.status === 'PAID');
  const totalAlreadySettledToman = paidSettlements.reduce(
    (sum, s) => sum + Math.max(0, Number(s.netPayoutToman || s.amountToman) || 0),
    0
  );
  const pendingSettlementRequestsToman = bizSettlements
    .filter((s) => s.status === 'PENDING')
    .reduce(
      (sum, s) => sum + Math.max(0, Number(s.netPayoutToman || s.amountToman) || 0),
      0
    );

  const totalSalonGrossNetToman = totalDepositCollectedToman;
  const netPayableToman = Math.max(
    0,
    totalSalonGrossNetToman - totalAlreadySettledToman
  );

  const bizOrders = (paymentOrders || []).filter((o) =>
    doesOrderBelongToBusiness(o, business)
  );
  const approvedSubscriptionToman = bizOrders
    .filter((o) => o.status === 'APPROVED')
    .reduce((sum, o) => sum + Math.max(0, Number(o.amountToman) || 0), 0);
  const pendingSubscriptionToman = bizOrders
    .filter((o) => o.status === 'PENDING')
    .reduce((sum, o) => sum + Math.max(0, Number(o.amountToman) || 0), 0);

  const depositEnabled = business.depositEnabled !== false;
  const depositPercent = depositEnabled
    ? normalizeDepositPercent(business.depositPercent)
    : 0;
  const bookingsCount = activeBizApts.length;
  const freeTrialUsed = Math.min(FREE_TRIAL_BOOKING_QUOTA, bookingsCount);
  const freeTrialRemaining = Math.max(0, FREE_TRIAL_BOOKING_QUOTA - bookingsCount);
  const hasActivePaidSubscription =
    business.subscriptionStatus === 'ACTIVE' &&
    Boolean(business.subscriptionPlan) &&
    !String(business.subscriptionPlan).includes('رایگان');

  return {
    business,
    bookings: activeBizApts,
    cancelledBookingsCount,
    bookingsCount,
    pendingBookingsCount,
    confirmedBookingsCount,
    completedBookingsCount,
    depositEnabled,
    depositPercent,
    commissionPercent: 0,
    totalServiceToman,
    totalDepositCollectedToman,
    totalRemainingInSalonToman,
    totalPlatformCommissionToman: 0,
    totalSalonGrossNetToman,
    totalAlreadySettledToman,
    pendingSettlementRequestsToman,
    netPayableToman,
    approvedSubscriptionToman,
    pendingSubscriptionToman,
    freeTrialQuota: FREE_TRIAL_BOOKING_QUOTA,
    freeTrialUsed,
    freeTrialRemaining,
    hasActivePaidSubscription,
    latestPaidSettlement: paidSettlements[0],
  };
}

/**
 * منبع واحد و تضمینی محاسبه آمار کلان پلتفرم در تمام صفحات پنل مدیریت (/admin, /admin/payments, /admin/reports)
 * جمع ردیف‌های کسب‌وکارها همواره دقیقاً برابر با ارقام کلان بالای داشبورد است (بدون دوباره‌شماری تسویه شبا).
 */
export function computePlatformAdminSummary(params: {
  businesses: BusinessItem[];
  appointments: AppointmentItem[];
  services?: ServiceItem[];
  settlementRequests: SettlementRequestItem[];
  paymentOrders: PaymentOrderItem[];
  commissionConfig?: CategoryCommissionConfig;
}): PlatformAdminFinancialSummary {
  const realBusinesses = filterRealAdminBusinesses(params.businesses);
  const dedupedApts = dedupeAppointmentsCanonical(params.appointments);

  // هر نوبت فقط یک‌بار به اولین کسب‌وکار متناظرش منتسب می‌شود تا هیچ‌گونه هم‌پوشانی یا دوباره‌شماری رخ ندهد
  const assignedAptIds = new Set<string>();
  const businessDossiers: BusinessFinancialDossierSummary[] = realBusinesses.map(
    (biz) => {
      const bizMatchedApts = dedupedApts.filter((apt) => {
        if (assignedAptIds.has(apt.id)) return false;
        if (doesAppointmentBelongToBusiness(apt, biz)) {
          assignedAptIds.add(apt.id);
          return true;
        }
        return false;
      });
      return computeBusinessFinancialDossier({
        business: biz,
        appointments: bizMatchedApts,
        services: params.services,
        settlementRequests: params.settlementRequests,
        paymentOrders: params.paymentOrders,
        commissionConfig: params.commissionConfig,
      });
    }
  );

  // مرتب‌سازی: ابتدا سالن‌های دارای مانده تسویه‌نشده یا نوبت بیشتر
  businessDossiers.sort(
    (a, b) =>
      b.netPayableToman - a.netPayableToman ||
      b.bookingsCount - a.bookingsCount ||
      b.totalServiceToman - a.totalServiceToman
  );

  const activeAppointments = businessDossiers.flatMap((d) => d.bookings);
  const totalBookings = businessDossiers.reduce((s, d) => s + d.bookingsCount, 0);
  const pendingBookings = businessDossiers.reduce(
    (s, d) => s + d.pendingBookingsCount,
    0
  );
  const confirmedBookings = businessDossiers.reduce(
    (s, d) => s + d.confirmedBookingsCount,
    0
  );
  const completedBookings = businessDossiers.reduce(
    (s, d) => s + d.completedBookingsCount,
    0
  );
  const cancelledBookings = businessDossiers.reduce(
    (s, d) => s + d.cancelledBookingsCount,
    0
  );
  const totalServiceVolumeToman = businessDossiers.reduce(
    (s, d) => s + d.totalServiceToman,
    0
  );
  const totalRemainingInSalonToman = businessDossiers.reduce(
    (s, d) => s + d.totalRemainingInSalonToman,
    0
  );
  const totalOnlineDepositsToman = businessDossiers.reduce(
    (s, d) => s + d.totalDepositCollectedToman,
    0
  );
  const totalPaidSettlementsToman = businessDossiers.reduce(
    (s, d) => s + d.totalAlreadySettledToman,
    0
  );
  const totalPendingPayableToman = businessDossiers.reduce(
    (s, d) => s + d.netPayableToman,
    0
  );

  const validOrders = (params.paymentOrders || []).filter(
    (o) =>
      o &&
      o.id &&
      !/^biz-[1-8]$/.test(o.businessId || '') &&
      !String(o.businessName || '').includes('مهتاب')
  );
  const approvedOrdersToman = validOrders
    .filter((o) => o.status === 'APPROVED')
    .reduce((sum, o) => sum + Math.max(0, Number(o.amountToman) || 0), 0);
  const pendingOrders = validOrders.filter((o) => o.status === 'PENDING');
  const pendingOrdersToman = pendingOrders.reduce(
    (sum, o) => sum + Math.max(0, Number(o.amountToman) || 0),
    0
  );

  const activeBusinesses = realBusinesses.filter(
    (b) => b.approvalStatus === 'APPROVED'
  ).length;
  const pendingBusinesses = realBusinesses.filter(
    (b) => b.approvalStatus === 'PENDING_REVIEW'
  ).length;

  return {
    businessDossiers,
    realBusinesses,
    activeAppointments,
    totalBusinesses: realBusinesses.length,
    activeBusinesses,
    pendingBusinesses,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalServiceVolumeToman,
    totalRemainingInSalonToman,
    totalOnlineDepositsToman,
    totalPaidSettlementsToman,
    totalPendingPayableToman,
    approvedOrdersToman,
    pendingOrdersToman,
    pendingOrdersCount: pendingOrders.length,
    platformNetRevenueToman: approvedOrdersToman,
    grossOnlineTurnoverToman: totalOnlineDepositsToman + approvedOrdersToman,
  };
}

