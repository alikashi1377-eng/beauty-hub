import {
  AppointmentItem,
  AppointmentStatus,
  BusinessItem,
  BusinessType,
} from '../types';
import { getUpcomingJalaliDays, toEnglishDigitsClient } from './formatters';

/** درصدهای مجاز و استاندارد بیعانه آنلاین (بدون امکان غیرفعال‌سازی و بدون درصد دستی) */
export const ALLOWED_DEPOSIT_PERCENTS = [20, 30, 50, 100] as const;
export type AllowedDepositPercent = (typeof ALLOWED_DEPOSIT_PERCENTS)[number];

/** کف کارمزد پلتفرم در هر نوبت آنلاین (ضدتقلب قیمت‌گذاری صوری) */
export const MIN_PLATFORM_COMMISSION_TOMAN = 10_000;

/** کف کارمزد درگاه زیبال (۱٪ با حداقل ۲,۲۰۰ تومان) */
export const MIN_ZIBAL_GATEWAY_FEE_TOMAN = 2_200;

/** کف مالیات و زیرساخت پیامک رزرو آنلاین (۱٪ با حداقل ۱,۰۰۰ تومان) */
export const MIN_TAX_AND_INFRA_FEE_TOMAN = 1_000;

/** کف قیمت مجاز ثبت خدمت برای جلوگیری از قیمت‌گذاری صوری */
export const MIN_SERVICE_PRICE_MEN_TOMAN = 80_000;
export const MIN_SERVICE_PRICE_GENERAL_TOMAN = 100_000;

/** نرمال‌سازی درصد بیعانه به یکی از ۴ گزینه استاندارد ۲۰٪، ۳۰٪، ۵۰٪ یا ۱۰۰٪ */
export function normalizeDepositPercent(raw?: number | null): AllowedDepositPercent {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return 30;
  if (num <= 24) return 20;
  if (num <= 39) return 30;
  if (num <= 74) return 50;
  return 100;
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
  minServicePriceToman: number;
}

/** تشخیص هوشمند حوزه کسب‌وکار (آقایان ۳٪، لیزر ۴٪، بانوان ۵٪ از کل مبلغ خدمت) */
export function resolveBusinessCommissionMeta(
  business?: Pick<
    BusinessItem,
    'type' | 'typeLabel' | 'categorySlug' | 'targetGender' | 'name'
  > | null,
  config?: CategoryCommissionConfig
): ResolvedCommissionMeta {
  const malePct =
    typeof config?.maleCommissionPercent === 'number' &&
    config.maleCommissionPercent > 0
      ? config.maleCommissionPercent
      : 3;
  const laserPct =
    typeof config?.laserCommissionPercent === 'number' &&
    config.laserCommissionPercent > 0
      ? config.laserCommissionPercent
      : 4;
  const femalePct =
    typeof config?.femaleCommissionPercent === 'number' &&
    config.femaleCommissionPercent > 0
      ? config.femaleCommissionPercent
      : 5;

  const combinedText = `${business?.typeLabel || ''} ${business?.categorySlug || ''} ${business?.name || ''}`.toLowerCase();

  // ۱. بررسی مراکز لیزر موهای زائد
  if (
    business?.categorySlug === 'laser-hair-removal' ||
    combinedText.includes('لیزر') ||
    combinedText.includes('laser')
  ) {
    return {
      segment: 'LASER',
      commissionPercent: laserPct,
      segmentTitle: 'مرکز لیزر موهای زائد',
      minServicePriceToman: MIN_SERVICE_PRICE_GENERAL_TOMAN,
    };
  }

  // ۲. بررسی پیرایش و آرایشگاه آقایان
  if (
    business?.type === BusinessType.MenBarbershop ||
    business?.targetGender === 'MALE' ||
    business?.categorySlug === 'mens-barbershop' ||
    combinedText.includes('مردانه') ||
    combinedText.includes('آقایان') ||
    combinedText.includes('پیرایش')
  ) {
    return {
      segment: 'MEN',
      commissionPercent: malePct,
      segmentTitle: 'پیرایش و خدمات آقایان',
      minServicePriceToman: MIN_SERVICE_PRICE_MEN_TOMAN,
    };
  }

  // ۳. سالن‌های زیبایی و متخصصان بانوان (پیش‌فرض)
  return {
    segment: 'WOMEN',
    commissionPercent: femalePct,
    segmentTitle: 'سالن زیبایی و خدمات بانوان',
    minServicePriceToman: MIN_SERVICE_PRICE_GENERAL_TOMAN,
  };
}

export interface BookingFinancialBreakdown {
  /** قیمت کل خدمات انتخابی مشتری */
  totalServicePriceToman: number;
  /** درصد بیعانه استاندارد انتخابی سالن (۲۰، ۳۰، ۵۰ یا ۱۰۰) */
  depositPercent: AllowedDepositPercent;
  /** مبلغ پایه بیعانه از کل خدمت (مثلاً ۲۰۰,۰۰۰ تومان از ۱,۰۰۰,۰۰۰ تومان) */
  baseDepositToman: number;
  /** مبلغ الباقی که مشتری حضوری در سالن می‌پردازد (مثلاً ۸۰۰,۰۰۰ تومان) */
  remainingInSalonToman: number;
  /** کارمزد ۱٪ درگاه زیبال (با کف ۲,۲۰۰ تومان) */
  zibalGatewayFeeToman: number;
  /** مالیات و زیرساخت پیامک رزرو آنلاین (۱٪ با کف ۱,۰۰۰ تومان) */
  valueAddedTaxFeeToman: number;
  /** مجموع ۲٪ کارمزد درگاه زیبال و مالیات که در فاکتور آنلاین مشتری لحاظ می‌شود */
  customerGatewayAndTaxFeeToman: number;
  /** مبلغ نهایی قابل پرداخت آنلاین توسط مشتری در درگاه زیبال (بیعانه پایه + ۲٪ درگاه و مالیات) */
  totalCustomerOnlinePayableToman: number;
  /** درصد کمیسیون پلتفرم بر اساس کل قیمت خدمت (۳٪ آقایان، ۴٪ لیزر، ۵٪ بانوان) */
  platformCommissionPercent: number;
  /** عنوان حوزه کمیسیون */
  platformCommissionSegmentTitle: string;
  /** مبلغ کمیسیون پلتفرم که از محل بیعانه کسر می‌شود (محاسبه‌شده روی کل قیمت خدمت) */
  platformCommissionToman: number;
  /** مبلغ خالص بیعانه که پس از کسر کمیسیون پلتفرم وارد کیف پول سالن‌دار می‌شود */
  salonNetDepositCreditedToman: number;
}

/**
 * محاسبه دقیق و بدون خطای بیعانه، ۲٪ درگاه زیبال و مالیات، کمیسیون پلتفرم از کل خدمت،
 * و خالص واریزی به کیف پول سالن‌دار
 */
export function calculateBookingFinancialBreakdown(params: {
  totalServicePriceToman: number;
  depositPercent?: number | null;
  business?: Pick<
    BusinessItem,
    'type' | 'typeLabel' | 'categorySlug' | 'targetGender' | 'name'
  > | null;
  commissionConfig?: CategoryCommissionConfig;
}): BookingFinancialBreakdown {
  const safeTotalServicePrice = Math.max(
    0,
    Math.round(Number(params.totalServicePriceToman) || 0)
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

  // ۱٪ کارمزد درگاه زیبال (حداقل ۲,۲۰۰ تومان) + ۱٪ مالیات و زیرساخت (حداقل ۱,۰۰۰ تومان)
  const zibalGatewayFeeToman =
    baseDepositToman > 0
      ? Math.max(MIN_ZIBAL_GATEWAY_FEE_TOMAN, Math.round(baseDepositToman * 0.01))
      : 0;
  const valueAddedTaxFeeToman =
    baseDepositToman > 0
      ? Math.max(MIN_TAX_AND_INFRA_FEE_TOMAN, Math.round(baseDepositToman * 0.01))
      : 0;
  const customerGatewayAndTaxFeeToman =
    zibalGatewayFeeToman + valueAddedTaxFeeToman;

  const totalCustomerOnlinePayableToman =
    baseDepositToman + customerGatewayAndTaxFeeToman;

  // محاسبه کمیسیون پلتفرم بر اساس «کل قیمت خدمت»
  const commMeta = resolveBusinessCommissionMeta(
    params.business,
    params.commissionConfig
  );
  const rawCommissionFromTotal = Math.round(
    (safeTotalServicePrice * commMeta.commissionPercent) / 100
  );
  const platformCommissionToman =
    baseDepositToman > 0
      ? Math.min(
          baseDepositToman,
          Math.max(MIN_PLATFORM_COMMISSION_TOMAN, rawCommissionFromTotal)
        )
      : 0;

  const salonNetDepositCreditedToman = Math.max(
    0,
    baseDepositToman - platformCommissionToman
  );

  return {
    totalServicePriceToman: safeTotalServicePrice,
    depositPercent,
    baseDepositToman,
    remainingInSalonToman,
    zibalGatewayFeeToman,
    valueAddedTaxFeeToman,
    customerGatewayAndTaxFeeToman,
    totalCustomerOnlinePayableToman,
    platformCommissionPercent: commMeta.commissionPercent,
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
      error: `کف مجاز قیمت خدمت در دسته «${meta.segmentTitle}» مبلغ ${meta.minServicePriceToman.toLocaleString('fa-IR')} تومان است (ثبت قیمت‌های صوری یا غیرواقعی مجاز نیست).`,
    };
  }

  // جلوگیری از نوشتن شماره موبایل یا تلفن ثابت برای دور زدن رزرو آنلاین
  if (/(\+?98|0)?9\d{9}/.test(combined.replace(/[\s\-_]/g, ''))) {
    return {
      valid: false,
      error:
        'درج شماره موبایل داخل عنوان یا توضیحات خدمت مجاز نیست. هماهنگی نوبت‌ها صرفاً از طریق سامانه انجام می‌شود.',
    };
  }

  // جلوگیری از نوشتن آیدی اینستاگرام یا تلگرام داخل متن خدمت
  if (/@[a-zA-Z0-9_.]{3,}/.test(combined)) {
    return {
      valid: false,
      error:
        'درج آیدی شبکه اجتماعی (@) داخل عنوان یا توضیحات خدمت مجاز نیست.',
    };
  }

  // جلوگیری از عبارات دور زدن بیعانه
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
export function isAppointmentEligibleForSettlement(apt: AppointmentItem): boolean {
  if (apt.status === AppointmentStatus.Cancelled) return false;
  if (apt.status === AppointmentStatus.Completed || apt.inPersonSettled) {
    return true;
  }

  const todayEntry = getUpcomingJalaliDays(1)[0];
  const todayJalali = toEnglishDigitsClient(
    todayEntry?.dateJalali || todayEntry?.date || ''
  ).trim();
  const aptDate = toEnglishDigitsClient(String(apt.dateJalali || '')).trim();

  // اگر تاریخ نوبت به فرمت YYYY/MM/DD باشد، مقایسه رشته‌ای با تاریخ امروز
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(aptDate) && /^\d{4}\/\d{2}\/\d{2}$/.test(todayJalali)) {
    if (aptDate < todayJalali) return true;
    if (aptDate > todayJalali) return false;
    // اگر نوبت مال امروز است، بررسی ساعت نوبت با ساعت فعلی تهران
    const aptTime = toEnglishDigitsClient(String(apt.timeSlot || '00:00')).trim();
    const [hh, mm] = aptTime.split(':').map((v) => Number(v) || 0);
    const nowTehran = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Tehran' })
    );
    const nowMinutes = nowTehran.getHours() * 60 + nowTehran.getMinutes();
    const aptMinutes = hh * 60 + mm;
    return nowMinutes >= aptMinutes;
  }

  // اگر تاریخ متنی مثل «امروز» یا «دیروز» بود
  if (aptDate.includes('دیروز') || aptDate.includes('گذشته')) return true;
  if (aptDate.includes('فردا')) return false;

  return false;
}

/**
 * استخراج دقیق و بدون خطای بیعانه پرداخت‌شده، کمیسیون پلتفرم، خالص سهم سالن و الباقی حضوری برای هر نوبت
 * (حتی اگر نوبت از جدول PostgreSQL واکشی شده باشد یا فیلد depositPaidToman روی آن ۰/خالی مانده باشد)
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
    | 'depositPercent'
  > | null;
  commissionConfig?: CategoryCommissionConfig;
}): BookingFinancialBreakdown {
  const rawPrice = Number(params.appointment.priceToman) || 0;
  const effectiveServicePrice = rawPrice > 0 ? rawPrice : 350_000;
  const standard = calculateBookingFinancialBreakdown({
    totalServicePriceToman: effectiveServicePrice,
    depositPercent: params.business?.depositPercent,
    business: params.business,
    commissionConfig: params.commissionConfig,
  });

  const savedDeposit = Number(params.appointment.depositPaidToman) || 0;
  if (savedDeposit <= 0) {
    return standard;
  }

  // اگر مبلغ ذخیره شده شامل ۲٪ کارمزد درگاه و مالیات مشتری بوده باشد (یعنی برابر با totalCustomerOnlinePayableToman)، پایه بیعانه را دقیق استخراج کن
  const baseDepositToman =
    savedDeposit === standard.totalCustomerOnlinePayableToman
      ? standard.baseDepositToman
      : Math.min(effectiveServicePrice, savedDeposit);

  const remainingInSalonToman = Math.max(
    0,
    effectiveServicePrice - baseDepositToman
  );

  const platformCommissionToman =
    typeof params.appointment.platformCommissionToman === 'number' &&
    params.appointment.platformCommissionToman > 0
      ? Math.min(baseDepositToman, params.appointment.platformCommissionToman)
      : Math.min(baseDepositToman, standard.platformCommissionToman);

  const salonNetDepositCreditedToman =
    typeof params.appointment.salonNetDepositCreditedToman === 'number' &&
    params.appointment.salonNetDepositCreditedToman > 0
      ? Math.min(baseDepositToman, params.appointment.salonNetDepositCreditedToman)
      : Math.max(0, baseDepositToman - platformCommissionToman);

  return {
    ...standard,
    totalServicePriceToman: effectiveServicePrice,
    baseDepositToman,
    remainingInSalonToman,
    platformCommissionToman,
    salonNetDepositCreditedToman,
  };
}

