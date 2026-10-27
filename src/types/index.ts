export enum BusinessType {
  WomenSalon = 'WOMEN_SALON',
  MenBarbershop = 'MEN_BARBERSHOP',
  IndependentSpecialist = 'INDEPENDENT_SPECIALIST',
}

export enum AppointmentStatus {
  Confirmed = 'CONFIRMED',
  Pending = 'PENDING',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
  NoShow = 'NO_SHOW',
}

export enum SubscriptionStatus {
  Active = 'ACTIVE',
  Trial = 'TRIAL',
  ExpiringSoon = 'EXPIRING_SOON',
  Expired = 'EXPIRED',
}

export type ApprovalStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';

export type UIStateMode =
  | 'normal'
  | 'loading'
  | 'empty'
  | 'error'
  | 'success'
  | 'incomplete_form';

export type RouteEnvironment =
  | 'public'
  | 'business_public'
  | 'business_onboarding'
  | 'business_panel'
  | 'customer'
  | 'admin';

export interface RouteItem {
  path: string;
  samplePath: string;
  title: string;
  environment: RouteEnvironment;
  description: string;
}

export interface ServiceItem {
  id: string;
  businessId: string;
  categorySlug: string;
  title: string;
  category: string;
  durationMinutes: number;
  priceToman: number;
  description: string;
  isPopular?: boolean;
  isActive?: boolean;
}

export interface SpecialistItem {
  id: string;
  businessId: string;
  slug: string;
  fullName: string;
  roleTitle: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  specialties: string[];
  bio: string;
  isIndependent: boolean;
  isActive?: boolean;
  city?: string;
  startingPriceToman?: number;
  avatarUrl?: string;
}

export interface WorkingHourItem {
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ReviewItem {
  id: string;
  businessId: string;
  specialistSlug?: string;
  authorName: string;
  serviceTitle: string;
  rating: number;
  dateJalali: string;
  comment: string;
}

export interface GalleryItem {
  id: string;
  businessId: string;
  title: string;
  categoryLabel: string;
  theme: 'rose' | 'slate' | 'emerald' | 'violet';
}

export interface BusinessItem {
  id: string;
  slug: string;
  name: string;
  type: BusinessType;
  typeLabel: string;
  categorySlug: string;
  city: string;
  neighborhood: string;
  address: string;
  phoneDisplay: string;
  rating: number;
  reviewCount: number;
  startingPriceToman: number;
  shortDescription: string;
  aboutText: string;
  verifiedBadge: boolean;
  approvalStatus: ApprovalStatus;
  subscriptionPlan: string;
  subscriptionStatus: SubscriptionStatus;
  workingHours: WorkingHourItem[];
  visualTheme: 'rose' | 'slate' | 'emerald' | 'violet';
  featured?: boolean;
  isSponsored?: boolean;
  sponsoredLabel?: string;
  sponsoredPlacement?: SponsoredPlacementSlot;
  sponsoredOrder?: number;
  sponsoredDaysRemaining?: number;
  sponsoredExpiresJalali?: string;
  extraSmsBalance?: number;
  instagramHandle?: string;
  mapLat?: number;
  mapLng?: number;
  avatarUrl?: string;
}

export type SponsoredPlacementSlot =
  | 'SEARCH_TOP'
  | 'HOME_BANNER'
  | 'HERO_SPOTLIGHT';

export interface AdPackageItem {
  id: string;
  title: string;
  slot: SponsoredPlacementSlot | 'SMS_ADDON';
  durationDays: number;
  priceToman: number;
  weeklyPriceToman?: number;
  smsCount?: number;
  badge: string;
  description: string;
}

export interface PaymentGatewayConfig {
  activeMethod: 'BALEPAY_AND_CARD' | 'BALEPAY_ONLY' | 'CARD_ONLY';
  balePayId: string;
  balePayLink: string;
  cardNumber: string;
  cardHolderName: string;
  shebaNumber: string;
  bankName: string;
  supportTelegramOrBale: string;
  instructions: string;
}

export interface PaymentOrderItem {
  id: string;
  businessId: string;
  businessName: string;
  itemType: 'PLAN' | 'AD_PACKAGE' | 'SMS_PACK';
  itemId: string;
  itemTitle: string;
  amountToman: number;
  paymentMethod: 'BALEPAY' | 'CARD_TO_CARD';
  trackingCode: string;
  createdAtJalali: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedPlacement?: SponsoredPlacementSlot;
  requestedDurationDays?: number;
  requestedLabel?: string;
  requestedSmsCount?: number;
}

export interface AppointmentItem {
  id: string;
  referenceCode: string;
  businessId: string;
  businessSlug: string;
  businessName: string;
  customerName: string;
  customerPhoneMasked: string;
  serviceId: string;
  serviceTitle: string;
  specialistId: string;
  specialistName: string;
  dateJalali: string;
  timeSlot: string;
  durationMinutes: number;
  priceToman: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface CustomerRecord {
  id: string;
  fullName: string;
  phoneMasked: string;
  city: string;
  totalVisits: number;
  lastVisitJalali: string;
  totalSpentToman: number;
  favoriteService: string;
  notes: string;
}

export interface CategoryItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  serviceCount: number;
  targetAudience: string;
  iconName: string;
}

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  audience: string;
  monthlyPriceToman: number;
  staffLimit: string;
  smsQuotaMonthly: number;
  features: string[];
  comparison: {
    onlineBooking: string;
    smsReminders: string;
    analyticsLevel: string;
    supportType: string;
  };
  isRecommended?: boolean;
}

export interface MarketingCampaignItem {
  id: string;
  title: string;
  targetSegment: string;
  discountPercent: number;
  channel: string;
  statusLabel: string;
  createdAtJalali: string;
}

export interface OnboardingDraft {
  businessType: BusinessType;
  businessName: string;
  categorySlug: string;
  slug: string;
  ownerName: string;
  phone: string;
  instagramHandle?: string;
  avatarUrl?: string;
  city: string;
  neighborhood: string;
  address: string;
  mapLat?: number;
  mapLng?: number;
  shortDescription: string;
  services: Array<{
    id: string;
    title: string;
    category: string;
    durationMinutes: number;
    priceToman: number;
  }>;
  staff: Array<{
    id: string;
    fullName: string;
    roleTitle: string;
  }>;
  workingHours: WorkingHourItem[];
  licenseCode: string;
  nationalIdNumber: string;
  selectedPlanId?: string;
}

export interface BookingDraft {
  businessSlug: string;
  serviceId: string;
  serviceIds?: string[];
  specialistId: string;
  dateJalali: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  lastReferenceCode?: string;
}

export interface TimeSlotAvailabilityItem {
  time: string;
  available: boolean;
  reason?: string;
}

export interface AdminUserRecord {
  id: string;
  fullName: string;
  phoneMasked: string;
  roleLabel: string;
  city: string;
  joinedJalali: string;
  isActive: boolean;
}

