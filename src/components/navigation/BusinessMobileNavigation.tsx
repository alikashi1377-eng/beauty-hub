import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Scissors,
  X,
} from 'lucide-react';
import { BUSINESS_NAV_ITEMS } from './BusinessSidebar';

export const BusinessMobileNavigation: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      label: 'نوبت‌ها',
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
      <div className="bg-white border-b border-[#E6E3EE] px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-[#120F1D]">
          پنل کسب‌وکار · سالن رویال گلزار
        </span>
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D0CADF] text-xs font-semibold text-[#120F1D] bg-[#FAF9FC] cursor-pointer"
          aria-expanded={drawerOpen}
          aria-label="فهرست کامل بخش‌های پنل کسب‌وکار"
        >
          {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>همه بخش‌های پنل (۱۳)</span>
        </button>
      </div>

      <nav
        aria-label="ناوبری سریع موبایل پنل کسب‌وکار"
        className="bg-[#F4F3F8] border-b border-[#E6E3EE] px-3 py-1.5 grid grid-cols-4 gap-1"
      >
        {primaryQuickTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-[#2A0F54] text-white font-semibold'
                  : 'text-[#4A4458] hover:bg-white'
              }`
            }
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {drawerOpen ? (
        <div className="bg-white border-b border-[#D0CADF] p-4 shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BUSINESS_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium border ${
                    isActive
                      ? 'bg-[#2A0F54] text-white border-[#2A0F54] font-semibold'
                      : 'bg-[#FAF9FC] text-[#4A4458] border-[#E6E3EE] hover:bg-[#F4F3F8]'
                  }`
                }
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
