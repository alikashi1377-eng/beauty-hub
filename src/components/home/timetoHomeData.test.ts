import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIENT_ANIMATED_FACTORS,
  computePhoneCinematicStep,
  SALON_OWNER_STACK_CARDS,
  TIMETO_INTRO_SPACES,
  WALLET_MOTION_FRAMES,
} from './timetoHomeData';

test('computePhoneCinematicStep advances with scroll progress and autoTick', () => {
  const s0 = computePhoneCinematicStep(0, 0);
  assert.equal(s0.activeStep, 0);
  assert.equal(s0.isConfirmed, false);

  const s1 = computePhoneCinematicStep(0.3, 0);
  assert.equal(s1.activeStep, 1);
  assert.equal(s1.selectedSlot, '۱۶:۰۰');

  const s3 = computePhoneCinematicStep(0.85, 0);
  assert.equal(s3.activeStep, 3);
  assert.equal(s3.isConfirmed, true);
});

test('intro gateway datasets have all expected items for non-clickable presentation', () => {
  assert.equal(TIMETO_INTRO_SPACES.length, 6);
  assert.equal(SALON_OWNER_STACK_CARDS.length, 4);
  assert.equal(CLIENT_ANIMATED_FACTORS.length, 3);
  assert.equal(WALLET_MOTION_FRAMES.length, 4);
});
