import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  CalendarCheck,
  Home,
  LayoutGrid,
  Search,
  User,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { toPersianDigits } from '../../utils/formatters';

export const PublicMobileBottomNav: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { authUser, appointments } = usePrototypeData();

  const activeAppointmentsCount = appointments.filter(
    (apt) => apt.status === 'CONFIRMED' || apt.status === 'PENDING'
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'خانه',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      to: '/search',
      label: 'جست‌وجو',
      icon: Search,
      isActive: pathname.startsWith('/search'),
    },
    {
      to: '/categories',
      label: 'دسته‌ها',
      icon: LayoutGrid,
      isActive: pathname.startsWith('/categories'),
    },
    {
      to: '/me/appointments',
      label: 'نوبت‌ها',
      icon: CalendarCheck,
      badge: activeAppointmentsCount > 0 ? activeAppointmentsCount : undefined,
      isActive:
        pathname.startsWith('/me/appointments') ||
        pathname.startsWith('/booking'),
    },
    {
      to: '/me',
      label: authUser ? 'پروفایل' : 'حساب من',
      icon: User,
      isActive:
        pathname === '/me' ||
        pathname.startsWith('/me/profile') ||
        pathname.startsWith('/me/favorites') ||
        pathname.startsWith('/login'),
    },
  ];

  // در صفحات رزرو که نوار ادامه رزرو پایین صفحه قرار دارد، جایگاه منوی پایین را هماهنگ نگه می‌داریم
  return (
    <nav
      aria-label="منوی دسترسی سریع پایین موبایل"
      className="lg:hidden fixed bottom-2.5 inset-x-3 z-40 rounded-3xl bg-[#061138]/92 backdrop-blur-xl border border-[#00E5FF]/25 shadow-[0_14px_34px_-6px_rgba(6,17,56,0.7)] px-2 py-1.5"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className={() =>
                `relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-2xl transition-all ${
                  item.isActive
                    ? 'bg-gradient-to-r from-[#0057FF] to-[#00B4FF] text-white font-extrabold shadow-[0_4px_14px_rgba(0,180,255,0.45)]'
                    : 'text-slate-300 hover:text-white font-semibold'
                }`
              }
            >
              <div className="relative flex items-center justify-center">
                <IconComponent
                  className={`w-4 h-4 transition-transform ${
                    item.isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                  }`}
                />
                {item.badge ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#00E5FF] text-[#061138] text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                    {toPersianDigits(item.badge)}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] leading-none whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
