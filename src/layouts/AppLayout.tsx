import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { PublicHeader } from '../components/navigation/PublicHeader';
import { PublicFooter } from '../components/navigation/PublicFooter';
import { PublicMobileBottomNav } from '../components/navigation/PublicMobileBottomNav';
import {
  BUSINESS_PRIMARY_NAV_GROUPS,
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
import {
  resolveAdjacentTabBySwipe,
  toPersianDigits,
} from '../utils/formatters';
import { AppointmentStatus } from '../types';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [touchStartCoords, setTouchStartCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
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
    updateAppointmentStatus,
    platformBusinessNotices,
    markPlatformBusinessNoticeRead,
    toast,
    dismissToast,
    databaseError,
    refreshRealData,
    openAuthModal,
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

  // تب‌های اصلی نوار چسبان پایین موبایل برای کاربران عادی (سوایپ افقی چپ و راست)
  const publicPrimaryMobileRoutes = [
    '/',
    '/search',
    '/categories',
    '/me/appointments',
    '/me',
  ];

  // لیست صفحه‌های قابل جابه‌جایی با سوایپ چپ و راست در پنل کسب‌وکار (/app/*)
  const activeBusinessGroup = BUSINESS_PRIMARY_NAV_GROUPS.find((grp) =>
    grp.matchPaths.includes(pathname)
  );
  const businessSwipeRouteIds =
    activeBusinessGroup && activeBusinessGroup.subTabs.length > 1
      ? activeBusinessGroup.subTabs.map((t) => t.to)
      : BUSINESS_PRIMARY_NAV_GROUPS.map((g) => g.defaultPath);
  const activeBusinessSwipeId =
    activeBusinessGroup && activeBusinessGroup.subTabs.length > 1
      ? pathname
      : (activeBusinessGroup?.defaultPath ?? '/app');

  const handleMainTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const targetEl = e.target as HTMLElement | null;
    if (
      targetEl?.closest(
        'input, select, textarea, [data-no-swipe="true"], .no-scrollbar'
      )
    ) {
      setTouchStartCoords(null);
      return;
    }
    const t = e.touches[0];
    if (t) {
      setTouchStartCoords({ x: t.clientX, y: t.clientY });
    }
  };

  const handleMainTouchEnd = (
    e: React.TouchEvent<HTMLElement>,
    routeList: string[],
    currentRoute: string
  ) => {
    const t = e.changedTouches[0];
    if (!touchStartCoords || !t) return;
    const nextRoute = resolveAdjacentTabBySwipe(
      routeList,
      currentRoute,
      t.clientX - touchStartCoords.x,
      t.clientY - touchStartCoords.y,
      50
    );
    setTouchStartCoords(null);
    if (nextRoute && nextRoute !== pathname) {
      if (
        !authUser &&
        (nextRoute === '/me' || nextRoute.startsWith('/me/'))
      ) {
        openAuthModal({
          initialScreen: 'LOGIN',
          defaultRole: 'CUSTOMER',
          redirectTo: nextRoute,
          promptReason:
            'برای ورود به بخش حساب کاربری یا نوبت‌های خود، ابتدا وارد شوید',
        });
        return;
      }
      navigate(nextRoute);
    }
  };

  const publicSwipeRouteList = isCustomerAccountArea
    ? customerTabs.map((t) => t.to)
    : publicPrimaryMobileRoutes;
  const activePublicSwipeRoute = isCustomerAccountArea
    ? pathname
    : publicPrimaryMobileRoutes.includes(pathname)
      ? pathname
      : '';

  const businessAppointments = currentBusiness
    ? appointments.filter(
        (a) =>
          a.businessId === currentBusiness.id ||
          a.businessSlug === currentBusiness.slug ||
          a.businessName === currentBusiness.name
      )
    : appointments;
  const pendingBusinessAppointments = businessAppointments.filter(
    (a) => a.status === AppointmentStatus.Pending
  );
  const currentBizId = currentBusiness?.id || 'biz-owner-zero';
  const relevantAdminNotices = platformBusinessNotices.filter(
    (n) => n.targetBusinessId === 'ALL' || n.targetBusinessId === currentBizId
  );
  const unreadAdminNotices = relevantAdminNotices.filter(
    (n) => !n.readByBusinessIds.includes(currentBizId)
  );
  const pendingCount =
    pendingBusinessAppointments.length + unreadAdminNotices.length;

  const shouldShowPublicFooter =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    pathname === '/support';

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
                  className="w-9 h-9 rounded-2xl object-contain bg-[#041136] p-0.5 border border-[#CBD5E1] shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-black text-[#061138] truncate block group-hover:text-[#0057FF] transition-colors">
                    {currentBusiness?.name ?? 'سالن زیبایی من'}
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
                  className="px-3 py-2 rounded-full border border-[#CBD5E1] text-[#334155] hover:bg-[#E0ECFF] hover:text-[#0057FF] cursor-pointer relative inline-flex items-center gap-1.5 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {pendingCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#EF4444] text-white text-[10px] font-black tabular-nums animate-pulse">
                      {toPersianDigits(pendingCount)} اعلان جدید
                    </span>
                  ) : null}
                </button>

                {/* منوی پروفایل و خروج یکپارچه در آیکون آواتار */}
                <BusinessAvatarProfileMenu />
              </div>
            </div>
          </header>

          {/* نوار هشدار فوری نوبت جدید برای صاحب کسب‌وکار — تا هیچ نوبتی فراموش نشود */}
          {pendingBusinessAppointments.length > 0 ? (
            <div className="bg-gradient-to-l from-[#061138] via-[#0B1E5B] to-[#0057FF] text-white px-4 sm:px-6 py-2.5 border-b border-[#00E5FF]/35 shadow-sm">
              <div className="max-w-[1140px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-ping shrink-0" />
                  <p className="font-extrabold truncate">
                    نوبت جدید در انتظار تایید شما:{' '}
                    <span className="text-[#00E5FF]">
                      {pendingBusinessAppointments[0].customerName}
                    </span>{' '}
                    ({pendingBusinessAppointments[0].serviceTitle} ·{' '}
                    {pendingBusinessAppointments[0].dateJalali} ساعت{' '}
                    {pendingBusinessAppointments[0].timeSlot})
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateAppointmentStatus(
                        pendingBusinessAppointments[0].id,
                        AppointmentStatus.Confirmed
                      )
                    }
                    className="px-3.5 py-1 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-xs cursor-pointer transition-colors shadow-xs"
                  >
                    ✓ تایید فوری نوبت
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(true)}
                    className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] cursor-pointer transition-colors"
                  >
                    مشاهده همه ({toPersianDigits(pendingCount)})
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* نوار تب‌های زیرمجموعه در صورت وجود زیربخش (نوبت‌ها، سالن من، مشتریان، مالی و پلن) */}
          <BusinessCategorySubTabs />

          {/* محتوای اصلی صفحه با فاصله پایین کافی برای نوار چسبان پایین + سوایپ چپ و راست بین تب‌ها */}
          <main
            onTouchStart={handleMainTouchStart}
            onTouchEnd={(e) =>
              handleMainTouchEnd(
                e,
                businessSwipeRouteIds,
                activeBusinessSwipeId
              )
            }
            className="flex-1 max-w-[1140px] w-full mx-auto px-4 pt-4 pb-36 sm:px-6 sm:pt-6 sm:pb-36 lg:px-8 lg:pt-8 lg:pb-36 min-w-0"
          >
            {children}
            <div className="h-20 shrink-0" aria-hidden="true" />
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
              <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
                <nav
                  aria-label="ناوبری حساب مشتری"
                  className="flex items-center gap-1.5"
                >
                  {customerTabs.map((tab) => (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={tab.end}
                      className={({ isActive }) =>
                        `px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
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

          <main
            onTouchStart={
              activePublicSwipeRoute ? handleMainTouchStart : undefined
            }
            onTouchEnd={
              activePublicSwipeRoute
                ? (e) =>
                    handleMainTouchEnd(
                      e,
                      publicSwipeRouteList,
                      activePublicSwipeRoute
                    )
                : undefined
            }
            className="flex-1 max-w-[1240px] w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-7 min-w-0"
          >
            {children}
          </main>

          {shouldShowPublicFooter ? (
            <div className="pb-24 lg:pb-0">
              <PublicFooter />
            </div>
          ) : (
            <div className="pb-24 lg:pb-6" aria-hidden="true" />
          )}
          <PublicMobileBottomNav />
        </>
      )}

      {!isBusinessPanel && !isAdminPanel ? <PWAMobileInstallBanner /> : null}
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
        title="اعلان‌های مدیریت پلتفرم و درخواست‌های نوبت"
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
          {relevantAdminNotices.length > 0 ? (
            <div className="space-y-2 pb-2 border-b border-[#E2E8F0]">
              <p className="font-extrabold text-[#0057FF]">
                پیام‌ها و اطلاعیه‌های مدیر پلتفرم تایم‌تو:
              </p>
              {relevantAdminNotices.map((notice) => {
                const isRead = notice.readByBusinessIds.includes(currentBizId);
                return (
                  <div
                    key={notice.id}
                    className={`p-3.5 rounded-2xl border space-y-2 ${
                      isRead
                        ? 'bg-[#F8FAFC] border-[#CBD5E1]'
                        : 'bg-[#EFF6FF] border-[#0057FF]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[#061138]">
                        📢 {notice.title}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {notice.createdAtJalali}
                      </span>
                    </div>
                    <p className="text-[#334155] leading-relaxed">
                      {notice.message}
                    </p>
                    <div className="flex justify-end">
                      {!isRead ? (
                        <button
                          type="button"
                          onClick={() =>
                            markPlatformBusinessNoticeRead(
                              notice.id,
                              currentBizId
                            )
                          }
                          className="px-3 py-1 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white font-extrabold text-[11px] cursor-pointer"
                        >
                          ✓ متوجه شدم (خواندم)
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-[#059669]">
                          ✓ خوانده شده
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {businessAppointments.length === 0 &&
          relevantAdminNotices.length === 0 ? (
            <p className="text-[#334155] py-3 text-center">
              اعلان یا نوبت جدیدی برای کسب‌وکار شما ثبت نشده است.
            </p>
          ) : (
            businessAppointments.slice(0, 6).map((apt) => (
              <div
                key={apt.id}
                className={`p-3.5 rounded-2xl border space-y-2 ${
                  apt.status === AppointmentStatus.Pending
                    ? 'bg-[#FFFBEB] border-[#F59E0B]'
                    : 'bg-[#F3F6FC] border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-extrabold text-[#061138]">
                    {apt.customerName} — {apt.serviceTitle}
                  </p>
                  <span
                    dir="ltr"
                    className="text-[11px] font-mono font-bold text-[#0057FF]"
                  >
                    {apt.customerPhoneMasked}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[#334155] leading-relaxed">
                    تاریخ {apt.dateJalali} ساعت {apt.timeSlot} · متخصص:{' '}
                    {apt.specialistName}
                  </p>
                  {apt.status === AppointmentStatus.Pending ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateAppointmentStatus(
                            apt.id,
                            AppointmentStatus.Confirmed
                          )
                        }
                        className="px-3 py-1 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-[11px] cursor-pointer"
                      >
                        ✓ تایید نوبت
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateAppointmentStatus(
                            apt.id,
                            AppointmentStatus.Cancelled
                          )
                        }
                        className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] cursor-pointer"
                      >
                        لغو
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-extrabold">
                      تاییدشده ✓
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
