import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Scissors,
  Users,
  UserCircle2,
  Image,
  Store,
  Clock,
  Megaphone,
  BarChart3,
  CreditCard,
  Settings,
  ExternalLink,
  Plus,
  Check,
  Lock,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { TimetoLogo } from '../ui/TimetoLogo';
import {
  computeBusinessProfileCompletion,
  SidebarProfileCompletionRing,
} from '../business/BusinessProfileCompletionWidget';
import { toPersianDigits } from '../../utils/formatters';

export interface BusinessSidebarItem {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
  group: string;
}

export const BUSINESS_NAV_ITEMS: BusinessSidebarItem[] = [
  // ۱. فعالیت روزانه
  {
    to: '/app',
    label: 'پیشخوان روزانه',
    end: true,
    icon: <LayoutDashboard className="w-4 h-4" />,
    group: 'فعالیت روزانه',
  },
  {
    to: '/app/calendar',
    label: 'تقویم نوبت‌ها',
    icon: <CalendarDays className="w-4 h-4" />,
    group: 'فعالیت روزانه',
  },
  {
    to: '/app/appointments',
    label: 'رزروها',
    icon: <ClipboardList className="w-4 h-4" />,
    group: 'فعالیت روزانه',
  },
  // ۲. کسب‌وکار
  {
    to: '/app/services',
    label: 'خدمات و تعرفه‌ها',
    icon: <Scissors className="w-4 h-4" />,
    group: 'کسب‌وکار',
  },
  {
    to: '/app/staff',
    label: 'متخصصان',
    icon: <Users className="w-4 h-4" />,
    group: 'کسب‌وکار',
  },
  {
    to: '/app/working-hours',
    label: 'ساعات کاری',
    icon: <Clock className="w-4 h-4" />,
    group: 'کسب‌وکار',
  },
  {
    to: '/app/gallery',
    label: 'نمونه‌کارها',
    icon: <Image className="w-4 h-4" />,
    group: 'کسب‌وکار',
  },
  // ۳. مشتریان
  {
    to: '/app/customers',
    label: 'پرونده و سوابق',
    icon: <UserCircle2 className="w-4 h-4" />,
    group: 'مشتریان',
  },
  {
    to: '/app/marketing',
    label: 'باشگاه و کمپین‌ها',
    icon: <Megaphone className="w-4 h-4" />,
    group: 'مشتریان',
  },
  // ۴. مالی
  {
    to: '/app/analytics',
    label: 'گزارش‌ها و درآمد',
    icon: <BarChart3 className="w-4 h-4" />,
    group: 'مالی',
  },
  {
    to: '/app/subscription',
    label: 'شبا، بیعانه و تسویه',
    icon: <CreditCard className="w-4 h-4" />,
    group: 'مالی',
  },
  // ۵. تنظیمات
  {
    to: '/app/profile',
    label: 'اطلاعات سالن',
    icon: <Store className="w-4 h-4" />,
    group: 'تنظیمات',
  },
  {
    to: '/app/settings',
    label: 'تنظیمات و قوانین',
    icon: <Settings className="w-4 h-4" />,
    group: 'تنظیمات',
  },
];

export const BUSINESS_NAV_GROUPS = [
  'فعالیت روزانه',
  'کسب‌وکار',
  'مشتریان',
  'مالی',
  'تنظیمات',
];

const LOCKED_DURING_ONBOARDING_ITEMS: Array<{
  to: string;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    to: '/app/calendar',
    label: 'تقویم نوبت‌ها',
    icon: <CalendarDays className="w-4 h-4" />,
  },
  {
    to: '/app/appointments',
    label: 'مدیریت رزروها',
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    to: '/app/customers',
    label: 'پرونده مشتریان',
    icon: <UserCircle2 className="w-4 h-4" />,
  },
  {
    to: '/app/marketing',
    label: 'باشگاه و کمپین‌ها',
    icon: <Megaphone className="w-4 h-4" />,
  },
  {
    to: '/app/analytics',
    label: 'گزارش‌ها و دخل روزانه',
    icon: <BarChart3 className="w-4 h-4" />,
  },
];

export const BusinessSidebar: React.FC = () => {
  const { currentBusiness, services, specialists, gallery, plans } =
    usePrototypeData();
  const businessName = currentBusiness?.name || 'سالن زیبایی رویال گلزار';
  const businessSlug = currentBusiness?.slug || 'royal-golzar';

  const completionSummary = computeBusinessProfileCompletion({
    business: currentBusiness,
    services,
    specialists,
    gallery,
    plans,
  });

  const isOnboardingIncomplete = !completionSummary.isReadyForPublicShowcase;

  return (
    <aside
      aria-label="منوی پنل کسب‌وکار"
      className="hidden lg:flex lg:flex-col w-[264px] shrink-0 bg-white border-l border-[#CBD5E1] min-h-screen"
    >
      {/* هدر برند سایدبار */}
      <div className="p-5 border-b border-[#CBD5E1] bg-[#061138] text-white">
        <div className="flex items-center justify-between">
          <Link to="/">
            <TimetoLogo size="sm" theme="dark" subtitle="پنل مدیریت سالن" />
          </Link>
          {isOnboardingIncomplete ? (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/40">
              در حال راه‌اندازی
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/40">
              فعال
            </span>
          )}
        </div>

        <div className="mt-4 p-3 rounded-2xl bg-white/10 border border-white/15">
          <p className="text-xs font-extrabold text-white truncate">
            {businessName}
          </p>
          <Link
            to={`/salon/${businessSlug}`}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#00E5FF] hover:text-white transition-colors"
          >
            <span>مشاهده ویترین آنلاین</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* حلقه و نوار مینیمال درصد تکمیل پروفایل نسبت به پلن */}
        <SidebarProfileCompletionRing summary={completionSummary} />
      </div>

      {/* آیتم‌های ناوبری */}
      {isOnboardingIncomplete ? (
        <nav className="flex-1 p-3.5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <div className="px-3 flex items-center justify-between">
              <p className="text-[11px] font-extrabold text-[#0057FF]">
                مراحل راه‌اندازی (۵ گام)
              </p>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {toPersianDigits(completionSummary.completedStepsCount)}/۵
              </span>
            </div>

            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                `flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                  isActive
                    ? 'bg-[#E0ECFF] text-[#0057FF] font-extrabold border-r-4 border-[#0057FF] shadow-2xs'
                    : 'text-[#334155] font-semibold hover:bg-[#F3F6FC] hover:text-[#061138]'
                }`
              }
            >
              <span className="flex items-center gap-2.5 truncate">
                <LayoutDashboard className="w-4 h-4" />
                <span className="truncate">نمای کلی ویزارد ۵ مرحله‌ای</span>
              </span>
            </NavLink>

            {completionSummary.steps.map((step) => {
              const isNextTarget =
                completionSummary.nextIncompleteStep?.id === step.id;
              return (
                <NavLink
                  key={step.id}
                  to={step.routePath}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs transition-all ${
                      isActive
                        ? 'bg-[#E0ECFF] text-[#0057FF] font-extrabold border-r-4 border-[#0057FF] shadow-2xs'
                        : step.completed
                          ? 'bg-emerald-50/70 text-emerald-950 font-bold hover:bg-emerald-100/70'
                          : isNextTarget
                            ? 'bg-[#F8FAFC] text-[#061138] font-extrabold border border-[#0057FF]/35 hover:bg-[#E0ECFF]'
                            : 'text-[#475569] font-semibold hover:bg-[#F3F6FC]'
                    }`
                  }
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black ${
                        step.completed
                          ? 'bg-emerald-600 text-white'
                          : isNextTarget
                            ? 'bg-[#0057FF] text-white'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {step.completed ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        toPersianDigits(step.stepNumber)
                      )}
                    </span>
                    <span className="truncate">{step.shortLabel}</span>
                  </span>

                  {step.completed ? (
                    <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black text-white">
                      ✓
                    </span>
                  ) : isNextTarget ? (
                    <span className="shrink-0 rounded-full bg-[#0057FF] px-1.5 py-0.5 text-[9px] font-black text-white">
                      نوبت این گام
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>

          <div className="space-y-1 pt-2 border-t border-[#E2E8F0]">
            <p className="px-3 text-[11px] font-extrabold text-slate-400 flex items-center justify-between">
              <span>ابزارهای پنل (پس از گام ۵)</span>
              <Lock className="w-3.5 h-3.5" />
            </p>
            {LOCKED_DURING_ONBOARDING_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-2xl text-xs text-slate-400 hover:bg-slate-100 transition-all"
              >
                <span className="flex items-center gap-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                  <Lock className="w-2.5 h-2.5" />
                  <span>قفل</span>
                </span>
              </NavLink>
            ))}
          </div>
        </nav>
      ) : (
        <nav className="flex-1 p-3.5 space-y-4 overflow-y-auto">
          {BUSINESS_NAV_GROUPS.map((groupName) => {
            const groupItems = BUSINESS_NAV_ITEMS.filter(
              (i) => i.group === groupName
            );
            return (
              <div key={groupName} className="space-y-1">
                <p className="px-3 text-[11px] font-extrabold text-[#334155]">
                  {groupName}
                </p>
                {groupItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                        isActive
                          ? 'bg-[#E0ECFF] text-[#0057FF] font-extrabold border-r-4 border-[#0057FF] shadow-2xs'
                          : 'text-[#334155] font-semibold hover:bg-[#F3F6FC] hover:text-[#061138]'
                      }`
                    }
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      )}

      {/* دکمه‌های اقدام سریع و خروج از پیشخوان در پایین سایدبار */}
      <div className="p-4 border-t border-[#CBD5E1] bg-[#F3F6FC] space-y-2">
        {isOnboardingIncomplete && completionSummary.nextIncompleteStep ? (
          <Link
            to={completionSummary.nextIncompleteStep.href}
            className="w-full py-2.5 px-3.5 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.38)]"
          >
            <span>
              ادامه: {completionSummary.nextIncompleteStep.shortLabel} ←
            </span>
          </Link>
        ) : (
          <>
            <Link
              to="/app/customers?add=1"
              className="w-full py-2 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت دستی / گروهی مشتری</span>
            </Link>
            <Link
              to="/app/calendar"
              className="w-full py-2.5 px-3.5 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.38)]"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت نوبت و تقویم</span>
            </Link>
          </>
        )}
        <Link
          to="/"
          className="w-full py-2 px-3.5 rounded-full bg-white hover:bg-[#FEF2F2] border border-[#CBD5E1] hover:border-[#EF4444]/40 text-[#DC2626] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>خروج از پیشخوان و بازگشت به سایت</span>
        </Link>
      </div>
    </aside>
  );
};
