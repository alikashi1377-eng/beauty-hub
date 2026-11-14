import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_DEPOSIT_PERCENTS,
  calculateBookingFinancialBreakdown,
  isAppointmentEligibleForSettlement,
  normalizeDepositPercent,
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
