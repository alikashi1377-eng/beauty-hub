import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Clock,
  Users,
  Check,
  X,
  Megaphone,
  ShieldCheck,
  Instagram,
  MapPin,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  MessageSquare,
  Send,
  Download,
  Copy,
} from 'lucide-react';
import {
  AppointmentItem,
  AppointmentStatus,
  CustomerRecord,
  ServiceItem,
  SpecialistItem,
} from '../../types';
import {
  CATEGORY_PACKAGE_STAGE_CHECKLISTS,
  FACIAL_SERVICE_PRESETS,
  ISFAHAN_NEIGHBORHOODS,
  LASER_DEVICE_PRESETS,
  LASER_SERVICE_PRESETS,
  OTHER_DOMAIN_SERVICE_PRESETS,
  SAMPLE_CATEGORIES,
} from '../../mocks/sampleData';
import {
  formatDurationMinutes,
  formatNumericInputWithCommas,
  formatPriceToman,
  formatServicePriceDisplay,
  formatServicePriceShort,
  formatWorkingHourDisplay,
  getAppointmentStatusMeta,
  getPlanStaffLimitCount,
  getSuggestedServiceTitlesForCategory,
  getUpcomingJalaliDays,
  isValidIranMobile,
  normalizeIranMobileInput,
  parseNumericInput,
  STANDARD_WORKING_TIME_OPTIONS,
  toEnglishDigitsClient,
  toPersianDigits,
  validateServiceForm,
} from '../../utils/formatters';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { VisualMediaIllustration } from '../../components/ui/VisualMediaIllustration';
import { EmptyState } from '../../components/ui/StateViews';
import {
  Avatar,
  ConfirmationDialog,
  Tabs,
} from '../../components/ui/MarketplaceComponents';
import { LocationMapPicker } from '../../components/ui/LocationMapPicker';
import { ProfilePhotoUploader } from '../../components/ui/ProfilePhotoUploader';
import {
  EasyCheckoutModal,
  CheckoutItemPayload,
} from '../../components/ui/EasyCheckoutModal';
import {
  BusinessProfileCompletionBanner,
  computeBusinessProfileCompletion,
} from '../../components/business/BusinessProfileCompletionWidget';
import { BusinessStoriesBar } from '../../components/business/BusinessStoriesBar';
import { BusinessQrCodeCard } from '../../components/business/BusinessQrCodeCard';

/** بررسی رایگان بودن پلن فعلی کسب‌وکار (با پشتیبانی از قفل‌گشایی خودکار هنگام فعال‌سازی پلن تستی توسط مدیریت) */
const isFreeSubscriptionPlan = (
  planId?: string,
  planName?: string
): boolean => {
  const id = (planId || '').toLowerCase();
  const name = (planName || '').trim();
  if (
    id === 'plan-professional' ||
    id === 'plan-vip-multi' ||
    id === 'plan-vip' ||
    id === 'plan-vip-brand' ||
    id === 'plan-enterprise'
  ) {
    return false;
  }
  if (
    name.includes('حرفه‌ای') ||
    name.includes('VIP') ||
    name.includes('پیشرفته') ||
    name.includes('ویژه')
  ) {
    return false;
  }
  return true;
};

/** بررسی فعال بودن پلن VIP (شامل خرید مستقیم یا فعال‌سازی تستی زمان‌دار VIP توسط مدیر کل) */
const isVipSubscriptionPlan = (
  planId?: string,
  planName?: string
): boolean => {
  const id = (planId || '').toLowerCase();
  const name = (planName || '').trim();
  return (
    id === 'plan-vip-brand' ||
    id === 'plan-vip-multi' ||
    id === 'plan-vip' ||
    id === 'plan-enterprise' ||
    name.includes('VIP')
  );
};

/** بنر قفل امکانات ویژه پلن‌های بالاتر (حرفه‌ای / VIP) */
const PlanUpgradeLockBanner: React.FC<{
  featureTitle: string;
  description: string;
  requiredPlanLabel?: string;
}> = ({
  featureTitle,
  description,
  requiredPlanLabel = 'پلن حرفه‌ای و VIP',
}) => (
  <div className="rounded-2xl border border-[#CBD5E1] bg-slate-100/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 text-sm font-black">
        🔒
      </span>
      <div className="space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs sm:text-sm font-extrabold text-slate-700">
            {featureTitle}
          </p>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold">
            ویژه {requiredPlanLabel}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
    <Link to="/app/subscription" className="shrink-0">
      <Button variant="primary" size="sm">
        <span>ارتقا و خرید پلن ←</span>
      </Button>
    </Link>
  </div>
);

/** ۱. پیشخوان عملیاتی کسب‌وکار (/app) — چیدمان خلوت، اولویت‌بندی‌شده و مجهز به استوری‌های راهنما */
export const BusinessDashboardPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    appointments,
    services,
    specialists,
    gallery,
    customers,
    plans,
    dailyIncomeLogs,
    updateAppointmentStatus,
    settleAppointmentInPerson,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const bizServicesList = currentBiz
    ? services.filter((s) => s.businessId === currentBiz.id)
    : [];
  const bizSpecialistsList = currentBiz
    ? specialists.filter((sp) => sp.businessId === currentBiz.id)
    : [];
  const bizGalleryList = currentBiz
    ? gallery.filter((g) => g.businessId === currentBiz.id)
    : [];
  const bizAppointments = currentBiz
    ? appointments.filter(
        (a) =>
          a.businessId === currentBiz.id ||
          a.businessSlug === currentBiz.slug ||
          a.businessName === currentBiz.name
      )
    : [];
  const bizCustomers = currentBiz
    ? customers.filter(
        (c) => !c.businessId || c.businessId === currentBiz.id
      )
    : [];

  const profileCompletion = computeBusinessProfileCompletion({
    business: currentBiz,
    services: bizServicesList,
    specialists: bizSpecialistsList,
    gallery: bizGalleryList,
    plans,
  });

  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  const pendingAppointments = bizAppointments.filter(
    (a) => a.status === AppointmentStatus.Pending
  );
  const confirmedAppointments = bizAppointments.filter(
    (a) => a.status === AppointmentStatus.Confirmed
  );
  const activeAppointmentsCount =
    pendingAppointments.length + confirmedAppointments.length;

  const displayedCustomersCount = bizCustomers.length;

  const bizServicesCount = bizServicesList.filter(
    (s) => s.isActive !== false
  ).length;
  const bizSpecialists = bizSpecialistsList.filter(
    (sp) => sp.isActive !== false
  );

  const todayAppointmentsList = bizAppointments.filter(
    (apt) =>
      selectedStaffFilter === 'ALL' || apt.specialistName === selectedStaffFilter
  );

  return (
    <div className="space-y-5">
      {/* ۱. نوار استوری‌های آموزشی و اطلاعیه‌ها (به سبک اینستاگرام با پوستر تصویری و لینک مستقیم به بخش‌ها) */}
      <BusinessStoriesBar />

      {/* بنر روزشمار زنده اشتراک تستی / فعال و جایگاه تبلیغاتی ویژه */}
      {currentBiz &&
      ((currentBiz.trialDaysRemaining && currentBiz.trialDaysRemaining > 0 && !isFreeSubscriptionPlan(undefined, currentBiz.subscriptionPlan)) ||
        (currentBiz.isSponsored &&
          currentBiz.sponsoredDaysRemaining &&
          currentBiz.sponsoredDaysRemaining > 0)) ? (
        <div className="rounded-3xl bg-gradient-to-l from-[#061138] via-[#0B1E5B] to-[#1E1B4B] text-white p-4 sm:p-5 border border-[#0057FF]/40 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF] text-[#061138] text-[11px] font-black">
                ⏳ روزشمار اعتبار فعال شما
              </span>
              {currentBiz.trialDaysRemaining &&
              currentBiz.trialDaysRemaining > 0 &&
              !isFreeSubscriptionPlan(undefined, currentBiz.subscriptionPlan) ? (
                <span className="text-xs sm:text-sm font-extrabold text-amber-300 tabular-nums">
                  پلن «{currentBiz.subscriptionPlan}»: {toPersianDigits(currentBiz.trialDaysRemaining)} روز باقی‌مانده
                </span>
              ) : null}
              {currentBiz.isSponsored &&
              currentBiz.sponsoredDaysRemaining &&
              currentBiz.sponsoredDaysRemaining > 0 ? (
                <span className="text-xs sm:text-sm font-extrabold text-emerald-300 tabular-nums">
                  ★ تبلیغ ویژه ({currentBiz.sponsoredLabel || 'صدر نتایج'}):{' '}
                  {toPersianDigits(currentBiz.sponsoredDaysRemaining)} روز باقی‌مانده
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-300">
              تمامی ابزارهای حسابداری دخل روزانه، باشگاه مشتریان و گزارش‌های مالی پیشرفته برای پنل شما فعال است.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/analytics">
              <Button variant="secondary" size="sm">
                <span>ثبت دخل روزانه و مالی</span>
              </Button>
            </Link>
            <Link to="/app/subscription">
              <Button variant="accent" size="sm">
                <span>مدیریت اشتراک ←</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {/* ۲. نوار جمع‌وجور درصد تکمیل پروفایل سالن (فقط نمایش موارد باقی‌مانده) */}
      <BusinessProfileCompletionBanner summary={profileCompletion} />

      {/* ۳. خلاصه وضعیت امروز سالن در یک نگاه (۴ شمارنده ساده، خلوت و کاربردی) */}
      <section
        aria-label="خلاصه وضعیت امروز سالن"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <Link
          to="/app/appointments"
          className="rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] p-4 flex items-center justify-between gap-3 transition-all shadow-2xs"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#64748B] block">
              در انتظار تایید
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#061138] tabular-nums">
              {toPersianDigits(pendingAppointments.length)}{' '}
              <span className="text-xs font-bold text-[#64748B]">نوبت</span>
            </p>
          </div>
          <span
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              pendingAppointments.length > 0
                ? 'bg-[#FEF3C7] text-[#D97706]'
                : 'bg-[#ECFDF5] text-[#10B981]'
            }`}
          >
            {pendingAppointments.length > 0 ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </span>
        </Link>

        <Link
          to="/app/calendar"
          className="rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] p-4 flex items-center justify-between gap-3 transition-all shadow-2xs"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#64748B] block">
              نوبت‌های فعال امروز
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#061138] tabular-nums">
              {toPersianDigits(activeAppointmentsCount)}{' '}
              <span className="text-xs font-bold text-[#64748B]">نوبت</span>
            </p>
          </div>
          <span className="w-10 h-10 rounded-2xl bg-[#E0ECFF] text-[#0057FF] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </span>
        </Link>

        <Link
          to="/app/customers"
          className="rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] p-4 flex items-center justify-between gap-3 transition-all shadow-2xs"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#64748B] block">
              مشتریان سالن
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#061138] tabular-nums">
              {toPersianDigits(displayedCustomersCount)}{' '}
              <span className="text-xs font-bold text-[#64748B]">نفر</span>
            </p>
          </div>
          <span className="w-10 h-10 rounded-2xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </span>
        </Link>

        <Link
          to="/app/services"
          className="rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] p-4 flex items-center justify-between gap-3 transition-all shadow-2xs"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#64748B] block">
              خدمات فعال
            </span>
            <p className="text-xl sm:text-2xl font-black text-[#061138] tabular-nums">
              {toPersianDigits(bizServicesCount)}{' '}
              <span className="text-xs font-bold text-[#64748B]">خدمت</span>
            </p>
          </div>
          <span className="w-10 h-10 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </span>
        </Link>
      </section>

      {/* ۴. اولویت اول سالن‌دار: نوبت‌های در انتظار تایید + برنامه نوبت‌های امروز */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ستون راست (۷ ستون): صف تایید فوری نوبت‌های جدید */}
        <Card className="lg:col-span-7 rounded-3xl space-y-4 border border-[#CBD5E1]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                  اولویت ۱: نوبت‌های در انتظار تایید شما
                </h2>
                <p className="text-xs text-[#64748B]">
                  درخواست‌های رزرو جدید را مستقیم تایید یا تعیین تکلیف کنید
                </p>
              </div>
            </div>
            <Link
              to="/app/appointments"
              className="text-xs font-extrabold text-[#0057FF] hover:underline"
            >
              لیست کامل رزروها ←
            </Link>
          </div>

          {pendingAppointments.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#10B981] inline-flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#061138]">
                    همه نوبت‌های ورودی بررسی شده‌اند
                  </p>
                  <p className="text-xs text-[#64748B]">
                    در حال حاضر نوبت منتظر تاییدی وجود ندارد.
                  </p>
                </div>
              </div>
              <Link to="/app/calendar">
                <Button variant="outline" size="sm">
                  مشاهده تقویم
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {pendingAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={apt.customerName} size="sm" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#061138]">
                          {apt.customerName}
                        </span>
                        <span
                          dir="ltr"
                          className="font-mono text-[11px] font-bold text-[#0057FF] bg-[#E0ECFF] px-2 py-0.5 rounded-md"
                        >
                          {apt.customerPhoneMasked}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] truncate">
                        <strong className="text-[#061138]">
                          {apt.serviceTitle}
                        </strong>{' '}
                        · متخصص: {apt.specialistName} ·{' '}
                        <span className="tabular-nums font-bold text-[#0057FF]">
                          {apt.dateJalali} ساعت {apt.timeSlot}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        updateAppointmentStatus(
                          apt.id,
                          AppointmentStatus.Confirmed
                        )
                      }
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تایید نوبت</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateAppointmentStatus(
                          apt.id,
                          AppointmentStatus.Cancelled
                        )
                      }
                    >
                      <X className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span>لغو</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ستون چپ (۵ ستون): برنامه نوبت‌های امروز به ترتیب ساعت */}
        <Card className="lg:col-span-5 rounded-3xl space-y-4 border border-[#CBD5E1]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                برنامه نوبت‌های امروز
              </h2>
              <p className="text-xs text-[#64748B]">
                مراجعین امروز به ترتیب ساعت حضور
              </p>
            </div>

            <select
              aria-label="فیلتر متخصص"
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="rounded-full border border-[#CBD5E1] bg-[#F3F6FC] px-3 py-1.5 text-xs font-bold text-[#061138] focus:outline-none cursor-pointer"
            >
              <option value="ALL">
                همه متخصصان ({toPersianDigits(bizSpecialists.length)})
              </option>
              {bizSpecialists.map((sp) => (
                <option key={sp.id} value={sp.fullName}>
                  {sp.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {todayAppointmentsList.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] text-center space-y-1.5">
                <p className="text-xs font-extrabold text-[#061138]">
                  هنوز نوبتی برای امروز ثبت نشده است
                </p>
                <p className="text-[11px] text-[#64748B]">
                  با تکمیل خدمات و ساعات کاری، نوبت‌های رزرو شده مشتریان در این بخش نمایش داده می‌شود.
                </p>
              </div>
            ) : (
              todayAppointmentsList.slice(0, 4).map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2.5 py-1.5 rounded-xl bg-[#061138] text-[#00E5FF] text-xs font-black tabular-nums shrink-0">
                      {apt.timeSlot}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-extrabold text-[#061138] truncate">
                        {apt.serviceTitle}
                      </p>
                      <p className="text-[11px] font-medium text-[#475569] truncate">
                        مراجع: {apt.customerName} · متخصص: {apt.specialistName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {apt.inPersonSettled ? (
                      <span className="px-2 py-1 rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-extrabold">
                        تسویه حضوری ثبت شد ✓
                      </span>
                    ) : apt.status !== AppointmentStatus.Cancelled ? (
                      <button
                        type="button"
                        onClick={() => settleAppointmentInPerson(apt.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-[10px] font-extrabold transition-colors cursor-pointer"
                      >
                        + ثبت دریافتی حضوری ✓
                      </button>
                    ) : null}
                    <Link
                      to="/app/calendar"
                      className="text-[11px] font-extrabold text-[#0057FF] hover:underline shrink-0"
                    >
                      تقویم
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* نمودار روند درآمد و سهم خدمات در داشبورد (همیشه قابل مشاهده حتی با مقدار صفر) */}
      {(() => {
        const manualIncomeTotal = currentBiz
          ? dailyIncomeLogs
              .filter(
                (log) =>
                  log.businessId === currentBiz.id &&
                  log.entryType === 'DAILY_BULK'
              )
              .reduce((s, l) => s + (l.amountToman || 0), 0)
          : 0;
        const dashboardMonthlyRevenue =
          bizAppointments
            .filter(
              (a) =>
                a.status === AppointmentStatus.Confirmed ||
                a.status === AppointmentStatus.Completed
            )
            .reduce((sum, a) => sum + a.priceToman, 0) + manualIncomeTotal;
        const breakdownRows =
          bizServicesList.length > 0
            ? bizServicesList.slice(0, 4).map((srv: ServiceItem) => {
                const srvApts = bizAppointments.filter(
                  (a) =>
                    a.serviceTitle === srv.title &&
                    (a.status === AppointmentStatus.Confirmed ||
                      a.status === AppointmentStatus.Completed)
                );
                const srvRev = srvApts.reduce(
                  (sum, a) => sum + a.priceToman,
                  0
                );
                const pct =
                  dashboardMonthlyRevenue > 0
                    ? Math.round((srvRev / dashboardMonthlyRevenue) * 100)
                    : 0;
                return {
                  title: srv.title,
                  rev: srvRev,
                  pct,
                };
              })
            : [
                { title: 'خدمت شماره ۱ (نمونه)', rev: 0, pct: 0 },
                { title: 'خدمت شماره ۲ (نمونه)', rev: 0, pct: 0 },
                { title: 'خدمت شماره ۳ (نمونه)', rev: 0, pct: 0 },
              ];

        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#061138]">
                    روند ۶ ماهه درآمد و نوبت‌های مرکز
                  </h2>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    با ثبت هر نوبت جدید، ستون‌های نمودار به‌صورت زنده تکمیل می‌شوند
                  </p>
                </div>
                <Link
                  to="/app/analytics"
                  className="text-[11px] font-extrabold text-[#0057FF] hover:underline"
                >
                  گزارش کامل ←
                </Link>
              </div>
              <div className="h-36 pt-4 flex items-end justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                {['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'].map(
                  (mName, idx) => {
                    const isCurrentMonth = idx === 5;
                    const valM = isCurrentMonth
                      ? Number((dashboardMonthlyRevenue / 1_000_000).toFixed(1))
                      : 0;
                    const barHeightPct =
                      valM > 0 ? Math.max(14, Math.min(100, valM * 8)) : 6;
                    return (
                      <div
                        key={mName}
                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                      >
                        <span className="text-[10px] font-bold text-[#64748B] tabular-nums">
                          {valM > 0 ? `${toPersianDigits(valM)}M` : '۰'}
                        </span>
                        <div
                          className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                            valM > 0 ? 'bg-[#0057FF]' : 'bg-[#E2E8F0]'
                          }`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                        <span className="text-[11px] font-semibold text-[#475569]">
                          {mName}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </Card>

            <Card className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs sm:text-sm font-extrabold text-[#061138]">
                  سهم خدمات از نوبت‌های ماه
                </h2>
                <span className="text-[11px] font-bold text-[#64748B] tabular-nums">
                  مجموع: {formatPriceToman(dashboardMonthlyRevenue)}
                </span>
              </div>
              <div className="space-y-3 pt-1">
                {breakdownRows.map((row) => (
                  <div key={row.title} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#061138] truncate max-w-[180px]">
                        {row.title}
                      </span>
                      <span className="tabular-nums text-[11px] text-[#64748B] font-semibold">
                        {toPersianDigits(row.pct)}٪ ({formatPriceToman(row.rev)})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div
                        className="h-full bg-[#0057FF] rounded-full transition-all"
                        style={{ width: `${Math.max(row.pct, 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ۵. اولویت دوم: میانبرهای کاربردی روزانه سالن‌دار */}
      <section aria-label="میانبرهای سریع مدیریت سالن" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-extrabold text-[#475569]">
            دسترسی سریع به بخش‌های پرکاربرد سالن
          </h2>
          <span className="text-[11px] font-medium text-[#64748B]">
            سایر بخش‌ها و زیرمجموعه‌ها از نوار پایین صفحه در دسترس هستند
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/app/customers?add=1"
            className="p-4 rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] flex items-center justify-between gap-3 transition-all shadow-2xs group"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-[#061138] group-hover:text-[#0057FF] truncate">
                + ثبت دستی مشتری حضوری
              </p>
              <p className="text-[11px] text-[#64748B] truncate">
                افزودن تکی یا گروهی مشتریان قدیمی
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#64748B] group-hover:text-[#0057FF] shrink-0" />
          </Link>

          <Link
            to="/app/services"
            className="p-4 rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] flex items-center justify-between gap-3 transition-all shadow-2xs group"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-[#061138] group-hover:text-[#0057FF] truncate">
                مدیریت خدمات و تعرفه‌ها
              </p>
              <p className="text-[11px] text-[#64748B] truncate">
                ویرایش قیمت‌ها و زمان هر خدمت
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#64748B] group-hover:text-[#0057FF] shrink-0" />
          </Link>

          <Link
            to="/app/working-hours"
            className="p-4 rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] flex items-center justify-between gap-3 transition-all shadow-2xs group"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-[#061138] group-hover:text-[#0057FF] truncate">
                روزها و ساعات کاری
              </p>
              <p className="text-[11px] text-[#64748B] truncate">
                تعیین روزهای باز و شیفت پذیرش
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#64748B] group-hover:text-[#0057FF] shrink-0" />
          </Link>

          <Link
            to="/app/profile#financial-section"
            className="p-4 rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] flex items-center justify-between gap-3 transition-all shadow-2xs group"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-xs sm:text-sm font-extrabold text-[#061138] group-hover:text-[#0057FF] truncate">
                پروفایل سالن و شماره شبا
              </p>
              <p className="text-[11px] text-[#64748B] truncate">
                اطلاعات تسویه، آدرس و عکس سالن
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-[#64748B] group-hover:text-[#0057FF] shrink-0" />
          </Link>
        </div>
      </section>
    </div>
  );
};


/** ۲. تقویم نوبت‌ها (/app/calendar) */
export const BusinessCalendarPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    appointments,
    specialists,
    updateAppointmentStatus,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);

  const bizAppointments = currentBiz
    ? appointments.filter(
        (a) =>
          a.businessId === currentBiz.id ||
          a.businessSlug === currentBiz.slug ||
          a.businessName === currentBiz.name
      )
    : [];
  const bizSpecialistsRaw = currentBiz
    ? specialists.filter((s) => s.businessId === currentBiz.id)
    : [];
  const calendarStaffList: SpecialistItem[] =
    bizSpecialistsRaw.length > 0
      ? bizSpecialistsRaw
      : [
          {
            id: 'owner-default-col',
            businessId: currentBiz?.id || 'biz-owner-zero',
            slug: 'owner-col',
            fullName: currentBiz?.ownerName || 'مدیر سالن',
            roleTitle: 'پذیرش اصلی سالن',
            experienceYears: 1,
            rating: 5.0,
            reviewCount: 0,
            specialties: [],
            bio: '',
            isIndependent: false,
            isActive: true,
          },
        ];

  const upcomingDays = getUpcomingJalaliDays(7);
  const calendarDays = upcomingDays.map((d) => ({
    label: d.fullLabel,
    date: d.dateJalali,
  }));

  const currentDay = calendarDays[selectedDayIndex] ?? calendarDays[0];
  const timeSlots = [
    '۰۹:۳۰',
    '۱۰:۰۰',
    '۱۱:۰۰',
    '۱۲:۳۰',
    '۱۳:۳۰',
    '۱۵:۰۰',
    '۱۶:۳۰',
    '۱۷:۰۰',
  ];
  const visibleStaff =
    staffFilter === 'ALL'
      ? calendarStaffList
      : calendarStaffList.filter((s) => s.id === staffFilter);

  return (
    <div>
      <PageHeader
        kicker="فعالیت روزانه · تقویم سالن"
        title="تقویم زمان‌بندی نوبت‌ها"
        subtitle="مشاهده برنامه روزانه متخصصان، بازه‌های آزاد و تغییر سریع وضعیت هر نوبت"
        routePattern="/app/calendar"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تقویم نوبت‌ها' },
        ]}
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6E0F5]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedDayIndex <= 0}
              onClick={() => setSelectedDayIndex((i) => Math.max(0, i - 1))}
              aria-label="روز قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="text-center px-3.5 py-1.5 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5]">
              <span className="text-sm font-extrabold text-[#1E1B2E] tabular-nums">
                {currentDay.label}
              </span>
              <span className="text-xs text-[#6B6480] mr-2 tabular-nums">
                ({currentDay.date})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedDayIndex >= calendarDays.length - 1}
              onClick={() =>
                setSelectedDayIndex((i) =>
                  Math.min(calendarDays.length - 1, i + 1)
                )
              }
              aria-label="روز بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="فیلتر متخصص در تقویم"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="rounded-xl border border-[#D4C9EE] bg-white px-3.5 py-2 text-xs font-bold text-[#1E1B2E] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="ALL">همه متخصصان (نمای ستونی)</option>
              {calendarStaffList.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.fullName}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-[#FAF8FF] p-1 rounded-xl border border-[#E6E0F5]">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  viewMode === 'day'
                    ? 'bg-[#8B5CF6] text-white shadow-2xs'
                    : 'text-[#6B6480] hover:text-[#1E1B2E]'
                }`}
              >
                نمای روزانه
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  viewMode === 'week'
                    ? 'bg-[#8B5CF6] text-white shadow-2xs'
                    : 'text-[#6B6480] hover:text-[#1E1B2E]'
                }`}
              >
                نمای هفتگی
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'day' ? (
          <div className="overflow-x-auto rounded-2xl border border-[#E6E0F5]">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E6E0F5] bg-[#FAF8FF]">
                  <th className="py-3.5 px-3 text-right w-24 font-extrabold text-[#6B6480]">
                    ساعت
                  </th>
                  {visibleStaff.map((sp) => (
                    <th
                      key={sp.id}
                      className="py-3.5 px-4 text-right font-extrabold text-[#1E1B2E] border-r border-[#E6E0F5]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={sp.fullName} size="sm" tone="violet" />
                        <div>
                          <p className="text-xs font-extrabold">{sp.fullName}</p>
                          <p className="text-[11px] font-medium text-[#6B6480]">
                            {sp.roleTitle}
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E0F5]">
                {timeSlots.map((slot) => (
                  <tr key={slot} className="hover:bg-[#FAF8FF]/50">
                    <td className="py-4 px-3 font-extrabold text-[#6B6480] tabular-nums bg-[#FAF8FF]/40">
                      {slot}
                    </td>
                    {visibleStaff.map((sp) => {
                      const matched = bizAppointments.find(
                        (a) =>
                          a.timeSlot === slot &&
                          (a.specialistId === sp.id ||
                            a.specialistName === sp.fullName ||
                            calendarStaffList.length === 1)
                      );
                      const statusMeta = matched
                        ? getAppointmentStatusMeta(matched.status)
                        : null;
                      return (
                        <td
                          key={sp.id}
                          className="p-2.5 border-r border-[#E6E0F5] align-top"
                        >
                          {matched && statusMeta ? (
                            <button
                              type="button"
                              onClick={() => setSelectedApt(matched)}
                              className="w-full text-right p-3 rounded-xl bg-[#EDE9FE]/80 hover:bg-[#EDE9FE] border border-[#D4C9EE] space-y-1.5 cursor-pointer transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-[#1E1B2E]">
                                  {matched.customerName}
                                </span>
                                <StatusBadge
                                  label={statusMeta.label}
                                  tone={statusMeta.tone}
                                />
                              </div>
                              <p className="text-[11px] font-medium text-[#6B6480]">
                                {matched.serviceTitle}
                              </p>
                              <p className="text-[10px] text-[#8B5CF6]">
                                تلفن مراجع:{' '}
                                <span dir="ltr" className="font-mono font-bold">
                                  {matched.customerPhoneMasked}
                                </span>
                              </p>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl border border-dashed border-[#E6E0F5] text-[#6B6480] text-[11px] flex items-center justify-between">
                              <span>بازه آزاد</span>
                              <span className="text-[10px]">قابل رزرو</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {calendarDays.slice(0, 6).map((d) => (
              <div
                key={d.date}
                className="p-4 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-2.5">
                  <p className="text-xs font-extrabold text-[#1E1B2E]">
                    {d.label}
                  </p>
                  <span className="text-[11px] text-[#6B6480] tabular-nums">
                    {d.date}
                  </span>
                </div>
                {appointments.slice(0, 3).map((apt) => (
                  <button
                    key={`${d.date}-${apt.id}`}
                    type="button"
                    onClick={() => setSelectedApt(apt)}
                    className="w-full text-right p-3 rounded-xl bg-white hover:border-[#8B5CF6] border border-[#E6E0F5] text-xs space-y-1 cursor-pointer transition-all"
                  >
                    <p className="font-extrabold text-[#1E1B2E] tabular-nums">
                      ساعت {apt.timeSlot} — {apt.customerName}
                    </p>
                    <p className="text-[#6B6480]">{apt.serviceTitle}</p>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* مودال جزئیات نوبت در تقویم */}
      <Modal
        isOpen={Boolean(selectedApt)}
        onClose={() => setSelectedApt(null)}
        title="جزئیات و تغییر وضعیت نوبت"
        description={selectedApt?.referenceCode}
        footer={
          selectedApt ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  updateAppointmentStatus(
                    selectedApt.id,
                    AppointmentStatus.Confirmed
                  );
                  setSelectedApt(null);
                }}
              >
                تایید نوبت
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateAppointmentStatus(
                    selectedApt.id,
                    AppointmentStatus.Completed
                  );
                  setSelectedApt(null);
                }}
              >
                ثبت انجام‌شده
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  updateAppointmentStatus(
                    selectedApt.id,
                    AppointmentStatus.Cancelled
                  );
                  setSelectedApt(null);
                }}
              >
                لغو نوبت
              </Button>
            </div>
          ) : null
        }
      >
        {selectedApt ? (
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">مشتری:</span>
              <span className="font-extrabold text-[#1E1B2E]">
                {selectedApt.customerName} ({selectedApt.customerPhoneMasked})
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">خدمت:</span>
              <span className="font-bold text-[#1E1B2E]">
                {selectedApt.serviceTitle}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">متخصص:</span>
              <span className="font-bold text-[#1E1B2E]">
                {selectedApt.specialistName}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">زمان مراجعه:</span>
              <span className="font-bold tabular-nums text-[#1E1B2E]">
                {selectedApt.dateJalali} ساعت {selectedApt.timeSlot}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#6B6480]">مبلغ خدمت:</span>
              <span className="font-extrabold text-[#8B5CF6] tabular-nums">
                {formatPriceToman(selectedApt.priceToman)}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

/** ۳. مدیریت نوبت‌ها (/app/appointments) */
export const BusinessAppointmentsPage: React.FC = () => {
  const { appointments, specialists, updateAppointmentStatus } =
    usePrototypeData();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>(
    'ALL'
  );
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [detailApt, setDetailApt] = useState<AppointmentItem | null>(null);

  const uniqueDates = Array.from(
    new Set(appointments.map((a) => a.dateJalali).filter(Boolean))
  );

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchStaff =
      staffFilter === 'ALL' || a.specialistName === staffFilter;
    const matchDate = dateFilter === 'ALL' || a.dateJalali === dateFilter;
    return matchStatus && matchStaff && matchDate;
  });

  return (
    <div>
      <PageHeader
        kicker="فعالیت روزانه · فهرست نوبت‌ها"
        title="مدیریت نوبت‌ها"
        subtitle="جست‌وجو و فیلتر نوبت‌ها بر اساس وضعیت، متخصص و تاریخ مراجعه همراه با امکان تغییر وضعیت"
        routePattern="/app/appointments"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'مدیریت نوبت‌ها' },
        ]}
      />

      <Card className="mb-6 space-y-4">
        {/* نوار وضعیت سریع */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6E0F5]">
          {[
            { id: 'ALL', label: 'همه نوبت‌ها', count: appointments.length },
            {
              id: AppointmentStatus.Pending,
              label: 'در انتظار تایید',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Pending
              ).length,
            },
            {
              id: AppointmentStatus.Confirmed,
              label: 'تاییدشده',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Confirmed
              ).length,
            },
            {
              id: AppointmentStatus.Completed,
              label: 'انجام‌شده',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Completed
              ).length,
            },
            {
              id: AppointmentStatus.Cancelled,
              label: 'لغوشده',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Cancelled
              ).length,
            },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setStatusFilter(tab.id as AppointmentStatus | 'ALL')
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#FAF8FF] text-[#6B6480] border border-[#E6E0F5] hover:text-[#1E1B2E]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[11px] tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-[#E6E0F5]'
                  }`}
                >
                  {toPersianDigits(tab.count)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField id="apt-status-filter" label="فیلتر وضعیت">
            <Select
              id="apt-status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as AppointmentStatus | 'ALL')
              }
              options={[
                { value: 'ALL', label: 'همه وضعیت‌ها' },
                { value: AppointmentStatus.Confirmed, label: 'تاییدشده' },
                { value: AppointmentStatus.Pending, label: 'در انتظار تایید' },
                { value: AppointmentStatus.Completed, label: 'انجام‌شده' },
                { value: AppointmentStatus.Cancelled, label: 'لغوشده' },
              ]}
            />
          </FormField>

          <FormField id="apt-staff-filter" label="فیلتر متخصص">
            <Select
              id="apt-staff-filter"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'همه متخصصان' },
                ...specialists.map((sp) => ({
                  value: sp.fullName,
                  label: sp.fullName,
                })),
              ]}
            />
          </FormField>

          <FormField id="apt-date-filter" label="فیلتر تاریخ مراجعه">
            <Select
              id="apt-date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'همه تاریخ‌ها' },
                ...uniqueDates.map((d) => ({ value: d, label: d })),
              ]}
            />
          </FormField>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="نوبتی با این فیلترها یافت نشد"
          onAction={() => {
            setStatusFilter('ALL');
            setStaffFilter('ALL');
            setDateFilter('ALL');
          }}
        />
      ) : (
        <ResponsiveTable<AppointmentItem>
          keyExtractor={(r) => r.id}
          data={filtered}
          columns={[
            {
              key: 'phone',
              header: 'شماره تماس مشتری',
              render: (r) => (
                <span
                  dir="ltr"
                  className="font-mono text-xs font-bold text-[#0057FF] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]"
                >
                  {r.customerPhoneMasked}
                </span>
              ),
            },
            {
              key: 'customer',
              header: 'مشتری و زمان',
              render: (r) => (
                <div>
                  <p className="font-extrabold text-[#1E1B2E]">
                    {r.customerName}
                  </p>
                  <p className="text-xs text-[#6B6480] tabular-nums">
                    {r.dateJalali} · ساعت {r.timeSlot}
                  </p>
                </div>
              ),
            },
            {
              key: 'service',
              header: 'خدمت / متخصص',
              render: (r) => (
                <div>
                  <p className="font-bold text-[#1E1B2E]">{r.serviceTitle}</p>
                  <p className="text-xs text-[#6B6480]">{r.specialistName}</p>
                </div>
              ),
            },
            {
              key: 'price',
              header: 'مبلغ',
              align: 'left',
              render: (r) => (
                <span className="tabular-nums font-extrabold text-[#8B5CF6]">
                  {formatPriceToman(r.priceToman)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'وضعیت',
              render: (r) => {
                const meta = getAppointmentStatusMeta(r.status);
                return <StatusBadge label={meta.label} tone={meta.tone} />;
              },
            },
            {
              key: 'action',
              header: 'عملیات',
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailApt(r)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>جزئیات و وضعیت</span>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={Boolean(detailApt)}
        onClose={() => setDetailApt(null)}
        title="مدیریت وضعیت نوبت"
        description={detailApt?.referenceCode}
      >
        {detailApt ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-1.5 text-xs">
              <p className="font-extrabold text-[#1E1B2E]">
                {detailApt.customerName} — {detailApt.serviceTitle}
              </p>
              <p className="text-[#6B6480]">
                متخصص: {detailApt.specialistName} · زمان: {detailApt.dateJalali}{' '}
                ساعت {detailApt.timeSlot}
              </p>
              {detailApt.notes ? (
                <p className="text-[#6B6480]">یادداشت: {detailApt.notes}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#1E1B2E]">
                تغییر وضعیت نوبت:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { st: AppointmentStatus.Confirmed, label: 'تاییدشده' },
                  { st: AppointmentStatus.Pending, label: 'در انتظار تایید' },
                  { st: AppointmentStatus.Completed, label: 'انجام‌شده' },
                  { st: AppointmentStatus.Cancelled, label: 'لغوشده' },
                ].map((opt) => (
                  <Button
                    key={opt.st}
                    variant={
                      detailApt.status === opt.st ? 'primary' : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      updateAppointmentStatus(detailApt.id, opt.st);
                      setDetailApt({ ...detailApt, status: opt.st });
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

/** ۴. خدمات و تعرفه‌ها (/app/services) — مجهز به ۳ مدل قیمت‌گذاری، شخصی‌سازی کامل پکیج و خدمت، و نمایش کیت آماده فقط متناسب با حوزه تخصصی کسب‌وکار */
export const BusinessServicesPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    services,
    categories,
    addService,
    updateService,
    deleteService,
    updateBusinessProfile,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  // تشخیص دقیق حوزه تخصصی کسب‌وکار تا فقط کیت مربوط به همان حوزه نمایش داده شود
  const detectedPrimaryCategory = React.useMemo(() => {
    const slug = (currentBiz?.categorySlug || '').toLowerCase();
    const label = `${currentBiz?.typeLabel || ''} ${currentBiz?.name || ''} ${currentBiz?.shortDescription || ''}`;
    if (
      slug.includes('laser') ||
      label.includes('لیزر') ||
      currentBiz?.targetGender === 'BOTH'
    ) {
      return 'لیزر موهای زائد';
    }
    if (
      slug.includes('skin') ||
      slug.includes('facial') ||
      label.includes('پوست') ||
      label.includes('فیشیال') ||
      label.includes('فیشال') ||
      label.includes('اسکین') ||
      label.includes('پاکسازی')
    ) {
      return 'پوست و فیشیال';
    }
    if (
      slug.includes('barber') ||
      slug.includes('men') ||
      currentBiz?.type === 'MEN_BARBERSHOP' ||
      label.includes('مردانه') ||
      label.includes('پیرایش')
    ) {
      return 'پیرایش و استایل مردانه';
    }
    if (
      slug.includes('nail') ||
      label.includes('ناخن') ||
      label.includes('مانیکور') ||
      label.includes('پدیکور')
    ) {
      return 'کاشت و طراحی ناخن';
    }
    if (
      slug.includes('makeup') ||
      slug.includes('bridal') ||
      label.includes('میکاپ') ||
      label.includes('عروس') ||
      label.includes('گریم')
    ) {
      return 'میکاپ و عروس';
    }
    if (
      slug.includes('lash') ||
      slug.includes('brow') ||
      label.includes('مژه') ||
      label.includes('ابرو') ||
      label.includes('فیبروز') ||
      label.includes('لیفت')
    ) {
      return 'مژه و ابرو';
    }
    return 'مو و رنگ';
  }, [currentBiz]);

  // کیت فقط مربوط به حوزه تخصصی خودِ کسب‌وکار نمایش داده می‌شود
  const activeKitCategory = detectedPrimaryCategory;

  // صفحه در ابتدا تمیز و بسته باشد؛ کیت فقط با کلیک کاربر باز شود
  const [kitPanelOpen, setKitPanelOpen] = useState<boolean>(false);
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);

  const [selectedLaserDevice, setSelectedLaserDevice] = useState<string>(
    currentBiz?.laserDeviceModel || LASER_DEVICE_PRESETS[0]
  );
  const [laserFilterTab, setLaserFilterTab] = useState<
    'WOMEN_PACKAGES' | 'WOMEN_SINGLE' | 'MEN_PACKAGES' | 'MEN_SINGLE'
  >('WOMEN_PACKAGES');
  const [facialFilterTab, setFacialFilterTab] = useState<
    'FACIAL_PACKAGES' | 'THERAPY_PACKAGES' | 'SINGLE_FACIAL'
  >('FACIAL_PACKAGES');

  // استیت‌های فرم شخصی‌سازی کامل خدمت و پکیج
  const [serviceMode, setServiceMode] = useState<'SINGLE' | 'PACKAGE'>(
    'PACKAGE'
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(detectedPrimaryCategory);
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [pricingType, setPricingType] = useState<
    'FIXED' | 'RANGE' | 'STARTING_FROM'
  >('RANGE');
  const [priceToman, setPriceToman] = useState('650000');
  const [maxPriceToman, setMaxPriceToman] = useState('950000');
  const [selectedPackageStages, setSelectedPackageStages] = useState<string[]>(
    []
  );
  const [customStageInput, setCustomStageInput] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const bizServices = currentBiz
    ? services.filter((s) => s.businessId === currentBiz.id)
    : [];
  const uniqueCats = Array.from(new Set(bizServices.map((s) => s.category)));
  const visibleServices =
    selectedCat === 'ALL'
      ? bizServices
      : bizServices.filter((s) => s.category === selectedCat);
  const suggestedTitles = getSuggestedServiceTitlesForCategory(category);
  const currentChecklist =
    CATEGORY_PACKAGE_STAGE_CHECKLISTS[category] ??
    CATEGORY_PACKAGE_STAGE_CHECKLISTS['پوست و فیشیال'];

  const handleClearAllServices = () => {
    if (bizServices.length === 0) return;
    bizServices.forEach((srv) => {
      deleteService(srv.id);
    });
    setSelectedCat('ALL');
    setConfirmClearAllOpen(false);
    showToast('تمام خدمات سالن با موفقیت پاک شدند.');
  };

  // باز کردن مودال شخصی‌سازی با اطلاعات پیش‌فرض یک آیتم از کیت آماده
  const openCustomizePresetModal = (preset: {
    title: string;
    category: string;
    durationMinutes: number;
    pricingType: 'FIXED' | 'RANGE' | 'STARTING_FROM';
    priceToman: number;
    maxPriceToman?: number;
    packageIncludes?: string[];
    description: string;
  }) => {
    setEditingService(null);
    setTitle(preset.title);
    setCategory(preset.category);
    setDurationMinutes(String(preset.durationMinutes));
    setPricingType(preset.pricingType);
    setPriceToman(formatNumericInputWithCommas(String(preset.priceToman)));
    setMaxPriceToman(
      formatNumericInputWithCommas(
        String(
          preset.maxPriceToman || Math.round((preset.priceToman || 500000) * 1.4)
        )
      )
    );
    const stages = preset.packageIncludes ?? [];
    setSelectedPackageStages(stages);
    setServiceMode(stages.length > 0 ? 'PACKAGE' : 'SINGLE');
    setCustomStageInput('');
    setDescription(preset.description);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleBulkAddFacialPresets = (
    group: 'FACIAL_PACKAGES' | 'THERAPY_PACKAGES' | 'SINGLE_FACIAL' | 'ALL'
  ) => {
    if (!currentBiz) return;
    const presets =
      group === 'ALL'
        ? FACIAL_SERVICE_PRESETS
        : FACIAL_SERVICE_PRESETS.filter((p) => p.group === group);
    const existingTitles = new Set(bizServices.map((s) => s.title.trim()));
    let addedCount = 0;

    presets.forEach((preset) => {
      if (!existingTitles.has(preset.title.trim())) {
        addService({
          businessId: currentBiz.id,
          categorySlug: 'skincare-facial',
          title: preset.title,
          category: 'پوست و فیشیال',
          durationMinutes: preset.durationMinutes,
          pricingType: preset.pricingType,
          priceToman: preset.priceToman,
          maxPriceToman: preset.maxPriceToman,
          packageIncludes: preset.packageIncludes,
          description: preset.description,
          isActive: true,
        });
        addedCount += 1;
      }
    });

    if (addedCount > 0) {
      showToast(
        `${toPersianDigits(addedCount)} پکیج و خدمت تخصصی «پوست و فیشیال» همراه با مراحل پکیج و بازه قیمتی اضافه شد ✓`
      );
    } else {
      showToast('تمام پکیج‌های این بخش قبلاً به لیست خدمات شما اضافه شده‌اند.');
    }
  };

  const handleAddSingleFacialPreset = (
    preset: (typeof FACIAL_SERVICE_PRESETS)[number]
  ) => {
    if (!currentBiz) return;
    const exists = bizServices.some(
      (s) => s.title.trim() === preset.title.trim()
    );
    if (exists) {
      showToast('این پکیج یا خدمت فیشیال قبلاً ثبت شده است.');
      return;
    }
    addService({
      businessId: currentBiz.id,
      categorySlug: 'skincare-facial',
      title: preset.title,
      category: 'پوست و فیشیال',
      durationMinutes: preset.durationMinutes,
      pricingType: preset.pricingType,
      priceToman: preset.priceToman,
      maxPriceToman: preset.maxPriceToman,
      packageIncludes: preset.packageIncludes,
      description: preset.description,
      isActive: true,
    });
    showToast(`«${preset.title}» با مراحل پکیج و بازه قیمت اضافه شد ✓`);
  };

  const handleAddOtherDomainPreset = (
    preset: (typeof OTHER_DOMAIN_SERVICE_PRESETS)[number]
  ) => {
    if (!currentBiz) return;
    const exists = bizServices.some(
      (s) => s.title.trim() === preset.title.trim()
    );
    if (exists) {
      showToast('این پکیج یا خدمت قبلاً در لیست شما ثبت شده است.');
      return;
    }
    addService({
      businessId: currentBiz.id,
      categorySlug: preset.categorySlug,
      title: preset.title,
      category: preset.domainCategory,
      durationMinutes: preset.durationMinutes,
      pricingType: preset.pricingType,
      priceToman: preset.priceToman,
      maxPriceToman: preset.maxPriceToman,
      packageIncludes: preset.packageIncludes,
      description: preset.description,
      isActive: true,
    });
    showToast(`«${preset.title}» با موفقیت به لیست خدمات شما اضافه شد ✓`);
  };

  const handleBulkAddOtherDomainPresets = (domainCat: string) => {
    if (!currentBiz) return;
    const list = OTHER_DOMAIN_SERVICE_PRESETS.filter(
      (p) => p.domainCategory === domainCat
    );
    const existingTitles = new Set(bizServices.map((s) => s.title.trim()));
    let addedCount = 0;
    list.forEach((preset) => {
      if (!existingTitles.has(preset.title.trim())) {
        addService({
          businessId: currentBiz.id,
          categorySlug: preset.categorySlug,
          title: preset.title,
          category: preset.domainCategory,
          durationMinutes: preset.durationMinutes,
          pricingType: preset.pricingType,
          priceToman: preset.priceToman,
          maxPriceToman: preset.maxPriceToman,
          packageIncludes: preset.packageIncludes,
          description: preset.description,
          isActive: true,
        });
        addedCount += 1;
      }
    });
    if (addedCount > 0) {
      showToast(
        `${toPersianDigits(addedCount)} پکیج تخصصی «${domainCat}» یکجا اضافه شد ✓`
      );
    } else {
      showToast('تمام پکیج‌های این بخش قبلاً اضافه شده‌اند.');
    }
  };

  const handleBulkAddLaserPresets = (
    group: 'WOMEN_PACKAGES' | 'WOMEN_SINGLE' | 'MEN_PACKAGES' | 'MEN_SINGLE'
  ) => {
    if (!currentBiz) return;
    const deviceLabel =
      selectedLaserDevice.trim() || LASER_DEVICE_PRESETS[0];
    const presets = LASER_SERVICE_PRESETS.filter((p) => p.group === group);
    const existingTitles = new Set(bizServices.map((s) => s.title.trim()));
    let addedCount = 0;

    presets.forEach((preset) => {
      if (!existingTitles.has(preset.title.trim())) {
        addService({
          businessId: currentBiz.id,
          categorySlug: 'laser-hair-removal',
          title: preset.title,
          category: 'لیزر موهای زائد',
          durationMinutes: preset.durationMinutes,
          pricingType: 'FIXED',
          priceToman: preset.priceToman,
          description: `${preset.categoryLabel} · ${preset.description} — دستگاه: ${deviceLabel}`,
          isActive: true,
        });
        addedCount += 1;
      }
    });

    updateBusinessProfile(currentBiz.id, {
      categorySlug: 'laser-hair-removal',
      targetGender: 'BOTH',
      laserDeviceModel: deviceLabel,
    });

    if (addedCount > 0) {
      showToast(
        `${toPersianDigits(addedCount)} خدمت در دسته‌بندی «لیزر موهای زائد» با دستگاه «${deviceLabel}» یکجا اضافه شد ✓`
      );
    } else {
      showToast('تمام موارد این بسته قبلاً به لیست خدمات شما اضافه شده‌اند.');
    }
  };

  const handleAddSingleLaserPreset = (
    preset: (typeof LASER_SERVICE_PRESETS)[number]
  ) => {
    if (!currentBiz) return;
    const deviceLabel =
      selectedLaserDevice.trim() || LASER_DEVICE_PRESETS[0];
    const exists = bizServices.some(
      (s) => s.title.trim() === preset.title.trim()
    );
    if (exists) {
      showToast('این ناحیه یا پکیج قبلاً در فهرست خدمات شما ثبت شده است.');
      return;
    }
    addService({
      businessId: currentBiz.id,
      categorySlug: 'laser-hair-removal',
      title: preset.title,
      category: 'لیزر موهای زائد',
      durationMinutes: preset.durationMinutes,
      pricingType: 'FIXED',
      priceToman: preset.priceToman,
      description: `${preset.categoryLabel} · ${preset.description} — دستگاه: ${deviceLabel}`,
      isActive: true,
    });
    showToast(`«${preset.title}» در دسته لیزر موهای زائد اضافه شد ✓`);
  };

  const openAddModal = (initialMode: 'SINGLE' | 'PACKAGE' = 'PACKAGE') => {
    setEditingService(null);
    setServiceMode(initialMode);
    setTitle('');
    setCategory(activeKitCategory || detectedPrimaryCategory);
    setDurationMinutes('60');
    setPricingType(
      activeKitCategory === 'پوست و فیشیال' ||
        activeKitCategory === 'مو و رنگ' ||
        initialMode === 'PACKAGE'
        ? 'RANGE'
        : 'FIXED'
    );
    setPriceToman(formatNumericInputWithCommas('650000'));
    setMaxPriceToman(formatNumericInputWithCommas('980000'));
    setSelectedPackageStages([]);
    setCustomStageInput('');
    setDescription('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    const stages = srv.packageIncludes ?? [];
    setServiceMode(stages.length > 0 ? 'PACKAGE' : 'SINGLE');
    setTitle(srv.title);
    setCategory(
      srv.categorySlug === 'laser-hair-removal' || srv.category.includes('لیزر')
        ? 'لیزر موهای زائد'
        : srv.category
    );
    setDurationMinutes(String(srv.durationMinutes));
    setPricingType(srv.pricingType || 'FIXED');
    setPriceToman(formatNumericInputWithCommas(String(srv.priceToman)));
    setMaxPriceToman(
      formatNumericInputWithCommas(
        String(
          srv.maxPriceToman || Math.round((srv.priceToman || 500000) * 1.4)
        )
      )
    );
    setSelectedPackageStages(stages);
    setCustomStageInput('');
    setDescription(srv.description);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleToggleStageInModal = (stageText: string) => {
    setSelectedPackageStages((prev) =>
      prev.includes(stageText)
        ? prev.filter((item) => item !== stageText)
        : [...prev, stageText]
    );
  };

  const handleAddCustomStageInModal = () => {
    const clean = customStageInput.trim();
    if (!clean) return;
    if (!selectedPackageStages.includes(clean)) {
      setSelectedPackageStages((prev) => [...prev, clean]);
    }
    setCustomStageInput('');
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseNumericInput(priceToman);
    const numericMaxPrice = parseNumericInput(maxPriceToman);
    const numericDuration = parseNumericInput(durationMinutes) || 60;
    const validation = validateServiceForm({
      title,
      category,
      durationMinutes: numericDuration,
      priceToman: numericPrice,
    });
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const finalStages =
      serviceMode === 'PACKAGE'
        ? selectedPackageStages.map((s) => s.trim()).filter(Boolean)
        : [];

    const matchedCat = (
      categories.length > 0 ? categories : SAMPLE_CATEGORIES
    ).find((c) => c.title === category);
    const resolvedCategorySlug =
      category.includes('لیزر')
        ? 'laser-hair-removal'
        : category.includes('پوست') || category.includes('فیشیال')
        ? 'skincare-facial'
        : matchedCat?.slug ?? editingService?.categorySlug ?? 'hair-color';

    const resolvedMaxPrice =
      pricingType === 'RANGE'
        ? Math.max(
            numericPrice + 50000,
            numericMaxPrice || numericPrice + 200000
          )
        : undefined;

    if (editingService) {
      updateService(editingService.id, {
        categorySlug: resolvedCategorySlug,
        title: title.trim(),
        category,
        durationMinutes: numericDuration,
        pricingType,
        priceToman: numericPrice,
        maxPriceToman: resolvedMaxPrice,
        packageIncludes: finalStages.length > 0 ? finalStages : undefined,
        description: description.trim() || 'خدمت تخصصی زیبایی',
      });
    } else {
      addService({
        businessId: currentBiz?.id ?? 'biz-owner-zero',
        categorySlug: resolvedCategorySlug,
        title: title.trim(),
        category,
        durationMinutes: numericDuration,
        pricingType,
        priceToman: numericPrice,
        maxPriceToman: resolvedMaxPrice,
        packageIncludes: finalStages.length > 0 ? finalStages : undefined,
        description: description.trim() || 'خدمت تخصصی سالن زیبایی',
        isActive: true,
      });
    }
    setModalOpen(false);
  };

  const activeLaserPresets = LASER_SERVICE_PRESETS.filter(
    (p) => p.group === laserFilterTab
  );
  const activeFacialPresets = FACIAL_SERVICE_PRESETS.filter(
    (p) => p.group === facialFilterTab
  );
  const activeOtherDomainPresets = OTHER_DOMAIN_SERVICE_PRESETS.filter(
    (p) => p.domainCategory === activeKitCategory
  );

  const allKitDomains = [
    'پوست و فیشیال',
    'لیزر موهای زائد',
    'مو و رنگ',
    'کاشت و طراحی ناخن',
    'میکاپ و عروس',
    'مژه و ابرو',
    'پیرایش و استایل مردانه',
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="مدیریت خدمات، ساخت پکیج و تعرفه‌های هوشمند"
        subtitle={`حوزه تخصصی تشخیص‌داده‌شده برای مجموعه شما: «${detectedPrimaryCategory}» — امکان تعریف پکیج چندمرحله‌ای، شخصی‌سازی کامل آیتم‌ها و تعیین بازه قیمتی`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={kitPanelOpen ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setKitPanelOpen((prev) => !prev)}
            >
              <span>
                {kitPanelOpen
                  ? `بستن کیت آماده «${activeKitCategory}»`
                  : `✨ باز کردن کیت آماده «${activeKitCategory}»`}
              </span>
            </Button>
            {bizServices.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClearAllOpen(true)}
                className="text-[#EF4444] border-[#FECACA] hover:bg-[#FEF2F2]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  پاک کردن همه ({toPersianDigits(bizServices.length)})
                </span>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddModal('SINGLE')}
            >
              <Plus className="w-4 h-4" />
              <span>خدمت تکی</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAddModal('PACKAGE')}
            >
              <Plus className="w-4 h-4" />
              <span>ساخت پکیج سفارشی / چندمرحله‌ای</span>
            </Button>
          </div>
        }
      />

      {/* تایید حذف یکجای همه خدمات */}
      {confirmClearAllOpen ? (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-extrabold text-[#991B1B]">
              آیا از پاک کردن تمام {toPersianDigits(bizServices.length)} خدمت ثبت‌شده مطمئن هستید؟
            </p>
            <p className="text-[11px] text-[#B91C1C]">
              با تایید این گزینه، کل لیست خدمات فعلی پاک می‌شود تا بتوانید از نو خدمات را ثبت کنید.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClearAllOpen(false)}
            >
              انصراف
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAllServices}
            >
              بله، همه خدمات پاک شود
            </Button>
          </div>
        </div>
      ) : null}

      {/* کیت هوشمند اختصاصی — فقط کیت مربوط به حوزه فعالیت سالن نمایش داده می‌شود (با قابلیت تغییر لاین برای سالن‌های چندلاینی) */}
      {kitPanelOpen ? (
        <Card className="border-2 border-[#8B5CF6]/30 bg-gradient-to-br from-[#FAF8FF] via-white to-[#F0FDFA] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#061138] text-[#00E5FF] text-[11px] font-black">
                  ✨ کیت اختصاصی لاین «{activeKitCategory}»
                </span>
                <span className="text-[11px] text-[#64748B] font-bold">
                  (فقط خدمات و پکیج‌های مرتبط با حوزه انتخابی شما نمایش داده می‌شود)
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-[#061138]">
                افزودن سریع یا «شخصی‌سازی کامل مراحل و قیمت» قبل از ثبت در منوی سالن
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setKitPanelOpen(false)}
              >
                <span>بستن کیت آماده</span>
              </Button>
            </div>
          </div>

          {/* حالت ۱: اگر حوزه فعلی «پوست و فیشیال» است */}
          {activeKitCategory === 'پوست و فیشیال' ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleBulkAddFacialPresets('FACIAL_PACKAGES')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-black shadow-2xs transition-all cursor-pointer"
                >
                  <span>+ افزودن ۴ پکیج اصلی فیشیال</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    کلاسیک، هیدروفیشیال، VIP
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAddFacialPresets('THERAPY_PACKAGES')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-black shadow-2xs transition-all cursor-pointer"
                >
                  <span>+ افزودن ۴ پکیج درمانی پوست</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    اسیدتراپی، کربوکسی، پلاژن
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAddFacialPresets('SINGLE_FACIAL')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] text-white text-xs font-black shadow-2xs transition-all cursor-pointer"
                >
                  <span>+ افزودن ۳ خدمت مکمل و آنالیز</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    دور چشم، مینی‌فیشیال، مشاوره
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAddFacialPresets('ALL')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#061138] hover:bg-[#1E293B] text-white text-xs font-black shadow-2xs transition-all cursor-pointer"
                >
                  <span>+ افزودن کامل هر ۱۱ پکیج پوست</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    کامل‌ترین منو
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#065F46]">
                  می‌توانید هر پکیج را مستقیم اضافه کنید یا با دکمه «⚙️ شخصی‌سازی» مراحل و قیمت آن را تغییر دهید:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'FACIAL_PACKAGES', label: 'پکیج‌های جامع فیشیال (۴)' },
                    { id: 'THERAPY_PACKAGES', label: 'اسیدتراپی، کربوکسی و درمانی (۴)' },
                    { id: 'SINGLE_FACIAL', label: 'خدمات تکی و آنالیز پوست (۳)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setFacialFilterTab(
                          tab.id as
                            | 'FACIAL_PACKAGES'
                            | 'THERAPY_PACKAGES'
                            | 'SINGLE_FACIAL'
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                        facialFilterTab === tab.id
                          ? 'bg-[#061138] text-white'
                          : 'bg-white border border-[#A7F3D0] text-[#065F46]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto p-1">
                {activeFacialPresets.map((preset) => {
                  const alreadyAdded = bizServices.some(
                    (s) => s.title.trim() === preset.title.trim()
                  );
                  return (
                    <div
                      key={preset.title}
                      className="p-3 rounded-xl bg-white border border-[#A7F3D0] text-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-extrabold text-[#061138]">
                            {preset.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                openCustomizePresetModal({
                                  title: preset.title,
                                  category: 'پوست و فیشیال',
                                  durationMinutes: preset.durationMinutes,
                                  pricingType: preset.pricingType,
                                  priceToman: preset.priceToman,
                                  maxPriceToman: preset.maxPriceToman,
                                  packageIncludes: preset.packageIncludes,
                                  description: preset.description,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#E0ECFF] text-[#0057FF] border border-[#CBD5E1] text-[10px] font-extrabold cursor-pointer transition-colors"
                              title="ویرایش مراحل پکیج، مواد مصرفی و قیمت قبل از ثبت"
                            >
                              ⚙️ شخصی‌سازی
                            </button>
                            <button
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddSingleFacialPreset(preset)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors ${
                                alreadyAdded
                                  ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                                  : 'bg-[#059669] hover:bg-[#047857] text-white'
                              }`}
                            >
                              {alreadyAdded ? 'ثبت‌شده ✓' : '+ افزودن'}
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#059669] font-extrabold tabular-nums">
                          {formatServicePriceDisplay(preset)} ·{' '}
                          {toPersianDigits(preset.durationMinutes)} دقیقه
                        </p>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {preset.packageIncludes.map((stepItem) => (
                            <span
                              key={stepItem}
                              className="px-2 py-0.5 rounded-md bg-[#F0FDFA] border border-[#CCFBF1] text-[10px] font-bold text-[#0F766E]"
                            >
                              ✓ {stepItem}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeKitCategory === 'لیزر موهای زائد' ? (
            /* حالت ۲: اگر حوزه فعلی «لیزر موهای زائد» است */
            <div className="space-y-3.5">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#1E1B2E] block">
                  ۱. مدل دستگاه لیزر مرکز خود را انتخاب یا تایپ کنید:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {LASER_DEVICE_PRESETS.map((devTitle) => {
                    const active = selectedLaserDevice === devTitle;
                    return (
                      <button
                        key={devTitle}
                        type="button"
                        onClick={() => setSelectedLaserDevice(devTitle)}
                        className={`text-right p-2.5 rounded-xl border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#1E1B2E] text-white border-[#1E1B2E] shadow-sm'
                            : 'bg-white text-[#1E1B2E] border-[#E6E0F5] hover:border-[#8B5CF6]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black">{devTitle}</span>
                          {active ? (
                            <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleBulkAddLaserPresets('WOMEN_PACKAGES')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <span>+ افزودن ۱۲ پکیج بانوان</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    توتال، فول، اقتصادی
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAddLaserPresets('WOMEN_SINGLE')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <span>+ افزودن ۱۲ ناحیه تکی بانوان</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    صورت، بیکینی، پا...
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAddLaserPresets('MEN_PACKAGES')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <span>+ افزودن ۱۱ پکیج آقایان</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    توتال، بالاتنه، تلفیقی
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAddLaserPresets('MEN_SINGLE')}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  <span>+ افزودن ۱۰ ناحیه تکی آقایان</span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px]">
                    خط ریش، کمر، دست...
                  </span>
                </button>
              </div>

              <div className="pt-2 border-t border-[#E6E0F5] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#6B6480]">
                    انتخاب تکی یا شخصی‌سازی نواحی هر پکیج لیزر:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'WOMEN_PACKAGES', label: 'پکیج‌های بانوان (۱۲)' },
                      { id: 'WOMEN_SINGLE', label: 'نواحی تکی بانوان (۱۲)' },
                      { id: 'MEN_PACKAGES', label: 'پکیج‌های آقایان (۱۱)' },
                      { id: 'MEN_SINGLE', label: 'نواحی تکی آقایان (۱۰)' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setLaserFilterTab(
                            tab.id as
                              | 'WOMEN_PACKAGES'
                              | 'WOMEN_SINGLE'
                              | 'MEN_PACKAGES'
                              | 'MEN_SINGLE'
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                          laserFilterTab === tab.id
                            ? 'bg-[#1E1B2E] text-white'
                            : 'bg-white border border-[#E6E0F5] text-[#6B6480]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                  {activeLaserPresets.map((preset) => {
                    const alreadyAdded = bizServices.some(
                      (s) => s.title.trim() === preset.title.trim()
                    );
                    return (
                      <div
                        key={preset.title}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-[#E6E0F5] text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold text-[#1E1B2E] truncate">
                            {preset.title}
                          </p>
                          <p className="text-[11px] text-[#8B5CF6] font-bold tabular-nums mt-0.5">
                            {formatPriceToman(preset.priceToman)} ·{' '}
                            {toPersianDigits(preset.durationMinutes)} دقیقه
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              openCustomizePresetModal({
                                title: preset.title,
                                category: 'لیزر موهای زائد',
                                durationMinutes: preset.durationMinutes,
                                pricingType: 'FIXED',
                                priceToman: preset.priceToman,
                                packageIncludes: [preset.description],
                                description: `${preset.categoryLabel} · دستگاه: ${selectedLaserDevice}`,
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#E0ECFF] text-[#0057FF] border border-[#CBD5E1] text-[10px] font-extrabold cursor-pointer"
                          >
                            ⚙️ شخصی‌سازی
                          </button>
                          <button
                            type="button"
                            disabled={alreadyAdded}
                            onClick={() => handleAddSingleLaserPreset(preset)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors ${
                              alreadyAdded
                                ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] cursor-default'
                                : 'bg-[#F5F3FF] hover:bg-[#8B5CF6] text-[#8B5CF6] hover:text-white border border-[#DDD6FE]'
                            }`}
                          >
                            {alreadyAdded ? 'ثبت‌شده ✓' : '+ افزودن'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* حالت ۳: سایر حوزه‌های تخصصی (مو و رنگ، ناخن، میکاپ، مژه و ابرو، پیرایش مردانه) */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#334155]">
                  پکیج‌ها و خدمات پیشنهادی ویژه لاین «{activeKitCategory}»:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleBulkAddOtherDomainPresets(activeKitCategory)
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] text-white text-xs font-extrabold cursor-pointer transition-colors"
                >
                  + افزودن یکجای همه پکیج‌های «{activeKitCategory}»
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeOtherDomainPresets.map((preset) => {
                  const alreadyAdded = bizServices.some(
                    (s) => s.title.trim() === preset.title.trim()
                  );
                  return (
                    <div
                      key={preset.title}
                      className="p-3 rounded-xl bg-white border border-[#CBD5E1] text-xs space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-extrabold text-[#061138]">
                            {preset.title}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                openCustomizePresetModal({
                                  title: preset.title,
                                  category: preset.domainCategory,
                                  durationMinutes: preset.durationMinutes,
                                  pricingType: preset.pricingType,
                                  priceToman: preset.priceToman,
                                  maxPriceToman: preset.maxPriceToman,
                                  packageIncludes: preset.packageIncludes,
                                  description: preset.description,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#E0ECFF] text-[#0057FF] border border-[#CBD5E1] text-[10px] font-extrabold cursor-pointer"
                            >
                              ⚙️ شخصی‌سازی
                            </button>
                            <button
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddOtherDomainPreset(preset)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors ${
                                alreadyAdded
                                  ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                                  : 'bg-[#0057FF] hover:bg-[#0046CC] text-white'
                              }`}
                            >
                              {alreadyAdded ? 'ثبت‌شده ✓' : '+ افزودن'}
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#0057FF] font-extrabold tabular-nums">
                          {formatServicePriceDisplay(preset)} ·{' '}
                          {toPersianDigits(preset.durationMinutes)} دقیقه
                        </p>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {preset.packageIncludes.map((st) => (
                            <span
                              key={st}
                              className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-bold text-[#334155]"
                            >
                              ✓ {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {bizServices.length === 0 && !kitPanelOpen ? (
        <Card className="p-6 sm:p-8 text-center space-y-4 border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC]/60">
          <div className="space-y-1.5 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#0057FF] text-xs font-extrabold">
              حوزه تخصصی شما: {activeKitCategory}
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#061138]">
              هنوز خدمتی در منوی رزرو شما ثبت نشده است
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              برای شروع، یکی از ۳ روش زیر را انتخاب کنید تا آیتم‌های مربوط به حوزه تخصصی «{activeKitCategory}» نمایش داده شوند:
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setKitPanelOpen(true)}
            >
              <span>✨ مشاهده کیت آماده «{activeKitCategory}»</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => openAddModal('SINGLE')}
            >
              <Plus className="w-4 h-4" />
              <span>تعریف خدمت تکی</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => openAddModal('PACKAGE')}
            >
              <Plus className="w-4 h-4" />
              <span>ساخت پکیج سفارشی / چندمرحله‌ای</span>
            </Button>
          </div>
        </Card>
      ) : null}

      {bizServices.length > 0 ? (
        <>
          {/* فیلتر دسته‌بندی خدمات */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCat('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                selectedCat === 'ALL'
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-white border border-[#E6E0F5] text-[#6B6480] hover:text-[#1E1B2E]'
              }`}
            >
              همه خدمات ({toPersianDigits(bizServices.length)})
            </button>
            {uniqueCats.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  selectedCat === cat
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-white border border-[#E6E0F5] text-[#6B6480] hover:text-[#1E1B2E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <ResponsiveTable<ServiceItem>
            keyExtractor={(s) => s.id}
            data={visibleServices}
            columns={[
          {
            key: 'title',
            header: 'عنوان، مراحل پکیج و شرح خدمت',
            render: (s) => (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-extrabold text-[#1E1B2E]">{s.title}</p>
                  {s.packageIncludes && s.packageIncludes.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-extrabold">
                      پکیج {toPersianDigits(s.packageIncludes.length)} مرحله‌ای
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-[#6B6480]">{s.description}</p>
                {s.packageIncludes && s.packageIncludes.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {s.packageIncludes.map((inc) => (
                      <span
                        key={inc}
                        className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-semibold text-[#475569]"
                      >
                        • {inc}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          },
          {
            key: 'cat',
            header: 'دسته‌بندی',
            render: (s) => <StatusBadge label={s.category} tone="primary" />,
          },
          {
            key: 'duration',
            header: 'مدت زمان',
            render: (s) => (
              <span className="tabular-nums text-xs font-semibold text-[#6B6480] inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6B6480]" />
                {formatDurationMinutes(s.durationMinutes)}
              </span>
            ),
          },
          {
            key: 'price',
            header: 'مدل قیمت‌گذاری و تعرفه (تومان)',
            align: 'left',
            render: (s) => (
              <div className="space-y-1 text-left">
                <span className="text-xs font-extrabold text-[#8B5CF6] block tabular-nums">
                  {formatServicePriceShort(s)}
                </span>
                <div className="inline-flex items-center gap-1.5">
                  <input
                    type="text"
                    dir="ltr"
                    inputMode="numeric"
                    aria-label={`قیمت پایه ${s.title}`}
                    value={formatNumericInputWithCommas(String(s.priceToman))}
                    onChange={(e) => {
                      const nextPrice = parseNumericInput(e.target.value);
                      if (nextPrice >= 0) {
                        updateService(s.id, { priceToman: nextPrice });
                      }
                    }}
                    className="w-24 px-2 py-1 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF]/60 focus:bg-white focus:border-[#8B5CF6] text-[11px] font-black text-[#8B5CF6] tabular-nums text-left outline-none transition-colors"
                  />
                  {s.pricingType === 'RANGE' ? (
                    <>
                      <span className="text-[10px] text-[#64748B]">تا</span>
                      <input
                        type="text"
                        dir="ltr"
                        inputMode="numeric"
                        aria-label={`سقف قیمت ${s.title}`}
                        value={formatNumericInputWithCommas(
                          String(s.maxPriceToman || s.priceToman)
                        )}
                        onChange={(e) => {
                          const nextMax = parseNumericInput(e.target.value);
                          if (nextMax >= 0) {
                            updateService(s.id, { maxPriceToman: nextMax });
                          }
                        }}
                        className="w-24 px-2 py-1 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF]/60 focus:bg-white focus:border-[#8B5CF6] text-[11px] font-black text-[#8B5CF6] tabular-nums text-left outline-none transition-colors"
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ),
          },
          {
            key: 'active',
            header: 'وضعیت رزرو',
            render: (s) => (
              <button
                type="button"
                onClick={() =>
                  updateService(s.id, { isActive: !(s.isActive ?? true) })
                }
                className="cursor-pointer"
              >
                <StatusBadge
                  label={s.isActive !== false ? 'فعال در رزرو' : 'غیرفعال'}
                  tone={s.isActive !== false ? 'success' : 'neutral'}
                />
              </button>
            ),
          },
          {
            key: 'actions',
            header: 'عملیات',
            render: (s) => (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(s)}
                  aria-label={`ویرایش ${s.title}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش و شخصی‌سازی</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(s)}
                  aria-label={`حذف ${s.title}`}
                  className="text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />
        </>
      ) : null}

      {/* مودال جامع ساخت پکیج و شخصی‌سازی کامل خدمت (با چک‌لیست مراحل و مواد مصرفی تا هیچ موردی از قلم نیفتد) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingService
            ? 'ویرایش و شخصی‌سازی کامل خدمت / پکیج'
            : 'تعریف خدمت یا ساخت پکیج سفارشی جدید'
        }
      >
        <form onSubmit={handleSaveService} className="space-y-4" noValidate>
          {/* ۱. انتخاب حالت خدمت تکی یا پکیج چندمرحله‌ای */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F1F5F9] border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => setServiceMode('PACKAGE')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                serviceMode === 'PACKAGE'
                  ? 'bg-[#061138] text-[#00E5FF] shadow-xs'
                  : 'text-[#475569] hover:text-[#061138]'
              }`}
            >
              📦 پکیج چندمرحله‌ای (با چک‌لیست آیتم‌ها)
            </button>
            <button
              type="button"
              onClick={() => setServiceMode('SINGLE')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                serviceMode === 'SINGLE'
                  ? 'bg-[#061138] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#061138]'
              }`}
            >
              ✂️ خدمت تکی ساده
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              id="srv-form-cat"
              label="دسته‌بندی تخصصی"
              required
              error={formErrors.category}
            >
              <Select
                id="srv-form-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={Array.from(
                  new Set([
                    activeKitCategory,
                    ...(category ? [category] : []),
                  ])
                ).map((titleItem) => ({
                  value: titleItem,
                  label: titleItem,
                }))}
              />
            </FormField>

            <FormField
              id="srv-form-dur"
              label="مدت زمان حدودی (دقیقه)"
              required
              error={formErrors.durationMinutes}
            >
              <Input
                id="srv-form-dur"
                dir="ltr"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </FormField>
          </div>

          <FormField
            id="srv-form-title"
            label={
              serviceMode === 'PACKAGE'
                ? 'عنوان پکیج اختصاصی شما'
                : 'عنوان خدمت'
            }
            required
            error={formErrors.title}
          >
            <Input
              id="srv-form-title"
              value={title}
              hasError={Boolean(formErrors.title)}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                serviceMode === 'PACKAGE'
                  ? 'مثلاً: پکیج VIP فیشیال، هیدرودرمی و نوردرمانی (۷ مرحله‌ای)'
                  : 'نام خدمت را بنویسید یا از پیشنهادهای زیر انتخاب کنید'
              }
            />
          </FormField>

          {suggestedTitles.length > 0 ? (
            <div className="space-y-1.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-2.5">
              <span className="text-[11px] font-extrabold text-[#475569] block">
                پیشنهاد سریع عنوان در دسته «{category}» (با لمس جایگذاری می‌شود):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTitles.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTitle(sug)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer border transition-colors ${
                      title === sug
                        ? 'bg-[#0057FF] text-white border-[#0057FF]'
                        : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
                    }`}
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* ۲. سازنده هوشمند مراحل و آیتم‌های داخل پکیج (چک‌لیست آماده + افزودن مورد دلخواه) */}
          {serviceMode === 'PACKAGE' ? (
            <div className="p-3.5 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-extrabold text-[#065F46] block">
                    چک‌لیست آماده مراحل و آیتم‌های «{category}» (تا هیچ موردی از قلم نیفتد):
                  </span>
                  <span className="text-[11px] text-[#0F766E]">
                    روی هر مرحله که در این پکیج انجام می‌دهید کلیک کنید تا تیک بخورد یا مرحله دلخواه خودتان را اضافه کنید
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#059669] text-white text-[11px] font-black tabular-nums">
                  {toPersianDigits(selectedPackageStages.length)} مرحله انتخاب‌شده
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {currentChecklist.stages.map((st) => {
                  const isChecked = selectedPackageStages.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleToggleStageInModal(st)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer inline-flex items-center gap-1 ${
                        isChecked
                          ? 'bg-[#059669] text-white border-[#059669] shadow-2xs'
                          : 'bg-white text-[#064E3B] border-[#A7F3D0] hover:border-[#059669]'
                      }`}
                    >
                      <span>{isChecked ? '✓' : '+'}</span>
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>

              {/* افزودن مرحله یا آیتم سفارشی توسط صاحب کسب‌وکار */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customStageInput}
                  onChange={(e) => setCustomStageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomStageInModal();
                    }
                  }}
                  placeholder="مرحله یا آیتم اختصاصی دیگری دارید؟ اینجا بنویسید (مثلاً: ماسک طلای ۲۴ عیار)..."
                  className="flex-1 rounded-xl border border-[#A7F3D0] bg-white px-3 py-1.5 text-xs font-bold text-[#061138] focus:border-[#059669] focus:outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCustomStageInModal}
                >
                  + افزودن مرحله
                </Button>
              </div>

              {selectedPackageStages.length > 0 ? (
                <div className="pt-2 border-t border-[#99F6E4] space-y-1.5">
                  <span className="text-[11px] font-extrabold text-[#065F46] block">
                    ترتیب مراحل ثبت‌شده در پکیج شما (با زدن ✕ حذف می‌شود):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPackageStages.map((st, idx) => (
                      <span
                        key={`${st}-${idx}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#059669]/40 text-[11px] font-extrabold text-[#061138]"
                      >
                        <span className="text-[#059669] tabular-nums">
                          {toPersianDigits(idx + 1)}.
                        </span>
                        <span>{st}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleStageInModal(st)}
                          className="text-rose-500 hover:text-rose-700 font-black cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ۳. انتخاب مدل قیمت‌گذاری (مقطوع / بازه قیمتی / شروع قیمت پایه + مشاوره حضوری) */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#061138] block">
              مدل نمایش قیمت به مشتری (ویژه خدماتی که قیمتشان به مواد مصرفی یا حجم کار بستگی دارد):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'FIXED' as const,
                  title: '۱. قیمت مقطوع و ثابت',
                  sub: 'مثلاً ۶۵۰,۰۰۰ تومان',
                },
                {
                  id: 'RANGE' as const,
                  title: '۲. بازه قیمتی (از ... تا ...)',
                  sub: 'بر اساس مواد یا حجم کار',
                },
                {
                  id: 'STARTING_FROM' as const,
                  title: '۳. شروع قیمت پایه + مشاوره',
                  sub: 'تعیین دقیق پس از آنالیز حضوری',
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPricingType(mode.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                    pricingType === mode.id
                      ? 'bg-[#061138] text-white border-[#061138]'
                      : 'bg-[#F8FAFC] text-[#061138] border-[#CBD5E1]'
                  }`}
                >
                  <p className="text-xs font-extrabold">{mode.title}</p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      pricingType === mode.id
                        ? 'text-[#00E5FF]'
                        : 'text-[#64748B]'
                    }`}
                  >
                    {mode.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              id="srv-form-price"
              label={
                pricingType === 'RANGE'
                  ? 'حداقل قیمت (از تومان)'
                  : pricingType === 'STARTING_FROM'
                  ? 'شروع قیمت پایه (تومان)'
                  : 'قیمت مقطوع (تومان)'
              }
              required
              error={formErrors.priceToman}
            >
              <Input
                id="srv-form-price"
                dir="ltr"
                type="text"
                inputMode="numeric"
                value={priceToman}
                onChange={(e) =>
                  setPriceToman(formatNumericInputWithCommas(e.target.value))
                }
                placeholder="650,000"
              />
            </FormField>

            {pricingType === 'RANGE' ? (
              <FormField
                id="srv-form-max-price"
                label="حداکثر قیمت (تا تومان)"
                required
              >
                <Input
                  id="srv-form-max-price"
                  dir="ltr"
                  type="text"
                  inputMode="numeric"
                  value={maxPriceToman}
                  onChange={(e) =>
                    setMaxPriceToman(
                      formatNumericInputWithCommas(e.target.value)
                    )
                  }
                  placeholder="950,000"
                />
              </FormField>
            ) : null}
          </div>

          {/* ۴. تگ‌های آماده برند متریال و شرایط خدمت + توضیحات */}
          <div className="space-y-2">
            <FormField
              id="srv-form-desc"
              label="توضیحات تکمیلی، برند متریال یا شرایط پذیرش"
              optionalLabel="با کلیک روی پیشنهادها خودکار اضافه می‌شود"
            >
              <Input
                id="srv-form-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیح کوتاه درباره برند مواد، نوع پوست/مو مناسب یا شرایط قیمت..."
              />
            </FormField>
            <div className="flex flex-wrap gap-1.5">
              {currentChecklist.materialsAndNotes.map((note) => (
                <button
                  key={note}
                  type="button"
                  onClick={() =>
                    setDescription((prev) =>
                      prev.includes(note)
                        ? prev
                        : prev.trim()
                        ? `${prev.trim()} · ${note}`
                        : note
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#E0ECFF] border border-[#CBD5E1] text-[10px] font-bold text-[#334155] hover:text-[#0057FF] cursor-pointer transition-colors"
                >
                  + {note}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary" size="sm">
              ذخیره نهایی خدمت / پکیج
            </Button>
          </div>
        </form>
      </Modal>

      {/* دیالوگ تایید حذف خدمت */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteService(deleteTarget.id);
        }}
        title="تایید حذف خدمت"
        message={`آیا از حذف خدمت «${deleteTarget?.title ?? ''}» از فهرست خدمات سالن اطمینان دارید؟`}
      />
    </div>
  );
};

/** ۵. متخصصان و پرسنل (/app/staff) */
export const BusinessStaffPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    specialists,
    plans,
    activePlanId,
    setActivePlanId,
    addSpecialist,
    updateSpecialist,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<SpecialistItem | null>(null);
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [upgradeModalPlan, setUpgradeModalPlan] =
    useState<CheckoutItemPayload | null>(null);

  const staffLimitCount = getPlanStaffLimitCount(
    currentBiz?.subscriptionPlan || activePlanId
  );
  const bizSpecialistsList = currentBiz
    ? specialists.filter((s) => s.businessId === currentBiz.id)
    : [];
  const effectiveStaffList = bizSpecialistsList;
  const isLimitReached = effectiveStaffList.length >= staffLimitCount;
  const isFreePlan = isFreeSubscriptionPlan(
    activePlanId,
    currentBiz?.subscriptionPlan
  );

  const openAdd = () => {
    if (isLimitReached) {
      showToast(
        `ظرفیت متخصصان در پلن فعلی شما (${toPersianDigits(
          staffLimitCount
        )} نفر) تکمیل است. برای افزودن متخصص جدید، پلن خود را به حرفه‌ای یا VIP ارتقا دهید.`,
        'warning'
      );
      const nextPlan =
        plans.find((p) => p.id === 'plan-professional') || plans[1];
      if (nextPlan) {
        setUpgradeModalPlan({
          itemType: 'PLAN',
          itemId: nextPlan.id,
          itemTitle: `ارتقا به پلن «${nextPlan.name}»`,
          baseAmountToman: nextPlan.monthlyPriceToman,
        });
      }
      return;
    }
    setEditingStaff(null);
    setFullName('');
    setRoleTitle('');
    setSpecialtiesText('کوتاهی ژورنالی، براشینگ');
    setModalOpen(true);
  };

  const openEdit = (sp: SpecialistItem) => {
    setEditingStaff(sp);
    setFullName(sp.fullName);
    setRoleTitle(sp.roleTitle);
    setSpecialtiesText(sp.specialties.join('، '));
    setModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !roleTitle.trim()) return;
    const specs = specialtiesText
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingStaff) {
      updateSpecialist(editingStaff.id, {
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        specialties: specs.length ? specs : editingStaff.specialties,
      });
    } else {
      addSpecialist({
        businessId: currentBiz?.id ?? 'biz-1',
        slug: `staff-${Date.now()}`,
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        experienceYears: 4,
        rating: 4.8,
        reviewCount: 12,
        specialties: specs.length ? specs : ['خدمات تخصصی زیبایی'],
        bio: 'عضو تیم تخصصی سالن زیبایی.',
        isIndependent: false,
        isActive: true,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="کسب‌وکار · اعضای تیم"
        title="مدیریت متخصصان و پرسنل"
        subtitle={`ظرفیت مجاز پلن فعلی شما: حداکثر ${toPersianDigits(
          staffLimitCount
        )} متخصص (${toPersianDigits(effectiveStaffList.length)} نفر ثبت‌شده)`}
        routePattern="/app/staff"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'متخصصان و پرسنل' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>
              {isLimitReached
                ? 'ارتقای پلن برای افزودن متخصص جدید'
                : 'افزودن متخصص جدید'}
            </span>
          </Button>
        }
      />

      <EasyCheckoutModal
        isOpen={Boolean(upgradeModalPlan)}
        onClose={() => setUpgradeModalPlan(null)}
        item={upgradeModalPlan}
        businessId={currentBiz?.id || 'biz-1'}
        businessName={currentBiz?.name || 'سالن زیبایی شما'}
        onPaymentSuccess={() => {
          if (upgradeModalPlan?.itemId) {
            setActivePlanId(upgradeModalPlan.itemId);
          }
          setUpgradeModalPlan(null);
        }}
      />

      {isFreePlan ? (
        <PlanUpgradeLockBanner
          featureTitle="افزودن چندین متخصص و مدیریت تقویم مجزا برای هر پرسنل"
          description="در پلن شروع رایگان حداکثر ۱ متخصص قابل ثبت است. برای افزودن تا ۱۰ متخصص (پلن حرفه‌ای) یا نامحدود (پلن VIP)، اشتراک سالن خود را ارتقا دهید."
        />
      ) : null}

      {effectiveStaffList.length === 0 ? (
        <EmptyState
          title="هنوز متخصصی برای سالن شما ثبت نشده است"
          description="اولین متخصص یا عضو تیم سالن خود را اضافه کنید تا مشتریان بتوانند هنگام رزرو آنلاین، متخصص دلخواهشان را انتخاب نمایند."
          actionLabel="افزودن اولین متخصص"
          onAction={openAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {effectiveStaffList.map((sp) => (
            <Card key={sp.id} className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <Avatar name={sp.fullName} size="lg" tone="violet" />
                    <div>
                      <h2 className="text-base font-extrabold text-[#1E1B2E]">
                        {sp.fullName}
                      </h2>
                      <p className="text-xs text-[#8B5CF6] font-bold mt-0.5">
                        {sp.roleTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateSpecialist(sp.id, {
                        isActive: !(sp.isActive ?? true),
                      })
                    }
                    className="cursor-pointer"
                  >
                    <StatusBadge
                      label={sp.isActive !== false ? 'تقویم فعال' : 'غیرفعال'}
                      tone={sp.isActive !== false ? 'success' : 'neutral'}
                    />
                  </button>
                </div>
                <p className="text-xs text-[#6B6480] leading-relaxed">{sp.bio}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sp.specialties.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF8FF] border border-[#E6E0F5] text-[11px] font-semibold text-[#6B6480]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3.5 border-t border-[#E6E0F5] flex items-center justify-between text-xs">
                <span className="text-[#6B6480] font-semibold tabular-nums">
                  سابقه: {toPersianDigits(sp.experienceYears)} سال · امتیاز: ★{' '}
                  {toPersianDigits(sp.rating)}
                </span>
                <Button variant="outline" size="sm" onClick={() => openEdit(sp)}>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingStaff ? 'ویرایش اطلاعات متخصص' : 'افزودن متخصص جدید'
        }
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <FormField id="stf-name" label="نام و نام خانوادگی متخصص" required>
            <Input
              id="stf-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormField>
          <FormField id="stf-role" label="عنوان تخصصی / سمت" required>
            <Input
              id="stf-role"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </FormField>
          <FormField
            id="stf-specs"
            label="مهارت‌ها و خدمات (با ویرگول جدا کنید)"
          >
            <Input
              id="stf-specs"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary" size="sm">
              ذخیره اطلاعات
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/** ۶. پرونده مشتریان (/app/customers) — ثبت دستی تکی، ورود سریع گروهی مشتریان قبلی، ویرایش و ارسال پیامک */
export const BusinessCustomersPage: React.FC = () => {
  const {
    customers,
    appointments,
    services,
    currentBusiness,
    businesses,
    addCustomer,
    addCustomersBulk,
    updateCustomer,
    deleteCustomer,
    sendBusinessCustomerSms,
    showToast,
  } = usePrototypeData();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentBiz = currentBusiness ?? businesses[0];

  const bizServices = React.useMemo(() => {
    const list = currentBiz
      ? services.filter(
          (s) => s.businessId === currentBiz.id && s.isActive !== false
        )
      : [];
    return list.length > 0 ? list : services.slice(0, 6);
  }, [currentBiz, services]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);

  // تجمیع خودکار مشتریان ثبت‌شده دستی + مشتریانی که آنلاین نوبت گرفته‌اند تا هیچ شماره‌ای از قلم نیفتد
  const mergedBusinessCustomers = React.useMemo(() => {
    const byKey = new Map<string, CustomerRecord>();

    for (const c of customers) {
      const cleanPhone = normalizeIranMobileInput(c.phone || c.phoneMasked || '');
      const key = cleanPhone || c.id;
      byKey.set(key, {
        ...c,
        phone: cleanPhone || c.phone,
      });
    }

    const bizAppointments = currentBiz
      ? appointments.filter(
          (a) =>
            a.businessId === currentBiz.id || a.businessSlug === currentBiz.slug
        )
      : appointments;

    for (const apt of bizAppointments) {
      const cleanPhone = normalizeIranMobileInput(apt.customerPhoneMasked || '');
      const key = cleanPhone || `apt-cust-${apt.customerName}-${apt.id}`;
      const existing = byKey.get(key);
      if (existing) {
        byKey.set(key, {
          ...existing,
          phone: existing.phone || cleanPhone || undefined,
          lastVisitJalali: existing.lastVisitJalali || apt.dateJalali,
          favoriteService: existing.favoriteService || apt.serviceTitle,
        });
      } else {
        byKey.set(key, {
          id: `cust-apt-${apt.id}`,
          fullName: apt.customerName || 'مشتری نوبت آنلاین',
          phone: cleanPhone || undefined,
          phoneMasked: cleanPhone
            ? toPersianDigits(cleanPhone)
            : apt.customerPhoneMasked,
          city: currentBiz?.city || 'اصفهان',
          totalVisits: 1,
          lastVisitJalali: apt.dateJalali,
          totalSpentToman: apt.priceToman || 0,
          favoriteService: apt.serviceTitle || 'خدمات سالن',
          notes: apt.notes || 'ثبت‌شده از طریق رزرو آنلاین نوبت',
        });
      }
    }

    return Array.from(byKey.values());
  }, [customers, appointments, currentBiz]);

  // مودال افزودن / ویرایش تکی مشتری
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formFavoriteService, setFormFavoriteService] = useState('');
  const [formTotalVisits, setFormTotalVisits] = useState('1');
  const [formTotalSpent, setFormTotalSpent] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  // مودال ورود سریع گروهی مشتریان قبلی (جدول چندردیفه + کپی/جای‌گذاری لیست)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'GRID' | 'PASTE'>('GRID');
  const [bulkRows, setBulkRows] = useState<
    Array<{
      id: string;
      fullName: string;
      phone: string;
      favoriteService: string;
      notes: string;
    }>
  >([
    { id: 'r-1', fullName: '', phone: '', favoriteService: '', notes: '' },
    { id: 'r-2', fullName: '', phone: '', favoriteService: '', notes: '' },
    { id: 'r-3', fullName: '', phone: '', favoriteService: '', notes: '' },
    { id: 'r-4', fullName: '', phone: '', favoriteService: '', notes: '' },
    { id: 'r-5', fullName: '', phone: '', favoriteService: '', notes: '' },
  ]);
  const [bulkPasteText, setBulkPasteText] = useState('');

  // ارسال پیامک سریع به مشتری داخل مودال پرونده
  const [quickSmsText, setQuickSmsText] = useState('');
  const [isSendingQuickSms, setIsSendingQuickSms] = useState(false);

  // باز شدن خودکار مودال ثبت مشتری در صورت وجود ?add=1
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      openAddSingleModal();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('add');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  const openAddSingleModal = () => {
    setEditingCustomerId(null);
    setFormFullName('');
    setFormPhone('');
    setFormFavoriteService(bizServices[0]?.title || '');
    setFormTotalVisits('1');
    setFormTotalSpent('0');
    setFormNotes('');
    setIsSingleModalOpen(true);
  };

  const openEditSingleModal = (record: CustomerRecord) => {
    setEditingCustomerId(record.id);
    setFormFullName(record.fullName);
    setFormPhone(record.phone || '');
    setFormFavoriteService(record.favoriteService || '');
    setFormTotalVisits(String(record.totalVisits ?? 1));
    setFormTotalSpent(String(record.totalSpentToman ?? 0));
    setFormNotes(record.notes || '');
    setSelectedCustomer(null);
    setIsSingleModalOpen(true);
  };

  const handleSaveSingleCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizeIranMobileInput(formPhone);
    const visitsNum = Math.max(
      0,
      Number(toEnglishDigitsClient(formTotalVisits)) || 0
    );
    const spentNum = Math.max(
      0,
      Number(toEnglishDigitsClient(formTotalSpent)) || 0
    );

    if (editingCustomerId) {
      if (!formFullName.trim()) return;
      updateCustomer(editingCustomerId, {
        fullName: formFullName.trim(),
        phone: cleanPhone || undefined,
        favoriteService: formFavoriteService.trim() || 'خدمات عمومی سالن',
        totalVisits: visitsNum,
        totalSpentToman: spentNum,
        notes: formNotes.trim(),
      });
      setIsSingleModalOpen(false);
      return;
    }

    const created = addCustomer({
      fullName: formFullName,
      phone: cleanPhone,
      city: currentBiz?.city || 'اصفهان',
      favoriteService: formFavoriteService.trim() || 'خدمات عمومی سالن',
      totalVisits: visitsNum,
      totalSpentToman: spentNum,
      notes: formNotes.trim(),
      businessId: currentBiz?.id,
    });
    if (created) {
      setIsSingleModalOpen(false);
    }
  };

  // پردازش متن کپی‌شده برای ورود گروهی مشتریان (پشتیبانی از «نام - 0913...» یا «0913... نام»)
  const parsedPasteItems = React.useMemo(() => {
    const lines = bulkPasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const results: Array<{
      fullName: string;
      phone: string;
      favoriteService?: string;
      notes?: string;
    }> = [];

    for (const line of lines) {
      const normalizedLine = toEnglishDigitsClient(line);
      const phoneMatch = normalizedLine.match(/(?:09|\+989|989|9)\d{9}/);
      if (!phoneMatch) continue;

      const rawPhone = phoneMatch[0];
      const cleanPhone = normalizeIranMobileInput(rawPhone);
      if (!isValidIranMobile(cleanPhone)) continue;

      const restText = normalizedLine
        .replace(rawPhone, '')
        .replace(/^[\s\-_,،:|/]+|[\s\-_,،:|/]+$/g, '')
        .trim();

      const parts = restText
        .split(/[\-_,،|/]/)
        .map((p) => p.trim())
        .filter(Boolean);

      const fullName = parts[0] || 'مشتری سالن';
      const favoriteService = parts[1] || undefined;
      const notes = parts.slice(2).join(' - ') || undefined;

      results.push({
        fullName,
        phone: cleanPhone,
        favoriteService,
        notes,
      });
    }
    return results;
  }, [bulkPasteText]);

  const validGridItems = React.useMemo(() => {
    return bulkRows
      .map((r) => ({
        fullName: r.fullName.trim(),
        phone: normalizeIranMobileInput(r.phone),
        favoriteService: r.favoriteService.trim() || undefined,
        notes: r.notes.trim() || undefined,
      }))
      .filter((r) => r.fullName.length > 0 && isValidIranMobile(r.phone));
  }, [bulkRows]);

  const handleBulkSubmit = () => {
    const itemsToImport =
      bulkMode === 'GRID' ? validGridItems : parsedPasteItems;
    const res = addCustomersBulk(itemsToImport, currentBiz?.id);
    if (res.addedCount > 0 || res.updatedCount > 0) {
      setIsBulkModalOpen(false);
      setBulkPasteText('');
      setBulkRows([
        { id: 'r-1', fullName: '', phone: '', favoriteService: '', notes: '' },
        { id: 'r-2', fullName: '', phone: '', favoriteService: '', notes: '' },
        { id: 'r-3', fullName: '', phone: '', favoriteService: '', notes: '' },
        { id: 'r-4', fullName: '', phone: '', favoriteService: '', notes: '' },
        { id: 'r-5', fullName: '', phone: '', favoriteService: '', notes: '' },
      ]);
    }
  };

  const filtered = mergedBusinessCustomers.filter((c) => {
    const q = searchQuery.trim();
    if (!q) return true;
    const qEn = toEnglishDigitsClient(q);
    return (
      c.fullName.includes(q) ||
      c.favoriteService.includes(q) ||
      (c.phone && c.phone.includes(qEn)) ||
      c.phoneMasked.includes(q) ||
      (c.notes && c.notes.includes(q))
    );
  });

  const handleExportCustomersCsv = () => {
    const targetList = filtered.length > 0 ? filtered : mergedBusinessCustomers;
    if (targetList.length === 0) {
      showToast('هنوز مشتری در لیست شما ثبت نشده است.', 'warning');
      return;
    }

    const escapeCsvCell = (val: unknown): string => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'ردیف',
      'نام و نام خانوادگی',
      'شماره موبایل',
      'شهر',
      'تعداد مراجعات',
      'آخرین مراجعه',
      'مجموع پرداختی (تومان)',
      'خدمت دریافتی / مورد علاقه',
      'یادداشت پرونده',
    ];

    const rows = targetList.map((c, idx) => {
      const cleanPhone =
        normalizeIranMobileInput(c.phone || c.phoneMasked || '') ||
        toEnglishDigitsClient(c.phone || c.phoneMasked || '');
      return [
        idx + 1,
        c.fullName,
        cleanPhone,
        c.city || currentBiz?.city || 'اصفهان',
        c.totalVisits ?? 1,
        c.lastVisitJalali || '',
        c.totalSpentToman ?? 0,
        c.favoriteService || '',
        c.notes || '',
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    // افزودن UTF-8 BOM (\uFEFF) برای نمایش صحیح حروف فارسی در Microsoft Excel
    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeBizSlug = (currentBiz?.slug || 'customers').replace(/[^a-zA-Z0-9-_]/g, '-');
    link.href = url;
    link.setAttribute('download', `timeto-customers-${safeBizSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      `فایل اکسل (CSV) شامل اطلاعات و شماره موبایل ${toPersianDigits(targetList.length)} مشتری با موفقیت دانلود شد.`
    );
  };

  const handleCopyAllCustomerPhones = async () => {
    const targetList = filtered.length > 0 ? filtered : mergedBusinessCustomers;
    const phones = Array.from(
      new Set(
        targetList
          .map(
            (c) =>
              normalizeIranMobileInput(c.phone || c.phoneMasked || '') ||
              toEnglishDigitsClient(c.phone || c.phoneMasked || '').trim()
          )
          .filter(Boolean)
      )
    );

    if (phones.length === 0) {
      showToast('شماره موبایلی برای کپی یافت نشد.', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(phones.join('\n'));
      showToast(
        `شماره موبایل ${toPersianDigits(phones.length)} مشتری به صورت یکجا کپی شد.`
      );
    } catch {
      showToast('امکان کپی خودکار در این مرورگر نبود؛ از دکمه دانلود اکسل استفاده کنید.', 'warning');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="مشتریان · باشگاه و پرونده مراجعان سالن"
        title="مدیریت و خروجی اطلاعات مشتریان"
        subtitle="مشتریان حضوری و آنلاین خود را مدیریت کنید، به صورت تکی یا گروهی وارد نمایید و هر زمان خواستید از شماره‌ها و اطلاعات آن‌ها خروجی اکسل بگیرید"
        routePattern="/app/customers"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'پرونده مشتریان' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCustomersCsv}
            >
              <Download className="w-4 h-4 text-[#0057FF]" />
              <span>خروجی اکسل (CSV) مشتریان</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleCopyAllCustomerPhones()}
            >
              <Copy className="w-4 h-4 text-[#0057FF]" />
              <span>کپی یکجای شماره‌ها</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
            >
              <Users className="w-4 h-4" />
              <span>افزودن سریع گروهی</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={openAddSingleModal}
            >
              <Plus className="w-4 h-4" />
              <span>+ افزودن مشتری جدید</span>
            </Button>
          </div>
        }
      />

      {/* نوار ابزار خروجی سریع شماره‌ها و اطلاعات مشتریان */}
      <div className="rounded-2xl border border-[#BFDBFE] bg-gradient-to-r from-[#EFF6FF] to-[#F8FAFC] p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-black text-[#061138]">
            پشتیبان‌گیری و خروجی گرفتن از لیست مشتریان ({toPersianDigits(mergedBusinessCustomers.length)} نفر)
          </p>
          <p className="text-[11px] font-semibold text-[#475569]">
            شامل تمام مشتریان نوبت آنلاین و مشتریان حضوری ثبت‌شده به همراه نام، شماره موبایل، تعداد مراجعات و خدمات دریافتی
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCustomersCsv}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0057FF] px-3.5 py-2 text-xs font-black text-white shadow-xs hover:bg-[#0046CC] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>دانلود فایل اکسل / CSV</span>
          </button>
          <button
            type="button"
            onClick={() => void handleCopyAllCustomerPhones()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-extrabold text-[#061138] hover:border-[#0057FF] hover:text-[#0057FF] transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>کپی همه شماره‌ها</span>
          </button>
        </div>
      </div>

      {/* کارت راهنمای ثبت سریع مشتریان حضوری + آمار مشتریان */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <FormField
            id="cust-search"
            label="جست‌وجوی نام، شماره موبایل، خدمت یا یادداشت تخصصی"
          >
            <Input
              id="cust-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="مثلاً سارا احمدی، 0913 یا بالیاژ..."
            />
          </FormField>
        </Card>

        <Card variant="muted" className="flex flex-col justify-center space-y-1">
          <p className="text-xs text-[#6B6480] font-bold">
            کل پرونده‌های ثبت‌شده سالن
          </p>
          <p className="text-2xl font-extrabold text-[#061138] tabular-nums">
            {toPersianDigits(mergedBusinessCustomers.length)} نفر
          </p>
          <p className="text-[11px] text-[#6B6480]">
            شامل مشتریان آنلاین و حضوری
          </p>
        </Card>

        <Card variant="muted" className="flex flex-col justify-center space-y-1">
          <p className="text-xs text-[#6B6480] font-bold">
            مشتریان وفادار (۳+ مراجعه)
          </p>
          <p className="text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {toPersianDigits(
              mergedBusinessCustomers.filter((c) => c.totalVisits >= 3).length
            )}{' '}
            نفر
          </p>
          <Link
            to="/app/marketing"
            className="text-[11px] font-bold text-[#0057FF] hover:underline"
          >
            ارسال پیامک گروهی به مشتریان ←
          </Link>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="مشتری با این مشخصات یافت نشد"
          description="می‌توانید مشتریان حضوری یا قبلی سالن خود را به صورت تکی یا گروهی در چند ثانیه اضافه کنید."
          actionLabel="+ افزودن اولین مشتری دستی"
          onAction={openAddSingleModal}
        />
      ) : (
        <ResponsiveTable<CustomerRecord>
          keyExtractor={(row) => row.id}
          data={filtered}
          columns={[
            {
              key: 'name',
              header: 'نام مشتری و خدمت محبوب',
              render: (r) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={r.fullName} size="sm" tone="rose" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-extrabold text-[#1E1B2E]">
                        {r.fullName}
                      </p>
                      {r.sourceLabel === 'MANUAL' ||
                      r.sourceLabel === 'BULK_IMPORT' ? (
                        <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          ثبت دستی
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-[#6B6480]">{r.favoriteService}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'phone',
              header: 'شماره همراه',
              render: (r) => (
                <span
                  dir="ltr"
                  className="text-xs font-mono font-bold text-[#061138] tabular-nums"
                >
                  {r.phone || r.phoneMasked}
                </span>
              ),
            },
            {
              key: 'visits',
              header: 'مراجعات',
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <StatusBadge
                    label={`${toPersianDigits(r.totalVisits)} نوبت`}
                    tone="primary"
                  />
                  <button
                    type="button"
                    title="ثبت سریع ۱ مراجعه حضوری جدید برای این مشتری"
                    onClick={() =>
                      updateCustomer(r.id, {
                        totalVisits: (r.totalVisits || 0) + 1,
                        lastVisitJalali: 'امروز',
                      })
                    }
                    className="rounded-lg border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-black text-violet-700 hover:bg-violet-100 cursor-pointer"
                  >
                    +۱ مراجعه
                  </button>
                </div>
              ),
            },
            {
              key: 'spent',
              header: 'مجموع تراکنش‌ها',
              align: 'left',
              render: (r) => (
                <span className="tabular-nums font-extrabold text-[#8B5CF6]">
                  {formatPriceToman(r.totalSpentToman)}
                </span>
              ),
            },
            {
              key: 'action',
              header: 'مدیریت پرونده',
              render: (r) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(r);
                      setQuickSmsText(
                        `سلام ${r.fullName} عزیز، از همراهی شما با ${currentBiz?.name || 'سالن زیبایی ما'} سپاسگزاریم. برای رزرو نوبت بعدی در خدمتتان هستیم.`
                      );
                    }}
                  >
                    پرونده و پیامک
                  </Button>
                  <button
                    type="button"
                    onClick={() => openEditSingleModal(r)}
                    title="ویرایش مشخصات و یادداشت مشتری"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCustomer(r.id)}
                    title="حذف پرونده مشتری"
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* مودال ۱: افزودن یا ویرایش تکی مشتری */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={() => setIsSingleModalOpen(false)}
        title={
          editingCustomerId
            ? 'ویرایش پرونده مشتری'
            : 'افزودن دستی مشتری جدید به سالن'
        }
        description="اطلاعات مشتری حضوری یا تلفنی سالن را وارد کنید تا در باشگاه مشتریان و پنل پیامک شما ذخیره شود."
      >
        <form onSubmit={handleSaveSingleCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              id="single-cust-name"
              label="نام و نام خانوادگی مشتری"
              required
            >
              <Input
                id="single-cust-name"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder="مثلاً: سارا محمدی"
                required
              />
            </FormField>

            <FormField
              id="single-cust-phone"
              label="شماره موبایل (۱۱ رقمی با ۰۹)"
              required
            >
              <Input
                id="single-cust-phone"
                dir="ltr"
                value={formPhone}
                onChange={(e) =>
                  setFormPhone(normalizeIranMobileInput(e.target.value))
                }
                placeholder="09131234567"
                maxLength={11}
                required
              />
            </FormField>
          </div>

          <FormField
            id="single-cust-service"
            label="خدمت پرتکرار یا مورد علاقه مشتری"
            hint="می‌توانید روی یکی از خدمات سالن کلیک کنید یا نام خدمت را بنویسید"
          >
            <Input
              id="single-cust-service"
              value={formFavoriteService}
              onChange={(e) => setFormFavoriteService(e.target.value)}
              placeholder="مثلاً: رنگ و مش، کاشت ناخن، فیشیال..."
            />
            {bizServices.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bizServices.slice(0, 6).map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setFormFavoriteService(srv.title)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      formFavoriteService === srv.title
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {srv.title}
                  </button>
                ))}
              </div>
            ) : null}
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              id="single-cust-visits"
              label="تعداد مراجعات قبلی"
              hint="برای مشتریان قدیمی سالن عدد واقعی را وارد کنید"
            >
              <Input
                id="single-cust-visits"
                type="number"
                min={0}
                value={formTotalVisits}
                onChange={(e) => setFormTotalVisits(e.target.value)}
              />
            </FormField>

            <FormField
              id="single-cust-spent"
              label="مجموع پرداختی قبلی (تومان - اختیاری)"
            >
              <Input
                id="single-cust-spent"
                type="number"
                min={0}
                step={50000}
                value={formTotalSpent}
                onChange={(e) => setFormTotalSpent(e.target.value)}
              />
            </FormField>
          </div>

          <FormField
            id="single-cust-notes"
            label="یادداشت تخصصی پرونده (فرمول رنگ، حساسیت پوستی، سلیقه و...)"
          >
            <Textarea
              id="single-cust-notes"
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="مثلاً: پایه مو ۸، ترکیب رنگ دودی زیتونی شماره ۸.۱ با اکسیدان ۶٪ - پوست حساس..."
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSingleModalOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary" size="sm">
              <Check className="w-4 h-4" />
              <span>
                {editingCustomerId ? 'ذخیره تغییرات پرونده' : 'ثبت در لیست مشتریان'}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال ۲: ورود سریع گروهی مشتریان قبلی (بهینه‌ترین روش برای سالن‌دارهای پرمشتری) */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="افزودن سریع و گروهی مشتریان قبلی سالن"
        description="اگر لیست مشتریان حضوری یا دفترچه تلفن سالن را دارید، به راحتی چند مشتری را همزمان وارد کنید."
      >
        <div className="space-y-4">
          {/* سوئیچ بین حالت جدول چندردیفه و حالت کپی/پیست متنی */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setBulkMode('GRID')}
              className={`rounded-xl py-2 px-3 text-xs font-extrabold transition cursor-pointer ${
                bulkMode === 'GRID'
                  ? 'bg-white text-[#061138] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ۱. جدول ورود سریع ردیفی
            </button>
            <button
              type="button"
              onClick={() => setBulkMode('PASTE')}
              className={`rounded-xl py-2 px-3 text-xs font-extrabold transition cursor-pointer ${
                bulkMode === 'PASTE'
                  ? 'bg-white text-[#061138] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ۲. کپی و جای‌گذاری لیست متنی
            </button>
          </div>

          {bulkMode === 'GRID' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                نام و شماره موبایل مشتریان را ردیف‌به‌ردیف وارد کنید (ردیف‌های خالی نادیده گرفته می‌شوند):
              </p>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {bulkRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-xl border border-slate-200 bg-slate-50/70 p-2"
                  >
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={row.fullName}
                        onChange={(e) =>
                          setBulkRows((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, fullName: e.target.value }
                                : item
                            )
                          )
                        }
                        placeholder={`نام مشتری ${toPersianDigits(idx + 1)}`}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={11}
                        value={row.phone}
                        onChange={(e) =>
                          setBulkRows((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    phone: normalizeIranMobileInput(
                                      e.target.value
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                        placeholder="0913..."
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={row.favoriteService}
                        onChange={(e) =>
                          setBulkRows((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, favoriteService: e.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="خدمت یا یادداشت (اختیاری)"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setBulkRows((prev) => [
                      ...prev,
                      {
                        id: `r-${Date.now()}-${prev.length}`,
                        fullName: '',
                        phone: '',
                        favoriteService: '',
                        notes: '',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-violet-700 hover:text-violet-900 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن ردیف بیشتر</span>
                </button>

                <span className="text-xs font-bold text-emerald-700">
                  {toPersianDigits(validGridItems.length)} ردیف معتبر آماده ثبت
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-xs text-violet-950 space-y-1">
                <p className="font-extrabold">
                  نحوه ورود سریع از دفترچه تلفن یا اکسل:
                </p>
                <p className="text-[11px] text-violet-800 leading-relaxed">
                  در هر خط، نام مشتری و شماره موبایل را بنویسید یا کپی کنید. سیستم به صورت هوشمند شماره موبایل و نام را جدا می‌کند:
                </p>
                <pre
                  dir="rtl"
                  className="mt-1 rounded-lg bg-white/90 p-2 text-[11px] font-mono text-slate-700 border border-violet-100"
                >
                  {`سارا احمدی - 09131112233 - رنگ و لایت\nمریم رضایی، 09132223344\nنازنین کریمی 09123334455`}
                </pre>
              </div>

              <Textarea
                id="bulk-paste-input"
                rows={6}
                value={bulkPasteText}
                onChange={(e) => setBulkPasteText(e.target.value)}
                placeholder={`سارا احمدی - 09131112233\nمریم رضایی - 09132223344`}
              />

              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs">
                <span className="font-bold text-emerald-900">
                  مشتریان شناسایی‌شده در متن:
                </span>
                <span className="font-black text-emerald-700">
                  {toPersianDigits(parsedPasteItems.length)} نفر آماده افزودن
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsBulkModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleBulkSubmit}
            >
              <Check className="w-4 h-4" />
              <span>
                ثبت یکجای مشتریان (
                {toPersianDigits(
                  bulkMode === 'GRID'
                    ? validGridItems.length
                    : parsedPasteItems.length
                )}{' '}
                نفر)
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال ۳: مشاهده پرونده کامل، یادداشت‌ها و ارسال پیامک مستقیم */}
      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={`پرونده مشتری: ${selectedCustomer?.fullName ?? ''}`}
        description="سوابق مراجعات، شماره تماس کامل، یادداشت تخصصی و ارسال پیامک مستقیم"
      >
        {selectedCustomer ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-2">
              <div className="flex items-center justify-between">
                <p>
                  <strong className="text-[#1E1B2E]">شماره همراه مشتری:</strong>{' '}
                  <span
                    dir="ltr"
                    className="font-mono font-extrabold text-[#0057FF]"
                  >
                    {selectedCustomer.phone || selectedCustomer.phoneMasked}
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditSingleModal(selectedCustomer)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش پرونده</span>
                </Button>
              </div>
              <p>
                <strong className="text-[#1E1B2E]">خدمت پرتکرار:</strong>{' '}
                {selectedCustomer.favoriteService}
              </p>
              <p>
                <strong className="text-[#1E1B2E]">تعداد کل مراجعات:</strong>{' '}
                <span className="font-bold text-violet-700">
                  {toPersianDigits(selectedCustomer.totalVisits)} بار
                </span>{' '}
                (آخرین مراجعه: {selectedCustomer.lastVisitJalali})
              </p>
              <p>
                <strong className="text-[#1E1B2E]">یادداشت تخصصی سالن:</strong>{' '}
                {selectedCustomer.notes}
              </p>
            </div>

            {/* ارسال سریع پیامک به همین مشتری */}
            {selectedCustomer.phone ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                <p className="font-extrabold text-[#061138] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#0057FF]" />
                  <span>ارسال پیامک مستقیم به {selectedCustomer.fullName}</span>
                </p>
                <Textarea
                  id="quick-cust-sms"
                  rows={2}
                  value={quickSmsText}
                  onChange={(e) => setQuickSmsText(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isSendingQuickSms}
                    onClick={async () => {
                      if (!selectedCustomer.phone) return;
                      setIsSendingQuickSms(true);
                      await sendBusinessCustomerSms({
                        businessId: currentBiz?.id,
                        recipientPhones: [selectedCustomer.phone],
                        messageText: quickSmsText,
                        templateTitle: `پیامک اختصاصی به ${selectedCustomer.fullName}`,
                      });
                      setIsSendingQuickSms(false);
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال پیامک</span>
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <h3 className="font-extrabold text-[#1E1B2E]">
                تاریخچه نوبت‌های ثبت‌شده در سیستم:
              </h3>
              {appointments.filter((a) =>
                a.customerName.includes(selectedCustomer.fullName)
              ).length === 0 ? (
                <p className="text-slate-500">
                  نوبت آنلاینی در سیستم ثبت نشده است (مشتری حضوری سالن).
                </p>
              ) : (
                appointments
                  .filter((a) =>
                    a.customerName.includes(selectedCustomer.fullName)
                  )
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-xl border border-[#E6E0F5] flex items-center justify-between"
                    >
                      <span className="font-bold text-[#1E1B2E]">
                        {apt.serviceTitle} ({apt.dateJalali})
                      </span>
                      <span className="font-extrabold text-[#8B5CF6] tabular-nums">
                        {formatPriceToman(apt.priceToman)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

/** ۷. گالری نمونه کارها و استوری‌های ویژه VIP (/app/gallery) */
export const BusinessGalleryPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    services,
    activePlanId,
    gallery,
    addGalleryItem,
    removeGalleryItem,
    businessStories,
    addBusinessStory,
    deleteBusinessStory,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const [title, setTitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('پوست و فیشیال');
  const [galleryImageUrl, setGalleryImageUrl] = useState('');
  const [galleryImageSizeKb, setGalleryImageSizeKb] = useState<
    number | undefined
  >(undefined);

  // استیت‌های فرم انتشار استوری ویژه (مختص پلن VIP)
  const [storyTitle, setStoryTitle] = useState('');
  const [storyBadge, setStoryBadge] = useState('🔥 نوبت خالی امروز');
  const [storyCaption, setStoryCaption] = useState('');
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [storyLinkedServiceId, setStoryLinkedServiceId] = useState('');
  const [storyCtaLabel, setStoryCtaLabel] = useState(
    'رزرو آنلاین این پیشنهاد ←'
  );

  const isVipPlanActive = isVipSubscriptionPlan(
    activePlanId,
    currentBiz?.subscriptionPlan
  );

  const bizServices = currentBiz
    ? services.filter((s) => s.businessId === currentBiz.id)
    : [];
  const bizStories = currentBiz
    ? businessStories.filter((st) => st.businessId === currentBiz.id)
    : [];
  const bizGallery = currentBiz
    ? gallery.filter((g) => g.businessId === currentBiz.id)
    : [];

  const handleAddRealPortfolioPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryImageUrl) {
      showToast(
        'لطفاً ابتدا عکس نمونه‌کار خود را از گالری گوشی یا سیستم انتخاب و کراپ کنید.',
        'warning'
      );
      return;
    }
    if (!title.trim()) {
      showToast('لطفاً عنوان نمونه‌کار (مثلاً فیشیال تخصصی یا بالیاژ مو) را وارد کنید.');
      return;
    }
    addGalleryItem({
      businessId: currentBiz?.id ?? 'biz-owner-zero',
      title: title.trim(),
      categoryLabel,
      theme: 'violet',
      imageUrl: galleryImageUrl,
      compressedSizeKb: galleryImageSizeKb,
    });
    setTitle('');
    setGalleryImageUrl('');
    setGalleryImageSizeKb(undefined);
  };

  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBiz) return;
    if (!isVipPlanActive) {
      showToast(
        'انتشار استوری و هایلایت روزانه در بالای پروفایل، اختصاصی مشترکین پلن VIP است.',
        'warning'
      );
      return;
    }
    if (!storyTitle.trim()) {
      showToast(
        'لطفاً عنوان کوتاه استوری (مثلاً تخفیف فیشیال یا نوبت خالی امروز) را وارد کنید.'
      );
      return;
    }
    addBusinessStory({
      businessId: currentBiz.id,
      title: storyTitle.trim(),
      badgeLabel: storyBadge,
      caption:
        storyCaption.trim() ||
        `${storyTitle.trim()} در ${currentBiz.name} — جهت رزرو آنلاین روی دکمه زیر کلیک کنید.`,
      imageUrl: storyImageUrl || currentBiz.avatarUrl,
      ctaLabel: storyCtaLabel.trim() || 'رزرو آنلاین این پیشنهاد ←',
      linkedServiceId: storyLinkedServiceId || undefined,
    });
    setStoryTitle('');
    setStoryCaption('');
    setStoryImageUrl('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="کسب‌وکار · گالری نمونه‌کارهای واقعی و استوری VIP"
        title="آپلود گالری نمونه‌کارها و مدیریت استوری روزانه (VIP)"
        subtitle="عکس‌های واقعی نمونه‌کارهای خود را با قابلیت کراپ، چپ و راست کردن کادر و فشرده‌سازی خودکار WebP (بدون سنگین شدن سایت) در گالری پروفایل منتشر کنید"
        routePattern="/app/gallery"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'گالری نمونه‌کارها و استوری VIP' },
        ]}
        actions={
          currentBiz ? (
            <Link to={`/salon/${currentBiz.slug}`}>
              <Button variant="outline" size="sm">
                <span>مشاهده گالری و استوری در پروفایل عمومی</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : null
        }
      />

      {/* بخش ۱ (اصلی در بالای صفحه): آپلود عکس واقعی در گالری نمونه‌کارهای پروفایل سالن */}
      <Card className="border-2 border-[#0057FF]/30 bg-white space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
              📸 ۱. آپلود عکس جدید در گالری نمونه‌کارهای پروفایل سالن
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              پس از انتخاب عکس از گالری گوشی یا سیستم، می‌توانید کادر را چپ و راست کنید، کراپ بزنید و پیش‌نمایش آن را قبل از انتشار ببینید.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-extrabold">
            {toPersianDigits(bizGallery.length)} نمونه‌کار واقعی ثبت‌شده
          </span>
        </div>

        <form onSubmit={handleAddRealPortfolioPhoto} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-6">
              <ProfilePhotoUploader
                value={galleryImageUrl}
                businessName={currentBiz?.name}
                aspectRatio="4:3"
                label="انتخاب و کراپ تصویر نمونه‌کار (با فشرده‌سازی خودکار WebP)"
                helperText="با انتخاب عکس، پنجره کراپ، جابه‌جایی چپ/راست و پیش‌نمایش زنده باز می‌شود و حجم عکس بدون افت کیفیت به حدود ۴۰ کیلوبایت کاهش می‌یابد."
                onChange={(url, sizeKb) => {
                  setGalleryImageUrl(url);
                  setGalleryImageSizeKb(sizeKb);
                }}
              />
            </div>

            <div className="lg:col-span-6 space-y-3.5">
              <FormField
                id="gal-title"
                label="عنوان نمونه‌کار (زیر عکس در پروفایل نمایش داده می‌شود)"
                required
              >
                <Input
                  id="gal-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: فیشیال تخصصی VIP / لایت و بالیاژ مو / کاشت ناخن..."
                />
              </FormField>

              <FormField id="gal-cat" label="دسته‌بندی تخصصی نمونه‌کار">
                <Select
                  id="gal-cat"
                  value={categoryLabel}
                  onChange={(e) => setCategoryLabel(e.target.value)}
                  options={[
                    { value: 'پوست و فیشیال', label: 'پوست و فیشیال' },
                    { value: 'مو و رنگ', label: 'مو و رنگ' },
                    { value: 'کاشت و طراحی ناخن', label: 'کاشت و طراحی ناخن' },
                    { value: 'میکاپ و عروس', label: 'میکاپ و عروس' },
                    { value: 'مژه و ابرو', label: 'مژه و ابرو' },
                    { value: 'لیزر موهای زائد', label: 'لیزر موهای زائد' },
                    {
                      value: 'پیرایش و استایل مردانه',
                      label: 'پیرایش و استایل مردانه',
                    },
                  ]}
                />
              </FormField>

              <div className="pt-1 flex items-center justify-end">
                <Button type="submit" variant="primary">
                  <Plus className="w-4 h-4" />
                  <span>ثبت و انتشار عکس در گالری پروفایل</span>
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* شبکه عکس‌های واقعی آپلودشده در گالری سالن */}
        <div className="pt-3 border-t border-[#E2E8F0]">
          {bizGallery.length === 0 ? (
            <EmptyState
              title="گالری نمونه‌کارهای سالن شما هنوز خالی است"
              description="هیچ عکس نمایشی یا فیکی در گالری شما وجود ندارد. از فرم بالا اولین عکس واقعی نمونه‌کار خود را انتخاب، کراپ و منتشر کنید."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bizGallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] overflow-hidden flex flex-col justify-between shadow-2xs"
                >
                  <div className="relative aspect-[4/3] bg-[#E2E8F0] overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <VisualMediaIllustration
                        theme={item.theme}
                        categoryLabel={item.categoryLabel}
                        title={item.title}
                        city={currentBiz?.city || 'اصفهان'}
                      />
                    )}
                    {item.compressedSizeKb ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[#10B981] text-[10px] font-extrabold">
                        WebP · {toPersianDigits(item.compressedSizeKb)} KB
                      </span>
                    ) : null}
                    <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-[#061138]/80 text-white text-[10px] font-bold">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2 text-xs bg-white">
                    <div className="min-w-0">
                      <p className="font-extrabold text-[#1E1B2E] truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        نمایش در تب گالری پروفایل عمومی
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(item.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] cursor-pointer shrink-0"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* بخش ۲: مدیریت استوری و هایلایت روزانه بالای پروفایل (اختصاصی پلن VIP) */}
      <Card className="border-2 border-[#8B5CF6]/35 bg-gradient-to-br from-[#FAF8FF] via-white to-[#FDF4FF] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E0F5] pb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-l from-[#061138] to-[#7C3AED] text-[#00E5FF] text-xs font-black">
                ✨ ۲. استوری و هایلایت ویژه بالای پروفایل سالن (اختصاصی پلن VIP)
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isVipPlanActive
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {isVipPlanActive
                  ? 'فعال روی حساب VIP شما ✓'
                  : '🔒 نیازمند پلن VIP'}
              </span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              <strong>جایگاه نمایش به مشتری کجاست؟</strong> استوری‌های شما دقیقاً در{' '}
              <strong>
                بالای صفحه پروفایل عمومی سالن شما (`/salon/{currentBiz?.slug || 'your-salon'}`)
              </strong>{' '}
              به صورت دایره‌های استوری با حلقه طلایی-بنفش (مشابه اینستاگرام) و همچنین حلقه استوری دور عکس پروفایل سالن نمایش داده می‌شود و مشتری با کلیک روی استوری می‌تواند مستقیماً همان خدمت یا تخفیف را رزرو کند.
            </p>
          </div>
        </div>

        {!isVipPlanActive ? (
          <PlanUpgradeLockBanner
            featureTitle="انتشار استوری روزانه، اعلام نوبت خالی لحظه‌آخری و هایلایت تخفیف در بالای پروفایل"
            description="این قابلیت منحصراً برای مشترکین «پلن VIP (برندینگ و استوری)» فعال است. با ارتقا به پلن VIP (یا فعال‌سازی تست VIP توسط مدیریت)، می‌توانید نامحدود استوری تصویری با دکمه رزرو مستقیم در بالای پروفایل خود منتشر کنید."
            requiredPlanLabel="پلن VIP (برندینگ و استوری)"
          />
        ) : (
          <form onSubmit={handlePublishStory} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-5">
                <ProfilePhotoUploader
                  value={storyImageUrl}
                  businessName={currentBiz?.name}
                  aspectRatio="4:5"
                  label="۱. تصویر استوری (با قابلیت کراپ و چپ/راست کردن کادر)"
                  onChange={(url) => setStoryImageUrl(url)}
                />
              </div>

              <div className="lg:col-span-7 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#061138] block">
                    ۲. انتخاب برچسب بالای استوری:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '🔥 نوبت خالی امروز',
                      '🎁 تخفیف ویژه امروز',
                      '✨ نمونه‌کار جدید VIP',
                      '💆‍♀️ پکیج ویژه فیشیال',
                      '⚡ پیشنهاد لحظه‌آخری',
                    ].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setStoryBadge(b)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border cursor-pointer transition-all ${
                          storyBadge === b
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                            : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#7C3AED]'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    id="story-title"
                    label="۳. عنوان کوتاه زیر دایره استوری"
                    required
                  >
                    <Input
                      id="story-title"
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="مثلاً: ۲۰٪ تخفیف فیشیال فردا"
                    />
                  </FormField>

                  <FormField
                    id="story-service"
                    label="۴. اتصال دکمه رزرو استوری به خدمت"
                  >
                    <Select
                      id="story-service"
                      value={storyLinkedServiceId}
                      onChange={(e) => setStoryLinkedServiceId(e.target.value)}
                      options={[
                        {
                          value: '',
                          label: 'صفحه اصلی رزرو سالن (همه خدمات)',
                        },
                        ...bizServices.map((s) => ({
                          value: s.id,
                          label: `${s.title} (${formatServicePriceShort(s)})`,
                        })),
                      ]}
                    />
                  </FormField>
                </div>

                <FormField
                  id="story-caption"
                  label="۵. متن توضیحات داخل استوری برای مشتری"
                >
                  <Textarea
                    id="story-caption"
                    rows={2}
                    value={storyCaption}
                    onChange={(e) => setStoryCaption(e.target.value)}
                    placeholder="توضیح کوتاه درباره تخفیف، ظرفیت خالی یا جزئیات نمونه‌کار..."
                  />
                </FormField>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#475569] font-bold">متن دکمه رزرو:</span>
                    <input
                      type="text"
                      value={storyCtaLabel}
                      onChange={(e) => setStoryCtaLabel(e.target.value)}
                      className="rounded-xl border border-[#CBD5E1] bg-white px-2.5 py-1 text-xs font-extrabold text-[#7C3AED]"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm">
                    <Plus className="w-4 h-4" />
                    <span>انتشار استوری در بالای پروفایل</span>
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* لیست استوری‌های فعال سالن */}
        {bizStories.length > 0 ? (
          <div className="pt-3 border-t border-[#E6E0F5] space-y-2.5">
            <span className="text-xs font-extrabold text-[#1E1B2E] block">
              استوری‌های فعال شما در بالای پروفایل ({toPersianDigits(bizStories.length)} استوری):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bizStories.map((st) => (
                <div
                  key={st.id}
                  className="p-3 rounded-2xl bg-white border border-[#DDD6FE] flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#F59E0B] via-[#EC4899] to-[#8B5CF6] shrink-0">
                      <img
                        src={
                          st.imageUrl ||
                          currentBiz?.avatarUrl ||
                          '/assets/beauty/salon-1.jpg'
                        }
                        alt={st.title}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold text-[#7C3AED] block">
                        {st.badgeLabel}
                      </span>
                      <p className="font-black text-[#061138] truncate">
                        {st.title}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {st.caption}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBusinessStory(st.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] shrink-0 cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

/** ۸. پروفایل عمومی سالن (/app/profile) */
export const BusinessProfileEditPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    updateBusinessProfile,
    updateOnboardingDraft,
    settlementRequests,
    requestWalletSettlement,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [activeStep, setActiveStep] = useState<'INFO' | 'LOCATION' | 'WALLET'>(
    () =>
      typeof window !== 'undefined' &&
      window.location.hash === '#financial-section'
        ? 'WALLET'
        : 'INFO'
  );
  const [name, setName] = useState(currentBiz?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(currentBiz?.avatarUrl ?? '');
  const [coverUrl, setCoverUrl] = useState(currentBiz?.coverUrl ?? '');
  const [targetGender, setTargetGender] = useState<'FEMALE' | 'MALE' | 'BOTH'>(
    currentBiz?.targetGender ?? 'FEMALE'
  );
  const [instagramHandle, setInstagramHandle] = useState(
    currentBiz?.instagramHandle ?? ''
  );
  const [address, setAddress] = useState(currentBiz?.address ?? '');
  const [mapLat, setMapLat] = useState<number>(currentBiz?.mapLat ?? 32.6288);
  const [mapLng, setMapLng] = useState<number>(currentBiz?.mapLng ?? 51.6621);
  const [shortDesc, setShortDesc] = useState(
    currentBiz?.shortDescription ?? ''
  );
  const [aboutText, setAboutText] = useState(currentBiz?.aboutText ?? '');
  const [bankCardNumber, setBankCardNumber] = useState(
    currentBiz?.bankCardNumber ?? ''
  );
  const [bankShebaNumber, setBankShebaNumber] = useState(
    currentBiz?.bankShebaNumber ?? ''
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    currentBiz?.bankAccountHolder ?? currentBiz?.ownerName ?? ''
  );
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!currentBiz) return;
    setName(currentBiz.name ?? '');
    setAvatarUrl(currentBiz.avatarUrl ?? '');
    setCoverUrl(currentBiz.coverUrl ?? '');
    setTargetGender(currentBiz.targetGender ?? 'FEMALE');
    setInstagramHandle(currentBiz.instagramHandle ?? '');
    setAddress(currentBiz.address ?? '');
    setMapLat(currentBiz.mapLat ?? 32.6288);
    setMapLng(currentBiz.mapLng ?? 51.6621);
    setShortDesc(currentBiz.shortDescription ?? '');
    setAboutText(currentBiz.aboutText ?? '');
    setBankCardNumber(currentBiz.bankCardNumber ?? '');
    setBankShebaNumber(currentBiz.bankShebaNumber ?? '');
    setBankAccountHolder(
      currentBiz.bankAccountHolder ?? currentBiz.ownerName ?? ''
    );
  }, [currentBiz?.id]);

  if (!currentBiz) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-bold text-[#1E1B2E]">
          کسب‌وکاری برای ویرایش یافت نشد.
        </p>
      </Card>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedInsta = instagramHandle.trim();
    const cleanCard = bankCardNumber.replace(/\D/g, '').slice(0, 16);
    const cleanSheba = bankShebaNumber
      .toUpperCase()
      .replace(/[^0-9I-R]/g, '')
      .replace(/^IR/, '');
    updateBusinessProfile(currentBiz.id, {
      name,
      avatarUrl: avatarUrl || undefined,
      coverUrl: coverUrl || undefined,
      targetGender,
      instagramHandle: cleanedInsta,
      address,
      mapLat,
      mapLng,
      shortDescription: shortDesc,
      aboutText,
      bankCardNumber: cleanCard || undefined,
      bankShebaNumber: cleanSheba ? `IR${cleanSheba}` : undefined,
      bankAccountHolder: bankAccountHolder.trim() || undefined,
    });
    updateOnboardingDraft({
      businessName: name,
      avatarUrl,
      instagramHandle: cleanedInsta,
      address,
      mapLat,
      mapLng,
      shortDescription: shortDesc,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const isStep1Done = Boolean(name.trim() && (avatarUrl || currentBiz.avatarUrl));
  const isStep2Done = Boolean(address.trim() && mapLat && mapLng);
  const isStep3Done =
    bankCardNumber.replace(/\D/g, '').length >= 16 ||
    bankShebaNumber.replace(/\D/g, '').length >= 24;

  return (
    <div className="space-y-4">
      <PageHeader
        title="تکمیل پروفایل و حساب بانکی"
        actions={
          <Link to={`/salon/${currentBiz.slug}`}>
            <Button variant="outline" size="sm">
              <span>مشاهده صفحه عمومی</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        }
      />

      {/* نوار ۳ گام مجزا برای جلوگیری از اسکرول طولانی و سردرگمی سالن‌دار */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-white border border-[#E6E0F5] shadow-xs">
        {[
          {
            id: 'INFO' as const,
            stepNum: '۱',
            title: 'تصویر و مشخصات',
            done: isStep1Done,
          },
          {
            id: 'LOCATION' as const,
            stepNum: '۲',
            title: 'نقشه و نشانی',
            done: isStep2Done,
          },
          {
            id: 'WALLET' as const,
            stepNum: '۳',
            title: 'شبا و حساب بانکی',
            done: isStep3Done,
          },
        ].map((st) => {
          const isCurrent = activeStep === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveStep(st.id)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'bg-[#FAF9FE] text-[#6B6480] hover:text-[#1E1B2E]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] font-black shrink-0 ${
                  isCurrent
                    ? 'bg-white text-[#8B5CF6]'
                    : st.done
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#E6E0F5] text-[#6B6480]'
                }`}
              >
                {st.done && !isCurrent ? '✓' : st.stepNum}
              </span>
              <span className="truncate">{st.title}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card padding="lg" className="lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-4">
            {/* گام ۱: تصویر پروفایل (با ذخیره آنی بدون پریدن) و مشخصات پایه */}
            {activeStep === 'INFO' ? (
              <div className="space-y-4">
                <ProfilePhotoUploader
                  value={avatarUrl}
                  businessName={name || currentBiz.name}
                  enableCoverBannerOption={true}
                  coverValue={coverUrl}
                  onCoverChange={(newCover) => {
                    setCoverUrl(newCover);
                    updateBusinessProfile(currentBiz.id, {
                      coverUrl: newCover || undefined,
                    });
                    showToast(
                      newCover
                        ? 'تصویر افقی کارت صفحه اصلی و بنر پروفایل ذخیره شد ✓'
                        : 'تصویر کارت صفحه اصلی با تصویر اصلی پروفایل یکسان شد ✓'
                    );
                  }}
                  onChange={(url) => {
                    setAvatarUrl(url);
                    updateBusinessProfile(currentBiz.id, {
                      avatarUrl: url || undefined,
                    });
                    updateOnboardingDraft({
                      avatarUrl: url,
                    });
                    if (url) {
                      showToast('تصویر پروفایل سالن بلافاصله ذخیره و ثبت شد ✓');
                    }
                  }}
                  label="تصویر پروفایل و ویترین سالن (با قابلیت کراپ، چپ/راست و پیش‌نمایش در ۳ جایگاه)"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="prof-name"
                    label="نام سالن، کلینیک یا مرکز لیزر"
                    required
                  >
                    <Input
                      id="prof-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </FormField>
                  <FormField
                    id="prof-instagram"
                    label="آدرس اینستاگرام (اختیاری)"
                  >
                    <Input
                      id="prof-instagram"
                      dir="ltr"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="@goldenn_laserr"
                    />
                  </FormField>
                </div>

                {/* انتخاب مخاطب هدف (ویژه بانوان / آقایان / هر دو برای مراکز لیزر) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#1E1B2E] block">
                    مخاطب خدمات مرکز شما کیست؟
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'FEMALE' as const, label: 'ویژه بانوان' },
                      { value: 'MALE' as const, label: 'ویژه آقایان' },
                      {
                        value: 'BOTH' as const,
                        label: 'بانوان و آقایان (مراکز لیزر)',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTargetGender(opt.value)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                          targetGender === opt.value
                            ? 'bg-[#1E1B2E] text-white border-[#1E1B2E]'
                            : 'bg-[#FAF9FE] text-[#6B6480] border-[#E6E0F5] hover:border-[#8B5CF6]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <FormField
                  id="prof-short"
                  label="معرفی کوتاه یک‌خطی (نمایش در کارت سالن)"
                >
                  <Input
                    id="prof-short"
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                  />
                </FormField>

                <FormField id="prof-about" label="توضیحات تکمیلی درباره سالن (اختیاری)">
                  <Textarea
                    id="prof-about"
                    rows={2}
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                  />
                </FormField>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E0F5]">
                  <Button type="submit" variant="primary" size="sm">
                    ذخیره مشخصات
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStep('LOCATION')}
                  >
                    <span>گام بعدی: نقشه و نشانی</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            {/* گام ۲: نقشه ساده ۱-کلیکی و آدرس متنی */}
            {activeStep === 'LOCATION' ? (
              <div className="space-y-4">
                <LocationMapPicker
                  city={currentBiz.city}
                  neighborhood={currentBiz.neighborhood}
                  address={address}
                  lat={mapLat}
                  lng={mapLng}
                  onSelectLocation={(coords) => {
                    setMapLat(coords.lat);
                    setMapLng(coords.lng);
                    const nextAddress = coords.suggestedAddress || address;
                    if (coords.suggestedAddress) {
                      setAddress(coords.suggestedAddress);
                    }
                    updateBusinessProfile(currentBiz.id, {
                      mapLat: coords.lat,
                      mapLng: coords.lng,
                      address: nextAddress,
                      neighborhood:
                        coords.neighborhood || currentBiz.neighborhood,
                    });
                    updateOnboardingDraft({
                      mapLat: coords.lat,
                      mapLng: coords.lng,
                      address: nextAddress,
                      neighborhood:
                        coords.neighborhood || currentBiz.neighborhood,
                    });
                  }}
                />

                <FormField
                  id="prof-address"
                  label="نشانی دقیق متنی (اگر از روی نقشه پیدا نشد، مستقیم اینجا بنویسید)"
                  required
                >
                  <Input
                    id="prof-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثال: اصفهان، خیابان چهارباغ بالا، مجتمع پارسیان، طبقه ۲"
                  />
                </FormField>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E0F5]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveStep('INFO')}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>گام قبلی</span>
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button type="submit" variant="primary" size="sm">
                      ذخیره نشانی
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveStep('WALLET')}
                    >
                      <span>گام بعدی: شبا و بیعانه</span>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* گام ۳: شماره شبا، کارت بانکی و کیف پول بیعانه */}
            {activeStep === 'WALLET' ? (
              <div
                id="financial-section"
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3.5">
                  <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#061138]">
                      حساب بانکی و شبا جهت واریز بیعانه‌ها
                    </h3>
                    {isStep3Done ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-extrabold shrink-0">
                        تکمیل‌شده ✓
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/40 text-[10px] font-extrabold shrink-0">
                        نیاز به تکمیل
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <FormField
                      id="prof-bank-card"
                      label="شماره کارت بانکی (۱۶ رقم)"
                    >
                      <Input
                        id="prof-bank-card"
                        dir="ltr"
                        inputMode="numeric"
                        maxLength={19}
                        value={bankCardNumber}
                        onChange={(e) =>
                          setBankCardNumber(
                            e.target.value.replace(/[^\d-]/g, '').slice(0, 19)
                          )
                        }
                        placeholder="6037997512345678"
                      />
                    </FormField>

                    <FormField id="prof-bank-holder" label="نام صاحب حساب">
                      <Input
                        id="prof-bank-holder"
                        value={bankAccountHolder}
                        onChange={(e) => setBankAccountHolder(e.target.value)}
                        placeholder="نام و نام خانوادگی صاحب حساب"
                      />
                    </FormField>
                  </div>

                  <FormField
                    id="prof-bank-sheba"
                    label="شماره شبا (۲۴ رقم بدون یا با IR)"
                  >
                    <Input
                      id="prof-bank-sheba"
                      dir="ltr"
                      maxLength={26}
                      value={bankShebaNumber}
                      onChange={(e) => setBankShebaNumber(e.target.value)}
                      placeholder="IR120170000000123456789012"
                    />
                  </FormField>

                  {/* موجودی کیف پول بیعانه‌ها و لینک یکپارچه به تنظیمات قوانین بیعانه */}
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#CBD5E1]">
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-[#061138] block">
                          درصد بیعانه فعال سالن شما:{' '}
                          <span className="text-[#0057FF]">
                            {toPersianDigits(
                              currentBiz.depositPercent &&
                                currentBiz.depositPercent > 0
                                ? currentBiz.depositPercent
                                : 30
                            )}
                            ٪ مبلغ خدمت
                          </span>
                        </span>
                        <span className="text-[11px] text-[#64748B] block">
                          تعیین درصد بیعانه (پیشنهادی یا درصد دلخواه کارفرما) و قوانین کنسلی در بخش «تنظیمات پنل» یکپارچه شده است.
                        </span>
                      </div>
                      <Link
                        to="/app/settings#booking_rules"
                        className="px-3.5 py-2 rounded-xl bg-[#EEF4FF] hover:bg-[#0057FF] text-[#0057FF] hover:text-white border border-[#BFDBFE] text-xs font-extrabold transition-colors shrink-0"
                      >
                        تنظیم درصد بیعانه در تنظیمات ←
                      </Link>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-l from-[#061138] to-[#0B1E5B] text-white space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#00E5FF] shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-[#BAE6FD]">
                              موجودی کیف پول بیعانه‌های سالن
                            </p>
                            <p className="text-sm font-black text-white tabular-nums mt-0.5">
                              {formatPriceToman(
                                currentBiz.walletBalanceToman ?? 0
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => requestWalletSettlement(currentBiz.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-white text-[#061138] text-[11px] font-black transition-colors cursor-pointer"
                        >
                          درخواست تسویه به شبا ←
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6E0F5]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveStep('LOCATION')}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>گام قبلی: نقشه و نشانی</span>
                  </Button>
                  <Button type="submit" variant="primary">
                    ذخیره نهایی اطلاعات بانکی و پروفایل
                  </Button>
                </div>
              </div>
            ) : null}

            {savedNotice ? (
              <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-extrabold text-[#059669] text-center">
                تغییرات با موفقیت ذخیره شد ✓
              </div>
            ) : null}
          </form>
        </Card>

        <div className="lg:col-span-5 space-y-5">
          <Card variant="muted" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#8B5CF6]">
                پیش‌نمایش کارت و موقعیت در پروفایل عمومی
              </span>
              <StatusBadge label="زنده" tone="primary" />
            </div>
            {avatarUrl || currentBiz.avatarUrl ? (
              <div className="relative h-44 rounded-2xl overflow-hidden border border-[#E6E0F5] bg-[#1E1B2E]">
                <img
                  src={avatarUrl || currentBiz.avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <VisualMediaIllustration
                theme="violet"
                categoryLabel={currentBiz.typeLabel}
                title={name}
                city={currentBiz.city}
              />
            )}
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1E1B2E]">{name}</h3>
              <p className="text-xs text-[#6B6480] leading-relaxed">
                {shortDesc}
              </p>
              <div className="pt-2 border-t border-[#E6E0F5] space-y-1.5 text-xs">
                <p className="text-[#6B6480] flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 mt-0.5" />
                  <span>{address}</span>
                </p>
                {instagramHandle.trim() ? (
                  <p className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[#6B6480]">
                      <Instagram className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>صفحه اینستاگرام:</span>
                    </span>
                    <span
                      dir="ltr"
                      className="font-mono font-bold text-[#8B5CF6] bg-[#EDE9FE] px-2 py-0.5 rounded border border-[#EDE9FE]"
                    >
                      {instagramHandle.trim().startsWith('@')
                        ? instagramHandle.trim()
                        : `@${instagramHandle.trim()}`}
                    </span>
                  </p>
                ) : null}
              </div>
              <LocationMapPicker
                city={currentBiz.city}
                neighborhood={currentBiz.neighborhood}
                address={address}
                lat={mapLat}
                lng={mapLng}
                readOnly
              />
            </div>
          </Card>

          <BusinessQrCodeCard
            businessName={name || currentBiz.name}
            slug={currentBiz.slug}
            city={currentBiz.city}
            neighborhood={currentBiz.neighborhood}
            compact
          />
        </div>
      </div>
    </div>
  );
};

/** ۹. ساعات کاری هفتگی (/app/working-hours) — پشتیبانی از یک‌سره یا دو شیفته (استراحت بین روز) */
export const BusinessWorkingHoursPage: React.FC = () => {
  const { currentBusiness, businesses, updateBusinessWorkingHours, showToast } =
    usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const [hours, setHours] = useState(currentBiz?.workingHours ?? []);

  const handleToggleDay = (index: number) => {
    setHours((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  const handleToggleBreak = (index: number) => {
    setHours((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              hasBreak: !item.hasBreak,
              closeTime: !item.hasBreak ? '۱۳:۳۰' : '۱۹:۳۰',
              secondOpenTime: item.secondOpenTime || '۱۶:۰۰',
              secondCloseTime: item.secondCloseTime || '۲۱:۰۰',
            }
          : item
      )
    );
  };

  const handleTimeChange = (
    index: number,
    field: 'openTime' | 'closeTime' | 'secondOpenTime' | 'secondCloseTime',
    val: string
  ) => {
    setHours((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: val } : item
      )
    );
  };

  const handleApplyDayToAllWeek = (sourceIdx: number) => {
    const sourceDay = hours[sourceIdx];
    if (!sourceDay) return;
    setHours((prev) =>
      prev.map((item) => ({
        ...item,
        openTime: sourceDay.openTime,
        closeTime: sourceDay.closeTime,
        hasBreak: sourceDay.hasBreak,
        secondOpenTime: sourceDay.secondOpenTime,
        secondCloseTime: sourceDay.secondCloseTime,
      }))
    );
    showToast(
      `برنامه کاری (${formatWorkingHourDisplay(sourceDay)}) روی تمام روزهای هفته اعمال شد.`
    );
  };

  const openDaysCount = hours.filter((h) => h.isOpen).length;

  return (
    <div>
      <PageHeader
        kicker="کسب‌وکار · برنامه پذیرش یک‌سره یا دو شیفته"
        title="تنظیم ساعات کاری هفتگی و استراحت بین روز"
        subtitle="می‌توانید ساعت کاری هر روز را به صورت «یک‌سره» یا «دو شیفته (با استراحت ظهر)» تنظیم کنید؛ ساعات استراحت به‌صورت خودکار از اسلات‌های رزرو مشتریان حذف می‌شوند"
        routePattern="/app/working-hours"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'ساعات کاری هفتگی' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <Card padding="lg" className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E6E0F5]">
            <span className="text-xs font-extrabold text-[#061138]">
              انتخاب بازه ساعت کاری روزهای هفته (تک‌شیفت یا دو شیفته با استراحت ظهر)
            </span>
            {hours.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyDayToAllWeek(0)}
              >
                <Check className="w-3.5 h-3.5" />
                <span>اعمال برنامه شنبه روی تمام روزهای هفته</span>
              </Button>
            ) : null}
          </div>

          <div className="divide-y divide-[#E6E0F5]">
            {hours.map((d, idx) => (
              <div
                key={d.dayName}
                className="py-4 first:pt-0 last:pb-0 space-y-2.5 text-xs sm:text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2.5 font-extrabold text-[#1E1B2E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={d.isOpen}
                        onChange={() => handleToggleDay(idx)}
                        className="accent-[#8B5CF6] w-4 h-4"
                      />
                      <span>{d.dayName}</span>
                    </label>
                    {d.isOpen ? (
                      <button
                        type="button"
                        onClick={() => handleToggleBreak(idx)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                          d.hasBreak
                            ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                            : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:border-[#0057FF]'
                        }`}
                      >
                        {d.hasBreak
                          ? '☕ دو شیفته (دارای استراحت بین روز ✓)'
                          : '+ افزودن استراحت بین روز (دو شیفته)'}
                      </button>
                    ) : null}
                  </div>

                  {d.isOpen ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {d.hasBreak ? (
                        <span className="text-[11px] font-bold text-[#0057FF]">
                          شیفت صبح:
                        </span>
                      ) : null}
                      <select
                        value={d.openTime}
                        onChange={(e) =>
                          handleTimeChange(idx, 'openTime', e.target.value)
                        }
                        aria-label={`ساعت شروع ${d.dayName}`}
                        className="rounded-xl border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#061138] tabular-nums focus:outline-none focus:border-[#0057FF] cursor-pointer"
                      >
                        {STANDARD_WORKING_TIME_OPTIONS.map((t) => (
                          <option key={`open-${d.dayName}-${t}`} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="text-[#6B6480] text-xs font-bold">تا</span>
                      <select
                        value={d.closeTime}
                        onChange={(e) =>
                          handleTimeChange(idx, 'closeTime', e.target.value)
                        }
                        aria-label={`ساعت پایان شیفت اول ${d.dayName}`}
                        className="rounded-xl border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#061138] tabular-nums focus:outline-none focus:border-[#0057FF] cursor-pointer"
                      >
                        {STANDARD_WORKING_TIME_OPTIONS.map((t) => (
                          <option key={`close-${d.dayName}-${t}`} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      {idx === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleApplyDayToAllWeek(idx)}
                          className="text-[11px] font-extrabold text-[#0057FF] bg-[#E0ECFF] hover:bg-[#0057FF] hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          اعمال به کل هفته
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <StatusBadge label="تعطیل" tone="neutral" />
                  )}
                </div>

                {d.isOpen && d.hasBreak ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs">
                    <span className="text-[11px] font-bold text-[#92400E]">
                      ⏸ استراحت ظهر از ساعت {d.closeTime} تا{' '}
                      {d.secondOpenTime || '۱۶:۰۰'} (غیرقابل رزرو)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold text-[#061138]">
                        شیفت عصر:
                      </span>
                      <select
                        value={d.secondOpenTime || '۱۶:۰۰'}
                        onChange={(e) =>
                          handleTimeChange(
                            idx,
                            'secondOpenTime',
                            e.target.value
                          )
                        }
                        aria-label={`شروع شیفت عصر ${d.dayName}`}
                        className="rounded-xl border border-[#F59E0B] bg-white px-2.5 py-1 text-xs font-extrabold text-[#061138] tabular-nums cursor-pointer"
                      >
                        {STANDARD_WORKING_TIME_OPTIONS.map((t) => (
                          <option key={`s2open-${d.dayName}-${t}`} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="text-[#92400E] font-bold">تا</span>
                      <select
                        value={d.secondCloseTime || '۲۱:۰۰'}
                        onChange={(e) =>
                          handleTimeChange(
                            idx,
                            'secondCloseTime',
                            e.target.value
                          )
                        }
                        aria-label={`پایان شیفت عصر ${d.dayName}`}
                        className="rounded-xl border border-[#F59E0B] bg-white px-2.5 py-1 text-xs font-extrabold text-[#061138] tabular-nums cursor-pointer"
                      >
                        {STANDARD_WORKING_TIME_OPTIONS.map((t) => (
                          <option key={`s2close-${d.dayName}-${t}`} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E6E0F5]">
            <Button
              variant="primary"
              disabled={!currentBiz}
              onClick={() => {
                if (currentBiz) {
                  updateBusinessWorkingHours(currentBiz.id, hours);
                }
              }}
            >
              ذخیره ساعات کاری و شیفت‌ها
            </Button>
          </div>
        </Card>

        <Card variant="muted" className="lg:col-span-4 space-y-3">
          <p className="text-xs font-extrabold text-[#8B5CF6]">
            خلاصه برنامه هفتگی
          </p>
          <p className="text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
            {toPersianDigits(openDaysCount)} روز کاری فعال در هفته
          </p>
          <p className="text-xs text-[#6B6480] leading-relaxed">
            ساعات کاری و استراحت بین روز مستقیماً بازه‌های قابل انتخاب در تقویم رزرو آنلاین مشتریان را فیلتر می‌کند تا در ساعت استراحت نوبتی ثبت نشود.
          </p>
        </Card>
      </div>
    </div>
  );
};

/** ۱۰. تبلیغات، ارتقای جایگاه، پنل ارسال پیامک مشتریان و کمپین‌ها (/app/marketing) */
export const BusinessMarketingPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    customers,
    categories,
    plans,
    activePlanId,
    campaigns,
    addCampaign,
    updateBusinessProfile,
    adPackages,
    paymentOrders,
    smsLogs,
    sendBusinessCustomerSms,
    sendAppointmentReminders,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('15');
  const [segment, setSegment] = useState('مشتریان وفادار');
  const [sponsoredLabelInput, setSponsoredLabelInput] = useState(
    currentBiz?.sponsoredLabel || 'پیشنهاد ویژه · ۲۰٪ تخفیف'
  );
  const [sponsoredTargetCategory, setSponsoredTargetCategory] = useState(
    currentBiz?.sponsoredCategorySlug || currentBiz?.categorySlug || 'ALL'
  );
  const [sponsoredTargetNeighborhood, setSponsoredTargetNeighborhood] =
    useState(currentBiz?.sponsoredNeighborhood || currentBiz?.neighborhood || 'ALL');
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemPayload | null>(
    null
  );

  // استیت پنل ارسال پیامک مستقیم به مشتریان سالن
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(() =>
    customers.slice(0, 2).map((c) => c.id)
  );
  const [customPhoneInput, setCustomPhoneInput] = useState('');
  const [customRecipients, setCustomRecipients] = useState<
    Array<{ name: string; phone: string }>
  >([]);
  const [smsTemplateTitle, setSmsTemplateTitle] = useState('یادآور و دعوت مراجعه مجدد');
  const [smsMessageText, setSmsMessageText] = useState(
    `مشتری عزیز، از همراهی شما با ${currentBiz?.name || 'سالن زیبایی ما'} سپاسگزاریم. با کد تخفیف ۱۵٪ منتظر دیدار مجدد شما در تایم تو هستیم.`
  );
  const [isSendingSms, setIsSendingSms] = useState(false);

  const isSponsoredActive = Boolean(currentBiz?.isSponsored);
  const extraSms = currentBiz?.extraSmsBalance ?? 0;
  const activePlanObj =
    plans.find(
      (p) => p.id === activePlanId || p.name === currentBiz?.subscriptionPlan
    ) || plans[0];
  const planSmsQuota = activePlanObj?.smsQuotaMonthly ?? 0;
  const smsSentSoFar = currentBiz?.smsSentCount ?? 0;
  const totalSmsQuota = planSmsQuota + extraSms;
  const remainingSms = Math.max(0, totalSmsQuota - smsSentSoFar);

  const smsPresets = [
    {
      label: 'یادآور و دعوت مراجعه مجدد',
      text: `مشتری عزیز، از همراهی شما با ${currentBiz?.name || 'سالن زیبایی ما'} سپاسگزاریم. با کد تخفیف ۱۵٪ منتظر دیدار مجدد شما در تایم تو هستیم.`,
    },
    {
      label: 'تخفیف ویژه آخر هفته',
      text: `پیشنهاد ویژه ${currentBiz?.name || 'سالن ما'}: تا ۲۰٪ تخفیف رزرو آنلاین خدمات زیبایی برای این هفته فعال شد.`,
    },
    {
      label: 'تبریک و هدیه وفاداری',
      text: `مشتری وفادار عزیز، هدیه اعتبار ویژه باشگاه مشتریان در پرونده شما در ${currentBiz?.name || 'سالن'} شارژ شد.`,
    },
    {
      label: 'اطلاع‌رسانی ظرفیت خالی',
      text: `ظرفیت نوبت‌های جدید ${currentBiz?.name || 'سالن زیبایی'} در پلتفرم Timeto باز شد. جهت رزرو سریع به پروفایل ما مراجعه فرمایید.`,
    },
  ];

  const handleToggleCustomerRecipient = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCustomers = () => {
    if (selectedCustomerIds.length === customers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customers.map((c) => c.id));
    }
  };

  const handleAddCustomPhone = () => {
    const clean = normalizeIranMobileInput(customPhoneInput);
    if (!isValidIranMobile(clean)) {
      showToast('شماره موبایل باید ۱۱ رقم معتبر با پیش‌شماره 09 باشد.');
      return;
    }
    if (!customRecipients.some((r) => r.phone === clean)) {
      setCustomRecipients((prev) => [
        ...prev,
        { name: `مشتری (${clean})`, phone: clean },
      ]);
    }
    setCustomPhoneInput('');
  };

  const handleSendCustomerSmsBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenCustomers = customers
      .filter((c) => selectedCustomerIds.includes(c.id))
      .map((c) => ({
        name: c.fullName,
        phone: c.phone || c.phoneMasked,
      }));
    const allRecipients = [...chosenCustomers, ...customRecipients];
    if (allRecipients.length === 0) {
      showToast('لطفاً حداقل یک مشتری را از لیست انتخاب کنید یا شماره موبایل وارد نمایید.');
      return;
    }
    if (allRecipients.length > remainingSms) {
      showToast(
        `ظرفیت پیامک باقی‌مانده سالن شما (${toPersianDigits(
          remainingSms
        )} عدد) کمتر از تعداد گیرندگان انتخابی (${toPersianDigits(
          allRecipients.length
        )} نفر) است. لطفاً ابتدا بسته پیامک اضافه تهیه کنید.`
      );
      return;
    }
    setIsSendingSms(true);
    try {
      const ok = await sendBusinessCustomerSms({
        businessId: currentBiz?.id,
        recipientPhones: allRecipients.map((r) => r.phone),
        messageText: smsMessageText,
        templateTitle: smsTemplateTitle,
      });
      if (ok) {
        setCustomRecipients([]);
      }
    } finally {
      setIsSendingSms(false);
    }
  };

  const searchBoostPkg = adPackages.find((p) => p.slot === 'SEARCH_TOP') ?? {
    id: 'ad-search-pin',
    title: 'صدرنشینی در نتایج جست‌وجوی شهر',
    slot: 'SEARCH_TOP' as const,
    durationDays: 30,
    priceToman: 490000,
    weeklyPriceToman: 190000,
    badge: 'پربازده‌ترین جایگاه',
    description:
      'پین شدن کارت سالن شما در ردیف اول نتایج جست‌وجو (/search) با نشان طلایی و آبی «★ آگهی ویژه» و متن تبلیغاتی دلخواه شما.',
  };

  const homeBannerPkg = adPackages.find((p) => p.slot === 'HOME_BANNER') ?? {
    id: 'ad-home-banner',
    title: 'بنر ویژه در صفحه اول تایم تو',
    slot: 'HOME_BANNER' as const,
    durationDays: 30,
    priceToman: 890000,
    weeklyPriceToman: 350000,
    badge: 'ظرفیت محدود (۲ اسلات در شهر)',
    description:
      'نمایش بنر تصویری اختصاصی سالن شما در بخش «پیشنهادهای ویژه رزرو آنلاین» در صفحه اول سایت با دکمه رزرو مستقیم.',
  };

  const smsAddonPkg = adPackages.find((p) => p.slot === 'SMS_ADDON') ?? {
    id: 'ad-sms-200',
    title: 'بسته ۲۰۰ پیامک خدماتی و یادآور اضافه',
    slot: 'SMS_ADDON' as const,
    durationDays: 365,
    priceToman: 180000,
    weeklyPriceToman: 180000,
    badge: 'شارژ فوری بدون انقضا',
    description:
      'اگر سهمیه پیامک ماهانه پلن شما تمام شده یا در پلن رایگان هستید، بدون تغییر پلن می‌توانید بسته ۲۰۰ تایی پیامک یادآور بخرید.',
    smsCount: 200,
  };

  const bizOrders = paymentOrders.filter(
    (o) =>
      o.businessId === currentBiz?.id &&
      (o.itemType === 'AD_PACKAGE' || o.itemType === 'SMS_PACK')
  );

  const handleUpdateActiveLabel = () => {
    if (!currentBiz) return;
    updateBusinessProfile(currentBiz.id, {
      sponsoredLabel:
        sponsoredLabelInput.trim() || 'پیشنهاد ویژه رزرو آنلاین',
      sponsoredCategorySlug:
        sponsoredTargetCategory === 'ALL'
          ? undefined
          : sponsoredTargetCategory,
      sponsoredNeighborhood:
        sponsoredTargetNeighborhood === 'ALL'
          ? undefined
          : sponsoredTargetNeighborhood,
    });
    showToast(
      'برچسب تبلیغاتی و هدف‌گذاری جایگاه ویژه سالن شما بروزرسانی شد.'
    );
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCampaign({
      title: title.trim(),
      targetSegment: segment,
      discountPercent: Number(discount) || 10,
      channel: 'کمپین پیامکی مشتریان',
      statusLabel: 'فعال',
      createdAtJalali: '۱۴۰۵/۰۸/۰۳',
    });
    setTitle('');
  };

  const placementNameMap: Record<string, string> = {
    SEARCH_TOP: 'صدر نتایج جست‌وجو (/search)',
    HOME_BANNER: 'بنر ویژه صفحه اول + صدر جست‌وجو',
    HERO_SPOTLIGHT: 'ویترین طلایی بالای صفحه اصلی',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="جذب مشتری جدید · جایگاه‌های تبلیغاتی و کمپین‌ها"
        title="تبلیغات ویژه، صدرنشینی در جست‌وجو و کمپین‌ها"
        subtitle="جدا از پلن اشتراک ماهانه، می‌توانید با رزرو جایگاه تبلیغاتی در صدر نتایج جست‌وجو یا بنر صفحه اول (با پرداخت آسان بله‌پی یا کارت‌به‌کارت)، بازدید و رزرو سالن خود را تا ۳ برابر افزایش دهید"
        routePattern="/app/marketing"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تبلیغات و ارتقای جایگاه' },
        ]}
      />

      {/* نوار وضعیت جایگاه تبلیغاتی فعلی سالن + آمار بازدهی و چرخش منصفانه */}
      {isSponsoredActive && currentBiz ? (
        <Card className="border-2 border-[#10B981] bg-[#ECFDF5]/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label="★ جایگاه تبلیغاتی فعال" tone="success" />
                <span className="text-xs font-extrabold text-[#065F46] tabular-nums">
                  رتبه نمایش: جایگاه شماره{' '}
                  {toPersianDigits(currentBiz.sponsoredOrder ?? 1)} ·{' '}
                  {toPersianDigits(currentBiz.sponsoredDaysRemaining ?? 30)} روز
                  باقی‌مانده
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#10B981]/40 text-[11px] font-extrabold text-[#047857] tabular-nums">
                  نمایش در صدر:{' '}
                  {toPersianDigits(currentBiz.sponsoredImpressions ?? 165)} بار ·
                  کلیک پروفایل:{' '}
                  {toPersianDigits(currentBiz.sponsoredClicks ?? 24)} کلیک
                </span>
              </div>
              <p className="text-xs text-[#064E3B]">
                محل نمایش فعلی:{' '}
                <strong>
                  {placementNameMap[
                    currentBiz.sponsoredPlacement || 'SEARCH_TOP'
                  ] || 'صدر نتایج جست‌وجو'}
                </strong>{' '}
                · برچسب فعلی: «{currentBiz.sponsoredLabel || 'پیشنهاد ویژه'}» ·
                الگوریتم چرخش منصفانه (Fair Rotation) فعال است تا بین تمامی سالن‌های ویژه، نمایش ردیف اول به صورت عادلانه توزیع شود.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/search">
                <Button variant="outline" size="sm">
                  <span>مشاهده در صفحه جست‌وجو ←</span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      {/* بنر قفل امکانات باشگاه پیامکی و کمپین تخفیف در پلن رایگان */}
      {isFreeSubscriptionPlan(activePlanId, currentBiz?.subscriptionPlan) &&
      extraSms <= 0 ? (
        <PlanUpgradeLockBanner
          featureTitle="ارسال پیامک گروهی باشگاه مشتریان و کمپین‌های تخفیف خودکار"
          description="در پلن شروع رایگان سهمیه پیامک ماهانه ۰ است. برای فعال‌سازی سهمیه پیامک ماهانه و باشگاه مشتریان، پلن حرفه‌ای تهیه کنید یا بسته پیامک اضافه بخرید."
        />
      ) : null}

      {/* پنل اختصاصی ارسال پیامک به مشتریان سالن + گزارش دقیق مصرف و سهمیه باقی‌مانده */}
      <Card
        className={`border-2 border-[#0057FF]/30 bg-white space-y-5 ${
          isFreeSubscriptionPlan(activePlanId, currentBiz?.subscriptionPlan) &&
          extraSms <= 0
            ? 'opacity-75'
            : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0057FF] text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#061138]">
                پنل ارسال پیامک به مشتریان سالن و گزارش سهمیه پیامک
              </h2>
              <p className="text-xs text-[#64748B]">
                مشتریان خود را به راحتی تیک بزنید، متن آماده انتخاب کنید و در لحظه پیامک بفرستید
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void sendAppointmentReminders(currentBiz?.id)}
            >
              <Send className="w-3.5 h-3.5 text-[#0057FF]" />
              <span>ارسال پیامک یادآور نوبت‌های فردا/امروز</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                setCheckoutItem({
                  itemType: 'SMS_PACK',
                  itemId: smsAddonPkg.id,
                  itemTitle: smsAddonPkg.title,
                  baseAmountToman: smsAddonPkg.priceToman,
                  smsCount: smsAddonPkg.smsCount ?? 200,
                })
              }
            >
              <Plus className="w-4 h-4" />
              <span>شارژ و خرید بسته پیامک اضافه ({toPersianDigits(smsAddonPkg.smsCount ?? 200)} تایی)</span>
            </Button>
          </div>
        </div>

        {/* کارت‌های شمارنده وضعیت پیامک سالن */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] space-y-1">
            <span className="text-[11px] font-bold text-[#64748B] block">
              سهمیه ماهانه پلن ({activePlanObj?.name})
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[#061138] tabular-nums">
              {toPersianDigits(planSmsQuota)} پیامک
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-1">
            <span className="text-[11px] font-bold text-[#047857] block">
              شارژ پیامک اضافه (خریداری‌شده)
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[#059669] tabular-nums">
              +{toPersianDigits(extraSms)} پیامک
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1">
            <span className="text-[11px] font-bold text-[#B45309] block">
              پیامک‌های ارسال‌شده تا کنون
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-[#D97706] tabular-nums">
              {toPersianDigits(smsSentSoFar)} پیامک
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#061138] text-white space-y-1">
            <span className="text-[11px] font-bold text-[#00E5FF] block">
              ظرفیت باقی‌مانده قابل ارسال
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-white tabular-nums">
              {toPersianDigits(remainingSms)} پیامک
            </p>
          </div>
        </div>

        <form onSubmit={handleSendCustomerSmsBatch} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ستون انتخاب آسان گیرندگان از لیست مشتریان */}
          <div className="lg:col-span-5 space-y-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#061138]">
                ۱. انتخاب مشتریان گیرنده ({toPersianDigits(selectedCustomerIds.length + customRecipients.length)} نفر)
              </span>
              <button
                type="button"
                onClick={handleSelectAllCustomers}
                className="text-[11px] font-extrabold text-[#0057FF] hover:underline cursor-pointer"
              >
                {selectedCustomerIds.length === customers.length
                  ? 'لغو انتخاب همه'
                  : 'انتخاب همه مشتریان'}
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {customers.map((c) => {
                const checked = selectedCustomerIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#E0ECFF] border-[#0057FF] text-[#061138]'
                        : 'bg-white border-[#E2E8F0] text-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleCustomerRecipient(c.id)}
                        className="accent-[#0057FF] w-4 h-4 shrink-0"
                      />
                      <span className="font-bold truncate">{c.fullName}</span>
                    </div>
                    <span dir="ltr" className="font-mono text-[11px] text-[#0057FF] font-bold shrink-0">
                      {c.phone || c.phoneMasked}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* افزودن شماره موبایل دلخواه */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
              <label htmlFor="sms-custom-phone" className="block text-[11px] font-bold text-[#475569]">
                افزودن شماره موبایل جدید خارج از لیست:
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  id="sms-custom-phone"
                  dir="ltr"
                  maxLength={11}
                  placeholder="09131234567"
                  value={customPhoneInput}
                  onChange={(e) =>
                    setCustomPhoneInput(normalizeIranMobileInput(e.target.value))
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomPhone}
                >
                  افزودن
                </Button>
              </div>
              {customRecipients.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customRecipients.map((r) => (
                    <span
                      key={r.phone}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[11px] font-bold"
                    >
                      <span dir="ltr">{r.phone}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomRecipients((prev) =>
                            prev.filter((item) => item.phone !== r.phone)
                          )
                        }
                        className="text-[#EF4444] hover:text-[#991B1B] cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* ستون انتخاب قالب آماده و متن پیامک */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold text-[#061138] block">
                ۲. انتخاب الگوی آماده پیامک (یا نوشتن متن دلخواه):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {smsPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSmsTemplateTitle(preset.label);
                      setSmsMessageText(preset.text);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors border ${
                      smsTemplateTitle === preset.label
                        ? 'bg-[#0057FF] text-white border-[#0057FF]'
                        : 'bg-[#F3F6FC] text-[#334155] border-[#CBD5E1] hover:border-[#0057FF]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <FormField id="sms-msg-body" label="متن پیامک ارسالی به مشتریان" required>
              <Textarea
                id="sms-msg-body"
                rows={3}
                value={smsMessageText}
                onChange={(e) => setSmsMessageText(e.target.value)}
              />
            </FormField>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#64748B] tabular-nums">
                تعداد کل گیرندگان انتخابی:{' '}
                <strong className="text-[#061138]">
                  {toPersianDigits(selectedCustomerIds.length + customRecipients.length)} نفر
                </strong>{' '}
                (کسر از سهمیه: {toPersianDigits(selectedCustomerIds.length + customRecipients.length)} پیامک)
              </span>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSendingSms}
                disabled={remainingSms <= 0}
              >
                <Send className="w-4 h-4" />
                <span>ارسال فوری پیامک به مشتریان</span>
              </Button>
            </div>
          </div>
        </form>

        {/* جدول گزارش آخرین پیامک‌های ارسال‌شده */}
        {smsLogs.filter((l) => !currentBiz || l.businessId === currentBiz.id).length > 0 ? (
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <h3 className="text-xs font-extrabold text-[#061138]">
              تاریخچه پیامک‌های ارسال‌شده به مشتریان سالن شما:
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {smsLogs
                .filter((l) => !currentBiz || l.businessId === currentBiz.id)
                .slice(0, 6)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 max-w-xl">
                      <span className="font-extrabold text-[#0057FF]">
                        {log.templateTitle} ({toPersianDigits(log.recipientsCount)} گیرنده)
                      </span>
                      <p className="text-[#334155] line-clamp-1">{log.messageText}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[#64748B] tabular-nums">
                        {log.createdAtJalali}
                      </span>
                      <StatusBadge label="ارسال شد" tone="success" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* بخش ۱: بسته‌های تبلیغاتی و ارتقای جایگاه (Sponsored Boost & Add-on SMS) */}
      <div className="rounded-3xl bg-[#061138] text-white p-5 sm:p-6 space-y-5 border border-[#1E293B] shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00E5FF]">
              <Megaphone className="w-4 h-4" />
              <span>
                جایگاه‌های تبلیغاتی پربازده تایم تو (پرداخت آسان با بله‌پی و
                کارت‌به‌کارت)
              </span>
            </span>
            <h2 className="text-base sm:text-xl font-extrabold text-white">
              بنر و کارت سالن خود را بالاتر از سایر رقبا به مشتریان اصفهان نشان دهید
            </h2>
          </div>
          <Link to="/search">
            <Button variant="secondary" size="sm">
              <span>مشاهده جایگاه فعلی در صفحه جست‌وجو ←</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* کارت ۱: صدرنشینی در نتایج جست‌وجو (Search Pin Boost) */}
          <div className="rounded-2xl bg-white text-[#061138] p-5 flex flex-col justify-between space-y-4 border-2 border-[#00E5FF]">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[11px] font-extrabold">
                  ★ {searchBoostPkg.badge}
                </span>
                {isSponsoredActive ? (
                  <StatusBadge label="فعال روی سالن شما" tone="success" />
                ) : null}
              </div>
              <h3 className="text-base font-extrabold text-[#061138]">
                ۱. {searchBoostPkg.title}
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed">
                {searchBoostPkg.description}
              </p>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-baseline justify-between">
                <span className="text-xs text-[#64748B]">تعرفه جایگاه:</span>
                <div className="text-left">
                  <span className="text-lg font-extrabold text-[#0057FF] tabular-nums">
                    {formatPriceToman(searchBoostPkg.priceToman)}
                  </span>
                  <span className="text-[11px] text-[#64748B] block tabular-nums">
                    ماهانه (یا{' '}
                    {formatPriceToman(searchBoostPkg.weeklyPriceToman ?? 190000)}{' '}
                    هفتگی)
                  </span>
                </div>
              </div>

              <div className="pt-1 space-y-2">
                <div>
                  <label
                    htmlFor="boost-badge-label"
                    className="block text-[11px] font-bold text-[#334155] mb-1"
                  >
                    متن برچسب ویژه روی کارت سالن شما:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id="boost-badge-label"
                      value={sponsoredLabelInput}
                      onChange={(e) => setSponsoredLabelInput(e.target.value)}
                      placeholder="مثلاً پیشنهاد ویژه · ۲۰٪ تخفیف"
                    />
                    {isSponsoredActive ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUpdateActiveLabel}
                      >
                        ثبت
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label
                      htmlFor="boost-target-cat"
                      className="block text-[10px] font-bold text-[#475569] mb-0.5"
                    >
                      اولویت دسته‌بندی:
                    </label>
                    <select
                      id="boost-target-cat"
                      value={sponsoredTargetCategory}
                      onChange={(e) =>
                        setSponsoredTargetCategory(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-1.5 text-[11px] font-bold text-[#061138]"
                    >
                      <option value="ALL">همه دسته‌بندی‌ها</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>
                          {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="boost-target-nb"
                      className="block text-[10px] font-bold text-[#475569] mb-0.5"
                    >
                      اولویت محله:
                    </label>
                    <select
                      id="boost-target-nb"
                      value={sponsoredTargetNeighborhood}
                      onChange={(e) =>
                        setSponsoredTargetNeighborhood(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-1.5 text-[11px] font-bold text-[#061138]"
                    >
                      <option value="ALL">کل شهر</option>
                      {ISFAHAN_NEIGHBORHOODS.map((nb) => (
                        <option key={nb} value={nb}>
                          {nb}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              onClick={() =>
                setCheckoutItem({
                  itemType: 'AD_PACKAGE',
                  itemId: searchBoostPkg.id,
                  itemTitle: searchBoostPkg.title,
                  baseAmountToman: searchBoostPkg.priceToman,
                  weeklyAmountToman: searchBoostPkg.weeklyPriceToman ?? 190000,
                  defaultPlacement: 'SEARCH_TOP',
                  defaultDurationDays: 30,
                  defaultLabel: sponsoredLabelInput,
                })
              }
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isSponsoredActive
                  ? 'تمدید / ارتقای جایگاه صدر جست‌وجو'
                  : 'رزرو و پرداخت جایگاه صدر جست‌وجو'}
              </span>
            </Button>
          </div>

          {/* کارت ۲: بنر بزرگ در صفحه اول (Home Featured Banner) */}
          <div className="rounded-2xl bg-white/10 border border-white/20 p-5 flex flex-col justify-between space-y-4 text-white">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] text-[11px] font-extrabold">
                  ویترین صفحه اول
                </span>
                <span className="text-[11px] text-slate-300 font-bold">
                  {homeBannerPkg.badge}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                ۲. {homeBannerPkg.title}
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {homeBannerPkg.description}
              </p>
              <div className="pt-2 border-t border-white/15 flex items-baseline justify-between">
                <span className="text-xs text-slate-300">تعرفه جایگاه:</span>
                <div className="text-left">
                  <span className="text-lg font-extrabold text-[#00E5FF] tabular-nums">
                    {formatPriceToman(homeBannerPkg.priceToman)}
                  </span>
                  <span className="text-[11px] text-slate-300 block tabular-nums">
                    ماهانه (یا{' '}
                    {formatPriceToman(homeBannerPkg.weeklyPriceToman ?? 350000)}{' '}
                    هفتگی)
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="accent"
              size="sm"
              fullWidth
              onClick={() =>
                setCheckoutItem({
                  itemType: 'AD_PACKAGE',
                  itemId: homeBannerPkg.id,
                  itemTitle: homeBannerPkg.title,
                  baseAmountToman: homeBannerPkg.priceToman,
                  weeklyAmountToman: homeBannerPkg.weeklyPriceToman ?? 350000,
                  defaultPlacement: 'HOME_BANNER',
                  defaultDurationDays: 30,
                  defaultLabel:
                    sponsoredLabelInput.trim() || 'بنر ویژه صفحه اول',
                })
              }
            >
              <CreditCard className="w-4 h-4" />
              <span>رزرو و پرداخت بنر صفحه اول</span>
            </Button>
          </div>

          {/* کارت ۳: بسته افزونه پیامک خدماتی (Add-on SMS Pack) */}
          <div className="rounded-2xl bg-white/10 border border-white/20 p-5 flex flex-col justify-between space-y-4 text-white">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-extrabold">
                  بسته افزونه پیامک
                </span>
                <span className="text-[11px] text-emerald-300 font-extrabold tabular-nums">
                  شارژ اضافه فعلی: {toPersianDigits(extraSms)} پیامک
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                ۳. {smsAddonPkg.title}
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {smsAddonPkg.description}
              </p>
              <div className="pt-2 border-t border-white/15 flex items-baseline justify-between">
                <span className="text-xs text-slate-300">
                  تعرفه بسته {toPersianDigits(smsAddonPkg.smsCount ?? 200)} تایی:
                </span>
                <span className="text-lg font-extrabold text-emerald-300 tabular-nums">
                  {formatPriceToman(smsAddonPkg.priceToman)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() =>
                setCheckoutItem({
                  itemType: 'SMS_PACK',
                  itemId: smsAddonPkg.id,
                  itemTitle: smsAddonPkg.title,
                  baseAmountToman: smsAddonPkg.priceToman,
                  smsCount: smsAddonPkg.smsCount ?? 200,
                })
              }
            >
              <CreditCard className="w-4 h-4" />
              <span>
                خرید بسته {toPersianDigits(smsAddonPkg.smsCount ?? 200)} پیامک
                (بله‌پی / کارت‌به‌کارت)
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* پیگیری سفارش‌های تبلیغات و پیامک ثبت‌شده توسط این سالن */}
      {bizOrders.length > 0 ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#061138]">
              سفارش‌های تبلیغات و بسته‌های پیامک شما
            </h3>
            <span className="text-xs text-[#64748B] tabular-nums">
              {toPersianDigits(bizOrders.length)} سفارش ثبت‌شده
            </span>
          </div>
          <ResponsiveTable
            keyExtractor={(o) => o.id}
            data={bizOrders}
            columns={[
              {
                key: 'id',
                header: 'کد سفارش',
                render: (o) => (
                  <span className="font-mono text-xs font-bold text-[#0057FF]">
                    {o.id}
                  </span>
                ),
              },
              {
                key: 'title',
                header: 'بسته / جایگاه انتخابی',
                render: (o) => (
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[#061138] block">
                      {o.itemTitle}
                    </span>
                    {o.requestedDurationDays ? (
                      <span className="text-[11px] text-[#64748B] tabular-nums">
                        مدت: {toPersianDigits(o.requestedDurationDays)} روز
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'method',
                header: 'روش پرداخت / کد رهگیری',
                render: (o) => (
                  <div className="text-xs">
                    <span className="font-bold text-[#061138]">
                      درگاه آنلاین زیبال (Zibal)
                    </span>
                    <span className="block text-[11px] text-[#64748B] font-mono">
                      Ref: {o.trackingCode}
                    </span>
                  </div>
                ),
              },
              {
                key: 'amount',
                header: 'مبلغ',
                render: (o) => (
                  <span className="font-extrabold text-[#0057FF] tabular-nums">
                    {formatPriceToman(o.amountToman)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'وضعیت تایید مدیریت',
                render: (o) => (
                  <StatusBadge
                    label={
                      o.status === 'APPROVED'
                        ? 'تایید و فعال شد'
                        : o.status === 'REJECTED'
                          ? 'رد شده'
                          : 'در انتظار تایید مدیر'
                    }
                    tone={
                      o.status === 'APPROVED'
                        ? 'success'
                        : o.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                    }
                  />
                ),
              },
            ]}
          />
        </Card>
      ) : null}

      <EasyCheckoutModal
        isOpen={Boolean(checkoutItem)}
        onClose={() => setCheckoutItem(null)}
        item={checkoutItem}
        businessId={currentBiz?.id || 'biz-1'}
        businessName={currentBiz?.name || 'سالن زیبایی شما'}
      />

      {/* بخش ۲: تعریف کمپین‌های تخفیف باشگاه مشتریان */}
      <Card>
        <div className="mb-4 space-y-1">
          <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
            ساخت کمپین تخفیف برای مشتریان سالن
          </h2>
          <p className="text-xs text-[#64748B]">
            کد تخفیف یا پیشنهاد مناسبتی برای بازگشت مشتریان قبلی تعریف کنید
          </p>
        </div>
        <form
          onSubmit={handleCreateCampaign}
          className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <FormField id="cmp-title" label="عنوان کمپین تبلیغاتی" required>
              <Input
                id="cmp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً تخفیف ویژه خدمات ناخن وسط هفته..."
              />
            </FormField>
          </div>
          <FormField id="cmp-segment" label="جامعه هدف">
            <Select
              id="cmp-segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              options={[
                { value: 'مشتریان وفادار', label: 'مشتریان وفادار' },
                { value: 'مشتریان غیرفعال', label: 'مشتریان غیرفعال (۲ ماه)' },
                { value: 'همه مشتریان', label: 'همه مشتریان پرونده‌دار' },
              ]}
            />
          </FormField>
          <FormField id="cmp-disc" label="درصد تخفیف">
            <Input
              id="cmp-disc"
              dir="ltr"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="primary">
            <Plus className="w-4 h-4" />
            <span>ایجاد کمپین</span>
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((cmp) => (
          <Card key={cmp.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#0057FF]" />
                <h2 className="text-sm font-extrabold text-[#061138]">
                  {cmp.title}
                </h2>
              </div>
              <StatusBadge label={cmp.statusLabel} tone="success" />
            </div>
            <p className="text-xs text-[#334155]">
              مخاطب هدف: <strong>{cmp.targetSegment}</strong> · کانال:{' '}
              {cmp.channel}
            </p>
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B] tabular-nums">
              <span className="font-extrabold text-[#0057FF]">
                تخفیف: {toPersianDigits(cmp.discountPercent)}٪
              </span>
              <span>تاریخ ثبت: {cmp.createdAtJalali}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/** ۱۱. گزارش‌ها، حسابداری دوحالته دخل روزانه و آمار عملکرد (/app/analytics) */
export const BusinessAnalyticsPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    appointments,
    customers,
    reviews,
    replyToReview,
    reportReviewAbuse,
    activePlanId,
    dailyIncomeLogs,
    addDailyIncomeLog,
    deleteDailyIncomeLog,
    settleAppointmentInPerson,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const isFreePlan = isFreeSubscriptionPlan(
    activePlanId,
    currentBiz?.subscriptionPlan
  );

  // استیت ثبت سریع دخل روزانه یک‌جا (کارت‌خوان / نقد / کارت‌به‌کارت)
  const [bulkIncomeAmount, setBulkIncomeAmount] = React.useState('');
  const [bulkIncomeMethod, setBulkIncomeMethod] = React.useState<
    'POS_CARD' | 'CASH' | 'CARD_TO_CARD'
  >('POS_CARD');
  const [bulkIncomeNote, setBulkIncomeNote] = React.useState('');

  const [replyingReviewId, setReplyingReviewId] = React.useState<string | null>(
    null
  );
  const [replyDraftText, setReplyDraftText] = React.useState('');
  const [reviewActionNotice, setReviewActionNotice] = React.useState<
    string | null
  >(null);

  const bizReviews = currentBiz
    ? reviews.filter((r) => r.businessId === currentBiz.id)
    : [];

  const bizAppointments = currentBiz
    ? appointments.filter(
        (a) =>
          a.businessId === currentBiz.id ||
          a.businessSlug === currentBiz.slug ||
          a.businessName === currentBiz.name
      )
    : [];
  const bizCustomers = currentBiz
    ? customers.filter((c) => !c.businessId || c.businessId === currentBiz.id)
    : [];
  const bizIncomeLogs = currentBiz
    ? dailyIncomeLogs.filter((l) => l.businessId === currentBiz.id)
    : [];

  const activeOrDoneAppointments = bizAppointments.filter(
    (a) => a.status !== AppointmentStatus.Cancelled
  );
  const appointmentsRevenueToman = activeOrDoneAppointments.reduce(
    (sum, a) => sum + (a.priceToman || 0),
    0
  );
  const bulkLogsRevenueToman = bizIncomeLogs
    .filter((l) => l.entryType === 'DAILY_BULK')
    .reduce((sum, l) => sum + (l.amountToman || 0), 0);
  const inPersonTotalToman = bizIncomeLogs.reduce(
    (sum, l) => sum + (l.amountToman || 0),
    0
  );
  const totalRevenueToman = appointmentsRevenueToman + bulkLogsRevenueToman;

  const handleAddDailyBulkIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBiz) return;
    const numericAmount = parseNumericInput(bulkIncomeAmount);
    if (!numericAmount || numericAmount <= 0) return;
    addDailyIncomeLog({
      businessId: currentBiz.id,
      dateJalali: getUpcomingJalaliDays(1)[0]?.dateJalali || 'امروز',
      amountToman: numericAmount,
      paymentMethod: bulkIncomeMethod,
      entryType: 'DAILY_BULK',
      note:
        bulkIncomeNote.trim() ||
        'ثبت یک‌جای دخل روزانه حضوری (کارت‌خوان و نقدی)',
    });
    setBulkIncomeAmount('');
    setBulkIncomeNote('');
  };

  const repeatCustomersCount = bizCustomers.filter(
    (c) => (c.totalVisits ?? 0) >= 2
  ).length;
  const repeatRatePct =
    bizCustomers.length > 0
      ? Math.round((repeatCustomersCount / bizCustomers.length) * 100)
      : 0;

  const serviceRevenueMap = new Map<string, number>();
  for (const apt of activeOrDoneAppointments) {
    const prev = serviceRevenueMap.get(apt.serviceTitle) ?? 0;
    serviceRevenueMap.set(apt.serviceTitle, prev + (apt.priceToman || 0));
  }
  if (bulkLogsRevenueToman > 0) {
    serviceRevenueMap.set(
      'دخل روزانه حضوری (ثبت یک‌جا)',
      (serviceRevenueMap.get('دخل روزانه حضوری (ثبت یک‌جا)') ?? 0) +
        bulkLogsRevenueToman
    );
  }
  const popularBreakdown = Array.from(serviceRevenueMap.entries()).map(
    ([name, amount]) => ({
      name,
      amount,
      pct:
        totalRevenueToman > 0
          ? Math.max(5, Math.round((amount / totalRevenueToman) * 100))
          : 0,
    })
  );

  const monthlyTrend = [
    { month: 'خرداد', value: 0, label: '۰' },
    { month: 'تیر', value: 0, label: '۰' },
    { month: 'مرداد', value: 0, label: '۰' },
    { month: 'شهریور', value: 0, label: '۰' },
    { month: 'مهر', value: 0, label: '۰' },
    {
      month: 'آبان',
      value: Math.round(totalRevenueToman / 1000000),
      label:
        totalRevenueToman > 0
          ? `${toPersianDigits(Math.round(totalRevenueToman / 100000) / 10)} م`
          : '۰',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مالی · حسابداری دوحالته دخل روزانه و بیعانه"
        title="حسابداری دخل روزانه، دریافتی‌های حضوری و آمار عملکرد"
        subtitle="علاوه بر بیعانه‌های آنلاین، دریافتی‌های حضوری (کارت‌خوان، نقد یا کارت‌به‌کارت) را به‌صورت «۱-کلیکی روی هر نوبت» یا «یک‌جا در پایان روز» ثبت کنید تا سود و کارکرد واقعی سالن محاسبه شود"
        routePattern="/app/analytics"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'حسابداری و گزارش‌ها' },
        ]}
      />

      {isFreePlan ? (
        <PlanUpgradeLockBanner
          featureTitle="حسابداری دخل روزانه حضوری، گزارش‌های تحلیلی پیشرفته و تفکیک سهم متخصصان"
          description="در پلن شروع رایگان خلاصه پایه نمایش داده می‌شود. برای باز شدن «ثبت دخل روزانه حضوری»، «تسویه ۱-کلیکی نوبت‌ها» و نمودارهای کامل مالی، پلن سالن خود را به حرفه‌ای یا VIP ارتقا دهید."
        />
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">
            کل درآمد ماه (بیعانه آنلاین + دریافتی حضوری)
          </p>
          <p className="text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {totalRevenueToman > 0 ? formatPriceToman(totalRevenueToman) : '۰ تومان'}
          </p>
          <p className="text-xs text-[#64748B] font-semibold tabular-nums">
            {toPersianDigits(activeOrDoneAppointments.length)} نوبت +{' '}
            {toPersianDigits(bizIncomeLogs.length)} ثبت دریافتی حضوری
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">
            مجموع دریافتی‌های حضوری ثبت‌شده (کارت‌خوان / نقد)
          </p>
          <p className="text-2xl font-extrabold text-[#059669] tabular-nums">
            {inPersonTotalToman > 0
              ? formatPriceToman(inPersonTotalToman)
              : '۰ تومان'}
          </p>
          <p className="text-xs text-[#6B6480] tabular-nums">
            موجودی کیف پول بیعانه آنلاین:{' '}
            {formatPriceToman(currentBiz?.walletBalanceToman ?? 0)}
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">
            نرخ بازگشت مشتریان و رضایت
          </p>
          <p className="text-2xl font-extrabold text-[#F59E0B] tabular-nums">
            {toPersianDigits(repeatRatePct)}٪ بازگشت مجدد
          </p>
          <p className="text-xs text-[#6B6480] tabular-nums">
            از مجموع {toPersianDigits(bizCustomers.length)} مشتری پرونده‌دار
          </p>
        </Card>
      </div>

      {/* بخش حسابداری دوحالته دریافتی‌های حضوری (حالت ۱: دخل روزانه یک‌جا | حالت ۲: تسویه ۱-کلیکی نوبت‌ها) */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${
          isFreePlan ? 'opacity-65 pointer-events-none select-none' : ''
        }`}
      >
        {/* حالت ۱: ثبت سریع کل دخل روزانه یک‌جا آخر شب */}
        <Card className="lg:col-span-6 border-2 border-[#0057FF]/25 space-y-4">
          <div className="space-y-1 border-b border-[#E2E8F0] pb-3">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[10px] font-black">
              روش اول · سریع‌ترین حالت برای آخر شب
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
              ثبت یک‌جای کل دخل روزانه حضوری (کارت‌خوان / نقد)
            </h2>
            <p className="text-xs text-[#64748B]">
              اگر فرصت ثبت تک‌به‌تک نوبت‌ها را ندارید، در پایان روز جمع کل دریافتی کارت‌خوان یا نقدی امروز را یک‌جا وارد کنید:
            </p>
          </div>

          <form onSubmit={handleAddDailyBulkIncome} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                id="daily-bulk-amount"
                label="مبلغ کل دریافتی حضوری امروز (تومان)"
                required
              >
                <Input
                  id="daily-bulk-amount"
                  dir="ltr"
                  type="text"
                  inputMode="numeric"
                  value={bulkIncomeAmount}
                  onChange={(e) =>
                    setBulkIncomeAmount(
                      formatNumericInputWithCommas(e.target.value)
                    )
                  }
                  placeholder="3,500,000"
                />
              </FormField>

              <FormField id="daily-bulk-method" label="روش دریافت وجه">
                <Select
                  id="daily-bulk-method"
                  value={bulkIncomeMethod}
                  onChange={(e) =>
                    setBulkIncomeMethod(
                      e.target.value as 'POS_CARD' | 'CASH' | 'CARD_TO_CARD'
                    )
                  }
                  options={[
                    { value: 'POS_CARD', label: 'دستگاه کارت‌خوان سالن (POS)' },
                    { value: 'CARD_TO_CARD', label: 'کارت‌به‌کارت حضوری' },
                    { value: 'CASH', label: 'دریافت نقدی' },
                  ]}
                />
              </FormField>
            </div>

            <FormField
              id="daily-bulk-note"
              label="توضیح کوتاه (اختیاری)"
            >
              <Input
                id="daily-bulk-note"
                value={bulkIncomeNote}
                onChange={(e) => setBulkIncomeNote(e.target.value)}
                placeholder="مثلاً: جمع کارت‌خوان شیفت صبح و عصر پنجشنبه..."
              />
            </FormField>

            <Button type="submit" variant="primary" size="sm" fullWidth>
              <Plus className="w-4 h-4" />
              <span>+ ثبت در دخل روزانه و نمودار مالی</span>
            </Button>
          </form>

          {bizIncomeLogs.length > 0 ? (
            <div className="pt-3 border-t border-[#E2E8F0] space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-extrabold text-[#061138]">
                آخرین دریافتی‌های حضوری ثبت‌شده ({toPersianDigits(bizIncomeLogs.length)} مورد):
              </p>
              {bizIncomeLogs.slice(0, 6).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-extrabold text-[#061138] tabular-nums">
                      {formatPriceToman(log.amountToman)} ·{' '}
                      <span className="text-[11px] text-[#059669]">
                        {log.entryType === 'SINGLE_APPOINTMENT'
                          ? `تسویه نوبت (${log.customerName || ''})`
                          : 'ثبت یک‌جای دخل روزانه'}
                      </span>
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate">
                      {log.dateJalali} — {log.note}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDailyIncomeLog(log.id)}
                    className="text-rose-600 hover:underline text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        {/* حالت ۲: تسویه ۱-کلیکی الباقی نوبت‌های حضوری */}
        <Card className="lg:col-span-6 border-2 border-[#059669]/25 space-y-4">
          <div className="space-y-1 border-b border-[#E2E8F0] pb-3">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-black">
              روش دوم · ثبت تکی ۱-کلیکی روی نوبت‌ها
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
              تسویه ۱-کلیکی الباقی نوبت‌ها در محل سالن
            </h2>
            <p className="text-xs text-[#64748B]">
              وقتی مشتری پس از انجام کار الباقی مبلغ را در سالن پرداخت کرد، فقط دکمه سبز کنار نام او را بزنید:
            </p>
          </div>

          {activeOrDoneAppointments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] text-center space-y-1">
              <p className="text-xs font-extrabold text-[#061138]">
                هنوز نوبت فعالی برای تسویه حضوری ثبت نشده است
              </p>
              <p className="text-[11px] text-[#64748B]">
                می‌توانید از کارت سمت راست، کل دخل روزانه خود را یک‌جا وارد کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {activeOrDoneAppointments.slice(0, 8).map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-extrabold text-[#061138]">
                      {apt.customerName} — {apt.serviceTitle}
                    </p>
                    <p className="text-[11px] text-[#64748B] tabular-nums">
                      {apt.dateJalali} ساعت {apt.timeSlot} · مبلغ خدمت:{' '}
                      <strong className="text-[#8B5CF6]">
                        {formatPriceToman(apt.priceToman)}
                      </strong>
                    </p>
                  </div>
                  {apt.inPersonSettled ? (
                    <span className="px-2.5 py-1 rounded-xl bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-black tabular-nums">
                      ✓ تسویه حضوری شد (
                      {formatPriceToman(
                        apt.inPersonSettledAmountToman || apt.priceToman
                      )}
                      )
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => settleAppointmentInPerson(apt.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ثبت تسویه الباقی در محل ✓</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* بخش مدیریت دیدگاه‌ها و پاسخگویی به مشتریان (برای تمام پلن‌ها فعال است) */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E6E0F5]">
          <div>
            <h2 className="text-base font-extrabold text-[#1E1B2E]">
              دیدگاه‌های مشتریان و پاسخگویی رسمی سالن ({toPersianDigits(bizReviews.length)})
            </h2>
            <p className="text-xs text-[#6B6480] mt-0.5">
              جهت حفظ شفافیت پلتفرم، دیدگاه‌های منفی و انتقادات محترمانه قابل حذف توسط سالن نیستند اما می‌توانید به آن‌ها پاسخ رسمی بدهید. در صورت وجود فحاشی یا عبارات جفنگ، دکمه گزارش به مدیر کل را بزنید تا بررسی و حذف شود.
            </p>
          </div>
        </div>

        {reviewActionNotice ? (
          <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs font-bold text-[#065F46]">
            {reviewActionNotice}
          </div>
        ) : null}

        {bizReviews.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] text-center space-y-1">
            <p className="text-xs font-extrabold text-[#061138]">
              هنوز دیدگاهی برای سالن شما ثبت نشده است
            </p>
            <p className="text-[11px] text-[#64748B]">
              وقتی مشتریان در صفحه عمومی سالن شما امتیاز و نظر ثبت کنند، در این بخش نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bizReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[#1E1B2E]">
                      {rev.authorName}
                    </span>
                    <StatusBadge
                      label={rev.serviceTitle || 'خدمات سالن'}
                      tone="neutral"
                    />
                    {rev.isReportedBySalon ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                        گزارش‌شده به مدیر کل جهت بررسی فحاشی/جفنگ
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={`font-extrabold ${
                        rev.rating <= 2 ? 'text-[#E11D48]' : 'text-[#F59E0B]'
                      }`}
                    >
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(Math.max(0, 5 - rev.rating))} (
                      {toPersianDigits(rev.rating)} از ۵)
                    </span>
                    <span className="text-[#6B6480]">{rev.dateJalali}</span>
                  </div>
                </div>

                <p className="text-xs text-[#4B445C] leading-6">{rev.comment}</p>

                {rev.salonReply ? (
                  <div className="mr-3 p-3 rounded-xl bg-white border-r-4 border-[#8B5CF6] space-y-1">
                    <p className="text-[11px] font-extrabold text-[#6D28D9]">
                      پاسخ شما (مدیریت سالن):
                    </p>
                    <p className="text-xs text-[#1E1B2E] leading-5">
                      {rev.salonReply}
                    </p>
                  </div>
                ) : null}

                <div className="pt-2 border-t border-[#E6E0F5] flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingReviewId(
                        replyingReviewId === rev.id ? null : rev.id
                      );
                      setReplyDraftText(rev.salonReply || '');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F3EEFF] text-[#6D28D9] border border-[#DDD6FE] text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {rev.salonReply ? 'ویرایش پاسخ سالن' : 'ثبت پاسخ رسمی به مشتری'}
                  </button>
                  {!rev.isReportedBySalon ? (
                    <button
                      type="button"
                      onClick={() => {
                        reportReviewAbuse(
                          rev.id,
                          'گزارش فحاشی یا متن جفنگ توسط مدیر سالن جهت بررسی و حذف توسط مدیر کل'
                        );
                        setReviewActionNotice(
                          'گزارش فحاشی/جفنگ برای این دیدگاه ثبت شد و در پنل مدیر کل (/admin/users) جهت حذف قرار گرفت.'
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      گزارش فحاشی یا جفنگ به مدیر کل
                    </button>
                  ) : null}
                </div>

                {replyingReviewId === rev.id ? (
                  <div className="pt-2 space-y-2">
                    <textarea
                      rows={2}
                      value={replyDraftText}
                      onChange={(e) => setReplyDraftText(e.target.value)}
                      placeholder="پاسخ محترمانه مدیریت سالن به این دیدگاه..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#DDD6FE] text-xs focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!replyDraftText.trim()) return;
                          replyToReview(rev.id, replyDraftText.trim());
                          setReplyingReviewId(null);
                          setReviewActionNotice(
                            'پاسخ مدیریت سالن با موفقیت ثبت و زیر دیدگاه مشتری نمایش داده شد.'
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-bold cursor-pointer"
                      >
                        ذخیره پاسخ
                      </button>
                      <button
                        type="button"
                        onClick={() => setReplyingReviewId(null)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#E6E0F5] text-xs font-semibold text-[#6B6480] cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${
          isFreePlan ? 'opacity-60 pointer-events-none select-none' : ''
        }`}
      >
        <Card className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold text-[#1E1B2E]">
              سهم خدمات و دخل روزانه از درآمد ماه
            </h2>
            {isFreePlan ? (
              <StatusBadge label="🔒 ویژه پلن حرفه‌ای" tone="warning" />
            ) : null}
          </div>
          <div className="space-y-4">
            {(popularBreakdown.length > 0
              ? popularBreakdown
              : [
                  { name: 'خدمات اصلی مرکز (در انتظار اولین رزرو)', pct: 0, amount: 0 },
                  { name: 'پکیج‌ها و خدمات مکمل', pct: 0, amount: 0 },
                  { name: 'مراجعات حضوری و نوبت‌های آنلاین', pct: 0, amount: 0 },
                ]
            ).map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#1E1B2E]">
                    {item.name}
                  </span>
                  <span className="tabular-nums text-[#6B6480] font-semibold">
                    {toPersianDigits(item.pct)}٪ ({formatPriceToman(item.amount)})
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F3EEFF] overflow-hidden">
                  <div
                    className="h-full bg-[#8B5CF6] rounded-full transition-all"
                    style={{ width: `${Math.max(item.pct, 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-[#1E1B2E]">
                روند ۶ ماهه درآمد سالن
              </h2>
              {isFreePlan ? (
                <StatusBadge label="🔒 ویژه پلن حرفه‌ای" tone="warning" />
              ) : null}
            </div>
            <p className="text-xs text-[#6B6480] mt-0.5">
              نمودار درآمد ماهانه بر اساس نوبت‌های ثبت‌شده و دخل حضوری
            </p>
          </div>

          <div className="h-40 pt-4 flex items-end justify-between gap-2 border-b border-[#E6E0F5] pb-2">
            {monthlyTrend.map((m) => (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <span className="text-[10px] font-bold text-[#6B6480] tabular-nums">
                  {m.label}
                </span>
                <div
                  className="w-full max-w-[30px] rounded-t-lg bg-[#8B5CF6]"
                  style={{
                    height: `${Math.max(6, Math.min(100, m.value * 5))}%`,
                  }}
                />
                <span className="text-[11px] font-semibold text-[#6B6480]">
                  {m.month}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

/** ۱۲. اشتراک و صورتحساب (/app/subscription) */
export const BusinessSubscriptionPage: React.FC = () => {
  const {
    plans,
    activePlanId,
    setActivePlanId,
    currentBusiness,
    businesses,
    paymentOrders,
    showToast,
    dataMode,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const currentPlan =
    plans.find(
      (p) =>
        p.id === activePlanId || p.name === currentBiz?.subscriptionPlan
    ) ??
    plans[0];

  const [checkoutItem, setCheckoutItem] = useState<CheckoutItemPayload | null>(
    null
  );

  const planOrders = paymentOrders.filter(
    (o) => o.businessId === currentBiz?.id && o.itemType === 'PLAN'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مالی · اشتراک ماهانه و ارتقای پنل سالن"
        title="مدیریت اشتراک و ارتقای کسب‌وکار"
        subtitle="مقایسه شفاف مزایای ارتقا به پلن حرفه‌ای و VIP با امکان تسویه فوری از طریق درگاه آنلاین زیبال"
        routePattern="/app/subscription"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'اشتراک و ارتقا' },
        ]}
      />

      {currentPlan ? (
        <Card variant="dark" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#00E5FF]">
                پلن فعال فعلی کسب‌وکار شما:
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {currentBiz?.subscriptionPlan || currentPlan.name}
              </h2>
              <p className="text-xs text-slate-200 tabular-nums">
                ظرفیت پرسنل: {currentPlan.staffLimit} · سهمیه پیامک یادآور
                ماهانه: {toPersianDigits(currentPlan.smsQuotaMonthly)} عدد
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {currentBiz?.trialDaysRemaining &&
              currentBiz.trialDaysRemaining > 0 ? (
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-xs font-black text-amber-300 tabular-nums">
                  ⏳ روزشمار اعتبار فعلی:{' '}
                  {toPersianDigits(currentBiz.trialDaysRemaining)} روز باقی‌مانده
                </span>
              ) : null}
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white tabular-nums">
                {dataMode === 'real'
                  ? 'درگاه آنلاین زیبال: فعال'
                  : 'وضعیت اشتراک: فعال'}
              </span>
            </div>
          </div>
        </Card>
      ) : null}

      {/* راهنمای ارزش ارتقا برای صاحب سالن */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-1.5">
          <p className="text-xs font-extrabold text-[#059669]">
            ۱. کاهش ۷۰٪ عدم حضور مشتری
          </p>
          <p className="text-xs text-[#334155] leading-relaxed">
            ارسال خودکار پیامک تایید و یادآور ۲۴ ساعت قبل از نوبت از طریق
            خط خدماتی.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-1.5">
          <p className="text-xs font-extrabold text-[#0057FF]">
            ۲. اولویت نمایش در جست‌وجوی اصفهان
          </p>
          <p className="text-xs text-[#334155] leading-relaxed">
            درج نشان «سالن برگزیده» و جایگاه بالاتر در لیست جست‌وجوی محله و
            خدمات.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-1.5">
          <p className="text-xs font-extrabold text-[#D97706]">
            ۳. پرداخت آنی بدون پیچیدگی بانکی
          </p>
          <p className="text-xs text-[#334155] leading-relaxed">
            تسویه مستقیم با لینک بله‌پی یا کارت‌به‌کارت و فعال‌سازی سریع اشتراک
            توسط مدیریت.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === activePlanId;
          return (
            <Card
              key={plan.id}
              className={`space-y-5 flex flex-col justify-between ${
                isCurrent
                  ? 'border-2 border-[#0057FF] shadow-sm'
                  : plan.isRecommended
                    ? 'border-[#0057FF]/50'
                    : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-[#061138]">
                    {plan.name}
                  </h3>
                  {isCurrent ? (
                    <StatusBadge label="پلن فعال شما" tone="success" />
                  ) : plan.isRecommended ? (
                    <StatusBadge label="پیشنهاد ویژه" tone="primary" />
                  ) : null}
                </div>
                <p className="text-xl font-extrabold text-[#0057FF] tabular-nums">
                  {plan.monthlyPriceToman === 0
                    ? 'رایگان'
                    : formatPriceToman(plan.monthlyPriceToman)}
                  <span className="text-xs font-normal text-[#64748B]">
                    {' '}
                    {plan.monthlyPriceToman > 0 ? '/ ماهانه' : '(همیشگی)'}
                  </span>
                </p>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {plan.audience}
                </p>
                <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">ظرفیت متخصصان:</span>
                    <span className="font-bold text-[#061138]">
                      {plan.staffLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">سهمیه پیامک ماهانه:</span>
                    <span className="font-bold text-[#061138] tabular-nums">
                      {toPersianDigits(plan.smsQuotaMonthly)} پیامک
                    </span>
                  </div>
                </div>
                <ul className="space-y-2 pt-3 border-t border-[#E2E8F0] text-xs text-[#061138]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant={isCurrent ? 'outline' : 'primary'}
                size="sm"
                fullWidth
                disabled={isCurrent}
                onClick={() => {
                  if (plan.monthlyPriceToman === 0) {
                    setActivePlanId(plan.id);
                    showToast(`پلن کسب‌وکار به «${plan.name}» تغییر یافت.`);
                  } else {
                    setCheckoutItem({
                      itemType: 'PLAN',
                      itemId: plan.id,
                      itemTitle: `اشتراک یک‌ماهه ${plan.name}`,
                      baseAmountToman: plan.monthlyPriceToman,
                      defaultDurationDays: 30,
                    });
                  }
                }}
              >
                {isCurrent
                  ? 'پلن فعال فعلی شما'
                  : plan.monthlyPriceToman === 0
                    ? 'تغییر به پلن پایه رایگان'
                    : `پرداخت و ارتقا به ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      {planOrders.length > 0 ? (
        <Card className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#061138]">
            تاریخچه درخواست‌های ارتقای اشتراک شما
          </h3>
          <ResponsiveTable
            keyExtractor={(o) => o.id}
            data={planOrders}
            columns={[
              {
                key: 'id',
                header: 'شماره سفارش',
                render: (o) => (
                  <span className="font-mono text-xs font-bold text-[#0057FF]">
                    {o.id}
                  </span>
                ),
              },
              {
                key: 'title',
                header: 'پلن درخواستی',
                render: (o) => (
                  <span className="font-extrabold text-[#061138]">
                    {o.itemTitle}
                  </span>
                ),
              },
              {
                key: 'method',
                header: 'روش پرداخت / کد رهگیری',
                render: (o) => (
                  <span className="text-xs">
                    درگاه آنلاین زیبال ({o.trackingCode})
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'مبلغ',
                render: (o) => (
                  <span className="font-extrabold text-[#0057FF] tabular-nums">
                    {formatPriceToman(o.amountToman)}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'وضعیت',
                render: (o) => (
                  <StatusBadge
                    label={
                      o.status === 'APPROVED'
                        ? 'تایید و فعال شد'
                        : o.status === 'REJECTED'
                          ? 'رد شده'
                          : 'در انتظار تایید مدیر'
                    }
                    tone={
                      o.status === 'APPROVED'
                        ? 'success'
                        : o.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                    }
                  />
                ),
              },
            ]}
          />
        </Card>
      ) : null}

      <EasyCheckoutModal
        isOpen={Boolean(checkoutItem)}
        onClose={() => setCheckoutItem(null)}
        item={checkoutItem}
        businessId={currentBiz?.id || 'biz-1'}
        businessName={currentBiz?.name || 'سالن زیبایی شما'}
      />
    </div>
  );
};

/** ۱۳. تنظیمات پنل کسب‌وکار، اطلاع‌رسانی پیامکی، قوانین رزرو و رمز عبور (/app/settings) */
export const BusinessSettingsPage: React.FC = () => {
  const {
    authUser,
    currentBusiness,
    businesses,
    plans,
    activePlanId,
    updateBusinessProfile,
    setAccountPassword,
    requestOtpLogin,
    resetPasswordWithOtp,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const currentPlan =
    plans.find((p) => p.id === activePlanId) ?? plans[1] ?? plans[0];
  const totalSmsQuota =
    (currentPlan?.smsQuotaMonthly ?? 0) + (currentBiz?.extraSmsBalance ?? 0);

  const [activeTab, setActiveTab] = useState(() =>
    typeof window !== 'undefined' &&
    window.location.hash === '#booking_rules'
      ? 'booking_rules'
      : 'notifications'
  );
  const [smsOnBookingConfirm, setSmsOnBookingConfirm] = useState(true);
  const [smsReminder24h, setSmsReminder24h] = useState(true);
  const [smsOwnerNewBookingAlert, setSmsOwnerNewBookingAlert] = useState(true);
  const [smsThankYouAfterService, setSmsThankYouAfterService] = useState(false);

  // قوانین لغو نوبت، مهلت کنسلی و بیعانه (قابل تنظیم توسط کارفرما)
  const [cancellationDeadlineHours, setCancellationDeadlineHours] =
    useState<number>(currentBiz?.cancellationDeadlineHours ?? 24);
  const [lateCancellationPenaltyPercent, setLateCancellationPenaltyPercent] =
    useState<number>(currentBiz?.lateCancellationPenaltyPercent ?? 30);
  const [depositPercentRule, setDepositPercentRule] = useState<number>(
    currentBiz?.depositPercent && currentBiz.depositPercent > 0
      ? currentBiz.depositPercent
      : 30
  );

  useEffect(() => {
    if (!currentBiz) return;
    setCancellationDeadlineHours(currentBiz.cancellationDeadlineHours ?? 24);
    setLateCancellationPenaltyPercent(
      currentBiz.lateCancellationPenaltyPercent ?? 30
    );
    setDepositPercentRule(
      currentBiz.depositPercent && currentBiz.depositPercent > 0
        ? currentBiz.depositPercent
        : 30
    );
  }, [
    currentBiz?.id,
    currentBiz?.depositPercent,
    currentBiz?.cancellationDeadlineHours,
    currentBiz?.lateCancellationPenaltyPercent,
  ]);

  const [fixedPassword, setFixedPassword] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);

  // بازیابی رمز عبور با کد پیامکی
  const [resetPhone, setResetPhone] = useState(authUser?.phone || '');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPass(true);
    try {
      const ok = await setAccountPassword(fixedPassword);
      if (ok) {
        setFixedPassword('');
      }
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleSendResetOtp = async () => {
    const clean = normalizeIranMobileInput(resetPhone || authUser?.phone || '');
    if (!isValidIranMobile(clean)) {
      showToast('شماره موبایل ۱۱ رقمی معتبر وارد کنید.');
      return;
    }
    setIsResetting(true);
    try {
      await requestOtpLogin(clean);
      setResetPhone(clean);
      setOtpSent(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در ارسال کد تایید.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizeIranMobileInput(resetPhone || authUser?.phone || '');
    const cleanCode = toEnglishDigitsClient(resetOtpCode).replace(/\D/g, '').slice(0, 6);
    setIsResetting(true);
    try {
      const ok = await resetPasswordWithOtp(cleanPhone, cleanCode, resetNewPass);
      if (ok) {
        setOtpSent(false);
        setResetOtpCode('');
        setResetNewPass('');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="تنظیمات سالن · اعلان‌های پیامکی، قوانین نوبت‌دهی و امنیت حساب"
        title="تنظیمات پنل کسب‌وکار، پیامک‌های خودکار و رمز عبور"
        subtitle="مدیریت پیامک‌های تایید و یادآوری نوبت مشتریان، قوانین لغو رزرو و تنظیم رمز عبور ثابت حساب سالن"
        routePattern="/app/settings"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تنظیمات و قوانین' },
        ]}
      />

      <div className="max-w-3xl space-y-5">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'notifications', label: 'پیامک‌های خودکار و اعلان‌ها' },
            { id: 'booking_rules', label: 'قوانین بیعانه، رزرو و کنسلی نوبت' },
            { id: 'security', label: 'تنظیم و بازیابی رمز عبور' },
          ]}
        />

        {activeTab === 'notifications' ? (
          <div className="space-y-5">
            {/* خلاصه اعتبار پیامک سالن */}
            <Card className="bg-gradient-to-l from-[#061138] via-[#0B1D56] to-[#0057FF] text-white border border-[#1E293B]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00E5FF]">
                    <MessageSquare className="w-4 h-4" />
                    <span>اعتبار پیامک خدماتی سالن شما</span>
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {toPersianDigits(totalSmsQuota)} پیامک فعال در پلن «
                    {currentPlan?.name || 'شروع رایگان'}»
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    پیامک‌های تایید رزرو و یادآوری نوبت به صورت خودکار از خط خدماتی پلتفرم برای مشتریان سالن شما ارسال می‌شود.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to="/app/marketing"
                    className="px-3.5 py-2 rounded-xl bg-[#00E5FF] hover:bg-white text-[#061138] font-extrabold text-xs transition-colors"
                  >
                    پنل پیامک و شارژ بسته
                  </Link>
                  <Link
                    to="/app/subscription"
                    className="px-3.5 py-2 rounded-xl bg-white/12 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors"
                  >
                    ارتقای پلن
                  </Link>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#061138]">
                  تنظیمات ارسال پیامک خودکار برای مشتریان و مدیر سالن
                </h3>
                <p className="text-xs text-[#64748B]">
                  مشخص کنید در چه مراحلی پیامک اطلاع‌رسانی برای مراجعان یا شماره موبایل شما ارسال شود:
                </p>
              </div>
              <div className="space-y-2.5 text-xs sm:text-sm text-[#061138]">
                <label className="flex items-center justify-between gap-3 py-3 border-b border-[#E2E8F0] cursor-pointer">
                  <div>
                    <p className="font-extrabold text-[#061138]">
                      ارسال پیامک تایید بلافاصله پس از ثبت نوبت
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      شامل نام سالن، تاریخ و ساعت مراجعه و کد رهگیری نوبت برای مشتری
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsOnBookingConfirm}
                    onChange={(e) => setSmsOnBookingConfirm(e.target.checked)}
                    className="accent-[#0057FF] w-4 h-4 shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 py-3 border-b border-[#E2E8F0] cursor-pointer">
                  <div>
                    <p className="font-extrabold text-[#061138]">
                      ارسال پیامک یادآور ۲۴ ساعت مانده به زمان مراجعه
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      کاهش چشمگیر فراموشی نوبت و عدم حضور مشتری در سالن
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsReminder24h}
                    onChange={(e) => setSmsReminder24h(e.target.checked)}
                    className="accent-[#0057FF] w-4 h-4 shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 py-3 border-b border-[#E2E8F0] cursor-pointer">
                  <div>
                    <p className="font-extrabold text-[#061138]">
                      ارسال پیامک اطلاع‌رسانی ثبت نوبت جدید به موبایل مدیر سالن
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      اطلاع فوری به شماره {currentBiz?.ownerPhone || authUser?.phone || 'مدیر سالن'} هنگام ثبت رزرو جدید
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsOwnerNewBookingAlert}
                    onChange={(e) => setSmsOwnerNewBookingAlert(e.target.checked)}
                    className="accent-[#0057FF] w-4 h-4 shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 py-3 cursor-pointer">
                  <div>
                    <p className="font-extrabold text-[#061138]">
                      ارسال پیامک تشکر و لینک ثبت نظر پس از انجام خدمت
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      افزایش امتیاز و نظرات مثبت پروفایل سالن شما در تایم تو
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsThankYouAfterService}
                    onChange={(e) => setSmsThankYouAfterService(e.target.checked)}
                    className="accent-[#0057FF] w-4 h-4 shrink-0"
                  />
                </label>
              </div>
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    showToast('تنظیمات اطلاع‌رسانی پیامکی سالن با موفقیت ذخیره شد.')
                  }
                >
                  ذخیره تنظیمات اعلان پیامکی
                </Button>
              </div>
            </Card>
          </div>
        ) : activeTab === 'booking_rules' ? (
          <Card padding="lg" className="space-y-5">
            <div className="p-3.5 rounded-2xl bg-[#F0FDFA] border border-[#99F6E4] text-xs text-[#0F766E] space-y-1">
              <p className="font-extrabold text-[#065F46]">
                💡 قوانین بیعانه و کنسلی نوبت (کاملاً در اختیار شما به عنوان کارفرما)
              </p>
              <p className="leading-relaxed">
                در صورت لغو نوبت توسط مشتری در مهلت مجاز، مبلغ بیعانه به‌صورت خودکار به «کیف پول مشتری» برمی‌گردد تا دوباره نوبت رزرو کند یا درخواست تسویه بزند. اگر مشتری دیرتر از مهلت مجاز تعیین‌شده توسط شما کنسل کند، قانون خسارت دیرکرد زیر اعمال می‌شود.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="set-deposit-custom-input"
                  className="text-xs sm:text-sm font-extrabold text-[#061138] block"
                >
                  درصد بیعانه آنلاین هنگام ثبت نوبت توسط مشتری
                </label>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  می‌توانید یکی از درصدهای پیشنهادی را انتخاب کنید یا هر درصد دلخواهی (بین ۱ تا ۱۰۰ درصد) را مستقیماً وارد نمایید. مبلغ بیعانه از صورت‌حساب حضوری مشتری کسر می‌شود.
                </p>
              </div>

              {/* دکمه‌های پیشنهادی سریع */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { pct: 20, label: '۲۰٪ مبلغ خدمت' },
                  { pct: 30, label: '۳۰٪ (پیشنهادی)' },
                  { pct: 50, label: '۵۰٪ مبلغ خدمت' },
                  { pct: 100, label: '۱۰۰٪ پرداخت کامل' },
                ].map((preset) => {
                  const isSelected = depositPercentRule === preset.pct;
                  return (
                    <button
                      key={preset.pct}
                      type="button"
                      onClick={() => setDepositPercentRule(preset.pct)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-sm'
                          : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* فیلد ورود عدد دلخواه توسط کارفرما */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-[#CBD5E1]">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-[#061138] block">
                    تعیین درصد دلخواه کارفرما (بین ۱ تا ۱۰۰ درصد):
                  </span>
                  <span className="text-[11px] text-[#64748B] block">
                    هر عددی وارد کنید (مثلاً ۱۵٪، ۲۵٪ یا ۴۰٪) دقیقاً همان درصد در زمان رزرو محاسبه می‌شود
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="set-deposit-custom-input"
                    type="number"
                    min={1}
                    max={100}
                    dir="ltr"
                    value={depositPercentRule || ''}
                    onChange={(e) => {
                      const raw = parseInt(
                        toEnglishDigitsClient(e.target.value),
                        10
                      );
                      if (Number.isNaN(raw)) {
                        setDepositPercentRule(0);
                      } else {
                        setDepositPercentRule(
                          Math.max(1, Math.min(100, raw))
                        );
                      }
                    }}
                    onBlur={() => {
                      if (!depositPercentRule || depositPercentRule < 1) {
                        setDepositPercentRule(30);
                      }
                    }}
                    aria-label="درصد دلخواه بیعانه"
                    className="w-24 rounded-xl border-2 border-[#0057FF]/40 bg-[#F8FAFC] px-3 py-1.5 text-center text-sm font-black text-[#061138] tabular-nums focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  <span className="text-xs font-extrabold text-[#061138]">
                    درصد (٪)
                  </span>
                </div>
              </div>
            </div>

            <FormField
              id="set-cancel"
              label="حداقل مهلت مجاز برای لغو نوبت توسط مشتری (با بازگشت کامل ۱۰۰٪ بیعانه)"
              hint="مشتری تا این ساعت مانده به زمان نوبت می‌تواند بدون جریمه نوبت را لغو کند و بیعانه فوراً به کیف پول او برمی‌گردد"
            >
              <Select
                id="set-cancel"
                value={String(cancellationDeadlineHours)}
                onChange={(e) =>
                  setCancellationDeadlineHours(Number(e.target.value))
                }
                options={[
                  { value: '3', label: 'تا ۳ ساعت پیش از شروع نوبت' },
                  { value: '6', label: 'تا ۶ ساعت پیش از شروع نوبت' },
                  { value: '12', label: 'تا ۱۲ ساعت پیش از شروع نوبت' },
                  { value: '24', label: 'تا ۲۴ ساعت پیش از شروع نوبت (پیشنهادی)' },
                  { value: '48', label: 'تا ۴۸ ساعت پیش از شروع نوبت' },
                ]}
              />
            </FormField>

            <FormField
              id="set-late-penalty"
              label="قانون کنسلی دیرهنگام (اگر مشتری کمتر از مهلت بالا مانده به نوبت لغو کند)"
              hint="برای جلوگیری از سوخت شدن وقت متخصص در کنسلی‌های دقیقه نودی"
            >
              <Select
                id="set-late-penalty"
                value={String(lateCancellationPenaltyPercent)}
                onChange={(e) =>
                  setLateCancellationPenaltyPercent(Number(e.target.value))
                }
                options={[
                  {
                    value: '0',
                    label: 'بدون جریمه — بازگشت ۱۰۰٪ بیعانه به کیف پول مشتری',
                  },
                  {
                    value: '30',
                    label:
                      'کسر ۳۰٪ خسارت دیرکرد برای سالن و بازگشت ۷۰٪ بیعانه به کیف پول مشتری',
                  },
                  {
                    value: '50',
                    label:
                      'کسر ۵۰٪ خسارت دیرکرد برای سالن و بازگشت ۵۰٪ بیعانه به کیف پول مشتری',
                  },
                  {
                    value: '100',
                    label:
                      'عدم بازگشت بیعانه در کنسلی دقیقه نودی (فقط امکان جابه‌جایی با تماس با سالن)',
                  },
                ]}
              />
            </FormField>

            <FormField
              id="set-buffer"
              label="فاصله استراحت بین دو نوبت متوالی"
              hint="این زمان برای آماده‌سازی میز کار بین دو مراجع در نظر گرفته می‌شود"
            >
              <Select
                id="set-buffer"
                defaultValue="15"
                options={[
                  { value: '0', label: 'بدون فاصله' },
                  { value: '15', label: '۱۵ دقیقه' },
                  { value: '30', label: '۳۰ دقیقه' },
                ]}
              />
            </FormField>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => {
                  const safePercent = Math.max(
                    1,
                    Math.min(100, depositPercentRule || 30)
                  );
                  setDepositPercentRule(safePercent);
                  if (currentBiz) {
                    updateBusinessProfile(currentBiz.id, {
                      depositEnabled: true,
                      depositPercent: safePercent,
                      cancellationDeadlineHours,
                      lateCancellationPenaltyPercent,
                    });
                  }
                  showToast(
                    `قوانین بیعانه (${toPersianDigits(safePercent)}٪)، مهلت کنسلی و جریمه دیرکرد سالن با موفقیت ذخیره شد ✓`
                  );
                }}
              >
                ذخیره قوانین بیعانه و کنسلی سالن
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-5">
            <Card padding="lg" className="space-y-4 border-2 border-[#0057FF]/25">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-[#061138]">
                  ۱. تعریف یا تغییر مستقیم رمز عبور ثابت حساب کسب‌وکار
                </h3>
                <p className="text-xs text-[#64748B]">
                  با تعریف رمز عبور ثابت، در مراجعات بعدی بدون نیاز به کد پیامکی می‌توانید وارد پنل مدیریت سالن شوید.
                </p>
              </div>
              <form onSubmit={handleSetPassword} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1">
                  <FormField id="biz-set-pass" label="رمز عبور ثابت جدید (حداقل ۶ کاراکتر)" required>
                    <Input
                      id="biz-set-pass"
                      type="password"
                      dir="ltr"
                      placeholder="حداقل ۶ کاراکتر..."
                      value={fixedPassword}
                      onChange={(e) => setFixedPassword(e.target.value)}
                    />
                  </FormField>
                </div>
                <Button type="submit" variant="primary" isLoading={isSavingPass}>
                  ذخیره رمز عبور ثابت
                </Button>
              </form>
            </Card>

            <Card padding="lg" className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-extrabold text-[#061138]">
                  ۲. فراموشی رمز عبور / بازنشانی رمز با کد تایید پیامکی
                </h3>
                <p className="text-xs text-[#64748B]">
                  اگر رمز عبور قبلی را فراموش کرده‌اید، با دریافت کد پیامکی به شماره موبایل خود رمز جدید ثبت کنید:
                </p>
              </div>
              <form onSubmit={handleResetWithOtp} className="space-y-4">
                <FormField id="biz-reset-phone" label="شماره موبایل صاحب کسب‌وکار" required>
                  <div className="flex items-center gap-2">
                    <Input
                      id="biz-reset-phone"
                      dir="ltr"
                      maxLength={11}
                      placeholder="09131234567"
                      value={resetPhone}
                      onChange={(e) => setResetPhone(normalizeIranMobileInput(e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSendResetOtp()}
                      disabled={isResetting}
                    >
                      {otpSent ? 'ارسال مجدد کد' : 'دریافت کد پیامکی'}
                    </Button>
                  </div>
                </FormField>

                {otpSent ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField id="biz-reset-code" label="کد ۶ رقمی پیامک‌شده" required>
                      <Input
                        id="biz-reset-code"
                        dir="ltr"
                        maxLength={6}
                        placeholder="123456"
                        value={resetOtpCode}
                        onChange={(e) => setResetOtpCode(e.target.value)}
                      />
                    </FormField>
                    <FormField id="biz-reset-newpass" label="رمز عبور جدید" required>
                      <Input
                        id="biz-reset-newpass"
                        type="password"
                        dir="ltr"
                        placeholder="حداقل ۶ کاراکتر"
                        value={resetNewPass}
                        onChange={(e) => setResetNewPass(e.target.value)}
                      />
                    </FormField>
                    <div className="sm:col-span-2">
                      <Button type="submit" variant="primary" isLoading={isResetting}>
                        تایید کد و ثبت رمز عبور جدید
                      </Button>
                    </div>
                  </div>
                ) : null}
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
