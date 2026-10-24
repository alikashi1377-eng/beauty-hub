import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin,
  Star,
  Calendar,
  Heart,
  ShieldCheck,
  Phone,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Instagram,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import {
  formatPriceToman,
  toPersianDigits,
} from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { VisualMediaIllustration } from '../../components/ui/VisualMediaIllustration';
import { EmptyState } from '../../components/ui/StateViews';
import {
  Avatar,
  ProfessionalCard,
  ServiceCard,
  Tabs,
} from '../../components/ui/MarketplaceComponents';
import { LocationMapPicker } from '../../components/ui/LocationMapPicker';

export const BusinessPublicProfileView: React.FC<{
  mode: 'salon' | 'pro';
}> = ({ mode }) => {
  const { slug } = useParams<{ slug: string }>();
  const {
    businesses,
    services,
    specialists,
    reviews,
    gallery,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
  } = usePrototypeData();

  const [activeTab, setActiveTab] = useState<string>('services');
  const [selectedServiceCategory, setSelectedServiceCategory] =
    useState<string>('ALL');

  const matchedSpecialist = specialists.find((sp) => sp.slug === slug);
  const fallbackSlug = mode === 'pro' ? 'sara-rad' : 'royal-golzar';
  const business =
    businesses.find((b) => b.slug === slug) ??
    (matchedSpecialist
      ? businesses.find((b) => b.id === matchedSpecialist.businessId)
      : undefined) ??
    businesses.find((b) => b.slug === fallbackSlug) ??
    businesses[0];

  const bizServices = services.filter(
    (s) => s.businessId === business.id && s.isActive !== false
  );
  const serviceCategories = Array.from(
    new Set(bizServices.map((s) => s.category))
  );
  const filteredServices =
    selectedServiceCategory === 'ALL'
      ? bizServices
      : bizServices.filter((s) => s.category === selectedServiceCategory);

  const bizSpecialists = specialists.filter(
    (sp) => sp.businessId === business.id && sp.isActive !== false
  );
  const bizReviews = reviews.filter((r) => r.businessId === business.id);
  const bizGallery = gallery.filter((g) => g.businessId === business.id);
  const isFavorite = favoriteBusinessIds.includes(business.id);

  const displayName =
    mode === 'pro' && matchedSpecialist
      ? `${matchedSpecialist.fullName} — ${matchedSpecialist.roleTitle}`
      : business.name;

  const routePattern =
    mode === 'pro' ? `/pro/${slug ?? ':slug'}` : `/salon/${slug ?? ':slug'}`;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={
          mode === 'pro' ? 'پروفایل رسمی متخصص مستقل' : business.typeLabel
        }
        title={displayName}
        subtitle={
          mode === 'pro' && matchedSpecialist
            ? matchedSpecialist.bio
            : business.shortDescription
        }
        routePattern={routePattern}
        breadcrumbs={[
          { label: 'صفحه اصلی', href: '/' },
          { label: 'جست‌وجوی بازارچه', href: '/search' },
          { label: displayName },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={() => toggleFavoriteBusiness(business.id)}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite
                    ? 'text-[#9D174D] fill-[#9D174D]'
                    : 'text-[#4A4458]'
                }`}
              />
              <span>{isFavorite ? 'نشان‌شده' : 'افزودن به منتخب‌ها'}</span>
            </Button>
            <Link to={`/booking/${business.slug}`}>
              <Button variant="primary" size="md">
                <Calendar className="w-4 h-4" />
                <span>رزرو آنلاین نوبت</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* نوار تغییر سریع پروفایل‌های نمونه */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-[#F4F3F8] p-2.5 rounded-2xl border border-[#E6E3EE]">
        <span className="text-[#4A4458] font-bold pr-1">
          جابه‌جایی سریع بین پروفایل‌های نمونه:
        </span>
        {[
          { to: '/salon/royal-golzar', label: 'سالن رویال گلزار (زنانه)' },
          { to: '/salon/parseh-barber', label: 'آرایشگاه پارسه استایل (مردانه)' },
          { to: '/pro/sara-rad', label: 'سارا راد (متخصص مستقل)' },
          { to: '/pro/mahsa-kiani', label: 'مهسا کیانی (متخصص مو)' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#D0CADF] hover:border-[#2A0F54] text-[#120F1D] font-semibold transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* کارت هویت بصری و اطلاعات کلیدی مرکز */}
      <Card className="p-5 sm:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          <div className="lg:col-span-5">
            <VisualMediaIllustration
              theme={business.visualTheme}
              categoryLabel={business.typeLabel}
              title={displayName}
              subtitle={`${business.city} · ${business.neighborhood}`}
              city={business.city}
              className="h-full min-h-[220px]"
            />
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3.5">
                <Avatar
                  name={displayName}
                  size="lg"
                  tone={mode === 'pro' ? 'emerald' : 'violet'}
                />
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#756F86]">
                    <span>{business.typeLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {business.city}، {business.neighborhood}
                    </span>
                    {business.verifiedBadge ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          احراز هویت تاییدشده
                        </span>
                      </>
                    ) : null}
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#120F1D]">
                    {displayName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#4A4458] tabular-nums">
                    <span className="inline-flex items-center gap-1 font-extrabold text-[#120F1D]">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {toPersianDigits(business.rating)} از ۵ (
                      {toPersianDigits(business.reviewCount)} دیدگاه ثبت‌شده)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      شروع تعرفه‌ها از{' '}
                      <strong className="text-[#2A0F54] font-extrabold">
                        {formatPriceToman(business.startingPriceToman)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
                {business.aboutText}
              </p>
            </div>

            <div className="pt-3.5 border-t border-[#E6E3EE] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#4A4458]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#2A0F54] shrink-0" />
                <span>
                  {business.city}، {business.neighborhood} — {business.address}
                </span>
              </span>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {business.instagramHandle ? (
                  <span
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 font-mono font-bold text-[#9D174D] bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200"
                  >
                    <Instagram className="w-3.5 h-3.5 text-[#9D174D]" />
                    <span>
                      {business.instagramHandle.startsWith('@')
                        ? business.instagramHandle
                        : `@${business.instagramHandle}`}
                    </span>
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 tabular-nums font-semibold text-[#120F1D]">
                  <Phone className="w-3.5 h-3.5 text-[#2A0F54]" />
                  <span>{business.phoneDisplay}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* چیدمان دو ستونی: تب‌های محتوا (۸ ستون) + ماژول رزرو و ساعات کاری چسبان (۴ ستون) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                id: 'services',
                label: 'خدمات و تعرفه‌ها',
                count: bizServices.length,
              },
              {
                id: 'staff',
                label: 'متخصصان مرکز',
                count: bizSpecialists.length,
              },
              {
                id: 'gallery',
                label: 'گالری نمونه کارها',
                count: bizGallery.length,
              },
              {
                id: 'reviews',
                label: 'دیدگاه مراجعان',
                count: bizReviews.length,
              },
            ]}
          />

          {activeTab === 'services' ? (
            <Card className="space-y-4">
              {serviceCategories.length > 1 ? (
                <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#E6E3EE]">
                  <button
                    type="button"
                    onClick={() => setSelectedServiceCategory('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedServiceCategory === 'ALL'
                        ? 'bg-[#F3EEFA] text-[#2A0F54] font-bold'
                        : 'text-[#4A4458] hover:bg-[#F4F3F8]'
                    }`}
                  >
                    همه لاین‌ها ({toPersianDigits(bizServices.length)})
                  </button>
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedServiceCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        selectedServiceCategory === cat
                          ? 'bg-[#F3EEFA] text-[#2A0F54] font-bold'
                          : 'text-[#4A4458] hover:bg-[#F4F3F8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : null}

              {filteredServices.length === 0 ? (
                <EmptyState title="خدمتی برای این بخش ثبت نشده است" />
              ) : (
                <div>
                  {filteredServices.map((srv) => (
                    <ServiceCard
                      key={srv.id}
                      service={srv}
                      bookingHref={`/booking/${business.slug}?service=${srv.id}`}
                    />
                  ))}
                </div>
              )}
            </Card>
          ) : activeTab === 'staff' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bizSpecialists.map((sp) => (
                <ProfessionalCard
                  key={sp.id}
                  specialist={sp}
                  businessSlug={business.slug}
                />
              ))}
            </div>
          ) : activeTab === 'gallery' ? (
            bizGallery.length === 0 ? (
              <EmptyState title="تصویری در گالری نمونه ثبت نشده است" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bizGallery.map((item) => (
                  <Card key={item.id} padding="sm" className="space-y-2.5">
                    <VisualMediaIllustration
                      theme={item.theme}
                      categoryLabel={item.categoryLabel}
                      title={item.title}
                      city={business.city}
                    />
                    <div className="flex items-center justify-between px-1 text-xs">
                      <span className="font-bold text-[#120F1D]">
                        {item.title}
                      </span>
                      <span className="text-[#756F86]">
                        {item.categoryLabel}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {/* خلاصه توزیع امتیازات */}
              <Card variant="muted" className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-4 text-center sm:border-l sm:border-[#E6E3EE] sm:pl-4 space-y-1">
                  <p className="text-3xl font-extrabold text-[#2A0F54] tabular-nums">
                    {toPersianDigits(business.rating)}
                  </p>
                  <p className="text-xs font-bold text-[#120F1D]">
                    از ۵ امتیاز ممکن
                  </p>
                  <p className="text-[11px] text-[#756F86] tabular-nums">
                    بر اساس {toPersianDigits(business.reviewCount)} دیدگاه تاییدشده
                  </p>
                </div>
                <div className="sm:col-span-8 space-y-2 text-xs tabular-nums">
                  {[
                    { stars: '۵ ستاره', pct: 86 },
                    { stars: '۴ ستاره', pct: 11 },
                    { stars: '۳ ستاره و کمتر', pct: 3 },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-3">
                      <span className="w-24 text-[#4A4458] font-medium">
                        {row.stars}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-white overflow-hidden border border-[#E6E3EE]">
                        <div
                          className="h-full bg-[#2A0F54] rounded-full"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-left font-bold text-[#120F1D]">
                        {toPersianDigits(row.pct)}٪
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {bizReviews.length === 0 ? (
                <EmptyState title="هنوز دیدگاهی برای این مرکز ثبت نشده است" />
              ) : (
                bizReviews.map((rev) => (
                  <Card key={rev.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#120F1D]">
                        {rev.authorName} ·{' '}
                        <span className="font-medium text-[#756F86]">
                          خدمت: {rev.serviceTitle}
                        </span>
                      </span>
                      <span className="tabular-nums text-amber-600 font-bold">
                        ★ {toPersianDigits(rev.rating)} · {rev.dateJalali}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
                      {rev.comment}
                    </p>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* ستون چسبان کناری: ماژول یکپارچه رزرو + ساعات کاری */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <Card variant="dark" className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-pink-300">
                نوبت‌دهی آنلاین ۲۴ ساعته
              </p>
              <h3 className="text-base font-extrabold text-white">
                رزرو مستقیم در {business.name}
              </h3>
            </div>

            <div className="space-y-2 text-xs text-slate-200 border-y border-white/10 py-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">شروع تعرفه خدمات:</span>
                <span className="font-extrabold text-white tabular-nums">
                  {formatPriceToman(business.startingPriceToman)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">تعداد خدمات فعال:</span>
                <span className="font-bold text-white tabular-nums">
                  {toPersianDigits(bizServices.length)} خدمت
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>تایید آنی کد رهگیری در محیط شبیه‌ساز</span>
              </div>
            </div>

            <Link to={`/booking/${business.slug}`} className="block">
              <Button variant="accent" size="lg" fullWidth>
                <span>انتخاب خدمت و ساعت مراجعه</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E6E3EE] pb-2.5">
              <h3 className="text-sm font-extrabold text-[#120F1D] inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2A0F54]" />
                <span>ساعات کاری هفتگی</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800">
                پذیرش با وقت قبلی
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {business.workingHours.map((wh, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 border-b border-[#F4F3F8] last:border-b-0"
                >
                  <span className="text-[#4A4458] font-semibold">
                    {wh.dayName}
                  </span>
                  {wh.isOpen ? (
                    <span className="text-[#120F1D] font-bold tabular-nums">
                      {wh.openTime} تا {wh.closeTime}
                    </span>
                  ) : (
                    <span className="text-[#756F86]">تعطیل</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card padding="sm" className="space-y-2.5">
            <LocationMapPicker
              city={business.city}
              neighborhood={business.neighborhood}
              address={business.address}
              lat={business.mapLat}
              lng={business.mapLng}
              readOnly
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
