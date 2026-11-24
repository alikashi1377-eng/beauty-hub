import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBusinessFinancialDossier,
  computePlatformAdminSummary,
  resolveAppointmentFinancialBreakdown,
} from './financialEngine';
import {
  AppointmentItem,
  AppointmentStatus,
  BusinessItem,
  BusinessType,
  PaymentOrderItem,
  ServiceItem,
  SettlementRequestItem,
  SubscriptionStatus,
} from '../types';

function makeBusiness(overrides: Partial<BusinessItem> = {}): BusinessItem {
  return {
    id: 'biz-real-1',
    slug: 'ayra-salon',
    name: 'سالن زیبایی آیرا',
    type: BusinessType.WomenSalon,
    typeLabel: 'سالن زیبایی',
    categorySlug: 'hair-color',
    city: 'تهران',
    neighborhood: 'سعادت‌آباد',
    address: 'تهران، سعادت‌آباد',
    phoneDisplay: '09121111111',
    ownerName: 'سارا احمدی',
    ownerPhone: '09121111111',
    rating: 4.9,
    reviewCount: 12,
    startingPriceToman: 500_000,
    shortDescription: 'سالن تخصصی',
    aboutText: 'سالن تخصصی زیبایی',
    verifiedBadge: true,
    approvalStatus: 'APPROVED',
    subscriptionPlan: 'هدیه شروع فعالیت (۱۰ نوبت رایگان)',
    subscriptionStatus: SubscriptionStatus.Trial,
    workingHours: [],
    visualTheme: 'violet',
    depositEnabled: true,
    depositPercent: 30,
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<AppointmentItem> = {}): AppointmentItem {
  return {
    id: 'apt-real-1',
    referenceCode: 'TT-9001',
    businessId: 'biz-real-1',
    businessSlug: 'ayra-salon',
    businessName: 'سالن زیبایی آیرا',
    serviceId: 'srv-1',
    serviceTitle: 'رنگ مو تخصصی',
    specialistId: 'sp-1',
    specialistName: 'سارا احمدی',
    customerName: 'مریم رضایی',
    customerPhone: '09129999999',
    customerPhoneMasked: '0912***9999',
    dateJalali: '1405/09/05',
    timeSlot: '11:00',
    durationMinutes: 60,
    priceToman: 1_000_000,
    depositPaidToman: 300_000,
    status: AppointmentStatus.Confirmed,
    ...overrides,
  };
}

test('resolveAppointmentFinancialBreakdown respects depositEnabled=false and never fabricates 350,000', () => {
  const noDepositBiz = makeBusiness({ depositEnabled: false, depositPercent: 30 });
  const apt = makeAppointment({ priceToman: 800_000, depositPaidToman: 0 });
  const bd = resolveAppointmentFinancialBreakdown({
    appointment: apt,
    business: noDepositBiz,
  });

  assert.equal(bd.totalServicePriceToman, 800_000);
  assert.equal(bd.baseDepositToman, 0);
  assert.equal(bd.remainingInSalonToman, 800_000);
  assert.equal(bd.zibalGatewayFeeToman, 0);
  assert.equal(bd.valueAddedTaxFeeToman, 0);

  const zeroPriceApt = makeAppointment({ priceToman: 0, depositPaidToman: 0 });
  const zeroBd = resolveAppointmentFinancialBreakdown({
    appointment: zeroPriceApt,
    business: makeBusiness(),
    service: null,
  });
  assert.equal(zeroBd.totalServicePriceToman, 0);
  assert.equal(zeroBd.baseDepositToman, 0);

  const matchedService: Pick<ServiceItem, 'priceToman'> = { priceToman: 500_000 };
  const resolvedFromService = resolveAppointmentFinancialBreakdown({
    appointment: zeroPriceApt,
    business: makeBusiness({ depositPercent: 20 }),
    service: matchedService,
  });
  assert.equal(resolvedFromService.totalServicePriceToman, 500_000);
  assert.equal(resolvedFromService.baseDepositToman, 100_000);
  assert.equal(resolvedFromService.remainingInSalonToman, 400_000);
});

test('computePlatformAdminSummary matches sum of per-business dossiers with zero double-counting', () => {
  const bizA = makeBusiness({
    id: 'biz-real-a',
    slug: 'salon-a',
    name: 'سالن آیرا',
    depositPercent: 30,
  });
  const bizB = makeBusiness({
    id: 'biz-real-b',
    slug: 'barber-b',
    name: 'پیرایش امیرحسین',
    type: BusinessType.MenBarbershop,
    depositPercent: 20,
    approvalStatus: 'PENDING_REVIEW',
  });
  const sampleBiz = makeBusiness({ id: 'biz-1', slug: 'sample-1', name: 'نمونه' });
  const hiddenMahtab = makeBusiness({ id: 'biz-real-m', slug: 'mahtab', name: 'سالن مهتاب' });
  const rejectedBiz = makeBusiness({
    id: 'biz-real-rej',
    slug: 'rej-salon',
    name: 'سالن رد شده',
    approvalStatus: 'REJECTED',
  });

  const appointments: AppointmentItem[] = [
    makeAppointment({
      id: 'apt-r1',
      referenceCode: 'TT-101',
      businessId: 'biz-real-a',
      businessSlug: 'salon-a',
      businessName: 'سالن آیرا',
      priceToman: 1_000_000,
      depositPaidToman: 300_000,
      status: AppointmentStatus.Confirmed,
    }),
    // Duplicate by referenceCode — must be deduplicated!
    makeAppointment({
      id: 'apt-r1-dup',
      referenceCode: 'TT-101',
      businessId: 'biz-real-a',
      businessSlug: 'salon-a',
      businessName: 'سالن آیرا',
      priceToman: 1_000_000,
      depositPaidToman: 300_000,
      status: AppointmentStatus.Pending,
    }),
    // Cancelled booking — excluded from active booking totals & deposits
    makeAppointment({
      id: 'apt-r2-cancelled',
      referenceCode: 'TT-102',
      businessId: 'biz-real-a',
      businessSlug: 'salon-a',
      businessName: 'سالن آیرا',
      priceToman: 900_000,
      depositPaidToman: 270_000,
      status: AppointmentStatus.Cancelled,
    }),
    makeAppointment({
      id: 'apt-r3',
      referenceCode: 'TT-103',
      businessId: 'biz-real-b',
      businessSlug: 'barber-b',
      businessName: 'پیرایش امیرحسین',
      priceToman: 500_000,
      depositPaidToman: 100_000,
      status: AppointmentStatus.Completed,
    }),
    // Sample appointment — must be ignored
    makeAppointment({
      id: 'apt-1',
      referenceCode: 'TT-SAMPLE',
      businessId: 'biz-1',
      businessSlug: 'sample-1',
      businessName: 'نمونه',
      priceToman: 2_000_000,
      depositPaidToman: 600_000,
    }),
  ];

  const settlements: SettlementRequestItem[] = [
    {
      id: 'set-1',
      businessId: 'biz-real-a',
      businessName: 'سالن آیرا',
      ownerName: 'سارا احمدی',
      ownerPhone: '09121111111',
      amountToman: 200_000,
      commissionToman: 0,
      netPayoutToman: 200_000,
      shebaNumber: 'IR120170000000123456789012',
      status: 'PAID',
      createdAtJalali: '1405/09/04',
      paidTrackingCode: 'PAYA-111',
    },
  ];

  const orders: PaymentOrderItem[] = [
    {
      id: 'ord-1',
      businessId: 'biz-real-a',
      businessName: 'سالن آیرا',
      itemType: 'PLAN',
      itemId: 'plan-professional',
      itemTitle: 'پکیج حرفه‌ای',
      amountToman: 1_090_000,
      paymentMethod: 'ZIBAL',
      trackingCode: 'ZBL-1001',
      status: 'APPROVED',
      createdAtJalali: '1405/09/01',
    },
    {
      id: 'ord-2',
      businessId: 'biz-real-b',
      businessName: 'پیرایش امیرحسین',
      itemType: 'AD_PACKAGE',
      itemId: 'ad-home-1',
      itemTitle: 'بنر ویژه',
      amountToman: 450_000,
      paymentMethod: 'ZIBAL',
      trackingCode: 'ZBL-1002',
      status: 'PENDING',
      createdAtJalali: '1405/09/03',
    },
  ];

  const summary = computePlatformAdminSummary({
    businesses: [bizA, bizB, sampleBiz, hiddenMahtab, rejectedBiz],
    appointments,
    settlementRequests: settlements,
    paymentOrders: orders,
  });

  // Only the 2 real businesses remain
  assert.equal(summary.totalBusinesses, 2);
  assert.equal(summary.activeBusinesses, 1);
  assert.equal(summary.pendingBusinesses, 1);
  assert.equal(summary.businessDossiers.length, 2);

  // Exact balance: sum of rows === platform KPI totals
  const sumBookings = summary.businessDossiers.reduce((s, d) => s + d.bookingsCount, 0);
  const sumService = summary.businessDossiers.reduce((s, d) => s + d.totalServiceToman, 0);
  const sumDeposits = summary.businessDossiers.reduce((s, d) => s + d.totalDepositCollectedToman, 0);
  const sumPaid = summary.businessDossiers.reduce((s, d) => s + d.totalAlreadySettledToman, 0);
  const sumPending = summary.businessDossiers.reduce((s, d) => s + d.netPayableToman, 0);

  assert.equal(summary.totalBookings, 2);
  assert.equal(summary.totalBookings, sumBookings);
  assert.equal(summary.totalServiceVolumeToman, 1_500_000);
  assert.equal(summary.totalServiceVolumeToman, sumService);
  assert.equal(summary.totalOnlineDepositsToman, 400_000);
  assert.equal(summary.totalOnlineDepositsToman, sumDeposits);
  assert.equal(summary.totalPaidSettlementsToman, 200_000);
  assert.equal(summary.totalPaidSettlementsToman, sumPaid);
  assert.equal(summary.totalPendingPayableToman, 200_000);
  assert.equal(summary.totalPendingPayableToman, sumPending);

  // Zero double-counting check: paid Sheba settlements MUST NOT inflate platform revenue or turnover
  assert.equal(summary.platformNetRevenueToman, 1_090_000);
  assert.equal(summary.grossOnlineTurnoverToman, 400_000 + 1_090_000);
  assert.equal(summary.pendingOrdersToman, 450_000);
  assert.equal(summary.pendingOrdersCount, 1);

  // Individual dossier consistency check
  const dossierA = computeBusinessFinancialDossier({
    business: bizA,
    appointments,
    settlementRequests: settlements,
    paymentOrders: orders,
  });
  assert.equal(dossierA.bookingsCount, 1);
  assert.equal(dossierA.cancelledBookingsCount, 1);
  assert.equal(dossierA.totalDepositCollectedToman, 300_000);
  assert.equal(dossierA.totalAlreadySettledToman, 200_000);
  assert.equal(dossierA.netPayableToman, 100_000);
  assert.equal(dossierA.approvedSubscriptionToman, 1_090_000);
});
