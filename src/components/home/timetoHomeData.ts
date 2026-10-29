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
    subtitle: 'فید تخصصی، استایل مو و پیرایش مدرن با نوبت‌دهی دقیق ساعتی',
    iconKey: 'barber',
  },
  {
    id: 'space-2',
    numberLabel: '۰۲',
    title: 'سالن زیبایی بانوان',
    subtitle: 'رنگ و لایت، شینیون، میکاپ تخصصی و احیای مو بدون انتظار در سالن',
    iconKey: 'women-salon',
  },
  {
    id: 'space-3',
    numberLabel: '۰۳',
    title: 'کلینیک زیبایی و پوست',
    subtitle: 'فیشیال تخصصی، پاکسازی چندمرحله‌ای و خدمات جوانسازی پوست',
    iconKey: 'skin-clinic',
  },
  {
    id: 'space-4',
    numberLabel: '۰۴',
    title: 'ناخن، مژه و ابرو',
    subtitle: 'کاشت ژل و پودر، لمینت، مانیکور روسی و اکستنشن مژه',
    iconKey: 'nail-lash',
  },
  {
    id: 'space-5',
    numberLabel: '۰۵',
    title: 'اسپا، تراپی و مراقبت مو',
    subtitle: 'پروتئین‌تراپی، کراتین، بوتاکس مو و خدمات ریلکسیشن',
    iconKey: 'spa-massage',
  },
  {
    id: 'space-6',
    numberLabel: '۰۶',
    title: 'متخصصان مستقل زیبایی',
    subtitle: 'تقویم اختصاصی برای آرایشگران و تراپیست‌های مستقل',
    iconKey: 'traditional-barber',
  },
];

export const SALON_OWNER_STACK_CARDS: SalonOwnerStackCard[] = [
  {
    id: 'stack-1',
    stepNumber: '۰۱',
    badge: 'مدیریت مالی و رزرواسیون',
    title: 'حساب‌وکتاب سالن، یک‌جا و شفاف',
    description:
      'از لحظه ثبت نوبت و دریافت بیعانه تا تسویه نهایی، همه تراکنش‌های سالن و سهم هر متخصص بدون کاغذبازی و خطای دستی در پیشخوان شما ثبت می‌شود.',
    metricLabel: 'صرفه‌جویی در زمان مدیریت',
    metricValue: '۱۰۰٪ خودکار',
  },
  {
    id: 'stack-2',
    stepNumber: '۰۲',
    badge: 'پذیرش ۲۴ ساعته آنلاین',
    title: 'نوبت‌ها بدون تلفن و بدون تداخل',
    description:
      'ساعت ۲ بامداد که سالن بسته است هم مشتری تقویم آزاد شما را می‌بیند و نوبتش را رزرو می‌کند؛ سیستم خودکار از هرگونه تداخل ساعت جلوگیری می‌کند.',
    metricLabel: 'جذب نوبت در ساعات تعطیلی',
    metricValue: '۲۴ ساعته',
  },
  {
    id: 'stack-3',
    stepNumber: '۰۳',
    badge: 'باشگاه مشتریان سالن',
    title: 'انتقال راحت مشتریان قبلی و حضوری',
    description:
      'مشتریان قدیمی سالن را به‌صورت تکی یا گروهی در چند ثانیه وارد کنید تا سابقه مراجعات، خدمات محبوب و یادآوری نوبت برایشان فعال شود.',
    metricLabel: 'ثبت لیست مشتریان قبلی',
    metricValue: 'در کمتر از ۱ دقیقه',
  },
  {
    id: 'stack-4',
    stepNumber: '۰۴',
    badge: 'کنترل کامل تقویم کاری',
    title: 'برنامه کاری دست خودتان است',
    description:
      'ساعات کاری، روزهای تعطیل، مدت زمان هر خدمت و تعرفه‌ها را هر زمان که بخواهید تغییر دهید؛ تقویم سالن در لحظه به‌روز می‌شود.',
    metricLabel: 'انعطاف تقویم متخصصان',
    metricValue: 'لحظه‌ای و زنده',
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
    title: 'یادآوری خودکار یک ساعت قبل',
    description:
      'پیامک تایید و یادآوری دقیق قبل از زمان نوبت برایتان ارسال می‌شود تا هیچ وقتی فراموش نشود.',
    highlightText: 'ارسال پیامک و کد رهگیری آنی',
  },
  {
    id: 'factor-3',
    numberLabel: '۰۳',
    title: 'پرداخت امن و تعرفه کاملاً شفاف',
    description:
      'قیمت دقیق هر خدمت و مدت زمان انجام آن را پیش از رزرو می‌بینید و مبلغ تا پایان نوبت نزد پلتفرم امانت می‌ماند.',
    highlightText: 'ضمانت شفافیت قیمت',
  },
];

export const WALLET_MOTION_FRAMES: WalletMotionFrame[] = [
  {
    frameIndex: 0,
    balanceText: '۱۸,۴۵۰,۰۰۰',
    growthBadge: '+۱۴٪ رشد هفتگی',
    activeDayIndex: 2,
    liveToastText: 'رزرو جدید · فیشیال تخصصی پوست',
    liveToastAmount: '+۶۵۰,۰۰۰ تومان',
  },
  {
    frameIndex: 1,
    balanceText: '۲۱,۹۰۰,۰۰۰',
    growthBadge: '+۱۸٪ رشد هفتگی',
    activeDayIndex: 3,
    liveToastText: 'رزرو جدید · لایت و احیای مو',
    liveToastAmount: '+۱,۴۵۰,۰۰۰ تومان',
  },
  {
    frameIndex: 2,
    balanceText: '۲۴,۶۵۰,۰۰۰',
    growthBadge: '+۲۲٪ رشد هفتگی',
    activeDayIndex: 4,
    liveToastText: 'رزرو جدید · کاشت و لمینت ناخن',
    liveToastAmount: '+۴۸۰,۰۰۰ تومان',
  },
  {
    frameIndex: 3,
    balanceText: '۲۷,۸۰۰,۰۰۰',
    growthBadge: '+۲۶٪ رشد هفتگی',
    activeDayIndex: 5,
    liveToastText: 'تسویه خودکار کیف پول سالن',
    liveToastAmount: 'واریز موفق به حساب',
  },
];

export const WALLET_WEEK_DAYS = [
  { short: 'ش', heights: [42, 48, 52, 58] },
  { short: 'ی', heights: [36, 44, 48, 52] },
  { short: 'د', heights: [58, 66, 62, 68] },
  { short: 'س', heights: [48, 76, 70, 74] },
  { short: 'چ', heights: [62, 68, 88, 84] },
  { short: 'پ', heights: [75, 82, 90, 100] },
  { short: 'ج', heights: [32, 36, 40, 44] },
];

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
