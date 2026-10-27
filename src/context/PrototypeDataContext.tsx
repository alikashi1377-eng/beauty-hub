import React, { createContext, useContext, useEffect, useState } from 'react';
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
  ApiClientError,
  AuthenticatedSessionUser,
  realApiClient,
} from '../services/apiClient';
import {
  AdminUserRecord,
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
  SubscriptionStatus,
  WorkingHourItem,
} from '../types';
import { computeSelectedServicesSummary } from '../utils/formatters';

export interface ToastNotice {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
}

interface PrototypeDataContextValue {
  dataMode: 'mock' | 'real';
  databaseError: string | null;
  isLoadingInitialData: boolean;
  authUser: AuthenticatedSessionUser | null;
  ownedBusinessId: string | null;
  requestOtpLogin: (phone: string) => Promise<{ challengeId?: string }>;
  verifyOtpLogin: (
    phone: string,
    code: string
  ) => Promise<AuthenticatedSessionUser>;
  logoutUser: () => Promise<void>;
  updateCustomerProfile: (patch: {
    fullName?: string;
    defaultCity?: string;
  }) => Promise<boolean>;
  refreshRealData: () => Promise<void>;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  favoriteBusinessIds: string[];
  toggleFavoriteBusiness: (businessId: string) => void;
  favoriteSpecialistIds: string[];
  toggleFavoriteSpecialist: (specialistId: string) => void;
  businesses: BusinessItem[];
  currentBusiness: BusinessItem | null;
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
  adminUsers: AdminUserRecord[];
  reviews: ReviewItem[];
  addReview: (input: {
    businessId: string;
    specialistSlug?: string;
    serviceTitle: string;
    rating: number;
    comment: string;
  }) => Promise<boolean>;
  plans: SubscriptionPlanItem[];
  activePlanId: string;
  setActivePlanId: (planId: string) => void;
  onboardingDraft: OnboardingDraft;
  updateOnboardingDraft: (patch: Partial<OnboardingDraft>) => void;
  submitBusinessOnboarding: () => Promise<boolean>;
  bookingDraft: BookingDraft;
  updateBookingDraft: (patch: Partial<BookingDraft>) => void;
  completeSimulatedBooking: () => AppointmentItem;
  submitBooking: () => Promise<AppointmentItem>;
  toast: ToastNotice | null;
  showToast: (
    message: string,
    tone?: 'success' | 'info' | 'warning' | 'danger'
  ) => void;
  dismissToast: () => void;
}

const INITIAL_ONBOARDING_DRAFT: OnboardingDraft = {
  businessType: BusinessType.WomenSalon,
  businessName: 'سالن زیبایی ارکیده نقره‌ای',
  categorySlug: 'hair-color',
  slug: 'orkideh-salon',
  ownerName: 'مریم فرهادی',
  phone: '09131234567',
  instagramHandle: '@orkideh.beauty',
  avatarUrl:
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&h=400&q=80',
  city: 'اصفهان',
  neighborhood: 'چهارباغ بالا',
  address: 'اصفهان، چهارباغ بالا، روبه‌روی مجتمع پارک، ساختمان ارکیده، طبقه دوم',
  mapLat: 32.6288,
  mapLng: 51.6621,
  shortDescription:
    'مرکز تخصصی رنگ و مش، احیای مو و طراحی ناخن با کادر مجرب و نوبت‌دهی آنلاین در اصفهان.',
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
  licenseCode: '',
  nationalIdNumber: '',
  selectedPlanId: 'plan-professional',
};

const INITIAL_BOOKING_DRAFT: BookingDraft = {
  businessSlug: 'royal-golzar',
  serviceId: 'srv-101',
  serviceIds: ['srv-101'],
  specialistId: 'spc-1',
  dateJalali: '۱۴۰۵/۰۸/۰۵',
  timeSlot: '۱۱:۰۰',
  customerName: 'المیرا شمس',
  customerPhone: '09123456789',
  customerNotes: '',
  lastReferenceCode: 'TM-403990',
};

const PrototypeDataContext = createContext<PrototypeDataContextValue | null>(
  null
);

export const PrototypeDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dataMode, setDataMode] = useState<'mock' | 'real'>('mock');
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] =
    useState<boolean>(true);
  const [authUser, setAuthUser] = useState<AuthenticatedSessionUser | null>(
    null
  );

  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [favoriteBusinessIds, setFavoriteBusinessIds] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('beautyhub_fav_businesses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return ['biz-1', 'biz-3'];
  });
  const [favoriteSpecialistIds, setFavoriteSpecialistIds] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('beautyhub_fav_specialists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return ['spc-1', 'spc-4'];
  });
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
  const [customers, setCustomers] =
    useState<CustomerRecord[]>(SAMPLE_CUSTOMERS);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [ownedBusinessId, setOwnedBusinessId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>(SAMPLE_REVIEWS);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(
    SAMPLE_SUBSCRIPTION_PLANS
  );
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

  const currentBusiness: BusinessItem | null = React.useMemo(() => {
    if (dataMode === 'real') {
      if (ownedBusinessId) {
        const foundOwned = businesses.find((b) => b.id === ownedBusinessId);
        if (foundOwned) return foundOwned;
      }
      const firstMembership = authUser?.businessMemberships?.[0];
      if (firstMembership) {
        const foundMemberBiz = businesses.find(
          (b) =>
            b.id === firstMembership.businessId ||
            b.slug === firstMembership.businessSlug ||
            b.id === firstMembership.businessUuid
        );
        if (foundMemberBiz) return foundMemberBiz;
      }
      return businesses[0] ?? null;
    }
    return businesses[0] ?? null;
  }, [dataMode, ownedBusinessId, authUser, businesses]);

  const loadAuthenticatedRoleData = async (
    currentUser: AuthenticatedSessionUser
  ) => {
    try {
      const meRes = await realApiClient.fetchCustomerBootstrap();
      setFavoriteBusinessIds(meRes.data.favoriteBusinessIds);
      setAppointments(meRes.data.appointments);
    } catch {
      // ادامه در صورت نبود داده مشتری
    }

    if (currentUser.roles.includes('BUSINESS_OWNER')) {
      try {
        const wsRes = await realApiClient.fetchBusinessWorkspace();
        if (wsRes.data.business) {
          const ownedBiz = wsRes.data.business;
          setOwnedBusinessId(ownedBiz.id);
          setBusinesses((prev) => {
            const map = new Map(prev.map((b) => [b.id, b]));
            map.set(ownedBiz.id, ownedBiz);
            return Array.from(map.values());
          });
        }
        setServices((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          for (const s of wsRes.data.services) {
            map.set(s.id, s);
          }
          return Array.from(map.values());
        });
        setSpecialists((prev) => {
          const map = new Map(prev.map((sp) => [sp.id, sp]));
          for (const sp of wsRes.data.specialists) {
            map.set(sp.id, sp);
          }
          return Array.from(map.values());
        });
        setGallery((prev) => {
          const map = new Map(prev.map((g) => [g.id, g]));
          for (const g of wsRes.data.gallery) {
            map.set(g.id, g);
          }
          return Array.from(map.values());
        });
        setAppointments(wsRes.data.appointments);
        setCustomers(wsRes.data.customers);
        setCampaigns(wsRes.data.campaigns);
      } catch {
        // در صورت عدم دسترسی یا نبود کسب‌وکار، داده‌های خصوصی پنل خالی می‌ماند
      }
    }

    if (currentUser.roles.includes('PLATFORM_ADMIN')) {
      try {
        const adminRes = await realApiClient.fetchAdminOverview();
        setBusinesses(adminRes.data.businesses);
        setCategories(adminRes.data.categories);
        if (adminRes.data.plans.length > 0) {
          setPlans(adminRes.data.plans);
        }
        if (Array.isArray(adminRes.data.users)) {
          setAdminUsers(adminRes.data.users);
        }
        if (Array.isArray(adminRes.data.appointments)) {
          setAppointments(adminRes.data.appointments);
        }
      } catch {
        // عدم دسترسی ادمین
      }
    }
  };

  const refreshRealData = async () => {
    setIsLoadingInitialData(true);
    try {
      const response = await realApiClient.fetchBootstrap();
      if (response.mode === 'real' && response.data) {
        setDataMode('real');
        setDatabaseError(null);
        setCategories(response.data.categories);
        setBusinesses(response.data.businesses);
        setServices(response.data.services);
        setSpecialists(response.data.specialists);
        setReviews(response.data.reviews);
        setGallery(response.data.gallery);
        if (response.data.plans.length > 0) {
          setPlans(response.data.plans);
        }

        // پاکسازی اولیه داده‌های خصوصی تا پیش از بررسی نشست معتبر
        setAppointments([]);
        setCustomers([]);
        setCampaigns([]);
        setFavoriteBusinessIds([]);
        setAdminUsers([]);
        setOwnedBusinessId(null);

        const firstRealBiz = response.data.businesses[0];
        const firstRealSrv = response.data.services[0];
        const firstRealSpc = response.data.specialists[0];
        setBookingDraft((prev) => ({
          ...prev,
          businessSlug: firstRealBiz?.slug ?? prev.businessSlug,
          serviceId: firstRealSrv?.id ?? prev.serviceId,
          serviceIds: firstRealSrv?.id ? [firstRealSrv.id] : prev.serviceIds,
          specialistId: firstRealSpc?.id ?? prev.specialistId,
          customerName: '',
          customerPhone: '',
          lastReferenceCode: undefined,
        }));

        try {
          const sessionRes = await realApiClient.getCurrentUser();
          setAuthUser(sessionRes.user);
          setBookingDraft((prev) => ({
            ...prev,
            customerName: sessionRes.user.fullName || prev.customerName,
            customerPhone: sessionRes.user.phone || prev.customerPhone,
          }));
          await loadAuthenticatedRoleData(sessionRes.user);
        } catch {
          setAuthUser(null);
        }
      } else if (response.mode === 'mock') {
        setDataMode('mock');
        setDatabaseError(null);
        setAuthUser(null);
      } else {
        setDataMode('real');
        setDatabaseError('پاسخ سرور نامعتبر است؛ به داده‌های آزمایشی بازگشت داده نمی‌شود.');
        setBusinesses([]);
        setServices([]);
        setSpecialists([]);
        setAppointments([]);
        setCustomers([]);
        setAdminUsers([]);
        setOwnedBusinessId(null);
        setReviews([]);
        setGallery([]);
        setCampaigns([]);
        setFavoriteBusinessIds([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError || err instanceof Error
          ? err.message
          : 'ارتباط با سرور یا پایگاه داده PostgreSQL برقرار نشد؛ به داده‌های آزمایشی (Mock) بازگشت داده نمی‌شود.';
      // عدم بازگشت خاموش به داده‌های آزمایشی در صورت هرگونه خطای دیتابیس، شبکه یا API
      setDataMode('real');
      setDatabaseError(errorMessage);
      setBusinesses([]);
      setServices([]);
      setSpecialists([]);
      setAppointments([]);
      setCustomers([]);
      setAdminUsers([]);
      setOwnedBusinessId(null);
      setReviews([]);
      setGallery([]);
      setCampaigns([]);
      setFavoriteBusinessIds([]);
      setAuthUser(null);
      showToast(errorMessage, 'danger');
    } finally {
      setIsLoadingInitialData(false);
    }
  };

  useEffect(() => {
    void refreshRealData();
  }, []);

  const requestOtpLogin = async (
    phone: string
  ): Promise<{ challengeId?: string }> => {
    if (dataMode === 'mock') {
      showToast('کد تایید آزمایشی (حالت دمو) صادر شد.', 'info');
      return { challengeId: 'mock-challenge' };
    }
    const res = await realApiClient.requestOtp(phone);
    showToast(res.message, 'info');
    return { challengeId: res.challengeId };
  };

  const verifyOtpLogin = async (
    phone: string,
    code: string
  ): Promise<AuthenticatedSessionUser> => {
    if (dataMode === 'mock') {
      const mockUser: AuthenticatedSessionUser = {
        userId: 'mock-user-1',
        sessionId: 'mock-session-1',
        phone,
        fullName: 'المیرا شمس',
        defaultCity: 'تهران',
        roles: ['CUSTOMER'],
        isPlatformAdmin: false,
        businessMemberships: [],
      };
      setAuthUser(mockUser);
      showToast('ورود آزمایشی (حالت دمو) انجام شد.');
      return mockUser;
    }

    const res = await realApiClient.verifyOtp(phone, code);
    setAuthUser(res.user);
    setBookingDraft((prev) => ({
      ...prev,
      customerName: res.user.fullName || prev.customerName,
      customerPhone: res.user.phone || prev.customerPhone,
    }));
    await loadAuthenticatedRoleData(res.user);
    showToast(res.message, 'success');
    return res.user;
  };

  const logoutUser = async (): Promise<void> => {
    if (dataMode === 'real') {
      try {
        await realApiClient.logout();
      } catch {
        // نادیده گرفتن خطا در صورت انقضای قبلی نشست
      }
      setAuthUser(null);
      setOwnedBusinessId(null);
      setAppointments([]);
      setCustomers([]);
      setAdminUsers([]);
      setCampaigns([]);
      setFavoriteBusinessIds([]);
      showToast('از حساب کاربری خارج شدید.', 'info');
      return;
    }

    setAuthUser(null);
    showToast('خروج از حساب آزمایشی انجام شد.', 'info');
  };

  const updateCustomerProfile = async (patch: {
    fullName?: string;
    defaultCity?: string;
  }): Promise<boolean> => {
    if (dataMode === 'real') {
      try {
        const res = await realApiClient.updateMyProfile(patch);
        setAuthUser(res.user);
        setBookingDraft((prev) => ({
          ...prev,
          customerName: res.user.fullName || prev.customerName,
        }));
        showToast(res.message, 'success');
        return true;
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : 'خطا در بروزرسانی پروفایل کاربری در دیتابیس',
          'danger'
        );
        return false;
      }
    }

    if (authUser) {
      setAuthUser({
        ...authUser,
        fullName: patch.fullName ?? authUser.fullName,
        defaultCity: patch.defaultCity ?? authUser.defaultCity,
      });
    }
    showToast('تغییرات پروفایل ذخیره شد.');
    return true;
  };

  const toggleFavoriteBusiness = (businessId: string) => {
    if (dataMode === 'real') {
      void realApiClient
        .toggleFavoriteBusiness(businessId)
        .then((res) => {
          setFavoriteBusinessIds(res.favoriteBusinessIds);
          try {
            window.localStorage.setItem(
              'beautyhub_fav_businesses',
              JSON.stringify(res.favoriteBusinessIds)
            );
          } catch {
            // ignore storage errors
          }
          showToast(
            res.favorited
              ? 'به فهرست سالن‌های علاقه‌مندی شما اضافه شد.'
              : 'از فهرست سالن‌های علاقه‌مندی شما حذف شد.',
            'info'
          );
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ثبت علاقه‌مندی در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setFavoriteBusinessIds((prev) => {
      const exists = prev.includes(businessId);
      const next = exists
        ? prev.filter((id) => id !== businessId)
        : [...prev, businessId];
      try {
        window.localStorage.setItem(
          'beautyhub_fav_businesses',
          JSON.stringify(next)
        );
      } catch {
        // ignore storage errors
      }
      const targetBiz = businesses.find((b) => b.id === businessId);
      showToast(
        exists
          ? `${targetBiz ? `«${targetBiz.name}»` : 'سالن'} از لیست علاقه‌مندی‌ها حذف شد.`
          : `${targetBiz ? `«${targetBiz.name}»` : 'سالن'} در علاقه‌مندی‌های پروفایل شما ذخیره شد.`,
        exists ? 'info' : 'success'
      );
      return next;
    });
  };

  const toggleFavoriteSpecialist = (specialistId: string) => {
    setFavoriteSpecialistIds((prev) => {
      const exists = prev.includes(specialistId);
      const next = exists
        ? prev.filter((id) => id !== specialistId)
        : [...prev, specialistId];
      try {
        window.localStorage.setItem(
          'beautyhub_fav_specialists',
          JSON.stringify(next)
        );
      } catch {
        // ignore storage errors
      }
      const targetSpc = specialists.find((s) => s.id === specialistId);
      showToast(
        exists
          ? `${targetSpc ? `«${targetSpc.fullName}»` : 'متخصص'} از لیست علاقه‌مندی‌ها حذف شد.`
          : `${targetSpc ? `«${targetSpc.fullName}»` : 'متخصص'} در علاقه‌مندی‌های پروفایل شما ذخیره شد.`,
        exists ? 'info' : 'success'
      );
      return next;
    });
  };

  const updateBusinessProfile = (
    businessId: string,
    patch: Partial<BusinessItem>
  ) => {
    if (dataMode === 'real') {
      void realApiClient
        .updateBusinessProfile(businessId, patch)
        .then(() => {
          setBusinesses((prev) =>
            prev.map((b) => (b.id === businessId ? { ...b, ...patch } : b))
          );
          showToast('اطلاعات پروفایل کسب‌وکار در پایگاه داده ذخیره شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در بروزرسانی پروفایل کسب‌وکار در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setBusinesses((prev) =>
      prev.map((b) => (b.id === businessId ? { ...b, ...patch } : b))
    );
    showToast('اطلاعات پروفایل کسب‌وکار بروزرسانی شد.');
  };

  const updateBusinessWorkingHours = (
    businessId: string,
    hours: WorkingHourItem[]
  ) => {
    if (dataMode === 'real') {
      void realApiClient
        .updateBusinessWorkingHours(businessId, hours)
        .then((res) => {
          setBusinesses((prev) =>
            prev.map((b) =>
              b.id === businessId
                ? { ...b, workingHours: res.workingHours }
                : b
            )
          );
          showToast('ساعات کاری هفتگی در پایگاه داده ذخیره شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ذخیره ساعات کاری در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId ? { ...b, workingHours: hours } : b
      )
    );
    showToast('ساعات کاری هفتگی ذخیره شد.');
  };

  const updateBusinessApproval = (
    businessId: string,
    status: ApprovalStatus
  ) => {
    if (dataMode === 'real') {
      void realApiClient
        .updateBusinessApproval(businessId, status)
        .then(() => {
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
              ? 'وضعیت کسب‌وکار در دیتابیس به «تاییدشده» تغییر یافت.'
              : 'وضعیت کسب‌وکار در دیتابیس به «ردشده» تغییر یافت.',
            status === 'APPROVED' ? 'success' : 'warning'
          );
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در تغییر وضعیت تایید کسب‌وکار در دیتابیس',
            'danger'
          );
        });
      return;
    }

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
        ? 'وضعیت کسب‌وکار به «تاییدشده» تغییر یافت.'
        : 'وضعیت کسب‌وکار به «ردشده / نیازمند اصلاح» تغییر یافت.',
      status === 'APPROVED' ? 'success' : 'warning'
    );
  };

  const addService = (item: Omit<ServiceItem, 'id'>) => {
    if (dataMode === 'real') {
      void realApiClient
        .createService(item)
        .then((res) => {
          setServices((prev) => [res.item, ...prev]);
          showToast(`خدمت «${res.item.title}» در پایگاه داده ثبت شد.`);
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error ? err.message : 'خطا در ثبت خدمت در دیتابیس',
            'danger'
          );
        });
      return;
    }

    const newItem: ServiceItem = {
      ...item,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [newItem, ...prev]);
    showToast(`خدمت «${item.title}» به فهرست اضافه شد.`);
  };

  const updateService = (id: string, patch: Partial<ServiceItem>) => {
    if (dataMode === 'real') {
      void realApiClient
        .updateService(id, patch)
        .then((res) => {
          setServices((prev) =>
            prev.map((s) => (s.id === id ? res.item : s))
          );
          showToast('ویرایش خدمت در پایگاه داده ذخیره شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ویرایش خدمت در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
    showToast('ویرایش خدمت ذخیره شد.');
  };

  const deleteService = (id: string) => {
    if (dataMode === 'real') {
      void realApiClient
        .deleteService(id)
        .then(() => {
          setServices((prev) => prev.filter((s) => s.id !== id));
          showToast('خدمت انتخاب‌شده در پایگاه داده غیرفعال شد.', 'warning');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error ? err.message : 'خطا در حذف خدمت از دیتابیس',
            'danger'
          );
        });
      return;
    }

    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('خدمت انتخاب‌شده از فهرست حذف شد.', 'warning');
  };

  const addSpecialist = (item: Omit<SpecialistItem, 'id'>) => {
    if (dataMode === 'real') {
      void realApiClient
        .createSpecialist(item)
        .then((res) => {
          setSpecialists((prev) => [res.item, ...prev]);
          showToast(`متخصص «${res.item.fullName}» در پایگاه داده ثبت شد.`);
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ثبت متخصص در دیتابیس',
            'danger'
          );
        });
      return;
    }

    const newItem: SpecialistItem = {
      ...item,
      id: `spc-${Date.now()}`,
    };
    setSpecialists((prev) => [newItem, ...prev]);
    showToast(`متخصص «${item.fullName}» به تیم اضافه شد.`);
  };

  const updateSpecialist = (id: string, patch: Partial<SpecialistItem>) => {
    if (dataMode === 'real') {
      void realApiClient
        .updateSpecialist(id, patch)
        .then((res) => {
          setSpecialists((prev) =>
            prev.map((sp) => (sp.id === id ? res.item : sp))
          );
          showToast('اطلاعات متخصص در پایگاه داده بروزرسانی شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در بروزرسانی متخصص در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setSpecialists((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp))
    );
    showToast('اطلاعات متخصص بروزرسانی شد.');
  };

  const updateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    if (dataMode === 'real') {
      void realApiClient
        .updateAppointmentStatus(id, status)
        .then(() => {
          setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status } : a))
          );
          showToast('وضعیت نوبت در پایگاه داده بروزرسانی شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در تغییر وضعیت نوبت در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    showToast('وضعیت نوبت بروزرسانی شد.');
  };

  const addCategory = (item: Omit<CategoryItem, 'id'>) => {
    if (dataMode === 'real') {
      void realApiClient
        .createCategory(item)
        .then((res) => {
          setCategories((prev) => [res.item, ...prev]);
          showToast(`دسته‌بندی «${res.item.title}» در پایگاه داده ثبت شد.`);
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ثبت دسته‌بندی در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setCategories((prev) => [{ ...item, id: `cat-${Date.now()}` }, ...prev]);
    showToast(`دسته‌بندی «${item.title}» به فهرست اضافه شد.`);
  };

  const updateCategory = (id: string, patch: Partial<CategoryItem>) => {
    if (dataMode === 'real') {
      void realApiClient
        .updateCategory(id, patch)
        .then((res) => {
          setCategories((prev) =>
            prev.map((c) => (c.id === id ? res.item : c))
          );
          showToast('دسته‌بندی در پایگاه داده ویرایش شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ویرایش دسته‌بندی در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
    showToast('دسته‌بندی ویرایش شد.');
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    if (dataMode === 'real') {
      void realApiClient
        .createGalleryItem(item)
        .then((res) => {
          setGallery((prev) => [res.item, ...prev]);
          showToast('آیتم جدید در گالری پایگاه داده ثبت شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ثبت آیتم گالری در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setGallery((prev) => [{ ...item, id: `gal-${Date.now()}` }, ...prev]);
    showToast('آیتم جدید به گالری سالن اضافه شد.');
  };

  const removeGalleryItem = (id: string) => {
    if (dataMode === 'real') {
      void realApiClient
        .deleteGalleryItem(id)
        .then(() => {
          setGallery((prev) => prev.filter((g) => g.id !== id));
          showToast('تصویر نمونه از گالری پایگاه داده حذف شد.', 'info');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در حذف تصویر از دیتابیس',
            'danger'
          );
        });
      return;
    }

    setGallery((prev) => prev.filter((g) => g.id !== id));
    showToast('تصویر نمونه از گالری حذف شد.', 'info');
  };

  const addCampaign = (item: Omit<MarketingCampaignItem, 'id'>) => {
    if (dataMode === 'real') {
      void realApiClient
        .createCampaign(item)
        .then((res) => {
          setCampaigns((prev) => [res.item, ...prev]);
          showToast('کمپین تبلیغاتی در پایگاه داده ثبت شد.');
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ثبت کمپین در دیتابیس',
            'danger'
          );
        });
      return;
    }

    setCampaigns((prev) => [{ ...item, id: `cmp-${Date.now()}` }, ...prev]);
    showToast('کمپین تبلیغاتی ایجاد شد.');
  };

  const addReview = async (input: {
    businessId: string;
    specialistSlug?: string;
    serviceTitle: string;
    rating: number;
    comment: string;
  }): Promise<boolean> => {
    if (dataMode === 'real') {
      try {
        const res = await realApiClient.createReview(input);
        setReviews((prev) => [res.item, ...prev]);
        showToast('دیدگاه و امتیاز شما در پایگاه داده ثبت شد.');
        return true;
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : 'خطا در ثبت دیدگاه در دیتابیس',
          'danger'
        );
        return false;
      }
    }

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      businessId: input.businessId,
      specialistSlug: input.specialistSlug,
      authorName: authUser?.fullName || 'المیرا شمس',
      serviceTitle: input.serviceTitle,
      rating: input.rating,
      dateJalali: '۱۴۰۵/۰۸/۰۵',
      comment: input.comment,
    };
    setReviews((prev) => [newReview, ...prev]);
    showToast('دیدگاه شما ثبت شد.');
    return true;
  };

  const updateOnboardingDraft = (patch: Partial<OnboardingDraft>) => {
    setOnboardingDraft((prev) => ({ ...prev, ...patch }));
  };

  const submitBusinessOnboarding = async (): Promise<boolean> => {
    if (onboardingDraft.selectedPlanId) {
      setActivePlanId(onboardingDraft.selectedPlanId);
    }

    if (dataMode === 'real') {
      try {
        const res = await realApiClient.onboardBusiness(onboardingDraft);
        setOwnedBusinessId(res.businessId);
        setCategories(res.data.categories);
        setBusinesses(res.data.businesses);
        setServices(res.data.services);
        setSpecialists(res.data.specialists);
        try {
          const sessionRes = await realApiClient.getCurrentUser();
          setAuthUser(sessionRes.user);
          await loadAuthenticatedRoleData(sessionRes.user);
        } catch {
          // ادامه
        }
        showToast(
          `کسب‌وکار «${onboardingDraft.businessName}» با موفقیت در پایگاه داده ثبت شد.`
        );
        return true;
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : 'خطا در ثبت کسب‌وکار جدید در دیتابیس',
          'danger'
        );
        return false;
      }
    }

    const chosenPlan =
      plans.find((p) => p.id === onboardingDraft.selectedPlanId) ?? plans[1];
    const newBizId = `biz-onb-${onboardingDraft.slug || 'custom'}`;
    const minServicePrice =
      onboardingDraft.services.length > 0
        ? Math.min(...onboardingDraft.services.map((s) => s.priceToman))
        : 450000;

    const newBiz: BusinessItem = {
      id: newBizId,
      slug: onboardingDraft.slug || 'orkideh-salon',
      name: onboardingDraft.businessName || 'سالن زیبایی جدید',
      type: onboardingDraft.businessType,
      typeLabel:
        onboardingDraft.businessType === BusinessType.MenBarbershop
          ? 'آرایشگاه مردانه'
          : onboardingDraft.businessType === BusinessType.IndependentSpecialist
          ? 'متخصص مستقل زیبایی'
          : 'سالن زیبایی زنانه',
      categorySlug: onboardingDraft.categorySlug || 'hair-color',
      city: onboardingDraft.city || 'اصفهان',
      neighborhood: onboardingDraft.neighborhood || 'چهارباغ بالا',
      address: onboardingDraft.address || 'اصفهان',
      phoneDisplay: onboardingDraft.phone || '09131234567',
      rating: 4.9,
      reviewCount: 12,
      startingPriceToman: minServicePrice,
      shortDescription:
        onboardingDraft.shortDescription ||
        'مرکز تخصصی زیبایی و مراقبت با نوبت‌دهی آنلاین در تایم تو.',
      aboutText:
        onboardingDraft.shortDescription ||
        'پذیرش منظم آنلاین با کادر مجرب و رعایت کامل استانداردهای بهداشتی.',
      verifiedBadge: true,
      approvalStatus: 'APPROVED',
      subscriptionPlan: chosenPlan?.name ?? 'حرفه‌ای (پرفروش)',
      subscriptionStatus: SubscriptionStatus.Trial,
      workingHours: onboardingDraft.workingHours,
      visualTheme: 'violet',
      featured: true,
      instagramHandle: onboardingDraft.instagramHandle,
      mapLat: onboardingDraft.mapLat,
      mapLng: onboardingDraft.mapLng,
      avatarUrl: onboardingDraft.avatarUrl,
    };

    setBusinesses((prev) => {
      const exists = prev.some(
        (b) => b.id === newBizId || b.slug === newBiz.slug
      );
      if (exists) {
        return prev.map((b) =>
          b.id === newBizId || b.slug === newBiz.slug ? newBiz : b
        );
      }
      return [newBiz, ...prev];
    });
    setOwnedBusinessId(newBizId);

    showToast(`راه‌اندازی «${onboardingDraft.businessName}» با موفقیت تکمیل شد.`);
    return true;
  };

  const updateBookingDraft = (patch: Partial<BookingDraft>) => {
    setBookingDraft((prev) => ({ ...prev, ...patch }));
  };

  const completeSimulatedBooking = (): AppointmentItem => {
    const biz =
      businesses.find((b) => b.slug === bookingDraft.businessSlug) ??
      businesses[0];
    const bizServices = biz
      ? services.filter((s) => s.businessId === biz.id)
      : services;
    const summary = computeSelectedServicesSummary(
      bizServices.length > 0 ? bizServices : services,
      bookingDraft.serviceIds ?? [],
      bookingDraft.serviceId
    );
    const primarySrv = summary.selectedServices[0] ?? services[0];
    const spc =
      specialists.find((sp) => sp.id === bookingDraft.specialistId) ??
      specialists[0];
    const refCode = `TM-${Math.floor(404000 + Math.random() * 9000)}`;

    const optimisticApt: AppointmentItem = {
      id: `apt-${Date.now()}`,
      referenceCode: refCode,
      businessId: biz?.id ?? 'biz-1',
      businessSlug: biz?.slug ?? bookingDraft.businessSlug,
      businessName: biz?.name ?? 'سالن زیبایی',
      customerName: bookingDraft.customerName || 'المیرا شمس',
      customerPhoneMasked: bookingDraft.customerPhone || '۰۹۱۲***۴۵۸۱',
      serviceId: primarySrv?.id ?? bookingDraft.serviceId,
      serviceTitle: summary.combinedTitle,
      specialistId: spc?.id ?? bookingDraft.specialistId,
      specialistName: spc?.fullName ?? 'متخصص سالن',
      dateJalali: bookingDraft.dateJalali,
      timeSlot: bookingDraft.timeSlot,
      durationMinutes: summary.totalDurationMinutes,
      priceToman: summary.totalPriceToman || 450000,
      status: AppointmentStatus.Confirmed,
      notes: bookingDraft.customerNotes || undefined,
    };

    if (dataMode === 'real') {
      void realApiClient
        .createAppointment({
          businessSlug: bookingDraft.businessSlug,
          serviceId: bookingDraft.serviceId,
          specialistId: bookingDraft.specialistId,
          dateJalali: bookingDraft.dateJalali,
          timeSlot: bookingDraft.timeSlot,
          customerName: bookingDraft.customerName,
          customerPhone: bookingDraft.customerPhone,
          customerNotes: bookingDraft.customerNotes,
        })
        .then((res) => {
          setAppointments((prev) => [res.item, ...prev]);
          setBookingDraft((prev) => ({
            ...prev,
            lastReferenceCode: res.item.referenceCode,
          }));
          showToast(
            `نوبت شما با کد رهگیری ${res.item.referenceCode} در پایگاه داده ثبت شد.`
          );
        })
        .catch((err: unknown) => {
          showToast(
            err instanceof Error
              ? err.message
              : 'خطا در ثبت نوبت در دیتابیس PostgreSQL',
            'danger'
          );
        });
      return optimisticApt;
    }

    setAppointments((prev) => [optimisticApt, ...prev]);
    setBookingDraft((prev) => ({ ...prev, lastReferenceCode: refCode }));
    showToast(`نوبت با کد ${refCode} در لیست نوبت‌های من ثبت شد.`);
    return optimisticApt;
  };

  const submitBooking = async (): Promise<AppointmentItem> => {
    if (dataMode === 'real') {
      const res = await realApiClient.createAppointment({
        businessSlug: bookingDraft.businessSlug,
        serviceId: bookingDraft.serviceId,
        specialistId: bookingDraft.specialistId,
        dateJalali: bookingDraft.dateJalali,
        timeSlot: bookingDraft.timeSlot,
        customerName: bookingDraft.customerName,
        customerPhone: bookingDraft.customerPhone,
        customerNotes: bookingDraft.customerNotes,
      });
      setAppointments((prev) => [res.item, ...prev]);
      setBookingDraft((prev) => ({
        ...prev,
        lastReferenceCode: res.item.referenceCode,
      }));
      showToast(
        `نوبت شما با کد رهگیری ${res.item.referenceCode} در پایگاه داده ثبت شد.`
      );
      return res.item;
    }

    return completeSimulatedBooking();
  };

  return (
    <PrototypeDataContext.Provider
      value={{
        dataMode,
        databaseError,
        isLoadingInitialData,
        authUser,
        ownedBusinessId,
        requestOtpLogin,
        verifyOtpLogin,
        logoutUser,
        updateCustomerProfile,
        refreshRealData,
        selectedCity,
        setSelectedCity,
        favoriteBusinessIds,
        toggleFavoriteBusiness,
        favoriteSpecialistIds,
        toggleFavoriteSpecialist,
        businesses,
        currentBusiness,
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
        customers,
        adminUsers,
        reviews,
        addReview,
        plans,
        activePlanId,
        setActivePlanId,
        onboardingDraft,
        updateOnboardingDraft,
        submitBusinessOnboarding,
        bookingDraft,
        updateBookingDraft,
        completeSimulatedBooking,
        submitBooking,
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
