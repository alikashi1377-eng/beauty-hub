import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
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
    const search30 = computeAdPackagePriceAndTitle({
      placementSlot: 'SEARCH_TOP',
      durationDays: 30,
    });
    const hero30 = computeAdPackagePriceAndTitle({
      placementSlot: 'HERO_SPOTLIGHT',
      durationDays: 30,
    });

    assert.equal(search7.amountToman, 190000);
    assert.equal(search30.amountToman, 490000);
    assert.equal(hero30.amountToman, 1290000);
    assert.ok(hero30.title.includes('VIP'));
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
