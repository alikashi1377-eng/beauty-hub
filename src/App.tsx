/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import {
  PrototypeDataProvider,
  usePrototypeData,
} from './context/PrototypeDataContext';
import { AppLayout } from './layouts/AppLayout';
import {
  AboutPage,
  CategoriesPage,
  HelpPage,
  HomePage,
  PricingPage,
  SearchPage,
} from './pages/public/PublicPages';
import { BusinessPublicProfileView } from './pages/public/BusinessPublicPages';
import {
  BusinessOnboardingStepPage,
  BusinessPreviewStepPage,
  BusinessReadyStepPage,
  BusinessRegisterPage,
  BusinessVerificationStepPage,
} from './pages/business-onboarding/BusinessOnboardingPages';
import {
  BusinessAnalyticsPage,
  BusinessAppointmentsPage,
  BusinessCalendarPage,
  BusinessCustomersPage,
  BusinessDashboardPage,
  BusinessGalleryPage,
  BusinessMarketingPage,
  BusinessProfileEditPage,
  BusinessServicesPage,
  BusinessSettingsPage,
  BusinessStaffPage,
  BusinessSubscriptionPage,
  BusinessWorkingHoursPage,
} from './pages/business-panel/BusinessPanelPages';
import {
  BookingConfirmPage,
  BookingResultPage,
  BookingStepPage,
  CustomerAppointmentsPage,
  CustomerFavoritesPage,
  CustomerLoginPage,
  CustomerOverviewPage,
  CustomerProfilePage,
} from './pages/customer/CustomerPages';
import {
  AdminBusinessesPage,
  AdminCategoriesPage,
  AdminDashboardPage,
  AdminPaymentsPage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminSubscriptionsPage,
  AdminUsersPage,
} from './pages/admin/AdminPages';
import { NotFoundState } from './components/ui/StateViews';

const NotFoundRouteWrapper: React.FC = () => {
  const location = useLocation();
  return <NotFoundState attemptedPath={location.pathname} />;
};

const RequirePlatformAdmin: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const { authUser, dataMode, isLoadingInitialData } = usePrototypeData();

  if (isLoadingInitialData) {
    return (
      <div
        role="status"
        className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white border border-[#E6E0F5] text-center space-y-3"
      >
        <p className="text-sm font-bold text-[#1E1B2E]">
          در حال بررسی اعتبار نشست و مجوز دسترسی...
        </p>
        <p className="text-xs text-[#6B6480]">لطفاً چند لحظه صبر کنید.</p>
      </div>
    );
  }

  if (dataMode === 'mock') {
    return <>{children}</>;
  }

  if (!authUser) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (
    !authUser.isPlatformAdmin ||
    !authUser.roles.includes('PLATFORM_ADMIN')
  ) {
    return (
      <div
        role="alert"
        className="max-w-lg mx-auto my-12 p-8 rounded-3xl bg-white border border-[#E6E0F5] text-center space-y-4 shadow-2xs"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#8B5CF6] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-extrabold text-[#1E1B2E]">
          ۴۰۳ — عدم مجوز دسترسی (Forbidden)
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6480] leading-relaxed">
          حساب کاربری شما دارای نقش مدیر کل سامانه (PLATFORM_ADMIN) نیست و مجوز
          دسترسی به کنسول مدیریت کلان را ندارد.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition-colors"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <PrototypeDataProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* ۱. محیط عمومی */}
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />

            {/* ۲. صفحه عمومی کسب‌وکار */}
            <Route
              path="/salon/:slug"
              element={<BusinessPublicProfileView mode="salon" />}
            />
            <Route
              path="/pro/:slug"
              element={<BusinessPublicProfileView mode="pro" />}
            />

            {/* ۳. محیط ثبت‌نام کسب‌وکار */}
            <Route path="/business/register" element={<BusinessRegisterPage />} />
            <Route
              path="/business/onboarding"
              element={<BusinessOnboardingStepPage />}
            />
            <Route
              path="/business/preview"
              element={<BusinessPreviewStepPage />}
            />
            <Route
              path="/business/verification"
              element={<BusinessVerificationStepPage />}
            />
            <Route path="/business/ready" element={<BusinessReadyStepPage />} />

            {/* ۴. پنل کسب‌وکار */}
            <Route path="/app" element={<BusinessDashboardPage />} />
            <Route path="/app/calendar" element={<BusinessCalendarPage />} />
            <Route
              path="/app/appointments"
              element={<BusinessAppointmentsPage />}
            />
            <Route path="/app/services" element={<BusinessServicesPage />} />
            <Route path="/app/staff" element={<BusinessStaffPage />} />
            <Route path="/app/customers" element={<BusinessCustomersPage />} />
            <Route path="/app/gallery" element={<BusinessGalleryPage />} />
            <Route path="/app/profile" element={<BusinessProfileEditPage />} />
            <Route
              path="/app/working-hours"
              element={<BusinessWorkingHoursPage />}
            />
            <Route path="/app/marketing" element={<BusinessMarketingPage />} />
            <Route path="/app/analytics" element={<BusinessAnalyticsPage />} />
            <Route
              path="/app/subscription"
              element={<BusinessSubscriptionPage />}
            />
            <Route path="/app/settings" element={<BusinessSettingsPage />} />

            {/* ۵. محیط مشتری */}
            <Route path="/login" element={<CustomerLoginPage />} />
            <Route path="/booking/confirm" element={<BookingConfirmPage />} />
            <Route path="/booking/result" element={<BookingResultPage />} />
            <Route
              path="/booking/:businessSlug"
              element={<BookingStepPage />}
            />
            <Route path="/me" element={<CustomerOverviewPage />} />
            <Route
              path="/me/appointments"
              element={<CustomerAppointmentsPage />}
            />
            <Route path="/me/favorites" element={<CustomerFavoritesPage />} />
            <Route path="/me/profile" element={<CustomerProfilePage />} />

            {/* ۶. پنل مدیریت پلتفرم — محافظت‌شده با نشست سرور و نقش PLATFORM_ADMIN */}
            <Route
              path="/admin"
              element={
                <RequirePlatformAdmin>
                  <AdminDashboardPage />
                </RequirePlatformAdmin>
              }
            />
            <Route
              path="/admin/businesses"
              element={
                <RequirePlatformAdmin>
                  <AdminBusinessesPage />
                </RequirePlatformAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequirePlatformAdmin>
                  <AdminUsersPage />
                </RequirePlatformAdmin>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <RequirePlatformAdmin>
                  <AdminCategoriesPage />
                </RequirePlatformAdmin>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <RequirePlatformAdmin>
                  <AdminSubscriptionsPage />
                </RequirePlatformAdmin>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <RequirePlatformAdmin>
                  <AdminPaymentsPage />
                </RequirePlatformAdmin>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <RequirePlatformAdmin>
                  <AdminReportsPage />
                </RequirePlatformAdmin>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RequirePlatformAdmin>
                  <AdminSettingsPage />
                </RequirePlatformAdmin>
              }
            />

            {/* صفحه ۴۰۴ یافت نشد */}
            <Route path="*" element={<NotFoundRouteWrapper />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </PrototypeDataProvider>
  );
}
