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
  const { authUser, appointments, openAuthModal } = usePrototypeData();

  const activeAppointmentsCount = appointments.filter(
    (apt) => apt.status === 'CONFIRMED' || apt.status === 'PENDING'
  ).length;

  const navItems = [
    {
      to: '/',
      label: 'خانه',
      icon: Home,
      requiresAuth: false,
      isActive: pathname === '/',
    },
    {
      to: '/search',
      label: 'جست‌وجو',
      icon: Search,
      requiresAuth: false,
      isActive: pathname.startsWith('/search'),
    },
    {
      to: '/categories',
      label: 'دسته‌ها',
      icon: LayoutGrid,
      requiresAuth: false,
      isActive: pathname.startsWith('/categories'),
    },
    {
      to: '/me/appointments',
      label: 'نوبت‌ها',
      icon: CalendarCheck,
      requiresAuth: true,
      badge: activeAppointmentsCount > 0 ? activeAppointmentsCount : undefined,
      isActive:
        pathname.startsWith('/me/appointments') ||
        pathname.startsWith('/booking'),
    },
    {
      to: '/me',
      label: authUser ? 'پروفایل' : 'حساب من',
      icon: User,
      requiresAuth: true,
      isActive:
        pathname === '/me' ||
        pathname.startsWith('/me/profile') ||
        pathname.startsWith('/me/favorites') ||
        pathname.startsWith('/login'),
    },
  ];

  return (
    <nav
      aria-label="منوی دسترسی سریع پایین موبایل"
      className="lg:hidden fixed bottom-2.5 inset-x-3 z-40 rounded-3xl bg-[#041033]/98 backdrop-blur-xl border-2 border-[#0057FF]/80 ring-1 ring-[#00E5FF]/40 shadow-[0_18px_42px_-4px_rgba(0,45,160,0.65)] px-2 py-1.5"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => {
                if (item.requiresAuth && !authUser) {
                  e.preventDefault();
                  openAuthModal({
                    initialScreen: 'LOGIN',
                    defaultRole: 'CUSTOMER',
                    redirectTo: item.to,
                    promptReason:
                      item.to === '/me/appointments'
                        ? 'برای مشاهده و مدیریت نوبت‌ها، وارد شوید یا ثبت‌نام کنید'
                        : 'برای ورود به حساب کاربری خود، شماره موبایل را وارد کنید',
                  });
                  return;
                }
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className={() =>
                `relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-2xl transition-all ${
                  item.isActive
                    ? 'bg-gradient-to-r from-[#0057FF] to-[#00C2FF] text-white font-extrabold shadow-[0_4px_16px_rgba(0,229,255,0.5)] ring-1 ring-[#00E5FF]/60'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white font-bold'
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
