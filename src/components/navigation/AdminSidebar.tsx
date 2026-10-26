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

import { TimetoLogo } from '../ui/TimetoLogo';

export interface AdminNavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: '/admin',
    label: 'داشبورد و تاییدها',
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
    label: 'تراکنش‌های مالی',
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
      <div className="lg:hidden bg-[#061138] text-white px-4 py-3 flex items-center justify-between border-b border-[#1E293B]">
        <TimetoLogo size="sm" theme="dark" subtitle="مدیریت پلتفرم" />
        <button
          type="button"
          onClick={() => setMobileOpen((p) => !p)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0057FF] text-xs font-bold cursor-pointer"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>منوی مدیریت</span>
        </button>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden bg-[#061138] text-slate-200 px-4 py-3 grid grid-cols-2 gap-2 border-b border-[#1E293B]">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 p-2.5 rounded-2xl text-xs ${
                  isActive
                    ? 'bg-[#0057FF] text-white font-bold shadow-[0_4px_12px_rgba(0,87,255,0.4)]'
                    : 'bg-white/10 text-slate-200'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ) : null}

      <aside
        aria-label="منوی پنل مدیریت پلتفرم"
        className="hidden lg:flex lg:flex-col w-[268px] shrink-0 bg-[#061138] text-white border-l border-[#1E293B] min-h-screen"
      >
        <div className="p-5 border-b border-[#1E293B] space-y-2">
          <TimetoLogo size="md" theme="dark" subtitle="پنل مدیریت کلان پلتفرم" />
          <p className="text-xs font-normal text-slate-300 pt-1">
            بررسی و تایید سالن‌ها، کاربران و اشتراک‌ها
          </p>
          <Link
            to="/"
            className="mt-2 inline-block text-xs font-bold text-[#00E5FF] hover:text-white transition-colors"
          >
            ← بازگشت به وب‌سایت عمومی
          </Link>
        </div>

        <nav className="flex-1 p-3.5 space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-[#0057FF] text-white shadow-[0_6px_16px_-4px_rgba(0,87,255,0.45)]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E293B] text-[11px] text-slate-400 leading-relaxed">
          پنل مدیریت Timeto (تایم تو)
        </div>
      </aside>
    </>
  );
};
