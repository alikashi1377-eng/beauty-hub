import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { SponsoredPlacementSlot } from '../../types';
import {
  computeAdPackagePriceAndTitle,
  formatPriceToman,
  toPersianDigits,
} from '../../utils/formatters';
import { Button } from './Button';
import { FormField } from './FormField';
import { Input } from './Input';
import { Modal } from './Modal';
import { Select } from './Select';

export interface CheckoutItemPayload {
  itemType: 'PLAN' | 'AD_PACKAGE' | 'SMS_PACK';
  itemId: string;
  itemTitle: string;
  baseAmountToman: number;
  weeklyAmountToman?: number;
  defaultPlacement?: SponsoredPlacementSlot;
  defaultDurationDays?: number;
  defaultLabel?: string;
  smsCount?: number;
}

export const EasyCheckoutModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: CheckoutItemPayload | null;
  businessId: string;
  businessName: string;
  onPaymentSuccess?: (item: CheckoutItemPayload) => void;
}> = ({
  isOpen,
  onClose,
  item,
  businessId,
  businessName,
  onPaymentSuccess,
}) => {
  const { paymentConfig, submitPaymentOrder, showToast } = usePrototypeData();

  const [paymentMethod, setPaymentMethod] = useState<'BALEPAY' | 'CARD_TO_CARD'>(
    'BALEPAY'
  );
  const [durationDays, setDurationDays] = useState<number>(
    item?.defaultDurationDays || 30
  );
  const [placementSlot, setPlacementSlot] = useState<SponsoredPlacementSlot>(
    item?.defaultPlacement || 'SEARCH_TOP'
  );
  const [customBadgeLabel, setCustomBadgeLabel] = useState<string>(
    item?.defaultLabel || 'پیشنهاد ویژه · رزرو آنی'
  );
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [instantActivate, setInstantActivate] = useState<boolean>(true);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  React.useEffect(() => {
    if (item) {
      setDurationDays(item.defaultDurationDays || 30);
      setPlacementSlot(item.defaultPlacement || 'SEARCH_TOP');
      setCustomBadgeLabel(item.defaultLabel || 'پیشنهاد ویژه · رزرو آنی');
      setTrackingCode('');
      setCompletedOrderId(null);
    }
  }, [item, isOpen]);

  if (!item) return null;

  const dynamicAdCalc =
    item.itemType === 'AD_PACKAGE'
      ? computeAdPackagePriceAndTitle({
          placementSlot,
          durationDays,
          fallbackBaseAmount: item.baseAmountToman,
          fallbackWeeklyAmount: item.weeklyAmountToman,
          fallbackTitle: item.itemTitle,
        })
      : null;

  const computedAmount = dynamicAdCalc
    ? dynamicAdCalc.amountToman
    : item.baseAmountToman;

  const resolvedItemTitle = dynamicAdCalc
    ? dynamicAdCalc.title
    : item.itemTitle;

  const handleCopyCard = () => {
    navigator.clipboard?.writeText(paymentConfig.cardNumber);
    showToast('شماره کارت کپی شد.');
  };

  const handleCopyBale = () => {
    navigator.clipboard?.writeText(paymentConfig.balePayLink);
    showToast('لینک پرداخت بله‌پی کپی شد.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTracking =
      trackingCode.trim() ||
      `${paymentMethod === 'BALEPAY' ? 'BALE' : 'CARD'}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const createdOrder = submitPaymentOrder(
      {
        businessId,
        businessName,
        itemType: item.itemType,
        itemId: item.itemId,
        itemTitle:
          item.itemType === 'AD_PACKAGE'
            ? `${resolvedItemTitle} (${toPersianDigits(durationDays)} روزه)`
            : resolvedItemTitle,
        amountToman: computedAmount,
        paymentMethod,
        trackingCode: finalTracking,
        requestedPlacement:
          item.itemType === 'AD_PACKAGE' ? placementSlot : undefined,
        requestedDurationDays:
          item.itemType === 'AD_PACKAGE' ? durationDays : undefined,
        requestedLabel:
          item.itemType === 'AD_PACKAGE' ? customBadgeLabel.trim() : undefined,
        requestedSmsCount: item.smsCount,
      },
      instantActivate
    );
    setCompletedOrderId(createdOrder.id);
  };

  const handleFinishAndClose = () => {
    if (onPaymentSuccess && item) {
      onPaymentSuccess(item);
    }
    setCompletedOrderId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={completedOrderId ? handleFinishAndClose : onClose}
      title={
        completedOrderId
          ? 'تشکر از پرداخت شما · فعال‌سازی موفق امکانات'
          : 'درگاه پرداخت سریع تایم تو (بله‌پی و کارت‌به‌کارت)'
      }
      description={`${resolvedItemTitle} — بدون نیاز به رمز دوم پویا در مرورگر`}
    >
      {completedOrderId ? (
        <div className="space-y-4 text-xs py-2">
          <div className="p-5 rounded-3xl bg-[#ECFDF5] border-2 border-[#10B981] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white inline-flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#065F46]">
              با تشکر! پرداخت «{resolvedItemTitle}» با موفقیت ثبت شد
            </h3>
            <p className="text-xs text-[#047857] leading-relaxed">
              کد رهگیری سفارش شما:{' '}
              <strong dir="ltr" className="font-mono">
                {completedOrderId}
              </strong>{' '}
              — تمامی قابلیت‌ها و ظرفیت‌های این بسته برای «{businessName}» باز و فعال گردید.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              onClick={handleFinishAndClose}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ورود به پنل و استفاده از امکانات فعال‌شده</span>
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* خلاصه بسته و انتخاب مدت و جایگاه برای تبلیغات */}
        <div className="p-3.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-[#64748B] block">
                سفارش انتخابی برای «{businessName}»:
              </span>
              <span className="text-sm font-extrabold text-[#061138]">
                {resolvedItemTitle}
              </span>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-[#64748B] block">
                مبلغ قابل پرداخت:
              </span>
              <span className="text-base font-extrabold text-[#0057FF] tabular-nums">
                {formatPriceToman(computedAmount)}
              </span>
            </div>
          </div>

          {item.itemType === 'AD_PACKAGE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#CBD5E1]">
              <FormField id="chk-duration" label="مدت زمان نمایش تبلیغ">
                <Select
                  id="chk-duration"
                  value={String(durationDays)}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  options={[
                    { value: '7', label: '۷ روزه (هفتگی اقتصادی)' },
                    { value: '14', label: '۱۴ روزه (دو هفته‌ای)' },
                    { value: '30', label: '۳۰ روزه (یک ماه کامل)' },
                  ]}
                />
              </FormField>

              <FormField id="chk-placement" label="محل قرارگیری بنر / کارت">
                <Select
                  id="chk-placement"
                  value={placementSlot}
                  onChange={(e) =>
                    setPlacementSlot(e.target.value as SponsoredPlacementSlot)
                  }
                  options={[
                    {
                      value: 'SEARCH_TOP',
                      label: 'صدر نتایج جست‌وجو (۴۹۰ هزار ماهانه / ۱۹۰ هفتگی)',
                    },
                    {
                      value: 'HOME_BANNER',
                      label: 'بنر ویژه در صفحه اول سایت (۸۹۰ هزار ماهانه / ۳۵۰ هفتگی)',
                    },
                    {
                      value: 'HERO_SPOTLIGHT',
                      label: 'ویترین اول هیرو + صدر جست‌وجو VIP (۱,۲۹۰ ماهانه / ۴۹۰ هفتگی)',
                    },
                  ]}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField
                  id="chk-badge"
                  label="متن برچسب تبلیغاتی روی کارت سالن شما"
                >
                  <Input
                    id="chk-badge"
                    value={customBadgeLabel}
                    onChange={(e) => setCustomBadgeLabel(e.target.value)}
                    placeholder="مثلاً منتخب محله درچه · ۲۰٪ تخفیف"
                  />
                </FormField>
              </div>
            </div>
          ) : null}
        </div>

        {/* انتخاب روش پرداخت (بله‌پی یا کارت به کارت) */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-[#061138]">
            ۱. روش پرداخت را انتخاب کنید (ساده و بدون پیچیدگی):
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('BALEPAY')}
              className={`p-3 rounded-2xl border text-right cursor-pointer transition-all flex items-center gap-2.5 ${
                paymentMethod === 'BALEPAY'
                  ? 'border-2 border-[#0057FF] bg-[#E0ECFF] text-[#061138]'
                  : 'border-[#CBD5E1] bg-white text-[#334155] hover:border-[#0057FF]'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#0057FF] text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-xs">بله‌پی (BalePay)</p>
                <p className="text-[10px] text-[#64748B]">
                  پرداخت آنی در بازوی بله
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD_TO_CARD')}
              className={`p-3 rounded-2xl border text-right cursor-pointer transition-all flex items-center gap-2.5 ${
                paymentMethod === 'CARD_TO_CARD'
                  ? 'border-2 border-[#0057FF] bg-[#E0ECFF] text-[#061138]'
                  : 'border-[#CBD5E1] bg-white text-[#334155] hover:border-[#0057FF]'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#061138] text-[#00E5FF] flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-xs">کارت‌به‌کارت بانکی</p>
                <p className="text-[10px] text-[#64748B]">
                  انتقال مستقیم با موبایل‌بانک
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* اطلاعات حساب بر اساس روش انتخابی */}
        {paymentMethod === 'BALEPAY' ? (
          <div className="p-4 rounded-2xl bg-[#061138] text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#00E5FF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>پرداخت مستقیم از طریق بله‌پی (BalePay)</span>
              </span>
              <span
                dir="ltr"
                className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded text-white"
              >
                {paymentConfig.balePayId}
              </span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              روی دکمه زیر بزنید تا در پیام‌رسان «بله» مبلغ{' '}
              <strong className="text-[#00E5FF]">
                {formatPriceToman(computedAmount)}
              </strong>{' '}
              را پرداخت کنید، سپس کد پیگیری یا ۴ رقم آخر کارت خود را در کادر پایین بنویسید:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={paymentConfig.balePayLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00E5FF] text-[#061138] font-extrabold text-xs hover:bg-white transition-colors"
              >
                <span>باز کردن لینک پرداخت بله‌پی</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleCopyBale}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>کپی لینک بله</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#061138] text-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#00E5FF]">
                شماره کارت رسمی مدیریت تایم تو ({paymentConfig.bankName})
              </span>
              <button
                type="button"
                onClick={handleCopyCard}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold text-white cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>کپی شماره کارت</span>
              </button>
            </div>
            <p
              dir="ltr"
              className="text-base sm:text-lg font-extrabold font-mono tracking-wider text-center py-2 rounded-xl bg-white/10 text-[#00E5FF]"
            >
              {paymentConfig.cardNumber}
            </p>
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-300">
              <span>به نام: {paymentConfig.cardHolderName}</span>
              <span dir="ltr" className="font-mono">
                {paymentConfig.shebaNumber}
              </span>
            </div>
          </div>
        )}

        {/* ثبت کد پیگیری و دکمه تایید */}
        <FormField
          id="chk-tracking"
          label="۲. کد پیگیری رسید یا ۴ رقم آخر کارت پرداخت‌کننده"
          hint={paymentConfig.instructions}
          required
        >
          <Input
            id="chk-tracking"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="مثلاً ۴۵۸۱ یا کد رهگیری بله‌پی..."
          />
        </FormField>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/40 text-[#065F46]">
          <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="font-bold text-xs">
            امکانات و ظرفیت بسته انتخابی بلافاصله پس از ثبت کد پیگیری برای سالن شما فعال می‌شود.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
          <Button variant="outline" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" variant="primary" size="sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>ثبت پرداخت و فعال‌سازی</span>
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
};
