import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Calendar,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  HeartHandshake,
  Landmark,
  LayoutGrid,
  ReceiptText,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import {
  TIMETO_BRAND_LOGO_URL,
  TimetoIconMark,
  TimetoLogo,
} from '../ui/TimetoLogo';
import {
  CLIENT_ANIMATED_FACTORS,
  computeHeroScrollStage,
  computePhoneCinematicStep,
  IntroBeautySpaceCard,
  SALON_OWNER_STACK_CARDS,
  TIMETO_INTRO_MARQUEE,
  TIMETO_INTRO_SPACES,
  WALLET_MOTION_FRAMES,
  WALLET_WEEK_DAYS,
} from './timetoHomeData';

export interface TimetoIntroGatewayProps {
  onSelectCustomerRole: () => void;
  onSelectBusinessRole: () => void;
}

const INTRO_SPACE_ICONS: Record<IntroBeautySpaceCard['iconKey'], React.ReactNode> = {
  barber: <Scissors className="w-6 h-6 text-[#00E5FF]" />,
  'women-salon': <Sparkles className="w-6 h-6 text-[#00E5FF]" />,
  'skin-clinic': <Crown className="w-6 h-6 text-[#00E5FF]" />,
  'nail-lash': <Eye className="w-6 h-6 text-[#00E5FF]" />,
  'spa-massage': <HeartHandshake className="w-6 h-6 text-[#00E5FF]" />,
  'traditional-barber': <UserCheck className="w-6 h-6 text-[#00E5FF]" />,
};

const CINEMATIC_SLOTS = ['۱۰:۳۰', '۱۲:۰۰', '۱۴:۳۰', '۱۶:۰۰', '۱۷:۳۰', '۱۹:۰۰'];

// شبکه کندویی سه‌بعدی کف صحنه (3D Honeycomb Perspective Stage)
const HONEYCOMB_TILES = Array.from({ length: 24 }, (_, idx) => ({
  id: idx,
  isGlowing: [2, 5, 7, 9, 10, 13, 14, 16, 19, 21].includes(idx),
  delayMs: (idx % 6) * 180,
}));

export const TimetoFlagshipHome: React.FC<TimetoIntroGatewayProps> = ({
  onSelectCustomerRole,
  onSelectBusinessRole,
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [autoHeroTick, setAutoHeroTick] = useState<0 | 1 | 2>(0);
  const [phoneScrollProgress, setPhoneScrollProgress] = useState(0);
  const [cinematicTick, setCinematicTick] = useState(0);
  const [walletFrameIdx, setWalletFrameIdx] = useState(0);
  const [clientSectionVisible, setClientSectionVisible] = useState(false);
  const [spacesVisible, setSpacesVisible] = useState(false);
  const [guaranteesVisible, setGuaranteesVisible] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const heroSectionRef = useRef<HTMLElement | null>(null);
  const phoneSectionRef = useRef<HTMLDivElement | null>(null);
  const spacesSectionRef = useRef<HTMLDivElement | null>(null);
  const clientSectionRef = useRef<HTMLDivElement | null>(null);
  const guaranteesSectionRef = useRef<HTMLDivElement | null>(null);

  // ردیابی نرم اسکرول برای استیج سه‌بعدی هیرو و بخش رزرو ۳۰ ثانیه‌ای سینمایی
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      setScrollY(currentY);
      setHeroProgress(Math.max(0, Math.min(1, currentY / 320)));

      if (phoneSectionRef.current) {
        const rect = phoneSectionRef.current.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const totalTravel = Math.max(220, rect.height - vh * 0.45);
        const scrolledInto = vh * 0.55 - rect.top;
        const progress = Math.max(0, Math.min(1, scrolledInto / totalTravel));
        setPhoneScrollProgress(progress);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // تشخیص رسیدن اسکرول به بخش‌های ۰۱، ۰۴ و ۰۶ برای اجرای انیمیشن ورود
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setSpacesVisible(true);
      setClientSectionVisible(true);
      setGuaranteesVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target === spacesSectionRef.current) {
            setSpacesVisible(true);
          } else if (entry.target === clientSectionRef.current) {
            setClientSectionVisible(true);
          } else if (entry.target === guaranteesSectionRef.current) {
            setGuaranteesVisible(true);
          }
        });
      },
      { threshold: 0.14 }
    );

    if (spacesSectionRef.current) observer.observe(spacesSectionRef.current);
    if (clientSectionRef.current) observer.observe(clientSectionRef.current);
    if (guaranteesSectionRef.current) observer.observe(guaranteesSectionRef.current);

    return () => observer.disconnect();
  }, []);

  // چرخه سینمایی خودکار برای هیرو، ماکاپ موبایل و بخش کیف پول هوشمند
  useEffect(() => {
    const heroTimer = window.setInterval(() => {
      setAutoHeroTick((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 3400);

    const phoneInterval = window.setInterval(() => {
      setCinematicTick((prev) => (prev + 1) % 4);
    }, 2000);

    const walletInterval = window.setInterval(() => {
      setWalletFrameIdx((prev) => (prev + 1) % WALLET_MOTION_FRAMES.length);
    }, 1700);

    return () => {
      window.clearInterval(heroTimer);
      window.clearInterval(phoneInterval);
      window.clearInterval(walletInterval);
    };
  }, []);

  // ترکیب اسکرول و چرخه زنده برای مرحله فعلی داستان Hero (Stage 0, 1, 2)
  const effectiveHeroProgress =
    scrollY > 35 ? heroProgress : autoHeroTick === 0 ? 0.1 : autoHeroTick === 1 ? 0.5 : 0.85;
  const heroStage = computeHeroScrollStage(effectiveHeroProgress);

  // پارامترهای سه‌بعدی کف کندویی و گوی نوری برند با اسکرول
  const floorTiltDeg = 62 - heroProgress * 12;
  const floorScale = 1.08 + heroProgress * 0.28;
  const floorTranslateY = heroProgress * 28;
  const orbScale = 1 + Math.sin(heroProgress * Math.PI) * 0.08;
  const orbTranslateY = -heroProgress * 10;

  // وضعیت سینمایی گوشی در بخش ۰۲
  const phoneState = computePhoneCinematicStep(phoneScrollProgress, cinematicTick);
  const phoneTiltZ = -5 * (1 - phoneScrollProgress);
  const phoneTiltY = -10 * (1 - phoneScrollProgress);
  const phoneTiltX = 7 * (1 - phoneScrollProgress);

  // فریم فعلی انیمیشن کیف پول در بخش ۰۵
  const activeWalletFrame =
    WALLET_MOTION_FRAMES[walletFrameIdx] ?? WALLET_MOTION_FRAMES[0];

  const introFaqs = [
    {
      q: 'چطور از آرایشگاه یا سالن زیبایی نوبت آنلاین بگیرم؟',
      a: 'کافی است روی «سالن‌ها را ببین» بزنید؛ سالن، خدمت و ساعت خالی دلخواهتان را انتخاب کنید تا نوبت شما در چند ثانیه و بدون تماس تلفنی ثبت شود.',
    },
    {
      q: 'برای دیدن سالن‌ها باید ثبت‌نام کنم؟',
      a: 'خیر؛ مشاهده‌ی تمام سالن‌ها، خدمات، تعرفه‌ها و نمونه کارها کاملاً آزاد است و فقط در لحظه‌ی نهایی ثبت رزرو، شماره موبایل شما تایید می‌شود.',
    },
    {
      q: 'سالن‌دارم؛ چطور سالنم را در تایم تو ثبت کنم؟',
      a: 'روی دکمه «سالن خود را ثبت کنید» بزنید؛ در کمتر از ۲ دقیقه مشخصات سالن، خدمات و ساعات کاری خود را وارد می‌کنید و تقویم آنلاین سالن شما فعال می‌شود.',
    },
    {
      q: 'پول نوبت‌ها چه زمانی به حساب سالن واریز می‌شود؟',
      a: 'مبلغ پرداختی مشتری تا انجام نوبت در کیف پول امن تایم تو امانت می‌ماند و پس از تکمیل نوبت، با یک درخواست ظرف ۲۴ تا ۴۸ ساعت به شماره شبای سالن تسویه می‌شود.',
    },
  ];

  const salonStackIcons = [
    <LayoutGrid key="i1" className="w-5 h-5 text-[#00E5FF]" />,
    <Calendar key="i2" className="w-5 h-5 text-[#00E5FF]" />,
    <Clock key="i3" className="w-5 h-5 text-[#00E5FF]" />,
    <UserCheck key="i4" className="w-5 h-5 text-[#00E5FF]" />,
  ];

  // لیست دوگانه‌شده برای حرکت بی‌نهایت و بدون پرش نوار Marquee
  const infiniteMarqueeItems = [...TIMETO_INTRO_MARQUEE, ...TIMETO_INTRO_MARQUEE];

  return (
    <div className="min-h-screen w-full bg-[#020718] text-white selection:bg-[#00E5FF] selection:text-[#020718] overflow-x-clip">
      {/* =====================================================================
          هدر شیشه‌ای خلوت و مینیمال صفحه ورود (مشابه ثانیه 00:03 ویدئو)
      ====================================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#020718]/80 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src={TIMETO_BRAND_LOGO_URL}
              alt="تایم تو"
              className="w-9 h-9 rounded-full object-cover border border-[#00E5FF]/50 shadow-[0_0_16px_rgba(0,229,255,0.35)]"
            />
            <span className="text-base sm:text-lg font-black tracking-[0.18em] text-white font-latin">
              Timeto
            </span>
          </div>

          <button
            type="button"
            onClick={onSelectCustomerRole}
            className="px-3.5 py-1.5 rounded-full bg-white/8 hover:bg-white/15 border border-[#00E5FF]/35 text-xs font-extrabold text-[#00E5FF] cursor-pointer transition-all whitespace-nowrap shrink-0"
          >
            ورود به پلتفرم ←
          </button>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION — استیج سه‌بعدی زنده با گوی نوری و شبکه کندویی درخشان
          بدون هیچ فضای خالی اضافه؛ دکمه‌های نقش در اولین نگاه ۱۰۰٪ مشخص‌اند و با اسکرول یا زمان، نوشته‌ها و کارت‌های زنده تغییر می‌کنند
      ====================================================================== */}
      <section
        ref={heroSectionRef}
        className="relative min-h-[calc(100svh-1rem)] pt-16 pb-8 px-4 sm:px-6 flex flex-col justify-between overflow-hidden"
      >
        {/* ۱. پس‌زمینه سه‌بعدی عمیق: هاله‌های نوری + شبکه کندویی پرسپکتیو درخشان در کف صحنه */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* هاله نوری فیروزه‌ای/آبی پشت گوی سه‌بعدی */}
          <div
            className="absolute left-1/2 top-[22%] -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] rounded-full transition-transform duration-300 ease-out"
            style={{
              background:
                'radial-gradient(circle, rgba(0,229,255,0.42) 0%, rgba(0,87,255,0.26) 40%, rgba(2,7,24,0) 72%)',
              transform: `scale(${1 + heroProgress * 0.25})`,
            }}
          />

          {/* بازتاب نوری روی کف استیج کندویی */}
          <div
            className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-[380px] sm:w-[680px] h-[220px] rounded-full opacity-60 blur-2xl"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,229,255,0.38) 0%, rgba(0,87,255,0.22) 48%, rgba(2,7,24,0) 78%)',
            }}
          />

          {/* کف سه‌بعدی کندویی درخشان (3D Perspective Honeycomb Stage Floor) */}
          <div
            className="absolute inset-x-0 bottom-[-10%] sm:bottom-[-14%] h-[58%] flex items-center justify-center"
            style={{
              perspective: '540px',
            }}
          >
            <div
              className="w-[155vw] sm:w-[120vw] max-w-[1180px] h-[390px] sm:h-[490px] grid grid-cols-6 gap-2.5 sm:gap-3.5 p-3 transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${floorTiltDeg}deg) translateY(${floorTranslateY}px) scale(${floorScale})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {HONEYCOMB_TILES.map((tile) => (
                <div
                  key={tile.id}
                  style={{
                    animationDelay: `${tile.delayMs}ms`,
                  }}
                  className={`rounded-[20px] sm:rounded-[26px] border-2 transition-all duration-500 ${
                    tile.isGlowing
                      ? 'bg-gradient-to-b from-[#00E5FF]/30 via-[#0057FF]/22 to-[#04123B]/95 border-[#00E5FF]/80 shadow-[0_0_32px_rgba(0,229,255,0.55),inset_0_2px_16px_rgba(0,229,255,0.45)]'
                      : 'bg-[#061542]/80 border-[#00C6FF]/35 shadow-[0_0_14px_rgba(0,87,255,0.25),inset_0_1px_10px_rgba(0,198,255,0.2)]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* گرادینت نرم برای کنتراست عالی نوشته‌ها روی کف نوری */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020718]/65 via-transparent to-[#020718]/90" />
        </div>

        {/* ۲. محتوای مرکزی Hero — موبایل‌فرست، زنده و واکنش‌گرا */}
        <div className="relative z-10 max-w-xl mx-auto my-auto w-full text-center space-y-4 sm:space-y-5 pt-2">
          {/* گوی کریستالی سه‌بعدی و لوگوی تایم تو */}
          <div
            className="relative mx-auto flex flex-col items-center justify-center transition-transform duration-300"
            style={{
              transform: `translate3d(0, ${orbTranslateY}px, 0) scale(${orbScale})`,
            }}
          >
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center animate-timeto-orb">
              <div className="absolute inset-[-12px] rounded-full border-2 border-[#00E5FF]/50 animate-timeto-ring pointer-events-none shadow-[0_0_20px_rgba(0,229,255,0.4)]" />
              <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-[#0057FF] via-[#00E5FF] to-[#7CE8FF] opacity-45 blur-md" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-b from-[#7CE8FF] via-[#00E5FF] to-[#0057FF] shadow-[0_0_50px_rgba(0,229,255,0.8),inset_0_2px_14px_rgba(255,255,255,0.8)] flex items-center justify-center overflow-hidden">
                <img
                  src={TIMETO_BRAND_LOGO_URL}
                  alt="تایم تو"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* بج وضعیت زنده بالای تیتر */}
            <div className="mt-3.5 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#071850]/90 backdrop-blur-md border border-[#00E5FF]/50 shadow-[0_0_24px_rgba(0,229,255,0.28)] text-xs font-extrabold text-[#00E5FF] transition-all duration-300">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                <span>{heroStage.badgeText}</span>
              </span>
            </div>
          </div>

          {/* تیتر و زیرنویس پویا که در ۳ مرحله با انیمیشن تغییر می‌کنند */}
          <div className="space-y-2.5 px-1">
            <h1 className="text-[28px] sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.24] text-white transition-all duration-300">
              <span className="block drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]">
                {heroStage.headlineTop}
              </span>
              <span className="block mt-1.5 bg-gradient-to-l from-[#00E5FF] via-[#38BDF8] to-[#60A5FA] bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(0,229,255,0.35)]">
                {heroStage.headlineGradient}
              </span>
            </h1>

            <p className="text-xs sm:text-base text-slate-200 font-medium max-w-md mx-auto leading-relaxed min-h-[2.6rem]">
              {heroStage.subtitle}
            </p>
          </div>

          {/* کارت‌های زنده انیمیشنی که بین ۳ مرحله عوض می‌شوند و قابل لمس هستند */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="px-3.5 py-1.5 rounded-full bg-[#081A52]/85 backdrop-blur-md border border-[#00E5FF]/35 text-[11px] sm:text-xs font-extrabold text-white shadow-sm transition-all duration-300">
              {heroStage.floatingRightPill}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-[#0057FF]/30 backdrop-blur-md border border-[#00E5FF]/45 text-[11px] sm:text-xs font-extrabold text-[#00E5FF] shadow-sm transition-all duration-300">
              {heroStage.floatingLeftPill}
            </span>
          </div>

          {/* دو دکمه اصلی تعیین نقش کاربر — در اولین نمایش ۱۰۰٪ برجسته و مشخص */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 max-w-md mx-auto pt-1">
            <button
              type="button"
              onClick={onSelectCustomerRole}
              className="group flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-gradient-to-l from-[#0057FF] via-[#00A3FF] to-[#00E5FF] text-[#020718] font-black text-sm sm:text-base shadow-[0_14px_38px_-6px_rgba(0,229,255,0.8)] hover:opacity-95 active:scale-[0.99] cursor-pointer transition-all whitespace-nowrap"
            >
              <span>سالن‌ها را ببین</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>

            <button
              type="button"
              onClick={onSelectBusinessRole}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#051138]/92 hover:bg-[#0B1E5B] text-white border border-[#00E5FF]/45 font-extrabold text-sm sm:text-base shadow-[0_10px_28px_-8px_rgba(0,87,255,0.5)] active:scale-[0.99] cursor-pointer transition-all whitespace-nowrap"
            >
              <Store className="w-4 h-4 text-[#00E5FF]" />
              <span>سالن خود را ثبت کنید</span>
            </button>
          </div>

          {/* دکمه‌های ۳ مرحله‌ای برای جابه‌جایی دستی یا مشاهده چرخه انیمیشن */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[
              { idx: 0 as const, label: 'معرفی' },
              { idx: 1 as const, label: 'رزرو آنی' },
              { idx: 2 as const, label: 'تایم تو' },
            ].map((item) => (
              <button
                key={item.idx}
                type="button"
                onClick={() => setAutoHeroTick(item.idx)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                  heroStage.stageIndex === item.idx
                    ? 'bg-[#00E5FF] text-[#020718] shadow-[0_0_12px_rgba(0,229,255,0.7)]'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* نشانگر متحرک «اسکرول |» در پایین هیرو */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 560, behavior: 'smooth' })}
          className="relative z-10 mx-auto pt-3 flex flex-col items-center gap-1 text-slate-300 hover:text-[#00E5FF] cursor-pointer transition-opacity duration-300"
        >
          <span className="text-[11px] font-bold tracking-wider">اسکرول</span>
          <span className="w-0.5 h-6 rounded-full bg-gradient-to-b from-[#00E5FF] to-transparent animate-bounce" />
        </button>
      </section>

      {/* =====================================================================
          نوار تیکر متحرک تک‌خطی (Infinite Smooth Animated Marquee)
          بدون شکستن خط در موبایل — حرکت نرم و پیوسته دقیقاً مشابه ویدئوی مرجع
      ====================================================================== */}
      <div
        dir="ltr"
        className="relative border-y border-[#00E5FF]/15 bg-[#040D2A]/95 py-3.5 overflow-hidden select-none"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#020718] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#020718] to-transparent z-10" />

        <div className="animate-timeto-marquee flex items-center gap-7 whitespace-nowrap">
          {infiniteMarqueeItems.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              dir="rtl"
              className="inline-flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-slate-200 whitespace-nowrap"
            >
              <span className="text-[#00E5FF] text-sm" aria-hidden="true">
                ✦
              </span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 space-y-20 sm:space-y-28 py-14 sm:py-22">
        {/* =====================================================================
            بخش ۰۱ — FOR EVERY BEAUTY SPACE / «برای هر سالن زیبایی»
            کارت‌های ۲ ستونه جمع‌وجور و وسط‌چین در موبایل (الهام‌گرفته از ثانیه 00:09 ویدئو)
        ====================================================================== */}
        <section ref={spacesSectionRef} className="space-y-7">
          <div className="space-y-2.5 max-w-lg mx-auto text-right sm:text-center">
            <div className="flex items-center sm:justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-[#00E5FF] uppercase">
              <span>۰۱</span>
              <span className="w-6 h-px bg-[#00E5FF]/50" />
              <span>FOR EVERY BEAUTY SPACE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              برای هر سالن زیبایی
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              آرایشگاه مردانه، سالن بانوان، کلینیک پوست و مو، ناخن، اسپا و تشریفات عروس و داماد — هر شغلی که با وقت قبلی کار می‌کند، اینجا جا دارد.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {TIMETO_INTRO_SPACES.map((space, idx) => (
              <div
                key={space.id}
                style={{
                  transitionDelay: `${idx * 65}ms`,
                  transform: spacesVisible
                    ? 'translate3d(0, 0, 0) scale(1)'
                    : 'translate3d(0, 24px, 0) scale(0.95)',
                  opacity: spacesVisible ? 1 : 0.12,
                }}
                className="rounded-3xl bg-gradient-to-b from-[#081748]/90 to-[#040C28]/95 border border-[#00E5FF]/20 hover:border-[#00E5FF]/50 p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3 transition-all duration-500 shadow-[0_14px_34px_-15px_rgba(0,87,255,0.3)] select-none"
              >
                <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#0B2168]/90 border border-[#00E5FF]/35 shadow-[0_0_24px_rgba(0,229,255,0.2)] flex items-center justify-center shrink-0">
                  {INTRO_SPACE_ICONS[space.iconKey]}
                </span>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {space.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {space.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۲ — BOOK IN 30 SECONDS / «رزرو در ۳۰ ثانیه»
            نمایش سینمایی سه‌بعدی گوشی که با اسکرول صاف می‌شود و رزرو ساعت ۱۶:۰۰ را زنده انجام می‌دهد
        ====================================================================== */}
        <section ref={phoneSectionRef} className="space-y-7">
          <div className="space-y-2 max-w-lg mx-auto text-right sm:text-center">
            <div className="flex items-center sm:justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-[#00E5FF] uppercase">
              <span>۰۲</span>
              <span className="w-6 h-px bg-[#00E5FF]/50" />
              <span>BOOK IN 30 SECONDS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              رزرو در ۳۰ ثانیه
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              سالن، خدمت و ساعت خالی را انتخاب کنید — تمام!
            </p>
          </div>

          <div
            className="flex justify-center py-2 pointer-events-none select-none"
            style={{ perspective: '1100px' }}
          >
            <div
              className="relative w-full max-w-[315px] sm:max-w-[335px] rounded-[42px] border-[6px] border-[#1E293B] bg-[#030A21] p-4 sm:p-5 shadow-[0_32px_90px_-15px_rgba(0,229,255,0.38)] transition-transform duration-300 ease-out overflow-hidden"
              style={{
                transform: `rotateZ(${phoneTiltZ}deg) rotateY(${phoneTiltY}deg) rotateX(${phoneTiltX}deg)`,
              }}
            >
              {/* داینامیک آیلند بالای گوشی */}
              <div className="w-24 h-5 bg-black rounded-full mx-auto mb-4 flex items-center justify-end px-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]/50" />
              </div>

              {/* هدر داخل صفحه گوشی */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 font-bold">
                    سلام 👋
                  </p>
                  <p className="text-sm font-black text-white mt-0.5">
                    وقتشه بدرخشی
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#081A52] border border-[#00E5FF]/35">
                  <TimetoIconMark size="sm" className="!w-5 !h-5 !rounded-md" />
                  <span className="text-[11px] font-black text-[#00E5FF] font-latin">
                    Timeto
                  </span>
                </div>
              </div>

              {/* کارت سالن داخل گوشی */}
              <div className="mt-3.5 p-3.5 rounded-2xl bg-[#08184B] border border-[#00E5FF]/35 flex items-center justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0057FF]/30 border border-[#00E5FF]/40 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5 text-[#00E5FF]" />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">
                    سالن زیبایی رویال رز
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5 tabular-nums">
                    ★ ۴.۹ · اصفهان و درچه
                  </p>
                </div>
              </div>

              {/* گرید زمان‌های امروز */}
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold">زمان‌های امروز</span>
                  <span className="text-[#00E5FF] font-extrabold">
                    {phoneState.selectedSlot
                      ? `انتخاب‌شده: ${phoneState.selectedSlot}`
                      : 'انتخاب ساعت'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {CINEMATIC_SLOTS.map((slot) => {
                    const isTarget = slot === '۱۶:۰۰';
                    const isSelected =
                      isTarget && phoneState.selectedSlot === '۱۶:۰۰';
                    return (
                      <div
                        key={slot}
                        className={`relative py-2.5 rounded-xl text-center text-xs font-extrabold tabular-nums transition-all duration-300 border ${
                          slot === '۱۴:۳۰'
                            ? 'bg-white/4 border-white/5 text-slate-600 line-through'
                            : isSelected
                            ? 'bg-gradient-to-l from-[#0057FF] to-[#00E5FF] text-[#020718] border-[#00E5FF] shadow-[0_0_22px_rgba(0,229,255,0.8)] scale-105'
                            : 'bg-white/6 border-white/12 text-slate-200'
                        }`}
                      >
                        {slot}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* دکمه تأیید رزرو در پایین گوشی */}
              <div className="mt-5 space-y-2">
                <div
                  className={`w-full py-3 rounded-2xl text-center text-xs font-black transition-all duration-300 ${
                    phoneState.selectedSlot
                      ? 'bg-gradient-to-l from-[#0057FF] to-[#00E5FF] text-[#020718] shadow-[0_10px_24px_-6px_rgba(0,229,255,0.75)]'
                      : 'bg-[#0057FF]/50 text-white/80'
                  }`}
                >
                  تأیید رزرو
                </div>
                <p className="text-[10px] text-center text-slate-400">
                  ✓ تأیید آنی و یادآوری خودکار
                </p>
              </div>

              {/* اورلی سینمایی ثبت موفق نوبت روی صفحه گوشی (دقیقاً مشابه ثانیه 00:18 ویدئو) */}
              <div
                className={`absolute inset-3 rounded-[34px] bg-[#030C2A]/92 backdrop-blur-md border border-[#00E5FF]/40 flex flex-col items-center justify-center p-5 text-center transition-all duration-500 ${
                  phoneState.isConfirmed
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0057FF] to-[#00E5FF] text-[#020718] flex items-center justify-center shadow-[0_0_35px_rgba(0,229,255,0.85)] mb-3">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <p className="text-base font-black text-white">
                  نوبت شما ثبت شد
                </p>
                <p className="text-xs font-bold text-[#00E5FF] mt-1">
                  سالن زیبایی رویال رز · امروز ساعت ۱۶:۰۰
                </p>
                <span className="mt-3 px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold text-slate-200">
                  پیامک یادآوری ۱ ساعت قبل ارسال می‌شود
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۳ — BUILT FOR SALON OWNERS / «برای سالن‌داران — سالن شما، همیشه باز»
            تگ‌های کپسولی + کارت‌های پله‌ای چسبان (Sticky Stacking Cards)
        ====================================================================== */}
        <section className="space-y-7">
          <div className="space-y-3 max-w-lg mx-auto text-right sm:text-center">
            <div className="flex items-center sm:justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-[#00E5FF] uppercase">
              <span>۰۳</span>
              <span className="w-6 h-px bg-[#00E5FF]/50" />
              <span>BUILT FOR SALON OWNERS</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-snug">
              برای سالن‌داران
              <span className="block mt-1 bg-gradient-to-l from-[#00E5FF] to-[#38BDF8] bg-clip-text text-transparent">
                سالن شما، همیشه باز
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              مشتری هر ساعتی از شبانه‌روز نوبت می‌گیرد — حتی وقتی سالن بسته است و شما خوابید.
            </p>

            {/* چیپ‌های برجسته ویژگی‌های سالن‌دار (مشابه ثانیه 00:20 ویدئو) */}
            <div className="flex flex-wrap items-center sm:justify-center gap-2 pt-1">
              {['نوبت‌گیری ۲۴ ساعته', 'تسویه ۲۴ تا ۴۸ ساعته', 'بدون تماس تلفنی'].map(
                (chip) => (
                  <span
                    key={chip}
                    className="px-3.5 py-1.5 rounded-full bg-[#071646] border border-[#00E5FF]/30 text-xs font-extrabold text-slate-100"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>

          {/* کارت‌های Sticky که با اسکرول یکی پس از دیگری روی قبلی قرار می‌گیرند */}
          <div className="relative space-y-5 pb-6 max-w-2xl mx-auto">
            {SALON_OWNER_STACK_CARDS.map((card, index) => {
              const stickyTopPx = 78 + index * 18;
              return (
                <div
                  key={card.id}
                  style={{
                    top: `${stickyTopPx}px`,
                    zIndex: 10 + index * 10,
                  }}
                  className="sticky rounded-3xl bg-gradient-to-br from-[#08194E] via-[#051136] to-[#030A22] border border-[#00E5FF]/30 p-5 sm:p-7 shadow-[0_-12px_36px_rgba(2,7,24,0.9),0_18px_40px_-15px_rgba(0,87,255,0.35)] transition-transform duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="w-11 h-11 rounded-2xl bg-[#0B236E] border border-[#00E5FF]/35 flex items-center justify-center shrink-0">
                      {salonStackIcons[index] ?? (
                        <Store className="w-5 h-5 text-[#00E5FF]" />
                      )}
                    </span>

                    <div className="flex-1 text-right space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base sm:text-xl font-black text-white">
                          {card.title}
                        </h3>
                        <span className="text-[11px] font-extrabold text-[#00E5FF] bg-[#00E5FF]/12 px-2.5 py-0.5 rounded-full shrink-0">
                          {card.metricValue}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۴ — FOR EVERY CLIENT / «برای مشتریان — زیبایی، بدون انتظار»
            نمایش کپسول‌های انیمیشنی و کارت‌های مرحله‌ای هنگام رسیدن اسکرول (مشابه ثانیه 00:27 ویدئو)
        ====================================================================== */}
        <section ref={clientSectionRef} className="space-y-7">
          <div className="space-y-2.5 max-w-lg mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-[#00E5FF] uppercase">
              <span>۰۴</span>
              <span className="w-6 h-px bg-[#00E5FF]/50" />
              <span>FOR EVERY CLIENT</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-snug">
              برای مشتریان
              <span className="block mt-1 bg-gradient-to-l from-[#00E5FF] to-[#38BDF8] bg-clip-text text-transparent">
                زیبایی، بدون انتظار
              </span>
            </h2>
          </div>

          <div className="max-w-md mx-auto flex flex-col items-stretch gap-3.5">
            {CLIENT_ANIMATED_FACTORS.map((factor, idx) => {
              const icons = [
                <Calendar key="c1" className="w-4 h-4 text-[#00E5FF]" />,
                <Bell key="c2" className="w-4 h-4 text-[#00E5FF]" />,
                <ShieldCheck key="c3" className="w-4 h-4 text-[#00E5FF]" />,
              ];
              return (
                <div
                  key={factor.id}
                  style={{
                    transitionDelay: `${idx * 130}ms`,
                    transform: clientSectionVisible
                      ? 'translate3d(0, 0, 0) scale(1)'
                      : 'translate3d(0, 24px, 0) scale(0.94)',
                    opacity: clientSectionVisible ? 1 : 0.12,
                  }}
                  className="rounded-3xl bg-gradient-to-l from-[#08194E] to-[#051034] border border-[#00E5FF]/30 p-4 sm:p-5 transition-all duration-500 shadow-[0_14px_34px_-12px_rgba(0,87,255,0.3)] select-none space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-full bg-[#0057FF]/30 border border-[#00E5FF]/40 flex items-center justify-center shrink-0">
                        {icons[idx]}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {factor.title}
                      </h3>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#00E5FF] bg-[#00E5FF]/12 px-2.5 py-1 rounded-full shrink-0">
                      {factor.highlightText}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pr-11">
                    {factor.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۵ — SMART WALLET / «کیف پول هوشمند»
            کارت زنده Timeto Pay با شمارش خودکار موجودی و نمودار ستونی متحرک (مشابه ثانیه 00:30 ویدئو)
        ====================================================================== */}
        <section className="space-y-7 max-w-2xl mx-auto">
          <div className="space-y-2 text-right sm:text-center">
            <div className="flex items-center sm:justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-[#00E5FF] uppercase">
              <span>۰۵</span>
              <span className="w-6 h-px bg-[#00E5FF]/50" />
              <span>SMART WALLET</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              کیف پول هوشمند
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              چقدر درآمد داشته‌اید، چقدر مانده، کی به حسابتان می‌رسد — بدون دفترچه و ماشین‌حساب.
            </p>
          </div>

          {/* کارت موشن‌گرافیک زنده کیف پول (Timeto Pay) */}
          <div className="rounded-[32px] bg-gradient-to-b from-[#081A52] to-[#040D2A] border border-[#00E5FF]/35 p-5 sm:p-7 space-y-5 shadow-[0_24px_60px_-15px_rgba(0,229,255,0.22)] select-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                موجودی کیف پول
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#00E5FF] font-latin">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                <span>Timeto Pay</span>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight transition-all duration-300">
                {activeWalletFrame.balanceText}{' '}
                <span className="text-xs sm:text-sm font-bold text-[#00E5FF]">
                  تومان
                </span>
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[11px] font-extrabold text-[#10B981]">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{activeWalletFrame.growthBadge}</span>
              </span>
            </div>

            {/* نمودار ستونی متحرک ۷ روز هفته */}
            <div className="flex items-end justify-between gap-2.5 h-28 pt-3 px-1">
              {WALLET_WEEK_DAYS.map((day, dIdx) => {
                const barHeight =
                  day.heights[walletFrameIdx % day.heights.length] ?? 50;
                const isHighlighted = dIdx === activeWalletFrame.activeDayIndex;
                return (
                  <div
                    key={day.short}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <div
                      style={{ height: `${barHeight}%` }}
                      className={`w-full max-w-[34px] rounded-xl transition-all duration-700 ease-out ${
                        isHighlighted
                          ? 'bg-gradient-to-t from-[#0057FF] to-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.75)]'
                          : 'bg-white/12'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold ${
                        isHighlighted ? 'text-[#00E5FF]' : 'text-slate-400'
                      }`}
                    >
                      {day.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ۳ ردیف توضیح مزایای کیف پول (مشابه ثانیه 00:32 ویدئو) */}
          <div className="space-y-3">
            {[
              {
                icon: <Wallet className="w-5 h-5 text-[#00E5FF]" />,
                title: 'موجودی لحظه‌ای',
                desc: 'با تکمیل هر نوبت، سهم شما همان لحظه به کیف پول درآمد اضافه می‌شود.',
              },
              {
                icon: <Landmark className="w-5 h-5 text-[#00E5FF]" />,
                title: 'تسویه با یک درخواست',
                desc: 'هر وقت خواستید درخواست تسویه بدهید؛ حداکثر ۲۴ تا ۴۸ ساعت بعد به حسابتان می‌نشیند.',
              },
              {
                icon: <ReceiptText className="w-5 h-5 text-[#00E5FF]" />,
                title: 'گزارش تراکنش‌ها',
                desc: 'تاریخچه‌ی کامل هر واریز و برداشت، با جزئیات نوبتی که از آن آمده.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl bg-[#061238]/90 border border-white/10 p-4 sm:p-5 flex items-start justify-between gap-3.5"
              >
                <span className="w-10 h-10 rounded-2xl bg-[#0B2168] border border-[#00E5FF]/30 flex items-center justify-center shrink-0">
                  {item.icon}
                </span>
                <div className="flex-1 text-right space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۶ — WHAT WE GUARANTEE / «چیزی که تضمین می‌کنیم»
        ====================================================================== */}
        <section ref={guaranteesSectionRef} className="space-y-7 max-w-2xl mx-auto">
          <div className="space-y-2 text-right sm:text-center">
            <div className="flex items-center sm:justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-[#00E5FF] uppercase">
              <span>۰۶</span>
              <span className="w-6 h-px bg-[#00E5FF]/50" />
              <span>WHAT WE GUARANTEE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              چیزی که تضمین می‌کنیم
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              این‌ها وعده‌ی آینده نیستند؛ همین حالا در برنامه کار می‌کنند.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />,
                title: 'پول تا پایان نوبت امانت است',
                desc: 'مبلغی که مشتری پرداخت می‌کند تا وقتی نوبت انجام نشده نزد پلتفرم می‌ماند — نه دست مشتری، نه هنوز دست سالن.',
              },
              {
                icon: <Bell className="w-5 h-5 text-[#00E5FF]" />,
                title: 'یادآوری یک ساعت قبل',
                desc: 'پیامک یادآوری خودکار برای مشتری فرستاده می‌شود؛ صندلی خالی از فراموشی کمتر می‌شود.',
              },
              {
                icon: <Landmark className="w-5 h-5 text-[#00E5FF]" />,
                title: 'تسویه ۲۴ تا ۴۸ ساعته',
                desc: 'هر وقت خواستید درخواست تسویه بدهید؛ حداکثر تا دو روز کاری به شماره حساب بانکی خودتان واریز می‌شود.',
              },
              {
                icon: <CalendarCheck className="w-5 h-5 text-[#00E5FF]" />,
                title: 'تراکنش‌های شفاف و قابل پیگیری',
                desc: 'هر واریز و برداشت با جزئیات نوبتی که از آن آمده ثبت می‌شود — قابل دیدن، قابل پیگیری.',
              },
            ].map((item, idx) => (
              <div
                key={item.title}
                style={{
                  transitionDelay: `${idx * 90}ms`,
                  transform: guaranteesVisible
                    ? 'translate3d(0, 0, 0)'
                    : 'translate3d(0, 22px, 0)',
                  opacity: guaranteesVisible ? 1 : 0.15,
                }}
                className="rounded-3xl bg-[#061238] border border-white/10 p-5 sm:p-6 space-y-3 transition-all duration-500 select-none"
              >
                <span className="w-11 h-11 rounded-2xl bg-[#0B2168] border border-[#00E5FF]/35 flex items-center justify-center">
                  {item.icon}
                </span>
                <h3 className="text-base font-black text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۷ — FREQUENTLY ASKED / «سؤال‌های پرتکرار»
        ====================================================================== */}
        <section className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2 text-right sm:text-center">
            <div className="flex items-center sm:justify-center gap-2 text-[11px] font-mono font-bold tracking-[0.18em] text-[#00E5FF] uppercase">
              <span>۰۷</span>
              <span className="w-6 h-px bg-[#00E5FF]/50" />
              <span>FREQUENTLY ASKED</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              سؤال‌های پرتکرار
            </h2>
          </div>

          <div className="space-y-3">
            {introFaqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/12 bg-[#061238]/90 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 text-right flex items-center justify-between gap-4 text-xs sm:text-sm font-extrabold text-white hover:bg-white/5 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#00E5FF] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            فراخوان پایانی با لوگوی درخشان تایم تو و دکمه‌های کپسولی (مشابه ثانیه 00:44 ویدئو)
        ====================================================================== */}
        <section className="pt-4 pb-8 text-center space-y-6 max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-22 h-22 rounded-full p-1 bg-gradient-to-b from-[#00E5FF] to-[#0057FF] shadow-[0_0_40px_rgba(0,229,255,0.5)]">
              <img
                src={TIMETO_BRAND_LOGO_URL}
                alt="تایم تو"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-lg font-black tracking-[0.28em] text-slate-200 font-latin">
              T i m e t o
            </span>
          </div>

          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              سالن بعدی‌تان
              <span className="block mt-1 bg-gradient-to-l from-[#00E5FF] to-[#38BDF8] bg-clip-text text-transparent">
                یک جست‌وجو فاصله دارد
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              سالن‌ها را ببینید و نوبتتان را بگیرید — یا اگر سالن دارید، چند دقیقه وقت بگذارید و از فردا نوبت‌هایتان خودشان ثبت شوند.
            </p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto pt-2">
            <button
              type="button"
              onClick={onSelectCustomerRole}
              className="w-full py-4 px-6 rounded-full bg-gradient-to-l from-[#0057FF] via-[#00A3FF] to-[#00E5FF] text-[#020718] font-black text-sm sm:text-base shadow-[0_14px_35px_-8px_rgba(0,229,255,0.65)] cursor-pointer hover:opacity-95 transition-opacity"
            >
              سالن‌ها را ببین
            </button>

            <button
              type="button"
              onClick={onSelectBusinessRole}
              className="w-full py-4 px-6 rounded-full bg-[#061238] hover:bg-[#0B1E5B] text-white border border-white/20 font-extrabold text-sm sm:text-base cursor-pointer transition-colors"
            >
              سالن خود را ثبت کنید
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
