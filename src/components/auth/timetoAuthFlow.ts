import {
  isValidIranMobile,
  normalizeIranMobileInput,
  toEnglishDigitsClient,
} from '../../utils/formatters';
import { BusinessType } from '../../types';

export type AccountRoleChoice = 'CUSTOMER' | 'BUSINESS_OWNER';

export type AuthFlowScreen =
  | 'LOGIN'
  | 'LOGIN_PASSWORD_PROMPT'
  | 'LOGIN_OTP_VERIFY'
  | 'ROLE_PICKER'
  | 'REGISTER_STEP_1_PHONE'
  | 'REGISTER_STEP_2_OTP'
  | 'REGISTER_STEP_3_PROFILE'
  | 'REGISTER_STEP_4_SALON'
  | 'RESET_PASSWORD'
  | 'WELCOME';

export interface SavedMemoryAccount {
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: AccountRoleChoice;
  avatarUrl?: string;
  businessId?: string;
  businessName?: string;
  businessType?: BusinessType;
  city?: string;
  neighborhood?: string;
  updatedAt: number;
}

export const SAVED_ACCOUNTS_STORAGE_KEY = 'timeto_registered_accounts_v2';
export const LAST_SAVED_CREDENTIAL_KEY = 'timeto_last_credential_memory_v2';
export const PERSISTED_SESSION_USER_KEY = 'timeto_persisted_auth_user_v2';

/** تولید رمز عبور پیشنهادی امن و به‌یادماندنی توسط سیستم (حداقل ۸ کاراکتر) */
export function generateSuggestedPassword(phone?: string): string {
  const clean = toEnglishDigitsClient(phone || '').replace(/\D/g, '');
  const suffix = clean.length >= 4 ? clean.slice(-4) : '4829';
  return `Timeto@${suffix}`;
}

/** اعتبارسنجی گام ۱ ثبت‌نام (شماره موبایل + رمز عبور حداقل ۸ کاراکتر + تکرار رمز) */
export function validateRegistrationStep1(params: {
  phone: string;
  password: string;
  confirmPassword: string;
}): {
  valid: boolean;
  normalizedPhone: string;
  error?: string;
} {
  const normalizedPhone = normalizeIranMobileInput(params.phone);
  if (!isValidIranMobile(normalizedPhone)) {
    return {
      valid: false,
      normalizedPhone,
      error: 'لطفاً شماره موبایل ۱۱ رقمی معتبر با شروع 09 وارد کنید.',
    };
  }
  const pass = params.password.trim();
  if (pass.length < 8) {
    return {
      valid: false,
      normalizedPhone,
      error: 'رمز عبور باید حداقل ۸ کاراکتر باشد.',
    };
  }
  if (pass !== params.confirmPassword.trim()) {
    return {
      valid: false,
      normalizedPhone,
      error: 'رمز عبور و تکرار رمز عبور با هم مطابقت ندارند.',
    };
  }
  return {
    valid: true,
    normalizedPhone,
  };
}

/** مدیریت ورود کاراکتر یا Paste در ۶ خانه مجزای کد تایید (OTP) */
export function applyOtpDigitChange(
  currentDigits: string[],
  index: number,
  rawInput: string
): {
  digits: string[];
  nextFocusIndex: number;
  completedCode: string | null;
} {
  const next = Array.from({ length: 6 }, (_, i) => currentDigits[i] || '');
  const clean = toEnglishDigitsClient(rawInput).replace(/\D/g, '');

  if (!clean) {
    next[index] = '';
    return {
      digits: next,
      nextFocusIndex: Math.max(0, index),
      completedCode: null,
    };
  }

  if (clean.length > 1) {
    // اگر کاربر کد کامل را Paste کرد یا مرورگر WebOTP آن را پر کرد
    for (let i = 0; i < 6; i++) {
      if (clean[i]) {
        next[i] = clean[i];
      }
    }
    const code = next.join('');
    return {
      digits: next,
      nextFocusIndex: Math.min(5, clean.length - 1),
      completedCode: code.length === 6 ? code : null,
    };
  }

  next[index] = clean[0];
  const code = next.join('');
  return {
    digits: next,
    nextFocusIndex: Math.min(5, index + 1),
    completedCode: code.length === 6 && !next.includes('') ? code : null,
  };
}

/** اعتبارسنجی گام ۳ ثبت‌نام (نام و نام خانوادگی در بخش پروفایل) */
export function validateRegistrationStep3Profile(params: {
  firstName: string;
  lastName: string;
}): {
  valid: boolean;
  fullName: string;
  error?: string;
} {
  const first = params.firstName.trim();
  const last = params.lastName.trim();
  if (first.length < 2) {
    return {
      valid: false,
      fullName: '',
      error: 'لطفاً نام خود را وارد کنید (حداقل ۲ حرف).',
    };
  }
  const fullName = last ? `${first} ${last}` : first;
  return {
    valid: true,
    fullName,
  };
}

/** خواندن حساب‌های ثبت‌شده در حافظه مرورگر */
export function getSavedMemoryAccounts(): Record<string, SavedMemoryAccount> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** ذخیره حساب و رمز عبور در حافظه مرورگر جهت ورود خودکار و بدون دردسر در دفعات بعد */
export function saveMemoryAccount(account: SavedMemoryAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getSavedMemoryAccounts();
    map[account.phone] = account;
    window.localStorage.setItem(
      SAVED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(map)
    );
    window.localStorage.setItem(
      LAST_SAVED_CREDENTIAL_KEY,
      JSON.stringify({
        phone: account.phone,
        password: account.password,
        role: account.role,
        fullName: account.fullName,
      })
    );
    // همگام‌سازی با جدول رمزهای قبلی برای پشتیبانی یکپارچه
    const legacyRaw =
      window.localStorage.getItem('timeto_local_passwords_v1') || '{}';
    const legacy = JSON.parse(legacyRaw);
    legacy[account.phone] = account.password;
    window.localStorage.setItem(
      'timeto_local_passwords_v1',
      JSON.stringify(legacy)
    );
  } catch {
    // ignore storage errors
  }
}

/** دریافت آخرین شماره و رمز ذخیره‌شده در حافظه برای پر کردن خودکار فرم ورود */
export function getLastSavedCredential(): {
  phone: string;
  password: string;
  role?: AccountRoleChoice;
  fullName?: string;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_SAVED_CREDENTIAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.phone === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
