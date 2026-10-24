import {
  AppointmentStatus,
  BusinessItem,
  BusinessType,
  SubscriptionStatus,
} from '../types';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: number | string): string {
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
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
    sorted.sort(
      (a, b) =>
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        b.rating - a.rating
    );
  }

  return sorted;
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
      'شناسه پیوند (Slug) فقط می‌تواند شامل حروف کوچک انگلیسی، عدد و خط تیره باشد.';
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
