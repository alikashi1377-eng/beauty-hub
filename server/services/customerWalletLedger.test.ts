import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeWalletBalanceToman,
  isWalletCreditType,
  normalizeWalletPhone,
  validateCustomerWalletTxInput,
} from './customerWalletLedger';

test('normalizeWalletPhone handles Persian digits, +98 prefix, and 10-digit mobile numbers', () => {
  assert.equal(normalizeWalletPhone('۰۹۱۳۱۲۳۴۵۶۷'), '09131234567');
  assert.equal(normalizeWalletPhone('+98 913 123 4567'), '09131234567');
  assert.equal(normalizeWalletPhone('9131234567'), '09131234567');
});

test('computeWalletBalanceToman adds credits and subtracts debits without going negative', () => {
  const balance = computeWalletBalanceToman([
    { type: 'TOPUP', amountToman: 300_000 },
    { type: 'REFUND_CANCEL', amountToman: 150_000 },
    { type: 'BOOKING_PAYMENT', amountToman: 200_000 },
  ]);
  assert.equal(balance, 250_000);
  assert.equal(isWalletCreditType('REFUND_CANCEL'), true);
  assert.equal(isWalletCreditType('BOOKING_PAYMENT'), false);

  const clamped = computeWalletBalanceToman([
    { type: 'BOOKING_PAYMENT', amountToman: 500_000 },
  ]);
  assert.equal(clamped, 0);
});

test('validateCustomerWalletTxInput blocks bank withdrawals and invalid payloads while accepting valid wallet credits/debits', () => {
  const withdrawRes = validateCustomerWalletTxInput({
    type: 'WITHDRAWAL_REQUEST',
    amountToman: 100_000,
    title: 'برداشت به کارت',
  });
  assert.equal(withdrawRes.ok, false);
  if (!withdrawRes.ok) {
    assert.equal(withdrawRes.errorCode, 'BANK_WITHDRAWAL_DISABLED');
  }

  const badAmt = validateCustomerWalletTxInput({
    type: 'TOPUP',
    amountToman: -500,
    title: 'شارژ',
  });
  assert.equal(badAmt.ok, false);

  const validRefund = validateCustomerWalletTxInput({
    type: 'REFUND_CANCEL',
    amountToman: 120_000,
    title: 'بازگشت بیعانه لغو نوبت',
    description: 'لغو نوبت در مهلت مجاز',
    trackingCode: 'RF-12345678',
    appointmentReferenceCode: 'TT-998877',
    targetCustomerPhone: '۰۹۱۳۸۲۰۱۰۴۲',
    createdAtJalali: '1405/09/06',
  });
  assert.equal(validRefund.ok, true);
  if (validRefund.ok) {
    assert.equal(validRefund.value.type, 'REFUND_CANCEL');
    assert.equal(validRefund.value.amountToman, 120_000);
    assert.equal(validRefund.value.targetCustomerPhone, '09138201042');
  }
});
