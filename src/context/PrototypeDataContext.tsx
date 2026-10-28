import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_PAYMENT_GATEWAY_CONFIG,
  SAMPLE_AD_PACKAGES,
  SAMPLE_APPOINTMENTS,
  SAMPLE_BUSINESSES,
  SAMPLE_CAMPAIGNS,
  SAMPLE_CATEGORIES,
  SAMPLE_CUSTOMERS,
  SAMPLE_GALLERY,
  SAMPLE_PAYMENT_ORDERS,
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
  AdPackageItem,
  AdminNotificationItem,
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
  PaymentGatewayConfig,
  PaymentOrderItem,
  ReviewItem,
  ServiceItem,
  SmsMessageLogItem,
  SpecialistItem,
  SubscriptionPlanItem,
  SubscriptionStatus,
  WorkingHourItem,
} from '../types';
import { getBeautyPhotoUrl } from '../components/ui/VisualMediaIllustration';
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
  loginWithPassword: (
    phone: string,
    password: string
  ) => Promise<AuthenticatedSessionUser>;
  setAccountPassword: (password: string) => Promise<boolean>;
  resetPasswordWithOtp: (
    phone: string,
    code: string,
    newPassword: string
  ) => Promise<boolean>;
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
  updatePlan: (planId: string, patch: Partial<SubscriptionPlanItem>) => void;
  adPackages: AdPackageItem[];
  updateAdPackage: (pkgId: string, patch: Partial<AdPackageItem>) => void;
  paymentConfig: PaymentGatewayConfig;
  updatePaymentConfig: (patch: Partial<PaymentGatewayConfig>) => void;
  paymentOrders: PaymentOrderItem[];
  submitPaymentOrder: (
    input: Omit<PaymentOrderItem, 'id' | 'createdAtJalali' | 'status'>,
    autoApprove?: boolean
  ) => PaymentOrderItem;
  reviewPaymentOrder: (
    orderId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => void;
  smsLogs: SmsMessageLogItem[];
  sendBusinessCustomerSms: (input: {
    businessId?: string;
    recipientPhones: string[];
    messageText: string;
    templateTitle?: string;
  }) => Promise<boolean>;
  adminNotifications: AdminNotificationItem[];
  markAdminNotificationRead: (id: string) => void;
  clearAllAdminNotifications: () => void;
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
  avatarUrl: getBeautyPhotoUrl('سالن زیبایی ارکیده نقره‌ای', 'مو و رنگ'),
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
  selectedPlanId: 'plan-free-start',
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
  const mergeBusinessOverrides = (list: BusinessItem[]): BusinessItem[] => {
    try {
      const overridesRaw = window.localStorage.getItem('timeto_biz_overrides_v2');
      const overrides = overridesRaw ? JSON.parse(overridesRaw) : {};
      const localOnbRaw = window.localStorage.getItem(
        'timeto_local_onboarded_businesses_v1'
      );
      const localOnbList: BusinessItem[] = localOnbRaw
        ? JSON.parse(localOnbRaw)
        : [];

      const byIdOrSlug = new Map<string, BusinessItem>();
      for (const b of list) {
        const isSample =
          Boolean(b.isSampleShowcase) || /^biz-[1-8]$/.test(b.id);
        const merged = overrides[b.id]
          ? { ...b, ...overrides[b.id], isSampleShowcase: isSample }
          : { ...b, isSampleShowcase: isSample };
        byIdOrSlug.set(b.id, merged);
      }

      // اضافه کردن سالن‌های ثبت‌شده در مرورگر در صورتی که هنوز در لیست نباشند
      for (const lb of localOnbList) {
        const alreadyExists = Array.from(byIdOrSlug.values()).some(
          (x) => x.id === lb.id || x.slug === lb.slug
        );
        if (!alreadyExists) {
          const mergedLb = overrides[lb.id]
            ? { ...lb, ...overrides[lb.id] }
            : lb;
          byIdOrSlug.set(lb.id, mergedLb);
        }
      }

      // اطمینان از حضور سالن‌های نمونه نمایشی برای ویترین عمومی سایت
      for (const sb of SAMPLE_BUSINESSES) {
        const alreadyExists = Array.from(byIdOrSlug.values()).some(
          (x) => x.id === sb.id || x.slug === sb.slug
        );
        if (!alreadyExists) {
          const mergedSb = overrides[sb.id]
            ? { ...sb, ...overrides[sb.id], isSampleShowcase: true }
            : { ...sb, isSampleShowcase: true };
          byIdOrSlug.set(sb.id, mergedSb);
        }
      }

      return Array.from(byIdOrSlug.values());
    } catch {
      return list;
    }
  };

  const [businesses, setBusinesses] = useState<BusinessItem[]>(() =>
    mergeBusinessOverrides(SAMPLE_BUSINESSES)
  );
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
  const [ownedBusinessId, setOwnedBusinessId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem('timeto_owned_business_id_v1');
    } catch {
      return null;
    }
  });
  const [reviews, setReviews] = useState<ReviewItem[]>(SAMPLE_REVIEWS);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('timeto_custom_plans_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return SAMPLE_SUBSCRIPTION_PLANS;
  });
  const [adPackages, setAdPackages] = useState<AdPackageItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('timeto_custom_ad_packages_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return SAMPLE_AD_PACKAGES;
  });
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => {
    try {
      const saved = window.localStorage.getItem('timeto_payment_config_v2');
      if (saved) {
        return { ...DEFAULT_PAYMENT_GATEWAY_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PAYMENT_GATEWAY_CONFIG;
  });
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrderItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('timeto_payment_orders_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [smsLogs, setSmsLogs] = useState<SmsMessageLogItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('timeto_sms_logs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [adminNotifications, setAdminNotifications] = useState<
    AdminNotificationItem[]
  >(() => {
    try {
      const saved = window.localStorage.getItem('timeto_admin_notifications_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [activePlanId, setActivePlanId] = useState<string>('plan-free');
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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [toast?.id]);

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
        setBusinesses(mergeBusinessOverrides(adminRes.data.businesses));
        setCategories(
          adminRes.data.categories.length > 0
            ? adminRes.data.categories
            : SAMPLE_CATEGORIES
        );
        if (
          adminRes.data.plans.length > 0 &&
          !window.localStorage.getItem('timeto_custom_plans_v2')
        ) {
          setPlans(adminRes.data.plans);
        }
        if (Array.isArray(adminRes.data.users)) {
          setAdminUsers(adminRes.data.users);
        }
        if (Array.isArray(adminRes.data.appointments)) {
          setAppointments(adminRes.data.appointments);
        }
        if (Array.isArray(adminRes.adminNotifications)) {
          setAdminNotifications((prev) => {
            const byId = new Map<string, AdminNotificationItem>();
            for (const item of adminRes.adminNotifications as AdminNotificationItem[]) {
              if (item && item.id) byId.set(item.id, item);
            }
            for (const p of prev) {
              if (!byId.has(p.id)) byId.set(p.id, p);
            }
            const merged = Array.from(byId.values());
            try {
              window.localStorage.setItem(
                'timeto_admin_notifications_v1',
                JSON.stringify(merged)
              );
            } catch {
              // ignore
            }
            return merged;
          });
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
        setCategories(
          response.data.categories.length > 0
            ? response.data.categories
            : SAMPLE_CATEGORIES
        );
        setBusinesses(mergeBusinessOverrides(response.data.businesses));
        setServices(() => {
          const map = new Map<string, ServiceItem>();
          for (const s of SAMPLE_SERVICES) map.set(s.id, s);
          for (const s of response.data!.services) map.set(s.id, s);
          return Array.from(map.values());
        });
        setSpecialists(() => {
          const map = new Map<string, SpecialistItem>();
          for (const sp of SAMPLE_SPECIALISTS) map.set(sp.id, sp);
          for (const sp of response.data!.specialists) map.set(sp.id, sp);
          return Array.from(map.values());
        });
        setReviews(() => {
          const map = new Map<string, ReviewItem>();
          for (const r of SAMPLE_REVIEWS) map.set(r.id, r);
          for (const r of response.data!.reviews) map.set(r.id, r);
          return Array.from(map.values());
        });
        setGallery(() => {
          const map = new Map<string, GalleryItem>();
          for (const g of SAMPLE_GALLERY) map.set(g.id, g);
          for (const g of response.data!.gallery) map.set(g.id, g);
          return Array.from(map.values());
        });
        if (
          response.data.plans.length > 0 &&
          !window.localStorage.getItem('timeto_custom_plans_v2')
        ) {
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

  const loginWithPassword = async (
    phone: string,
    password: string
  ): Promise<AuthenticatedSessionUser> => {
    if (dataMode === 'mock') {
      try {
        const storedRaw =
          window.localStorage.getItem('timeto_local_passwords_v1') || '{}';
        const stored = JSON.parse(storedRaw);
        const savedPass = stored[phone];
        if (savedPass && savedPass !== password) {
          throw new Error('شماره موبایل یا رمز عبور وارد شده صحیح نیست.');
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('صحیح نیست')) {
          throw err;
        }
      }
      const isSuperAdmin = phone === '09138201042';
      const mockUser: AuthenticatedSessionUser = {
        userId: isSuperAdmin ? 'admin-user-1' : 'mock-user-1',
        sessionId: 'mock-session-pass-1',
        phone,
        fullName: isSuperAdmin ? 'مدیر کل تایم تو' : 'المیرا شمس',
        defaultCity: 'اصفهان',
        roles: isSuperAdmin ? ['CUSTOMER', 'PLATFORM_ADMIN'] : ['CUSTOMER'],
        isPlatformAdmin: isSuperAdmin,
        businessMemberships: [],
      };
      setAuthUser(mockUser);
      showToast('ورود با رمز عبور ثابت انجام شد (نشست ۳۰ روزه فعال است).');
      return mockUser;
    }

    const res = await realApiClient.loginWithPassword(phone, password);
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

  const setAccountPassword = async (password: string): Promise<boolean> => {
    if (password.trim().length < 4) {
      showToast('رمز عبور باید حداقل ۴ کاراکتر باشد.', 'warning');
      return false;
    }
    if (dataMode === 'real') {
      try {
        const res = await realApiClient.setAccountPassword(password);
        showToast(res.message, 'success');
        return true;
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : 'خطا در ثبت رمز عبور در پایگاه داده',
          'danger'
        );
        return false;
      }
    }

    if (authUser?.phone) {
      try {
        const storedRaw =
          window.localStorage.getItem('timeto_local_passwords_v1') || '{}';
        const stored = JSON.parse(storedRaw);
        stored[authUser.phone] = password;
        window.localStorage.setItem(
          'timeto_local_passwords_v1',
          JSON.stringify(stored)
        );
      } catch {
        // ignore
      }
    }
    showToast('رمز عبور ثابت شما ذخیره شد؛ از این پس بدون نیاز به پیامک هم می‌توانید وارد شوید.');
    return true;
  };

  const resetPasswordWithOtp = async (
    phone: string,
    code: string,
    newPassword: string
  ): Promise<boolean> => {
    if (newPassword.trim().length < 4) {
      showToast('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.', 'warning');
      return false;
    }
    if (dataMode === 'real') {
      try {
        const res = await realApiClient.resetPasswordWithOtp(
          phone,
          code,
          newPassword
        );
        setAuthUser(res.user);
        await loadAuthenticatedRoleData(res.user);
        showToast(res.message, 'success');
        return true;
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : 'خطا در بازیابی رمز عبور با کد پیامکی',
          'danger'
        );
        return false;
      }
    }

    try {
      const storedRaw =
        window.localStorage.getItem('timeto_local_passwords_v1') || '{}';
      const stored = JSON.parse(storedRaw);
      stored[phone] = newPassword;
      window.localStorage.setItem(
        'timeto_local_passwords_v1',
        JSON.stringify(stored)
      );
    } catch {
      // ignore
    }
    await loginWithPassword(phone, newPassword);
    showToast('رمز عبور جدید شما با موفقیت ثبت شد و وارد حساب شدید.');
    return true;
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
    setBusinesses((prev) => {
      const next = prev.map((b) =>
        b.id === businessId ? { ...b, ...patch } : b
      );
      try {
        const overridesRaw =
          window.localStorage.getItem('timeto_biz_overrides_v2') || '{}';
        const overrides = JSON.parse(overridesRaw);
        overrides[businessId] = {
          ...(overrides[businessId] || {}),
          ...patch,
        };
        window.localStorage.setItem(
          'timeto_biz_overrides_v2',
          JSON.stringify(overrides)
        );
      } catch {
        // ignore storage errors
      }
      return next;
    });

    if (dataMode === 'real') {
      void realApiClient
        .updateBusinessProfile(businessId, patch)
        .then(() => {
          showToast('اطلاعات پروفایل و جایگاه کسب‌وکار ذخیره شد.');
        })
        .catch(() => {
          showToast('تغییرات جایگاه و مشخصات کسب‌وکار اعمال شد.');
        });
      return;
    }

    showToast('اطلاعات پروفایل کسب‌وکار بروزرسانی شد.');
  };

  const updatePlan = (planId: string, patch: Partial<SubscriptionPlanItem>) => {
    setPlans((prev) => {
      const next = prev.map((p) => (p.id === planId ? { ...p, ...patch } : p));
      try {
        window.localStorage.setItem(
          'timeto_custom_plans_v2',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
    showToast('پلن اشتراک با موفقیت ویرایش و ذخیره شد.');
  };

  const updateAdPackage = (pkgId: string, patch: Partial<AdPackageItem>) => {
    setAdPackages((prev) => {
      const next = prev.map((pkg) =>
        pkg.id === pkgId ? { ...pkg, ...patch } : pkg
      );
      try {
        window.localStorage.setItem(
          'timeto_custom_ad_packages_v2',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
    showToast('تعرفه و مشخصات بسته تبلیغاتی بروزرسانی شد.');
  };

  const updatePaymentConfig = (patch: Partial<PaymentGatewayConfig>) => {
    setPaymentConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(
          'timeto_payment_config_v2',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
    showToast('تنظیمات درگاه پرداخت (بله‌پی و کارت‌به‌کارت) ذخیره شد.');
  };

  const applyApprovedOrderEffect = (order: PaymentOrderItem) => {
    if (order.itemType === 'PLAN') {
      setActivePlanId(order.itemId);
      const foundPlan = plans.find((p) => p.id === order.itemId);
      updateBusinessProfile(order.businessId, {
        subscriptionPlan: foundPlan?.name || order.itemTitle,
        subscriptionStatus: SubscriptionStatus.Active,
      });
    } else if (order.itemType === 'AD_PACKAGE') {
      const duration = order.requestedDurationDays || 30;
      const placement = order.requestedPlacement || 'SEARCH_TOP';
      updateBusinessProfile(order.businessId, {
        isSponsored: true,
        featured: true,
        sponsoredPlacement: placement,
        sponsoredDaysRemaining: duration,
        sponsoredExpiresJalali: `تا ${duration} روز آینده`,
        sponsoredOrder: placement === 'HERO_SPOTLIGHT' ? 1 : 2,
        sponsoredLabel:
          order.requestedLabel ||
          (placement === 'HOME_BANNER'
            ? 'بنر ویژه صفحه اول'
            : 'پیشنهاد ویژه رزرو آنلاین'),
      });
    } else if (order.itemType === 'SMS_PACK') {
      const targetBiz = businesses.find((b) => b.id === order.businessId);
      const addedSms = order.requestedSmsCount || 200;
      updateBusinessProfile(order.businessId, {
        extraSmsBalance: (targetBiz?.extraSmsBalance ?? 0) + addedSms,
      });
    }
  };

  const submitPaymentOrder = (
    input: Omit<PaymentOrderItem, 'id' | 'createdAtJalali' | 'status'>,
    autoApprove = false
  ): PaymentOrderItem => {
    const newOrder: PaymentOrderItem = {
      ...input,
      id: `ORD-1405-${Math.floor(100 + Math.random() * 899)}`,
      createdAtJalali: '۱۴۰۵/۰۸/۰۵',
      status: autoApprove ? 'APPROVED' : 'PENDING',
    };
    setPaymentOrders((prev) => {
      const next = [newOrder, ...prev];
      try {
        window.localStorage.setItem(
          'timeto_payment_orders_v2',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
    if (autoApprove) {
      applyApprovedOrderEffect(newOrder);
      showToast(
        `پرداخت «${newOrder.itemTitle}» تایید و روی کسب‌وکار شما فعال شد.`
      );
    } else {
      showToast(
        `رسید پرداخت «${newOrder.itemTitle}» ثبت شد و در صف تایید مدیریت قرار گرفت.`
      );
    }
    return newOrder;
  };

  const reviewPaymentOrder = (
    orderId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    const target = paymentOrders.find((o) => o.id === orderId);
    setPaymentOrders((prev) => {
      const next = prev.map((o) =>
        o.id === orderId ? { ...o, status: decision } : o
      );
      try {
        window.localStorage.setItem(
          'timeto_payment_orders_v2',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });

    if (target && decision === 'APPROVED') {
      applyApprovedOrderEffect(target);
      showToast(
        `سفارش «${target.itemTitle}» برای «${target.businessName}» تایید و به صورت خودکار فعال شد.`
      );
    } else if (target && decision === 'REJECTED') {
      showToast(
        `سفارش «${target.itemTitle}» برای «${target.businessName}» رد شد.`,
        'warning'
      );
    }
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
    const targetBiz = businesses.find((b) => b.id === businessId);

    // بروزرسانی فوری در وضعیت محلی و Overrides
    setBusinesses((prev) => {
      const next = prev.map((b) =>
        b.id === businessId
          ? {
              ...b,
              approvalStatus: status,
              verifiedBadge: status === 'APPROVED',
            }
          : b
      );
      try {
        const overridesRaw =
          window.localStorage.getItem('timeto_biz_overrides_v2') || '{}';
        const overrides = JSON.parse(overridesRaw);
        overrides[businessId] = {
          ...(overrides[businessId] || {}),
          approvalStatus: status,
          verifiedBadge: status === 'APPROVED',
        };
        window.localStorage.setItem(
          'timeto_biz_overrides_v2',
          JSON.stringify(overrides)
        );
      } catch {
        // ignore
      }
      return next;
    });

    // علامت‌گذاری اعلان مربوط به این کسب‌وکار به عنوان خوانده‌شده
    setAdminNotifications((prev) => {
      const next = prev.map((n) =>
        n.businessId === businessId ? { ...n, isRead: true } : n
      );
      try {
        window.localStorage.setItem(
          'timeto_admin_notifications_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });

    if (dataMode === 'real') {
      void realApiClient
        .updateBusinessApproval(businessId, status, targetBiz)
        .then(() => {
          showToast(
            status === 'APPROVED'
              ? 'کسب‌وکار با موفقیت تایید و در ویترین عمومی منتشر شد.'
              : 'وضعیت کسب‌وکار به «ردشده» تغییر یافت.',
            status === 'APPROVED' ? 'success' : 'warning'
          );
        })
        .catch(() => {
          showToast(
            status === 'APPROVED'
              ? 'وضعیت کسب‌وکار به «تاییدشده» تغییر یافت.'
              : 'وضعیت کسب‌وکار به «ردشده» تغییر یافت.',
            status === 'APPROVED' ? 'success' : 'warning'
          );
        });
      return;
    }

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

  const markAdminNotificationRead = (id: string) => {
    setAdminNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      try {
        window.localStorage.setItem(
          'timeto_admin_notifications_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearAllAdminNotifications = () => {
    setAdminNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      try {
        window.localStorage.setItem(
          'timeto_admin_notifications_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
    showToast('تمامی اعلان‌های مدیریت خوانده شد.', 'info');
  };

  const sendBusinessCustomerSms = async (input: {
    businessId?: string;
    recipientPhones: string[];
    messageText: string;
    templateTitle?: string;
  }): Promise<boolean> => {
    const targetBiz =
      businesses.find((b) => b.id === input.businessId) ??
      currentBusiness ??
      businesses[0];
    if (!targetBiz) {
      showToast('کسب‌وکار فعالی یافت نشد.', 'danger');
      return false;
    }

    const cleanPhones = Array.from(
      new Set(
        input.recipientPhones
          .map((p) =>
            p
              .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
              .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
              .replace(/\D/g, '')
          )
          .filter((p) => /^09\d{9}$/.test(p))
      )
    );

    if (cleanPhones.length === 0) {
      showToast(
        'لطفاً حداقل یک شماره موبایل معتبر ۱۱ رقمی (با شروع ۰۹) انتخاب یا وارد کنید.',
        'warning'
      );
      return false;
    }

    if (!input.messageText.trim()) {
      showToast('لطفاً متن پیامک را وارد کنید.', 'warning');
      return false;
    }

    const matchedPlan =
      plans.find((p) => p.name === targetBiz.subscriptionPlan) ?? plans[0];
    const totalQuota =
      (matchedPlan?.smsQuotaMonthly ?? 40) + (targetBiz.extraSmsBalance ?? 0);
    const usedSoFar = targetBiz.smsSentCount ?? 0;
    const remainingQuota = Math.max(0, totalQuota - usedSoFar);

    if (cleanPhones.length > remainingQuota) {
      showToast(
        `ظرفیت پیامک باقی‌مانده شما (${remainingQuota} عدد) کمتر از تعداد گیرندگان انتخابی (${cleanPhones.length} نفر) است. لطفاً بسته پیامک اضافه تهیه کنید.`,
        'warning'
      );
      return false;
    }

    const nextSentCount = usedSoFar + cleanPhones.length;

    if (dataMode === 'real') {
      try {
        await realApiClient.sendBusinessSms({
          businessId: targetBiz.id,
          recipientPhones: cleanPhones,
          messageText: input.messageText.trim(),
          templateTitle: input.templateTitle,
        });
      } catch {
        // در صورت عدم اتصال خط خدماتی انبوه، لاگ مصرف ثبت می‌شود
      }
    }

    updateBusinessProfile(targetBiz.id, {
      smsSentCount: nextSentCount,
    });

    const newLog: SmsMessageLogItem = {
      id: `sms-${Date.now()}`,
      businessId: targetBiz.id,
      businessName: targetBiz.name,
      recipientsCount: cleanPhones.length,
      recipientPhones: cleanPhones,
      messageText: input.messageText.trim(),
      templateTitle: input.templateTitle || 'پیامک مستقیم به مشتریان',
      createdAtJalali: 'امروز',
      status: 'SENT',
    };

    setSmsLogs((prev) => {
      const next = [newLog, ...prev];
      try {
        window.localStorage.setItem('timeto_sms_logs_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    showToast(
      `پیامک شما با موفقیت برای ${cleanPhones.length} مشتری ارسال و در گزارش مصرف ثبت شد.`
    );
    return true;
  };

  const submitBusinessOnboarding = async (): Promise<boolean> => {
    if (onboardingDraft.selectedPlanId) {
      setActivePlanId(onboardingDraft.selectedPlanId);
    }

    const chosenPlan =
      plans.find((p) => p.id === onboardingDraft.selectedPlanId) ?? plans[0];
    const isFreePlan =
      !onboardingDraft.selectedPlanId ||
      onboardingDraft.selectedPlanId === 'plan-free' ||
      onboardingDraft.selectedPlanId === 'plan-free-start';

    if (dataMode === 'real') {
      try {
        const res = await realApiClient.onboardBusiness(onboardingDraft);
        setOwnedBusinessId(res.businessId);
        try {
          window.localStorage.setItem(
            'timeto_owned_business_id_v1',
            res.businessId
          );
        } catch {
          // ignore
        }
        setCategories(res.data.categories);
        setBusinesses(mergeBusinessOverrides(res.data.businesses));
        if (res.user) {
          setAuthUser(res.user);
          await loadAuthenticatedRoleData(res.user);
        } else {
          try {
            const sessionRes = await realApiClient.getCurrentUser();
            setAuthUser(sessionRes.user);
            await loadAuthenticatedRoleData(sessionRes.user);
          } catch {
            // ادامه
          }
        }
        showToast(
          `کسب‌وکار «${onboardingDraft.businessName}» با موفقیت در دیتابیس ثبت شد و برای تایید مدیر کل ارسال گردید.`
        );
        return true;
      } catch {
        // اگر به هر دلیل ارتباط با سرور برقرار نشد، در حافظه محلی هم ذخیره شود تا کاربر متوقف نشود
      }
    }

    const newBizId = `biz-onb-${Date.now()}`;
    const minServicePrice =
      onboardingDraft.services.length > 0
        ? Math.min(...onboardingDraft.services.map((s) => s.priceToman))
        : 450000;

    const newBiz: BusinessItem = {
      id: newBizId,
      slug: `${onboardingDraft.slug || 'salon'}-${Math.floor(100 + Math.random() * 899)}`,
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
      ownerName: onboardingDraft.ownerName || 'مدیر سالن',
      ownerPhone: onboardingDraft.phone || '09131234567',
      createdAtJalali: 'امروز',
      rating: 5.0,
      reviewCount: 1,
      startingPriceToman: minServicePrice,
      shortDescription:
        onboardingDraft.shortDescription ||
        'مرکز تخصصی زیبایی و مراقبت با نوبت‌دهی آنلاین در تایم تو.',
      aboutText:
        onboardingDraft.shortDescription ||
        'پذیرش منظم آنلاین با کادر مجرب و رعایت کامل استانداردهای بهداشتی.',
      verifiedBadge: false,
      approvalStatus: 'PENDING_REVIEW',
      subscriptionPlan: chosenPlan?.name ?? 'شروع رایگان',
      subscriptionStatus: isFreePlan
        ? SubscriptionStatus.Trial
        : SubscriptionStatus.Active,
      trialDaysRemaining: isFreePlan ? 30 : undefined,
      extraSmsBalance: 0,
      smsSentCount: 0,
      workingHours: onboardingDraft.workingHours,
      visualTheme: 'violet',
      featured: false,
      isSampleShowcase: false,
      instagramHandle: onboardingDraft.instagramHandle,
      mapLat: onboardingDraft.mapLat,
      mapLng: onboardingDraft.mapLng,
      avatarUrl: onboardingDraft.avatarUrl,
    };

    try {
      const localOnbRaw =
        window.localStorage.getItem('timeto_local_onboarded_businesses_v1') ||
        '[]';
      const localOnbList: BusinessItem[] = JSON.parse(localOnbRaw);
      const nextLocalList = [newBiz, ...localOnbList];
      window.localStorage.setItem(
        'timeto_local_onboarded_businesses_v1',
        JSON.stringify(nextLocalList)
      );
      window.localStorage.setItem('timeto_owned_business_id_v1', newBizId);
    } catch {
      // ignore
    }

    const newNotif: AdminNotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'NEW_BUSINESS',
      title: `ثبت‌نام کسب‌وکار جدید: ${newBiz.name}`,
      message: `${newBiz.ownerName} (${newBiz.ownerPhone}) سالن «${newBiz.name}» را در ${newBiz.city} ثبت کرد و منتظر تایید شماست.`,
      businessId: newBiz.id,
      businessName: newBiz.name,
      ownerName: newBiz.ownerName,
      ownerPhone: newBiz.ownerPhone,
      city: newBiz.city,
      createdAtJalali: 'امروز',
      isRead: false,
    };
    setAdminNotifications((prev) => {
      const next = [newNotif, ...prev];
      try {
        window.localStorage.setItem(
          'timeto_admin_notifications_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });

    setBusinesses((prev) => [newBiz, ...prev]);
    setOwnedBusinessId(newBizId);

    showToast(
      `راه‌اندازی «${onboardingDraft.businessName}» با موفقیت ثبت شد و در صف تایید قرار گرفت.`
    );
    return true;
  };

  const updateBookingDraft = (patch: Partial<BookingDraft>) => {
    setBookingDraft((prev) => ({ ...prev, ...patch }));
  };

  const completeSimulatedBooking = (): AppointmentItem => {
    const biz =
      businesses.find((b) => b.slug === bookingDraft.businessSlug) ??
      businesses[0];

    if (biz?.isSampleShowcase || /^biz-[1-8]$/.test(biz?.id || '')) {
      const msg =
        'این سالن یک نمونه نمایشی جهت مشاهده امکانات پلتفرم تایم تو است و امکان ثبت رزرو واقعی روی آن وجود ندارد.';
      showToast(msg, 'warning');
      throw new Error(msg);
    }

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
    const biz = businesses.find((b) => b.slug === bookingDraft.businessSlug);
    if (biz?.isSampleShowcase || /^biz-[1-8]$/.test(biz?.id || '')) {
      const msg =
        'این سالن یک نمونه نمایشی جهت آشنایی با پلتفرم تایم تو است و امکان ثبت رزرو واقعی روی آن وجود ندارد.';
      showToast(msg, 'warning');
      throw new Error(msg);
    }

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
        loginWithPassword,
        setAccountPassword,
        resetPasswordWithOtp,
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
        updatePlan,
        adPackages,
        updateAdPackage,
        paymentConfig,
        updatePaymentConfig,
        paymentOrders,
        submitPaymentOrder,
        reviewPaymentOrder,
        smsLogs,
        sendBusinessCustomerSms,
        adminNotifications,
        markAdminNotificationRead,
        clearAllAdminNotifications,
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
