export type SmsProviderType =
  | 'disabled'
  | 'console'
  | 'kavenegar'
  | 'smsir'
  | 'melipayamak'
  | 'webhook';

export interface SmsConfig {
  provider: SmsProviderType;
  apiKey: string | null;
  sender: string | null;
  template: string | null;
  apiUrl: string | null;
}

export interface SmsDeliveryResult {
  sent: boolean;
  provider: SmsProviderType;
  providerMessageId?: string;
  errorCode?:
    | 'SMS_GATEWAY_NOT_CONFIGURED'
    | 'SMS_PROVIDER_REJECTED'
    | 'SMS_DELIVERY_FAILED';
}

export type SmsSenderFn = (
  phone: string,
  otpCode: string,
  config: SmsConfig,
  nodeEnv: 'development' | 'production' | 'test'
) => Promise<SmsDeliveryResult>;

export function resolveSmsConfig(
  envSource: Record<string, string | undefined> = process.env
): SmsConfig {
  const rawProvider = (envSource.SMS_PROVIDER ?? '').trim().toLowerCase();
  const validProviders: SmsProviderType[] = [
    'disabled',
    'console',
    'kavenegar',
    'smsir',
    'melipayamak',
    'webhook',
  ];

  const nodeEnv = (envSource.NODE_ENV ?? 'development').trim().toLowerCase();
  const defaultProvider: SmsProviderType =
    nodeEnv === 'production' ? 'disabled' : 'console';

  const provider: SmsProviderType = validProviders.includes(
    rawProvider as SmsProviderType
  )
    ? (rawProvider as SmsProviderType)
    : defaultProvider;

  return {
    provider,
    apiKey: envSource.SMS_API_KEY?.trim() || null,
    sender: envSource.SMS_SENDER?.trim() || null,
    template: envSource.SMS_OTP_TEMPLATE?.trim() || null,
    apiUrl: envSource.SMS_API_URL?.trim() || null,
  };
}

/**
 * ارسال واقعی پیامک کد یک‌بارمصرف (OTP) از طریق درگاه پیامکی تنظیم‌شده
 * - در محیط Production:
 *   ۱. حالت‌های آزمایشی ('console' یا 'disabled') غیرمجاز هستند و خطای SMS_GATEWAY_NOT_CONFIGURED برمی‌گردانند.
 *   ۲. هیچ کد ثابتی وجود ندارد و کد OTP هرگز در خروجی یا لاگ Production چاپ نمی‌شود.
 *   ۳. موفقیت ارسال تنها پس از دریافت تاییدیه HTTP 200 معتبر از سرویس‌دهنده پیامک گزارش می‌شود.
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
          `[BeautyHub Dev SMS] OTP generated for ${phone.slice(0, 4)}***${phone.slice(-2)} (dev console mode)`
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
        return {
          sent: false,
          provider: 'kavenegar',
          errorCode: 'SMS_PROVIDER_REJECTED',
        };
      }

      const data = (await res.json()) as {
        return?: { status?: number };
        entries?: Array<{ messageid?: number | string }>;
      };
      if (data?.return?.status !== 200) {
        return {
          sent: false,
          provider: 'kavenegar',
          errorCode: 'SMS_PROVIDER_REJECTED',
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
        return {
          sent: false,
          provider: 'smsir',
          errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
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
        return {
          sent: false,
          provider: 'smsir',
          errorCode: 'SMS_PROVIDER_REJECTED',
        };
      }

      const data = (await res.json()) as {
        status?: number;
        data?: { messageId?: number | string };
      };
      if (data?.status !== 1) {
        return {
          sent: false,
          provider: 'smsir',
          errorCode: 'SMS_PROVIDER_REJECTED',
        };
      }

      return {
        sent: true,
        provider: 'smsir',
        providerMessageId: String(data.data?.messageId ?? 'smsir-ok'),
      };
    }

    if (config.provider === 'melipayamak') {
      const bodyId = Number(config.template);
      if (!Number.isInteger(bodyId) || bodyId <= 0) {
        return {
          sent: false,
          provider: 'melipayamak',
          errorCode: 'SMS_GATEWAY_NOT_CONFIGURED',
        };
      }

      const endpoint =
        config.apiUrl ||
        `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(
          config.apiKey!
        )}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyId,
          to: phone,
          args: [otpCode],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          sent: false,
          provider: 'melipayamak',
          errorCode: 'SMS_PROVIDER_REJECTED',
        };
      }

      const data = (await res.json()) as { recId?: number | string; status?: string };
      if (!data?.recId) {
        return {
          sent: false,
          provider: 'melipayamak',
          errorCode: 'SMS_PROVIDER_REJECTED',
        };
      }

      return {
        sent: true,
        provider: 'melipayamak',
        providerMessageId: String(data.recId),
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
        return {
          sent: false,
          provider: 'webhook',
          errorCode: 'SMS_PROVIDER_REJECTED',
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
  } catch {
    return {
      sent: false,
      provider: config.provider,
      errorCode: 'SMS_DELIVERY_FAILED',
    };
  } finally {
    clearTimeout(timeout);
  }
}
