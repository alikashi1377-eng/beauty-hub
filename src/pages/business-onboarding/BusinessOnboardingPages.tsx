import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  Check,
  Building2,
  ExternalLink,
  Instagram,
  Wand2,
  ShieldCheck,
  TrendingUp,
  MessageSquareText,
  Users,
  X,
  CreditCard,
  Crown,
} from 'lucide-react';
import {
  IRAN_CITIES,
  SAMPLE_CATEGORIES,
} from '../../mocks/sampleData';
import { BusinessType, SubscriptionPlanItem } from '../../types';
import {
  formatDurationMinutes,
  formatPriceToman,
  getPlanStaffLimitCount,
  isValidIranMobile,
  normalizeIranMobileInput,
  suggestSlugFromName,
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
import { IncompleteFormState } from '../../components/ui/StateViews';
import { VisualMediaIllustration } from '../../components/ui/VisualMediaIllustration';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LocationMapPicker } from '../../components/ui/LocationMapPicker';
import { ProfilePhotoUploader } from '../../components/ui/ProfilePhotoUploader';
import { EasyCheckoutModal } from '../../components/ui/EasyCheckoutModal';

/** نوار پیشرفت افقی مینیمال و جمع‌وجور (بدون توضیحات اضافی بالای صفحه) */
const OnboardingProgressHeader: React.FC<{
  currentStep: number;
  stepTitle: string;
}> = ({ currentStep, stepTitle }) => {
  const steps = [
    { num: 1, title: 'مشخصات و عکس', href: '/business/register' },
    { num: 2, title: 'خدمات و ساعت کاری', href: '/business/onboarding' },
    { num: 3, title: 'پیش‌نمایش', href: '/business/preview' },
    { num: 4, title: 'تکمیل پرونده', href: '/business/verification' },
    { num: 5, title: 'انتخاب پلن و شروع', href: '/business/ready' },
  ];

  return (
    <div className="mb-5 rounded-2xl border border-[#CBD5E1] bg-white px-3.5 py-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-xl bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center justify-center tabular-nums shrink-0">
            {toPersianDigits(currentStep)}
          </span>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#061138]">
              {stepTitle}
            </h1>
            <p className="text-[11px] text-[#334155]">
              گام {toPersianDigits(currentStep)} از ۵ · ذخیره خودکار
            </p>
          </div>
        </div>

        {/* استپر کپسولی مینیمال */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {steps.map((s, idx) => {
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <React.Fragment key={s.num}>
                <Link
                  to={s.href}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] transition-all inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-[#061138] text-white font-extrabold shadow-2xs'
                      : isDone
                      ? 'bg-[#ECFDF5] text-[#059669] border border-[#10B981]/30 font-bold'
                      : 'bg-[#F3F6FC] text-[#64748B] font-semibold hover:text-[#061138]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold tabular-nums ${
                      isCurrent
                        ? 'bg-[#00E5FF] text-[#061138]'
                        : isDone
                        ? 'bg-[#10B981] text-white'
                        : 'bg-white text-[#64748B]'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      toPersianDigits(s.num)
                    )}
                  </span>
                  <span className="hidden md:inline">{s.title}</span>
                </Link>
                {idx < steps.length - 1 ? (
                  <span className="w-2 sm:w-3 h-px bg-[#CBD5E1] shrink-0" />
                ) : null}
              </React.Fragment>
            );
          })}
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold text-[#334155] hover:bg-[#F3F6FC] hover:text-[#061138] transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">خروج به سایت</span>
        </Link>
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
    <div className="space-y-4 lg:sticky lg:top-20">
      <Card variant="dark" className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <span className="text-xs font-bold text-[#00E5FF]">
            پیش‌نمایش کارت سالن شما
          </span>
          <span
            dir="ltr"
            className="text-[11px] font-mono text-white/90 bg-white/10 px-2 py-0.5 rounded"
          >
            timeto.ir/{isPro ? 'pro' : 'salon'}/
            {onboardingDraft.slug || 'your-salon'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onboardingDraft.avatarUrl ? (
            <img
              src={onboardingDraft.avatarUrl}
              alt={onboardingDraft.businessName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#00E5FF]/60 shrink-0"
            />
          ) : null}
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
              {onboardingDraft.businessName || 'نام سالن زیبایی شما'}
            </h3>
            <p className="text-xs text-slate-300 truncate">
              {onboardingDraft.city}
              {onboardingDraft.neighborhood
                ? ` · ${onboardingDraft.neighborhood}`
                : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/15 text-xs">
          <div className="p-2.5 rounded-xl bg-white/10">
            <p className="text-[11px] text-slate-300">خدمات قابل رزرو</p>
            <p className="text-sm font-extrabold text-white mt-0.5 tabular-nums">
              {toPersianDigits(onboardingDraft.services.length)} خدمت
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/10">
            <p className="text-[11px] text-slate-300">متخصصان فعال</p>
            <p className="text-sm font-extrabold text-white mt-0.5 tabular-nums">
              {toPersianDigits(onboardingDraft.staff.length)} نفر
            </p>
          </div>
        </div>
      </Card>

      <Card variant="muted" padding="sm" className="space-y-1.5">
        <p className="text-xs font-extrabold text-[#0057FF]">نکته کاربردی</p>
        <p className="text-xs text-[#334155] leading-relaxed">{stepHint}</p>
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

  const effectiveCategories =
    categories.length > 0 ? categories : SAMPLE_CATEGORIES;

  const isPro =
    onboardingDraft.businessType === BusinessType.IndependentSpecialist;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSlug =
      onboardingDraft.slug.trim() ||
      suggestSlugFromName(onboardingDraft.businessName);
    if (effectiveSlug !== onboardingDraft.slug) {
      updateOnboardingDraft({ slug: effectiveSlug });
    }

    const validation = validateBusinessRegistrationDraft({
      businessName: onboardingDraft.businessName,
      ownerName: onboardingDraft.ownerName,
      phone: onboardingDraft.phone,
      city: onboardingDraft.city,
      slug: effectiveSlug,
    });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    showToast('مشخصات سالن و عکس پروفایل ذخیره شد.');
    navigate('/business/onboarding');
  };

  return (
    <div>
      <OnboardingProgressHeader
        currentStep={1}
        stepTitle="ثبت سالن زیبایی یا متخصص مستقل"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          {Object.keys(errors).length > 0 ? (
            <IncompleteFormState
              errors={Object.values(errors)}
              onDismiss={() => setErrors({})}
            />
          ) : null}

          <Card padding="lg">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* ۱. انتخاب نوع کسب‌وکار */}
              <div className="space-y-2.5">
                <label className="block text-sm font-extrabold text-[#061138]">
                  ۱. نوع فعالیت شما چیست؟{' '}
                  <span className="text-[#0057FF]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      type: BusinessType.WomenSalon,
                      label: 'سالن زیبایی زنانه',
                      desc: 'لاین‌های مو، ناخن، میکاپ و پوست',
                    },
                    {
                      type: BusinessType.MenBarbershop,
                      label: 'آرایشگاه و پیرایش مردانه',
                      desc: 'اصلاح مو و ریش، استایلینگ و داماد',
                    },
                    {
                      type: BusinessType.IndependentSpecialist,
                      label: 'متخصص مستقل زیبایی',
                      desc: 'فیشیالیست، ناخن‌کار یا میکاپ‌آرتیست',
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
                        className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0057FF] bg-[#E0ECFF] ring-2 ring-[#0057FF]/15'
                            : 'border-[#CBD5E1] bg-[#F3F6FC] hover:bg-white hover:border-[#0057FF]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm font-extrabold text-[#061138]">
                            {opt.label}
                          </p>
                          {isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-[#0057FF] text-white inline-flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-[#334155] mt-1 leading-relaxed">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ۲. عکس پروفایل با ابعاد استاندارد ۱:۱ */}
              <div className="pt-4 border-t border-[#CBD5E1]">
                <ProfilePhotoUploader
                  value={onboardingDraft.avatarUrl}
                  businessName={onboardingDraft.businessName}
                  label="۲. انتخاب عکس پروفایل سالن / متخصص (با ابعاد استاندارد ۱:۱)"
                  onChange={(newUrl) => {
                    updateOnboardingDraft({ avatarUrl: newUrl });
                    showToast(
                      'تصویر پروفایل با ابعاد استاندارد تنظیم و ذخیره شد.',
                      'info'
                    );
                  }}
                />
              </div>

              {/* ۳. مشخصات هویتی و تماس */}
              <div className="pt-4 border-t border-[#CBD5E1] space-y-4">
                <h2 className="text-sm font-extrabold text-[#061138]">
                  ۳. نام سالن و اطلاعات تماس
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
                      placeholder="مثلاً سالن زیبایی ارکیده"
                      onChange={(e) =>
                        updateOnboardingDraft({ businessName: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id="reg-category"
                    label="تخصص اصلی مجموعه"
                    required
                  >
                    <Select
                      id="reg-category"
                      value={onboardingDraft.categorySlug || 'hair-color'}
                      onChange={(e) =>
                        updateOnboardingDraft({ categorySlug: e.target.value })
                      }
                      options={effectiveCategories.map((c) => ({
                        value: c.slug,
                        label: c.title,
                      }))}
                    />
                  </FormField>
                </div>

                {/* دکمه‌های انتخاب فوری تخصص اصلی برای کارکرد ۱۰۰٪ روی موبایل و دسکتاپ */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-bold text-[#64748B] ml-1">
                    انتخاب سریع تخصص:
                  </span>
                  {effectiveCategories.map((cat) => {
                    const isSelected =
                      (onboardingDraft.categorySlug || 'hair-color') ===
                      cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() =>
                          updateOnboardingDraft({ categorySlug: cat.slug })
                        }
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-2xs'
                            : 'bg-[#F3F6FC] text-[#334155] border-[#CBD5E1] hover:border-[#0057FF]'
                        }`}
                      >
                        {cat.title}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    id="reg-owner-name"
                    label="نام و نام خانوادگی مدیر / متخصص"
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
                    label="شماره موبایل هماهنگی (۱۱ رقم با 09)"
                    required
                    error={
                      errors.phone ||
                      (onboardingDraft.phone.length > 0 &&
                      !isValidIranMobile(onboardingDraft.phone)
                        ? 'فرمت موبایل باید ۱۱ رقم و با 09 شروع شود (مثلاً 09131234567)'
                        : undefined)
                    }
                  >
                    <Input
                      id="reg-phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={11}
                      dir="ltr"
                      placeholder="09131234567"
                      value={onboardingDraft.phone}
                      hasError={
                        Boolean(errors.phone) ||
                        (onboardingDraft.phone.length > 0 &&
                          !isValidIranMobile(onboardingDraft.phone))
                      }
                      onChange={(e) =>
                        updateOnboardingDraft({
                          phone: normalizeIranMobileInput(e.target.value),
                        })
                      }
                    />
                  </FormField>

                  <FormField
                    id="reg-instagram"
                    label="پیج اینستاگرام"
                    optionalLabel="اختیاری"
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

              {/* ۴. نشانی هوشمند از روی نقشه و آدرس اینترنتی صفحه سالن */}
              <div className="pt-4 border-t border-[#CBD5E1] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold text-[#061138]">
                    ۴. انتخاب لوکیشن روی نقشه (تکمیل خودکار آدرس) و لینک صفحه
                  </h2>
                  <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#10B981]/30">
                    با کلیک روی نقشه یا انتخاب محله، آدرس خودکار پر می‌شود
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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

                  <div className="p-3 rounded-xl bg-[#F3F6FC] border border-[#CBD5E1] flex items-center justify-between text-xs">
                    <span className="text-[#334155] font-bold">
                      محله انتخاب‌شده از نقشه:
                    </span>
                    <span className="font-extrabold text-[#0057FF]">
                      {onboardingDraft.neighborhood || 'چهارباغ بالا'}
                    </span>
                  </div>
                </div>

                {/* انتخاب موقعیت روی نقشه با قابلیت باز کردن گوگل‌مپ، GPS و تکمیل خودکار نشانی */}
                <LocationMapPicker
                  city={onboardingDraft.city}
                  neighborhood={onboardingDraft.neighborhood}
                  address={onboardingDraft.address}
                  lat={onboardingDraft.mapLat ?? 32.6288}
                  lng={onboardingDraft.mapLng ?? 51.6621}
                  onSelectLocation={({
                    lat,
                    lng,
                    neighborhood,
                    suggestedAddress,
                  }) => {
                    updateOnboardingDraft({
                      mapLat: lat,
                      mapLng: lng,
                      neighborhood:
                        neighborhood || onboardingDraft.neighborhood,
                      address: suggestedAddress || onboardingDraft.address,
                    });
                    showToast(
                      'موقعیت سالن ثبت شد و نشانی به صورت خودکار از روی نقشه تکمیل گردید.',
                      'success'
                    );
                  }}
                />

                <FormField
                  id="reg-address"
                  label="نشانی سالن (تکمیل‌شده به صورت خودکار از روی نقشه — در صورت نیاز پلاک یا واحد را اضافه کنید)"
                  required
                >
                  <Input
                    id="reg-address"
                    value={onboardingDraft.address}
                    onChange={(e) =>
                      updateOnboardingDraft({ address: e.target.value })
                    }
                  />
                </FormField>

                {/* فیلد آدرس اینترنتی صفحه سالن با توضیح کاملاً قابل فهم برای عموم */}
                <div className="p-4 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label
                        htmlFor="reg-slug"
                        className="block text-xs sm:text-sm font-extrabold text-[#061138]"
                      >
                        آدرس اینترنتی صفحه سالن شما (به انگلیسی){' '}
                        <span className="text-[#0057FF]">*</span>
                      </label>
                      <p className="text-[11px] text-[#334155] mt-0.5">
                        این آدرس کوتاه اختصاصی سالن شماست تا در بیو اینستاگرام بگذارید یا برای مشتری بفرستید (مثلاً: royal-salon).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = suggestSlugFromName(
                          onboardingDraft.businessName
                        );
                        updateOnboardingDraft({ slug: suggested });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-[11px] font-extrabold text-[#0057FF] cursor-pointer transition-colors"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>ساخت خودکار از نام سالن</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Input
                      id="reg-slug"
                      dir="ltr"
                      placeholder="royal-salon"
                      value={onboardingDraft.slug}
                      hasError={Boolean(errors.slug)}
                      onChange={(e) =>
                        updateOnboardingDraft({
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-'),
                        })
                      }
                    />
                    <div
                      dir="ltr"
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] text-xs font-mono text-[#334155] shrink-0"
                    >
                      timeto.ir/{isPro ? 'pro' : 'salon'}/
                      <strong className="text-[#0057FF]">
                        {onboardingDraft.slug || 'royal-salon'}
                      </strong>
                    </div>
                  </div>
                  {errors.slug ? (
                    <p className="text-xs font-bold text-[#EF4444]">
                      {errors.slug}
                    </p>
                  ) : null}
                </div>

                <FormField
                  id="reg-desc"
                  label="معرفی کوتاه سالن (یک جمله برای نمایش به مشتریان)"
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

              <div className="pt-4 border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#334155]">
                  گام بعدی: ثبت خدمات، تعرفه‌ها و ساعات کاری
                </span>
                <Button type="submit" variant="primary" size="lg">
                  <span>ذخیره و گام بعدی</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="عکس پروفایل، نام سالن و لینک اختصاصی شما بلافاصله در ویترین آنلاین تایم تو (Timeto) قابل مشاهده خواهد بود." />
        </div>
      </div>
    </div>
  );
};

/** ۲. تکمیل خدمات، پرسنل و ساعات کاری (/business/onboarding) */
export const BusinessOnboardingStepPage: React.FC = () => {
  const {
    onboardingDraft,
    updateOnboardingDraft,
    categories,
    plans,
    showToast,
  } = usePrototypeData();

  const effectiveCategories =
    categories.length > 0 ? categories : SAMPLE_CATEGORIES;

  const [srvTitle, setSrvTitle] = useState('');
  const [srvCategory, setSrvCategory] = useState('مو و رنگ');
  const [srvDuration, setSrvDuration] = useState('60');
  const [srvPrice, setSrvPrice] = useState('550000');
  const [srvError, setSrvError] = useState('');

  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');

  const currentPlanId = onboardingDraft.selectedPlanId || 'plan-free-start';
  const currentPlanObj =
    plans.find((p) => p.id === currentPlanId) || plans[0];
  const staffLimitCount = getPlanStaffLimitCount(currentPlanId);
  const isStaffLimitReached = onboardingDraft.staff.length >= staffLimitCount;

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
    showToast('خدمت جدید اضافه شد.');
  };

  const handleRemoveService = (id: string) => {
    updateOnboardingDraft({
      services: onboardingDraft.services.filter((s) => s.id !== id),
    });
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStaffLimitReached) {
      showToast(
        `در «${currentPlanObj?.name || 'پلن رایگان'}» حداکثر ${toPersianDigits(
          staffLimitCount
        )} متخصص قابل ثبت است. برای افزودن متخصص بیشتر، پلن حرفه‌ای یا VIP را انتخاب کنید.`,
        'warning'
      );
      return;
    }
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
    showToast('متخصص جدید به تیم اضافه شد.');
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
      <OnboardingProgressHeader
        currentStep={2}
        stepTitle="تعریف خدمات، متخصصان و ساعات کاری"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* الف) مدیریت خدمات اولیه */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#061138]">
                  ۱. خدمات و تعرفه‌های قابل رزرو
                </h2>
                <p className="text-xs text-[#334155] mt-0.5">
                  در هر زمان از طریق پنل مدیریت هم می‌توانید خدمات را ویرایش یا اضافه کنید
                </p>
              </div>
              <StatusBadge
                label={`${toPersianDigits(onboardingDraft.services.length)} خدمت`}
                tone="primary"
              />
            </div>

            <form
              onSubmit={handleAddService}
              className="p-3.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] space-y-3"
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
                    options={effectiveCategories.map((c) => ({
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

              {/* انتخاب سریع دسته‌بندی خدمت برای سهولت در موبایل و دسکتاپ */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-bold text-[#64748B] ml-1">
                  انتخاب سریع دسته:
                </span>
                {effectiveCategories.map((cat) => {
                  const isSelected = srvCategory === cat.title;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setSrvCategory(cat.title)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#0057FF] text-white border-[#0057FF]'
                          : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0057FF]'
                      }`}
                    >
                      {cat.title}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs text-[#334155]">
                  <Clock className="w-3.5 h-3.5 text-[#0057FF]" />
                  <label htmlFor="onb-srv-dur" className="font-bold">
                    مدت زمان (دقیقه):
                  </label>
                  <input
                    id="onb-srv-dur"
                    type="number"
                    dir="ltr"
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(e.target.value)}
                    className="w-20 rounded-xl border border-[#CBD5E1] bg-white px-2.5 py-1 text-xs font-extrabold text-center tabular-nums"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm">
                  <Plus className="w-4 h-4" />
                  <span>افزودن خدمت</span>
                </Button>
              </div>
            </form>

            <div className="divide-y divide-[#E2E8F0]">
              {onboardingDraft.services.map((srv) => (
                <div
                  key={srv.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-[#061138]">{srv.title}</p>
                    <p className="text-xs text-[#334155] tabular-nums">
                      {srv.category} ·{' '}
                      {formatDurationMinutes(srv.durationMinutes)} ·{' '}
                      <span className="font-extrabold text-[#0057FF]">
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

          {/* ب) مدیریت پرسنل با اعمال سقف پلن انتخابی */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CBD5E1] pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#061138]">
                  ۲. متخصصان و اعضای تیم
                </h2>
                <p className="text-xs text-[#334155] mt-0.5">
                  سقف مجاز بر اساس پلن انتخابی شما ({currentPlanObj?.name || 'شروع رایگان'}): حداکثر{' '}
                  <strong className="text-[#0057FF]">
                    {toPersianDigits(staffLimitCount)} متخصص
                  </strong>
                </p>
              </div>
              <StatusBadge
                label={`${toPersianDigits(
                  onboardingDraft.staff.length
                )} از ${toPersianDigits(staffLimitCount)} نفر`}
                tone={isStaffLimitReached ? 'warning' : 'primary'}
              />
            </div>

            {/* نوار انتخاب سریع ظرفیت پلن در مرحله ثبت متخصصان */}
            <div className="p-3 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#061138]">
                پلن فعلی ثبت‌نام:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'plan-free-start', label: 'پلن رایگان (۱ متخصص)' },
                  { id: 'plan-professional', label: 'پلن حرفه‌ای (تا ۳ متخصص)' },
                  { id: 'plan-vip-multi', label: 'پلن VIP (تا ۸ متخصص)' },
                ].map((pl) => {
                  const active = currentPlanId === pl.id;
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        updateOnboardingDraft({ selectedPlanId: pl.id });
                        if (
                          pl.id === 'plan-free-start' &&
                          onboardingDraft.staff.length > 1
                        ) {
                          updateOnboardingDraft({
                            selectedPlanId: pl.id,
                            staff: onboardingDraft.staff.slice(0, 1),
                          });
                        }
                        showToast(`ظرفیت تیم بر اساس «${pl.label}» تنظیم شد.`, 'info');
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold cursor-pointer transition-all border ${
                        active
                          ? 'bg-[#061138] text-[#00E5FF] border-[#061138]'
                          : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0057FF]'
                      }`}
                    >
                      {pl.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isStaffLimitReached ? (
              <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[#92400E]">
                    ظرفیت متخصصان در «{currentPlanObj?.name || 'پلن شروع رایگان'}» تکمیل است ({toPersianDigits(staffLimitCount)} نفر)
                  </p>
                  <p className="text-[#B45309]">
                    در پلن رایگان فقط ۱ متخصص (خودِ مدیر سالن) قابل ثبت است. برای افزودن پرسنل بیشتر، پلن حرفه‌ای (تا ۳ متخصص) یا VIP (تا ۸ متخصص) را انتخاب کنید.
                  </p>
                </div>
                {currentPlanId === 'plan-free-start' ? (
                  <button
                    type="button"
                    onClick={() => {
                      updateOnboardingDraft({
                        selectedPlanId: 'plan-professional',
                      });
                      showToast(
                        'پلن حرفه‌ای (ظرفیت تا ۳ متخصص) انتخاب شد؛ در مرحله پایانی پرداخت و فعال‌سازی انجام می‌شود.',
                        'success'
                      );
                    }}
                    className="px-3.5 py-2 rounded-full bg-[#0057FF] hover:bg-[#0046CC] text-white font-extrabold text-[11px] shrink-0 cursor-pointer transition-colors"
                  >
                    انتخاب پلن حرفه‌ای (تا ۳ متخصص)
                  </button>
                ) : currentPlanId === 'plan-professional' ? (
                  <button
                    type="button"
                    onClick={() => {
                      updateOnboardingDraft({
                        selectedPlanId: 'plan-vip-multi',
                      });
                      showToast(
                        'پلن VIP (ظرفیت تا ۸ متخصص) انتخاب شد.',
                        'success'
                      );
                    }}
                    className="px-3.5 py-2 rounded-full bg-[#061138] hover:bg-[#0F1E54] text-[#00E5FF] font-extrabold text-[11px] shrink-0 cursor-pointer transition-colors"
                  >
                    انتخاب پلن VIP (تا ۸ متخصص)
                  </button>
                ) : null}
              </div>
            ) : (
              <form
                onSubmit={handleAddStaff}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
              >
                <FormField id="onb-staff-name" label="نام متخصص">
                  <Input
                    id="onb-staff-name"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="مثلاً نازنین کریمی"
                  />
                </FormField>
                <FormField id="onb-staff-role" label="تخصص / لاین">
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
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onboardingDraft.staff.map((stf) => (
                <div
                  key={stf.id}
                  className="p-3 rounded-xl border border-[#CBD5E1] bg-[#F3F6FC] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-extrabold text-[#061138]">
                      {stf.fullName}
                    </p>
                    <p className="text-[#334155] mt-0.5">{stf.roleTitle}</p>
                  </div>
                  {onboardingDraft.staff.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateOnboardingDraft({
                          staff: onboardingDraft.staff.filter(
                            (x) => x.id !== stf.id
                          ),
                        })
                      }
                      className="text-[#EF4444] font-bold hover:underline cursor-pointer"
                    >
                      حذف
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-[#0057FF]">
                      متخصص اصلی
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* ج) ساعات کاری */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CBD5E1] pb-3">
              <div>
                <h2 className="text-base font-extrabold text-[#061138]">
                  ۳. برنامه کاری هفتگی
                </h2>
                <p className="text-xs text-[#334155] mt-0.5">
                  روزها و ساعات پذیرش نوبت آنلاین
                </p>
              </div>
              <StatusBadge
                label={`${toPersianDigits(
                  onboardingDraft.workingHours.filter((w) => w.isOpen).length
                )} روز فعال`}
                tone="success"
              />
            </div>

            <div className="divide-y divide-[#E2E8F0]">
              {onboardingDraft.workingHours.map((wh, index) => (
                <div
                  key={wh.dayName}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <label className="inline-flex items-center gap-2.5 font-extrabold text-[#061138] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wh.isOpen}
                      onChange={() => handleToggleDay(index)}
                      className="accent-[#0057FF] w-4 h-4"
                    />
                    <span>{wh.dayName}</span>
                  </label>
                  {wh.isOpen ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#334155]">از</span>
                      <input
                        type="text"
                        value={wh.openTime}
                        onChange={(e) =>
                          handleTimeChange(index, 'openTime', e.target.value)
                        }
                        aria-label={`ساعت شروع ${wh.dayName}`}
                        className="w-20 rounded-xl border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#0057FF] text-center tabular-nums"
                      />
                      <span className="text-xs text-[#334155]">تا</span>
                      <input
                        type="text"
                        value={wh.closeTime}
                        onChange={(e) =>
                          handleTimeChange(index, 'closeTime', e.target.value)
                        }
                        aria-label={`ساعت پایان ${wh.dayName}`}
                        className="w-20 rounded-xl border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#0057FF] text-center tabular-nums"
                      />
                    </div>
                  ) : (
                    <StatusBadge label="تعطیل" tone="neutral" />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
              <Link to="/business/register">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>گام قبل</span>
                </Button>
              </Link>
              <Link to="/business/preview">
                <Button variant="primary" size="lg">
                  <span>مشاهده پیش‌نمایش صفحه</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="ساعات کاری و خدماتی که وارد می‌کنید، بلافاصله تقویم رزرو آنلاین شما را برای مشتریان فعال می‌کند." />
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
      <OnboardingProgressHeader
        currentStep={3}
        stepTitle="پیش‌نمایش پروفایل عمومی سالن شما"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          <Card padding="lg" className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5">
                <VisualMediaIllustration
                  theme={isPro ? 'emerald' : 'violet'}
                  categoryLabel={
                    isPro ? 'متخصص مستقل زیبایی' : 'سالن زیبایی / پیرایشگاه'
                  }
                  title={onboardingDraft.businessName}
                  city={onboardingDraft.city}
                  imageUrl={onboardingDraft.avatarUrl}
                />
              </div>
              <div className="sm:col-span-7 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label="آماده انتشار" tone="success" />
                  <span
                    dir="ltr"
                    className="text-xs font-mono font-bold text-[#0057FF] bg-[#F3F6FC] px-2.5 py-0.5 rounded-lg border border-[#CBD5E1]"
                  >
                    timeto.ir/{isPro ? 'pro' : 'salon'}/{onboardingDraft.slug}
                  </span>
                  {onboardingDraft.instagramHandle?.trim() ? (
                    <span
                      dir="ltr"
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#061138] bg-[#E0ECFF] px-2.5 py-0.5 rounded-lg"
                    >
                      <Instagram className="w-3.5 h-3.5 text-[#0057FF]" />
                      {onboardingDraft.instagramHandle}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-xl font-extrabold text-[#061138]">
                  {onboardingDraft.businessName}
                </h2>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {onboardingDraft.shortDescription}
                </p>
                <p className="text-xs text-[#334155]">
                  <strong className="text-[#061138]">نشانی:</strong>{' '}
                  {onboardingDraft.city}، {onboardingDraft.neighborhood} —{' '}
                  {onboardingDraft.address}
                </p>
                <p className="text-xs text-[#334155]">
                  <strong className="text-[#061138]">مدیر مسئول:</strong>{' '}
                  {onboardingDraft.ownerName}
                </p>
              </div>
            </div>

            <LocationMapPicker
              city={onboardingDraft.city}
              neighborhood={onboardingDraft.neighborhood}
              address={onboardingDraft.address}
              lat={onboardingDraft.mapLat ?? 32.6288}
              lng={onboardingDraft.mapLng ?? 51.6621}
              readOnly
            />

            <div className="pt-4 border-t border-[#CBD5E1] space-y-3">
              <h3 className="text-sm font-extrabold text-[#061138]">
                خدمات قابل رزرو (
                {toPersianDigits(onboardingDraft.services.length)} مورد):
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {onboardingDraft.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-3 rounded-xl bg-[#F3F6FC] border border-[#CBD5E1] flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-[#061138]">
                        {srv.title}
                      </p>
                      <p className="text-[11px] text-[#334155] mt-0.5 tabular-nums">
                        {srv.category} ·{' '}
                        {formatDurationMinutes(srv.durationMinutes)}
                      </p>
                    </div>
                    <span className="font-extrabold text-[#0057FF] tabular-nums">
                      {formatPriceToman(srv.priceToman)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
              <Link to="/business/onboarding">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>ویرایش خدمات</span>
                </Button>
              </Link>
              <Link to="/business/verification">
                <Button variant="primary" size="lg">
                  <span>تایید پیش‌نمایش و ادامه</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="مشتریان دقیقاً همین ویترین را هنگام رزرو نوبت مشاهده می‌کنند." />
        </div>
      </div>
    </div>
  );
};

/** ۴. تکمیل پرونده و کد ملی اختیاری (/business/verification) */
export const BusinessVerificationStepPage: React.FC = () => {
  const { onboardingDraft, updateOnboardingDraft, submitBusinessOnboarding } =
    usePrototypeData();

  return (
    <div>
      <OnboardingProgressHeader
        currentStep={4}
        stepTitle="تکمیل پرونده و دریافت نشان «مرکز تاییدشده» (اختیاری)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <Card padding="lg" className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#E0ECFF]/65 border border-[#0057FF]/30 flex items-start gap-3 text-xs text-[#061138]">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#0057FF]" />
              <div className="space-y-1">
                <p className="font-extrabold">
                  تکمیل این بخش اختیاری است و مانع شروع فعالیت شما نمی‌شود
                </p>
                <p className="text-[#334155] leading-relaxed">
                  درج کد ملی یا شماره پروانه کسب صرفاً برای اعطای نشان سبز «مرکز تاییدشده» در کنار نام سالن شماست. می‌توانید همین حالا بدون پر کردن این موارد به مرحله بعد بروید.
                </p>
              </div>
            </div>

            <FormField
              id="ver-nid"
              label="کد ملی مدیر مسئول (اختیاری)"
              optionalLabel="اختیاری"
              hint="ده رقم بدون خط تیره — صرفاً جهت احراز هویت مدیر سالن"
            >
              <Input
                id="ver-nid"
                dir="ltr"
                placeholder="مثلاً 1270000000 (اختیاری)"
                value={onboardingDraft.nationalIdNumber}
                onChange={(e) =>
                  updateOnboardingDraft({ nationalIdNumber: e.target.value })
                }
              />
            </FormField>

            <FormField
              id="ver-license"
              label="شماره پروانه کسب یا مدرک فنی‌وحرفه‌ای (اختیاری)"
              optionalLabel="اختیاری"
              hint="در صورت نداشتن پروانه کسب، این فیلد را خالی بگذارید"
            >
              <Input
                id="ver-license"
                dir="ltr"
                placeholder="مثلاً SNF-1405-88412 (اختیاری)"
                value={onboardingDraft.licenseCode}
                onChange={(e) =>
                  updateOnboardingDraft({ licenseCode: e.target.value })
                }
              />
            </FormField>

            <div className="pt-4 border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
              <Link to="/business/preview">
                <Button variant="outline">
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت</span>
                </Button>
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/business/ready"
                  onClick={() => {
                    void submitBusinessOnboarding();
                  }}
                >
                  <Button variant="secondary" size="md">
                    رد کردن این مرحله و ادامه
                  </Button>
                </Link>
                <Link
                  to="/business/ready"
                  onClick={() => {
                    void submitBusinessOnboarding();
                  }}
                >
                  <Button variant="primary" size="lg">
                    <span>ثبت و انتخاب پلن شروع</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <OnboardingDraftSummarySidebar stepHint="کد ملی و شماره مجوز کاملاً اختیاری هستند و هر زمان از داخل پنل کسب‌وکار نیز قابل تکمیل خواهند بود." />
        </div>
      </div>
    </div>
  );
};

/** ۵. تکمیل راه‌اندازی و انتخاب پلن اشتراک یا شروع رایگان (/business/ready) */
export const BusinessReadyStepPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    onboardingDraft,
    updateOnboardingDraft,
    plans,
    activePlanId,
    setActivePlanId,
    showToast,
  } = usePrototypeData();

  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlanItem | null>(
    null
  );

  const selectedPlanId =
    onboardingDraft.selectedPlanId || activePlanId || 'plan-free-start';
  const isPro =
    onboardingDraft.businessType === BusinessType.IndependentSpecialist;

  const handleChoosePlan = (plan: SubscriptionPlanItem) => {
    if (plan.monthlyPriceToman === 0) {
      setActivePlanId(plan.id);
      updateOnboardingDraft({ selectedPlanId: plan.id });
      showToast(
        'پروفایل سالن شما با «پلن شروع رایگان (۱ متخصص)» فعال شد.',
        'success'
      );
      navigate('/app');
      return;
    }
    setCheckoutPlan(plan);
  };

  return (
    <div className="space-y-6">
      <OnboardingProgressHeader
        currentStep={5}
        stepTitle="تبریک! سالن شما آماده است — پلن فعالیت خود را انتخاب کنید"
      />

      {/* بنر موفقیت ثبت سالن */}
      <Card padding="lg" className="border-2 border-[#10B981]/40 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 text-[#10B981] inline-flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label="پروفایل آماده پذیرش نوبت" tone="success" />
                <span
                  dir="ltr"
                  className="text-xs font-mono font-bold text-[#0057FF] bg-[#F3F6FC] px-2.5 py-0.5 rounded-lg border border-[#CBD5E1]"
                >
                  timeto.ir/{isPro ? 'pro' : 'salon'}/{onboardingDraft.slug}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#061138] mt-1.5">
                «{onboardingDraft.businessName}» با موفقیت در تایم تو ثبت شد
              </h2>
              <p className="text-xs text-[#334155] mt-1">
                {toPersianDigits(onboardingDraft.services.length)} خدمت فعال ·{' '}
                {toPersianDigits(onboardingDraft.staff.length)} متخصص · مدیر:{' '}
                {onboardingDraft.ownerName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={`/${isPro ? 'pro' : 'salon'}/${onboardingDraft.slug || 'royal-golzar'}`}
            >
              <Button variant="outline" size="sm">
                <span>مشاهده صفحه سالن</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActivePlanId('plan-free-start');
                updateOnboardingDraft({ selectedPlanId: 'plan-free-start' });
                navigate('/app');
              }}
            >
              <Building2 className="w-4 h-4" />
              <span>ورود به پیشخوان (پلن رایگان)</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* بخش انتخاب بین شروع رایگان یا خرید مستقیم پلن حرفه‌ای / VIP */}
      <div className="space-y-4">
        <div className="rounded-3xl bg-[#061138] text-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00E5FF]">
                <Sparkles className="w-4 h-4" />
                <span>مقایسه پلن رایگان با پلن‌های حرفه‌ای و VIP</span>
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                شروع با پلن رایگان (۱ متخصص) یا ارتقای مستقیم به پلن حرفه‌ای با درگاه پرداخت
              </h3>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 border border-[#00E5FF]/40 text-xs font-extrabold text-[#00E5FF] self-start md:self-auto">
              فعالسازی آنی امکانات پس از پرداخت (بله‌پی یا کارت‌به‌کارت)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-[#00E5FF] font-extrabold text-xs">
                <MessageSquareText className="w-4 h-4 shrink-0" />
                <span>۷۰٪ کاهش کنسلی با پیامک خودکار</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                ارسال خودکار پیامک تایید و یادآوری نوبت به موبایل مشتری در پلن‌های حرفه‌ای و VIP.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-[#00E5FF] font-extrabold text-xs">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>۲.۴ برابر جذب مشتری جدید</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                دریافت نشان «مرکز تاییدشده» و اولویت نمایش در نتایج جست‌وجوی محله‌های اصفهان و درچه.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1">
              <div className="flex items-center gap-2 text-[#00E5FF] font-extrabold text-xs">
                <Users className="w-4 h-4 shrink-0" />
                <span>افزایش ظرفیت متخصصان سالن</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                پلن رایگان ویژه ۱ متخصص است؛ با پلن حرفه‌ای تا ۳ متخصص و با پلن VIP تا ۸ متخصص به تیم خود اضافه کنید.
              </p>
            </div>
          </div>
        </div>

        {/* کارت‌های انتخاب پلن در پایان ثبت‌نام */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isFree = plan.monthlyPriceToman === 0;
            return (
              <Card
                key={plan.id}
                className={`rounded-3xl flex flex-col justify-between space-y-5 transition-all ${
                  plan.isRecommended
                    ? 'border-2 border-[#0057FF] ring-4 ring-[#0057FF]/10 bg-white'
                    : isSelected
                    ? 'border-2 border-[#061138] bg-white'
                    : 'border border-[#CBD5E1] bg-white'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-[#061138]">
                      {plan.name}
                    </h3>
                    {plan.isRecommended ? (
                      <span className="px-3 py-1 rounded-full bg-[#0057FF] text-white text-[11px] font-extrabold">
                        پرفروش‌ترین پلن
                      </span>
                    ) : isFree ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#F3F6FC] text-[#334155] text-[11px] font-bold border border-[#CBD5E1]">
                        رایگان (۱ متخصص)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#061138] text-[#00E5FF] text-[11px] font-extrabold inline-flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        <span>VIP</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#334155] leading-relaxed">
                    {plan.audience}
                  </p>

                  <div className="py-3 border-y border-[#E2E8F0]">
                    <span className="text-2xl font-extrabold text-[#061138] tabular-nums">
                      {formatPriceToman(plan.monthlyPriceToman)}
                    </span>
                    <span className="text-xs text-[#334155] mr-1.5">
                      {isFree ? ' (پایه همیشگی)' : '/ ماهانه'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-[#334155]">ظرفیت متخصصان:</span>
                      <span className="font-extrabold text-[#061138]">
                        {plan.staffLimit}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#334155]">پیامک یادآور نوبت:</span>
                      <span className="font-extrabold text-[#0057FF] tabular-nums">
                        {toPersianDigits(plan.smsQuotaMonthly)} پیامک در ماه
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-1">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-[#061138]"
                      >
                        <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={plan.isRecommended ? 'primary' : 'outline'}
                  size="lg"
                  fullWidth
                  onClick={() => handleChoosePlan(plan)}
                >
                  {isFree ? (
                    <>
                      <span>شروع با پلن رایگان و ورود به پنل</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>پرداخت و فعال‌سازی {plan.name}</span>
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* مودال پرداخت مستقیم پلن انتخابی در مرحله آخر ثبت سالن */}
      <EasyCheckoutModal
        isOpen={Boolean(checkoutPlan)}
        onClose={() => setCheckoutPlan(null)}
        item={
          checkoutPlan
            ? {
                itemType: 'PLAN',
                itemId: checkoutPlan.id,
                itemTitle: `اشتراک ماهانه «${checkoutPlan.name}»`,
                baseAmountToman: checkoutPlan.monthlyPriceToman,
              }
            : null
        }
        businessId={`biz-onb-${onboardingDraft.slug || 'custom'}`}
        businessName={onboardingDraft.businessName || 'سالن زیبایی شما'}
        onPaymentSuccess={() => {
          if (checkoutPlan) {
            setActivePlanId(checkoutPlan.id);
            updateOnboardingDraft({ selectedPlanId: checkoutPlan.id });
          }
          setCheckoutPlan(null);
          navigate('/app');
        }}
      />
    </div>
  );
};
