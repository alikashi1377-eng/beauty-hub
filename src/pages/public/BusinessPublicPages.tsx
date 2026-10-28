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
  ArrowRight,
  Instagram,
  Info,
  Share2,
  MessageCircle,
  Scissors,
  Image as ImageIcon,
  Users,
  Sparkles,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { formatPriceToman, toPersianDigits } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  getBeautyPhotoUrl,
  getSpecialistAvatarUrl,
} from '../../components/ui/VisualMediaIllustration';
import { EmptyState } from '../../components/ui/StateViews';
import {
  Avatar,
  PopularServicePastelCard,
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
    dataMode,
    authUser,
    businesses,
    services,
    specialists,
    reviews,
    addReview,
    gallery,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
    favoriteSpecialistIds,
    toggleFavoriteSpecialist,
    showToast,
  } = usePrototypeData();

  const [activeTab, setActiveTab] = useState<string>('services');
  const [selectedServiceCategory, setSelectedServiceCategory] =
    useState<string>('ALL');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewServiceTitle, setReviewServiceTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const matchedSpecialist = specialists.find((sp) => sp.slug === slug);
  const fallbackSlug = mode === 'pro' ? 'sara-rad' : 'royal-golzar';
  const business =
    businesses.find((b) => b.slug === slug || b.id === slug) ??
    (matchedSpecialist
      ? businesses.find((b) => b.id === matchedSpecialist.businessId)
      : undefined) ??
    (dataMode === 'mock'
      ? (businesses.find((b) => b.slug === fallbackSlug) ?? businesses[0])
      : undefined);

  if (!business) {
    return (
      <div className="my-8">
        <EmptyState
          title="پروفایل مرکز زیبایی یا متخصص یافت نشد"
          description="ممکن است این مرکز در سامانه وجود نداشته باشد یا هنوز در صف بررسی و تایید قرار داشته باشد."
        />
      </div>
    );
  }

  const bizServices = services.filter(
    (s) => s.businessId === business.id && s.isActive !== false
  );
  const popularServices = bizServices.slice(0, 3);
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
  const isFavorite =
    mode === 'pro' && matchedSpecialist
      ? favoriteSpecialistIds.includes(matchedSpecialist.id)
      : favoriteBusinessIds.includes(business.id);
  const handleToggleProfileFavorite = () => {
    if (mode === 'pro' && matchedSpecialist) {
      toggleFavoriteSpecialist(matchedSpecialist.id);
    } else {
      toggleFavoriteBusiness(business.id);
    }
  };

  const displayName =
    mode === 'pro' && matchedSpecialist
      ? `${matchedSpecialist.fullName} — ${matchedSpecialist.roleTitle}`
      : business.name;

  const heroBannerUrl = getBeautyPhotoUrl(
    displayName,
    business.typeLabel,
    mode === 'pro' ? 'botanical' : undefined
  );

  const proAvatarUrl =
    mode === 'pro' && matchedSpecialist
      ? getSpecialistAvatarUrl(
          matchedSpecialist.fullName,
          matchedSpecialist.roleTitle
        )
      : getBeautyPhotoUrl(business.name, business.typeLabel);

  const quickActions = [
    {
      label: 'اینستاگرام',
      icon: <Instagram className="w-5 h-5 text-[#8B5CF6]" />,
      onClick: () =>
        showToast(
          `صفحه اینستاگرام: ${business.instagramHandle || '@beautyhub.ir'}`
        ),
    },
    {
      label: 'مشاوره',
      icon: <MessageCircle className="w-5 h-5 text-[#8B5CF6]" />,
      onClick: () => setActiveTab('reviews'),
    },
    {
      label: 'تماس',
      icon: <Phone className="w-5 h-5 text-[#8B5CF6]" />,
      onClick: () => showToast(`شماره تماس سالن: ${business.phoneDisplay}`),
    },
    {
      label: 'مسیریابی',
      icon: <MapPin className="w-5 h-5 text-[#8B5CF6]" />,
      onClick: () => setActiveTab('about'),
    },
    {
      label: 'اشتراک‌گذاری',
      icon: <Share2 className="w-5 h-5 text-[#8B5CF6]" />,
      onClick: () => showToast('لینک صفحه سالن کپی شد.'),
    },
  ];

  // اگر گالری دیتابیس کم بود، چند نمونه کار تصویری واقعی مکمل برای چیدمان ۳ ستونی نمایش دهیم
  const portfolioPhotos =
    bizGallery.length >= 6
      ? bizGallery.map((g) => ({
          id: g.id,
          title: g.title,
          categoryLabel: g.categoryLabel,
          url: getBeautyPhotoUrl(g.title, g.categoryLabel),
        }))
      : [
          ...bizGallery.map((g) => ({
            id: g.id,
            title: g.title,
            categoryLabel: g.categoryLabel,
            url: getBeautyPhotoUrl(g.title, g.categoryLabel),
          })),
          {
            id: 'pf-extra-1',
            title: 'استایل و براشینگ تخصصی',
            categoryLabel: 'مو و رنگ',
            url: getBeautyPhotoUrl('استایل و براشینگ تخصصی', 'مو و رنگ'),
          },
          {
            id: 'pf-extra-2',
            title: 'میکاپ لایت و کانتورینگ',
            categoryLabel: 'میکاپ تخصصی',
            url: getBeautyPhotoUrl('میکاپ لایت و کانتورینگ', 'میکاپ'),
          },
          {
            id: 'pf-extra-3',
            title: 'طراحی و ژلیش ناخن طبیعی',
            categoryLabel: 'طراحی ناخن',
            url: getBeautyPhotoUrl('طراحی و ژلیش ناخن طبیعی', 'ناخن'),
          },
          {
            id: 'pf-extra-4',
            title: 'فیشیال و پاکسازی تخصصی',
            categoryLabel: 'پوست و اسپا',
            url: getBeautyPhotoUrl('فیشیال و پاکسازی تخصصی', 'پوست و فیشیال'),
          },
        ].slice(0, 6);

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {business.isSampleShowcase ? (
        <div className="p-4 rounded-3xl bg-[#FFFBEB] border-2 border-[#F59E0B] text-[#92400E] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <Sparkles className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">
                پروفایل نمونه نمایشی پلتفرم Timeto (صرفاً جهت مشاهده محیط سالن‌ها)
              </p>
              <p className="text-xs text-[#B45309] mt-0.5">
                این سالن یک نمونه نمایشی از امکانات ویترین آنلاین تایم تو است و امکان ثبت رزرو واقعی روی آن غیرفعال است. کسب‌وکارهای واقعی می‌توانند از بخش «ثبت سالن» پروفایل خود را رایگان ایجاد کنند.
              </p>
            </div>
          </div>
          <Link to="/business/register">
            <Button variant="primary" size="sm">
              <span>ثبت سالن واقعی شما ←</span>
            </Button>
          </Link>
        </div>
      ) : null}
      {/* ۱. هدر تصویری تمام‌عرض + کارت سفید روی‌هم‌افتاده (Overlapping Profile Sheet) — دقیقاً مطابق Capture4.PNG و Capture1.PNG */}
      <section className="relative">
        <div className="relative h-64 sm:h-80 lg:h-96 rounded-[32px] overflow-hidden border border-[#E6E0F5] bg-[#1E1B2E] shadow-md">
          <img
            src={heroBannerUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B2E]/80 via-[#1E1B2E]/25 to-black/25" />

          {/* دکمه‌های دایره‌ای شناور بالای تصویر کاور — مطابق Capture4.PNG و Capture.PNG */}
          <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 flex items-center justify-between z-10">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/92 hover:bg-white backdrop-blur-md text-xs font-extrabold text-[#1E1B2E] shadow-sm transition-transform active:scale-95"
            >
              <ArrowRight className="w-4 h-4 text-[#8B5CF6]" />
              <span>بازگشت به سالن‌ها</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => showToast('لینک پروفایل کپی شد.')}
                aria-label="اشتراک‌گذاری"
                className="w-10 h-10 rounded-full bg-white/92 hover:bg-white backdrop-blur-md flex items-center justify-center text-[#1E1B2E] shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToggleProfileFavorite}
                aria-pressed={isFavorite}
                aria-label={
                  isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'
                }
                className="h-10 px-3.5 rounded-full bg-white/92 hover:bg-white backdrop-blur-md flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite
                      ? 'text-[#8B5CF6] fill-[#8B5CF6]'
                      : 'text-[#1E1B2E]'
                  }`}
                />
                <span className="text-xs font-extrabold text-[#1E1B2E]">
                  {isFavorite ? 'ذخیره شد' : 'افزودن به علاقه‌مندی‌ها'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* کارت سفید روی‌هم‌افتاده (Bond Beauty Salon در Capture4.PNG + Karikos Julieta در Capture1.PNG) */}
        <div className="relative z-10 -mt-14 sm:-mt-16 mx-3 sm:mx-8 rounded-[32px] bg-white border border-[#E6E0F5] p-5 sm:p-8 shadow-[0_18px_45px_-20px_rgba(139,92,246,0.16)]">
          {/* قرص تیره امتیاز روی لبه بالایی کارت سفید — دقیقاً مطابق Capture4.PNG */}
          <div className="flex justify-center -mt-9 sm:-mt-11 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E1B2E] text-white text-xs font-extrabold shadow-md border border-white/15 tabular-nums">
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
              <span>
                {toPersianDigits(business.rating)} از ۵ (
                {toPersianDigits(business.reviewCount)} دیدگاه)
              </span>
              {business.verifiedBadge ? (
                <>
                  <span className="opacity-40">|</span>
                  <span className="inline-flex items-center gap-1 text-[#10B981]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>تاییدشده</span>
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-4">
              {/* آواتار دایره‌ای بزرگ متخصص یا سالن — مطابق Capture1.PNG */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-[#EDE9FE] shadow-md shrink-0">
                <img
                  src={proAvatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#8B5CF6] font-bold">
                  <span>
                    {mode === 'pro' ? 'متخصص مستقل زیبایی' : business.typeLabel}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-[#6B6480]">
                    <MapPin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    {business.city}، {business.neighborhood}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-extrabold text-[#1E1B2E]">
                  {displayName}
                </h1>

                <p className="text-xs sm:text-sm text-[#6B6480] leading-relaxed max-w-2xl">
                  {mode === 'pro' && matchedSpecialist
                    ? matchedSpecialist.bio
                    : business.aboutText}
                </p>
              </div>
            </div>

            {/* ۵ دکمه دایره‌ای دسترسی سریع (وب‌سایت/اینستاگرام، مشاوره، تماس، مسیریابی، اشتراک) — دقیقاً مطابق Capture4.PNG */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E6E0F5]">
              <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5 w-full max-w-sm">
                {quickActions.map((act) => (
                  <button
                    key={act.label}
                    type="button"
                    onClick={act.onClick}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#E6E0F5] bg-[#FAF8FF] group-hover:bg-[#8B5CF6] group-hover:border-[#8B5CF6] flex items-center justify-center transition-colors shadow-2xs">
                      <span className="group-hover:[&_svg]:!text-white transition-colors">
                        {act.icon}
                      </span>
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#6B6480] group-hover:text-[#1E1B2E] whitespace-nowrap">
                      {act.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="w-full max-w-sm flex items-center justify-between gap-3 pt-2 border-t border-[#E6E0F5]">
                <div className="text-xs">
                  <span className="text-[#6B6480] block">شروع تعرفه خدمات</span>
                  <strong className="text-sm font-extrabold text-[#8B5CF6] tabular-nums">
                    {formatPriceToman(business.startingPriceToman)}
                  </strong>
                </div>
                {business.isSampleShowcase ? (
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'این سالن یک نمونه نمایشی جهت آشنایی با پلتفرم است و امکان ثبت رزرو روی نمونه‌های نمایشی وجود ندارد.'
                      )
                    }
                    className="px-5 py-2.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] text-xs font-extrabold inline-flex items-center gap-2 cursor-not-allowed"
                  >
                    <Info className="w-4 h-4" />
                    <span>نمونه نمایشی (غیرقابل رزرو)</span>
                  </button>
                ) : (
                  <Link
                    to={`/booking/${business.slug}`}
                    className="px-6 py-2.5 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow-[0_8px_20px_-6px_rgba(139,92,246,0.45)] transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>رزرو آنلاین نوبت</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ۲. بخش خدمات پرطرفدار با کارت‌های پاستلی رنگی — دقیقاً مطابق Capture1.PNG (Karikos Julieta Popular Services) */}
      {popularServices.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#1E1B2E]">
                خدمات پرطرفدار و منتخب مراجعان
              </h2>
            </div>
            <Link
              to={`/booking/${business.slug}`}
              className="text-xs font-bold text-[#8B5CF6] hover:underline"
            >
              رزرو مستقیم ←
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {popularServices.map((srv, idx) => (
              <PopularServicePastelCard
                key={srv.id}
                service={srv}
                toneIndex={idx}
                bookingHref={`/booking/${business.slug}?service=${srv.id}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ۳. چیدمان دو ستونی: تب‌های کپسولی آیکون‌دار + ماژول چسبان رزرو و گالری */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-8 space-y-5">
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                id: 'services',
                label: 'خدمات و تعرفه‌ها',
                count: bizServices.length,
                icon: <Scissors className="w-3.5 h-3.5" />,
              },
              {
                id: 'gallery',
                label: 'گالری نمونه‌کارها',
                count: portfolioPhotos.length,
                icon: <ImageIcon className="w-3.5 h-3.5" />,
              },
              {
                id: 'staff',
                label: 'متخصصان سالن',
                count: bizSpecialists.length,
                icon: <Users className="w-3.5 h-3.5" />,
              },
              {
                id: 'reviews',
                label: 'دیدگاه مراجعان',
                count: bizReviews.length,
                icon: <MessageCircle className="w-3.5 h-3.5" />,
              },
              {
                id: 'about',
                label: 'درباره و قوانین',
                icon: <Info className="w-3.5 h-3.5" />,
              },
            ]}
          />

          {activeTab === 'services' ? (
            <Card className="rounded-3xl space-y-4">
              {serviceCategories.length > 1 ? (
                <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6E0F5]">
                  <button
                    type="button"
                    onClick={() => setSelectedServiceCategory('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                      selectedServiceCategory === 'ALL'
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-[#FAF8FF] text-[#6B6480] hover:bg-[#EDE9FE]'
                    }`}
                  >
                    همه لاین‌ها ({toPersianDigits(bizServices.length)})
                  </button>
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedServiceCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                        selectedServiceCategory === cat
                          ? 'bg-[#8B5CF6] text-white'
                          : 'bg-[#FAF8FF] text-[#6B6480] hover:bg-[#EDE9FE]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : null}

              {filteredServices.length === 0 ? (
                <EmptyState title="خدمتی در این دسته‌بندی ثبت نشده است" />
              ) : (
                <div>
                  {filteredServices.map((srv) => (
                    <ServiceCard
                      key={srv.id}
                      service={srv}
                      actionLabel="رزرو نوبت"
                      bookingHref={`/booking/${business.slug}?service=${srv.id}`}
                    />
                  ))}
                </div>
              )}
            </Card>
          ) : activeTab === 'staff' ? (
            bizSpecialists.length === 0 ? (
              <EmptyState title="متخصصی برای این مرکز ثبت نشده است" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {bizSpecialists.map((sp) => (
                  <ProfessionalCard
                    key={sp.id}
                    specialist={sp}
                    businessSlug={business.slug}
                  />
                ))}
              </div>
            )
          ) : activeTab === 'gallery' ? (
            /* شبکه ۳ ستونی مربعی نمونه‌کارها — دقیقاً مطابق Capture1.PNG و Capture4.PNG راست */
            <Card className="rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1E1B2E]">
                    گالری نمونه‌کارهای واقعی سالن
                  </h3>
                  <p className="text-xs text-[#6B6480] mt-0.5">
                    تصاویر خدمات انجام‌شده توسط متخصصان {business.name}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#8B5CF6] tabular-nums">
                  {toPersianDigits(portfolioPhotos.length)} تصویر
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {portfolioPhotos.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-[#EDE9FE] border border-[#E6E0F5]"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B2E]/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 inset-x-2.5 text-white">
                      <span className="text-[10px] font-bold text-white/80 block">
                        {item.categoryLabel}
                      </span>
                      <p className="text-xs font-extrabold truncate">
                        {item.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : activeTab === 'reviews' ? (
            <div className="space-y-4">
              <Card
                variant="muted"
                className="rounded-3xl grid grid-cols-1 sm:grid-cols-12 gap-4 items-center"
              >
                <div className="sm:col-span-4 text-center sm:border-l sm:border-[#E6E0F5] sm:pl-4 space-y-1">
                  <p className="text-3xl font-extrabold text-[#8B5CF6] tabular-nums">
                    {toPersianDigits(business.rating)}
                  </p>
                  <p className="text-xs font-bold text-[#1E1B2E]">
                    از ۵ امتیاز
                  </p>
                  <p className="text-[11px] text-[#6B6480] tabular-nums">
                    بر اساس {toPersianDigits(business.reviewCount)} دیدگاه
                  </p>
                </div>
                <div className="sm:col-span-8 space-y-2 text-xs tabular-nums">
                  {[
                    { stars: '۵ ستاره', pct: 86 },
                    { stars: '۴ ستاره', pct: 11 },
                    { stars: '۳ ستاره و کمتر', pct: 3 },
                  ].map((row) => (
                    <div key={row.stars} className="flex items-center gap-3">
                      <span className="w-24 text-[#6B6480] font-medium">
                        {row.stars}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-white overflow-hidden border border-[#E6E0F5]">
                        <div
                          className="h-full bg-[#8B5CF6] rounded-full"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-left font-bold text-[#1E1B2E]">
                        {toPersianDigits(row.pct)}٪
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-3xl space-y-4">
                <h3 className="text-sm font-extrabold text-[#1E1B2E] border-b border-[#E6E0F5] pb-2.5">
                  ثبت دیدگاه و تجربه مراجعه
                </h3>
                {dataMode === 'real' && !authUser ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6480]">
                    <span>
                      برای ثبت دیدگاه درباره این مرکز، ابتدا وارد حساب کاربری خود
                      شوید.
                    </span>
                    <Link to="/login">
                      <Button variant="outline" size="sm">
                        ورود با شماره موبایل
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        !reviewComment.trim() ||
                        reviewComment.trim().length < 3
                      )
                        return;
                      setIsSubmittingReview(true);
                      try {
                        const ok = await addReview({
                          businessId: business.id,
                          specialistSlug: matchedSpecialist?.slug,
                          serviceTitle:
                            reviewServiceTitle ||
                            bizServices[0]?.title ||
                            'خدمات زیبایی',
                          rating: reviewRating,
                          comment: reviewComment.trim(),
                        });
                        if (ok) {
                          setReviewComment('');
                        }
                      } finally {
                        setIsSubmittingReview(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField id="rev-service" label="خدمت دریافت‌شده">
                        <Select
                          id="rev-service"
                          value={
                            reviewServiceTitle ||
                            bizServices[0]?.title ||
                            'خدمات زیبایی'
                          }
                          onChange={(e) =>
                            setReviewServiceTitle(e.target.value)
                          }
                          options={
                            bizServices.length > 0
                              ? bizServices.map((s) => ({
                                  value: s.title,
                                  label: s.title,
                                }))
                              : [
                                  {
                                    value: 'خدمات زیبایی',
                                    label: 'خدمات زیبایی',
                                  },
                                ]
                          }
                        />
                      </FormField>
                      <FormField id="rev-rating" label="امتیاز شما">
                        <Select
                          id="rev-rating"
                          value={String(reviewRating)}
                          onChange={(e) =>
                            setReviewRating(Number(e.target.value))
                          }
                          options={[
                            { value: '5', label: '۵ ستاره (عالی)' },
                            { value: '4', label: '۴ ستاره (خوب)' },
                            { value: '3', label: '۳ ستاره (متوسط)' },
                            { value: '2', label: '۲ ستاره (ضعیف)' },
                            { value: '1', label: '۱ ستاره (بسیار ضعیف)' },
                          ]}
                        />
                      </FormField>
                    </div>
                    <FormField id="rev-comment" label="متن دیدگاه" required>
                      <Textarea
                        id="rev-comment"
                        rows={2}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="تجربه خود از کیفیت خدمات و نظم نوبت‌دهی را بنویسید..."
                      />
                    </FormField>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={
                          isSubmittingReview || reviewComment.trim().length < 3
                        }
                      >
                        {isSubmittingReview ? 'در حال ثبت...' : 'ثبت دیدگاه'}
                      </Button>
                    </div>
                  </form>
                )}
              </Card>

              {bizReviews.length === 0 ? (
                <EmptyState title="هنوز دیدگاهی برای این مرکز ثبت نشده است" />
              ) : (
                bizReviews.map((rev) => (
                  <Card key={rev.id} className="rounded-3xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={rev.authorName}
                          size="sm"
                          showPhoto={false}
                        />
                        <div>
                          <span className="font-extrabold text-[#1E1B2E] block">
                            {rev.authorName}
                          </span>
                          <span className="font-medium text-[#6B6480] text-[11px]">
                            {rev.serviceTitle}
                          </span>
                        </div>
                      </div>
                      <span className="tabular-nums text-[#F59E0B] font-bold">
                        ★ {toPersianDigits(rev.rating)} · {rev.dateJalali}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#6B6480] leading-relaxed">
                      {rev.comment}
                    </p>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <Card className="rounded-3xl space-y-5">
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#1E1B2E] inline-flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#8B5CF6]" />
                  <span>درباره {displayName}</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6480] leading-relaxed">
                  {business.aboutText}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E6E0F5] space-y-2.5 text-xs text-[#6B6480]">
                <h4 className="font-extrabold text-[#1E1B2E]">
                  قوانین پذیرش، بیعانه و لغو نوبت
                </h4>
                <ul className="space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    لطفاً ۱۰ دقیقه پیش از ساعت شروع نوبت در سالن حضور داشته
                    باشید.
                  </li>
                  <li>
                    امکان لغو یا جابه‌جایی نوبت تا حداقل ۴ ساعت پیش از زمان
                    مراجعه از طریق بخش «نوبت‌های من» فراهم است.
                  </li>
                  <li>
                    در صورت فعال بودن بیعانه برای خدمت انتخابی، مبلغ بیعانه از
                    هزینه نهایی شما در سالن کسر خواهد شد.
                  </li>
                </ul>
              </div>
            </Card>
          )}
        </div>

        {/* ستون چسبان کناری: ماژول رزرو، پیش‌نمایش گالری ۳ ستونی و ساعات کاری */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <Card variant="dark" className="rounded-3xl space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#EDE9FE]">
                تقویم آنلاین ۲۴ ساعته
              </p>
              <h3 className="text-base font-extrabold text-white">
                رزرو نوبت در {business.name}
              </h3>
            </div>

            <div className="space-y-2 text-xs text-[#EDE9FE]/90 border-y border-white/10 py-3">
              <div className="flex items-center justify-between">
                <span>شروع تعرفه خدمات:</span>
                <span className="font-bold text-white tabular-nums">
                  {formatPriceToman(business.startingPriceToman)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>خدمات قابل رزرو:</span>
                <span className="font-bold text-white tabular-nums">
                  {toPersianDigits(bizServices.length)} خدمت فعال
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#10B981] pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>ثبت آنی همراه با کد رهگیری</span>
              </div>
            </div>

            {business.isSampleShowcase ? (
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold text-center">
                پروفایل نمونه نمایشی (رزرو غیرفعال)
              </div>
            ) : (
              <Link to={`/booking/${business.slug}`} className="block">
                <Button variant="accent" size="lg" fullWidth>
                  <span>انتخاب خدمت و ساعت مراجعه</span>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </Card>

          {/* ویترین ۳ ستونی نمونه‌کارها در ستون کناری — مطابق Capture1.PNG و Capture4.PNG */}
          <Card className="rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#1E1B2E]">
                ویترین نمونه‌کارها
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className="text-xs font-bold text-[#8B5CF6] hover:underline cursor-pointer"
              >
                مشاهده همه ({toPersianDigits(portfolioPhotos.length)})
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {portfolioPhotos.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className="aspect-square rounded-xl overflow-hidden bg-[#EDE9FE] border border-[#E6E0F5] cursor-pointer group"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-3xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-2.5">
              <h3 className="text-sm font-extrabold text-[#1E1B2E] inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#8B5CF6]" />
                <span>ساعات کاری هفتگی</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#10B981]">
                پذیرش با نوبت قبلی
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {business.workingHours.map((wh, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1.5 border-b border-[#F3EEFF] last:border-b-0"
                >
                  <span className="text-[#6B6480] font-medium">
                    {wh.dayName}
                  </span>
                  {wh.isOpen ? (
                    <span className="text-[#1E1B2E] font-bold tabular-nums">
                      {wh.openTime} تا {wh.closeTime}
                    </span>
                  ) : (
                    <span className="text-[#6B6480]">تعطیل</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card padding="sm" className="rounded-3xl space-y-2.5">
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

      {/* نوار چسبان پایین موبایل برای رزرو سریع — مطابق دکمه کپسولی تیره Capture4.PNG */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E6E0F5] px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_-4px_rgba(30,27,46,0.10)]">
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-[#1E1B2E] truncate">
            {business.name}
          </p>
          <p className="text-[11px] text-[#6B6480] tabular-nums">
            شروع از {formatPriceToman(business.startingPriceToman)}
          </p>
        </div>
        {business.isSampleShowcase ? (
          <span className="px-4 py-2 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] text-xs font-extrabold shrink-0">
            نمونه نمایشی
          </span>
        ) : (
          <Link
            to={`/booking/${business.slug}`}
            className="px-6 py-2.5 rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-extrabold inline-flex items-center gap-2 shrink-0 shadow-[0_8px_20px_-6px_rgba(139,92,246,0.45)]"
          >
            <span>رزرو آنلاین نوبت</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};
