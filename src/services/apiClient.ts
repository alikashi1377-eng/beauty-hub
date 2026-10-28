import {
  SAMPLE_APPOINTMENTS,
  SAMPLE_BUSINESSES,
  SAMPLE_CATEGORIES,
  SAMPLE_SERVICES,
  SAMPLE_SPECIALISTS,
  SAMPLE_SUBSCRIPTION_PLANS,
} from '../mocks/sampleData';
import {
  AdminUserRecord,
  AppointmentItem,
  AppointmentStatus,
  ApprovalStatus,
  BusinessItem,
  CategoryItem,
  CustomerRecord,
  GalleryItem,
  MarketingCampaignItem,
  OnboardingDraft,
  ReviewItem,
  ServiceItem,
  SpecialistItem,
  SubscriptionPlanItem,
  TimeSlotAvailabilityItem,
  WorkingHourItem,
} from '../types';

export interface AuthenticatedSessionUser {
  sessionId: string;
  userId: string;
  phone: string;
  fullName: string;
  defaultCity: string | null;
  roles: Array<'CUSTOMER' | 'BUSINESS_OWNER' | 'PLATFORM_ADMIN'>;
  isPlatformAdmin: boolean;
  businessMemberships: Array<{
    businessUuid: string;
    businessId: string;
    businessSlug: string;
    memberRole: 'OWNER' | 'MANAGER' | 'STAFF';
  }>;
}

export interface ApiBootstrapResponse {
  ok: boolean;
  mode: 'mock' | 'real';
  errorCode?: string;
  message?: string;
  data: {
    categories: CategoryItem[];
    businesses: BusinessItem[];
    services: ServiceItem[];
    specialists: SpecialistItem[];
    reviews: ReviewItem[];
    gallery: GalleryItem[];
    plans: SubscriptionPlanItem[];
    appointments?: AppointmentItem[];
    customers?: CustomerRecord[];
    campaigns?: MarketingCampaignItem[];
    favoriteBusinessIds?: string[];
  } | null;
}

export class ApiClientError extends Error {
  status: number;
  errorCode: string;
  mode?: 'mock' | 'real';

  constructor(
    message: string,
    status: number,
    errorCode = 'API_ERROR',
    mode?: 'mock' | 'real'
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errorCode = errorCode;
    this.mode = mode;
  }
}

const SESSION_STORAGE_KEY = 'timeto_session_token_v1';

export function getSavedSessionToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSessionTokenToStorage(token?: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (token && token.trim()) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, token.trim());
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const savedToken = getSavedSessionToken();
  const authHeaders: Record<string, string> = savedToken
    ? { Authorization: `Bearer ${savedToken}` }
    : {};

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.ok === false) {
    throw new ApiClientError(
      body?.message || 'خطا در برقراری ارتباط با سرور',
      response.status,
      body?.errorCode || 'HTTP_ERROR',
      body?.mode
    );
  }
  return body as T;
}

/**
 * کلاینت واقعی متصل به بک‌اند Express و دیتابیس PostgreSQL (/api/v1/*)
 * در حالت real هیچ‌گاه به صورت خاموش به داده‌های آزمایشی برنمی‌گردد.
 */
export const realApiClient = {
  async fetchBootstrap(): Promise<ApiBootstrapResponse> {
    const savedToken = getSavedSessionToken();
    const res = await fetch('/api/v1/bootstrap', {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
      },
    });
    const body = (await res.json().catch(() => ({}))) as ApiBootstrapResponse;
    if (!res.ok || body.ok === false) {
      throw new ApiClientError(
        body.message || 'خطا در دریافت اطلاعات از دیتابیس PostgreSQL.',
        res.status,
        body.errorCode || 'BOOTSTRAP_FAILED',
        body.mode || 'real'
      );
    }
    return body;
  },

  async getCurrentUser(): Promise<{ user: AuthenticatedSessionUser }> {
    return requestJson<{ ok: boolean; user: AuthenticatedSessionUser }>(
      '/api/v1/auth/me'
    );
  },

  async requestOtp(phone: string): Promise<{
    challengeId?: string;
    message: string;
  }> {
    return requestJson<{
      ok: boolean;
      challengeId?: string;
      message: string;
    }>('/api/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  async verifyOtp(
    phone: string,
    code: string
  ): Promise<{
    userId: string;
    sessionToken: string;
    expiresAt: string;
    user: AuthenticatedSessionUser;
    message: string;
  }> {
    const res = await requestJson<{
      ok: boolean;
      userId: string;
      sessionToken: string;
      expiresAt: string;
      user: AuthenticatedSessionUser;
      message: string;
    }>('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    if (res.sessionToken) {
      saveSessionTokenToStorage(res.sessionToken);
    }
    return res;
  },

  async loginWithPassword(
    phone: string,
    password: string
  ): Promise<{
    userId: string;
    sessionToken: string;
    expiresAt: string;
    user: AuthenticatedSessionUser;
    message: string;
  }> {
    const res = await requestJson<{
      ok: boolean;
      userId: string;
      sessionToken: string;
      expiresAt: string;
      user: AuthenticatedSessionUser;
      message: string;
    }>('/api/v1/auth/password/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    if (res.sessionToken) {
      saveSessionTokenToStorage(res.sessionToken);
    }
    return res;
  },

  async setAccountPassword(password: string): Promise<{ message: string }> {
    return requestJson<{ ok: boolean; message: string }>(
      '/api/v1/auth/password/set',
      {
        method: 'POST',
        body: JSON.stringify({ password }),
      }
    );
  },

  async logout(): Promise<void> {
    saveSessionTokenToStorage(null);
    await requestJson('/api/v1/auth/logout', {
      method: 'POST',
    });
  },

  async logoutAll(): Promise<void> {
    saveSessionTokenToStorage(null);
    await requestJson('/api/v1/auth/logout-all', {
      method: 'POST',
    });
  },

  async fetchCustomerBootstrap(): Promise<{
    data: {
      appointments: AppointmentItem[];
      favoriteBusinessIds: string[];
    };
  }> {
    return requestJson<{
      ok: boolean;
      data: {
        appointments: AppointmentItem[];
        favoriteBusinessIds: string[];
      };
    }>('/api/v1/me/bootstrap');
  },

  async updateMyProfile(patch: {
    fullName?: string;
    defaultCity?: string;
  }): Promise<{
    user: AuthenticatedSessionUser;
    message: string;
  }> {
    return requestJson<{
      ok: boolean;
      user: AuthenticatedSessionUser;
      message: string;
    }>('/api/v1/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async fetchBusinessAvailability(
    slug: string,
    params: {
      dateJalali: string;
      serviceId?: string;
      specialistId?: string;
    }
  ): Promise<{
    mode: 'mock' | 'real';
    data: {
      businessId: string;
      businessSlug: string;
      dateJalali: string;
      dayOfWeek: number;
      dayName: string;
      isOpen: boolean;
      openTime: string;
      closeTime: string;
      durationMinutes: number;
      bufferMinutes: number;
      slots: TimeSlotAvailabilityItem[];
    } | null;
  }> {
    const search = new URLSearchParams();
    search.set('dateJalali', params.dateJalali);
    if (params.serviceId) search.set('serviceId', params.serviceId);
    if (params.specialistId) search.set('specialistId', params.specialistId);
    return requestJson(`/api/v1/businesses/${encodeURIComponent(slug)}/availability?${search.toString()}`);
  },

  async fetchBusinessWorkspace(businessId?: string): Promise<{
    data: {
      business: BusinessItem | null;
      memberRole: 'OWNER' | 'MANAGER' | 'STAFF' | null;
      services: ServiceItem[];
      specialists: SpecialistItem[];
      appointments: AppointmentItem[];
      customers: CustomerRecord[];
      campaigns: MarketingCampaignItem[];
      gallery: GalleryItem[];
    };
  }> {
    const query = businessId
      ? `?businessId=${encodeURIComponent(businessId)}`
      : '';
    return requestJson<{
      ok: boolean;
      data: {
        business: BusinessItem | null;
        memberRole: 'OWNER' | 'MANAGER' | 'STAFF' | null;
        services: ServiceItem[];
        specialists: SpecialistItem[];
        appointments: AppointmentItem[];
        customers: CustomerRecord[];
        campaigns: MarketingCampaignItem[];
        gallery: GalleryItem[];
      };
    }>(`/api/v1/app/workspace${query}`);
  },

  async fetchAdminOverview(): Promise<{
    data: {
      businesses: BusinessItem[];
      categories: CategoryItem[];
      plans: SubscriptionPlanItem[];
      users?: AdminUserRecord[];
      appointments?: AppointmentItem[];
    };
  }> {
    return requestJson<{
      ok: boolean;
      data: {
        businesses: BusinessItem[];
        categories: CategoryItem[];
        plans: SubscriptionPlanItem[];
        users?: AdminUserRecord[];
        appointments?: AppointmentItem[];
      };
    }>('/api/v1/admin/overview');
  },

  async createService(
    item: Omit<ServiceItem, 'id'>
  ): Promise<{ item: ServiceItem }> {
    return requestJson<{ ok: boolean; item: ServiceItem }>('/api/v1/services', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateService(
    id: string,
    patch: Partial<ServiceItem>
  ): Promise<{ item: ServiceItem }> {
    return requestJson<{ ok: boolean; item: ServiceItem }>(
      `/api/v1/services/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(patch),
      }
    );
  },

  async deleteService(id: string): Promise<void> {
    await requestJson(`/api/v1/services/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async createSpecialist(
    item: Omit<SpecialistItem, 'id'>
  ): Promise<{ item: SpecialistItem }> {
    return requestJson<{ ok: boolean; item: SpecialistItem }>(
      '/api/v1/specialists',
      {
        method: 'POST',
        body: JSON.stringify(item),
      }
    );
  },

  async updateSpecialist(
    id: string,
    patch: Partial<SpecialistItem>
  ): Promise<{ item: SpecialistItem }> {
    return requestJson<{ ok: boolean; item: SpecialistItem }>(
      `/api/v1/specialists/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
  },

  async updateBusinessProfile(
    businessId: string,
    patch: Partial<BusinessItem>
  ): Promise<void> {
    await requestJson(
      `/api/v1/businesses/${encodeURIComponent(businessId)}/profile`,
      {
        method: 'PUT',
        body: JSON.stringify(patch),
      }
    );
  },

  async updateBusinessWorkingHours(
    businessId: string,
    workingHours: WorkingHourItem[]
  ): Promise<{ workingHours: WorkingHourItem[] }> {
    return requestJson<{ ok: boolean; workingHours: WorkingHourItem[] }>(
      `/api/v1/businesses/${encodeURIComponent(businessId)}/working-hours`,
      {
        method: 'PUT',
        body: JSON.stringify({ workingHours }),
      }
    );
  },

  async updateBusinessApproval(
    businessId: string,
    status: ApprovalStatus
  ): Promise<void> {
    await requestJson(
      `/api/v1/admin/businesses/${encodeURIComponent(businessId)}/approval`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  },

  async createAppointment(input: {
    businessSlug: string;
    serviceId: string;
    specialistId: string;
    dateJalali: string;
    timeSlot: string;
    customerName: string;
    customerPhone: string;
    customerNotes?: string;
  }): Promise<{ item: AppointmentItem }> {
    return requestJson<{ ok: boolean; item: AppointmentItem }>(
      '/api/v1/appointments',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
  },

  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    cancelledReason?: string
  ): Promise<void> {
    await requestJson(`/api/v1/appointments/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancelledReason }),
    });
  },

  async createCategory(
    item: Omit<CategoryItem, 'id'>
  ): Promise<{ item: CategoryItem }> {
    return requestJson<{ ok: boolean; item: CategoryItem }>(
      '/api/v1/admin/categories',
      {
        method: 'POST',
        body: JSON.stringify(item),
      }
    );
  },

  async updateCategory(
    id: string,
    patch: Partial<CategoryItem>
  ): Promise<{ item: CategoryItem }> {
    return requestJson<{ ok: boolean; item: CategoryItem }>(
      `/api/v1/admin/categories/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(patch),
      }
    );
  },

  async createGalleryItem(
    item: Omit<GalleryItem, 'id'>
  ): Promise<{ item: GalleryItem }> {
    return requestJson<{ ok: boolean; item: GalleryItem }>('/api/v1/gallery', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteGalleryItem(id: string): Promise<void> {
    await requestJson(`/api/v1/gallery/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async createCampaign(
    item: Omit<MarketingCampaignItem, 'id'>
  ): Promise<{ item: MarketingCampaignItem }> {
    return requestJson<{ ok: boolean; item: MarketingCampaignItem }>(
      '/api/v1/campaigns',
      {
        method: 'POST',
        body: JSON.stringify(item),
      }
    );
  },

  async toggleFavoriteBusiness(
    businessId: string
  ): Promise<{ favorited: boolean; favoriteBusinessIds: string[] }> {
    return requestJson<{
      ok: boolean;
      favorited: boolean;
      favoriteBusinessIds: string[];
    }>('/api/v1/customers/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ businessId }),
    });
  },

  async onboardBusiness(
    draft: OnboardingDraft
  ): Promise<{
    businessId: string;
    slug: string;
    data: NonNullable<ApiBootstrapResponse['data']>;
  }> {
    return requestJson('/api/v1/businesses/onboard', {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  },

  async createReview(input: {
    businessId: string;
    specialistSlug?: string;
    serviceTitle: string;
    rating: number;
    comment: string;
    dateJalali?: string;
  }): Promise<{ item: ReviewItem }> {
    return requestJson<{ ok: boolean; item: ReviewItem }>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

export interface BeautyHubDataService {
  getBusinesses(): Promise<BusinessItem[]>;
  getBusinessBySlug(slug: string): Promise<BusinessItem | undefined>;
  getServicesByBusinessId(businessId: string): Promise<ServiceItem[]>;
  getSpecialistsByBusinessId(businessId: string): Promise<SpecialistItem[]>;
  getSpecialistBySlug(slug: string): Promise<SpecialistItem | undefined>;
  getAppointments(): Promise<AppointmentItem[]>;
  getCategories(): Promise<CategoryItem[]>;
  getSubscriptionPlans(): Promise<SubscriptionPlanItem[]>;
}

export const mockDataService: BeautyHubDataService = {
  async getBusinesses() {
    return SAMPLE_BUSINESSES;
  },
  async getBusinessBySlug(slug: string) {
    return SAMPLE_BUSINESSES.find((b) => b.slug === slug);
  },
  async getServicesByBusinessId(businessId: string) {
    return SAMPLE_SERVICES.filter((s) => s.businessId === businessId);
  },
  async getSpecialistsByBusinessId(businessId: string) {
    return SAMPLE_SPECIALISTS.filter((sp) => sp.businessId === businessId);
  },
  async getSpecialistBySlug(slug: string) {
    return SAMPLE_SPECIALISTS.find((sp) => sp.slug === slug);
  },
  async getAppointments() {
    return SAMPLE_APPOINTMENTS;
  },
  async getCategories() {
    return SAMPLE_CATEGORIES;
  },
  async getSubscriptionPlans() {
    return SAMPLE_SUBSCRIPTION_PLANS;
  },
};
