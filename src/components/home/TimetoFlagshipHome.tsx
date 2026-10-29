import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  HeartHandshake,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { TimetoIconMark, TimetoLogo } from '../ui/TimetoLogo';
import {
  CLIENT_ANIMATED_FACTORS,
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
  barber: <Scissors className="w-5 h-5 text-[#00E5FF]" />,
  'women-salon': <Sparkles className="w-5 h-5 text-[#00E5FF]" />,
  'skin-clinic': <Crown className="w-5 h-5 text-[#00E5FF]" />,
  'nail-lash': <Eye className="w-5 h-5 text-[#00E5FF]" />,
  'spa-massage': <HeartHandshake className="w-5 h-5 text-[#00E5FF]" />,
  'traditional-barber': <UserCheck className="w-5 h-5 text-[#00E5FF]" />,
};

const CINEMATIC_SLOTS = ['۱۰:۳۰', '۱۲:۰۰', '۱۴:۳۰', '۱۶:۰۰', '۱۷:۳۰', '۱۹:۰۰'];

export const TimetoFlagshipHome: React.FC<TimetoIntroGatewayProps> = ({
  onSelectCustomerRole,
  onSelectBusinessRole,
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [phoneScrollProgress, setPhoneScrollProgress] = useState(0);
  const [cinematicTick, setCinematicTick] = useState(0);
  const [walletFrameIdx, setWalletFrameIdx] = useState(0);
  const [clientSectionVisible, setClientSectionVisible] = useState(false);
  const [spacesVisible, setSpacesVisible] = useState(false);
  const [guaranteesVisible, setGuaranteesVisible] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  const phoneSectionRef = useRef<HTMLDivElement | null>(null);
  const spacesSectionRef = useRef<HTMLDivElement | null>(null);
  const clientSectionRef = useRef<HTMLDivElement | null>(null);
  const guaranteesSectionRef = useRef<HTMLDivElement | null>(null);

  // ردیابی اسکرول برای افکت سه‌بعدی هیرو و بخش رزرو ۳۰ ثانیه‌ای سینمایی
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      setScrollY(currentY);

      if (phoneSectionRef.current) {
        const rect = phoneSectionRef.current.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const totalTravel = rect.height - vh * 0.55;
        const scrolledInto = vh * 0.45 - rect.top;
        const progress =
          totalTravel > 0
            ? Math.max(0, Math.min(1, scrolledInto / totalTravel))
            : 0;
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
      { threshold: 0.18 }
    );

    if (spacesSectionRef.current) observer.observe(spacesSectionRef.current);
    if (clientSectionRef.current) observer.observe(clientSectionRef.current);
    if (guaranteesSectionRef.current) observer.observe(guaranteesSectionRef.current);

    return () => observer.disconnect();
  }, []);

  // چرخه سینمایی خودکار برای ماکاپ موبایل و حالت گیف (GIF) بخش کیف پول هوشمند
  useEffect(() => {
    const phoneInterval = window.setInterval(() => {
      setCinematicTick((prev) => (prev + 1) % 4);
    }, 2200);

    const walletInterval = window.setInterval(() => {
      setWalletFrameIdx((prev) => (prev + 1) % WALLET_MOTION_FRAMES.length);
    }, 1800);

    return () => {
      window.clearInterval(phoneInterval);
      window.clearInterval(walletInterval);
    };
  }, []);

  // محاسبه پیشرفت اسکرول در بخش Hero (از ۰ تا ۱ در ۳۲۰ پیکسل اول اسکرول)
  const heroProgress = Math.max(0, Math.min(1, scrollY / 280));
  const heroHexRotateZ = (scrollY * 0.04) % 360;
  const heroHexRotateX = 18 + heroProgress * 18;
  const heroHexScale = 1 + heroProgress * 0.16;

  // وضعیت سینمایی گوشی در بخش ۰۲
  const phoneState = computePhoneCinematicStep(phoneScrollProgress, cinematicTick);
  const phoneTiltY = -12 * (1 - phoneScrollProgress);
  const phoneTiltX = 8 * (1 - phoneScrollProgress);

  // فریم فعلی انیمیشن گیف‌مانند کیف پول در بخش ۰۵
  const activeWalletFrame =
    WALLET_MOTION_FRAMES[walletFrameIdx] ?? WALLET_MOTION_FRAMES[0];

  const introFaqs = [
    {
      q: 'چطور در تایم تو نوبت بگیرم؟',
      a: 'کافی است روی «سالن‌ها را ببین» بزنید تا وارد پلتفرم شوید؛ سپس سالن، خدمت و ساعت خالی دلخواهتان را انتخاب کنید تا نوبت بدون نیاز به تماس تلفنی ثبت شود.',
    },
    {
      q: 'اگر نوبتم را لغو کنم چه می‌شود؟',
      a: 'تا پیش از زمان مشخص‌شده در قوانین سالن، امکان لغو آنلاین نوبت از طریق حساب کاربری شما وجود دارد و مبلغ بیعانه طبق ضوابط شفاف پلتفرم مدیریت می‌شود.',
    },
    {
      q: 'چطور سالن زیبایی یا آرایشگاه خود را ثبت کنم؟',
      a: 'با زدن دکمه «سالن خود را ثبت کنید»، در کمتر از ۲ دقیقه مشخصات سالن، خدمات و ساعات کاری خود را ثبت می‌کنید تا صفحه اختصاصی سالن شما فعال شود.',
    },
    {
      q: 'آیا بعد از انتخاب نقش، دفعه بعد هم باید دوباره انتخاب کنم؟',
      a: 'خیر؛ به محض اینکه مشخص کنید مشتری هستید یا سالن‌دار، سیستم انتخاب شما را به خاطر می‌سپارد و در مراجعات بعدی مستقیماً بخش مربوط به خودتان را باز می‌کند.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#02081D] text-white selection:bg-[#00E5FF] selection:text-[#02081D] overflow-x-clip">
      {/* =====================================================================
          هدر فوق‌العاده مینیمال صفحه ورود (تک‌خطی و بدون شکستن متن در موبایل)
      ====================================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#02081D]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center shrink-0">
            <TimetoLogo size="sm" theme="dark" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onSelectCustomerRole}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/15 text-[11px] sm:text-xs font-extrabold text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              سالن‌ها را ببین
            </button>
            <button
              type="button"
              onClick={onSelectBusinessRole}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-l from-[#0057FF] to-[#00C6FF] text-white text-[11px] sm:text-xs font-black cursor-pointer hover:opacity-95 transition-opacity shadow-[0_6px_18px_-4px_rgba(0,163,255,0.55)] whitespace-nowrap shrink-0"
            >
              ثبت سالن
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO SECTION — سه‌بعدی و واکنش‌گرا به اسکرول (Sticky Scroll-Reveal Hero)
          بدون هیچ‌گونه باکس سرچ یا شلوغی اضافه؛ با اسکرول المان‌ها از عمق سه‌بعدی ظاهر می‌شوند
      ====================================================================== */}
      <section className="relative min-h-[155vh] pt-16">
        <div className="sticky top-16 min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden px-4 sm:px-6 py-8 sm:py-12">
          {/* پس‌زمینه هندسی سه‌بعدی که با اسکرول می‌چرخد و عمق می‌گیرد */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div
              className="w-[680px] h-[680px] sm:w-[880px] sm:h-[880px] rounded-full opacity-35 transition-transform duration-150 ease-out"
              style={{
                background:
                  'radial-gradient(circle, rgba(0,229,255,0.34) 0%, rgba(0,87,255,0.24) 38%, rgba(2,8,29,0) 70%)',
                transform: `scale3d(${heroHexScale}, ${heroHexScale}, 1)`,
              }}
            />

            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-150 ease-out"
              style={{
                perspective: '1000px',
              }}
            >
              <svg
                className="w-[520px] h-[520px] sm:w-[760px] sm:h-[760px] opacity-30"
                viewBox="0 0 600 600"
                style={{
                  transform: `rotateX(${heroHexRotateX}deg) rotateZ(${heroHexRotateZ}deg) scale(${heroHexScale})`,
                }}
              >
                <defs>
                  <linearGradient id="timeto-3d-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#0057FF" />
                  </linearGradient>
                </defs>
                {/* حلقه‌ها و شش‌ضلعی‌های سه‌بعدی هم‌مرکز */}
                <polygon
                  points="300,40 525,170 525,430 300,560 75,430 75,170"
                  fill="none"
                  stroke="url(#timeto-3d-grad)"
                  strokeWidth="1.6"
                />
                <polygon
                  points="300,95 478,198 478,402 300,505 122,402 122,198"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="1.2"
                  strokeDasharray="8 8"
                />
                <polygon
                  points="300,150 430,225 430,375 300,450 170,375 170,225"
                  fill="none"
                  stroke="#0057FF"
                  strokeWidth="1.5"
                />
                <circle
                  cx="300"
                  cy="300"
                  r="240"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="0.9"
                  strokeDasharray="4 10"
                />
                <circle
                  cx="300"
                  cy="300"
                  r="110"
                  fill="none"
                  stroke="url(#timeto-3d-grad)"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-[#02081D]/40 via-transparent to-[#02081D]" />
          </div>

          {/* محتوای مرکزی Hero با ظهور سه‌بعدی هنگام اسکرول */}
          <div
            className="relative z-10 max-w-2xl mx-auto my-auto text-center space-y-6"
            style={{ perspective: '900px' }}
          >
            {/* بج معرفی که با اسکرول از عمق سه‌بعدی ظاهر می‌شود */}
            <div
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#0A194E]/90 border border-[#00E5FF]/40 shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all duration-200"
              style={{
                opacity: 0.25 + heroProgress * 0.75,
                transform: `translate3d(0, ${(1 - heroProgress) * 18}px, 0) scale(${
                  0.92 + heroProgress * 0.08
                })`,
              }}
            >
              <TimetoIconMark size="sm" className="!w-6 !h-6 !rounded-lg" />
              <span className="text-xs sm:text-sm font-extrabold text-[#00E5FF]">
                رزرو آنلاین نوبت سالن زیبایی
              </span>
            </div>

            {/* تیتر اصلی کوبنده */}
            <div className="space-y-3">
              <h1
                className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.18] text-white transition-transform duration-200"
                style={{
                  transform: `translate3d(0, ${(1 - heroProgress) * -6}px, 0) scale(${
                    1.04 - heroProgress * 0.04
                  })`,
                }}
              >
                نوبت سالن‌های زیبایی
                <span className="block mt-2 bg-gradient-to-l from-[#00E5FF] via-[#38BDF8] to-[#0057FF] bg-clip-text text-transparent">
                  بدون تماس، بدون انتظار
                </span>
              </h1>

              {/* زیرنویس که با اسکرول ظاهر می‌شود */}
              <p
                className="text-xs sm:text-base text-slate-300 font-medium max-w-md mx-auto leading-relaxed transition-all duration-200"
                style={{
                  opacity: 0.2 + heroProgress * 0.8,
                  transform: `translate3d(0, ${(1 - heroProgress) * 22}px, 0)`,
                }}
              >
                از بهترین سالن‌های زیبایی در شهر خود، آنلاین و در چند ثانیه نوبت بگیرید.
              </p>
            </div>

            {/* دو دکمه اصلی تعیین نقش کاربر که با اسکرول بالا می‌آیند و برجسته می‌شوند */}
            <div
              className="flex flex-col sm:flex-row items-stretch justify-center gap-3.5 max-w-md mx-auto pt-2 transition-all duration-200"
              style={{
                opacity: 0.35 + heroProgress * 0.65,
                transform: `perspective(800px) translate3d(0, ${
                  (1 - heroProgress) * 28
                }px, 0) rotateX(${(1 - heroProgress) * 14}deg)`,
              }}
            >
              <button
                type="button"
                onClick={onSelectCustomerRole}
                className="group flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-l from-[#0057FF] to-[#00E5FF] text-[#02081D] font-black text-sm sm:text-base shadow-[0_16px_40px_-10px_rgba(0,229,255,0.65)] hover:opacity-95 cursor-pointer transition-all whitespace-nowrap"
              >
                <span>سالن‌ها را ببین</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onSelectBusinessRole}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#09153E]/90 hover:bg-[#102466] text-white border border-[#00E5FF]/35 font-extrabold text-sm sm:text-base cursor-pointer transition-all whitespace-nowrap"
              >
                <Store className="w-4 h-4 text-[#00E5FF]" />
                <span>سالن خود را ثبت کنید</span>
              </button>
            </div>
          </div>

          {/* نشانگر متحرک «اسکرول |» در پایین هیرو */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
            className="relative z-10 mx-auto flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#00E5FF] cursor-pointer transition-opacity duration-300"
            style={{ opacity: Math.max(0.2, 1 - heroProgress * 0.95) }}
          >
            <span className="text-[11px] font-bold tracking-widest">اسکرول</span>
            <span className="w-0.5 h-7 rounded-full bg-gradient-to-b from-[#00E5FF] to-transparent animate-bounce" />
          </button>
        </div>
      </section>

      {/* =====================================================================
          نوار تیکر افقی مینیمال (Marquee Strip)
      ====================================================================== */}
      <div className="border-y border-white/10 bg-[#050E2E]/90 py-3.5 overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-slate-300">
          {TIMETO_INTRO_MARQUEE.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 whitespace-nowrap">
              <span className="text-[#00E5FF]" aria-hidden="true">
                ✦
              </span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-[1060px] mx-auto px-4 sm:px-6 space-y-24 sm:space-y-32 py-16 sm:py-24">
        {/* =====================================================================
            بخش ۰۱ — FOR EVERY BEAUTY SPACE / «برای هر سالن زیبایی»
            (صرفاً نمایشی و غیرقابل کلیک با انیمیشن ورود سه‌بعدی هنگام اسکرول)
        ====================================================================== */}
        <section ref={spacesSectionRef} className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#00E5FF] uppercase block">
              ۰۱ — FOR EVERY BEAUTY SPACE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              برای هر سالن زیبایی
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              طراحی‌شده برای تمام فضاهای زیبایی، پیرایش و مراقبت تخصصی
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {TIMETO_INTRO_SPACES.map((space, idx) => (
              <div
                key={space.id}
                style={{
                  transitionDelay: `${idx * 70}ms`,
                  transform: spacesVisible
                    ? 'perspective(800px) translate3d(0, 0, 0) rotateX(0deg)'
                    : 'perspective(800px) translate3d(0, 28px, 0) rotateX(10deg)',
                  opacity: spacesVisible ? 1 : 0.15,
                }}
                className="rounded-3xl bg-[#071238]/90 border border-white/10 p-4 sm:p-6 flex flex-col justify-between gap-4 transition-all duration-500 select-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="w-11 h-11 rounded-2xl bg-[#0B1E5B] border border-[#00E5FF]/30 flex items-center justify-center shrink-0">
                    {INTRO_SPACE_ICONS[space.iconKey]}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#00E5FF]/60 tabular-nums">
                    {space.numberLabel}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-lg font-extrabold text-white">
                    {space.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                    {space.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۲ — BOOK IN 30 SECONDS / «رزرو در ۳۰ ثانیه»
            حالت سینمایی سه‌بعدی با اسکرول (بدون امکان کلیک؛ نمایش زنده نحوه رزرو)
        ====================================================================== */}
        <section
          ref={phoneSectionRef}
          className="relative min-h-[135vh] rounded-[36px] bg-gradient-to-b from-[#061138] to-[#030921] border border-[#00E5FF]/20 p-6 sm:p-10 lg:p-12 shadow-[0_30px_80px_-20px_rgba(0,87,255,0.28)]"
        >
          <div className="sticky top-24 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* متن و مراحل سینمایی که همگام با گوشی روشن می‌شوند */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-2">
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#00E5FF] uppercase block">
                  ۰۲ — BOOK IN 30 SECONDS
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  رزرو در ۳۰ ثانیه
                  <span className="block text-[#00E5FF] text-lg sm:text-2xl mt-1">
                    سالن، خدمت و ساعت — تمام!
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  ببینید مشتری چقدر ساده و بدون حتی یک تماس تلفنی، نوبت خود را در تایم تو ثبت می‌کند:
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    step: 0,
                    num: '۰۱',
                    title: 'ورود و انتخاب سالن زیبایی',
                    desc: 'مشاهده سالن و امتیاز واقعی مراجعان',
                  },
                  {
                    step: 1,
                    num: '۰۲',
                    title: 'انتخاب ساعت خالی (۱۶:۰۰)',
                    desc: 'نمایش لحظه‌ای ساعت‌های آزاد امروز بدون تداخل',
                  },
                  {
                    step: 3,
                    num: '۰۳',
                    title: 'ثبت نهایی نوبت — تمام!',
                    desc: 'تایید آنی در تقویم سالن و ارسال پیامک یادآوری',
                  },
                ].map((item) => {
                  const isCurrent =
                    phoneState.activeStep === item.step ||
                    (item.step === 3 && phoneState.isConfirmed);
                  return (
                    <div
                      key={item.num}
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        isCurrent
                          ? 'bg-[#0B2168] border-[#00E5FF] shadow-[0_0_25px_rgba(0,229,255,0.2)] translate-x-[-4px]'
                          : 'bg-white/4 border-white/10 opacity-65'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                            isCurrent
                              ? 'bg-[#00E5FF] text-[#02081D]'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {item.num}
                        </span>
                        <div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-white">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ماکاپ سه‌بعدی گوشی که با اسکرول زاویه می‌گیرد و فیلم رزرو را پخش می‌کند */}
            <div
              className="lg:col-span-6 flex justify-center pointer-events-none select-none"
              style={{ perspective: '1100px' }}
            >
              <div
                className="relative w-full max-w-[310px] rounded-[40px] border-[6px] border-[#1E293B] bg-[#02081D] p-4 shadow-[0_30px_80px_-15px_rgba(0,229,255,0.35)] transition-transform duration-200 ease-out"
                style={{
                  transform: `rotateY(${phoneTiltY}deg) rotateX(${phoneTiltX}deg)`,
                }}
              >
                {/* ناچ بالای گوشی */}
                <div className="w-24 h-4 bg-[#0F172A] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="w-8 h-1 rounded-full bg-slate-700" />
                </div>

                {/* هدر داخل اپ */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <TimetoIconMark size="sm" className="!w-7 !h-7 !rounded-lg" />
                    <div className="text-right">
                      <p className="text-[11px] font-extrabold text-white">
                        سلام، وقتشه بدرخشی ✨
                      </p>
                      <p className="text-[10px] text-[#00E5FF]">تایم تو · Timeto</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#0057FF]/30 text-[10px] font-bold text-[#00E5FF]">
                    آنلاین
                  </span>
                </div>

                {/* کارت سالن داخل گوشی */}
                <div
                  className={`mt-3 p-3 rounded-2xl border transition-all duration-300 ${
                    phoneState.activeStep >= 0
                      ? 'bg-[#0A194E] border-[#00E5FF]/40'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">
                      سالن زیبایی رویال گلزار
                    </span>
                    <span className="text-[11px] font-extrabold text-[#F59E0B] tabular-nums">
                      ★ ۴.۹
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    فیشیال تخصصی و احیای مو
                  </p>
                </div>

                {/* گرید ساعت‌های داخل گوشی */}
                <div className="mt-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">انتخاب ساعت:</span>
                    <span className="text-[#00E5FF] font-extrabold">
                      {phoneState.selectedSlot ? `ساعت ${phoneState.selectedSlot}` : 'امروز'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {CINEMATIC_SLOTS.map((slot) => {
                      const isTarget = slot === '۱۶:۰۰';
                      const isHighlighted =
                        isTarget && phoneState.selectedSlot === '۱۶:۰۰';
                      return (
                        <div
                          key={slot}
                          className={`relative py-2 rounded-xl text-center text-xs font-extrabold tabular-nums transition-all duration-300 ${
                            slot === '۱۴:۳۰'
                              ? 'bg-white/5 text-slate-600 line-through'
                              : isHighlighted
                              ? 'bg-[#00E5FF] text-[#02081D] shadow-[0_0_20px_rgba(0,229,255,0.75)] scale-105'
                              : 'bg-white/8 text-slate-200'
                          }`}
                        >
                          {slot}
                          {isHighlighted && !phoneState.isConfirmed ? (
                            <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-white animate-ping" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* پیام تایید نهایی سینمایی در پایین گوشی */}
                <div
                  className={`mt-4 p-3.5 rounded-2xl border transition-all duration-300 ${
                    phoneState.isConfirmed
                      ? 'bg-[#10B981]/25 border-[#10B981] shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {phoneState.isConfirmed ? (
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-[#10B981] text-[#02081D] flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>
                      <div>
                        <p className="text-xs font-black text-white">
                          ✓ نوبت شما ثبت شد — ۱۶:۰۰
                        </p>
                        <p className="text-[10px] text-emerald-200">
                          بدون تماس، در کمتر از ۳۰ ثانیه
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                      <span>در حال انتخاب ساعت ۱۶:۰۰...</span>
                      <Clock className="w-4 h-4 text-[#00E5FF]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۳ — BUILT FOR SALON OWNERS / «برای سالن‌داران — سالن شما، همیشه باز»
            کانتینرهای پله‌ای که با اسکرول روی کانتینر قبلی قرار می‌گیرند (Sticky Stacking Cards)
        ====================================================================== */}
        <section className="space-y-8">
          <div className="text-center space-y-2.5 max-w-xl mx-auto">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#00E5FF] uppercase block">
              ۰۳ — BUILT FOR SALON OWNERS
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              برای سالن‌داران —{' '}
              <span className="text-[#00E5FF]">سالن شما، همیشه باز</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              با اسکرول به پایین ببینید تایم تو چطور مدیریت سالن شما را متحول می‌کند:
            </p>
          </div>

          {/* کانتینرهای Sticky که با اسکرول یکی پس از دیگری روی قبلی می‌لغزند */}
          <div className="relative space-y-6 pb-8 max-w-3xl mx-auto">
            {SALON_OWNER_STACK_CARDS.map((card, index) => {
              const stickyTopPx = 88 + index * 22;
              return (
                <div
                  key={card.id}
                  style={{
                    top: `${stickyTopPx}px`,
                    zIndex: 10 + index * 10,
                  }}
                  className="sticky rounded-[30px] bg-gradient-to-br from-[#081748] via-[#061238] to-[#030A24] border border-[#00E5FF]/35 p-6 sm:p-8 shadow-[0_-14px_40px_rgba(2,8,29,0.85),0_20px_50px_-15px_rgba(0,87,255,0.35)] transition-transform duration-300"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0057FF]/30 border border-[#00E5FF]/35 text-xs font-extrabold text-[#00E5FF]">
                      <span className="font-mono">{card.stepNumber}</span>
                      <span>·</span>
                      <span>{card.badge}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {card.metricLabel}:{' '}
                      <strong className="text-[#00E5FF]">{card.metricValue}</strong>
                    </span>
                  </div>

                  <div className="pt-4 space-y-2.5">
                    <h3 className="text-lg sm:text-2xl font-black text-white">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۴ — FOR EVERY CLIENT / «برای مشتریان — زیبایی، بدون انتظار»
            نمایش انیمیشنی هر فاکتور به محض رسیدن اسکرول (بدون لیست متخصصان)
        ====================================================================== */}
        <section ref={clientSectionRef} className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#00E5FF] uppercase block">
              ۰۴ — FOR EVERY CLIENT
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              برای مشتریان —{' '}
              <span className="text-[#00E5FF]">زیبایی، بدون انتظار</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              هر ساعتی که تصمیم گرفتید، نوبت شما در چند ثانیه آماده است
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CLIENT_ANIMATED_FACTORS.map((factor, idx) => (
              <div
                key={factor.id}
                style={{
                  transitionDelay: `${idx * 150}ms`,
                  transform: clientSectionVisible
                    ? 'translate3d(0, 0, 0) scale(1)'
                    : 'translate3d(0, 32px, 0) scale(0.95)',
                  opacity: clientSectionVisible ? 1 : 0.1,
                }}
                className="rounded-3xl bg-[#07133A] border border-[#00E5FF]/25 p-6 space-y-4 transition-all duration-500 shadow-[0_18px_40px_-15px_rgba(0,87,255,0.25)] select-none"
              >
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-[#0057FF]/30 border border-[#00E5FF]/40 flex items-center justify-center text-xs font-mono font-black text-[#00E5FF]">
                    {factor.numberLabel}
                  </span>
                  <span className="text-[11px] font-extrabold text-[#00E5FF] bg-[#00E5FF]/10 px-3 py-1 rounded-xl">
                    {factor.highlightText}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    {factor.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {factor.description}
                  </p>
                </div>

                {/* نوار پیشرفت نوری انیمیشنی */}
                <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-[#00E5FF] to-[#0057FF] transition-all duration-1000"
                    style={{
                      width: clientSectionVisible ? '100%' : '15%',
                      transitionDelay: `${idx * 200 + 200}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۵ — SMART WALLET / «کیف پول هوشمند»
            نمایش خودکار به صورت موشن‌گرافیک زنده (حالت GIF متحرک بدون نیاز به کلیک)
        ====================================================================== */}
        <section className="rounded-[36px] bg-gradient-to-br from-[#071544] via-[#040C28] to-[#02081D] border border-[#00E5FF]/25 p-6 sm:p-10 lg:p-12 shadow-[0_28px_70px_-20px_rgba(0,87,255,0.3)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#00E5FF] uppercase block">
                ۰۵ — SMART WALLET
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                کیف پول هوشمند
                <span className="block text-[#00E5FF] text-lg sm:text-2xl mt-1">
                  هر ریال، سر جای خودش
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                درآمدهای روزانه، بیعانه‌های دریافتی و تسویه‌حساب‌ها به‌صورت خودکار و لحظه‌ای در کیف پول هوشمند ثبت و نمایش داده می‌شوند.
              </p>

              <div className="space-y-2.5 pt-1 text-xs font-bold text-slate-200">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>نگهداری امن مبلغ تا پایان انجام خدمت</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>نمودار زنده عملکرد روزانه و هفتگی</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className="w-4 h-4 text-[#00E5FF] shrink-0" />
                  <span>تسویه منظم و تاریخچه شفاف تراکنش‌ها</span>
                </div>
              </div>
            </div>

            {/* ویجت موشن‌گرافیک خودکار (حالت GIF زنده) */}
            <div className="lg:col-span-7 pointer-events-none select-none">
              <div className="rounded-3xl bg-[#09184D] border border-[#00E5FF]/35 p-5 sm:p-7 space-y-5 shadow-[0_0_40px_rgba(0,229,255,0.14)]">
                {/* ردیف موجودی در حال شمارش خودکار */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-300 block">
                      موجودی کیف پول (نمایش زنده)
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-0.5 transition-all duration-300">
                      {activeWalletFrame.balanceText}{' '}
                      <span className="text-xs font-bold text-[#00E5FF]">تومان</span>
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-xs font-extrabold text-[#10B981] tabular-nums">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{activeWalletFrame.growthBadge}</span>
                  </span>
                </div>

                {/* اعلان شناور تراکنش زنده (مثل گیف متحرک) */}
                <div className="rounded-2xl bg-[#040D2C] border border-[#00E5FF]/30 px-4 py-2.5 flex items-center justify-between gap-2 transition-all duration-500">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {activeWalletFrame.liveToastText}
                  </span>
                  <span className="text-xs font-black text-[#00E5FF] shrink-0 tabular-nums">
                    {activeWalletFrame.liveToastAmount}
                  </span>
                </div>

                {/* نمودار ستونی متحرک ۷ روز هفته */}
                <div className="flex items-end justify-between gap-2.5 h-32 pt-4 px-2">
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
                          className={`w-full max-w-[30px] rounded-t-xl transition-all duration-700 ease-out ${
                            isHighlighted
                              ? 'bg-gradient-to-t from-[#0057FF] to-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.65)]'
                              : 'bg-white/15'
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
            </div>
          </div>
        </section>

        {/* =====================================================================
            بخش ۰۶ — WHAT WE GUARANTEE / «چیزی که تضمین می‌کنیم»
        ====================================================================== */}
        <section ref={guaranteesSectionRef} className="space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#00E5FF] uppercase block">
              ۰۶ — WHAT WE GUARANTEE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              چیزی که تضمین می‌کنیم
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              {
                num: '۰۱',
                title: 'پول تا پایان نوبت امانت است',
                desc: 'مبلغ پرداختی شما تا زمان انجام کامل نوبت در کیف پول امن نگهداری می‌شود.',
              },
              {
                num: '۰۲',
                title: 'یادآوری یک ساعت قبل',
                desc: 'ارسال پیامک خودکار به مشتری و سالن‌دار برای جلوگیری از فراموشی نوبت.',
              },
              {
                num: '۰۳',
                title: 'تسویه ۲۴ تا ۴۸ ساعته',
                desc: 'واریز منظم و بدون تاخیر درآمد سالن‌ها به حساب بانکی ثبت‌شده.',
              },
              {
                num: '۰۴',
                title: 'تراکنش‌های شفاف و قابل پیگیری',
                desc: 'ثبت دقیق کد رهگیری برای هر نوبت و پشتیبانی مستقیم تلفنی و تیکتی.',
              },
            ].map((item, idx) => (
              <div
                key={item.num}
                style={{
                  transitionDelay: `${idx * 100}ms`,
                  transform: guaranteesVisible
                    ? 'translate3d(0, 0, 0)'
                    : 'translate3d(0, 24px, 0)',
                  opacity: guaranteesVisible ? 1 : 0.15,
                }}
                className="rounded-3xl bg-[#071238] border border-white/10 p-6 space-y-2.5 transition-all duration-500 select-none"
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
                  <span className="text-xs font-mono font-bold text-[#00E5FF]/60">
                    {item.num}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
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
        <section className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] text-[#00E5FF] uppercase block">
              ۰۷ — FREQUENTLY ASKED
            </span>
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
                  className="rounded-2xl border border-white/12 bg-[#071238]/90 overflow-hidden"
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
            فراخوان پایانی تعیین نقش (Final Role Selection Gateway)
        ====================================================================== */}
        <section className="rounded-[36px] bg-gradient-to-b from-[#08184B] to-[#040B24] border border-[#00E5FF]/30 p-8 sm:p-12 text-center space-y-6 shadow-[0_24px_60px_-20px_rgba(0,229,255,0.2)]">
          <div className="flex justify-center">
            <TimetoIconMark size="lg" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              سالن بعدی‌تان یک جست‌وجو فاصله دارد
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              نقش خود را انتخاب کنید؛ سیستم انتخاب شما را برای مراجعات بعدی ذخیره می‌کند:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3.5 max-w-md mx-auto pt-2">
            <button
              type="button"
              onClick={onSelectCustomerRole}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-l from-[#0057FF] to-[#00E5FF] text-[#02081D] font-black text-sm sm:text-base cursor-pointer hover:opacity-95 transition-opacity"
            >
              <span>سالن‌ها را ببین</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onSelectBusinessRole}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-[#00E5FF]/35 font-extrabold text-sm sm:text-base cursor-pointer transition-colors"
            >
              <Store className="w-4 h-4 text-[#00E5FF]" />
              <span>سالن خود را ثبت کنید</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
