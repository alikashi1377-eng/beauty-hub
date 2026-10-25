import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Users,
  FolderTree,
  CreditCard,
  Receipt,
  PieChart,
  Settings,
  Menu,
  X,
} from 'lucide-react';

export interface AdminNavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: '/admin',
    label: 'داشبورد کلان',
    end: true,
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    to: '/admin/businesses',
    label: 'بررسی کسب‌وکارها',
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    to: '/admin/users',
    label: 'کاربران سامانه',
    icon: <Users className="w-4 h-4" />,
  },
  {
    to: '/admin/categories',
    label: 'دسته‌بندی خدمات',
    icon: <FolderTree className="w-4 h-4" />,
  },
  {
    to: '/admin/subscriptions',
    label: 'پلن‌ها و اشتراک‌ها',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    to: '/admin/payments',
    label: 'تراکنش‌های اشتراک',
    icon: <Receipt className="w-4 h-4" />,
  },
  {
    to: '/admin/reports',
    label: 'گزارش‌های تحلیلی',
    icon: <PieChart className="w-4 h-4" />,
  },
  {
    to: '/admin/settings',
    label: 'تنظیمات پلتفرم',
    icon: <Settings className="w-4 h-4" />,
  },
];

export const AdminSidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* نوار موبایل پنل ادمین */}
      <div className="lg:hidden bg-[#170B2B] text-white px-4 py-3 flex items-center justify-between border-b border-[#2D1950]">
        <span className="text-xs font-bold">
          کنسول مدیریت کلان BeautyHub
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen((p) => !p)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A0F54] text-xs font-semibold cursor-pointer"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>منوی مدیریت</span>
        </button>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden bg-[#170B2B] text-slate-200 px-4 py-3 grid grid-cols-2 gap-2 border-b border-[#2D1950]">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 p-2.5 rounded-xl text-xs ${
                  isActive
                    ? 'bg-[#9D174D] text-white font-bold'
                    : 'bg-white/5 text-slate-300'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ) : null}

      {/* سایدبار دسکتاپ پنل مدیریت */}
      <aside
        aria-label="منوی پنل مدیریت پلتفرم"
        className="hidden lg:flex lg:flex-col w-[272px] shrink-0 bg-[#170B2B] text-slate-100 border-l border-[#2D1950] min-h-screen"
      >
        <div className="p-5 border-b border-[#2D1950]">
          <p className="text-xs font-semibold text-pink-300">کنسول راهبری پلتفرم</p>
          <p dir="ltr" className="text-base font-bold text-white mt-0.5 text-right">
            BeautyHub Admin
          </p>
          <p className="text-xs font-normal text-slate-400 mt-1">
            نظارت بر کسب‌وکارها، اشتراک‌ها و دسته‌بندی‌ها
          </p>
          <Link
            to="/"
            className="mt-2.5 inline-block text-xs font-semibold text-pink-300 hover:text-white transition-colors"
          >
            ← بازگشت به صفحه اصلی سایت
          </Link>
        </div>

        <nav className="flex-1 p-3.5 space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#9D174D] text-white font-bold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </span>
              <span dir="ltr" className="text-[10px] font-mono opacity-60">
                {item.to.replace('/admin', '') || '/'}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#2D1950] text-[11px] text-slate-400 leading-relaxed">
          کنسول مدیریت یکپارچه BeautyHub
        </div>
      </aside>
    </>
  );
};
