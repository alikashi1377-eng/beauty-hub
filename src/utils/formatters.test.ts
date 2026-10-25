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

