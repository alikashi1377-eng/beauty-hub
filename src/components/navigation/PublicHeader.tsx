import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  ChevronLeft,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { TimetoLogo } from '../ui/TimetoLogo';
import { PWAProfileInstallRow } from '../ui/PWAInstallPrompt';
import { toPersianDigits } from '../../utils/formatters';

export const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    authUser,
    ownedBusinessId,
    favoriteBusinessIds,
    favoriteSpecialistIds,
    adminNotifications,
    openAuthModal,
    logoutUser,
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

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const navItems = [
    { to: '/search', label: 'سالن‌ها', requiresAuth: false },
    { to: '/categories', label: 'دسته‌بندی‌ها', requiresAuth: false },
    { to: '/me/appointments', label: 'نوبت‌های من', requiresAuth: true },
    ...(!isLoggedInCustomerOnly
      ? [{ to: '/pricing', label: 'ویژه سالن‌داران', requiresAuth: false }]
      : []),
    { to: '/help', label: 'پشتیبانی', requiresAuth: false },
  ];

  const userInitial =
    authUser?.fullName?.trim()?.charAt(0) ||
    (isPlatformAdmin ? 'م' : isBusinessOwner ? 'س' : 'ک');

  const roleBadgeLabel = isPlatformAdmin
    ? 'مدیر کل پلتفرم'
    : isBusinessOwner
      ? 'صاحب سالن زیبایی'
      : 'مشتری تایم تو';

  return (
    <header className="bg-[#061138] text-white border-b border-[#1E293B] sticky top-0 z-30 shadow-[0_4px_20px_-6px_rgba(6,17,56,0.45)]">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 sm:py-3">
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

        {/* بخش کاربری و آواتار پروفایل (بدون منوی همبرگری در موبایل چون منوی چسبان پایین وجود دارد) */}
        <div
          ref={menuContainerRef}
          className="relative flex items-center gap-2 shrink-0"
        >
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-[#061138] bg-[#00E5FF] rounded-full hover:opacity-95 transition-all whitespace-nowrap shrink-0 shadow-[0_6px_16px_-4px_rgba(0,229,255,0.4)]"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>پیشخوان سالن</span>
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-[#0057FF] to-[#00A3FF] rounded-full hover:opacity-95 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>ثبت سالن</span>
            </button>
          ) : null}

          {/* دکمه یکپارچه پروفایل کاربری (موبایل و دسکتاپ) */}
          {authUser ? (
            <button
              type="button"
              id="public-header-profile-trigger"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-label="مشاهده حساب کاربری و پروفایل"
              className="inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full bg-white/10 hover:bg-white/18 border border-white/20 transition-all cursor-pointer"
            >
              <span className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#0057FF] to-[#00E5FF] text-[#061138] font-black text-xs inline-flex items-center justify-center shadow-inner shrink-0">
                {userInitial}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-[#061138]" />
                {unreadAdminCount > 0 ? (
                  <span className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-[#EF4444] text-[9px] text-white font-extrabold flex items-center justify-center">
                    {toPersianDigits(unreadAdminCount)}
                  </span>
                ) : null}
              </span>
              <span className="text-xs font-extrabold text-white max-w-[105px] truncate">
                {authUser.fullName || 'حساب من'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              id="public-header-profile-trigger"
              onClick={() =>
                openAuthModal({
                  initialScreen: 'LOGIN',
                  defaultRole: 'CUSTOMER',
                })
              }
              aria-label="ورود یا ثبت‌نام حساب کاربری"
              className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full bg-white/10 hover:bg-white/18 border border-[#00E5FF]/35 transition-all cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#0057FF]/30 border border-[#00E5FF]/40 text-[#00E5FF] inline-flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </span>
              <span className="text-xs font-extrabold text-white whitespace-nowrap">
                ورود / ثبت‌نام
              </span>
            </button>
          )}

          {/* پاپ‌اور اطلاعات حساب کاربری، دسترسی سریع، نصب اپ و خروج */}
          {authUser && profileMenuOpen ? (
            <div
              role="dialog"
              aria-label="منوی حساب کاربری"
              className="absolute left-0 top-[calc(100%+10px)] w-72 sm:w-80 rounded-3xl bg-white text-[#061138] border border-[#CBD5E1] shadow-[0_24px_60px_-15px_rgba(6,17,56,0.38)] p-3.5 z-50 space-y-2.5"
            >
              {/* مشخصات فرد واردشده */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#0057FF] to-[#00E5FF] text-white font-black text-base flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-extrabold text-[#061138] truncate">
                      {authUser.fullName || 'کاربر تایم تو'}
                    </p>
                  </div>
                  <p
                    dir="ltr"
                    className="text-[11px] font-mono font-bold text-[#0057FF] text-right tabular-nums"
                  >
                    {authUser.phone}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[10px] font-extrabold">
                    {roleBadgeLabel} · {authUser.defaultCity || 'اصفهان'}
                  </span>
                </div>
              </div>

              {/* لینک‌های سریع پروفایل */}
              <div className="space-y-1">
                {isPlatformAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-[#061138] text-white hover:opacity-95 text-xs font-extrabold transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                      <span>پنل مدیریت کلان پلتفرم</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {unreadAdminCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-extrabold">
                          {toPersianDigits(unreadAdminCount)}
                        </span>
                      ) : null}
                      <ChevronLeft className="w-4 h-4 text-[#00E5FF]" />
                    </span>
                  </Link>
                ) : null}

                {isBusinessOwner ? (
                  <Link
                    to="/app"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-[#EFF6FF] text-[#0057FF] hover:bg-[#DBEAFE] text-xs font-extrabold transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>پیشخوان مدیریت سالن من</span>
                    </span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                ) : null}

                <Link
                  to="/me"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F1F5F9] text-xs font-bold text-[#061138] transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0057FF]" />
                    <span>پیشخوان حساب کاربری</span>
                  </span>
                  <ChevronLeft className="w-3.5 h-3.5 text-[#64748B]" />
                </Link>

                <Link
                  to="/me/appointments"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F1F5F9] text-xs font-bold text-[#061138] transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#0057FF]" />
                    <span>نوبت‌های من</span>
                  </span>
                  <ChevronLeft className="w-3.5 h-3.5 text-[#64748B]" />
                </Link>

                <Link
                  to="/me/favorites"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F1F5F9] text-xs font-bold text-[#061138] transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#0057FF]" />
                    <span>سالن‌های ذخیره‌شده</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] tabular-nums">
                    {totalFavs > 0 ? toPersianDigits(totalFavs) : null}
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link
                  to="/me/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#F1F5F9] text-xs font-bold text-[#061138] transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#0057FF]" />
                    <span>ویرایش نام و شماره موبایل</span>
                  </span>
                  <ChevronLeft className="w-3.5 h-3.5 text-[#64748B]" />
                </Link>

                {/* آیتم کوچک نصب اپ در پروفایل (اگر قبلاً نصب شده باشد خودکار مخفی می‌شود) */}
                <PWAProfileInstallRow variant="menu-row" />
              </div>

              {/* دکمه خروج از حساب و ورود با شماره یا نقش دیگر */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    void logoutUser();
                    navigate('/');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-extrabold transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span>خروج از حساب کاربری</span>
                  </span>
                  <span className="text-[10px] font-semibold text-[#EF4444]">
                    تغییر حساب / نقش
                  </span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
