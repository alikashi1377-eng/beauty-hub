import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_DEPOSIT_PERCENTS,
  calculateBookingFinancialBreakdown,
  isAppointmentEligibleForSettlement,
  normalizeDepositPercent,
  resolveAppointmentFinancialBreakdown,
  resolveBusinessCommissionMeta,
  validateServiceAntiFraud,
} from './financialEngine';
import { AppointmentStatus, BusinessType } from '../types';

test('normalizeDepositPercent strictly maps to [20, 30, 50, 100] and never allows 0 or arbitrary values', () => {
  assert.deepEqual(ALLOWED_DEPOSIT_PERCENTS, [20, 30, 50, 100]);
  assert.equal(normalizeDepositPercent(0), 30);
  assert.equal(normalizeDepositPercent(undefined), 30);
  assert.equal(normalizeDepositPercent(10), 20);
  assert.equal(normalizeDepositPercent(20), 20);
  assert.equal(normalizeDepositPercent(30), 30);
  assert.equal(normalizeDepositPercent(50), 50);
  assert.equal(normalizeDepositPercent(100), 100);
});

test('resolveBusinessCommissionMeta differentiates Men (3%), Laser (4%), and Women (5%) accurately', () => {
  const menMeta = resolveBusinessCommissionMeta({
    type: BusinessType.MenBarbershop,
    typeLabel: 'آرایشگاه مردانه',
    categorySlug: 'mens-barbershop',
    targetGender: 'MALE',
    name: 'پیرایش رویال',
  });
  assert.equal(menMeta.segment, 'MEN');
  assert.equal(menMeta.commissionPercent, 3);

  const laserMeta = resolveBusinessCommissionMeta({
    type: BusinessType.WomenSalon,
    typeLabel: 'مرکز لیزر موهای زائد',
    categorySlug: 'laser-hair-removal',
    targetGender: 'BOTH',
    name: 'کلینیک لیزر الکساندرایت',
  });
  assert.equal(laserMeta.segment, 'LASER');
  assert.equal(laserMeta.commissionPercent, 4);

  const womenMeta = resolveBusinessCommissionMeta({
    type: BusinessType.WomenSalon,
    typeLabel: 'سالن زیبایی زنانه',
    categorySlug: 'hair-color',
    targetGender: 'FEMALE',
    name: 'سالن زیبایی گلها',
  });
  assert.equal(womenMeta.segment, 'WOMEN');
  assert.equal(womenMeta.commissionPercent, 5);
});

test('calculateBookingFinancialBreakdown computes exact 1M service with 20% deposit, 2% Zibal+Tax customer fee, and 5% total-service commission', () => {
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
  // کمیسیون پلتفرم: ۵٪ از کل خدمت ۱,۰۰۰,۰۰۰ تومان = ۵۰,۰۰۰ تومان
  assert.equal(result.platformCommissionPercent, 5);
  assert.equal(result.platformCommissionToman, 50_000);
  // واریزی خالص به کیف پول سالن‌دار = ۲۰۰,۰۰۰ - ۵۰,۰۰۰ = ۱۵۰,۰۰۰ تومان
  assert.equal(result.salonNetDepositCreditedToman, 150_000);
});

test('calculateBookingFinancialBreakdown enforces 10,000 Toman minimum commission floor on Men 3% service', () => {
  const result = calculateBookingFinancialBreakdown({
    totalServicePriceToman: 200_000,
    depositPercent: 30,
    business: {
      type: BusinessType.MenBarbershop,
      typeLabel: 'پیرایش مردانه',
      categorySlug: 'mens-barbershop',
      targetGender: 'MALE',
      name: 'پیرایش داماد',
    },
  });

  // ۳۰٪ از ۲۰۰,۰۰۰ تومان = ۶۰,۰۰۰ تومان بیعانه
  assert.equal(result.baseDepositToman, 60_000);
  // ۳٪ از ۲۰۰,۰۰۰ تومان می‌شود ۶,۰۰۰ تومان اما کف کمیسیون ۱۰,۰۰۰ تومان است
  assert.equal(result.platformCommissionPercent, 3);
  assert.equal(result.platformCommissionToman, 10_000);
  // خالص واریزی به کیف پول آرایشگر = ۶۰,۰۰۰ - ۱۰,۰۰۰ = ۵۰,۰۰۰ تومان
  assert.equal(result.salonNetDepositCreditedToman, 50_000);
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

test('resolveAppointmentFinancialBreakdown resolves mandatory online deposit even when depositPaidToman is undefined or 0 (e.g. Moeid Panahi DB row)', () => {
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

  // ۳۰٪ از ۶۵۰,۰۰۰ تومان = ۱۹۵,۰۰۰ تومان بیعانه دریافتی آنلاین (هرگز ۰ یا رایگان نیست)
  assert.equal(dbAptWithoutDeposit.baseDepositToman, 195_000);
  // الباقی حضوری در سالن = ۴۵۵,۰۰۰ تومان
  assert.equal(dbAptWithoutDeposit.remainingInSalonToman, 455_000);
  // کمیسیون ۳٪ آقایان از ۶۵۰,۰۰۰ تومان = ۱۹,۵۰۰ تومان
  assert.equal(dbAptWithoutDeposit.platformCommissionToman, 19_500);
  // خالص واریزی به کیف پول سالن‌دار = ۱۹۵,۰۰۰ - ۱۹,۵۰۰ = ۱۷۵,۵۰۰ تومان
  assert.equal(dbAptWithoutDeposit.salonNetDepositCreditedToman, 175_500);
});

import {
  buildCustomerBookingTimeSlots,
  formatWorkingHourDisplay,
  resolveEffectiveWorkingHour,
} from './formatters';

test('buildCustomerBookingTimeSlots generates both morning and afternoon shift slots when midday break is active', () => {
  // حالت ۱: دو شیفته صریح (۰۹:۳۰ تا ۱۳:۳۰ و ۱۶:۰۰ تا ۲۱:۰۰)
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
  // ساعت ۱۴:۳۰ در تایم استراحت بین روز نباید جزو نوبت‌ها باشد
  assert.equal(
    schedule.allSlots.some((s) => s.time === '۱۴:۳۰'),
    false
  );

  // حالت ۲: بازیابی خودکار شیفت عصر وقتی در دیتابیس فقط closeTime = ۱۳:۳۰ بدون فیلد hasBreak برگشته باشد
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

test('calculateBookingFinancialBreakdown honors VIP Ambassador 0% commission waiver and custom 2% VIP rate', () => {
  const zeroWaiver = calculateBookingFinancialBreakdown({
    totalServicePriceToman: 1_000_000,
    depositPercent: 30,
    business: {
      type: BusinessType.WomenSalon,
      typeLabel: 'سالن زیبایی بانوان',
      categorySlug: 'hair-color',
      targetGender: 'FEMALE',
      name: 'سالن VIP رویال',
      isVipPartner: true,
      vipCommissionPercent: 0,
    },
  });
  assert.equal(zeroWaiver.baseDepositToman, 300_000);
  assert.equal(zeroWaiver.platformCommissionPercent, 0);
  assert.equal(zeroWaiver.platformCommissionToman, 0);
  assert.equal(zeroWaiver.salonNetDepositCreditedToman, 300_000);

  const customTwoPct = calculateBookingFinancialBreakdown({
    totalServicePriceToman: 1_000_000,
    depositPercent: 30,
    business: {
      type: BusinessType.WomenSalon,
      typeLabel: 'سالن زیبایی بانوان',
      categorySlug: 'hair-color',
      targetGender: 'FEMALE',
      name: 'سالن VIP رویال',
      isVipPartner: true,
      vipCommissionPercent: 2,
    },
  });
  assert.equal(customTwoPct.platformCommissionPercent, 2);
  assert.equal(customTwoPct.platformCommissionToman, 20_000);
  assert.equal(customTwoPct.salonNetDepositCreditedToman, 280_000);
});
