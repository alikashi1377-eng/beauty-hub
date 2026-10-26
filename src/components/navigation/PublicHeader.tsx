import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CalendarCheck, Menu, Search, Store, User, X } from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { TimetoLogo } from '../ui/TimetoLogo';
import { PWAInstallButton } from '../ui/PWAInstallPrompt';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authUser } = usePrototypeData();

  const navItems = [
    { to: '/search', label: 'جست‌وجوی سالن‌ها' },
    { to: '/categories', label: 'دسته‌بندی خدمات' },
    { to: '/pricing', label: 'تعرفه کسب‌وکارها' },
    { to: '/about', label: 'درباره تایم تو' },
    { to: '/help', label: 'راهنما' },
  ];

  return (
    <header className="bg-[#061138] text-white border-b border-[#1E293B] sticky top-0 z-30 shadow-[0_4px_20px_-6px_rgba(6,17,56,0.45)]">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* برند و هویت بصری Timeto */}
        <div className="flex items-center gap-6">
          <Link to="/" className="inline-flex items-center shrink-0">
            <TimetoLogo size="md" theme="dark" subtitle="تایم تو · رزرو آنلاین زیبایی" />
          </Link>

          {/* ناوبری اصلی دسکتاپ */}
          <nav
            aria-label="ناوبری اصلی عمومی"
            className="hidden lg:flex items-center gap-1.5 text-xs sm:text-sm font-semibold"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-full transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#0057FF] text-white font-extrabold shadow-[0_4px_14px_rgba(0,87,255,0.45)]'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* دکمه‌های کاربری، نصب اپ و ثبت کسب‌وکار */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton compact />

          <Link
            to="/search"
            aria-label="جست‌وجوی سریع سالن و خدمات"
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>جست‌وجو</span>
          </Link>

          {authUser ? (
            <Link
              to="/me"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-white/12 hover:bg-white/20 border border-white/20 rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{authUser.fullName || 'نوبت‌های من'}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>ورود / عضویت</span>
            </Link>
          )}

          <Link
            to="/business/register"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-[#0057FF] to-[#00A3FF] rounded-full hover:opacity-95 transition-all whitespace-nowrap shrink-0 shadow-[0_6px_16px_-4px_rgba(0,163,255,0.45)]"
          >
            <Store className="w-3.5 h-3.5" />
            <span>ثبت کسب‌وکار</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-full text-white hover:bg-white/10 cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'بستن منوی اصلی' : 'باز کردن منوی اصلی'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* منوی موبایل */}
      {mobileMenuOpen ? (
        <nav
          aria-label="منوی موبایل عمومی"
          className="lg:hidden border-t border-white/15 bg-[#091642] px-4 py-4 space-y-3 shadow-2xl"
        >
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-2xl text-sm font-bold ${
                    isActive
                      ? 'bg-[#0057FF] text-white'
                      : 'text-slate-200 hover:bg-white/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-white/15 grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-center text-white px-3 py-2.5 rounded-full bg-white/10 border border-white/15"
            >
              ورود با موبایل
            </Link>
            <Link
              to="/me"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-center text-white px-3 py-2.5 rounded-full bg-white/10 border border-white/15"
            >
              نوبت‌های من
            </Link>
            <Link
              to="/business/register"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-extrabold text-center text-white px-3 py-2.5 rounded-full bg-[#0057FF]"
            >
              ثبت رایگان سالن
            </Link>
            <Link
              to="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-extrabold text-center text-[#061138] px-3 py-2.5 rounded-full bg-[#00E5FF]"
            >
              پنل مدیریت سالن
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
};
