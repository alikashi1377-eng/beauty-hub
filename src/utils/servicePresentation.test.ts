import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDownloadBusinessPoster,
  getMeaningfulServiceDescription,
  makeServiceAddonKey,
  normalizeInstagramProfileUrl,
  pruneOrphanAddonKeys,
  resolveSelectedAddonsForServices,
  shouldShowServiceDetailsTrigger,
} from './servicePresentation';
import { computeSelectedServicesSummary } from './formatters';
import { ServiceItem } from '../types';
import { AuthenticatedSessionUser } from '../services/apiClient';

test('normalizeInstagramProfileUrl converts @handles, raw handles, and full URLs cleanly', () => {
  assert.deepEqual(normalizeInstagramProfileUrl('@ayra_laser'), {
    handle: 'ayra_laser',
    url: 'https://www.instagram.com/ayra_laser/',
  });
  assert.deepEqual(
    normalizeInstagramProfileUrl('https://instagram.com/jazini.barber/'),
    {
      handle: 'jazini.barber',
      url: 'https://www.instagram.com/jazini.barber/',
    }
  );
  assert.equal(normalizeInstagramProfileUrl(''), null);
  assert.equal(normalizeInstagramProfileUrl('   '), null);
});

test('service description visibility hides generic filler and shows meaningful descriptions or packages', () => {
  assert.equal(
    shouldShowServiceDetailsTrigger({ description: '', packageIncludes: [] }),
    false
  );
  assert.equal(
    shouldShowServiceDetailsTrigger({
      description: 'خدمت تخصصی سالن زیبایی',
      packageIncludes: [],
    }),
    false
  );
  assert.equal(
    getMeaningfulServiceDescription({ description: 'خدمت تخصصی زیبایی' }),
    ''
  );
  assert.equal(
    shouldShowServiceDetailsTrigger({
      description: 'شامل شست‌وشو با شامپو کراتینه اورجینال',
      packageIncludes: [],
    }),
    true
  );
  assert.equal(
    shouldShowServiceDetailsTrigger({
      description: '',
      packageIncludes: ['اصلاح سر', 'شست‌وشو'],
    }),
    true
  );
});

test('selected services + add-ons summary calculates combined title, price, duration, and prunes orphans', () => {
  const haircut: ServiceItem = {
    id: 'srv-haircut',
    businessId: 'biz-1',
    categorySlug: 'men-barbershop',
    title: 'اصلاح سر',
    category: 'پیرایش مردانه',
    durationMinutes: 40,
    priceToman: 350000,
    description: '',
    addons: [
      { id: 'ad-wash', title: 'شست‌وشوی سر', priceToman: 80000, durationMinutes: 10 },
      { id: 'ad-wax', title: 'وکس صورت', priceToman: 150000, durationMinutes: 15 },
    ],
  };

  const washKey = makeServiceAddonKey('srv-haircut', 'ad-wash');
  const waxKey = makeServiceAddonKey('srv-haircut', 'ad-wax');

  const summary = computeSelectedServicesSummary(
    [haircut],
    ['srv-haircut'],
    'srv-haircut',
    [washKey, waxKey]
  );

  assert.equal(summary.totalPriceToman, 580000);
  assert.equal(summary.totalDurationMinutes, 65);
  assert.equal(summary.combinedTitle, 'اصلاح سر + شست‌وشوی سر + وکس صورت');
  assert.equal(summary.selectedAddons.length, 2);

  // Removing parent service prunes orphan add-on keys
  assert.deepEqual(pruneOrphanAddonKeys([], [washKey, waxKey]), []);
  assert.deepEqual(
    resolveSelectedAddonsForServices([], [washKey]).length,
    0
  );
});

test('canDownloadBusinessPoster grants access only to business owner or platform admin', () => {
  const business = {
    id: 'biz-ayra',
    slug: 'ayra-laser-isfahan',
    ownerPhone: '09131112233',
  };

  const customer: AuthenticatedSessionUser = {
    sessionId: 's1',
    userId: 'u-cust',
    phone: '09139990000',
    fullName: 'مشتری عادی',
    defaultCity: 'اصفهان',
    roles: ['CUSTOMER'],
    isPlatformAdmin: false,
    businessMemberships: [],
  };

  const owner: AuthenticatedSessionUser = {
    sessionId: 's2',
    userId: 'u-owner',
    phone: '09131112233',
    fullName: 'صاحب سالن',
    defaultCity: 'اصفهان',
    roles: ['BUSINESS_OWNER'],
    isPlatformAdmin: false,
    businessMemberships: [
      {
        businessUuid: 'biz-ayra',
        businessId: 'biz-ayra',
        businessSlug: 'ayra-laser-isfahan',
        memberRole: 'OWNER',
      },
    ],
  };

  assert.equal(
    canDownloadBusinessPoster({ authUser: null, ownedBusinessId: null, business }),
    false
  );
  assert.equal(
    canDownloadBusinessPoster({
      authUser: customer,
      ownedBusinessId: null,
      business,
    }),
    false
  );
  assert.equal(
    canDownloadBusinessPoster({
      authUser: owner,
      ownedBusinessId: 'biz-ayra',
      business,
    }),
    true
  );
});
