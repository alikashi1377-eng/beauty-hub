import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  Check,
  Sparkles,
  Gem,
  Scissors,
  Droplets,
  Eye,
  UserCheck,
  Award,
  HeartHandshake,
  CalendarCheck,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronsDown,
  ArrowUpDown,
  Zap,
  MapPin,
  Clock,
  Percent,
  Heart,
  X,
} from 'lucide-react';
const TIMETO_HERO_SPA_WEBP_URL = '/assets/beauty/timeto-hero-spa.webp';
import { IRAN_CITIES, ISFAHAN_NEIGHBORHOODS } from '../../mocks/sampleData';
import { BusinessType } from '../../types';
import {
  computeFairRotationScore,
  filterBusinesses,
  formatPriceToman,
  SortOption,
  toPersianDigits,
} from '../../utils/formatters';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormField } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  VisualMediaIllustration,
  getBeautyPhotoUrl,
  getSpecialistAvatarUrl,
} from '../../components/ui/VisualMediaIllustration';
import { EmptyState } from '../../components/ui/StateViews';
import {
  BusinessCard,
  ProfessionalCard,
} from '../../components/ui/MarketplaceComponents';

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

/** ۱-الف. صفحه اصلی مشتریان (پس از انتخاب نقش مشتری در صفحه ورود) */
const OriginalCustomerHomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    authUser,
    ownedBusinessId,
    openAuthModal,
    businesses,
    services,
    specialists,
    categories,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
    favoriteSpecialistIds,
    toggleFavoriteSpecialist,
  } = usePrototypeData();

  const isLoggedInCustomerOnly = Boolean(
    authUser &&
      !ownedBusinessId &&
      !authUser.roles.includes('BUSINESS_OWNER') &&
      !authUser.isPlatformAdmin
  );

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [proSpecialtyFilter, setProSpecialtyFilter] = useState<string>('ALL');
  const [genderAudienceFilter, setGenderAudienceFilter] = useState<
    'ALL' | 'FEMALE' | 'MALE'
  >('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const smartSearchSuggestions = [
    'لیزر موهای زائد',
    'چهارباغ بالا',
    'مرداویج',
    'عروس و گریم VIP',
    'داماد و پیرایش VIP',
    'پروتئین‌تراپی مو',
    'فیشیال تخصصی پوست',
    'کاشت و لمینت ناخن',
  ];

  const [isAjaxSearching, setIsAjaxSearching] = useState(false);
  const normalizedQuery = searchKeyword.trim().toLowerCase();

  useEffect(() => {
    if (!normalizedQuery) {
      setIsAjaxSearching(false);
      return;
    }
    setIsAjaxSearching(true);
    const timer = window.setTimeout(() => {
      setIsAjaxSearching(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [normalizedQuery]);

  const smartMatchedCategories = normalizedQuery
    ? categories
        .filter(
          (cat) =>
            cat.title.toLowerCase().includes(normalizedQuery) ||
            cat.subtitle.toLowerCase().includes(normalizedQuery) ||
            cat.slug.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, 3)
    : [];

  const smartMatchedNeighborhoods = normalizedQuery
    ? ISFAHAN_NEIGHBORHOODS.filter((nb) =>
        nb.toLowerCase().includes(normalizedQuery)
      ).slice(0, 3)
    : [];

  const smartMatchedSalons = normalizedQuery
    ? businesses
        .filter(
          (b) =>
            b.approvalStatus !== 'REJECTED' &&
            (b.name.toLowerCase().includes(normalizedQuery) ||
              b.neighborhood.toLowerCase().includes(normalizedQuery) ||
              b.typeLabel.toLowerCase().includes(normalizedQuery) ||
              b.shortDescription.toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 6)
    : [];

  const smartMatchedSpecialists = normalizedQuery
    ? specialists
        .filter(
          (sp) =>
            sp.fullName.toLowerCase().includes(normalizedQuery) ||
            sp.roleTitle.toLowerCase().includes(normalizedQuery) ||
            sp.specialties.some((s) =>
              s.toLowerCase().includes(normalizedQuery)
            )
        )
        .slice(0, 3)
    : [];

  const smartMatchedServices = normalizedQuery
    ? services
        .filter(
          (srv) =>
            srv.isActive !== false &&
            (srv.title.toLowerCase().includes(normalizedQuery) ||
              srv.category.toLowerCase().includes(normalizedQuery) ||
              srv.description.toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 4)
    : [];

  const hasSmartResults =
    smartMatchedCategories.length > 0 ||
    smartMatchedNeighborhoods.length > 0 ||
    smartMatchedSalons.length > 0 ||
    smartMatchedSpecialists.length > 0 ||
    smartMatchedServices.length > 0;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('q', searchKeyword.trim());
    navigate(`/search?${params.toString()}`);
  };

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

  // اگر در فیلتر جنسیت انتخاب‌شده هنوز سالنی ثبت نشده بود، همه سالن‌ها نمایش داده شوند تا صفحه خالی نماند
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
    const interval = window.setInterval(() => {
      if (!el || document.hidden) return;
      window.requestAnimationFrame(() => {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 10) return;
        const current = Math.abs(el.scrollLeft);
        if (current >= maxScroll - 8) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: -120, behavior: 'smooth' });
        }
      });
    }, 4500);
    return () => window.clearInterval(interval);
  }, [isCatScrollPaused, categories.length]);

  return (
    <div className="space-y-7 sm:space-y-10">
      {/* ۱. بخش Hero صفحه اصلی — ارتفاع 100vh در موبایل، بدون بردر ردیوس در موبایل، و بخش ویژگی‌ها با پس‌زمینه کاملاً شفاف */}
      <section className="relative overflow-hidden -mx-3.5 -mt-4 rounded-none sm:mx-0 sm:mt-0 sm:rounded-[32px] border-b sm:border border-[#0057FF]/25 bg-[#04123B] shadow-[0_20px_50px_-16px_rgba(4,14,46,0.55)] h-[calc(100dvh-56px)] min-h-[calc(100vh-56px)] sm:h-auto sm:min-h-[480px] flex flex-col justify-between">
        {/* تصویر پس‌زمینه اسپا بدون تداخل رنگ آبی روی تصویر چهره (۲۴ کیلوبایت WebP با Preload مستقیم در HTML) */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src={TIMETO_HERO_SPA_WEBP_URL}
            alt="رزرو آنلاین خدمات زیبایی و مراقبت فردی در تایم تو"
            width={1080}
            height={1080}
            fetchPriority="high"
            decoding="async"
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

        {/* محتوای اصلی راست‌چین شده با جایگاه پایین‌تر برای تیتر و دکمه */}
        <div className="relative z-20 px-4 pt-20 pb-20 sm:px-10 sm:pt-20 sm:pb-6 flex flex-col justify-between flex-1 gap-4">
          <div className="max-w-md mr-0 ml-auto text-right mt-8 sm:mt-6 space-y-4 sm:space-y-5">
            <div className="space-y-2.5">
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

              <p className="pt-2 text-xs sm:text-sm lg:text-base text-white/95 font-semibold leading-relaxed max-w-xs sm:max-w-sm drop-shadow-xs">
                رزرو آنلاین خدمات زیبایی
                <br />
                و مراقبت فردی در بهترین سالن‌ها
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
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
                  <span className="text-[11px] text-[#64748B] block">
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

        {/* کروسل افقی چرخشی برای زمانی که بیش از ۲ سالن بسته جایگاه ویژه خریداری کرده‌اند (تا ۲۰+ سالن بدون شلوغ شدن صفحه اول دیده شوند) */}
        {extraSponsoredSalons.length > 0 ? (
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#061138]">
                سایر سالن‌های دارای پیشنهاد ویژه (ورق بزنید)
              </span>
              <span className="text-[11px] font-semibold text-[#64748B]">
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
                    className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[10px] font-extrabold">
                      {sponBiz.sponsoredLabel || 'پیشنهاد ویژه'}
                    </span>
                    <p className="text-xs font-extrabold text-[#061138] truncate">
                      {sponBiz.name}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate">
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
          <span className="sm:hidden text-[11px] font-semibold text-[#64748B] shrink-0">
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
                width={320}
                height={240}
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
                <span className="text-xs text-[#64748B] tabular-nums">
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

        {/* نوار هوشمند تفکیک جنسیت سالن‌ها (نمایش پیش‌فرض بر اساس جنسیت کاربر + قابلیت تغییر ۱ کلیکی بین خانم، آقا و همه) */}
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

      {/* ۵. پرسش‌های متداول (ثبت کسب‌وکار از طریق فوتر در دسترس است) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-bold text-[#0057FF]">پاسخ به سوالات رایج</p>
          <h2 className="text-xl font-extrabold text-[#061138]">
            پرسش‌های متداول درباره رزرو نوبت
          </h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
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
                    className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform ${
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

/** ۱. صفحه اول (/) — نمایش مستقیم صفحه اصلی بدون صفحه اینترو */
export const HomePage: React.FC = () => {
  return <OriginalCustomerHomePage />;
};

/** ۲. صفحه جست‌وجوی هوشمند سالن و متخصص (/search) */
export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    businesses,
    services,
    specialists,
    categories,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
    favoriteSpecialistIds,
    toggleFavoriteSpecialist,
  } = usePrototypeData();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get('category') ?? 'ALL'
  );
  const [typeFilter, setTypeFilter] = useState<BusinessType | 'ALL'>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(10000000);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get('q');
    const catParam = searchParams.get('category');
    if (qParam !== null) setQuery(qParam);
    if (catParam !== null) setCategoryFilter(catParam);
  }, [searchParams]);

  // جست‌وجوی هوشمند: علاوه بر نام سالن، اگر نام خدمت یا متخصص با عبارت جست‌وجو همخوانی داشت سالن مربوطه هم برگردانده شود
  const normalizedQ = query.trim().toLowerCase();
  const businessIdsMatchingServicesOrStaff = React.useMemo(() => {
    if (!normalizedQ) return new Set<string>();
    const ids = new Set<string>();
    services.forEach((s) => {
      if (
        s.title.toLowerCase().includes(normalizedQ) ||
        s.category.toLowerCase().includes(normalizedQ)
      ) {
        ids.add(s.businessId);
      }
    });
    specialists.forEach((sp) => {
      if (
        sp.fullName.toLowerCase().includes(normalizedQ) ||
        sp.roleTitle.toLowerCase().includes(normalizedQ) ||
        sp.specialties.some((item) => item.toLowerCase().includes(normalizedQ))
      ) {
        ids.add(sp.businessId);
      }
    });
    return ids;
  }, [normalizedQ, services, specialists]);

  // اگر کاربر دسته‌بندی خاصی انتخاب کرد، سالن‌هایی که یا دسته‌شان آن است یا خدمتی در آن دسته دارند نمایش داده شوند
  const businessIdsMatchingSelectedCategory = React.useMemo(() => {
    if (categoryFilter === 'ALL') return null;
    const ids = new Set<string>();
    services.forEach((s) => {
      if (s.categorySlug === categoryFilter) {
        ids.add(s.businessId);
      }
    });
    return ids;
  }, [categoryFilter, services]);

  const baseFiltered = filterBusinesses(businesses, {
    query: '',
    type: typeFilter,
    city: 'ALL',
    neighborhood: 'ALL',
    categorySlug: 'ALL',
    maxPriceToman: maxPrice,
    minRating: 0,
    sortBy,
  }).filter((b) => {
    if (categoryFilter === 'ALL') return true;
    return (
      b.categorySlug === categoryFilter ||
      Boolean(businessIdsMatchingSelectedCategory?.has(b.id))
    );
  });

  const filtered = normalizedQ
    ? baseFiltered.filter(
        (b) =>
          (b.name || '').toLowerCase().includes(normalizedQ) ||
          (b.neighborhood || '').toLowerCase().includes(normalizedQ) ||
          (b.shortDescription || '').toLowerCase().includes(normalizedQ) ||
          (b.typeLabel || '').toLowerCase().includes(normalizedQ) ||
          businessIdsMatchingServicesOrStaff.has(b.id)
      )
    : baseFiltered;

  const matchedSpecialistsInSearch = normalizedQ
    ? specialists.filter(
        (sp) =>
          sp.fullName.toLowerCase().includes(normalizedQ) ||
          sp.roleTitle.toLowerCase().includes(normalizedQ) ||
          sp.specialties.some((s) => s.toLowerCase().includes(normalizedQ))
      )
    : [];

  const handleResetFilters = () => {
    setQuery('');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setMaxPrice(10000000);
    setSortBy('recommended');
    setSearchParams({});
  };

  const finalFiltered = filtered;
  const hasActiveFilters =
    Boolean(query.trim()) ||
    categoryFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    maxPrice < 10000000;

  return (
    <div className="space-y-4">
      {/* ۱. باکس جست‌وجوی بالا با آیکون مینیمال فیلتر در کنار آن */}
      <div className="bg-white p-3 sm:p-3.5 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] focus-within:border-[#0057FF] focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 text-[#0057FF] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی سالن، مرکز لیزر، متخصص یا خدمت..."
              aria-label="جست‌وجوی سالن، متخصص یا خدمت"
              className="w-full text-xs sm:text-sm font-medium text-[#061138] placeholder:text-[#64748B] bg-transparent focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="پاک کردن جست‌وجو"
                className="p-1 rounded-full hover:bg-[#E2E8F0] text-[#64748B] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* دکمه آیکونی فیلتر قیمت و نوع مرکز */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen((p) => !p)}
            aria-label="فیلتر نتایج"
            title="فیلتر سقف تعرفه و نوع مرکز"
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              mobileFilterOpen || maxPrice < 10000000 || typeFilter !== 'ALL'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-2xs'
                : 'bg-[#F8FAFC] text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* پنل تاشو و مینیمال فیلتر (بدون امتیاز و بدون نام محله) */}
        {mobileFilterOpen ? (
          <div className="pt-3 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#475569] ml-1">
                مخاطب:
              </span>
              {[
                { id: 'ALL', label: 'همه مراکز' },
                { id: BusinessType.WomenSalon, label: 'بانوان' },
                { id: BusinessType.MenBarbershop, label: 'آقایان' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTypeFilter(item.id as BusinessType | 'ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                    typeFilter === item.id
                      ? 'bg-[#0057FF] text-white'
                      : 'bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#475569]">سقف تعرفه پایه:</span>
                <span className="font-extrabold text-[#0057FF] tabular-nums">
                  {maxPrice >= 10000000
                    ? 'بدون محدودیت قیمت'
                    : `تا ${formatPriceToman(maxPrice)}`}
                </span>
              </div>
              <input
                id="filter-price"
                type="range"
                min={250000}
                max={10000000}
                step={250000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#0057FF] cursor-pointer"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* ۲. نوار افقی و مینیمال دسته‌بندی خدمات (با آیکون و نوشته و اسکرول افقی، بالای کارت‌ها و پروفایل‌ها) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setCategoryFilter('ALL');
            setTypeFilter('ALL');
          }}
          className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all inline-flex items-center gap-1.5 border shrink-0 ${
            categoryFilter === 'ALL'
              ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-2xs'
              : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#0057FF]'
          }`}
        >
          <Sparkles
            className={`w-3.5 h-3.5 ${
              categoryFilter === 'ALL' ? 'text-white' : 'text-[#0057FF]'
            }`}
          />
          <span>همه خدمات</span>
        </button>

        {categories.map((cat) => {
          const isSelected = categoryFilter === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.slug)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all inline-flex items-center gap-1.5 border shrink-0 ${
                isSelected
                  ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-2xs'
                  : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#0057FF]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/95 flex items-center justify-center shrink-0">
                {CATEGORY_ICON_MAP[cat.iconName] ?? (
                  <Sparkles className="w-3 h-3 text-[#0057FF]" />
                )}
              </span>
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* ۳. نمایش تعداد مراکز فعال (سمت راست) و آیکون کوچک مرتب‌سازی (سمت چپ) + لیست کارت‌ها */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-1 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <span>
              نمایش{' '}
              <strong className="font-extrabold text-[#061138] tabular-nums">
                {toPersianDigits(finalFiltered.length)}
              </strong>{' '}
              مرکز فعال
            </span>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="font-extrabold text-[#0057FF] hover:underline cursor-pointer"
              >
                پاک کردن فیلترها ✕
              </button>
            ) : null}
          </div>

          {/* آیکون کوچک و انتخابگر مینیمال مرتب‌سازی در سمت چپ */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[#061138] shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#0057FF] shrink-0" />
            <select
              id="sort-select"
              aria-label="مرتب‌سازی نتایج"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-[11px] sm:text-xs font-extrabold text-[#061138] focus:outline-none cursor-pointer"
            >
              <option value="recommended">پیشنهادی</option>
              <option value="rating_desc">محبوب‌ترین</option>
              <option value="price_asc">مناسب‌ترین قیمت</option>
            </select>
          </div>
        </div>

        {matchedSpecialistsInSearch.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-[#1E1B2E]">
              متخصصان مرتبط با جست‌وجوی شما (
              {toPersianDigits(matchedSpecialistsInSearch.length)})
            </h3>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 no-scrollbar">
              {matchedSpecialistsInSearch.map((sp) => (
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
          </div>
        ) : null}

        {finalFiltered.length === 0 ? (
          <EmptyState
            title="مرکزی مطابق با فیلترهای انتخابی شما یافت نشد"
            description="پیشنهاد می‌کنیم روی «همه خدمات» کلیک کنید تا تمام مراکز فعال نمایش داده شوند."
            actionLabel="نمایش همه مراکز"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {finalFiltered.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                compact
                isFavorite={favoriteBusinessIds.includes(biz.id)}
                onToggleFavorite={toggleFavoriteBusiness}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/** ۳. صفحه دسته‌بندی خدمات (/categories) — طراحی جمع‌وجور ۲ ستونه در موبایل */
export const CategoriesPage: React.FC = () => {
  const { categories } = usePrototypeData();

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        kicker="طبقه‌بندی خدمات زیبایی"
        title="دسته‌بندی‌های خدمات زیبایی، عروس، داماد و پیرایش"
        subtitle="لاین خدمتی مورد نظر خود را انتخاب کنید تا سالن‌ها و متخصصان فعال آن حوزه را ببینید."
        breadcrumbs={[
          { label: 'صفحه اصلی', href: '/' },
          { label: 'دسته‌بندی خدمات' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {categories.map((category) => {
          const catImg = getBeautyPhotoUrl(category.title, category.subtitle);
          return (
            <Link
              key={category.id}
              to={`/search?category=${category.slug}`}
              className="group rounded-2xl sm:rounded-3xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] shadow-2xs hover:shadow-md overflow-hidden flex flex-col justify-between transition-all"
            >
              {/* تصویر تمیز بدون شلوغی نوشته روی عکس */}
              <div className="relative h-24 sm:h-32 overflow-hidden bg-[#E0ECFF]">
                <img
                  src={catImg}
                  alt={category.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-extrabold text-[#0057FF] tabular-nums shadow-2xs">
                  {toPersianDigits(category.serviceCount)} خدمت
                </span>
              </div>

              {/* عنوان و آیکون خوانا روی پس‌زمینه سفید پایین کارت */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2 bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#EFF6FF] border border-[#CBD5E1] text-[#0057FF] flex items-center justify-center shrink-0">
                      {CATEGORY_ICON_MAP[category.iconName] ?? (
                        <Sparkles className="w-3.5 h-3.5 text-[#0057FF]" />
                      )}
                    </span>
                    <h2 className="text-xs sm:text-sm font-black text-[#061138] group-hover:text-[#0057FF] transition-colors leading-snug">
                      {category.title}
                    </h2>
                  </div>
                  <p className="hidden sm:block text-xs text-[#475569] line-clamp-2 leading-relaxed">
                    {category.subtitle}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] font-extrabold text-[#0057FF]">
                  <span>مشاهده سالن‌ها</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

/** ۴. صفحه پلن‌های کسب‌وکار (/pricing) */
export const PricingPage: React.FC = () => {
  const { plans } = usePrototypeData();

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="ویژه مدیران سالن و متخصصان"
        title="پلن‌های اشتراک و پنل مدیریت کسب‌وکار Timeto"
        subtitle="ثبت‌نام اولیه و راه‌اندازی ویترین آنلاین سالن کاملاً رایگان است. هر زمان که به پیامک یادآور خودکار، تقویم چندمتخصصه و جایگاه ویژه در جست‌وجو نیاز داشتید، پلن خود را ارتقا دهید."
        breadcrumbs={[
          { label: 'صفحه اصلی', href: '/' },
          { label: 'تعرفه کسب‌وکارها' },
        ]}
      />

      {/* بخش ارزش خرید: چرا ارتقا به پلن حرفه‌ای ارزش دارد؟ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#CBD5E1] shadow-2xs space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-extrabold">
            <CalendarCheck className="w-4 h-4" />
            <span>کاهش ۷۰٪ کنسلی و عدم حضور</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
            پیامک تایید و یادآور خودکار به مشتری
          </h2>
          <p className="text-xs text-[#334155] leading-relaxed">
            با ارسال خودکار پیامک در لحظه رزرو و ۲۴ ساعت قبل از نوبت، تایم‌های
            خالی و فراموشی نوبت مشتریان به حداقل می‌رسد.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#CBD5E1] shadow-2xs space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-xs font-extrabold">
            <TrendingUp className="w-4 h-4" />
            <span>۲.۴ برابر جذب مشتری جدید</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
            اولویت نمایش در نتایج جست‌وجوی اصفهان
          </h2>
          <p className="text-xs text-[#334155] leading-relaxed">
            سالن‌های دارای پلن حرفه‌ای و VIP با نشان تایید ویژه در صدر نتایج
            جست‌وجوی محله و خدمات به مراجعان نمایش داده می‌شوند.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#CBD5E1] shadow-2xs space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#D97706] text-xs font-extrabold">
            <ShieldCheck className="w-4 h-4" />
            <span>نظم مالی و تقویم چندمتخصصه</span>
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
            تقویم مجزا برای هر لاین و پرسنل
          </h2>
          <p className="text-xs text-[#334155] leading-relaxed">
            بدون تداخل ساعت کاری، برای هر متخصص تقویم مجزا، پرونده وفاداری
            مشتریان و گزارش سهم درآمدی دقیق داشته باشید.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`rounded-3xl flex flex-col justify-between space-y-6 ${
              plan.isRecommended
                ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/15'
                : ''
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[#1E1B2E]">
                  {plan.name}
                </h2>
                {plan.isRecommended ? (
                  <span className="px-3 py-1 rounded-full bg-[#EDE9FE] text-xs font-bold text-[#8B5CF6]">
                    پیشنهاد ویژه سالن‌ها
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[#6B6480] leading-relaxed">
                {plan.audience}
              </p>

              <div className="pt-2 pb-4 border-b border-[#E6E0F5]">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1E1B2E] tabular-nums">
                  {formatPriceToman(plan.monthlyPriceToman)}
                </span>
                <span className="text-xs text-[#6B6480] mr-1.5">
                  {plan.monthlyPriceToman > 0 ? '/ ماهانه' : ' (همیشگی)'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#6B6480]">
                <div className="flex justify-between py-1.5 border-b border-[#F3EEFF]">
                  <span className="text-[#6B6480]">ظرفیت تقویم متخصصان:</span>
                  <span className="font-bold text-[#1E1B2E]">
                    {plan.staffLimit}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F3EEFF]">
                  <span className="text-[#6B6480]">سهمیه پیامک یادآور:</span>
                  <span className="font-bold text-[#1E1B2E] tabular-nums">
                    {toPersianDigits(plan.smsQuotaMonthly)} پیامک در ماه
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 pt-2">
                {plan.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-[#1E1B2E]"
                  >
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link to="/business/register">
              <Button
                variant={plan.isRecommended ? 'primary' : 'outline'}
                fullWidth
              >
                انتخاب و شروع با {plan.name}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-[#1E1B2E]">
            مقایسه امکانات مدیریتی پلن‌ها
          </h2>
          <p className="text-xs text-[#6B6480]">
            جزئیات سقف نوبت‌دهی، پیامک یادآور و سطح گزارش‌های مالی
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-right border-collapse">
            <thead>
              <tr className="border-b border-[#E6E0F5] bg-[#FAF8FF] text-[#6B6480]">
                <th className="py-3.5 px-4 font-bold">قابلیت / ظرفیت</th>
                {plans.map((p) => (
                  <th key={p.id} className="py-3.5 px-4 font-bold text-[#1E1B2E]">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0F5]">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#6B6480]">
                  سقف نوبت‌دهی آنلاین
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#1E1B2E] font-medium">
                    {p.comparison.onlineBooking}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#6B6480]">
                  بسته پیامک یادآور خودکار
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#1E1B2E] font-medium">
                    {p.comparison.smsReminders}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#6B6480]">
                  سطح گزارش‌ها و آمار مالی
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#1E1B2E] font-medium">
                    {p.comparison.analyticsLevel}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#6B6480]">
                  پشتیبانی و راه‌اندازی
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#1E1B2E] font-medium">
                    {p.comparison.supportType}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* بخش جایگاه‌های تبلیغاتی و ارتقای جایگاه سالن‌ها (مستقل از حق اشتراک ماهانه) */}
      <div className="rounded-3xl bg-[#061138] text-white p-6 sm:p-8 space-y-5 border border-[#1E293B]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00E5FF]">
              <Sparkles className="w-4 h-4" />
              <span>خدمات تبلیغاتی و رشد سریع سالن (قابل فعال‌سازی روی همه پلن‌ها)</span>
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              چگونه سالن خود را بالاتر از همه رقبا در صفحه اول و صدر جست‌وجوی اصفهان نمایش دهید؟
            </h2>
          </div>
          <Link to="/app/marketing">
            <Button variant="accent" size="sm">
              <span>ورود به پنل تبلیغات سالن ←</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] font-extrabold">
              ★ صدرنشینی در جست‌وجو
            </span>
            <h3 className="text-sm font-extrabold text-white">
              پین در ردیف اول نتایج جست‌وجو (/search)
            </h3>
            <p className="text-slate-200 leading-relaxed">
              نمایش تضمینی سالن شما در بالای فهرست جست‌وجوی خدمات و محله‌ها به همراه نشان «★ آگهی ویژه».
            </p>
            <p className="font-extrabold text-[#00E5FF] pt-1 tabular-nums">
              ۴۹۰,۰۰۰ تومان / ماهانه (یا ۱۹۰,۰۰۰ هفتگی)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] font-extrabold">
              ویترین صفحه اول
            </span>
            <h3 className="text-sm font-extrabold text-white">
              بنر اختصاصی در صفحه اول تایم تو
            </h3>
            <p className="text-slate-200 leading-relaxed">
              قرارگیری بنر تصویری بزرگ سالن شما در بخش «پیشنهادهای ویژه رزرو آنلاین» صفحه اصلی با ۳.۵ برابر بازدید بیشتر.
            </p>
            <p className="font-extrabold text-[#00E5FF] pt-1 tabular-nums">
              ۸۹۰,۰۰۰ تومان / ماهانه (یا ۳۵۰,۰۰۰ هفتگی)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-extrabold">
              بسته افزونه پیامک
            </span>
            <h3 className="text-sm font-extrabold text-white">
              بسته ۲۰۰ پیامک خدماتی و یادآور اضافه
            </h3>
            <p className="text-slate-200 leading-relaxed">
              شارژ فوری اعتبار پیامک سالن در هر زمان که سهمیه ماهانه پلن شما به پایان رسید.
            </p>
            <p className="font-extrabold text-emerald-300 pt-1 tabular-nums">
              ۱۸۰,۰۰۰ تومان / بسته ۲۰۰ عددی
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/** ۵. صفحه درباره ما (/about) */
export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-10">
      <PageHeader
        kicker="معرفی پلتفرم"
        title="درباره Timeto (تایم تو)"
        subtitle="پلتفرم تخصصی رزرو آنلاین خدمات زیبایی و مدیریت یکپارچه سالن‌ها، آرایشگاه‌ها و متخصصان در ایران"
        breadcrumbs={[{ label: 'صفحه اصلی', href: '/' }, { label: 'درباره ما' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-7 rounded-3xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#0057FF]">
              ماموریت Timeto (تایم تو)
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#061138]">
              ساده‌سازی رزرو نوبت برای مراجعان و نظم‌بخشی به تقویم سالن‌ها
            </h2>
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              پیدا کردن یک سالن زیبایی، آرایشگاه مردانه یا متخصص پوست مطمئن با
              تعرفه‌های شفاف و زمان‌های آزاد واقعی، نباید نیازمند تماس‌های مکرر
              تلفنی باشد. Timeto به مراجعان کمک می‌کند در هر ساعت از شبانه‌روز
              نوبت خود را رزرو کنند و به صاحبان سالن‌ها ابزارهای حرفه‌ای برای
              مدیریت تقویم، بیعانه و پرونده مشتریان می‌دهد.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E6E0F5] text-xs">
            <div>
              <p className="text-base font-extrabold text-[#8B5CF6]">تقویم شمسی</p>
              <p className="text-[#6B6480]">محاسبه دقیق ساعات کاری</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-[#8B5CF6]">تعرفه شفاف</p>
              <p className="text-[#6B6480]">نمایش قیمت و زمان هر خدمت</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-[#8B5CF6]">یادآور پیامکی</p>
              <p className="text-[#6B6480]">کاهش عدم حضور در نوبت‌ها</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-5">
          <VisualMediaIllustration
            theme="rose"
            composition="mirror"
            categoryLabel="تجربه مدرن رزرو"
            title="طراحی‌شده برای صنعت زیبایی ایران"
            subtitle="ترکیب ویترین آنلاین سالن و تقویم هوشمند"
            city="سراسر ایران"
            className="h-full min-h-[240px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl space-y-2.5">
          <h3 className="text-base font-extrabold text-[#1E1B2E]">
            برای مشتریان و مراجعان
          </h3>
          <p className="text-xs text-[#6B6480] leading-relaxed">
            مشاهده فهرست کامل خدمات، تعرفه به تومان، نمونه‌کارها و ثبت نوبت
            آنلاین با دریافت کد رهگیری.
          </p>
        </Card>

        <Card className="rounded-3xl space-y-2.5">
          <h3 className="text-base font-extrabold text-[#1E1B2E]">
            برای سالن‌های زیبایی
          </h3>
          <p className="text-xs text-[#6B6480] leading-relaxed">
            مدیریت تقویم چندین متخصص، تعریف ساعات کاری و استثنائات، و ثبت
            پرونده مراجعان در یک محیط ساده.
          </p>
        </Card>

        <Card className="rounded-3xl space-y-2.5">
          <h3 className="text-base font-extrabold text-[#1E1B2E]">
            برای متخصصان مستقل
          </h3>
          <p className="text-xs text-[#6B6480] leading-relaxed">
            صفحه پروفایل اختصاصی برای معرفی تخصص‌ها، نمایش نمونه‌کارها و پذیرش
            مستقیم نوبت از مراجعان.
          </p>
        </Card>
      </div>

      {/* نماد اعتماد الکترونیکی (اینماد) — فقط در صفحه درباره ما */}
      <Card className="rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#E2E8F0] bg-white">
        <div className="space-y-1.5 text-center sm:text-right">
          <p className="text-xs font-extrabold text-[#0057FF]">
            مجوز رسمی و نماد اعتماد الکترونیکی
          </p>
          <h3 className="text-base font-extrabold text-[#061138]">
            دارای نماد اعتماد الکترونیکی (اینماد) از مرکز توسعه تجارت الکترونیکی
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-xl">
            جهت استعلام اصالت و مشاهده شناسنامه نماد اعتماد الکترونیکی پلتفرم تایم تو (timeto24.ir)، روی لوگوی اینماد کلیک فرمایید.
          </p>
        </div>

        <div
          className="shrink-0 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 flex items-center justify-center min-w-[110px] min-h-[110px]"
          dangerouslySetInnerHTML={{
            __html: `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=8562558&Code=FIEVb8zLbqQlmNhZBm2EBXcZrZw4NCcp'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=8562558&Code=FIEVb8zLbqQlmNhZBm2EBXcZrZw4NCcp' alt='' style='cursor:pointer' code='FIEVb8zLbqQlmNhZBm2EBXcZrZw4NCcp'></a>`,
          }}
        />
      </Card>
    </div>
  );
};

/** ۶. صفحه راهنما و پشتیبانی (/help) */
export const HelpPage: React.FC = () => {
  const {
    authUser,
    currentBusiness,
    ownedBusinessId,
    supportTickets,
    submitSupportTicket,
  } = usePrototypeData();
  const [senderRole, setSenderRole] = useState<'CUSTOMER' | 'BUSINESS_OWNER'>(
    ownedBusinessId || authUser?.roles?.includes('BUSINESS_OWNER')
      ? 'BUSINESS_OWNER'
      : 'CUSTOMER'
  );
  const [senderName, setSenderName] = useState(
    authUser?.fullName || currentBusiness?.ownerName || ''
  );
  const [senderPhone, setSenderPhone] = useState(
    authUser?.phone || currentBusiness?.ownerPhone || ''
  );
  const [businessNameInput, setBusinessNameInput] = useState(
    currentBusiness?.name || ''
  );
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('پیگیری نوبت و رزرو مشتری');
  const [ticketMessage, setTicketMessage] = useState('');
  const [formError, setFormError] = useState('');

  const faqs = [
    {
      q: 'چگونه نوبت خود را در سالن یا نزد متخصص رزرو کنم؟',
      a: 'در صفحه جست‌وجو مرکز مورد نظر را انتخاب کنید، وارد پروفایل شوید و با کلیک روی «رزرو نوبت»، خدمت، متخصص، تاریخ و ساعت مراجعه را انتخاب نمایید.',
    },
    {
      q: 'قوانین پرداخت بیعانه و لغو نوبت به چه صورت است؟',
      a: 'در صورت فعال بودن بیعانه برای سالن، مبلغ بیعانه پیش از نهایی‌سازی نوبت به صورت شفاف نمایش داده می‌شود و مهلت لغو مجاز نیز در صفحه تایید درج می‌گردد.',
    },
    {
      q: 'چطور سالن زیبایی یا آرایشگاه خود را ثبت کنم؟',
      a: 'از طریق دکمه «ثبت سالن زیبایی» در بالای سایت، مشخصات سالن، خدمات، متخصصان و ساعات کاری خود را ثبت کنید تا صفحه اختصاصی شما پس از تایید منتشر شود.',
    },
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim() || !/^09\d{9}$/.test(senderPhone.trim())) {
      setFormError('لطفاً شماره موبایل ۱۱ رقمی خود را جهت دریافت پاسخ وارد کنید.');
      return;
    }
    if (!ticketTitle.trim() || !ticketMessage.trim()) {
      setFormError('لطفاً موضوع و شرح پیام خود را کامل وارد کنید.');
      return;
    }
    setFormError('');
    submitSupportTicket({
      senderRole,
      senderName: senderName.trim() || 'کاربر تایم تو',
      senderPhone: senderPhone.trim(),
      businessName:
        senderRole === 'BUSINESS_OWNER'
          ? businessNameInput.trim() || currentBusiness?.name || 'کسب‌وکار عضو'
          : undefined,
      categoryLabel: ticketCategory,
      subject: ticketTitle.trim(),
      message: ticketMessage.trim(),
    });
    setTicketTitle('');
    setTicketMessage('');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="پشتیبانی مستقیم و راهنمای کاربری"
        title="مرکز پشتیبانی، ثبت تیکت و پرسش‌های متداول"
        subtitle="ارتباط مستقیم با مدیریت پلتفرم Timeto، ثبت تیکت برای مشتریان و صاحبان سالن‌ها و دریافت پاسخ مستقیم"
        breadcrumbs={[{ label: 'صفحه اصلی', href: '/' }, { label: 'پشتیبانی و راهنما' }]}
      />

      {/* نوار ارتباط مستقیم تلفنی و اینستاگرام */}
      <div className="rounded-3xl bg-[#061138] text-white p-5 sm:p-6 border border-[#1E293B] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-extrabold text-[#00E5FF]">
            پشتیبانی تلفنی و صفحه رسمی اینستاگرام Timeto
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-white">
            نیاز به راهنمایی فوری برای ثبت سالن، ارتقای پلن یا پیگیری نوبت دارید؟
          </h2>
          <p className="text-xs text-slate-300">
            می‌توانید مستقیم با شماره پشتیبانی تماس بگیرید یا در تیکت زیر پیام بگذارید تا پاسخ مدیر را همین‌جا مشاهده کنید.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="tel:09138201042"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0057FF] hover:bg-[#0046CC] text-white text-xs sm:text-sm font-extrabold transition-colors"
          >
            <span>تماس با پشتیبانی:</span>
            <span dir="ltr" className="font-mono text-[#00E5FF]">
              09138201042
            </span>
          </a>
          <a
            href="https://www.instagram.com/timeto24_app?srtk=bTUwbmx6NTRnMThk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E1306C] to-[#833AB4] text-white text-xs sm:text-sm font-extrabold hover:opacity-95 transition-opacity"
          >
            <span>پیج اینستاگرام:</span>
            <span dir="ltr" className="font-mono">
              @timeto24_app
            </span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-[#1E1B2E]">
              پرسش‌های پرتکرار
            </h2>
            {faqs.map((item, index) => (
              <Card key={index} className="rounded-3xl space-y-2">
                <h3 className="text-sm font-extrabold text-[#1E1B2E]">{item.q}</h3>
                <p className="text-xs sm:text-sm text-[#6B6480] leading-relaxed">
                  {item.a}
                </p>
              </Card>
            ))}
          </div>

          {/* نمایش تیکت‌های ثبت‌شده کاربر فعلی و پاسخ پشتیبانی */}
          {(() => {
            const isPlatformAdmin = Boolean(
              authUser?.isPlatformAdmin &&
                authUser?.roles?.includes('PLATFORM_ADMIN')
            );
            const activeUserPhone = (
              authUser?.phone ||
              senderPhone ||
              ''
            ).trim();
            const myTickets = isPlatformAdmin
              ? supportTickets
              : activeUserPhone
                ? supportTickets.filter(
                    (tck) => tck.senderPhone === activeUserPhone
                  )
                : [];

            if (myTickets.length === 0) return null;

            return (
              <div className="space-y-3 pt-2">
                <h2 className="text-base font-extrabold text-[#061138]">
                  پیگیری تیکت‌های ارسالی شما و پاسخ پشتیبانی (
                  {toPersianDigits(myTickets.length)} مورد)
                </h2>
                {myTickets.map((tck) => (
                  <Card
                    key={tck.id}
                    className="space-y-3 border-2 border-[#E2E8F0]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-[#0057FF]">
                          {tck.id}
                        </span>
                        <span className="text-xs font-extrabold text-[#061138]">
                          {tck.subject}
                        </span>
                      </div>
                      <StatusBadge
                        label={
                          tck.status === 'ANSWERED'
                            ? 'پاسخ داده شده توسط پشتیبانی'
                            : tck.status === 'CLOSED'
                              ? 'بسته شده'
                              : 'در انتظار پاسخ پشتیبانی'
                        }
                        tone={tck.status === 'ANSWERED' ? 'success' : 'warning'}
                      />
                    </div>
                    <p className="text-xs text-[#334155] leading-relaxed">
                      {tck.message}
                    </p>
                    {tck.adminReply ? (
                      <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 space-y-1 text-xs">
                        <p className="font-extrabold text-[#047857]">
                          پاسخ پشتیبانی تایم تو ({tck.repliedAtJalali || 'امروز'}):
                        </p>
                        <p className="text-[#065F46] leading-relaxed font-medium">
                          {tck.adminReply}
                        </p>
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="lg:col-span-5">
          <Card className="rounded-3xl space-y-4 border-2 border-[#0057FF]/25">
            <div className="space-y-1 border-b border-[#E6E0F5] pb-3">
              <h2 className="text-base font-extrabold text-[#1E1B2E]">
                ثبت تیکت و پیام مستقیم به پشتیبانی
              </h2>
              <p className="text-xs text-[#6B648B]">
                مشخص کنید مشتری هستید یا صاحب کسب‌وکار؛ پاسخ پشتیبانی در همین صفحه برای شما نمایش داده می‌شود.
              </p>
            </div>

            <form
              onSubmit={handleSupportSubmit}
              className="space-y-3.5"
              noValidate
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#061138]">
                  ارسال‌کننده پیام:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1]">
                  <button
                    type="button"
                    onClick={() => setSenderRole('CUSTOMER')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                      senderRole === 'CUSTOMER'
                        ? 'bg-[#0057FF] text-white'
                        : 'text-[#334155] hover:text-[#061138]'
                    }`}
                  >
                    مشتری / مراجعه‌کننده
                  </button>
                  <button
                    type="button"
                    onClick={() => setSenderRole('BUSINESS_OWNER')}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                      senderRole === 'BUSINESS_OWNER'
                        ? 'bg-[#0057FF] text-white'
                        : 'text-[#334155] hover:text-[#061138]'
                    }`}
                  >
                    صاحب کسب‌وکار / سالن
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField id="help-sender-name" label="نام و نام خانوادگی" required>
                  <Input
                    id="help-sender-name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="نام شما..."
                  />
                </FormField>
                <FormField id="help-sender-phone" label="شماره موبایل (۱۱ رقمی)" required>
                  <Input
                    id="help-sender-phone"
                    dir="ltr"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="09131234567"
                  />
                </FormField>
              </div>

              {senderRole === 'BUSINESS_OWNER' ? (
                <FormField id="help-biz-name" label="نام سالن یا کسب‌وکار شما" required>
                  <Input
                    id="help-biz-name"
                    value={businessNameInput}
                    onChange={(e) => setBusinessNameInput(e.target.value)}
                    placeholder="مثلاً سالن زیبایی ارکیده"
                  />
                </FormField>
              ) : null}

              <FormField id="help-cat" label="دسته موضوعی تیکت">
                <Select
                  id="help-cat"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  options={[
                    { value: 'پیگیری نوبت و رزرو مشتری', label: 'پیگیری نوبت و رزرو مشتری' },
                    { value: 'راه‌اندازی و تایید پنل کسب‌وکار', label: 'راه‌اندازی و تایید پنل کسب‌وکار' },
                    { value: 'پلن‌های اشتراک، تبلیغات و مالی', label: 'پلن‌های اشتراک، تبلیغات و مالی' },
                    { value: 'سایر موارد و پیشنهادات', label: 'سایر موارد و پیشنهادات' },
                  ]}
                />
              </FormField>

              <FormField
                id="help-title"
                label="عنوان تیکت / سوال"
                required
                error={formError}
              >
                <Input
                  id="help-title"
                  value={ticketTitle}
                  hasError={Boolean(formError)}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="مثلاً درخواست بررسی و تایید سالن یا سوال درباره پلن..."
                />
              </FormField>

              <FormField id="help-msg" label="شرح کامل پیام" required>
                <Textarea
                  id="help-msg"
                  rows={4}
                  value={ticketMessage}
                  hasError={Boolean(formError)}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="جزئیات سوال یا درخواست خود را بنویسید..."
                />
              </FormField>

              <Button type="submit" variant="primary" fullWidth>
                ارسال تیکت به پشتیبانی تایم تو
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
