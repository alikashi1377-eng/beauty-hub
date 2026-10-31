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
} from 'lucide-react';
import {
  AppointmentItem,
  AppointmentStatus,
  CustomerRecord,
  ServiceItem,
  SpecialistItem,
} from '../../types';
import { SAMPLE_CATEGORIES } from '../../mocks/sampleData';
import {
  formatDurationMinutes,
  formatNumericInputWithCommas,
  formatPriceToman,
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

/** بررسی رایگان بودن پلن فعلی کسب‌وکار */
const isFreeSubscriptionPlan = (
  planId?: string,
  planName?: string
): boolean => {
  const id = (planId || '').toLowerCase();
  const name = (planName || '').trim();
  if (id === 'plan-professional' || id === 'plan-vip-multi' || id === 'plan-vip') {
    return false;
  }
  if (name.includes('حرفه‌ای') || name.includes('VIP') || name.includes('ویژه')) {
    return false;
  }
  return true;
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
    updateAppointmentStatus,
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
      selectedStaffFilter === 'ALL' ||
      apt.specialistName === selectedStaffFilter
  );

  return (
    <div className="space-y-5">
      {/* ۱. نوار استوری‌های آموزشی و اطلاعیه‌ها (به سبک اینستاگرام با پوستر تصویری و لینک مستقیم به بخش‌ها) */}
      <BusinessStoriesBar />

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
                        <span className="font-mono text-[11px] font-bold text-[#0057FF] bg-[#E0ECFF] px-2 py-0.5 rounded-md">
                          {apt.referenceCode}
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
                  className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3"
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
                  <Link
                    to="/app/calendar"
                    className="text-[11px] font-extrabold text-[#0057FF] hover:underline shrink-0"
                  >
                    تقویم
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

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
                                کد پیگیری:{' '}
                                <span dir="ltr" className="font-mono font-bold">
                                  {matched.referenceCode}
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
              key: 'code',
              header: 'کد پیگیری',
              render: (r) => (
                <span className="font-mono text-xs font-bold text-[#8B5CF6] bg-[#EDE9FE] px-2 py-0.5 rounded-md">
                  {r.referenceCode}
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

/** ۴. خدمات و تعرفه‌ها (/app/services) */
export const BusinessServicesPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    services,
    categories,
    addService,
    updateService,
    deleteService,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('مو و رنگ');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [priceToman, setPriceToman] = useState('650000');
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

  const openAddModal = () => {
    setEditingService(null);
    setTitle('');
    setCategory('مو و رنگ');
    setDurationMinutes('60');
    setPriceToman(formatNumericInputWithCommas('650000'));
    setDescription('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setTitle(srv.title);
    setCategory(srv.category);
    setDurationMinutes(String(srv.durationMinutes));
    setPriceToman(formatNumericInputWithCommas(String(srv.priceToman)));
    setDescription(srv.description);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseNumericInput(priceToman);
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

    if (editingService) {
      updateService(editingService.id, {
        title: title.trim(),
        category,
        durationMinutes: numericDuration,
        priceToman: numericPrice,
        description: description.trim() || 'خدمت تخصصی زیبایی',
      });
    } else {
      const matchedCat = categories.find((c) => c.title === category);
      addService({
        businessId: currentBiz?.id ?? 'biz-owner-zero',
        categorySlug: matchedCat?.slug ?? 'hair-color',
        title: title.trim(),
        category,
        durationMinutes: numericDuration,
        priceToman: numericPrice,
        description: description.trim() || 'خدمت تخصصی سالن زیبایی',
        isActive: true,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="کسب‌وکار · فهرست خدمات"
        title="مدیریت خدمات و تعرفه‌ها"
        subtitle="سازمان‌دهی منوی خدمات سالن، مدت زمان ارائه، تعرفه‌ها و وضعیت نمایش در صفحه رزرو آنلاین"
        routePattern="/app/services"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'خدمات و تعرفه‌ها' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>افزودن خدمت جدید</span>
          </Button>
        }
      />

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
            header: 'عنوان و شرح خدمت',
            render: (s) => (
              <div>
                <p className="font-extrabold text-[#1E1B2E]">{s.title}</p>
                <p className="text-xs text-[#6B6480] mt-0.5">{s.description}</p>
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
            header: 'تعرفه (تومان)',
            align: 'left',
            render: (s) => (
              <span className="font-extrabold text-[#8B5CF6] tabular-nums">
                {formatPriceToman(s.priceToman)}
              </span>
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
                  <span>ویرایش</span>
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

      {/* مودال افزودن / ویرایش خدمت */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'ویرایش خدمت' : 'افزودن خدمت جدید'}
      >
        <form onSubmit={handleSaveService} className="space-y-4" noValidate>
          <FormField
            id="srv-form-cat"
            label="دسته‌بندی خدمت"
            required
            error={formErrors.category}
          >
            <Select
              id="srv-form-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={(categories.length > 0
                ? categories
                : SAMPLE_CATEGORIES
              ).map((c) => ({
                value: c.title,
                label: c.title,
              }))}
            />
          </FormField>

          <FormField
            id="srv-form-title"
            label="نام خدمت"
            required
            error={formErrors.title}
          >
            <Input
              id="srv-form-title"
              value={title}
              hasError={Boolean(formErrors.title)}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="نام خدمت را بنویسید یا از پیشنهادهای زیر انتخاب کنید"
            />
          </FormField>

          {suggestedTitles.length > 0 ? (
            <div className="space-y-1.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3">
              <span className="text-[11px] font-extrabold text-[#475569] block">
                پیشنهاد سریع نام خدمت در دسته «{category}» (با لمس انتخاب می‌شود):
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

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="srv-form-dur"
              label="مدت زمان (دقیقه)"
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

            <FormField
              id="srv-form-price"
              label="قیمت (تومان)"
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
          </div>

          <FormField
            id="srv-form-desc"
            label="توضیحات کوتاه خدمت"
            optionalLabel="اختیاری"
          >
            <Input
              id="srv-form-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              ذخیره خدمت
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

  const filtered = customers.filter((c) => {
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

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="مشتریان · باشگاه و پرونده مراجعان سالن"
        title="مدیریت و ثبت دستی مشتریان سالن"
        subtitle="مشتریان حضوری و قبلی سالن خود را به صورت تکی یا گروهی (چندتایی) وارد کنید، سوابق رنگ و خدماتشان را نگه دارید و پیامک بفرستید"
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
              onClick={() => setIsBulkModalOpen(true)}
            >
              <Users className="w-4 h-4" />
              <span>افزودن سریع گروهی (مشتریان قبلی)</span>
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
            {toPersianDigits(customers.length)} نفر
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
              customers.filter((c) => c.totalVisits >= 3).length
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

/** ۷. گالری نمونه کارها (/app/gallery) */
export const BusinessGalleryPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    gallery,
    addGalleryItem,
    removeGalleryItem,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const [title, setTitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('مو و رنگ');

  const handleAddDemoImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGalleryItem({
      businessId: currentBiz?.id ?? 'biz-1',
      title: title.trim(),
      categoryLabel,
      theme: 'violet',
    });
    setTitle('');
  };

  return (
    <div>
      <PageHeader
        kicker="کسب‌وکار · نمونه کارها"
        title="گالری نمونه کارها و تصاویر سالن"
        subtitle="مدیریت قاب‌های تصویری پروفایل عمومی سالن برای نمایش کیفیت خدمات به مشتریان"
        routePattern="/app/gallery"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'گالری نمونه کارها' },
        ]}
      />

      <Card className="mb-6">
        <form
          onSubmit={handleAddDemoImage}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <FormField id="gal-title" label="عنوان نمونه کار جدید" required>
            <Input
              id="gal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً نمونه لایت و بالیاژ..."
            />
          </FormField>
          <FormField id="gal-cat" label="دسته‌بندی تخصصی">
            <Input
              id="gal-cat"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="primary">
            <Plus className="w-4 h-4" />
            <span>افزودن به گالری</span>
          </Button>
        </form>
      </Card>

      {(() => {
        const bizGallery = currentBiz
          ? gallery.filter((g) => g.businessId === currentBiz.id)
          : [];
        if (bizGallery.length === 0) {
          return (
            <EmptyState
              title="گالری نمونه کارهای سالن شما هنوز خالی است"
              description="از فرم بالا اولین نمونه کار تصویری سالن خود را ثبت کنید تا در پروفایل عمومی سالن به مشتریان نمایش داده شود."
            />
          );
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bizGallery.map((item) => (
              <Card key={item.id} padding="sm" className="space-y-3">
                <VisualMediaIllustration
                  theme={item.theme}
                  categoryLabel={item.categoryLabel}
                  title={item.title}
                  city={currentBiz?.city || 'اصفهان'}
                />
                <div className="flex items-center justify-between text-xs px-1 pt-0.5">
                  <div>
                    <p className="font-extrabold text-[#1E1B2E] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#6B6480]">
                      {item.categoryLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(item.id)}
                    className="text-[#EF4444] font-semibold hover:underline cursor-pointer shrink-0"
                  >
                    حذف
                  </button>
                </div>
              </Card>
            ))}
          </div>
        );
      })()}
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
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [name, setName] = useState(currentBiz?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(currentBiz?.avatarUrl ?? '');
  const [instagramHandle, setInstagramHandle] = useState(
    currentBiz?.instagramHandle ?? ''
  );
  const [address, setAddress] = useState(currentBiz?.address ?? '');
  const [mapLat, setMapLat] = useState<number>(currentBiz?.mapLat ?? 32.6362);
  const [mapLng, setMapLng] = useState<number>(currentBiz?.mapLng ?? 51.665);
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

  return (
    <div>
      <PageHeader
        kicker="کسب‌وکار · پروفایل عمومی و مالی"
        title="ویرایش پروفایل و اطلاعات بانکی سالن"
        subtitle="تغییرات نشانی، موقعیت نقشه، اینستاگرام و شماره کارت/شبا بلافاصله ذخیره شده و درصد تکمیل پروفایل شما را به ۱۰۰٪ می‌رساند."
        routePattern="/app/profile"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'پروفایل عمومی سالن' },
        ]}
        actions={
          <Link to={`/salon/${currentBiz.slug}`}>
            <Button variant="outline" size="sm">
              <span>مشاهده پروفایل سالن</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <Card padding="lg" className="lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-4">
            <ProfilePhotoUploader
              value={avatarUrl}
              onChange={(url) => setAvatarUrl(url)}
              label="تصویر پروفایل یا لوگوی سالن (برش خودکار مربع ۴۰۰×۴۰۰)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="prof-name" label="نام سالن یا مرکز زیبایی" required>
                <Input
                  id="prof-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>
              <FormField
                id="prof-instagram"
                label="آدرس صفحه اینستاگرام (اختیاری)"
                hint="نمایش در پروفایل عمومی سالن"
              >
                <Input
                  id="prof-instagram"
                  dir="ltr"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@royal_golzar_beauty"
                />
              </FormField>
            </div>

            <LocationMapPicker
              city={currentBiz.city}
              neighborhood={currentBiz.neighborhood}
              address={address}
              lat={mapLat}
              lng={mapLng}
              onSelectLocation={(coords) => {
                setMapLat(coords.lat);
                setMapLng(coords.lng);
                if (coords.suggestedAddress) {
                  setAddress(coords.suggestedAddress);
                }
              }}
            />

            <FormField
              id="prof-address"
              label="نشانی ثبت‌شده از روی نقشه (در صورت نیاز قابل ویرایش است)"
              required
            >
              <Input
                id="prof-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="با لمس موقعیت سالن روی نقشه بالا، آدرس و لینک گوگل‌مپ خودکار ثبت می‌شود"
              />
            </FormField>

            <FormField
              id="prof-short"
              label="خلاصه یک‌خطی (نمایش در کارت جست‌وجو)"
            >
              <Input
                id="prof-short"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </FormField>
            <FormField id="prof-about" label="توضیحات کامل معرفی سالن">
              <Textarea
                id="prof-about"
                rows={3}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
              />
            </FormField>

            {/* بخش اطلاعات مالی و تسویه‌حساب سالن‌دار (شماره کارت ۱۶ رقمی و شبا) — تاثیر مستقیم روی نوار تکمیل پروفایل */}
            <div
              id="financial-section"
              className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3.5 scroll-mt-24"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#061138]">
                    اطلاعات بانکی و تسویه‌حساب سالن (+۱۵٪ تکمیل پروفایل)
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    شماره کارت ۱۶ رقمی یا شماره شبا جهت واریز بیعانه‌ها و تسویه نوبت‌های آنلاین
                  </p>
                </div>
                {bankCardNumber.replace(/\D/g, '').length >= 16 ||
                bankShebaNumber.replace(/\D/g, '').length >= 24 ? (
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

                <FormField
                  id="prof-bank-holder"
                  label="نام صاحب حساب"
                >
                  <Input
                    id="prof-bank-holder"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="نام و نام خانوادگی صاحب کارت"
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
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="submit" variant="primary">
                ذخیره تغییرات پروفایل و اطلاعات مالی
              </Button>
              {savedNotice ? (
                <span className="text-xs font-bold text-[#10B981]">
                  تغییرات با موفقیت ذخیره شد و درصد پیشرفت پروفایل بروزرسانی گردید.
                </span>
              ) : null}
            </div>
          </form>
        </Card>

        <Card variant="muted" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#8B5CF6]">
              پیش‌نمایش کارت و موقعیت در پروفایل عمومی
            </span>
            <StatusBadge label="زنده" tone="primary" />
          </div>
          <VisualMediaIllustration
            theme="violet"
            categoryLabel={currentBiz.typeLabel}
            title={name}
            city={currentBiz.city}
          />
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
      </div>
    </div>
  );
};

/** ۹. ساعات کاری هفتگی (/app/working-hours) */
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

  const handleTimeChange = (
    index: number,
    field: 'openTime' | 'closeTime',
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
      }))
    );
    showToast(
      `ساعت کاری (${sourceDay.openTime} تا ${sourceDay.closeTime}) روی تمام روزهای هفته اعمال شد.`
    );
  };

  const openDaysCount = hours.filter((h) => h.isOpen).length;

  return (
    <div>
      <PageHeader
        kicker="کسب‌وکار · برنامه پذیرش"
        title="تنظیم ساعات کاری هفتگی"
        subtitle="بدون نیاز به تایپ دستی، ساعت شروع و پایان را از فهرست انتخاب کنید و با یک دکمه روی تمام روزهای هفته اعمال نمایید"
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
              انتخاب سریع بازه ساعت کاری روزهای هفته
            </span>
            {hours.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyDayToAllWeek(0)}
              >
                <Check className="w-3.5 h-3.5" />
                <span>اعمال ساعت شنبه روی تمام روزهای هفته</span>
              </Button>
            ) : null}
          </div>

          <div className="divide-y divide-[#E6E0F5]">
            {hours.map((d, idx) => (
              <div
                key={d.dayName}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
              >
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
                  <div className="flex flex-wrap items-center gap-2">
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
                      aria-label={`ساعت پایان ${d.dayName}`}
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
              ذخیره ساعات کاری
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
            ساعات کاری تنظیم‌شده مستقیماً بازه‌های قابل انتخاب در تقویم رزرو آنلاین
            مشتریان را مشخص می‌کند.
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
    plans,
    activePlanId,
    campaigns,
    addCampaign,
    updateBusinessProfile,
    adPackages,
    paymentOrders,
    smsLogs,
    sendBusinessCustomerSms,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('15');
  const [segment, setSegment] = useState('مشتریان وفادار');
  const [sponsoredLabelInput, setSponsoredLabelInput] = useState(
    currentBiz?.sponsoredLabel || 'پیشنهاد ویژه · ۲۰٪ تخفیف'
  );
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
    });
    showToast('متن برچسب تبلیغاتی سالن شما بروزرسانی شد.');
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

      {/* نوار وضعیت جایگاه تبلیغاتی فعلی سالن */}
      {isSponsoredActive && currentBiz ? (
        <Card className="border-2 border-[#10B981] bg-[#ECFDF5]/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge label="★ جایگاه تبلیغاتی فعال" tone="success" />
                <span className="text-xs font-extrabold text-[#065F46] tabular-nums">
                  رتبه نمایش: جایگاه شماره{' '}
                  {toPersianDigits(currentBiz.sponsoredOrder ?? 1)} ·{' '}
                  {toPersianDigits(currentBiz.sponsoredDaysRemaining ?? 30)} روز
                  باقی‌مانده
                </span>
              </div>
              <p className="text-xs text-[#064E3B]">
                محل نمایش فعلی:{' '}
                <strong>
                  {placementNameMap[
                    currentBiz.sponsoredPlacement || 'SEARCH_TOP'
                  ] || 'صدر نتایج جست‌وجو'}
                </strong>{' '}
                · برچسب فعلی: «{currentBiz.sponsoredLabel || 'پیشنهاد ویژه'}»
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
              بنر و کارت سالن خود را بالاتر از سایر رقبا به مشتریان اصفهان و درچه
              نشان دهید
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

              <div className="pt-1">
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
                      {o.paymentMethod === 'BALEPAY'
                        ? 'بله‌پی (BalePay)'
                        : 'کارت‌به‌کارت'}
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

/** ۱۱. گزارش‌ها و آمار عملکرد (/app/analytics) */
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
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const isFreePlan = isFreeSubscriptionPlan(
    activePlanId,
    currentBiz?.subscriptionPlan
  );

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

  const activeOrDoneAppointments = bizAppointments.filter(
    (a) => a.status !== AppointmentStatus.Cancelled
  );
  const totalRevenueToman = activeOrDoneAppointments.reduce(
    (sum, a) => sum + (a.priceToman || 0),
    0
  );
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
        kicker="مالی · گزارش عملکرد"
        title="گزارش‌ها و آمار عملکرد سالن"
        subtitle="بررسی کارکرد ماهانه، نرخ بازگشت مراجعان و مدیریت دیدگاه‌های ثبت‌شده توسط مشتریان"
        routePattern="/app/analytics"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'گزارش‌ها و آمار' },
        ]}
      />

      {isFreePlan ? (
        <PlanUpgradeLockBanner
          featureTitle="گزارش‌های تحلیلی پیشرفته، تفکیک پورسانت متخصصان و خروجی مالی اکسل"
          description="در پلن شروع رایگان خلاصه پایه نمایش داده می‌شود. برای دسترسی به تحلیل کامل مالی و تفکیک عملکرد هر پرسنل، پلن سالن خود را به حرفه‌ای یا VIP ارتقا دهید."
        />
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">درآمد کل ماه جاری</p>
          <p className="text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {totalRevenueToman > 0 ? formatPriceToman(totalRevenueToman) : '۰ تومان'}
          </p>
          <p className="text-xs text-[#64748B] font-semibold tabular-nums">
            بر اساس {toPersianDigits(activeOrDoneAppointments.length)} نوبت ثبت‌شده
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">
            نرخ بازگشت مجدد مشتریان
          </p>
          <p className="text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
            {toPersianDigits(repeatRatePct)}٪
          </p>
          <p className="text-xs text-[#6B6480] tabular-nums">
            از مجموع {toPersianDigits(bizCustomers.length)} مشتری ثبت‌شده در پرونده‌ها
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">
            دیدگاه‌ها و امتیاز مشتریان
          </p>
          <p className="text-2xl font-extrabold text-[#F59E0B] tabular-nums">
            {currentBiz?.reviewCount
              ? `★ ${toPersianDigits(currentBiz.rating)} از ۵`
              : 'بدون دیدگاه (جدید)'}
          </p>
          <p className="text-xs text-[#6B6480] tabular-nums">
            بر اساس {toPersianDigits(currentBiz?.reviewCount ?? 0)} دیدگاه ثبت‌شده
          </p>
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
              سهم خدمات از درآمد ماهانه
            </h2>
            {isFreePlan ? (
              <StatusBadge label="🔒 ویژه پلن حرفه‌ای" tone="warning" />
            ) : null}
          </div>
          {popularBreakdown.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] text-center space-y-1">
              <p className="text-xs font-extrabold text-[#061138]">
                هنوز تراکنش یا نوبت انجام‌شده‌ای ثبت نشده است
              </p>
              <p className="text-[11px] text-[#64748B]">
                به محض ثبت اولین نوبت‌های سالن شما، نمودار سهم درآمد هر خدمت به صورت خودکار محاسبه می‌شود.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {popularBreakdown.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#1E1B2E]">
                      {item.name}
                    </span>
                    <span className="tabular-nums text-[#6B6480] font-semibold">
                      {toPersianDigits(item.pct)}٪ ({formatPriceToman(item.amount)}
                      )
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#F3EEFF] overflow-hidden">
                    <div
                      className="h-full bg-[#8B5CF6] rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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
              نمودار درآمد ماهانه بر اساس نوبت‌های ثبت‌شده در سیستم
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
    plans.find((p) => p.id === activePlanId) ?? plans[1] ?? plans[0];

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
        subtitle="مقایسه شفاف مزایای ارتقا به پلن حرفه‌ای و VIP با امکان تسویه فوری از طریق بله‌پی (BalePay) یا کارت‌به‌کارت"
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
                {currentPlan.name}
              </h2>
              <p className="text-xs text-slate-200 tabular-nums">
                ظرفیت پرسنل: {currentPlan.staffLimit} · سهمیه پیامک یادآور
                ماهانه: {toPersianDigits(currentPlan.smsQuotaMonthly)} عدد
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white tabular-nums">
                {dataMode === 'real'
                  ? 'پرداخت آسان بله‌پی / کارت‌به‌کارت: فعال'
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
            ۲. اولویت نمایش در جست‌وجوی اصفهان و درچه
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
                    {o.paymentMethod === 'BALEPAY' ? 'بله‌پی' : 'کارت‌به‌کارت'}{' '}
                    ({o.trackingCode})
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

  const [activeTab, setActiveTab] = useState('notifications');
  const [smsOnBookingConfirm, setSmsOnBookingConfirm] = useState(true);
  const [smsReminder24h, setSmsReminder24h] = useState(true);
  const [smsOwnerNewBookingAlert, setSmsOwnerNewBookingAlert] = useState(true);
  const [smsThankYouAfterService, setSmsThankYouAfterService] = useState(false);

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
            { id: 'booking_rules', label: 'قوانین رزرو و لغو' },
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

            <FormField
              id="set-cancel"
              label="حداقل زمان مجاز برای لغو نوبت توسط مشتری"
            >
              <Select
                id="set-cancel"
                defaultValue="24"
                options={[
                  { value: '12', label: '۱۲ ساعت پیش از نوبت' },
                  { value: '24', label: '۲۴ ساعت پیش از نوبت' },
                  { value: '48', label: '۴۸ ساعت پیش از نوبت' },
                ]}
              />
            </FormField>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() =>
                  showToast('تنظیمات قوانین رزرو کسب‌وکار با موفقیت ذخیره شد.')
                }
              >
                ذخیره تنظیمات
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
