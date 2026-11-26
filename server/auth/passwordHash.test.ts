import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  hashPasswordScrypt,
  isRealPasswordHash,
  verifyPasswordAgainstHash,
} from './passwordHash';

test('hashPasswordScrypt produces unique salted scrypt hashes and verifies accurately', () => {
  const hash1 = hashPasswordScrypt('MySecret#2026');
  const hash2 = hashPasswordScrypt('MySecret#2026');

  assert.ok(hash1.startsWith('scrypt$'));
  assert.notEqual(hash1, hash2);
  assert.equal(isRealPasswordHash(hash1), true);

  const okCheck = verifyPasswordAgainstHash(
    'MySecret#2026',
    '09131234567',
    hash1
  );
  assert.equal(okCheck.matched, true);
  assert.equal(okCheck.needsUpgradeToScrypt, false);

  const badCheck = verifyPasswordAgainstHash(
    'WrongPass123',
    '09131234567',
    hash1
  );
  assert.equal(badCheck.matched, false);
});

test('verifyPasswordAgainstHash preserves backward compatibility with legacy sha256 hashes and flags upgrade', () => {
  const phone = '09138201042';
  const legacyHash = crypto
    .createHash('sha256')
    .update(`timeto-pwd-v1:${phone}:LegacyPass99`, 'utf8')
    .digest('hex');

  assert.equal(isRealPasswordHash(legacyHash), true);

  const ok = verifyPasswordAgainstHash('LegacyPass99', phone, legacyHash);
  assert.equal(ok.matched, true);
  assert.equal(ok.needsUpgradeToScrypt, true);

  const wrong = verifyPasswordAgainstHash('OtherPass99', phone, legacyHash);
  assert.equal(wrong.matched, false);
  assert.equal(wrong.needsUpgradeToScrypt, false);
});

test('isRealPasswordHash rejects empty values and dummy admin placeholder hash', () => {
  assert.equal(isRealPasswordHash(''), false);
  assert.equal(isRealPasswordHash(null), false);
  assert.equal(isRealPasswordHash(undefined), false);
  assert.equal(isRealPasswordHash('scrypt$admin$admin'), false);
  assert.equal(isRealPasswordHash('not-a-valid-hash'), false);

  const placeholderAttempt = verifyPasswordAgainstHash(
    'admin',
    '09138201042',
    'scrypt$admin$admin'
  );
  assert.equal(placeholderAttempt.matched, false);
});
