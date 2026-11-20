import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Check,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  Scissors,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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
  id:
    | 'basic_location'
    | 'services'
    | 'working_hours'
    | 'specialists'
    | 'financial_info'
    | 'media_bio';
  stepNumber: number;
  routePath: string;
  title: string;
  shortLabel: string;
  weightPercent: number;
  completed: boolean;
  href: string;
  statusHint: string;
}

export interface BusinessProfileCompletionSummary {
  totalPercent: number;
  completedStepsCount: number;
  totalStepsCount: number;
  isReadyForPublicShowcase: boolean;
  contractAccepted: boolean;
  hasBankInfo: boolean;
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

/** مسیرهایی که در حین ویزارد ۵ مرحله‌ای باز هستند تا کسب‌وکار مراحل را بدون سردرگمی تکمیل کند */
export const ONBOARDING_SETUP_ALLOWED_PATHS = [
  '/app',
  '/app/profile',
  '/app/services',
  '/app/working-hours',
  '/app/staff',
  '/app/subscription',
  '/app/settings',
];

export function isBusinessOnboardingRouteAllowed(pathname: string): boolean {
  return ONBOARDING_SETUP_ALLOWED_PATHS.includes(pathname);
}

export function computeBusinessProfileCompletion(params: {
  business: BusinessItem | null | undefined;
  services: ServiceItem[];
  specialists: SpecialistItem[];
  gallery?: GalleryItem[];
  plans?: SubscriptionPlanItem[];
}): BusinessProfileCompletionSummary {
  const { business, services, specialists, plans = [] } = params;

  const planName = business?.subscriptionPlan || 'پلن جامع و رایگان (کارمزدی)';
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

  const planStaffLimitCount = isVipPlan ? 15 : isProPlan ? 8 : 10;
  const recommendedServicesMin = 1;

  if (!business) {
    return {
      totalPercent: 0,
      completedStepsCount: 0,
      totalStepsCount: 5,
      isReadyForPublicShowcase: false,
      contractAccepted: false,
      hasBankInfo: false,
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
    (s) =>
      (s.businessId === business.id || s.businessId === business.slug) &&
      s.isActive !== false
  );
  const bizSpecialists = specialists.filter(
    (sp) =>
      (sp.businessId === business.id || sp.businessId === business.slug) &&
      sp.isActive !== false
  );
  const openDays = (business.workingHours || []).filter((h) => h.isOpen);

  // ۱. مشخصات پایه، آدرس، بیوگرافی کوتاه و لوکیشن نقشه (۲۰٪ - الزامی)
  const hasBasicAndLocation = Boolean(
    business.name?.trim() &&
      business.address?.trim() &&
      business.address.trim().length >= 4 &&
      Boolean(business.mapLat) &&
      Boolean(business.mapLng)
  );

  // ۲. تعریف خدمات قابل رزرو و تعرفه‌ها (۲۵٪ - الزامی)
  const hasServices = bizServices.length >= 1;

  // ۳. تنظیم دقیق روزها و ساعات کاری هفتگی (۲۰٪ - الزامی)
  const hasWorkingHours =
    openDays.length > 0 && Boolean(business.workingHoursConfigured);

  // ۴. معرفی متخصص سالن (۱۵٪ - الزامی)
  const hasSpecialists = bizSpecialists.length >= 1;

  // ۵. اطلاعات مالی (شماره کارت/شبا و درصد بیعانه جهت تسویه هفتگی) (۲۰٪ - الزامی)
  const cleanCard = (business.bankCardNumber || '').replace(/\D/g, '');
  const cleanSheba = (business.bankShebaNumber || '')
    .replace(/^IR/i, '')
    .replace(/\D/g, '');
  const hasBankInfo = cleanCard.length >= 16 || cleanSheba.length >= 24;
  const contractAccepted = Boolean(business.contractAccepted) || hasBankInfo;
  const hasFinancialInfo = hasBankInfo;

  const steps: ProfileCompletionStep[] = [
    {
      id: 'basic_location',
      stepNumber: 1,
      routePath: '/app/profile',
      title: 'گام ۱: مشخصات سالن، عکس پروفایل و نشانی دقیق',
      shortLabel: '۱. مشخصات و نشانی',
      weightPercent: 20,
      completed: hasBasicAndLocation,
      href: '/app/profile?setup=1',
      statusHint:
        'انتخاب عکس پروفایل و بنر، نام کسب‌وکار، معرفی کوتاه و ثبت آدرس دقیق',
    },
    {
      id: 'services',
      stepNumber: 2,
      routePath: '/app/services',
      title: 'گام ۲: تعریف خدمات و تعرفه‌ها (حداقل ۱ خدمت فعال)',
      shortLabel: '۲. خدمات و تعرفه‌ها',
      weightPercent: 25,
      completed: hasServices,
      href: '/app/services?setup=1',
      statusHint:
        'تعریف حداقل یک خدمت یا پکیج فعال با قیمت و زمان انجام جهت رزرو آنلاین',
    },
    {
      id: 'working_hours',
      stepNumber: 3,
      routePath: '/app/working-hours',
      title: 'گام ۳: تنظیم روزها و ساعات کاری هفتگی',
      shortLabel: '۳. ساعات کاری',
      weightPercent: 20,
      completed: hasWorkingHours,
      href: '/app/working-hours?setup=1',
      statusHint:
        'تعیین روزهای باز بودن سالن و ساعات پذیرش (تک‌شیفت یا دو شیفته)',
    },
    {
      id: 'specialists',
      stepNumber: 4,
      routePath: '/app/staff',
      title: 'گام ۴: معرفی متخصص سالن (حداقل ۱ متخصص فعال)',
      shortLabel: '۴. معرفی متخصص',
      weightPercent: 15,
      completed: hasSpecialists,
      href: '/app/staff?setup=1',
      statusHint:
        'ثبت خودتان یا اعضای تیم به عنوان متخصص فعال جهت انتخاب در نوبت‌دهی',
    },
    {
      id: 'financial_info',
      stepNumber: 5,
      routePath: '/app/subscription',
      title: 'گام ۵: ثبت شبا/کارت و تعیین درصد بیعانه آنلاین',
      shortLabel: '۵. شبا و درصد بیعانه',
      weightPercent: 20,
      completed: hasFinancialInfo,
      href: '/app/subscription?setup=1',
      statusHint:
        'ثبت شماره شبا/کارت جهت تسویه هفتگی بیعانه‌ها و انتخاب درصد بیعانه آنلاین',
    },
  ];

  const totalPercent = steps.reduce(
    (sum, step) => sum + (step.completed ? step.weightPercent : 0),
    0
  );
  const completedStepsCount = steps.filter((s) => s.completed).length;

  const incompleteSteps = steps.filter((s) => !s.completed);
  const nextIncompleteStep = incompleteSteps[0] ?? null;
  const isReadyForPublicShowcase = incompleteSteps.length === 0;

  return {
    totalPercent,
    completedStepsCount,
    totalStepsCount: steps.length,
    isReadyForPublicShowcase,
    contractAccepted,
    hasBankInfo,
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
 * بررسی اینکه آیا کسب‌وکار شرایط نمایش عمومی در ویترین مشتریان را دارد یا خیر.
 */
export function isBusinessReadyForPublicDisplay(params: {
  business: BusinessItem;
  services: ServiceItem[];
  specialists?: SpecialistItem[];
}): boolean {
  const { business, services, specialists = [] } = params;
  if (business.approvalStatus !== 'APPROVED') return false;
  if (business.isSampleShowcase || /^biz-[1-8]$/.test(business.id))
    return false;
  if (business.contractAccepted === false) return false;

  const summary = computeBusinessProfileCompletion({
    business,
    services,
    specialists,
  });
  if (summary.isReadyForPublicShowcase) return true;

  const bizServices = services.filter(
    (s) =>
      (s.businessId === business.id || s.businessId === business.slug) &&
      s.isActive !== false
  );
  if (
    bizServices.length >= 1 &&
    Boolean(business.address?.trim()) &&
    (Boolean(business.contractAccepted) ||
      Boolean(business.verifiedBadge) ||
      Boolean(business.isVipPartner) ||
      Boolean(business.isSponsored))
  ) {
    return true;
  }

  return false;
}

const getStepIcon = (id: ProfileCompletionStep['id']) => {
  switch (id) {
    case 'basic_location':
      return <MapPin className="h-4 w-4" />;
    case 'services':
      return <Scissors className="h-4 w-4" />;
    case 'working_hours':
      return <Clock className="h-4 w-4" />;
    case 'specialists':
      return <Users className="h-4 w-4" />;
    case 'financial_info':
      return <CreditCard className="h-4 w-4" />;
    case 'media_bio':
      return <Sparkles className="h-4 w-4" />;
  }
};

/**
 * ویجت دایره‌ای پیشرفت در بالای سایدبار پنل کسب‌وکار
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
    <div className="mt-2.5 rounded-xl border border-amber-400/30 bg-amber-500/15 p-2.5">
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
              className="text-amber-300 transition-all duration-500"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-white tabular-nums">
            {toPersianDigits(summary.totalPercent)}٪
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-[10px] font-bold text-amber-200">
              ویزارد ۵ مرحله‌ای راه‌اندازی
            </span>
            <span className="shrink-0 text-[9px] font-bold text-white">
              {toPersianDigits(summary.completedStepsCount)} از{' '}
              {toPersianDigits(summary.totalStepsCount)} گام
            </span>
          </div>

          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-amber-300 transition-all duration-500"
              style={{ width: `${summary.totalPercent}%` }}
            />
          </div>

          {summary.nextIncompleteStep ? (
            <Link
              to={summary.nextIncompleteStep.href}
              className="mt-1 flex items-center justify-between text-[10px] font-bold text-white hover:text-amber-200"
            >
              <span className="truncate">
                ادامه: {summary.nextIncompleteStep.shortLabel}
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
 * محاسبه مسیر مرحله بعدی پس از ذخیره هر بخش از ویزارد ۵ مرحله‌ای
 * اگر همه ۵ مرحله تکمیل شده باشند، مستقیم به پیشخوان اصلی (/app) هدایت می‌شود.
 */
export function resolveNextOnboardingStepHref(params: {
  business: BusinessItem | null | undefined;
  services: ServiceItem[];
  specialists: SpecialistItem[];
  currentStepId?: ProfileCompletionStep['id'];
}): { nextHref: string; nextTitle: string; isAllCompleted: boolean } {
  const summary = computeBusinessProfileCompletion({
    business: params.business,
    services: params.services,
    specialists: params.specialists,
  });

  if (summary.incompleteSteps.length === 0) {
    return {
      nextHref: '/app',
      nextTitle: 'پیشخوان اصلی کسب‌وکار',
      isAllCompleted: true,
    };
  }

  // اگر مرحله فعلی مشخص شده باشد، ابتدا اولین مرحله ناقصِ بعد از مرحله فعلی را پیدا کن
  if (params.currentStepId) {
    const currentIdx = summary.steps.findIndex(
      (s) => s.id === params.currentStepId
    );
    const nextAfterCurrent = summary.steps
      .slice(currentIdx + 1)
      .find((s) => !s.completed);
    if (nextAfterCurrent) {
      return {
        nextHref: nextAfterCurrent.href,
        nextTitle: nextAfterCurrent.shortLabel,
        isAllCompleted: false,
      };
    }
  }

  const fallbackNext = summary.incompleteSteps[0];
  return {
    nextHref: fallbackNext.href,
    nextTitle: fallbackNext.shortLabel,
    isAllCompleted: false,
  };
}

const COMPACT_STEP_LABELS: Record<ProfileCompletionStep['id'], string> = {
  basic_location: 'مشخصات',
  services: 'خدمات',
  working_hours: 'ساعت کاری',
  specialists: 'متخصص',
  financial_info: 'شبا و بیعانه',
  media_bio: 'گالری',
};

/**
 * استپر افقی یک‌ردیفه ۵ مرحله‌ای بالای صفحات راه‌اندازی کسب‌وکار (موبایل و دسکتاپ)
 * بدون نوشته‌های اضافی — هر مرحله در یک ردیف بالا قرار دارد و با ذخیره هر بخش به مرحله بعد می‌رود.
 */
export const BusinessProfileCompletionBanner: React.FC<{
  summary: BusinessProfileCompletionSummary;
}> = ({ summary }) => {
  const location = useLocation();
  const pathname = location.pathname;

  if (summary.totalPercent >= 100 || summary.incompleteSteps.length === 0) {
    return null;
  }

  const currentStepOnRoute =
    summary.steps.find((s) => s.routePath === pathname) ?? null;
  const currentStepIndex = currentStepOnRoute
    ? summary.steps.findIndex((s) => s.id === currentStepOnRoute.id)
    : -1;
  const prevStep =
    currentStepIndex > 0 ? summary.steps[currentStepIndex - 1] : null;
  const nextSequentialStep =
    currentStepIndex >= 0 && currentStepIndex < summary.steps.length - 1
      ? summary.steps[currentStepIndex + 1]
      : summary.nextIncompleteStep;

  return (
    <div
      data-testid="business-onboarding-stepper-banner"
      className="rounded-2xl border border-[#0057FF]/30 bg-white p-2.5 sm:p-3.5 shadow-2xs space-y-2.5"
    >
      {/* ردیف компакт بالای استپر: شماره گام فعلی + دکمه مرحله بعد/قبل */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#E0ECFF] px-2.5 py-0.5 text-[11px] font-black text-[#0057FF] shrink-0">
            <span>
              گام{' '}
              {toPersianDigits(
                currentStepOnRoute?.stepNumber ??
                  summary.nextIncompleteStep?.stepNumber ??
                  1
              )}{' '}
              از ۵
            </span>
          </span>
          <span className="text-xs font-black text-[#061138] truncate">
            {currentStepOnRoute
              ? currentStepOnRoute.shortLabel
              : 'تکمیل پروفایل سالن'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {prevStep ? (
            <Link
              to={prevStep.href}
              className="inline-flex items-center gap-0.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-extrabold text-[#334155] hover:bg-slate-100"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              <span>قبلی</span>
            </Link>
          ) : null}

          {currentStepOnRoute?.completed && nextSequentialStep ? (
            <Link
              to={nextSequentialStep.href}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-black text-white shadow-2xs hover:bg-emerald-700"
            >
              <span>مرحله بعد</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          ) : summary.nextIncompleteStep &&
            pathname !== summary.nextIncompleteStep.routePath ? (
            <Link
              to={summary.nextIncompleteStep.href}
              className="inline-flex items-center gap-1 rounded-xl bg-[#0057FF] px-3 py-1 text-[11px] font-black text-white shadow-2xs hover:bg-[#0046CC]"
            >
              <span>ادامه: {COMPACT_STEP_LABELS[summary.nextIncompleteStep.id]}</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 text-[10px] font-black text-[#059669] tabular-nums">
              {toPersianDigits(summary.totalPercent)}٪
            </span>
          )}
        </div>
      </div>

      {/* ۵ مرحله در یک ردیف افقی یکپارچه (هم در موبایل هم دسکتاپ) */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {summary.steps.map((step) => {
          const isCurrentRoute = pathname === step.routePath;
          const isNextTarget =
            !isCurrentRoute && summary.nextIncompleteStep?.id === step.id;

          return (
            <Link
              key={step.id}
              to={step.href}
              aria-current={isCurrentRoute ? 'step' : undefined}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 px-1 text-center transition-all ${
                step.completed
                  ? isCurrentRoute
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/25'
                    : 'border-emerald-300 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/70'
                  : isCurrentRoute
                    ? 'border-[#0057FF] bg-[#0057FF] text-white shadow-xs ring-2 ring-[#0057FF]/25'
                    : isNextTarget
                      ? 'border-[#0057FF] bg-[#EFF6FF] text-[#061138]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:border-[#CBD5E1]'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                  step.completed
                    ? 'bg-emerald-600 text-white'
                    : isCurrentRoute
                      ? 'bg-white text-[#0057FF]'
                      : isNextTarget
                        ? 'bg-[#0057FF] text-white'
                        : 'bg-slate-200 text-slate-700'
                }`}
              >
                {step.completed ? (
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                ) : (
                  toPersianDigits(step.stepNumber)
                )}
              </span>

              <span
                className={`text-[10px] sm:text-xs font-extrabold truncate max-w-full leading-tight ${
                  step.completed
                    ? 'text-emerald-950'
                    : isCurrentRoute
                      ? 'text-white'
                      : 'text-[#061138]'
                }`}
              >
                {COMPACT_STEP_LABELS[step.id]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/**
 * محیط خلوت و سریع ویزارد ۵ مرحله‌ای در صفحه اصلی پیشخوان (/app)
 * کسب‌وکارهایی که روند تکمیل پروفایل را نیمه‌کاره رها کرده‌اند، با یک کلیک از همان مرحله باقی‌مانده ادامه می‌دهند.
 */
export const BusinessOnboardingWizardWorkspace: React.FC<{
  summary: BusinessProfileCompletionSummary;
  businessName?: string;
  lockedFeatureTitle?: string;
}> = ({ summary, businessName, lockedFeatureTitle }) => {
  return (
    <div
      data-testid="business-onboarding-wizard-workspace"
      className="max-w-2xl mx-auto space-y-3.5"
    >
      {lockedFeatureTitle ? (
        <div className="rounded-2xl border border-amber-400 bg-amber-50 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Lock className="h-4 w-4" />
            </span>
            <p className="text-xs font-black text-amber-950 truncate">
              بخش «{lockedFeatureTitle}» پس از تکمیل ۵ گام باز می‌شود
            </p>
          </div>
          {summary.nextIncompleteStep ? (
            <Link
              to={summary.nextIncompleteStep.href}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0057FF] px-3 py-2 text-xs font-black text-white"
            >
              <span>ادامه</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* کارت اصلی وضعیت و ۵ مرحله در یک ردیف بالا */}
      <div className="rounded-3xl bg-white border-2 border-[#0057FF]/30 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E0ECFF] px-2.5 py-0.5 text-[11px] font-black text-[#0057FF]">
              {toPersianDigits(summary.completedStepsCount)} از ۵ مرحله انجام شده (
              {toPersianDigits(summary.totalPercent)}٪)
            </span>
            <h1 className="text-sm sm:text-base font-black text-[#061138] mt-1">
              {businessName
                ? `راه‌اندازی پنل «${businessName}»`
                : 'راه‌اندازی ۵ مرحله‌ای پنل کسب‌وکار'}
            </h1>
          </div>

          {summary.nextIncompleteStep ? (
            <Link
              to={summary.nextIncompleteStep.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] px-4 py-2.5 text-xs font-black text-white shadow-xs transition"
            >
              <span>
                ادامه گام {toPersianDigits(summary.nextIncompleteStep.stepNumber)}
              </span>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        {/* ۵ مرحله در یک ردیف افقی بالای کارت */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {summary.steps.map((step) => {
            const isCurrentNext = summary.nextIncompleteStep?.id === step.id;
            return (
              <Link
                key={step.id}
                to={step.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2.5 px-1 text-center transition-all ${
                  step.completed
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    : isCurrentNext
                      ? 'border-[#0057FF] bg-[#0057FF] text-white shadow-xs ring-2 ring-[#0057FF]/20'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                    step.completed
                      ? 'bg-emerald-600 text-white'
                      : isCurrentNext
                        ? 'bg-white text-[#0057FF]'
                        : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {step.completed ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  ) : (
                    toPersianDigits(step.stepNumber)
                  )}
                </span>
                <span className="text-[10px] sm:text-xs font-extrabold truncate max-w-full">
                  {COMPACT_STEP_LABELS[step.id]}
                </span>
              </Link>
            );
          })}
        </div>

        {/* لیست جمع‌وجور مراحل برای انتخاب سریع */}
        <div className="space-y-2 pt-1">
          {summary.steps.map((step) => {
            const isCurrentNext = summary.nextIncompleteStep?.id === step.id;
            return (
              <Link
                key={step.id}
                to={step.href}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all ${
                  step.completed
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                    : isCurrentNext
                      ? 'border-[#0057FF] bg-[#EFF6FF] text-[#061138] shadow-2xs'
                      : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#0057FF]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                      step.completed
                        ? 'bg-emerald-600 text-white'
                        : isCurrentNext
                          ? 'bg-[#0057FF] text-white'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {step.completed ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      toPersianDigits(step.stepNumber)
                    )}
                  </span>
                  <span className="text-xs sm:text-sm font-black truncate">
                    {step.shortLabel}
                  </span>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-black ${
                    step.completed
                      ? 'bg-white text-emerald-700 border border-emerald-200'
                      : isCurrentNext
                        ? 'bg-[#0057FF] text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>
                    {step.completed
                      ? 'تکمیل ✓'
                      : isCurrentNext
                        ? 'ادامه این مرحله'
                        : 'ورود'}
                  </span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

