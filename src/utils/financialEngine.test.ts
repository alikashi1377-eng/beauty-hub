import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_DEPOSIT_PERCENTS,
  calculateBookingFinancialBreakdown,
  FREE_TRIAL_BOOKING_QUOTA,
  isAppointmentEligibleForSettlement,
  normalizeDepositPercent,
  resolveAppointmentFinancialBreakdown,
  resolveBusinessCommissionMeta,
  resolveBusinessSubscriptionQuotaStatus,
  TIMETO_MONTHLY_PACKAGES,
  validateServiceAntiFraud,
} from './financialEngine';
import { AppointmentStatus, BusinessType } from '../types';
import {
  buildCustomerBookingTimeSlots,
  computeAdPackagePriceAndTitle,
  formatCompactPriceToman,
  formatCustomerWorkingHourMinimal,
  formatPriceToman,
  formatServicePriceShort,
  formatWorkingHourDisplay,
  getPlanStaffLimitCount,
  resolveEffectiveWorkingHour,
} from './formatters';

test('normalizeDepositPercent enforces 20..100% deposit range (preserving presets 20, 30, 50, 100) and defaults invalid/0 to 30', () => {
  assert.deepEqual(ALLOWED_DEPOSIT_PERCENTS, [20, 30, 50, 100]);
  assert.equal(normalizeDepositPercent(0), 30);
  assert.equal(normalizeDepositPercent(undefined), 30);
  assert.equal(normalizeDepositPercent(10), 20);
  assert.equal(normalizeDepositPercent(20), 20);
  assert.equal(normalizeDepositPercent(25), 25);
  assert.equal(normalizeDepositPercent(30), 30);
  assert.equal(normalizeDepositPercent(35), 35);
  assert.equal(normalizeDepositPercent(40), 40);
  assert.equal(normalizeDepositPercent(50), 50);
  assert.equal(normalizeDepositPercent(100), 100);
  assert.equal(normalizeDepositPercent(150), 100);

  const custom25 = calculateBookingFinancialBreakdown({
    totalServicePriceToman: 400_000,
    depositPercent: 25,
    business: {
      type: BusinessType.MenBarbershop,
      typeLabel: 'پیرایش مردانه',
      categorySlug: 'mens-barbershop',
      targetGender: 'MALE',
      name: 'سالن امیرحسین جزینی',
    },
  });
  assert.equal(custom25.depositPercent, 25);
  assert.equal(custom25.baseDepositToman, 100_000);
  assert.equal(custom25.remainingInSalonToman, 300_000);
  assert.equal(custom25.platformCommissionPercent, 0);
  assert.equal(custom25.platformCommissionToman, 0);
  assert.equal(custom25.salonNetDepositCreditedToman, 100_000);
});

test('resolveBusinessCommissionMeta differentiates Men, Laser, and Women segments while enforcing 0% commission in the subscription model', () => {
  const menMeta = resolveBusinessCommissionMeta({
    type: BusinessType.MenBarbershop,
    typeLabel: 'آرایشگاه مردانه',
    categorySlug: 'mens-barbershop',
    targetGender: 'MALE',
    name: 'پیرایش رویال',
  });
  assert.equal(menMeta.segment, 'MEN');
  assert.equal(menMeta.commissionPercent, 0);

  const laserMeta = resolveBusinessCommissionMeta({
    type: BusinessType.WomenSalon,
    typeLabel: 'مرکز لیزر موهای زائد',
    categorySlug: 'laser-hair-removal',
    targetGender: 'BOTH',
    name: 'کلینیک لیزر الکساندرایت',
  });
  assert.equal(laserMeta.segment, 'LASER');
  assert.equal(laserMeta.commissionPercent, 0);

  const womenMeta = resolveBusinessCommissionMeta({
    type: BusinessType.WomenSalon,
    typeLabel: 'سالن زیبایی زنانه',
    categorySlug: 'hair-color',
    targetGender: 'FEMALE',
    name: 'سالن زیبایی گلها',
  });
  assert.equal(womenMeta.segment, 'WOMEN');
  assert.equal(womenMeta.commissionPercent, 0);
});

test('calculateBookingFinancialBreakdown computes exact 1M service with 20% deposit, 2% Zibal+Tax customer fee, and 0% salon commission (100% deposit credited)', () => {
  const result = calculateBookingFinancialBreakdown({
    totalServicePriceToman: 1_000_000,
    depositPercent: 20,
    business: {
      type: BusinessType.WomenSalon,
      typeLabel: 'سالن زیبایی زنانه',
      categorySlug: 'hair-color',
      targetGender: 'FEMALE',
      name: 'سالن زیبایی گلها',
    },
  });

  // ۲۰٪ از ۱,۰۰۰,۰۰۰ تومان = ۲۰۰,۰۰۰ تومان بیعانه پایه
  assert.equal(result.baseDepositToman, 200_000);
  // الباقی حضوری در سالن = ۸۰۰,۰۰۰ تومان
  assert.equal(result.remainingInSalonToman, 800_000);
  // ۱٪ زیبال (حداقل ۲,۲۰۰) = ۲,۲۰۰ تومان + ۱٪ مالیات (۲,۰۰۰ تومان) = ۴,۲۰۰ تومان
  assert.equal(result.zibalGatewayFeeToman, 2_200);
  assert.equal(result.valueAddedTaxFeeToman, 2_000);
  assert.equal(result.customerGatewayAndTaxFeeToman, 4_200);
  // پرداختی کل مشتری در درگاه = ۲۰۴,۲۰۰ تومان
  assert.equal(result.totalCustomerOnlinePayableToman, 204_200);
  // در مدل اشتراک ماهانه، کمیسیون کسرشده از سالن ۰٪ است و ۱۰۰٪ بیعانه (۲۰۰,۰۰۰ تومان) به کیف پول سالن واریز می‌شود
  assert.equal(result.platformCommissionPercent, 0);
  assert.equal(result.platformCommissionToman, 0);
  assert.equal(result.salonNetDepositCreditedToman, 200_000);
});

test('resolveBusinessSubscriptionQuotaStatus tracks 10 free trial bookings and 3 monthly subscription packages (690k, 1,090k, 1,690k)', () => {
  assert.equal(FREE_TRIAL_BOOKING_QUOTA, 10);
  assert.equal(TIMETO_MONTHLY_PACKAGES.length, 3);
  assert.equal(TIMETO_MONTHLY_PACKAGES[0].monthlyPriceToman, 690_000);
  assert.equal(TIMETO_MONTHLY_PACKAGES[0].monthlyBookingCap, 50);
  assert.equal(TIMETO_MONTHLY_PACKAGES[0].canCreateComboPackages, true);
  assert.equal(TIMETO_MONTHLY_PACKAGES[0].canPublishStories, false);
  assert.equal(TIMETO_MONTHLY_PACKAGES[0].adDiscountPercent, 0);

  assert.equal(TIMETO_MONTHLY_PACKAGES[1].monthlyPriceToman, 1_090_000);
  assert.equal(TIMETO_MONTHLY_PACKAGES[1].monthlyBookingCap, 130);
  assert.equal(TIMETO_MONTHLY_PACKAGES[1].canCreateComboPackages, true);
  assert.equal(TIMETO_MONTHLY_PACKAGES[1].canPublishStories, true);
  assert.equal(TIMETO_MONTHLY_PACKAGES[1].adDiscountPercent, 15);

  assert.equal(TIMETO_MONTHLY_PACKAGES[2].monthlyPriceToman, 1_690_000);
  assert.equal(TIMETO_MONTHLY_PACKAGES[2].monthlyBookingCap, 400);
  assert.equal(TIMETO_MONTHLY_PACKAGES[2].canCreateComboPackages, true);
  assert.equal(TIMETO_MONTHLY_PACKAGES[2].canPublishStories, true);
  assert.equal(TIMETO_MONTHLY_PACKAGES[2].adDiscountPercent, 30);

  // ۱. وضعیت ۱۰ نوبت هدیه شروع (مثلاً ۳ نوبت استفاده شده -> ۷ نوبت باقی‌مانده)
  const sampleAppointments = Array.from({ length: 3 }, () => ({
    businessId: 'biz-trial',
    businessSlug: 'trial-salon',
    businessName: 'سالن تست',
    status: AppointmentStatus.Confirmed,
  }));
  const trialStatus = resolveBusinessSubscriptionQuotaStatus({
    business: {
      id: 'biz-trial',
      slug: 'trial-salon',
      name: 'سالن تست',
      subscriptionPlan: '',
    },
    appointments: sampleAppointments,
  });
  assert.equal(trialStatus.isFreeTrial, true);
  assert.equal(trialStatus.quotaLimit, 10);
  assert.equal(trialStatus.remainingBookingsCount, 7);
  assert.equal(trialStatus.isQuotaExhausted, false);
  assert.equal(trialStatus.canCreateComboPackages, true);
  assert.equal(trialStatus.canPublishStories, false);

  // ۲. وضعیت پکیج حرفه‌ای (تا ۱۳۰ نوبت، استوری فعال، ۱۵٪ تخفیف بنر، تا ۳ متخصص)
  const proStatus = resolveBusinessSubscriptionQuotaStatus({
    business: {
      id: 'biz-pro',
      slug: 'pro-salon',
      name: 'سالن حرفه‌ای',
      subscriptionPlan: 'پکیج حرفه‌ای ⭐ (پرفروش)',
    },
    activePlanId: 'plan-professional',
    appointments: Array.from({ length: 25 }, () => ({
      businessId: 'biz-pro',
      businessSlug: 'pro-salon',
      businessName: 'سالن حرفه‌ای',
      status: AppointmentStatus.Completed,
    })),
  });
  assert.equal(proStatus.isFreeTrial, false);
  assert.equal(proStatus.quotaLimit, 130);
  assert.equal(proStatus.remainingBookingsCount, 105);
  assert.equal(proStatus.canPublishStories, true);
  assert.equal(proStatus.adDiscountPercent, 15);
  assert.equal(proStatus.staffLimitCount, 3);
  assert.equal(getPlanStaffLimitCount('پکیج حرفه‌ای'), 3);
  assert.equal(getPlanStaffLimitCount('پکیج VIP'), 10);
  assert.equal(getPlanStaffLimitCount('پکیج پایه'), 1);
});

test('computeAdPackagePriceAndTitle enforces 7-day and 14-day (2-week maximum) durations and applies 15% / 30% subscription discounts', () => {
  // حتی اگر ۳۰ روز پاس داده شود، سقف مجاز همان ۱۴ روز (۲ هفته) است
  const search14Base = computeAdPackagePriceAndTitle({
    placementSlot: 'SEARCH_TOP',
    durationDays: 30,
    discountPercent: 0,
  });
  assert.equal(search14Base.normalizedDurationDays, 14);
  assert.equal(search14Base.originalAmountToman, 990_000);
  assert.equal(search14Base.amountToman, 990_000);

  const search7ProDiscount = computeAdPackagePriceAndTitle({
    placementSlot: 'SEARCH_TOP',
    durationDays: 7,
    discountPercent: 15,
  });
  assert.equal(search7ProDiscount.normalizedDurationDays, 7);
  assert.equal(search7ProDiscount.originalAmountToman, 590_000);
  assert.equal(search7ProDiscount.discountPercent, 15);
  assert.equal(search7ProDiscount.amountToman, Math.round(590_000 * 0.85));

  const banner14VipDiscount = computeAdPackagePriceAndTitle({
    placementSlot: 'HOME_BANNER',
    durationDays: 14,
    discountPercent: 30,
  });
  assert.equal(banner14VipDiscount.normalizedDurationDays, 14);
  assert.equal(banner14VipDiscount.originalAmountToman, 1_490_000);
  assert.equal(banner14VipDiscount.discountPercent, 30);
  assert.equal(banner14VipDiscount.amountToman, Math.round(1_490_000 * 0.7));
});

test('validateServiceAntiFraud blocks fake low prices, phone numbers, @ handles, and circumvention keywords', () => {
  const lowPrice = validateServiceAntiFraud({
    title: 'رنگ و لایت مو',
    description: 'تخصصی',
    priceToman: 15_000,
  });
  assert.equal(lowPrice.valid, false);

  const phoneInDesc = validateServiceAntiFraud({
    title: 'کاشت ناخن',
    description: 'برای هماهنگی با 09121234567 تماس بگیرید',
    priceToman: 350_000,
  });
  assert.equal(phoneInDesc.valid, false);

  const instaInDesc = validateServiceAntiFraud({
    title: 'میکاپ عروس',
    description: 'پیج ما @royal_salon_esf',
    priceToman: 1_500_000,
  });
  assert.equal(instaInDesc.valid, false);

  const circumventionText = validateServiceAntiFraud({
    title: 'کراتین مو (قیمت توافقی)',
    description: 'بدون بیعانه',
    priceToman: 500_000,
  });
  assert.equal(circumventionText.valid, false);

  const validService = validateServiceAntiFraud({
    title: 'لایت و آمبره تخصصی مو',
    description: 'با مواد ایتالیایی بدون آسیب',
    priceToman: 950_000,
  });
  assert.equal(validService.valid, true);
});

test('isAppointmentEligibleForSettlement blocks future appointments and allows completed or past appointments', () => {
  const futurePending = isAppointmentEligibleForSettlement({
    id: 'apt-1',
    referenceCode: 'TM-100',
    businessId: 'biz-1',
    businessSlug: 'royal',
    businessName: 'سالن رویال',
    customerName: 'سارا',
    customerPhoneMasked: '09131112233',
    serviceId: 'srv-1',
    serviceTitle: 'کاشت ناخن',
    specialistId: 'spc-1',
    specialistName: 'نگار',
    dateJalali: '۱۴۰۹/۱۲/۲۵',
    timeSlot: '۱۶:۰۰',
    durationMinutes: 60,
    priceToman: 500_000,
    depositPaidToman: 150_000,
    status: AppointmentStatus.Confirmed,
  });
  assert.equal(futurePending, false);

  const completedApt = isAppointmentEligibleForSettlement({
    id: 'apt-2',
    referenceCode: 'TM-101',
    businessId: 'biz-1',
    businessSlug: 'royal',
    businessName: 'سالن رویال',
    customerName: 'سارا',
    customerPhoneMasked: '09131112233',
    serviceId: 'srv-1',
    serviceTitle: 'کاشت ناخن',
    specialistId: 'spc-1',
    specialistName: 'نگار',
    dateJalali: '۱۴۰۹/۱۲/۲۵',
    timeSlot: '۱۶:۰۰',
    durationMinutes: 60,
    priceToman: 500_000,
    depositPaidToman: 150_000,
    status: AppointmentStatus.Completed,
  });
  assert.equal(completedApt, true);
});

test('resolveAppointmentFinancialBreakdown resolves mandatory online deposit with 0% commission (100% credited to wallet)', () => {
  const dbAptWithoutDeposit = resolveAppointmentFinancialBreakdown({
    appointment: {
      priceToman: 650_000,
      depositPaidToman: 0,
    },
    business: {
      type: BusinessType.MenBarbershop,
      typeLabel: 'پیرایش مردانه',
      categorySlug: 'mens-barbershop',
      targetGender: 'MALE',
      name: 'پیرایش VIP',
      depositPercent: 30,
    },
  });

  // ۳۰٪ از ۶۵۰,۰۰۰ تومان = ۱۹۵,۰۰۰ تومان بیعانه دریافتی آنلاین
  assert.equal(dbAptWithoutDeposit.baseDepositToman, 195_000);
  // الباقی حضوری در سالن = ۴۵۵,۰۰۰ تومان
  assert.equal(dbAptWithoutDeposit.remainingInSalonToman, 455_000);
  // کمیسیون کسرشده از سالن = ۰ تومان (۰٪)
  assert.equal(dbAptWithoutDeposit.platformCommissionToman, 0);
  // ۱۰۰٪ بیعانه پایه به کیف پول سالن‌دار واریز می‌شود = ۱۹۵,۰۰۰ تومان
  assert.equal(dbAptWithoutDeposit.salonNetDepositCreditedToman, 195_000);
});

test('formatCompactPriceToman and formatCustomerWorkingHourMinimal format thousands (<1M) and millions (>=1M) clearly', () => {
  assert.equal(formatCompactPriceToman(200_000), '۲۰۰ هزار تومان');
  assert.equal(formatCompactPriceToman(400_000), '۴۰۰ هزار تومان');
  assert.equal(formatCompactPriceToman(1_000_000), '۱ میلیون تومان');
  assert.equal(formatCompactPriceToman(1_500_000), '۱.۵ میلیون تومان');
  assert.equal(formatCompactPriceToman(1_250_000), '۱.۲۵ میلیون تومان');
  assert.equal(
    formatServicePriceShort({ priceToman: 350_000, pricingType: 'FIXED' }),
    '۳۵۰ هزار تومان'
  );
  assert.equal(
    formatServicePriceShort({
      priceToman: 800_000,
      maxPriceToman: 1_500_000,
      pricingType: 'RANGE',
    }),
    '۸۰۰ هزار تا ۱.۵ میلیون تومان'
  );
  assert.equal(
    formatServicePriceShort({
      priceToman: 1_200_000,
      maxPriceToman: 2_500_000,
      pricingType: 'RANGE',
    }),
    '۱.۲ تا ۲.۵ میلیون تومان'
  );
  assert.equal(
    formatCustomerWorkingHourMinimal({
      dayName: 'شنبه',
      isOpen: true,
      openTime: '۰۹:۳۰',
      closeTime: '۱۳:۳۰',
      hasBreak: true,
      secondOpenTime: '۱۶:۰۰',
      secondCloseTime: '۲۱:۰۰',
    }),
    '۰۹:۳۰ تا ۱۳:۳۰ · ۱۶:۰۰ تا ۲۱:۰۰'
  );
});

test('buildCustomerBookingTimeSlots generates both morning and afternoon shift slots when midday break is active', () => {
  const twoShiftDay = {
    dayName: 'شنبه',
    isOpen: true,
    openTime: '۰۹:۳۰',
    closeTime: '۱۳:۳۰',
    hasBreak: true,
    secondOpenTime: '۱۶:۰۰',
    secondCloseTime: '۲۱:۰۰',
  };
  const schedule = buildCustomerBookingTimeSlots({
    dayWorkingHour: twoShiftDay,
    serverSlots: [
      { time: '۰۹:۳۰', available: true },
      { time: '۱۰:۰۰', available: true },
      { time: '۱۰:۳۰', available: true },
      { time: '۱۱:۰۰', available: true },
      { time: '۱۱:۳۰', available: true },
      { time: '۱۲:۰۰', available: true },
      { time: '۱۲:۳۰', available: true },
      { time: '۱۳:۰۰', available: true },
    ],
    durationMinutes: 30,
  });

  assert.equal(schedule.morningSlots.length > 0, true);
  assert.equal(schedule.afternoonSlots.length > 0, true);
  assert.equal(
    schedule.morningSlots.some((s) => s.time === '۰۹:۳۰' && s.available),
    true
  );
  assert.equal(
    schedule.afternoonSlots.some((s) => s.time === '۱۶:۰۰' && s.available),
    true
  );
  assert.equal(
    schedule.afternoonSlots.some((s) => s.time === '۲۰:۳۰' && s.available),
    true
  );
  assert.equal(
    schedule.allSlots.some((s) => s.time === '۱۴:۳۰'),
    false
  );

  const dbTruncatedDay = {
    dayName: 'یکشنبه',
    isOpen: true,
    openTime: '۰۹:۳۰',
    closeTime: '۱۳:۳۰',
  };
  const recovered = resolveEffectiveWorkingHour(dbTruncatedDay);
  assert.equal(recovered?.hasBreak, true);
  assert.equal(recovered?.secondOpenTime, '۱۶:۰۰');
  assert.equal(recovered?.secondCloseTime, '۲۱:۰۰');
  assert.equal(
    formatWorkingHourDisplay(dbTruncatedDay),
    'شیفت صبح: ۰۹:۳۰ تا ۱۳:۳۰ | شیفت عصر: ۱۶:۰۰ تا ۲۱:۰۰'
  );
});

test('formatPriceToman never returns رایگان and 400,000 Toman service with 30% deposit yields exact 120,000 deposit, 0 commission, 120,000 net payable, and 280,000 in-person', () => {
  assert.equal(formatPriceToman(0), '۰ تومان');
  assert.equal(formatPriceToman(-500), '۰ تومان');

  const jaziniBreakdown = resolveAppointmentFinancialBreakdown({
    appointment: {
      priceToman: 400_000,
      depositPaidToman: 120_000,
    },
    business: {
      type: BusinessType.MenBarbershop,
      typeLabel: 'آرایشگاه مردانه',
      categorySlug: 'mens-barbershop',
      targetGender: 'MALE',
      name: 'سالن امیرحسین جزینی',
      depositPercent: 30,
    },
  });

  assert.equal(jaziniBreakdown.totalServicePriceToman, 400_000);
  assert.equal(jaziniBreakdown.depositPercent, 30);
  assert.equal(jaziniBreakdown.baseDepositToman, 120_000);
  assert.equal(jaziniBreakdown.remainingInSalonToman, 280_000);
  assert.equal(jaziniBreakdown.platformCommissionPercent, 0);
  assert.equal(jaziniBreakdown.platformCommissionToman, 0);
  assert.equal(jaziniBreakdown.salonNetDepositCreditedToman, 120_000);
});
