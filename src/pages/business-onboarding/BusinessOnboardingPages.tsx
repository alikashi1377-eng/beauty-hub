import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ShieldAlert,
  Sparkles,
  Clock,
  Check,
  Building2,
  ExternalLink,
  Instagram,
} from 'lucide-react';
import { IRAN_CITIES } from '../../mocks/sampleData';
import { BusinessType } from '../../types';
import {
  formatDurationMinutes,
  formatPriceToman,
  toPersianDigits,
  validateBusinessRegistrationDraft,
  validateServiceForm,
} from '../../utils/formatters';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/ui/PageHeader';
import { IncompleteFormState } from '../../components/ui/StateViews';
import { VisualMediaIllustration } from '../../components/ui/VisualMediaIllustration';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LocationMapPicker } from '../../components/ui/LocationMapPicker';

/** نوار پیشرفت ۵ مرحله‌ای هدایت‌شده برای راه‌اندازی کسب‌وکار */
const OnboardingProgressHeader: React.FC<{ currentStep: number }> = ({
  currentStep,
}) => {
  const steps = [
    { num: 1, title: 'مشخصات پایه و نشانی', href: '/business/register' },
    { num: 2, title: 'خدمات، تیم و برنامه کاری', href: '/business/onboarding' },
    { num: 3, title: 'پیش‌نمایش پروفایل عمومی', href: '/business/preview' },
    { num: 4, title: 'اطلاعات مجوز و احراز', href: '/business/verification' },
    { num: 5, title: 'تکمیل راه‌اندازی', href: '/business/ready' },
  ];

  const progressPct = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="mb-8 rounded-2xl border border-[#E6E0F5] bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0057FF]">
            <Sparkles className="w-3.5 h-3.5 text-[#0057FF]" />
            <span>راه‌اندازی گام‌به‌گام کسب‌وکار در Timeto (تایم تو)</span>
          </span>
          <span className="text-[#6B6480] hidden sm:inline">
            — اطلاعات شما در هر مرحله به‌طور خودکار ذخیره می‌شود
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[#8B5CF6] tabular-nums">
            گام {toPersianDigits(currentStep)} از ۵ ({toPersianDigits(progressPct)}٪)
          </span>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-[#F3EEFF] overflow-hidden">
        <div
          className="h-full bg-[#8B5CF6] rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          return (
            <Link
              key={s.num}
              to={s.href}
              className={`p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${
                isCurrent
                  ? 'border-[#8B5CF6] bg-[#EDE9FE] text-[#8B5CF6] font-extrabold shadow-2xs'
                  : isDone
                  ? 'border-[#10B981]/30 bg-[#ECFDF5] text-[#10B981] font-bold'
                  : 'border-[#E6E0F5] bg-[#FAF8FF] text-[#6B6480] font-medium hover:text-[#1E1B2E]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-lg inline-flex items-center justify-center text-[11px] font-extrabold shrink-0 tabular-nums ${
                  isCurrent
                    ? 'bg-[#8B5CF6] text-white'
                    : isDone
                    ? 'bg-[#10B981] text-white'
                    : 'bg-white border border-[#D4C9EE] text-[#6B6480]'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3" />
                ) : (
                  toPersianDigits(s.num)
                )}
              </span>
              <span className="truncate">{s.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/** کارت خلاصه زنده پیش‌نویس در ستون کناری راه‌اندازی */
const OnboardingDraftSummarySidebar: React.FC<{ stepHint: string }> = ({
  stepHint,
}) => {
  const { onboardingDraft } = usePrototypeData();
  const isPro =
    onboardingDraft.businessType === BusinessType.IndependentSpecialist;

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <Card variant="dark" className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <span className="text-xs font-bold text-[#EDE9FE]">
            پیش‌نمایش پروفایل در حال ساخت
          </span>
          <span
            dir="ltr"
            className="text-[11px] font-mono text-white/80 bg-white/10 px-2 py-0.5 rounded"
          >
            /{isPro ? 'pro' : 'salon'}/{onboardingDraft.slug || 'your-slug'}
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-white">
            {onboardingDraft.businessName || 'نام کسب‌وکار شما'}
          </h3>
          <p className="text-xs text-[#EDE9FE]/85">
            {onboardingDraft.city}
            {onboardingDraft.neighborhood
              ? ` · ${onboardingDraft.neighborhood}`
              : ''}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/15 text-xs">
          <div className="p-2.5 rounded-xl bg-white/10">
            <p className="text-[11px] text-[#EDE9FE]/80">خدمات ثبت‌شده</p>
            <p className="text-sm font-extrabold text-white mt-0.5 tabular-nums">
              {toPersianDigits(onboardingDraft.services.length)} خدمت
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/10">
            <p className="text-[11px] text-[#EDE9FE]/80">اعضای تیم / متخصصان</p>
            <p className="text-sm font-extrabold text-white mt-0.5 tabular-nums">
              {toPersianDigits(onboardingDraft.staff.length)} نفر
            </p>
          </div>
        </div>
      </Card>

      <Card variant="muted" padding="sm" className="space-y-2">
        <p className="text-xs font-extrabold text-[#8B5CF6]">
          راهنمای این مرحله
        </p>
        <p className="text-xs text-[#6B6480] leading-relaxed">{stepHint}</p>
      </Card>
    </div>
  );
};

/** ۱. ثبت‌نام اولیه کسب‌وکار (/business/register) */
export const BusinessRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { onboardingDraft, updateOnboardingDraft, categories, showToast } =
    usePrototypeData();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBusinessRegistrationDraft({
      businessName: onboardingDraft.businessName,
      ownerName: onboardingDraft.ownerName,
      phone: onboardingDraft.phone,
      city: onboardingDraft.city,
      slug: onboardingDraft.slug,
    });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    showToast('مشخصات پایه کسب‌وکار ذخیره شد.');
    navigate('/business/onboarding');
  };

  return (
    <div>
      <PageHeader
        kicker="راه‌اندازی کسب‌وکار · گام ۱ از ۵"
        title="ثبت‌نام و تعریف مشخصات کسب‌وکار"
        subtitle="نوع فعالیت، نام تجاری، نشانی و پیوند اختصاصی صفحه خود را مشخص کنید."
        routePattern="/business/register"
        breadcrumbs={[
          { label: 'صفحه اصلی', href: '/' },
          { label: 'ثبت‌نام کسب‌وکار' },
        ]}
      />

      <OnboardingProgressHeader currentStep={1} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8 space-y-5">
          {Object.keys(errors).length > 0 ? (
            <IncompleteFormState
              errors={Object.values(errors)}
              onDismiss={() => setErrors({})}
            />
          ) : null}

          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* انتخاب نوع کسب‌وکار */}
              <div className="space-y-2.5">
                <label className="block text-sm font-extrabold text-[#1E1B2E]">
                  ۱. الگوی فعالیت کسب‌وکار خود را انتخاب کنید{' '}
                  <span className="text-[#8B5CF6]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      type: BusinessType.WomenSalon,
                      label: 'سالن زیبایی زنانه',
                      desc: 'مجموعه دارای لاین‌های مو، ناخن، میکاپ و پوست',
                    },
                    {
                      type: BusinessType.MenBarbershop,
                      label: 'آرایشگاه و پیرایش مردانه',
                      desc: 'اصلاح مو و ریش، استایلینگ و خدمات داماد',
                    },
                    {
                      type: BusinessType.IndependentSpecialist,
                      label: 'متخصص مستقل زیبایی',
                      desc: 'فیشیالیست، ناخن‌کار یا میکاپ‌آرتیست فردی',
                    },
                  ].map((opt) => {
                    const isSelected =
                      onboardingDraft.businessType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() =>
                          updateOnboardingDraft({ businessType: opt.type })
                        }
                        className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#8B5CF6] bg-[#EDE9FE] ring-2 ring-[#8B5CF6]/15'
                            : 'border-[#E6E0F5] bg-[#FAF8FF] hover:bg-white hover:border-[#D4C9EE]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm font-extrabold text-[#1E1B2E]">
                            {opt.label}
                          </p>
                          {isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white inline-flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[#6B6480] mt-1.5 leading-relaxed">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* مشخصات هویتی و تماس */}
              <div className="pt-4 border-t border-[#E6E0F5] space-y-4">
                <h2 className="text-sm font-extrabold text-[#1E1B2E]">
                  ۲. نام تجاری و اطلاعات مدیر مسئول
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    id="reg-business-name"
                    label="نام سالن یا عنوان فعالیت"
                    required
                    error={errors.businessName}
                  >
                    <Input
                      id="reg-business-name"
                      value={onboardingDraft.businessName}
                      hasError={Boolean(errors.businessName)}
                      onChange={(e) =>
                        updateOnboardingDraft({ businessName: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id="reg-category"
                    label="محور اصلی خدمات"
                    required
                  >
                    <Select
                      id="reg-category"
                      value={onboardingDraft.categorySlug}
                      onChange={(e) =>
                        updateOnboardingDraft({ categorySlug: e.target.value })
                      }
                      options={categories.map((c) => ({
                        value: c.slug,
                        label: c.title,
                      }))}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    id="reg-owner-name"
                    label="نام و نام خانوادگی مدیر / متخصص مسئول"
                    required
                    error={errors.ownerName}
                  >
                    <Input
                      id="reg-owner-name"
                      value={onboardingDraft.ownerName}
                      hasError={Boolean(errors.ownerName)}
                      onChange={(e) =>
                        updateOnboardingDraft({ ownerName: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id="reg-phone"
                    label="شماره موبایل هماهنگی"
                    required
                    error={errors.phone}
                  >
                    <Input
                      id="reg-phone"
                      dir="ltr"
                      value={onboardingDraft.phone}
                      hasError={Boolean(errors.phone)}
                      onChange={(e) =>
                        updateOnboardingDraft({ phone: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id="reg-instagram"
                    label="آدرس یا شناسه اینستاگرام"
                    optionalLabel="اختیاری"
                    hint="نمایش در پروفایل عمومی و پنل"
                  >
                    <Input
                      id="reg-instagram"
                      dir="ltr"
                      placeholder="@royalgolzar.salon"
                      value={onboardingDraft.instagramHandle ?? ''}
                      onChange={(e) =>
                        updateOnboardingDraft({
                          instagramHandle: e.target.value,
                        })
                      }
                    />
                  </FormField>
                </div>
              </div>

              {/* موقعیت مکانی و پیوند اختصاصی */}
              <div className="pt-4 border-t border-[#E6E0F5] space-y-4">
                <h2 className="text-sm font-extrabold text-[#1E1B2E]">
                  ۳. نشانی، موقعیت روی نقشه و پیوند اختصاصی پروفایل
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    id="reg-city"
                    label="شهر"
                    required
                    error={errors.city}
                  >
                    <Select
                      id="reg-city"
                      value={onboardingDraft.city}
                      onChange={(e) =>
                        updateOnboardingDraft({ city: e.target.value })
                      }
                      options={IRAN_CITIES.map((c) => ({ value: c, label: c }))}
                    />
                  </FormField>

                  <FormField
                    id="reg-neighborhood"
                    label="محله یا محدوده"
                    optionalLabel="پیشنهادی"
                  >
                    <Input
                      id="reg-neighborhood"
                      value={onboardingDraft.neighborhood}
                      onChange={(e) =>
                        updateOnboardingDraft({ neighborhood: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id="reg-slug"
                    label="شناسه پیوند اختصاصی (Slug)"
                    hint="فقط حروف انگلیسی کوچک و خط تیره"
                    required
                    error={errors.slug}
                  >
                    <Input
                      id="reg-slug"
                      dir="ltr"
                      value={onboardingDraft.slug}
                      hasError={Boolean(errors.slug)}
                      onChange={(e) =>
                        updateOnboardingDraft({ slug: e.target.value })
                      }
                    />
                  </FormField>
                </div>

                {/* انتخاب موقعیت روی نقشه */}
                <LocationMapPicker
                  city={onboardingDraft.city}
                  neighborhood={onboardingDraft.neighborhood}
                  address={onboardingDraft.address}
                  lat={onboardingDraft.mapLat ?? 35.8058}
                  lng={onboardingDraft.mapLng ?? 51.4018}
                  onSelectLocation={({
                    lat,
                    lng,
                    neighborhood,
                    suggestedAddress,
                  }) => {
                    updateOnboardingDraft({
                      mapLat: lat,
                      mapLng: lng,
                      ...(neighborhood ? { neighborhood } : {}),
                      ...(suggestedAddress
                        ? { address: suggestedAddress }
                        : {}),
                    });
                    showToast(
                      'موقعیت مکانی روی نقشه ثبت شد و در پیش‌نویس پروفایل قرار گرفت.',
                      'info'
                    );
                  }}
                />

                <FormField id="reg-address" label="نشانی کامل پستی" required>
                  <Input
                    id="reg-address"
                    value={onboardingDraft.address}
                    onChange={(e) =>
                      updateOnboardingDraft({ address: e.target.value })
                    }
                  />
                </FormField>

                <FormField
                  id="reg-desc"
                  label="معرفی کوتاه کسب‌وکار برای نمایش در پروفایل عمومی"
                  optionalLabel="اختیاری"
                >
                  <Textarea
                    id="reg-desc"
                    rows={2}
                    value={onboardingDraft.shortDescription}
                    onChange={(e) =>
                      updateOnboardingDraft({
                        shortDescription: e.target.value,
                      })
                    }
                  />
                </FormField>
              </div>

              <div className="pt-5 border-t border-[#E6E0F5] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#6B6480]">
                  گام بعدی: افزودن فهرست خدمات، تعرفه‌ها و ساعات کاری
                </span>
                <Button type="submit" variant="primary" size="lg">
                  <span>ذخیره و ادامه به تعریف خدمات</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="نام تجاری، آدرس اینستاگرام، نشانی پستی و موقعیت پین‌شده روی نقشه مستقیماً در پروفایل عمومی و پنل مدیریت کسب‌وکار شما نمایش داده می‌شوند." />
        </div>
      </div>
    </div>
  );
};

/** ۲. تکمیل خدمات، پرسنل و ساعات کاری (/business/onboarding) */
export const BusinessOnboardingStepPage: React.FC = () => {
  const { onboardingDraft, updateOnboardingDraft, categories, showToast } =
    usePrototypeData();

  const [srvTitle, setSrvTitle] = useState('');
  const [srvCategory, setSrvCategory] = useState('مو و رنگ');
  const [srvDuration, setSrvDuration] = useState('60');
  const [srvPrice, setSrvPrice] = useState('550000');
  const [srvError, setSrvError] = useState('');

  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateServiceForm({
      title: srvTitle,
      category: srvCategory,
      durationMinutes: Number(srvDuration),
      priceToman: Number(srvPrice),
    });
    if (!check.isValid) {
      setSrvError(Object.values(check.errors)[0] ?? 'خطا در ورودی خدمت');
      return;
    }
    setSrvError('');
    updateOnboardingDraft({
      services: [
        ...onboardingDraft.services,
        {
          id: `onb-srv-${Date.now()}`,
          title: srvTitle.trim(),
          category: srvCategory,
          durationMinutes: Number(srvDuration),
          priceToman: Number(srvPrice),
        },
      ],
    });
    setSrvTitle('');
    showToast('خدمت جدید به فهرست راه‌اندازی اضافه شد.');
  };

  const handleRemoveService = (id: string) => {
    updateOnboardingDraft({
      services: onboardingDraft.services.filter((s) => s.id !== id),
    });
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffRole.trim()) return;
    updateOnboardingDraft({
      staff: [
        ...onboardingDraft.staff,
        {
          id: `onb-stf-${Date.now()}`,
          fullName: staffName.trim(),
          roleTitle: staffRole.trim(),
        },
      ],
    });
    setStaffName('');
    setStaffRole('');
    showToast('متخصص جدید به فهرست راه‌اندازی اضافه شد.');
  };

  const handleToggleDay = (index: number) => {
    const updated = onboardingDraft.workingHours.map((wh, idx) =>
      idx === index ? { ...wh, isOpen: !wh.isOpen } : wh
    );
    updateOnboardingDraft({ workingHours: updated });
  };

  const handleTimeChange = (
    index: number,
    field: 'openTime' | 'closeTime',
    val: string
  ) => {
    const updated = onboardingDraft.workingHours.map((wh, idx) =>
      idx === index ? { ...wh, [field]: val } : wh
    );
    updateOnboardingDraft({ workingHours: updated });
  };

  return (
    <div>
      <PageHeader
        kicker="راه‌اندازی کسب‌وکار · گام ۲ از ۵"
        title="تعریف خدمات، متخصصان و ساعات کاری"
        subtitle="خدماتی که مشتریان در صفحه شما رزرو می‌کنند، اعضای تیم و برنامه هفتگی پذیرش را تنظیم کنید."
        routePattern="/business/onboarding"
        breadcrumbs={[
          { label: 'ثبت‌نام کسب‌وکار', href: '/business/register' },
          { label: 'تکمیل خدمات و برنامه کاری' },
        ]}
      />

      <OnboardingProgressHeader currentStep={2} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* الف) مدیریت خدمات اولیه */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-3.5">
              <div>
                <h2 className="text-base font-extrabold text-[#1E1B2E]">
                  ۱. فهرست خدمات و تعرفه‌های اولیه
                </h2>
                <p className="text-xs text-[#6B6480] mt-0.5">
                  حداقل ۲ خدمت اصلی با زمان تقریبی و تعرفه شفاف تعریف کنید
                </p>
              </div>
              <StatusBadge
                label={`${toPersianDigits(onboardingDraft.services.length)} خدمت ثبت‌شده`}
                tone="primary"
              />
            </div>

            <form
              onSubmit={handleAddService}
              className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2">
                  <FormField
                    id="onb-srv-title"
                    label="عنوان خدمت"
                    required
                    error={srvError}
                  >
                    <Input
                      id="onb-srv-title"
                      value={srvTitle}
                      onChange={(e) => setSrvTitle(e.target.value)}
                      placeholder="مثلاً بالیاژ و لایت مو..."
                    />
                  </FormField>
                </div>
                <FormField id="onb-srv-cat" label="دسته‌بندی">
                  <Select
                    id="onb-srv-cat"
                    value={srvCategory}
                    onChange={(e) => setSrvCategory(e.target.value)}
                    options={categories.map((c) => ({
                      value: c.title,
                      label: c.title,
                    }))}
                  />
                </FormField>
                <FormField id="onb-srv-price" label="تعرفه (تومان)" required>
                  <Input
                    id="onb-srv-price"
                    dir="ltr"
                    type="number"
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                  />
                </FormField>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-[#6B6480]">
                  <Clock className="w-3.5 h-3.5 text-[#6B6480]" />
                  <label htmlFor="onb-srv-dur" className="font-semibold">
                    مدت زمان ارائه خدمت (دقیقه):
                  </label>
                  <input
                    id="onb-srv-dur"
                    type="number"
                    dir="ltr"
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(e.target.value)}
                    className="w-20 rounded-lg border border-[#D4C9EE] bg-white px-2.5 py-1 text-xs font-bold text-center tabular-nums"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                  <span>افزودن خدمت به فهرست</span>
                </Button>
              </div>
            </form>

            <div className="divide-y divide-[#E6E0F5]">
              {onboardingDraft.services.map((srv) => (
                <div
                  key={srv.id}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-[#1E1B2E]">{srv.title}</p>
                    <p className="text-xs text-[#6B6480] tabular-nums">
                      {srv.category} ·{' '}
                      {formatDurationMinutes(srv.durationMinutes)} ·{' '}
                      <span className="font-bold text-[#8B5CF6]">
                        {formatPriceToman(srv.priceToman)}
                      </span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveService(srv.id)}
                    aria-label={`حذف خدمت ${srv.title}`}
                    className="text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* ب) مدیریت پرسنل */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-3.5">
              <div>
                <h2 className="text-base font-extrabold text-[#1E1B2E]">
                  ۲. متخصصان و ارائه‌دهندگان خدمت
                </h2>
                <p className="text-xs text-[#6B6480] mt-0.5">
                  معرفی اعضای تیم به مشتریان امکان می‌دهد متخصص دلخواه خود را
                  مستقیماً انتخاب کنند
                </p>
              </div>
              <StatusBadge
                label={`${toPersianDigits(onboardingDraft.staff.length)} نفر`}
                tone="neutral"
              />
            </div>

            <form
              onSubmit={handleAddStaff}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
            >
              <FormField id="onb-staff-name" label="نام و نام خانوادگی متخصص">
                <Input
                  id="onb-staff-name"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="مثلاً نازنین کریمی"
                />
              </FormField>
              <FormField id="onb-staff-role" label="سمت / تخصص">
                <Input
                  id="onb-staff-role"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  placeholder="مثلاً متخصص فیشیال"
                />
              </FormField>
              <Button type="submit" variant="outline">
                <Plus className="w-4 h-4" />
                <span>افزودن متخصص</span>
              </Button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onboardingDraft.staff.map((stf) => (
                <div
                  key={stf.id}
                  className="p-3.5 rounded-xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-extrabold text-[#1E1B2E]">
                      {stf.fullName}
                    </p>
                    <p className="text-[#6B6480] mt-0.5">{stf.roleTitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateOnboardingDraft({
                        staff: onboardingDraft.staff.filter(
                          (x) => x.id !== stf.id
                        ),
                      })
                    }
                    className="text-[#EF4444] font-semibold hover:underline cursor-pointer"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* ج) ساعات کاری */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E0F5] pb-3.5">
              <div>
                <h2 className="text-base font-extrabold text-[#1E1B2E]">
                  ۳. روزها و ساعات کاری هفتگی
                </h2>
                <p className="text-xs text-[#6B6480] mt-0.5">
                  روزهای باز بودن سالن و ساعت شروع و پایان پذیرش را برای هر روز
                  تنظیم کنید
                </p>
              </div>
              <StatusBadge
                label={`${toPersianDigits(
                  onboardingDraft.workingHours.filter((w) => w.isOpen).length
                )} روز فعال`}
                tone="success"
              />
            </div>

            <div className="divide-y divide-[#E6E0F5]">
              {onboardingDraft.workingHours.map((wh, index) => (
                <div
                  key={wh.dayName}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <label className="inline-flex items-center gap-2.5 font-bold text-[#1E1B2E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wh.isOpen}
                      onChange={() => handleToggleDay(index)}
                      className="accent-[#8B5CF6] w-4 h-4"
                    />
                    <span>{wh.dayName}</span>
                  </label>
                  {wh.isOpen ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B6480]">از ساعت</span>
                      <input
                        type="text"
                        value={wh.openTime}
                        onChange={(e) =>
                          handleTimeChange(index, 'openTime', e.target.value)
                        }
                        aria-label={`ساعت شروع ${wh.dayName}`}
                        className="w-20 rounded-xl border border-[#D4C9EE] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#8B5CF6] text-center tabular-nums focus:outline-none focus:border-[#8B5CF6]"
                      />
                      <span className="text-xs text-[#6B6480]">تا</span>
                      <input
                        type="text"
                        value={wh.closeTime}
                        onChange={(e) =>
                          handleTimeChange(index, 'closeTime', e.target.value)
                        }
                        aria-label={`ساعت پایان ${wh.dayName}`}
                        className="w-20 rounded-xl border border-[#D4C9EE] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#8B5CF6] text-center tabular-nums focus:outline-none focus:border-[#8B5CF6]"
                      />
                    </div>
                  ) : (
                    <StatusBadge label="تعطیل" tone="neutral" />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-5 border-t border-[#E6E0F5] flex flex-wrap items-center justify-between gap-3">
              <Link to="/business/register">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به مشخصات پایه</span>
                </Button>
              </Link>
              <Link to="/business/preview">
                <Button variant="primary" size="lg">
                  <span>مشاهده پیش‌نمایش پروفایل</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="ساعات کاری که در این بخش ویرایش می‌کنید، مستقیماً در پیش‌نمایش پروفایل عمومی و بخش «ساعات کاری هفتگی» پنل کسب‌وکار ثبت می‌شوند." />
        </div>
      </div>
    </div>
  );
};

/** ۳. پیش‌نمایش صفحه اختصاصی (/business/preview) */
export const BusinessPreviewStepPage: React.FC = () => {
  const { onboardingDraft } = usePrototypeData();
  const isPro =
    onboardingDraft.businessType === BusinessType.IndependentSpecialist;

  return (
    <div>
      <PageHeader
        kicker="راه‌اندازی کسب‌وکار · گام ۳ از ۵"
        title="پیش‌نمایش زنده صفحه اختصاصی شما"
        subtitle="نمای پروفایل عمومی کسب‌وکار شما در BeautyHub بر اساس اطلاعاتی که وارد کرده‌اید."
        routePattern="/business/preview"
        breadcrumbs={[
          { label: 'ثبت‌نام کسب‌وکار', href: '/business/register' },
          { label: 'پیش‌نمایش پروفایل' },
        ]}
      />

      <OnboardingProgressHeader currentStep={3} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Card padding="lg" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5">
                <VisualMediaIllustration
                  theme={isPro ? 'emerald' : 'violet'}
                  categoryLabel={
                    isPro ? 'متخصص مستقل زیبایی' : 'سالن زیبایی / پیرایشگاه'
                  }
                  title={onboardingDraft.businessName}
                  city={onboardingDraft.city}
                />
              </div>
              <div className="sm:col-span-7 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label="پیش‌نمایش پروفایل" tone="primary" />
                  <span
                    dir="ltr"
                    className="text-xs font-mono text-[#8B5CF6] bg-[#FAF8FF] px-2 py-0.5 rounded border border-[#E6E0F5]"
                  >
                    /{isPro ? 'pro' : 'salon'}/{onboardingDraft.slug}
                  </span>
                  {onboardingDraft.instagramHandle?.trim() ? (
                    <span
                      dir="ltr"
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#8B5CF6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-lg"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      {onboardingDraft.instagramHandle}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-xl font-extrabold text-[#1E1B2E]">
                  {onboardingDraft.businessName}
                </h2>
                <p className="text-xs text-[#6B6480] leading-relaxed">
                  {onboardingDraft.shortDescription}
                </p>
                <p className="text-xs text-[#6B6480]">
                  نشانی: {onboardingDraft.city}، {onboardingDraft.neighborhood}{' '}
                  — {onboardingDraft.address}
                </p>
                <p className="text-xs text-[#6B6480]">
                  مدیر مسئول: {onboardingDraft.ownerName}
                </p>
              </div>
            </div>

            {/* نمایش نقشه موقعیت انتخاب‌شده در پیش‌نمایش */}
            <LocationMapPicker
              city={onboardingDraft.city}
              neighborhood={onboardingDraft.neighborhood}
              address={onboardingDraft.address}
              lat={onboardingDraft.mapLat ?? 35.8058}
              lng={onboardingDraft.mapLng ?? 51.4018}
              readOnly
            />

            <div className="pt-5 border-t border-[#E6E0F5] space-y-3">
              <h3 className="text-sm font-extrabold text-[#1E1B2E]">
                خدمات قابل رزرو در پروفایل (
                {toPersianDigits(onboardingDraft.services.length)} خدمت):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onboardingDraft.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#1E1B2E]">{srv.title}</p>
                      <p className="text-[11px] text-[#6B6480] mt-0.5 tabular-nums">
                        {srv.category} ·{' '}
                        {formatDurationMinutes(srv.durationMinutes)}
                      </p>
                    </div>
                    <span className="font-extrabold text-[#8B5CF6] tabular-nums">
                      {formatPriceToman(srv.priceToman)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-[#E6E0F5] flex flex-wrap items-center justify-between gap-3">
              <Link to="/business/onboarding">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>ویرایش خدمات و ساعات کاری</span>
                </Button>
              </Link>
              <Link to="/business/verification">
                <Button variant="primary" size="lg">
                  <span>تایید پیش‌نمایش و گام بعدی</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="این کارت دقیقاً همان ساختاری است که مشتریان هنگام جست‌وجو و ورود به صفحه اختصاصی شما مشاهده می‌کنند. در صورت نیاز به اصلاح نام یا تعرفه‌ها می‌توانید به گام قبل بازگردید." />
        </div>
      </div>
    </div>
  );
};

/** ۴. اطلاعات احراز هویت و مجوز صنفی (/business/verification) */
export const BusinessVerificationStepPage: React.FC = () => {
  const { onboardingDraft, updateOnboardingDraft, submitBusinessOnboarding } =
    usePrototypeData();

  return (
    <div>
      <PageHeader
        kicker="راه‌اندازی کسب‌وکار · گام ۴ از ۵"
        title="ثبت اطلاعات احراز هویت و مجوز صنفی"
        subtitle="ثبت شناسه صنفی یا گواهینامه مهارت جهت بررسی و اعطای نشان «مرکز تاییدشده» در BeautyHub"
        routePattern="/business/verification"
        breadcrumbs={[
          { label: 'ثبت‌نام کسب‌وکار', href: '/business/register' },
          { label: 'احراز مدارک' },
        ]}
      />

      <OnboardingProgressHeader currentStep={4} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8">
          <Card padding="lg" className="space-y-5">
            <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/30 flex items-start gap-3 text-xs text-[#92400E]">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#F59E0B]" />
              <div className="space-y-1">
                <p className="font-extrabold">راهنمای بررسی مدارک کسب‌وکار</p>
                <p className="leading-relaxed">
                  اطلاعات ثبت‌شده در این بخش توسط واحد پشتیبانی بررسی می‌شود تا
                  نشان «مرکز تاییدشده» در کنار نام سالن شما نمایش داده شود.
                </p>
              </div>
            </div>

            <FormField
              id="ver-license"
              label="شماره پروانه کسب یا گواهینامه مهارت فنی‌وحرفه‌ای"
              optionalLabel="اختیاری در ثبت اولیه"
            >
              <Input
                id="ver-license"
                dir="ltr"
                value={onboardingDraft.licenseCode}
                onChange={(e) =>
                  updateOnboardingDraft({ licenseCode: e.target.value })
                }
              />
            </FormField>

            <FormField
              id="ver-nid"
              label="کد شناسایی ده رقمی مدیر مسئول"
              optionalLabel="اختیاری در ثبت اولیه"
            >
              <Input
                id="ver-nid"
                dir="ltr"
                value={onboardingDraft.nationalIdNumber}
                onChange={(e) =>
                  updateOnboardingDraft({ nationalIdNumber: e.target.value })
                }
              />
            </FormField>

            <div className="pt-5 border-t border-[#E6E0F5] flex flex-wrap items-center justify-between gap-3">
              <Link to="/business/preview">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به پیش‌نمایش</span>
                </Button>
              </Link>
              <Link
                to="/business/ready"
                onClick={() => {
                  void submitBusinessOnboarding();
                }}
              >
                <Button variant="primary" size="lg">
                  <span>تکمیل فرآیند راه‌اندازی</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="کسب‌وکارهای دارای نشان «تاییدشده» در صدر نتایج جست‌وجوی شهر نمایش داده می‌شوند و اعتماد مشتریان برای رزرو نوبت اول را افزایش می‌دهند." />
        </div>
      </div>
    </div>
  );
};

/** ۵. تکمیل راه‌اندازی (/business/ready) */
export const BusinessReadyStepPage: React.FC = () => {
  const { onboardingDraft } = usePrototypeData();

  return (
    <div>
      <PageHeader
        kicker="راه‌اندازی کسب‌وکار · گام پایانی"
        title="راه‌اندازی کسب‌وکار با موفقیت تکمیل شد"
        subtitle="خلاصه وضعیت آماده‌سازی پروفایل و دسترسی مستقیم به پیشخوان مدیریت روزانه سالن"
        routePattern="/business/ready"
        breadcrumbs={[
          { label: 'ثبت‌نام کسب‌وکار', href: '/business/register' },
          { label: 'پایان راه‌اندازی' },
        ]}
      />

      <OnboardingProgressHeader currentStep={5} />

      <div className="max-w-3xl mx-auto">
        <Card padding="lg" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E6E0F5]">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 text-[#10B981] inline-flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <StatusBadge label="آماده پذیرش نوبت آنلاین" tone="success" />
                <h2 className="text-xl font-extrabold text-[#1E1B2E] mt-1.5">
                  پروفایل «{onboardingDraft.businessName}» آماده است
                </h2>
                <p className="text-xs text-[#6B6480] mt-1">
                  دوره آزمایشی ۱۴ روزه فعال شد · مدیر مسئول:{' '}
                  {onboardingDraft.ownerName}
                </p>
              </div>
            </div>
          </div>

          {/* چک‌لیست تکمیل‌شده راه‌اندازی */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-1">
              <p className="text-xs text-[#6B6480]">پروفایل و نشانی</p>
              <p className="text-sm font-extrabold text-[#1E1B2E]">
                {onboardingDraft.city}، {onboardingDraft.neighborhood}
              </p>
              <p className="text-[11px] text-[#10B981] font-semibold">
                ✓ مشخصات پایه تکمیل شد
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-1">
              <p className="text-xs text-[#6B6480]">خدمات و تعرفه‌ها</p>
              <p className="text-sm font-extrabold text-[#1E1B2E] tabular-nums">
                {toPersianDigits(onboardingDraft.services.length)} خدمت فعال
              </p>
              <p className="text-[11px] text-[#10B981] font-semibold">
                ✓ آماده رزرو آنلاین
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-1">
              <p className="text-xs text-[#6B6480]">اعضای تیم و تقویم</p>
              <p className="text-sm font-extrabold text-[#1E1B2E] tabular-nums">
                {toPersianDigits(onboardingDraft.staff.length)} متخصص ثبت‌شده
              </p>
              <p className="text-[11px] text-[#10B981] font-semibold">
                ✓ برنامه هفتگی تنظیم شد
              </p>
            </div>
          </div>

          <p className="text-xs text-[#6B6480] leading-relaxed bg-[#FAF8FF] p-3.5 rounded-xl border border-[#E6E0F5]">
            اکنون می‌توانید وارد پیشخوان مدیریت کسب‌وکار شوید و تقویم، نوبت‌ها،
            خدمات و گزارش‌های سالن را مدیریت کنید.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Link to="/salon/royal-golzar">
              <Button variant="outline">
                <span>مشاهده پروفایل عمومی</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/app">
              <Button variant="primary" size="lg">
                <Building2 className="w-4 h-4" />
                <span>ورود به پیشخوان کسب‌وکار</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
