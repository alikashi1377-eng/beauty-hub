import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyOtpDigitChange,
  generateSuggestedPassword,
  validateRegistrationStep1,
  validateRegistrationStep3Profile,
} from './timetoAuthFlow';

test('generateSuggestedPassword returns a strong 8+ character random password with mixed classes', () => {
  const suggested = generateSuggestedPassword('09138201042');
  assert.equal(suggested.length >= 8, true);
  assert.match(suggested, /[A-Z]/);
  assert.match(suggested, /[a-z]/);
  assert.match(suggested, /[0-9]/);
  assert.match(suggested, /[@#$%&*!?]/);
  assert.equal(suggested.includes('1042'), false);
});

test('validateRegistrationStep1 enforces 11-digit mobile, 8+ char password, matching confirmation, and phone uniqueness', () => {
  const invalidPhone = validateRegistrationStep1({
    phone: '0913123',
    password: 'Password123',
    confirmPassword: 'Password123',
  });
  assert.equal(invalidPhone.valid, false);

  const shortPass = validateRegistrationStep1({
    phone: '09138201042',
    password: '12345',
    confirmPassword: '12345',
  });
  assert.equal(shortPass.valid, false);

  const mismatch = validateRegistrationStep1({
    phone: '09138201042',
    password: 'Timeto@1042',
    confirmPassword: 'Timeto@9999',
  });
  assert.equal(mismatch.valid, false);

  const duplicate = validateRegistrationStep1({
    phone: '۰۹۱۳۸۲۰۱۰۴۲',
    password: 'Timeto@1042',
    confirmPassword: 'Timeto@1042',
    existingPhones: ['09138201042'],
  });
  assert.equal(duplicate.valid, false);
  assert.equal(duplicate.alreadyRegistered, true);

  const ok = validateRegistrationStep1({
    phone: '۰۹۱۳۸۲۰۱۰۴۲',
    password: 'Timeto@1042',
    confirmPassword: 'Timeto@1042',
    existingPhones: ['09120000000'],
  });
  assert.equal(ok.valid, true);
  assert.equal(ok.normalizedPhone, '09138201042');
});

test('applyOtpDigitChange updates single box, advances focus, and detects 6-digit completion', () => {
  const digits = ['', '', '', '', '', ''];
  const step1 = applyOtpDigitChange(digits, 0, '۳');
  assert.equal(step1.digits[0], '3');
  assert.equal(step1.nextFocusIndex, 1);
  assert.equal(step1.completedCode, null);

  // Full 6-digit paste
  const pasted = applyOtpDigitChange(digits, 0, '392633');
  assert.deepEqual(pasted.digits, ['3', '9', '2', '6', '3', '3']);
  assert.equal(pasted.completedCode, '392633');
});

test('validateRegistrationStep3Profile combines first and last name cleanly', () => {
  const fail = validateRegistrationStep3Profile({
    firstName: 'الف',
    lastName: '',
  });
  assert.equal(fail.valid, true);
  assert.equal(fail.fullName, 'الف');

  const full = validateRegistrationStep3Profile({
    firstName: 'سارا',
    lastName: 'رضایی',
  });
  assert.equal(full.valid, true);
  assert.equal(full.fullName, 'سارا رضایی');
});
