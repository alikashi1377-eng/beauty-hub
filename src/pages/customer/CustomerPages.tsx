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

/** ۱. صفحه ورود مشتری / مدیر سالن / مدیر کل با کد پیامکی خودکار (WebOTP) یا رمز عبور ثابت (/login) */
export const CustomerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    dataMode,
    authUser,
    requestOtpLogin,
    verifyOtpLogin,
    loginWithPassword,
    setAccountPassword,
    resetPasswordWithOtp,
    logoutUser,
  } = usePrototypeData();

  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const rawRedirect = searchParams.get('redirect') || '';
  const safeRedirectPath =
    rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '';

  const navigateAfterLogin = (user: {
    isPlatformAdmin?: boolean;
    roles: string[];
  }) => {
    if (safeRedirectPath) {
      navigate(safeRedirectPath, { replace: true });
    } else if (user.isPlatformAdmin && user.roles.includes('PLATFORM_ADMIN')) {
      navigate('/admin', { replace: true });
    } else if (user.roles.includes('BUSINESS_OWNER')) {
      navigate('/app', { replace: true });
    } else {
      navigate('/me', { replace: true });
    }
  };

  const verifyOtpCodeDirect = async (targetPhone: string, code6: string) => {
    if (!/^\d{6}$/.test(code6)) return;
    setError('');
    setIsSubmitting(true);
    try {
      const user = await verifyOtpLogin(targetPhone, code6);
      navigateAfterLogin(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'کد واردشده معتبر نیست.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // خواندن خودکار پیامک کد تایید (WebOTP API) روی موبایل به محض دریافت پیامک
  useEffect(() => {
    if (step !== 'otp' || authMethod !== 'otp') return;
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return;

    const ac = new AbortController();
    navigator.credentials
      .get({
        // @ts-expect-error WebOTP API transport option
        otp: { transport: ['sms'] },
        signal: ac.signal,
      })
      .then((cred: unknown) => {
        const otpCred = cred as { code?: string } | null;
        if (otpCred?.code) {
          const clean = toEnglishDigitsClient(otpCred.code).replace(/\D/g, '').slice(0, 6);
          if (clean.length === 6) {
            setOtpCode(clean);
            void verifyOtpCodeDirect(phone.trim(), clean);
          }
        }
      })
      .catch(() => {
        // نادیده گرفتن در صورت لغو یا عدم پشتیبانی مرورگر
      });

    return () => ac.abort();
  }, [step, authMethod, phone]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeIranMobileInput(phone);
    if (!isValidIranMobile(normalizedPhone)) {
      setError('لطفاً شماره موبایل ۱۱ رقمی معتبر وارد کنید (مثال: 09131234567).');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await requestOtpLogin(normalizedPhone);
      setStep('otp');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'خطا در ارسال کد تایید یک‌بارمصرف.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = toEnglishDigitsClient(otpCode).replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('کد تایید باید یک عدد ۶ رقمی معتبر باشد.');
      return;
    }
    await verifyOtpCodeDirect(phone.trim(), trimmedCode);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawIdentifier = toEnglishDigitsClient(phone).trim();
    const isPhoneCandidate = /^0?9\d+$/.test(rawIdentifier.replace(/\D/g, ''));
    const finalIdentifier = isPhoneCandidate
      ? normalizeIranMobileInput(rawIdentifier)
      : rawIdentifier;

    if (!finalIdentifier || (isPhoneCandidate && !isValidIranMobile(finalIdentifier))) {
      setError('لطفاً شماره موبایل ۱۱ رقمی معتبر یا نام کاربری خود را وارد کنید.');
      return;
    }
    if (password.trim().length < 4) {
      setError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const user = await loginWithPassword(finalIdentifier, password);
      navigateAfterLogin(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'شماره موبایل / نام کاربری یا رمز عبور صحیح نیست.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFixedPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await setAccountPassword(newPassword);
    if (ok) {
      setNewPassword('');
    }
  };

  const handleRequestResetOtp = async () => {
    const normalizedPhone = normalizeIranMobileInput(phone);
    if (!isValidIranMobile(normalizedPhone)) {
      setError('لطفاً ابتدا شماره موبایل ۱۱ رقمی معتبر خود را وارد کنید.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await requestOtpLogin(normalizedPhone);
      setResetOtpSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در ارسال کد بازیابی رمز عبور.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeIranMobileInput(phone);
    const trimmedCode = toEnglishDigitsClient(otpCode)
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!isValidIranMobile(normalizedPhone)) {
      setError('شماره موبایل معتبر نیست.');
      return;
    }
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('کد تایید ۶ رقمی پیامک‌شده را وارد کنید.');
      return;
    }
    if (newPassword.trim().length < 6) {
      setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const ok = await resetPasswordWithOtp(
        normalizedPhone,
        trimmedCode,
        newPassword
      );
      if (ok) {
        setIsResettingPassword(false);
        setResetOtpSent(false);
        setOtpCode('');
        setNewPassword('');
        const isSuperAdmin = normalizedPhone === '09138201042';
        if (safeRedirectPath) {
          navigate(safeRedirectPath, { replace: true });
        } else if (isSuperAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/me', { replace: true });
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در بازنشانی رمز عبور.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-4 sm:my-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-[32px] border border-[#CBD5E1] bg-white p-6 sm:p-10 shadow-[0_14px_45px_-20px_rgba(6,17,56,0.14)]">
        {/* ستون فرم ورود دوگانه (کد پیامکی خودکار + رمز عبور ثابت) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0E7FF] text-[#0057FF] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#0057FF]" />
                <span>ورود هوشمند با پیامک خودکار یا رمز ثابت</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#10B981]/30 text-[11px] font-extrabold">
                حفظ نشست ۳۰ روزه
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#061138]">
              ورود یا عضویت در Timeto
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              با کد تایید پیامکی (خوانش خودکار از پیامک) یا رمز عبور ثابت وارد حساب کاربری یا پیشخوان مدیریت سالن خود شوید.
            </p>
          </div>

          {/* تب انتخاب روش ورود: کد پیامکی یا رمز عبور ثابت */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                authMethod === 'otp'
                  ? 'bg-[#0057FF] text-white shadow-2xs'
                  : 'text-[#334155] hover:text-[#061138]'
              }`}
            >
              کد یک‌بارمصرف پیامکی
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setError('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                authMethod === 'password'
                  ? 'bg-[#061138] text-[#00E5FF] shadow-2xs'
                  : 'text-[#334155] hover:text-[#061138]'
              }`}
            >
              ورود با رمز عبور ثابت
            </button>
          </div>

          {authUser ? (
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] space-y-3 text-xs text-[#059669]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold text-[#061138]">
                    کاربر فعال: {authUser.fullName} ({authUser.phone})
                  </p>
                  <p className="text-[11px] text-[#059669] mt-0.5">
                    نشست ۳۰ روزه شما فعال است و نیازی به ورود مجدد ندارید.
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

              {/* تعریف یا تغییر رمز عبور ثابت برای ورود بدون پیامک در دفعات بعد */}
              <form
                onSubmit={handleSaveFixedPassword}
                className="pt-3 border-t border-[#A7F3D0] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <Input
                  type="password"
                  dir="ltr"
                  placeholder="تعریف رمز عبور ثابت (حداقل ۶ کاراکتر)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button type="submit" variant="primary" size="sm" className="shrink-0">
                  ذخیره رمز ثابت
                </Button>
              </form>
            </div>
          ) : null}

          {authMethod === 'password' ? (
            isResettingPassword ? (
              <form
                onSubmit={handleConfirmResetPassword}
                className="space-y-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]"
                noValidate
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                  <span className="text-xs font-extrabold text-[#0057FF]">
                    بازیابی / تعریف رمز عبور جدید با کد پیامکی
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setResetOtpSent(false);
                      setError('');
                    }}
                    className="text-[11px] font-bold text-[#64748B] hover:text-[#061138] cursor-pointer"
                  >
                    بازگشت به ورود با رمز
                  </button>
                </div>

                <FormField
                  id="reset-pass-phone"
                  label="شماره تلفن همراه (۱۱ رقم با 09)"
                  required
                  error={error}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      id="reset-pass-phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={11}
                      dir="ltr"
                      placeholder="09123456789"
                      value={phone}
                      onChange={(e) =>
                        setPhone(normalizeIranMobileInput(e.target.value))
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => void handleRequestResetOtp()}
                      disabled={isSubmitting}
                    >
                      {resetOtpSent ? 'ارسال مجدد کد' : 'ارسال کد پیامکی'}
                    </Button>
                  </div>
                </FormField>

                {resetOtpSent ? (
                  <>
                    <FormField
                      id="reset-otp-code"
                      label="کد ۶ رقمی پیامک‌شده"
                      required
                    >
                      <Input
                        id="reset-otp-code"
                        dir="ltr"
                        maxLength={6}
                        inputMode="numeric"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(
                            toEnglishDigitsClient(e.target.value)
                              .replace(/\D/g, '')
                              .slice(0, 6)
                          )
                        }
                      />
                    </FormField>

                    <FormField
                      id="reset-new-password"
                      label="رمز عبور جدید (حداقل ۶ کاراکتر)"
                      required
                    >
                      <Input
                        id="reset-new-password"
                        type="password"
                        dir="ltr"
                        placeholder="رمز عبور جدید..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </FormField>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      isLoading={isSubmitting}
                    >
                      <span>ثبت رمز جدید و ورود به حساب</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <p className="text-[11px] text-[#64748B]">
                    شماره موبایل خود را وارد کرده و دکمه «ارسال کد پیامکی» را بزنید تا بتوانید رمز عبور جدید تعریف کنید.
                  </p>
                )}
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
                <FormField
                  id="login-pass-phone"
                  label="شماره تلفن همراه یا نام کاربری"
                  required
                  error={error}
                >
                  <Input
                    id="login-pass-phone"
                    type="text"
                    maxLength={32}
                    dir="ltr"
                    placeholder="09123456789"
                    value={phone}
                    hasError={Boolean(error)}
                    onChange={(e) => setPhone(toEnglishDigitsClient(e.target.value))}
                  />
                </FormField>

                <FormField
                  id="login-fixed-password"
                  label="رمز عبور ثابت"
                  hint="اگر قبلاً در حساب خود رمز عبور ثابت تعریف کرده‌اید، بدون نیاز به پیامک وارد شوید"
                  required
                >
                  <Input
                    id="login-fixed-password"
                    type="password"
                    dir="ltr"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </FormField>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(true);
                      setError('');
                    }}
                    className="font-extrabold text-[#0057FF] hover:underline cursor-pointer"
                  >
                    فراموشی رمز عبور / دریافت رمز جدید با پیامک ←
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  <span>ورود مستقیم با رمز عبور</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </form>
            )
          ) : step === 'phone' ? (
            <form
              onSubmit={handleRequestOtp}
              className="space-y-4"
              noValidate
            >
              <FormField
                id="login-phone"
                label="شماره تلفن همراه (۱۱ رقم با 09)"
                hint="شماره ۱۱ رقمی با پیش‌شماره 09 (تبدیل خودکار اعداد فارسی)"
                error={error}
                required
              >
                <Input
                  id="login-phone"
                  type="tel"
                  inputMode="tel"
                  maxLength={11}
                  dir="ltr"
                  placeholder="09131234567"
                  value={phone}
                  hasError={Boolean(error)}
                  onChange={(e) =>
                    setPhone(normalizeIranMobileInput(e.target.value))
                  }
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
              >
                <span>دریافت کد تایید پیامکی</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              <FormField
                id="login-otp-code"
                label={`کد تایید ۶ رقمی ارسال‌شده به ${phone}`}
                hint="به محض دریافت پیامک، کد به صورت خودکار جایگذاری و تایید می‌شود"
                error={error}
                required
              >
                <Input
                  id="login-otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  maxLength={6}
                  value={otpCode}
                  hasError={Boolean(error)}
                  onChange={(e) => {
                    const clean = toEnglishDigitsClient(e.target.value)
                      .replace(/\D/g, '')
                      .slice(0, 6);
                    setOtpCode(clean);
                    if (clean.length === 6 && dataMode === 'real') {
                      void verifyOtpCodeDirect(phone.trim(), clean);
                    }
                  }}
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
                  isLoading={isSubmitting}
                >
                  <span>تایید و ورود</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          <div className="p-3.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] flex items-center gap-2.5 text-xs text-[#334155]">
            <ShieldCheck className="w-4 h-4 text-[#0057FF] shrink-0" />
            <span>
              پس از یک‌بار ورود، نشست شما تا ۳۰ روز روی این دستگاه فعال می‌ماند و همچنین می‌توانید رمز عبور ثابت برای ورود فوری بدون پیامک تعریف کنید.
            </span>
          </div>

          <div className="pt-3 border-t border-[#CBD5E1] flex items-center justify-between text-xs text-[#475569]">
            <span>صاحب سالن زیبایی یا متخصص هستید؟</span>
            <Link
              to="/business/register"
              className="font-bold text-[#0057FF] hover:text-[#0041C4] transition-colors"
            >
              ثبت رایگان کسب‌وکار ←
            </Link>
          </div>
        </div>

        {/* ستون ویترین برند Timeto (تصاویر ۱۰۰٪ بدون نیاز به فیلترشکن) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#061138] border border-[#1E293B] p-6 flex flex-col items-center text-center space-y-5 text-white">
          <div className="relative w-full max-w-[320px] h-[230px] flex items-center justify-center pt-2">
            <div
              className="w-28 sm:w-32 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-md"
              style={{
                transform: 'rotate(9deg) translateX(52px) translateY(10px)',
              }}
            >
              <img
                src={getBeautyPhotoUrl('کلینیک پوست و فیشیال', 'پوست و فیشیال')}
                alt="پوست و فیشیال"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="w-28 sm:w-32 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-md"
              style={{
                transform: 'rotate(-9deg) translateX(-52px) translateY(10px)',
              }}
            >
              <img
                src={getBeautyPhotoUrl('استودیو تخصصی ناخن', 'ناخن')}
                alt="طراحی ناخن"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 w-36 sm:w-40 h-48 rounded-3xl overflow-hidden border-4 border-[#00E5FF] shadow-xl">
              <img
                src={getBeautyPhotoUrl('سالن زیبایی رویال گلزار', 'مو و رنگ')}
                alt="استایل مو"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h2 className="text-lg font-extrabold text-white">
              تایم تو؛ وقت زیبایی تو، به انتخاب تو
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              بهترین سالن‌ها و متخصصان اصفهان و درچه را مقایسه کنید و نوبت خود را
              آنی رزرو نمایید.
            </p>
          </div>
        </div>
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
    businesses,
    services,
    specialists,
    bookingDraft,
    updateBookingDraft,
  } = usePrototypeData();

  const [serviceCatFilter, setServiceCatFilter] = useState<string>('ALL');
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
  const visibleServices =
    serviceCatFilter === 'ALL'
      ? bizServices
      : bizServices.filter((s) => s.category === serviceCatFilter);

  const [realSlots, setRealSlots] = useState<TimeSlotAvailabilityItem[] | null>(
    null
  );
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  const upcomingDays =
    dataMode === 'real'
      ? getUpcomingJalaliDays(6)
      : [
          { date: '۱۴۰۵/۰۸/۰۳', label: 'یکشنبه ۳ آبان', tag: 'امروز' },
          { date: '۱۴۰۵/۰۸/۰۴', label: 'دوشنبه ۴ آبان', tag: 'فردا' },
          { date: '۱۴۰۵/۰۸/۰۵', label: 'سه‌شنبه ۵ آبان', tag: 'ظرفیت باز' },
          { date: '۱۴۰۵/۰۸/۰۶', label: 'چهارشنبه ۶ آبان', tag: 'آخر هفته' },
        ];

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
      setTimeout(() => {
        const el = document.getElementById(`booking-step-${targetStep}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
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
    setActiveStepIndicator(1);
    const exists = selectedServiceIds.includes(serviceId);
    let nextIds: string[];
    if (exists) {
      // اگر بیش از ۱ خدمت انتخاب شده، با کلیک مجدد حذف شود؛ اگر تنها خدمت است، باقی بماند
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
      navigate('/booking/confirm');
      return;
    }
    setActiveStepIndicator(step);
    const section = document.getElementById(`booking-step-${step}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  const calendarDays30 = Array.from({ length: 30 }, (_, idx) => idx + 1);
  const selectedDayIdx = Math.max(
    0,
    upcomingDays.findIndex((d) => d.date === bookingDraft.dateJalali)
  );

  return (
    <div className="pb-28 lg:pb-8">
      {/* هدر فشرده اطلاعات سالن */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-1">
            <Link to={`/salon/${business.slug}`} className="hover:text-[#0057FF] font-bold">
              {business.name}
            </Link>
            <span>/</span>
            <span>رزرو نوبت آنلاین</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-[#061138]">
            رزرو نوبت در {business.name}
          </h1>
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0E7FF] text-[#0057FF] text-xs font-extrabold">
          <MapPin className="w-3.5 h-3.5" />
          <span>{business.neighborhood}</span>
        </span>
      </div>

      {business.isSampleShowcase ? (
        <div className="mb-5 p-4 rounded-2xl bg-[#FFFBEB] border-2 border-[#F59E0B] text-[#92400E] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs sm:text-sm space-y-0.5">
            <p className="font-extrabold">
              این سالن یک «نمونه نمایشی پلتفرم» است (غیرقابل رزرو واقعی)
            </p>
            <p className="text-xs text-[#B45309]">
              مراحل زیر صرفاً جهت آشنایی با فرآیند رزرو آنلاین تایم تو نمایش داده می‌شود و امکان ثبت نهایی نوبت روی سالن‌های نمونه غیرفعال است.
            </p>
          </div>
          <Link to={`/salon/${business.slug}`}>
            <Button variant="outline" size="sm">
              بازگشت به پروفایل نمونه
            </Button>
          </Link>
        </div>
      ) : null}

      {/* نوار مرحله‌به‌مرحله مینیمال و قابل کلیک */}
      <BookingFlowStepIndicator
        currentStep={activeStepIndicator}
        onSelectStep={handleNavigateStep}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* گام ۱: انتخاب خدمت (امکان انتخاب یک یا چند خدمت بدون به‌هم‌ریختگی در موبایل) */}
          <Card
            id="booking-step-1"
            className="rounded-3xl space-y-4 scroll-mt-32"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CBD5E1] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                  ۱
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                    انتخاب خدمات مورد نظر
                  </h2>
                  <p className="text-[11px] text-[#475569]">
                    می‌توانید یک یا چند خدمت را همزمان انتخاب کنید
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E0E7FF] text-[#0057FF] text-xs font-extrabold tabular-nums">
                {toPersianDigits(selectedServiceIds.length)} خدمت انتخاب‌شده
              </span>
            </div>

            {serviceCategories.length > 1 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setServiceCatFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    serviceCatFilter === 'ALL'
                      ? 'bg-[#0057FF] text-white'
                      : 'bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]'
                  }`}
                >
                  همه خدمات ({toPersianDigits(bizServices.length)})
                </button>
                {serviceCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setServiceCatFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
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

            <div className="space-y-2.5">
              {visibleServices.map((srv) => {
                const isSelected = selectedServiceIds.includes(srv.id);
                const srvThumb = getBeautyPhotoUrl(srv.title, srv.category);
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
                    className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'border-[#0057FF] bg-[#EFF6FF] ring-2 ring-[#0057FF]/15 shadow-2xs'
                        : 'border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] hover:border-[#94A3B8]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* چک‌باکس واضح چندانتخابی */}
                      <span
                        className={`mt-1 w-5 h-5 rounded-lg border-2 inline-flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#0057FF] border-[#0057FF] text-white'
                            : 'bg-white border-[#94A3B8] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </span>

                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#E0E7FF] border border-[#CBD5E1] shrink-0">
                        <img
                          src={srvThumb}
                          alt={srv.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                          <p className="text-xs sm:text-sm font-extrabold text-[#061138] leading-snug break-words">
                            {srv.title}
                          </p>
                          <span className="text-xs sm:text-sm font-extrabold text-[#0057FF] tabular-nums shrink-0">
                            {formatPriceToman(srv.priceToman)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#475569] tabular-nums">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#CBD5E1] text-[#061138] font-bold">
                            {srv.category}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-[#0057FF]" />
                            {formatDurationMinutes(srv.durationMinutes)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* گام ۲: انتخاب متخصص */}
          <Card
            id="booking-step-2"
            className="rounded-3xl space-y-4 scroll-mt-32"
          >
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                  ۲
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                  انتخاب متخصص
                </h2>
              </div>
              <span className="text-xs text-[#475569] font-semibold">
                {selectedSpecialist?.fullName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bizSpecialists.map((sp) => {
                const isSelected = selectedSpecialist?.id === sp.id;
                const spAvatar = getSpecialistAvatarUrl(
                  sp.fullName,
                  sp.roleTitle
                );
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      setActiveStepIndicator(2);
                      updateBookingDraft({ specialistId: sp.id });
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
          </Card>

          {/* گام ۳: انتخاب روز و ساعت مراجعه */}
          <Card
            id="booking-step-3"
            className="rounded-3xl space-y-5 scroll-mt-32"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CBD5E1] pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                  ۳
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                    انتخاب روز و ساعت مراجعه
                  </h2>
                  <p className="text-xs text-[#475569]">
                    روز و ساعت دلخواه خود را از ظرفیت‌های آزاد انتخاب کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-[#CBD5E1]">
                <button
                  type="button"
                  disabled={selectedDayIdx <= 0}
                  onClick={() => {
                    setActiveStepIndicator(3);
                    const prev = upcomingDays[Math.max(0, selectedDayIdx - 1)];
                    if (prev) updateBookingDraft({ dateJalali: prev.date });
                  }}
                  aria-label="روز قبل"
                  className="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center text-[#0057FF] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs font-extrabold text-[#061138] tabular-nums px-2">
                  آبان ۱۴۰۵ ({bookingDraft.dateJalali})
                </span>
                <button
                  type="button"
                  disabled={selectedDayIdx >= upcomingDays.length - 1}
                  onClick={() => {
                    setActiveStepIndicator(3);
                    const next =
                      upcomingDays[
                        Math.min(upcomingDays.length - 1, selectedDayIdx + 1)
                      ];
                    if (next) updateBookingDraft({ dateJalali: next.date });
                  }}
                  aria-label="روز بعد"
                  className="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center text-[#0057FF] disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* قرص‌های انتخاب سریع روزهای آینده */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {upcomingDays.map((d) => {
                const isSelected = bookingDraft.dateJalali === d.date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => {
                      setActiveStepIndicator(3);
                      updateBookingDraft({ dateJalali: d.date });
                    }}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer tabular-nums transition-all text-right ${
                      isSelected
                        ? 'bg-[#0057FF] text-white border-[#0057FF] font-bold shadow-xs'
                        : 'bg-white text-[#061138] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <p className="font-extrabold">{d.label}</p>
                    <p
                      className={`text-[11px] mt-1 ${
                        isSelected ? 'text-white/85' : 'text-[#475569]'
                      }`}
                    >
                      {d.date} · {d.tag}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* شبکه تقویم ماهانه */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-2.5">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#475569] pb-2 border-b border-[#CBD5E1]">
                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((wd) => (
                  <span key={wd}>{wd}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {calendarDays30.map((dayNum) => {
                  const mappedIndex = dayNum - 3;
                  const mappedUpcoming =
                    mappedIndex >= 0 && mappedIndex < upcomingDays.length
                      ? upcomingDays[mappedIndex]
                      : null;
                  const isActive =
                    mappedUpcoming &&
                    bookingDraft.dateJalali === mappedUpcoming.date;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      disabled={!mappedUpcoming}
                      onClick={() => {
                        if (mappedUpcoming) {
                          setActiveStepIndicator(3);
                          updateBookingDraft({
                            dateJalali: mappedUpcoming.date,
                          });
                        }
                      }}
                      className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-full text-xs tabular-nums flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-[#0057FF] text-white font-extrabold shadow-sm scale-105 cursor-pointer'
                          : mappedUpcoming
                          ? 'bg-white text-[#061138] font-bold border border-[#94A3B8] hover:border-[#0057FF] cursor-pointer'
                          : 'text-[#94A3B8] cursor-default'
                      }`}
                    >
                      {toPersianDigits(dayNum)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ساعت‌های قابل انتخاب */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#061138]">
                  ساعت‌های قابل رزرو در {bookingDraft.dateJalali}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-[#475569]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0057FF]" />
                    انتخاب شما
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full border border-[#94A3B8] bg-white" />
                    آزاد
                  </span>
                </div>
              </div>

              {isLoadingSlots ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#475569]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0057FF]" />
                  <span>در حال دریافت زمان‌های آزاد...</span>
                </div>
              ) : timeSlotOptions.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-center text-xs text-[#475569]">
                  در این تاریخ ظرفیت خالی وجود ندارد. لطفاً روز دیگری را انتخاب
                  کنید.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                            setActiveStepIndicator(3);
                            updateBookingDraft({ timeSlot: slot.time });
                          }
                        }}
                        className={`px-3.5 py-2.5 rounded-xl text-xs tabular-nums border transition-all flex items-center justify-between ${
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
          </Card>
        </div>

        {/* خلاصه انتخاب در دسکتاپ */}
        <div className="lg:col-span-4">
          <Card variant="dark" className="rounded-3xl space-y-5 sticky top-32">
            <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
              <h2 className="text-sm font-extrabold text-white">
                خلاصه نوبت انتخابی
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0057FF] text-[11px] text-white font-bold">
                {toPersianDigits(selectedServicesSummary.services.length)} خدمت
              </span>
            </div>

            {selectedSpecialist ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/10">
                <Avatar name={selectedSpecialist.fullName} size="md" />
                <div>
                  <p className="text-xs font-extrabold text-white">
                    {selectedSpecialist.fullName}
                  </p>
                  <p className="text-[11px] text-white/75">
                    {selectedSpecialist.roleTitle}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 text-xs text-white/90">
              <div className="flex justify-between gap-2">
                <span className="text-white/70">سالن زیبایی:</span>
                <span className="font-bold text-white text-left">
                  {business.name}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-white/70 block">خدمات انتخاب‌شده:</span>
                <div className="space-y-1">
                  {selectedServicesSummary.services.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between gap-2 bg-white/8 px-2.5 py-1.5 rounded-xl"
                    >
                      <span className="font-bold text-white truncate">
                        {srv.title}
                      </span>
                      <span className="text-[11px] text-[#00E5FF] font-bold tabular-nums shrink-0">
                        {formatPriceToman(srv.priceToman)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/70">مدت زمان کل:</span>
                <span className="font-bold text-white tabular-nums">
                  {formatDurationMinutes(
                    selectedServicesSummary.totalDurationMinutes
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-white/70">تاریخ و ساعت:</span>
                <span className="font-bold text-[#00E5FF] tabular-nums">
                  {bookingDraft.dateJalali} · ساعت {bookingDraft.timeSlot}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/15 text-sm">
                <span className="font-bold text-white">جمع مبلغ:</span>
                <span className="text-base font-extrabold text-white tabular-nums">
                  {formatPriceToman(selectedServicesSummary.totalPriceToman)}
                </span>
              </div>
            </div>

            {business.isSampleShowcase ? (
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-extrabold text-center">
                سالن نمونه نمایشی (امکان ثبت نوبت واقعی وجود ندارد)
              </div>
            ) : (
              <Button
                variant="accent"
                size="lg"
                fullWidth
                onClick={() => navigate('/booking/confirm')}
              >
                <span>ادامه و تایید نهایی</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* نوار چسبان موبایل برای ادامه سریع رزرو (بالای منوی پایین موبایل) */}
      <div className="lg:hidden fixed bottom-[76px] inset-x-3 z-30 rounded-2xl bg-[#061138]/95 backdrop-blur-xl text-white border border-white/15 px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold truncate">
            {selectedServicesSummary.combinedTitle || 'انتخاب خدمت'}
          </p>
          <p className="text-[11px] text-[#00E5FF] font-bold tabular-nums mt-0.5">
            {formatPriceToman(selectedServicesSummary.totalPriceToman)} · ساعت{' '}
            {bookingDraft.timeSlot}
          </p>
        </div>
        {business.isSampleShowcase ? (
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-extrabold shrink-0">
            نمونه نمایشی
          </span>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/booking/confirm')}
          >
            <span>ادامه رزرو</span>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
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

        <Card className="rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
            <h2 className="text-base font-extrabold text-[#061138]">
              ۱. خلاصه خدمات و زمان انتخاب‌شده
            </h2>
            <Link
              to={`/booking/${business.slug}?step=1`}
              className="text-xs font-bold text-[#0057FF] hover:underline"
            >
              ویرایش خدمات یا زمان
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-1">
              <span className="text-xs text-[#475569]">سالن زیبایی:</span>
              <p className="font-extrabold text-[#061138]">{business.name}</p>
              <p className="text-xs text-[#475569]">
                {business.city}، {business.neighborhood}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-1">
              <span className="text-xs text-[#475569]">
                خدمات ({toPersianDigits(selectedServicesSummary.services.length)}{' '}
                مورد) و متخصص:
              </span>
              <p className="font-extrabold text-[#061138]">
                {selectedServicesSummary.combinedTitle}
              </p>
              <p className="text-xs text-[#475569]">
                متخصص: {specialist.fullName} (
                {formatDurationMinutes(
                  selectedServicesSummary.totalDurationMinutes
                )}
                )
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div>
              <span className="text-[#475569]">زمان مراجعه: </span>
              <strong className="font-extrabold text-[#0057FF] tabular-nums">
                {bookingDraft.dateJalali} — ساعت {bookingDraft.timeSlot}
              </strong>
            </div>
            <div>
              <span className="text-[#475569]">جمع تعرفه خدمات: </span>
              <strong className="font-extrabold text-[#0057FF] tabular-nums">
                {formatPriceToman(selectedServicesSummary.totalPriceToman)}
              </strong>
            </div>
          </div>
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
                با ثبت نهایی، زمان انتخابی به نام شما رزرو شده و کد رهگیری
                نوبت بلافاصله صادر می‌گردد.
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
                <span>ثبت نهایی نوبت</span>
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

  return (
    <div>
      <PageHeader
        kicker="رزرو آنلاین نوبت · رسید نوبت"
        title="نوبت شما با موفقیت ثبت شد"
        subtitle="جزئیات نوبت و کد رهگیری شما در زیر درج شده و در بخش «نوبت‌های من» قابل پیگیری است."
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
            <StatusBadge label="نوبت ثبت‌شده" tone="success" />
          </div>
          <h2 className="text-xl font-extrabold text-[#061138] pt-1">
            کد رهگیری نوبت:{' '}
            <span
              dir="ltr"
              className="font-mono text-[#0057FF] bg-[#E0E7FF] px-3 py-1 rounded-xl border border-[#BFDBFE]"
            >
              {bookingDraft.lastReferenceCode ?? 'TM-403990'}
            </span>
          </h2>
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

/** ۵. خلاصه حساب مشتری (/me) — مطابق پروفایل کاربری و امتیاز وفاداری در Capture5.PNG راست */
export const CustomerOverviewPage: React.FC = () => {
  const {
    dataMode,
    authUser,
    appointments,
    businesses,
    specialists,
    favoriteBusinessIds,
    favoriteSpecialistIds,
    toggleFavoriteBusiness,
    toggleFavoriteSpecialist,
  } = usePrototypeData();
  const upcomingCount = appointments.filter(
    (a) =>
      a.status === AppointmentStatus.Confirmed ||
      a.status === AppointmentStatus.Pending
  ).length;
  const completedCount =
    appointments.filter((a) => a.status === AppointmentStatus.Completed)
      .length || 4;

  const favoriteBusinesses = businesses.filter((b) =>
    favoriteBusinessIds.includes(b.id)
  );
  const favoriteSpecialists = specialists.filter((sp) =>
    favoriteSpecialistIds.includes(sp.id)
  );
  const totalFavoritesCount =
    favoriteBusinesses.length + favoriteSpecialists.length;

  const displayName =
    dataMode === 'real'
      ? (authUser?.fullName ?? 'کاربر مهمان')
      : (authUser?.fullName ?? 'المیرا شمس');
  const displayPhoneCity =
    dataMode === 'real'
      ? authUser
        ? `شماره همراه: ${toPersianDigits(authUser.phone)} · ${authUser.defaultCity || 'اصفهان'}`
        : 'برای مشاهده نوبت‌ها ابتدا وارد شوید'
      : 'شماره همراه: ۰۹۱۳۳۴۵۶۷۸۹ · اصفهان';

  return (
    <div className="space-y-6">
      {/* هدر پروفایل مشتری با آواتار دایره‌ای و کارت ۲ ستونی امتیاز وفاداری */}
      <Card className="rounded-[32px] p-6 sm:p-8 border border-[#E6E0F5] bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-4">
            <Avatar name={displayName} size="xl" tone="rose" />
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#EDE9FE] text-[#8B5CF6] text-[11px] font-bold">
                <Award className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>عضو سطح طلایی باشگاه مشتریان</span>
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B2E]">
                {displayName}
              </h1>
              <p className="text-xs text-[#6B6480] tabular-nums">
                {displayPhoneCity}
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Link to="/search">
                  <Button variant="primary" size="sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>رزرو نوبت جدید</span>
                  </Button>
                </Link>
                <Link to="/me/favorites">
                  <Button variant="outline" size="sm">
                    <Heart className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>علاقه‌مندی‌ها ({toPersianDigits(totalFavoritesCount)})</span>
                  </Button>
                </Link>
                <Link to="/me/profile">
                  <Button variant="outline" size="sm">
                    ویرایش پروفایل
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* کارت ۲ ستونی باشگاه مشتریان و امتیاز وفاداری */}
          <div className="lg:col-span-6 rounded-3xl bg-[#FAF8FF] border border-[#E6E0F5] p-5 grid grid-cols-2 gap-4 text-center">
            <div className="border-l border-[#E6E0F5] pl-4 space-y-1">
              <span className="text-xs font-bold text-[#8B5CF6] block">
                امتیاز باشگاه مشتریان
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#8B5CF6] tabular-nums">
                ۲,۴۵۰
              </p>
              <span className="text-[11px] text-[#6B6480] block">
                قابل تبدیل به کد تخفیف رزرو
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-[#6B6480] block">
                نوبت‌های تکمیل‌شده
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1E1B2E] tabular-nums">
                {toPersianDigits(completedCount)} نوبت
              </p>
              <span className="text-[11px] text-[#10B981] font-bold inline-flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>مشتری خوش‌حساب</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

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
        title="جزئیات نوبت"
        description={selectedApt?.referenceCode}
      >
        {selectedApt ? (
          <div className="space-y-2.5 text-xs">
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
            <div className="flex justify-between pt-1">
              <span className="text-[#6B6480]">مبلغ خدمت:</span>
              <span className="font-bold text-[#8B5CF6] tabular-nums">
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
  const {
    dataMode,
    authUser,
    updateCustomerProfile,
    setAccountPassword,
  } = usePrototypeData();
  const [name, setName] = useState(
    authUser?.fullName ?? (dataMode === 'mock' ? 'المیرا شمس' : '')
  );
  const [phone, setPhone] = useState(
    authUser?.phone ?? (dataMode === 'mock' ? '09123456789' : '')
  );
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
    <div>
      <PageHeader
        kicker="حساب کاربری · اطلاعات شخصی و رمز عبور"
        title="ویرایش مشخصات کاربری و تنظیم رمز عبور"
        subtitle="مدیریت نام، شهر پیش‌فرض جست‌وجو، تعریف رمز عبور ثابت و تنظیمات پیامک یادآور نوبت"
        breadcrumbs={[
          { label: 'حساب کاربری من', href: '/me' },
          { label: 'اطلاعات کاربری' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg" className="rounded-3xl">
            <form onSubmit={handleSave} className="space-y-5">
              <FormField id="cust-name" label="نام و نام خانوادگی" required>
                <Input
                  id="cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>
              <FormField id="cust-phone" label="شماره همراه">
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

              <div className="pt-3 border-t border-[#E6E0F5]">
                <label className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#1E1B2E] cursor-pointer py-1">
                  <span>دریافت پیامک یادآور ۲۴ ساعت پیش از نوبت</span>
                  <input
                    type="checkbox"
                    checked={smsReminder}
                    onChange={(e) => setSmsReminder(e.target.checked)}
                    className="accent-[#8B5CF6] w-4 h-4"
                  />
                </label>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  ذخیره تغییرات پروفایل
                </Button>
              </div>
            </form>
          </Card>

          <Card padding="lg" className="rounded-3xl space-y-4 border-2 border-[#0057FF]/20">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-[#061138]">
                تنظیم یا تغییر رمز عبور ثابت حساب کاربری
              </h3>
              <p className="text-xs text-[#64748B]">
                با تعیین رمز عبور ثابت، در مراجعات بعدی بدون نیاز به دریافت کد پیامکی می‌توانید مستقیماً وارد شوید. در صورت فراموشی رمز نیز همیشه از صفحه ورود با کد پیامکی قابل بازیابی است.
              </p>
            </div>
            <form onSubmit={handleSavePassword} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <FormField id="cust-new-pass" label="رمز عبور جدید (حداقل ۶ کاراکتر)" required>
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
                ثبت رمز عبور ثابت
              </Button>
            </form>
          </Card>
        </div>

        <Card variant="muted" className="lg:col-span-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={name || 'کاربر'} size="lg" tone="rose" />
            <div>
              <h2 className="text-base font-extrabold text-[#061138]">
                {name || 'کاربر Timeto'}
              </h2>
              <p className="text-xs text-[#6B6480] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>شهر پیش‌فرض: {city}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-[#6B6480] leading-relaxed pt-2 border-t border-[#E6E0F5]">
            اطلاعات کاربری شما هنگام رزرو نوبت جدید به‌طور خودکار در فرم
            تایید قرار می‌گیرد تا فرآیند رزرو سریع‌تر انجام شود.
          </p>
        </Card>
      </div>
    </div>
  );
};
