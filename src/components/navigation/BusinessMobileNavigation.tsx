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
      <div className="bg-white border-b border-[#E6E0F5] px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-[#1E1B2E] truncate">
          {currentBusiness?.name || 'پنل مدیریت سالن'}
        </span>
        <button
          type="button"
          onClick={() => setDrawerOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6E0F5] text-xs font-semibold text-[#1E1B2E] bg-[#FAF8FF] hover:bg-[#EDE9FE] cursor-pointer shrink-0 transition-colors"
          aria-expanded={drawerOpen}
          aria-label="فهرست کامل بخش‌های پنل کسب‌وکار"
        >
          {drawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>منوی کامل پنل</span>
        </button>
      </div>

      <nav
        aria-label="ناوبری سریع موبایل پنل کسب‌وکار"
        className="bg-[#F3EEFF] border-b border-[#E6E0F5] px-3 py-1.5 grid grid-cols-4 gap-1"
      >
        {primaryQuickTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#8B5CF6] text-white font-semibold shadow-[0_4px_12px_rgba(139,92,246,0.3)]'
                  : 'text-[#6B6480] hover:bg-white'
              }`
            }
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      {drawerOpen ? (
        <div className="bg-white border-b border-[#E6E0F5] p-4 shadow-lg space-y-4">
          {BUSINESS_NAV_GROUPS.map((group) => (
            <div key={group} className="space-y-1.5">
              <p className="text-[11px] font-bold text-[#6B6480]">{group}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUSINESS_NAV_ITEMS.filter((i) => i.group === group).map(
                  (item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 p-2.5 rounded-2xl text-xs font-medium border ${
                          isActive
                            ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] font-semibold'
                            : 'bg-[#FAF8FF] text-[#6B6480] border-[#E6E0F5] hover:bg-[#EDE9FE] hover:text-[#7C3AED]'
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
