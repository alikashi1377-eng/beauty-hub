import {
  AppointmentStatus,
  BusinessItem,
  BusinessType,
  ServiceItem,
  SubscriptionStatus,
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

export function filterBusinesses(
  businesses: BusinessItem[],
  options: {
    query?: string;
    type?: BusinessType | 'ALL';
    city?: string | 'ALL';
    categorySlug?: string | 'ALL';
    maxPriceToman?: number;
    minRating?: number;
    sortBy?: SortOption;
  }
): BusinessItem[] {
  const normalizedQuery = (options.query ?? '').trim().toLowerCase();
  const selectedType = options.type ?? 'ALL';
  const selectedCity = options.city ?? 'ALL';
  const selectedCategory = options.categorySlug ?? 'ALL';
  const maxPrice = options.maxPriceToman ?? Infinity;
  const minRating = options.minRating ?? 0;
  const sortBy = options.sortBy ?? 'recommended';

  const filtered = businesses.filter((item) => {
    const matchesType = selectedType === 'ALL' || item.type === selectedType;
    const matchesCity = selectedCity === 'ALL' || item.city === selectedCity;
    const matchesCategory =
      selectedCategory === 'ALL' || item.categorySlug === selectedCategory;
    const matchesPrice = item.startingPriceToman <= maxPrice;
    const matchesRating = item.rating >= minRating;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.neighborhood.toLowerCase().includes(normalizedQuery) ||
      item.city.toLowerCase().includes(normalizedQuery) ||
      item.shortDescription.toLowerCase().includes(normalizedQuery) ||
      item.typeLabel.toLowerCase().includes(normalizedQuery);

    return (
      matchesType &&
      matchesCity &&
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
        const aOrder = a.sponsoredOrder ?? 99;
        const bOrder = b.sponsoredOrder ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
      }
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
}

export function getUpcomingJalaliDays(count = 7): UpcomingJalaliDayItem[] {
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

  for (let i = 0; i < count; i++) {
    const target = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const parts = numericFormatter.formatToParts(target);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const dateJalali = toPersianDigits(`${map.year}/${map.month}/${map.day}`);
    const dayName = weekdayFormatter.format(target);
    const dayMonthLabel = dayMonthFormatter.format(target);
    const fullLabel = `${dayName} ${dayMonthLabel}`;
    const tag =
      i === 0 ? 'امروز' : i === 1 ? 'فردا' : dayName === 'جمعه' ? 'آخر هفته' : 'ظرفیت باز';

    result.push({
      date: dateJalali,
      dateJalali,
      label: fullLabel,
      dayName,
      dayMonthLabel,
      fullLabel,
      tag,
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


