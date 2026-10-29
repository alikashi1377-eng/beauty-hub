import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Pause,
  Play,
  Scissors,
  Sparkles,
  TrendingUp,
  UserPlus,
  X,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';
import { TIMETO_BRAND_LOGO_URL } from '../ui/TimetoLogo';

export interface BusinessStorySlide {
  id: string;
  badge: string;
  headline: string;
  subheadline: string;
  bullets: string[];
  visualQuote: string;
  ctaLabel: string;
  ctaHref: string;
  accentFrom: string;
  accentTo: string;
  glowColor: string;
}

export interface BusinessStoryItem {
  id: string;
  shortTitle: string;
  ringCategory: 'guide' | 'update' | 'tip' | 'finance';
  coverTag: string;
  coverGradient: string;
  iconName: 'start' | 'services' | 'hours' | 'customers' | 'finance' | 'boost';
  slides: BusinessStorySlide[];
}

export const SEEN_BUSINESS_STORIES_KEY = 'timeto_seen_business_stories_v1';

export const BUSINESS_DASHBOARD_STORIES: BusinessStoryItem[] = [
  {
    id: 'story-quickstart',
    shortTitle: 'شروع سریع',
    ringCategory: 'guide',
    coverTag: 'گام اول',
    coverGradient: 'from-[#061138] via-[#0057FF] to-[#00E5FF]',
    iconName: 'start',
    slides: [
      {
        id: 'slide-qs-1',
        badge: 'راهنمای شروع سالن‌داران · ۱ از ۲',
        headline: 'پروفایل سالن خود را در ۳ دقیقه به ۱۰۰٪ برسانید',
        subheadline:
          'سالن‌هایی که عکس پروفایل، نشانی دقیق روی نقشه و خدمات خود را کامل می‌کنند تا ۳ برابر رزرو بیشتری دریافت می‌کنند.',
        bullets: [
          '۱. آپلود لوگو یا تصویر فضای سالن با برش خودکار مربعی',
          '۲. تعیین موقعیت دقیق روی نقشه اصفهان و درچه برای مسیریابی مشتری',
          '۳. تکمیل نوار پیشرفت بالای پیشخوان تا رسیدن به ۱۰۰٪',
        ],
        visualQuote:
          'هر بخش از نوار پیشرفت را که کامل کنید، به صورت خودکار از لیست کارهای باقی‌مانده حذف می‌شود.',
        ctaLabel: 'تکمیل مشخصات و عکس سالن',
        ctaHref: '/app/profile',
        accentFrom: '#061138',
        accentTo: '#0057FF',
        glowColor: '#00E5FF',
      },
      {
        id: 'slide-qs-2',
        badge: 'راهنمای شروع سالن‌داران · ۲ از ۲',
        headline: 'لینک اختصاصی سالن شما آماده اشتراک‌گذاری در اینستاگرام است',
        subheadline:
          'مشتریان با باز کردن لینک اختصاصی شما، بدون نیاز به تماس تلفنی زمان‌های خالی را می‌بینند و نوبت می‌گیرند.',
        bullets: [
          'قرار دادن لینک مستقیم رزرو در بایو (Bio) اینستاگرام سالن',
          'امکان انتخاب همزمان چند خدمت توسط مشتری در یک نوبت',
          'ارسال پیامک خودکار کد رهگیری برای مشتری و مدیر سالن',
        ],
        visualQuote:
          'همین حالا آدرس اینستاگرام و معرفی سالن خود را در بخش پروفایل ثبت کنید.',
        ctaLabel: 'مشاهده و ویرایش پروفایل سالن',
        ctaHref: '/app/profile',
        accentFrom: '#0A194E',
        accentTo: '#0284C7',
        glowColor: '#38BDF8',
      },
    ],
  },
  {
    id: 'story-services',
    shortTitle: 'ثبت خدمات',
    ringCategory: 'guide',
    coverTag: 'آموزش',
    coverGradient: 'from-[#1E1B4B] via-[#4F46E5] to-[#06B6D4]',
    iconName: 'services',
    slides: [
      {
        id: 'slide-srv-1',
        badge: 'آموزش خدمات و تعرفه‌ها',
        headline: 'چطور خدمات و قیمت‌ها را شفاف و جذاب ثبت کنیم؟',
        subheadline:
          'تعرفه شفاف و مدت زمان دقیق هر خدمت، مهم‌ترین عامل اعتماد مشتریان برای رزرو آنلاین است.',
        bullets: [
          'دسته‌بندی خدمات در لاین‌های مجزا (مو، ناخن، پوست، مژه، پیرایش)',
          'تعیین مدت زمان دقیق هر خدمت (مثلاً ۶۰ دقیقه) برای جلوگیری از تداخل',
          'امکان فعال یا غیرفعال کردن موقت هر خدمت با یک کلیک',
        ],
        visualQuote:
          'با ثبت حداقل ۱ خدمت فعال، ۲۵٪ به پیشرفت تکمیل پروفایل شما اضافه می‌شود.',
        ctaLabel: 'ورود به بخش خدمات و تعرفه‌ها',
        ctaHref: '/app/services',
        accentFrom: '#1E1B4B',
        accentTo: '#0057FF',
        glowColor: '#00E5FF',
      },
    ],
  },
  {
    id: 'story-hours',
    shortTitle: 'ساعات کاری',
    ringCategory: 'tip',
    coverTag: 'مهم',
    coverGradient: 'from-[#064E3B] via-[#059669] to-[#34D399]',
    iconName: 'hours',
    slides: [
      {
        id: 'slide-hr-1',
        badge: 'تنظیم تقویم و شیفت‌ها',
        headline: 'روزهای باز و ساعات پذیرش سالن را دقیق مشخص کنید',
        subheadline:
          'سیستم تایم تو فقط در روزها و ساعاتی که شما باز اعلام کرده‌اید به مشتری اجازه ثبت نوبت می‌دهد.',
        bullets: [
          'تنظیم ساعت شروع و پایان کار برای هر روز هفته به صورت مجزا',
          'بستن روزهای تعطیل یا جمعه‌ها تنها با یک کلید کشویی',
          'محاسبه هوشمند اسلات‌های خالی بر اساس زمان هر خدمت',
        ],
        visualQuote:
          'تنظیم ساعات کاری ۲۰٪ از پیشرفت پرونده سالن شما را کامل می‌کند.',
        ctaLabel: 'تنظیم روزها و ساعات کاری',
        ctaHref: '/app/working-hours',
        accentFrom: '#064E3B',
        accentTo: '#059669',
        glowColor: '#6EE7B7',
      },
    ],
  },
  {
    id: 'story-customers',
    shortTitle: 'مشتریان دستی',
    ringCategory: 'update',
    coverTag: 'قابلیت جدید',
    coverGradient: 'from-[#0F172A] via-[#2563EB] to-[#38BDF8]',
    iconName: 'customers',
    slides: [
      {
        id: 'slide-cust-1',
        badge: 'قابلیت جدید ویژه سالن‌داران',
        headline: 'مشتریان حضوری و قدیمی خود را در چند ثانیه وارد کنید!',
        subheadline:
          'نیازی نیست منتظر رزرو آنلاین بمانید؛ تمام مشتریان فعلی سالن را به باشگاه مشتریان خود اضافه کنید.',
        bullets: [
          'ثبت سریع تکی فقط با نام و شماره موبایل در نوار بالای صفحه مشتریان',
          'ورود گروهی و یکجای ده‌ها مشتری با کپی و پیست از دفترچه یا اکسل',
          'ارسال پیامک یادآوری نوبت و پیامک تبریک یا تخفیف به مشتریان',
        ],
        visualQuote:
          'شماره‌های تکراری به صورت هوشمند تشخیص داده شده و ادغام می‌شوند.',
        ctaLabel: 'افزودن دستی یا گروهی مشتریان',
        ctaHref: '/app/customers?add=1',
        accentFrom: '#061138',
        accentTo: '#1D4ED8',
        glowColor: '#38BDF8',
      },
    ],
  },
  {
    id: 'story-finance',
    shortTitle: 'شبا و بیعانه',
    ringCategory: 'finance',
    coverTag: '+۱۵٪ پروفایل',
    coverGradient: 'from-[#1E293B] via-[#0F766E] to-[#14B8A6]',
    iconName: 'finance',
    slides: [
      {
        id: 'slide-fin-1',
        badge: 'اطلاعات بانکی و تسویه‌حساب',
        headline: 'شماره کارت و شبا برای واریز بیعانه‌ها را ثبت کنید',
        subheadline:
          'برای دریافت بیعانه رزروهای آنلاین و تسویه خودکار، شماره کارت ۱۶ رقمی یا شبای سالن را وارد نمایید.',
        bullets: [
          'کاهش چشمگیر کنسلی و عدم حضور مشتری با دریافت بیعانه آنلاین',
          'تسویه منظم به شماره شبای ثبت‌شده به نام مدیر سالن',
          'افزایش ۱۵ درصدی امتیاز تکمیل پروفایل بلافاصله پس از ثبت',
        ],
        visualQuote:
          'ثبت شماره کارت ۱۶ رقمی یا شماره شبا ۲۴ رقمی در بخش پروفایل سالن انجام می‌شود.',
        ctaLabel: 'ثبت شماره کارت و شبا',
        ctaHref: '/app/profile#financial-section',
        accentFrom: '#0F172A',
        accentTo: '#0F766E',
        glowColor: '#2DD4BF',
      },
    ],
  },
  {
    id: 'story-boost',
    shortTitle: 'ویترین ویژه',
    ringCategory: 'update',
    coverTag: 'افزایش رزرو',
    coverGradient: 'from-[#311042] via-[#7C3AED] to-[#EC4899]',
    iconName: 'boost',
    slides: [
      {
        id: 'slide-bst-1',
        badge: 'دیده شدن در صدر نتایج شهر',
        headline: 'سالن خود را در جایگاه اول جست‌وجوی اصفهان و درچه قرار دهید',
        subheadline:
          'با فعال‌سازی نشان «پیشنهاد ویژه» یا بنر صفحه اول، مشتریان جدید شهر ابتدا سالن شما را می‌بینند.',
        bullets: [
          'نمایش در ردیف اول نتایج جست‌وجوی سالن‌ها با کادر درخشان ویژه',
          'افزایش ظرفیت تعداد متخصصان قابل تعریف در تقویم سالن',
          'بسته‌های پیامکی آماده برای اطلاع‌رسانی جشنواره‌ها و تخفیف‌ها',
        ],
        visualQuote:
          'هر زمان که بخواهید می‌توانید از بخش «مالی و پلن» بسته دلخواه خود را فعال کنید.',
        ctaLabel: 'مشاهده پلن‌ها و بسته‌های تبلیغاتی',
        ctaHref: '/app/subscription',
        accentFrom: '#1E1B4B',
        accentTo: '#6D28D9',
        glowColor: '#F472B6',
      },
    ],
  },
];

export function getInitialSeenStoryIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SEEN_BUSINESS_STORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markStoryIdAsSeen(
  currentIds: string[],
  storyId: string
): string[] {
  if (currentIds.includes(storyId)) return currentIds;
  const next = [...currentIds, storyId];
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        SEEN_BUSINESS_STORIES_KEY,
        JSON.stringify(next)
      );
    } catch {
      // ignore storage errors
    }
  }
  return next;
}

/** تابع کمکی خالص برای حرکت به اسلاید یا استوری بعدی/قبلی */
export function resolveNextStoryPosition(params: {
  stories: BusinessStoryItem[];
  storyIndex: number;
  slideIndex: number;
  direction: 'NEXT' | 'PREV';
}): { storyIndex: number; slideIndex: number; shouldClose: boolean } {
  const { stories, storyIndex, slideIndex, direction } = params;
  const currentStory = stories[storyIndex];
  if (!currentStory) {
    return { storyIndex: 0, slideIndex: 0, shouldClose: true };
  }

  if (direction === 'NEXT') {
    if (slideIndex + 1 < currentStory.slides.length) {
      return { storyIndex, slideIndex: slideIndex + 1, shouldClose: false };
    }
    if (storyIndex + 1 < stories.length) {
      return { storyIndex: storyIndex + 1, slideIndex: 0, shouldClose: false };
    }
    return { storyIndex, slideIndex, shouldClose: true };
  }

  // PREV
  if (slideIndex > 0) {
    return { storyIndex, slideIndex: slideIndex - 1, shouldClose: false };
  }
  if (storyIndex > 0) {
    const prevStory = stories[storyIndex - 1];
    return {
      storyIndex: storyIndex - 1,
      slideIndex: Math.max(0, prevStory.slides.length - 1),
      shouldClose: false,
    };
  }
  return { storyIndex: 0, slideIndex: 0, shouldClose: false };
}

const StoryIconGraphic: React.FC<{
  iconName: BusinessStoryItem['iconName'];
  className?: string;
}> = ({ iconName, className = 'w-6 h-6 text-white' }) => {
  switch (iconName) {
    case 'start':
      return <Sparkles className={className} />;
    case 'services':
      return <Scissors className={className} />;
    case 'hours':
      return <CalendarClock className={className} />;
    case 'customers':
      return <UserPlus className={className} />;
    case 'finance':
      return <CreditCard className={className} />;
    case 'boost':
      return <TrendingUp className={className} />;
  }
};

export const BusinessStoriesBar: React.FC = () => {
  const navigate = useNavigate();
  const [seenIds, setSeenIds] = useState<string[]>(() =>
    getInitialSeenStoryIds()
  );
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);

  const activeStory =
    activeStoryIndex !== null
      ? BUSINESS_DASHBOARD_STORIES[activeStoryIndex] ?? null
      : null;
  const activeSlide = activeStory?.slides[activeSlideIndex] ?? null;

  const openStoryAt = (index: number) => {
    const target = BUSINESS_DASHBOARD_STORIES[index];
    if (!target) return;
    setSeenIds((prev) => markStoryIdAsSeen(prev, target.id));
    setActiveStoryIndex(index);
    setActiveSlideIndex(0);
    setProgressPct(0);
    setIsPaused(false);
  };

  const closeViewer = () => {
    setActiveStoryIndex(null);
    setActiveSlideIndex(0);
    setProgressPct(0);
  };

  const stepStory = (direction: 'NEXT' | 'PREV') => {
    if (activeStoryIndex === null) return;
    const res = resolveNextStoryPosition({
      stories: BUSINESS_DASHBOARD_STORIES,
      storyIndex: activeStoryIndex,
      slideIndex: activeSlideIndex,
      direction,
    });
    if (res.shouldClose) {
      closeViewer();
      return;
    }
    const nextStory = BUSINESS_DASHBOARD_STORIES[res.storyIndex];
    if (nextStory) {
      setSeenIds((prev) => markStoryIdAsSeen(prev, nextStory.id));
    }
    setActiveStoryIndex(res.storyIndex);
    setActiveSlideIndex(res.slideIndex);
    setProgressPct(0);
  };

  // تایمر خودکار استوری به سبک اینستاگرام (هر اسلاید ۶ ثانیه)
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return;
    const interval = window.setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + 2;
      });
    }, 120);
    return () => window.clearInterval(interval);
  }, [activeStoryIndex, activeSlideIndex, isPaused]);

  useEffect(() => {
    if (progressPct >= 100 && activeStoryIndex !== null) {
      stepStory('NEXT');
    }
  }, [progressPct, activeStoryIndex]);

  const handleStoryActionClick = (href: string) => {
    closeViewer();
    navigate(href);
  };

  return (
    <>
      {/* نوار استوری‌های آموزشی و اطلاعیه‌های بالای پیشخوان سالن */}
      <section
        aria-label="استوری‌های راهنما و اطلاعیه‌های سالن‌دار"
        className="rounded-3xl bg-white border border-[#CBD5E1] px-4 py-3.5 shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0057FF] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-extrabold text-[#061138]">
              راهنمای تصویری و اطلاعیه‌های سالن‌دار (استوری‌ها)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[#64748B]">
            برای مشاهده راهنما و لینک مستقیم روی هر استوری بزنید
          </span>
        </div>

        <div className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar py-1">
          {BUSINESS_DASHBOARD_STORIES.map((story, idx) => {
            const isSeen = seenIds.includes(story.id);
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => openStoryAt(idx)}
                className="group flex flex-col items-center gap-1.5 shrink-0 cursor-pointer focus:outline-none"
              >
                {/* حلقه دور استوری به سبک اینستاگرام */}
                <div
                  className={`p-[3px] rounded-full transition-transform duration-200 group-hover:scale-105 ${
                    isSeen
                      ? 'bg-[#CBD5E1]'
                      : 'bg-gradient-to-tr from-[#0057FF] via-[#00E5FF] to-[#F59E0B] shadow-[0_6px_18px_-4px_rgba(0,87,255,0.45)]'
                  }`}
                >
                  <div className="p-0.5 rounded-full bg-white">
                    <div
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${story.coverGradient} flex flex-col items-center justify-center overflow-hidden`}
                    >
                      <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-white/15 blur-xs" />
                      <StoryIconGraphic
                        iconName={story.iconName}
                        className="w-6 h-6 text-white drop-shadow-xs"
                      />
                      <span className="mt-0.5 text-[8px] font-extrabold text-[#00E5FF] tracking-tight">
                        {story.coverTag}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-extrabold max-w-[74px] truncate ${
                    isSeen
                      ? 'text-[#64748B]'
                      : 'text-[#061138] group-hover:text-[#0057FF]'
                  }`}
                >
                  {story.shortTitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* نمایشگر تمام‌صفحه استوری اینستاگرامی (پوستر تصویری + لینک مستقیم به بخش مربوطه) */}
      {activeStory && activeSlide ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeSlide.headline}
          className="fixed inset-0 z-50 bg-[#02081D]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={closeViewer}
        >
          <div
            className="relative w-full max-w-[400px] aspect-[9/16] max-h-[90vh] rounded-[32px] overflow-hidden border border-white/20 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] flex flex-col justify-between select-none"
            style={{
              background: `linear-gradient(155deg, ${activeSlide.accentFrom} 0%, ${activeSlide.accentTo} 100%)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* افکت نوری پس‌زمینه پوستر استوری */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 blur-3xl pointer-events-none"
              style={{ background: activeSlide.glowColor }}
            />
            <div
              className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full opacity-25 blur-3xl pointer-events-none"
              style={{ background: activeSlide.glowColor }}
            />

            {/* ۱. نوارهای پیشرفت بالای استوری + هدر برند و دکمه بستن */}
            <div className="relative z-20 p-4 pt-3.5 space-y-3 bg-gradient-to-b from-black/50 to-transparent">
              {/* نوارهای زمان استوری */}
              <div className="flex items-center gap-1.5" dir="ltr">
                {activeStory.slides.map((sl, sIdx) => {
                  const fillWidth =
                    sIdx < activeSlideIndex
                      ? 100
                      : sIdx === activeSlideIndex
                      ? progressPct
                      : 0;
                  return (
                    <div
                      key={sl.id}
                      className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                    >
                      <div
                        className="h-full bg-white rounded-full transition-all duration-100"
                        style={{ width: `${fillWidth}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* ردیف اطلاعات استوری و کنترل‌ها */}
              <div className="flex items-center justify-between gap-2 text-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={TIMETO_BRAND_LOGO_URL}
                    alt="Timeto"
                    className="w-9 h-9 rounded-xl object-cover border border-white/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold truncate">
                      {activeStory.shortTitle} · تایم تو
                    </p>
                    <p className="text-[10px] text-white/80 truncate">
                      {activeSlide.badge}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPaused((p) => !p)}
                    aria-label={isPaused ? 'ادامه پخش استوری' : 'توقف استوری'}
                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
                  >
                    {isPaused ? (
                      <Play className="w-3.5 h-3.5" />
                    ) : (
                      <Pause className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeViewer}
                    aria-label="بستن استوری"
                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ۲. بدنه گرافیکی پوستر استوری (توضیحات تصویری داخل کارت استوری) */}
            <div className="relative z-20 px-5 py-2 flex-1 flex flex-col justify-center space-y-4 text-white overflow-y-auto">
              {/* آیکون و تگ تصویری وسط پوستر */}
              <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-md text-[11px] font-extrabold text-[#00E5FF]">
                <StoryIconGraphic
                  iconName={activeStory.iconName}
                  className="w-4 h-4 text-[#00E5FF]"
                />
                <span>{activeStory.coverTag}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black leading-snug tracking-tight text-white drop-shadow-xs">
                {activeSlide.headline}
              </h3>

              <p className="text-xs text-white/90 leading-relaxed">
                {activeSlide.subheadline}
              </p>

              {/* کارت شیشه‌ای مراحل داخل عکس استوری */}
              <div className="rounded-2xl bg-black/28 border border-white/20 backdrop-blur-md p-3.5 space-y-2.5">
                {activeSlide.bullets.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                    <span className="text-white/95 font-semibold leading-relaxed">
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              {/* نکته کلیدی داخل پوستر */}
              <div className="p-3 rounded-2xl bg-white/12 border border-white/20 text-[11px] text-[#00E5FF] font-bold leading-relaxed">
                💡 {activeSlide.visualQuote}
              </div>
            </div>

            {/* ۳. دکمه لینک مستقیم پایین استوری (کلیک روی لینک داخل استوری و رفتن به همان بخش) */}
            <div className="relative z-20 p-4 pt-2 bg-gradient-to-t from-black/65 via-black/35 to-transparent space-y-2.5">
              <button
                type="button"
                onClick={() => handleStoryActionClick(activeSlide.ctaHref)}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-[#00E5FF] text-[#061138] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5)] transition-colors cursor-pointer"
              >
                <span>{activeSlide.ctaLabel}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* دکمه‌های ورق زدن به استوری قبلی و بعدی */}
              <div className="flex items-center justify-between text-[11px] text-white/80 pt-0.5">
                <button
                  type="button"
                  onClick={() => stepStory('PREV')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-white/15 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>قبلی</span>
                </button>
                <span className="tabular-nums font-bold">
                  استوری {toPersianDigits((activeStoryIndex ?? 0) + 1)} از{' '}
                  {toPersianDigits(BUSINESS_DASHBOARD_STORIES.length)}
                </span>
                <button
                  type="button"
                  onClick={() => stepStory('NEXT')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-white/15 cursor-pointer"
                >
                  <span>بعدی</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
