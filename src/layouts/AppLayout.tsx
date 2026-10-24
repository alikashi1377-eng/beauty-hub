import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, Layers, Map, Store } from 'lucide-react';
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
  const [routeMapModalOpen, setRouteMapModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { toast, dismissToast } = usePrototypeData();

  const isBusinessPanel = pathname === '/app' || pathname.startsWith('/app/');
  const isAdminPanel = pathname === '/admin' || pathname.startsWith('/admin/');
  const isBusinessOnboarding = pathname.startsWith('/business/');
  const isCustomerPortal =
    pathname === '/me' ||
    pathname.startsWith('/me/') ||
    pathname === '/login' ||
    pathname.startsWith('/booking/');

  const currentRouteMeta = ARCHITECTURE_ROUTES.find(
    (r) => r.path === pathname || r.samplePath === pathname
  );

  const environmentLinks = [
    {
      to: '/',
      label: '۱. بازارچه عمومی',
      active:
        !isBusinessPanel &&
        !isAdminPanel &&
        !isBusinessOnboarding &&
        !isCustomerPortal &&
        !pathname.startsWith('/salon/') &&
        !pathname.startsWith('/pro/'),
    },
    {
      to: '/salon/royal-golzar',
      label: '۲. پروفایل سالن / متخصص',
      active: pathname.startsWith('/salon/') || pathname.startsWith('/pro/'),
    },
    {
      to: '/business/register',
      label: '۳. ثبت‌نام کسب‌وکار',
      active: isBusinessOnboarding,
    },
    {
      to: '/app',
      label: '۴. پنل کسب‌وکار (/app)',
      active: isBusinessPanel,
    },
    {
      to: '/me',
      label: '۵. حساب مشتری (/me)',
      active: isCustomerPortal,
    },
    {
      to: '/admin',
      label: '۶. پنل ادمین (/admin)',
      active: isAdminPanel,
    },
  ];

  const customerTabs = [
    { to: '/me', label: 'پیشخوان مشتری (/me)', end: true },
    { to: '/me/appointments', label: 'نوبت‌های من' },
    { to: '/me/favorites', label: 'سالن‌های منتخب' },
    { to: '/me/profile', label: 'پروفایل من' },
    { to: '/booking/royal-golzar', label: 'رزرو نوبت دمو' },
    { to: '/login', label: 'ورود آزمایشی' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FC] text-[#120F1D]">
      {/* نوار جابه‌جایی سریع بین ۶ محیط پروتوتایپ */}
      <div className="bg-[#120F1D] text-slate-200 border-b border-white/10 text-xs">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-400 shrink-0 ml-1">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>محیط‌های محصول:</span>
            </span>
            {environmentLinks.map((env) => (
              <Link
                key={env.to}
                to={env.to}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  env.active
                    ? 'bg-[#2A0F54] text-white font-bold border border-purple-400/30'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {env.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setRouteMapModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold cursor-pointer"
            >
              <Map className="w-3.5 h-3.5 text-pink-300" />
              <span>فهرست ۳۸ مسیر</span>
            </button>
          </div>
        </div>
      </div>

      {/* چیدمان بر اساس محیط فعال */}
      {isBusinessPanel ? (
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
          <BusinessSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* هدر بالای پنل کسب‌وکار */}
            <header className="bg-white border-b border-[#E6E3EE] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Store className="w-4 h-4 text-[#2A0F54] shrink-0" />
                <span className="text-xs sm:text-sm font-extrabold text-[#120F1D] truncate">
                  {currentRouteMeta?.title ?? 'پنل مدیریت کسب‌وکار'}
                </span>
                <span className="hidden sm:inline-block text-xs text-[#756F86]">
                  · سالن زیبایی رویال گلزار
                </span>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  aria-label="اعلان‌های آزمایشی پنل"
                  className="p-2 rounded-xl border border-[#D0CADF] text-[#4A4458] hover:bg-[#F4F3F8] cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <Link
                  to="/app/profile"
                  className="px-3.5 py-1.5 rounded-xl bg-[#F3EEFA] hover:bg-[#E6E3EE] text-xs font-bold text-[#2A0F54]"
                >
                  حساب کسب‌وکار (دمو)
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

          {/* نوار ناوبری محیط مشتری */}
          {isCustomerPortal ? (
            <div className="bg-white border-b border-[#E6E3EE]">
              <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-[#120F1D]">
                  محیط مشتری و شبیه‌ساز رزرو نوبت:
                </span>
                <nav
                  aria-label="ناوبری محیط مشتری"
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
                            ? 'bg-[#2A0F54] text-white font-bold'
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
        title="اعلان‌های پنل کسب‌وکار (داده‌های نمونه)"
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
        </div>
      </Modal>

      {/* مودال نقشه کامل ۳۸ مسیر معماری */}
      <Modal
        isOpen={routeMapModalOpen}
        onClose={() => setRouteMapModalOpen(false)}
        title="فهرست کامل مسیرهای BeautyHub (۳۸ مسیر)"
        description="برای مشاهده و تست هر صفحه روی عنوان آن کلیک کنید."
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRouteMapModalOpen(false)}
          >
            بستن نقشه مسیرها
          </Button>
        }
      >
        <div className="max-h-[65vh] overflow-y-auto space-y-2 pl-1">
          {ARCHITECTURE_ROUTES.map((route) => (
            <Link
              key={route.path}
              to={route.samplePath}
              onClick={() => setRouteMapModalOpen(false)}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#E6E3EE] hover:border-[#2A0F54] hover:bg-[#FAF9FC] transition-colors"
            >
              <div>
                <p className="text-xs font-extrabold text-[#120F1D]">
                  {route.title}
                </p>
                <p className="text-[11px] text-[#756F86] mt-0.5">
                  {route.description}
                </p>
              </div>
              <span
                dir="ltr"
                className="text-xs font-mono text-[#2A0F54] bg-[#F3EEFA] px-2.5 py-1 rounded-lg shrink-0"
              >
                {route.path}
              </span>
            </Link>
          ))}
        </div>
      </Modal>
    </div>
  );
};
