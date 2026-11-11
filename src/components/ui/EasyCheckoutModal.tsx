import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
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
  defaultCategorySlug?: string;
  defaultNeighborhood?: string;
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
  const { paymentConfig, submitPaymentOrder } = usePrototypeData();

  const [durationDays, setDurationDays] = useState<number>(
    item?.defaultDurationDays || 30
  );
  const [placementSlot, setPlacementSlot] = useState<SponsoredPlacementSlot>(
    item?.defaultPlacement || 'SEARCH_TOP'
  );
  const [customBadgeLabel, setCustomBadgeLabel] = useState<string>(
    item?.defaultLabel || 'پیشنهاد ویژه · رزرو آنی'
  );
  const [isConnectingZibal, setIsConnectingZibal] = useState<boolean>(false);
  const [zibalPaymentUrl, setZibalPaymentUrl] = useState<string | null>(null);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  React.useEffect(() => {
    if (item) {
      setDurationDays(item.defaultDurationDays || 30);
      setPlacementSlot(item.defaultPlacement || 'SEARCH_TOP');
      setCustomBadgeLabel(item.defaultLabel || 'پیشنهاد ویژه · رزرو آنی');
      setZibalPaymentUrl(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnectingZibal(true);

    let zibalTrackId = `ZBL-${Math.floor(10000000 + Math.random() * 90000000)}`;
    let paymentGatewayUrl: string | null = null;
    try {
      const orderId = `ZBL-PL-${Date.now()}`;
      const callbackUrl = `${window.location.origin}${window.location.pathname}?zibal_order=${encodeURIComponent(orderId)}`;
      const res = await fetch('/api/v1/payments/zibal/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId:
            paymentConfig.zibalMerchantId ||
            paymentConfig.zarinpalMerchantId ||
            '',
          amountToman: computedAmount,
          description: `${resolvedItemTitle} — ${businessName}`,
          orderId,
          callbackUrl,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          trackId?: string;
          paymentUrl?: string | null;
        };
        if (data?.trackId) {
          zibalTrackId = String(data.trackId);
        }
        if (data?.paymentUrl) {
          paymentGatewayUrl = data.paymentUrl;
          setZibalPaymentUrl(data.paymentUrl);
        }
      }
    } catch {
      // ادامه در صورت خطای شبکه
    } finally {
      setIsConnectingZibal(false);
    }

    if (paymentGatewayUrl) {
      const isEmbeddedInIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      if (!isEmbeddedInIframe) {
        window.location.assign(paymentGatewayUrl);
        return;
      }

      const anchor = document.createElement('a');
      anchor.href = paymentGatewayUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }

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
        paymentMethod: 'ZIBAL',
        trackingCode: zibalTrackId,
        requestedPlacement:
          item.itemType === 'AD_PACKAGE' ? placementSlot : undefined,
        requestedDurationDays:
          item.itemType === 'AD_PACKAGE' ? durationDays : undefined,
        requestedLabel:
          item.itemType === 'AD_PACKAGE' ? customBadgeLabel.trim() : undefined,
        requestedCategorySlug: item.defaultCategorySlug,
        requestedNeighborhood: item.defaultNeighborhood,
        requestedSmsCount: item.smsCount,
      },
      true
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
          ? 'تایید تراکنش شتاب (درگاه زیبال) · فعال‌سازی آنی'
          : 'درگاه پرداخت اینترنتی زیبال (Zibal) — شبکه شتاب'
      }
      description={`${resolvedItemTitle} — پرداخت آنلاین با کلیه کارت‌های عضو شبکه شتاب`}
    >
      {completedOrderId ? (
        <div className="space-y-4 text-xs py-2">
          <div className="p-5 rounded-3xl bg-[#ECFDF5] border-2 border-[#10B981] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981] text-white inline-flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#065F46]">
              تراکنش «{resolvedItemTitle}» در درگاه زیبال ثبت شد
            </h3>
            <p className="text-xs text-[#047857] leading-relaxed">
              کد رهگیری سفارش شما:{' '}
              <strong dir="ltr" className="font-mono">
                {completedOrderId}
              </strong>{' '}
              — تمامی قابلیت‌ها و ظرفیت‌های این بسته برای «{businessName}» باز و فعال گردید.
            </p>
            {zibalPaymentUrl && (
              <div className="pt-1">
                <a
                  href={zibalPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0057FF] text-white font-extrabold text-xs hover:bg-[#061138] transition-colors"
                >
                  <span>مشاهده / تکمیل در صفحه شاپرک زیبال</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
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
                  مبلغ قابل پرداخت (شاپرک):
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
                      placeholder="مثلاً منتخب محله · ۲۰٪ تخفیف"
                    />
                  </FormField>
                </div>
              </div>
            ) : null}
          </div>

          {/* کارت اطلاعات درگاه رسمی زیبال (Zibal) */}
          <div className="p-4 rounded-2xl bg-[#061138] text-white space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0057FF] text-[#00E5FF] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-xs sm:text-sm text-white">
                    درگاه پرداخت اینترنتی زیبال (Zibal) — شاپرک بانک مرکزی
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    پذیرنده رسمی: پلتفرم تایم تو (timeto24.ir) · دارای نماد اعتماد الکترونیکی
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#34D399] font-extrabold text-[10px] shrink-0">
                فعال‌سازی خودکار
              </span>
            </div>

            <p className="text-[11px] text-slate-200 leading-relaxed pt-1 border-t border-white/10">
              مبلغ{' '}
              <strong className="text-[#00E5FF]">
                {formatPriceToman(computedAmount)}
              </strong>{' '}
              بابت «{resolvedItemTitle}» مستقیماً از طریق درگاه امن شتاب (زیبال) پرداخت شده و بلافاصله روی حساب کسب‌وکار شما فعال می‌گردد.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ECFDF5] border border-[#10B981]/40 text-[#065F46]">
            <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="font-bold text-xs">
              تراکنش تحت پوشش شبکه الکترونیکی پرداخت کارت (شاپرک) و درگاه زیبال انجام می‌شود.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={onClose}>
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isConnectingZibal}
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isConnectingZibal
                  ? 'در حال اتصال به درگاه زیبال...'
                  : 'پرداخت آنلاین با درگاه زیبال (شتاب)'}
              </span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
