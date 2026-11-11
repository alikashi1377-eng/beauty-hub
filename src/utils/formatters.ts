import {
  AppointmentStatus,
  BusinessItem,
  BusinessType,
  ServiceItem,
  SubscriptionStatus,
  WorkingHourItem,
} from '../types';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: number | string): string {
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function toEnglishDigitsClient(input: string | number): string {
  return String(input)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * نرمال‌سازی ورودی شماره موبایل ایران به فرمت استاندارد ۱۱ رقمی 09xxxxxxxxx
 */
export function normalizeIranMobileInput(raw: string): string {
  const digits = toEnglishDigitsClient(raw).replace(/\D/g, '');
  if (digits.startsWith('989') && digits.length >= 12) {
    return `0${digits.slice(2, 12)}`;
  }
  if (digits.startsWith('9') && !digits.startsWith('09') && digits.length <= 10) {
    return `0${digits}`.slice(0, 11);
  }
  return digits.slice(0, 11);
}

export function isValidIranMobile(phone: string): boolean {
  const clean = normalizeIranMobileInput(phone);
  return /^09\d{9}$/.test(clean);
}

/**
 * سقف مجاز ثبت متخصص بر اساس پلن انتخابی یا فعال سالن:
 * - پلن رایگان (plan-free-start): ۱ متخصص (فقط خود مدیر/متخصص)
 * - پلن حرفه‌ای (plan-professional): تا ۳ متخصص
 * - پلن VIP (plan-vip-brand): تا ۸ متخصص
 */
export function getPlanStaffLimitCount(planIdOrName?: string): number {
  const val = (planIdOrName || '').toLowerCase();
  if (val.includes('vip') || val.includes('برند') || val.includes('8') || val.includes('۸')) {
    return 8;
  }
  if (
    val.includes('pro') ||
    val.includes('حرفه‌ای') ||
    val.includes('حرفه ای') ||
    val.includes('3') ||
    val.includes('۳')
  ) {
    return 3;
  }
  return 1;
}

export function formatPriceToman(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'رایگان';
  }
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

export function formatServicePriceDisplay(
  service: Pick<ServiceItem, 'priceToman' | 'pricingType' | 'maxPriceToman'>
): string {
  const base = Number(service.priceToman) || 0;
  const max = Number(service.maxPriceToman) || 0;
  if (service.pricingType === 'RANGE' && max > base) {
    return `از ${toPersianDigits(Math.round(base).toLocaleString('en-US'))} تا ${toPersianDigits(
      Math.round(max).toLocaleString('en-US')
    )} تومان`;
  }
  if (service.pricingType === 'STARTING_FROM') {
    return `شروع از ${formatPriceToman(base)} (تعیین دقیق پس از مشاوره)`;
  }
  return formatPriceToman(base);
}

export function formatServicePriceShort(
  service: Pick<ServiceItem, 'priceToman' | 'pricingType' | 'maxPriceToman'>
): string {
  const base = Number(service.priceToman) || 0;
  const max = Number(service.maxPriceToman) || 0;
  if (service.pricingType === 'RANGE' && max > base) {
    return `از ${toPersianDigits(Math.round(base).toLocaleString('en-US'))} تا ${toPersianDigits(
      Math.round(max).toLocaleString('en-US')
    )} تومان`;
  }
  if (service.pricingType === 'STARTING_FROM') {
    return `شروع از ${formatPriceToman(base)}`;
  }
  return formatPriceToman(base);
}

export function formatWorkingHourDisplay(wh: WorkingHourItem): string {
  if (!wh || !wh.isOpen) return 'تعطیل';
  if (wh.hasBreak && wh.secondOpenTime && wh.secondCloseTime) {
    return `شیفت ۱: ${wh.openTime} تا ${wh.closeTime} | شیفت ۲: ${wh.secondOpenTime} تا ${wh.secondCloseTime}`;
  }
  return `${wh.openTime} تا ${wh.closeTime}`;
}

export function parseTimeToMinutes(rawTime?: string): number {
  if (!rawTime) return -1;
  const clean = toEnglishDigitsClient(rawTime).trim();
  const parts = clean.split(':');
  if (parts.length < 2) return -1;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

export function isTimeSlotWithinWorkingHours(
  timeSlot: string,
  wh?: WorkingHourItem
): boolean {
  if (!wh) return true;
  if (!wh.isOpen) return false;
  const slotMin = parseTimeToMinutes(timeSlot);
  if (slotMin < 0) return true;

  const s1Start = parseTimeToMinutes(wh.openTime);
  const s1End = parseTimeToMinutes(wh.closeTime);
  const inShift1 =
    s1Start >= 0 && s1End > s1Start ? slotMin >= s1Start && slotMin < s1End : true;

  if (!wh.hasBreak || !wh.secondOpenTime || !wh.secondCloseTime) {
    return inShift1;
  }

  const s2Start = parseTimeToMinutes(wh.secondOpenTime);
  const s2End = parseTimeToMinutes(wh.secondCloseTime);
  const inShift2 =
    s2Start >= 0 && s2End > s2Start ? slotMin >= s2Start && slotMin < s2End : false;

  return inShift1 || inShift2;
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) return '۰ دقیقه';
  return `${toPersianDigits(minutes)} دقیقه`;
}

export function computeSelectedServicesSummary(
  availableServices: ServiceItem[],
  selectedIds?: string[],
  fallbackServiceId?: string
): {
  selectedServices: ServiceItem[];
  services: ServiceItem[];
  combinedTitle: string;
  totalDurationMinutes: number;
  totalPriceToman: number;
} {
  const validIds =
    selectedIds && selectedIds.length > 0
      ? selectedIds
      : fallbackServiceId
      ? [fallbackServiceId]
      : [];
  const matched = availableServices.filter((s) => validIds.includes(s.id));
  const selectedServices =
    matched.length > 0
      ? matched
      : availableServices[0]
      ? [availableServices[0]]
      : [];

  const combinedTitle =
    selectedServices.length > 0
      ? selectedServices.map((s) => s.title).join(' + ')
      : 'خدمت زیبایی';
  const totalDurationMinutes = selectedServices.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );
  const totalPriceToman = selectedServices.reduce(
    (sum, s) => sum + (s.priceToman || 0),
    0
  );

  return {
    selectedServices,
    services: selectedServices,
    combinedTitle,
    totalDurationMinutes: totalDurationMinutes || 60,
    totalPriceToman: totalPriceToman || 0,
  };
}

export function getAppointmentStatusMeta(status: AppointmentStatus): {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
} {
  switch (status) {
    case AppointmentStatus.Confirmed:
      return { label: 'تاییدشده', tone: 'success' };
    case AppointmentStatus.Pending:
      return { label: 'در انتظار تایید', tone: 'warning' };
    case AppointmentStatus.Completed:
      return { label: 'انجام‌شده', tone: 'info' };
    case AppointmentStatus.Cancelled:
      return { label: 'لغوشده', tone: 'danger' };
    case AppointmentStatus.NoShow:
      return { label: 'عدم مراجعه', tone: 'neutral' };
  }
}

export function getSubscriptionStatusMeta(status: SubscriptionStatus): {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
} {
  switch (status) {
    case SubscriptionStatus.Active:
      return { label: 'اشتراک فعال', tone: 'success' };
    case SubscriptionStatus.Trial:
      return { label: 'دوره آزمایشی', tone: 'info' };
    case SubscriptionStatus.ExpiringSoon:
      return { label: 'نزدیک به انقضا', tone: 'warning' };
    case SubscriptionStatus.Expired:
      return { label: 'منقضی‌شده', tone: 'danger' };
  }
}

export type SortOption = 'recommended' | 'rating_desc' | 'price_asc';

// کلید چرخش منصفانه (Fair Rotation Seed) در هر بار نشست مرورگر تا بین ۲۰+ سالن ویژه، ترتیب نمایش سالن‌های هم‌رتبه به صورت چرخشی و عادلانه تغییر کند
const SESSION_ROTATION_SEED =
  typeof window !== 'undefined'
    ? (() => {
        try {
          const existing = window.sessionStorage.getItem(
            'timeto_fair_rotation_seed_v1'
          );
          if (existing) return Number(existing) || 17;
          const fresh = Math.floor(1 + Math.random() * 997);
          window.sessionStorage.setItem(
            'timeto_fair_rotation_seed_v1',
            String(fresh)
          );
          return fresh;
        } catch {
          return 37;
        }
      })()
    : 37;

export function computeFairRotationScore(
  businessId: string,
  extraSalt = 0
): number {
  let hash = SESSION_ROTATION_SEED + extraSalt;
  for (let i = 0; i < businessId.length; i++) {
    hash = (hash * 31 + businessId.charCodeAt(i)) % 10007;
  }
  return hash;
}

export function filterBusinesses(
  businesses: BusinessItem[],
  options: {
    query?: string;
    type?: BusinessType | 'ALL';
    city?: string | 'ALL';
    neighborhood?: string | 'ALL';
    categorySlug?: string | 'ALL';
    maxPriceToman?: number;
    minRating?: number;
    sortBy?: SortOption;
    rotationTick?: number;
  }
): BusinessItem[] {
  const normalizedQuery = (options.query ?? '').trim().toLowerCase();
  const selectedType = options.type ?? 'ALL';
  const selectedCity = options.city ?? 'ALL';
  const selectedNeighborhood = options.neighborhood ?? 'ALL';
  const selectedCategory = options.categorySlug ?? 'ALL';
  const maxPrice = options.maxPriceToman ?? Infinity;
  const minRating = options.minRating ?? 0;
  const sortBy = options.sortBy ?? 'recommended';
  const rotationTick = options.rotationTick ?? 0;

  const filtered = businesses.filter((item) => {
    if (!item || item.approvalStatus === 'REJECTED') return false;
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesCity =
      selectedCity === 'ALL' || (item.city || 'اصفهان') === selectedCity;
    const matchesNeighborhood =
      selectedNeighborhood === 'ALL' ||
      (item.neighborhood || '').includes(selectedNeighborhood);
    const matchesCategory =
      selectedCategory === 'ALL' || item.categorySlug === selectedCategory;
    const itemPrice = Number(item.startingPriceToman) || 0;
    const matchesPrice = maxPrice >= 10000000 || itemPrice <= maxPrice;
    const itemRating = Number(item.rating) || 5.0;
    const matchesRating = minRating <= 0 || itemRating >= minRating;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      (item.name || '').toLowerCase().includes(normalizedQuery) ||
      (item.neighborhood || '').toLowerCase().includes(normalizedQuery) ||
      (item.city || '').toLowerCase().includes(normalizedQuery) ||
      (item.shortDescription || '').toLowerCase().includes(normalizedQuery) ||
      (item.typeLabel || '').toLowerCase().includes(normalizedQuery);

    return (
      matchesType &&
      matchesCity &&
      matchesNeighborhood &&
      matchesCategory &&
      matchesPrice &&
      matchesRating &&
      matchesQuery
    );
  });

  const sorted = [...filtered];
  if (sortBy === 'rating_desc') {
    sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  } else if (sortBy === 'price_asc') {
    sorted.sort((a, b) => a.startingPriceToman - b.startingPriceToman);
  } else {
    sorted.sort((a, b) => {
      const aSpon = Number(Boolean(a.isSponsored));
      const bSpon = Number(Boolean(b.isSponsored));
      if (bSpon !== aSpon) return bSpon - aSpon;

      if (aSpon && bSpon) {
        // ۱. اگر کاربر دسته‌بندی یا محله خاصی را انتخاب کرده، سالن ویژه‌ای که دقیقاً آن دسته/محله را هدف‌گذاری کرده اولویت اول را دارد
        const aTargetedMatch = Number(
          (selectedCategory !== 'ALL' &&
            (a.sponsoredCategorySlug === selectedCategory ||
              a.categorySlug === selectedCategory)) ||
            (selectedNeighborhood !== 'ALL' &&
              (a.sponsoredNeighborhood === selectedNeighborhood ||
                a.neighborhood.includes(selectedNeighborhood)))
        );
        const bTargetedMatch = Number(
          (selectedCategory !== 'ALL' &&
            (b.sponsoredCategorySlug === selectedCategory ||
              b.categorySlug === selectedCategory)) ||
            (selectedNeighborhood !== 'ALL' &&
              (b.sponsoredNeighborhood === selectedNeighborhood ||
                b.neighborhood.includes(selectedNeighborhood)))
        );
        if (bTargetedMatch !== aTargetedMatch) {
          return bTargetedMatch - aTargetedMatch;
        }

        // ۲. سطح جایگاه (HERO_SPOTLIGHT = 1, HOME_BANNER / SEARCH_TOP = 2)
        const aOrder = a.sponsoredOrder ?? 2;
        const bOrder = b.sponsoredOrder ?? 2;
        if (aOrder !== bOrder) return aOrder - bOrder;

        // ۳. چرخش منصفانه (Weighted Fair Rotation) بین سالن‌های هم‌رده تا هر ۲۰+ سالن ویژه شانس برابر در ردیف اول داشته باشند
        return (
          computeFairRotationScore(a.id, rotationTick) -
          computeFairRotationScore(b.id, rotationTick)
        );
      }

      const aReal = Number(!a.isSampleShowcase && !/^biz-[1-8]$/.test(a.id));
      const bReal = Number(!b.isSampleShowcase && !/^biz-[1-8]$/.test(b.id));
      if (bReal !== aReal) return bReal - aReal;
      return (
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        b.rating - a.rating
      );
    });
  }

  return sorted;
}

const PERSIAN_TO_LATIN_MAP: Record<string, string> = {
  آ: 'a',
  ا: 'a',
  ب: 'b',
  پ: 'p',
  ت: 't',
  ث: 's',
  ج: 'j',
  چ: 'ch',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  ژ: 'zh',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'z',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'gh',
  ک: 'k',
  ك: 'k',
  گ: 'g',
  ل: 'l',
  م: 'm',
  ن: 'n',
  و: 'v',
  ه: 'h',
  ی: 'i',
  ي: 'i',
  ئ: 'y',
  ' ': '-',
  '‌': '-',
};

export function suggestSlugFromName(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/سالن زیبایی|آرایشگاه مردانه|مرکز تخصصی|استودیو/g, '')
    .trim();
  const transliterated = Array.from(cleaned)
    .map((ch) => {
      if (/[a-z0-9-]/.test(ch)) return ch;
      return PERSIAN_TO_LATIN_MAP[ch] ?? '';
    })
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return transliterated.length >= 3 ? `${transliterated}-salon` : 'my-beauty-salon';
}

export function validateBusinessRegistrationDraft(input: {
  businessName: string;
  ownerName: string;
  phone: string;
  city: string;
  slug: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.businessName || input.businessName.trim().length < 3) {
    errors.businessName = 'نام کسب‌وکار باید حداقل ۳ کاراکتر باشد.';
  }
  if (!input.ownerName || input.ownerName.trim().length < 3) {
    errors.ownerName = 'نام و نام خانوادگی مسئول باید حداقل ۳ کاراکتر باشد.';
  }
  const cleanPhone = input.phone.trim();
  if (!/^09\d{9}$/.test(cleanPhone) && !/^۰۹[۰-۹]{9}$/.test(cleanPhone)) {
    errors.phone = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.';
  }
  if (!input.city || input.city.trim().length === 0) {
    errors.city = 'انتخاب شهر الزامی است.';
  }
  if (!input.slug || !/^[a-z0-9-]+$/.test(input.slug.trim())) {
    errors.slug =
      'آدرس اینترنتی صفحه سالن فقط می‌تواند شامل حروف کوچک انگلیسی، عدد و خط تیره باشد (مثال: royal-salon).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateServiceForm(input: {
  title: string;
  category: string;
  durationMinutes: number;
  priceToman: number;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.title || input.title.trim().length < 3) {
    errors.title = 'عنوان خدمت باید حداقل ۳ کاراکتر باشد.';
  }
  if (!input.category || input.category.trim().length === 0) {
    errors.category = 'انتخاب دسته‌بندی خدمت الزامی است.';
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 10) {
    errors.durationMinutes = 'مدت زمان خدمت باید حداقل ۱۰ دقیقه باشد.';
  }
  if (!Number.isFinite(input.priceToman) || input.priceToman < 50000) {
    errors.priceToman = 'قیمت خدمت باید حداقل ۵۰,۰۰۰ تومان باشد.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface UpcomingJalaliDayItem {
  date: string;
  dateJalali: string;
  label: string;
  dayName: string;
  dayMonthLabel: string;
  fullLabel: string;
  tag: string;
  dayNumberPersian: string;
  monthNamePersian: string;
  yearPersian: string;
  jalaliWeekdayIndex: number;
}

const JALALI_WEEKDAY_ORDER: Record<string, number> = {
  شنبه: 0,
  یکشنبه: 1,
  دوشنبه: 2,
  'سه‌شنبه': 3,
  چهارشنبه: 4,
  پنجشنبه: 5,
  جمعه: 6,
};

export function getUpcomingJalaliDays(count = 14): UpcomingJalaliDayItem[] {
  const result: UpcomingJalaliDayItem[] = [];
  const now = new Date();

  const numericFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const weekdayFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
  });

  const dayMonthFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    day: 'numeric',
    month: 'long',
  });

  const monthOnlyFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    month: 'long',
  });

  for (let i = 0; i < count; i++) {
    const target = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const parts = numericFormatter.formatToParts(target);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const dateJalali = toPersianDigits(`${map.year}/${map.month}/${map.day}`);
    const dayName = weekdayFormatter.format(target).trim();
    const dayMonthLabel = dayMonthFormatter.format(target);
    const monthNamePersian = monthOnlyFormatter.format(target);
    const dayNumberPersian = toPersianDigits(Number(map.day || '1'));
    const yearPersian = toPersianDigits(String(map.year || '1405'));
    const fullLabel = `${dayName} ${dayMonthLabel}`;
    const jalaliWeekdayIndex =
      JALALI_WEEKDAY_ORDER[dayName] ?? (target.getDay() + 1) % 7;
    const tag =
      i === 0
        ? 'امروز'
        : i === 1
          ? 'فردا'
          : dayName === 'جمعه'
            ? 'آخر هفته'
            : 'ظرفیت باز';

    result.push({
      date: dateJalali,
      dateJalali,
      label: fullLabel,
      dayName,
      dayMonthLabel,
      fullLabel,
      tag,
      dayNumberPersian,
      monthNamePersian,
      yearPersian,
      jalaliWeekdayIndex,
    });
  }

  return result;
}

/**
 * فرمت‌دهی زنده ورودی قیمت به صورت سه‌رقمی با کاما (مثلاً 650,000) و استخراج عدد خالص
 */
export function formatNumericInputWithCommas(raw: string | number): string {
  const digits = toEnglishDigitsClient(String(raw)).replace(/\D/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (!Number.isFinite(num) || num <= 0) return '';
  return num.toLocaleString('en-US');
}

export function parseNumericInput(raw: string | number): number {
  const digits = toEnglishDigitsClient(String(raw)).replace(/\D/g, '');
  if (!digits) return 0;
  const num = Number(digits);
  return Number.isFinite(num) ? num : 0;
}

/**
 * پیشنهاد هوشمند عنوان خدمات بر اساس دسته‌بندی انتخاب‌شده
 */
export const SERVICE_SUGGESTIONS_BY_CATEGORY: Record<string, string[]> = {
  'عروس': [
    'پکیج VIP میکاپ و شینیون عروس',
    'میکاپ و گریم تخصصی عروس (ضدآب)',
    'شینیون تخصصی عروس و نصب تاج و تور',
    'پکیج کامل عقد و نامزدی عروس',
    'مشاوره و تست میکاپ عروس',
  ],
  'داماد': [
    'پکیج VIP پیرایش و گریم تخصصی داماد',
    'اصلاح، استایلینگ مو و متعادل‌سازی چهره داماد',
    'پاکسازی و فیشیال تخصصی پوست داماد',
    'پکیج کامل عقد و فرمالیته داماد',
  ],
  'مو و رنگ': [
    'کوتاهی ژورنالی و براشینگ تخصصی مو',
    'بالیاژ، آمبره و سامبره تخصصی مو',
    'رنگ و مش کامل با اولاپلکس',
    'کراتین و احیای صافی ۱۰۰٪ مو',
    'پروتئین‌تراپی و بوتاکس تراپی مو',
    'شینیون تخصصی محفلی و استایلینگ',
  ],
  'آرایش و میکاپ': [
    'میکاپ تخصصی محفلی و VIP',
    'میکاپ لایت و اروپایی',
    'شینیون مدرن و کرلی مو',
    'گریم و کانتورینگ حرفه‌ای صورت',
  ],
  'ناخن': [
    'کاشت ناخن پودر و ژل به همراه لاک‌ژل',
    'ترمیم ناخن و طراحی تخصصی',
    'لمینت و استحکام‌سازی ناخن طبیعی',
    'مانیکور روسی و ژلیش ناخن طبیعی',
    'پدیکور VIP و کف‌سابی اسپا',
  ],
  'پوست و فیشیال': [
    'فیشیال تخصصی و پاکسازی عمیق پوست',
    'هیدرافیشیال و آبرسانی چندمرحله‌ای',
    'اسیدتراپی و درمان لک و جوش',
    'کربوکسی‌تراپی و جوانسازی پوست',
  ],
  'ابرو و مژه': [
    'اکستنشن مژه والیوم و مگاوالیوم',
    'لیفت و لمینت مژه و ابرو با مواد کراتینه',
    'طراحی، قرینه‌سازی و اصلاح ابرو',
    'میکروبلیدینگ و فیبروز تخصصی ابرو',
  ],
  'آرایشگاه مردانه': [
    'کوتاهی ژورنالی مردانه و اسکین‌فید',
    'اصلاح و استایلینگ کلاسیک مو و ریش',
    'پاکسازی صورت و ماسک زغال آقایان',
    'کراتین و صافی موی آقایان',
  ],
  'اصلاح و پیرایش': [
    'اصلاح و قرینه‌سازی ریش با حوله گرم',
    'آنکادر ریش و استایلینگ مو با وکس',
    'اسکراب پوست سر و ماساژ صورت',
  ],
  'ماساژ و مراقبت بدن': [
    'ماساژ ریلکسیشن و رفع گرفتگی عضلات',
    'ماساژ سوئدی و آروماتراپی',
    'بادی‌اسکراب و اسپا تخصصی بدن',
  ],
};

export function getSuggestedServiceTitlesForCategory(categoryTitle: string): string[] {
  const clean = (categoryTitle || '').trim();
  if (SERVICE_SUGGESTIONS_BY_CATEGORY[clean]) {
    return SERVICE_SUGGESTIONS_BY_CATEGORY[clean];
  }
  const matchKey = Object.keys(SERVICE_SUGGESTIONS_BY_CATEGORY).find(
    (k) => clean.includes(k) || k.includes(clean)
  );
  return matchKey
    ? SERVICE_SUGGESTIONS_BY_CATEGORY[matchKey]
    : SERVICE_SUGGESTIONS_BY_CATEGORY['مو و رنگ'];
}

/**
 * گزینه‌های استاندارد ساعت کاری از ۰۷:۰۰ تا ۲۳:۳۰ با گام ۳۰ دقیقه برای انتخاب سریع بدون تایپ
 */
export const STANDARD_WORKING_TIME_OPTIONS: string[] = [
  '۰۷:۰۰',
  '۰۷:۳۰',
  '۰۸:۰۰',
  '۰۸:۳۰',
  '۰۹:۰۰',
  '۰۹:۳۰',
  '۱۰:۰۰',
  '۱۰:۳۰',
  '۱۱:۰۰',
  '۱۱:۳۰',
  '۱۲:۰۰',
  '۱۲:۳۰',
  '۱۳:۰۰',
  '۱۳:۳۰',
  '۱۴:۰۰',
  '۱۴:۳۰',
  '۱۵:۰۰',
  '۱۵:۳۰',
  '۱۶:۰۰',
  '۱۶:۳۰',
  '۱۷:۰۰',
  '۱۷:۳۰',
  '۱۸:۰۰',
  '۱۸:۳۰',
  '۱۹:۰۰',
  '۱۹:۳۰',
  '۲۰:۰۰',
  '۲۰:۳۰',
  '۲۱:۰۰',
  '۲۱:۳۰',
  '۲۲:۰۰',
  '۲۲:۳۰',
  '۲۳:۰۰',
  '۲۳:۳۰',
];

/**
 * محاسبه پویا قیمت و عنوان بسته تبلیغاتی بر اساس جایگاه انتخاب‌شده (SEARCH_TOP, HOME_BANNER, HERO_SPOTLIGHT) و مدت زمان (۷، ۱۴، ۳۰ روز)
 */
export function computeAdPackagePriceAndTitle(params: {
  placementSlot: 'SEARCH_TOP' | 'HOME_BANNER' | 'HERO_SPOTLIGHT' | 'SMS_ADDON';
  durationDays: number;
  fallbackBaseAmount?: number;
  fallbackWeeklyAmount?: number;
  fallbackTitle?: string;
}): { amountToman: number; title: string; baseMonthlyToman: number; weeklyToman: number } {
  const { placementSlot, durationDays } = params;

  const slotPricing: Record<
    string,
    { title: string; monthly: number; weekly: number }
  > = {
    SEARCH_TOP: {
      title: 'صدرنشینی در نتایج جست‌وجوی شهر',
      monthly: 490000,
      weekly: 190000,
    },
    HOME_BANNER: {
      title: 'بنر ویژه در صفحه اول تایم تو',
      monthly: 890000,
      weekly: 350000,
    },
    HERO_SPOTLIGHT: {
      title: 'ویترین طلایی اول هیرو + صدر جست‌وجو (VIP)',
      monthly: 1290000,
      weekly: 490000,
    },
  };

  const matched = slotPricing[placementSlot];
  const baseMonthly = matched?.monthly ?? params.fallbackBaseAmount ?? 490000;
  const weekly =
    matched?.weekly ??
    params.fallbackWeeklyAmount ??
    Math.round(baseMonthly * 0.4);
  const resolvedTitle = matched?.title ?? params.fallbackTitle ?? 'بسته تبلیغاتی ویژه';

  const amountToman =
    durationDays === 7
      ? weekly
      : durationDays === 14
      ? Math.round(baseMonthly * 0.6)
      : baseMonthly;

  return {
    amountToman,
    title: resolvedTitle,
    baseMonthlyToman: baseMonthly,
    weeklyToman: weekly,
  };
}

/**
 * تشخیص تب بعدی یا قبلی هنگام کشیدن انگشت به چپ یا راست (Horizontal Touch Swipe در چیدمان RTL)
 */
export function resolveAdjacentTabBySwipe<T>(
  items: T[],
  activeIndexOrItem: number | T,
  deltaX: number,
  deltaY: number,
  minSwipeDistance = 52
): T | null {
  const activeIndex =
    typeof activeIndexOrItem === 'number'
      ? activeIndexOrItem
      : items.indexOf(activeIndexOrItem);

  if (items.length <= 1 || activeIndex < 0 || activeIndex >= items.length) {
    return null;
  }
  if (Math.abs(deltaX) < minSwipeDistance) {
    return null;
  }
  // اگر حرکت عمودی بیشتر از حرکت افقی بود (اسکرول صفحه)، سوایپ تب انجام نشود
  if (Math.abs(deltaY) > Math.abs(deltaX) * 0.7) {
    return null;
  }
  const nextIndex = deltaX > 0 ? activeIndex + 1 : activeIndex - 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return null;
  }
  return items[nextIndex] ?? null;
}

/**
 * ساخت لینک کوتاه و برندشده پروفایل کسب‌وکار برای نمایش در بایو اینستاگرام و اشتراک‌گذاری
 * ظاهر نوشتاری کوتاه با نام برند تایم‌تو و اسلاگ سالن است اما با کلیک مستقیماً صفحه سالن را باز می‌کند.
 */
export function buildBusinessShortLink(
  slug: string,
  businessName?: string,
  origin?: string
): {
  shortPath: string;
  actualUrl: string;
  displayShortUrl: string;
  brandedTitle: string;
  bioCopyText: string;
} {
  const cleanSlug = (slug || 'salon').trim().replace(/^\/+|\/+$/g, '');
  const resolvedOrigin =
    origin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://timeto.ir');
  const shortPath = `/${cleanSlug}`;
  const actualUrl = `${resolvedOrigin}${shortPath}`;
  const displayShortUrl = `Timeto.ir/${cleanSlug}`;
  const cleanName = (businessName || '').trim();
  const brandedTitle = cleanName
    ? `تایم‌تو | ${cleanName} (${displayShortUrl})`
    : `تایم‌تو (${displayShortUrl})`;
  const bioCopyText = cleanName
    ? `رزرو آنلاین نوبت ${cleanName} در تایم‌تو:\n${actualUrl}`
    : actualUrl;

  return {
    shortPath,
    actualUrl,
    displayShortUrl,
    brandedTitle,
    bioCopyText,
  };
}



