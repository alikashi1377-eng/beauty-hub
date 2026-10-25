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
  ShieldAlert,
  Clock,
  Check,
  Sparkles,
  UserCheck,
  MapPin,
} from 'lucide-react';
import {
  AppointmentItem,
  AppointmentStatus,
  TimeSlotAvailabilityItem,
} from '../../types';
import {
  formatDurationMinutes,
  formatPriceToman,
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
  AppointmentCard,
  Avatar,
  BusinessCard,
  ConfirmationDialog,
  Tabs,
} from '../../components/ui/MarketplaceComponents';

/** نوار گام‌های رزرو ۳ مرحله‌ای برای جریان رزرو مشتری */
const BookingFlowStepIndicator: React.FC<{ currentStep: 1 | 2 | 3 }> = ({
  currentStep,
}) => {
  const steps = [
    { num: 1, title: '۱. انتخاب خدمت، متخصص و زمان' },
    { num: 2, title: '۲. بازبینی و مشخصات مراجع' },
    { num: 3, title: '۳. رسید رزرو شبیه‌سازی‌شده' },
  ];

  return (
    <div className="mb-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {steps.map((s) => {
        const isCurrent = s.num === currentStep;
        const isDone = s.num < currentStep;
        return (
          <div
            key={s.num}
            className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
              isCurrent
                ? 'border-[#2A0F54] bg-[#F3E8FF]/60 text-[#2A0F54] font-extrabold shadow-2xs'
                : isDone
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 font-bold'
                : 'border-[#E6E3EE] bg-white text-[#787189] font-medium'
            }`}
          >
            <span>{s.title}</span>
            {isDone ? (
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center">
                <Check className="w-3 h-3" />
              </span>
            ) : isCurrent ? (
              <span className="w-2 h-2 rounded-full bg-[#9D174D]" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

/** ۱. صفحه ورود مشتری / کاربر (/login) */
export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    dataMode,
    authUser,
    requestOtpLogin,
    verifyOtpLogin,
    logoutUser,
    showToast,
  } = usePrototypeData();
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const rawRedirect = searchParams.get('redirect') || '';
  const safeRedirectPath =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '';

  const handleRequestOtpOrSimulatedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.trim();
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError('شماره موبایل واردشده معتبر نیست (مثال: 09123456789).');
      return;
    }
    setError('');

    if (dataMode === 'mock') {
      showToast('ورود آزمایشی (حالت دمو بدون ارسال پیامک) انجام شد.');
      navigate('/me');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestOtpLogin(normalizedPhone);
      setStep('otp');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'خطا در ارسال کد تایید یک‌بارمصرف.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = otpCode.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('کد تایید باید یک عدد ۶ رقمی معتبر باشد.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const user = await verifyOtpLogin(phone.trim(), trimmedCode);
      if (safeRedirectPath) {
        navigate(safeRedirectPath, { replace: true });
      } else if (user.isPlatformAdmin && user.roles.includes('PLATFORM_ADMIN')) {
        navigate('/admin', { replace: true });
      } else if (user.roles.includes('BUSINESS_OWNER')) {
        navigate('/app', { replace: true });
      } else {
        navigate('/me', { replace: true });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'کد واردشده معتبر نیست.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-6">
      <PageHeader
        kicker={
          dataMode === 'real'
            ? 'حساب کاربری · احراز هویت امن OTP'
            : 'حساب کاربری · حالت نمایشی'
        }
        title="ورود به حساب کاربری"
        subtitle={
          dataMode === 'real'
            ? 'برای ورود امن به حساب کاربری، شماره همراه خود را وارد کرده و کد تایید ۶ رقمی را ثبت نمایید.'
            : 'در این مرحله احراز هویت واقعی و ارسال پیامک (OTP) غیرفعال است و می‌توانید مستقیماً وارد محیط‌های دمو شوید.'
        }
        routePattern="/login"
        breadcrumbs={[{ label: 'صفحه اصلی', href: '/' }, { label: 'ورود' }]}
      />

      <Card padding="lg" className="space-y-6">
        {authUser ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div>
              <p className="font-extrabold">
                نشست فعال: {authUser.fullName} ({authUser.phone})
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                نقش‌های فعال: {authUser.roles.join('، ')}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void logoutUser()}
            >
              خروج از حساب
            </Button>
          </div>
        ) : null}

        {dataMode === 'mock' ? (
          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              حالت نمایشی (Demo Mode): هیچ پیامکی ارسال نمی‌شود و این فرم صرفاً
              برای بررسی جریان ورود مشتری به ناحیه کاربری طراحی شده است.
            </span>
          </div>
        ) : null}

        {step === 'phone' || dataMode === 'mock' ? (
          <form
            onSubmit={handleRequestOtpOrSimulatedLogin}
            className="space-y-4"
            noValidate
          >
            <FormField
              id="login-phone"
              label="شماره تلفن همراه"
              hint="شماره ۱۱ رقمی با پیش‌شماره ۰۹"
              error={error}
              required
            >
              <Input
                id="login-phone"
                dir="ltr"
                value={phone}
                hasError={Boolean(error)}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              <span>
                {dataMode === 'real'
                  ? 'دریافت کد تایید یک‌بارمصرف (OTP)'
                  : 'ورود آزمایشی به حساب مشتری (/me)'}
              </span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
            <FormField
              id="login-otp-code"
              label={`کد تایید ۶ رقمی ارسال‌شده به ${phone}`}
              hint="کد ۶ رقمی یک‌بارمصرف را وارد کنید"
              error={error}
              required
            >
              <Input
                id="login-otp-code"
                dir="ltr"
                maxLength={6}
                value={otpCode}
                hasError={Boolean(error)}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
              />
            </FormField>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setStep('phone');
                  setOtpCode('');
                  setError('');
                }}
              >
                ویرایش شماره
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
              >
                <span>تایید کد و ورود به حساب</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}

        <div className="pt-5 border-t border-[#E6E3EE] space-y-3">
          <p className="text-xs font-extrabold text-[#171226]">
            یا تغییر مستقیم به سایر پنل‌های محصول:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link to="/app">
              <Button variant="outline" size="sm" fullWidth>
                پیشخوان کسب‌وکار (/app)
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm" fullWidth>
                پنل مدیریت پلتفرم (/admin)
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

/** ۲. انتخاب خدمت، متخصص، تاریخ و زمان رزرو (/booking/:businessSlug) */
export const BookingStepPage: React.FC = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    dataMode,
    businesses,
    services,
    specialists,
    bookingDraft,
    updateBookingDraft,
  } = usePrototypeData();

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

  const [realSlots, setRealSlots] = useState<TimeSlotAvailabilityItem[] | null>(
    null
  );
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    if (!business) return;
    const srvParam = searchParams.get('service');
    const spcParam = searchParams.get('specialist');
    const defaultSrv =
      srvParam && bizServices.some((s) => s.id === srvParam)
        ? srvParam
        : (bizServices[0]?.id ?? '');
    const defaultSpc =
      spcParam && bizSpecialists.some((sp) => sp.id === spcParam)
        ? spcParam
        : (bizSpecialists[0]?.id ?? '');

    updateBookingDraft({
      businessSlug: business.slug,
      serviceId: defaultSrv,
      specialistId: defaultSpc,
    });
  }, [business?.slug, bizServices.length, bizSpecialists.length]);

  const selectedService =
    bizServices.find((s) => s.id === bookingDraft.serviceId) ?? bizServices[0];
  const selectedSpecialist =
    bizSpecialists.find((sp) => sp.id === bookingDraft.specialistId) ??
    bizSpecialists[0];

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
        serviceId: selectedService?.id,
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
    selectedService?.id,
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

  const availableDates = [
    { date: '۱۴۰۵/۰۸/۰۳', label: 'یکشنبه ۳ آبان', tag: 'پیشنهاد امروز' },
    { date: '۱۴۰۵/۰۸/۰۴', label: 'دوشنبه ۴ آبان', tag: 'ظرفیت باز' },
    { date: '۱۴۰۵/۰۸/۰۵', label: 'سه‌شنبه ۵ آبان', tag: 'ظرفیت باز' },
    { date: '۱۴۰۵/۰۸/۰۶', label: 'چهارشنبه ۶ آبان', tag: 'آخر هفته' },
  ];

  const mockTimeSlotOptions: TimeSlotAvailabilityItem[] = [
    { time: '۰۹:۳۰', available: true },
    { time: '۱۰:۳۰', available: false, reason: 'تکمیل ظرفیت' },
    { time: '۱۱:۰۰', available: true },
    { time: '۱۳:۳۰', available: true },
    { time: '۱۴:۳۰', available: false, reason: 'رزروشده' },
    { time: '۱۵:۳۰', available: true },
    { time: '۱۷:۰۰', available: true },
  ];

  const timeSlotOptions: TimeSlotAvailabilityItem[] =
    dataMode === 'real' ? (realSlots ?? []) : mockTimeSlotOptions;

  return (
    <div>
      <PageHeader
        kicker={`رزرو آنلاین نوبت · ${business.city}، ${business.neighborhood}`}
        title={`رزرو نوبت در ${business.name}`}
        subtitle="گام اول از ۳: خدمت مورد نظر، متخصص ارائه‌دهنده، روز و ساعت مراجعه را انتخاب کنید."
        routePattern={`/booking/${businessSlug ?? ':businessSlug'}`}
        breadcrumbs={[
          { label: 'جست‌وجو', href: '/search' },
          { label: business.name, href: `/salon/${business.slug}` },
          { label: 'انتخاب خدمت و زمان' },
        ]}
      />

      <BookingFlowStepIndicator currentStep={1} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* ۱. انتخاب خدمت */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E3EE] pb-3">
              <h2 className="text-base font-extrabold text-[#171226]">
                ۱. خدمت مورد نظر را انتخاب کنید *
              </h2>
              <span className="text-xs text-[#787189] tabular-nums">
                {toPersianDigits(bizServices.length)} خدمت فعال
              </span>
            </div>

            <div className="space-y-2.5">
              {bizServices.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <label
                    key={srv.id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2A0F54] bg-[#F3E8FF]/55 ring-2 ring-[#2A0F54]/10'
                        : 'border-[#E6E3EE] bg-white hover:bg-[#FAF9FC] hover:border-[#D0CADF]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="booking-service"
                        checked={isSelected}
                        onChange={() =>
                          updateBookingDraft({ serviceId: srv.id })
                        }
                        className="accent-[#2A0F54] mt-1 w-4 h-4"
                      />
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-extrabold text-[#171226]">
                          {srv.title}
                        </p>
                        <p className="text-xs text-[#4E4760] tabular-nums flex items-center gap-2">
                          <span>{srv.category}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#787189]" />
                            {formatDurationMinutes(srv.durationMinutes)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold text-[#2A0F54] tabular-nums">
                      {formatPriceToman(srv.priceToman)}
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>

          {/* ۲. انتخاب متخصص */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E3EE] pb-3">
              <h2 className="text-base font-extrabold text-[#171226]">
                ۲. انتخاب متخصص ارائه‌دهنده خدمت *
              </h2>
              <span className="text-xs text-[#787189]">
                امکان تغییر متخصص پیش از تایید نهایی
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bizSpecialists.map((sp) => {
                const isSelected = selectedSpecialist?.id === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => updateBookingDraft({ specialistId: sp.id })}
                    className={`p-4 rounded-xl border text-right cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-[#2A0F54] bg-[#F3E8FF]/55 ring-2 ring-[#2A0F54]/10'
                        : 'border-[#E6E3EE] bg-white hover:bg-[#FAF9FC] hover:border-[#D0CADF]'
                    }`}
                  >
                    <Avatar name={sp.fullName} size="md" tone="violet" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-extrabold text-[#171226] truncate">
                        {sp.fullName}
                      </p>
                      <p className="text-xs text-[#4E4760] mt-0.5 truncate">
                        {sp.roleTitle}
                      </p>
                      <p className="text-[11px] text-[#787189] mt-1 tabular-nums">
                        ★ {toPersianDigits(sp.rating)} · سابقه{' '}
                        {toPersianDigits(sp.experienceYears)} سال
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ۳. انتخاب تاریخ و ساعت */}
          <Card className="space-y-5">
            <div className="space-y-3">
              <h2 className="text-base font-extrabold text-[#171226]">
                ۳. انتخاب روز مراجعه (تقویم آزمایشی) *
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {availableDates.map((d) => {
                  const isSelected = bookingDraft.dateJalali === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => updateBookingDraft({ dateJalali: d.date })}
                      className={`p-3 rounded-xl border text-xs cursor-pointer tabular-nums transition-all text-right ${
                        isSelected
                          ? 'bg-[#2A0F54] text-white border-[#2A0F54] font-extrabold shadow-xs'
                          : 'bg-white text-[#171226] border-[#E6E3EE] hover:bg-[#FAF9FC]'
                      }`}
                    >
                      <p className="font-bold">{d.label}</p>
                      <p
                        className={`text-[11px] mt-1 ${
                          isSelected ? 'text-[#E9D5FF]' : 'text-[#787189]'
                        }`}
                      >
                        {d.date} · {d.tag}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E6E3EE]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-[#171226]">
                  ۴. انتخاب بازه زمانی مراجعه *
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-[#787189]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2A0F54]" />
                    انتخاب شما
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs border border-[#D0CADF] bg-white" />
                    قابل رزرو
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#F4F3F8]" />
                    تکمیل ظرفیت
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {timeSlotOptions.map((slot) => {
                  const isSelected =
                    slot.available && bookingDraft.timeSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() =>
                        slot.available &&
                        updateBookingDraft({ timeSlot: slot.time })
                      }
                      className={`px-3.5 py-2.5 rounded-xl text-xs tabular-nums border transition-all flex items-center justify-between ${
                        !slot.available
                          ? 'bg-[#F4F3F8] text-[#787189] border-[#E6E3EE] opacity-60 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-[#2A0F54] text-white border-[#2A0F54] font-extrabold shadow-xs cursor-pointer'
                          : 'bg-white text-[#171226] border-[#D0CADF] hover:border-[#2A0F54] font-bold cursor-pointer'
                      }`}
                    >
                      <span>ساعت {slot.time}</span>
                      {!slot.available ? (
                        <span className="text-[10px] no-underline font-normal">
                          {slot.reason}
                        </span>
                      ) : isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* خلاصه انتخاب و ادامه در ستون چسبان */}
        <div className="lg:col-span-4">
          <Card variant="dark" className="space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h2 className="text-sm font-extrabold text-white">
                خلاصه نوبت انتخابی شما
              </h2>
              <span className="text-[11px] text-[#F5D0FE] font-semibold">
                گام ۱ از ۳
              </span>
            </div>

            <div className="space-y-3 text-xs text-[#E9D5FF]">
              <div className="flex justify-between gap-2">
                <span className="text-white/70">مرکز زیبایی:</span>
                <span className="font-extrabold text-white text-left">
                  {business.name}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/70">خدمت انتخابی:</span>
                <span className="font-bold text-white text-left">
                  {selectedService?.title ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/70">مدت زمان تقریبی:</span>
                <span className="font-bold text-white tabular-nums">
                  {formatDurationMinutes(selectedService?.durationMinutes ?? 60)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/70">متخصص:</span>
                <span className="font-bold text-white">
                  {selectedSpecialist?.fullName ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/70">تاریخ و ساعت:</span>
                <span className="font-extrabold text-[#F5D0FE] tabular-nums">
                  {bookingDraft.dateJalali} · ساعت {bookingDraft.timeSlot}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/15 text-sm">
                <span className="font-bold text-white">تعرفه خدمت:</span>
                <span className="text-base font-extrabold text-white tabular-nums">
                  {formatPriceToman(selectedService?.priceToman ?? 0)}
                </span>
              </div>
            </div>

            <Button
              variant="accent"
              size="lg"
              fullWidth
              onClick={() => navigate('/booking/confirm')}
            >
              <span>ادامه به بازبینی و تایید</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>
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
    submitBooking,
  } = usePrototypeData();

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const business =
    businesses.find((b) => b.slug === bookingDraft.businessSlug) ??
    (dataMode === 'mock' ? businesses[0] : undefined);
  const service =
    services.find((s) => s.id === bookingDraft.serviceId) ??
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

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dataMode === 'real' && !authUser) {
      setFormError(
        'برای ثبت نهایی نوبت در پایگاه داده، لطفاً ابتدا وارد حساب کاربری خود شوید.'
      );
      return;
    }
    if (
      !bookingDraft.customerName.trim() ||
      bookingDraft.customerName.trim().length < 2
    ) {
      setFormError('لطفاً نام و نام خانوادگی مراجع را به طور کامل وارد کنید.');
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
      navigate('/booking/result');
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'خطا در ثبت نوبت. لطفاً ساعت یا متخصص دیگری را بررسی کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        kicker="رزرو آنلاین نوبت · گام ۲ از ۳"
        title="بازبینی نهایی و مشخصات مراجع"
        subtitle="اطلاعات نوبت انتخابی و مشخصات تماس را پیش از ثبت نهایی بررسی نمایید."
        routePattern="/booking/confirm"
        breadcrumbs={[
          {
            label: 'انتخاب خدمت و زمان',
            href: `/booking/${business.slug}`,
          },
          { label: 'بازبینی و تایید اطلاعات' },
        ]}
      />

      <BookingFlowStepIndicator currentStep={2} />

      <div className="max-w-3xl mx-auto space-y-6">
        {dataMode === 'real' && !authUser ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
            <span className="font-bold">
              برای ثبت قطعی نوبت در سامانه، ورود با شماره موبایل (OTP) الزامی است.
            </span>
            <Link to="/login">
              <Button variant="primary" size="sm">
                ورود / ثبت‌نام سریع
              </Button>
            </Link>
          </div>
        ) : null}

        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6E3EE] pb-3">
            <h2 className="text-base font-extrabold text-[#171226]">
              ۱. خلاصه سرویس و زمان انتخاب‌شده
            </h2>
            <Link
              to={`/booking/${business.slug}`}
              className="text-xs font-bold text-[#2A0F54] hover:underline"
            >
              تغییر زمان یا خدمت
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE] space-y-1">
              <span className="text-xs text-[#787189]">مرکز زیبایی:</span>
              <p className="font-extrabold text-[#171226]">{business.name}</p>
              <p className="text-xs text-[#4E4760]">
                {business.city}، {business.neighborhood}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE] space-y-1">
              <span className="text-xs text-[#787189]">خدمت و متخصص:</span>
              <p className="font-extrabold text-[#171226]">{service.title}</p>
              <p className="text-xs text-[#4E4760]">
                متخصص: {specialist.fullName} (
                {formatDurationMinutes(service.durationMinutes)})
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3E8FF]/45 border border-[#E6E3EE] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div>
              <span className="text-[#4E4760]">زمان مراجعه: </span>
              <strong className="font-extrabold text-[#2A0F54] tabular-nums">
                {bookingDraft.dateJalali} — ساعت {bookingDraft.timeSlot}
              </strong>
            </div>
            <div>
              <span className="text-[#4E4760]">مبلغ خدمت (پرداخت در سالن): </span>
              <strong className="font-extrabold text-[#2A0F54] tabular-nums">
                {formatPriceToman(service.priceToman)}
              </strong>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <form
            onSubmit={handleConfirmBooking}
            className="space-y-5"
            noValidate
          >
            <h2 className="text-base font-extrabold text-[#171226] border-b border-[#E6E3EE] pb-3">
              ۲. مشخصات مراجع
            </h2>

            {formError ? (
              <p
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800"
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
                placeholder="مثلاً حساسیت پوستی یا توضیح مدل مد نظر..."
              />
            </FormField>

            <div className="p-3.5 rounded-xl bg-[#F4F3F8] text-xs text-[#4E4760] leading-relaxed">
              {dataMode === 'real'
                ? 'با کلیک روی دکمه زیر، نوبت شما پس از بررسی ساعات کاری و عدم تداخل زمانی در پایگاه داده PostgreSQL ثبت می‌شود.'
                : 'توجه: با کلیک روی دکمه زیر، این نوبت شبیه‌سازی‌شده در حافظه مرورگر شما ثبت می‌شود و بلافاصله در بخش «نوبت‌های من» و همچنین تقویم پنل کسب‌وکار قابل مشاهده خواهد بود.'}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link to={`/booking/${business.slug}`}>
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>تغییر خدمت یا ساعت</span>
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting
                    ? 'در حال ثبت نوبت...'
                    : dataMode === 'real'
                      ? 'ثبت نهایی نوبت'
                      : 'ثبت رزرو شبیه‌سازی‌شده'}
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
  const { dataMode, bookingDraft, businesses, services, specialists } =
    usePrototypeData();
  const business =
    businesses.find((b) => b.slug === bookingDraft.businessSlug) ??
    businesses[0];
  const service =
    services.find((s) => s.id === bookingDraft.serviceId) ?? services[0];
  const specialist =
    specialists.find((sp) => sp.id === bookingDraft.specialistId) ??
    specialists[0];

  return (
    <div>
      <PageHeader
        kicker="رزرو آنلاین نوبت · گام پایانی"
        title={
          dataMode === 'real'
            ? 'رسید ثبت قطعی نوبت'
            : 'رسید رزرو شبیه‌سازی‌شده (Simulated Booking)'
        }
        subtitle={
          dataMode === 'real'
            ? 'نوبت شما با موفقیت در پایگاه داده ثبت شد و در پنل سالن و حساب کاربری شما فعال است.'
            : 'نوبت آزمایشی شما در وضعیت فرانت‌اند ثبت شد و آماده بررسی در پورتال مشتری است.'
        }
        routePattern="/booking/result"
        breadcrumbs={[
          { label: 'بازبینی نوبت', href: '/booking/confirm' },
          { label: 'رسید رزرو' },
        ]}
      />

      <BookingFlowStepIndicator currentStep={3} />

      <Card padding="lg" className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2 pb-4 border-b border-[#E6E3EE]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 mb-1">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <StatusBadge
              label={
                dataMode === 'real'
                  ? 'رزرو قطعی و ثبت‌شده در پایگاه داده'
                  : 'رزرو شبیه‌سازی‌شده (نسخه نمایشی بدون پرداخت واقعی)'
              }
              tone={dataMode === 'real' ? 'success' : 'warning'}
            />
          </div>
          <h2 className="text-xl font-extrabold text-[#171226] pt-1">
            نوبت شما با کد رهگیری{' '}
            <span className="font-mono text-[#2A0F54] bg-[#F3E8FF] px-2.5 py-0.5 rounded-lg">
              {bookingDraft.lastReferenceCode ?? 'BH-403990'}
            </span>{' '}
            ثبت شد
          </h2>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF9FC] border border-[#E6E3EE] space-y-3 text-xs sm:text-sm">
          <div className="flex justify-between py-1 border-b border-[#E6E3EE]">
            <span className="text-[#787189]">مرکز زیبایی:</span>
            <span className="font-extrabold text-[#171226]">
              {business ? `${business.name} (${business.city})` : bookingDraft.businessSlug}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E6E3EE]">
            <span className="text-[#787189]">خدمت و متخصص:</span>
            <span className="font-bold text-[#171226]">
              {service?.title ?? '—'} · {specialist?.fullName ?? '—'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E6E3EE]">
            <span className="text-[#787189]">زمان مراجعه:</span>
            <span className="font-extrabold text-[#2A0F54] tabular-nums">
              {bookingDraft.dateJalali} ساعت {bookingDraft.timeSlot}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E6E3EE]">
            <span className="text-[#787189]">مراجع:</span>
            <span className="font-bold text-[#171226]">
              {bookingDraft.customerName}
            </span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-[#787189]">مبلغ خدمت:</span>
            <span className="font-extrabold text-[#2A0F54] tabular-nums">
              {formatPriceToman(service?.priceToman ?? 0)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/me/appointments">
            <Button variant="primary" size="lg">
              <span>مشاهده در «نوبت‌های من» (/me/appointments)</span>
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
  const { dataMode, authUser, appointments, favoriteBusinessIds } =
    usePrototypeData();
  const upcomingCount = appointments.filter(
    (a) =>
      a.status === AppointmentStatus.Confirmed ||
      a.status === AppointmentStatus.Pending
  ).length;

  const displayName =
    dataMode === 'real'
      ? (authUser?.fullName ?? 'کاربر مهمان (وارد نشده)')
      : (authUser?.fullName ?? 'المیرا شمس (کاربر آزمایشی)');
  const displayPhoneCity =
    dataMode === 'real'
      ? authUser
        ? `شماره همراه: ${toPersianDigits(authUser.phone)} · ${authUser.defaultCity || 'تهران'}`
        : 'برای مشاهده نوبت‌ها ابتدا وارد شوید'
      : 'شماره همراه: ۰۹۱۲***۴۵۸۱ · تهران';

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={`پورتال مشتری · ${displayName}`}
        title="پیشخوان حساب کاربری من"
        subtitle="خلاصه وضعیت نوبت‌های پیش‌رو، سالن‌های نشان‌شده و دسترسی سریع به تنظیمات کاربری"
        routePattern="/me"
        breadcrumbs={[
          { label: 'صفحه اصلی', href: '/' },
          { label: 'حساب کاربری من' },
        ]}
        actions={
          <Link to="/search">
            <Button variant="primary" size="sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>رزرو نوبت جدید</span>
            </Button>
          </Link>
        }
      />

      {dataMode === 'real' && !authUser ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-amber-50/80 border-amber-200">
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-amber-950">
              شما هنوز وارد حساب کاربری خود نشده‌اید
            </p>
            <p className="text-xs text-amber-900">
              برای مشاهده نوبت‌های ثبت‌شده، علاقه‌مندی‌ها و مدیریت پروفایل، با شماره موبایل خود وارد شوید.
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary" size="sm">
              ورود به حساب کاربری (/login)
            </Button>
          </Link>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#787189]">نوبت‌های پیش‌رو</h2>
            <StatusBadge label="فعال" tone="primary" />
          </div>
          <p className="text-2xl font-extrabold text-[#2A0F54] tabular-nums">
            {toPersianDigits(upcomingCount)} نوبت ثبت‌شده
          </p>
          <Link
            to="/me/appointments"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#2A0F54] hover:underline pt-1"
          >
            <span>مدیریت و مشاهده نوبت‌ها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#787189]">سالن‌های منتخب</h2>
            <StatusBadge label="نشان‌شده" tone="accent" />
          </div>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(favoriteBusinessIds.length)} مرکز زیبایی
          </p>
          <Link
            to="/me/favorites"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#2A0F54] hover:underline pt-1"
          >
            <span>مشاهده لیست علاقه‌مندی‌ها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </Card>

        <Card className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#787189]">مشخصات کاربری</h2>
            <UserCheck className="w-4 h-4 text-[#2A0F54]" />
          </div>
          <p className="text-sm font-extrabold text-[#171226]">
            {displayName}
          </p>
          <p className="text-xs text-[#4E4760] tabular-nums">
            {displayPhoneCity}
          </p>
          <Link
            to="/me/profile"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#2A0F54] hover:underline pt-1"
          >
            <span>ویرایش اطلاعات پروفایل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </Card>
      </div>

      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#171226]">
            آخرین نوبت‌های شما
          </h2>
          <Link
            to="/me/appointments"
            className="text-xs font-bold text-[#2A0F54] hover:underline"
          >
            مشاهده همه نوبت‌ها ←
          </Link>
        </div>
        {appointments.length === 0 ? (
          <EmptyState
            title="هنوز نوبتی برای شما ثبت نشده است"
            description="از بخش جست‌وجوی سالن‌ها می‌توانید اولین نوبت خود را به صورت آنلاین رزرو کنید."
          />
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 3).map((apt) => (
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
  const { appointments, updateAppointmentStatus } = usePrototypeData();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AppointmentItem | null>(
    null
  );

  const upcomingList = appointments.filter(
    (a) =>
      a.status === AppointmentStatus.Confirmed ||
      a.status === AppointmentStatus.Pending
  );
  const historyList = appointments.filter(
    (a) =>
      a.status === AppointmentStatus.Completed ||
      a.status === AppointmentStatus.Cancelled ||
      a.status === AppointmentStatus.NoShow
  );

  const displayed = activeTab === 'upcoming' ? upcomingList : historyList;

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="پورتال مشتری · مدیریت نوبت‌ها"
        title="نوبت‌های من"
        subtitle="مشاهده جزئیات نوبت‌های پیش‌رو و سوابق مراجعات گذشته همراه با امکان لغو آزمایشی نوبت"
        routePattern="/me/appointments"
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
          description="می‌توانید از صفحه جست‌وجوی سالن‌ها یک نوبت آزمایشی جدید ثبت کنید."
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
        title="جزئیات نوبت مشتری (دمو)"
        description={selectedApt?.referenceCode}
      >
        {selectedApt ? (
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">مرکز زیبایی:</span>
              <span className="font-extrabold text-[#171226]">
                {selectedApt.businessName}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">خدمت:</span>
              <span className="font-bold text-[#171226]">
                {selectedApt.serviceTitle}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">متخصص:</span>
              <span className="font-bold">{selectedApt.specialistName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">تاریخ و ساعت:</span>
              <span className="font-bold tabular-nums">
                {selectedApt.dateJalali} ساعت {selectedApt.timeSlot}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[#787189]">مبلغ خدمت:</span>
              <span className="font-extrabold text-[#2A0F54] tabular-nums">
                {formatPriceToman(selectedApt.priceToman)}
              </span>
            </div>
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
        title="تایید لغو آزمایشی نوبت"
        confirmLabel="بله، نوبت لغو شود"
        message={`آیا مایلید نوبت خدمت «${cancelTarget?.serviceTitle ?? ''}» در ${cancelTarget?.businessName ?? ''} به وضعیت لغوشده تغییر کند؟`}
      />
    </div>
  );
};

/** ۷. سالن‌ها و متخصصان منتخب (/me/favorites) */
export const CustomerFavoritesPage: React.FC = () => {
  const { businesses, favoriteBusinessIds, toggleFavoriteBusiness } =
    usePrototypeData();

  const favoriteBusinesses = businesses.filter((b) =>
    favoriteBusinessIds.includes(b.id)
  );

  return (
    <div>
      <PageHeader
        kicker="پورتال مشتری · علاقه‌مندی‌ها"
        title="سالن‌ها و متخصصان منتخب من"
        subtitle="کسب‌وکارهایی که نشان کرده‌اید در این بخش برای دسترسی و رزرو سریع‌تر نگهداری می‌شوند."
        routePattern="/me/favorites"
        breadcrumbs={[
          { label: 'حساب کاربری من', href: '/me' },
          { label: 'سالن‌های منتخب' },
        ]}
      />

      {favoriteBusinesses.length === 0 ? (
        <EmptyState
          title="هنوز هیچ سالن یا متخصصی را نشان نکرده‌اید"
          description="در صفحه جست‌وجو یا پروفایل سالن‌ها روی آیکون قلب کلیک کنید تا به لیست منتخب شما اضافه شوند."
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
  );
};

/** ۸. ویرایش پروفایل مشتری (/me/profile) */
export const CustomerProfilePage: React.FC = () => {
  const { dataMode, authUser, updateCustomerProfile } = usePrototypeData();
  const [name, setName] = useState(
    authUser?.fullName ?? (dataMode === 'mock' ? 'المیرا شمس' : '')
  );
  const [phone, setPhone] = useState(
    authUser?.phone ?? (dataMode === 'mock' ? '09123456789' : '')
  );
  const [city, setCity] = useState(authUser?.defaultCity ?? 'تهران');
  const [smsReminder, setSmsReminder] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName);
      setPhone(authUser.phone);
      setCity(authUser.defaultCity || 'تهران');
    }
  }, [authUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateCustomerProfile({
        fullName: name.trim(),
        defaultCity: city.trim(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        kicker="پورتال مشتری · تنظیمات حساب"
        title="ویرایش مشخصات کاربری مشتری"
        subtitle="مدیریت نام، شهر پیش‌فرض جست‌وجو و ترجیحات دریافت یادآور نوبت"
        routePattern="/me/profile"
        breadcrumbs={[
          { label: 'حساب کاربری من', href: '/me' },
          { label: 'پروفایل من' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <Card padding="lg" className="lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-5">
            <FormField id="cust-name" label="نام و نام خانوادگی" required>
              <Input
                id="cust-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
            <FormField id="cust-phone" label="شماره همراه (احرازهویت‌شده)">
              <Input
                id="cust-phone"
                dir="ltr"
                value={phone}
                disabled={dataMode === 'real'}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
            <FormField id="cust-city" label="شهر پیش‌فرض جست‌وجو">
              <Input
                id="cust-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </FormField>

            <div className="pt-3 border-t border-[#E6E3EE]">
              <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#171226] cursor-pointer py-1">
                <span>دریافت پیامک یادآور ۲۴ ساعت پیش از نوبت</span>
                <input
                  type="checkbox"
                  checked={smsReminder}
                  onChange={(e) => setSmsReminder(e.target.checked)}
                  className="accent-[#2A0F54] w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={isSaving}>
                {isSaving
                  ? 'در حال ذخیره...'
                  : dataMode === 'real'
                    ? 'ذخیره تغییرات پروفایل'
                    : 'ذخیره تغییرات پروفایل (دمو)'}
              </Button>
            </div>
          </form>
        </Card>

        <Card variant="muted" className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={name || 'کاربر'} size="lg" tone="rose" />
            <div>
              <h2 className="text-base font-extrabold text-[#171226]">
                {name || 'کاربر BeautyHub'}
              </h2>
              <p className="text-xs text-[#4E4760] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#9D174D]" />
                <span>شهر پیش‌فرض: {city}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-[#4E4760] leading-relaxed pt-2 border-t border-[#E6E3EE]">
            اطلاعات کاربری شما هنگام رزرو نوبت جدید به‌طور خودکار در فرم بازبینی
            قرار می‌گیرد تا فرآیند رزرو در کمتر از ۳۰ ثانیه انجام شود.
          </p>
        </Card>
      </div>
    </div>
  );
};
