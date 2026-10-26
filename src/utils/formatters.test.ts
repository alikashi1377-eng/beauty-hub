import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterBusinesses,
  formatDurationMinutes,
  formatPriceToman,
  getAppointmentStatusMeta,
  toPersianDigits,
  validateBusinessRegistrationDraft,
  validateServiceForm,
} from './formatters';
import { AppointmentStatus, BusinessType } from '../types';
import { SAMPLE_BUSINESSES } from '../mocks/sampleData';

test('toPersianDigits converts ASCII digits to Persian numerals accurately', () => {
  assert.equal(toPersianDigits(1405), '۱۴۰۵');
  assert.equal(toPersianDigits('09123456789'), '۰۹۱۲۳۴۵۶۷۸۹');
});

test('formatPriceToman formats currency in Toman with Persian numerals and handles free tier', () => {
  assert.equal(formatPriceToman(650000), '۶۵۰,۰۰۰ تومان');
  assert.equal(formatPriceToman(0), 'رایگان');
  assert.equal(formatPriceToman(-100), 'رایگان');
});

test('formatDurationMinutes formats duration in Persian', () => {
  assert.equal(formatDurationMinutes(45), '۴۵ دقیقه');
  assert.equal(formatDurationMinutes(0), '۰ دقیقه');
});

test('getAppointmentStatusMeta returns explicit Persian status labels', () => {
  const confirmed = getAppointmentStatusMeta(AppointmentStatus.Confirmed);
  assert.equal(confirmed.label, 'تاییدشده');
  assert.equal(confirmed.tone, 'success');

  const pending = getAppointmentStatusMeta(AppointmentStatus.Pending);
  assert.equal(pending.label, 'در انتظار تایید');
  assert.equal(pending.tone, 'warning');
});

test('filterBusinesses filters by type, city, category, price, rating, and sorts accurately', () => {
  const womenSalons = filterBusinesses(SAMPLE_BUSINESSES, {
    type: BusinessType.WomenSalon,
  });
  assert.equal(womenSalons.length, 3);

  const isfahanResults = filterBusinesses(SAMPLE_BUSINESSES, {
    city: 'اصفهان',
    query: 'نظر شرقی',
  });
  assert.equal(isfahanResults.length, 1);
  assert.equal(isfahanResults[0].slug, 'sara-rad');

  const categoryResults = filterBusinesses(SAMPLE_BUSINESSES, {
    categorySlug: 'nails',
  });
  assert.equal(categoryResults.length, 1);
  assert.equal(categoryResults[0].slug, 'niloofar-abi');

  const sortedByPrice = filterBusinesses(SAMPLE_BUSINESSES, {
    sortBy: 'price_asc',
  });
  assert.ok(
    sortedByPrice[0].startingPriceToman <= sortedByPrice[1].startingPriceToman
  );
});

test('validateBusinessRegistrationDraft and validateServiceForm validate required inputs', () => {
  const invalidReg = validateBusinessRegistrationDraft({
    businessName: 'اب',
    ownerName: '',
    phone: '12345',
    city: '',
    slug: 'Invalid Slug!',
  });
  assert.equal(invalidReg.isValid, false);

  const validService = validateServiceForm({
    title: 'هیدرافیشیال تخصصی',
    category: 'پوست و فیشیال',
    durationMinutes: 60,
    priceToman: 850000,
  });
  assert.equal(validService.isValid, true);
});

test('Estedad and Plus Jakarta Sans local variable fonts and design tokens are configured accurately', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { DESIGN_TOKENS } = await import('../config/designTokens');

  assert.equal(DESIGN_TOKENS.typography.fontFamily.includes('Estedad'), true);
  assert.equal(
    DESIGN_TOKENS.typography.fontFamily.includes('Plus Jakarta Sans'),
    true
  );
  assert.equal(DESIGN_TOKENS.typography.weights.regular, 400);
  assert.equal(DESIGN_TOKENS.typography.weights.medium, 500);
  assert.equal(DESIGN_TOKENS.typography.weights.semibold, 600);
  assert.equal(DESIGN_TOKENS.typography.weights.bold, 700);

  const requiredFontFiles = [
    'public/fonts/Estedad-Variable.woff2',
    'public/fonts/Estedad-Regular.woff2',
    'public/fonts/Estedad-Medium.woff2',
    'public/fonts/Estedad-SemiBold.woff2',
    'public/fonts/Estedad-Bold.woff2',
    'public/fonts/PlusJakartaSans-Variable.woff2',
  ];

  for (const relPath of requiredFontFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    assert.equal(fs.existsSync(fullPath), true, `Missing font file: ${relPath}`);
    const buf = fs.readFileSync(fullPath);
    assert.equal(
      buf.subarray(0, 4).toString('ascii'),
      'wOF2',
      `Invalid wOF2 header in ${relPath}`
    );
  }

  const indexCss = fs.readFileSync(
    path.join(process.cwd(), 'src/index.css'),
    'utf8'
  );
  assert.equal(indexCss.includes("font-family: 'Estedad'"), true);
  assert.equal(indexCss.includes("font-family: 'Plus Jakarta Sans'"), true);
  assert.equal(indexCss.includes('Vazirmatn'), false);

  const indexHtml = fs.readFileSync(
    path.join(process.cwd(), 'index.html'),
    'utf8'
  );
  assert.equal(indexHtml.includes('/fonts/Estedad-Variable.woff2'), true);
  assert.equal(indexHtml.includes('Vazirmatn'), false);
});

test('Jalali calendar engine validates leap years, month lengths (31/30/29), and rejects invalid dates without fallback', async () => {
  const {
    isJalaliLeapYear,
    getJalaliMonthLength,
    parseAndValidateJalaliDate,
    jalaliDateToGregorianIsoDate,
  } = await import('../../server/repositories/beautyhubRepository');

  // بررسی سال‌های کبیسه و عادی
  assert.equal(isJalaliLeapYear(1399), true);
  assert.equal(isJalaliLeapYear(1400), false);
  assert.equal(isJalaliLeapYear(1403), true);
  assert.equal(isJalaliLeapYear(1404), false);
  assert.equal(isJalaliLeapYear(1405), false);

  // بررسی طول ماه‌های شمسی (۶ ماه اول ۳۱ روز، ماه ۷ تا ۱۱ برابر ۳۰ روز، اسفند ۲۹ یا ۳۰ روز)
  for (let m = 1; m <= 6; m++) {
    assert.equal(getJalaliMonthLength(1405, m), 31);
  }
  for (let m = 7; m <= 11; m++) {
    assert.equal(getJalaliMonthLength(1405, m), 30);
  }
  assert.equal(getJalaliMonthLength(1403, 12), 30);
  assert.equal(getJalaliMonthLength(1404, 12), 29);
  assert.equal(getJalaliMonthLength(1405, 12), 29);

  // تبدیل دقیق تاریخ‌های مرزی سال کبیسه و نیمه دوم سال (رفع خطای ۶ روزه فرمول تقریبی قبلی)
  assert.equal(jalaliDateToGregorianIsoDate('۱۳۹۹/۱۲/۳۰'), '2021-03-20');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۰/۰۱/۰۱'), '2021-03-21');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۳/۱۲/۳۰'), '2025-03-20');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۴/۰۱/۰۱'), '2025-03-21');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۴/۱۲/۲۹'), '2026-03-20');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۵/۰۱/۰۱'), '2026-03-21');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۵/۰۶/۳۱'), '2026-09-22');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۵/۰۷/۰۱'), '2026-09-23');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۵/۰۸/۰۳'), '2026-10-25');
  assert.equal(jalaliDateToGregorianIsoDate('۱۴۰۵/۰۸/۰۴'), '2026-10-26');
  assert.equal(jalaliDateToGregorianIsoDate('1405/12/29'), '2027-03-20');

  // رد کردن تاریخ‌های نامعتبر بدون بازگشت پنهان به new Date()
  const invalidDates = [
    '',
    'invalid-date',
    '2026-10-26',
    '۱۴۰۵/۰۰/۱۰',
    '۱۴۰۵/۱۳/۰۱',
    '۱۴۰۵/۰۱/۳۲',
    '۱۴۰۵/۰۷/۳۱', // مهر ۳۰ روزه است
    '۱۴۰۵/۰۸/۳۱', // آبان ۳۰ روزه است
    '۱۴۰۴/۱۲/۳۰', // ۱۴۰۴ کبیسه نیست
    '۱۴۰۵/۱۲/۳۰', // ۱۴۰۵ کبیسه نیست
    '۱۴۰۳/۱۲/۳۱', // اسفند حتی در سال کبیسه حداکثر ۳۰ روز است
    '۱۴۰۵/۰۸/۰۰',
  ];

  for (const badDate of invalidDates) {
    assert.throws(
      () => parseAndValidateJalaliDate(badDate),
      (err: unknown) =>
        err instanceof Error && err.message === 'INVALID_INPUT_PAYLOAD',
      `Expected INVALID_INPUT_PAYLOAD for invalid Jalali date: ${badDate}`
    );
  }
});

test('jalaliSlotToTimestamptz and jalaliDateToIranDayOfWeek compute exact Asia/Tehran (+03:30) timestamps and weekdays', async () => {
  const {
    jalaliSlotToTimestamptz,
    jalaliDateToIranDayOfWeek,
  } = await import('../../server/repositories/beautyhubRepository');

  // ۱۴۰۵/۰۸/۰۳ برابر با 2026-10-25 (یکشنبه) است؛ ساعت ۱۱:۰۰ به وقت تهران (+03:30) برابر با 07:30 UTC است
  const dt1 = jalaliSlotToTimestamptz('۱۴۰۵/۰۸/۰۳', '۱۱:۰۰');
  assert.equal(dt1.toISOString(), '2026-10-25T07:30:00.000Z');

  // ۱۴۰۵/۰۸/۰۴ برابر با 2026-10-26 (دوشنبه) است؛ ساعت ۱۰:۳۰ به وقت تهران برابر با 07:00 UTC است
  const dt2 = jalaliSlotToTimestamptz('۱۴۰۵/۰۸/۰۴', '۱۰:۳۰');
  assert.equal(dt2.toISOString(), '2026-10-26T07:00:00.000Z');

  // بررسی مرزهای نیمه‌شب به وقت تهران (۰۰:۱۵ بامداد -> ۲۰:۴۵ روز قبل به وقت UTC؛ ۲۳:۴۵ شب -> ۲۰:۱۵ همان روز به وقت UTC)
  const dtEarlyMorning = jalaliSlotToTimestamptz('۱۴۰۵/۰۸/۰۴', '۰۰:۱۵');
  assert.equal(dtEarlyMorning.toISOString(), '2026-10-25T20:45:00.000Z');

  const dtLateNight = jalaliSlotToTimestamptz('۱۴۰۵/۰۸/۰۴', '۲۳:۴۵');
  assert.equal(dtLateNight.toISOString(), '2026-10-26T20:15:00.000Z');

  // بررسی تطابق کامل با تقویم فارسی استاندارد Intl در منطقه زمانی Asia/Tehran
  const intlParts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt2);
  const partMap = Object.fromEntries(intlParts.map((p) => [p.type, p.value]));
  assert.equal(partMap.year, '1405');
  assert.equal(partMap.month, '08');
  assert.equal(partMap.day, '04');
  assert.equal(partMap.hour, '10');
  assert.equal(partMap.minute, '30');

  // بررسی دقیق هر ۷ روز هفته ایران (۰ = شنبه تا ۶ = جمعه)
  const expectedWeek = [
    { date: '۱۴۰۵/۰۸/۰۲', dayOfWeek: 0, dayName: 'شنبه' },
    { date: '۱۴۰۵/۰۸/۰۳', dayOfWeek: 1, dayName: 'یکشنبه' },
    { date: '۱۴۰۵/۰۸/۰۴', dayOfWeek: 2, dayName: 'دوشنبه' },
    { date: '۱۴۰۵/۰۸/۰۵', dayOfWeek: 3, dayName: 'سه‌شنبه' },
    { date: '۱۴۰۵/۰۸/۰۶', dayOfWeek: 4, dayName: 'چهارشنبه' },
    { date: '۱۴۰۵/۰۸/۰۷', dayOfWeek: 5, dayName: 'پنج‌شنبه' },
    { date: '۱۴۰۵/۰۸/۰۸', dayOfWeek: 6, dayName: 'جمعه' },
  ];

  for (const item of expectedWeek) {
    const res = jalaliDateToIranDayOfWeek(item.date);
    assert.equal(res.dayOfWeek, item.dayOfWeek, `Mismatch dayOfWeek for ${item.date}`);
    assert.equal(res.dayName, item.dayName, `Mismatch dayName for ${item.date}`);
  }

  // رد کردن ساعت‌های نامعتبر
  for (const badTime of ['', '24:00', '25:30', '10:60', '10:30abc', '-1:00']) {
    assert.throws(
      () => jalaliSlotToTimestamptz('۱۴۰۵/۰۸/۰۴', badTime),
      (err: unknown) =>
        err instanceof Error && err.message === 'INVALID_INPUT_PAYLOAD',
      `Expected INVALID_INPUT_PAYLOAD for invalid timeSlot: ${badTime}`
    );
  }
});

test('computeSelectedServicesSummary aggregates multiple selected services, combined title, total duration, and total price', async () => {
  const { computeSelectedServicesSummary } = await import('./formatters');
  const { SAMPLE_SERVICES } = await import('../mocks/sampleData');

  const bizServices = SAMPLE_SERVICES.filter((s) => s.businessId === 'biz-1');
  assert.ok(bizServices.length >= 2);

  const first = bizServices[0];
  const second = bizServices[1];

  const multiSummary = computeSelectedServicesSummary(
    bizServices,
    [first.id, second.id],
    first.id
  );

  assert.equal(multiSummary.services.length, 2);
  assert.equal(
    multiSummary.combinedTitle,
    `${first.title} + ${second.title}`
  );
  assert.equal(
    multiSummary.totalDurationMinutes,
    first.durationMinutes + second.durationMinutes
  );
  assert.equal(
    multiSummary.totalPriceToman,
    first.priceToman + second.priceToman
  );
});


