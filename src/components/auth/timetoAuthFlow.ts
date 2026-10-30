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
  joinedJalali?: string;
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

/** خواندن حساب‌های ثبت‌شده در حافظه مرورگر با یکتاسازی بر اساس شماره ۱۱ رقمی نرمال‌شده */
export function getSavedMemoryAccounts(): Record<string, SavedMemoryAccount> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const normalizedMap: Record<string, SavedMemoryAccount> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (!val || typeof val !== 'object') continue;
      const acc = val as SavedMemoryAccount;
      const cleanPhone = normalizeIranMobileInput(acc.phone || key);
      if (!cleanPhone) continue;
      const existing = normalizedMap[cleanPhone];
      if (!existing || (acc.updatedAt || 0) >= (existing.updatedAt || 0)) {
        normalizedMap[cleanPhone] = {
          ...acc,
          phone: cleanPhone,
        };
      }
    }
    return normalizedMap;
  } catch {
    return {};
  }
}

/** بررسی اینکه آیا یک شماره موبایل قبلاً در سامانه ثبت‌نام شده است یا خیر */
export function isPhoneAlreadyRegistered(
  phone: string,
  extraRegisteredPhones: string[] = []
): boolean {
  const clean = normalizeIranMobileInput(phone);
  if (!isValidIranMobile(clean)) return false;
  const accounts = getSavedMemoryAccounts();
  if (accounts[clean]) return true;
  return extraRegisteredPhones.some(
    (p) => normalizeIranMobileInput(p) === clean
  );
}

/** اعتبارسنجی گام ۱ ثبت‌نام (شماره موبایل یکتا + رمز عبور حداقل ۸ کاراکتر + تکرار رمز) */
export function validateRegistrationStep1(params: {
  phone: string;
  password: string;
  confirmPassword: string;
  existingPhones?: string[];
}): {
  valid: boolean;
  normalizedPhone: string;
  alreadyRegistered?: boolean;
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
  if (isPhoneAlreadyRegistered(normalizedPhone, params.existingPhones)) {
    return {
      valid: false,
      normalizedPhone,
      alreadyRegistered: true,
      error:
        'این شماره موبایل قبلاً ثبت‌نام شده است. لطفاً از بخش «ورود به حساب» وارد شوید.',
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

/** ذخیره حساب و رمز عبور در حافظه مرورگر با تضمین یکتایی شماره موبایل */
export function saveMemoryAccount(account: SavedMemoryAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanPhone = normalizeIranMobileInput(account.phone);
    if (!cleanPhone) return;
    const map = getSavedMemoryAccounts();
    const prev = map[cleanPhone];
    const merged: SavedMemoryAccount = {
      ...prev,
      ...account,
      phone: cleanPhone,
      joinedJalali: account.joinedJalali || prev?.joinedJalali || 'امروز',
      updatedAt: Date.now(),
    };
    map[cleanPhone] = merged;
    window.localStorage.setItem(
      SAVED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(map)
    );
    window.localStorage.setItem(
      LAST_SAVED_CREDENTIAL_KEY,
      JSON.stringify({
        phone: cleanPhone,
        password: merged.password,
        role: merged.role,
        fullName: merged.fullName,
      })
    );
    const legacyRaw =
      window.localStorage.getItem('timeto_local_passwords_v1') || '{}';
    const legacy = JSON.parse(legacyRaw);
    legacy[cleanPhone] = merged.password;
    window.localStorage.setItem(
      'timeto_local_passwords_v1',
      JSON.stringify(legacy)
    );
  } catch {
    // ignore storage errors
  }
}

/** ویرایش نام، شماره موبایل یا نقش یک حساب ثبت‌شده بدون ایجاد رکورد تکراری */
export function updateMemoryAccountPhoneOrProfile(
  oldPhone: string,
  patch: {
    newPhone?: string;
    fullName?: string;
    city?: string;
    role?: AccountRoleChoice;
    avatarUrl?: string;
  }
): { ok: boolean; error?: string; updatedAccount?: SavedMemoryAccount } {
  if (typeof window === 'undefined') return { ok: true };
  try {
    const cleanOld = normalizeIranMobileInput(oldPhone);
    const cleanNew = patch.newPhone
      ? normalizeIranMobileInput(patch.newPhone)
      : cleanOld;

    if (!isValidIranMobile(cleanNew)) {
      return {
        ok: false,
        error: 'شماره موبایل باید ۱۱ رقم معتبر با شروع 09 باشد.',
      };
    }

    const map = getSavedMemoryAccounts();
    if (cleanNew !== cleanOld && map[cleanNew]) {
      return {
        ok: false,
        error: 'این شماره موبایل قبلاً برای حساب دیگری ثبت شده است.',
      };
    }

    const existing = map[cleanOld] || {
      phone: cleanOld,
      password: generateSuggestedPassword(cleanNew),
      firstName: patch.fullName?.split(' ')[0] || 'کاربر',
      lastName: patch.fullName?.split(' ').slice(1).join(' ') || '',
      fullName: patch.fullName || 'کاربر تایم تو',
      role: patch.role || 'CUSTOMER',
      city: patch.city || 'اصفهان',
      joinedJalali: 'امروز',
      updatedAt: Date.now(),
    };

    const nextFullName = patch.fullName?.trim() || existing.fullName;
    const updated: SavedMemoryAccount = {
      ...existing,
      phone: cleanNew,
      fullName: nextFullName,
      firstName: nextFullName.split(' ')[0] || existing.firstName,
      lastName: nextFullName.split(' ').slice(1).join(' ') || existing.lastName,
      city: patch.city?.trim() || existing.city,
      role: patch.role || existing.role,
      avatarUrl: patch.avatarUrl ?? existing.avatarUrl,
      updatedAt: Date.now(),
    };

    if (cleanNew !== cleanOld) {
      delete map[cleanOld];
    }
    map[cleanNew] = updated;
    window.localStorage.setItem(
      SAVED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(map)
    );

    const legacyRaw =
      window.localStorage.getItem('timeto_local_passwords_v1') || '{}';
    const legacy = JSON.parse(legacyRaw);
    if (cleanNew !== cleanOld && legacy[cleanOld]) {
      legacy[cleanNew] = legacy[cleanOld];
      delete legacy[cleanOld];
    } else if (updated.password) {
      legacy[cleanNew] = updated.password;
    }
    window.localStorage.setItem(
      'timeto_local_passwords_v1',
      JSON.stringify(legacy)
    );

    return { ok: true, updatedAccount: updated };
  } catch {
    return { ok: false, error: 'خطا در بروزرسانی اطلاعات حساب.' };
  }
}

/** حذف حساب کاربری از حافظه مرورگر (توسط مدیر کل یا هنگام اصلاح حساب اشتباه) */
export function removeMemoryAccount(phone: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = normalizeIranMobileInput(phone);
    const map = getSavedMemoryAccounts();
    if (map[clean]) {
      delete map[clean];
      window.localStorage.setItem(
        SAVED_ACCOUNTS_STORAGE_KEY,
        JSON.stringify(map)
      );
    }
  } catch {
    // ignore
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
