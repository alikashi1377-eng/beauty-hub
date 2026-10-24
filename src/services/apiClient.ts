import {
  SAMPLE_APPOINTMENTS,
  SAMPLE_BUSINESSES,
  SAMPLE_CATEGORIES,
  SAMPLE_SERVICES,
  SAMPLE_SPECIALISTS,
  SAMPLE_SUBSCRIPTION_PLANS,
} from '../mocks/sampleData';
import {
  AppointmentItem,
  BusinessItem,
  CategoryItem,
  ServiceItem,
  SpecialistItem,
  SubscriptionPlanItem,
} from '../types';

/**
 * لایه سرویس‌ها و ارتباطات آینده با بک‌اند (Repository / Service Contract)
 *
 * معماری این ماژول به گونه‌ای طراحی شده که در مراحل بعدی پروژه بدون نیاز به تغییر
 * در کامپوننت‌های رابط کاربری، به Supabase / PostgreSQL و APIهای سمت سرور متصل شود.
 *
 * محدودیت امنیتی مرحله اول:
 * - هیچ کلید خصوصی یا محرمانه‌ای در کد سمت مرورگر قرار ندارد.
 * - احراز هویت واقعی یا اتصال دیتابیس در این مرحله شبیه‌سازی جعلی نشده است.
 */
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
