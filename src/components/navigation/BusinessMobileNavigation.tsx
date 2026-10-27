import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  X,
} from 'lucide-react';
import { BUSINESS_NAV_GROUPS, BUSINESS_NAV_ITEMS } from './BusinessSidebar';
import { usePrototypeData } from '../../context/PrototypeDataContext';

export const BusinessMobileNavigation: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { currentBusiness } = usePrototypeData();

  const primaryQuickTabs = [
    {
      to: '/app',
      label: 'پیشخوان',
      end: true,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      to: '/app/calendar',
      label: 'تقویم',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      to: '/app/appointments',
      label: 'رزروها',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      to: '/app/services',
      label: 'خدمات',
      icon: <Scissors className="w-4 h-4" />,
    },
  ];

  return (
    <div className="lg:hidden">
      <div className="bg-white border-b border-[#CBD5E1] px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-[#061138] truncate">
          {currentBusiness?.name || 'پنل مدیریت سالن'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#EF4444]/30 text-xs font-extrabold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج به سایت</span>
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#CBD5E1] text-xs font-bold text-[#061138] bg-[#F3F6FC] hover:bg-[#E0ECFF] cursor-pointer shrink-0 transition-colors"
            aria-expanded={drawerOpen}
            aria-label="فهرست کامل بخش‌های پنل کسب‌وکار"
          >
            {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>منوی پنل</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="ناوبری سریع موبایل پنل کسب‌وکار"
        className="bg-[#E0ECFF]/60 border-b border-[#CBD5E1] px-3 py-1.5 grid grid-cols-4 gap-1"
      >
        {primaryQuickTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#0057FF] text-white shadow-[0_4px_12px_rgba(0,87,255,0.35)]'
                  : 'text-[#334155] hover:bg-white'
              }`
            }
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {drawerOpen ? (
        <div className="bg-white border-b border-[#CBD5E1] p-4 shadow-lg space-y-4">
          {BUSINESS_NAV_GROUPS.map((group) => (
            <div key={group} className="space-y-1.5">
              <p className="text-[11px] font-extrabold text-[#334155]">{group}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUSINESS_NAV_ITEMS.filter((i) => i.group === group).map(
                  (item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold border ${
                          isActive
                            ? 'bg-[#0057FF] text-white border-[#0057FF]'
                            : 'bg-[#F3F6FC] text-[#334155] border-[#CBD5E1] hover:bg-[#E0ECFF] hover:text-[#0057FF]'
                        }`
                      }
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
