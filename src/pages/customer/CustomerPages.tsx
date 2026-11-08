import React, { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  CalendarCheck,
  ArrowLeft,
  ArrowRight,
  Clock,
  Check,
  Sparkles,
  UserCheck,
  MapPin,
  ShieldCheck,
  Loader2,
  Star,
  Award,
  ChevronRight,
  ChevronLeft,
  Heart,
  LogOut,
  Scissors,
} from 'lucide-react';
import {
  AppointmentItem,
  AppointmentStatus,
  TimeSlotAvailabilityItem,
} from '../../types';
import {
  computeSelectedServicesSummary,
  formatDurationMinutes,
  formatPriceToman,
  getUpcomingJalaliDays,
  isValidIranMobile,
  normalizeIranMobileInput,
  toEnglishDigitsClient,
  toPersianDigits,
} from '../../utils/formatters';
import { realApiClient } from '../../services/apiClient';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/StateViews';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  getBeautyPhotoUrl,
  getSpecialistAvatarUrl,
} from '../../components/ui/VisualMediaIllustration';
import {
  AppointmentCard,
  Avatar,
  BusinessCard,
  ConfirmationDialog,
  ProfessionalCard,
  Tabs,
} from '../../components/ui/MarketplaceComponents';
import { TimetoUnifiedAuthCard } from '../../components/auth/TimetoAuthModal';
import { PWAProfileInstallRow } from '../../components/ui/PWAInstallPrompt';

/** نوار مرحله‌به‌مرحله مینیمال، آیکون‌محور و قابل کلیک برای مسیر رزرو نوبت */
const BookingFlowStepIndicator: React.FC<{
  currentStep: 1 | 2 | 3 | 4;
  onSelectStep?: (step: 1 | 2 | 3 | 4) => void;
}> = ({ currentStep, onSelectStep }) => {
  const steps: Array<{
    num: 1 | 2 | 3 | 4;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { num: 1, label: 'انتخاب خدمت', shortLabel: 'خدمت', icon: Scissors },
    { num: 2, label: 'انتخاب متخصص', shortLabel: 'متخصص', icon: UserCheck },
    { num: 3, label: 'زمان مراجعه', shortLabel: 'زمان', icon: CalendarCheck },
    { num: 4, label: 'تایید نهایی', shortLabel: 'تایید', icon: Check },
  ];

  return (
    <nav
      aria-label="مراحل رزرو نوبت"
      className="mb-5 sticky top-16 z-20 rounded-2xl bg-white/95 backdrop-blur-md border border-[#CBD5E1] px-2.5 sm:px-4 py-2 shadow-[0_8px_24px_-12px_rgba(6,17,56,0.12)]"
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((s, idx) => {
          const IconComponent = s.icon;
          const isCurrent = s.num === currentStep;
          const isDone = s.num < currentStep;
          return (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => onSelectStep?.(s.num)}
                className={`group flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[#0057FF] text-white font-extrabold shadow-xs'
                    : isDone
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-bold hover:bg-[#D1FAE5]'
                    : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] font-semibold hover:border-[#94A3B8] hover:text-[#061138]'
                }`}
              >
                <span
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full inline-flex items-center justify-center shrink-0 text-[10px] ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-[#10B981] text-white'
                      : 'bg-white text-[#475569] border border-[#CBD5E1]'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  ) : (
                    <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  )}
                </span>
                <span className="sm:hidden">{s.shortLabel}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>

              {idx < steps.length - 1 ? (
                <div
                  className={`h-0.5 flex-1 min-w-[6px] rounded-full transition-colors ${
                    s.num < currentStep ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'
                  }`}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

/** ۱. صفحه ورود مشتری / مدیر سالن / مدیر کل با رابط یکپارچه جدید تایم تو (/login) */
export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authUser, logoutUser } = usePrototypeData();

  const rawRedirect = searchParams.get('redirect') || '';
  const safeRedirectPath =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '';
  const roleParam = searchParams.get('role');
  const defaultRole =
    roleParam === 'BUSINESS_OWNER' ? 'BUSINESS_OWNER' : 'CUSTOMER';
  const screenParam = searchParams.get('mode');
  const initialScreen =
    screenParam === 'register'
      ? roleParam === 'BUSINESS_OWNER'
        ? 'REGISTER_STEP_1_PHONE'
        : 'ROLE_PICKER'
      : 'LOGIN';

  return (
    <div className="max-w-lg mx-auto my-4 sm:my-8 space-y-4">
      {authUser ? (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-extrabold text-[#061138]">
              واردشده با حساب: {authUser.fullName} ({authUser.phone})
            </p>
            <p className="text-[11px] text-[#059669] mt-0.5">
              نشست شما فعال است و در مراجعات بعدی خودکار شناسایی می‌شوید.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(
                  authUser.roles.includes('BUSINESS_OWNER') ? '/app' : '/me'
                )
              }
            >
              ورود به پنل من
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void logoutUser()}
            >
              خروج
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-[32px] border border-[#CBD5E1] bg-gradient-to-b from-[#EFF6FF] via-[#F8FAFC] to-white p-5 sm:p-8 shadow-[0_20px_50px_-20px_rgba(6,17,56,0.18)]">
        <TimetoUnifiedAuthCard
          initialScreen={initialScreen}
          defaultRole={defaultRole}
          redirectTo={safeRedirectPath || undefined}
        />
      </div>
    </div>
  );
};

/** ۲. انتخاب خدمت (تکی یا چندگانه)، متخصص، تاریخ و زمان رزرو (/booking/:businessSlug) */
export const BookingStepPage: React.FC = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    dataMode,
    authUser,
    openAuthModal,
    businesses,
    services,
    specialists,
    bookingDraft,
    updateBookingDraft,
  } = usePrototypeData();

  const handleProceedToConfirm = () => {
    if (!authUser) {
      openAuthModal({
        initialScreen: 'LOGIN',
        defaultRole: 'CUSTOMER',
        redirectTo: '/booking/confirm',
        promptReason: 'برای تکمیل و ثبت نهایی نوبت، وارد حساب کاربری خود شوید',
      });
      return;
    }
    navigate('/booking/confirm');
  };

  const [serviceCatFilter, setServiceCatFilter] = useState<string>('ALL');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');
  const [activeStepIndicator, setActiveStepIndicator] = useState<1 | 2 | 3>(1);

  const business =
    businesses.find((b) => b.slug === businessSlug || b.id === businessSlug) ??
    (dataMode === 'mock' ? businesses[0] : undefined);

  const bizServices = business
    ? services.filter(
        (s) => s.businessId === business.id && s.isActive !== false
      )
    : [];
  const bizSpecialists = business
    ? specialists.filter(
        (sp) => sp.businessId === business.id && sp.isActive !== false
      )
    : [];

  const serviceCategories = Array.from(
    new Set(bizServices.map((s) => s.category))
  );
  const normalizedServiceQ = serviceSearchQuery.trim().toLowerCase();
  const visibleServices = bizServices.filter((s) => {
    const matchesCat =
      serviceCatFilter === 'ALL' || s.category === serviceCatFilter;
    const matchesQ =
      !normalizedServiceQ ||
      s.title.toLowerCase().includes(normalizedServiceQ) ||
      s.description.toLowerCase().includes(normalizedServiceQ) ||
      s.category.toLowerCase().includes(normalizedServiceQ);
    return matchesCat && matchesQ;
  });

  const [realSlots, setRealSlots] = useState<TimeSlotAvailabilityItem[] | null>(
    null
  );
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  const upcomingDays = getUpcomingJalaliDays(14);

  useEffect(() => {
    if (!business) return;
    const srvParam = searchParams.get('service');
    const spcParam = searchParams.get('specialist');
    const stepParam = searchParams.get('step');

    const existingValidServiceIds = (bookingDraft.serviceIds ?? []).filter(
      (id) => bizServices.some((s) => s.id === id)
    );

    const defaultSrv =
      srvParam && bizServices.some((s) => s.id === srvParam)
        ? srvParam
        : existingValidServiceIds[0] ?? (bizServices[0]?.id ?? '');

    const nextServiceIds =
      srvParam && bizServices.some((s) => s.id === srvParam)
        ? [srvParam]
        : existingValidServiceIds.length > 0
        ? existingValidServiceIds
        : defaultSrv
        ? [defaultSrv]
        : [];

    const defaultSpc =
      spcParam && bizSpecialists.some((sp) => sp.id === spcParam)
        ? spcParam
        : bizSpecialists.some((sp) => sp.id === bookingDraft.specialistId)
        ? bookingDraft.specialistId
        : (bizSpecialists[0]?.id ?? '');

    const validDate = upcomingDays.some(
      (d) => d.date === bookingDraft.dateJalali
    )
      ? bookingDraft.dateJalali
      : (upcomingDays[0]?.date ?? bookingDraft.dateJalali);

    updateBookingDraft({
      businessSlug: business.slug,
      serviceId: defaultSrv,
      serviceIds: nextServiceIds,
      specialistId: defaultSpc,
      dateJalali: validDate,
    });

    if (stepParam === '1' || stepParam === '2' || stepParam === '3') {
      const targetStep = Number(stepParam) as 1 | 2 | 3;
      setActiveStepIndicator(targetStep);
    }
  }, [business?.slug, bizServices.length, bizSpecialists.length]);

  const selectedServicesSummary = computeSelectedServicesSummary(
    bizServices,
    bookingDraft.serviceIds,
    bookingDraft.serviceId
  );
  const selectedServiceIds = selectedServicesSummary.services.map((s) => s.id);
  const primarySelectedService =
    selectedServicesSummary.services[0] ?? bizServices[0];

  const selectedSpecialist =
    bizSpecialists.find((sp) => sp.id === bookingDraft.specialistId) ??
    bizSpecialists[0];

  const handleToggleService = (serviceId: string) => {
    const exists = selectedServiceIds.includes(serviceId);
    let nextIds: string[];
    if (exists) {
      nextIds =
        selectedServiceIds.length > 1
          ? selectedServiceIds.filter((id) => id !== serviceId)
          : selectedServiceIds;
    } else {
      nextIds = [...selectedServiceIds, serviceId];
    }
    updateBookingDraft({
      serviceIds: nextIds,
      serviceId: nextIds[0] ?? serviceId,
    });
  };

  const handleNavigateStep = (step: 1 | 2 | 3 | 4) => {
    if (step === 4) {
      handleProceedToConfirm();
      return;
    }
    setActiveStepIndicator(step);
  };

  useEffect(() => {
    if (dataMode !== 'real' || !business) {
      setRealSlots(null);
      return;
    }
    let cancelled = false;
    setIsLoadingSlots(true);
    void realApiClient
      .fetchBusinessAvailability(business.slug, {
        dateJalali: bookingDraft.dateJalali,
        serviceId: primarySelectedService?.id,
        specialistId: selectedSpecialist?.id,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.data?.slots) {
          setRealSlots(res.data.slots);
          const currentSelected = res.data.slots.find(
            (s) => s.time === bookingDraft.timeSlot && s.available
          );
          if (!currentSelected) {
            const firstAvailable = res.data.slots.find((s) => s.available);
            if (firstAvailable) {
              updateBookingDraft({ timeSlot: firstAvailable.time });
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRealSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    dataMode,
    business?.slug,
    bookingDraft.dateJalali,
    primarySelectedService?.id,
    selectedSpecialist?.id,
  ]);

  if (!business) {
    return (
      <div className="my-8">
        <EmptyState
          title="مرکز زیبایی مورد نظر یافت نشد"
          description="ممکن است این مرکز هنوز تایید نشده باشد یا آدرس واردشده معتبر نباشد."
        />
      </div>
    );
  }

  const mockTimeSlotOptions: TimeSlotAvailabilityItem[] = [
    { time: '۰۹:۳۰', available: true },
    { time: '۱۰:۳۰', available: false, reason: 'پر شده' },
    { time: '۱۱:۰۰', available: true },
    { time: '۱۳:۳۰', available: true },
    { time: '۱۴:۳۰', available: false, reason: 'پر شده' },
    { time: '۱۵:۳۰', available: true },
    { time: '۱۷:۰۰', available: true },
  ];

  const timeSlotOptions: TimeSlotAvailabilityItem[] =
    dataMode === 'real' ? (realSlots ?? []) : mockTimeSlotOptions;

  const selectedDayIdx = Math.max(
    0,
    upcomingDays.findIndex((d) => d.date === bookingDraft.dateJalali)
  );
  const selectedDayObj = upcomingDays[selectedDayIdx] ?? upcomingDays[0];
  const salonAvatar =
    business.avatarUrl && business.avatarUrl.trim()
      ? business.avatarUrl
      : getBeautyPhotoUrl(business.name, business.typeLabel);

  return (
    <div className="max-w-4xl mx-auto pb-20 lg:pb-8">
      {/* هدر فشرده اطلاعات سالن */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={salonAvatar}
            alt={business.name}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-[#CBD5E1] shadow-2xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#475569]">
              <Link
                to={`/salon/${business.slug}`}
                className="hover:text-[#0057FF] font-bold"
              >
                {business.name}
              </Link>
              <span>/</span>
              <span>رزرو نوبت آنلاین</span>
            </div>
            <h1 className="text-sm sm:text-xl font-extrabold text-[#061138]">
              رزرو نوبت در {business.name}
            </h1>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0E7FF] text-[#0057FF] text-xs font-extrabold">
          <MapPin className="w-3.5 h-3.5" />
          <span>{business.neighborhood}</span>
        </span>
      </div>

      {business.isSampleShowcase ? (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] text-[#92400E] flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="font-extrabold">
            این سالن یک «نمونه نمایشی پلتفرم» است (مراحل زیر صرفاً جهت آشنایی نمایش داده می‌شود).
          </p>
          <Link to={`/salon/${business.slug}`}>
            <Button variant="outline" size="sm">
              بازگشت به پروفایل
            </Button>
          </Link>
        </div>
      ) : null}

      {/* نوار مرحله‌به‌مرحله بدون اسکرول عمودی */}
      <BookingFlowStepIndicator
        currentStep={activeStepIndicator}
        onSelectStep={handleNavigateStep}
      />

      {/* گام ۱: انتخاب خدمت (بدون اسکرول خوردن کل صفحه — مجهز به فیلتر دسته و جست‌وجوی سریع برای سالن‌ها و مراکز لیزر با ۲۰+ خدمت) */}
      {activeStepIndicator === 1 ? (
        <Card id="booking-step-1" className="rounded-3xl space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CBD5E1] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                ۱
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                  انتخاب خدمت یا پکیج مورد نظر
                </h2>
                <p className="text-[11px] text-[#475569]">
                  یک یا چند مورد را انتخاب کنید و دکمه «مرحله بعد» را بزنید
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#E0E7FF] text-[#0057FF] text-xs font-extrabold tabular-nums">
              {toPersianDigits(selectedServiceIds.length)} مورد انتخاب‌شده
            </span>
          </div>

          {/* نوار جست‌وجو و دسته‌بندی سریع خدمات برای جلوگیری از شلوغی در مراکز پرخدمت (مثل مراکز لیزر) */}
          {bizServices.length > 5 || serviceCategories.length > 1 ? (
            <div className="space-y-2">
              {bizServices.length > 5 ? (
                <div className="relative">
                  <input
                    type="text"
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    placeholder="جست‌وجوی سریع نام خدمت یا ناحیه (مثلاً فول بادی، توتال، بیکینی، فیشیال...)"
                    className="w-full rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] py-2 pr-3.5 pl-8 text-xs font-bold text-[#061138] placeholder:text-[#64748B] focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  {serviceSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setServiceSearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#061138] cursor-pointer"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              ) : null}

              {serviceCategories.length > 1 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setServiceCatFilter('ALL')}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                      serviceCatFilter === 'ALL'
                        ? 'bg-[#0057FF] text-white'
                        : 'bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]'
                    }`}
                  >
                    همه ({toPersianDigits(bizServices.length)})
                  </button>
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setServiceCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap cursor-pointer transition-colors ${
                        serviceCatFilter === cat
                          ? 'bg-[#0057FF] text-white'
                          : 'bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* کادر جمع‌وجور ۲ ستونه با اسکرول داخلی محدود تا کل صفحه اسکرول نخورد */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {visibleServices.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv.id);
              return (
                <div
                  key={srv.id}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => handleToggleService(srv.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleService(srv.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all select-none flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'border-[#0057FF] bg-[#EFF6FF] ring-2 ring-[#0057FF]/15 shadow-2xs'
                      : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-lg border-2 inline-flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0057FF] border-[#0057FF] text-white'
                          : 'bg-white border-[#94A3B8] text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-extrabold text-[#061138] leading-snug truncate">
                        {srv.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#475569] mt-1 tabular-nums">
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#334155] font-bold">
                          {srv.category}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-[#0057FF]" />
                          {formatDurationMinutes(srv.durationMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-[#0057FF] tabular-nums shrink-0">
                    {formatPriceToman(srv.priceToman)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* نوار پایین گام ۱: جمع انتخاب‌شده‌ها و دکمه رفتن به مرحله ۲ (متخصص) */}
          <div className="pt-3 border-t border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs flex items-center justify-between sm:justify-start gap-1">
              <span className="text-[#64748B] font-semibold">مجموع انتخاب شما: </span>
              <strong className="font-black text-[#061138] tabular-nums">
                {toPersianDigits(selectedServiceIds.length)} خدمت ·{' '}
                <span className="text-[#0057FF]">
                  {formatPriceToman(selectedServicesSummary.totalPriceToman)}
                </span>
              </strong>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto justify-center"
              onClick={() => setActiveStepIndicator(2)}
            >
              <span>مرحله بعد: انتخاب متخصص</span>
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </Button>
          </div>
        </Card>
      ) : null}

      {/* گام ۲: انتخاب متخصص */}
      {activeStepIndicator === 2 ? (
        <Card id="booking-step-2" className="rounded-3xl space-y-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CBD5E1] pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                ۲
              </span>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-[#061138] truncate">
                  انتخاب متخصص یا اپراتور
                </h2>
                <p className="text-[11px] text-[#475569] truncate">
                  روی متخصص مورد نظر بزنید یا دکمه مرحله بعد را انتخاب کنید
                </p>
              </div>
            </div>
            <span className="text-xs text-[#0057FF] font-extrabold truncate max-w-[140px] sm:max-w-none">
              {selectedSpecialist?.fullName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {bizSpecialists.map((sp) => {
              const isSelected = selectedSpecialist?.id === sp.id;
              const spAvatar =
                sp.avatarUrl && sp.avatarUrl.trim()
                  ? sp.avatarUrl
                  : getSpecialistAvatarUrl(sp.fullName, sp.roleTitle);
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => {
                    updateBookingDraft({ specialistId: sp.id });
                    setActiveStepIndicator(3);
                  }}
                  className={`p-3.5 rounded-2xl border text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'border-[#0057FF] bg-[#EFF6FF] ring-2 ring-[#0057FF]/15 shadow-2xs'
                      : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <img
                        src={spAvatar}
                        alt={sp.fullName}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isSelected ? (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0057FF] text-white flex items-center justify-center shadow-2xs">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-0.5 min-w-0 w-full">
                    <p className="text-xs sm:text-sm font-extrabold text-[#061138] truncate">
                      {sp.fullName}
                    </p>
                    <p className="text-[11px] font-bold text-[#0057FF] truncate">
                      {sp.roleTitle}
                    </p>
                    <p className="text-[11px] text-[#475569] tabular-nums pt-0.5 inline-flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>
                        {toPersianDigits(sp.rating)} ·{' '}
                        {toPersianDigits(sp.experienceYears)} سال
                      </span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#CBD5E1] grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto justify-center"
              onClick={() => setActiveStepIndicator(1)}
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
              <span>مرحله قبل</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto justify-center"
              onClick={() => setActiveStepIndicator(3)}
            >
              <span>مرحله بعد: زمان</span>
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </Button>
          </div>
        </Card>
      ) : null}

      {/* گام ۳: انتخاب روز و ساعت مراجعه (فشرده و بدون نیاز به اسکرول طولانی) */}
      {activeStepIndicator === 3 ? (
        <Card id="booking-step-3" className="rounded-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CBD5E1] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                ۳
              </span>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                  انتخاب روز و ساعت مراجعه
                </h2>
                <p className="text-[11px] text-[#475569]">
                  روز و ساعت دلخواه را انتخاب کنید تا وارد تب تایید نهایی شوید
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#0057FF] text-xs font-extrabold tabular-nums">
              {selectedDayObj ? selectedDayObj.fullLabel : bookingDraft.dateJalali} · ساعت{' '}
              {bookingDraft.timeSlot}
            </span>
          </div>

          {/* نوار افقی روزهای ۲ هفته آینده بدون اشغال ارتفاع صفحه */}
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold text-[#061138] block">
              ۱. انتخاب روز ({selectedDayObj?.monthNamePersian} {selectedDayObj?.yearPersian}):
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
              {upcomingDays.map((dayItem, idx) => {
                const isSelected = bookingDraft.dateJalali === dayItem.date;
                const isFriday = dayItem.dayName === 'جمعه';
                return (
                  <button
                    key={dayItem.date}
                    type="button"
                    onClick={() =>
                      updateBookingDraft({ dateJalali: dayItem.date })
                    }
                    className={`w-16 sm:w-20 shrink-0 py-2 px-1.5 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer tabular-nums ${
                      isSelected
                        ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-sm'
                        : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold ${
                        isSelected
                          ? 'text-[#00E5FF]'
                          : isFriday
                            ? 'text-rose-500'
                            : 'text-[#64748B]'
                      }`}
                    >
                      {idx === 0
                        ? 'امروز'
                        : idx === 1
                          ? 'فردا'
                          : dayItem.dayName}
                    </span>
                    <span className="text-sm sm:text-base font-black">
                      {dayItem.dayNumberPersian}
                    </span>
                    <span
                      className={`text-[9px] font-semibold ${
                        isSelected ? 'text-white/85' : 'text-[#64748B]'
                      }`}
                    >
                      {dayItem.monthNamePersian}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ساعت‌های قابل انتخاب */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-[#061138] block">
              ۲. انتخاب ساعت مراجعه:
            </span>

            {isLoadingSlots ? (
              <div className="py-5 flex items-center justify-center gap-2 text-xs text-[#475569]">
                <Loader2 className="w-4 h-4 animate-spin text-[#0057FF]" />
                <span>در حال دریافت زمان‌های آزاد...</span>
              </div>
            ) : timeSlotOptions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-center text-xs text-[#475569]">
                در این تاریخ ظرفیت خالی وجود ندارد. لطفاً روز دیگری را انتخاب کنید.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlotOptions.map((slot) => {
                  const isSelected =
                    slot.available && bookingDraft.timeSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => {
                        if (slot.available) {
                          updateBookingDraft({ timeSlot: slot.time });
                        }
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs tabular-nums border transition-all flex items-center justify-between ${
                        !slot.available
                          ? 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] opacity-65 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-[#0057FF] text-white border-[#0057FF] font-extrabold shadow-xs cursor-pointer'
                          : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF] font-bold cursor-pointer'
                      }`}
                    >
                      <span>ساعت {slot.time}</span>
                      {!slot.available ? (
                        <span className="text-[10px] no-underline font-normal">
                          {slot.reason || 'پر'}
                        </span>
                      ) : isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#CBD5E1] grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto justify-center"
              onClick={() => setActiveStepIndicator(2)}
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
              <span>مرحله قبل</span>
            </Button>

            {business.isSampleShowcase ? (
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 text-xs font-extrabold text-center">
                نمونه نمایشی
              </span>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto justify-center"
                onClick={handleProceedToConfirm}
              >
                <span>ادامه به تایید نهایی</span>
                <ArrowLeft className="w-4 h-4 shrink-0" />
              </Button>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
};

/** ۳. بازبینی و تایید اطلاعات رزرو (/booking/confirm) */
export const BookingConfirmPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    dataMode,
    authUser,
    businesses,
    services,
    specialists,
    bookingDraft,
    updateBookingDraft,
    updateBusinessProfile,
    submitBooking,
  } = usePrototypeData();

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payDepositOnline, setPayDepositOnline] = useState(true);

  const business =
    businesses.find((b) => b.slug === bookingDraft.businessSlug) ??
    (dataMode === 'mock' ? businesses[0] : undefined);

  const bizServices = business
    ? services.filter((s) => s.businessId === business.id)
    : services;

  const selectedServicesSummary = computeSelectedServicesSummary(
    bizServices.length > 0 ? bizServices : services,
    bookingDraft.serviceIds,
    bookingDraft.serviceId
  );
  const service =
    selectedServicesSummary.services[0] ??
    (dataMode === 'mock' ? services[0] : undefined);
  const specialist =
    specialists.find((sp) => sp.id === bookingDraft.specialistId) ??
    (dataMode === 'mock' ? specialists[0] : undefined);

  if (!business || !service || !specialist) {
    return (
      <div className="my-8">
        <EmptyState
          title="اطلاعات نوبت انتخابی کامل نیست"
          description="لطفاً ابتدا از صفحه سالن، خدمت و متخصص مورد نظر خود را انتخاب کنید."
        />
      </div>
    );
  }

  const isDepositActive = Boolean(business.depositEnabled);
  const depositPercent = business.depositPercent || 30;
  const depositAmountToman = isDepositActive
    ? Math.round((selectedServicesSummary.totalPriceToman * depositPercent) / 100)
    : 0;
  const remainingInSalonToman = Math.max(
    0,
    selectedServicesSummary.totalPriceToman -
      (isDepositActive && payDepositOnline ? depositAmountToman : 0)
  );

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dataMode === 'real' && !authUser) {
      setFormError(
        'برای ثبت نهایی نوبت، لطفاً ابتدا با شماره موبایل خود وارد شوید.'
      );
      return;
    }
    if (
      !bookingDraft.customerName.trim() ||
      bookingDraft.customerName.trim().length < 2
    ) {
      setFormError('لطفاً نام و نام خانوادگی مراجع را کامل وارد کنید.');
      return;
    }
    if (!/^09\d{9}$/.test(bookingDraft.customerPhone.trim())) {
      setFormError('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.');
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      await submitBooking();
      if (isDepositActive && payDepositOnline && depositAmountToman > 0) {
        updateBusinessProfile(business.id, {
          walletBalanceToman:
            (business.walletBalanceToman ?? 0) + depositAmountToman,
        });
      }
      navigate('/booking/result');
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'خطا در ثبت نوبت. لطفاً ساعت یا متخصص دیگری را انتخاب کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg sm:text-2xl font-extrabold text-[#061138]">
          بازبینی خلاصه نوبت و ثبت نهایی
        </h1>
        <p className="text-xs text-[#475569] mt-1">
          برای بازگشت به هر مرحله، روی آیکون همان مرحله در نوار بالا کلیک کنید.
        </p>
      </div>

      <BookingFlowStepIndicator
        currentStep={4}
        onSelectStep={(step) => {
          if (step < 4) {
            navigate(`/booking/${business.slug}?step=${step}`);
          }
        }}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {dataMode === 'real' && !authUser ? (
          <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-wrap items-center justify-between gap-3 text-xs text-[#92400E]">
            <span className="font-bold">
              برای ثبت قطعی نوبت، ابتدا با شماره موبایل خود وارد شوید.
            </span>
            <Link to={`/login?redirect=${encodeURIComponent('/booking/confirm')}`}>
              <Button variant="primary" size="sm">
                ورود سریع با موبایل
              </Button>
            </Link>
          </div>
        ) : null}

        {/* کارت آبی‌رنگ خلاصه نوبت انتخابی در تب آخر (تایید نهایی) */}
        <Card
          variant="dark"
          className="rounded-3xl space-y-4 bg-gradient-to-br from-[#061138] via-[#0B1E5B] to-[#0057FF] border border-[#00E5FF]/30 shadow-[0_20px_48px_-16px_rgba(6,17,56,0.55)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3.5">
            <div className="flex items-center gap-3">
              <img
                src={
                  business.avatarUrl && business.avatarUrl.trim()
                    ? business.avatarUrl
                    : getBeautyPhotoUrl(business.name, business.typeLabel)
                }
                alt={business.name}
                className="w-11 h-11 rounded-2xl object-cover border border-white/25 shrink-0"
              />
              <div>
                <span className="text-[11px] font-extrabold text-[#00E5FF] block">
                  خلاصه نوبت انتخابی
                </span>
                <h2 className="text-sm sm:text-base font-black text-white">
                  {business.name} ({business.neighborhood})
                </h2>
              </div>
            </div>
            <Link
              to={`/booking/${business.slug}?step=1`}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold transition-colors"
            >
              ویرایش انتخاب‌ها
            </Link>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <span className="text-slate-300 text-xs block">
                خدمات انتخاب‌شده ({toPersianDigits(selectedServicesSummary.services.length)} مورد):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedServicesSummary.services.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-xl bg-white/12 border border-white/20 text-xs font-extrabold text-white"
                  >
                    {s.title} ({formatPriceToman(s.priceToman)})
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15">
              <div>
                <span className="text-slate-300 text-xs block">متخصص انتخابی:</span>
                <span className="font-extrabold text-white mt-0.5 block">
                  {specialist.fullName}
                </span>
              </div>
              <div>
                <span className="text-slate-300 text-xs block">مجموع زمان:</span>
                <span className="font-extrabold text-white tabular-nums mt-0.5 block">
                  {formatDurationMinutes(
                    selectedServicesSummary.totalDurationMinutes
                  )}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/12 border border-[#00E5FF]/35 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#00E5FF]">
                تاریخ و ساعت مراجعه:
              </span>
              <span className="text-xs sm:text-sm font-black text-white tabular-nums">
                {bookingDraft.dateJalali} — ساعت {bookingDraft.timeSlot}
              </span>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between">
              <span className="text-slate-200 font-bold">مبلغ کل خدمات:</span>
              <span className="text-base sm:text-lg font-black text-[#00E5FF] tabular-nums">
                {formatPriceToman(selectedServicesSummary.totalPriceToman)}
              </span>
            </div>
          </div>

          {isDepositActive ? (
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-[#00E5FF]">
                  پرداخت بیعانه آنلاین سالن ({toPersianDigits(depositPercent)}٪ مبلغ خدمت)
                </span>
                <span className="font-black text-white text-sm tabular-nums">
                  {formatPriceToman(depositAmountToman)}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed">
                مبلغ بیعانه مستقیماً در کیف پول اختصاصی سالن «{business.name}» ثبت شده و از صورت‌حساب حضوری شما کسر می‌گردد. باقی‌مانده قابل پرداخت در سالن:{' '}
                <strong className="tabular-nums text-white">
                  {formatPriceToman(remainingInSalonToman)}
                </strong>
              </p>
              <label className="inline-flex items-center gap-2 font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={payDepositOnline}
                  onChange={(e) => setPayDepositOnline(e.target.checked)}
                  className="accent-[#00E5FF] w-4 h-4"
                />
                <span>پرداخت همزمان بیعانه و قطعی‌سازی آنی نوبت</span>
              </label>
            </div>
          ) : null}
        </Card>

        <Card padding="lg" className="rounded-3xl">
          <form
            onSubmit={handleConfirmBooking}
            className="space-y-5"
            noValidate
          >
            <h2 className="text-base font-extrabold text-[#061138] border-b border-[#CBD5E1] pb-3">
              ۲. مشخصات مراجع
            </h2>

            {formError ? (
              <p
                role="alert"
                className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#EF4444]"
              >
                {formError}
              </p>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="bk-cust-name"
                label="نام و نام خانوادگی مراجع"
                required
              >
                <Input
                  id="bk-cust-name"
                  value={bookingDraft.customerName}
                  onChange={(e) =>
                    updateBookingDraft({ customerName: e.target.value })
                  }
                />
              </FormField>

              <FormField
                id="bk-cust-phone"
                label="شماره همراه جهت هماهنگی"
                required
              >
                <Input
                  id="bk-cust-phone"
                  dir="ltr"
                  value={bookingDraft.customerPhone}
                  onChange={(e) =>
                    updateBookingDraft({ customerPhone: e.target.value })
                  }
                />
              </FormField>
            </div>

            <FormField
              id="bk-cust-notes"
              label="توضیحات برای سالن یا متخصص"
              optionalLabel="اختیاری"
            >
              <Textarea
                id="bk-cust-notes"
                rows={2}
                value={bookingDraft.customerNotes}
                onChange={(e) =>
                  updateBookingDraft({ customerNotes: e.target.value })
                }
                placeholder="مثلاً حساسیت پوستی یا نکته خاص درباره خدمت..."
              />
            </FormField>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>
                با ثبت نهایی، نوبت شما بلافاصله از طریق پیامک و اعلان پنل به اطلاع صاحب کسب‌وکار می‌رسد تا تایید شود. همچنین شماره تماس مستقیم سالن در رسید نهایی نمایش داده خواهد شد.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link to={`/booking/${business.slug}`}>
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به مرحله قبل</span>
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
              >
                <span>
                  {isDepositActive && payDepositOnline
                    ? `پرداخت بیعانه (${formatPriceToman(depositAmountToman)}) و ثبت نوبت`
                    : 'ثبت نهایی نوبت'}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

/** ۴. نتیجه رزرو (/booking/result) */
export const BookingResultPage: React.FC = () => {
  const { bookingDraft, businesses, services, specialists } =
    usePrototypeData();
  const business =
    businesses.find((b) => b.slug === bookingDraft.businessSlug) ??
    businesses[0];
  const bizServices = business
    ? services.filter((s) => s.businessId === business.id)
    : services;
  const selectedServicesSummary = computeSelectedServicesSummary(
    bizServices.length > 0 ? bizServices : services,
    bookingDraft.serviceIds,
    bookingDraft.serviceId
  );
  const specialist =
    specialists.find((sp) => sp.id === bookingDraft.specialistId) ??
    specialists[0];

  const cleanSalonPhone = (business?.phoneDisplay || business?.ownerPhone || '09131234567')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^\d+]/g, '');

  return (
    <div>
      <PageHeader
        kicker="رزرو آنلاین نوبت · رسید نوبت"
        title="نوبت شما با موفقیت ثبت شد"
        subtitle="درخواست نوبت شما بلافاصله برای صاحب کسب‌وکار ارسال شد و از طریق بخش «نوبت‌های من» قابل مشاهده است."
        breadcrumbs={[
          { label: 'تایید نوبت', href: '/booking/confirm' },
          { label: 'رسید رزرو' },
        ]}
      />

      <Card padding="lg" className="max-w-2xl mx-auto rounded-3xl space-y-6">
        <div className="text-center space-y-2.5 pb-4 border-b border-[#CBD5E1]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] text-[#10B981] mb-1">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <StatusBadge
              label="ثبت شد · ارسال‌شده برای تایید سالن"
              tone="success"
            />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#061138] pt-1">
            نوبت شما در تقویم «{business?.name ?? 'سالن'}» ثبت گردید
          </h2>
          <p className="text-xs text-[#475569] max-w-md mx-auto leading-relaxed">
            پیامک و اعلان فوری نوبت برای صاحب کسب‌وکار ارسال شد تا نوبت شما را تایید کند.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
            <span className="text-[#475569]">مرکز زیبایی:</span>
            <span className="font-bold text-[#061138]">
              {business
                ? `${business.name} (${business.city})`
                : bookingDraft.businessSlug}
            </span>
          </div>
          <div className="flex justify-between gap-3 py-1.5 border-b border-[#CBD5E1]">
            <span className="text-[#475569] shrink-0">خدمات و متخصص:</span>
            <span className="font-bold text-[#061138] text-left">
              {selectedServicesSummary.combinedTitle || '—'} ·{' '}
              {specialist?.fullName ?? '—'}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
            <span className="text-[#475569]">زمان مراجعه:</span>
            <span className="font-bold text-[#0057FF] tabular-nums">
              {bookingDraft.dateJalali} ساعت {bookingDraft.timeSlot}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
            <span className="text-[#475569]">نام مراجع:</span>
            <span className="font-bold text-[#061138]">
              {bookingDraft.customerName}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-[#475569]">جمع مبلغ خدمات:</span>
            <span className="font-bold text-[#0057FF] tabular-nums">
              {formatPriceToman(selectedServicesSummary.totalPriceToman)}
            </span>
          </div>
        </div>

        {/* نمایش شماره تماس مستقیم سالن فقط پس از ثبت نوبت (اختیاری جهت اطمینان مشتری) */}
        {business ? (
          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-extrabold text-[#061138]">
                شماره تماس مستقیم «{business.name}» (اختیاری)
              </p>
              <p className="text-[11px] text-[#475569] leading-relaxed">
                نوبت شما در سیستم ثبت شده است؛ در صورت تمایل برای هماهنگی یا اطمینان بیشتر می‌توانید با سالن تماس بگیرید:
              </p>
            </div>
            <a
              href={`tel:${cleanSalonPhone}`}
              className="px-4 py-2.5 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white font-extrabold inline-flex items-center gap-2 shrink-0 shadow-xs transition-colors"
            >
              <span dir="ltr" className="font-mono text-xs">
                {business.phoneDisplay || business.ownerPhone}
              </span>
              <span>· تماس با سالن</span>
            </a>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/me/appointments">
            <Button variant="primary" size="lg">
              <span>مشاهده در «نوبت‌های من»</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg">
              بازگشت به صفحه اصلی
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

/** ۵. خلاصه حساب مشتری (/me) */
export const CustomerOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    dataMode,
    authUser,
    logoutUser,
    appointments,
    businesses,
    specialists,
    favoriteBusinessIds,
    favoriteSpecialistIds,
    toggleFavoriteBusiness,
    toggleFavoriteSpecialist,
  } = usePrototypeData();

  const myAppointments = appointments.filter((a) => {
    if (!authUser) return a.id.startsWith('apt-live-');
    return (
      a.customerName === authUser.fullName ||
      a.id.startsWith('apt-live-')
    );
  });

  const upcomingCount = myAppointments.filter(
    (a) =>
      a.status === AppointmentStatus.Confirmed ||
      a.status === AppointmentStatus.Pending
  ).length;
  const completedCount = myAppointments.filter(
    (a) => a.status === AppointmentStatus.Completed
  ).length;
  const loyaltyPoints = myAppointments.length * 150;

  const favoriteBusinesses = businesses.filter((b) =>
    favoriteBusinessIds.includes(b.id)
  );
  const favoriteSpecialists = specialists.filter((sp) =>
    favoriteSpecialistIds.includes(sp.id)
  );
  const totalFavoritesCount =
    favoriteBusinesses.length + favoriteSpecialists.length;

  const displayName = authUser?.fullName?.trim() || 'کاربر تایم تو';
  const displayPhoneCity = authUser
    ? `${toPersianDigits(authUser.phone)} · ${authUser.defaultCity || 'اصفهان'}`
    : 'برای مشاهده و مدیریت نوبت‌ها وارد حساب خود شوید';

  return (
    <div className="space-y-5">
      {/* هدر پروفایل مشتری با آواتار، دکمه ویرایش و دکمه خروج */}
      <Card className="rounded-[28px] p-5 sm:p-7 border border-[#CBD5E1] bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-4">
            <Avatar name={displayName} size="xl" tone="rose" showPhoto={false} />
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[11px] font-bold">
                <Award className="w-3.5 h-3.5 text-[#0057FF]" />
                <span>
                  {completedCount > 0 ? 'عضو باشگاه مشتریان' : 'حساب کاربری فعال'}
                </span>
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#061138]">
                {displayName}
              </h1>
              <p className="text-xs text-[#64748B] tabular-nums">
                {displayPhoneCity}
              </p>
              <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Link to="/search">
                  <Button variant="primary" size="sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>رزرو نوبت</span>
                  </Button>
                </Link>
                <Link to="/me/profile">
                  <Button variant="outline" size="sm">
                    ویرایش نام و شماره
                  </Button>
                </Link>
                {authUser ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void logoutUser();
                      navigate('/');
                    }}
                    className="text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج از حساب</span>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {/* کارت ۲ ستونی امتیاز و نوبت‌ها */}
          <div className="lg:col-span-5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] p-4 grid grid-cols-2 gap-3 text-center">
            <div className="border-l border-[#CBD5E1] pl-3 space-y-0.5">
              <span className="text-[11px] font-bold text-[#0057FF] block">
                امتیاز وفاداری
              </span>
              <p className="text-2xl font-extrabold text-[#0057FF] tabular-nums">
                {toPersianDigits(loyaltyPoints)}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-[#64748B] block">
                نوبت‌های انجام‌شده
              </span>
              <p className="text-2xl font-extrabold text-[#061138] tabular-nums">
                {toPersianDigits(completedCount)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* آیتم کوچک نصب اپ در پروفایل (اگر قبلاً نصب شده باشد خودکار مخفی است) */}
      <PWAProfileInstallRow variant="card" />

      {dataMode === 'real' && !authUser ? (
        <Card className="rounded-3xl flex flex-wrap items-center justify-between gap-4 bg-[#FFFBEB] border-[#FDE68A]">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#92400E]">
              شما هنوز وارد حساب کاربری خود نشده‌اید
            </p>
            <p className="text-xs text-[#F59E0B]">
              برای مشاهده نوبت‌های ثبت‌شده و مدیریت پروفایل، با شماره موبایل خود
              وارد شوید.
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary" size="sm">
              ورود با شماره موبایل
            </Button>
          </Link>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#6B6480]">نوبت‌های پیش‌رو</h2>
            <StatusBadge label="فعال" tone="primary" />
          </div>
          <p className="text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {toPersianDigits(upcomingCount)} نوبت ثبت‌شده
          </p>
          <Link
            to="/me/appointments"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8B5CF6] hover:underline pt-1"
          >
            <span>مشاهده و مدیریت نوبت‌ها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card className="rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#6B6480]">
              علاقه‌مندی‌های من
            </h2>
            <StatusBadge label="ذخیره در پروفایل" tone="accent" />
          </div>
          <p className="text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
            {toPersianDigits(favoriteBusinesses.length)} سالن ·{' '}
            {toPersianDigits(favoriteSpecialists.length)} متخصص
          </p>
          <Link
            to="/me/favorites"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8B5CF6] hover:underline pt-1"
          >
            <span>مشاهده سالن‌ها و متخصصان منتخب</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card className="rounded-3xl space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#6B6480]">مشخصات کاربری</h2>
            <UserCheck className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <p className="text-sm font-extrabold text-[#1E1B2E]">{displayName}</p>
          <p className="text-xs text-[#6B6480] tabular-nums">
            {displayPhoneCity}
          </p>
          <Link
            to="/me/profile"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#8B5CF6] hover:underline pt-1"
          >
            <span>ویرایش اطلاعات کاربری</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      {/* بخش نمایش سریع علاقه‌مندی‌ها در پروفایل شخصی */}
      {totalFavoritesCount > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#1E1B2E]">
                سالن‌ها و متخصصان ذخیره‌شده در پروفایل شما
              </h2>
              <p className="text-xs text-[#6B6480] mt-0.5">
                دسترسی سریع به مراکز و متخصصانی که نشان کرده‌اید
              </p>
            </div>
            <Link
              to="/me/favorites"
              className="text-xs font-bold text-[#8B5CF6] hover:underline"
            >
              مدیریت همه ({toPersianDigits(totalFavoritesCount)}) ←
            </Link>
          </div>

          {favoriteBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {favoriteBusinesses.slice(0, 3).map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  isFavorite={true}
                  onToggleFavorite={toggleFavoriteBusiness}
                />
              ))}
            </div>
          ) : null}

          {favoriteSpecialists.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 no-scrollbar">
              {favoriteSpecialists.slice(0, 4).map((sp) => (
                <div
                  key={sp.id}
                  className="w-[220px] sm:w-auto shrink-0 snap-start"
                >
                  <ProfessionalCard
                    specialist={sp}
                    isFavorite={true}
                    onToggleFavorite={toggleFavoriteSpecialist}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1E1B2E]">
            نوبت‌های پیش‌رو و اخیر شما
          </h2>
          <Link
            to="/me/appointments"
            className="text-xs font-bold text-[#8B5CF6] hover:underline"
          >
            مشاهده همه نوبت‌ها ←
          </Link>
        </div>
        {myAppointments.length === 0 ? (
          <EmptyState
            title="هنوز نوبتی برای شما ثبت نشده است"
            description="از بخش جست‌وجوی سالن‌ها می‌توانید اولین نوبت خود را به صورت آنلاین رزرو کنید."
          />
        ) : (
          <div className="space-y-3">
            {myAppointments.slice(0, 3).map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** ۶. نوبت‌های من (/me/appointments) */
export const CustomerAppointmentsPage: React.FC = () => {
  const { authUser, appointments, businesses, updateAppointmentStatus } =
    usePrototypeData();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentItem | null>(
    null
  );

  const myAppointments = appointments.filter((a) => {
    if (!authUser) return a.id.startsWith('apt-live-');
    return (
      a.customerName === authUser.fullName ||
      a.id.startsWith('apt-live-')
    );
  });

  const upcomingList = myAppointments.filter(
    (a) =>
      a.status === AppointmentStatus.Confirmed ||
      a.status === AppointmentStatus.Pending
  );
  const historyList = myAppointments.filter(
    (a) =>
      a.status === AppointmentStatus.Completed ||
      a.status === AppointmentStatus.Cancelled ||
      a.status === AppointmentStatus.NoShow
  );

  const displayed = activeTab === 'upcoming' ? upcomingList : historyList;

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="حساب کاربری · مدیریت نوبت‌ها"
        title="نوبت‌های من"
        subtitle="مشاهده جزئیات نوبت‌های پیش‌رو و سوابق مراجعات گذشته"
        breadcrumbs={[
          { label: 'حساب کاربری من', href: '/me' },
          { label: 'نوبت‌های من' },
        ]}
      />

      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'upcoming',
            label: 'نوبت‌های پیش‌رو',
            count: upcomingList.length,
          },
          {
            id: 'history',
            label: 'نوبت‌های گذشته و لغوشده',
            count: historyList.length,
          },
        ]}
      />

      {displayed.length === 0 ? (
        <EmptyState
          title="نوبتی در این بخش وجود ندارد"
          description="می‌توانید از صفحه جست‌وجوی سالن‌ها نوبت جدیدی رزرو کنید."
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onViewDetails={(item) => setSelectedApt(item)}
              onCancelDemo={
                activeTab === 'upcoming'
                  ? (item) => setCancelTarget(item)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedApt)}
        onClose={() => setSelectedApt(null)}
        title="جزئیات نوبت و شماره تماس سالن"
      >
        {selectedApt ? (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">مرکز زیبایی:</span>
              <span className="font-bold text-[#1E1B2E]">
                {selectedApt.businessName}
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
              <span className="font-bold">{selectedApt.specialistName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">تاریخ و ساعت:</span>
              <span className="font-bold tabular-nums">
                {selectedApt.dateJalali} ساعت {selectedApt.timeSlot}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">مبلغ خدمت:</span>
              <span className="font-bold text-[#8B5CF6] tabular-nums">
                {formatPriceToman(selectedApt.priceToman)}
              </span>
            </div>
            {(() => {
              const matchedBiz = businesses.find(
                (b) =>
                  b.id === selectedApt.businessId ||
                  b.slug === selectedApt.businessSlug ||
                  b.name === selectedApt.businessName
              );
              const rawPhone =
                matchedBiz?.phoneDisplay || matchedBiz?.ownerPhone || '';
              if (!rawPhone) return null;
              const dialPhone = rawPhone
                .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                .replace(/[^\d+]/g, '');
              return (
                <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between gap-2 pt-2">
                  <span className="font-bold text-[#061138]">
                    تلفن هماهنگی سالن (اختیاری):
                  </span>
                  <a
                    href={`tel:${dialPhone}`}
                    className="px-3.5 py-1.5 rounded-full bg-[#0057FF] text-white font-extrabold inline-flex items-center gap-1.5"
                  >
                    <span dir="ltr" className="font-mono">
                      {rawPhone}
                    </span>
                    <span>· تماس</span>
                  </a>
                </div>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            updateAppointmentStatus(
              cancelTarget.id,
              AppointmentStatus.Cancelled
            );
          }
        }}
        title="تایید لغو نوبت"
        confirmLabel="بله، نوبت لغو شود"
        message={`آیا مطمئن هستید که می‌خواهید نوبت خدمت «${cancelTarget?.serviceTitle ?? ''}» در ${cancelTarget?.businessName ?? ''} را لغو کنید؟`}
      />
    </div>
  );
};

/** ۷. سالن‌ها و متخصصان منتخب (/me/favorites) */
export const CustomerFavoritesPage: React.FC = () => {
  const {
    businesses,
    specialists,
    favoriteBusinessIds,
    favoriteSpecialistIds,
    toggleFavoriteBusiness,
    toggleFavoriteSpecialist,
  } = usePrototypeData();
  const [activeTab, setActiveTab] = useState<'all' | 'salons' | 'specialists'>(
    'all'
  );

  const favoriteBusinesses = businesses.filter((b) =>
    favoriteBusinessIds.includes(b.id)
  );
  const favoriteSpecialists = specialists.filter((sp) =>
    favoriteSpecialistIds.includes(sp.id)
  );

  const totalCount = favoriteBusinesses.length + favoriteSpecialists.length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="حساب کاربری · علاقه‌مندی‌ها"
        title="سالن‌ها و متخصصان منتخب من"
        subtitle="مراکز زیبایی و متخصصانی که نشان کرده‌اید در پروفایل شخصی شما ذخیره شده‌اند تا سریع‌تر رزرو کنید."
        breadcrumbs={[
          { label: 'حساب کاربری من', href: '/me' },
          { label: 'علاقه‌مندی‌ها' },
        ]}
      />

      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'all' | 'salons' | 'specialists')}
        tabs={[
          {
            id: 'all',
            label: 'همه علاقه‌مندی‌ها',
            count: totalCount,
          },
          {
            id: 'salons',
            label: 'سالن‌های زیبایی',
            count: favoriteBusinesses.length,
          },
          {
            id: 'specialists',
            label: 'متخصصان منتخب',
            count: favoriteSpecialists.length,
          },
        ]}
      />

      {totalCount === 0 ? (
        <EmptyState
          title="هنوز هیچ سالن یا متخصصی را به علاقه‌مندی‌ها اضافه نکرده‌اید"
          description="در صفحه اصلی، جست‌وجو یا پروفایل سالن‌ها و متخصصان روی آیکون قلب کلیک کنید تا در پروفایل شما ذخیره شوند."
          actionLabel="مشاهده سالن‌ها و متخصصان اصفهان"
          onAction={() => {
            window.location.href = '/search';
          }}
        />
      ) : (
        <div className="space-y-8">
          {(activeTab === 'all' || activeTab === 'salons') && (
            <div className="space-y-4">
              {activeTab === 'all' ? (
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#1E1B2E]">
                    سالن‌ها و مراکز زیبایی ذخیره‌شده (
                    {toPersianDigits(favoriteBusinesses.length)})
                  </h2>
                </div>
              ) : null}

              {favoriteBusinesses.length === 0 ? (
                <EmptyState
                  title="سالنی در لیست علاقه‌مندی‌های شما نیست"
                  description="می‌توانید از بخش جست‌وجو سالن‌های مورد نظر خود را نشان کنید."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteBusinesses.map((biz) => (
                    <BusinessCard
                      key={biz.id}
                      business={biz}
                      isFavorite={true}
                      onToggleFavorite={toggleFavoriteBusiness}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'specialists') && (
            <div className="space-y-4">
              {activeTab === 'all' ? (
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-[#1E1B2E]">
                    متخصصان منتخب من (
                    {toPersianDigits(favoriteSpecialists.length)})
                  </h2>
                </div>
              ) : null}

              {favoriteSpecialists.length === 0 ? (
                <EmptyState
                  title="متخصصی در لیست علاقه‌مندی‌های شما نیست"
                  description="روی آیکون قلب در کارت متخصصان کلیک کنید تا در پروفایل شما ذخیره شوند."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {favoriteSpecialists.map((sp) => (
                    <ProfessionalCard
                      key={sp.id}
                      specialist={sp}
                      isFavorite={true}
                      onToggleFavorite={toggleFavoriteSpecialist}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** ۸. ویرایش پروفایل مشتری (/me/profile) */
export const CustomerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    authUser,
    logoutUser,
    updateCustomerProfile,
    setAccountPassword,
  } = usePrototypeData();
  const [name, setName] = useState(authUser?.fullName ?? '');
  const [phone, setPhone] = useState(authUser?.phone ?? '');
  const [city, setCity] = useState(authUser?.defaultCity ?? 'اصفهان');
  const [smsReminder, setSmsReminder] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fixedPassword, setFixedPassword] = useState('');
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName);
      setPhone(authUser.phone);
      setCity(authUser.defaultCity || 'اصفهان');
    }
  }, [authUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCustomerProfile({
        fullName: name.trim(),
        phone: phone.trim(),
        defaultCity: city.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
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

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="حساب کاربری"
        title="ویرایش مشخصات و امنیت"
        subtitle="ویرایش نام، شماره موبایل و رمز عبور حساب کاربری"
        breadcrumbs={[
          { label: 'حساب من', href: '/me' },
          { label: 'اطلاعات کاربری' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5">
          <Card padding="lg" className="rounded-3xl">
            <form onSubmit={handleSave} className="space-y-4">
              <FormField id="cust-name" label="نام و نام خانوادگی" required>
                <Input
                  id="cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="نام و نام خانوادگی"
                />
              </FormField>
              <FormField
                id="cust-phone"
                label="شماره همراه (قابل ویرایش در صورت ثبت اشتباه)"
                required
              >
                <Input
                  id="cust-phone"
                  dir="ltr"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(normalizeIranMobileInput(e.target.value))
                  }
                  placeholder="0913..."
                />
              </FormField>
              <FormField id="cust-city" label="شهر پیش‌فرض">
                <Input
                  id="cust-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </FormField>

              <div className="pt-2 border-t border-[#E6E0F5]">
                <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#1E1B2E] cursor-pointer py-1">
                  <span>پیامک یادآور نوبت</span>
                  <input
                    type="checkbox"
                    checked={smsReminder}
                    onChange={(e) => setSmsReminder(e.target.checked)}
                    className="accent-[#0057FF] w-4 h-4"
                  />
                </label>
              </div>

              <div className="pt-1">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  ذخیره تغییرات پروفایل
                </Button>
              </div>
            </form>
          </Card>

          <Card
            padding="lg"
            className="rounded-3xl space-y-3.5 border border-[#CBD5E1]"
          >
            <h3 className="text-sm font-extrabold text-[#061138]">
              تغییر رمز عبور حساب
            </h3>
            <form
              onSubmit={handleSavePassword}
              className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
            >
              <div className="flex-1">
                <FormField
                  id="cust-new-pass"
                  label="رمز عبور جدید (حداقل ۶ کاراکتر)"
                  required
                >
                  <Input
                    id="cust-new-pass"
                    type="password"
                    dir="ltr"
                    placeholder="حداقل ۶ کاراکتر..."
                    value={fixedPassword}
                    onChange={(e) => setFixedPassword(e.target.value)}
                  />
                </FormField>
              </div>
              <Button type="submit" variant="primary" isLoading={isSavingPass}>
                ثبت رمز جدید
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
          {/* آیتم کوچک نصب اپ در پروفایل (در صورت نصب بودن مخفی است) */}
          <PWAProfileInstallRow variant="card" />

          <Card variant="muted" className="rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={name || 'کاربر'} size="lg" tone="rose" />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-[#061138] truncate">
                  {name || 'کاربر Timeto'}
                </h2>
                <p
                  dir="ltr"
                  className="text-xs font-mono font-bold text-[#0057FF] text-right mt-0.5"
                >
                  {phone || '—'}
                </p>
                <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0057FF]" />
                  <span>{city}</span>
                </p>
              </div>
            </div>

            {authUser ? (
              <div className="pt-3 border-t border-[#CBD5E1]">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    void logoutUser();
                    navigate('/');
                  }}
                  className="text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب و ورود با شماره دیگر</span>
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
};
