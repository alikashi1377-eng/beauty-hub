import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBusinessShortLink,
  buildCustomerBookingTimeSlots,
  computeAdPackagePriceAndTitle,
  formatNumericInputWithCommas,
  getSuggestedServiceTitlesForCategory,
  parseNumericInput,
  resolveAdjacentTabBySwipe,
  STANDARD_WORKING_TIME_OPTIONS,
} from './formatters';

describe('formatters & business/customer helpers', () => {
  it('formats numeric inputs with thousand separators and parses back to number', () => {
    assert.equal(formatNumericInputWithCommas('650000'), '650,000');
    assert.equal(formatNumericInputWithCommas('۶۵۰۰۰۰'), '650,000');
    assert.equal(formatNumericInputWithCommas('1,250,000'), '1,250,000');
    assert.equal(formatNumericInputWithCommas(0), '');
    assert.equal(parseNumericInput('650,000'), 650000);
    assert.equal(parseNumericInput('۱,۴۵۰,۰۰۰'), 1450000);
  });

  it('builds a short branded profile link that resolves to the salon profile route', () => {
    const linkInfo = buildBusinessShortLink(
      'royal-golzar',
      'سالن زیبایی رویال گلزار',
      'https://timeto.ir'
    );
    assert.equal(linkInfo.shortPath, '/royal-golzar');
    assert.equal(linkInfo.actualUrl, 'https://timeto.ir/royal-golzar');
    assert.equal(linkInfo.displayShortUrl, 'Timeto.ir/royal-golzar');
    assert.ok(linkInfo.brandedTitle.includes('تایم‌تو'));
    assert.ok(linkInfo.brandedTitle.includes('سالن زیبایی رویال گلزار'));
  });

  it('returns smart service title suggestions for categories including عروس and داماد', () => {
    const bridalSuggestions = getSuggestedServiceTitlesForCategory('عروس');
    assert.ok(bridalSuggestions.length >= 4);
    assert.ok(bridalSuggestions.some((s) => s.includes('عروس')));

    const groomSuggestions = getSuggestedServiceTitlesForCategory('داماد');
    assert.ok(groomSuggestions.length >= 4);
    assert.ok(groomSuggestions.some((s) => s.includes('داماد')));

    const nailSuggestions = getSuggestedServiceTitlesForCategory('ناخن و مژه');
    assert.ok(nailSuggestions.some((s) => s.includes('ناخن') || s.includes('مژه')));
  });

  it('provides 30-minute standard working time options from 07:00 to 23:30', () => {
    assert.ok(STANDARD_WORKING_TIME_OPTIONS.includes('۰۷:۰۰'));
    assert.ok(STANDARD_WORKING_TIME_OPTIONS.includes('۰۹:۰۰'));
    assert.ok(STANDARD_WORKING_TIME_OPTIONS.includes('۲۱:۰۰'));
    assert.ok(STANDARD_WORKING_TIME_OPTIONS.includes('۲۳:۳۰'));
  });

  it('dynamically computes ad package price and title when slot or duration changes', () => {
    const search7 = computeAdPackagePriceAndTitle({
      placementSlot: 'SEARCH_TOP',
      durationDays: 7,
    });
    const search14 = computeAdPackagePriceAndTitle({
      placementSlot: 'SEARCH_TOP',
      durationDays: 14,
    });
    const hero14 = computeAdPackagePriceAndTitle({
      placementSlot: 'HERO_SPOTLIGHT',
      durationDays: 14,
    });

    assert.equal(search7.amountToman, 590000);
    assert.equal(search14.amountToman, 990000);
    assert.equal(hero14.amountToman, 1990000);
    assert.ok(hero14.title.includes('VIP'));
  });

  it('calculates exact duration-based free slots after 15-minute and 45-minute booked appointments', () => {
    const schedule = buildCustomerBookingTimeSlots({
      dayWorkingHour: {
        dayName: 'شنبه',
        isOpen: true,
        openTime: '۱۰:۰۰',
        closeTime: '۱۲:۰۰',
      },
      durationMinutes: 15,
      bookedAppointments: [
        { timeSlot: '۱۰:۰۰', durationMinutes: 15, status: 'PENDING' },
        { timeSlot: '۱۱:۰۰', durationMinutes: 45, status: 'CONFIRMED' },
      ],
    });

    const slot1000 = schedule.allSlots.find((s) => s.time === '۱۰:۰۰');
    const slot1015 = schedule.allSlots.find((s) => s.time === '۱۰:۱۵');
    const slot1100 = schedule.allSlots.find((s) => s.time === '۱۱:۰۰');
    const slot1130 = schedule.allSlots.find((s) => s.time === '۱۱:۳۰');
    const slot1145 = schedule.allSlots.find((s) => s.time === '۱۱:۴۵');

    assert.equal(slot1000?.available, false);
    assert.equal(slot1015?.available, true);
    assert.equal(slot1100?.available, false);
    assert.equal(slot1130?.available, false);
    assert.equal(slot1145?.available, true);
  });

  it('resolves adjacent tab on horizontal swipe while ignoring vertical scroll', () => {
    const tabs = ['/me', '/me/appointments', '/me/favorites', '/me/profile'];
    // Swipe right (deltaX > 65) moves to next tab in RTL
    assert.equal(
      resolveAdjacentTabBySwipe(tabs, '/me', 95, 10),
      '/me/appointments'
    );
    // Swipe left (deltaX < -65) moves to previous tab in RTL
    assert.equal(
      resolveAdjacentTabBySwipe(tabs, '/me/favorites', -95, 12),
      '/me/appointments'
    );
    // Vertical scroll ignores swipe
    assert.equal(resolveAdjacentTabBySwipe(tabs, '/me', 80, 90), null);
  });
});
