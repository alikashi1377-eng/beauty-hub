import React, { createContext, useContext, useState } from 'react';
import {
  SAMPLE_APPOINTMENTS,
  SAMPLE_BUSINESSES,
  SAMPLE_CAMPAIGNS,
  SAMPLE_CATEGORIES,
  SAMPLE_CUSTOMERS,
  SAMPLE_GALLERY,
  SAMPLE_REVIEWS,
  SAMPLE_SERVICES,
  SAMPLE_SPECIALISTS,
  SAMPLE_SUBSCRIPTION_PLANS,
} from '../mocks/sampleData';
import {
  AppointmentItem,
  AppointmentStatus,
  ApprovalStatus,
  BookingDraft,
  BusinessItem,
  BusinessType,
  CategoryItem,
  CustomerRecord,
  GalleryItem,
  MarketingCampaignItem,
  OnboardingDraft,
  ReviewItem,
  ServiceItem,
  SpecialistItem,
  SubscriptionPlanItem,
  WorkingHourItem,
} from '../types';

export interface ToastNotice {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
}

interface PrototypeDataContextValue {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  favoriteBusinessIds: string[];
  toggleFavoriteBusiness: (businessId: string) => void;
  businesses: BusinessItem[];
  updateBusinessProfile: (
    businessId: string,
    patch: Partial<BusinessItem>
  ) => void;
  updateBusinessWorkingHours: (
    businessId: string,
    hours: WorkingHourItem[]
  ) => void;
  updateBusinessApproval: (businessId: string, status: ApprovalStatus) => void;
  services: ServiceItem[];
  addService: (item: Omit<ServiceItem, 'id'>) => void;
  updateService: (id: string, patch: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  specialists: SpecialistItem[];
  addSpecialist: (item: Omit<SpecialistItem, 'id'>) => void;
  updateSpecialist: (id: string, patch: Partial<SpecialistItem>) => void;
  appointments: AppointmentItem[];
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  categories: CategoryItem[];
  addCategory: (item: Omit<CategoryItem, 'id'>) => void;
  updateCategory: (id: string, patch: Partial<CategoryItem>) => void;
  gallery: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  removeGalleryItem: (id: string) => void;
  campaigns: MarketingCampaignItem[];
  addCampaign: (item: Omit<MarketingCampaignItem, 'id'>) => void;
  customers: CustomerRecord[];
  reviews: ReviewItem[];
  plans: SubscriptionPlanItem[];
  activePlanId: string;
  setActivePlanId: (planId: string) => void;
  onboardingDraft: OnboardingDraft;
  updateOnboardingDraft: (patch: Partial<OnboardingDraft>) => void;
  bookingDraft: BookingDraft;
  updateBookingDraft: (patch: Partial<BookingDraft>) => void;
  completeSimulatedBooking: () => AppointmentItem;
  toast: ToastNotice | null;
  showToast: (
    message: string,
    tone?: 'success' | 'info' | 'warning' | 'danger'
  ) => void;
  dismissToast: () => void;
}

const INITIAL_ONBOARDING_DRAFT: OnboardingDraft = {
  businessType: BusinessType.WomenSalon,
  businessName: 'سالن زیبایی ارکیده نقره‌ای (نمونه)',
  categorySlug: 'hair-color',
  slug: 'orkideh-salon',
  ownerName: 'مریم فرهادی',
  phone: '09123456789',
  city: 'تهران',
  neighborhood: 'ولنجک',
  address: 'تهران، ولنجک، خیابان سیزدهم، پلاک ۲۴، طبقه دوم (آدرس آزمایشی)',
  shortDescription:
    'مرکز تخصصی رنگ و مش، احیای مو و طراحی ناخن با کادر مجرب و نوبت‌دهی آنلاین.',
  services: [
    {
      id: 'onb-srv-1',
      title: 'کوتاهی ژورنالی و براشینگ',
      category: 'مو و رنگ',
      durationMinutes: 60,
      priceToman: 580000,
    },
    {
      id: 'onb-srv-2',
      title: 'مانیکور روسی و ژلیش ناخن',
      category: 'ناخن',
      durationMinutes: 60,
      priceToman: 420000,
    },
  ],
  staff: [
    {
      id: 'onb-stf-1',
      fullName: 'مریم فرهادی',
      roleTitle: 'مدیر و متخصص ارشد مو',
    },
    {
      id: 'onb-stf-2',
      fullName: 'سحر کاظمی',
      roleTitle: 'متخصص طراحی و سلامت ناخن',
    },
  ],
  workingHours: [
    { dayName: 'شنبه', isOpen: true, openTime: '۰۹:۳۰', closeTime: '۱۹:۳۰' },
    { dayName: 'یکشنبه', isOpen: true, openTime: '۰۹:۳۰', closeTime: '۱۹:۳۰' },
    { dayName: 'دوشنبه', isOpen: true, openTime: '۰۹:۳۰', closeTime: '۱۹:۳۰' },
    { dayName: 'سه‌شنبه', isOpen: true, openTime: '۰۹:۳۰', closeTime: '۱۹:۳۰' },
    { dayName: 'چهارشنبه', isOpen: true, openTime: '۰۹:۳۰', closeTime: '۱۹:۳۰' },
    { dayName: 'پنج‌شنبه', isOpen: true, openTime: '۱۰:۰۰', closeTime: '۱۸:۰۰' },
    { dayName: 'جمعه', isOpen: false, openTime: '۱۰:۰۰', closeTime: '۱۶:۰۰' },
  ],
  licenseCode: 'SNF-1405-88412',
  nationalIdNumber: '0012345678',
};

const INITIAL_BOOKING_DRAFT: BookingDraft = {
  businessSlug: 'royal-golzar',
  serviceId: 'srv-101',
  specialistId: 'spc-1',
  dateJalali: '۱۴۰۵/۰۸/۰۵',
  timeSlot: '۱۱:۰۰',
  customerName: 'المیرا شمس',
  customerPhone: '09123456789',
  customerNotes: '',
  lastReferenceCode: 'BH-403990',
};

const PrototypeDataContext = createContext<PrototypeDataContextValue | null>(
  null
);

export const PrototypeDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [favoriteBusinessIds, setFavoriteBusinessIds] = useState<string[]>([
    'biz-1',
    'biz-3',
  ]);
  const [businesses, setBusinesses] =
    useState<BusinessItem[]>(SAMPLE_BUSINESSES);
  const [services, setServices] = useState<ServiceItem[]>(SAMPLE_SERVICES);
  const [specialists, setSpecialists] =
    useState<SpecialistItem[]>(SAMPLE_SPECIALISTS);
  const [appointments, setAppointments] =
    useState<AppointmentItem[]>(SAMPLE_APPOINTMENTS);
  const [categories, setCategories] =
    useState<CategoryItem[]>(SAMPLE_CATEGORIES);
  const [gallery, setGallery] = useState<GalleryItem[]>(SAMPLE_GALLERY);
  const [campaigns, setCampaigns] =
    useState<MarketingCampaignItem[]>(SAMPLE_CAMPAIGNS);
  const [activePlanId, setActivePlanId] = useState<string>('plan-professional');
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>(
    INITIAL_ONBOARDING_DRAFT
  );
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(
    INITIAL_BOOKING_DRAFT
  );
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const showToast = (
    message: string,
    tone: 'success' | 'info' | 'warning' | 'danger' = 'success'
  ) => {
    setToast({ id: Date.now(), message, tone });
  };

  const dismissToast = () => setToast(null);

  const toggleFavoriteBusiness = (businessId: string) => {
    setFavoriteBusinessIds((prev) => {
      const exists = prev.includes(businessId);
      const next = exists
        ? prev.filter((id) => id !== businessId)
        : [...prev, businessId];
      showToast(
        exists
          ? 'از فهرست سالن‌های منتخب شما حذف شد (حالت دمو).'
          : 'به فهرست سالن‌های منتخب شما اضافه شد (حالت دمو).',
        'info'
      );
      return next;
    });
  };

  const updateBusinessProfile = (
    businessId: string,
    patch: Partial<BusinessItem>
  ) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === businessId ? { ...b, ...patch } : b))
    );
    showToast('اطلاعات پروفایل کسب‌وکار در وضعیت آزمایشی بروزرسانی شد.');
  };

  const updateBusinessWorkingHours = (
    businessId: string,
    hours: WorkingHourItem[]
  ) => {
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId ? { ...b, workingHours: hours } : b
      )
    );
    showToast('ساعات کاری هفتگی در وضعیت آزمایشی ذخیره شد.');
  };

  const updateBusinessApproval = (
    businessId: string,
    status: ApprovalStatus
  ) => {
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId
          ? {
              ...b,
              approvalStatus: status,
              verifiedBadge: status === 'APPROVED',
            }
          : b
      )
    );
    showToast(
      status === 'APPROVED'
        ? 'وضعیت کسب‌وکار به «تاییدشده» تغییر یافت (آزمایشی).'
        : 'وضعیت کسب‌وکار به «ردشده / نیازمند اصلاح» تغییر یافت (آزمایشی).',
      status === 'APPROVED' ? 'success' : 'warning'
    );
  };

  const addService = (item: Omit<ServiceItem, 'id'>) => {
    const newItem: ServiceItem = {
      ...item,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [newItem, ...prev]);
    showToast(`خدمت «${item.title}» به فهرست آزمایشی اضافه شد.`);
  };

  const updateService = (id: string, patch: Partial<ServiceItem>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
    showToast('ویرایش خدمت در حالت دمو ذخیره شد.');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('خدمت انتخاب‌شده از فهرست آزمایشی حذف شد.', 'warning');
  };

  const addSpecialist = (item: Omit<SpecialistItem, 'id'>) => {
    const newItem: SpecialistItem = {
      ...item,
      id: `spc-${Date.now()}`,
    };
    setSpecialists((prev) => [newItem, ...prev]);
    showToast(`متخصص «${item.fullName}» به تیم آزمایشی اضافه شد.`);
  };

  const updateSpecialist = (id: string, patch: Partial<SpecialistItem>) => {
    setSpecialists((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp))
    );
    showToast('اطلاعات متخصص در حالت دمو بروزرسانی شد.');
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    showToast('وضعیت نوبت آزمایشی بروزرسانی شد.');
  };

  const addCategory = (item: Omit<CategoryItem, 'id'>) => {
    setCategories((prev) => [{ ...item, id: `cat-${Date.now()}` }, ...prev]);
    showToast(`دسته‌بندی «${item.title}» به فهرست دمو اضافه شد.`);
  };

  const updateCategory = (id: string, patch: Partial<CategoryItem>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
    showToast('دسته‌بندی در حالت دمو ویرایش شد.');
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    setGallery((prev) => [{ ...item, id: `gal-${Date.now()}` }, ...prev]);
    showToast('آیتم جدید به گالری آزمایشی سالن اضافه شد.');
  };

  const removeGalleryItem = (id: string) => {
    setGallery((prev) => prev.filter((g) => g.id !== id));
    showToast('تصویر نمونه از گالری آزمایشی حذف شد.', 'info');
  };

  const addCampaign = (item: Omit<MarketingCampaignItem, 'id'>) => {
    setCampaigns((prev) => [{ ...item, id: `cmp-${Date.now()}` }, ...prev]);
    showToast('کمپین تبلیغاتی دمو ایجاد شد (بدون ارسال پیامک واقعی).');
  };

  const updateOnboardingDraft = (patch: Partial<OnboardingDraft>) => {
    setOnboardingDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateBookingDraft = (patch: Partial<BookingDraft>) => {
    setBookingDraft((prev) => ({ ...prev, ...patch }));
  };

  const completeSimulatedBooking = (): AppointmentItem => {
    const biz =
      businesses.find((b) => b.slug === bookingDraft.businessSlug) ??
      businesses[0];
    const srv =
      services.find((s) => s.id === bookingDraft.serviceId) ?? services[0];
    const spc =
      specialists.find((sp) => sp.id === bookingDraft.specialistId) ??
      specialists[0];
    const refCode = `BH-${Math.floor(404000 + Math.random() * 9000)}`;

    const newApt: AppointmentItem = {
      id: `apt-sim-${Date.now()}`,
      referenceCode: refCode,
      businessId: biz.id,
      businessSlug: biz.slug,
      businessName: biz.name,
      customerName: bookingDraft.customerName || 'المیرا شمس (دمو)',
      customerPhoneMasked: bookingDraft.customerPhone || '۰۹۱۲***۴۵۸۱',
      serviceId: srv.id,
      serviceTitle: srv.title,
      specialistId: spc.id,
      specialistName: spc.fullName,
      dateJalali: bookingDraft.dateJalali,
      timeSlot: bookingDraft.timeSlot,
      durationMinutes: srv.durationMinutes,
      priceToman: srv.priceToman,
      status: AppointmentStatus.Confirmed,
      notes: bookingDraft.customerNotes || 'رزرو شبیه‌سازی‌شده در مرحله ۲',
    };

    setAppointments((prev) => [newApt, ...prev]);
    setBookingDraft((prev) => ({ ...prev, lastReferenceCode: refCode }));
    showToast(`نوبت شبیه‌سازی‌شده با کد ${refCode} در لیست نوبت‌های من ثبت شد.`);
    return newApt;
  };

  return (
    <PrototypeDataContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        favoriteBusinessIds,
        toggleFavoriteBusiness,
        businesses,
        updateBusinessProfile,
        updateBusinessWorkingHours,
        updateBusinessApproval,
        services,
        addService,
        updateService,
        deleteService,
        specialists,
        addSpecialist,
        updateSpecialist,
        appointments,
        updateAppointmentStatus,
        categories,
        addCategory,
        updateCategory,
        gallery,
        addGalleryItem,
        removeGalleryItem,
        campaigns,
        addCampaign,
        customers: SAMPLE_CUSTOMERS,
        reviews: SAMPLE_REVIEWS,
        plans: SAMPLE_SUBSCRIPTION_PLANS,
        activePlanId,
        setActivePlanId,
        onboardingDraft,
        updateOnboardingDraft,
        bookingDraft,
        updateBookingDraft,
        completeSimulatedBooking,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </PrototypeDataContext.Provider>
  );
};

export function usePrototypeData(): PrototypeDataContextValue {
  const ctx = useContext(PrototypeDataContext);
  if (!ctx) {
    throw new Error(
      'usePrototypeData must be used inside a PrototypeDataProvider'
    );
  }
  return ctx;
}
