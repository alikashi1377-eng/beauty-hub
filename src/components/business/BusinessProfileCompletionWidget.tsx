import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
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
  // برای سالن‌های جدید، تا زمانی که ساعات کاری را در پنل تایید/ذخیره نکنند یا روزهای باز مشخص نباشد، یادآوری می‌شود
  const isDefaultUntouchedHours =
    !business.workingHoursConfigured &&
    !business.isSampleShowcase &&
    !/^biz-[1-8]$/.test(business.id) &&
    bizServices.length === 0;
  const hasWorkingHours = openDays.length > 0 && !isDefaultUntouchedHours;

  // ۴. معرفی متخصصان متناسب با ظرفیت پلن (۲۰٪)
  const hasSpecialists = bizSpecialists.length >= 1;

  // ۵. تصویر پروفایل، بیوگرافی، اینستاگرام یا نمونه کار (۱۵٪)
  const hasMediaAndBio = Boolean(
    business.avatarUrl &&
      (business.instagramHandle?.trim() ||
        (business.aboutText && business.aboutText.trim().length >= 25) ||
        bizGallery.length > 0)
  );

  const steps: ProfileCompletionStep[] = [
    {
      id: 'basic_location',
      title: 'اطلاعات پایه، آدرس و لوکیشن نقشه',
      shortLabel: 'آدرس و لوکیشن',
      weightPercent: 20,
      completed: hasBasicAndLocation,
      href: '/app/profile',
      statusHint: hasBasicAndLocation
        ? `${business.city}، ${business.neighborhood}`
        : 'ثبت موقعیت روی نقشه و آدرس دقیق',
    },
    {
      id: 'services',
      title: 'تعریف خدمات قابل رزرو و تعرفه‌ها',
      shortLabel: 'خدمات و تعرفه‌ها',
      weightPercent: 25,
      completed: hasServices,
      href: '/app/services',
      statusHint: hasServices
        ? `${toPersianDigits(bizServices.length)} خدمت فعال (پیشنهاد پلن: حداقل ${toPersianDigits(recommendedServicesMin)} خدمت)`
        : 'هنوز خدمتی برای رزرو تعریف نشده است',
    },
    {
      id: 'working_hours',
      title: 'تنظیم دقیق روزها و ساعات کاری',
      shortLabel: 'روزها و ساعات کاری',
      weightPercent: 20,
      completed: hasWorkingHours,
      href: '/app/working-hours',
      statusHint: hasWorkingHours
        ? `${toPersianDigits(openDays.length)} روز کاری فعال در هفته`
        : 'روزها و ساعات خالی پذیرش را مشخص کنید',
    },
    {
      id: 'specialists',
      title: `معرفی متخصصان سالن (ظرفیت پلن: تا ${toPersianDigits(planStaffLimitCount)} نفر)`,
      shortLabel: 'تیم متخصصان',
      weightPercent: 20,
      completed: hasSpecialists,
      href: '/app/staff',
      statusHint: hasSpecialists
        ? `${toPersianDigits(bizSpecialists.length)} از ${toPersianDigits(planStaffLimitCount)} ظرفیت پلن ${planName}`
        : `ثبت متخصص (سقف پلن شما: ${toPersianDigits(planStaffLimitCount)} نفر)`,
    },
    {
      id: 'media_bio',
      title: 'تصویر سالن، بیوگرافی و نمونه کار',
      shortLabel: 'تصویر و معرفی',
      weightPercent: 15,
      completed: hasMediaAndBio,
      href: '/app/profile',
      statusHint: hasMediaAndBio
        ? 'تصویر و معرفی سالن کامل است'
        : 'افزودن عکس، پیج اینستاگرام یا درباره سالن',
    },
  ];

  const totalPercent = steps.reduce(
    (sum, step) => sum + (step.completed ? step.weightPercent : 0),
    0
  );

  const nextIncompleteStep = steps.find((s) => !s.completed) ?? null;

  return {
    totalPercent,
    planName,
    planStaffLimitCount,
    recommendedServicesMin,
    activeServicesCount: bizServices.length,
    activeSpecialistsCount: bizSpecialists.length,
    openDaysCount: openDays.length,
    steps,
    nextIncompleteStep,
  };
}

/**
 * ویجت فوق‌العاده مینیمال و جمع‌وجور دایره‌ای + نواری برای سایدبار پنل کسب‌وکار
 */
export const SidebarProfileCompletionRing: React.FC<{
  summary: BusinessProfileCompletionSummary;
}> = ({ summary }) => {
  const size = 40;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (summary.totalPercent / 100) * circumference;

  const isComplete = summary.totalPercent >= 100;

  return (
    <div className="mt-3 rounded-xl border border-slate-700/80 bg-slate-800/75 p-2.5">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
          <svg className="h-10 w-10 -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-700"
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
              className={
                isComplete
                  ? 'text-emerald-400 transition-all duration-500'
                  : 'text-rose-400 transition-all duration-500'
              }
            />
          </svg>
          <span className="absolute text-[10px] font-black text-white">
            {toPersianDigits(summary.totalPercent)}٪
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[11px] font-bold text-slate-200">
              تکمیل پروفایل سالن
            </span>
            <span className="shrink-0 rounded bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
              {summary.planName}
            </span>
          </div>

          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-l from-rose-500 to-amber-400'
              }`}
              style={{ width: `${summary.totalPercent}%` }}
            />
          </div>

          {summary.nextIncompleteStep ? (
            <Link
              to={summary.nextIncompleteStep.href}
              className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-amber-300 hover:text-amber-200"
            >
              <span className="truncate">
                گام بعدی: {summary.nextIncompleteStep.shortLabel} (+
                {toPersianDigits(summary.nextIncompleteStep.weightPercent)}٪)
              </span>
              <ChevronLeft className="h-3 w-3 shrink-0" />
            </Link>
          ) : (
            <p className="mt-1 text-[10px] font-semibold text-emerald-400">
              پروفایل شما ۱۰۰٪ آماده پذیرش نوبت است
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * نوار و حلقه پیشرفت مینیمال در بالای داشبورد کسب‌وکار (/app)
 * با تگ‌های کلیک‌پذیر برای تکمیل سریع خدمات، ساعات کاری، متخصصان و لوکیشن
 */
export const BusinessProfileCompletionBanner: React.FC<{
  summary: BusinessProfileCompletionSummary;
}> = ({ summary }) => {
  const size = 54;
  const strokeWidth = 4.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (summary.totalPercent / 100) * circumference;

  const isComplete = summary.totalPercent >= 100;

  const getStepIcon = (id: ProfileCompletionStep['id']) => {
    switch (id) {
      case 'basic_location':
        return <MapPin className="h-3.5 w-3.5" />;
      case 'services':
        return <Scissors className="h-3.5 w-3.5" />;
      case 'working_hours':
        return <Clock className="h-3.5 w-3.5" />;
      case 'specialists':
        return <Users className="h-3.5 w-3.5" />;
      case 'media_bio':
        return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
        isComplete
          ? 'border-emerald-200/90 bg-gradient-to-l from-emerald-50/70 via-white to-white'
          : 'border-slate-200/90 bg-white shadow-xs'
      }`}
    >
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* بخش راست: دایره پیشرفت و نوار وضعیت نسبت به پلن */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg
              className="h-14 w-14 -rotate-90 transform"
              viewBox={`0 0 ${size} ${size}`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100"
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
                className={
                  isComplete
                    ? 'text-emerald-500 transition-all duration-500'
                    : summary.totalPercent >= 60
                      ? 'text-violet-600 transition-all duration-500'
                      : 'text-rose-500 transition-all duration-500'
                }
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-black text-slate-900">
                {toPersianDigits(summary.totalPercent)}٪
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">
                پیشرفت تکمیل پروفایل سالن
              </h3>
              <span className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-800">
                متناسب با پلن: {summary.planName} (ظرفیت تا{' '}
                {toPersianDigits(summary.planStaffLimitCount)} متخصص)
              </span>
            </div>

            {/* نوار خطی مینیمال */}
            <div className="mt-2 flex items-center gap-2.5">
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isComplete
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-l from-rose-500 via-violet-500 to-emerald-500'
                  }`}
                  style={{ width: `${summary.totalPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {isComplete
                  ? 'کامل و آماده رزرو آنلاین'
                  : `${toPersianDigits(
                      summary.steps.filter((s) => s.completed).length
                    )} از ${toPersianDigits(summary.steps.length)} بخش تکمیل شده`}
              </span>
            </div>
          </div>
        </div>

        {/* بخش چپ: تگ‌های تعاملی هر بخش با درصد تاثیر */}
        <div className="flex flex-wrap items-center gap-1.5">
          {summary.steps.map((step) =>
            step.completed ? (
              <Link
                key={step.id}
                to={step.href}
                title={step.statusHint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100/80"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{step.shortLabel}</span>
                <span className="text-[10px] text-emerald-600">
                  ({toPersianDigits(step.weightPercent)}٪)
                </span>
              </Link>
            ) : (
              <Link
                key={step.id}
                to={step.href}
                title={step.statusHint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-black text-rose-800 shadow-2xs transition hover:border-rose-300 hover:bg-rose-100"
              >
                <Circle className="h-3 w-3 text-rose-500" />
                {getStepIcon(step.id)}
                <span>تکمیل {step.shortLabel}</span>
                <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  +{toPersianDigits(step.weightPercent)}٪
                </span>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
};
