/**
 * سامانه هوشمند بررسی سلامت محتوای دیدگاه‌ها (Anti-Profanity & Anti-Gibberish)
 * سیاست تایم تو:
 * - ثبت دیدگاه منفی، انتقاد تند و امتیاز پایین (۱ یا ۲ ستاره) کاملاً آزاد و بدون سانسور است.
 * - تنها کلمات رکیک، توهین‌های شخصی، فحاشی و متون جفنگ (حروف تصادفی کیبورد یا تکرار بی‌معنی) مسدود می‌شوند.
 */

export interface ReviewValidationResult {
  valid: boolean;
  reason?: 'TOO_SHORT' | 'PROHIBITED_PROFANITY' | 'GIBBERISH';
  code?: 'TOO_SHORT' | 'PROHIBITED_PROFANITY' | 'GIBBERISH';
  message?: string;
}

const PERSIAN_PROFANITY_PATTERNS: string[] = [
  'بیشعور',
  'بی شعور',
  'بی‌شعور',
  'احمق',
  'نفهم',
  'کثافت',
  'عوضی',
  'آشغال',
  'اشغال',
  'حرامزاده',
  'حرومزاده',
  'پدرسگ',
  'پدر سگ',
  'مادرسگ',
  'لاشی',
  'دیوث',
  'بی ناموس',
  'بی‌ناموس',
  'بیناموس',
  'خفه شو',
  'خفه شید',
  'گمشو',
  'گم شو',
  'غلط کرد',
  'گه خورد',
  'گوه خورد',
  'عنتر',
  'توله سگ',
  'روانی',
  'کلاهبردار',
  'دزد',
  'شیاد',
  'شارلاتان',
  'جنده',
  'کونی',
  'کسکش',
  'کصکش',
  'کیری',
  'تخمی',
  'ریدن',
  'ریده',
  'برینم',
  'تتف',
  'تف تو',
  'لعنت به ذات',
  'حیوون',
  'حیوان',
  'خر نفهم',
  'ابله',
  'مفت خور',
  'مفت‌خور',
  'هرزه',
  'فاحشه',
  'پفیوز',
  'ذلیل',
  'نکبت',
  'شاسکول',
  'اسکل',
  'اوسکول',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'koskesh',
  'kir',
  'kooni',
  'jende',
  'ashghal',
  'bishoor',
];

const KEYBOARD_MASH_ROWS = [
  'ضصثقفغعهخحجچ',
  'شسیبلاتنمکگ',
  'ظطزرذدپو',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
];

function normalizeTextForCheck(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\u200c/g, ' ')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/\s+/g, ' ');
}

export function validateReviewContent(comment: string): ReviewValidationResult {
  const trimmed = (comment || '').trim();

  if (trimmed.length < 6) {
    return {
      valid: false,
      reason: 'TOO_SHORT',
      code: 'TOO_SHORT',
      message:
        'لطفاً نظر خود را در چند کلمه (حداقل ۶ کاراکتر) بنویسید تا برای سایر مراجعان مفید باشد.',
    };
  }

  const normalized = normalizeTextForCheck(trimmed);
  const compactNoSpaces = normalized.replace(/\s+/g, '');

  // ۱. بررسی فحاشی و الفاظ رکیک (در عین آزاد بودن کامل انتقادهای منفی محترمانه)
  for (const badWord of PERSIAN_PROFANITY_PATTERNS) {
    const cleanBad = normalizeTextForCheck(badWord);
    if (
      normalized.includes(cleanBad) ||
      compactNoSpaces.includes(cleanBad.replace(/\s+/g, ''))
    ) {
      return {
        valid: false,
        reason: 'PROHIBITED_PROFANITY',
        code: 'PROHIBITED_PROFANITY',
        message:
          'ثبت انتقاد منفی و امتیاز پایین (حتی ۱ ستاره) کاملاً آزاد است؛ اما استفاده از الفاظ رکیک یا توهین شخصی مجاز نیست. لطفاً تجربه خود را بدون توهین بنویسید.',
      };
    }
  }

  // ۲. بررسی تکرار یک حرف پشت سر هم (مثلاً «هههههههه» یا «ااااااا» یا «......»)
  if (/(.)\1{4,}/u.test(compactNoSpaces)) {
    return {
      valid: false,
      reason: 'GIBBERISH',
      code: 'GIBBERISH',
      message:
        'متن نظر شامل تکرار بی‌معنی حروف است. لطفاً تجربه واقعی خود (مثبت یا منفی) را به صورت خوانا بنویسید.',
    };
  }

  // ۳. بررسی اینکه متن حداقل شامل حروف معنادار فارسی یا انگلیسی باشد (نه فقط عدد یا علامت)
  const lettersOnly = trimmed.replace(/[^آ-یa-zA-Z]/g, '');
  if (lettersOnly.length < 5) {
    return {
      valid: false,
      reason: 'GIBBERISH',
      code: 'GIBBERISH',
      message:
        'متن دیدگاه نامفهوم است. لطفاً توضیح کوتاهی از تجربه خود با حروف فارسی بنویسید.',
    };
  }

  // ۴. بررسی تنوع کاراکترها در متن (جلوگیری از «بلبلبلبلبل» یا «قفقفقفقفقف»)
  const uniqueChars = new Set(lettersOnly.toLowerCase().split('')).size;
  if (lettersOnly.length >= 8 && uniqueChars <= 3) {
    return {
      valid: false,
      reason: 'GIBBERISH',
      code: 'GIBBERISH',
      message:
        'متن واردشده جفنگ و غیرقابل فهم تشخیص داده شد. لطفاً نظر واقعی خود را به صورت جمله معنادار بنویسید.',
    };
  }

  // ۵. بررسی کلمات بسیار طولانی بدون فاصله (کوبیدن تصادفی روی کیبورد)
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.some((w) => w.length > 24)) {
    return {
      valid: false,
      reason: 'GIBBERISH',
      code: 'GIBBERISH',
      message:
        'متن واردشده شامل رشته‌های طولانی و نامفهوم از حروف است. لطفاً جملات را با فاصله مناسب بنویسید.',
    };
  }

  // ۶. بررسی ردیف‌های متوالی کیبورد (مثل ضصثقفغ یا asdfgh)
  for (const row of KEYBOARD_MASH_ROWS) {
    for (let i = 0; i <= row.length - 5; i += 1) {
      const slice = row.slice(i, i + 5);
      const revSlice = slice.split('').reverse().join('');
      if (compactNoSpaces.includes(slice) || compactNoSpaces.includes(revSlice)) {
        return {
          valid: false,
          reason: 'GIBBERISH',
          code: 'GIBBERISH',
          message:
            'متن واردشده شامل حروف تصادفی کیبورد (جفنگ) است. لطفاً تجربه واقعی خود را بنویسید.',
        };
      }
    }
  }

  // ۷. بررسی وجود حداقل ۲ کلمه واقعی
  if (words.length < 2) {
    return {
      valid: false,
      reason: 'TOO_SHORT',
      code: 'TOO_SHORT',
      message:
        'لطفاً دیدگاه خود را در قالب حداقل یک جمله کوتاه (حداقل ۲ کلمه) بیان کنید.',
    };
  }

  return { valid: true };
}
