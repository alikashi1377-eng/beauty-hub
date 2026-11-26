import crypto from 'node:crypto';

const PLACEHOLDER_ADMIN_HASHES = new Set(['scrypt$admin$admin']);

/**
 * هش امن رمز عبور با الگوریتم scrypt و salt تصادفی ۱۶ بایتی.
 */
export function hashPasswordScrypt(password: string): string {
  const clean = password.trim();
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(clean, salt, 32).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * آیا مقدار ذخیره‌شده واقعاً یک هش رمز عبور معتبر است (و مقدار پیش‌فرض/خالی نیست)؟
 */
export function isRealPasswordHash(
  storedHash: string | null | undefined
): boolean {
  const normalized = String(storedHash || '').trim();
  if (!normalized || PLACEHOLDER_ADMIN_HASHES.has(normalized)) {
    return false;
  }
  if (normalized.startsWith('scrypt$')) {
    const parts = normalized.split('$');
    return (
      parts.length === 3 &&
      /^[0-9a-f]{16,}$/i.test(parts[1]) &&
      /^[0-9a-f]{32,}$/i.test(parts[2])
    );
  }
  return /^[0-9a-f]{64}$/i.test(normalized);
}

/**
 * مقایسه امن و مقاوم در برابر Timing Attack بین دو رشته هگزادسیمال.
 */
function timingSafeEqualHex(aHex: string, bHex: string): boolean {
  if (aHex.length !== bHex.length || aHex.length === 0 || aHex.length % 2 !== 0) {
    return false;
  }
  try {
    const aBuf = Buffer.from(aHex, 'hex');
    const bBuf = Buffer.from(bHex, 'hex');
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

/**
 * بررسی رمز عبور کاربر هم با فرمت امن جدید (scrypt) و هم با فرمت قدیمی (sha256)
 * جهت سازگاری کامل با حساب‌های قبلی.
 */
export function verifyPasswordAgainstHash(
  password: string,
  phone: string,
  storedHash: string | null | undefined
): { matched: boolean; needsUpgradeToScrypt: boolean } {
  const cleanPassword = password.trim();
  const normalizedHash = String(storedHash || '').trim();
  if (!cleanPassword || !isRealPasswordHash(normalizedHash)) {
    return { matched: false, needsUpgradeToScrypt: false };
  }

  if (normalizedHash.startsWith('scrypt$')) {
    const parts = normalizedHash.split('$');
    if (parts.length !== 3) {
      return { matched: false, needsUpgradeToScrypt: false };
    }
    const [, salt, expectedHex] = parts;
    const derivedHex = crypto
      .scryptSync(cleanPassword, salt, 32)
      .toString('hex');
    return {
      matched: timingSafeEqualHex(derivedHex, expectedHex),
      needsUpgradeToScrypt: false,
    };
  }

  // سازگاری با رمزهای قبلی ذخیره‌شده با sha256
  const legacyCandidateHex = crypto
    .createHash('sha256')
    .update(`timeto-pwd-v1:${phone}:${cleanPassword}`, 'utf8')
    .digest('hex');

  const matched = timingSafeEqualHex(legacyCandidateHex, normalizedHash);
  return {
    matched,
    needsUpgradeToScrypt: matched,
  };
}
