import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Gem,
  Scissors,
  Droplets,
  Eye,
  UserCheck,
  Award,
  HeartHandshake,
  ShieldCheck,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronsDown,
  Zap,
  Percent,
  Heart,
} from 'lucide-react';
import { BusinessType } from '../../types';
import {
  computeFairRotationScore,
  formatPriceToman,
  toPersianDigits,
} from '../../utils/formatters';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from '../../components/ui/Button';
import {
  getBeautyPhotoUrl,
  getSpecialistAvatarUrl,
} from '../../components/ui/VisualMediaIllustration';
import {
  BusinessCard,
  ProfessionalCard,
} from '../../components/ui/MarketplaceComponents';

const TIMETO_HERO_SPA_WEBP_URL = '/assets/beauty/timeto-hero-spa.webp';

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4 text-[#0057FF]" />,
  Gem: <Gem className="w-4 h-4 text-[#0057FF]" />,
  Scissors: <Scissors className="w-4 h-4 text-[#0057FF]" />,
  Droplets: <Droplets className="w-4 h-4 text-[#10B981]" />,
  Eye: <Eye className="w-4 h-4 text-[#0057FF]" />,
  UserCheck: <UserCheck className="w-4 h-4 text-[#334155]" />,
  Award: <Award className="w-4 h-4 text-[#0057FF]" />,
  HeartHandshake: <HeartHandshake className="w-4 h-4 text-[#10B981]" />,
};

export const HomePage: React.FC = () => {
  const {
    businesses,
    specialists,
    categories,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
    favoriteSpecialistIds,
    toggleFavoriteSpecialist,
  } = usePrototypeData();

  const [proSpecialtyFilter, setProSpecialtyFilter] = useState<string>('ALL');
  const [genderAudienceFilter, setGenderAudienceFilter] = useState<
    'ALL' | 'FEMALE' | 'MALE'
  >('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const approvedSalons = businesses.filter(
    (b) =>
      b.approvalStatus !== 'REJECTED' &&
      b.type !== BusinessType.IndependentSpecialist
  );
  const sortedHomeSalons = [...approvedSalons].sort((a, b) => {
    const aSpon = Number(Boolean(a.isSponsored));
    const bSpon = Number(Boolean(b.isSponsored));
    if (bSpon !== aSpon) return bSpon - aSpon;
    if (aSpon && bSpon) {
      const aOrd = a.sponsoredOrder ?? 2;
      const bOrd = b.sponsoredOrder ?? 2;
      if (aOrd !== bOrd) return aOrd - bOrd;
      return computeFairRotationScore(a.id) - computeFairRotationScore(b.id);
    }
    const aReal = Number(!a.isSampleShowcase && !/^biz-[1-8]$/.test(a.id));
    const bReal = Number(!b.isSampleShowcase && !/^biz-[1-8]$/.test(b.id));
    if (bReal !== aReal) return bReal - aReal;
    return b.rating - a.rating;
  });

  const genderFilteredHomeSalons = sortedHomeSalons.filter((b) => {
    if (genderAudienceFilter === 'MALE') {
      return b.type === BusinessType.MenBarbershop;
    }
    if (genderAudienceFilter === 'FEMALE') {
      return b.type !== BusinessType.MenBarbershop;
    }
    return true;
  });

  const effectiveHomeSalons =
    genderFilteredHomeSalons.length > 0
      ? genderFilteredHomeSalons
      : sortedHomeSalons;

  const featuredBusinesses = effectiveHomeSalons.slice(0, 12);
  const homeBannerPrimary =
    sortedHomeSalons.find(
      (b) =>
        b.isSponsored &&
        (b.sponsoredPlacement === 'HOME_BANNER' ||
          b.sponsoredPlacement === 'HERO_SPOTLIGHT')
    ) ?? sortedHomeSalons[0];
  const homeBannerSecondary =
    sortedHomeSalons.find(
      (b) => b.id !== homeBannerPrimary?.id && b.isSponsored
    ) ??
    sortedHomeSalons.find((b) => b.id !== homeBannerPrimary?.id) ??
    sortedHomeSalons[0];
  const extraSponsoredSalons = sortedHomeSalons.filter(
    (b) =>
      b.isSponsored &&
      b.id !== homeBannerPrimary?.id &&
      b.id !== homeBannerSecondary?.id
  );

  const filteredProfessionals = specialists.filter((sp) => {
    if (proSpecialtyFilter === 'ALL') return true;
    if (proSpecialtyFilter === 'hair') {
      return (
        sp.roleTitle.includes('مو') ||
        sp.specialties.some((s) => s.includes('مو') || s.includes('بالیاژ'))
      );
    }
    if (proSpecialtyFilter === 'skin') {
      return (
        sp.roleTitle.includes('پوست') ||
        sp.roleTitle.includes('میکاپ') ||
        sp.specialties.some((s) => s.includes('فیشیال') || s.includes('میکاپ'))
      );
    }
    if (proSpecialtyFilter === 'nails') {
      return (
        sp.roleTitle.includes('ناخن') ||
        sp.roleTitle.includes('مژه') ||
        sp.specialties.some((s) => s.includes('ناخن') || s.includes('مژه'))
      );
    }
    if (proSpecialtyFilter === 'men') {
      return (
        sp.roleTitle.includes('مردانه') ||
        sp.specialties.some((s) => s.includes('فید') || s.includes('داماد'))
      );
    }
    return true;
  });

  const spotlightSpecialist = specialists[0];
  const isSpotlightFav = spotlightSpecialist
    ? favoriteSpecialistIds.includes(spotlightSpecialist.id)
    : false;

  const homeFaqs = [
    {
      q: 'آیا تعرفه‌های درج‌شده در پروفایل سالن‌ها شفاف و واقعی است؟',
      a: 'بله؛ تمامی سالن‌ها و متخصصان عضو Timeto (تایم تو) تعرفه پایه خدمات به تومان و مدت زمان هر خدمت را درج می‌کنند.',
    },
    {
      q: 'چگونه نوبت رزروشده خود را پیگیری یا لغو کنم؟',
      a: 'در بخش «نوبت‌ها» می‌توانید وضعیت تایید، کد رهگیری و گزینه لغو نوبت را مشاهده کنید.',
    },
    {
      q: 'چطور می‌توانم سالن زیبایی یا خدمات تخصصی خود را ثبت کنم؟',
      a: 'از طریق دکمه «ثبت کسب‌وکار» در بالای صفحه، در چند گام کوتاه مشخصات سالن، خدمات و ساعات کاری خود را ثبت کنید.',
    },
  ];

  const categoryScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [isCatScrollPaused, setIsCatScrollPaused] = useState(false);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el || isCatScrollPaused) return;
    let intervalId: number | null = null;
    // تاخیر در شروع اسکرول خودکار تا در حین بارگذاری اولیه صفحه هیچ Forced Reflow رخ ندهد
    const delayTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        if (!el || document.hidden) return;
        el.scrollBy({ left: -120, behavior: 'smooth' });
      }, 5500);
    }, 10000);
    return () => {
      window.clearTimeout(delayTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [isCatScrollPaused, categories.length]);

  return (
    <div className="space-y-7 sm:space-y-10">
      {/* ۱. بخش Hero صفحه اصلی — ارتفاع 100vh در موبایل، بدون بردر ردیوس در موبایل، و بخش ویژگی‌ها با پس‌زمینه کاملاً شفاف */}
      <section className="relative overflow-hidden -mx-3.5 -mt-4 rounded-none sm:mx-0 sm:mt-0 sm:rounded-[32px] border-b sm:border border-[#0057FF]/25 bg-[#04123B] shadow-[0_20px_50px_-16px_rgba(4,14,46,0.55)] h-[calc(100dvh-56px)] min-h-[calc(100vh-56px)] sm:h-auto sm:min-h-[480px] flex flex-col justify-between">
        {/* تصویر پس‌زمینه اسپا با وضوح بالا (HD WebP) بدون تداخل رنگ آبی روی تصویر چهره */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src={TIMETO_HERO_SPA_WEBP_URL}
            srcSet="/assets/beauty/timeto-hero-spa.webp 1x, /assets/beauty/timeto-hero-spa-hd.webp 2x"
            alt="رزرو آنلاین خدمات زیبایی و مراقبت فردی در تایم تو"
            width={1024}
            height={1024}
            fetchPriority="high"
            decoding="sync"
            className="w-full h-full object-cover object-[24%_center] sm:object-left"
          />
          {/* گرادیان نرم فقط در سمت راست برای خوانایی تیتر، بدون پوشاندن چهره در سمت چپ */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(270deg, rgba(4,16,54,0.72) 0%, rgba(5,22,74,0.34) 38%, rgba(5,22,74,0) 64%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#04123B]/80 via-[#04123B]/25 to-transparent" />
        </div>

        {/* محتوای اصلی راست‌چین شده: در موبایل تیتر و توضیح در بالا و دکمه مشاهده سالن‌ها دقیقاً در پایین قاب (بالای نوار شیشه‌ای) در تمام ابعاد گوشی‌ها */}
        <div className="relative z-20 px-4 pt-6 pb-16 sm:px-10 sm:pt-16 sm:pb-6 flex flex-col justify-between flex-1 gap-4">
          <div className="max-w-md w-full mr-0 ml-auto text-right mt-1 sm:mt-4 flex-1 sm:flex-initial flex flex-col justify-between sm:block">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black text-white leading-[1.3] tracking-tight drop-shadow-xs">
                <span className="block">وقت زیبایی تو،</span>
                <span className="relative inline-block mt-0.5 bg-gradient-to-l from-[#38BDF8] via-[#22D3EE] to-[#60A5FA] bg-clip-text text-transparent pb-1.5">
                  به انتخاب تو
                  <svg
                    viewBox="0 0 240 24"
                    fill="none"
                    className="w-36 sm:w-52 h-3.5 sm:h-4 mt-0.5 mr-auto ml-0"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 18C68 4 154 3 232 12"
                      stroke="url(#timetoHeroArc)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="timetoHeroArc"
                        x1="232"
                        y1="12"
                        x2="8"
                        y2="18"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#38BDF8" stopOpacity="0.15" />
                        <stop offset="0.5" stopColor="#38BDF8" />
                        <stop offset="1" stopColor="#E0F2FE" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              <p className="pt-1 text-xs sm:text-sm lg:text-base text-white/95 font-semibold leading-relaxed max-w-xs sm:max-w-sm drop-shadow-xs">
                رزرو آنلاین خدمات زیبایی
                <br />
                و مراقبت فردی در بهترین سالن‌ها
              </p>
            </div>

            <div className="mt-auto pt-[220px] pb-2 sm:pt-0 sm:pb-0 sm:mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                to="/search"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-l from-[#0077FF] via-[#0062FF] to-[#0047FF] hover:from-[#0088FF] hover:to-[#0055FF] text-white text-xs sm:text-sm font-extrabold shadow-[0_10px_24px_-6px_rgba(0,102,255,0.65)] border border-[#60A5FA]/35 transition-all active:scale-95"
              >
                <span>مشاهده سالن‌های زیبایی</span>
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* نوار ۳ ستونه با پس‌زمینه نیمه‌شفاف ملایم برای خوانایی دیداری بهتر در حالی که تصویر پشت آن پیداست */}
          <div className="space-y-3">
            <div className="max-w-md sm:max-w-lg mx-auto w-full rounded-2xl bg-[#04123B]/45 backdrop-blur-md border border-white/25 px-2.5 py-2.5 sm:px-4 sm:py-3 shadow-sm">
              <div className="grid grid-cols-3 text-center">
                <Link
                  to="/search"
                  className="px-1.5 flex flex-col items-center justify-center gap-1 group"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#38BDF8] fill-[#38BDF8] drop-shadow-xs transition-transform group-hover:scale-110" />
                  <span className="text-[11px] sm:text-xs font-extrabold text-white drop-shadow-xs leading-tight">
                    رزرو سریع و آنلاین
                  </span>
                </Link>

                <a
                  href="#home-salons-section"
                  className="px-1.5 border-x border-white/25 flex flex-col items-center justify-center gap-1 group"
                >
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-[#38BDF8] stroke-[2.2] drop-shadow-xs transition-transform group-hover:scale-110" />
                  <span className="text-[11px] sm:text-xs font-extrabold text-white drop-shadow-xs leading-tight">
                    نظرات واقعی مشتریان
                  </span>
                </a>

                <Link
                  to="/search"
                  className="px-1.5 flex flex-col items-center justify-center gap-1 group"
                >
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#38BDF8] stroke-[2.2] drop-shadow-xs transition-transform group-hover:scale-110" />
                  <span className="text-[11px] sm:text-xs font-extrabold text-white drop-shadow-xs leading-tight">
                    پرداخت امن و مطمئن
                  </span>
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <a
                href="#home-categories-section"
                aria-label="اسکرول به دسته‌بندی خدمات"
                className="w-8 h-8 rounded-full bg-transparent hover:bg-white/10 border border-white/25 text-white/90 inline-flex items-center justify-center transition-all"
              >
                <ChevronsDown className="w-4 h-4 animate-bounce" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ۱-ب. دسته‌بندی خدمات زیبایی (باکس‌های ۱×۱ مربعی با اسکرول افقی خودکار و لمسی زیر هیرو) */}
      <section
        id="home-categories-section"
        className="space-y-3"
        onMouseEnter={() => setIsCatScrollPaused(true)}
        onMouseLeave={() => setIsCatScrollPaused(false)}
        onTouchStart={() => setIsCatScrollPaused(true)}
        onTouchEnd={() => setIsCatScrollPaused(false)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#061138]">
              دسته‌بندی خدمات زیبایی
            </h2>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-[#0057FF] hover:text-[#0044CC] inline-flex items-center gap-1"
          >
            <span>همه خدمات</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div
          ref={categoryScrollRef}
          data-no-swipe="true"
          className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth"
        >
          <Link
            to="/search"
            className="w-24 h-24 sm:w-28 sm:h-28 aspect-square shrink-0 rounded-2xl bg-gradient-to-br from-[#061138] to-[#0057FF] text-white p-2.5 flex flex-col items-center justify-center text-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#38BDF8]" />
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold leading-tight line-clamp-1">
              همه خدمات
            </span>
          </Link>

          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/search?category=${cat.slug}`}
              className="w-24 h-24 sm:w-28 sm:h-28 aspect-square shrink-0 rounded-2xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] p-2.5 flex flex-col items-center justify-center text-center gap-2 shadow-2xs hover:shadow-sm transition-all group active:scale-95"
            >
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EFF6FF] group-hover:bg-[#0057FF] flex items-center justify-center transition-colors">
                <span className="group-hover:[&_svg]:!text-white transition-colors">
                  {CATEGORY_ICON_MAP[cat.iconName] ?? (
                    <Sparkles className="w-4 h-4 text-[#0057FF]" />
                  )}
                </span>
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold text-[#061138] group-hover:text-[#0057FF] leading-tight line-clamp-1 transition-colors">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ۲. بخش پیشنهادهای ویژه (Special Offers) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#0057FF]">
              تخفیف‌ها و پکیج‌های فصلی اصفهان
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#061138]">
              پیشنهادهای ویژه رزرو آنلاین
            </h2>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-[#0057FF] hover:text-[#0044CC] inline-flex items-center gap-1"
          >
            <span>همه پیشنهادها</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div
            className={`${
              sortedHomeSalons.length > 1 &&
              homeBannerSecondary &&
              homeBannerSecondary.id !== homeBannerPrimary?.id
                ? 'lg:col-span-7'
                : 'lg:col-span-12'
            } relative rounded-3xl overflow-hidden bg-gradient-to-l from-[#061138] via-[#0A2568] to-[#0057FF] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_18px_45px_-18px_rgba(0,87,255,0.35)]`}
          >
            <div className="space-y-3.5 max-w-md z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-extrabold text-[#00E5FF]">
                <Percent className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>
                  {homeBannerPrimary?.sponsoredLabel ||
                    'تا ۲۵٪ تخفیف ویژه رزرو آنلاین'}
                </span>
              </span>
              <h3 className="text-lg sm:text-2xl font-extrabold leading-snug">
                {homeBannerPrimary
                  ? `${homeBannerPrimary.name} (${homeBannerPrimary.neighborhood})`
                  : 'پکیج تخصصی احیا، پروتئین‌تراپی و استایل مو در رویال گلزار'}
              </h3>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                {homeBannerPrimary?.shortDescription ||
                  'همراه با مشاوره رایگان سلامت مو و تضمین استفاده از مواد اورجینال در نوبت‌های صبح و عصر.'}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <Link
                  to={
                    homeBannerPrimary
                      ? `/salon/${homeBannerPrimary.slug}`
                      : '/salon/royal-golzar'
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00E5FF] text-[#061138] hover:bg-white text-xs sm:text-sm font-extrabold transition-colors shadow-sm"
                >
                  <span>مشاهده پروفایل سالن</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                {homeBannerPrimary ? (
                  <span className="text-xs font-bold text-slate-200 tabular-nums">
                    شروع تعرفه از:{' '}
                    {formatPriceToman(homeBannerPrimary.startingPriceToman)}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden border-2 border-white/25 shrink-0 shadow-lg">
              <img
                src={
                  homeBannerPrimary?.avatarUrl ||
                  getBeautyPhotoUrl('رویال گلزار', 'مو و رنگ')
                }
                alt={homeBannerPrimary?.name || 'پکیج استایل و احیای مو'}
                loading="lazy"
                decoding="async"
                width={176}
                height={176}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {sortedHomeSalons.length > 1 &&
          homeBannerSecondary &&
          homeBannerSecondary.id !== homeBannerPrimary?.id ? (
            <div className="lg:col-span-5 rounded-3xl border border-[#CBD5E1] bg-white p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-xs font-extrabold">
                    {homeBannerSecondary.sponsoredLabel ||
                      'پیشنهاد ویژه · رزرو آنی'}
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#061138] leading-snug">
                    {`${homeBannerSecondary.name} · ${homeBannerSecondary.neighborhood}`}
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed line-clamp-2">
                    {homeBannerSecondary.shortDescription}
                  </p>
                </div>
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#CBD5E1] shadow-sm shrink-0">
                  <img
                    src={
                      homeBannerSecondary.avatarUrl ||
                      getBeautyPhotoUrl(homeBannerSecondary.name, 'پوست و فیشیال')
                    }
                    alt={homeBannerSecondary.name}
                    loading="lazy"
                    decoding="async"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#475569] font-semibold block">
                    شروع تعرفه خدمات
                  </span>
                  <span className="text-sm font-extrabold text-[#0057FF] tabular-nums">
                    {formatPriceToman(homeBannerSecondary.startingPriceToman)}
                  </span>
                </div>
                <Link
                  to={`/salon/${homeBannerSecondary.slug}`}
                  className="px-4 py-2 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.4)]"
                >
                  <span>مشاهده سالن</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {extraSponsoredSalons.length > 0 ? (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#061138]">
                سایر سالن‌های دارای پیشنهاد ویژه (ورق بزنید)
              </span>
              <span className="text-[11px] font-semibold text-[#475569]">
                نمایش چرخشی عادلانه ←
              </span>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 no-scrollbar">
              {extraSponsoredSalons.map((sponBiz) => (
                <Link
                  key={sponBiz.id}
                  to={`/salon/${sponBiz.slug}`}
                  className="w-[270px] sm:w-[310px] shrink-0 snap-start rounded-2xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] p-3.5 flex items-center gap-3 shadow-2xs transition-all"
                >
                  <img
                    src={
                      sponBiz.avatarUrl ||
                      getBeautyPhotoUrl(sponBiz.name, sponBiz.typeLabel)
                    }
                    alt={sponBiz.name}
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[10px] font-extrabold">
                      {sponBiz.sponsoredLabel || 'پیشنهاد ویژه'}
                    </span>
                    <p className="text-xs font-extrabold text-[#061138] truncate">
                      {sponBiz.name}
                    </p>
                    <p className="text-[11px] text-[#475569] truncate">
                      {sponBiz.neighborhood} · ★{' '}
                      {toPersianDigits(sponBiz.rating)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ۳. بخش متخصصان برجسته (Pro Care) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#0057FF] mb-1">
              انتخاب مستقیم متخصص (Pro Care)
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#061138]">
              متخصصان زیبایی، پوست و پیرایش اصفهان
            </h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0057FF] hover:text-[#0044CC] transition-colors shrink-0"
          >
            <span>مشاهده همه متخصصان</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'ALL', label: 'همه متخصصان' },
              { id: 'hair', label: 'مو و رنگ' },
              { id: 'skin', label: 'پوست و میکاپ' },
              { id: 'nails', label: 'ناخن و مژه' },
              { id: 'men', label: 'پیرایش مردانه' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProSpecialtyFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  proSpecialtyFilter === tab.id
                    ? 'bg-[#0057FF] text-white shadow-2xs'
                    : 'bg-white border border-[#CBD5E1] text-[#334155] hover:text-[#061138]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="sm:hidden text-[11px] font-semibold text-[#475569] shrink-0">
            ورق بزنید ←
          </span>
        </div>

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 no-scrollbar">
          {filteredProfessionals.map((sp) => (
            <div
              key={sp.id}
              className="w-[215px] sm:w-auto shrink-0 snap-start"
            >
              <ProfessionalCard
                specialist={sp}
                isFavorite={favoriteSpecialistIds.includes(sp.id)}
                onToggleFavorite={toggleFavoriteSpecialist}
              />
            </div>
          ))}
        </div>

        {spotlightSpecialist && specialists.length > 1 ? (
          <div className="rounded-3xl border border-[#CBD5E1] bg-white p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center shadow-xs">
            <div className="lg:col-span-4 relative h-48 sm:h-60 rounded-2xl overflow-hidden">
              <img
                src={getSpecialistAvatarUrl(
                  spotlightSpecialist.fullName,
                  spotlightSpecialist.roleTitle
                )}
                alt={spotlightSpecialist.fullName}
                loading="lazy"
                decoding="async"
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061138]/85 via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => toggleFavoriteSpecialist(spotlightSpecialist.id)}
                aria-label="افزودن متخصص منتخب به علاقه‌مندی‌ها"
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isSpotlightFav
                      ? 'text-[#0057FF] fill-[#0057FF]'
                      : 'text-[#061138]'
                  }`}
                />
              </button>
              <div className="absolute bottom-3 inset-x-4 text-white flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold">
                    {spotlightSpecialist.fullName}
                  </p>
                  <p className="text-[11px] text-white/80">
                    {spotlightSpecialist.roleTitle}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tabular-nums">
                  <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>{toPersianDigits(spotlightSpecialist.rating)}</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-xs font-bold">
                  منتخب ماه مراجعان اصفهان
                </span>
                <span className="text-xs text-[#475569] tabular-nums">
                  {toPersianDigits(spotlightSpecialist.experienceYears)} سال
                  سابقه تخصصی · {spotlightSpecialist.city}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-extrabold text-[#061138]">
                تجربه خدمات تخصصی با {spotlightSpecialist.fullName} (
                {spotlightSpecialist.roleTitle})
              </h3>
              <p className="text-xs sm:text-sm text-[#334155] leading-relaxed line-clamp-2 sm:line-clamp-none">
                {spotlightSpecialist.bio}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {spotlightSpecialist.specialties.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#CBD5E1] text-[11px] font-semibold text-[#334155]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/pro/${spotlightSpecialist.slug}`}
                  className="px-5 py-2.5 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <span>مشاهده پروفایل و تقویم آزاد</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* ۴. سالن‌ها و مراکز منتخب اصفهان */}
      <section id="home-salons-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#0057FF] mb-1">
              رزرو مستقیم در برترین مراکز اصفهان
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#061138]">
              سالن‌های زیبایی، مراکز لیزر و آرایشگاه‌های منتخب
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0057FF] hover:text-[#0044CC] transition-colors shrink-0"
            >
              <span>همه سالن‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-white border border-[#CBD5E1] shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'همه سالن‌ها (خانم و آقا)' },
              {
                id: 'FEMALE',
                label: 'خانم (سالن‌های بانوان)',
              },
              {
                id: 'MALE',
                label: 'آقا (پیرایش آقایان)',
              },
            ].map((gTab) => (
              <button
                key={gTab.id}
                type="button"
                onClick={() =>
                  setGenderAudienceFilter(
                    gTab.id as 'ALL' | 'FEMALE' | 'MALE'
                  )
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  genderAudienceFilter === gTab.id
                    ? 'bg-[#0057FF] text-white shadow-2xs'
                    : 'bg-[#F3F6FC] text-[#334155] hover:bg-[#E0ECFF]'
                }`}
              >
                {gTab.label}
              </button>
            ))}
          </div>
          {genderFilteredHomeSalons.length === 0 &&
          genderAudienceFilter !== 'ALL' ? (
            <span className="text-[11px] font-bold text-[#D97706] px-2">
              در حال حاضر همه مراکز فعال نمایش داده می‌شوند
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredBusinesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              isFavorite={favoriteBusinessIds.includes(biz.id)}
              onToggleFavorite={toggleFavoriteBusiness}
            />
          ))}
        </div>
      </section>

      {/* ۵. پرسش‌های متداول */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-bold text-[#0057FF]">پاسخ به سوالات رایج</p>
          <h2 className="text-xl font-extrabold text-[#061138]">
            پرسش‌های متداول درباره رزرو نوبت
          </h2>
          <p className="text-xs text-[#475569] leading-relaxed">
            برای راهنمایی بیشتر می‌توانید به بخش پشتیبانی و راهنما مراجعه کنید.
          </p>
          <div className="pt-2">
            <Link to="/help">
              <Button variant="outline" size="sm">
                مرکز راهنما و پشتیبانی
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-3">
          {homeFaqs.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-right flex items-center justify-between gap-4 text-sm font-bold text-[#061138] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#475569] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#0057FF]' : ''
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-[#334155] leading-relaxed border-t border-[#E2E8F0] pt-3">
                    {item.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
