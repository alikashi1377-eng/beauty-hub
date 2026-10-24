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
} from 'lucide-react';
import { IRAN_CITIES } from '../../mocks/sampleData';
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
import { VisualMediaIllustration } from '../../components/ui/VisualMediaIllustration';
import { EmptyState } from '../../components/ui/StateViews';
import {
  BusinessCard,
  ProfessionalCard,
} from '../../components/ui/MarketplaceComponents';

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-5 h-5 text-[#2A0F54]" />,
  Gem: <Gem className="w-5 h-5 text-[#9D174D]" />,
  Scissors: <Scissors className="w-5 h-5 text-[#2A0F54]" />,
  Droplets: <Droplets className="w-5 h-5 text-emerald-800" />,
  Eye: <Eye className="w-5 h-5 text-[#2A0F54]" />,
  UserCheck: <UserCheck className="w-5 h-5 text-slate-800" />,
  Award: <Award className="w-5 h-5 text-slate-800" />,
  HeartHandshake: <HeartHandshake className="w-5 h-5 text-emerald-800" />,
};

/** ۱. صفحه اصلی (/) — طراحی ادیتوریال مرحله ۲.۵ */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    businesses,
    specialists,
    categories,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
    selectedCity,
  } = usePrototypeData();

  const [serviceKeyword, setServiceKeyword] = useState('');
  const [nameKeyword, setNameKeyword] = useState('');
  const [heroCity, setHeroCity] = useState(
    selectedCity === 'ALL' ? 'تهران' : selectedCity
  );
  const [featuredCityTab, setFeaturedCityTab] = useState<string>('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const combinedQuery = [serviceKeyword.trim(), nameKeyword.trim()]
      .filter(Boolean)
      .join(' ');
    if (combinedQuery) params.set('q', combinedQuery);
    if (heroCity && heroCity !== 'ALL') params.set('city', heroCity);
    navigate(`/search?${params.toString()}`);
  };

  const quickSearchKeywords = [
    { label: 'کوتاهی و براشینگ', q: 'کوتاهی' },
    { label: 'پروتئین‌تراپی مو', q: 'پروتئین' },
    { label: 'مانیکور روسی', q: 'مانیکور' },
    { label: 'فیشیال تخصصی', q: 'فیشیال' },
    { label: 'پیرایش مردانه', q: 'اصلاح' },
  ];

  const featuredBusinesses =
    featuredCityTab === 'ALL'
      ? businesses.slice(0, 3)
      : businesses.filter((b) => b.city === featuredCityTab).slice(0, 3);

  const popularProfessionals = specialists.slice(0, 4);

  const homeFaqs = [
    {
      q: 'آیا تعرفه‌های درج‌شده در پروفایل سالن‌ها شفاف و به‌روز است؟',
      a: 'بله؛ تمامی سالن‌ها و متخصصان عضو BeautyHub موظف به درج تعرفه پایه خدمات به تومان و مدت زمان تقریبی هر خدمت هستند تا پیش از رزرو، مقایسه دقیقی داشته باشید.',
    },
    {
      q: 'چگونه می‌توانم نوبت رزرو شده خود را تغییر دهم یا لغو کنم؟',
      a: 'از طریق بخش «نوبت‌های من» در حساب کاربری مشتری (/me/appointments) می‌توانید جزئیات نوبت‌های پیش‌رو را مشاهده کرده و در چارچوب قوانین سالن، نوبت خود را مدیریت نمایید.',
    },
    {
      q: 'ثبت‌نام سالن زیبایی یا متخصص مستقل در BeautyHub چگونه انجام می‌شود؟',
      a: 'با کلیک روی دکمه «ثبت رایگان کسب‌وکار»، در ۵ گام راهنمایی‌شده مشخصات سالن، فهرست خدمات، پرسنل و ساعات کاری خود را ثبت کرده و صفحه اختصاصی دریافت می‌کنید.',
    },
  ];

  return (
    <div className="space-y-16">
      {/* ۱. بخش Hero ادیتوریال دو ستونه + نوار شاخص‌های اعتماد در ردیف مستقل پایین */}
      <section className="space-y-4">
        <div className="rounded-3xl border border-[#E6E3EE] bg-white p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* ستون راست: تایپوگرافی، موتور جست‌وجو و کلیدواژه‌های سریع */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-bold text-[#9D174D]">
                  پلتفرم تخصصی رزرو خدمات زیبایی و مدیریت هوشمند سالن‌ها در ایران
                </p>
                <h1
                  className="text-2xl sm:text-4xl font-extrabold text-[#120F1D] leading-[1.3]"
                  style={{ textWrap: 'balance' }}
                >
                  کشف و رزرو آنلاین نوبت در برترین سالن‌های زیبایی، آرایشگاه‌های
                  مردانه و متخصصان مستقل
                </h1>
                <p className="text-sm sm:text-base text-[#4A4458] leading-relaxed max-w-2xl">
                  تعرفه خدمات به تومان، نمونه کارهای واقعی و دیدگاه مراجعان را
                  مقایسه کنید و بدون تماس تلفنی، نوبت خود را در ساعت دلخواه ثبت
                  نمایید.
                </p>
              </div>

              {/* فرم جست‌وجوی سه‌بخشی */}
              <div className="space-y-3">
                <form
                  onSubmit={handleHeroSearch}
                  className="p-3.5 rounded-2xl bg-[#FAF9FC] border border-[#D0CADF] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                >
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="hero-service"
                      className="block text-xs font-bold text-[#120F1D] mb-1.5"
                    >
                      نوع خدمت زیبایی
                    </label>
                    <Input
                      id="hero-service"
                      value={serviceKeyword}
                      onChange={(e) => setServiceKeyword(e.target.value)}
                      placeholder="مثلاً فیشیال، کوتاهی، ناخن..."
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="hero-name"
                      className="block text-xs font-bold text-[#120F1D] mb-1.5"
                    >
                      نام سالن یا متخصص
                    </label>
                    <Input
                      id="hero-name"
                      value={nameKeyword}
                      onChange={(e) => setNameKeyword(e.target.value)}
                      placeholder="مثلاً رویال گلزار، سارا راد..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="hero-city"
                      className="block text-xs font-bold text-[#120F1D] mb-1.5"
                    >
                      شهر
                    </label>
                    <Select
                      id="hero-city"
                      value={heroCity}
                      onChange={(e) => setHeroCity(e.target.value)}
                      options={[
                        { value: 'ALL', label: 'همه شهرها' },
                        ...IRAN_CITIES.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Button type="submit" variant="primary" fullWidth>
                      <Search className="w-4 h-4" />
                      <span>جست‌وجو</span>
                    </Button>
                  </div>
                </form>

                {/* دسترسی سریع به خدمات پرتقاضا */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[#756F86] font-medium">
                    جست‌وجوهای پرطرفدار:
                  </span>
                  {quickSearchKeywords.map((item) => (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() =>
                        navigate(`/search?q=${encodeURIComponent(item.q)}`)
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#F4F3F8] hover:bg-[#F3EEFA] text-[#4A4458] hover:text-[#2A0F54] font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ستون چپ: ویترین بصری ادیتوریال */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              <VisualMediaIllustration
                theme="violet"
                composition="arch"
                categoryLabel="ویترین منتخب BeautyHub"
                title="سالن زیبایی رویال گلزار — فرمانیه"
                subtitle="لاین تخصصی رنگ و لایت، احیای مو و طراحی ناخن"
                city="تهران"
                className="aspect-[16/10] w-full flex-1"
              />

              <div className="rounded-2xl border border-[#E6E3EE] bg-[#FAF9FC] p-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-[#756F86]">
                    <span>پیشنهاد سردبیر در تهران</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-bold text-[#120F1D] tabular-nums">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      ۴.۹ (۱۴۲ دیدگاه)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#120F1D]">
                    سالن زیبایی رویال گلزار · شروع خدمات از ۴۸۰,۰۰۰ تومان
                  </p>
                </div>
                <Link to="/salon/royal-golzar" className="shrink-0">
                  <Button variant="outline" size="sm">
                    <span>مشاهده</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* نوار ۴ ستونی شاخص‌های کمی در ردیف کامل زیر Hero */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              value: '+۲۸۰ مرکز',
              label: 'سالن زیبایی، پیرایشگاه و متخصص تاییدشده',
              context: 'در ۴ کلان‌شهر ایران',
            },
            {
              value: '۱۴,۵۰۰+ نوبت',
              label: 'میانگین رزرو آنلاین ماهانه در سامانه',
              context: 'ثبت آنی بدون تماس تلفنی',
            },
            {
              value: '۴.۸ از ۵',
              label: 'میانگین رضایت مراجعان از خدمات',
              context: 'بر اساس دیدگاه‌های ثبت‌شده',
            },
            {
              value: 'کمتر از ۶۰ ثانیه',
              label: 'زمان انتخاب خدمت، متخصص و ساعت حضور',
              context: 'تقویم زنده ۲۴ ساعته',
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#E6E3EE] bg-white p-4 sm:p-5 space-y-1"
            >
              <p className="text-lg sm:text-xl font-extrabold text-[#2A0F54] tabular-nums">
                {stat.value}
              </p>
              <p className="text-xs font-bold text-[#120F1D]">{stat.label}</p>
              <p className="text-[11px] text-[#756F86]">{stat.context}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ۲. دسته‌بندی‌های محبوب خدمات (۸ دسته‌بندی) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#9D174D] mb-1">
              مرور تخصصی بر اساس لاین خدمت
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#120F1D]">
              دسته‌بندی‌های پرطرفدار خدمات زیبایی و پیرایش
            </h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2A0F54] hover:underline shrink-0"
          >
            <span>مشاهده همه ۸ دسته‌بندی</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/search?category=${cat.slug}`}
              className="group rounded-2xl border border-[#E6E3EE] bg-white p-4 sm:p-5 hover:border-[#2A0F54] transition-colors flex flex-col justify-between gap-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F3EEFA] group-hover:bg-[#2A0F54] group-hover:text-white flex items-center justify-center transition-colors">
                  {CATEGORY_ICON_MAP[cat.iconName] ?? (
                    <Sparkles className="w-5 h-5 text-[#2A0F54]" />
                  )}
                </div>
                <span className="text-xs text-[#756F86] font-medium tabular-nums">
                  {toPersianDigits(cat.serviceCount)} خدمت
                </span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#120F1D] group-hover:text-[#2A0F54]">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-[#4A4458] mt-1 line-clamp-1">
                  {cat.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ۳. کسب‌وکارهای برگزیده با فیلتر سریع شهر */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#9D174D] mb-1">
              مراکز منتخب با نوبت‌دهی آنلاین
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#120F1D]">
              سالن‌های زیبایی و آرایشگاه‌های برگزیده
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F4F3F8] border border-[#E6E3EE]">
            {[
              { id: 'ALL', label: 'همه شهرها' },
              { id: 'تهران', label: 'تهران' },
              { id: 'شیراز', label: 'شیراز' },
              { id: 'اصفهان', label: 'اصفهان' },
              { id: 'مشهد', label: 'مشهد' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeaturedCityTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  featuredCityTab === tab.id
                    ? 'bg-[#2A0F54] text-white'
                    : 'text-[#4A4458] hover:text-[#120F1D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
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

        <div className="flex justify-center pt-1">
          <Link to="/search">
            <Button variant="outline" size="md">
              <span>مشاهده و فیلتر همه کسب‌وکارها در صفحه جست‌وجو</span>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ۴. متخصصان برجسته + دیدگاه‌های مستند (Social Proof Adjacency) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#9D174D] mb-1">
              رزرو مستقیم با متخصص دلخواه
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#120F1D]">
              متخصصان برجسته زیبایی، فیشیال و پیرایش
            </h2>
          </div>
          <Link
            to="/pro/sara-rad"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2A0F54] hover:underline shrink-0"
          >
            <span>مشاهده پروفایل نمونه متخصص مستقل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularProfessionals.map((sp) => (
            <ProfessionalCard key={sp.id} specialist={sp} />
          ))}
        </div>

        {/* دیدگاه‌های مستند مشتریان و مدیران سالن در مجاورت معرفی متخصصان */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <Card variant="muted" className="space-y-3">
            <p className="text-xs sm:text-sm text-[#120F1D] leading-relaxed font-medium">
              «قبلاً برای هماهنگی نوبت رنگ و لایت باید چندین بار با سالن تماس
              می‌گرفتم. در BeautyHub تعرفه و ساعت‌های خالی خانم مهسا کیانی را دیدم
              و در کمتر از یک دقیقه نوبتم برای روز پنج‌شنبه ثبت شد.»
            </p>
            <div className="flex items-center justify-between text-xs text-[#4A4458] pt-2 border-t border-[#E6E3EE]">
              <span className="font-bold text-[#120F1D]">
                المیرا شمس · مراجع سالن زیبایی رویال گلزار (تهران)
              </span>
              <span className="tabular-nums font-semibold text-emerald-800">
                خدمت: پروتئین‌تراپی مو
              </span>
            </div>
          </Card>

          <Card variant="muted" className="space-y-3">
            <p className="text-xs sm:text-sm text-[#120F1D] leading-relaxed font-medium">
              «از زمانی که تقویم نوبت‌دهی آرایشگاه پارسه استایل را روی BeautyHub
              فعال کردیم، تداخل نوبت‌های آخر هفته صفر شده و با پیامک‌های یادآور،
              عدم مراجعه مشتریان بیش از ۴۰٪ کاهش یافته است.»
            </p>
            <div className="flex items-center justify-between text-xs text-[#4A4458] pt-2 border-t border-[#E6E3EE]">
              <span className="font-bold text-[#120F1D]">
                آرش داوودی · مدیر آرایشگاه مردانه پارسه استایل (سعادت‌آباد)
              </span>
              <span className="tabular-nums font-semibold text-[#2A0F54]">
                مشترک پلن حرفه‌ای
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* ۵. بخش جذب کسب‌وکارها و معرفی پنل مدیریت SaaS */}
      <section className="rounded-3xl border border-[#2D1950] bg-[#170B2B] text-white p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-xs font-bold text-pink-300">
              راهکار جامع مدیریت سالن‌های زیبایی و متخصصان مستقل (SaaS)
            </p>
            <h2
              className="text-xl sm:text-3xl font-extrabold leading-snug"
              style={{ textWrap: 'balance' }}
            >
              صفحه اختصاصی بسازید و تقویم نوبت‌ها، پرسنل و مشتریان خود را یکپارچه
              مدیریت کنید
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              با عضویت در BeautyHub، علاوه بر حضور در بازارچه عمومی و جذب مشتریان
              جدید، به پیشخوان مدیریتی حرفه‌ای، پرونده مراجعان و گزارش‌های مالی
              دسترسی خواهید داشت.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-200">
              <div className="flex items-start gap-2">
                <CalendarCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>تقویم نوبت‌دهی مجزا به تفکیک هر متخصص و لاین زیبایی</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>کاهش ۴۰ درصدی عدم مراجعه با یادآوری خودکار نوبت</span>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>تحلیل درآمد ماهانه، خدمات پرطرفدار و بازگشت مشتریان</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3 bg-white/5 p-5 rounded-2xl border border-white/10">
            <div className="space-y-1">
              <p className="text-xs text-pink-200 font-semibold">
                شروع رایگان بدون نیاز به کارت بانکی
              </p>
              <p className="text-sm font-bold text-white">
                راه‌اندازی صفحه اختصاصی در ۵ گام کوتاه
              </p>
            </div>
            <Link to="/business/register">
              <Button variant="accent" size="lg" fullWidth>
                <span>ثبت رایگان کسب‌وکار</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/pricing">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="bg-transparent text-white border-white/25 hover:bg-white/10"
                >
                  تعرفه پلن‌ها
                </Button>
              </Link>
              <Link to="/app">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="bg-transparent text-white border-white/25 hover:bg-white/10"
                >
                  مشاهده دمو پنل
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ۶. پرسش‌های متداول صفحه اصلی (آکاردئون تعاملی) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-bold text-[#9D174D]">پاسخ به ابهامات رایج</p>
          <h2 className="text-xl font-extrabold text-[#120F1D]">
            پرسش‌های متداول درباره نوبت‌دهی و عضویت سالن‌ها
          </h2>
          <p className="text-xs text-[#4A4458] leading-relaxed">
            پاسخ سوالات بیشتر را می‌توانید در مرکز راهنما و پشتیبانی مشاهده
            فرمایید.
          </p>
          <div className="pt-2">
            <Link to="/help">
              <Button variant="outline" size="sm">
                ورود به مرکز راهنما (/help)
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
                className="rounded-2xl border border-[#E6E3EE] bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-right flex items-center justify-between gap-4 text-sm font-extrabold text-[#120F1D] hover:bg-[#FAF9FC] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#756F86] shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#2A0F54]' : ''
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-[#4A4458] leading-relaxed border-t border-[#F4F3F8] pt-3">
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

/** ۲. صفحه جست‌وجوی سالن و متخصص (/search) */
export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    businesses,
    categories,
    favoriteBusinessIds,
    toggleFavoriteBusiness,
    selectedCity,
  } = usePrototypeData();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [cityFilter, setCityFilter] = useState<string>(
    searchParams.get('city') ?? selectedCity
  );
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
    const cityParam = searchParams.get('city');
    if (qParam !== null) setQuery(qParam);
    if (catParam !== null) setCategoryFilter(catParam);
    if (cityParam !== null) setCityFilter(cityParam);
  }, [searchParams]);

  const filtered = filterBusinesses(businesses, {
    query,
    type: typeFilter,
    city: cityFilter,
    categorySlug: categoryFilter,
    maxPriceToman: maxPrice,
    minRating,
    sortBy,
  });

  const handleResetFilters = () => {
    setQuery('');
    setTypeFilter('ALL');
    setCityFilter('ALL');
    setCategoryFilter('ALL');
    setMaxPrice(1000000);
    setMinRating(0);
    setSortBy('recommended');
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="کشف و مقایسه مراکز زیبایی"
        title="جست‌وجوی سالن‌های زیبایی، آرایشگاه‌ها و متخصصان"
        subtitle="فیلتر دقیق بر اساس شهر، لاین خدمتی، سقف تعرفه پایه و امتیاز مراجعان"
        routePattern="/search"
        breadcrumbs={[{ label: 'صفحه اصلی', href: '/' }, { label: 'جست‌وجو' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileFilterOpen((p) => !p)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فیلترهای پیشرفته</span>
          </Button>
        }
      />

      {/* نوار انتخاب سریع دسته‌بندی بالای نتایج */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
            categoryFilter === 'ALL'
              ? 'bg-[#2A0F54] text-white'
              : 'bg-white border border-[#E6E3EE] text-[#4A4458] hover:border-[#2A0F54]/40'
          }`}
        >
          همه خدمات زیبایی
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.slug)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              categoryFilter === cat.slug
                ? 'bg-[#2A0F54] text-white font-bold'
                : 'bg-white border border-[#E6E3EE] text-[#4A4458] hover:border-[#2A0F54]/40'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* پنل فیلتر دسکتاپ و کشویی موبایل */}
        <aside
          aria-label="فیلترهای جست‌وجو"
          className={`lg:col-span-3 space-y-4 lg:sticky lg:top-20 ${
            mobileFilterOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E3EE] pb-3">
              <h2 className="text-sm font-extrabold text-[#120F1D]">
                فیلترهای جست‌وجو
              </h2>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#9D174D] hover:underline cursor-pointer"
              >
                پاک کردن همه
              </button>
            </div>

            <FormField id="filter-query" label="نام سالن، محله یا خدمت">
              <Input
                id="filter-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="مثلاً فرشته، کوتاهی، ناخن..."
              />
            </FormField>

            <FormField id="filter-city" label="شهر">
              <Select
                id="filter-city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'همه شهرها' },
                  ...IRAN_CITIES.map((c) => ({ value: c, label: c })),
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
                className="w-full accent-[#2A0F54] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#756F86] tabular-nums">
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
          </Card>
        </aside>

        {/* ستون نتایج جست‌وجو */}
        <div className="lg:col-span-9 space-y-4">
          <Card
            padding="sm"
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#4A4458] tabular-nums">
              <span>
                نمایش{' '}
                <strong className="font-extrabold text-[#120F1D]">
                  {toPersianDigits(filtered.length)}
                </strong>{' '}
                مرکز از {toPersianDigits(businesses.length)} مرکز نمونه
              </span>
              {cityFilter !== 'ALL' ? (
                <span>· شهر: {cityFilter}</span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label
                htmlFor="sort-select"
                className="text-[#756F86] font-semibold"
              >
                مرتب‌سازی بر اساس:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-xl border border-[#D0CADF] bg-[#FAF9FC] px-3 py-1.5 font-bold text-[#120F1D] focus:outline-none cursor-pointer"
              >
                <option value="recommended">پیشنهادی BeautyHub</option>
                <option value="rating_desc">بالاترین امتیاز مراجعان</option>
                <option value="price_asc">کمترین تعرفه پایه</option>
              </select>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState
              title="مرکزی مطابق با فیلترهای انتخابی شما یافت نشد"
              description="پیشنهاد می‌کنیم سقف قیمت پایه، شهر یا دسته‌بندی خدمت را تغییر دهید تا تمام مراکز نمونه نمایش داده شوند."
              actionLabel="بازنشانی همه فیلترها"
              onAction={handleResetFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
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

/** ۳. صفحه دسته‌بندی خدمات (/categories) */
export const CategoriesPage: React.FC = () => {
  const { categories } = usePrototypeData();

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="طبقه‌بندی استاندارد خدمات زیبایی"
        title="دسته‌بندی‌های خدمات زیبایی، پوست و پیرایش"
        subtitle="هر دسته‌بندی شامل زیرشاخه‌های تخصصی، محدوده زمانی استاندارد و سالن‌های ارائه‌دهنده آن خدمت است."
        routePattern="/categories"
        breadcrumbs={[
          { label: 'صفحه اصلی', href: '/' },
          { label: 'دسته‌بندی خدمات' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((category) => (
          <Card
            key={category.id}
            variant="interactive"
            className="flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#F3EEFA] flex items-center justify-center">
                  {CATEGORY_ICON_MAP[category.iconName] ?? (
                    <Sparkles className="w-5 h-5 text-[#2A0F54]" />
                  )}
                </div>
                <span className="text-xs font-bold text-[#2A0F54] tabular-nums">
                  {toPersianDigits(category.serviceCount)} خدمت فعال
                </span>
              </div>

              <h2 className="text-base font-extrabold text-[#120F1D]">
                {category.title}
              </h2>
              <p className="text-xs text-[#4A4458] leading-relaxed">
                {category.subtitle}
              </p>
              <p className="text-[11px] text-[#756F86]">
                مراکز ارائه‌دهنده: {category.targetAudience}
              </p>
            </div>

            <div className="pt-3.5 border-t border-[#E6E3EE]">
              <Link to={`/search?category=${category.slug}`}>
                <Button variant="outline" size="sm" fullWidth>
                  <span>مشاهده مراکز این دسته</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/** ۴. صفحه پلن‌های کسب‌وکار (/pricing) */
export const PricingPage: React.FC = () => {
  const { plans } = usePrototypeData();

  return (
    <div className="space-y-12">
      <PageHeader
        kicker="مدل اشتراک ماهانه ویژه سالن‌ها و متخصصان"
        title="پلن‌های عضویت و نرم‌افزار مدیریت کسب‌وکار"
        subtitle="مشتریان برای رزرو نوبت هیچ کارمزدی پرداخت نمی‌کنند. این پلن‌ها ویژه سالن‌های زیبایی، آرایشگاه‌ها و متخصصانی است که تقویم و مشتریان خود را در BeautyHub مدیریت می‌کنند."
        routePattern="/pricing"
        breadcrumbs={[
          { label: 'صفحه اصلی', href: '/' },
          { label: 'تعرفه اشتراک کسب‌وکارها' },
        ]}
      />

      {/* کارت‌های ۳ پلن اشتراک */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col justify-between space-y-6 ${
              plan.isRecommended
                ? 'border-[#2A0F54] ring-2 ring-[#2A0F54]/15'
                : ''
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[#120F1D]">
                  {plan.name}
                </h2>
                {plan.isRecommended ? (
                  <span className="text-xs font-extrabold text-[#9D174D]">
                    پیشنهاد ویژه سالن‌ها
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[#4A4458] leading-relaxed">
                {plan.audience}
              </p>

              <div className="pt-2 pb-4 border-b border-[#E6E3EE]">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#120F1D] tabular-nums">
                  {formatPriceToman(plan.monthlyPriceToman)}
                </span>
                <span className="text-xs text-[#756F86] mr-1.5">
                  {plan.monthlyPriceToman > 0 ? '/ ماهانه (دمو)' : ' (همیشگی)'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#4A4458]">
                <div className="flex justify-between py-1.5 border-b border-[#F4F3F8]">
                  <span className="text-[#756F86]">ظرفیت تقویم پرسنل:</span>
                  <span className="font-bold text-[#120F1D]">
                    {plan.staffLimit}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#F4F3F8]">
                  <span className="text-[#756F86]">سهمیه پیامک یادآور:</span>
                  <span className="font-bold text-[#120F1D] tabular-nums">
                    {toPersianDigits(plan.smsQuotaMonthly)} پیامک در ماه
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 pt-2">
                {plan.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-[#120F1D]"
                  >
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
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
                شروع آزمایشی با پلن {plan.name}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* جدول مقایسه کامل امکانات پلن‌ها */}
      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-[#120F1D]">
            جدول مقایسه دقیق قابلیت‌های مدیریتی
          </h2>
          <p className="text-xs text-[#756F86]">
            مقایسه سقف تقویم پرسنل، سهمیه پیامک و سطح گزارش‌های تحلیلی در هر پلن
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-right border-collapse">
            <thead>
              <tr className="border-b border-[#E6E3EE] bg-[#F4F3F8] text-[#4A4458]">
                <th className="py-3.5 px-4 font-bold">قابلیت / ظرفیت</th>
                {plans.map((p) => (
                  <th key={p.id} className="py-3.5 px-4 font-extrabold text-[#120F1D]">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E3EE]">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#4A4458]">
                  سقف نوبت‌دهی آنلاین
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#120F1D] font-medium">
                    {p.comparison.onlineBooking}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#4A4458]">
                  بسته پیامک یادآور خودکار
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#120F1D] font-medium">
                    {p.comparison.smsReminders}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#4A4458]">
                  سطح گزارش‌ها و آمار مالی
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#120F1D] font-medium">
                    {p.comparison.analyticsLevel}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-[#4A4458]">
                  پشتیبانی و راه‌اندازی
                </td>
                {plans.map((p) => (
                  <td key={p.id} className="py-3.5 px-4 text-[#120F1D] font-medium">
                    {p.comparison.supportType}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/** ۵. صفحه درباره ما (/about) */
export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-10">
      <PageHeader
        kicker="معرفی محصول و چشم‌انداز"
        title="درباره پلتفرم BeautyHub"
        subtitle="پل ارتباطی شفاف میان مشتریان خدمات زیبایی و حرفه‌ای‌ترین سالن‌ها، آرایشگاه‌ها و متخصصان مستقل در ایران"
        routePattern="/about"
        breadcrumbs={[{ label: 'صفحه اصلی', href: '/' }, { label: 'درباره ما' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold text-[#9D174D]">
              چرا BeautyHub شکل گرفت؟
            </p>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#120F1D]">
              پایان دادن به ناهماهنگی‌های تلفنی و ابهام در تعرفه خدمات زیبایی
            </h2>
            <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
              پیدا کردن یک سالن زیبایی، آرایشگاه مردانه یا متخصص پوست مطمئن که
              تعرفه‌های شفافی داشته باشد و بتوان بدون تماس‌های مکرر تلفنی نوبت آن
              را رزرو کرد، یکی از چالش‌های همیشگی مراجعان بوده است. از سوی دیگر،
              مدیران سالن‌ها نیز برای مدیریت تقویم چندین متخصص، یادآوری نوبت‌ها و
              جلوگیری از تداخل ساعات کاری نیازمند یک نرم‌افزار تخصصی بومی هستند.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E6E3EE] text-xs">
            <div>
              <p className="text-base font-extrabold text-[#2A0F54] tabular-nums">
                ۳۸ مسیر
              </p>
              <p className="text-[#756F86]">پوشش کامل جریان‌های محصول</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-[#2A0F54] tabular-nums">
                ۳ نقش کاربری
              </p>
              <p className="text-[#756F86]">مشتری، کسب‌وکار و ادمین</p>
            </div>
            <div>
              <p className="text-base font-extrabold text-[#2A0F54] tabular-nums">
                ۱۰۰٪ بومی
              </p>
              <p className="text-[#756F86]">طراحی راست‌به‌چپ و تقویم شمسی</p>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-5">
          <VisualMediaIllustration
            theme="rose"
            composition="mirror"
            categoryLabel="هویت بصری و تجربه کاربری"
            title="طراحی اختصاصی برای صنعت زیبایی ایران"
            subtitle="ترکیب بازارچه آنلاین و نرم‌افزار مدیریت سالن"
            city="تهران، شیراز، اصفهان و مشهد"
            className="h-full min-h-[240px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-2.5">
          <h3 className="text-base font-extrabold text-[#120F1D]">
            ۰۱. برای مشتریان و مراجعان
          </h3>
          <p className="text-xs text-[#4A4458] leading-relaxed">
            مشاهده فهرست کامل خدمات، قیمت پایه به تومان، نمونه کارهای تفکیک‌شده و
            ثبت نوبت آنلاین در هر ساعت از شبانه‌روز.
          </p>
        </Card>

        <Card className="space-y-2.5">
          <h3 className="text-base font-extrabold text-[#120F1D]">
            ۰۲. برای سالن‌ها و متخصصان
          </h3>
          <p className="text-xs text-[#4A4458] leading-relaxed">
            صفحه اختصاصی حرفه‌ای، تقویم روزانه و هفتگی پرسنل، پرونده سوابق
            مشتریان و کمپین‌های وفاداری در یک پنل یکپارچه.
          </p>
        </Card>

        <Card className="space-y-2.5">
          <h3 className="text-base font-extrabold text-[#120F1D]">
            ۰۳. آماده اتصال به زیرساخت واقعی
          </h3>
          <p className="text-xs text-[#4A4458] leading-relaxed">
            معماری فرانت‌اند با جداسازی کامل لایه داده و تایپ‌های استاندارد، آماده
            اتصال به پایگاه داده PostgreSQL / Supabase در مرحله بعد است.
          </p>
        </Card>
      </div>
    </div>
  );
};

/** ۶. صفحه راهنما و پشتیبانی (/help) */
export const HelpPage: React.FC = () => {
  const { showToast } = usePrototypeData();
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState('customer');
  const [ticketMessage, setTicketMessage] = useState('');
  const [formError, setFormError] = useState('');

  const faqs = [
    {
      q: 'چگونه نوبت خود را در سالن یا نزد متخصص مستقل رزرو کنم؟',
      a: 'در صفحه جست‌وجو (/search) مرکز مورد نظر را انتخاب کنید، وارد پروفایل شوید و با کلیک روی «رزرو نوبت»، خدمت، متخصص، تاریخ و ساعت مراجعه را انتخاب نمایید.',
    },
    {
      q: 'چگونه می‌توانم سالن زیبایی یا آرایشگاه خود را در سامانه ثبت کنم؟',
      a: 'از طریق دکمه «ثبت رایگان کسب‌وکار» در هدر وارد مسیر /business/register شوید و ۵ گام راه‌اندازی آزمایشی را تکمیل کنید.',
    },
    {
      q: 'تفاوت حساب متخصص مستقل با سالن زیبایی چیست؟',
      a: 'سالن‌های زیبایی و آرایشگاه‌ها می‌توانند چندین متخصص و پرسنل را زیرمجموعه یک تقویم مدیریت کنند، در حالی که متخصص مستقل پروفایل فردی (/pro/:slug) دارد.',
    },
    {
      q: 'آیا رزروها و قیمت‌های نمایش‌داده‌شده در این نسخه واقعی هستند؟',
      a: 'خیر؛ این نسخه پروتوتایپ کامل رابط کاربری با داده‌های آزمایشی است و هیچ پرداخت بانکی یا ارسال پیامک واقعی انجام نمی‌شود.',
    },
  ];

  const handleDemoTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketMessage.trim()) {
      setFormError('لطفاً موضوع و شرح پیام پشتیبانی آزمایشی را کامل وارد کنید.');
      return;
    }
    setFormError('');
    setTicketTitle('');
    setTicketMessage('');
    showToast('پیام پشتیبانی آزمایشی شما با موفقیت در وضعیت محلی ثبت شد.');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="پشتیبانی و راهنمای کاربری"
        title="مرکز راهنما و پرسش‌های متداول"
        subtitle="راهنمای گام‌به‌گام استفاده از بازارچه نوبت‌دهی برای مشتریان و پنل مدیریت برای صاحبان کسب‌وکار"
        routePattern="/help"
        breadcrumbs={[{ label: 'صفحه اصلی', href: '/' }, { label: 'راهنما' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold text-[#120F1D]">
            پرسش‌های پرتکرار کاربران
          </h2>
          {faqs.map((item, index) => (
            <Card key={index} className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#120F1D]">
                {item.q}
              </h3>
              <p className="text-xs sm:text-sm text-[#4A4458] leading-relaxed">
                {item.a}
              </p>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-5">
          <Card className="space-y-4">
            <div className="space-y-1 border-b border-[#E6E3EE] pb-3">
              <h2 className="text-base font-extrabold text-[#120F1D]">
                ارسال درخواست پشتیبانی (شبیه‌ساز دمو)
              </h2>
              <p className="text-xs text-[#756F86]">
                ثبت آزمایشی تیکت بدون ارسال ایمیل یا پیامک خارجی
              </p>
            </div>

            <form onSubmit={handleDemoTicket} className="space-y-3.5" noValidate>
              <FormField id="help-cat" label="بخش مربوطه">
                <Select
                  id="help-cat"
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  options={[
                    { value: 'customer', label: 'پیگیری نوبت مشتری' },
                    { value: 'business', label: 'راهه‌اندازی و پنل کسب‌وکار' },
                    { value: 'subscription', label: 'پلن‌های اشتراک ماهانه' },
                  ]}
                />
              </FormField>

              <FormField
                id="help-title"
                label="موضوع درخواست"
                required
                error={formError}
              >
                <Input
                  id="help-title"
                  value={ticketTitle}
                  hasError={Boolean(formError)}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="مثلاً راهنمای تغییر ساعت کاری سالن..."
                />
              </FormField>

              <FormField id="help-msg" label="شرح پیام" required>
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
                ثبت درخواست پشتیبانی آزمایشی
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
