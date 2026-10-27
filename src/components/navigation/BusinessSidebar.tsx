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
  Sparkles,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { TimetoLogo } from '../ui/TimetoLogo';

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
    label: 'بیعانه و اشتراک',
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

export const BusinessSidebar: React.FC = () => {
  const { currentBusiness } = usePrototypeData();
  const businessName = currentBusiness?.name || 'سالن زیبایی رویال گلزار';
  const businessSlug = currentBusiness?.slug || 'royal-golzar';

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
          <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/40">
            فعال
          </span>
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
      </div>

      {/* آیتم‌های ناوبری با کنتراست بالا */}
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

      {/* دکمه‌های اقدام سریع و خروج از پیشخوان در پایین سایدبار */}
      <div className="p-4 border-t border-[#CBD5E1] bg-[#F3F6FC] space-y-2">
        <Link
          to="/app/calendar"
          className="w-full py-2.5 px-3.5 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.38)]"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت نوبت و تقویم</span>
        </Link>
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
