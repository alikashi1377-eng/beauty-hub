export type VisitorEntryRole = 'CUSTOMER' | 'BUSINESS_OWNER' | null;

export const VISITOR_ROLE_STORAGE_KEY = 'timeto_visitor_entry_role_v2';
export const VISITOR_ROLE_EVENT = 'timeto:visitor-role-changed';

export function getSavedVisitorRole(): VisitorEntryRole {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intro') === '1') return null;
    if (params.get('role') === 'customer') return 'CUSTOMER';
    if (params.get('role') === 'business') return 'BUSINESS_OWNER';

    const raw = window.localStorage.getItem(VISITOR_ROLE_STORAGE_KEY);
    if (raw === 'CUSTOMER' || raw === 'BUSINESS_OWNER') {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveVisitorRole(role: VisitorEntryRole): void {
  if (typeof window === 'undefined') return;
  try {
    if (role === null) {
      window.localStorage.removeItem(VISITOR_ROLE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(VISITOR_ROLE_STORAGE_KEY, role);
    }
    window.dispatchEvent(new CustomEvent(VISITOR_ROLE_EVENT, { detail: role }));
  } catch {
    // ignore storage errors
  }
}

export interface IntroBeautySpaceCard {
  id: string;
  numberLabel: string;
  title: string;
  subtitle: string;
  iconKey: 'barber' | 'women-salon' | 'skin-clinic' | 'nail-lash' | 'spa-massage' | 'traditional-barber';
}

export interface SalonOwnerStackCard {
  id: string;
  stepNumber: string;
  badge: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
}

export interface ClientAnimatedFactor {
  id: string;
  numberLabel: string;
  title: string;
  description: string;
  highlightText: string;
}

export interface WalletMotionFrame {
  frameIndex: number;
  balanceText: string;
  growthBadge: string;
  activeDayIndex: number;
  liveToastText: string;
  liveToastAmount: string;
}

export const TIMETO_INTRO_MARQUEE: string[] = [
  'مدیریت هوشمند سالن',
  'رزرو آنلاین ۲۴ ساعته',
  'پیرایش و استایل مو',
  'ناخن و ژل',
  'کلینیک زیبایی و فیشیال',
  'یادآوری خودکار نوبت',
  'تسویه شفاف و امن',
  'بدون تماس و انتظار',
];

export const TIMETO_INTRO_SPACES: IntroBeautySpaceCard[] = [
  {
    id: 'space-1',
    numberLabel: '۰۱',
    title: 'آرایشگاه مردانه',
    subtitle: 'فید تخصصی و استایل مو',
    iconKey: 'barber',
  },
  {
    id: 'space-2',
    numberLabel: '۰۲',
    title: 'سالن بانوان',
    subtitle: 'رنگ، لایت و میکاپ تخصصی',
    iconKey: 'women-salon',
  },
  {
    id: 'space-3',
    numberLabel: '۰۳',
    title: 'کلینیک زیبایی',
    subtitle: 'فیشیال و جوانسازی پوست',
    iconKey: 'skin-clinic',
  },
  {
    id: 'space-4',
    numberLabel: '۰۴',
    title: 'ناخن و ژل',
    subtitle: 'کاشت، لمینت و طراحی',
    iconKey: 'nail-lash',
  },
  {
    id: 'space-5',
    numberLabel: '۰۵',
    title: 'اسپا و ماساژ',
    subtitle: 'تراپی مو و ریلکسیشن',
    iconKey: 'spa-massage',
  },
  {
    id: 'space-6',
    numberLabel: '۰۶',
    title: 'عروس و داماد VIP',
    subtitle: 'گریم و تشریفات اختصاصی',
    iconKey: 'traditional-barber',
  },
];

export const SALON_OWNER_STACK_CARDS: SalonOwnerStackCard[] = [
  {
    id: 'stack-1',
    stepNumber: '۰۱',
    badge: 'مدیریت مالی یکپارچه',
    title: 'حساب‌وکتاب سالن، یک‌جا',
    description:
      'درآمد هر روز، کارمزد کسرشده و مانده‌ی قابل تسویه — بدون اینکه چیزی را جایی یادداشت کنید، شفاف جلوی چشم شماست.',
    metricLabel: 'مدیریت مالی سالن',
    metricValue: '۱۰۰٪ خودکار',
  },
  {
    id: 'stack-2',
    stepNumber: '۰۲',
    badge: 'پذیرش ۲۴ ساعته آنلاین',
    title: 'نوبت‌ها بدون تلفن',
    description:
      'تأیید، جابه‌جایی و لغو نوبت از داخل پنل؛ دیگر لازم نیست وسط کار سشوار یا میکاپ، گوشی را بردارید.',
    metricLabel: 'جذب نوبت در ساعات تعطیلی',
    metricValue: '۲۴ ساعته',
  },
  {
    id: 'stack-3',
    stepNumber: '۰۳',
    badge: 'کنترل کامل تقویم کاری',
    title: 'برنامه‌ی کاری دست خودتان',
    description:
      'ساعت کاری هر روز، وقت استراحت و تعطیلی‌ها را خودتان تعیین می‌کنید؛ خارج از آن کسی نوبت نمی‌گیرد.',
    metricLabel: 'انعطاف تقویم متخصصان',
    metricValue: 'لحظه‌ای و زنده',
  },
  {
    id: 'stack-4',
    stepNumber: '۰۴',
    badge: 'باشگاه مشتریان سالن',
    title: 'انتقال راحت مشتریان قبلی',
    description:
      'مشتریان قدیمی سالن را در چند ثانیه وارد کنید تا سابقه مراجعات و پیامک یادآوری نوبت برایشان فعال شود.',
    metricLabel: 'ثبت لیست مشتریان',
    metricValue: 'کمتر از ۱ دقیقه',
  },
];

export const CLIENT_ANIMATED_FACTORS: ClientAnimatedFactor[] = [
  {
    id: 'factor-1',
    numberLabel: '۰۱',
    title: 'رزرو در هر ساعتی از شبانه‌روز',
    description:
      'بدون نیاز به تماس تلفنی یا منتظر ماندن برای پاسخ دایرکت، تقویم واقعی سالن‌ها جلوی چشم شماست.',
    highlightText: 'دسترسی ۲۴/۷ به تقویم آزاد',
  },
  {
    id: 'factor-2',
    numberLabel: '۰۲',
    title: 'یادآوری یک ساعت قبل',
    description:
      'پیامک تایید و یادآوری دقیق قبل از زمان نوبت برایتان ارسال می‌شود تا هیچ وقتی فراموش نشود.',
    highlightText: 'ارسال پیامک یادآوری آنی',
  },
  {
    id: 'factor-3',
    numberLabel: '۰۳',
    title: 'پرداخت امن و شفاف',
    description:
      'قیمت دقیق هر خدمت را پیش از رزرو می‌بینید و مبلغ تا پایان نوبت نزد پلتفرم امانت می‌ماند.',
    highlightText: 'ضمانت امانت وجه',
  },
];

export const WALLET_MOTION_FRAMES: WalletMotionFrame[] = [
  {
    frameIndex: 0,
    balanceText: '۱۹,۳۰۸,۵۴۹',
    growthBadge: '+۱۴٪ رشد هفتگی',
    activeDayIndex: 2,
    liveToastText: 'رزرو جدید · فیشیال تخصصی پوست',
    liveToastAmount: '+۶۵۰,۰۰۰ تومان',
  },
  {
    frameIndex: 1,
    balanceText: '۲۴,۷۳۶,۶۰۹',
    growthBadge: '+۱۹٪ رشد هفتگی',
    activeDayIndex: 4,
    liveToastText: 'رزرو جدید · لایت و احیای مو',
    liveToastAmount: '+۱,۴۵۰,۰۰۰ تومان',
  },
  {
    frameIndex: 2,
    balanceText: '۲۸,۴۲۰,۰۰۰',
    growthBadge: '+۲۳٪ رشد هفتگی',
    activeDayIndex: 5,
    liveToastText: 'رزرو جدید · کاشت و لمینت ناخن',
    liveToastAmount: '+۴۸۰,۰۰۰ تومان',
  },
  {
    frameIndex: 3,
    balanceText: '۳۲,۸۵۰,۰۰۰',
    growthBadge: '+۲۸٪ رشد هفتگی',
    activeDayIndex: 5,
    liveToastText: 'تسویه خودکار کیف پول سالن',
    liveToastAmount: 'واریز موفق به حساب',
  },
];

export const WALLET_WEEK_DAYS = [
  { short: 'ش', heights: [32, 38, 44, 48] },
  { short: 'ی', heights: [28, 36, 42, 46] },
  { short: 'د', heights: [54, 48, 52, 58] },
  { short: 'س', heights: [44, 62, 58, 64] },
  { short: 'چ', heights: [58, 78, 72, 76] },
  { short: 'پ', heights: [72, 88, 96, 100] },
  { short: 'ج', heights: [26, 30, 34, 38] },
];

export interface HeroScrollStageInfo {
  stageIndex: 0 | 1 | 2;
  badgeText: string;
  headlineTop: string;
  headlineGradient: string;
  subtitle: string;
  floatingRightPill: string;
  floatingLeftPill: string;
  showLogoSpotlight: boolean;
}

export function computeHeroScrollStage(progressZeroToOne: number): HeroScrollStageInfo {
  const p = Math.max(0, Math.min(1, progressZeroToOne));
  if (p < 0.34) {
    return {
      stageIndex: 0,
      badgeText: 'رزرو آنلاین نوبت سالن زیبایی',
      headlineTop: 'نوبت سالن‌های زیبایی',
      headlineGradient: 'بدون تماس، بدون انتظار',
      subtitle:
        'ساعت‌های خالی آرایشگاه‌ها و سالن‌های زیبایی را ببینید و در لحظه نوبت بگیرید.',
      floatingRightPill: '⚡ مشاهده آنی ساعت‌های خالی',
      floatingLeftPill: '✨ بدون نیاز به تماس تلفنی',
      showLogoSpotlight: false,
    };
  }
  if (p < 0.68) {
    return {
      stageIndex: 1,
      badgeText: 'انتخاب آنلاین ساعت خالی · در ۳۰ ثانیه',
      headlineTop: 'ساعت‌های خالی آرایشگاه‌ها',
      headlineGradient: 'در یک نگاه، رزرو در لحظه',
      subtitle:
        'تعرفه شفاف خدمات، نمونه کارهای واقعی و تقویم آزاد متخصصان جلوی چشم شماست.',
      floatingRightPill: '🔔 یادآوری خودکار ۱ ساعت قبل',
      floatingLeftPill: '💳 پرداخت امن و تضمین بیعانه',
      showLogoSpotlight: true,
    };
  }
  return {
    stageIndex: 2,
    badgeText: 'تایم تو · زیست‌بوم هوشمند زیبایی',
    headlineTop: 'وقت زیبایی تو، به انتخاب تو',
    headlineGradient: 'مشتریان راضی، سالن همیشه فعال',
    subtitle:
      'همین حالا نقش خود را انتخاب کنید؛ سیستم انتخاب شما را برای مراجعات بعدی به خاطر می‌سپارد.',
    floatingRightPill: '✓ تایید آنی در تقویم سالن',
    floatingLeftPill: '📊 کیف پول و تسویه هوشمند',
    showLogoSpotlight: true,
  };
}

export function computePhoneCinematicStep(progressZeroToOne: number, autoTick: number): {
  activeStep: number;
  selectedSlot: string | null;
  isConfirmed: boolean;
} {
  // ترکیب اسکرول سینمایی و چرخه خودکار نرم تا چه با اسکرول و چه در حالت توقف، فیلم نوبت‌گیری زنده باشد
  const clamped = Math.max(0, Math.min(1, progressZeroToOne));
  let stepFromScroll = 0;
  if (clamped >= 0.72) stepFromScroll = 3;
  else if (clamped >= 0.45) stepFromScroll = 2;
  else if (clamped >= 0.2) stepFromScroll = 1;

  const effectiveStep = Math.max(stepFromScroll, ((autoTick % 4) + 4) % 4);

  if (effectiveStep === 0) {
    return { activeStep: 0, selectedSlot: null, isConfirmed: false };
  }
  if (effectiveStep === 1) {
    return { activeStep: 1, selectedSlot: '۱۶:۰۰', isConfirmed: false };
  }
  if (effectiveStep === 2) {
    return { activeStep: 2, selectedSlot: '۱۶:۰۰', isConfirmed: false };
  }
  return { activeStep: 3, selectedSlot: '۱۶:۰۰', isConfirmed: true };
}

