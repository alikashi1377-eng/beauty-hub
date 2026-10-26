import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, CalendarPlus, Store } from 'lucide-react';
import { PublicHeader } from '../components/navigation/PublicHeader';
import { PublicFooter } from '../components/navigation/PublicFooter';
import { PublicMobileBottomNav } from '../components/navigation/PublicMobileBottomNav';
import { BusinessSidebar } from '../components/navigation/BusinessSidebar';
import { BusinessMobileNavigation } from '../components/navigation/BusinessMobileNavigation';
import { AdminSidebar } from '../components/navigation/AdminSidebar';
import { ARCHITECTURE_ROUTES } from '../config/designTokens';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ToastBanner } from '../components/ui/MarketplaceComponents';
import { PWAMobileInstallBanner } from '../components/ui/PWAInstallPrompt';
import { usePrototypeData } from '../context/PrototypeDataContext';
import { useScrollToTop } from '../hooks/useScrollToTop';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // فراخوانی هوک مدیریت اسکرول برای بازگشت فوری به بالای صفحه در تمام مسیرها
  useScrollToTop();

  const {
    dataMode,
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
    dataMode === 'mock' ||
    (!isLoadingInitialData &&
      dataMode === 'real' &&
      Boolean(
        authUser?.isPlatformAdmin && authUser?.roles.includes('PLATFORM_ADMIN')
      ));
  const isCustomerAccountArea =
    pathname === '/me' || pathname.startsWith('/me/');

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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#F3F6FC] text-[#061138]">
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
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
          <BusinessSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="bg-white/95 backdrop-blur-md border-b border-[#CBD5E1] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-2xl bg-[#E0ECFF] text-[#0057FF] flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-extrabold text-[#061138] truncate block">
                    {currentRouteMeta?.title ?? 'پنل مدیریت کسب‌وکار'}
                  </span>
                  <span className="text-[11px] font-medium text-[#334155] truncate block">
                    {currentBusiness?.name ?? 'سالن زیبایی رویال گلزار'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/app/calendar"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F3F6FC] hover:bg-[#E0ECFF] border border-[#CBD5E1] text-xs font-bold text-[#061138] transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-[#0057FF]" />
                  <span>تقویم روزانه</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  aria-label="اعلان‌های پنل کسب‌وکار"
                  className="p-2.5 rounded-full border border-[#CBD5E1] text-[#334155] hover:bg-[#E0ECFF] hover:text-[#0057FF] cursor-pointer relative transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {pendingCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#0057FF] border-2 border-white" />
                  ) : null}
                </button>

                <Link
                  to="/app/appointments"
                  className="px-4 py-2 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-xs font-bold text-white transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.4)]"
                >
                  مدیریت رزروها
                </Link>
              </div>
            </header>

            <BusinessMobileNavigation />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
          </div>
        </div>
      ) : isAdminPanel && isAuthorizedPlatformAdmin ? (
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
          <AdminSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
        </div>
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
