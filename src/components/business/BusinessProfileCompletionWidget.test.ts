import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBusinessProfileCompletion } from './BusinessProfileCompletionWidget';
import { BusinessItem, BusinessType, SubscriptionStatus } from '../../types';

const baseBusiness: BusinessItem = {
  id: 'biz-test-1',
  slug: 'test-salon',
  name: 'سالن تست',
  type: BusinessType.WomenSalon,
  typeLabel: 'سالن زیبایی زنانه',
  categorySlug: 'hair-color',
  city: 'اصفهان',
  neighborhood: 'درچه',
  address: 'اصفهان، درچه، خیابان اصلی',
  phoneDisplay: '09131234567',
  rating: 4.9,
  reviewCount: 10,
  startingPriceToman: 350000,
  shortDescription: 'توضیح کوتاه سالن زیبایی',
  aboutText: 'توضیحات کامل درباره سالن زیبایی تست با بیش از بیست و پنج کاراکتر',
  verifiedBadge: true,
  approvalStatus: 'APPROVED',
  subscriptionPlan: 'شروع رایگان',
  subscriptionStatus: SubscriptionStatus.Trial,
  workingHours: [
    { dayName: 'شنبه', isOpen: true, openTime: '09:00', closeTime: '18:00' },
  ],
  visualTheme: 'rose',
  mapLat: 32.6,
  mapLng: 51.6,
  avatarUrl: 'https://example.com/photo.jpg',
  instagramHandle: '@test.salon',
};

test('computeBusinessProfileCompletion returns only incomplete steps and 100% when all completed', () => {
  const partial = computeBusinessProfileCompletion({
    business: { ...baseBusiness, workingHoursConfigured: false },
    services: [],
    specialists: [],
    gallery: [],
    plans: [],
  });

  // Only basic_location (20%) is complete; services (25%), working_hours (20%), specialists (20%), media_bio (15%) are incomplete
  assert.equal(partial.totalPercent, 20);
  assert.equal(partial.incompleteSteps.length, 4);
  assert.equal(
    partial.incompleteSteps.some((s) => s.id === 'basic_location'),
    false
  );

  const complete = computeBusinessProfileCompletion({
    business: { ...baseBusiness, workingHoursConfigured: true },
    services: [
      {
        id: 's1',
        businessId: 'biz-test-1',
        categorySlug: 'hair-color',
        title: 'کوتاهی مو',
        category: 'مو و رنگ',
        durationMinutes: 45,
        priceToman: 350000,
        description: '',
        isActive: true,
      },
    ],
    specialists: [
      {
        id: 'sp1',
        businessId: 'biz-test-1',
        slug: 'sp-1',
        fullName: 'مریم رضایی',
        roleTitle: 'متخصص مو',
        experienceYears: 5,
        rating: 5,
        reviewCount: 4,
        specialties: ['کوتاهی'],
        bio: '',
        isIndependent: false,
        isActive: true,
      },
    ],
    gallery: [
      {
        id: 'g1',
        businessId: 'biz-test-1',
        title: 'نمونه ۱',
        categoryLabel: 'مو',
        theme: 'rose',
      },
    ],
    plans: [],
  });

  assert.equal(complete.totalPercent, 100);
  assert.equal(complete.incompleteSteps.length, 0);
  assert.equal(complete.nextIncompleteStep, null);
});
