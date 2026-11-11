import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatServicePriceDisplay,
  formatServicePriceShort,
  formatWorkingHourDisplay,
  isTimeSlotWithinWorkingHours,
} from '../formatters';

describe('Timeto Pricing & Split-Shift Working Hours Formatters', () => {
  it('formats FIXED service price accurately', () => {
    const label = formatServicePriceDisplay({
      priceToman: 980_000,
      pricingType: 'FIXED',
    });
    assert.equal(label, '۹۸۰,۰۰۰ تومان');
  });

  it('formats RANGE service price accurately with min and max', () => {
    const label = formatServicePriceDisplay({
      priceToman: 850_000,
      maxPriceToman: 1_250_000,
      pricingType: 'RANGE',
    });
    assert.equal(label, 'از ۸۵۰,۰۰۰ تا ۱,۲۵۰,۰۰۰ تومان');

    const shortLabel = formatServicePriceShort({
      priceToman: 850_000,
      maxPriceToman: 1_250_000,
      pricingType: 'RANGE',
    });
    assert.equal(shortLabel, 'از ۸۵۰,۰۰۰ تا ۱,۲۵۰,۰۰۰ تومان');
  });

  it('formats STARTING_FROM service price with consultation note', () => {
    const label = formatServicePriceDisplay({
      priceToman: 700_000,
      pricingType: 'STARTING_FROM',
    });
    assert.equal(label, 'شروع از ۷۰۰,۰۰۰ تومان (تعیین دقیق پس از مشاوره)');
  });

  it('formats split-shift working hours with midday break', () => {
    const continuous = formatWorkingHourDisplay({
      dayName: 'شنبه',
      isOpen: true,
      openTime: '۱۰:۰۰',
      closeTime: '۲۱:۰۰',
      hasBreak: false,
    });
    assert.equal(continuous, '۱۰:۰۰ تا ۲۱:۰۰');

    const split = formatWorkingHourDisplay({
      dayName: 'شنبه',
      isOpen: true,
      openTime: '۱۰:۰۰',
      closeTime: '۱۳:۰۰',
      hasBreak: true,
      secondOpenTime: '۱۶:۰۰',
      secondCloseTime: '۲۱:۰۰',
    });
    assert.equal(split, 'شیفت ۱: ۱۰:۰۰ تا ۱۳:۰۰ | شیفت ۲: ۱۶:۰۰ تا ۲۱:۰۰');
  });

  it('excludes midday break slots in isTimeSlotWithinWorkingHours', () => {
    const wh = {
      dayName: 'شنبه',
      isOpen: true,
      openTime: '۱۰:۰۰',
      closeTime: '۱۳:۰۰',
      hasBreak: true,
      secondOpenTime: '۱۶:۰۰',
      secondCloseTime: '۲۱:۰۰',
    };

    // Morning shift (10:00 to 13:00)
    assert.equal(isTimeSlotWithinWorkingHours('۱۰:۳۰', wh), true);
    assert.equal(isTimeSlotWithinWorkingHours('۱۲:۳۰', wh), true);

    // Midday break (13:00 to 16:00) -> excluded
    assert.equal(isTimeSlotWithinWorkingHours('۱۳:۳۰', wh), false);
    assert.equal(isTimeSlotWithinWorkingHours('۱۴:۳۰', wh), false);
    assert.equal(isTimeSlotWithinWorkingHours('۱۵:۳۰', wh), false);

    // Afternoon/evening shift (16:00 to 21:00)
    assert.equal(isTimeSlotWithinWorkingHours('۱۶:۳۰', wh), true);
    assert.equal(isTimeSlotWithinWorkingHours('۱۹:۳۰', wh), true);
  });
});
