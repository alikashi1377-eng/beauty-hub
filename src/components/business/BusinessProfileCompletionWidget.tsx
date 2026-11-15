import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CreditCard,
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
  id:
    | 'basic_location'
    | 'services'
    | 'working_hours'
    | 'specialists'
    | 'financial_info'
    | 'media_bio';
  title: string;
  shortLabel: string;
  weightPercent: number;
  completed: boolean;
  href: string;
  statusHint: string;
}

export interface BusinessProfileCompletionSummary {
  totalPercent: number;
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
    (s) => s.businessId === business.id && s.isActive !== false
  );
  const bizSpecialists = specialists.filter(
    (sp) => sp.businessId === business.id && sp.isActive !== false
  );
  const openDays = (business.workingHours || []).filter((h) => h.isOpen);

  // ۱. مشخصات پایه، آدرس، بیوگرافی کوتاه و لوکیشن نقشه (۲۰٪ - الزامی)
  const hasBasicAndLocation = Boolean(
    business.name?.trim() &&
      business.address?.trim() &&
      business.phoneDisplay?.trim() &&
      business.mapLat &&
      business.mapLng
  );

  // ۲. تعریف خدمات قابل رزرو و تعرفه‌ها (۲۵٪ - الزامی)
  const hasServices = bizServices.length >= 1;

  // ۳. تنظیم دقیق روزها و ساعات کاری هفتگی (۲۰٪ - الزامی)
  const hasWorkingHours =
    openDays.length > 0 && Boolean(business.workingHoursConfigured);

  // ۴. معرفی متخصص سالن (۱۵٪ - الزامی)
  const hasSpecialists = bizSpecialists.length >= 1;

  // ۵. اطلاعات مالی (شماره کارت/شبا) + مطالعه و تیک تایید مفاد قرارداد همکاری (۲۰٪ - الزامی)
  // نکته: گالری تصاویر کاملاً اختیاری است و مانع نمایش عمومی سالن نمی‌شود.
  const cleanCard = (business.bankCardNumber || '').replace(/\D/g, '');
  const cleanSheba = (business.bankShebaNumber || '')
    .replace(/^IR/i, '')
    .replace(/\D/g, '');
  const hasBankInfo = cleanCard.length >= 16 || cleanSheba.length >= 24;
  const contractAccepted = Boolean(business.contractAccepted);
  const hasFinancialInfo = hasBankInfo && contractAccepted;

  const steps: ProfileCompletionStep[] = [
    {
      id: 'basic_location',
      title: 'گام ۱: مشخصات سالن، آدرس، عکس پروفایل و موقعیت نقشه',
      shortLabel: '۱. مشخصات و لوکیشن نقشه',
      weightPercent: 20,
      completed: hasBasicAndLocation,
      href: '/app/profile?setup=1',
      statusHint: 'ثبت آدرس دقیق، توضیحات و موقعیت روی نقشه (گالری اختیاری است)',
    },
    {
      id: 'services',
      title: 'گام ۲: تعریف حداقل ۱ خدمت قابل رزرو و تعرفه',
      shortLabel: '۲. تعریف خدمات و تعرفه',
      weightPercent: 25,
      completed: hasServices,
      href: '/app/services?setup=1',
      statusHint: 'تعریف حداقل یک خدمت فعال با قیمت واقعی جهت رزرو آنلاین',
    },
    {
      id: 'working_hours',
      title: 'گام ۳: تنظیم دقیق روزها و ساعات کاری (تک‌شیفت یا دوشیفت)',
      shortLabel: '۳. روزها و ساعات کاری',
      weightPercent: 20,
      completed: hasWorkingHours,
      href: '/app/working-hours?setup=1',
      statusHint: 'تعیین و ذخیره روزهای کاری و ساعات پذیرش صبح و عصر',
    },
    {
      id: 'specialists',
      title: 'گام ۴: معرفی حداقل ۱ متخصص فعال سالن',
      shortLabel: '۴. معرفی متخصص',
      weightPercent: 15,
      completed: hasSpecialists,
      href: '/app/staff?setup=1',
      statusHint: 'ثبت حداقل یک متخصص و عکس پروفایل جهت نوبت‌دهی',
    },
    {
      id: 'financial_info',
      title: 'گام ۵: ثبت شماره شبا/کارت و تیک تایید مفاد قرارداد همکاری',
      shortLabel: !hasBankInfo
        ? '۵. شماره شبا و تایید قرارداد'
        : '۵. تیک تایید مفاد قرارداد',
      weightPercent: 20,
      completed: hasFinancialInfo,
      href: '/app/subscription?setup=1',
      statusHint:
        'ثبت شماره شبا/کارت جهت واریز هفتگی + مطالعه و تیک تایید مفاد قرارداد همکاری',
    },
  ];

  const totalPercent = steps.reduce(
    (sum, step) => sum + (step.completed ? step.weightPercent : 0),
    0
  );

  const incompleteSteps = steps.filter((s) => !s.completed);
  const nextIncompleteStep = incompleteSteps[0] ?? null;
  const isReadyForPublicShowcase = incompleteSteps.length === 0;

  return {
    totalPercent,
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
 * (گالری تصاویر اختیاری است؛ اما مشخصات پایه، حداقل ۱ خدمت، ساعت کاری و شبا/تایید قرارداد یا تایید مدیریت الزامی است)
 */
export function isBusinessReadyForPublicDisplay(params: {
  business: BusinessItem;
  services: ServiceItem[];
  specialists?: SpecialistItem[];
}): boolean {
  const { business, services, specialists = [] } = params;
  if (business.approvalStatus !== 'APPROVED') return false;
  if (business.isSampleShowcase || /^biz-[1-8]$/.test(business.id)) return false;

  const summary = computeBusinessProfileCompletion({
    business,
    services,
    specialists,
  });
  if (summary.isReadyForPublicShowcase) return true;

  // سالن‌های منتخب/تاییدشده قبلی که حداقل ۱ خدمت فعال و آدرس دارند یا سفیر برند هستند
  const bizServices = services.filter(
    (s) => s.businessId === business.id && s.isActive !== false
  );
  if (
    (business.verifiedBadge || business.isVipPartner || business.isSponsored) &&
    bizServices.length >= 1 &&
    Boolean(business.address?.trim())
  ) {
    return true;
  }

  return false;
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
              عدم نمایش در ویترین تا تکمیل
            </span>
            <span className="shrink-0 text-[9px] font-bold text-white">
              {toPersianDigits(summary.incompleteSteps.length)} گام مانده
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
 * نوار و حلقه پیشرفت مرحله‌به‌مرحله در بالای پنل کسب‌وکار (/app)
 * به کسب‌وکار اعلام می‌کند که تکمیل این گام‌ها (به ویژه تیک مفاد قرارداد) برای نمایش در ویترین عمومی الزامی است و گالری اختیاری است.
 */
export const BusinessProfileCompletionBanner: React.FC<{
  summary: BusinessProfileCompletionSummary;
}> = ({ summary }) => {
  if (summary.totalPercent >= 100 || summary.incompleteSteps.length === 0) {
    return null;
  }

  const size = 44;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (summary.totalPercent / 100) * circumference;

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
      case 'financial_info':
        return <CreditCard className="h-3.5 w-3.5" />;
      case 'media_bio':
        return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-l from-amber-50 via-white to-blue-50/60 p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <svg
              className="h-11 w-11 -rotate-90 transform"
              viewBox={`0 0 ${size} ${size}`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-amber-200/70"
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
            <span className="absolute text-[11px] font-black text-[#061138] tabular-nums">
              {toPersianDigits(summary.totalPercent)}٪
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-[#061138]">
                ⚠️ تکمیل مرحله‌به‌مرحله پروفایل جهت نمایش سالن در ویترین عمومی تایم‌تو الزامی است
              </span>
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900">
                گالری تصاویر اختیاری است ✓
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold leading-5 text-slate-700">
              تا زمان تکمیل موارد زیر (به‌ویژه{' '}
              <span className="font-black text-rose-700">
                مطالعه و تیک تایید مفاد قرارداد همکاری و ثبت شبا
              </span>
              )، پروفایل سالن شما برای مشتریان عادی نمایش داده نمی‌شود. روی گام بعدی کلیک کنید:
            </p>
          </div>
        </div>

        {summary.nextIncompleteStep ? (
          <Link
            to={summary.nextIncompleteStep.href}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0057FF] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-[#0046CC]"
          >
            <span>تکمیل گام فعلی: {summary.nextIncompleteStep.shortLabel}</span>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {/* نمایش گام‌ها به صورت استپر مرحله‌به‌مرحله */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-amber-200/70 pt-2.5">
        {summary.steps.map((step) => (
          <Link
            key={step.id}
            to={step.href}
            title={step.statusHint}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-extrabold transition ${
              step.completed
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : summary.nextIncompleteStep?.id === step.id
                  ? 'border-[#0057FF] bg-[#E8F1FF] text-[#061138] ring-2 ring-[#0057FF]/20'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-[#0057FF]'
            }`}
          >
            <span className={step.completed ? 'text-emerald-600' : 'text-[#0057FF]'}>
              {getStepIcon(step.id)}
            </span>
            <span>{step.shortLabel}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                step.completed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0057FF] text-white'
              }`}
            >
              {step.completed ? 'تکمیل ✓' : `+${toPersianDigits(step.weightPercent)}٪`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

