import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  CalendarCheck,
  Heart,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Store,
  User,
  X,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { TimetoLogo } from '../ui/TimetoLogo';
import { toPersianDigits } from '../../utils/formatters';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    authUser,
    ownedBusinessId,
    favoriteBusinessIds,
    favoriteSpecialistIds,
    adminNotifications,
    openAuthModal,
  } = usePrototypeData();

  const totalFavs = favoriteBusinessIds.length + favoriteSpecialistIds.length;
  const isBusinessOwner =
    Boolean(ownedBusinessId) ||
    Boolean(authUser?.roles?.includes('BUSINESS_OWNER'));
  const isLoggedInCustomerOnly = Boolean(authUser && !isBusinessOwner);
  const isPlatformAdmin = Boolean(
    authUser?.isPlatformAdmin && authUser?.roles?.includes('PLATFORM_ADMIN')
  );
  const unreadAdminCount = isPlatformAdmin
    ? adminNotifications.filter((n) => !n.isRead).length
    : 0;

  const navItems = [
    { to: '/search', label: 'جست‌وجوی سالن‌ها', requiresAuth: false },
    { to: '/categories', label: 'دسته‌بندی خدمات', requiresAuth: false },
    { to: '/me/appointments', label: 'نوبت‌های من', requiresAuth: true },
    ...(!isLoggedInCustomerOnly
      ? [{ to: '/pricing', label: 'ویژه سالن‌داران', requiresAuth: false }]
      : []),
    { to: '/help', label: 'راهنما', requiresAuth: false },
  ];

  return (
    <header className="bg-[#061138] text-white border-b border-[#1E293B] sticky top-0 z-30 shadow-[0_4px_20px_-6px_rgba(6,17,56,0.45)]">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* برند و هویت بصری Timeto */}
        <div className="flex items-center gap-5">
          <Link to="/" className="inline-flex items-center shrink-0">
            <TimetoLogo size="md" theme="dark" />
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
                onClick={(e) => {
                  if (item.requiresAuth && !authUser) {
                    e.preventDefault();
                    openAuthModal({
                      initialScreen: 'LOGIN',
                      defaultRole: 'CUSTOMER',
                      redirectTo: item.to,
                      promptReason:
                        'برای مشاهده نوبت‌های خود، وارد شوید یا ثبت‌نام کنید',
                    });
                  }
                }}
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

        {/* دکمه‌های کاربری متناسب با نقش (مشتری عادی در برابر صاحب سالن) */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/me/favorites"
            onClick={(e) => {
              if (!authUser) {
                e.preventDefault();
                openAuthModal({
                  initialScreen: 'LOGIN',
                  defaultRole: 'CUSTOMER',
                  redirectTo: '/me/favorites',
                  promptReason:
                    'برای مشاهده سالن‌های ذخیره‌شده، وارد حساب خود شوید',
                });
              }
            }}
            aria-label="علاقه‌مندی‌های ذخیره‌شده"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full transition-colors"
          >
            <Heart className="w-3.5 h-3.5 text-[#00E5FF]" />
            {totalFavs > 0 ? (
              <span className="tabular-nums">{toPersianDigits(totalFavs)}</span>
            ) : null}
          </Link>

          {authUser ? (
            <Link
              to="/me"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/12 hover:bg-white/20 border border-white/20 rounded-full transition-colors whitespace-nowrap shrink-0"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{authUser.fullName || 'حساب من'}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                openAuthModal({
                  initialScreen: 'LOGIN',
                  defaultRole: 'CUSTOMER',
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>ورود / عضویت</span>
            </button>
          )}

          {isPlatformAdmin ? (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-[#061138] bg-[#00E5FF] rounded-full hover:opacity-95 transition-all whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>پنل مدیریت کلان</span>
              {unreadAdminCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold tabular-nums">
                  {toPersianDigits(unreadAdminCount)}
                </span>
              ) : null}
            </Link>
          ) : null}

          {isBusinessOwner ? (
            <Link
              to="/app"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-[#061138] bg-[#00E5FF] rounded-full hover:opacity-95 transition-all whitespace-nowrap shrink-0 shadow-[0_6px_16px_-4px_rgba(0,229,255,0.4)]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>پیشخوان سالن من</span>
            </Link>
          ) : !isLoggedInCustomerOnly ? (
            <button
              type="button"
              onClick={() =>
                openAuthModal({
                  initialScreen: 'REGISTER_STEP_1_PHONE',
                  defaultRole: 'BUSINESS_OWNER',
                  redirectTo: '/app',
                })
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-[#0057FF] to-[#00A3FF] rounded-full hover:opacity-95 transition-all whitespace-nowrap shrink-0 shadow-[0_6px_16px_-4px_rgba(0,163,255,0.45)] cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>ثبت سالن زیبایی</span>
            </button>
          ) : null}

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

      {/* منوی موبایل تفکیک‌شده برای مشتری و صاحب سالن */}
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
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (item.requiresAuth && !authUser) {
                    e.preventDefault();
                    openAuthModal({
                      initialScreen: 'LOGIN',
                      defaultRole: 'CUSTOMER',
                      redirectTo: item.to,
                    });
                  }
                }}
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

          <div className="pt-3 border-t border-white/15 space-y-2">
            {isPlatformAdmin ? (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 text-xs font-extrabold text-[#061138] px-3 py-2.5 rounded-full bg-[#00E5FF] shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ورود به پنل مدیریت کلان</span>
                {unreadAdminCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold tabular-nums">
                    {toPersianDigits(unreadAdminCount)} جدید
                  </span>
                ) : null}
              </Link>
            ) : null}

            {!authUser ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal({
                      initialScreen: 'LOGIN',
                      defaultRole: 'CUSTOMER',
                    });
                  }}
                  className="text-xs font-bold text-center text-white px-3 py-2.5 rounded-full bg-white/10 border border-white/15 cursor-pointer"
                >
                  ورود / ثبت‌نام مشتری
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal({
                      initialScreen: 'REGISTER_STEP_1_PHONE',
                      defaultRole: 'BUSINESS_OWNER',
                      redirectTo: '/app',
                    });
                  }}
                  className="text-xs font-extrabold text-center text-white px-3 py-2.5 rounded-full bg-[#0057FF] cursor-pointer"
                >
                  ثبت سالن زیبایی
                </button>
              </div>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
};
