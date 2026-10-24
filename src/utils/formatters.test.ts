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

  const shirazResults = filterBusinesses(SAMPLE_BUSINESSES, {
    city: 'شیراز',
  });
  assert.equal(shirazResults.length, 1);
  assert.equal(shirazResults[0].slug, 'sara-rad');

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
