import fs from 'node:fs';
import path from 'node:path';

export type SmsProviderType =
  | 'disabled'
  | 'console'
  | 'kavenegar'
  | 'smsir'
  | 'melipayamak'
  | 'webhook';

export type SmsErrorCode =
  | 'SMS_GATEWAY_NOT_CONFIGURED'
  | 'SMS_INVALID_API_KEY'
  | 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED'
  | 'SMS_ARGS_MISMATCH'
  | 'SMS_INSUFFICIENT_CREDIT'
  | 'SMS_INVALID_RECIPIENT'
  | 'SMS_NETWORK_OR_TIMEOUT_ERROR'
  | 'SMS_PROVIDER_REJECTED'
  | 'SMS_DELIVERY_FAILED';

export interface SmsConfig {
  provider: SmsProviderType;
  apiKey: string | null;
  sender: string | null;
  template: string | null;
  bookingOwnerTemplate?: string | null;
  bookingCustomerTemplate?: string | null;
  apiUrl: string | null;
}

export interface SmsDeliveryResult {
  sent: boolean;
  provider: SmsProviderType;
  providerMessageId?: string;
  errorCode?: SmsErrorCode;
  providerStatusText?: string;
  httpStatus?: number;
}

export type SmsSenderFn = (
  phone: string,
  otpCode: string,
  config: SmsConfig,
  nodeEnv: 'development' | 'production' | 'test'
) => Promise<SmsDeliveryResult>;

/**
 * حذف کوتیشن‌های اضافی اطراف متغیرهای محیطی (مثلاً در صورت کپی شدن "..." در پنل Liara)
 */
function stripSurroundingQuotes(raw: string | undefined): string {
  if (!raw) return '';
  let trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی (برای مواردی که SMS_OTP_TEMPLATE با ارقام فارسی وارد شده باشد)
 */
function normalizeDigitsToEnglish(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * اگر کاربر کل آدرس وب‌سرویس اشتراکی کنسول ملی‌پیامک
 * (https://console.melipayamak.com/api/send/shared/<TOKEN>) را در SMS_API_KEY کپی کرده باشد،
 * توکن انتهایی را به صورت امن استخراج می‌کند تا URL دو بار تکرار نشود.
 */
function normalizeMelipayamakApiKey(rawKey: string): {
  extractedKey: string;
  extractedEndpoint: string | null;
} {
  const cleaned = stripSurroundingQuotes(rawKey);
  if (!cleaned) {
    return { extractedKey: '', extractedEndpoint: null };
  }

  const sharedPrefixMatch = cleaned.match(
    /^https?:\/\/console\.melipayamak\.com\/api\/send\/shared\/([^/?#\s]+)\/?$/i
  );
  if (sharedPrefixMatch && sharedPrefixMatch[1]) {
    const tokenPart = decodeURIComponent(sharedPrefixMatch[1].trim());
    return {
      extractedKey: tokenPart,
      extractedEndpoint: `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(
        tokenPart
      )}`,
    };
  }

  return { extractedKey: cleaned, extractedEndpoint: null };
}

/**
 * ماسک کردن شماره موبایل و حذف هرگونه کلید API یا کد OTP پیش از ثبت در لاگ سرور
 */
function maskPhoneForLog(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 6) return '***';
  return `${clean.slice(0, 4)}***${clean.slice(-2)}`;
}

function redactSecretsFromText(
  text: string,
  apiKey: string | null,
  otpCode: string
): string {
  let safe = text || '';
  if (apiKey && apiKey.length >= 4) {
    safe = safe.split(apiKey).join('[REDACTED_API_KEY]');
    safe = safe
      .split(encodeURIComponent(apiKey))
      .join('[REDACTED_API_KEY]');
  }
  if (otpCode && otpCode.length >= 4) {
    safe = safe.split(otpCode).join('[REDACTED_OTP]');
  }
  return safe.slice(0, 300);
}

function logSmsGatewayFailure(params: {
  provider: SmsProviderType;
  errorCode: SmsErrorCode;
  phone: string;
  bodyId?: number | string | null;
  httpStatus?: number;
  providerStatus?: string;
  detail?: string;
  apiKey: string | null;
  otpCode: string;
}): void {
  const safeStatus = params.providerStatus
    ? redactSecretsFromText(params.providerStatus, params.apiKey, params.otpCode)
    : undefined;
  const safeDetail = params.detail
    ? redactSecretsFromText(params.detail, params.apiKey, params.otpCode)
    : undefined;

  console.error(
    '[BeautyHub SMS Gateway] خطا در ارسال پیامک OTP:',
    JSON.stringify({
      provider: params.provider,
      errorCode: params.errorCode,
      httpStatus: params.httpStatus ?? null,
      bodyId: params.bodyId ?? null,
      recipient: maskPhoneForLog(params.phone),
      ...(safeStatus ? { providerStatus: safeStatus } : {}),
      ...(safeDetail ? { detail: safeDetail } : {}),
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * دسته‌بندی دقیق پاسخ خطای ملی‌پیامک بر اساس HTTP Status و فیلد status برگشتی از وب‌سرویس
 */
export function classifyMelipayamakFailure(
  httpStatus: number,
  providerStatusText: string,
  recId?: number | string | null
): SmsErrorCode {
  const normalizedStatus = (providerStatusText || '').trim().toLowerCase();

  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 404) {
    return 'SMS_INVALID_API_KEY';
  }

  if (
    normalizedStatus.includes('توکن') ||
    normalizedStatus.includes('کلید') ||
    normalizedStatus.includes('نام کاربری') ||
    normalizedStatus.includes('رمز عبور') ||
    normalizedStatus.includes('دسترسی') ||
    normalizedStatus.includes('token') ||
    normalizedStatus.includes('unauthorized') ||
    normalizedStatus.includes('invalid key')
  ) {
    return 'SMS_INVALID_API_KEY';
  }

  if (
    normalizedStatus.includes('پارامتر') ||
    normalizedStatus.includes('آرگومان') ||
    normalizedStatus.includes('متغیر') ||
    normalizedStatus.includes('همخوانی ندارد') ||
    normalizedStatus.includes('مطابقت ندارد') ||
    normalizedStatus.includes('args')
  ) {
    return 'SMS_ARGS_MISMATCH';
  }

  if (
    normalizedStatus.includes('الگو') ||
    normalizedStatus.includes('کد متن') ||
    normalizedStatus.includes('تایید نشده') ||
    normalizedStatus.includes('تأیید نشده') ||
    normalizedStatus.includes('پترن') ||
    normalizedStatus.includes('bodyid') ||
    normalizedStatus.includes('pattern')
  ) {
    return 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED';
  }

  if (
    normalizedStatus.includes('اعتبار') ||
    normalizedStatus.includes('شارژ') ||
    normalizedStatus.includes('موجودی') ||
    normalizedStatus.includes('credit')
  ) {
    return 'SMS_INSUFFICIENT_CREDIT';
  }

  if (
    normalizedStatus.includes('شماره') ||
    normalizedStatus.includes('گیرنده') ||
    normalizedStatus.includes('مسدود') ||
    normalizedStatus.includes('لیست سیاه')
  ) {
    return 'SMS_INVALID_RECIPIENT';
  }

  // در برخی نسخه‌های وب‌سرویس ملی‌پیامک، کدهای عددی کوچک در recId (مثلاً -1 تا 35) نشان‌دهنده کد خطا هستند
  if (recId !== undefined && recId !== null && String(recId).trim() !== '') {
    const numericRecId = Number(String(recId).trim());
    if (!Number.isNaN(numericRecId)) {
      if (numericRecId === 0 || numericRecId === -1 || numericRecId === 3) {
        return 'SMS_INVALID_API_KEY';
      }
      if (numericRecId === 2) {
        return 'SMS_INSUFFICIENT_CREDIT';
      }
      if (numericRecId === -2 || numericRecId === -3 || numericRecId === -4 || numericRecId === 16 || numericRecId === 17) {
        return 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED';
      }
      if (numericRecId === -5 || numericRecId === 6 || numericRecId === 11) {
        return 'SMS_INVALID_RECIPIENT';
      }
    }
  }

  return 'SMS_PROVIDER_REJECTED';
}

export function resolveSmsConfig(
  envSource: Record<string, string | undefined> = process.env
): SmsConfig {
  const rawProvider = stripSurroundingQuotes(envSource.SMS_PROVIDER).toLowerCase();
  const validProviders: SmsProviderType[] = [
    'disabled',
    'console',
    'kavenegar',
    'smsir',
    'melipayamak',
    'webhook',
  ];

  const nodeEnv = stripSurroundingQuotes(
    envSource.NODE_ENV ?? 'development'
  ).toLowerCase();
  const defaultProvider: SmsProviderType =
    nodeEnv === 'production' ? 'disabled' : 'console';

  const provider: SmsProviderType = validProviders.includes(
    rawProvider as SmsProviderType
  )
    ? (rawProvider as SmsProviderType)
    : defaultProvider;

  const rawApiKey = stripSurroundingQuotes(envSource.SMS_API_KEY);
  const rawSender = stripSurroundingQuotes(envSource.SMS_SENDER);
  const rawTemplate = normalizeDigitsToEnglish(
    stripSurroundingQuotes(envSource.SMS_OTP_TEMPLATE)
  );
  const rawBookingOwnerTemplate = normalizeDigitsToEnglish(
    stripSurroundingQuotes(envSource.SMS_BOOKING_OWNER_TEMPLATE)
  );
  const rawBookingCustomerTemplate = normalizeDigitsToEnglish(
    stripSurroundingQuotes(envSource.SMS_BOOKING_CUSTOMER_TEMPLATE)
  );
  const rawApiUrl = stripSurroundingQuotes(envSource.SMS_API_URL);

  if (provider === 'melipayamak') {
    const { extractedKey, extractedEndpoint } =
      normalizeMelipayamakApiKey(rawApiKey);
    return {
      provider,
      apiKey: extractedKey || null,
      sender: rawSender || null,
      template: rawTemplate || null,
      bookingOwnerTemplate: rawBookingOwnerTemplate || null,
      bookingCustomerTemplate: rawBookingCustomerTemplate || null,
      apiUrl: rawApiUrl || extractedEndpoint || null,
    };
  }

  return {
    provider,
    apiKey: rawApiKey || null,
    sender: rawSender || null,
    template: rawTemplate || null,
    bookingOwnerTemplate: rawBookingOwnerTemplate || null,
    bookingCustomerTemplate: rawBookingCustomerTemplate || null,
    apiUrl: rawApiUrl || null,
  };
}

const smsGatewayConfigFilePath = path.resolve(
  process.cwd(),
  'sms-gateway-config.json'
);

function readPersistedSmsConfig(): SmsConfig | null {
  if (process.env.NODE_ENV === 'test') return null;
  try {
    if (fs.existsSync(smsGatewayConfigFilePath)) {
      const raw = fs.readFileSync(smsGatewayConfigFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<SmsConfig>;
      if (parsed && parsed.provider && parsed.apiKey) {
        return {
          provider: parsed.provider,
          apiKey: parsed.apiKey || null,
          sender: parsed.sender || null,
          template: parsed.template || null,
          bookingOwnerTemplate: parsed.bookingOwnerTemplate || null,
          bookingCustomerTemplate: parsed.bookingCustomerTemplate || null,
          apiUrl: parsed.apiUrl || null,
        };
      }
    }
  } catch {
    // ignore read error
  }
  return null;
}

function writePersistedSmsConfig(cfg: SmsConfig | null): void {
  if (process.env.NODE_ENV === 'test') return;
  try {
    if (!cfg) {
      if (fs.existsSync(smsGatewayConfigFilePath)) {
        fs.unlinkSync(smsGatewayConfigFilePath);
      }
      return;
    }
    fs.writeFileSync(
      smsGatewayConfigFilePath,
      JSON.stringify(cfg, null, 2),
      'utf-8'
    );
  } catch {
    // ignore write error
  }
}

let runtimeSmsOverride: SmsConfig | null = readPersistedSmsConfig();

export function setRuntimeSmsOverride(input: {
  provider?: SmsProviderType;
  apiKey?: string | null;
  sender?: string | null;
  template?: string | null;
  bookingOwnerTemplate?: string | null;
  bookingCustomerTemplate?: string | null;
  apiUrl?: string | null;
} | null): SmsConfig | null {
  if (!input) {
    runtimeSmsOverride = null;
    writePersistedSmsConfig(null);
    return null;
  }

  const provider: SmsProviderType = input.provider ?? 'melipayamak';
  const rawKey = stripSurroundingQuotes(input.apiKey ?? '');
  const rawSender = stripSurroundingQuotes(input.sender ?? '');
  const rawTemplate = normalizeDigitsToEnglish(
    stripSurroundingQuotes(input.template ?? '')
  );
  const rawBookingOwner = normalizeDigitsToEnglish(
    stripSurroundingQuotes(
      input.bookingOwnerTemplate ?? runtimeSmsOverride?.bookingOwnerTemplate ?? ''
    )
  );
  const rawBookingCustomer = normalizeDigitsToEnglish(
    stripSurroundingQuotes(
      input.bookingCustomerTemplate ??
        runtimeSmsOverride?.bookingCustomerTemplate ??
        ''
    )
  );
  const rawUrl = stripSurroundingQuotes(input.apiUrl ?? '');

  if (provider === 'melipayamak') {
    const { extractedKey, extractedEndpoint } =
      normalizeMelipayamakApiKey(rawKey);
    runtimeSmsOverride = {
      provider: 'melipayamak',
      apiKey: extractedKey || null,
      sender: rawSender || null,
      template: rawTemplate || null,
      bookingOwnerTemplate: rawBookingOwner || null,
      bookingCustomerTemplate: rawBookingCustomer || null,
      apiUrl: rawUrl || extractedEndpoint || null,
    };
    writePersistedSmsConfig(runtimeSmsOverride);
    return runtimeSmsOverride;
  }

  runtimeSmsOverride = {
    provider,
    apiKey: rawKey || null,
    sender: rawSender || null,
    template: rawTemplate || null,
    bookingOwnerTemplate: rawBookingOwner || null,
    bookingCustomerTemplate: rawBookingCustomer || null,
    apiUrl: rawUrl || null,
  };
  writePersistedSmsConfig(runtimeSmsOverride);
  return runtimeSmsOverride;
}

export function getRuntimeSmsOverride(): SmsConfig | null {
  return runtimeSmsOverride;
}

export function resolveEffectiveSmsConfig(baseConfig: SmsConfig): SmsConfig {
  if (!runtimeSmsOverride && process.env.NODE_ENV !== 'test') {
    runtimeSmsOverride = readPersistedSmsConfig();
  }
  if (!runtimeSmsOverride) {
    return baseConfig;
  }
  return {
    provider:
      runtimeSmsOverride.provider !== 'disabled'
        ? runtimeSmsOverride.provider
        : baseConfig.provider,
    apiKey: runtimeSmsOverride.apiKey || baseConfig.apiKey,
    sender: runtimeSmsOverride.sender || baseConfig.sender,
    template: runtimeSmsOverride.template || baseConfig.template,
    bookingOwnerTemplate:
      runtimeSmsOverride.bookingOwnerTemplate ||
      baseConfig.bookingOwnerTemplate ||
      null,
    bookingCustomerTemplate:
      runtimeSmsOverride.bookingCustomerTemplate ||
      baseConfig.bookingCustomerTemplate ||
      null,
    apiUrl: runtimeSmsOverride.apiUrl || baseConfig.apiUrl,
  };
}

export function maskApiKeyForDisplay(apiKey: string | null): string | null {
  if (!apiKey) return null;
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return '****';
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}

/**
 * ارسال واقعی پیامک کد یک‌بارمصرف (OTP) از طریق درگاه پیامکی تنظیم‌شده
 * - در محیط Production:
 *   ۱. حالت‌های آزمایشی ('console' یا 'disabled') غیرمجاز هستند و خطای SMS_GATEWAY_NOT_CONFIGURED برمی‌گردانند.
 *   ۲. هیچ کد ثابتی وجود ندارد و کد OTP یا کلید API هرگز در خروجی یا لاگ Production چاپ نمی‌شود.
 *   ۳. موفقیت ارسال تنها پس از دریافت تاییدیه HTTP 200 معتبر و شناسه پیگیری واقعی (recId) از سرویس‌دهنده گزارش می‌شود.
 */
export async function sendOtpSmsViaGateway(
  phone: string,
  otpCode: string,
  config: SmsConfig,
  nodeEnv: 'development' | 'production' | 'test'
): Promise<SmsDeliveryResult> {
  if (nodeEnv === 'production') {
    if (
      config.provider === 'disabled' ||
      config.provider === 'console' ||
      !config.apiKey
    ) {
      logSmsGatewayFailure({
        provider: config.provider,
        errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
        phone,
        detail:
          'SMS_PROVIDER is disabled/console or SMS_API_KEY is empty in production.',
        apiKey: config.apiKey,
        otpCode,
      });
      return {
        sent: false,
        provider: config.provider,
        errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
      };
    }
  } else {
    if (config.provider === 'disabled') {
      return {
        sent: false,
        provider: 'disabled',
        errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
      };
    }
    if (config.provider === 'console') {
      if (nodeEnv === 'development') {
        console.info(
          `[BeautyHub Dev SMS] OTP generated for ${maskPhoneForLog(phone)} (dev console mode)`
        );
      }
      return {
        sent: true,
        provider: 'console',
        providerMessageId: `dev-console-${Date.now()}`,
      };
    }
    if (!config.apiKey) {
      return {
        sent: false,
        provider: config.provider,
        errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
      };
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    if (config.provider === 'kavenegar') {
      const template = config.template || 'beautyhub-verify';
      const url = new URL(
        `https://api.kavenegar.com/v1/${encodeURIComponent(
          config.apiKey!
        )}/verify/lookup.json`
      );
      url.searchParams.set('receptor', phone);
      url.searchParams.set('token', otpCode);
      url.searchParams.set('template', template);

      const res = await fetch(url.toString(), {
        method: 'POST',
        signal: controller.signal,
      });

      if (!res.ok) {
        logSmsGatewayFailure({
          provider: 'kavenegar',
          errorCode: 'SMS_PROVIDER_REJECTED',
          phone,
          httpStatus: res.status,
          apiKey: config.apiKey,
          otpCode,
        });
        return {
          sent: false,
          provider: 'kavenegar',
          errorCode: 'SMS_PROVIDER_REJECTED',
          httpStatus: res.status,
        };
      }

      const data = (await res.json()) as {
        return?: { status?: number; message?: string };
        entries?: Array<{ messageid?: number | string }>;
      };
      if (data?.return?.status !== 200) {
        logSmsGatewayFailure({
          provider: 'kavenegar',
          errorCode: 'SMS_PROVIDER_REJECTED',
          phone,
          httpStatus: res.status,
          providerStatus: data?.return?.message,
          apiKey: config.apiKey,
          otpCode,
        });
        return {
          sent: false,
          provider: 'kavenegar',
          errorCode: 'SMS_PROVIDER_REJECTED',
          httpStatus: res.status,
        };
      }

      return {
        sent: true,
        provider: 'kavenegar',
        providerMessageId: String(data.entries?.[0]?.messageid ?? 'kavenegar-ok'),
      };
    }

    if (config.provider === 'smsir') {
      const templateId = Number(config.template);
      if (!Number.isInteger(templateId) || templateId <= 0) {
        logSmsGatewayFailure({
          provider: 'smsir',
          errorCode: 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED',
          phone,
          bodyId: config.template,
          detail: 'SMS_OTP_TEMPLATE must be a positive integer TemplateId.',
          apiKey: config.apiKey,
          otpCode,
        });
        return {
          sent: false,
          provider: 'smsir',
          errorCode: 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED',
        };
      }

      const res = await fetch('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': config.apiKey!,
        },
        body: JSON.stringify({
          mobile: phone,
          templateId,
          parameters: [{ name: 'CODE', value: otpCode }],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        logSmsGatewayFailure({
          provider: 'smsir',
          errorCode: 'SMS_PROVIDER_REJECTED',
          phone,
          bodyId: templateId,
          httpStatus: res.status,
          apiKey: config.apiKey,
          otpCode,
        });
        return {
          sent: false,
          provider: 'smsir',
          errorCode: 'SMS_PROVIDER_REJECTED',
          httpStatus: res.status,
        };
      }

      const data = (await res.json()) as {
        status?: number;
        message?: string;
        data?: { messageId?: number | string };
      };
      if (data?.status !== 1) {
        logSmsGatewayFailure({
          provider: 'smsir',
          errorCode: 'SMS_PROVIDER_REJECTED',
          phone,
          bodyId: templateId,
          httpStatus: res.status,
          providerStatus: data?.message,
          apiKey: config.apiKey,
          otpCode,
        });
        return {
          sent: false,
          provider: 'smsir',
          errorCode: 'SMS_PROVIDER_REJECTED',
          httpStatus: res.status,
        };
      }

      return {
        sent: true,
        provider: 'smsir',
        providerMessageId: String(data.data?.messageId ?? 'smsir-ok'),
      };
    }

    if (config.provider === 'melipayamak') {
      const normalizedTemplate = normalizeDigitsToEnglish(
        stripSurroundingQuotes(config.template ?? '')
      );
      const bodyId = Number(normalizedTemplate);
      if (!Number.isInteger(bodyId) || bodyId <= 0) {
        logSmsGatewayFailure({
          provider: 'melipayamak',
          errorCode: 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED',
          phone,
          bodyId: config.template,
          detail:
            'SMS_OTP_TEMPLATE برای ملی‌پیامک باید کد عددی مثبت الگو (bodyId) باشد.',
          apiKey: config.apiKey,
          otpCode,
        });
        return {
          sent: false,
          provider: 'melipayamak',
          errorCode: 'SMS_TEMPLATE_INVALID_OR_UNAPPROVED',
        };
      }

      const { extractedKey, extractedEndpoint } = normalizeMelipayamakApiKey(
        config.apiKey!
      );
      const endpoint =
        config.apiUrl ||
        extractedEndpoint ||
        `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(
          extractedKey
        )}`;

      const cleanRecipient = normalizeDigitsToEnglish(phone).replace(/\D/g, '');
      const cleanOtpArg = String(normalizeDigitsToEnglish(otpCode).trim());
      const requestBody = JSON.stringify({
        bodyId,
        to: cleanRecipient,
        args: [cleanOtpArg],
      });

      let res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      });

      // در کنسول ملی‌پیامک گاهی توکن ۳۲ کاراکتری بدون خط تیره (UUID بدون -) در URL قرار می‌گیرد
      if (
        res.status === 404 &&
        !config.apiUrl &&
        !extractedEndpoint &&
        extractedKey.includes('-')
      ) {
        const dashlessKey = extractedKey.replace(/-/g, '');
        const fallbackEndpoint = `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(
          dashlessKey
        )}`;
        res = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: requestBody,
          signal: controller.signal,
        });
      }

      const rawResponseText = await res.text();
      let data: { recId?: number | string; status?: string } | null = null;
      try {
        data = rawResponseText
          ? (JSON.parse(rawResponseText) as {
              recId?: number | string;
              status?: string;
            })
          : null;
      } catch {
        data = null;
      }

      const providerStatusText =
        typeof data?.status === 'string'
          ? data.status.trim()
          : rawResponseText.slice(0, 160).trim();

      if (!res.ok) {
        const errorCode = classifyMelipayamakFailure(
          res.status,
          providerStatusText,
          data?.recId
        );
        logSmsGatewayFailure({
          provider: 'melipayamak',
          errorCode,
          phone: cleanRecipient,
          bodyId,
          httpStatus: res.status,
          providerStatus: providerStatusText,
          apiKey: extractedKey,
          otpCode: cleanOtpArg,
        });
        return {
          sent: false,
          provider: 'melipayamak',
          errorCode,
          providerStatusText,
          httpStatus: res.status,
        };
      }

      const recIdStr =
        data?.recId !== undefined && data?.recId !== null
          ? String(data.recId).trim()
          : '';
      const numericRecId = recIdStr ? Number(recIdStr) : Number.NaN;
      // در کنسول ملی‌پیامک، ارسال موفق دارای recId بزرگ‌تر از 100 (شناسه یکتای پیامک) است؛
      // نبود recId یا اعداد کوچک/منفی یا وجود پیام خطا در status به معنای رد شدن ارسال است.
      const hasValidTrackingRecId =
        Boolean(recIdStr) &&
        (Number.isNaN(numericRecId) || numericRecId > 100);

      if (!hasValidTrackingRecId) {
        const errorCode = classifyMelipayamakFailure(
          res.status,
          providerStatusText,
          data?.recId
        );
        logSmsGatewayFailure({
          provider: 'melipayamak',
          errorCode,
          phone: cleanRecipient,
          bodyId,
          httpStatus: res.status,
          providerStatus: providerStatusText || `recId=${recIdStr || 'empty'}`,
          apiKey: extractedKey,
          otpCode: cleanOtpArg,
        });
        return {
          sent: false,
          provider: 'melipayamak',
          errorCode,
          providerStatusText,
          httpStatus: res.status,
        };
      }

      return {
        sent: true,
        provider: 'melipayamak',
        providerMessageId: recIdStr,
        httpStatus: res.status,
      };
    }

    if (config.provider === 'webhook') {
      if (!config.apiUrl) {
        return {
          sent: false,
          provider: 'webhook',
          errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
        };
      }

      const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey!}`,
        },
        body: JSON.stringify({
          phone,
          code: otpCode,
          sender: config.sender,
          template: config.template,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        logSmsGatewayFailure({
          provider: 'webhook',
          errorCode: 'SMS_PROVIDER_REJECTED',
          phone,
          httpStatus: res.status,
          apiKey: config.apiKey,
          otpCode,
        });
        return {
          sent: false,
          provider: 'webhook',
          errorCode: 'SMS_PROVIDER_REJECTED',
          httpStatus: res.status,
        };
      }

      return {
        sent: true,
        provider: 'webhook',
        providerMessageId: `webhook-${Date.now()}`,
      };
    }

    return {
      sent: false,
      provider: config.provider,
      errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logSmsGatewayFailure({
      provider: config.provider,
      errorCode: 'SMS_NETWORK_OR_TIMEOUT_ERROR',
      phone,
      bodyId: config.template,
      detail: errMsg,
      apiKey: config.apiKey,
      otpCode,
    });
    return {
      sent: false,
      provider: config.provider,
      errorCode: 'SMS_NETWORK_OR_TIMEOUT_ERROR',
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * ارسال پیامک خدماتی چندپارامتری (پترن ثبت نوبت، تایید نوبت و یادآور قبل از نوبت در ملی‌پیامک)
 * اگر متغیر محیطی پترن اختصاصی (مثلاً SMS_BOOKING_OWNER_TEMPLATE یا SMS_REMINDER_TEMPLATE) تنظیم شده باشد،
 * آرایه کامل args به آن bodyId ارسال می‌شود؛ و اگر هنوز تنظیم نشده باشد، به صورت هوشمند به پترن تک‌پارامتری SMS_OTP_TEMPLATE سوییچ می‌کند تا ارسال پیامک با خطای عدم تطابق پارامتر مواجه نشود.
 */
export async function sendPatternSmsViaGateway(params: {
  phone: string;
  args: string[];
  fallbackSingleArg: string;
  customTemplateId?: string | null;
  config: SmsConfig;
  nodeEnv: 'development' | 'production' | 'test';
}): Promise<SmsDeliveryResult> {
  const { phone, args, fallbackSingleArg, customTemplateId, config, nodeEnv } =
    params;

  const trimmedCustomTemplate = stripSurroundingQuotes(
    customTemplateId ?? undefined
  );
  const hasDedicatedPattern =
    Boolean(trimmedCustomTemplate) &&
    /^\d+$/.test(normalizeDigitsToEnglish(trimmedCustomTemplate));

  const sendWithSingleArgFallback = async (): Promise<SmsDeliveryResult> => {
    const firstAttempt = await sendOtpSmsViaGateway(
      phone,
      fallbackSingleArg,
      config,
      nodeEnv
    );
    if (firstAttempt.sent || config.provider !== 'melipayamak') {
      return firstAttempt;
    }
    // اگر پترن تک‌متغیره ملی‌پیامک به دلیل فاصله (Space) خطا داد، نسخه بدون فاصله یا کد عددی ارسال شود
    const compactArg = fallbackSingleArg.trim().replace(/\s+/g, '-');
    if (compactArg && compactArg !== fallbackSingleArg) {
      const secondAttempt = await sendOtpSmsViaGateway(
        phone,
        compactArg,
        config,
        nodeEnv
      );
      if (secondAttempt.sent) {
        return secondAttempt;
      }
    }
    const digitsOnly = normalizeDigitsToEnglish(fallbackSingleArg).replace(
      /\D/g,
      ''
    );
    const numericFallback =
      digitsOnly.length >= 4 ? digitsOnly.slice(-6) : '140524';
    return sendOtpSmsViaGateway(phone, numericFallback, config, nodeEnv);
  };

  // اگر پترن چندپارامتری اختصاصی تعریف نشده و درگاه غیر از ملی‌پیامک است
  if (config.provider !== 'melipayamak') {
    return sendWithSingleArgFallback();
  }

  const { extractedKey, extractedEndpoint } = normalizeMelipayamakApiKey(
    config.apiKey || ''
  );
  if (!extractedKey) {
    return {
      sent: false,
      provider: 'melipayamak',
      errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
    };
  }

  const endpoint =
    config.apiUrl ||
    extractedEndpoint ||
    `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(
      extractedKey
    )}`;
  const cleanRecipient = normalizeDigitsToEnglish(phone).replace(/\D/g, '');
  const cleanArgs = args.map((a) => String(a ?? '').trim());

  // جمع‌آوری شناسه‌های الگوی کاندید: ابتدا الگوی اختصاصی نوبت (در صورت وجود)، سپس الگوی اصلی (SMS_OTP_TEMPLATE)
  const candidateBodyIds: number[] = [];
  if (hasDedicatedPattern) {
    const customIdNum = Number.parseInt(
      normalizeDigitsToEnglish(trimmedCustomTemplate),
      10
    );
    if (!Number.isNaN(customIdNum) && customIdNum > 0) {
      candidateBodyIds.push(customIdNum);
    }
  }
  const mainTemplateClean = normalizeDigitsToEnglish(
    stripSurroundingQuotes(config.template ?? undefined)
  );
  if (/^\d+$/.test(mainTemplateClean)) {
    const mainIdNum = Number.parseInt(mainTemplateClean, 10);
    if (
      !Number.isNaN(mainIdNum) &&
      mainIdNum > 0 &&
      !candidateBodyIds.includes(mainIdNum)
    ) {
      candidateBodyIds.push(mainIdNum);
    }
  }

  if (candidateBodyIds.length === 0) {
    return sendWithSingleArgFallback();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    // لیست کاندیدهای آرایه args برای تطبیق خودکار با پترن‌های ۴، ۳، ۲ و ۱ متغیره در ملی‌پیامک:
    const candidateArgsList: string[][] = [cleanArgs];
    if (cleanArgs.length === 4) {
      candidateArgsList.push([cleanArgs[0], cleanArgs[2], cleanArgs[3]]);
      candidateArgsList.push([
        cleanArgs[0],
        `${cleanArgs[2]} ساعت ${cleanArgs[3]}`,
      ]);
    }
    candidateArgsList.push([fallbackSingleArg]);
    const compactSingle = fallbackSingleArg.trim().replace(/\s+/g, '-');
    if (compactSingle && compactSingle !== fallbackSingleArg) {
      candidateArgsList.push([compactSingle]);
    }

    for (const targetBodyId of candidateBodyIds) {
      for (const candidateArgs of candidateArgsList) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            bodyId: targetBodyId,
            to: cleanRecipient,
            args: candidateArgs,
          }),
          signal: controller.signal,
        });
        const rawText = await res.text();
        let parsed: { recId?: number | string; status?: string } | null = null;
        try {
          parsed = rawText ? JSON.parse(rawText) : null;
        } catch {
          parsed = null;
        }
        const recIdStr = parsed?.recId ? String(parsed.recId).trim() : '';
        const numericRecId = recIdStr ? Number(recIdStr) : Number.NaN;
        if (
          res.ok &&
          recIdStr &&
          (Number.isNaN(numericRecId) || numericRecId > 100)
        ) {
          return {
            sent: true,
            provider: 'melipayamak',
            providerMessageId: recIdStr,
            httpStatus: res.status,
          };
        }
      }
    }

    return sendWithSingleArgFallback();
  } catch {
    return sendWithSingleArgFallback();
  } finally {
    clearTimeout(timeout);
  }
}

