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
  Wallet,
  CreditCard,
  Lock,
  Plus,
  RotateCcw,
  ExternalLink,
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
  formatServicePriceDisplay,
  formatServicePriceShort,
  formatWorkingHourDisplay,
  getUpcomingJalaliDays,
  isTimeSlotWithinWorkingHours,
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

  const selectedDayIdx = Math.max(
    0,
    upcomingDays.findIndex((d) => d.date === bookingDraft.dateJalali)
  );
  const selectedDayObj = upcomingDays[selectedDayIdx] ?? upcomingDays[0];
  const dayWorkingHour = business.workingHours.find(
    (w) => w.dayName === selectedDayObj?.dayName
  );

  const mockTimeSlotOptions: TimeSlotAvailabilityItem[] = [
    { time: '۰۹:۳۰', available: true },
    { time: '۱۰:۳۰', available: true },
    { time: '۱۱:۳۰', available: true },
    { time: '۱۲:۳۰', available: true },
    { time: '۱۳:۳۰', available: true },
    { time: '۱۴:۳۰', available: true },
    { time: '۱۵:۳۰', available: true },
    { time: '۱۶:۳۰', available: true },
    { time: '۱۷:۳۰', available: true },
    { time: '۱۸:۳۰', available: true },
    { time: '۱۹:۳۰', available: true },
  ];

  const rawTimeSlotOptions: TimeSlotAvailabilityItem[] =
    dataMode === 'real' && realSlots && realSlots.length > 0
      ? realSlots
      : mockTimeSlotOptions;

  const timeSlotOptions: TimeSlotAvailabilityItem[] = rawTimeSlotOptions.map(
    (slot) => {
      if (dayWorkingHour && !dayWorkingHour.isOpen) {
        return { ...slot, available: false, reason: 'تعطیل' };
      }
      if (
        dayWorkingHour &&
        !isTimeSlotWithinWorkingHours(slot.time, dayWorkingHour)
      ) {
        return {
          ...slot,
          available: false,
          reason: dayWorkingHour.hasBreak ? 'استراحت بین روز' : 'خارج از ساعت کاری',
        };
      }
      return slot;
    }
  );

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {visibleServices.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv.id);
              const stages = srv.packageIncludes ?? [];
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
                  className={`p-3 rounded-2xl border cursor-pointer transition-all select-none flex items-start justify-between gap-2.5 ${
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
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs sm:text-sm font-extrabold text-[#061138] leading-snug truncate">
                        {srv.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#475569] tabular-nums">
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#334155] font-bold">
                          {srv.category}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-[#0057FF]" />
                          {formatDurationMinutes(srv.durationMinutes)}
                        </span>
                        {stages.length > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9] text-[10px] font-extrabold">
                            پکیج {toPersianDigits(stages.length)} مرحله‌ای
                          </span>
                        ) : null}
                      </div>
                      {stages.length > 0 ? (
                        <p className="text-[10px] text-[#475569] truncate">
                          شامل: {stages.slice(0, 3).join(' · ')}
                          {stages.length > 3
                            ? ` + ${toPersianDigits(stages.length - 3)} مورد`
                            : ''}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-xs sm:text-sm font-black text-[#0057FF] tabular-nums block">
                      {formatServicePriceShort(srv)}
                    </span>
                    {srv.pricingType === 'RANGE' ? (
                      <span className="text-[9px] font-bold text-amber-700">
                        بازه متغیر
                      </span>
                    ) : srv.pricingType === 'STARTING_FROM' ? (
                      <span className="text-[9px] font-bold text-sky-700">
                        پایه + مشاوره
                      </span>
                    ) : null}
                  </div>
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#061138] block">
                ۲. انتخاب ساعت مراجعه:
              </span>
              {dayWorkingHour ? (
                <span className="text-[11px] font-bold text-[#0057FF] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-full tabular-nums">
                  ساعات کاری {dayWorkingHour.dayName}:{' '}
                  {formatWorkingHourDisplay(dayWorkingHour)}
                </span>
              ) : null}
            </div>

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
  const [searchParams, setSearchParams] = useSearchParams();
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
    paymentConfig,
    customerWalletBalanceToman,
    topUpCustomerWallet,
    payFromCustomerWallet,
  } = usePrototypeData();

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingZibal, setIsVerifyingZibal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'GATEWAY' | 'WALLET'>(
    'GATEWAY'
  );

  // لینک مستقیم درگاه زیبال (در صورتی که مرورگر داخل iframe پیش‌نمایش باشد و X-Frame-Options اجازه باز شدن در همان قاب را ندهد)
  const [zibalGatewayRedirect, setZibalGatewayRedirect] = useState<{
    paymentUrl: string;
    trackId: string;
    amountToman: number;
    purpose: 'BOOKING' | 'WALLET';
  } | null>(null);

  // مودال شارژ سریع کیف پول در همان صفحه رزرو
  const [isQuickTopUpOpen, setIsQuickTopUpOpen] = useState(false);
  const [quickTopUpAmount, setQuickTopUpAmount] = useState(200000);
  const [quickTopUpSuccess, setQuickTopUpSuccess] = useState('');
  const [isRequestingTopUpZibal, setIsRequestingTopUpZibal] = useState(false);

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
  const bizSpecialists = business
    ? specialists.filter((sp) => sp.businessId === business.id)
    : [];
  const specialist =
    bizSpecialists.find((sp) => sp.id === bookingDraft.specialistId) ??
    bizSpecialists[0] ??
    (business
      ? {
          id: `spec-ind-${business.id}`,
          businessId: business.id,
          fullName: business.ownerName || business.name,
          roleTitle: 'متخصص ارشد مجموعه',
          avatarUrl: business.avatarUrl || business.coverUrl,
          rating: business.rating || 5,
          experienceYears: 5,
          isActive: true,
        }
      : undefined);

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

  // بیعانه آنلاین به صورت پیش‌فرض برای قطعی شدن نوبت فعال است (حداقل ۳۰٪ یا درصد تنظیمی کارفرما)
  const depositPercent =
    business.depositPercent && business.depositPercent > 0
      ? business.depositPercent
      : 30;
  const depositAmountToman = Math.max(
    50000,
    Math.round((selectedServicesSummary.totalPriceToman * depositPercent) / 100)
  );
  const remainingInSalonToman = Math.max(
    0,
    selectedServicesSummary.totalPriceToman - depositAmountToman
  );
  const cancellationDeadlineHours = business.cancellationDeadlineHours ?? 12;
  const latePenaltyPercent = business.lateCancellationPenaltyPercent ?? 50;
  const hasEnoughWalletBalance = customerWalletBalanceToman >= depositAmountToman;

  const validateCustomerFields = (): boolean => {
    if (dataMode === 'real' && !authUser) {
      setFormError(
        'برای ثبت نهایی نوبت و پرداخت بیعانه، لطفاً ابتدا با شماره موبایل خود وارد شوید.'
      );
      return false;
    }
    if (
      !bookingDraft.customerName.trim() ||
      bookingDraft.customerName.trim().length < 2
    ) {
      setFormError('لطفاً نام و نام خانوادگی مراجع را کامل وارد کنید.');
      return false;
    }
    if (!/^09\d{9}$/.test(bookingDraft.customerPhone.trim())) {
      setFormError('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.');
      return false;
    }
    setFormError('');
    return true;
  };

  // بررسی بازگشت کاربر از درگاه پرداخت اینترنتی زیبال (Callback URL)
  useEffect(() => {
    const isZibalBookingCallback = searchParams.get('zibal_booking') === '1';
    const isZibalWalletCallback = searchParams.get('zibal_wallet') === '1';
    const trackId = searchParams.get('trackId')?.trim();
    const successParam = searchParams.get('success')?.trim();

    if ((!isZibalBookingCallback && !isZibalWalletCallback) || !trackId) {
      return;
    }

    let cancelled = false;
    const verifyReturnedPayment = async () => {
      setIsVerifyingZibal(true);
      setFormError('');
      try {
        const res = await fetch('/api/v1/payments/zibal/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId,
            merchantId:
              paymentConfig.zibalMerchantId ||
              paymentConfig.zarinpalMerchantId ||
              '',
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          verified?: boolean;
          refNumber?: string;
          message?: string;
        };

        if (cancelled) return;

        const isPaid = Boolean(data?.verified) || successParam === '1';
        const trackingRef = data?.refNumber || `ZBL-${trackId}`;

        // پاک کردن پارامترهای بازگشتی از آدرس مرورگر
        const cleanedParams = new URLSearchParams(searchParams);
        cleanedParams.delete('zibal_booking');
        cleanedParams.delete('zibal_wallet');
        cleanedParams.delete('trackId');
        cleanedParams.delete('success');
        cleanedParams.delete('status');
        cleanedParams.delete('orderId');
        setSearchParams(cleanedParams, { replace: true });

        if (!isPaid) {
          setFormError(
            `پرداخت در درگاه زیبال انجام نشد یا توسط شما لغو گردید (کد پیگیری زیبال: ${trackId}). هیچ نوبتی ثبت نشده است.`
          );
          return;
        }

        if (isZibalWalletCallback) {
          let topUpAmt = quickTopUpAmount;
          try {
            const rawPending = window.localStorage.getItem(
              'timeto_pending_zibal_wallet_v1'
            );
            if (rawPending) {
              const parsed = JSON.parse(rawPending) as { amountToman?: number };
              if (parsed?.amountToman && parsed.amountToman > 0) {
                topUpAmt = parsed.amountToman;
              }
              window.localStorage.removeItem('timeto_pending_zibal_wallet_v1');
            }
          } catch {
            // ignore
          }
          topUpCustomerWallet(
            topUpAmt,
            `شارژ آنلاین کیف پول از طریق درگاه زیبال (کد رهگیری: ${trackingRef})`
          );
          setPaymentMethod('WALLET');
          setQuickTopUpSuccess(
            `پرداخت در درگاه زیبال تایید شد و کیف پول شما به مبلغ ${formatPriceToman(topUpAmt)} شارژ گردید.`
          );
          return;
        }

        // ثبت نهایی نوبت پس از تایید پرداخت بیعانه در زیبال
        let resolvedDeposit = depositAmountToman;
        let resolvedBizId = business.id;
        try {
          const rawPending = window.localStorage.getItem(
            'timeto_pending_zibal_booking_v1'
          );
          if (rawPending) {
            const parsed = JSON.parse(rawPending) as {
              depositAmountToman?: number;
              businessId?: string;
            };
            if (parsed?.depositAmountToman && parsed.depositAmountToman > 0) {
              resolvedDeposit = parsed.depositAmountToman;
            }
            if (parsed?.businessId) {
              resolvedBizId = parsed.businessId;
            }
            window.localStorage.removeItem('timeto_pending_zibal_booking_v1');
          }
        } catch {
          // ignore
        }

        await submitBooking({
          depositPaidToman: resolvedDeposit,
          paymentMethod: 'GATEWAY',
          paymentTrackingCode: trackingRef,
        });
        const targetBiz =
          businesses.find((b) => b.id === resolvedBizId) ?? business;
        updateBusinessProfile(targetBiz.id, {
          walletBalanceToman:
            (targetBiz.walletBalanceToman ?? 0) + resolvedDeposit,
        });
        navigate('/booking/result');
      } catch {
        if (!cancelled) {
          setFormError(
            'خطا در استعلام تاییدیه پرداخت از درگاه زیبال. در صورت کسر وجه، تا ۷۲ ساعت به حساب شما بازمی‌گردد.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsVerifyingZibal(false);
        }
      }
    };

    void verifyReturnedPayment();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // مرحله ۱: کلیک روی دکمه پرداخت و ثبت نوبت
  const handleInitiateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCustomerFields()) return;

    if (paymentMethod === 'WALLET') {
      if (!hasEnoughWalletBalance) {
        setFormError(
          `موجودی کیف پول شما (${formatPriceToman(customerWalletBalanceToman)}) کمتر از مبلغ بیعانه (${formatPriceToman(depositAmountToman)}) است. لطفاً ابتدا کیف پول را شارژ کنید یا گزینه «پرداخت از درگاه زیبال» را انتخاب نمایید.`
        );
        return;
      }
      setIsSubmitting(true);
      try {
        const walletRes = payFromCustomerWallet(
          depositAmountToman,
          business.name,
          selectedServicesSummary.combinedTitle || service.title
        );
        if (!walletRes.ok) {
          setFormError('موجودی کیف پول برای پرداخت بیعانه کافی نیست.');
          setIsSubmitting(false);
          return;
        }
        await submitBooking({
          depositPaidToman: depositAmountToman,
          paymentMethod: 'WALLET',
          paymentTrackingCode: walletRes.trackingCode,
        });
        updateBusinessProfile(business.id, {
          walletBalanceToman:
            (business.walletBalanceToman ?? 0) + depositAmountToman,
        });
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
      return;
    }

    // اتصال مستقیم به درگاه پرداخت اینترنتی زیبال (gateway.zibal.ir)
    setIsSubmitting(true);
    setFormError('');
    setZibalGatewayRedirect(null);

    try {
      const orderId = `ZBL-BK-${Date.now()}`;
      try {
        window.localStorage.setItem(
          'timeto_pending_zibal_booking_v1',
          JSON.stringify({
            orderId,
            businessId: business.id,
            businessSlug: business.slug,
            depositAmountToman,
            bookingDraft,
            createdAt: Date.now(),
          })
        );
      } catch {
        // ignore storage errors
      }

      const callbackUrl = `${window.location.origin}/booking/confirm?zibal_booking=1&orderId=${encodeURIComponent(orderId)}`;
      const res = await fetch('/api/v1/payments/zibal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId:
            paymentConfig.zibalMerchantId ||
            paymentConfig.zarinpalMerchantId ||
            '',
          amountToman: depositAmountToman,
          description: `بیعانه رزرو نوبت ${business.name} — ${selectedServicesSummary.combinedTitle || service.title}`,
          orderId,
          callbackUrl,
          mobile: bookingDraft.customerPhone.trim(),
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        trackId?: string | null;
        paymentUrl?: string | null;
        message?: string;
      };

      if (!res.ok || !data?.paymentUrl || !data?.trackId) {
        setFormError(
          data?.message ||
            'خطا در اتصال به درگاه پرداخت اینترنتی زیبال. لطفاً دوباره تلاش کنید.'
        );
        setIsSubmitting(false);
        return;
      }

      // در مرورگر اصلی (سایت واقعی timeto24.ir یا تب مستقل موبایل/دسکتاپ) مستقیماً وارد صفحه شاپرک زیبال می‌شود
      const isEmbeddedInIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      if (!isEmbeddedInIframe) {
        window.location.assign(data.paymentUrl);
        return;
      }

      // در محیط پیش‌نمایش که داخل iframe است (به دلیل هدر امنیتی X-Frame-Options: DENY درگاه زیبال)، درگاه زیبال در تب جدید باز می‌شود
      setZibalGatewayRedirect({
        paymentUrl: data.paymentUrl,
        trackId: String(data.trackId),
        amountToman: depositAmountToman,
        purpose: 'BOOKING',
      });
      const anchor = document.createElement('a');
      anchor.href = data.paymentUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      setFormError(
        'خطا در برقراری ارتباط با درگاه پرداخت زیبال (gateway.zibal.ir). لطفاً اتصال اینترنت خود را بررسی کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // شروع فرآیند شارژ کیف پول از طریق درگاه واقعی زیبال
  const handleStartWalletTopUpViaZibal = async () => {
    setIsRequestingTopUpZibal(true);
    setQuickTopUpSuccess('');
    setFormError('');
    try {
      const orderId = `ZBL-WL-${Date.now()}`;
      try {
        window.localStorage.setItem(
          'timeto_pending_zibal_wallet_v1',
          JSON.stringify({
            orderId,
            amountToman: quickTopUpAmount,
            returnPath: '/booking/confirm',
            createdAt: Date.now(),
          })
        );
      } catch {
        // ignore
      }

      const callbackUrl = `${window.location.origin}/booking/confirm?zibal_wallet=1&orderId=${encodeURIComponent(orderId)}`;
      const res = await fetch('/api/v1/payments/zibal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId:
            paymentConfig.zibalMerchantId ||
            paymentConfig.zarinpalMerchantId ||
            '',
          amountToman: quickTopUpAmount,
          description: `شارژ کیف پول مشتری در تایم تو (${formatPriceToman(quickTopUpAmount)})`,
          orderId,
          callbackUrl,
          mobile: bookingDraft.customerPhone.trim() || authUser?.phone || '',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        trackId?: string | null;
        paymentUrl?: string | null;
        message?: string;
      };

      if (!res.ok || !data?.paymentUrl || !data?.trackId) {
        setFormError(
          data?.message || 'خطا در اتصال به درگاه پرداخت اینترنتی زیبال.'
        );
        return;
      }

      const isEmbeddedInIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      if (!isEmbeddedInIframe) {
        window.location.assign(data.paymentUrl);
        return;
      }

      setIsQuickTopUpOpen(false);
      setZibalGatewayRedirect({
        paymentUrl: data.paymentUrl,
        trackId: String(data.trackId),
        amountToman: quickTopUpAmount,
        purpose: 'WALLET',
      });
      const anchor = document.createElement('a');
      anchor.href = data.paymentUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      setFormError('خطا در اتصال به درگاه پرداخت زیبال.');
    } finally {
      setIsRequestingTopUpZibal(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg sm:text-2xl font-extrabold text-[#061138]">
          بازبینی خلاصه نوبت و پرداخت بیعانه آنلاین
        </h1>
        <p className="text-xs text-[#475569] mt-1">
          برای قطعی شدن نوبت، پرداخت بیعانه از طریق درگاه بانکی شاپرک یا کیف پول شما الزامی است.
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
              برای ثبت قطعی نوبت و پرداخت بیعانه، ابتدا با شماره موبایل خود وارد شوید.
            </span>
            <Link to={`/login?redirect=${encodeURIComponent('/booking/confirm')}`}>
              <Button variant="primary" size="sm">
                ورود سریع با موبایل
              </Button>
            </Link>
          </div>
        ) : null}

        {/* کارت آبی‌رنگ خلاصه نوبت انتخابی */}
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
                    {s.title} ({formatServicePriceDisplay(s)})
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

          <div className="p-4 rounded-2xl bg-white/10 border border-white/25 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-[#00E5FF]">
                مبلغ بیعانه قابل پرداخت الان ({toPersianDigits(depositPercent)}٪):
              </span>
              <span className="font-black text-white text-base tabular-nums">
                {formatPriceToman(depositAmountToman)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-200">
              <span>مانده قابل تسویه حضوری در سالن:</span>
              <strong className="tabular-nums text-white">
                {formatPriceToman(remainingInSalonToman)}
              </strong>
            </div>
            <p className="text-[11px] text-[#00E5FF]/95 pt-1 border-t border-white/15 leading-relaxed">
              ⚖️ قانون کنسلی سالن «{business.name}»: در صورت لغو نوبت تا{' '}
              <strong>{toPersianDigits(cancellationDeadlineHours)} ساعت قبل از زمان نوبت</strong>،{' '}
              <strong>۱۰۰٪ مبلغ بیعانه</strong> به صورت خودکار به کیف پول شما بازگردانده می‌شود و قابل برداشت به کارت بانکی است.
              {latePenaltyPercent > 0
                ? ` (در صورت لغو دیرهنگام در کمتر از ${toPersianDigits(cancellationDeadlineHours)} ساعت مانده، ${toPersianDigits(latePenaltyPercent)}٪ جریمه کسر و مابقی به کیف پول شما واریز می‌گردد).`
                : ''}
            </p>
          </div>
        </Card>

        <Card padding="lg" className="rounded-3xl">
          <form
            onSubmit={handleInitiateCheckout}
            className="space-y-5"
            noValidate
          >
            <h2 className="text-base font-extrabold text-[#061138] border-b border-[#CBD5E1] pb-3">
              ۲. مشخصات مراجع و انتخاب روش پرداخت بیعانه
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

            {/* انتخاب روش پرداخت بیعانه: درگاه بانکی شاپرک یا کیف پول مشتری */}
            <div className="space-y-3 pt-2 border-t border-[#CBD5E1]">
              <label className="text-sm font-extrabold text-[#061138] block">
                ۳. انتخاب روش پرداخت بیعانه ({formatPriceToman(depositAmountToman)})
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* گزینه ۱: درگاه پرداخت اینترنتی زیبال (Zibal - شاپرک) */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('GATEWAY')}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    paymentMethod === 'GATEWAY'
                      ? 'border-[#0057FF] bg-[#EFF6FF] shadow-xs'
                      : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#061138]">
                      <CreditCard className="w-4 h-4 text-[#0057FF]" />
                      <span>درگاه پرداخت اینترنتی زیبال (Zibal)</span>
                    </span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'GATEWAY'
                          ? 'border-[#0057FF] bg-[#0057FF] text-white'
                          : 'border-[#94A3B8]'
                      }`}
                    >
                      {paymentMethod === 'GATEWAY' ? (
                        <Check className="w-2.5 h-2.5" />
                      ) : null}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    اتصال مستقیم به درگاه امن شاپرک (زیبال - gateway.zibal.ir) با کلیه کارت‌های عضو شبکه شتاب
                  </p>
                </button>

                {/* گزینه ۲: پرداخت آنی از موجودی کیف پول مشتری */}
                <div
                  onClick={() => setPaymentMethod('WALLET')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setPaymentMethod('WALLET');
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    paymentMethod === 'WALLET'
                      ? 'border-[#10B981] bg-[#ECFDF5] shadow-xs'
                      : 'border-[#CBD5E1] bg-white hover:border-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#061138]">
                      <Wallet className="w-4 h-4 text-[#10B981]" />
                      <span>پرداخت از کیف پول من</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-black tabular-nums ${
                        hasEnoughWalletBalance
                          ? 'bg-[#D1FAE5] text-[#065F46]'
                          : 'bg-[#FEE2E2] text-[#991B1B]'
                      }`}
                    >
                      موجودی: {formatPriceToman(customerWalletBalanceToman)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-[#475569]">
                      {hasEnoughWalletBalance
                        ? 'کسر آنی بدون نیاز به رمز پویا'
                        : `کسری موجودی: ${formatPriceToman(Math.max(0, depositAmountToman - customerWalletBalanceToman))}`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickTopUpAmount(
                          Math.max(
                            100000,
                            depositAmountToman - customerWalletBalanceToman
                          )
                        );
                        setQuickTopUpSuccess('');
                        setIsQuickTopUpOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#061138] hover:bg-[#0057FF] text-white text-[11px] font-extrabold inline-flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>شارژ با زیبال</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isVerifyingZibal ? (
              <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#93C5FD] flex items-center gap-3 text-xs font-extrabold text-[#1E40AF]">
                <Loader2 className="w-5 h-5 animate-spin text-[#0057FF] shrink-0" />
                <span>در حال استعلام و تایید تراکنش از درگاه پرداخت زیبال...</span>
              </div>
            ) : null}

            {zibalGatewayRedirect ? (
              <div className="p-4 rounded-2xl bg-[#EFF6FF] border-2 border-[#0057FF] space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-[#061138] flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#0057FF]" />
                    <span>
                      درگاه رسمی شاپرک زیبال (کد رهگیری:{' '}
                      <strong dir="ltr" className="font-mono">
                        {zibalGatewayRedirect.trackId}
                      </strong>
                      ) آماده پرداخت است
                    </span>
                  </span>
                  <span className="font-black text-[#0057FF] tabular-nums">
                    {formatPriceToman(zibalGatewayRedirect.amountToman)}
                  </span>
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">
                  صفحه درگاه پرداخت اینترنتی زیبال (gateway.zibal.ir) در تب جدید باز شد. اگر مرورگر شما باز شدن خودکار را مسدود کرده است، روی دکمه زیر کلیک کنید تا مستقیماً وارد درگاه زیبال شوید:
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={zibalGatewayRedirect.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#061138] text-white font-extrabold text-xs transition-colors"
                  >
                    <span>ورود مستقیم به درگاه پرداخت زیبال (Zibal)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams);
                      if (zibalGatewayRedirect.purpose === 'WALLET') {
                        nextParams.set('zibal_wallet', '1');
                      } else {
                        nextParams.set('zibal_booking', '1');
                      }
                      nextParams.set('trackId', zibalGatewayRedirect.trackId);
                      setSearchParams(nextParams);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#061138] border border-[#CBD5E1] font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    پرداخت را در تب زیبال انجام دادم (بررسی وضعیت)
                  </button>
                </div>
              </div>
            ) : null}

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>
                نوبت شما <strong>تنها پس از تکمیل پرداخت در درگاه زیبال (یا کیف پول)</strong> ثبت قطعی می‌شود. در صورت کنسلی نوبت در مهلت مجاز ({toPersianDigits(cancellationDeadlineHours)} ساعت قبل)، مبلغ بیعانه بلافاصله به کیف پول شما بازمی‌گردد.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link to={`/booking/${business.slug}`}>
                <Button variant="outline" type="button">
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به مرحله قبل</span>
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting || isVerifyingZibal}
              >
                {paymentMethod === 'GATEWAY' ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>
                      ورود به درگاه زیبال و پرداخت ({formatPriceToman(depositAmountToman)})
                    </span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>
                      پرداخت از کیف پول ({formatPriceToman(depositAmountToman)}) و ثبت قطعی
                    </span>
                  </>
                )}
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* مودال شارژ سریع کیف پول در صفحه رزرو از طریق درگاه زیبال */}
      <Modal
        isOpen={isQuickTopUpOpen}
        onClose={() => setIsQuickTopUpOpen(false)}
        title="شارژ فوری کیف پول من (درگاه پرداخت اینترنتی زیبال)"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between">
            <span className="font-bold text-[#065F46]">موجودی فعلی کیف پول شما:</span>
            <span className="font-black text-sm text-[#059669] tabular-nums">
              {formatPriceToman(customerWalletBalanceToman)}
            </span>
          </div>

          <div className="space-y-2">
            <label className="font-extrabold text-[#061138] block">
              مبلغ افزایش موجودی (تومان):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[100000, 200000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuickTopUpAmount(amt)}
                  className={`py-2 px-2.5 rounded-xl font-bold border transition-all tabular-nums ${
                    quickTopUpAmount === amt
                      ? 'bg-[#0057FF] text-white border-[#0057FF]'
                      : 'bg-[#F8FAFC] text-[#061138] border-[#CBD5E1]'
                  }`}
                >
                  {formatPriceToman(amt)}
                </button>
              ))}
            </div>
            <Input
              dir="ltr"
              type="number"
              value={String(quickTopUpAmount)}
              onChange={(e) =>
                setQuickTopUpAmount(Math.max(10000, Number(e.target.value) || 0))
              }
            />
          </div>

          {quickTopUpSuccess ? (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] font-bold">
              {quickTopUpSuccess}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#CBD5E1]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickTopUpOpen(false)}
            >
              بستن
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isRequestingTopUpZibal}
              onClick={handleStartWalletTopUpViaZibal}
            >
              <CreditCard className="w-4 h-4" />
              <span>ورود به درگاه زیبال و شارژ ({formatPriceToman(quickTopUpAmount)})</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/** ۴. نتیجه رزرو (/booking/result) */
export const BookingResultPage: React.FC = () => {
  const { bookingDraft, businesses, services, specialists, appointments } =
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
  const bizSpecialists = business
    ? specialists.filter((sp) => sp.businessId === business.id)
    : [];
  const specialist =
    bizSpecialists.find((sp) => sp.id === bookingDraft.specialistId) ??
    bizSpecialists[0];

  const latestAppointment = appointments[0];
  const resolvedSpecialistName =
    (latestAppointment &&
    (!business || latestAppointment.businessId === business.id)
      ? latestAppointment.specialistName
      : undefined) ||
    specialist?.fullName ||
    business?.ownerName ||
    business?.name ||
    '—';
  const depositPercent = business?.depositPercent || 30;
  const paidDepositToman =
    latestAppointment?.depositPaidToman ??
    Math.round((selectedServicesSummary.totalPriceToman * depositPercent) / 100);
  const trackingCode =
    latestAppointment?.paymentTrackingCode || 'ZBL-84920144';
  const paymentMethodLabel =
    latestAppointment?.paymentMethod === 'WALLET'
      ? 'کیف پول تایم تو'
      : 'درگاه پرداخت اینترنتی زیبال (شاپرک)';

  const cleanSalonPhone = (business?.phoneDisplay || business?.ownerPhone || '09131234567')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^\d+]/g, '');

  return (
    <div>
      <PageHeader
        kicker="رزرو آنلاین نوبت · رسید پرداخت و نوبت"
        title="پرداخت بیعانه و ثبت نوبت با موفقیت انجام شد"
        subtitle="درخواست نوبت شما به همراه رسید بیعانه بلافاصله برای صاحب کسب‌وکار ارسال شد و از طریق بخش «نوبت‌های من» قابل پیگیری است."
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
              label="پرداخت موفق · ثبت‌شده در تقویم سالن"
              tone="success"
            />
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-[#061138] pt-1">
            نوبت شما در تقویم «{business?.name ?? 'سالن'}» ثبت گردید
          </h2>
          <p className="text-xs text-[#475569] max-w-md mx-auto leading-relaxed">
            پیامک تایید نوبت و رسید بیعانه برای شما و صاحب کسب‌وکار ارسال شد.
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
              {resolvedSpecialistName}
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
          <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
            <span className="text-[#475569]">جمع کل خدمات:</span>
            <span className="font-bold text-[#061138] tabular-nums">
              {formatPriceToman(selectedServicesSummary.totalPriceToman)}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#CBD5E1]">
            <span className="text-[#059669] font-bold">
              بیعانه پرداخت‌شده ({paymentMethodLabel}):
            </span>
            <span className="font-black text-[#059669] tabular-nums">
              {formatPriceToman(paidDepositToman)}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-[#475569]">کد رهگیری تراکنش:</span>
            <span dir="ltr" className="font-mono font-bold text-[#0057FF]">
              {trackingCode}
            </span>
          </div>
        </div>

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

/** ۵. خلاصه حساب مشتری و کیف پول (/me) */
export const CustomerOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
    paymentConfig,
    customerWalletBalanceToman,
    customerWalletTransactions,
    topUpCustomerWallet,
    requestCustomerWalletWithdrawal,
  } = usePrototypeData();

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(200000);
  const [isConnectingZibalTopUp, setIsConnectingZibalTopUp] = useState(false);
  const [zibalTopUpRedirectUrl, setZibalTopUpRedirectUrl] = useState<{
    paymentUrl: string;
    trackId: string;
    amountToman: number;
  } | null>(null);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(100000);
  const [withdrawDestination, setWithdrawDestination] = useState(
    'IR820540102680020817909002'
  );
  const [walletNotice, setWalletNotice] = useState('');
  const [walletError, setWalletError] = useState('');

  // استعلام بازگشت از درگاه پرداخت زیبال برای شارژ کیف پول در صفحه پروفایل (/me?zibal_wallet=1)
  useEffect(() => {
    const isWalletCb = searchParams.get('zibal_wallet') === '1';
    const trackId = searchParams.get('trackId')?.trim();
    const successParam = searchParams.get('success')?.trim();
    if (!isWalletCb || !trackId) return;

    let cancelled = false;
    const verifyTopUp = async () => {
      try {
        const res = await fetch('/api/v1/payments/zibal/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId,
            merchantId:
              paymentConfig.zibalMerchantId ||
              paymentConfig.zarinpalMerchantId ||
              '',
          }),
        });
        const data = (await res.json()) as {
          verified?: boolean;
          refNumber?: string;
        };
        if (cancelled) return;

        const cleaned = new URLSearchParams(searchParams);
        cleaned.delete('zibal_wallet');
        cleaned.delete('trackId');
        cleaned.delete('success');
        cleaned.delete('status');
        cleaned.delete('orderId');
        setSearchParams(cleaned, { replace: true });

        const isPaid = Boolean(data?.verified) || successParam === '1';
        if (!isPaid) {
          setWalletError(
            `پرداخت شارژ کیف پول در درگاه زیبال لغو شد یا ناموفق بود (کد رهگیری: ${trackId}).`
          );
          return;
        }

        let resolvedAmount = topUpAmount;
        try {
          const raw = window.localStorage.getItem(
            'timeto_pending_zibal_wallet_v1'
          );
          if (raw) {
            const parsed = JSON.parse(raw) as { amountToman?: number };
            if (parsed?.amountToman && parsed.amountToman > 0) {
              resolvedAmount = parsed.amountToman;
            }
            window.localStorage.removeItem('timeto_pending_zibal_wallet_v1');
          }
        } catch {
          // ignore
        }

        const refCode = data?.refNumber || `ZBL-${trackId}`;
        topUpCustomerWallet(
          resolvedAmount,
          `شارژ آنلاین کیف پول از طریق درگاه زیبال (کد رهگیری: ${refCode})`
        );
        setZibalTopUpRedirectUrl(null);
        setWalletNotice(
          `کیف پول شما از طریق درگاه زیبال به مبلغ ${formatPriceToman(resolvedAmount)} با موفقیت شارژ شد (کد رهگیری: ${refCode}).`
        );
      } catch {
        if (!cancelled) {
          setWalletError('خطا در استعلام تاییدیه پرداخت از درگاه زیبال.');
        }
      }
    };

    void verifyTopUp();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleRequestZibalWalletTopUp = async () => {
    setIsConnectingZibalTopUp(true);
    setWalletError('');
    try {
      const orderId = `ZBL-WL-${Date.now()}`;
      try {
        window.localStorage.setItem(
          'timeto_pending_zibal_wallet_v1',
          JSON.stringify({
            orderId,
            amountToman: topUpAmount,
            returnPath: '/me',
            createdAt: Date.now(),
          })
        );
      } catch {
        // ignore
      }

      const callbackUrl = `${window.location.origin}/me?zibal_wallet=1&orderId=${encodeURIComponent(orderId)}`;
      const res = await fetch('/api/v1/payments/zibal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId:
            paymentConfig.zibalMerchantId ||
            paymentConfig.zarinpalMerchantId ||
            '',
          amountToman: topUpAmount,
          description: `شارژ کیف پول مشتری در تایم تو (${formatPriceToman(topUpAmount)})`,
          orderId,
          callbackUrl,
          mobile: authUser?.phone || '',
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        trackId?: string | null;
        paymentUrl?: string | null;
        message?: string;
      };

      if (!res.ok || !data?.paymentUrl || !data?.trackId) {
        setWalletError(
          data?.message || 'خطا در اتصال به درگاه پرداخت اینترنتی زیبال.'
        );
        return;
      }

      const isEmbeddedInIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      if (!isEmbeddedInIframe) {
        window.location.assign(data.paymentUrl);
        return;
      }

      setIsTopUpModalOpen(false);
      setZibalTopUpRedirectUrl({
        paymentUrl: data.paymentUrl,
        trackId: String(data.trackId),
        amountToman: topUpAmount,
      });
      const anchor = document.createElement('a');
      anchor.href = data.paymentUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      setWalletError('خطا در برقراری ارتباط با درگاه زیبال.');
    } finally {
      setIsConnectingZibalTopUp(false);
    }
  };

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

      {/* بخش کیف پول اختصاصی مشتری (شارژ، پرداخت رزرو، بازگشت بیعانه کنسلی و برداشت به شبا/کارت) */}
      <Card className="rounded-[28px] p-5 sm:p-6 border border-[#CBD5E1] bg-gradient-to-br from-[#061138] via-[#0B1E5B] to-[#0057FF] text-white space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00E5FF]">
              <Wallet className="w-4 h-4" />
              <span>کیف پول اختصاصی شما در تایم تو</span>
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
              {formatPriceToman(customerWalletBalanceToman)}
            </p>
            <p className="text-xs text-slate-200 leading-relaxed">
              قابل استفاده برای پرداخت آنی بیعانه رزرو نوبت‌ها · در صورت لغو نوبت در مهلت مجاز، بیعانه به این کیف پول واریز شده و قابل برداشت به حساب بانکی است.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setWalletError('');
                setIsTopUpModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-[#00E5FF] hover:bg-[#33ECFF] text-[#061138] font-black text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>شارژ کیف پول (زیبال)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWalletError('');
                setWithdrawAmount(Math.min(customerWalletBalanceToman, 200000) || 100000);
                setIsWithdrawModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>برداشت به کارت / شبا</span>
            </button>
          </div>
        </div>

        {walletNotice ? (
          <div className="p-3 rounded-2xl bg-white/15 border border-[#00E5FF]/50 text-xs font-bold text-[#00E5FF]">
            {walletNotice}
          </div>
        ) : null}

        {zibalTopUpRedirectUrl ? (
          <div className="p-4 rounded-2xl bg-white/15 border border-[#00E5FF] space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-[#00E5FF]">
                درگاه شاپرک زیبال (کد رهگیری: {zibalTopUpRedirectUrl.trackId}) آماده پرداخت است
              </span>
              <span className="font-black text-white tabular-nums">
                {formatPriceToman(zibalTopUpRedirectUrl.amountToman)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={zibalTopUpRedirectUrl.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00E5FF] text-[#061138] font-black text-xs"
              >
                <span>ورود مستقیم به درگاه پرداخت زیبال</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set('zibal_wallet', '1');
                  nextParams.set('trackId', zibalTopUpRedirectUrl.trackId);
                  setSearchParams(nextParams);
                }}
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs cursor-pointer"
              >
                پرداخت را انجام دادم (بررسی وضعیت)
              </button>
            </div>
          </div>
        ) : null}

        {customerWalletTransactions.length > 0 ? (
          <div className="pt-3 border-t border-white/15 space-y-2">
            <span className="text-xs font-extrabold text-[#00E5FF] block">
              گردش حساب و تراکنش‌های اخیر کیف پول:
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {customerWalletTransactions.slice(0, 6).map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-white/10 border border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">{tx.description}</p>
                    <p className="text-[11px] text-slate-300 tabular-nums">
                      {tx.createdAtJalali}
                      {tx.trackingCode ? ` · کد پیگیری: ${tx.trackingCode}` : ''}
                    </p>
                  </div>
                  <span
                    className={`font-black tabular-nums px-2.5 py-1 rounded-xl ${
                      tx.amountToman >= 0
                        ? 'bg-[#10B981]/25 text-[#6EE7B7]'
                        : 'bg-white/15 text-amber-200'
                    }`}
                  >
                    {tx.amountToman >= 0 ? '+' : ''}
                    {formatPriceToman(Math.abs(tx.amountToman))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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

      {/* مودال شارژ کیف پول در پروفایل از طریق درگاه زیبال */}
      <Modal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        title="افزایش موجودی کیف پول (درگاه پرداخت اینترنتی زیبال)"
      >
        <div className="space-y-4 text-xs">
          {walletError ? (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold">
              {walletError}
            </div>
          ) : null}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[100000, 200000, 500000, 1000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTopUpAmount(amt)}
                className={`py-2 px-3 rounded-xl font-bold border tabular-nums transition-all ${
                  topUpAmount === amt
                    ? 'bg-[#0057FF] text-white border-[#0057FF]'
                    : 'bg-[#F8FAFC] text-[#061138] border-[#CBD5E1]'
                }`}
              >
                {formatPriceToman(amt)}
              </button>
            ))}
          </div>
          <FormField id="wallet-topup-input" label="یا مبلغ دلخواه (تومان)">
            <Input
              id="wallet-topup-input"
              dir="ltr"
              type="number"
              value={String(topUpAmount)}
              onChange={(e) =>
                setTopUpAmount(Math.max(10000, Number(e.target.value) || 0))
              }
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#CBD5E1]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTopUpModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={isConnectingZibalTopUp}
              onClick={handleRequestZibalWalletTopUp}
            >
              <CreditCard className="w-4 h-4" />
              <span>ورود به درگاه زیبال و شارژ ({formatPriceToman(topUpAmount)})</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* مودال برداشت وجه از کیف پول به کارت یا شبا */}
      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title="درخواست تسویه و برداشت موجودی کیف پول به کارت / شبا"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-between">
            <span className="font-bold text-[#061138]">موجودی قابل برداشت:</span>
            <span className="font-black text-sm text-[#0057FF] tabular-nums">
              {formatPriceToman(customerWalletBalanceToman)}
            </span>
          </div>

          {walletError ? (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold">
              {walletError}
            </div>
          ) : null}

          <FormField id="withdraw-amt" label="مبلغ برداشت (تومان)" required>
            <Input
              id="withdraw-amt"
              dir="ltr"
              type="number"
              value={String(withdrawAmount)}
              onChange={(e) =>
                setWithdrawAmount(Math.max(0, Number(e.target.value) || 0))
              }
            />
          </FormField>

          <FormField
            id="withdraw-dest"
            label="شماره شبا (IR) یا شماره کارت ۱۶ رقمی مقصد"
            required
          >
            <Input
              id="withdraw-dest"
              dir="ltr"
              value={withdrawDestination}
              onChange={(e) => setWithdrawDestination(e.target.value)}
              placeholder="IR820540102680020817909002"
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#CBD5E1]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWithdrawModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const res = requestCustomerWalletWithdrawal(
                  withdrawAmount,
                  withdrawDestination
                );
                if (!res) {
                  setWalletError(
                    'مبلغ واردشده معتبر نیست یا از موجودی کیف پول بیشتر است، و یا شماره شبا/کارت کامل وارد نشده است.'
                  );
                  return;
                }
                setWalletNotice(
                  `درخواست واریز مبلغ ${formatPriceToman(withdrawAmount)} به حساب «${withdrawDestination}» ثبت شد و طی چرخه پایا به حساب شما واریز می‌گردد.`
                );
                setIsWithdrawModalOpen(false);
              }}
            >
              ثبت درخواست واریز به حساب بانکی
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/** ۶. نوبت‌های من (/me/appointments) */
export const CustomerAppointmentsPage: React.FC = () => {
  const {
    authUser,
    appointments,
    businesses,
    updateAppointmentStatus,
    customerWalletBalanceToman,
  } = usePrototypeData();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentItem | null>(
    null
  );
  const [simulateLateCancel, setSimulateLateCancel] = useState(false);
  const [cancelRefundNotice, setCancelRefundNotice] = useState('');

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
        kicker="حساب کاربری · مدیریت نوبت‌ها و استرداد بیعانه"
        title="نوبت‌های من"
        subtitle="مشاهده جزئیات نوبت‌های پیش‌رو، قوانین کنسلی سالن و بازگشت خودکار بیعانه به کیف پول"
        breadcrumbs={[
          { label: 'حساب کاربری من', href: '/me' },
          { label: 'نوبت‌های من' },
        ]}
      />

      {cancelRefundNotice ? (
        <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#6EE7B7] flex flex-wrap items-center justify-between gap-3 text-xs text-[#065F46]">
          <div className="space-y-0.5">
            <p className="font-extrabold">{cancelRefundNotice}</p>
            <p className="text-[11px]">
              موجودی فعلی کیف پول شما:{' '}
              <strong className="tabular-nums">
                {formatPriceToman(customerWalletBalanceToman)}
              </strong>
            </p>
          </div>
          <Link to="/me">
            <Button variant="primary" size="sm">
              مشاهده کیف پول و برداشت وجه
            </Button>
          </Link>
        </div>
      ) : null}

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
                  ? (item) => {
                      setSimulateLateCancel(false);
                      setCancelTarget(item);
                    }
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
              <span className="text-[#6B6480]">مبلغ کل خدمت:</span>
              <span className="font-bold text-[#8B5CF6] tabular-nums">
                {formatPriceToman(selectedApt.priceToman)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#059669] font-bold">بیعانه پرداخت‌شده:</span>
              <span className="font-extrabold text-[#059669] tabular-nums">
                {formatPriceToman(
                  selectedApt.depositPaidToman ??
                    Math.round((selectedApt.priceToman * 30) / 100)
                )}
              </span>
            </div>
            {selectedApt.refundedToWalletToman ? (
              <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
                <span className="text-[#0057FF] font-bold">
                  مبلغ مستردشده به کیف پول:
                </span>
                <span className="font-extrabold text-[#0057FF] tabular-nums">
                  {formatPriceToman(selectedApt.refundedToWalletToman)}
                </span>
              </div>
            ) : null}
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

      {/* مودال هوشمند لغو نوبت با محاسبه قانون کنسلی کارفرما و بازگشت خودکار بیعانه به کیف پول */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="لغو نوبت و بازگشت بیعانه به کیف پول"
      >
        {cancelTarget
          ? (() => {
              const matchedBiz = businesses.find(
                (b) =>
                  b.id === cancelTarget.businessId ||
                  b.slug === cancelTarget.businessSlug ||
                  b.name === cancelTarget.businessName
              );
              const deadlineHours =
                matchedBiz?.cancellationDeadlineHours ?? 12;
              const penaltyPercent =
                matchedBiz?.lateCancellationPenaltyPercent ?? 50;
              const depositPercent = matchedBiz?.depositPercent || 30;
              const paidDeposit =
                cancelTarget.depositPaidToman &&
                cancelTarget.depositPaidToman > 0
                  ? cancelTarget.depositPaidToman
                  : Math.round(
                      (cancelTarget.priceToman * depositPercent) / 100
                    );
              const calculatedRefund = simulateLateCancel
                ? Math.max(
                    0,
                    Math.round((paidDeposit * (100 - penaltyPercent)) / 100)
                  )
                : paidDeposit;

              return (
                <div className="space-y-4 text-xs">
                  <p className="text-[#061138] font-bold leading-relaxed">
                    آیا از لغو نوبت خدمت «{cancelTarget.serviceTitle}» در «
                    {cancelTarget.businessName}» ({cancelTarget.dateJalali}{' '}
                    ساعت {cancelTarget.timeSlot}) اطمینان دارید؟
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">
                        مهلت لغو مجاز تعیین‌شده توسط کارفرما:
                      </span>
                      <span className="font-extrabold text-[#061138]">
                        تا {toPersianDigits(deadlineHours)} ساعت قبل از نوبت
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">
                        بیعانه پرداخت‌شده شما:
                      </span>
                      <span className="font-extrabold text-[#061138] tabular-nums">
                        {formatPriceToman(paidDeposit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#CBD5E1]">
                      <span className="font-extrabold text-[#059669]">
                        مبلغ بازگشتی به کیف پول شما:
                      </span>
                      <span className="text-sm font-black text-[#059669] tabular-nums">
                        {formatPriceToman(calculatedRefund)}
                      </span>
                    </div>
                  </div>

                  {/* سوییچ تست حالت لغو در مهلت مجاز یا لغو دیرهنگام */}
                  <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                    <span className="font-extrabold text-[#061138] block">
                      شبیه‌سازی زمان لغو نسبت به نوبت:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSimulateLateCancel(false)}
                        className={`p-2.5 rounded-xl border font-bold text-right transition-all ${
                          !simulateLateCancel
                            ? 'bg-[#0057FF] text-white border-[#0057FF]'
                            : 'bg-white text-[#061138] border-[#CBD5E1]'
                        }`}
                      >
                        ✅ لغو در مهلت مجاز (بیش از {toPersianDigits(deadlineHours)} ساعت مانده · بازگشت ۱۰۰٪)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulateLateCancel(true)}
                        className={`p-2.5 rounded-xl border font-bold text-right transition-all ${
                          simulateLateCancel
                            ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                            : 'bg-white text-[#061138] border-[#CBD5E1]'
                        }`}
                      >
                        ⏰ لغو دیرهنگام (کمتر از {toPersianDigits(deadlineHours)} ساعت · کسر {toPersianDigits(penaltyPercent)}٪ جریمه)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#CBD5E1]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCancelTarget(null)}
                    >
                      انصراف
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        updateAppointmentStatus(
                          cancelTarget.id,
                          AppointmentStatus.Cancelled,
                          'CUSTOMER',
                          calculatedRefund
                        );
                        setCancelRefundNotice(
                          `نوبت شما لغو شد و مبلغ ${formatPriceToman(calculatedRefund)} بابت استرداد بیعانه به کیف پول شما واریز گردید.`
                        );
                        setCancelTarget(null);
                      }}
                    >
                      تایید لغو نوبت و واریز به کیف پول
                    </Button>
                  </div>
                </div>
              );
            })()
          : null}
      </Modal>
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
