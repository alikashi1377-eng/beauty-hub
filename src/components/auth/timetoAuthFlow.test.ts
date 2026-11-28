import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOtpSubmissionGuard,
  popAuthScreenHistory,
  pushAuthScreenHistory,
  releaseOtpSubmission,
  shouldShowAvatarUploadInRegistration,
  tryAcquireOtpSubmission,
} from './timetoAuthFlow';

test('OTP submission guard prevents duplicate concurrent requests for the same 6-digit code', () => {
  let guard = createOtpSubmissionGuard();

  // First event (e.g., onChange with 6 Persian digits) acquires the lock
  const first = tryAcquireOtpSubmission(guard, '۱۲۳۴۵۶', { isAutoSubmit: true });
  assert.equal(first.acquired, true);
  assert.equal(first.cleanCode, '123456');
  guard = first.nextGuard;

  // Simultaneous second event (e.g., onInput / autofill interval / button click while in-flight) is blocked
  const second = tryAcquireOtpSubmission(guard, '123456', { isAutoSubmit: true });
  assert.equal(second.acquired, false);

  const manualWhileInFlight = tryAcquireOtpSubmission(guard, '123456', {
    isAutoSubmit: false,
  });
  assert.equal(manualWhileInFlight.acquired, false);

  // After first request succeeds, re-submitting the already-consumed code is blocked
  guard = releaseOtpSubmission(guard, first.cleanCode, true);
  const replay = tryAcquireOtpSubmission(guard, '123456', { isAutoSubmit: false });
  assert.equal(replay.acquired, false);
});

test('OTP submission guard blocks repeated auto-submit on failed code but allows manual retry or new code', () => {
  let guard = createOtpSubmissionGuard();

  const attempt1 = tryAcquireOtpSubmission(guard, '654321', { isAutoSubmit: true });
  assert.equal(attempt1.acquired, true);
  guard = releaseOtpSubmission(attempt1.nextGuard, attempt1.cleanCode, false);

  // Polling interval must NOT auto-submit the same failed code again
  const pollRetry = tryAcquireOtpSubmission(guard, '654321', { isAutoSubmit: true });
  assert.equal(pollRetry.acquired, false);

  // Manual button click IS allowed to retry
  const manualRetry = tryAcquireOtpSubmission(guard, '654321', {
    isAutoSubmit: false,
  });
  assert.equal(manualRetry.acquired, true);
  guard = releaseOtpSubmission(manualRetry.nextGuard, manualRetry.cleanCode, false);

  // Typing a different 6-digit code IS allowed to auto-submit
  const newCodeAttempt = tryAcquireOtpSubmission(guard, '998877', {
    isAutoSubmit: true,
  });
  assert.equal(newCodeAttempt.acquired, true);
  assert.equal(newCodeAttempt.cleanCode, '998877');
});

test('OTP submission guard rejects incomplete codes', () => {
  const guard = createOtpSubmissionGuard();
  const shortAttempt = tryAcquireOtpSubmission(guard, '12345', {
    isAutoSubmit: true,
  });
  assert.equal(shortAttempt.acquired, false);
});

test('shouldShowAvatarUploadInRegistration hides avatar upload for business/specialist and shows only for customers', () => {
  assert.equal(shouldShowAvatarUploadInRegistration('CUSTOMER'), true);
  assert.equal(shouldShowAvatarUploadInRegistration('BUSINESS_OWNER'), false);
});

test('auth screen history steps back one registration screen at a time without exiting prematurely', () => {
  let stack = pushAuthScreenHistory([], 'LOGIN', 'ROLE_PICKER');
  stack = pushAuthScreenHistory(stack, 'ROLE_PICKER', 'REGISTER_STEP_1_PHONE');
  stack = pushAuthScreenHistory(stack, 'REGISTER_STEP_1_PHONE', 'REGISTER_STEP_2_OTP');
  stack = pushAuthScreenHistory(stack, 'REGISTER_STEP_2_OTP', 'REGISTER_STEP_3_PROFILE');
  stack = pushAuthScreenHistory(stack, 'REGISTER_STEP_3_PROFILE', 'REGISTER_STEP_4_SALON');

  const back1 = popAuthScreenHistory(stack, 'REGISTER_STEP_4_SALON');
  assert.equal(back1.prevScreen, 'REGISTER_STEP_3_PROFILE');

  const back2 = popAuthScreenHistory(back1.nextStack, 'REGISTER_STEP_3_PROFILE');
  assert.equal(back2.prevScreen, 'REGISTER_STEP_2_OTP');

  const back3 = popAuthScreenHistory(back2.nextStack, 'REGISTER_STEP_2_OTP');
  assert.equal(back3.prevScreen, 'REGISTER_STEP_1_PHONE');

  const back4 = popAuthScreenHistory(back3.nextStack, 'REGISTER_STEP_1_PHONE');
  assert.equal(back4.prevScreen, 'ROLE_PICKER');

  const back5 = popAuthScreenHistory(back4.nextStack, 'ROLE_PICKER');
  assert.equal(back5.prevScreen, 'LOGIN');

  const back6 = popAuthScreenHistory(back5.nextStack, 'LOGIN');
  assert.equal(back6.prevScreen, null);
});

test('auth screen history fallback works even when entering step 1 directly (e.g. /business/register)', () => {
  const backFromStep1 = popAuthScreenHistory([], 'REGISTER_STEP_1_PHONE');
  assert.equal(backFromStep1.prevScreen, 'ROLE_PICKER');

  const backFromUpgrade = popAuthScreenHistory([], 'REGISTER_STEP_4_SALON', {
    isAlreadyLoggedInUpgrade: true,
  });
  assert.equal(backFromUpgrade.prevScreen, null);
});
