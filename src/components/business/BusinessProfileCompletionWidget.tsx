import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Scissors,
  Sparkles,
  Users,
  ChevronLeft,
} from 'lucide-react';
import {
  BusinessItem,
  GalleryItem,
  ServiceItem,
  SpecialistItem,
  SubscriptionPlanItem,
} from '../../types';
import { toPersianDigits } from '../../utils/formatters';

export interface ProfileCompletionStep {
  id: 'basic_location' | 'services' | 'working_hours' | 'specialists' | 'media_bio';
  title: string;
  shortLabel: string;
  weightPercent: number;
  completed: boolean;
  href: string;
  statusHint: string;
}

export interface BusinessProfileCompletionSummary {
  totalPercent: number;
  planName: string;
  planStaffLimitCount: number;
  recommendedServicesMin: number;
  activeServicesCount: number;
  activeSpecialistsCount: number;
  openDaysCount: number;
  steps: ProfileCompletionStep[];
  incompleteSteps: ProfileCompletionStep[];
  nextIncompleteStep: ProfileCompletionStep | null;
}

export function computeBusinessProfileCompletion(params: {
  business: BusinessItem | null | undefined;
  services: ServiceItem[];
  specialists: SpecialistItem[];
  gallery: GalleryItem[];
  plans?: SubscriptionPlanItem[];
}): BusinessProfileCompletionSummary {
  const { business, services, specialists, gallery, plans = [] } = params;

  const planName = business?.subscriptionPlan || 'شروع رایگان';
  const matchedPlan = plans.find((p) => p.name === planName);

  const isVipPlan =
    planName.includes('ویژه') ||
    planName.toLowerCase().includes('vip') ||
    matchedPlan?.id.includes('vip');
  const isProPlan =
    !isVipPlan &&
    (planName.includes('حرفه‌ای') ||
      planName.includes('حرفه ای') ||
      matchedPlan?.id.includes('pro'));

  const planStaffLimitCount = isVipPlan ? 8 : isProPlan ? 3 : 1;
  const recommendedServicesMin = isVipPlan ? 3 : isProPlan ? 2 : 1;

  if (!business) {
    return {
      totalPercent: 0,
      planName,
      planStaffLimitCount,
      recommendedServicesMin,
      activeServicesCount: 0,
      activeSpecialistsCount: 0,
      openDaysCount: 0,
      steps: [],
      incompleteSteps: [],
      nextIncompleteStep: null,
    };
  }

  const bizServices = services.filter(
    (s) => s.businessId === business.id && s.isActive !== false
  );
  const bizSpecialists = specialists.filter(
    (sp) => sp.businessId === business.id && sp.isActive !== false
  );
  const bizGallery = gallery.filter((g) => g.businessId === business.id);
  const openDays = (business.workingHours || []).filter((h) => h.isOpen);

  // ۱. اطلاعات پایه، آدرس و لوکیشن نقشه (۲۰٪)
  const hasBasicAndLocation = Boolean(
    business.name?.trim() &&
      business.address?.trim() &&
      business.phoneDisplay?.trim() &&
      business.mapLat &&
      business.mapLng
  );

  // ۲. تعریف خدمات قابل رزرو و تعرفه‌ها متناسب با پلن (۲۵٪)
  const hasServices = bizServices.length >= 1;

  // ۳. تنظیم دقیق روزها و ساعات کاری (۲۰٪)
  // تا زمانی که صاحب سالن روزها و ساعات کاری را در بخش ساعات کاری ذخیره/تایید نکرده باشد، به عنوان ناقص نمایش داده می‌شود
  const hasWorkingHours =
    openDays.length > 0 && Boolean(business.workingHoursConfigured);

  // ۴. معرفی متخصصان متناسب با ظرفیت پلن (۲۰٪)
  const hasSpecialists = bizSpecialists.length >= 1;

  // ۵. تصویر پروفایل، بیوگرافی، اینستاگرام و نمونه کار (۱۵٪)
  const hasMediaAndBio = Boolean(
    business.avatarUrl &&
      business.instagramHandle?.trim() &&
      business.aboutText &&
      business.aboutText.trim().length >= 25 &&
      bizGallery.length > 0
  );

  const steps: ProfileCompletionStep[] = [
    {
      id: 'basic_location',
      title: 'اطلاعات پایه، آدرس و لوکیشن نقشه',
      shortLabel: 'آدرس و لوکیشن',
      weightPercent: 20,
      completed: hasBasicAndLocation,
      href: '/app/profile',
      statusHint: 'ثبت موقعیت روی نقشه و آدرس دقیق',
    },
    {
      id: 'services',
      title: 'تعریف خدمات قابل رزرو و تعرفه‌ها',
      shortLabel: 'خدمات سالن',
      weightPercent: 25,
      completed: hasServices,
      href: '/app/services',
      statusHint: 'تعریف خدمات و تعرفه‌های قابل رزرو',
    },
    {
      id: 'working_hours',
      title: 'تنظیم دقیق روزها و ساعات کاری',
      shortLabel: 'روزها و ساعات کاری',
      weightPercent: 20,
      completed: hasWorkingHours,
      href: '/app/working-hours',
      statusHint: 'تعیین و ذخیره روزهای کاری و ساعات پذیرش',
    },
    {
      id: 'specialists',
      title: `معرفی متخصصان سالن (ظرفیت پلن: تا ${toPersianDigits(planStaffLimitCount)} نفر)`,
      shortLabel: 'متخصصان سالن',
      weightPercent: 20,
      completed: hasSpecialists,
      href: '/app/staff',
      statusHint: `ثبت متخصص (سقف پلن شما: ${toPersianDigits(planStaffLimitCount)} نفر)`,
    },
    {
      id: 'media_bio',
      title: 'تصویر سالن، اینستاگرام و نمونه‌کار',
      shortLabel: 'تصویر و نمونه‌کار',
      weightPercent: 15,
      completed: hasMediaAndBio,
      href: bizGallery.length === 0 ? '/app/gallery' : '/app/profile',
      statusHint: 'تکمیل عکس پروفایل، اینستاگرام و گالری نمونه‌کار',
    },
  ];

  const totalPercent = steps.reduce(
    (sum, step) => sum + (step.completed ? step.weightPercent : 0),
    0
  );

  const incompleteSteps = steps.filter((s) => !s.completed);
  const nextIncompleteStep = incompleteSteps[0] ?? null;

  return {
    totalPercent,
    planName,
    planStaffLimitCount,
    recommendedServicesMin,
    activeServicesCount: bizServices.length,
    activeSpecialistsCount: bizSpecialists.length,
    openDaysCount: openDays.length,
    steps,
    incompleteSteps,
    nextIncompleteStep,
  };
}

/**
 * ویجت فوق‌العاده مینیمال و جمع‌وجور دایره‌ای + نواری برای سایدبار پنل کسب‌وکار
 * به محض رسیدن به ۱۰۰٪ به صورت خودکار مخفی می‌شود تا فضا اشغال نکند.
 */
export const SidebarProfileCompletionRing: React.FC<{
  summary: BusinessProfileCompletionSummary;
}> = ({ summary }) => {
  if (summary.totalPercent >= 100 || summary.incompleteSteps.length === 0) {
    return null;
  }

  const size = 36;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (summary.totalPercent / 100) * circumference;

  return (
    <div className="mt-2.5 rounded-xl border border-white/15 bg-white/10 p-2">
      <div className="flex items-center gap-2">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <svg
            className="h-9 w-9 -rotate-90 transform"
            viewBox={`0 0 ${size} ${size}`}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-white/20"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-[#00E5FF] transition-all duration-500"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-white tabular-nums">
            {toPersianDigits(summary.totalPercent)}٪
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-bold text-white">
              تکمیل پروفایل
            </span>
            <span className="shrink-0 text-[9px] font-bold text-[#00E5FF]">
              {toPersianDigits(summary.incompleteSteps.length)} مورد باقی‌مانده
            </span>
          </div>

          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-[#00E5FF] transition-all duration-500"
              style={{ width: `${summary.totalPercent}%` }}
            />
          </div>

          {summary.nextIncompleteStep ? (
            <Link
              to={summary.nextIncompleteStep.href}
              className="mt-1 flex items-center justify-between text-[10px] font-bold text-amber-300 hover:text-white"
            >
              <span className="truncate">
                + {summary.nextIncompleteStep.shortLabel} (
                {toPersianDigits(summary.nextIncompleteStep.weightPercent)}٪)
              </span>
              <ChevronLeft className="h-3 w-3 shrink-0" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/**
 * نوار و حلقه پیشرفت فوق‌العاده جمع‌وجور در بالای داشبورد کسب‌وکار (/app)
 * فقط موارد ناقص را نشان می‌دهد و هر مورد که کامل شود حذف می‌گردد؛
 * پس از تکمیل ۱۰۰٪ نیز کل این نوار به صورت خودکار مخفی می‌شود.
 */
export const BusinessProfileCompletionBanner: React.FC<{
  summary: BusinessProfileCompletionSummary;
}> = ({ summary }) => {
  if (summary.totalPercent >= 100 || summary.incompleteSteps.length === 0) {
    return null;
  }

  const size = 38;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (summary.totalPercent / 100) * circumference;

  const getStepIcon = (id: ProfileCompletionStep['id']) => {
    switch (id) {
      case 'basic_location':
        return <MapPin className="h-3 w-3" />;
      case 'services':
        return <Scissors className="h-3 w-3" />;
      case 'working_hours':
        return <Clock className="h-3 w-3" />;
      case 'specialists':
        return <Users className="h-3 w-3" />;
      case 'media_bio':
        return <Sparkles className="h-3 w-3" />;
    }
  };

  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* سمت راست: دایره کوچک درصد + نوار باریک */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9.5 w-9.5 shrink-0 items-center justify-center">
            <svg
              className="h-9.5 w-9.5 -rotate-90 transform"
              viewBox={`0 0 ${size} ${size}`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-200"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-[#0057FF] transition-all duration-500"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-[#061138] tabular-nums">
              {toPersianDigits(summary.totalPercent)}٪
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#061138]">
                تکمیل پروفایل سالن
              </span>
              <span className="rounded-md bg-[#E8EFFA] px-1.5 py-0.5 text-[10px] font-bold text-[#0057FF]">
                پلن {summary.planName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-28 sm:w-36 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0057FF] transition-all duration-500"
                  style={{ width: `${summary.totalPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#334155]">
                فقط موارد باقی‌مانده:
              </span>
            </div>
          </div>
        </div>

        {/* سمت چپ: فقط آیتم‌های تکمیل‌نشده (هر آیتم کامل شود، خودکار حذف می‌شود) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {summary.incompleteSteps.map((step) => (
            <Link
              key={step.id}
              to={step.href}
              title={step.statusHint}
              className="inline-flex items-center gap-1 rounded-full border border-[#0057FF]/30 bg-[#F3F6FC] px-2.5 py-1 text-[11px] font-extrabold text-[#061138] transition hover:border-[#0057FF] hover:bg-[#E0ECFF]"
            >
              <span className="text-[#0057FF]">{getStepIcon(step.id)}</span>
              <span>+ {step.shortLabel}</span>
              <span className="rounded-full bg-[#0057FF] px-1.5 py-0.2 text-[10px] font-black text-white tabular-nums">
                +{toPersianDigits(step.weightPercent)}٪
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
