import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Heart,
  MapPin,
  Search,
  Star,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import {
  AppointmentItem,
  BusinessItem,
  BusinessType,
  ServiceItem,
  SpecialistItem,
} from '../../types';
import {
  formatDurationMinutes,
  formatPriceToman,
  getAppointmentStatusMeta,
  toPersianDigits,
} from '../../utils/formatters';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { VisualMediaIllustration } from './VisualMediaIllustration';

/** ۱. آواتار حروف اول (Avatar) */
export const Avatar: React.FC<{
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'violet' | 'rose' | 'slate' | 'emerald';
}> = ({ name, size = 'md', tone = 'violet' }) => {
  const parts = name.trim().split(' ');
  const initials =
    parts.length > 1
      ? `${parts[0][0] ?? ''}‌${parts[1][0] ?? ''}`
      : (parts[0]?.slice(0, 2) ?? 'ب');

  const sizeMap = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  const toneMap = {
    violet: 'bg-[#F3EEFA] text-[#2A0F54] border-[#D0CADF]',
    rose: 'bg-[#FDF2F7] text-[#9D174D] border-pink-200',
    slate: 'bg-slate-100 text-slate-900 border-slate-300',
    emerald: 'bg-emerald-50 text-emerald-950 border-emerald-200',
  };

  return (
    <div
      className={`rounded-2xl border font-bold inline-flex items-center justify-center shrink-0 select-none ${sizeMap[size]} ${toneMap[tone]}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

/** ۲. تب‌های استاندارد و کنترل‌های بخش‌بندی‌شده (Tabs) */
export const Tabs: React.FC<{
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeTab: string;
  onChange: (id: string) => void;
}> = ({ tabs, activeTab, onChange }) => {
  return (
    <div
      role="tablist"
      className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#F4F3F8] border border-[#E6E3EE]"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-[#2A0F54] text-white font-semibold shadow-xs'
                : 'text-[#4A4458] hover:bg-white/70 hover:text-[#120F1D]'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span className="mr-1.5 opacity-80 tabular-nums">
                ({toPersianDigits(tab.count)})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

/** ۳. نوار جست‌وجوی ترکیبی (SearchBar) */
export const SearchBar: React.FC<{
  query: string;
  onQueryChange: (val: string) => void;
  city: string;
  onCityChange: (val: string) => void;
  cities: string[];
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
}> = ({
  query,
  onQueryChange,
  city,
  onCityChange,
  cities,
  onSubmit,
  placeholder = 'جست‌وجوی نام سالن، متخصص یا خدمت (مثلاً فیشیال، کوتاهی، سعادت‌آباد)...',
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      className="bg-white p-2.5 rounded-2xl border border-[#D0CADF] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
    >
      <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5">
        <Search className="w-4 h-4 text-[#756F86] shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label="عبارت جست‌وجو"
          className="w-full text-sm text-[#120F1D] placeholder:text-[#756F86] focus:outline-none bg-transparent"
        />
      </div>

      <div className="sm:border-r sm:border-[#E6E3EE] sm:pr-2.5 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#2A0F54] shrink-0 mr-2 sm:mr-0" />
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          aria-label="انتخاب شهر"
          className="text-sm font-medium text-[#120F1D] bg-[#F4F3F8] border border-[#E6E3EE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#2A0F54] cursor-pointer"
        >
          <option value="ALL">همه شهرها</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="primary" size="md">
        <span>جست‌وجو</span>
      </Button>
    </form>
  );
};

/** ۴. کارت کسب‌وکار در بازارچه (BusinessCard) — طراحی مرحله ۲.۵ */
export const BusinessCard: React.FC<{
  business: BusinessItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}> = ({ business, isFavorite = false, onToggleFavorite }) => {
  const profileLink =
    business.type === BusinessType.IndependentSpecialist
      ? `/pro/${business.slug}`
      : `/salon/${business.slug}`;

  return (
    <Card
      padding="none"
      variant="interactive"
      className="overflow-hidden flex flex-col justify-between group"
    >
      <div className="p-3.5 pb-0 relative">
        <Link to={profileLink} className="block">
          <VisualMediaIllustration
            theme={business.visualTheme}
            categoryLabel={business.typeLabel}
            title={business.name}
            city={business.city}
            subtitle={business.neighborhood}
            className="aspect-[16/10]"
          />
        </Link>
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(business.id)}
            aria-label={
              isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'
            }
            className="absolute top-6 left-6 w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center border border-[#E6E3EE] cursor-pointer transition-transform active:scale-95"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite
                  ? 'text-[#9D174D] fill-[#9D174D]'
                  : 'text-[#4A4458]'
              }`}
            />
          </button>
        ) : null}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* متادیتای بدون کپسول با جداکننده تایپوگرافیک */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#756F86]">
            <span>{business.typeLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#756F86]" />
              {business.city}، {business.neighborhood}
            </span>
            {business.verifiedBadge ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  تاییدشده
                </span>
              </>
            ) : null}
          </div>

          <h3 className="text-base font-semibold text-[#120F1D] leading-snug">
            <Link
              to={profileLink}
              className="group-hover:text-[#2A0F54] transition-colors"
            >
              {business.name}
            </Link>
          </h3>

          <p className="text-xs font-normal text-[#4A4458] leading-relaxed line-clamp-2">
            {business.shortDescription}
          </p>
        </div>

        <div className="pt-3.5 border-t border-[#E6E3EE] space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1 text-[#120F1D] font-semibold tabular-nums">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{toPersianDigits(business.rating)}</span>
              <span className="text-[#756F86] font-normal">
                ({toPersianDigits(business.reviewCount)} دیدگاه)
              </span>
            </div>
            <div className="text-[#4A4458] tabular-nums">
              شروع از{' '}
              <span className="font-bold text-[#120F1D]">
                {formatPriceToman(business.startingPriceToman)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Link to={profileLink}>
              <Button variant="outline" size="sm" fullWidth>
                مشاهده پروفایل
              </Button>
            </Link>
            <Link to={`/booking/${business.slug}`}>
              <Button variant="primary" size="sm" fullWidth>
                <span>رزرو نوبت</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

/** ۵. کارت متخصص (ProfessionalCard) */
export const ProfessionalCard: React.FC<{
  specialist: SpecialistItem;
  businessSlug?: string;
}> = ({ specialist, businessSlug }) => {
  const targetUrl = `/pro/${specialist.slug}`;

  return (
    <Card
      variant="interactive"
      className="flex flex-col justify-between space-y-4"
    >
      <div className="flex items-start gap-3.5">
        <Avatar
          name={specialist.fullName}
          size="md"
          tone={specialist.isIndependent ? 'emerald' : 'violet'}
        />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#120F1D] truncate">
              <Link to={targetUrl} className="hover:text-[#2A0F54]">
                {specialist.fullName}
              </Link>
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#120F1D] tabular-nums shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {toPersianDigits(specialist.rating)}
            </span>
          </div>
          <p className="text-xs text-[#2A0F54] font-medium">
            {specialist.roleTitle}
          </p>
          <p className="text-xs text-[#756F86] tabular-nums">
            {toPersianDigits(specialist.experienceYears)} سال سابقه تخصصی
            {specialist.city ? ` · ${specialist.city}` : ''}
          </p>
        </div>
      </div>

      <p className="text-xs text-[#4A4458] leading-relaxed line-clamp-2">
        {specialist.bio}
      </p>

      <div className="pt-3 border-t border-[#E6E3EE] flex items-center justify-between gap-2">
        <span className="text-[11px] text-[#756F86] truncate">
          {specialist.specialties.join(' · ')}
        </span>
        <Link
          to={
            businessSlug
              ? `/booking/${businessSlug}?specialist=${specialist.id}`
              : targetUrl
          }
        >
          <Button variant="outline" size="sm">
            مشاهده و رزرو
          </Button>
        </Link>
      </div>
    </Card>
  );
};

/** ۶. کارت خدمت (ServiceCard) */
export const ServiceCard: React.FC<{
  service: ServiceItem;
  actionLabel?: string;
  onSelect?: (service: ServiceItem) => void;
  bookingHref?: string;
}> = ({
  service,
  actionLabel = 'انتخاب و رزرو',
  onSelect,
  bookingHref,
}) => {
  return (
    <div className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E3EE] last:border-b-0">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#756F86]">
          <span>{service.category}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="w-3.5 h-3.5" />
            {formatDurationMinutes(service.durationMinutes)}
          </span>
          {service.isPopular ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#9D174D] font-medium">پیشنهاد سالن</span>
            </>
          ) : null}
        </div>
        <h3 className="text-sm font-semibold text-[#120F1D]">
          {service.title}
        </h3>
        <p className="text-xs font-normal text-[#4A4458] leading-relaxed">
          {service.description}
        </p>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0">
        <span className="text-sm font-bold text-[#120F1D] tabular-nums">
          {formatPriceToman(service.priceToman)}
        </span>
        {bookingHref ? (
          <Link to={bookingHref}>
            <Button variant="primary" size="sm">
              {actionLabel}
            </Button>
          </Link>
        ) : onSelect ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSelect(service)}
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

/** ۷. کارت نوبت (AppointmentCard) */
export const AppointmentCard: React.FC<{
  appointment: AppointmentItem;
  onViewDetails?: (apt: AppointmentItem) => void;
  onCancelDemo?: (apt: AppointmentItem) => void;
}> = ({ appointment, onViewDetails, onCancelDemo }) => {
  const statusMeta = getAppointmentStatusMeta(appointment.status);
  return (
    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#756F86]">
          <span dir="ltr" className="font-mono text-[#2A0F54] font-semibold">
            {appointment.referenceCode}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {appointment.dateJalali} ساعت {appointment.timeSlot}
          </span>
          <span aria-hidden="true">·</span>
          <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
        </div>
        <h3 className="text-sm font-semibold text-[#120F1D]">
          {appointment.serviceTitle} — {appointment.businessName}
        </h3>
        <p className="text-xs font-normal text-[#4A4458]">
          متخصص: {appointment.specialistName} · مراجع: {appointment.customerName}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-[#120F1D] tabular-nums ml-2">
          {formatPriceToman(appointment.priceToman)}
        </span>
        {onViewDetails ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(appointment)}
          >
            جزئیات
          </Button>
        ) : null}
        {onCancelDemo && appointment.status !== 'CANCELLED' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancelDemo(appointment)}
            className="text-red-700 hover:bg-red-50"
          >
            لغو آزمایشی
          </Button>
        ) : null}
      </div>
    </Card>
  );
};

/** ۸. صفحه‌بندی (Pagination) */
export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav
      aria-label="صفحه‌بندی نتایج"
      className="flex items-center justify-center gap-1.5 pt-4"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        قبلی
      </Button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-xl text-xs font-bold tabular-nums cursor-pointer transition-colors ${
            p === currentPage
              ? 'bg-[#2A0F54] text-white'
              : 'bg-white border border-[#D0CADF] text-[#4A4458] hover:bg-[#F4F3F8]'
          }`}
        >
          {toPersianDigits(p)}
        </button>
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        بعدی
      </Button>
    </nav>
  );
};

/** ۹. دیالوگ تایید عملیات حساس (ConfirmationDialog) */
export const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'بله، حذف شود',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
          {message}
        </p>
      </div>
    </Modal>
  );
};

/** ۱۰. اعلان بازخورد (ToastBanner) */
export const ToastBanner: React.FC<{
  message: string;
  tone?: 'success' | 'info' | 'warning' | 'danger';
  onDismiss: () => void;
}> = ({ message, tone = 'success', onDismiss }) => {
  const styles = {
    success: 'bg-emerald-950 text-emerald-50 border-emerald-800',
    info: 'bg-[#170B2B] text-white border-[#2D1950]',
    warning: 'bg-amber-950 text-amber-50 border-amber-800',
    danger: 'bg-red-950 text-red-50 border-red-800',
  }[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-50 max-w-md rounded-2xl border px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-xs font-medium ${styles}`}
    >
      <div className="flex items-center gap-2">
        {tone === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-indigo-300 shrink-0" />
        )}
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="بستن پیام"
        className="p-1 rounded hover:bg-white/10 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
