import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  MapPin,
  Phone,
  RefreshCw,
  Scissors,
  Sparkles,
  Store,
  User,
  Users,
  X,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { BusinessType } from '../../types';
import {
  isValidIranMobile,
  normalizeIranMobileInput,
  toEnglishDigitsClient,
  toPersianDigits,
} from '../../utils/formatters';
import {
  AccountRoleChoice,
  applyOtpDigitChange,
  AuthFlowScreen,
  generateSuggestedPassword,
  getLastSavedCredential,
  getSavedMemoryAccounts,
  validateRegistrationStep1,
  validateRegistrationStep3Profile,
} from './timetoAuthFlow';

const TIMETO_LOGO_URL =
  '/assets/aistudio/photo_2026-10-26_09-25-182_bded1c84.jpg';

export interface TimetoUnifiedAuthCardProps {
  initialScreen?: AuthFlowScreen;
  defaultRole?: AccountRoleChoice;
  redirectTo?: string;
  promptReason?: string;
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export const TimetoUnifiedAuthCard: React.FC<TimetoUnifiedAuthCardProps> = ({
  initialScreen = 'LOGIN',
  defaultRole = 'CUSTOMER',
  redirectTo,
  promptReason,
  isModal = false,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const {
    requestOtpLogin,
    verifyOtpLogin,
    loginWithPassword,
    resetPasswordWithOtp,
    completeUnifiedAuthSession,
    showToast,
  } = usePrototypeData();

  const savedMemory = getLastSavedCredential();

  const [screen, setScreen] = useState<AuthFlowScreen>(initialScreen);
  const [roleChoice, setRoleChoice] = useState<AccountRoleChoice>(defaultRole);

  // فیلدهای شماره و رمز عبور
  const [phone, setPhone] = useState<string>(savedMemory?.phone || '');
  const [loginPassword, setLoginPassword] = useState<string>(
    savedMemory?.password || ''
  );
  const [showPasswordInputInLogin, setShowPasswordInputInLogin] =
    useState<boolean>(Boolean(savedMemory?.password));
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [passwordSavedInMemoryBadge, setPasswordSavedInMemoryBadge] =
    useState<boolean>(false);

  // فیلدهای ۶ خانه کد تایید (OTP)
  const [otpDigits, setOtpDigits] = useState<string[]>([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);
  const [demoOtpCode, setDemoOtpCode] = useState<string>('392633');
  const [otpTimerSeconds, setOtpTimerSeconds] = useState<number>(110);
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // فیلدهای گام ۳ (پروفایل: عکس اختیاری + نام + نام خانوادگی)
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // فیلدهای گام ۴ ویژه سالن‌دار (مشخصات پایه سالن)
  const [salonName, setSalonName] = useState<string>('');
  const [salonType, setSalonType] = useState<BusinessType>(
    BusinessType.WomenSalon
  );
  const [salonCity, setSalonCity] = useState<string>('اصفهان');
  const [salonNeighborhood, setSalonNeighborhood] =
    useState<string>('چهارباغ بالا');

  // وضعیت خطا و بارگذاری
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  useEffect(() => {
    setRoleChoice(defaultRole);
  }, [defaultRole]);

  // تایمر شمارش معکوس ارسال مجدد کد تایید (۱۱۰ ثانیه مانند تصویر مرجع)
  useEffect(() => {
    if (
      screen !== 'REGISTER_STEP_2_OTP' &&
      screen !== 'LOGIN_OTP_VERIFY' &&
      screen !== 'RESET_PASSWORD'
    ) {
      return;
    }
    if (otpTimerSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setOtpTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, otpTimerSeconds]);

  // فوکوس خودکار روی اولین خانه کد ۶ رقمی هنگام ورود به مرحله تأیید
  useEffect(() => {
    if (screen === 'REGISTER_STEP_2_OTP' || screen === 'LOGIN_OTP_VERIFY') {
      const t = window.setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 80);
      return () => window.clearTimeout(t);
    }
  }, [screen]);

  const suggestedPassword = generateSuggestedPassword(phone);

  const handleApplySuggestedPassword = () => {
    setRegPassword(suggestedPassword);
    setRegConfirmPassword(suggestedPassword);
    setShowRegPassword(true);
    setPasswordSavedInMemoryBadge(true);
    setError('');
    try {
      const normalized = normalizeIranMobileInput(phone);
      window.localStorage.setItem(
        'timeto_last_credential_memory_v2',
        JSON.stringify({
          phone: normalized || phone,
          password: suggestedPassword,
          role: roleChoice,
        })
      );
    } catch {
      // ignore
    }
    showToast(
      'رمز پیشنهادی انتخاب و در حافظه سیستم ذخیره شد تا در مراجعات بعدی نیازی به تایپ مجدد نداشته باشید.',
      'info'
    );
  };

  const finishWithWelcomeRedirect = (targetPath?: string) => {
    setScreen('WELCOME');
    window.setTimeout(() => {
      onSuccess?.();
      onClose?.();
      if (targetPath) {
        navigate(targetPath, { replace: true });
      }
    }, 950);
  };

  // ۱. ورود با رمز عبور از صفحه اول ورود
  const handleLoginWithPasswordClick = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const rawIdentifier = toEnglishDigitsClient(phone).trim();
    const isPhoneCandidate = /^0?9\d+$/.test(rawIdentifier.replace(/\D/g, ''));
    const normalizedPhone = isPhoneCandidate
      ? normalizeIranMobileInput(rawIdentifier)
      : rawIdentifier;

    if (
      !normalizedPhone ||
      (isPhoneCandidate && !isValidIranMobile(normalizedPhone))
    ) {
      setError('لطفاً شماره موبایل ۱۱ رقمی معتبر وارد کنید (مثال: 09131234567).');
      return;
    }

    // اگر فیلد رمز هنوز باز نشده، ابتدا بررسی کنیم آیا رمز در حافظه ذخیره شده یا فیلد را نمایش دهیم
    if (!showPasswordInputInLogin) {
      const accounts = getSavedMemoryAccounts();
      const mem = accounts[normalizedPhone];
      if (mem?.password) {
        setLoginPassword(mem.password);
      }
      setShowPasswordInputInLogin(true);
      setError('');
      return;
    }

    if (loginPassword.trim().length < 4) {
      setError('لطفاً رمز عبور خود را وارد کنید.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const user = await loginWithPassword(normalizedPhone, loginPassword);
      const isSuperAdmin =
        user.isPlatformAdmin && user.roles.includes('PLATFORM_ADMIN');
      const isBizOwner = user.roles.includes('BUSINESS_OWNER');
      const dest =
        redirectTo ||
        (isSuperAdmin ? '/admin' : isBizOwner ? '/app' : undefined);
      finishWithWelcomeRedirect(dest);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'شماره موبایل یا رمز عبور اشتباه است.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۲. ورود سریع با کد پیامکی از صفحه اول ورود
  const handleLoginWithCodeClick = async () => {
    const normalizedPhone = normalizeIranMobileInput(phone);
    if (!isValidIranMobile(normalizedPhone)) {
      setError('لطفاً ابتدا شماره موبایل ۱۱ رقمی خود را وارد کنید.');
      return;
    }
    setPhone(normalizedPhone);
    setError('');
    setIsSubmitting(true);
    try {
      await requestOtpLogin(normalizedPhone);
      const generated = String(Math.floor(100000 + Math.random() * 900000));
      setDemoOtpCode(generated);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimerSeconds(110);
      setScreen('LOGIN_OTP_VERIFY');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در ارسال کد تأیید پیامکی.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۳. ادامه از گام ۱ ثبت‌نام (شماره + رمز عبور + تکرار رمز) به گام ۲ (کد ۶ رقمی)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRegistrationStep1({
      phone,
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });
    if (!check.valid) {
      setError(check.error || 'اطلاعات واردشده معتبر نیست.');
      return;
    }

    setPhone(check.normalizedPhone);
    setError('');
    setIsSubmitting(true);
    try {
      await requestOtpLogin(check.normalizedPhone);
      // ذخیره رمز در حافظه مرورگر تا کاربر نیازی به تایپ مجدد نداشته باشد
      try {
        window.localStorage.setItem(
          'timeto_last_credential_memory_v2',
          JSON.stringify({
            phone: check.normalizedPhone,
            password: regPassword.trim(),
            role: roleChoice,
          })
        );
      } catch {
        // ignore
      }
      const generated = '392633';
      setDemoOtpCode(generated);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimerSeconds(110);
      setScreen('REGISTER_STEP_2_OTP');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در ارسال کد تأیید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۴. مدیریت ورود ارقام در ۶ باکس OTP
  const handleOtpBoxChange = (index: number, rawValue: string) => {
    setError('');
    const result = applyOtpDigitChange(otpDigits, index, rawValue);
    setOtpDigits(result.digits);
    if (rawValue && result.nextFocusIndex !== index) {
      otpInputsRef.current[result.nextFocusIndex]?.focus();
    }
    if (result.completedCode) {
      void handleVerifyOtpBoxes(result.completedCode);
    }
  };

  const handleOtpBoxKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtpBoxes = async (explicitCode?: string) => {
    const code = explicitCode || otpDigits.join('');
    if (!/^\d{6}$/.test(code)) {
      setError('لطفاً کد ۶ رقمی ارسال‌شده را کامل وارد کنید.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      if (screen === 'LOGIN_OTP_VERIFY') {
        const normalizedPhone = normalizeIranMobileInput(phone);
        const accounts = getSavedMemoryAccounts();
        const existingAcc = accounts[normalizedPhone];
        const isSuperAdmin = normalizedPhone === '09138201042';

        // اگر کاربر قبلاً ثبت‌نام نکرده و ادمین نیست، او را به مرحله تکمیل نام (پروفایل) هدایت کنیم
        if (!existingAcc && !isSuperAdmin) {
          setScreen('REGISTER_STEP_3_PROFILE');
          return;
        }

        const user = await verifyOtpLogin(normalizedPhone, code);
        const isBiz = user.roles.includes('BUSINESS_OWNER');
        const dest =
          redirectTo ||
          (isSuperAdmin ? '/admin' : isBiz ? '/app' : undefined);
        finishWithWelcomeRedirect(dest);
        return;
      }

      // در حالت ثبت‌نام جدید: رفتن به گام ۳ (پروفایل: عکس + نام و نام خانوادگی)
      await new Promise((resolve) => setTimeout(resolve, 350));
      setScreen('REGISTER_STEP_3_PROFILE');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'کد واردشده معتبر نیست.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۵. آپلود عکس پروفایل اختیاری در گام ۳
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ۶. ثبت گام ۳ (پروفایل)
  const handleStep3ProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRegistrationStep3Profile({ firstName, lastName });
    if (!check.valid) {
      setError(check.error || 'لطفاً نام خود را وارد کنید.');
      return;
    }
    setError('');

    // اگر نقش «سالن‌دار» است، برود به گام ۴ (اطلاعات پایه سالن)
    if (roleChoice === 'BUSINESS_OWNER') {
      if (!salonName.trim()) {
        setSalonName(`سالن زیبایی ${check.fullName}`);
      }
      setScreen('REGISTER_STEP_4_SALON');
      return;
    }

    // اگر نقش «مشتری» است، ثبت‌نام تمام است -> خوش آمدید 🎉
    setIsSubmitting(true);
    try {
      const normalizedPhone = normalizeIranMobileInput(phone);
      await completeUnifiedAuthSession({
        phone: normalizedPhone,
        password: regPassword || loginPassword || suggestedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: check.fullName,
        role: 'CUSTOMER',
        avatarUrl: avatarUrl || undefined,
      });
      finishWithWelcomeRedirect(redirectTo);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۷. ثبت گام ۴ ویژه سالن‌دار (ثبت سریع سالن و ورود مستقیم به پنل مدیریت /app)
  const handleStep4SalonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salonName.trim().length < 2) {
      setError('لطفاً نام سالن زیبایی یا آرایشگاه خود را وارد کنید.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const normalizedPhone = normalizeIranMobileInput(phone);
      const profileCheck = validateRegistrationStep3Profile({
        firstName,
        lastName,
      });
      await completeUnifiedAuthSession({
        phone: normalizedPhone,
        password: regPassword || loginPassword || suggestedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: profileCheck.fullName || 'مدیر سالن',
        role: 'BUSINESS_OWNER',
        avatarUrl: avatarUrl || undefined,
        salonInfo: {
          businessName: salonName.trim(),
          businessType: salonType,
          city: salonCity,
          neighborhood: salonNeighborhood.trim() || 'چهارباغ بالا',
        },
      });
      finishWithWelcomeRedirect('/app');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۸. بازیابی رمز عبور
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeIranMobileInput(phone);
    const code = otpDigits.join('');
    if (!isValidIranMobile(normalizedPhone)) {
      setError('شماره موبایل معتبر نیست.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('کد تأیید ۶ رقمی را وارد کنید.');
      return;
    }
    if (regPassword.trim().length < 8) {
      setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await resetPasswordWithOtp(normalizedPhone, code, regPassword.trim());
      finishWithWelcomeRedirect(redirectTo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در بازنشانی رمز عبور.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // استپر بالای کارت ثبت‌نام (دقیقاً مشابه تصاویر ۳، ۴، ۵ و ۶ با هویت رنگی تایم تو)
  const renderRegistrationStepper = (currentStepIndex: 1 | 2 | 3 | 4) => {
    const steps =
      roleChoice === 'BUSINESS_OWNER'
        ? [
            { idx: 1, label: 'شماره', icon: Phone },
            { idx: 2, label: 'تأیید', icon: Check },
            { idx: 3, label: 'پروفایل', icon: User },
            { idx: 4, label: 'سالن', icon: Store },
          ]
        : [
            { idx: 1, label: 'شماره', icon: Phone },
            { idx: 2, label: 'تأیید', icon: Check },
            { idx: 3, label: 'پروفایل', icon: User },
          ];

    return (
      <div className="mb-6 px-2">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => {
            const IconComp = step.icon;
            const isCompleted = step.idx < currentStepIndex;
            const isActive = step.idx === currentStepIndex;
            return (
              <React.Fragment key={step.idx}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'border-[#0057FF] bg-[#0057FF] text-white shadow-[0_6px_16px_-4px_rgba(0,87,255,0.45)]'
                        : isActive
                          ? 'border-[#0057FF] bg-[#E8F1FF] text-[#0057FF] ring-4 ring-[#0057FF]/12'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                    ) : (
                      <IconComp className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-extrabold ${
                      isCompleted || isActive
                        ? 'text-[#061138]'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {i < steps.length - 1 ? (
                  <div
                    className={`mb-5 h-0.5 flex-1 mx-2 rounded-full transition-colors ${
                      step.idx < currentStepIndex
                        ? 'bg-[#0057FF]'
                        : 'bg-slate-200'
                    }`}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-[430px] select-none">
      {/* پس‌زمینه هاله‌ای ظریف هویت بصری تایم تو */}
      <div className="relative overflow-hidden rounded-[32px] border border-[#CBD5E1] bg-gradient-to-b from-[#EFF6FF] via-[#F8FAFC] to-white p-5 sm:p-7 shadow-[0_24px_60px_-18px_rgba(6,17,56,0.28)]">
        {isModal && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره ورود"
            className="absolute top-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        {/* لوگو و عنوان برند تایم تو در بالای مودال/صفحه (مشابه ساختار رقیب با برند Timeto) */}
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="relative mb-2.5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#00E5FF]/50 bg-[#061138] p-1 shadow-[0_10px_25px_-8px_rgba(0,87,255,0.45)]">
            <img
              src={TIMETO_LOGO_URL}
              alt="لوگوی تایم تو"
              className="h-full w-full rounded-xl object-cover"
            />
          </div>
          <span
            dir="ltr"
            className="text-sm font-black tracking-[0.28em] text-[#061138] uppercase"
          >
            T i m e t o
          </span>

          <h2 className="mt-2 text-xl sm:text-2xl font-black text-[#061138]">
            {screen === 'LOGIN' || screen === 'LOGIN_OTP_VERIFY'
              ? 'ورود به حساب'
              : screen === 'RESET_PASSWORD'
                ? 'بازیابی رمز عبور'
                : 'ثبت نام در تایم تو'}
          </h2>
          {screen === 'LOGIN' ? (
            <p className="mt-1 text-xs font-bold text-slate-500">
              {promptReason || 'به تایم تو خوش آمدید'}
            </p>
          ) : null}
        </div>

        {/* کارت سفید میانی فرم */}
        <div className="rounded-[26px] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_12px_32px_-12px_rgba(6,17,56,0.08)]">
          {/* ۱. صفحه اول ورود (LOGIN — مطابق عکس ۱) */}
          {screen === 'LOGIN' ? (
            <form
              onSubmit={handleLoginWithPasswordClick}
              className="space-y-4"
              noValidate
            >
              <div className="relative">
                <input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  maxLength={11}
                  autoComplete="username tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(normalizeIranMobileInput(e.target.value));
                    setError('');
                  }}
                  placeholder="09xxxxxxxxx"
                  aria-label="شماره موبایل"
                  className="w-full rounded-2xl border-2 border-[#0057FF]/30 bg-[#F8FAFC] py-3.5 pr-11 pl-4 text-center font-mono text-base font-bold tracking-wider text-[#061138] placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0057FF]/10"
                />
                <Phone className="pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-[#0057FF]" />
              </div>

              {showPasswordInputInLogin ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      dir="ltr"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="رمز عبور حساب شما"
                      aria-label="رمز عبور"
                      className="w-full rounded-2xl border border-slate-300 bg-[#F8FAFC] py-3 pr-10 pl-10 text-center font-mono text-sm font-bold text-[#061138] placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none"
                    />
                    <Lock className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((v) => !v)}
                      aria-label="نمایش یا مخفی کردن رمز عبور"
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showRegPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {savedMemory?.password &&
                  loginPassword === savedMemory.password ? (
                    <p className="text-center text-[11px] font-bold text-emerald-600">
                      ✓ رمز عبور ذخیره‌شده شما از حافظه سیستم بارگذاری شد
                    </p>
                  ) : null}
                </div>
              ) : null}

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-600 border border-rose-200">
                  {error}
                </p>
              ) : null}

              {/* دو دکمه کنار هم: «ورود با رمز» و «ورود با کد» (دقیقاً مطابق عکس ۱) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#0057FF] py-3.5 px-4 text-sm font-black text-white shadow-[0_10px_24px_-8px_rgba(0,87,255,0.55)] transition hover:bg-[#0046CC] disabled:opacity-60 cursor-pointer"
                >
                  <span>ورود با رمز</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleLoginWithCodeClick()}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-slate-200 bg-white py-3.5 px-4 text-sm font-black text-[#061138] transition hover:border-[#0057FF] hover:text-[#0057FF] disabled:opacity-60 cursor-pointer"
                >
                  <span>ورود با کد</span>
                </button>
              </div>

              <div className="space-y-2.5 pt-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    if (isValidIranMobile(normalizeIranMobileInput(phone))) {
                      void requestOtpLogin(normalizeIranMobileInput(phone));
                      setOtpDigits(['', '', '', '', '', '']);
                      setOtpTimerSeconds(110);
                    }
                    setScreen('RESET_PASSWORD');
                  }}
                  className="block w-full font-bold text-slate-500 transition hover:text-[#061138] cursor-pointer"
                >
                  رمز عبور را فراموش کردم
                </button>

                <div className="pt-1 text-slate-600 font-semibold">
                  <span>حساب ندارید؟ </span>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setScreen('ROLE_PICKER');
                    }}
                    className="font-black text-[#0057FF] hover:underline cursor-pointer"
                  >
                    ثبت نام
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {/* ۲. انتخاب نوع حساب: مشتری یا سالن‌دار (ROLE_PICKER — مطابق عکس ۲) */}
          {screen === 'ROLE_PICKER' ? (
            <div className="space-y-5">
              <p className="text-center text-sm font-extrabold text-[#061138]">
                نوع حساب را انتخاب کنید
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                {/* کارت مشتری */}
                <button
                  type="button"
                  onClick={() => setRoleChoice('CUSTOMER')}
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                    roleChoice === 'CUSTOMER'
                      ? 'border-[#0057FF] bg-[#EFF6FF] shadow-[0_10px_25px_-10px_rgba(0,87,255,0.3)]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      roleChoice === 'CUSTOMER'
                        ? 'bg-[#0057FF]/15 text-[#0057FF]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Users className="h-7 w-7" />
                  </div>
                  <span className="text-base font-black text-[#061138]">
                    مشتری
                  </span>
                  <span className="mt-1 text-xs font-semibold text-slate-500">
                    رزرو نوبت
                  </span>
                  <div className="mt-3 h-5">
                    {roleChoice === 'CUSTOMER' ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0057FF] text-[#0057FF]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    ) : null}
                  </div>
                </button>

                {/* کارت سالن‌دار */}
                <button
                  type="button"
                  onClick={() => setRoleChoice('BUSINESS_OWNER')}
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 p-4 text-center transition-all cursor-pointer ${
                    roleChoice === 'BUSINESS_OWNER'
                      ? 'border-[#0057FF] bg-[#EFF6FF] shadow-[0_10px_25px_-10px_rgba(0,87,255,0.3)]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      roleChoice === 'BUSINESS_OWNER'
                        ? 'bg-[#0057FF]/15 text-[#0057FF]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Scissors className="h-7 w-7" />
                  </div>
                  <span className="text-base font-black text-[#061138]">
                    سالن‌دار
                  </span>
                  <span className="mt-1 text-xs font-semibold text-slate-500">
                    مدیریت سالن
                  </span>
                  <div className="mt-3 h-5">
                    {roleChoice === 'BUSINESS_OWNER' ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0057FF] text-[#0057FF]">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    ) : null}
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setScreen('REGISTER_STEP_1_PHONE');
                }}
                className="w-full rounded-2xl bg-[#0057FF] py-3.5 px-5 text-sm font-black text-white shadow-[0_12px_26px_-8px_rgba(0,87,255,0.55)] transition hover:bg-[#0046CC] cursor-pointer"
              >
                ادامه ←
              </button>

              <div className="text-center text-xs font-semibold text-slate-500">
                <span>قبلاً ثبت‌نام کرده‌اید؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setScreen('LOGIN');
                  }}
                  className="font-black text-[#0057FF] hover:underline cursor-pointer"
                >
                  ورود
                </button>
              </div>
            </div>
          ) : null}

          {/* ۳. گام ۱ ثبت‌نام: شماره موبایل + رمز عبور + پیشنهاد هوشمند رمز + تکرار رمز (مطابق عکس ۳) */}
          {screen === 'REGISTER_STEP_1_PHONE' ? (
            <form onSubmit={handleStep1Submit} className="space-y-4" noValidate>
              {renderRegistrationStepper(1)}

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  شماره موبایل
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    maxLength={11}
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(normalizeIranMobileInput(e.target.value));
                      setError('');
                    }}
                    placeholder="09xxxxxxxxx"
                    className="w-full rounded-2xl border-2 border-[#0057FF]/30 bg-[#F8FAFC] py-3 pr-10 pl-4 text-center font-mono text-base font-bold text-[#061138] placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  <Phone className="pointer-events-none absolute top-1/2 right-3.5 h-4.5 w-4.5 -translate-y-1/2 text-[#0057FF]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#061138]">
                    رمز عبور
                  </label>
                  <button
                    type="button"
                    onClick={handleApplySuggestedPassword}
                    className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] border border-[#0057FF]/30 px-2.5 py-0.5 text-[10px] font-black text-[#0057FF] transition hover:bg-[#0057FF] hover:text-white cursor-pointer"
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>پیشنهاد رمز سیستم: {suggestedPassword}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    dir="ltr"
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="حداقل ۸ کاراکتر"
                    className="w-full rounded-2xl border border-slate-300 bg-[#F8FAFC] py-3 pr-10 pl-10 text-center font-mono text-sm font-bold text-[#061138] placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  <Lock className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((v) => !v)}
                    aria-label="نمایش رمز عبور"
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showRegPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {passwordSavedInMemoryBadge ? (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      رمز پیشنهادی در حافظه ذخیره شد (عدم نیاز به تایپ مجدد در
                      ورود بعدی)
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  تکرار رمز عبور
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    dir="ltr"
                    autoComplete="new-password"
                    value={regConfirmPassword}
                    onChange={(e) => {
                      setRegConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="تکرار رمز عبور"
                    className="w-full rounded-2xl border border-slate-300 bg-[#F8FAFC] py-3 pr-10 pl-4 text-center font-mono text-sm font-bold text-[#061138] placeholder:font-sans placeholder:text-xs placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  <Lock className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-600 border border-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#0057FF] py-3.5 px-5 text-sm font-black text-white shadow-[0_12px_26px_-8px_rgba(0,87,255,0.55)] transition hover:bg-[#0046CC] disabled:opacity-60 cursor-pointer"
              >
                دریافت کد تأیید
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setScreen('ROLE_PICKER');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-[#061138] cursor-pointer"
                >
                  → تغییر نوع حساب (
                  {roleChoice === 'BUSINESS_OWNER' ? 'سالن‌دار' : 'مشتری'})
                </button>
              </div>
            </form>
          ) : null}

          {/* ۴. گام ۲ ثبت‌نام یا ورود با کد: ۶ باکس مجزای کد تایید (مطابق عکس ۴ و ۵) */}
          {screen === 'REGISTER_STEP_2_OTP' || screen === 'LOGIN_OTP_VERIFY' ? (
            <div className="space-y-4">
              {screen === 'REGISTER_STEP_2_OTP'
                ? renderRegistrationStepper(2)
                : null}

              {/* کادر نمایش شماره موبایل و دکمه «تغییر» (مطابق عکس ۴) */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3">
                <div className="flex items-center gap-2 font-mono text-sm font-black text-[#061138]">
                  <Phone className="h-4 w-4 text-[#0057FF]" />
                  <span dir="ltr">{phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setScreen(
                      screen === 'LOGIN_OTP_VERIFY'
                        ? 'LOGIN'
                        : 'REGISTER_STEP_1_PHONE'
                    );
                  }}
                  className="text-xs font-extrabold text-[#0057FF] hover:underline cursor-pointer"
                >
                  تغییر
                </button>
              </div>

              <div className="space-y-2 text-center">
                <p className="text-xs font-bold text-slate-600">
                  کد ۶ رقمی ارسال شده را وارد کنید
                </p>

                {/* نوار کمک‌کننده تست سریع برای درج خودکار کد ۶ رقمی */}
                <button
                  type="button"
                  onClick={() => {
                    const digits = demoOtpCode.split('');
                    setOtpDigits(digits);
                    void handleVerifyOtpBoxes(demoOtpCode);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-[#0057FF]/25 px-3 py-1 text-[11px] font-extrabold text-[#0057FF] hover:bg-[#E0ECFF] cursor-pointer"
                >
                  <span>کد پیامک‌شده: {toPersianDigits(demoOtpCode)}</span>
                  <span className="underline">(کلیک برای درج خودکار)</span>
                </button>
              </div>

              {/* ۶ خانه مجزای عدد (دقیقاً مطابق عکس ۴ و ۵) */}
              <div
                dir="ltr"
                className="grid grid-cols-6 gap-2 sm:gap-2.5 py-1"
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    aria-label={`رقم ${idx + 1} کد تایید`}
                    onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpBoxKeyDown(idx, e)}
                    className={`h-13 sm:h-14 w-full rounded-2xl border-2 text-center font-mono text-lg font-black transition-all focus:outline-none ${
                      digit
                        ? 'border-[#0057FF] bg-[#EFF6FF] text-[#061138] shadow-2xs'
                        : 'border-slate-200 bg-[#F8FAFC] text-[#061138] focus:border-[#0057FF] focus:bg-white focus:ring-4 focus:ring-[#0057FF]/10'
                    }`}
                  />
                ))}
              </div>

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-600 border border-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleVerifyOtpBoxes()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0057FF] py-3.5 px-5 text-sm font-black text-white shadow-[0_12px_26px_-8px_rgba(0,87,255,0.55)] transition hover:bg-[#0046CC] disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <span>تأیید و ادامه</span>
                )}
              </button>

              <div className="text-center text-xs font-bold text-slate-500">
                {otpTimerSeconds > 0 ? (
                  <span>
                    ارسال مجدد تا {toPersianDigits(otpTimerSeconds)} ثانیه دیگر
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpTimerSeconds(110);
                      setOtpDigits(['', '', '', '', '', '']);
                      showToast('کد تأیید ۶ رقمی مجدداً ارسال شد.', 'info');
                    }}
                    className="font-black text-[#0057FF] hover:underline cursor-pointer"
                  >
                    ارسال مجدد کد تأیید
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* ۵. گام ۳ ثبت‌نام: پروفایل (تصویر پروفایل اختیاری + نام شما + نام خانوادگی شما — مطابق عکس ۶) */}
          {screen === 'REGISTER_STEP_3_PROFILE' ? (
            <form
              onSubmit={handleStep3ProfileSubmit}
              className="space-y-4"
              noValidate
            >
              {renderRegistrationStepper(3)}

              {/* دایره نقطه‌چین انتخاب تصویر پروفایل (اختیاری) */}
              <div className="flex flex-col items-center gap-2 py-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="انتخاب تصویر پروفایل (اختیاری)"
                  className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-[#0057FF] hover:bg-[#EFF6FF] hover:text-[#0057FF] cursor-pointer"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="تصویر پروفایل"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-7 w-7 transition-transform group-hover:scale-110" />
                  )}
                </button>
                <span className="text-xs font-bold text-slate-500">
                  تصویر پروفایل (اختیاری)
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  نام شما
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setError('');
                    }}
                    placeholder="مثلاً سارا"
                    className="w-full rounded-2xl border-2 border-[#0057FF]/30 bg-[#F8FAFC] py-3 pr-10 pl-4 text-right text-sm font-bold text-[#061138] placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  <User className="pointer-events-none absolute top-1/2 right-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  نام خانوادگی شما
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setError('');
                    }}
                    placeholder="مثلاً رضایی"
                    className="w-full rounded-2xl border border-slate-300 bg-[#F8FAFC] py-3 pr-10 pl-4 text-right text-sm font-bold text-[#061138] placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  <User className="pointer-events-none absolute top-1/2 right-3.5 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-600 border border-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#0057FF] py-3.5 px-5 text-sm font-black text-white shadow-[0_12px_26px_-8px_rgba(0,87,255,0.55)] transition hover:bg-[#0046CC] disabled:opacity-60 cursor-pointer"
              >
                {roleChoice === 'BUSINESS_OWNER'
                  ? 'ادامه به مشخصات سالن ←'
                  : 'ورود به حساب'}
              </button>
            </form>
          ) : null}

          {/* ۶. گام ۴ ویژه سالن‌دار: ثبت سریع مشخصات سالن (بقیه جزئیات و شماره کارت/شبا در پنل مدیریت تکمیل می‌شود) */}
          {screen === 'REGISTER_STEP_4_SALON' ? (
            <form
              onSubmit={handleStep4SalonSubmit}
              className="space-y-4"
              noValidate
            >
              {renderRegistrationStepper(4)}

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  نام سالن زیبایی یا آرایشگاه
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={salonName}
                    onChange={(e) => {
                      setSalonName(e.target.value);
                      setError('');
                    }}
                    placeholder="مثلاً سالن زیبایی ارکیده"
                    className="w-full rounded-2xl border-2 border-[#0057FF]/30 bg-[#F8FAFC] py-3 pr-10 pl-4 text-right text-sm font-bold text-[#061138] placeholder:text-slate-400 focus:border-[#0057FF] focus:bg-white focus:outline-none"
                  />
                  <Store className="pointer-events-none absolute top-1/2 right-3.5 h-4.5 w-4.5 -translate-y-1/2 text-[#0057FF]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  نوع مرکز
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      val: BusinessType.WomenSalon,
                      label: 'سالن بانوان',
                    },
                    {
                      val: BusinessType.MenBarbershop,
                      label: 'پیرایش مردانه',
                    },
                    {
                      val: BusinessType.IndependentSpecialist,
                      label: 'متخصص مستقل',
                    },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSalonType(item.val)}
                      className={`rounded-xl border py-2.5 px-2 text-xs font-extrabold transition cursor-pointer ${
                        salonType === item.val
                          ? 'border-[#0057FF] bg-[#EFF6FF] text-[#0057FF]'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-right text-xs font-extrabold text-[#061138]">
                    شهر
                  </label>
                  <select
                    value={salonCity}
                    onChange={(e) => setSalonCity(e.target.value)}
                    aria-label="انتخاب شهر سالن"
                    className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] px-3 py-2.5 text-xs font-bold text-[#061138] focus:border-[#0057FF] focus:outline-none"
                  >
                    <option value="اصفهان">اصفهان</option>
                    <option value="درچه">درچه</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-right text-xs font-extrabold text-[#061138]">
                    محله یا محدوده
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={salonNeighborhood}
                      onChange={(e) => setSalonNeighborhood(e.target.value)}
                      placeholder="مثلاً چهارباغ بالا"
                      className="w-full rounded-xl border border-slate-300 bg-[#F8FAFC] py-2.5 pr-8 pl-2.5 text-xs font-bold text-[#061138] focus:border-[#0057FF] focus:outline-none"
                    />
                    <MapPin className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#0057FF]/20 bg-[#EFF6FF] p-3 text-[11px] font-bold text-[#061138] leading-relaxed">
                پس از ورود به پنل سالن، می‌توانید خدمات، ساعات کاری و{' '}
                <span className="text-[#0057FF] font-black">
                  شماره کارت و شبا (تسویه مالی)
                </span>{' '}
                را از طریق نوار پیشرفت تکمیل پروفایل ثبت کنید.
              </div>

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-600 border border-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#0057FF] py-3.5 px-5 text-sm font-black text-white shadow-[0_12px_26px_-8px_rgba(0,87,255,0.55)] transition hover:bg-[#0046CC] disabled:opacity-60 cursor-pointer"
              >
                ثبت سالن و ورود به پنل مدیریت
              </button>
            </form>
          ) : null}

          {/* ۷. بازیابی رمز عبور */}
          {screen === 'RESET_PASSWORD' ? (
            <form
              onSubmit={handleResetPasswordSubmit}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  maxLength={11}
                  value={phone}
                  onChange={(e) =>
                    setPhone(normalizeIranMobileInput(e.target.value))
                  }
                  placeholder="09xxxxxxxxx"
                  className="w-full rounded-2xl border border-slate-300 bg-[#F8FAFC] py-3 px-4 text-center font-mono text-sm font-bold text-[#061138]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  کد ۶ رقمی پیامک‌شده (کد تست: {toPersianDigits(demoOtpCode)})
                </label>
                <div dir="ltr" className="grid grid-cols-6 gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-[#F8FAFC] text-center font-mono text-base font-black text-[#061138]"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-right text-xs font-extrabold text-[#061138]">
                  رمز عبور جدید (حداقل ۸ کاراکتر)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="رمز عبور جدید..."
                  className="w-full rounded-2xl border border-slate-300 bg-[#F8FAFC] py-3 px-4 text-center font-mono text-sm font-bold text-[#061138]"
                />
              </div>

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-center text-xs font-bold text-rose-600 border border-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#0057FF] py-3.5 px-5 text-sm font-black text-white shadow-md hover:bg-[#0046CC] cursor-pointer"
              >
                ثبت رمز جدید و ورود
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setScreen('LOGIN');
                }}
                className="block w-full text-center text-xs font-bold text-slate-500 hover:text-[#061138] cursor-pointer"
              >
                بازگشت به ورود
              </button>
            </form>
          ) : null}

          {/* ۸. صفحه خوش‌آمدگویی نهایی (WELCOME — دقیقاً مطابق عکس ۷) */}
          {screen === 'WELCOME' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-500/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-3 border-emerald-600 text-emerald-600">
                  <Check className="h-6 w-6 stroke-[3]" />
                </div>
              </div>
              <h3 className="text-xl font-black text-[#061138]">
                خوش آمدید 🎉
              </h3>
              <RefreshCw className="h-5 w-5 animate-spin text-[#0057FF]" />
            </div>
          ) : null}
        </div>

        {/* متن قوانین در پایین کارت (مطابق تصاویر مرجع) */}
        <p className="mt-4 text-center text-[11px] font-bold text-slate-500">
          ورود و ثبت‌نام به منزله پذیرش{' '}
          <span className="underline text-[#0057FF]">قوانین تایم تو</span> است
        </p>
      </div>
    </div>
  );
};

export const TimetoAuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalOptions, closeAuthModal } =
    usePrototypeData();

  if (!isAuthModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ورود یا ثبت‌نام در تایم تو"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#061138]/75 p-3.5 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAuthModal();
        }
      }}
    >
      <TimetoUnifiedAuthCard
        isModal
        initialScreen={authModalOptions.initialScreen || 'LOGIN'}
        defaultRole={authModalOptions.defaultRole || 'CUSTOMER'}
        redirectTo={authModalOptions.redirectTo}
        promptReason={authModalOptions.promptReason}
        onClose={closeAuthModal}
      />
    </div>
  );
};
