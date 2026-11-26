import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOtpSubmissionGuard,
  releaseOtpSubmission,
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
