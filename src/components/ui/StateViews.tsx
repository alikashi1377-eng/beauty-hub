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
  label = 'در حال بارگذاری اطلاعات آزمایشی...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-[#E6E3EE] bg-white p-8 text-center space-y-4"
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F3EEFA] text-[#2A0F54]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-[#120F1D]">{label}</p>
      <div className="max-w-md mx-auto space-y-2.5 pt-2">
        <div className="h-3 bg-[#E6E3EE] rounded animate-pulse w-full" />
        <div className="h-3 bg-[#E6E3EE] rounded animate-pulse w-4/5 mx-auto" />
        <div className="h-3 bg-[#E6E3EE] rounded animate-pulse w-3/5 mx-auto" />
      </div>
    </div>
  );
};

/** ۲. حالت بدون داده (EmptyState) */
export const EmptyState: React.FC<StateBlockProps> = ({
  title = 'موردی برای نمایش یافت نشد',
  description = 'هنوز داده‌ای در این بخش ثبت نشده یا فیلترهای انتخابی نتیجه‌ای ندارند.',
  actionLabel = 'بازنشانی نمای صفحه',
  onAction,
}) => {
  return (
    <div className="rounded-2xl border border-[#E6E3EE] bg-white p-8 sm:p-10 text-center space-y-3">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F3EEFA] text-[#2A0F54]">
        <Inbox className="w-5 h-5" />
      </div>
      <h3 className="text-base font-extrabold text-[#120F1D]">{title}</h3>
      <p className="text-xs sm:text-sm text-[#4A4458] max-w-md mx-auto leading-relaxed">
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
  description = 'ارتباط با سرویس داده برقرار نشد. در مرحله اتصال به بک‌اند، جزئیات خطا و تلاش مجدد در این بخش مدیریت می‌شود.',
  actionLabel = 'تلاش مجدد',
  onAction,
}) => {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50/50 p-6 sm:p-8 text-center space-y-3"
    >
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-red-100 text-red-800">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-[#120F1D]">{title}</h3>
      <p className="text-sm text-[#4A4458] max-w-md mx-auto leading-relaxed">
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
  title = 'عملیات آزمایشی با موفقیت انجام شد',
  description = 'تغییرات در وضعیت محلی رابط کاربری اعمال شد. در مراحل بعد این عملیات در پایگاه داده ذخیره خواهد شد.',
  actionLabel = 'بازگشت به نمای عادی',
  onAction,
}) => {
  return (
    <div
      role="status"
      className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 text-center space-y-3"
    >
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <h3 className="text-base font-bold text-[#120F1D]">{title}</h3>
      <p className="text-sm text-[#4A4458] max-w-md mx-auto leading-relaxed">
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
    'نام کسب‌وکار یا نام خانوادگی وارد نشده است.',
    'فرمت شماره موبایل معتبر نیست (باید ۱۱ رقم و با ۰۹ شروع شود).',
    'ساعات کاری یا خدمت انتخابی تکمیل نشده است.',
  ],
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <FileWarning className="w-4 h-4 shrink-0" />
          <span>لطفاً موارد الزامی زیر را تکمیل نمایید:</span>
        </div>
        {onDismiss ? (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            بستن
          </Button>
        ) : null}
      </div>
      <ul className="list-disc list-inside text-xs text-amber-950 space-y-1.5 pr-1">
        {errors.map((err, i) => (
          <li key={i}>{err}</li>
        ))}
      </ul>
    </div>
  );
};

/** ۶. حالت صفحه یافت نشد (NotFoundState - 404) */
export const NotFoundState: React.FC<{ attemptedPath?: string }> = ({
  attemptedPath,
}) => {
  return (
    <div className="rounded-2xl border border-[#E6E3EE] bg-white p-10 text-center space-y-4 max-w-xl mx-auto my-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F3EEFA] text-[#2A0F54]">
        <Compass className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-extrabold text-[#120F1D]">
        صفحه مورد نظر یافت نشد (۴۰۴)
      </h1>
      <p className="text-sm text-[#4A4458] leading-relaxed">
        مسیر واردشده در ساختار مسیریابی BeautyHub وجود ندارد یا آدرس آن تغییر کرده است.
      </p>
      {attemptedPath ? (
        <p dir="ltr" className="text-xs font-mono text-[#756F86]">
          Path: {attemptedPath}
        </p>
      ) : null}
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
    { value: 'normal', label: 'نمای عادی (با داده آزمایشی)' },
    { value: 'loading', label: 'در حال بارگذاری' },
    { value: 'empty', label: 'بدون داده' },
    { value: 'error', label: 'خطا در دریافت اطلاعات' },
    { value: 'success', label: 'موفقیت عملیات' },
    { value: 'incomplete_form', label: 'فرم ناقص' },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-[#E6E3EE] bg-[#F4F3F8] p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
      <div className="text-xs font-medium text-[#4A4458]">
        شبیه‌ساز وضعیت‌های استاندارد رابط کاربری:
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
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              mode === opt.value
                ? 'bg-[#2A0F54] text-white'
                : 'bg-white text-[#4A4458] hover:bg-[#E6E3EE]/70 border border-[#E6E3EE]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
