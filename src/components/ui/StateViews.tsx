import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Inbox,
  Loader2,
  Compass,
} from 'lucide-react';
import { Button } from './Button';
import { UIStateMode } from '../../types';

export interface StateBlockProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** ۱. حالت در حال بارگذاری (LoadingState) */
export const LoadingState: React.FC<{ label?: string }> = ({
  label = 'در حال بارگذاری اطلاعات...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-3xl border border-[#E6E0F5] bg-white p-8 text-center space-y-4 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.06)]"
    >
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#EDE9FE] text-[#8B5CF6]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-[#1E1B2E]">{label}</p>
      <div className="max-w-md mx-auto space-y-2.5 pt-2">
        <div className="h-3 bg-[#F3EEFF] rounded-full animate-pulse w-full" />
        <div className="h-3 bg-[#F3EEFF] rounded-full animate-pulse w-4/5 mx-auto" />
        <div className="h-3 bg-[#F3EEFF] rounded-full animate-pulse w-3/5 mx-auto" />
      </div>
    </div>
  );
};

/** ۲. حالت بدون داده (EmptyState) */
export const EmptyState: React.FC<StateBlockProps> = ({
  title = 'موردی برای نمایش یافت نشد',
  description = 'هنوز موردی در این بخش ثبت نشده یا فیلترهای انتخابی نتیجه‌ای ندارند.',
  actionLabel = 'بازنشانی فیلترها',
  onAction,
}) => {
  return (
    <div className="rounded-3xl border border-[#E6E0F5] bg-white p-8 sm:p-10 text-center space-y-3 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.06)]">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#8B5CF6]">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-[#1E1B2E]">{title}</h3>
      <p className="text-xs sm:text-sm font-normal text-[#6B6480] max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {onAction ? (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

/** ۳. حالت خطا در دریافت اطلاعات (ErrorState) */
export const ErrorState: React.FC<StateBlockProps> = ({
  title = 'خطا در دریافت اطلاعات',
  description = 'ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.',
  actionLabel = 'تلاش مجدد',
  onAction,
}) => {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-[#EF4444]/30 bg-[#FEF2F2]/80 p-6 sm:p-8 text-center space-y-3"
    >
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#FEE2E2] text-[#EF4444]">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-[#1E1B2E]">{title}</h3>
      <p className="text-sm font-normal text-[#6B6480] max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {onAction ? (
        <div className="pt-2">
          <Button variant="danger" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

/** ۴. حالت موفقیت عملیات (SuccessState) */
export const SuccessState: React.FC<StateBlockProps> = ({
  title = 'عملیات با موفقیت انجام شد',
  description = 'اطلاعات شما با موفقیت ثبت و به‌روزرسانی شد.',
  actionLabel = 'بازگشت',
  onAction,
}) => {
  return (
    <div
      role="status"
      className="rounded-3xl border border-[#10B981]/30 bg-[#ECFDF5]/70 p-6 sm:p-8 text-center space-y-3"
    >
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#D1FAE5] text-[#10B981]">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-[#1E1B2E]">{title}</h3>
      <p className="text-sm font-normal text-[#6B6480] max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {onAction ? (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

/** ۵. حالت فرم ناقص (IncompleteFormState) */
export const IncompleteFormState: React.FC<{
  errors?: string[];
  onDismiss?: () => void;
}> = ({
  errors = [
    'نام یا مشخصات الزامی وارد نشده است.',
    'فرمت شماره موبایل معتبر نیست (۱۱ رقم با شروع ۰۹).',
    'خدمت یا بازه زمانی مورد نظر انتخاب نشده است.',
  ],
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-[#F59E0B]/40 bg-[#FFFBEB] p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[#D97706] font-bold text-sm">
          <FileWarning className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <span>لطفاً موارد زیر را بررسی و تکمیل کنید:</span>
        </div>
        {onDismiss ? (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            بستن
          </Button>
        ) : null}
      </div>
      <ul className="list-disc list-inside text-xs text-[#92400E] space-y-1.5 pr-1">
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
};

/** ۶. حالت صفحه یافت نشد (NotFoundState - 404) */
export const NotFoundState: React.FC<{ attemptedPath?: string }> = () => {
  return (
    <div className="rounded-3xl border border-[#E6E0F5] bg-white p-10 text-center space-y-4 max-w-xl mx-auto my-8 shadow-[0_6px_24px_-6px_rgba(139,92,246,0.08)]">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#8B5CF6]">
        <Compass className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-[#1E1B2E]">
        صفحه مورد نظر یافت نشد
      </h1>
      <p className="text-sm font-normal text-[#6B6480] leading-relaxed">
        ممکن است آدرس صفحه تغییر کرده باشد یا این بخش در دسترس نباشد.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link to="/">
          <Button variant="primary" size="md">
            بازگشت به صفحه اصلی
          </Button>
        </Link>
        <Link to="/search">
          <Button variant="outline" size="md">
            جست‌وجوی سالن‌ها
          </Button>
        </Link>
      </div>
    </div>
  );
};

export const StateSimulatorToolbar: React.FC<{
  mode: UIStateMode;
  onChange: (mode: UIStateMode) => void;
}> = ({ mode, onChange }) => {
  const options: { value: UIStateMode; label: string }[] = [
    { value: 'normal', label: 'نمای عادی' },
    { value: 'loading', label: 'در حال بارگذاری' },
    { value: 'empty', label: 'بدون داده' },
    { value: 'error', label: 'خطا' },
    { value: 'success', label: 'موفقیت' },
    { value: 'incomplete_form', label: 'فرم ناقص' },
  ];

  return (
    <div className="mb-6 rounded-3xl border border-[#E6E0F5] bg-[#F3EEFF] p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
      <div className="text-xs font-medium text-[#6B6480]">
        پیش‌نمایش وضعیت‌های صفحه:
      </div>
      <div
        role="group"
        aria-label="تغییر وضعیت نمایش صفحه"
        className="flex flex-wrap items-center gap-1"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap cursor-pointer ${
              mode === opt.value
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white text-[#6B6480] hover:bg-[#EDE9FE] border border-[#E6E0F5]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
