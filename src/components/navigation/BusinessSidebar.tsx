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
} from 'lucide-react';

export interface BusinessSidebarItem {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
  group: string;
}

export const BUSINESS_NAV_ITEMS: BusinessSidebarItem[] = [
  {
    to: '/app',
    label: 'پیشخوان عملکرد',
    end: true,
    icon: <LayoutDashboard className="w-4 h-4" />,
    group: 'عملیات روزانه',
  },
  {
    to: '/app/calendar',
    label: 'تقویم نوبت‌ها',
    icon: <CalendarDays className="w-4 h-4" />,
    group: 'عملیات روزانه',
  },
  {
    to: '/app/appointments',
    label: 'مدیریت نوبت‌ها',
    icon: <ClipboardList className="w-4 h-4" />,
    group: 'عملیات روزانه',
  },
  {
    to: '/app/services',
    label: 'خدمات و تعرفه‌ها',
    icon: <Scissors className="w-4 h-4" />,
    group: 'خدمات، تیم و مشتریان',
  },
  {
    to: '/app/staff',
    label: 'متخصصان و پرسنل',
    icon: <Users className="w-4 h-4" />,
    group: 'خدمات، تیم و مشتریان',
  },
  {
    to: '/app/customers',
    label: 'پرونده مشتریان',
    icon: <UserCircle2 className="w-4 h-4" />,
    group: 'خدمات، تیم و مشتریان',
  },
  {
    to: '/app/profile',
    label: 'پروفایل عمومی سالن',
    icon: <Store className="w-4 h-4" />,
    group: 'ویترین و رشد کسب‌وکار',
  },
  {
    to: '/app/gallery',
    label: 'گالری نمونه کارها',
    icon: <Image className="w-4 h-4" />,
    group: 'ویترین و رشد کسب‌وکار',
  },
  {
    to: '/app/working-hours',
    label: 'ساعات کاری هفتگی',
    icon: <Clock className="w-4 h-4" />,
    group: 'ویترین و رشد کسب‌وکار',
  },
  {
    to: '/app/marketing',
    label: 'بازاریابی و کمپین‌ها',
    icon: <Megaphone className="w-4 h-4" />,
    group: 'ویترین و رشد کسب‌وکار',
  },
  {
    to: '/app/analytics',
    label: 'گزارش‌ها و آمار',
    icon: <BarChart3 className="w-4 h-4" />,
    group: 'ویترین و رشد کسب‌وکار',
  },
  {
    to: '/app/subscription',
    label: 'اشتراک و ارتقا',
    icon: <CreditCard className="w-4 h-4" />,
    group: 'حساب و تنظیمات',
  },
  {
    to: '/app/settings',
    label: 'تنظیمات پنل',
    icon: <Settings className="w-4 h-4" />,
    group: 'حساب و تنظیمات',
  },
];

const NAV_GROUPS = [
  'عملیات روزانه',
  'خدمات، تیم و مشتریان',
  'ویترین و رشد کسب‌وکار',
  'حساب و تنظیمات',
];

export const BusinessSidebar: React.FC = () => {
  return (
    <aside
      aria-label="منوی پنل کسب‌وکار"
      className="hidden lg:flex lg:flex-col w-[272px] shrink-0 bg-white border-l border-[#E6E3EE] min-h-screen"
    >
      <div className="p-5 border-b border-[#E6E3EE] bg-[#FAF9FC]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#9D174D]">
            پنل مدیریت سالن
          </span>
          <span className="text-[11px] text-[#756F86]">پلن حرفه‌ای</span>
        </div>
        <p className="text-sm font-bold text-[#120F1D] mt-1 truncate">
          سالن زیبایی رویال گلزار
        </p>
        <Link
          to="/salon/royal-golzar"
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A0F54] hover:underline"
        >
          <span>مشاهده ویترین عمومی سالن</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <nav className="flex-1 p-3.5 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((groupName) => {
          const groupItems = BUSINESS_NAV_ITEMS.filter(
            (i) => i.group === groupName
          );
          return (
            <div key={groupName} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-[#756F86]">
                {groupName}
              </p>
              {groupItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#2A0F54] text-white font-semibold shadow-xs'
                        : 'text-[#4A4458] hover:bg-[#F4F3F8] hover:text-[#120F1D]'
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

      <div className="p-4 border-t border-[#E6E3EE] bg-[#F4F3F8] text-[11px] text-[#4A4458] leading-relaxed">
        نسخه نمایشی (Demo): تغییرات در حافظه مرورگر ذخیره می‌شود و نیازی به اتصال
        پایگاه داده ندارد.
      </div>
    </aside>
  );
};
