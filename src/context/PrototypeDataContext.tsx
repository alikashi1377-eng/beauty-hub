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
  AdminNotificationSettings,
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
  SupportTicketItem,
  WorkingHourItem,
} from '../types';
import { getBeautyPhotoUrl } from '../components/ui/VisualMediaIllustration';
import { computeSelectedServicesSummary } from '../utils/formatters';
import {
  AccountRoleChoice,
  AuthFlowScreen,
  getSavedMemoryAccounts,
  PERSISTED_SESSION_USER_KEY,
  saveMemoryAccount,
} from '../components/auth/timetoAuthFlow';
import { saveVisitorRole } from '../components/home/timetoHomeData';

export interface AuthModalOpenOptions {
  initialScreen?: AuthFlowScreen;
  defaultRole?: AccountRoleChoice;
  redirectTo?: string;
  promptReason?: string;
}

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
  isAuthModalOpen: boolean;
  authModalOptions: AuthModalOpenOptions;
  openAuthModal: (options?: AuthModalOpenOptions) => void;
  closeAuthModal: () => void;
  completeUnifiedAuthSession: (payload: {
    phone: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    role: AccountRoleChoice;
    avatarUrl?: string;
    salonInfo?: {
      businessName: string;
      businessType: BusinessType;
      city: string;
      neighborhood: string;
    };
  }) => Promise<AuthenticatedSessionUser>;
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
  deleteCategory: (id: string) => void;
  reorderCategory: (id: string, direction: 'UP' | 'DOWN') => void;
  gallery: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  removeGalleryItem: (id: string) => void;
  campaigns: MarketingCampaignItem[];
  addCampaign: (item: Omit<MarketingCampaignItem, 'id'>) => void;
  customers: CustomerRecord[];
  addCustomer: (input: {
    fullName: string;
    phone: string;
    city?: string;
    favoriteService?: string;
    totalVisits?: number;
    totalSpentToman?: number;
    lastVisitJalali?: string;
    notes?: string;
    businessId?: string;
  }) => CustomerRecord | null;
  addCustomersBulk: (
    items: Array<{
      fullName: string;
      phone: string;
      favoriteService?: string;
      notes?: string;
      totalVisits?: number;
      totalSpentToman?: number;
    }>,
    businessId?: string
  ) => { addedCount: number; updatedCount: number };
  updateCustomer: (id: string, patch: Partial<CustomerRecord>) => void;
  deleteCustomer: (id: string) => void;
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
  adminNotificationSettings: AdminNotificationSettings;
  updateAdminNotificationSettings: (
    patch: Partial<AdminNotificationSettings>
  ) => void;
  supportTickets: SupportTicketItem[];
  submitSupportTicket: (input: {
    senderName?: string;
    senderPhone?: string;
    categoryLabel: string;
    subject: string;
    message: string;
    senderRole?: 'CUSTOMER' | 'BUSINESS_OWNER';
    businessId?: string;
    businessName?: string;
  }) => SupportTicketItem;
  replySupportTicket: (
    ticketId: string,
    replyText: string,
    status?: 'ANSWERED' | 'CLOSED'
  ) => void;
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
  const [authUser, setAuthUserState] =
    useState<AuthenticatedSessionUser | null>(() => {
      try {
        const saved = window.localStorage.getItem(PERSISTED_SESSION_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.phone && Array.isArray(parsed.roles)) {
            return parsed as AuthenticatedSessionUser;
          }
        }
      } catch {
        // ignore
      }
      return null;
    });

  const setAuthUser = (next: AuthenticatedSessionUser | null) => {
    setAuthUserState(next);
    try {
      if (next) {
        window.localStorage.setItem(
          PERSISTED_SESSION_USER_KEY,
          JSON.stringify(next)
        );
      } else {
        window.localStorage.removeItem(PERSISTED_SESSION_USER_KEY);
      }
    } catch {
      // ignore
    }
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalOptions, setAuthModalOptions] =
    useState<AuthModalOpenOptions>({
      initialScreen: 'LOGIN',
      defaultRole: 'CUSTOMER',
    });

  const openAuthModal = (options?: AuthModalOpenOptions) => {
    setAuthModalOptions({
      initialScreen: options?.initialScreen ?? 'LOGIN',
      defaultRole: options?.defaultRole ?? 'CUSTOMER',
      redirectTo: options?.redirectTo,
      promptReason: options?.promptReason,
    });
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

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
  const mergeCategoriesWithDefaults = (
    incoming: CategoryItem[]
  ): CategoryItem[] => {
    try {
      const savedRaw = window.localStorage.getItem('timeto_custom_categories_v2');
      if (savedRaw) {
        const savedList: CategoryItem[] = JSON.parse(savedRaw);
        if (Array.isArray(savedList) && savedList.length > 0) {
          const bySlug = new Set(savedList.map((c) => c.slug));
          const extras = incoming.filter((c) => !bySlug.has(c.slug));
          return [...savedList, ...extras];
        }
      }
    } catch {
      // ignore
    }

    const result: CategoryItem[] = [...SAMPLE_CATEGORIES];
    for (const dbCat of incoming) {
      const idx = result.findIndex(
        (c) => c.slug === dbCat.slug || c.title === dbCat.title
      );
      if (idx >= 0) {
        result[idx] = {
          ...result[idx],
          ...dbCat,
          iconName: dbCat.iconName || result[idx].iconName || 'Sparkles',
        };
      } else {
        result.push(dbCat);
      }
    }
    return result;
  };

  const [categories, setCategories] = useState<CategoryItem[]>(() =>
    mergeCategoriesWithDefaults(SAMPLE_CATEGORIES)
  );
  const [gallery, setGallery] = useState<GalleryItem[]>(SAMPLE_GALLERY);
  const [campaigns, setCampaigns] =
    useState<MarketingCampaignItem[]>(SAMPLE_CAMPAIGNS);

  const mergeManualCustomers = (baseList: CustomerRecord[]): CustomerRecord[] => {
    try {
      const savedRaw = window.localStorage.getItem('timeto_manual_customers_v1');
      const deletedRaw = window.localStorage.getItem(
        'timeto_deleted_customer_ids_v1'
      );
      const savedList: CustomerRecord[] = savedRaw ? JSON.parse(savedRaw) : [];
      const deletedIds = new Set<string>(
        deletedRaw ? JSON.parse(deletedRaw) : []
      );
      const map = new Map<string, CustomerRecord>();
      for (const item of baseList) {
        if (!deletedIds.has(item.id)) {
          map.set(item.id, item);
        }
      }
      for (const item of savedList) {
        if (item && item.id && !deletedIds.has(item.id)) {
          map.set(item.id, item);
        }
      }
      return Array.from(map.values());
    } catch {
      return baseList;
    }
  };

  const [customers, setCustomers] = useState<CustomerRecord[]>(() =>
    mergeManualCustomers(SAMPLE_CUSTOMERS)
  );
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
  const [adminNotificationSettings, setAdminNotificationSettings] =
    useState<AdminNotificationSettings>(() => {
      const defaults: AdminNotificationSettings = {
        adminPhone: '09138201042',
        adminUsername: 'admin',
        adminDisplayName: 'مدیر کل تایم تو',
        smsOnNewBusiness: true,
        smsOnNewPaymentOrder: true,
        smsOnNewBooking: true,
        inAppNotificationsEnabled: true,
      };
      try {
        const saved = window.localStorage.getItem(
          'timeto_admin_notify_settings_v1'
        );
        if (saved) {
          return { ...defaults, ...JSON.parse(saved) };
        }
      } catch {
        // ignore
      }
      return defaults;
    });
  const [supportTickets, setSupportTickets] = useState<SupportTicketItem[]>(
    () => {
      try {
        const saved = window.localStorage.getItem('timeto_support_tickets_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
      return [];
    }
  );
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
  }, [ownedBusinessId, authUser, businesses]);

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
        setCustomers(mergeManualCustomers(wsRes.data.customers));
        setCampaigns(wsRes.data.campaigns);
      } catch {
        // در صورت عدم دسترسی یا نبود کسب‌وکار، مشتریان ثبت‌شده دستی حفظ می‌شوند
        setCustomers((prev) => mergeManualCustomers(prev));
      }
    }

    if (currentUser.roles.includes('PLATFORM_ADMIN')) {
      try {
        const adminRes = await realApiClient.fetchAdminOverview();
        setBusinesses(mergeBusinessOverrides(adminRes.data.businesses));
        setCategories(mergeCategoriesWithDefaults(adminRes.data.categories));
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

  const getPersistedSessionUser = (): AuthenticatedSessionUser | null => {
    try {
      const saved = window.localStorage.getItem(PERSISTED_SESSION_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.phone && Array.isArray(parsed.roles)) {
          return parsed as AuthenticatedSessionUser;
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const refreshRealData = async () => {
    setIsLoadingInitialData(true);
    const localPersistedUser = getPersistedSessionUser();
    const localOwnedBizId = (() => {
      try {
        return window.localStorage.getItem('timeto_owned_business_id_v1');
      } catch {
        return null;
      }
    })();

    try {
      const response = await realApiClient.fetchBootstrap();
      if (response.mode === 'real' && response.data) {
        setDataMode('real');
        setDatabaseError(null);
        setCategories(mergeCategoriesWithDefaults(response.data.categories));
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

        setAppointments([]);
        setCustomers(mergeManualCustomers([]));
        setCampaigns([]);
        setAdminUsers([]);
        setOwnedBusinessId(localOwnedBizId);

        const firstRealBiz = response.data.businesses[0];
        const firstRealSrv = response.data.services[0];
        const firstRealSpc = response.data.specialists[0];
        setBookingDraft((prev) => ({
          ...prev,
          businessSlug: firstRealBiz?.slug ?? prev.businessSlug,
          serviceId: firstRealSrv?.id ?? prev.serviceId,
          serviceIds: firstRealSrv?.id ? [firstRealSrv.id] : prev.serviceIds,
          specialistId: firstRealSpc?.id ?? prev.specialistId,
          customerName: localPersistedUser?.fullName ?? '',
          customerPhone: localPersistedUser?.phone ?? '',
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
          if (localPersistedUser) {
            setAuthUser(localPersistedUser);
          } else {
            setAuthUser(null);
          }
        }
      } else if (response.mode === 'mock') {
        setDataMode('mock');
        setDatabaseError(null);
        if (localPersistedUser) {
          setAuthUser(localPersistedUser);
          setBookingDraft((prev) => ({
            ...prev,
            customerName: localPersistedUser.fullName || prev.customerName,
            customerPhone: localPersistedUser.phone || prev.customerPhone,
          }));
        }
      } else {
        setDataMode('real');
        setDatabaseError('پاسخ سرور نامعتبر است؛ به داده‌های آزمایشی بازگشت داده نمی‌شود.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError || err instanceof Error
          ? err.message
          : 'ارتباط با سرور یا پایگاه داده PostgreSQL برقرار نشد؛ به داده‌های آزمایشی (Mock) بازگشت داده نمی‌شود.';
      setDataMode('real');
      setDatabaseError(errorMessage);
      showToast(errorMessage, 'danger');
    } finally {
      setIsLoadingInitialData(false);
    }
  };

  useEffect(() => {
    void refreshRealData();
  }, []);

  const buildSessionUserFromMemory = (
    phone: string,
    overrideName?: string,
    overrideRole?: AccountRoleChoice
  ): AuthenticatedSessionUser => {
    const accounts = getSavedMemoryAccounts();
    const memoryAcc = accounts[phone];
    const isSuperAdmin =
      phone === '09138201042' || phone === adminNotificationSettings.adminPhone;
    const role: AccountRoleChoice =
      overrideRole ?? memoryAcc?.role ?? 'CUSTOMER';
    const fullName =
      overrideName ||
      memoryAcc?.fullName ||
      (isSuperAdmin
        ? adminNotificationSettings.adminDisplayName || 'مدیر کل تایم تو'
        : 'کاربر تایم تو');

    const roles: Array<'CUSTOMER' | 'BUSINESS_OWNER' | 'PLATFORM_ADMIN'> =
      isSuperAdmin
        ? ['CUSTOMER', 'PLATFORM_ADMIN']
        : role === 'BUSINESS_OWNER'
          ? ['CUSTOMER', 'BUSINESS_OWNER']
          : ['CUSTOMER'];

    return {
      userId: isSuperAdmin ? 'admin-user-1' : `usr-${phone}`,
      sessionId: `sess-${Date.now()}`,
      phone,
      fullName,
      defaultCity: memoryAcc?.city || 'اصفهان',
      roles,
      isPlatformAdmin: isSuperAdmin,
      businessMemberships: memoryAcc?.businessId
        ? [
            {
              businessUuid: memoryAcc.businessId,
              businessId: memoryAcc.businessId,
              businessSlug: memoryAcc.businessId,
              memberRole: 'OWNER',
            },
          ]
        : [],
    };
  };

  const requestOtpLogin = async (
    phone: string
  ): Promise<{ challengeId?: string }> => {
    if (dataMode === 'real') {
      try {
        const res = await realApiClient.requestOtp(phone);
        showToast(res.message, 'info');
        return { challengeId: res.challengeId };
      } catch {
        // ادامه با صدور کد تایید در حافظه
      }
    }
    showToast('کد تأیید ۶ رقمی ارسال شد.', 'info');
    return { challengeId: 'mock-challenge' };
  };

  const verifyOtpLogin = async (
    phone: string,
    code: string
  ): Promise<AuthenticatedSessionUser> => {
    if (dataMode === 'real') {
      try {
        const res = await realApiClient.verifyOtp(phone, code);
        const accounts = getSavedMemoryAccounts();
        const mem = accounts[phone];
        const mergedUser: AuthenticatedSessionUser = mem
          ? {
              ...res.user,
              fullName: mem.fullName || res.user.fullName,
              roles:
                mem.role === 'BUSINESS_OWNER' &&
                !res.user.roles.includes('BUSINESS_OWNER')
                  ? [...res.user.roles, 'BUSINESS_OWNER']
                  : res.user.roles,
            }
          : res.user;
        setAuthUser(mergedUser);
        if (mem?.businessId) {
          setOwnedBusinessId(mem.businessId);
          window.localStorage.setItem(
            'timeto_owned_business_id_v1',
            mem.businessId
          );
        }
        saveVisitorRole(
          mergedUser.roles.includes('BUSINESS_OWNER')
            ? 'BUSINESS_OWNER'
            : 'CUSTOMER'
        );
        setBookingDraft((prev) => ({
          ...prev,
          customerName: mergedUser.fullName || prev.customerName,
          customerPhone: mergedUser.phone || prev.customerPhone,
        }));
        await loadAuthenticatedRoleData(mergedUser);
        showToast(res.message, 'success');
        return mergedUser;
      } catch {
        // اگر کد آزمایشی ۶ رقمی در مودال زده شد، نشست کاربر را بسازیم
      }
    }

    const sessionUser = buildSessionUserFromMemory(phone);
    const accounts = getSavedMemoryAccounts();
    const mem = accounts[phone];
    if (mem?.businessId) {
      setOwnedBusinessId(mem.businessId);
      try {
        window.localStorage.setItem(
          'timeto_owned_business_id_v1',
          mem.businessId
        );
      } catch {
        // ignore
      }
    }
    saveVisitorRole(
      sessionUser.roles.includes('BUSINESS_OWNER')
        ? 'BUSINESS_OWNER'
        : 'CUSTOMER'
    );
    setAuthUser(sessionUser);
    setBookingDraft((prev) => ({
      ...prev,
      customerName: sessionUser.fullName || prev.customerName,
      customerPhone: sessionUser.phone || prev.customerPhone,
    }));
    showToast('ورود با کد یک‌بارمصرف انجام شد.');
    return sessionUser;
  };

  const loginWithPassword = async (
    phoneOrUsername: string,
    password: string
  ): Promise<AuthenticatedSessionUser> => {
    const trimmedInput = phoneOrUsername.trim();
    const configuredUsername = (
      adminNotificationSettings.adminUsername || 'admin'
    )
      .trim()
      .toLowerCase();
    const resolvedPhone =
      trimmedInput.toLowerCase() === configuredUsername ||
      trimmedInput.toLowerCase() === 'admin'
        ? adminNotificationSettings.adminPhone || '09138201042'
        : trimmedInput;

    const accounts = getSavedMemoryAccounts();
    const memAccount = accounts[resolvedPhone];

    try {
      const storedRaw =
        window.localStorage.getItem('timeto_local_passwords_v1') || '{}';
      const stored = JSON.parse(storedRaw);
      const savedPass =
        memAccount?.password || stored[resolvedPhone] || stored[trimmedInput];
      if (savedPass && savedPass !== password) {
        throw new Error(
          'شماره موبایل / نام کاربری یا رمز عبور وارد شده صحیح نیست.'
        );
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('صحیح نیست')) {
        throw err;
      }
    }

    if (dataMode === 'real' && !memAccount) {
      try {
        const res = await realApiClient.loginWithPassword(
          resolvedPhone,
          password
        );
        setAuthUser(res.user);
        saveVisitorRole(
          res.user.roles.includes('BUSINESS_OWNER')
            ? 'BUSINESS_OWNER'
            : 'CUSTOMER'
        );
        setBookingDraft((prev) => ({
          ...prev,
          customerName: res.user.fullName || prev.customerName,
          customerPhone: res.user.phone || prev.customerPhone,
        }));
        await loadAuthenticatedRoleData(res.user);
        showToast(res.message, 'success');
        return res.user;
      } catch {
        // ادامه با نشست محلی در صورت ثبت‌نام در مرورگر
      }
    }

    const sessionUser = buildSessionUserFromMemory(resolvedPhone);
    if (memAccount?.businessId) {
      setOwnedBusinessId(memAccount.businessId);
      try {
        window.localStorage.setItem(
          'timeto_owned_business_id_v1',
          memAccount.businessId
        );
      } catch {
        // ignore
      }
    }
    saveVisitorRole(
      sessionUser.roles.includes('BUSINESS_OWNER')
        ? 'BUSINESS_OWNER'
        : 'CUSTOMER'
    );
    setAuthUser(sessionUser);
    setBookingDraft((prev) => ({
      ...prev,
      customerName: sessionUser.fullName || prev.customerName,
      customerPhone: sessionUser.phone || prev.customerPhone,
    }));
    showToast('ورود با رمز عبور با موفقیت انجام شد.');
    return sessionUser;
  };

  const completeUnifiedAuthSession = async (payload: {
    phone: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    role: AccountRoleChoice;
    avatarUrl?: string;
    salonInfo?: {
      businessName: string;
      businessType: BusinessType;
      city: string;
      neighborhood: string;
    };
  }): Promise<AuthenticatedSessionUser> => {
    let createdBusinessId: string | undefined;

    if (payload.role === 'BUSINESS_OWNER') {
      const existingAccounts = getSavedMemoryAccounts();
      const prevAccount = existingAccounts[payload.phone];
      if (prevAccount?.businessId) {
        createdBusinessId = prevAccount.businessId;
      } else {
        const newBizId = `biz-onb-${Date.now()}`;
        createdBusinessId = newBizId;
        const salonName =
          payload.salonInfo?.businessName?.trim() ||
          `سالن زیبایی ${payload.fullName}`;
        const salonType =
          payload.salonInfo?.businessType ?? BusinessType.WomenSalon;
        const salonCity = payload.salonInfo?.city?.trim() || 'اصفهان';
        const salonNeighborhood =
          payload.salonInfo?.neighborhood?.trim() || 'چهارباغ بالا';

        const newBiz: BusinessItem = {
          id: newBizId,
          slug: `salon-${Math.floor(1000 + Math.random() * 8999)}`,
          name: salonName,
          type: salonType,
          typeLabel:
            salonType === BusinessType.MenBarbershop
              ? 'آرایشگاه مردانه'
              : salonType === BusinessType.IndependentSpecialist
                ? 'متخصص مستقل زیبایی'
                : 'سالن زیبایی زنانه',
          categorySlug: 'hair-color',
          city: salonCity,
          neighborhood: salonNeighborhood,
          address: `${salonCity}، ${salonNeighborhood}`,
          phoneDisplay: payload.phone,
          ownerName: payload.fullName,
          ownerPhone: payload.phone,
          createdAtJalali: 'امروز',
          rating: 5.0,
          reviewCount: 1,
          startingPriceToman: 450000,
          shortDescription: `مرکز تخصصی زیبایی ${salonName} در ${salonCity}`,
          aboutText: '',
          verifiedBadge: false,
          approvalStatus: 'PENDING_REVIEW',
          subscriptionPlan: 'شروع رایگان',
          subscriptionStatus: SubscriptionStatus.Trial,
          trialDaysRemaining: 30,
          extraSmsBalance: 0,
          smsSentCount: 0,
          workingHours: INITIAL_ONBOARDING_DRAFT.workingHours,
          workingHoursConfigured: false,
          visualTheme: 'violet',
          featured: false,
          isSampleShowcase: false,
          avatarUrl: payload.avatarUrl,
        };

        try {
          const localOnbRaw =
            window.localStorage.getItem(
              'timeto_local_onboarded_businesses_v1'
            ) || '[]';
          const localOnbList: BusinessItem[] = JSON.parse(localOnbRaw);
          window.localStorage.setItem(
            'timeto_local_onboarded_businesses_v1',
            JSON.stringify([newBiz, ...localOnbList])
          );
          window.localStorage.setItem('timeto_owned_business_id_v1', newBizId);
        } catch {
          // ignore
        }

        const newNotif: AdminNotificationItem = {
          id: `notif-${Date.now()}`,
          type: 'NEW_BUSINESS',
          title: `ثبت‌نام سالن جدید: ${newBiz.name}`,
          message: `${payload.fullName} (${payload.phone}) سالن «${newBiz.name}» را ثبت کرد و منتظر تایید شماست.`,
          businessId: newBiz.id,
          businessName: newBiz.name,
          ownerName: payload.fullName,
          ownerPhone: payload.phone,
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
      }
    }

    saveMemoryAccount({
      phone: payload.phone,
      password: payload.password || 'Timeto@1234',
      firstName: payload.firstName || payload.fullName.split(' ')[0] || '',
      lastName:
        payload.lastName ||
        payload.fullName.split(' ').slice(1).join(' ') ||
        '',
      fullName: payload.fullName,
      role: payload.role,
      avatarUrl: payload.avatarUrl,
      businessId: createdBusinessId,
      businessName: payload.salonInfo?.businessName,
      businessType: payload.salonInfo?.businessType,
      city: payload.salonInfo?.city || 'اصفهان',
      neighborhood: payload.salonInfo?.neighborhood,
      updatedAt: Date.now(),
    });

    saveVisitorRole(payload.role);
    const sessionUser = buildSessionUserFromMemory(
      payload.phone,
      payload.fullName,
      payload.role
    );
    setAuthUser(sessionUser);
    setBookingDraft((prev) => ({
      ...prev,
      customerName: payload.fullName || prev.customerName,
      customerPhone: payload.phone || prev.customerPhone,
    }));

    return sessionUser;
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
      } catch {
        // ادامه با ذخیره در حافظه مرورگر
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
    showToast('رمز عبور ثابت شما در حافظه ذخیره شد.');
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
      } catch {
        // ادامه با ذخیره در حافظه
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
      const accounts = getSavedMemoryAccounts();
      if (accounts[phone]) {
        saveMemoryAccount({
          ...accounts[phone],
          password: newPassword,
          updatedAt: Date.now(),
        });
      }
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
    }
    setAuthUser(null);
    setOwnedBusinessId(null);
    try {
      window.localStorage.removeItem(PERSISTED_SESSION_USER_KEY);
      window.localStorage.removeItem('timeto_owned_business_id_v1');
    } catch {
      // ignore
    }
    showToast('از حساب کاربری خارج شدید.', 'info');
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
    const orderNotif: AdminNotificationItem = {
      id: `notif-ord-${Date.now()}`,
      type: 'NEW_PAYMENT_ORDER',
      title: `سفارش مالی جدید: ${newOrder.itemTitle}`,
      message: `کسب‌وکار «${newOrder.businessName}» سفارش «${newOrder.itemTitle}» به مبلغ ${newOrder.amountToman.toLocaleString('fa-IR')} تومان ثبت کرد.`,
      businessId: newOrder.businessId,
      businessName: newOrder.businessName,
      ownerName: newOrder.businessName,
      ownerPhone:
        currentBusiness?.ownerPhone ||
        currentBusiness?.phoneDisplay ||
        authUser?.phone ||
        '',
      city: currentBusiness?.city || 'اصفهان',
      amountToman: newOrder.amountToman,
      orderId: newOrder.id,
      createdAtJalali: 'امروز',
      isRead: false,
    };
    setAdminNotifications((prev) => {
      const next = [orderNotif, ...prev];
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

    // علامت‌گذاری خودکار اعلان مربوط به این سفارش مالی به عنوان خوانده‌شده
    setAdminNotifications((prev) => {
      const next = prev.map((n) =>
        n.orderId === orderId ? { ...n, isRead: true } : n
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
    const persistHoursOverride = (savedHours: WorkingHourItem[]) => {
      try {
        const overridesRaw =
          window.localStorage.getItem('timeto_biz_overrides_v2') || '{}';
        const overrides = JSON.parse(overridesRaw);
        overrides[businessId] = {
          ...(overrides[businessId] || {}),
          workingHours: savedHours,
          workingHoursConfigured: true,
        };
        window.localStorage.setItem(
          'timeto_biz_overrides_v2',
          JSON.stringify(overrides)
        );
      } catch {
        // ignore
      }
    };

    if (dataMode === 'real') {
      void realApiClient
        .updateBusinessWorkingHours(businessId, hours)
        .then((res) => {
          persistHoursOverride(res.workingHours);
          setBusinesses((prev) =>
            prev.map((b) =>
              b.id === businessId
                ? {
                    ...b,
                    workingHours: res.workingHours,
                    workingHoursConfigured: true,
                  }
                : b
            )
          );
          showToast('ساعات کاری هفتگی در پایگاه داده ذخیره و در پیشرفت پروفایل لحاظ شد.');
        })
        .catch(() => {
          persistHoursOverride(hours);
          setBusinesses((prev) =>
            prev.map((b) =>
              b.id === businessId
                ? { ...b, workingHours: hours, workingHoursConfigured: true }
                : b
            )
          );
          showToast('ساعات کاری هفتگی ذخیره و در پیشرفت پروفایل شما ثبت شد.');
        });
      return;
    }

    persistHoursOverride(hours);
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId
          ? { ...b, workingHours: hours, workingHoursConfigured: true }
          : b
      )
    );
    showToast('ساعات کاری هفتگی ذخیره و در پیشرفت پروفایل ثبت شد.');
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

  const persistCategories = (next: CategoryItem[]) => {
    try {
      window.localStorage.setItem(
        'timeto_custom_categories_v2',
        JSON.stringify(next)
      );
    } catch {
      // ignore
    }
  };

  const addCategory = (item: Omit<CategoryItem, 'id'>) => {
    const localNew: CategoryItem = { ...item, id: `cat-${Date.now()}` };
    setCategories((prev) => {
      const next = [localNew, ...prev];
      persistCategories(next);
      return next;
    });

    if (dataMode === 'real') {
      void realApiClient
        .createCategory(item)
        .then((res) => {
          setCategories((prev) => {
            const next = prev.map((c) => (c.id === localNew.id ? res.item : c));
            persistCategories(next);
            return next;
          });
          showToast(`دسته‌بندی «${res.item.title}» ذخیره شد.`);
        })
        .catch(() => {
          showToast(`دسته‌بندی «${item.title}» به فهرست اضافه شد.`);
        });
      return;
    }

    showToast(`دسته‌بندی «${item.title}» به فهرست اضافه شد.`);
  };

  const updateCategory = (id: string, patch: Partial<CategoryItem>) => {
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      persistCategories(next);
      return next;
    });

    if (dataMode === 'real') {
      void realApiClient
        .updateCategory(id, patch)
        .then((res) => {
          setCategories((prev) => {
            const next = prev.map((c) => (c.id === id ? res.item : c));
            persistCategories(next);
            return next;
          });
          showToast('دسته‌بندی با موفقیت ویرایش شد.');
        })
        .catch(() => {
          showToast('دسته‌بندی با موفقیت ویرایش شد.');
        });
      return;
    }

    showToast('دسته‌بندی ویرایش شد.');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistCategories(next);
      return next;
    });
    showToast('دسته‌بندی انتخاب‌شده حذف شد.', 'warning');
  };

  const reorderCategory = (id: string, direction: 'UP' | 'DOWN') => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      persistCategories(next);
      return next;
    });
    showToast('اولویت نمایش دسته‌بندی بروزرسانی شد.', 'info');
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

  const normalizeIranMobile = (raw: string): string => {
    const digits = (raw || '')
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('9')) {
      return `0${digits}`;
    }
    if (digits.length === 12 && digits.startsWith('989')) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  };

  const formatMaskedPhoneDisplay = (cleanPhone: string): string => {
    if (!/^09\d{9}$/.test(cleanPhone)) return cleanPhone;
    const toFa = (s: string) =>
      s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)] || d);
    return `${toFa(cleanPhone.slice(0, 4))}***${toFa(cleanPhone.slice(7))}`;
  };

  const persistManualCustomerList = (list: CustomerRecord[]) => {
    try {
      window.localStorage.setItem(
        'timeto_manual_customers_v1',
        JSON.stringify(list)
      );
    } catch {
      // ignore
    }
  };

  const addCustomer = (input: {
    fullName: string;
    phone: string;
    city?: string;
    favoriteService?: string;
    totalVisits?: number;
    totalSpentToman?: number;
    lastVisitJalali?: string;
    notes?: string;
    businessId?: string;
  }): CustomerRecord | null => {
    const cleanName = input.fullName.trim();
    const cleanPhone = normalizeIranMobile(input.phone);

    if (!cleanName) {
      showToast('لطفاً نام و نام خانوادگی مشتری را وارد کنید.', 'warning');
      return null;
    }
    if (!/^09\d{9}$/.test(cleanPhone)) {
      showToast(
        'شماره موبایل مشتری باید ۱۱ رقم و با پیش‌شماره ۰۹ باشد (مثال: ۰۹۱۳۱۲۳۴۵۶۷).',
        'warning'
      );
      return null;
    }

    const targetBizId =
      input.businessId || currentBusiness?.id || ownedBusinessId || 'biz-1';
    const targetCity = input.city?.trim() || currentBusiness?.city || 'اصفهان';

    const existing = customers.find(
      (c) =>
        normalizeIranMobile(c.phone || c.phoneMasked) === cleanPhone &&
        (!c.businessId || c.businessId === targetBizId)
    );

    if (existing) {
      const updatedRecord: CustomerRecord = {
        ...existing,
        businessId: existing.businessId || targetBizId,
        fullName: cleanName,
        phone: cleanPhone,
        phoneMasked: formatMaskedPhoneDisplay(cleanPhone),
        city: targetCity,
        favoriteService:
          input.favoriteService?.trim() || existing.favoriteService,
        totalVisits:
          typeof input.totalVisits === 'number'
            ? input.totalVisits
            : existing.totalVisits,
        totalSpentToman:
          typeof input.totalSpentToman === 'number'
            ? input.totalSpentToman
            : existing.totalSpentToman,
        lastVisitJalali: input.lastVisitJalali?.trim() || existing.lastVisitJalali,
        notes: input.notes?.trim() || existing.notes,
      };
      setCustomers((prev) => {
        const next = prev.map((c) =>
          c.id === existing.id ? updatedRecord : c
        );
        persistManualCustomerList(next);
        return next;
      });
      showToast(
        `پرونده «${cleanName}» با این شماره موبایل قبلاً ثبت شده بود و اطلاعاتش بروزرسانی شد.`,
        'info'
      );
      return updatedRecord;
    }

    const newCustomer: CustomerRecord = {
      id: `cus-man-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`,
      businessId: targetBizId,
      fullName: cleanName,
      phone: cleanPhone,
      phoneMasked: formatMaskedPhoneDisplay(cleanPhone),
      city: targetCity,
      totalVisits:
        typeof input.totalVisits === 'number' && input.totalVisits >= 0
          ? input.totalVisits
          : 1,
      lastVisitJalali: input.lastVisitJalali?.trim() || 'امروز',
      totalSpentToman:
        typeof input.totalSpentToman === 'number' && input.totalSpentToman >= 0
          ? input.totalSpentToman
          : 0,
      favoriteService: input.favoriteService?.trim() || 'خدمات عمومی سالن',
      notes:
        input.notes?.trim() ||
        'ثبت‌شده به صورت دستی توسط مدیریت سالن در لیست مشتریان',
      sourceLabel: 'MANUAL',
    };

    setCustomers((prev) => {
      const next = [newCustomer, ...prev];
      persistManualCustomerList(next);
      return next;
    });

    showToast(`مشتری «${cleanName}» با موفقیت به باشگاه مشتریان سالن اضافه شد.`);
    return newCustomer;
  };

  const addCustomersBulk = (
    items: Array<{
      fullName: string;
      phone: string;
      favoriteService?: string;
      notes?: string;
      totalVisits?: number;
      totalSpentToman?: number;
    }>,
    businessId?: string
  ): { addedCount: number; updatedCount: number } => {
    const targetBizId =
      businessId || currentBusiness?.id || ownedBusinessId || 'biz-1';
    const targetCity = currentBusiness?.city || 'اصفهان';

    let addedCount = 0;
    let updatedCount = 0;

    setCustomers((prev) => {
      const nextList = [...prev];
      for (const rawItem of items) {
        const cleanName = (rawItem.fullName || '').trim();
        const cleanPhone = normalizeIranMobile(rawItem.phone || '');
        if (!cleanName || !/^09\d{9}$/.test(cleanPhone)) {
          continue;
        }
        const existingIdx = nextList.findIndex(
          (c) =>
            normalizeIranMobile(c.phone || c.phoneMasked) === cleanPhone &&
            (!c.businessId || c.businessId === targetBizId)
        );
        if (existingIdx >= 0) {
          const ex = nextList[existingIdx];
          nextList[existingIdx] = {
            ...ex,
            businessId: ex.businessId || targetBizId,
            fullName: cleanName || ex.fullName,
            phone: cleanPhone,
            phoneMasked: formatMaskedPhoneDisplay(cleanPhone),
            favoriteService:
              rawItem.favoriteService?.trim() || ex.favoriteService,
            notes: rawItem.notes?.trim() || ex.notes,
            totalVisits:
              typeof rawItem.totalVisits === 'number'
                ? rawItem.totalVisits
                : ex.totalVisits,
          };
          updatedCount += 1;
        } else {
          nextList.unshift({
            id: `cus-bulk-${Date.now()}-${Math.floor(1000 + Math.random() * 8999)}-${addedCount}`,
            businessId: targetBizId,
            fullName: cleanName,
            phone: cleanPhone,
            phoneMasked: formatMaskedPhoneDisplay(cleanPhone),
            city: targetCity,
            totalVisits:
              typeof rawItem.totalVisits === 'number' && rawItem.totalVisits >= 0
                ? rawItem.totalVisits
                : 1,
            lastVisitJalali: 'ثبت گروهی',
            totalSpentToman:
              typeof rawItem.totalSpentToman === 'number' &&
              rawItem.totalSpentToman >= 0
                ? rawItem.totalSpentToman
                : 0,
            favoriteService:
              rawItem.favoriteService?.trim() || 'مشتری حضوری سالن',
            notes:
              rawItem.notes?.trim() ||
              'افزوده‌شده در ورود گروهی مشتریان قبلی سالن',
            sourceLabel: 'BULK_IMPORT',
          });
          addedCount += 1;
        }
      }
      persistManualCustomerList(nextList);
      return nextList;
    });

    if (addedCount > 0 || updatedCount > 0) {
      showToast(
        `${addedCount} مشتری جدید اضافه شد${updatedCount > 0 ? ` و ${updatedCount} پرونده قبلی بروزرسانی شد` : ''}.`
      );
    } else {
      showToast(
        'هیچ ردیف معتبری (شامل نام و شماره موبایل ۱۱ رقمی با شروع ۰۹) یافت نشد.',
        'warning'
      );
    }
    return { addedCount, updatedCount };
  };

  const updateCustomer = (id: string, patch: Partial<CustomerRecord>) => {
    setCustomers((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        const nextPhone = patch.phone
          ? normalizeIranMobile(patch.phone)
          : c.phone;
        return {
          ...c,
          ...patch,
          phone: nextPhone,
          phoneMasked: nextPhone
            ? formatMaskedPhoneDisplay(nextPhone)
            : patch.phoneMasked || c.phoneMasked,
        };
      });
      persistManualCustomerList(next);
      return next;
    });
    showToast('اطلاعات پرونده مشتری بروزرسانی شد.');
  };

  const deleteCustomer = (id: string) => {
    try {
      const deletedRaw =
        window.localStorage.getItem('timeto_deleted_customer_ids_v1') || '[]';
      const deletedList: string[] = JSON.parse(deletedRaw);
      if (!deletedList.includes(id)) {
        deletedList.push(id);
        window.localStorage.setItem(
          'timeto_deleted_customer_ids_v1',
          JSON.stringify(deletedList)
        );
      }
    } catch {
      // ignore
    }
    setCustomers((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistManualCustomerList(next);
      return next;
    });
    showToast('پرونده مشتری از لیست حذف شد.', 'info');
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
      if (dataMode === 'real') {
        void fetch('/api/v1/admin/notifications/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id }),
        }).catch(() => {});
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
      if (dataMode === 'real') {
        void fetch('/api/v1/admin/notifications/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ clearAll: true }),
        }).catch(() => {});
      }
      return next;
    });
    showToast('تمامی اعلان‌های مدیریت خوانده شد.', 'info');
  };

  const updateAdminNotificationSettings = (
    patch: Partial<AdminNotificationSettings>
  ) => {
    setAdminNotificationSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(
          'timeto_admin_notify_settings_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });
    showToast('تنظیمات مدیر کل و اطلاع‌رسانی ذخیره شد.');
  };

  const submitSupportTicket = (input: {
    senderName?: string;
    senderPhone?: string;
    categoryLabel: string;
    subject: string;
    message: string;
    senderRole?: 'CUSTOMER' | 'BUSINESS_OWNER';
    businessId?: string;
    businessName?: string;
  }): SupportTicketItem => {
    const isBizRole =
      input.senderRole === 'BUSINESS_OWNER' ||
      Boolean(input.businessId) ||
      Boolean(ownedBusinessId) ||
      Boolean(authUser?.roles?.includes('BUSINESS_OWNER'));

    const matchedBiz =
      businesses.find((b) => b.id === (input.businessId || ownedBusinessId)) ||
      (isBizRole ? currentBusiness : null);

    const newTicket: SupportTicketItem = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      senderRole: isBizRole ? 'BUSINESS_OWNER' : 'CUSTOMER',
      senderName:
        input.senderName?.trim() ||
        matchedBiz?.ownerName ||
        authUser?.fullName ||
        'کاربر تایم تو',
      senderPhone:
        input.senderPhone?.trim() ||
        matchedBiz?.ownerPhone ||
        authUser?.phone ||
        'ثبت‌نشده',
      businessId: matchedBiz?.id || input.businessId,
      businessName: input.businessName || matchedBiz?.name,
      categoryLabel: input.categoryLabel,
      subject: input.subject.trim(),
      message: input.message.trim(),
      createdAtJalali: 'امروز',
      status: 'OPEN',
    };

    setSupportTickets((prev) => {
      const next = [newTicket, ...prev];
      try {
        window.localStorage.setItem(
          'timeto_support_tickets_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });

    const ticketNotif: AdminNotificationItem = {
      id: `notif-tck-${Date.now()}`,
      type: 'NEW_SUPPORT_TICKET',
      title: `تیکت پشتیبانی جدید: ${newTicket.subject}`,
      message: `${
        newTicket.senderRole === 'BUSINESS_OWNER'
          ? `صاحب کسب‌وکار «${newTicket.businessName || newTicket.senderName}»`
          : `مشتری (${newTicket.senderName})`
      } — تماس: ${newTicket.senderPhone}`,
      businessId: newTicket.businessId,
      businessName: newTicket.businessName,
      ownerName: newTicket.senderName,
      ownerPhone: newTicket.senderPhone,
      city: matchedBiz?.city || 'اصفهان',
      ticketId: newTicket.id,
      createdAtJalali: 'امروز',
      isRead: false,
    };

    setAdminNotifications((prev) => {
      const next = [ticketNotif, ...prev];
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

    showToast(
      `تیکت شما با کد ${newTicket.id} برای مدیریت کلان ارسال شد و پاسخ آن در همین بخش درج خواهد شد.`
    );
    return newTicket;
  };

  const replySupportTicket = (
    ticketId: string,
    replyText: string,
    status: 'ANSWERED' | 'CLOSED' = 'ANSWERED'
  ) => {
    setSupportTickets((prev) => {
      const next = prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              adminReply: replyText.trim(),
              repliedAtJalali: 'امروز',
              status,
            }
          : t
      );
      try {
        window.localStorage.setItem(
          'timeto_support_tickets_v1',
          JSON.stringify(next)
        );
      } catch {
        // ignore
      }
      return next;
    });

    setAdminNotifications((prev) => {
      const next = prev.map((n) =>
        n.ticketId === ticketId ? { ...n, isRead: true } : n
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

    showToast('پاسخ شما برای تیکت پشتیبانی ثبت شد.');
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
        isAuthModalOpen,
        authModalOptions,
        openAuthModal,
        closeAuthModal,
        completeUnifiedAuthSession,
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
        deleteCategory,
        reorderCategory,
        gallery,
        addGalleryItem,
        removeGalleryItem,
        campaigns,
        addCampaign,
        customers,
        addCustomer,
        addCustomersBulk,
        updateCustomer,
        deleteCustomer,
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
        adminNotificationSettings,
        updateAdminNotificationSettings,
        supportTickets,
        submitSupportTicket,
        replySupportTicket,
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
