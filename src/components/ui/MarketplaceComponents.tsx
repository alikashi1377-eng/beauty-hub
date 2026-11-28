import React, { useState } from 'react';
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
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AppointmentItem,
  AppointmentStatus,
  BusinessItem,
  BusinessType,
  ServiceItem,
  SpecialistItem,
} from '../../types';
import {
  formatCompactPriceToman,
  formatDurationMinutes,
  formatPriceToman,
  formatServicePriceDisplay,
  formatServicePriceShort,
  getAppointmentStatusMeta,
  resolveAdjacentTabBySwipe,
  toPersianDigits,
} from '../../utils/formatters';
import {
  getMeaningfulServiceDescription,
  makeServiceAddonKey,
  shouldShowServiceDetailsTrigger,
} from '../../utils/servicePresentation';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import {
  getBeautyPhotoUrl,
  getSpecialistAvatarUrl,
} from './VisualMediaIllustration';

/** ۱. آواتار تصویری و حروف اول (Avatar) — مطابق تصاویر مرجع Capture.PNG و Capture5.PNG */
export const Avatar: React.FC<{
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'violet' | 'rose' | 'slate' | 'emerald';
  imageUrl?: string;
  showPhoto?: boolean;
}> = ({
  name,
  size = 'md',
  tone = 'violet',
  imageUrl,
  showPhoto = true,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const parts = name.trim().split(' ');
  const initials =
    parts.length > 1
      ? `${parts[0][0] ?? ''}‌${parts[1][0] ?? ''}`
      : (parts[0]?.slice(0, 2) ?? 'ب');

  const sizeMap = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const toneMap = {
    violet: 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]',
    rose: 'bg-[#F3EEFF] text-[#8B5CF6] border-[#E6E0F5]',
    slate: 'bg-[#FAF8FF] text-[#1E1B2E] border-[#E6E0F5]',
    emerald: 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]',
  };

  const resolvedPhoto = imageUrl ?? (showPhoto ? getSpecialistAvatarUrl(name) : '');

  if (resolvedPhoto && !imgErr) {
    return (
      <div
        className={`relative rounded-full border-2 border-white shadow-xs overflow-hidden inline-flex items-center justify-center shrink-0 select-none ${sizeMap[size]} ${toneMap[tone]}`}
        aria-hidden="true"
      >
        <img
          src={resolvedPhoto}
          alt={name}
          loading="lazy"
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full border font-bold inline-flex items-center justify-center shrink-0 select-none ${sizeMap[size]} ${toneMap[tone]}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

/** ۲. تب‌های کپسولی با کنتراست بالا و پشتیبانی از سوایپ لمسی چپ و راست (Tabs) */
export const Tabs: React.FC<{
  tabs: Array<{ id: string; label: string; count?: number; icon?: React.ReactNode }>;
  activeTab: string;
  onChange: (id: string) => void;
}> = ({ tabs, activeTab, onChange }) => {
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      role="tablist"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) setTouchStartPos({ x: t.clientX, y: t.clientY });
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        if (!touchStartPos || !t) return;
        const nextId = resolveAdjacentTabBySwipe(
          tabs.map((item) => item.id),
          activeTab,
          t.clientX - touchStartPos.x,
          t.clientY - touchStartPos.y
        );
        if (nextId) onChange(nextId);
        setTouchStartPos(null);
      }}
      className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
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
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-2 border ${
              isActive
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-[0_6px_16px_-4px_rgba(0,87,255,0.42)]'
                : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#E0ECFF]/60 hover:text-[#061138] hover:border-[#0057FF]'
            }`}
          >
            {tab.icon ? <span className="shrink-0">{tab.icon}</span> : null}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' ? (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] tabular-nums ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-[#E0ECFF] text-[#0057FF]'
                }`}
              >
                {toPersianDigits(tab.count)}
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
  placeholder = 'نام سالن، خدمت یا محله (مثلاً کوتاهی مو، فیشیال، چهارباغ)...',
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      className="bg-white p-2 sm:p-2.5 rounded-full border-2 border-[#CBD5E1] shadow-[0_12px_32px_-12px_rgba(6,17,56,0.14)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
    >
      <div className="flex-1 flex items-center gap-2.5 px-4 py-2">
        <Search className="w-4 h-4 text-[#0057FF] shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label="عبارت جست‌وجو"
          className="w-full text-sm text-[#061138] placeholder:text-[#64748B] focus:outline-none bg-transparent"
        />
      </div>

      <div className="sm:border-r sm:border-[#CBD5E1] sm:pr-2.5 flex items-center gap-2 px-2 sm:px-0">
        <MapPin className="w-4 h-4 text-[#0057FF] shrink-0" />
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          aria-label="انتخاب شهر"
          className="text-xs sm:text-sm font-bold text-[#061138] bg-[#F3F6FC] border border-[#CBD5E1] rounded-full px-3.5 py-2 focus:outline-none focus:border-[#0057FF] cursor-pointer min-w-[125px]"
        >
          <option value="ALL">همه شهرها</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="px-6 py-2.5 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.42)]"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>جست‌وجو</span>
      </button>
    </form>
  );
};

/** ۴. کارت کسب‌وکار در بازارچه (BusinessCard) — پشتیبانی از حالت جمع‌وجور (compact) برای نتایج جست‌وجو */
export const BusinessCard: React.FC<{
  business: BusinessItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  compact?: boolean;
}> = ({ business, isFavorite, onToggleFavorite, compact = false }) => {
  const [imgErr, setImgErr] = useState(false);
  const {
    authUser,
    services,
    openAuthModal,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
  } = usePrototypeData();

  const activeServiceCount = services.filter(
    (s) =>
      s.isActive !== false &&
      (s.businessId === business.id || s.businessId === business.slug)
  ).length;

  const resolvedFavorite =
    typeof isFavorite === 'boolean'
      ? isFavorite
      : favoriteBusinessIds.includes(business.id);
  const handleToggleFavorite = onToggleFavorite ?? toggleFavoriteBusiness;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authUser) {
      openAuthModal({
        initialScreen: 'LOGIN',
        defaultRole: 'CUSTOMER',
        promptReason: `برای ذخیره «${business.name}» در علاقه‌مندی‌ها، وارد شوید یا ثبت‌نام کنید`,
      });
      return;
    }
    handleToggleFavorite(business.id);
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!authUser) {
      e.preventDefault();
      e.stopPropagation();
      openAuthModal({
        initialScreen: 'LOGIN',
        defaultRole: 'CUSTOMER',
        redirectTo: `/booking/${business.slug}`,
        promptReason: `برای رزرو نوبت در «${business.name}»، وارد شوید یا ثبت‌نام کنید`,
      });
    }
  };

  const profileLink =
    business.type === BusinessType.IndependentSpecialist
      ? `/pro/${business.slug}`
      : `/salon/${business.slug}`;

  const photoUrl =
    (compact
      ? business.avatarUrl || business.coverUrl
      : business.coverUrl || business.avatarUrl) ||
    getBeautyPhotoUrl(
      business.name,
      business.typeLabel,
      business.type === BusinessType.MenBarbershop ? 'barber' : undefined
    );

  if (compact) {
    return (
      <Card
        padding="none"
        variant="interactive"
        className={`overflow-hidden rounded-2xl bg-white p-3 flex flex-col gap-2.5 group ${
          business.isSponsored
            ? 'border-2 border-[#0057FF] ring-2 ring-[#0057FF]/10'
            : 'border border-[#CBD5E1]'
        }`}
      >
        <div className="flex items-start gap-3">
          <Link
            to={profileLink}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#E0ECFF] shrink-0"
          >
            {!imgErr ? (
              <img
                src={photoUrl}
                alt={business.name}
                loading="lazy"
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : null}
            {business.isSponsored ? (
              <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-gradient-to-l from-[#061138] to-[#0057FF] text-[#00E5FF] text-[9px] font-extrabold inline-flex items-center gap-0.5 shadow-sm">
                <span>★</span>
                <span>ویژه</span>
              </span>
            ) : null}
            <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-[#061138]/90 text-white text-[10px] font-bold inline-flex items-center gap-1 tabular-nums">
              <Star className="w-2.5 h-2.5 text-[#F59E0B] fill-[#F59E0B]" />
              {toPersianDigits(business.rating)}
            </span>
          </Link>

          <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                {business.isSampleShowcase ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/40 text-[10px] font-extrabold shrink-0">
                    نمونه نمایشی
                  </span>
                ) : null}
                {business.isSponsored ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[10px] font-extrabold shrink-0">
                    {business.sponsoredLabel || 'پیشنهاد ویژه'}
                  </span>
                ) : null}
                <h3 className="text-sm sm:text-base font-extrabold text-[#061138] truncate">
                  <Link
                    to={profileLink}
                    className="group-hover:text-[#0057FF] transition-colors"
                  >
                    {business.name}
                  </Link>
                </h3>
                {business.verifiedBadge ? (
                  <ShieldCheck
                    className="w-4 h-4 text-[#10B981] shrink-0"
                    aria-label="مرکز تاییدشده"
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleFavoriteClick}
                aria-pressed={resolvedFavorite}
                aria-label={
                  resolvedFavorite
                    ? `حذف ${business.name} از علاقه‌مندی‌ها`
                    : `افزودن ${business.name} به علاقه‌مندی‌ها`
                }
                className={`w-7 h-7 rounded-full flex items-center justify-center border cursor-pointer shrink-0 transition-colors ${
                  resolvedFavorite
                    ? 'bg-[#E0ECFF] border-[#0057FF] text-[#0057FF]'
                    : 'bg-[#F3F6FC] border-[#CBD5E1] text-[#64748B] hover:text-[#0057FF]'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    resolvedFavorite ? 'text-[#0057FF] fill-[#0057FF]' : ''
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 text-[#0057FF] font-bold">
                <MapPin className="w-3 h-3 shrink-0" />
                {business.neighborhood}
              </span>
              <span className="text-[#94A3B8]">·</span>
              <span className="text-[#334155] font-medium truncate">
                {business.typeLabel}
              </span>
            </div>

            <p className="text-[11px] text-[#64748B] line-clamp-1">
              {business.shortDescription}
            </p>
          </div>
        </div>

        {/* نوار تمام‌عرض پایین کارت برای جلوگیری کامل از بیرون‌زدگی دکمه رزرو در موبایل */}
        <div className="pt-2.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs tabular-nums min-w-0 text-[#475569]">
            <span className="font-bold text-[#061138]">
              {activeServiceCount > 0
                ? `${toPersianDigits(activeServiceCount)} خدمت فعال`
                : 'رزرو آنلاین آنی'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 mr-auto">
            {business.isSampleShowcase ? (
              <Link
                to={profileLink}
                className="px-3.5 py-1.5 rounded-full bg-[#061138] hover:bg-[#0057FF] text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors shadow-2xs whitespace-nowrap"
              >
                <span>مشاهده نمونه نمایشی</span>
                <ArrowLeft className="w-3 h-3 shrink-0" />
              </Link>
            ) : (
              <>
                <Link
                  to={profileLink}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-bold text-[#334155] bg-[#F3F6FC] hover:bg-[#E0ECFF] hover:text-[#0057FF] transition-colors whitespace-nowrap"
                >
                  پروفایل
                </Link>
                <Link
                  to={`/booking/${business.slug}`}
                  onClick={handleBookingClick}
                  className="px-3.5 py-1.5 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors shadow-2xs whitespace-nowrap"
                >
                  <span>رزرو نوبت</span>
                  <ArrowLeft className="w-3 h-3 shrink-0" />
                </Link>
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      padding="none"
      variant="interactive"
      className={`overflow-hidden rounded-3xl flex flex-col justify-between group bg-white shadow-[0_8px_28px_-14px_rgba(6,17,56,0.12)] hover:shadow-[0_18px_40px_-14px_rgba(0,87,255,0.22)] ${
        business.isSponsored
          ? 'border-2 border-[#0057FF] ring-2 ring-[#0057FF]/10'
          : 'border border-[#CBD5E1]'
      }`}
    >
      <div className="p-2.5 pb-0 relative">
        <Link
          to={profileLink}
          className="block relative overflow-hidden rounded-2xl aspect-[16/9] bg-[#E0ECFF]"
        >
          {!imgErr ? (
            <img
              src={photoUrl}
              alt={business.name}
              width={600}
              height={338}
              loading="lazy"
              decoding="async"
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#061138]/80 via-transparent to-black/15 pointer-events-none" />

          {/* نشان نوع مرکز یا آگهی ویژه در بالا راست */}
          <div className="absolute top-2.5 right-2.5 flex flex-wrap items-center gap-1.5 max-w-[78%]">
            {business.isSampleShowcase ? (
              <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] text-[10px] font-extrabold shadow-xs truncate">
                نمونه نمایشی پلتفرم
              </span>
            ) : null}
            {business.isSponsored ? (
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-l from-[#061138] to-[#0057FF] text-[#00E5FF] text-[11px] font-extrabold shadow-xs truncate">
                ★ {business.sponsoredLabel || 'پیشنهاد ویژه'}
              </span>
            ) : null}
            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-extrabold text-[#061138] shadow-xs">
              {business.typeLabel}
            </span>
          </div>

          {/* قرص تیره امتیاز روی لبه پایین تصویر */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#061138]/90 backdrop-blur-md text-white text-xs font-bold inline-flex items-center gap-1.5 tabular-nums shadow-sm">
            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <span>{toPersianDigits(business.rating)}</span>
            <span className="text-white/75 font-normal text-[10px]">
              ({toPersianDigits(business.reviewCount)})
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-pressed={resolvedFavorite}
          aria-label={
            resolvedFavorite
              ? `حذف ${business.name} از علاقه‌مندی‌ها`
              : `افزودن ${business.name} به علاقه‌مندی‌ها`
          }
          title={
            resolvedFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'
          }
          className={`absolute top-5 left-5 h-8 px-2.5 rounded-full flex items-center justify-center gap-1.5 border cursor-pointer transition-all active:scale-95 shadow-sm z-10 ${
            resolvedFavorite
              ? 'bg-[#E0ECFF] border-[#0057FF] text-[#0057FF]'
              : 'bg-white/95 hover:bg-white border-[#CBD5E1] text-[#334155] hover:text-[#0057FF]'
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform ${
              resolvedFavorite
                ? 'text-[#0057FF] fill-[#0057FF] scale-110'
                : 'text-[#334155]'
            }`}
          />
          {resolvedFavorite ? (
            <span className="text-[10px] font-extrabold text-[#0057FF]">
              ذخیره شد
            </span>
          ) : null}
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-base font-extrabold text-[#061138] leading-snug truncate">
                <Link
                  to={profileLink}
                  className="group-hover:text-[#0057FF] transition-colors"
                >
                  {business.name}
                </Link>
              </h3>
              {business.verifiedBadge ? (
                <ShieldCheck
                  className="w-4 h-4 text-[#10B981] shrink-0"
                  aria-label="مرکز تاییدشده"
                />
              ) : null}
            </div>
          </div>

          <p className="inline-flex items-center gap-1 text-xs text-[#0057FF] font-bold">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>
              {business.city}، {business.neighborhood}
            </span>
          </p>

          <p className="text-xs font-normal text-[#334155] leading-relaxed line-clamp-1">
            {business.shortDescription}
          </p>
        </div>

        <div className="pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-[#334155] tabular-nums min-w-0">
            <span className="text-[10px] text-[#475569] font-semibold block">
              رزرو آنلاین ۲۴ ساعته
            </span>
            <span className="font-extrabold text-[#061138] text-xs sm:text-sm">
              {activeServiceCount > 0
                ? `${toPersianDigits(activeServiceCount)} خدمت و تعرفه`
                : 'مشاهده خدمات و تعرفه‌ها'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 mr-auto">
            {business.isSampleShowcase ? (
              <Link
                to={profileLink}
                className="px-4 py-2 rounded-full bg-[#061138] hover:bg-[#0057FF] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
              >
                <span>مشاهده پروفایل نمونه</span>
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              </Link>
            ) : (
              <>
                <Link
                  to={profileLink}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-[#334155] bg-[#F3F6FC] hover:bg-[#E0ECFF] hover:text-[#0057FF] transition-colors whitespace-nowrap"
                >
                  پروفایل
                </Link>
                <Link
                  to={`/booking/${business.slug}`}
                  onClick={handleBookingClick}
                  className="px-3.5 py-2 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.42)] whitespace-nowrap"
                >
                  <span>رزرو نوبت</span>
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </>
            )}
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
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}> = ({ specialist, businessSlug, isFavorite, onToggleFavorite }) => {
  const {
    authUser,
    openAuthModal,
    businesses,
    favoriteSpecialistIds,
    toggleFavoriteSpecialist,
  } = usePrototypeData();

  const resolvedFavorite =
    typeof isFavorite === 'boolean'
      ? isFavorite
      : favoriteSpecialistIds.includes(specialist.id);
  const handleToggleFavorite = onToggleFavorite ?? toggleFavoriteSpecialist;

  const parentBusiness = businesses.find(
    (b) => b.id === specialist.businessId || b.slug === specialist.businessId
  );
  const targetUrl = `/pro/${specialist.slug}`;
  const bookingUrl = businessSlug
    ? `/booking/${businessSlug}?specialist=${specialist.id}`
    : targetUrl;
  const portraitUrl =
    specialist.avatarUrl?.trim() ||
    parentBusiness?.avatarUrl?.trim() ||
    getSpecialistAvatarUrl(specialist.fullName, specialist.roleTitle);

  return (
    <Card
      variant="interactive"
      className="relative rounded-3xl p-4 flex flex-col items-center text-center justify-between space-y-3 border border-[#CBD5E1] bg-white hover:border-[#0057FF] h-full"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!authUser) {
            openAuthModal({
              initialScreen: 'LOGIN',
              defaultRole: 'CUSTOMER',
              promptReason: `برای ذخیره «${specialist.fullName}» در علاقه‌مندی‌ها، وارد شوید`,
            });
            return;
          }
          handleToggleFavorite(specialist.id);
        }}
        aria-pressed={resolvedFavorite}
        aria-label={
          resolvedFavorite
            ? `حذف ${specialist.fullName} از علاقه‌مندی‌ها`
            : `افزودن ${specialist.fullName} به علاقه‌مندی‌ها`
        }
        title={
          resolvedFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'
        }
        className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer transition-all active:scale-95 z-10 ${
          resolvedFavorite
            ? 'bg-[#E0ECFF] border-[#0057FF] text-[#0057FF] shadow-2xs'
            : 'bg-[#F3F6FC] hover:bg-white border-[#CBD5E1] text-[#334155] hover:text-[#0057FF]'
        }`}
      >
        <Heart
          className={`w-3.5 h-3.5 transition-transform ${
            resolvedFavorite
              ? 'text-[#0057FF] fill-[#0057FF] scale-110'
              : ''
          }`}
        />
      </button>

      <div className="w-full flex flex-col items-center space-y-2">
        <Link to={targetUrl} className="relative group block">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-[#E0ECFF] shadow-sm mx-auto">
            <img
              src={portraitUrl}
              alt={specialist.fullName}
              width={128}
              height={128}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#061138] text-white text-[10px] font-bold whitespace-nowrap shadow-xs">
            {specialist.city || 'اصفهان'}
          </span>
        </Link>

        <div className="space-y-0.5 pt-0.5">
          <h3 className="text-sm font-extrabold text-[#061138] line-clamp-1">
            <Link to={targetUrl} className="hover:text-[#0057FF] transition-colors">
              {specialist.fullName}
            </Link>
          </h3>
          <p className="text-[11px] text-[#0057FF] font-bold line-clamp-1">
            {specialist.roleTitle}
          </p>
        </div>

        <div className="w-full pt-2 pb-1 border-t border-[#E2E8F0] flex items-center justify-between text-xs tabular-nums">
          <span className="text-[#334155] font-semibold">
            {toPersianDigits(specialist.experienceYears)} سال سابقه
          </span>
          <span className="inline-flex items-center gap-1 font-extrabold text-[#061138] bg-[#FFFBEB] border border-[#F59E0B]/40 px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
            {toPersianDigits(specialist.rating)}
          </span>
        </div>
      </div>

      <Link
        to={bookingUrl}
        onClick={(e) => {
          if (!authUser) {
            e.preventDefault();
            openAuthModal({
              initialScreen: 'LOGIN',
              defaultRole: 'CUSTOMER',
              redirectTo: bookingUrl,
              promptReason: `برای رزرو نوبت با «${specialist.fullName}»، وارد شوید یا ثبت‌نام کنید`,
            });
          }
        }}
        className="w-full"
      >
        <button
          type="button"
          className="w-full py-2 px-3 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
        >
          رزرو نوبت
        </button>
      </Link>
    </Card>
  );
};

/** ۵-ب. کارت پاستلی خدمات پرطرفدار (PopularServicePastelCard) — منطبق با سیستم طراحی Lilas Luxe Salon */
export const PopularServicePastelCard: React.FC<{
  service: ServiceItem;
  bookingHref: string;
  toneIndex?: number;
}> = ({ service, bookingHref, toneIndex = 0 }) => {
  const { authUser, openAuthModal } = usePrototypeData();
  const tones = [
    {
      bg: 'bg-[#EDE9FE] border-[#DDD6FE]',
      badge: 'bg-white/90 text-[#7C3AED]',
      price: 'text-[#7C3AED]',
    },
    {
      bg: 'bg-[#F3EEFF] border-[#E6E0F5]',
      badge: 'bg-white/90 text-[#8B5CF6]',
      price: 'text-[#8B5CF6]',
    },
    {
      bg: 'bg-[#ECFDF5] border-[#A7F3D0]',
      badge: 'bg-white/90 text-[#059669]',
      price: 'text-[#059669]',
    },
  ];
  const style = tones[toneIndex % tones.length];

  return (
    <Link
      to={bookingHref}
      onClick={(e) => {
        if (!authUser) {
          e.preventDefault();
          openAuthModal({
            initialScreen: 'LOGIN',
            defaultRole: 'CUSTOMER',
            redirectTo: bookingHref,
            promptReason: `برای رزرو خدمت «${service.title}»، وارد شوید یا ثبت‌نام کنید`,
          });
        }
      }}
      className={`group rounded-3xl border p-5 flex flex-col justify-between min-h-[155px] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(139,92,246,0.20)] ${style.bg}`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${style.badge}`}
          >
            {service.category}
          </span>
          <span className="text-[11px] text-[#6B6480] tabular-nums inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDurationMinutes(service.durationMinutes)}
          </span>
        </div>
        <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B2E] leading-snug">
          {service.title}
        </h3>
      </div>

      <div className="pt-4 flex items-end justify-between gap-2">
        <div>
          <span className="text-[10px] text-[#6B6480] block">تعرفه خدمت</span>
          <span
            className={`text-sm font-extrabold tabular-nums ${style.price}`}
          >
            {formatServicePriceShort(service)}
          </span>
        </div>

        <span className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-[#1E1B2E] group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};

/** ۶. کارت خدمت بهبودیافته برای موبایل و دسکتاپ (ServiceCard) — با چیدمان دوطبقه، نمایش کامل تعرفه بازه‌ای/پایه و کشوی توضیحات */
export const ServiceCard: React.FC<{
  service: ServiceItem;
  actionLabel?: string;
  onSelect?: (service: ServiceItem) => void;
  bookingHref?: string;
  isPopularBadge?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (service: ServiceItem) => void;
  selectedAddonKeys?: string[];
  onToggleAddon?: (serviceId: string, addonId: string) => void;
}> = ({
  service,
  actionLabel = 'رزرو نوبت',
  onSelect,
  bookingHref,
  isPopularBadge = false,
  isSelected = false,
  onToggleSelect,
  selectedAddonKeys = [],
  onToggleAddon,
}) => {
  const { authUser, openAuthModal } = usePrototypeData();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const showPopular = Boolean(service.isPopular || isPopularBadge);
  const cleanDescription = getMeaningfulServiceDescription(service);
  const packageItems = (service.packageIncludes ?? []).filter(Boolean);
  const showDetailsTrigger = shouldShowServiceDetailsTrigger(service);
  const availableAddons = (service.addons ?? []).filter(
    (ad) => Boolean(ad && ad.title && ad.title.trim())
  );

  return (
    <div
      onClick={() => {
        if (onToggleSelect) {
          onToggleSelect(service);
        }
      }}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between ${
        onToggleSelect ? 'cursor-pointer select-none' : ''
      } ${
        isSelected
          ? 'border-[#0057FF] bg-[#EFF6FF] ring-2 ring-[#0057FF]/15 shadow-xs'
          : 'border-[#E6E0F5] bg-white hover:border-[#BFDBFE] hover:bg-[#F8FAFF]'
      }`}
    >
      {/* بخش بالایی: عنوان کامل خدمت، دسته‌بندی، مدت‌زمان، خلاصه یک‌خطی و دکمه توضیحات (فقط در صورت وجود توضیحات واقعی یا اقلام پکیج) */}
      <div className="flex items-start gap-2.5">
        {onToggleSelect ? (
          <span
            aria-hidden="true"
            className={`mt-0.5 w-5 h-5 rounded-lg border-2 inline-flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'bg-[#0057FF] border-[#0057FF] text-white'
                : 'bg-white border-[#94A3B8] text-transparent'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        ) : null}

        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-1.5">
            <h3
              className={`text-sm sm:text-[15px] font-extrabold text-[#1E1B2E] leading-snug ${
                isDetailsOpen ? '' : 'line-clamp-2'
              }`}
            >
              {service.title}
            </h3>
            {showPopular ? (
              <span className="text-[11px] font-extrabold text-[#B45309] shrink-0">
                ★ پرطرفدار
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#475569] pt-0.5">
            <span className="font-bold text-[#334155]">{service.category}</span>
            <span aria-hidden="true" className="text-[#CBD5E1]">
              ·
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums font-bold text-[#475569]">
              <Clock className="w-3 h-3 text-[#0057FF]" />
              {formatDurationMinutes(service.durationMinutes)}
            </span>

            {showDetailsTrigger ? (
              <button
                type="button"
                aria-expanded={isDetailsOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDetailsOpen((prev) => !prev);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer ${
                  isDetailsOpen
                    ? 'bg-[#0057FF] text-white'
                    : 'bg-[#EFF6FF] text-[#0057FF] hover:bg-[#DBEAFE]'
                }`}
              >
                <Info className="w-3 h-3 shrink-0" />
                <span>
                  {isDetailsOpen
                    ? 'بستن جزئیات ▴'
                    : packageItems.length > 0
                      ? `شامل ${toPersianDigits(packageItems.length)} مورد ▾`
                      : 'توضیحات ▾'}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* کشوی بازشوی توضیحات کامل خدمت و اقلام شامل پکیج */}
      {isDetailsOpen && showDetailsTrigger ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 rounded-xl bg-white border border-[#CBD5E1] p-3 space-y-2 text-xs cursor-default"
        >
          {cleanDescription ? (
            <p className="text-[#334155] leading-relaxed whitespace-pre-line">
              {cleanDescription}
            </p>
          ) : null}

          {packageItems.length > 0 ? (
            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] font-extrabold text-[#0057FF] block">
                این پکیج شامل موارد زیر است:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {packageItems.map((item, idx) => (
                  <span
                    key={`${service.id}-inc-${idx}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#061138] text-[11px] font-bold"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* پیشنهاد هوشمند خدمات جانبی (افزودنی‌ها) بلافاصله زیر خدمت انتخاب‌شده */}
      {isSelected && availableAddons.length > 0 && onToggleAddon ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 rounded-xl bg-white border border-[#BFDBFE] p-2.5 space-y-2 cursor-default"
        >
          <p className="text-[11px] font-extrabold text-[#061138]">
            موارد پیشنهادی همراه این خدمت (اختیاری):
          </p>
          <div className="space-y-1.5">
            {availableAddons.map((addon) => {
              const addonKey = makeServiceAddonKey(service.id, addon.id);
              const isAddonChecked = selectedAddonKeys.includes(addonKey);
              return (
                <button
                  key={addon.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isAddonChecked}
                  onClick={() => onToggleAddon(service.id, addon.id)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isAddonChecked
                      ? 'bg-[#EFF6FF] border-[#0057FF] text-[#061138]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:border-[#93C5FD]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isAddonChecked
                          ? 'bg-[#0057FF] border-[#0057FF] text-white'
                          : 'bg-white border-[#94A3B8] text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                    <span className="font-bold truncate">{addon.title}</span>
                    {addon.durationMinutes ? (
                      <span className="text-[10px] text-[#64748B] tabular-nums shrink-0">
                        +{toPersianDigits(addon.durationMinutes)} دقیقه
                      </span>
                    ) : null}
                  </span>
                  <span className="font-extrabold text-[#0057FF] tabular-nums shrink-0">
                    +{formatCompactPriceToman(addon.priceToman)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* نوار پایینی: نمایش شفاف تعرفه در راست و دکمه اقدام در چپ (بدون برچسب تکراری «انتخاب شد») */}
      <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            {service.pricingType === 'RANGE' ? (
              <span className="text-[10px] font-extrabold text-[#B45309]">
                تعرفه بازه‌ای (متغیر)
              </span>
            ) : service.pricingType === 'STARTING_FROM' ? (
              <span className="text-[10px] font-extrabold text-[#0369A1]">
                قیمت پایه
              </span>
            ) : (
              <span className="text-[10px] font-bold text-[#64748B]">
                تعرفه خدمت:
              </span>
            )}
          </div>
          <span className="text-xs sm:text-sm font-black text-[#061138] tabular-nums block leading-snug">
            {formatServicePriceDisplay(service)}
          </span>
        </div>

        {bookingHref ? (
          <Link
            to={bookingHref}
            onClick={(e) => {
              e.stopPropagation();
              if (!authUser) {
                e.preventDefault();
                openAuthModal({
                  initialScreen: 'LOGIN',
                  defaultRole: 'CUSTOMER',
                  redirectTo: bookingHref,
                  promptReason: `برای رزرو خدمت «${service.title}»، وارد شوید یا ثبت‌نام کنید`,
                });
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
          >
            <span>{actionLabel}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        ) : onSelect ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(service);
            }}
            className="px-4 py-2 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            <span>{actionLabel}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        ) : onToggleSelect && !isSelected ? (
          <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1 transition-colors shrink-0 bg-[#F1F5F9] text-[#061138] hover:bg-[#E0E7FF] hover:text-[#0057FF]">
            + انتخاب خدمت
          </span>
        ) : null}
      </div>
    </div>
  );
};


/** ۷. کارت نوبت (AppointmentCard) — منطبق با سیستم طراحی Lilas Luxe Salon */
export const AppointmentCard: React.FC<{
  appointment: AppointmentItem;
  onViewDetails?: (apt: AppointmentItem) => void;
  onCancelDemo?: (apt: AppointmentItem) => void;
}> = ({ appointment, onViewDetails, onCancelDemo }) => {
  const { businesses } = usePrototypeData();
  const statusMeta = getAppointmentStatusMeta(appointment.status);
  const matchedBiz = businesses.find(
    (b) =>
      b.id === appointment.businessId ||
      b.slug === appointment.businessSlug ||
      b.name === appointment.businessName
  );
  const rawSalonPhone = matchedBiz?.phoneDisplay || matchedBiz?.ownerPhone || '';
  const cleanSalonPhone = rawSalonPhone
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[^\d+]/g, '');

  const totalPrice = Number(appointment.priceToman) || 0;
  const depositPaid = Number(appointment.depositPaidToman) || 0;
  const remainingInSalon = Math.max(0, totalPrice - depositPaid);

  return (
    <Card className="rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 border border-[#E6E0F5] hover:border-[#A78BFA] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#8B5CF6] flex flex-col items-center justify-center shrink-0 border border-[#DDD6FE]">
            <Calendar className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6480]">
              <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
              <span className="tabular-nums font-bold text-[#1E1B2E]">
                {toPersianDigits(appointment.dateJalali)} · ساعت {toPersianDigits(appointment.timeSlot)}
              </span>
              {appointment.referenceCode ? (
                <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-mono text-[#475569]">
                  کد پیگیری: {appointment.referenceCode}
                </span>
              ) : null}
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1E1B2E]">
              {appointment.serviceTitle} — {appointment.businessName}
            </h3>
            <p className="text-xs font-normal text-[#6B6480]">
              متخصص: {appointment.specialistName} · مراجع:{' '}
              <strong className="font-bold text-[#1E1B2E]">{appointment.customerName}</strong>
            </p>
            {appointment.status === AppointmentStatus.Pending ? (
              <p className="text-[11px] font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-xl inline-block">
                نوبت شما ثبت شده و منتظر تایید نهایی صاحب سالن است
              </p>
            ) : appointment.status === AppointmentStatus.Confirmed ? (
              <p className="text-[11px] font-bold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-xl inline-block">
                این نوبت توسط مدیریت سالن تایید نهایی شده است
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F3EEFF]">
          <div className="flex items-center gap-2 flex-wrap">
            {rawSalonPhone && appointment.status !== 'CANCELLED' ? (
              <a
                href={`tel:${cleanSalonPhone}`}
                className="px-3 py-1.5 rounded-full bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0057FF] border border-[#BFDBFE] text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors"
                title="تماس اختیاری با سالن جهت هماهنگی"
              >
                <span>تماس با سالن:</span>
                <span dir="ltr" className="font-mono">
                  {rawSalonPhone}
                </span>
              </a>
            ) : null}
            {onViewDetails ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(appointment)}
              >
                جزئیات نوبت
              </Button>
            ) : null}
            {onCancelDemo && appointment.status !== 'CANCELLED' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancelDemo(appointment)}
                className="text-[#EF4444] hover:bg-[#FEF2F2]"
              >
                لغو نوبت
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* تفکیک شفاف مالی نوبت: مبلغ کل خدمت، بیعانه آنلاین پرداخت‌شده و مانده قابل پرداخت حضوری در سالن */}
      <div className="pt-2.5 border-t border-[#F3EEFF] grid grid-cols-3 gap-2 text-[11px] tabular-nums">
        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
          <span className="text-[#64748B]">کل مبلغ خدمت:</span>
          <strong className="font-extrabold text-[#061138]">
            {formatPriceToman(totalPrice)}
          </strong>
        </div>
        <div className="px-2.5 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
          <span className="text-[#065F46]">بیعانه پرداختی:</span>
          <strong className="font-extrabold text-[#059669]">
            {formatPriceToman(depositPaid)}
          </strong>
        </div>
        <div className="px-2.5 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
          <span className="text-[#1E40AF]">مانده حضوری سالن:</span>
          <strong className="font-extrabold text-[#0057FF]">
            {formatPriceToman(remainingInSalon)}
          </strong>
        </div>
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
          className={`w-9 h-9 rounded-full text-xs font-bold tabular-nums cursor-pointer transition-colors ${
            p === currentPage
              ? 'bg-[#8B5CF6] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]'
              : 'bg-white border border-[#E6E0F5] text-[#6B6480] hover:bg-[#F3EEFF] hover:text-[#7C3AED]'
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
  confirmLabel = 'بله، تایید می‌کنم',
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
        <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#6B6480] leading-relaxed">
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
    success: 'bg-[#065F46] text-white border-[#10B981]',
    info: 'bg-[#1E1B2E] text-white border-[#8B5CF6]',
    warning: 'bg-[#92400E] text-white border-[#F59E0B]',
    danger: 'bg-[#991B1B] text-white border-[#EF4444]',
  }[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-50 max-w-md rounded-2xl border px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-xs font-medium ${styles}`}
    >
      <div className="flex items-center gap-2">
        {tone === 'success' ? (
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-[#A78BFA] shrink-0" />
        )}
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="بستن پیام"
        className="p-1 rounded-full hover:bg-white/10 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
