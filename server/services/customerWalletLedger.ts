export type AllowedCustomerWalletTxType =
  | 'TOPUP'
  | 'BOOKING_PAYMENT'
  | 'REFUND_CANCEL';

export interface ServerCustomerWalletTx {
  id: string;
  customerPhone: string;
  customerName: string;
  type: AllowedCustomerWalletTxType | 'WITHDRAWAL_REQUEST';
  amountToman: number;
  title: string;
  description: string;
  trackingCode?: string;
  appointmentReferenceCode?: string;
  createdAtJalali: string;
  createdAtMs: number;
}

export const ALLOWED_CUSTOMER_WALLET_TX_TYPES = new Set<string>([
  'TOPUP',
  'BOOKING_PAYMENT',
  'REFUND_CANCEL',
]);

export function normalizeWalletPhone(raw?: string | null): string {
  const digits = String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('9')) {
    return `0${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('989')) {
    return `0${digits.slice(2)}`;
  }
  return digits;
}

export function isWalletCreditType(type: string): boolean {
  return type === 'TOPUP' || type === 'REFUND_CANCEL';
}

export function computeWalletBalanceToman(
  transactions: Array<{ type: string; amountToman: number }>
): number {
  let balance = 0;
  for (const tx of transactions) {
    const amt = Math.max(0, Math.round(Number(tx.amountToman) || 0));
    if (isWalletCreditType(tx.type)) {
      balance += amt;
    } else if (
      tx.type === 'BOOKING_PAYMENT' ||
      tx.type === 'WITHDRAWAL_REQUEST'
    ) {
      balance -= amt;
    }
  }
  return Math.max(0, balance);
}

export interface ValidatedWalletTxInput {
  type: AllowedCustomerWalletTxType;
  amountToman: number;
  title: string;
  description: string;
  trackingCode: string;
  appointmentReferenceCode?: string;
  targetCustomerPhone?: string;
  customerName?: string;
  createdAtJalali: string;
}

export function validateCustomerWalletTxInput(raw: unknown):
  | { ok: true; value: ValidatedWalletTxInput }
  | { ok: false; errorCode: string; message: string } {
  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      errorCode: 'INVALID_WALLET_PAYLOAD',
      message: 'اطلاعات تراکنش کیف پول معتبر نیست.',
    };
  }
  const body = raw as Record<string, unknown>;
  const rawType = String(body.type || '').trim();

  if (rawType === 'WITHDRAWAL_REQUEST') {
    return {
      ok: false,
      errorCode: 'BANK_WITHDRAWAL_DISABLED',
      message:
        'برداشت مستقیم بانکی فعلاً غیرفعال است؛ اعتبار کیف پول برای رزروهای بعدی قابل استفاده است و برای موارد خاص از طریق پشتیبانی پیگیری می‌شود.',
    };
  }

  if (!ALLOWED_CUSTOMER_WALLET_TX_TYPES.has(rawType)) {
    return {
      ok: false,
      errorCode: 'INVALID_WALLET_TX_TYPE',
      message: 'نوع تراکنش کیف پول معتبر نیست.',
    };
  }

  const amountNum = Number(body.amountToman);
  if (
    !Number.isFinite(amountNum) ||
    Math.round(amountNum) <= 0 ||
    Math.round(amountNum) > 500_000_000
  ) {
    return {
      ok: false,
      errorCode: 'INVALID_WALLET_AMOUNT',
      message: 'مبلغ تراکنش کیف پول معتبر نیست.',
    };
  }

  const title = String(body.title || '').trim().slice(0, 160);
  if (!title) {
    return {
      ok: false,
      errorCode: 'INVALID_WALLET_TITLE',
      message: 'عنوان تراکنش کیف پول الزامی است.',
    };
  }

  const description = String(body.description || '').trim().slice(0, 320);
  const trackingCode = String(body.trackingCode || '').trim().slice(0, 80);
  const appointmentReferenceCode = body.appointmentReferenceCode
    ? String(body.appointmentReferenceCode).trim().slice(0, 80)
    : undefined;
  const targetPhoneRaw = body.targetCustomerPhone
    ? normalizeWalletPhone(String(body.targetCustomerPhone))
    : undefined;
  if (targetPhoneRaw && !/^09\d{9}$/.test(targetPhoneRaw)) {
    return {
      ok: false,
      errorCode: 'INVALID_TARGET_PHONE',
      message: 'شماره موبایل مشتری معتبر نیست.',
    };
  }
  const customerName = body.customerName
    ? String(body.customerName).trim().slice(0, 100)
    : undefined;
  const createdAtJalali =
    String(body.createdAtJalali || 'امروز')
      .trim()
      .slice(0, 40) || 'امروز';

  return {
    ok: true,
    value: {
      type: rawType as AllowedCustomerWalletTxType,
      amountToman: Math.round(amountNum),
      title,
      description,
      trackingCode,
      appointmentReferenceCode,
      targetCustomerPhone: targetPhoneRaw,
      customerName,
      createdAtJalali,
    },
  };
}
