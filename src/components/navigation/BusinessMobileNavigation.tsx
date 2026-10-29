import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Scissors,
  Settings,
  Sparkles,
  Store,
  UserCircle2,
  Users,
  Wallet,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { computeBusinessProfileCompletion } from '../business/BusinessProfileCompletionWidget';
import { toPersianDigits } from '../../utils/formatters';
import { AppointmentStatus } from '../../types';

export interface BusinessSubTabItem {
  to: string;
  label: string;
  shortDesc?: string;
  end?: boolean;
  icon: React.ReactNode;
}

export interface BusinessPrimaryNavGroup {
  id: 'dashboard' | 'bookings' | 'salon' | 'customers' | 'finance';
  label: string;
  defaultPath: string;
  matchPaths: string[];
  icon: React.ReactNode;
  subTabs: BusinessSubTabItem[];
}

export const BUSINESS_PRIMARY_NAV_GROUPS: BusinessPrimaryNavGroup[] = [
  {
    id: 'dashboard',
    label: 'پیشخوان',
    defaultPath: '/app',
    matchPaths: ['/app'],
    icon: <LayoutDashboard className="w-5 h-5" />,
    subTabs: [],
  },
  {
    id: 'bookings',
    label: 'نوبت‌ها',
    defaultPath: '/app/appointments',
    matchPaths: ['/app/appointments', '/app/calendar'],
    icon: <CalendarDays className="w-5 h-5" />,
    subTabs: [
      {
        to: '/app/appointments',
        label: 'لیست رزروها و تایید نوبت',
        icon: <ClipboardList className="w-4 h-4" />,
      },
      {
        to: '/app/calendar',
        label: 'تقویم روزانه و هفتگی',
        icon: <CalendarDays className="w-4 h-4" />,
      },
    ],
  },
  {
    id: 'salon',
    label: 'سالن من',
    defaultPath: '/app/services',
    matchPaths: [
      '/app/services',
      '/app/staff',
      '/app/working-hours',
      '/app/gallery',
      '/app/profile',
      '/app/settings',
    ],
    icon: <Store className="w-5 h-5" />,
    subTabs: [
      {
        to: '/app/services',
        label: 'خدمات و تعرفه‌ها',
        icon: <Scissors className="w-4 h-4" />,
      },
      {
        to: '/app/staff',
        label: 'متخصصان سالن',
        icon: <Users className="w-4 h-4" />,
      },
      {
        to: '/app/working-hours',
        label: 'روزها و ساعات کاری',
        icon: <CalendarClock className="w-4 h-4" />,
      },
      {
        to: '/app/gallery',
        label: 'گالری نمونه‌کار',
        icon: <Image className="w-4 h-4" />,
      },
      {
        to: '/app/profile',
        label: 'پروفایل و شبا',
        icon: <Store className="w-4 h-4" />,
      },
      {
        to: '/app/settings',
        label: 'تنظیمات و قوانین',
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
  {
    id: 'customers',
    label: 'مشتریان',
    defaultPath: '/app/customers',
    matchPaths: ['/app/customers', '/app/marketing'],
    icon: <Users className="w-5 h-5" />,
    subTabs: [
      {
        to: '/app/customers',
        label: 'پرونده و ثبت دستی مشتریان',
        icon: <UserCircle2 className="w-4 h-4" />,
      },
      {
        to: '/app/marketing',
        label: 'پیامک و باشگاه مشتریان',
        icon: <Megaphone className="w-4 h-4" />,
      },
    ],
  },
  {
    id: 'finance',
    label: 'مالی و پلن',
    defaultPath: '/app/analytics',
    matchPaths: ['/app/analytics', '/app/subscription'],
    icon: <Wallet className="w-5 h-5" />,
    subTabs: [
      {
        to: '/app/analytics',
        label: 'گزارش درآمد و عملکرد',
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        to: '/app/subscription',
        label: 'اشتراک و تبلیغات ویژه',
        icon: <CreditCard className="w-4 h-4" />,
      },
    ],
  },
];

/** تشخیص گروه اصلی فعال بر اساس مسیر فعلی پنل کسب‌وکار */
export function resolveActiveBusinessGroup(
  pathname: string
): BusinessPrimaryNavGroup {
  const normalized = pathname.replace(/\/+$/, '') || '/app';
  if (normalized === '/app') {
    return BUSINESS_PRIMARY_NAV_GROUPS[0];
  }
  const found = BUSINESS_PRIMARY_NAV_GROUPS.find(
    (g) =>
      g.id !== 'dashboard' &&
      g.matchPaths.some(
        (mp) => normalized === mp || normalized.startsWith(`${mp}/`)
      )
  );
  return found ?? BUSINESS_PRIMARY_NAV_GROUPS[0];
}

/**
 * ۱. منوی پروفایل و آواتار سالن‌دار در هدر بالای پیشخوان
 * جایگزین دکمه‌های تکراری «خروج از پیشخوان» و «خروج به سایت»
 */
export const BusinessAvatarProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { authUser, currentBusiness, businesses, logoutUser } =
    usePrototypeData();

  const biz = currentBusiness ?? businesses[0];
  const salonName = biz?.name || 'سالن زیبایی شما';
  const ownerName = authUser?.fullName || biz?.ownerName || 'مدیر سالن';
  const avatarUrl = biz?.avatarUrl;
  const businessSlug = biz?.slug || 'royal-golzar';
  const planName = biz?.subscriptionPlan || 'شروع رایگان (پایه)';

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleLogoutAccount = () => {
    setOpen(false);
    logoutUser();
    navigate('/');
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="منوی حساب و پروفایل سالن"
        className="inline-flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#F3F6FC] hover:bg-[#E0ECFF] border border-[#CBD5E1] transition-colors cursor-pointer"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={salonName}
            className="w-8 h-8 rounded-full object-cover border border-[#0057FF]/30 shrink-0"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-[#061138] text-[#00E5FF] text-xs font-black flex items-center justify-center shrink-0">
            {salonName.slice(0, 1)}
          </span>
        )}
        <div className="hidden sm:block text-right max-w-[130px]">
          <p className="text-[11px] font-extrabold text-[#061138] truncate leading-tight">
            {ownerName}
          </p>
          <p className="text-[10px] font-semibold text-[#64748B] truncate leading-tight">
            پروفایل و خروج
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#334155] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="گزینه‌های پروفایل سالن‌دار"
          className="absolute left-0 mt-2 w-64 rounded-3xl bg-white border border-[#CBD5E1] shadow-[0_20px_50px_-12px_rgba(6,17,56,0.28)] p-2.5 z-50 space-y-1.5 text-right"
        >
          {/* خلاصه اطلاعات سالن و پلن فعال */}
          <div className="p-3 rounded-2xl bg-[#F3F6FC] border border-[#E2E8F0] space-y-1">
            <p className="text-xs font-black text-[#061138] truncate">
              {salonName}
            </p>
            <p className="text-[11px] font-medium text-[#475569] truncate">
              مدیر: {ownerName}
            </p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[10px] font-extrabold">
              <Sparkles className="w-3 h-3" />
              <span>پلن: {planName}</span>
            </span>
          </div>

          <div className="py-1 space-y-1">
            <Link
              to={`/salon/${businessSlug}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#061138] hover:bg-[#F3F6FC] transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#0057FF]" />
                <span>مشاهده ویترین آنلاین سالن</span>
              </span>
            </Link>

            <Link
              to="/app/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#061138] hover:bg-[#F3F6FC] transition-colors"
            >
              <Store className="w-4 h-4 text-[#0057FF]" />
              <span>ویرایش مشخصات و شماره شبا</span>
            </Link>

            <Link
              to="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold text-[#061138] hover:bg-[#F3F6FC] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#475569]" />
              <span>تنظیمات و قوانین رزرو</span>
            </Link>
          </div>

          <div className="pt-1.5 border-t border-[#E2E8F0] space-y-1">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-extrabold text-[#0057FF] bg-[#F3F6FC] hover:bg-[#E0ECFF] transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>بازگشت به صفحه اصلی سایت (مشتریان)</span>
            </Link>

            <button
              type="button"
              onClick={handleLogoutAccount}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-extrabold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/**
 * ۲. نوار تب‌های زیرمجموعه (Sub-Category Tabs)
 * وقتی کاربر وارد یکی از دسته‌های اصلی پایین صفحه (نوبت‌ها، سالن من، مشتریان، مالی و پلن) می‌شود،
 * تب‌های زیرمجموعه آن بخش در بالای صفحه نمایش داده می‌شوند تا با یک لمس جابه‌جا شود.
 */
export const BusinessCategorySubTabs: React.FC = () => {
  const location = useLocation();
  const { currentBusiness, services, specialists, gallery, plans } =
    usePrototypeData();

  const activeGroup = resolveActiveBusinessGroup(location.pathname);

  if (activeGroup.subTabs.length === 0) {
    return null;
  }

  const completionSummary = computeBusinessProfileCompletion({
    business: currentBusiness,
    services,
    specialists,
    gallery,
    plans,
  });

  const incompleteStepByHref = new Map(
    completionSummary.steps
      .filter((s) => !s.completed)
      .map((s) => [s.href.split('#')[0], s.weightPercent])
  );

  return (
    <div
      aria-label={`زیرمجموعه‌های بخش ${activeGroup.label}`}
      className="bg-white/95 backdrop-blur-md border-b border-[#CBD5E1] px-4 sm:px-6 py-2.5 sticky top-[61px] z-10"
    >
      <div className="max-w-[1140px] mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-black text-[#64748B] shrink-0 pl-2 border-l border-[#E2E8F0]">
          بخش {activeGroup.label}:
        </span>
        {activeGroup.subTabs.map((sub) => {
          const bonusPct = incompleteStepByHref.get(sub.to);
          return (
            <NavLink
              key={sub.to}
              to={sub.to}
              end={sub.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#0057FF] text-white shadow-[0_6px_16px_-4px_rgba(0,87,255,0.45)]'
                    : 'bg-[#F3F6FC] text-[#334155] border border-[#CBD5E1] hover:bg-[#E0ECFF] hover:text-[#0057FF]'
                }`
              }
            >
              {sub.icon}
              <span>{sub.label}</span>
              {bonusPct ? (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                  +{toPersianDigits(bonusPct)}٪
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ۳. منوی نواری چسبان پایین صفحه (Sticky Bottom Navigation Bar)
 * شامل ۵ دسته اصلی کسب‌وکار: پیشخوان | نوبت‌ها | سالن من | مشتریان | مالی و پلن
 */
export const BusinessStickyBottomNav: React.FC = () => {
  const location = useLocation();
  const {
    appointments,
    currentBusiness,
    services,
    specialists,
    gallery,
    plans,
  } = usePrototypeData();

  const activeGroup = resolveActiveBusinessGroup(location.pathname);

  const pendingCount = appointments.filter(
    (a) => a.status === AppointmentStatus.Pending
  ).length;

  const completionSummary = computeBusinessProfileCompletion({
    business: currentBusiness,
    services,
    specialists,
    gallery,
    plans,
  });

  const incompleteSalonStepsCount = completionSummary.steps.filter(
    (s) => !s.completed
  ).length;

  return (
    <nav
      aria-label="منوی چسبان پایین پنل کسب‌وکار"
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-xl border-t border-[#CBD5E1] shadow-[0_-8px_30px_rgba(6,17,56,0.1)] px-2 sm:px-6 py-1.5"
    >
      <div className="max-w-[760px] mx-auto grid grid-cols-5 gap-1">
        {BUSINESS_PRIMARY_NAV_GROUPS.map((group) => {
          const isCurrentGroup = activeGroup.id === group.id;
          const targetHref = isCurrentGroup
            ? location.pathname
            : group.defaultPath;

          return (
            <Link
              key={group.id}
              to={targetHref}
              aria-current={isCurrentGroup ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-2xl transition-all ${
                isCurrentGroup
                  ? 'bg-[#0057FF] text-white shadow-[0_6px_18px_-4px_rgba(0,87,255,0.5)]'
                  : 'text-[#475569] hover:bg-[#F3F6FC] hover:text-[#061138]'
              }`}
            >
              <div className="relative">
                {group.icon}
                {group.id === 'bookings' && pendingCount > 0 ? (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center tabular-nums ${
                      isCurrentGroup
                        ? 'bg-[#00E5FF] text-[#061138]'
                        : 'bg-[#EF4444] text-white'
                    }`}
                  >
                    {toPersianDigits(pendingCount)}
                  </span>
                ) : null}
                {group.id === 'salon' && incompleteSalonStepsCount > 0 ? (
                  <span
                    className={`absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full border-2 ${
                      isCurrentGroup
                        ? 'bg-[#F59E0B] border-[#0057FF]'
                        : 'bg-[#F59E0B] border-white'
                    }`}
                  />
                ) : null}
              </div>
              <span className="text-[10px] sm:text-xs font-extrabold truncate max-w-full">
                {group.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

/** نگه داشتن خروجی سازگار برای ایمپورت‌های قبلی */
export const BusinessMobileNavigation: React.FC = () => {
  return <BusinessCategorySubTabs />;
};
