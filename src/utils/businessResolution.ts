import {
  BusinessItem,
  BusinessType,
  SubscriptionStatus,
  WorkingHourItem,
} from '../types';
import { AuthenticatedSessionUser } from '../services/apiClient';
import { toEnglishDigitsClient } from './formatters';

function cleanDigits(raw?: string | null): string {
  return toEnglishDigitsClient(String(raw || '')).replace(/\D/g, '');
}

function isSampleBusiness(b: BusinessItem): boolean {
  return Boolean(b.isSampleShowcase || /^biz-[1-8]$/.test(b.id));
}

function doesBusinessBelongToUser(
  business: BusinessItem,
  authUser: AuthenticatedSessionUser
): boolean {
  const memberships = authUser.businessMemberships || [];
  if (
    memberships.some(
      (m) =>
        business.id === m.businessId ||
        business.slug === m.businessSlug ||
        business.id === m.businessUuid
    )
  ) {
    return true;
  }

  const userPhone = cleanDigits(authUser.phone);
  if (!userPhone) return false;

  const ownerPhone = cleanDigits(business.ownerPhone);
  const displayPhone = cleanDigits(business.phoneDisplay);
  if (ownerPhone === userPhone || displayPhone === userPhone) {
    return true;
  }

  if (business.id === `biz-owner-${userPhone}`) {
    return true;
  }

  return false;
}

/**
 * تفکیک قطعی کسب‌وکار فعال هر کاربر (بدون نشت اطلاعات کسب‌وکار کاربر قبلی یا سایر سالن‌ها)
 */
export function resolveCurrentUserBusiness(params: {
  authUser: AuthenticatedSessionUser | null;
  ownedBusinessId: string | null;
  businesses: BusinessItem[];
  fallbackWorkingHours: WorkingHourItem[];
}): BusinessItem | null {
  const { authUser, ownedBusinessId, businesses, fallbackWorkingHours } = params;
  const realBusinesses = businesses.filter((b) => !isSampleBusiness(b));

  // اگر هیچ کاربری لاگین نیست، هرگز کسب‌وکار دیگران را به عنوان سالن فعال برنگردان
  if (!authUser) {
    return null;
  }

  const isSuperAdmin =
    Boolean(authUser.isPlatformAdmin) &&
    authUser.roles.includes('PLATFORM_ADMIN');

  // ۱. اگر مدیر کل پلتفرم به صورت عمدی یک کسب‌وکار را برای پیش‌نمایش/مدیریت انتخاب کرده باشد
  if (isSuperAdmin && ownedBusinessId) {
    const adminSelected = realBusinesses.find((b) => b.id === ownedBusinessId);
    if (adminSelected) return adminSelected;
  }

  // ۲. اولویت اصلی: تطبیق دقیق با عضویت‌های واقعی کاربر در سرور (businessMemberships)
  const memberships = authUser.businessMemberships || [];
  for (const membership of memberships) {
    const foundMemberBiz = realBusinesses.find(
      (b) =>
        b.id === membership.businessId ||
        b.slug === membership.businessSlug ||
        b.id === membership.businessUuid
    );
    if (foundMemberBiz) return foundMemberBiz;
  }

  // ۳. اگر ownedBusinessId ست شده، فقط در صورتی قبول کن که متعلق به همین کاربر باشد
  if (ownedBusinessId) {
    const foundOwned = realBusinesses.find(
      (b) => b.id === ownedBusinessId && doesBusinessBelongToUser(b, authUser)
    );
    if (foundOwned) return foundOwned;
  }

  // ۴. جستجوی دقیق بر اساس شماره موبایل صاحب کسب‌وکار
  const matchedByPhone = realBusinesses.find((b) =>
    doesBusinessBelongToUser(b, authUser)
  );
  if (matchedByPhone) return matchedByPhone;

  // ۵. اگر کاربر نقش صاحب کسب‌وکار دارد ولی رکوردش هنوز در لیست businesses لود نشده،
  // یک فضای کاری خالیِ اختصاصی فقط با مشخصات خود همین کاربر بساز (هرگز سالن شخص دیگری برنگردان!)
  if (authUser.roles.includes('BUSINESS_OWNER')) {
    const userPhone = cleanDigits(authUser.phone);
    return {
      id: userPhone ? `biz-owner-${userPhone}` : 'biz-owner-zero',
      slug: userPhone ? `salon-${userPhone.slice(-4)}` : 'my-salon-workspace',
      name: '',
      type: BusinessType.WomenSalon,
      typeLabel: 'سالن زیبایی یا متخصص مستقل',
      categorySlug: 'hair-color',
      city: authUser.defaultCity || 'اصفهان',
      neighborhood: '',
      address: '',
      phoneDisplay: authUser.phone || '',
      ownerName: authUser.fullName || '',
      ownerPhone: authUser.phone || '',
      createdAtJalali: 'امروز',
      rating: 5.0,
      reviewCount: 0,
      startingPriceToman: 0,
      shortDescription: '',
      aboutText: '',
      verifiedBadge: false,
      approvalStatus: 'PENDING_REVIEW',
      subscriptionPlan: 'شروع رایگان (پایه)',
      subscriptionStatus: SubscriptionStatus.Trial,
      trialDaysRemaining: 30,
      extraSmsBalance: 0,
      smsSentCount: 0,
      workingHours: fallbackWorkingHours.map((h) => ({ ...h })),
      workingHoursConfigured: false,
      contractAccepted: false,
      visualTheme: 'violet',
      featured: false,
      isSampleShowcase: false,
    };
  }

  // اگر مدیر کل بدون انتخاب سالن خاص وارد پنل شود
  if (isSuperAdmin && realBusinesses.length > 0) {
    return realBusinesses[0];
  }

  return null;
}
