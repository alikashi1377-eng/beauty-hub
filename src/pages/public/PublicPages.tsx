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
  MapPin,
  Clock,
  Percent,
  Heart,
  X,
} from 'lucide-react';
import { IRAN_CITIES, ISFAHAN_NEIGHBORHOODS } from '../../mocks/sampleData';
import { BusinessType } from '../../types';
import {
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
import { TimetoFlagshipHome } from '../../components/home/TimetoFlagshipHome';
import {
  getSavedVisitorRole,
  saveVisitorRole,
  VISITOR_ROLE_EVENT,
  VisitorEntryRole,
} from '../../components/home/timetoHomeData';

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
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const smartSearchSuggestions = [
    'درچه',
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
            b.approvalStatus === 'APPROVED' &&
            (b.name.toLowerCase().includes(normalizedQuery) ||
              b.neighborhood.toLowerCase().includes(normalizedQuery) ||
              b.typeLabel.toLowerCase().includes(normalizedQuery) ||
              b.shortDescription.toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 4)
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
    (b) => b.approvalStatus === 'APPROVED'
  );
  const sortedHomeSalons = [...approvedSalons].sort((a, b) => {
    const aSpon = Number(Boolean(a.isSponsored));
    const bSpon = Number(Boolean(b.isSponsored));
    if (bSpon !== aSpon) return bSpon - aSpon;
    if (aSpon && bSpon) {
      return (a.sponsoredOrder ?? 99) - (b.sponsoredOrder ?? 99);
    }
    return b.rating - a.rating;
  });

  const featuredBusinesses = sortedHomeSalons.slice(0, 6);
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

  return (
    <div className="space-y-8 sm:space-y-11">
      {/* ۱. بخش Hero صفحه اصلی مشتریان با جست‌وجوی هوشمند شناور */}
      <section className="relative rounded-[28px] sm:rounded-[32px] border border-[#1E293B] bg-[#061138] shadow-[0_20px_48px_-18px_rgba(6,17,56,0.55)]">
        <div className="absolute inset-0 rounded-[28px] sm:rounded-[32px] overflow-hidden pointer-events-none">
          <img
            src={getBeautyPhotoUrl('سالن زیبایی لوکس در تایم تو', 'سالن زیبایی زنانه')}
            alt="سالن زیبایی لوکس در تایم تو"
            className="w-full h-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#061138]/95 via-[#061138]/85 to-[#061138]/70" />
        </div>

        <div className="relative z-20 px-4 py-5 sm:px-8 sm:py-8 lg:py-9 max-w-3xl mx-auto text-center space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 backdrop-blur-md border border-[#00E5FF]/35 text-[11px] sm:text-xs font-extrabold text-[#00E5FF]">
            <MapPin className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
            <span>تایم تو (Timeto) · رزرو آنلاین سالن و متخصص در اصفهان و درچه</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
              وقت زیبایی تو، به انتخاب تو
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-lg mx-auto">
              مقایسه تعرفه‌ها، مشاهده نمونه کارها و رزرو آنی نوبت بدون تماس تلفنی
            </p>
          </div>

          {/* باکس جست‌وجوی هوشمند (Smart Live Search) */}
          <div className="relative z-30 text-right max-w-2xl mx-auto pt-0.5">
            <form
              onSubmit={handleHeroSearch}
              className="p-1.5 rounded-2xl sm:rounded-full bg-white border-2 border-[#00E5FF]/60 focus-within:border-[#0057FF] flex items-center gap-1.5 sm:gap-2 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.45)] transition-colors"
            >
              <div className="flex-1 flex items-center gap-2 pr-3 pl-1 py-1 min-w-0">
                <Search className="w-4 h-4 text-[#0057FF] shrink-0" />
                <label htmlFor="hero-search" className="sr-only">
                  جست‌وجوی سالن، متخصص، خدمت یا محله
                </label>
                <input
                  id="hero-search"
                  type="text"
                  value={searchKeyword}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  placeholder="نام سالن، متخصص، خدمت یا محله (مثلاً درچه، چهارباغ، فیشیال، ناخن)..."
                  className="w-full text-xs sm:text-sm font-medium text-[#061138] placeholder:text-[#64748B] bg-transparent focus:outline-none truncate"
                />
                {searchKeyword ? (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    aria-label="پاک کردن عبارت جست‌وجو"
                    className="p-1 rounded-full hover:bg-[#F3F6FC] text-[#64748B] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                className="px-4 sm:px-6 py-2 rounded-xl sm:rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs sm:text-sm font-extrabold shrink-0 cursor-pointer transition-colors shadow-[0_6px_18px_-4px_rgba(0,87,255,0.55)]"
              >
                جست‌وجو
              </button>
            </form>

            {isSearchFocused ? (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-3xl border border-[#CBD5E1] bg-white p-4 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0057FF]">
                    <Sparkles className="w-3.5 h-3.5 text-[#0057FF]" />
                    <span>
                      {normalizedQuery
                        ? isAjaxSearching
                          ? 'در حال جست‌وجوی هوشمند زنده (AJAX)...'
                          : `نتایج لحظه‌ای برای «${searchKeyword}»`
                        : 'پیشنهادهای سریع جست‌وجو'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    className="text-[11px] font-bold text-[#64748B] hover:text-[#061138] cursor-pointer"
                  >
                    بستن ✕
                  </button>
                </div>

                {!normalizedQuery ? (
                  <div className="flex flex-wrap gap-1.5">
                    {smartSearchSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchKeyword(tag);
                          setIsSearchFocused(false);
                          navigate(`/search?q=${encodeURIComponent(tag)}`);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#F3F6FC] hover:bg-[#E0ECFF] border border-[#CBD5E1] text-xs font-bold text-[#061138] hover:text-[#0057FF] cursor-pointer transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : !hasSmartResults ? (
                  <div className="py-2 text-center space-y-1.5">
                    <p className="text-xs font-bold text-[#334155]">
                      موردی با «{searchKeyword}» یافت نشد.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        navigate('/search');
                      }}
                      className="text-xs font-extrabold text-[#0057FF] hover:underline cursor-pointer"
                    >
                      مشاهده همه سالن‌ها ←
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(smartMatchedCategories.length > 0 ||
                      smartMatchedNeighborhoods.length > 0) ? (
                      <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-[#F1F5F9]">
                        {smartMatchedCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/search?category=${cat.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="px-3 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[11px] font-extrabold inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>دسته: {cat.title}</span>
                          </Link>
                        ))}
                        {smartMatchedNeighborhoods.map((nb) => (
                          <button
                            key={nb}
                            type="button"
                            onClick={() => {
                              setIsSearchFocused(false);
                              navigate(`/search?q=${encodeURIComponent(nb)}`);
                            }}
                            className="px-3 py-1 rounded-full bg-[#F3F6FC] border border-[#CBD5E1] text-[#061138] hover:border-[#0057FF] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-[#0057FF]" />
                            <span>محله {nb}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {smartMatchedSalons.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-[#64748B]">
                          سالن‌ها و مراکز زیبایی
                        </p>
                        {smartMatchedSalons.map((biz) => (
                          <Link
                            key={biz.id}
                            to={
                              biz.type === BusinessType.IndependentSpecialist
                                ? `/pro/${biz.slug}`
                                : `/salon/${biz.slug}`
                            }
                            onClick={() => setIsSearchFocused(false)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#F3F6FC] hover:bg-[#E0ECFF] transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-[#061138] truncate">
                                {biz.name}
                              </p>
                              <p className="text-[11px] text-[#334155]">
                                {biz.neighborhood} · {biz.typeLabel}
                              </p>
                            </div>
                            <span className="text-xs font-extrabold text-[#0057FF] shrink-0 tabular-nums">
                              ★ {toPersianDigits(biz.rating)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {smartMatchedSpecialists.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-[#64748B]">
                          متخصصان
                        </p>
                        {smartMatchedSpecialists.map((sp) => (
                          <Link
                            key={sp.id}
                            to={`/pro/${sp.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#F3F6FC] hover:bg-[#E0ECFF] transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-[#061138] truncate">
                                {sp.fullName}
                              </p>
                              <p className="text-[11px] text-[#0057FF] font-bold truncate">
                                {sp.roleTitle}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-[#0057FF] shrink-0">
                              رزرو ←
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {smartMatchedServices.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-[#64748B]">
                          خدمات
                        </p>
                        {smartMatchedServices.map((srv) => {
                          const parentBiz = businesses.find(
                            (b) => b.id === srv.businessId
                          );
                          return (
                            <Link
                              key={srv.id}
                              to={
                                parentBiz
                                  ? `/booking/${parentBiz.slug}?service=${srv.id}`
                                  : '/search'
                              }
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#F3F6FC] hover:bg-[#E0ECFF] transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-[#061138] truncate">
                                  {srv.title}
                                </p>
                                <p className="text-[11px] text-[#334155] truncate">
                                  {parentBiz?.name ?? 'مرکز منتخب'}
                                </p>
                              </div>
                              <span className="text-xs font-extrabold text-[#0057FF] shrink-0 tabular-nums">
                                {formatPriceToman(srv.priceToman)}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/search?category=${cat.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/12 hover:bg-[#0057FF] text-white border border-white/20 text-xs font-bold whitespace-nowrap transition-all backdrop-blur-md shrink-0"
              >
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                  {CATEGORY_ICON_MAP[cat.iconName] ?? (
                    <Sparkles className="w-3 h-3 text-[#0057FF]" />
                  )}
                </span>
                <span>{cat.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ۲. بخش پیشنهادهای ویژه (Special Offers) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#0057FF]">
              تخفیف‌ها و پکیج‌های فصلی اصفهان و درچه
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
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden bg-gradient-to-l from-[#061138] via-[#0A2568] to-[#0057FF] text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_18px_45px_-18px_rgba(0,87,255,0.35)]">
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
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-[#CBD5E1] bg-white p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-xs font-extrabold">
                  {homeBannerSecondary?.sponsoredLabel ||
                    'پیشنهاد ویژه · رزرو آنی'}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#061138] leading-snug">
                  {homeBannerSecondary
                    ? `${homeBannerSecondary.name} · ${homeBannerSecondary.neighborhood}`
                    : 'فیشیال تخصصی پوست و آبرسانی عمیق با کلینیک سارا راد'}
                </h3>
                <p className="text-xs text-[#334155] leading-relaxed line-clamp-2">
                  {homeBannerSecondary?.shortDescription ||
                    'پاکسازی چندمرحله‌ای، ماسک هیدروژلی و سرم‌تراپی ویژه انواع پوست.'}
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#CBD5E1] shadow-sm shrink-0">
                <img
                  src={
                    homeBannerSecondary?.avatarUrl ||
                    getBeautyPhotoUrl('کلینیک سارا راد', 'پوست و فیشیال')
                  }
                  alt={homeBannerSecondary?.name || 'پیشنهاد ویژه'}
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
                  {homeBannerSecondary
                    ? formatPriceToman(homeBannerSecondary.startingPriceToman)
                    : '۶۵۰,۰۰۰ تومان'}
                </span>
              </div>
              <Link
                to={
                  homeBannerSecondary
                    ? `/salon/${homeBannerSecondary.slug}`
                    : '/pro/sara-rad'
                }
                className="px-4 py-2 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-[0_6px_16px_-4px_rgba(0,87,255,0.4)]"
              >
                <span>مشاهده سالن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ۳. بخش متخصصان برجسته (Pro Care) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#0057FF] mb-1">
              انتخاب مستقیم متخصص (Pro Care)
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#061138]">
              متخصصان برجسته زیبایی، پوست و پیرایش اصفهان
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

        {spotlightSpecialist ? (
          <div className="rounded-3xl border border-[#CBD5E1] bg-white p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center shadow-xs">
            <div className="lg:col-span-4 relative h-48 sm:h-60 rounded-2xl overflow-hidden">
              <img
                src={getSpecialistAvatarUrl(
                  spotlightSpecialist.fullName,
                  spotlightSpecialist.roleTitle
                )}
                alt={spotlightSpecialist.fullName}
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
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#0057FF] mb-1">
              رزرو مستقیم در برترین مراکز اصفهان و درچه
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#061138]">
              سالن‌های زیبایی و آرایشگاه‌های منتخب
            </h2>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#CBD5E1] text-xs font-bold text-[#0057FF]">
              <MapPin className="w-3.5 h-3.5 text-[#0057FF]" />
              <span>اصفهان و درچه</span>
            </span>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0057FF] hover:text-[#0044CC] transition-colors shrink-0"
            >
              <span>همه سالن‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
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

      {/* ۵. بخش معرفی پنل مدیریت ویژه صاحبان سالن و متخصصان — فقط اگر کاربر به عنوان مشتری وارد نشده باشد نمایش داده شود */}
      {!isLoggedInCustomerOnly ? (
        <section className="rounded-[32px] border border-[#1E293B] bg-[#061138] text-white p-6 sm:p-9">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className="inline-block text-xs font-bold text-[#00E5FF] bg-white/10 px-3 py-1 rounded-full">
                ویژه مدیران سالن و متخصصان
              </span>
              <h2 className="text-lg sm:text-2xl font-extrabold leading-snug">
                مدیریت هوشمند تقویم نوبت‌ها و مشتریان در Timeto
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>تقویم مجزا برای هر متخصص</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>دریافت بیعانه آنلاین</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>گزارش شفاف درآمد</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-2.5 bg-white/5 p-4 rounded-3xl border border-white/15">
              <Button
                type="button"
                variant="accent"
                size="lg"
                fullWidth
                onClick={() =>
                  openAuthModal({
                    initialScreen: 'REGISTER_STEP_1_PHONE',
                    defaultRole: 'BUSINESS_OWNER',
                    redirectTo: '/app',
                    promptReason: 'ثبت سریع سالن زیبایی و ورود به پنل مدیریت',
                  })
                }
              >
                <span>ثبت رایگان کسب‌وکار</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/pricing">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="!bg-white/10 !text-white !border-white/25 hover:!bg-white/20"
                  >
                    تعرفه پلن‌ها
                  </Button>
                </Link>
                <Link to="/app">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="!bg-white/10 !text-white !border-white/25 hover:!bg-white/20"
                  >
                    مشاهده پنل سالن
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ۶. پرسش‌های متداول */}
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

/** ۱. درگاه هوشمند صفحه اول (/) — اگر کاربر هنوز نقش خود را مشخص نکرده، صفحه ورود سه‌بعدی (TimetoFlagshipHome) نمایش داده می‌شود و پس از انتخاب نقش، سیستم خودکار بخش مربوط به او را بارگذاری می‌کند */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ownedBusinessId, authUser, openAuthModal } = usePrototypeData();
  const [visitorRole, setVisitorRole] = useState<VisitorEntryRole>(() =>
    getSavedVisitorRole()
  );

  useEffect(() => {
    const syncRole = () => {
      setVisitorRole(getSavedVisitorRole());
    };
    window.addEventListener(VISITOR_ROLE_EVENT, syncRole);
    window.addEventListener('storage', syncRole);
    return () => {
      window.removeEventListener(VISITOR_ROLE_EVENT, syncRole);
      window.removeEventListener('storage', syncRole);
    };
  }, []);

  useEffect(() => {
    setVisitorRole(getSavedVisitorRole());
  }, [searchParams]);

  const isBusinessOwnerRegistered =
    Boolean(ownedBusinessId) ||
    Boolean(authUser?.roles?.includes('BUSINESS_OWNER'));

  const isExplicitIntroRoute =
    typeof window !== 'undefined' && window.location.pathname === '/intro';

  // اگر کاربر قبلاً نقش «سالن‌دار» را انتخاب کرده و سالن ثبت‌شده دارد، مستقیم وارد پیشخوان سالن شود
  useEffect(() => {
    if (
      visitorRole === 'BUSINESS_OWNER' &&
      isBusinessOwnerRegistered &&
      searchParams.get('intro') !== '1' &&
      !isExplicitIntroRoute
    ) {
      navigate('/app', { replace: true });
    }
  }, [
    visitorRole,
    isBusinessOwnerRegistered,
    navigate,
    searchParams,
    isExplicitIntroRoute,
  ]);

  const handleSelectCustomer = () => {
    saveVisitorRole('CUSTOMER');
    setVisitorRole('CUSTOMER');
    if (isExplicitIntroRoute) {
      navigate('/');
      return;
    }
    if (searchParams.get('intro') === '1') {
      setSearchParams({}, { replace: true });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBusinessOwner = () => {
    saveVisitorRole('BUSINESS_OWNER');
    setVisitorRole('BUSINESS_OWNER');
    if (isBusinessOwnerRegistered) {
      navigate('/app');
    } else {
      openAuthModal({
        initialScreen: 'REGISTER_STEP_1_PHONE',
        defaultRole: 'BUSINESS_OWNER',
        redirectTo: '/app',
        promptReason: 'ثبت سریع سالن زیبایی و ورود به پنل مدیریت',
      });
    }
  };

  if (
    visitorRole === null ||
    searchParams.get('intro') === '1' ||
    isExplicitIntroRoute
  ) {
    return (
      <TimetoFlagshipHome
        onSelectCustomerRole={handleSelectCustomer}
        onSelectBusinessRole={handleSelectBusinessOwner}
      />
    );
  }

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
  const [maxPrice, setMaxPrice] = useState<number>(1000000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get('q');
    const catParam = searchParams.get('category');
    if (qParam !== null) setQuery(qParam);
    if (catParam !== null) setCategoryFilter(catParam);
  }, [searchParams]);

  // جست‌وجوی هوشمند: علاوه بر نام و محله سالن، اگر نام خدمت یا متخصص با عبارت جست‌وجو همخوانی داشت سالن مربوطه هم برگردانده شود
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

  const baseFiltered = filterBusinesses(businesses, {
    query: '',
    type: typeFilter,
    city: 'ALL',
    categorySlug: categoryFilter,
    maxPriceToman: maxPrice,
    minRating,
    sortBy,
  });

  const filtered = normalizedQ
    ? baseFiltered.filter(
        (b) =>
          b.name.toLowerCase().includes(normalizedQ) ||
          b.neighborhood.toLowerCase().includes(normalizedQ) ||
          b.shortDescription.toLowerCase().includes(normalizedQ) ||
          b.typeLabel.toLowerCase().includes(normalizedQ) ||
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

  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('ALL');

  const handleResetFilters = () => {
    setQuery('');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setNeighborhoodFilter('ALL');
    setMaxPrice(1000000);
    setMinRating(0);
    setSortBy('recommended');
    setSearchParams({});
  };

  const finalFiltered =
    neighborhoodFilter === 'ALL'
      ? filtered
      : filtered.filter((b) =>
          b.neighborhood.includes(neighborhoodFilter)
        );

  return (
    <div className="space-y-4">
      {/* نوار مستقیم جست‌وجو و دسته‌بندی بدون شلوغی محله‌ها در بالا */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-[#CBD5E1] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] focus-within:border-[#0057FF] focus-within:bg-white transition-colors">
            <Search className="w-4 h-4 text-[#0057FF] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی سریع سالن، متخصص، خدمت یا محله..."
              aria-label="جست‌وجوی سالن، متخصص، خدمت یا محله"
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

          <Button
            variant="outline"
            size="sm"
            className="lg:hidden shrink-0"
            onClick={() => setMobileFilterOpen((p) => !p)}
          >
            <SlidersHorizontal className="w-4 h-4 text-[#0057FF]" />
            <span>فیلترها</span>
          </Button>
        </div>

        {/* نوار دسته‌بندی‌های کپسولی با آیکون (شامل عروس و داماد) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap cursor-pointer transition-colors border ${
              categoryFilter === 'ALL'
                ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-2xs'
                : 'bg-[#F3F6FC] border-[#CBD5E1] text-[#334155] hover:border-[#0057FF]'
            }`}
          >
            همه خدمات
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.slug)}
              className={`pr-2 pl-3.5 py-1 rounded-full text-xs font-extrabold whitespace-nowrap cursor-pointer transition-colors inline-flex items-center gap-1.5 border ${
                categoryFilter === cat.slug
                  ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-2xs'
                  : 'bg-[#F3F6FC] border-[#CBD5E1] text-[#334155] hover:border-[#0057FF]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                {CATEGORY_ICON_MAP[cat.iconName] ?? (
                  <Sparkles className="w-3 h-3 text-[#0057FF]" />
                )}
              </span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* بک‌دراپ موبایل برای دراور فیلترها */}
      {mobileFilterOpen ? (
        <div
          className="fixed inset-0 z-40 bg-[#061138]/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileFilterOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside
          aria-label="فیلترهای جست‌وجو"
          className={`lg:col-span-3 lg:sticky lg:top-20 ${
            mobileFilterOpen
              ? 'fixed inset-x-0 bottom-0 z-50 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl border-t border-[#CBD5E1] lg:static lg:z-auto lg:max-h-none lg:p-0 lg:bg-transparent lg:shadow-none lg:border-0'
              : 'hidden lg:block'
          }`}
        >
          <Card className="rounded-3xl space-y-4 border-0 lg:border p-0 lg:p-5 shadow-none lg:shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0057FF]" />
                <h2 className="text-sm font-extrabold text-[#061138]">
                  فیلترهای پیشرفته
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-[#0057FF] hover:underline cursor-pointer"
                >
                  پاک کردن همه
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label="بستن فیلترها"
                  className="lg:hidden px-2.5 py-1 rounded-full bg-[#F3F6FC] text-xs font-extrabold text-[#061138] hover:bg-[#E2E8F0] cursor-pointer"
                >
                  بستن ✕
                </button>
              </div>
            </div>

            <FormField id="filter-query" label="جست‌وجوی سالن، متخصص یا خدمت">
              <Input
                id="filter-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="مثلاً فیشیال، ناخن، عروس..."
              />
            </FormField>

            <FormField id="filter-neighborhood" label="انتخاب محله (اصفهان و درچه)">
              <Select
                id="filter-neighborhood"
                value={neighborhoodFilter}
                onChange={(e) => setNeighborhoodFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'همه محله‌ها' },
                  ...ISFAHAN_NEIGHBORHOODS.map((nb) => ({
                    value: nb,
                    label: nb,
                  })),
                ]}
              />
            </FormField>

            <FormField id="filter-category" label="دسته‌بندی خدمات">
              <Select
                id="filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'همه دسته‌بندی‌ها' },
                  ...categories.map((cat) => ({
                    value: cat.slug,
                    label: cat.title,
                  })),
                ]}
              />
            </FormField>

            <FormField id="filter-type" label="نوع مرکز زیبایی">
              <Select
                id="filter-type"
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as BusinessType | 'ALL')
                }
                options={[
                  { value: 'ALL', label: 'همه مراکز و متخصصان' },
                  { value: BusinessType.WomenSalon, label: 'سالن زیبایی زنانه' },
                  { value: BusinessType.MenBarbershop, label: 'آرایشگاه مردانه' },
                  {
                    value: BusinessType.IndependentSpecialist,
                    label: 'متخصص مستقل',
                  },
                ]}
              />
            </FormField>

            <FormField
              id="filter-price"
              label={`سقف تعرفه پایه: تا ${formatPriceToman(maxPrice)}`}
            >
              <input
                id="filter-price"
                type="range"
                min={250000}
                max={1000000}
                step={50000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#0057FF] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#64748B] tabular-nums">
                <span>۲۵۰,۰۰۰ تومان</span>
                <span>۱,۰۰۰,۰۰۰ تومان</span>
              </div>
            </FormField>

            <FormField id="filter-rating" label="حداقل امتیاز مراجعان">
              <Select
                id="filter-rating"
                value={String(minRating)}
                onChange={(e) => setMinRating(Number(e.target.value))}
                options={[
                  { value: '0', label: 'همه امتیازها' },
                  { value: '4.5', label: '۴.۵ ستاره و بالاتر' },
                  { value: '4.8', label: '۴.۸ ستاره و بالاتر' },
                ]}
              />
            </FormField>

            <div className="pt-2 lg:hidden sticky bottom-0 bg-white pb-1">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setMobileFilterOpen(false)}
              >
                اعمال فیلتر و مشاهده ({toPersianDigits(finalFiltered.length)} مرکز)
              </Button>
            </div>
          </Card>
        </aside>

        <div className="lg:col-span-9 space-y-5">
          <Card
            padding="sm"
            className="rounded-2xl flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#6B6480] tabular-nums">
              <span>
                نمایش{' '}
                <strong className="font-extrabold text-[#1E1B2E]">
                  {toPersianDigits(finalFiltered.length)}
                </strong>{' '}
                مرکز فعال
              </span>
              <span className="inline-flex items-center gap-1 text-[#0057FF] font-bold">
                <MapPin className="w-3.5 h-3.5" />
                {neighborhoodFilter === 'ALL' ? 'اصفهان و درچه' : neighborhoodFilter}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label
                htmlFor="sort-select"
                className="text-[#6B6480] font-semibold"
              >
                مرتب‌سازی:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-full border border-[#CBD5E1] bg-[#F3F6FC] px-3.5 py-1.5 font-bold text-[#061138] focus:outline-none cursor-pointer"
              >
                <option value="recommended">پیشنهادی</option>
                <option value="rating_desc">بالاترین امتیاز</option>
                <option value="price_asc">مناسب‌ترین تعرفه پایه</option>
              </select>
            </div>
          </Card>

          {matchedSpecialistsInSearch.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#1E1B2E]">
                متخصصان مرتبط با جست‌وجوی شما (
                {toPersianDigits(matchedSpecialistsInSearch.length)})
              </h3>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 no-scrollbar">
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
              description="پیشنهاد می‌کنیم سقف قیمت، محله یا دسته‌بندی خدمت را تغییر دهید تا گزینه‌های بیشتری نمایش داده شوند."
              actionLabel="بازنشانی فیلترها"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
              <div className="relative h-24 sm:h-36 overflow-hidden bg-[#E0ECFF]">
                <img
                  src={catImg}
                  alt={category.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061138]/80 via-[#061138]/25 to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[10px] sm:text-xs font-extrabold text-[#0057FF] tabular-nums shadow-2xs">
                  {toPersianDigits(category.serviceCount)} خدمت
                </span>
                <div className="absolute bottom-2 right-2.5 left-2.5 flex items-center gap-1.5 text-white">
                  <span className="w-6 h-6 rounded-full bg-white/95 text-[#0057FF] flex items-center justify-center shrink-0 shadow-2xs">
                    {CATEGORY_ICON_MAP[category.iconName] ?? (
                      <Sparkles className="w-3.5 h-3.5 text-[#0057FF]" />
                    )}
                  </span>
                  <h2 className="text-xs sm:text-sm font-black truncate">
                    {category.title}
                  </h2>
                </div>
              </div>

              <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2">
                <p className="text-[11px] sm:text-xs text-[#475569] line-clamp-2 leading-relaxed">
                  {category.subtitle}
                </p>

                <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] sm:text-xs font-extrabold text-[#0057FF]">
                  <span>مشاهده مراکز</span>
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
