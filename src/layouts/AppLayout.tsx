import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { PublicHeader } from '../components/navigation/PublicHeader';
import { PublicFooter } from '../components/navigation/PublicFooter';
import { PublicMobileBottomNav } from '../components/navigation/PublicMobileBottomNav';
import {
  BusinessAvatarProfileMenu,
  BusinessCategorySubTabs,
  BusinessStickyBottomNav,
} from '../components/navigation/BusinessMobileNavigation';
import { AdminSidebar } from '../components/navigation/AdminSidebar';
import { ARCHITECTURE_ROUTES } from '../config/designTokens';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ToastBanner } from '../components/ui/MarketplaceComponents';
import { PWAMobileInstallBanner } from '../components/ui/PWAInstallPrompt';
import {
  TIMETO_BRAND_LOGO_URL,
  TimetoStartupSplash,
} from '../components/ui/TimetoLogo';
import {
  getSavedVisitorRole,
  VISITOR_ROLE_EVENT,
  VisitorEntryRole,
} from '../components/home/timetoHomeData';
import { usePrototypeData } from '../context/PrototypeDataContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { TimetoAuthModal } from '../components/auth/TimetoAuthModal';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [visitorRole, setVisitorRole] = useState<VisitorEntryRole>(() =>
    getSavedVisitorRole()
  );
  const [bootSplashActive, setBootSplashActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !window.location.search.includes('autostart=1');
  });

  React.useEffect(() => {
    const syncRole = () => {
      setVisitorRole(getSavedVisitorRole());
    };
    window.addEventListener(VISITOR_ROLE_EVENT, syncRole);
    window.addEventListener('storage', syncRole);
    return () => {
      window.removeEventListener(VISITOR_ROLE_EVENT, syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  React.useEffect(() => {
    setVisitorRole(getSavedVisitorRole());
  }, [location.search, pathname]);

  React.useEffect(() => {
    if (!bootSplashActive) return;
    const timer = window.setTimeout(() => {
      setBootSplashActive(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [bootSplashActive]);

  // فراخوانی هوک مدیریت اسکرول برای بازگشت فوری به بالای صفحه در تمام مسیرها
  useScrollToTop();

  const {
    authUser,
    isLoadingInitialData,
    currentBusiness,
    appointments,
    toast,
    dismissToast,
    databaseError,
    refreshRealData,
  } = usePrototypeData();

  const isBusinessPanel = pathname === '/app' || pathname.startsWith('/app/');
  const isAdminPanel = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAuthorizedPlatformAdmin =
    !isLoadingInitialData &&
    Boolean(
      authUser?.isPlatformAdmin && authUser?.roles.includes('PLATFORM_ADMIN')
    );
  const isCustomerAccountArea =
    pathname === '/me' || pathname.startsWith('/me/');

  const isIntroGatewayActive =
    pathname === '/intro' ||
    (pathname === '/' &&
      (visitorRole === null || location.search.includes('intro=1')));

  const currentRouteMeta = ARCHITECTURE_ROUTES.find(
    (r) => r.path === pathname || r.samplePath === pathname
  );

  const customerTabs = [
    { to: '/me', label: 'پیشخوان حساب', end: true },
    { to: '/me/appointments', label: 'نوبت‌های من' },
    { to: '/me/favorites', label: 'سالن‌های منتخب' },
    { to: '/me/profile', label: 'اطلاعات کاربری' },
  ];

  const pendingCount = appointments.filter(
    (a) => a.status === 'PENDING'
  ).length;

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-clip flex flex-col ${
        isIntroGatewayActive
          ? 'bg-[#02081D] text-white'
          : 'bg-[#F3F6FC] text-[#061138]'
      }`}
    >
      <TimetoStartupSplash
        visible={isLoadingInitialData || bootSplashActive}
      />
      {databaseError ? (
        <div
          role="alert"
          className="bg-[#EF4444] text-white px-4 py-3 text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-between gap-3 border-b border-[#DC2626]"
        >
          <span>خطا در ارتباط با پایگاه داده: {databaseError}</span>
          <button
            type="button"
            onClick={() => void refreshRealData()}
            className="px-3.5 py-1 rounded-full bg-white text-[#EF4444] font-semibold text-xs cursor-pointer hover:bg-red-50"
          >
            تلاش مجدد
          </button>
        </div>
      ) : null}

      {isBusinessPanel ? (
        <div className="flex-1 flex flex-col w-full min-h-screen">
          {/* هدر یکپارچه و خلوت پیشخوان کسب‌وکار بدون دکمه‌های خروج تکراری (خروج و پروفایل داخل آواتار) */}
          <header className="bg-white/95 backdrop-blur-md border-b border-[#CBD5E1] px-4 sm:px-6 py-3 sticky top-0 z-20">
            <div className="max-w-[1140px] mx-auto flex items-center justify-between gap-3">
              <Link
                to="/app"
                className="flex items-center gap-2.5 min-w-0 group"
              >
                <img
                  src={TIMETO_BRAND_LOGO_URL}
                  alt="تایم تو"
                  className="w-9 h-9 rounded-2xl object-cover border border-[#CBD5E1] shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-black text-[#061138] truncate block group-hover:text-[#0057FF] transition-colors">
                    {currentBusiness?.name ?? 'سالن زیبایی رویال گلزار'}
                  </span>
                  <span className="text-[11px] font-semibold text-[#64748B] truncate block">
                    {currentRouteMeta?.title ?? 'پیشخوان مدیریت کسب‌وکار'}
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  aria-label="اعلان‌های پنل کسب‌وکار"
                  className="p-2.5 rounded-full border border-[#CBD5E1] text-[#334155] hover:bg-[#E0ECFF] hover:text-[#0057FF] cursor-pointer relative transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {pendingCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-white" />
                  ) : null}
                </button>

                {/* منوی پروفایل و خروج یکپارچه در آیکون آواتار */}
                <BusinessAvatarProfileMenu />
              </div>
            </div>
          </header>

          {/* نوار تب‌های زیرمجموعه در صورت وجود زیربخش (نوبت‌ها، سالن من، مشتریان، مالی و پلن) */}
          <BusinessCategorySubTabs />

          {/* محتوای اصلی صفحه با فاصله پایین برای نوار چسبان پایین */}
          <main className="flex-1 max-w-[1140px] w-full mx-auto p-4 sm:p-6 lg:p-8 pb-28 min-w-0">
            {children}
          </main>

          {/* نوار چسبان پایین صفحه شامل ۵ دسته اصلی */}
          <BusinessStickyBottomNav />
        </div>
      ) : isAdminPanel && isAuthorizedPlatformAdmin ? (
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
          <AdminSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
        </div>
      ) : isIntroGatewayActive ? (
        <main className="flex-1 w-full min-w-0">{children}</main>
      ) : (
        <>
          <PublicHeader />

          {isCustomerAccountArea ? (
            <div className="bg-white border-b border-[#CBD5E1] shadow-2xs">
              <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-[#061138]">
                  حساب کاربری من
                </span>
                <nav
                  aria-label="ناوبری حساب مشتری"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {customerTabs.map((tab) => (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={tab.end}
                      className={({ isActive }) =>
                        `px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-[#0057FF] text-white shadow-[0_4px_12px_rgba(0,87,255,0.35)]'
                            : 'bg-[#F3F6FC] text-[#334155] border border-[#CBD5E1] hover:bg-[#E0ECFF] hover:text-[#0057FF]'
                        }`
                      }
                    >
                      {tab.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          ) : null}

          <main className="flex-1 max-w-[1240px] w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-7 min-w-0">
            <PWAMobileInstallBanner />
            {children}
          </main>

          <div className="pb-24 lg:pb-0">
            <PublicFooter />
          </div>
          <PublicMobileBottomNav />
        </>
      )}

      <TimetoAuthModal />

      {toast ? (
        <ToastBanner
          message={toast.message}
          tone={toast.tone}
          onDismiss={dismissToast}
        />
      ) : null}

      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="اعلان‌ها و درخواست‌های نوبت"
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setNotificationsOpen(false)}
          >
            بستن
          </Button>
        }
      >
        <div className="space-y-3 text-xs">
          {appointments.length === 0 ? (
            <p className="text-[#334155] py-3 text-center">
              اعلان جدیدی برای کسب‌وکار شما ثبت نشده است.
            </p>
          ) : (
            appointments.slice(0, 4).map((apt) => (
              <div
                key={apt.id}
                className="p-3.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[#061138]">
                    {apt.customerName} — {apt.serviceTitle}
                  </p>
                  <span className="text-[11px] font-mono text-[#0057FF]">
                    {apt.referenceCode}
                  </span>
                </div>
                <p className="text-[#334155] mt-1 leading-relaxed">
                  تاریخ {apt.dateJalali} ساعت {apt.timeSlot} · متخصص:{' '}
                  {apt.specialistName}
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
