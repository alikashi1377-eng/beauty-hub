import {
  AdPackageItem,
  AppointmentItem,
  AppointmentStatus,
  BusinessItem,
  BusinessType,
  CategoryItem,
  CustomerRecord,
  GalleryItem,
  MarketingCampaignItem,
  PaymentGatewayConfig,
  PaymentOrderItem,
  ReviewItem,
  ServiceItem,
  SpecialistItem,
  SubscriptionPlanItem,
  SubscriptionStatus,
} from '../types';

export const IRAN_CITIES = ['اصفهان'];

export const ISFAHAN_NEIGHBORHOODS = [
  'چهارباغ بالا',
  'مرداویج',
  'نظر شرقی',
  'شیخ صدوق جنوبی',
  'جلفا',
  'سپاهان‌شهر',
  'خانه اصفهان',
  'پروین',
  'ملک‌شهر',
];

export const SAMPLE_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    slug: 'makeup',
    title: 'آرایش و میکاپ',
    subtitle: 'میکاپ محفلی، گریم تخصصی عروس و شینیون‌های مدرن',
    serviceCount: 0,
    targetAudience: 'سالن‌های زیبایی و میکاپ‌آرتیست‌ها',
    iconName: 'Sparkles',
  },
  {
    id: 'cat-2',
    slug: 'nails',
    title: 'ناخن',
    subtitle: 'مانیکور روسی، استحکام‌سازی (لمینت)، ژلیش و پدیکور اسپا',
    serviceCount: 0,
    targetAudience: 'سالن‌ها و ناخن‌کاران تخصصی',
    iconName: 'Gem',
  },
  {
    id: 'cat-3',
    slug: 'hair-color',
    title: 'مو و رنگ',
    subtitle: 'کوتاهی ژورنالی، بالیاژ، آمبره، کراتین و پروتئین‌تراپی مو',
    serviceCount: 0,
    targetAudience: 'سالن‌های تخصصی مو',
    iconName: 'Scissors',
  },
  {
    id: 'cat-4',
    slug: 'skincare-facial',
    title: 'پوست و فیشیال',
    subtitle: 'پاکسازی چندمرحله‌ای، هیدرافیشیال، آبرسانی عمیق و اسیدتراپی',
    serviceCount: 0,
    targetAudience: 'استودیوهای مراقبت پوست و فیشیالیست‌ها',
    iconName: 'Droplets',
  },
  {
    id: 'cat-5',
    slug: 'brows-lashes',
    title: 'ابرو و مژه',
    subtitle: 'لیفت و لمینت مژه و ابرو، اکستنشن کلاسیک و طراحی قرینه ابرو',
    serviceCount: 0,
    targetAudience: 'متخصصان ابرو و مژه',
    iconName: 'Eye',
  },
  {
    id: 'cat-6',
    slug: 'men-barbershop',
    title: 'آرایشگاه مردانه',
    subtitle: 'کوتاهی مدرن و کلاسیک مردانه، فید تخصصی و گریم داماد',
    serviceCount: 0,
    targetAudience: 'آرایشگاه‌ها و پیرایشگاه‌های مردانه',
    iconName: 'UserCheck',
  },
  {
    id: 'cat-7',
    slug: 'grooming',
    title: 'اصلاح و پیرایش',
    subtitle: 'اصلاح و قرینه‌سازی ریش با حوله گرم، پاکسازی صورت و استایلینگ',
    serviceCount: 0,
    targetAudience: 'پیرایشگران حرفه‌ای',
    iconName: 'Award',
  },
  {
    id: 'cat-8',
    slug: 'massage-spa',
    title: 'ماساژ و مراقبت بدن',
    subtitle: 'ماساژ ریلکسیشن، اسپا، بادی‌اسکراب و رفع گرفتگی عضلات',
    serviceCount: 0,
    targetAudience: 'مراکز اسپا و مراقبت بدن',
    iconName: 'HeartHandshake',
  },
  {
    id: 'cat-9',
    slug: 'bridal',
    title: 'عروس',
    subtitle: 'پکیج VIP میکاپ و شینیون عروس، گریم سینمایی، تاج و تور و مشاوره تخصصی عروس',
    serviceCount: 0,
    targetAudience: 'سالن‌های تخصصی عروس و میکاپ‌آرتیست‌های VIP',
    iconName: 'Crown',
  },
  {
    id: 'cat-10',
    slug: 'groom',
    title: 'داماد',
    subtitle: 'پکیج VIP گریم و پیرایش داماد، فیشیال و پاکسازی صورت داماد و استایلینگ روز مراسم',
    serviceCount: 0,
    targetAudience: 'آرایشگاه‌های تخصصی داماد و استودیوهای پیرایش VIP',
    iconName: 'Award',
  },
  {
    id: 'cat-11',
    slug: 'laser-hair-removal',
    title: 'لیزر موهای زائد',
    subtitle: 'پکیج‌های فول‌بادی، توتال و نواحی تکی لیزر موهای زائد بانوان و آقایان با دستگاه‌های روز',
    serviceCount: 0,
    targetAudience: 'مراکز تخصصی لیزر موهای زائد بانوان و آقایان',
    iconName: 'Sparkles',
  },
];

export const LASER_DEVICE_PRESETS = [
  'کندلا جنتل مکس پرو ۲۰۲۴ (Candela GentleMax Pro) — شات‌زن غیرتماسی + کولینگ باد سرد',
  'تیتانیوم پلاس ۲۰۲۴ (Alma Soprano Titanium) — ۴ طول موج + کولینگ یخ بدون درد',
  'الکساندرایت دکا موتوس (DEKA Motus AX) — تکنولوژی Moveo',
  'پلاتینیوم پلاس (Soprano Ice Platinum) — ۳ طول موج هم‌زمان',
  'سایر دستگاه‌های الکساندرایت / دایود استاندارد',
];

export interface LaserPresetServiceItem {
  group: 'WOMEN_PACKAGES' | 'WOMEN_SINGLE' | 'MEN_PACKAGES' | 'MEN_SINGLE';
  categoryLabel: string;
  title: string;
  priceToman: number;
  durationMinutes: number;
  description: string;
}

export interface FacialPresetServiceItem {
  group: 'FACIAL_PACKAGES' | 'THERAPY_PACKAGES' | 'SINGLE_FACIAL';
  categoryLabel: string;
  title: string;
  pricingType: 'FIXED' | 'RANGE' | 'STARTING_FROM';
  priceToman: number;
  maxPriceToman?: number;
  durationMinutes: number;
  packageIncludes: string[];
  description: string;
}

export const FACIAL_SERVICE_PRESETS: FacialPresetServiceItem[] = [
  // ۱. پکیج‌های جامع فیشیال و پاکسازی
  {
    group: 'FACIAL_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج فیشیال کلاسیک و پاکسازی عمیق پوست (۶ مرحله‌ای)',
    pricingType: 'RANGE',
    priceToman: 550000,
    maxPriceToman: 850000,
    durationMinutes: 60,
    packageIncludes: [
      'آنالیز تخصصی نوع پوست',
      'بخور اوزون و لایه‌برداری آنزیمی',
      'تخلیه کومدون‌ها و جوش‌های سرسیاه با درمااف',
      'ماسک آبرسان و تسکین‌دهنده متناسب با پوست',
      'ماساژ لیفتینگ صورت و سرم فینیشینگ',
    ],
    description: 'پاکسازی کامل منافذ، تنظیم چربی و شادابی فوری پوست (بازه قیمت متناسب با برند مواد مصرفی)',
  },
  {
    group: 'FACIAL_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج هیدروفیشیال تخصصی و آبرسانی چندمرحله‌ای (HydroFacial VIP)',
    pricingType: 'RANGE',
    priceToman: 850000,
    maxPriceToman: 1350000,
    durationMinutes: 75,
    packageIncludes: [
      'پاکسازی و میکرودرم ابریژن آبی (هیدرودرم)',
      'تزریق سرم‌های هیالورونیک اسید با دستگاه',
      'اولتراسونیک و جذب عمقی ویال‌های مغذی',
      'چکش سرد جهت بستن منافذ باز',
      'نوردرمانی (LED تراپی) کلاژن‌ساز',
      'ماسک هیدروژلی طلا یا خاویار',
    ],
    description: 'آبرسانی عمقی، شفافیت شیشه‌ای پوست و رفع کدری و خشکی با دستگاه هیدروفیشیال',
  },
  {
    group: 'FACIAL_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج VIP جوانسازی، لیفتینگ و ضدچروک (Anti-Aging Facial)',
    pricingType: 'RANGE',
    priceToman: 1100000,
    maxPriceToman: 1750000,
    durationMinutes: 90,
    packageIncludes: [
      'لایه‌برداری ملایم AHA و آماده‌سازی سد پوستی',
      'آراف فرکشنال سطحی (RF) جهت تحریک کلاژن',
      'ویال تخصصی پپتاید و رتینول کلینیکی',
      'ماساژ تخصصی Kobido لیفت عضلات صورت و گردن',
      'ماسک گچی یا رابرماسک سفت‌کننده',
    ],
    description: 'کاهش خطوط ریز، سفت‌شدن قوام پوست و بازگرداندن خاصیت ارتجاعی با متریال کلینیکی',
  },
  {
    group: 'FACIAL_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج فیشیال تخصصی داماد / آقایان (Deep Men Facial)',
    pricingType: 'RANGE',
    priceToman: 600000,
    maxPriceToman: 950000,
    durationMinutes: 60,
    packageIncludes: [
      'بخور گرم و اسکراب تخصصی پوست ضخیم آقایان',
      'تخلیه کامل جوش‌های سرسیاه بینی و پیشانی',
      'کنترل چربی (سبوم) و رفع التهاب اصلاح',
      'ماسک دتوکس زغال فعال و آبرسان دور چشم',
    ],
    description: 'رفع تیرگی، چربی اضافه و منافذ باز پوست آقایان همراه با ریلکسیشن صورت',
  },

  // ۲. پکیج‌های درمانی، اسیدتراپی و کربوکسی
  {
    group: 'THERAPY_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج اسیدتراپی تخصصی ضدجوش، آکنه و منافذ باز (Acne Control)',
    pricingType: 'STARTING_FROM',
    priceToman: 750000,
    durationMinutes: 65,
    packageIncludes: [
      'آنالیز التهاب و تعیین درصد اسید (سالیسیلیک / ماندلیک)',
      'تخلیه استریل ضایعات التهابی و سرسیاه',
      'هایفرکوئنسی (High Frequency) آنتی‌باکتریال و ضدقارچ',
      'سرم نیاسینامید + زینک و ماسک جلبک تسکین‌دهنده',
      'نوردرمانی آبی ضدآکنه',
    ],
    description: 'کنترل ترشح چربی، خشک‌کردن جوش‌های فعال و جمع‌کردن منافذ باز (قیمت دقیق پس از آنالیز پوست)',
  },
  {
    group: 'THERAPY_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج کربوکسی‌تراپی و روشن‌کننده لک و تیرگی (Brightening & Carboxy)',
    pricingType: 'RANGE',
    priceToman: 890000,
    maxPriceToman: 1400000,
    durationMinutes: 70,
    packageIncludes: [
      'پاکسازی اولیه و آنزیم‌تراپی روشن‌کننده',
      'ژل و ماسک کربوکسی اکسیژن‌رسان بافتی',
      'کوکتل مزووایت / ویتامین C پایدار',
      'نوردرمانی سبز ضدلک و یکدست‌کننده رنگ پوست',
    ],
    description: 'افزایش گردش خون مویرگی، رفع تیرگی و لک‌های ناشی از آفتاب یا جای جوش',
  },
  {
    group: 'THERAPY_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج پلاژن‌تراپی و اکسیژن‌رسانی سه‌گانه (Pollogen OxyGeneo)',
    pricingType: 'RANGE',
    priceToman: 950000,
    maxPriceToman: 1450000,
    durationMinutes: 70,
    packageIncludes: [
      'کپسول OxyGeneo لایه‌بردار و اکسیژن‌ساز',
      'امواج رادیوفرکوئنسی TriPollar لیفتینگ',
      'اولتراسوند جذب سرم‌های روشن‌کننده یا جوانساز',
      'ماسک نهایی آبرسان عمیق',
    ],
    description: 'سه فناوری هم‌زمان لایه‌برداری، اکسیژن‌رسانی درونی و سفت‌کنندگی پوست در یک جلسه',
  },
  {
    group: 'THERAPY_PACKAGES',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج میکرونیدلینگ و مزونیدلینگ بازسازی پوست و اسکار',
    pricingType: 'STARTING_FROM',
    priceToman: 980000,
    durationMinutes: 60,
    packageIncludes: [
      'بی‌حسی موضعی و ضدعفونی کلینیکی',
      'کار با کارتریج استریل یک‌بارمصرف و کوکتل اسپانیایی/فرانسوی',
      'ماسک ورقه‌ای ترمیم‌کننده و تسکین‌دهنده سرد',
      'مشاوره مراقبت خانگی پس از نیدلینگ',
    ],
    description: 'درمان جای جوش (اسکار)، منافذ باز و لک‌های مقاوم با کوکتل‌های مزوتراپی اورجینال',
  },

  // ۳. خدمات تک‌مرحله‌ای و مکمل پوست
  {
    group: 'SINGLE_FACIAL',
    categoryLabel: 'پوست و فیشیال',
    title: 'پکیج تخصصی سیاهی، پف و خطوط دور چشم (Eye Contour Therapy)',
    pricingType: 'RANGE',
    priceToman: 420000,
    maxPriceToman: 650000,
    durationMinutes: 40,
    packageIncludes: [
      'کربوکسی یا آر‌اف مخصوص دور چشم',
      'ویال کافئین و پپتاید ضدتیرگی و پف',
      'پچ هیدروژلی کلاژن و ماساژ درناژ لنفاوی',
    ],
    description: 'رفع خستگی، کبودی و خطوط پنجه کلاغی دور چشم',
  },
  {
    group: 'SINGLE_FACIAL',
    categoryLabel: 'پوست و فیشیال',
    title: 'پاکسازی اکسپرس و شاداب‌سازی سریع (Mini Facial ۳۰ دقیقه‌ای)',
    pricingType: 'FIXED',
    priceToman: 420000,
    durationMinutes: 35,
    packageIncludes: [
      'شست‌وشوی تخصصی و اسکراب ملایم',
      'آبرسانی سریع و ماسک ورقه‌ای مغذی',
      'کرم مرطوب‌کننده و ضدآفتاب تخصصی',
    ],
    description: 'مناسب افراد پرمشغله یا آماده‌سازی سریع پوست قبل از میکاپ و مهمانی',
  },
  {
    group: 'SINGLE_FACIAL',
    categoryLabel: 'پوست و فیشیال',
    title: 'مشاوره، آنالیز دستگاهی پوست و تجویز روتین مراقبت خانگی',
    pricingType: 'FIXED',
    priceToman: 200000,
    durationMinutes: 25,
    packageIncludes: [
      'بررسی میزان رطوبت، چربی، عمق لک و منافذ',
      'تدوین برنامه درمانی کابین و روتین خانگی صبح و شب',
    ],
    description: 'ارزیابی دقیق نیازهای پوست قبل از شروع جلسات فیشیال (در صورت انجام فیشیال کسر می‌گردد)',
  },
];

/** چک‌لیست هوشمند مراحل، آیتم‌ها و جزئیات شخصی‌سازی خدمات و پکیج‌ها به تفکیک هر لاین زیبایی (تا هیچ موردی از قلم نیفتد) */
export const CATEGORY_PACKAGE_STAGE_CHECKLISTS: Record<
  string,
  {
    stages: string[];
    materialsAndNotes: string[];
  }
> = {
  'پوست و فیشیال': {
    stages: [
      'آنالیز دیجیتال و تعیین تیپ پوستی',
      'کلینزینگ و شست‌وشوی تخصصی دو مرحله‌ای',
      'بخور گرم + اوزون‌تراپی',
      'لایه‌برداری آنزیمی / گلایکولیک اسید',
      'تخلیه کومدون و جوش سرسیاه با درمااف اولتراسونیک',
      'میکرودرم / هیدرودرم ابریژن آبی',
      'کربوکسی‌تراپی اکسیژن‌رسان',
      'ویال تخصصی آبرسان / ضدلک / ضدجوش',
      'آراف (RF) لیفتینگ یا هایفرکوئنسی آنتی‌باکتریال',
      'ماسک هیدروژلی / رابرماسک / ماسک طلا',
      'تونل نوردرمانی (LED تراپی کلاژن‌ساز)',
      'چکش سرد جهت بستن منافذ',
      'ماساژ تخصصی صورت، گردن و دکلته',
      'سرم فینیشینگ، دور چشم و ضدآفتاب کلینیکی',
    ],
    materialsAndNotes: [
      'با متریال اورجینال اروپایی (تالگو / استادرم / کلینیک)',
      'انتخاب نوع اسید و ویال پس از معاینه حضوری پوست',
      'مناسب پوست‌های چرب، مختلط و مستعد آکنه',
      'مناسب پوست‌های خشک، دهیدراته و کدر',
      'بدون درد، التهاب یا دوره نقاهت',
    ],
  },
  'مو و رنگ': {
    stages: [
      'مشاوره تخصصی انتخاب تناژ رنگ و تست سلامت تار مو',
      'پلکس‌تراپی و محافظت از ساختار مو حین دکلره',
      'دکلره بدون آمونیاک تا پایه دلخواه بدون آسیب',
      'رنگساژ ترکیبی ژورنالی و خنثی‌سازی زردی',
      'پروتئین‌تراپی / بوتاکس سرد احیاکننده بعد از رنگ',
      'شست‌وشوی تخصصی با شامپو و ماسک تثبیت‌کننده PH',
      'کات لیزری / موخوره‌گیری روسی هدیه پکیج',
      'براشینگ و استایلینگ حرفه‌ای پایانی',
    ],
    materialsAndNotes: [
      'قیمت نهایی بر اساس قد و حجم مو در سالن محاسبه می‌شود',
      'با مواد ایتالیایی و آلمانی (پرفکت، اولاپلکس، شوارتسکف)',
      'تضمین سلامت و ابریشمی ماندن مو بدون کشسانی',
    ],
  },
  'کاشت و طراحی ناخن': {
    stages: [
      'مانیکور روسی و زیرسازی تمیز کوتیکول',
      'ضدقارچ و پرایمر اسیدی/غیراسیدی اورجینال',
      'کاشت پودر / پلی‌ژل / لمینت استحکام‌دهنده',
      'فرم‌دهی اصولی (بادامی، گلدانی، مربع، تیز)',
      'لاک‌ژل با تنوع بیش از ۲۰۰ رنگ + تاپ‌کات شاین/مات',
      'دیزاین ۲ ناخن رایگان (کروم، فرنچ، شوگر، ورق طلا)',
      'روغن کوتیکول و کرم آبرسان دست',
    ],
    materialsAndNotes: [
      'پک استریل اتوکلاوشده مخصوص هر مراجع',
      'بدون هواگرفتگی یا شکستگی تا نوبت ترمیم بعدی',
      'هزینه دیزاین‌های پرکار یا ناخن بلند جداگانه محاسبه می‌شود',
    ],
  },
  'میکاپ و عروس': {
    stages: [
      'پاکسازی سطحی، آبرسانی و پرایمر زیرساز پوست',
      'کانتورینگ و نوریینگ استخری / ضدآب ۲۴ ساعته',
      'سایه چشم ژورنالی (لایت، اسموکی، خطی، بادیگارد)',
      'مژه مصنوعی ابریشمی تکی/ریه‌ای متناسب با فرم چشم',
      'اصلاح و قرینه‌سازی هاشورگونه ابرو',
      'شینیون تخصصی (اروپایی، باز و بسته، رترو، کرلی)',
      'فیکس نهایی با اسپری فیکس مک / اربن دیکی',
    ],
    materialsAndNotes: [
      'با برندهای لوکس (نارس، استی‌لودر، هدی بیوتی، شارلوت تیلبری)',
      'ماندگاری تضمین‌شده تا پایان مراسم بدون ماسیدگی',
      'امکان مشاوره حضوری و انتخاب سبک قبل از مراسم',
    ],
  },
  'مژه و ابرو': {
    stages: [
      'مشاوره و طراحی مپ اختصاصی متناسب با فرم چشم و صورت',
      'شست‌وشوی مژه و ابرو با فوم تخصصی و پرایمر',
      'اکستنشن تار به تار با مژه ابریشمی سبک و چسب ضدحساسیت',
      'لیفت و لمینت با مواد کراتینه و تقویتی (مای‌لمینیشن)',
      'بوتاکس‌تراپی و رنگ تخصصی مژه/ابرو',
      'براش اختصاصی و آموزش مراقبت خانگی',
    ],
    materialsAndNotes: [
      'بدون ریزش یا آسیب به مژه‌های طبیعی',
      'استفاده از چسب گازگیر و ضدحساسیت چشم',
    ],
  },
  'لیزر موهای زائد': {
    stages: [
      'مشاوره تعیین تیپ پوستی و تنظیم انرژی شات دستگاه',
      'پک بهداشتی و سری شخصی استریل مخصوص هر مراجع',
      'پوشش کامل و دقیق نواحی بدون جاافتادگی',
      'کولینگ (خنک‌کننده) قوی بدون درد و سوختگی',
      'ژل و لوسیون تسکین‌دهنده پس از لیزر',
      'شارژ رایگان (ترمیم) دو هفته بعد در صورت نیاز',
    ],
    materialsAndNotes: [
      'اپراتور مجرب با نظارت پزشک مجموعه',
      'لطفاً ۲۴ ساعت قبل از نوبت، نواحی را با ژیلت شیو نمایید',
    ],
  },
  'پیرایش و استایل مردانه': {
    stages: [
      'مشاوره استایل متناسب با فرم صورت و جمجمه',
      'کوتاهی ژورنالی و فید (Skin Fade / Taper / Classic)',
      'آنالیز و خط‌اندازی دقیق ریش و سبیل با تیغ استریل',
      'حوله داغ، بخور صورت و اسکراب پاکسازی منافذ',
      'شست‌وشوی مو و ماسک خنک‌کننده پوست سر',
      'براشینگ و استایلینگ با واکس/پوماد اورجینال',
    ],
    materialsAndNotes: [
      'استفاده از تیغ و پیش‌بند یک‌بارمصرف بهداشتی',
      'محیط VIP و بدون معطلی دقیقاً در ساعت رزروشده',
    ],
  },
};

/** کیت‌های آماده سایر حوزه‌های تخصصی (مو و رنگ، ناخن، میکاپ، مژه و ابرو، پیرایش مردانه) */
export const OTHER_DOMAIN_SERVICE_PRESETS: Array<{
  domainCategory: string;
  categorySlug: string;
  title: string;
  pricingType: 'FIXED' | 'RANGE' | 'STARTING_FROM';
  priceToman: number;
  maxPriceToman?: number;
  durationMinutes: number;
  packageIncludes: string[];
  description: string;
}> = [
  // مو و رنگ
  {
    domainCategory: 'مو و رنگ',
    categorySlug: 'hair-color',
    title: 'پکیج تخصصی بالیاژ، آمبره و لایت ژورنالی (با پلکس‌تراپی)',
    pricingType: 'RANGE',
    priceToman: 2200000,
    maxPriceToman: 4800000,
    durationMinutes: 180,
    packageIncludes: [
      'مشاوره تناژ رنگ و تست سلامت مو',
      'دکلره بدون آسیب همراه با پلکس‌تراپی',
      'رنگساژ ترکیبی و ماسک تثبیت‌کننده',
      'براشینگ و استایلینگ پایانی',
    ],
    description: 'تکنیک‌های روز لایت، بالیاژ و ایرتاچ (قیمت نهایی بر اساس قد و حجم مو)',
  },
  {
    domainCategory: 'مو و رنگ',
    categorySlug: 'hair-color',
    title: 'پکیج کراتین، پروتئین‌تراپی و احیای ۱۰۰٪ موهای آسیب‌دیده',
    pricingType: 'RANGE',
    priceToman: 1800000,
    maxPriceToman: 4200000,
    durationMinutes: 150,
    packageIncludes: [
      'شست‌وشوی قلیایی و آماده‌سازی فلس مو',
      'موادگذاری اورجینال برزیلی بدون قرنطینه',
      'اتوکشی تخصصی تیتانیومی و فوتون‌تراپی',
      'موخوره‌گیری و کات لیزری رایگان انتهای کار',
    ],
    description: 'صافی ابریشمی و احیای کامل موهای دکلره‌شده و خشک (متناسب با قد و حجم مو)',
  },
  {
    domainCategory: 'مو و رنگ',
    categorySlug: 'hair-color',
    title: 'کوتاهی ژورنالی مو + موخوره‌گیری روسی + براشینگ',
    pricingType: 'RANGE',
    priceToman: 450000,
    maxPriceToman: 750000,
    durationMinutes: 50,
    packageIncludes: [
      'مشاوره فرم صورت و انتخاب مدل کوتاهی',
      'کوتاهی تخصصی ژورنالی (باب، لیر، پیکسی)',
      'موخوره‌گیری بدون کوتاه شدن قد مو',
      'براشینگ حرفه‌ای',
    ],
    description: 'کوتاهی تخصصی به همراه استایلینگ کامل',
  },
  // کاشت و طراحی ناخن
  {
    domainCategory: 'کاشت و طراحی ناخن',
    categorySlug: 'nail-design',
    title: 'پکیج کاشت اولیه ناخن (پودر / پلی‌ژل) + مانیکور روسی + لاک‌ژل',
    pricingType: 'RANGE',
    priceToman: 550000,
    maxPriceToman: 850000,
    durationMinutes: 90,
    packageIncludes: [
      'مانیکور روسی و زیرسازی کوتیکول',
      'کاشت پودر یا پلی‌ژل با فرم دلخواه',
      'لاک‌ژل از کالکشن ۲۰۰ رنگ + دیزاین ۲ ناخن',
    ],
    description: 'کاشت ظریف و مقاوم با پک استریل اختصاصی',
  },
  {
    domainCategory: 'کاشت و طراحی ناخن',
    categorySlug: 'nail-design',
    title: 'پکیج ترمیم ناخن + تغییر فرم + لاک‌ژل و تاپ‌شاین',
    pricingType: 'RANGE',
    priceToman: 380000,
    maxPriceToman: 550000,
    durationMinutes: 65,
    packageIncludes: [
      'سوهان‌کشی، هواگیری و مانیکور تمیز',
      'موادگذاری مجدد و اصلاح فرم ناخن',
      'لاک‌ژل دلخواه + روغن تقویتی کوتیکول',
    ],
    description: 'ترمیم اصولی بدون هواگرفتگی یا ضخامت اضافه',
  },
  {
    domainCategory: 'کاشت و طراحی ناخن',
    categorySlug: 'nail-design',
    title: 'پکیج پدیکور VIP و کف‌سابی درمانی پا (Foot Spa & Jelly)',
    pricingType: 'RANGE',
    priceToman: 480000,
    maxPriceToman: 750000,
    durationMinutes: 60,
    packageIncludes: [
      'جکوزی پا با کوکتل نمک دریایی و جلی‌پدیکور',
      'کف‌سابی و رفع کامل پینه و ترک پاشنه',
      'اسکراب، ماسک آبرسان و ماساژ ریلکسی پا',
      'مرتب‌سازی و لاک‌ژل ناخن پا',
    ],
    description: 'رفع کامل خشکی و ترک پا همراه با اسپا و ریلکسیشن',
  },
  // میکاپ و عروس
  {
    domainCategory: 'میکاپ و عروس',
    categorySlug: 'makeup-bridal',
    title: 'پکیج کامل میکاپ و شینیون ویژه محفلی (VIP Party Package)',
    pricingType: 'RANGE',
    priceToman: 1600000,
    maxPriceToman: 2800000,
    durationMinutes: 120,
    packageIncludes: [
      'زیرسازی و آبرسانی پوست قبل از میکاپ',
      'میکاپ ضدآب و کانتورینگ با متریال لوکس',
      'مژه ابریشمی + شینیون ژورنالی متناسب با لباس',
      'فیکس ۲۴ ساعته تضمینی',
    ],
    description: 'پکیج کامل همراهی و محفلی با ماندگاری بالا',
  },
  {
    domainCategory: 'میکاپ و عروس',
    categorySlug: 'makeup-bridal',
    title: 'پکیج رویال عروس / عقد و نامزدی (مشاوره و تست + خدمات کامل)',
    pricingType: 'STARTING_FROM',
    priceToman: 6500000,
    durationMinutes: 240,
    packageIncludes: [
      'فیشیال و آماده‌سازی پوست قبل از مراسم',
      'میکاپ و گریم تخصصی عروس با برندهای اورجینال',
      'شینیون اختصاصی، نصب تاج و تور',
      'طراحی ناخن و مژه ابریشمی VIP',
    ],
    description: 'پکیج اختصاصی عروس، عقد و فرمالیته (تعیین جزئیات در جلسه مشاوره حضوری)',
  },
  // مژه و ابرو
  {
    domainCategory: 'مژه و ابرو',
    categorySlug: 'eyelash-brow',
    title: 'پکیج اکستنشن مژه ابریشمی (کلاسیک / اسپایکی / والیوم)',
    pricingType: 'RANGE',
    priceToman: 550000,
    maxPriceToman: 900000,
    durationMinutes: 90,
    packageIncludes: [
      'طراحی مپ اختصاصی متناسب با فرم چشم',
      'نصب تار به تار مژه ابریشمی سبک با چسب ضدحساسیت',
      'براش اختصاصی و آموزش مراقبت',
    ],
    description: 'اکستنشن طبیعی تا پرحجم بدون آسیب به مژه اصلی',
  },
  {
    domainCategory: 'مژه و ابرو',
    categorySlug: 'eyelash-brow',
    title: 'پکیج لیفت و لمینت مژه و ابرو با مواد کراتینه ایتالیایی',
    pricingType: 'RANGE',
    priceToman: 480000,
    maxPriceToman: 820000,
    durationMinutes: 60,
    packageIncludes: [
      'لیفت با مواد اورجینال مای‌لمینیشن',
      'بوتاکس‌تراپی و کراتین تقویتی تار مژه/ابرو',
      'رنگ تخصصی مژه در صورت تمایل',
    ],
    description: 'خوش‌حالت شدن و تقویت مژه و ابرو با ماندگاری ۶ تا ۸ هفته',
  },
  // پیرایش مردانه
  {
    domainCategory: 'پیرایش و استایل مردانه',
    categorySlug: 'men-barber',
    title: 'پکیج VIP پیرایش مو، آنالیز ریش و پاکسازی صورت آقایان',
    pricingType: 'RANGE',
    priceToman: 350000,
    maxPriceToman: 600000,
    durationMinutes: 60,
    packageIncludes: [
      'کوتاهی ژورنالی و فید تخصصی متناسب با فرم صورت',
      'اصلاح و خط‌اندازی ریش با حوله داغ و تیغ استریل',
      'بخور و ماسک سیاه پاکسازی جوش‌های سرسیاه بینی',
      'شست‌وشو و استایلینگ نهایی مو',
    ],
    description: 'سرویس کامل پیرایش و مراقبت پوست آقایان در یک نوبت',
  },
  {
    domainCategory: 'پیرایش و استایل مردانه',
    categorySlug: 'men-barber',
    title: 'پکیج تشریفاتی داماد (Groom VIP Package)',
    pricingType: 'STARTING_FROM',
    priceToman: 1800000,
    durationMinutes: 120,
    packageIncludes: [
      'کوتاهی و هیرکات تخصصی داماد',
      'فیشیال و پاکسازی کامل پوست صورت',
      'گریم سینمایی نامحسوس و متعادل‌سازی چهره',
      'استایلینگ فیکس ضدتعریق تا پایان مراسم',
    ],
    description: 'پکیج کامل داماد با مشاوره قبلی',
  },
];

export const LASER_SERVICE_PRESETS: LaserPresetServiceItem[] = [
  // ۱. پکیج‌های لیزر خانم‌ها (۱۱ پکیج + ناحیه اضافه)
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج توتال ۱ بانوان (از پیشانی تا انگشتان پا)',
    priceToman: 3000000,
    durationMinutes: 60,
    description: 'پوشش کامل از پیشانی تا انگشتان پا · سری شخصی بهداشتی',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج توتال ۲ بانوان (توتال ۱ منهای پهلو و سینه تا صورت)',
    priceToman: 2500000,
    durationMinutes: 50,
    description: 'کل بدن منهای پهلو و سینه تا صورت · امکان افزودن ناحیه دلخواه',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج فول ۱ بانوان (دست کامل، پا کامل، بیکینی و زیربغل)',
    priceToman: 1500000,
    durationMinutes: 45,
    description: 'دست کامل + پا کامل + بیکینی + زیربغل (افزودن صورت/شکم/گودی کمر/باسن هر کدام +۱۰۰ هزار تومان)',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج فول ۲ بانوان (ساعد دست، پا کامل، بیکینی و زیربغل)',
    priceToman: 1300000,
    durationMinutes: 40,
    description: 'ساعد دست + پا کامل + بیکینی + زیربغل (افزودن صورت/شکم/گودی کمر/باسن هر کدام +۱۰۰ هزار تومان)',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج کاربردی بانوان: ساق پا، ساعد دست، بیکینی و زیربغل',
    priceToman: 1000000,
    durationMinutes: 35,
    description: 'ساق پا + ساعد دست + بیکینی + زیربغل',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج کاربردی بانوان: پا کامل، بیکینی و زیربغل',
    priceToman: 1000000,
    durationMinutes: 35,
    description: 'پا کامل + بیکینی + زیربغل',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج بانوان: پا کامل و بیکینی',
    priceToman: 800000,
    durationMinutes: 30,
    description: 'پا کامل + بیکینی',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج بانوان: ساق پا، بیکینی و زیربغل',
    priceToman: 800000,
    durationMinutes: 30,
    description: 'ساق پا + بیکینی + زیربغل',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج بانوان: ساعد دست، بیکینی و زیربغل',
    priceToman: 600000,
    durationMinutes: 25,
    description: 'ساعد دست + بیکینی + زیربغل',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج بانوان: صورت، بیکینی و زیربغل',
    priceToman: 600000,
    durationMinutes: 25,
    description: 'صورت + بیکینی + زیربغل',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'پکیج بانوان: بیکینی و زیربغل',
    priceToman: 500000,
    durationMinutes: 20,
    description: 'بیکینی + زیربغل',
  },
  {
    group: 'WOMEN_PACKAGES',
    categoryLabel: 'لیزر بانوان (پکیج)',
    title: 'افزودن ۱ ناحیه اضافه روی پکیج فول ۱ یا فول ۲ (صورت / شکم / گودی کمر / باسن)',
    priceToman: 100000,
    durationMinutes: 10,
    description: 'ویژه مراجعان پکیج فول ۱ و فول ۲ به ازای هر ناحیه اضافه',
  },

  // ۲. نواحی تکی لیزر خانم‌ها (۱۲ ناحیه)
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر صورت / صورت و گردن (بانوان)',
    priceToman: 350000,
    durationMinutes: 15,
    description: 'ناحیه تکی صورت و گردن بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر زیربغل (بانوان)',
    priceToman: 350000,
    durationMinutes: 15,
    description: 'ناحیه تکی زیربغل بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر دست کامل (بانوان)',
    priceToman: 600000,
    durationMinutes: 20,
    description: 'ناحیه تکی دست کامل بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر بازو یا ساعد (بانوان)',
    priceToman: 400000,
    durationMinutes: 15,
    description: 'ناحیه تکی بازو یا ساعد دست بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر شکم و سینه (بانوان)',
    priceToman: 600000,
    durationMinutes: 20,
    description: 'ناحیه تکی شکم و سینه بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر شکم یا سینه (بانوان)',
    priceToman: 400000,
    durationMinutes: 15,
    description: 'ناحیه تکی شکم یا سینه بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر کمر کامل (بانوان)',
    priceToman: 600000,
    durationMinutes: 20,
    description: 'ناحیه تکی کمر کامل بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر گودی کمر (بانوان)',
    priceToman: 400000,
    durationMinutes: 15,
    description: 'ناحیه تکی گودی کمر بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر باسن (بانوان)',
    priceToman: 400000,
    durationMinutes: 15,
    description: 'ناحیه تکی باسن بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر بیکینی (بانوان)',
    priceToman: 350000,
    durationMinutes: 15,
    description: 'ناحیه تکی بیکینی بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر پا کامل (بانوان)',
    priceToman: 850000,
    durationMinutes: 25,
    description: 'ناحیه تکی پا کامل بانوان',
  },
  {
    group: 'WOMEN_SINGLE',
    categoryLabel: 'لیزر بانوان (ناحیه تکی)',
    title: 'لیزر ران یا ساق پا (بانوان)',
    priceToman: 500000,
    durationMinutes: 20,
    description: 'ناحیه تکی ران یا ساق پا بانوان',
  },

  // ۳. پکیج‌های لیزر آقایان (۱۱ پکیج)
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج توتال آقایان (از خط ریش تا انگشتان پا)',
    priceToman: 4000000,
    durationMinutes: 65,
    description: 'پوشش کامل از خط ریش تا انگشتان پا ویژه آقایان',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج بالاتنه ۱ آقایان (خط ریش، زیربغل، شکم و سینه، کمر کامل، دست کامل)',
    priceToman: 2000000,
    durationMinutes: 45,
    description: 'خط ریش + زیربغل + شکم و سینه + کمر کامل + دست کامل',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج بالاتنه ۲ آقایان (خط ریش، زیربغل، شکم و سینه، کمر کامل، بازو)',
    priceToman: 1800000,
    durationMinutes: 40,
    description: 'خط ریش + زیربغل + شکم و سینه + کمر کامل + بازو',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج بالاتنه ۳ آقایان (خط ریش، زیربغل، شکم و سینه، کمر کامل)',
    priceToman: 1600000,
    durationMinutes: 35,
    description: 'خط ریش + زیربغل + شکم و سینه + کمر کامل',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج پایین‌تنه ۱ آقایان (پا کامل، بیکینی، باسن)',
    priceToman: 1900000,
    durationMinutes: 40,
    description: 'پا کامل + بیکینی + باسن ویژه آقایان',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج پایین‌تنه ۲ آقایان (پا کامل، بیکینی)',
    priceToman: 1700000,
    durationMinutes: 35,
    description: 'پا کامل + بیکینی ویژه آقایان',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج تلفیقی ۱ آقایان (پا کامل، بیکینی، باسن، زیربغل، خط ریش)',
    priceToman: 2500000,
    durationMinutes: 50,
    description: 'پا کامل + بیکینی + باسن + زیربغل + خط ریش',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج تلفیقی ۲ آقایان (پا کامل، بیکینی، زیربغل، خط ریش)',
    priceToman: 1900000,
    durationMinutes: 45,
    description: 'پا کامل + بیکینی + زیربغل + خط ریش',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج خط ریش آقایان (خط ریش گونه، پایین گردن، پشت گردن)',
    priceToman: 500000,
    durationMinutes: 20,
    description: 'خط ریش گونه + پایین گردن + پشت گردن',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج آقایان: بیکینی، زیربغل و خط ریش',
    priceToman: 1000000,
    durationMinutes: 30,
    description: 'بیکینی + زیربغل + خط ریش آقایان',
  },
  {
    group: 'MEN_PACKAGES',
    categoryLabel: 'لیزر آقایان (پکیج)',
    title: 'پکیج آقایان: بیکینی و زیربغل',
    priceToman: 800000,
    durationMinutes: 25,
    description: 'بیکینی + زیربغل آقایان',
  },

  // ۴. نواحی تکی لیزر آقایان (۱۰ ناحیه)
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر خط ریش (آقایان)',
    priceToman: 300000,
    durationMinutes: 15,
    description: 'ناحیه تکی خط ریش آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر زیربغل (آقایان)',
    priceToman: 300000,
    durationMinutes: 15,
    description: 'ناحیه تکی زیربغل آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر دست کامل (آقایان)',
    priceToman: 750000,
    durationMinutes: 25,
    description: 'ناحیه تکی دست کامل آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر بازو یا ساعد (آقایان)',
    priceToman: 500000,
    durationMinutes: 15,
    description: 'ناحیه تکی بازو یا ساعد آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر شکم و سینه (آقایان)',
    priceToman: 750000,
    durationMinutes: 25,
    description: 'ناحیه تکی شکم و سینه آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر شکم یا سینه (آقایان)',
    priceToman: 500000,
    durationMinutes: 15,
    description: 'ناحیه تکی شکم یا سینه آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر کمر کامل (آقایان)',
    priceToman: 750000,
    durationMinutes: 25,
    description: 'ناحیه تکی کمر کامل آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر گودی کمر (آقایان)',
    priceToman: 500000,
    durationMinutes: 15,
    description: 'ناحیه تکی گودی کمر آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر پا کامل (آقایان)',
    priceToman: 1000000,
    durationMinutes: 30,
    description: 'ناحیه تکی پا کامل آقایان',
  },
  {
    group: 'MEN_SINGLE',
    categoryLabel: 'لیزر آقایان (ناحیه تکی)',
    title: 'لیزر بیکینی (آقایان)',
    priceToman: 500000,
    durationMinutes: 15,
    description: 'ناحیه تکی بیکینی آقایان',
  },
];

// حذف کامل داده‌های نمونه/تستی تا فقط کسب‌وکارها، متخصصان و خدمات واقعی در کل سامانه نمایش داده شوند
export const SAMPLE_BUSINESSES: BusinessItem[] = [];

export const SAMPLE_SERVICES: ServiceItem[] = [];

export const SAMPLE_SPECIALISTS: SpecialistItem[] = [];

export const SAMPLE_REVIEWS: ReviewItem[] = [];

export const SAMPLE_GALLERY: GalleryItem[] = [];

export const SAMPLE_APPOINTMENTS: AppointmentItem[] = [];

export const SAMPLE_CUSTOMERS: CustomerRecord[] = [];

export const SAMPLE_SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'plan-free-start',
    name: 'شروع رایگان (پایه)',
    audience:
      'ویژه شروع سریع و تست عملی نوبت‌دهی آنلاین به همراه ۱۵ پیامک هدیه تست ارسال اتوماتیک به مشتری و سالن',
    monthlyPriceToman: 0,
    staffLimit: '۱ متخصص (شخصی)',
    smsQuotaMonthly: 15,
    features: [
      '۱۵ عدد پیامک هدیه تست (ارسال خودکار تایید نوبت به مشتری و مدیر سالن)',
      'صفحه پروفایل آنلاین اختصاصی، لینک کوتاه بایو اینستاگرام و پوستر QR کد',
      'تقویم نوبت‌دهی آنلاین (سقف تا ۱۵ نوبت در ماه · ۱ متخصص)',
      'کیف پول دریافت بیعانه آنلاین (قفل بودن حسابداری دخل روزانه و کمپین پیامکی)',
    ],
    comparison: {
      onlineBooking: 'پایه (تا ۱۵ نوبت در ماه · ۱ متخصص)',
      smsReminders: '۱۵ پیامک هدیه تست اولیه',
      analyticsLevel: 'قفل (نیازمند ارتقا به پلن حرفه‌ای)',
      supportType: 'پشتیبانی تیکتی سامانه',
    },
  },
  {
    id: 'plan-professional',
    name: 'حرفه‌ای (پرفروش)',
    audience:
      'انتخاب اول سالن‌ها و متخصصان فعال برای باز شدن حسابداری دخل روزانه، باشگاه مشتریان و حذف کنسلی نوبت‌ها',
    monthlyPriceToman: 980000,
    staffLimit: 'تا ۳ متخصص هم‌زمان',
    smsQuotaMonthly: 150,
    features: [
      'باز شدن کامل «حسابداری دوحالته و ثبت دخل روزانه حضوری + بیعانه آنلاین»',
      '۱۵۰ پیامک خدماتی خودکار در ماه (ثبت نوبت + یادآور ۲۴ ساعت قبل)',
      'باز شدن «باشگاه مشتریان (CRM) و ورود گروهی شماره‌ها از اکسل/موبایل»',
      'نوبت‌دهی آنلاین نامحدود ۲۴ ساعته برای تا ۳ متخصص با تقویم مجزا',
      'نشان «مرکز تاییدشده» و اولویت نمایش بالاتر از پلن رایگان در جست‌وجو',
    ],
    comparison: {
      onlineBooking: 'نامحدود (تا ۳ متخصص هم‌زمان)',
      smsReminders: '۱۵۰ پیامک خدماتی در ماه',
      analyticsLevel: 'کامل (حسابداری دخل حضوری + بیعانه + سهم متخصص)',
      supportType: 'پشتیبانی تلفنی و آنلاین سریع',
    },
    isRecommended: true,
  },
  {
    id: 'plan-vip-brand',
    name: 'کسب‌وکار پیشرفته (VIP)',
    audience:
      'ویژه سالن‌های بزرگ، کلینیک‌های زیبایی و مراکز لیزر پرتردد با تیم کامل (تا ۸ متخصص)، کمپین پیامکی و تسویه شبانه',
    monthlyPriceToman: 1850000,
    staffLimit: 'تا ۸ متخصص هم‌زمان',
    smsQuotaMonthly: 350,
    features: [
      'تمامی امکانات پلن حرفه‌ای (حسابداری دخل روزانه + باشگاه مشتریان) برای تا ۸ متخصص',
      '۳۵۰ پیامک خدماتی ماهانه + باز شدن «کمپین پیامکی انبوه، کد تخفیف و بازگشت مشتری»',
      'فعالسازی «تسویه حساب اتوماتیک شبانه (پایا)» موجودی کیف پول بیعانه‌ها',
      'قابلیت انتشار «استوری ۲۴ ساعته ظرفیت لحظه‌ای و تخفیف» در بالای پروفایل',
      '۱۵٪ تخفیف دائمی رزرو «جایگاه تبلیغاتی صدر جست‌وجو و بنر صفحه اول»',
    ],
    comparison: {
      onlineBooking: 'نامحدود (تا ۸ متخصص + استوری ۲۴ ساعته)',
      smsReminders: '۳۵۰ پیامک خدماتی + پنل کمپین انبوه',
      analyticsLevel: 'هوش تجاری VIP + تسویه اتوماتیک شبانه',
      supportType: 'مدیر حساب و پشتیبانی VIP اختصاصی',
    },
  },
];

export const SAMPLE_CAMPAIGNS: MarketingCampaignItem[] = [];

export const SAMPLE_AD_PACKAGES: AdPackageItem[] = [
  {
    id: 'ad-search-top',
    title: 'صدرنشینی در نتایج جست‌وجوی شهر (Search Boost)',
    slot: 'SEARCH_TOP',
    durationDays: 30,
    priceToman: 490000,
    weeklyPriceToman: 190000,
    badge: '★ پربازده‌ترین جایگاه',
    description:
      'پین شدن کارت سالن شما در ردیف اول نتایج جست‌وجو (/search) با نشان ویژه «★ آگهی ویژه» و برچسب تبلیغاتی دلخواه شما.',
  },
  {
    id: 'ad-home-banner',
    title: 'بنر ویژه در صفحه اول تایم تو (Home Banner)',
    slot: 'HOME_BANNER',
    durationDays: 30,
    priceToman: 890000,
    weeklyPriceToman: 350000,
    badge: 'ویترین صفحه اول',
    description:
      'نمایش بنر تصویری اختصاصی سالن شما در بخش «پیشنهادهای ویژه رزرو آنلاین» صفحه اول سایت با دکمه رزرو مستقیم.',
  },
  {
    id: 'ad-sms-pack-200',
    title: 'بسته افزونه ۲۰۰ پیامک خدماتی و یادآور اضافه',
    slot: 'SMS_ADDON',
    durationDays: 90,
    priceToman: 180000,
    smsCount: 200,
    badge: 'شارژ پیامک مازاد',
    description:
      'شارژ ۲۰۰ عدد پیامک خدماتی تایید و یادآور نوبت، قابل استفاده برای همه پلن‌ها (حتی پلن پایه).',
  },
];

export const DEFAULT_PAYMENT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  activeMethod: 'ZIBAL',
  balePayId: '',
  balePayLink: '',
  cardNumber: '',
  cardHolderName: 'مدیریت پلتفرم تایم تو (timeto24.ir)',
  shebaNumber: 'IR820170000000123456789001',
  bankName: 'درگاه پرداخت اینترنتی زیبال (Zibal)',
  supportTelegramOrBale: '09138201042',
  zibalMerchantId: '',
  platformCommissionPercent: 0,
  instructions:
    'پرداخت آنلاین از طریق درگاه امن شتاب (زیبال - Zibal) انجام شده و اشتراک یا بسته تبلیغاتی بلافاصله به صورت خودکار فعال می‌گردد.',
};

export const SAMPLE_PAYMENT_ORDERS: PaymentOrderItem[] = [];

