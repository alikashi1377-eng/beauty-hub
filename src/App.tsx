/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { PrototypeDataProvider } from './context/PrototypeDataContext';
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

            {/* ۶. پنل مدیریت پلتفرم */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/businesses" element={<AdminBusinessesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route
              path="/admin/subscriptions"
              element={<AdminSubscriptionsPage />}
            />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />

            {/* صفحه ۴۰۴ یافت نشد */}
            <Route path="*" element={<NotFoundRouteWrapper />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </PrototypeDataProvider>
  );
}
