import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, Store } from 'lucide-react';
import { PublicHeader } from '../components/navigation/PublicHeader';
import { PublicFooter } from '../components/navigation/PublicFooter';
import { BusinessSidebar } from '../components/navigation/BusinessSidebar';
import { BusinessMobileNavigation } from '../components/navigation/BusinessMobileNavigation';
import { AdminSidebar } from '../components/navigation/AdminSidebar';
import { ARCHITECTURE_ROUTES } from '../config/designTokens';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { ToastBanner } from '../components/ui/MarketplaceComponents';
import { usePrototypeData } from '../context/PrototypeDataContext';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const {
    dataMode,
    currentBusiness,
    appointments,
    toast,
    dismissToast,
    databaseError,
    refreshRealData,
  } = usePrototypeData();

  const isBusinessPanel = pathname === '/app' || pathname.startsWith('/app/');
  const isAdminPanel = pathname === '/admin' || pathname.startsWith('/admin/');
  const isCustomerAccountArea =
    pathname === '/me' || pathname.startsWith('/me/');

  const currentRouteMeta = ARCHITECTURE_ROUTES.find(
    (r) => r.path === pathname || r.samplePath === pathname
  );

  const customerTabs = [
    { to: '/me', label: 'پیشخوان حساب', end: true },
    { to: '/me/appointments', label: 'نوبت‌های من' },
    { to: '/me/favorites', label: 'سالن‌های منتخب' },
    { to: '/me/profile', label: 'ویرایش پروفایل' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FC] text-[#120F1D]">
      {databaseError ? (
        <div
          role="alert"
          className="bg-red-900 text-white px-4 py-3 text-xs sm:text-sm font-semibold flex flex-wrap items-center justify-between gap-3 border-b border-red-700"
        >
          <span>خطای اتصال به دیتابیس PostgreSQL: {databaseError}</span>
          <button
            type="button"
            onClick={() => void refreshRealData()}
            className="px-3 py-1 rounded-lg bg-white text-red-950 font-semibold text-xs cursor-pointer hover:bg-red-50"
          >
            تلاش مجدد اتصال
          </button>
        </div>
      ) : null}
      {/* چیدمان بر اساس محیط فعال */}
      {isBusinessPanel ? (
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
          <BusinessSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* هدر بالای پنل کسب‌وکار */}
            <header className="bg-white border-b border-[#E6E3EE] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Store className="w-4 h-4 text-[#2A0F54] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#120F1D] truncate">
                  {currentRouteMeta?.title ?? 'پنل مدیریت کسب‌وکار'}
                </span>
                <span className="hidden sm:inline-block text-xs text-[#756F86]">
                  · {currentBusiness?.name ?? (dataMode === 'mock' ? 'سالن زیبایی رویال گلزار' : 'کسب‌وکار فعال')}
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  aria-label="اعلان‌های پنل کسب‌وکار"
                  className="p-2 rounded-xl border border-[#D0CADF] text-[#4A4458] hover:bg-[#F4F3F8] cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <Link
                  to="/app/profile"
                  className="px-3.5 py-1.5 rounded-xl bg-[#F3EEFA] hover:bg-[#E6E3EE] text-xs font-semibold text-[#2A0F54]"
                >
                  تنظیمات سالن
                </Link>
              </div>
            </header>

            <BusinessMobileNavigation />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      ) : isAdminPanel ? (
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
          <AdminSidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">{children}</main>
        </div>
      ) : (
        <>
          <PublicHeader />

          {/* نوار ناوبری داخلی حساب کاربری مشتری */}
          {isCustomerAccountArea ? (
            <div className="bg-white border-b border-[#E6E3EE]">
              <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#120F1D]">
                  حساب کاربری من:
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
                        `px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-[#2A0F54] text-white font-semibold'
                            : 'bg-[#F4F3F8] text-[#4A4458] hover:bg-[#E6E3EE]'
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

          <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-9">
            {children}
          </main>

          <PublicFooter />
        </>
      )}

      {/* اعلان بازخورد سراسری */}
      {toast ? (
        <ToastBanner
          message={toast.message}
          tone={toast.tone}
          onDismiss={dismissToast}
        />
      ) : null}

      {/* مودال اعلان‌های پنل کسب‌وکار */}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="اعلان‌های پنل کسب‌وکار"
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
          {dataMode === 'real' ? (
            appointments.length === 0 ? (
              <p className="text-[#756F86] py-3 text-center">
                اعلان جدیدی برای کسب‌وکار شما ثبت نشده است.
              </p>
            ) : (
              appointments.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE]"
                >
                  <p className="font-bold text-[#120F1D]">
                    نوبت ثبت‌شده — {apt.customerName}
                  </p>
                  <p className="text-[#4A4458] mt-1 leading-relaxed">
                    خدمت {apt.serviceTitle} برای تاریخ {apt.dateJalali} ساعت{' '}
                    {apt.timeSlot} ({apt.referenceCode}).
                  </p>
                </div>
              ))
            )
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE]">
                <p className="font-bold text-[#120F1D]">
                  درخواست نوبت جدید — پرنیا توکلی
                </p>
                <p className="text-[#4A4458] mt-1 leading-relaxed">
                  خدمت مانیکور روسی برای تاریخ ۱۴۰۵/۰۸/۰۳ ساعت ۱۳:۳۰ در انتظار تایید شماست.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE]">
                <p className="font-bold text-[#120F1D]">
                  دیدگاه ۵ ستاره جدید ثبت شد
                </p>
                <p className="text-[#4A4458] mt-1 leading-relaxed">
                  المیرا شمس برای خدمت پروتئین‌تراپی مو امتیاز کامل ثبت کرد.
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

