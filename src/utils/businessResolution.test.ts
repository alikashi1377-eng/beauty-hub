import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCurrentUserBusiness } from './businessResolution';
import { BusinessItem, BusinessType, SubscriptionStatus } from '../types';
import { AuthenticatedSessionUser } from '../services/apiClient';

const fallbackHours = [
  { dayName: 'شنبه', isOpen: true, openTime: '۱۰:۰۰', closeTime: '۲۰:۰۰' },
];

const otherOwnerBusiness: BusinessItem = {
  id: 'biz-other-1',
  slug: 'other-salon',
  name: 'سالن کاربر قبلی',
  type: BusinessType.WomenSalon,
  typeLabel: 'سالن زیبایی بانوان',
  categorySlug: 'hair-color',
  city: 'اصفهان',
  neighborhood: 'چهارباغ بالا',
  address: 'اصفهان، خیابان چهارباغ بالا',
  phoneDisplay: '09131112233',
  ownerName: 'کاربر قبلی',
  ownerPhone: '09131112233',
  rating: 4.8,
  reviewCount: 5,
  startingPriceToman: 500000,
  shortDescription: 'توضیح کاربر قبلی',
  aboutText: 'توضیح کاربر قبلی',
  verifiedBadge: true,
  approvalStatus: 'APPROVED',
  subscriptionPlan: 'شروع رایگان',
  subscriptionStatus: SubscriptionStatus.Trial,
  workingHours: fallbackHours,
  workingHoursConfigured: true,
  visualTheme: 'violet',
};

test('resolveCurrentUserBusiness NEVER leaks another user business when a new specialist logs in', () => {
  const newSpecialist: AuthenticatedSessionUser = {
    sessionId: 'sess-new-spec',
    userId: 'user-new-spec',
    fullName: 'زهرا کریمی',
    phone: '09139998877',
    defaultCity: 'اصفهان',
    roles: ['BUSINESS_OWNER'],
    isPlatformAdmin: false,
    businessMemberships: [],
  };

  // Even if stale ownedBusinessId points to the previous user's business, it must NOT be returned!
  const resolved = resolveCurrentUserBusiness({
    authUser: newSpecialist,
    ownedBusinessId: 'biz-other-1',
    businesses: [otherOwnerBusiness],
    fallbackWorkingHours: fallbackHours,
  });

  assert.ok(resolved);
  assert.notEqual(resolved.id, otherOwnerBusiness.id);
  assert.notEqual(resolved.name, otherOwnerBusiness.name);
  assert.equal(resolved.name, '');
  assert.equal(resolved.neighborhood, '');
  assert.equal(resolved.address, '');
  assert.equal(resolved.ownerPhone, '09139998877');
  assert.equal(resolved.ownerName, 'زهرا کریمی');
});

test('resolveCurrentUserBusiness returns null when logged out', () => {
  const resolved = resolveCurrentUserBusiness({
    authUser: null,
    ownedBusinessId: 'biz-other-1',
    businesses: [otherOwnerBusiness],
    fallbackWorkingHours: fallbackHours,
  });

  assert.equal(resolved, null);
});

test('resolveCurrentUserBusiness matches strictly by businessMemberships or owner phone', () => {
  const ownBusiness: BusinessItem = {
    ...otherOwnerBusiness,
    id: 'biz-spec-own',
    slug: 'zahra-nails',
    name: 'ناخن زهرا',
    type: BusinessType.IndependentSpecialist,
    ownerName: 'زهرا کریمی',
    ownerPhone: '09139998877',
    phoneDisplay: '09139998877',
  };

  const specialistUser: AuthenticatedSessionUser = {
    sessionId: 'sess-new-spec',
    userId: 'user-new-spec',
    fullName: 'زهرا کریمی',
    phone: '09139998877',
    defaultCity: 'اصفهان',
    roles: ['BUSINESS_OWNER'],
    isPlatformAdmin: false,
    businessMemberships: [
      {
        businessId: 'biz-spec-own',
        businessUuid: 'biz-spec-own',
        businessSlug: 'zahra-nails',
        memberRole: 'OWNER',
      },
    ],
  };

  const resolved = resolveCurrentUserBusiness({
    authUser: specialistUser,
    ownedBusinessId: 'biz-other-1', // stale ID from another user
    businesses: [otherOwnerBusiness, ownBusiness],
    fallbackWorkingHours: fallbackHours,
  });

  assert.equal(resolved?.id, 'biz-spec-own');
  assert.equal(resolved?.name, 'ناخن زهرا');
});
