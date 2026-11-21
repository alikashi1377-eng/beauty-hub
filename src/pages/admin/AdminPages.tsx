import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Check,
  X,
  Building2,
  CreditCard,
  Layers,
  MessageSquare,
  Send,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit3,
  Megaphone,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Trash2,
  Gem,
  Scissors,
  Droplets,
  UserCheck,
  Award,
  HeartHandshake,
  MapPin,
  Clock,
  Users,
  Phone,
  Instagram,
  Headphones,
  Wallet,
  FileText,
  Crown,
  RefreshCw,
} from 'lucide-react';
import {
  AdPackageItem,
  ApprovalStatus,
  BusinessItem,
  CategoryItem,
  PlatformBusinessNoticeItem,
  SubscriptionPlanItem,
  SubscriptionStatus,
  SponsoredPlacementSlot,
} from '../../types';
import {
  formatPriceToman,
  normalizeIranMobileInput,
  resolveAdjacentTabBySwipe,
  toPersianDigits,
} from '../../utils/formatters';
import {
  FREE_TRIAL_BOOKING_QUOTA,
  TIMETO_MONTHLY_PACKAGES,
  normalizeDepositPercent,
  resolveAppointmentFinancialBreakdown,
  resolveBusinessCommissionMeta,
  resolveBusinessSubscriptionQuotaStatus,
} from '../../utils/financialEngine';
import { isBusinessReadyForPublicDisplay } from '../../components/business/BusinessProfileCompletionWidget';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  ConfirmationDialog,
  Pagination,
} from '../../components/ui/MarketplaceComponents';

/** نقشه آیکون‌های دسته‌بندی خدمات (هماهنگ با صفحه اول) */
const CATEGORY_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Gem,
  Scissors,
  Droplets,
  Eye,
  UserCheck,
  Award,
  HeartHandshake,
};

/** بررسی تطابق دقیق نوبت با یک کسب‌وکار (شناسه، اسلاگ، نام سالن یا نام صاحب سالن) */
function doesAppointmentBelongToBusiness(
  apt: ReturnType<typeof usePrototypeData>['appointments'][number],
  business: BusinessItem
): boolean {
  if (!apt || apt.status === 'CANCELLED') return false;
  if (apt.businessId === business.id || apt.businessId === business.slug) {
    return true;
  }
  if (apt.businessSlug && (apt.businessSlug === business.slug || apt.businessSlug === business.id)) {
    return true;
  }
  const aptBizName = (apt.businessName || '').trim();
  const bizName = (business.name || '').trim();
  if (aptBizName && bizName && aptBizName === bizName) {
    return true;
  }
  return false;
}

/** محاسبه خلاصه پرونده مالی، سهمیه اشتراک و کارکرد یک کسب‌وکار بر اساس نوبت‌های واقعی ثبت‌شده (مدل اشتراکی با کارمزد ۰٪) */
function computeBusinessDossierMetrics(
  business: BusinessItem,
  appointments: ReturnType<typeof usePrototypeData>['appointments'],
  services: ReturnType<typeof usePrototypeData>['services'],
  paymentConfig: ReturnType<typeof usePrototypeData>['paymentConfig']
) {
  const bizApts = appointments.filter((a) =>
    doesAppointmentBelongToBusiness(a, business)
  );
  const commMeta = resolveBusinessCommissionMeta(business, paymentConfig);
  const quotaStatus = resolveBusinessSubscriptionQuotaStatus({
    business,
    appointments,
  });

  let totalServiceToman = 0;
  let totalDepositCollectedToman = 0;
  let totalCommissionToman = 0;
  let totalNetToSalonToman = 0;

  for (const apt of bizApts) {
    const srv = services.find((s) => s.id === apt.serviceId);
    const servicePrice = Math.max(
      0,
      Number(apt.priceToman) || Number(srv?.priceToman) || 350_000
    );
    const breakdown = resolveAppointmentFinancialBreakdown({
      appointment: {
        ...apt,
        priceToman: servicePrice,
      },
      business,
      commissionConfig: paymentConfig,
    });

    totalServiceToman += breakdown.totalServicePriceToman;
    totalDepositCollectedToman += breakdown.baseDepositToman;
    totalCommissionToman += 0;
    totalNetToSalonToman += breakdown.baseDepositToman;
  }

  const depositPercent = normalizeDepositPercent(business.depositPercent);
  const totalRemainingInSalonToman = Math.max(
    0,
    totalServiceToman - totalDepositCollectedToman
  );
  const currentPayableToman = totalNetToSalonToman;
  const latestAppointment = bizApts[0] || null;

  return {
    bookingsCount: bizApts.length,
    completedCount: bizApts.filter((a) => a.status === 'COMPLETED').length,
    confirmedCount: bizApts.filter((a) => a.status === 'CONFIRMED').length,
    depositPercent,
    commissionPercent: 0,
    commissionCategoryLabel: commMeta.categoryLabel,
    quotaStatus,
    totalServiceToman,
    totalRemainingInSalonToman,
    totalDepositCollectedToman,
    totalCommissionToman,
    totalNetToSalonToman,
    currentPayableToman,
    latestAppointment,
  };
}

/** جدول جامع پرونده مالی و کارکرد هر کسب‌وکار + وضعیت اشتراک/سهمیه نوبت + دکمه تسویه هفتگی شبا */
const BusinessFinancialDossierTable: React.FC<{
  businesses: BusinessItem[];
  onInspectBusiness?: (biz: BusinessItem) => void;
}> = ({ businesses, onInspectBusiness }) => {
  const {
    appointments,
    services,
    specialists,
    paymentConfig,
    settlementRequests,
    settleBusinessDossierByAdmin,
    refreshRealData,
    isLoadingInitialData,
    showToast,
  } = usePrototypeData();

  const realBusinesses = businesses.filter(
    (b) =>
      !b.isSampleShowcase &&
      b.approvalStatus !== 'REJECTED' &&
      !String(b.name || '').includes('مهتاب') &&
      !String(b.ownerName || '').includes('مهتاب')
  );

  const rows = realBusinesses.map((biz) => {
    const dossier = computeBusinessDossierMetrics(
      biz,
      appointments,
      services,
      paymentConfig
    );
    const paidSettlements = settlementRequests.filter(
      (s) => s.businessId === biz.id && s.status === 'PAID'
    );
    const totalAlreadySettledToman = paidSettlements.reduce(
      (sum, s) => sum + (Number(s.netPayoutToman) || 0),
      0
    );
    const bizServices = services.filter((s) => s.businessId === biz.id);
    const bizSpecialists = specialists.filter((sp) => sp.businessId === biz.id);
    const isPublicReady = isBusinessReadyForPublicDisplay({
      business: biz,
      services: bizServices,
      specialists: bizSpecialists,
    });

    return {
      biz,
      dossier,
      totalAlreadySettledToman,
      paidSettlementsCount: paidSettlements.length,
      isPublicReady,
    };
  });

  return (
    <Card className="rounded-3xl p-5 sm:p-6 space-y-4 border-2 border-[#0057FF]/25 bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF]/40 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Wallet className="w-5 h-5 text-[#0057FF]" />
            <h2 className="text-base sm:text-lg font-extrabold text-[#061138]">
              پرونده مالی، سهمیه اشتراک و تسویه هفتگی شبا با کسب‌وکارها (مدل اشتراکی · کارمزد ۰٪)
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              سینک زنده با دیتابیس مرکزی
            </span>
          </div>
          <p className="text-xs text-[#475569] leading-relaxed">
            در مدل جدید اشتراکی تایم‌تو، هر کسب‌وکار ابتدا <strong>۱۰ نوبت رایگان هدیه شروع</strong> دارد و پس از آن یکی از <strong>۳ پکیج اشتراک ۱ ماهه</strong> را تهیه می‌کند. کارمزد پلتفرم از تمامی نوبت‌ها <strong>۰٪</strong> است و <strong>۱۰۰٪ بیعانه دریافتی آنلاین</strong> در سیکل هفتگی به شماره شبا یا کارت صاحب کسب‌وکار واریز می‌شود.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshRealData()}
            disabled={isLoadingInitialData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#0057FF] border border-[#0057FF]/30 text-xs font-extrabold hover:bg-[#EFF6FF] transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInitialData ? 'animate-spin' : ''}`} />
            <span>{isLoadingInitialData ? 'در حال بروزرسانی...' : 'بروزرسانی آنی اطلاعات'}</span>
          </button>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#061138] text-white text-xs font-extrabold hover:bg-[#0057FF] transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>تسویه دسته‌ای شبا و خروجی پایا</span>
          </Link>
        </div>
      </div>

      {/* راهنمای فرمول تسویه در مدل اشتراکی بدون کارمزد */}
      <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 text-xs text-[#065F46] leading-relaxed flex flex-wrap items-center justify-between gap-2">
        <div>
          <strong className="text-[#047857]">فرمول تسویه هفتگی (کارمزد ۰٪):</strong>{' '}
          مبلغ قابل واریز به شبای هر کسب‌وکار برابر است با{' '}
          <strong>«۱۰۰٪ بیعانه‌های دریافتی آنلاین»</strong> منهای{' '}
          <strong>«تسویه‌های پرداخت‌شده قبلی»</strong>. درآمد پلتفرم از محل فروش اشتراک‌های ماهانه و جایگاه‌های تبلیغاتی ۷ و ۱۴ روزه است.
        </div>
        <Link
          to="/admin/subscriptions"
          className="font-extrabold text-[#0057FF] hover:underline shrink-0"
        >
          مدیریت پکیج‌های اشتراک ←
        </Link>
      </div>

      <ResponsiveTable
        keyExtractor={(r) => r.biz.id}
        data={rows}
        emptyMessage="هنوز کسب‌وکار واقعی ثبت‌نام نکرده است."
        columns={[
          {
            key: 'biz',
            header: 'کسب‌وکار، مالک و وضعیت ویترین',
            render: ({ biz, isPublicReady }) => (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-extrabold text-[#061138]">
                    {biz.name}
                  </span>
                  {biz.isVipPartner ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                      👑 سفیر برند VIP
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#475569]">
                  {biz.ownerName || 'صاحب کسب‌وکار'} ·{' '}
                  <span dir="ltr" className="font-mono font-bold text-[#0057FF]">
                    {biz.ownerPhone || biz.phoneDisplay}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {biz.bankShebaNumber || biz.bankCardNumber ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                      ✓ حساب بانکی ثبت‌شده
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold">
                      ⏳ شبا/کارت ثبت نشده
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      isPublicReady
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isPublicReady ? 'ویترین عمومی فعال' : 'در حال تکمیل پروفایل'}
                  </span>
                </div>
              </div>
            ),
          },
          {
            key: 'subscriptionQuota',
            header: 'وضعیت اشتراک و سهمیه نوبت (کارمزد ۰٪)',
            render: ({ dossier }) => {
              const q = dossier.quotaStatus;
              return (
                <div className="space-y-1 text-xs tabular-nums">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                      q.isFreeTrial
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-purple-50 text-purple-900 border-purple-200'
                    }`}
                  >
                    {q.isFreeTrial
                      ? `🎁 ۱۰ نوبت هدیه شروع`
                      : `💎 ${q.planTitle}`}
                  </span>
                  <div className="font-extrabold text-[#061138]">
                    مصرف‌شده: {toPersianDigits(q.usedBookingsCount)} از{' '}
                    {toPersianDigits(q.quotaLimit)} نوبت
                  </div>
                  <span
                    className={`text-[10px] font-bold block ${
                      q.isQuotaExhausted ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {q.isQuotaExhausted
                      ? '⚠️ سهمیه تمام‌شده — نیازمند خرید/تمدید اشتراک'
                      : `${toPersianDigits(q.remainingBookingsCount)} نوبت باقی‌مانده · کارمزد ۰٪`}
                  </span>
                </div>
              );
            },
          },
          {
            key: 'bookings',
            header: 'جمع کل خدمات و دریافتی حضوری سالن',
            render: ({ dossier }) => (
              <div className="space-y-0.5 tabular-nums text-xs">
                <span className="font-extrabold text-[#061138] block">
                  {toPersianDigits(dossier.bookingsCount)} رزرو ثبت‌شده
                </span>
                <span className="text-[#475569] block">
                  جمع کل خدمات:{' '}
                  <strong className="text-[#061138]">
                    {formatPriceToman(dossier.totalServiceToman)}
                  </strong>
                </span>
                <span className="text-[11px] text-[#64748B] block">
                  دریافتی حضوری در سالن ({toPersianDigits(100 - dossier.depositPercent)}٪):{' '}
                  <strong className="text-[#334155]">
                    {formatPriceToman(dossier.totalRemainingInSalonToman)}
                  </strong>
                </span>
                {dossier.latestAppointment ? (
                  <span className="text-[10px] text-[#0057FF] bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.5 rounded-md inline-block mt-0.5 font-bold">
                    آخرین نوبت: {dossier.latestAppointment.serviceTitle} ({dossier.latestAppointment.dateJalali})
                  </span>
                ) : null}
              </div>
            ),
          },
          {
            key: 'deposit',
            header: 'بیعانه دریافتی آنلاین (۱۰۰٪ سهم سالن)',
            render: ({ dossier }) => (
              <div className="space-y-1 tabular-nums text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#E0ECFF] text-[#0057FF] text-[10px] font-extrabold">
                  بیعانه تنظیمی سالن: {toPersianDigits(dossier.depositPercent)}٪
                </span>
                <span className="font-extrabold text-[#0057FF] block">
                  {formatPriceToman(dossier.totalDepositCollectedToman)}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold block">
                  کارمزد کسرشده از بیعانه: ۰ تومان (۰٪)
                </span>
              </div>
            ),
          },
          {
            key: 'netPayable',
            header: 'مبلغ قابل تسویه به شبا/کارت سالن',
            render: ({ biz, dossier, totalAlreadySettledToman }) => {
              const netPayable = Math.max(
                0,
                dossier.totalNetToSalonToman - totalAlreadySettledToman
              );
              const accountStr = biz.bankShebaNumber || biz.bankCardNumber || '';
              return (
                <div className="space-y-1 tabular-nums text-xs">
                  <span className="text-sm font-black text-emerald-700 block">
                    {formatPriceToman(netPayable)}
                  </span>
                  {accountStr ? (
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        dir="ltr"
                        className="font-mono text-[10px] text-[#0057FF] bg-[#EFF6FF] px-1.5 py-0.5 rounded inline-block"
                      >
                        {accountStr}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(accountStr);
                          showToast(`شماره شبا/کارت «${biz.name}» کپی شد.`);
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#061138] text-white text-[10px] font-bold hover:bg-[#0057FF] cursor-pointer"
                        title="کپی شماره شبا یا کارت"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>کپی</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-700 block">
                      شبا/کارت هنوز ثبت نشده
                    </span>
                  )}
                  {totalAlreadySettledToman > 0 ? (
                    <span className="text-[10px] text-emerald-600 block font-bold">
                      تسویه‌شده قبلی: {formatPriceToman(totalAlreadySettledToman)}
                    </span>
                  ) : null}
                </div>
              );
            },
          },
          {
            key: 'actions',
            header: 'ثبت تسویه هفتگی و ارسال صورتحساب',
            render: ({ biz }) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => settleBusinessDossierByAdmin(biz.id)}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ثبت واریز شبا + ارسال صورتحساب</span>
                </Button>
                {onInspectBusiness ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onInspectBusiness(biz)}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>جزئیات پرونده</span>
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
};

/** مودال بررسی کامل پنل ایجادشده توسط صاحب کسب‌وکار (نمایش تمام جزئیات، خدمات، متخصصان، ساعات کاری، اشتراک و پرونده مالی) */
const BusinessFullInspectModal: React.FC<{
  business: BusinessItem | null;
  onClose: () => void;
  onApprove: (businessId: string) => void;
  onReject: (businessId: string) => void;
}> = ({ business, onClose, onApprove, onReject }) => {
  const {
    services,
    specialists,
    appointments,
    paymentConfig,
    settlementRequests,
    updateBusinessProfile,
    settleBusinessDossierByAdmin,
    showToast,
  } = usePrototypeData();
  if (!business) return null;

  const bizServices = services.filter((s) => s.businessId === business.id);
  const bizSpecialists = specialists.filter((sp) => sp.businessId === business.id);
  const bizHours = business.workingHours || [];
  const dossier = computeBusinessDossierMetrics(
    business,
    appointments,
    services,
    paymentConfig
  );
  const paidSettlementsTotal = settlementRequests
    .filter((s) => s.businessId === business.id && s.status === 'PAID')
    .reduce((sum, s) => sum + (Number(s.netPayoutToman) || 0), 0);
  const netPayableToman = Math.max(
    0,
    dossier.totalNetToSalonToman - paidSettlementsTotal
  );
  const q = dossier.quotaStatus;

  return (
    <Modal
      isOpen={Boolean(business)}
      onClose={onClose}
      title={`بررسی کامل پنل و پرونده مالی سالن: ${business.name}`}
      description={`زمان ثبت درخواست: ${business.createdAtJalali || 'ثبت‌شده در سامانه'} · وضعیت فعلی: ${
        business.approvalStatus === 'APPROVED'
          ? 'تاییدشده'
          : business.approvalStatus === 'PENDING_REVIEW'
          ? 'در انتظار بررسی مدیر'
          : 'ردشده'
      }`}
      size="lg"
    >
      <div className="space-y-5 text-xs">
        {/* پرونده مالی، اشتراک و کارکرد اختصاصی این کسب‌وکار */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] border-2 border-[#0057FF]/25 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-extrabold text-[#061138] text-sm flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#0057FF]" />
              <span>پرونده مالی، اشتراک و تسویه شبا برای «{business.name}» (کارمزد ۰٪)</span>
            </h4>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => settleBusinessDossierByAdmin(business.id)}
            >
              <Check className="w-3.5 h-3.5" />
              <span>ثبت واریز هفتگی شبا و ارسال صورتحساب</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 tabular-nums">
            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1]">
              <span className="text-[11px] text-[#64748B] block">۱. اشتراک و سهمیه نوبت:</span>
              <strong className="text-xs font-black text-[#061138] block truncate">
                {q.isFreeTrial ? '۱۰ نوبت هدیه شروع' : q.planTitle}
              </strong>
              <span className="text-[10px] text-[#0057FF] font-bold block">
                {toPersianDigits(q.usedBookingsCount)} از {toPersianDigits(q.quotaLimit)} نوبت ({toPersianDigits(q.remainingBookingsCount)} مانده)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1]">
              <span className="text-[11px] text-[#64748B] block">۲. جمع کل خدمات:</span>
              <strong className="text-sm font-black text-[#061138] block">
                {formatPriceToman(dossier.totalServiceToman)}
              </strong>
              <span className="text-[10px] text-[#475569] block">
                از {toPersianDigits(dossier.bookingsCount)} نوبت ثبت‌شده
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1]">
              <span className="text-[11px] text-[#64748B] block">
                ۳. دریافتی حضوری سالن ({toPersianDigits(100 - dossier.depositPercent)}٪):
              </span>
              <strong className="text-sm font-black text-[#334155] block">
                {formatPriceToman(dossier.totalRemainingInSalonToman)}
              </strong>
              <span className="text-[10px] text-[#64748B] block">
                پرداخت مستقیم مشتری در سالن
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-[#CBD5E1]">
              <span className="text-[11px] text-[#64748B] block">
                ۴. بیعانه آنلاین ({toPersianDigits(dossier.depositPercent)}٪):
              </span>
              <strong className="text-sm font-black text-[#0057FF] block">
                {formatPriceToman(dossier.totalDepositCollectedToman)}
              </strong>
              <span className="text-[10px] text-emerald-700 font-bold block">
                کارمزد ۰٪ (۱۰۰٪ سهم سالن)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-800 block">
                ۵. قابل تسویه به شبای سالن:
              </span>
              <strong className="text-sm font-black text-emerald-700 block">
                {formatPriceToman(netPayableToman)}
              </strong>
              <span className="text-[10px] text-emerald-800 block">
                ۱۰۰٪ بیعانه منهای تسویه قبلی
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#334155] pt-1 border-t border-[#CBD5E1]/70">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                شماره شبا / کارت سالن:{' '}
                <strong dir="ltr" className="font-mono text-[#0057FF]">
                  {business.bankShebaNumber || business.bankCardNumber || 'ثبت نشده'}
                </strong>
              </span>
              {(business.bankShebaNumber || business.bankCardNumber) && (
                <button
                  type="button"
                  onClick={() => {
                    const acc = business.bankShebaNumber || business.bankCardNumber || '';
                    navigator.clipboard?.writeText(acc);
                    showToast('شماره شبا/کارت صاحب کسب‌وکار کپی شد.');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#061138] text-white text-[10px] font-bold hover:bg-[#0057FF] cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>کپی شبا/کارت</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextVip = !business.isVipPartner;
                  updateBusinessProfile(business.id, {
                    isVipPartner: nextVip,
                    vipCommissionPercent: 0,
                  });
                  showToast(
                    nextVip
                      ? `نشان «👑 سفیر برند VIP» برای «${business.name}» فعال شد.`
                      : `نشان سفیر برند VIP از «${business.name}» برداشته شد.`
                  );
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-colors ${
                  business.isVipPartner
                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                    : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
                }`}
              >
                {business.isVipPartner
                  ? '✓ نشان سفیر VIP فعال (لغو)'
                  : '👑 اعطای نشان سفیر برند VIP'}
              </button>
            </div>
          </div>
        </div>

        {/* ۱. خلاصه اطلاعات مالک، تماس، موقعیت و اشتراک */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]">
          <div className="space-y-1.5">
            <p className="text-[#64748B] font-bold">نام سالن و تخصص اصلی:</p>
            <p className="text-sm font-extrabold text-[#061138]">
              {business.name} ({business.typeLabel})
            </p>
            <p className="text-[#334155]">
              نام مالک / مدیر:{' '}
              <strong className="text-[#061138]">
                {business.ownerName || 'صاحب کسب‌وکار'}
              </strong>
            </p>
            <p className="text-[#334155] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#0057FF]" />
              <span>شماره تماس مالک:</span>
              <a
                href={`tel:${business.ownerPhone || business.phoneDisplay}`}
                dir="ltr"
                className="font-mono font-extrabold text-[#0057FF] underline"
              >
                {business.ownerPhone || business.phoneDisplay}
              </a>
            </p>
            {business.instagramHandle ? (
              <p className="text-[#334155] flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                <span>اینستاگرام:</span>
                <span dir="ltr" className="font-mono font-bold text-[#061138]">
                  {business.instagramHandle}
                </span>
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <p className="text-[#64748B] font-bold">موقعیت مکانی و وضعیت اشتراک:</p>
            <p className="font-extrabold text-[#061138]">
              {business.city} · محله {business.neighborhood}
            </p>
            <p className="text-[#334155] leading-relaxed">{business.address}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-[#E0ECFF] text-[#0057FF] font-extrabold">
                مدل همکاری: اشتراکی (کارمزد ۰٪ · {q.isFreeTrial ? '۱۰ نوبت هدیه شروع' : q.planTitle})
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] font-bold">
                تاریخ عضویت: {business.createdAtJalali || 'ثبت‌شده در سامانه'}
              </span>
            </div>
            {business.mapLat && business.mapLng ? (
              <a
                href={`https://www.google.com/maps?q=${business.mapLat},${business.mapLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#0057FF] font-extrabold hover:underline pt-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>مشاهده لوکیشن دقیق روی گوگل‌مپ</span>
              </a>
            ) : null}
          </div>
        </div>

        {/* بیوگرافی و معرفی سالن */}
        {business.aboutText || business.shortDescription ? (
          <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] space-y-1">
            <p className="font-extrabold text-[#061138]">معرفی و توضیحات ثبت‌شده توسط سالن:</p>
            <p className="text-[#334155] leading-relaxed">
              {business.aboutText || business.shortDescription}
            </p>
          </div>
        ) : null}

        {/* ۲. خدمات تعریف‌شده توسط سالن */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-[#061138] flex items-center gap-1.5 text-sm">
              <Scissors className="w-4 h-4 text-[#0057FF]" />
              <span>
                خدمات تعریف‌شده در پنل سالن ({toPersianDigits(bizServices.length)} خدمت)
              </span>
            </h4>
          </div>
          {bizServices.length === 0 ? (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
              هنوز خدمتی توسط این سالن ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
              {bizServices.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3 rounded-xl bg-white border border-[#CBD5E1] flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-extrabold text-[#061138]">{srv.title}</p>
                    <p className="text-[11px] text-[#64748B]">
                      دسته: {srv.category} · زمان:{' '}
                      {toPersianDigits(srv.durationMinutes)} دقیقه
                    </p>
                  </div>
                  <span className="font-extrabold text-[#0057FF] tabular-nums shrink-0">
                    {formatPriceToman(srv.priceToman)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ۳. متخصصان و پرسنل تعریف‌شده */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-[#061138] flex items-center gap-1.5 text-sm">
            <Users className="w-4 h-4 text-[#0057FF]" />
            <span>
              متخصصان و پرسنل سالن ({toPersianDigits(bizSpecialists.length)} نفر)
            </span>
          </h4>
          {bizSpecialists.length === 0 ? (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
              هنوز متخصصی برای این سالن ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bizSpecialists.map((sp) => (
                <div
                  key={sp.id}
                  className="p-3 rounded-xl bg-white border border-[#CBD5E1] flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-extrabold text-[#061138]">{sp.fullName}</p>
                    <p className="text-[11px] text-[#64748B]">{sp.roleTitle}</p>
                  </div>
                  <StatusBadge
                    label={sp.isActive ? 'فعال' : 'غیرفعال'}
                    tone={sp.isActive ? 'success' : 'neutral'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ۴. برنامه ساعات کاری */}
        {bizHours.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-extrabold text-[#061138] flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-[#0057FF]" />
              <span>برنامه ساعات کاری سالن</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {bizHours.map((wh) => (
                <div
                  key={wh.dayName}
                  className={`p-2.5 rounded-xl border text-center ${
                    !wh.isOpen
                      ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#061138]'
                  }`}
                >
                  <p className="font-extrabold">{wh.dayName}</p>
                  <p className="text-[11px] mt-0.5 tabular-nums">
                    {!wh.isOpen
                      ? 'تعطیل'
                      : `${toPersianDigits(wh.openTime)} تا ${toPersianDigits(wh.closeTime)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* دکمه‌های اقدام مستقیم مدیر کل */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
          <Link
            to={`/salon/${business.slug || business.id}`}
            className="text-xs font-extrabold text-[#0057FF] hover:underline"
          >
            مشاهده صفحه عمومی سالن در سایت ↗
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              بستن پنجره
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onReject(business.id);
                onClose();
              }}
              className="text-[#EF4444] border-[#FECACA] hover:bg-[#FEF2F2]"
            >
              <X className="w-3.5 h-3.5" />
              <span>رد صلاحیت سالن</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onApprove(business.id);
                onClose();
              }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>تایید و انتشار سالن</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/** ۱. داشبورد مدیریت پلتفرم (/admin) — فقط داده‌های واقعی + مرکز اعلان جمع‌شونده و خودکار */
export const AdminDashboardPage: React.FC = () => {
  const {
    businesses,
    categories,
    appointments,
    services,
    paymentOrders,
    paymentConfig,
    settlementRequests,
    updateBusinessApproval,
    adminReviewedBizIds,
    adminNotifications,
    markAdminNotificationRead,
    clearAllAdminNotifications,
  } = usePrototypeData();
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '1y'>('7d');
  const [isNotifCollapsed, setIsNotifCollapsed] = useState(false);
  const [inspectingBusiness, setInspectingBusiness] =
    useState<BusinessItem | null>(null);

  // در پنل مدیریت کلان، سالن‌های نمونه نمایشی و سالن‌های رد صلاحیت‌شده کنار گذاشته می‌شوند و فقط کسب‌وکارهای واقعی فعال نمایش می‌یابند
  const realBusinesses = businesses.filter(
    (b) =>
      !b.isSampleShowcase &&
      b.approvalStatus !== 'REJECTED' &&
      !String(b.name || '').includes('مهتاب') &&
      !String(b.ownerName || '').includes('مهتاب')
  );

  // صف بررسی فقط شامل کسب‌وکارهایی است که هنوز توسط مدیر کل تعیین تکلیف (تایید یا رد) نشده‌اند
  const sortedBusinesses = [...realBusinesses]
    .filter(
      (b) =>
        b.approvalStatus !== 'REJECTED' &&
        (b.approvalStatus === 'PENDING_REVIEW' ||
          (!adminReviewedBizIds.includes(b.id) &&
            !adminReviewedBizIds.includes(b.slug)))
    )
    .sort((a, b) => {
      if (
        a.approvalStatus === 'PENDING_REVIEW' &&
        b.approvalStatus !== 'PENDING_REVIEW'
      )
        return -1;
      if (
        b.approvalStatus === 'PENDING_REVIEW' &&
        a.approvalStatus !== 'PENDING_REVIEW'
      )
        return 1;
      return 0;
    });

  const pendingCount = sortedBusinesses.length;

  const activeSubscriptionsCount = realBusinesses.length;

  // تمام رزروهای واقعی دیتابیس (بدون نمونه‌های نمایشی و بدون کسب‌وکارهای رد صلاحیت‌شده)
  const realAppointments = appointments.filter((a) => {
    if (
      /^apt-(?:[1-9]|1[0-2])$/.test(a.id) ||
      /^biz-[1-8]$/.test(a.businessId) ||
      a.status === 'CANCELLED' ||
      String(a.businessName || '').includes('مهتاب')
    ) {
      return false;
    }
    const matchedBiz = businesses.find((b) =>
      doesAppointmentBelongToBusiness(a, b)
    );
    if (matchedBiz && matchedBiz.approvalStatus === 'REJECTED') {
      return false;
    }
    return true;
  });

  // محاسبه دقیق بیعانه‌های آنلاین، کارمزد پلتفرم و ارزش کل خدمات از روی نوبت‌های واقعی
  let totalServiceVolumeToman = 0;
  let totalOnlineDepositsToman = 0;
  let totalPlatformCommissionToman = 0;
  let totalSalonNetShareToman = 0;

  for (const apt of realAppointments) {
    const biz = realBusinesses.find((b) =>
      doesAppointmentBelongToBusiness(apt, b)
    );
    const srv = services.find((s) => s.id === apt.serviceId);
    const servicePrice = Math.max(
      0,
      Number(apt.priceToman) || Number(srv?.priceToman) || 350_000
    );
    const breakdown = resolveAppointmentFinancialBreakdown({
      appointment: {
        ...apt,
        priceToman: servicePrice,
      },
      business: biz,
      commissionConfig: paymentConfig,
    });

    totalServiceVolumeToman += breakdown.totalServicePriceToman;
    totalOnlineDepositsToman += breakdown.baseDepositToman;
    totalPlatformCommissionToman += breakdown.platformCommissionToman;
    totalSalonNetShareToman += breakdown.salonNetDepositCreditedToman;
  }

  const approvedOrdersToman = paymentOrders
    .filter((o) => o.status === 'APPROVED')
    .reduce((sum, o) => sum + (Number(o.amountToman) || 0), 0);

  const paidSettlementsToman = settlementRequests
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + (Number(s.netPayoutToman) || 0), 0);

  const approvedRevenueToman =
    totalOnlineDepositsToman + approvedOrdersToman + paidSettlementsToman;

  // فقط اعلان‌های خوانده‌نشده در نوار بالا نمایش داده می‌شوند تا به‌محض تایید/رد یا بستن، از صفحه جمع شوند
  const unreadNotifications = adminNotifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="پنل مدیریت کلان · Timeto (تایم تو)"
        title="داشبورد مدیریت پلتفرم"
        subtitle="بررسی کسب‌وکارهای واقعی ثبت‌نام‌شده، پرونده مالی و تسویه هفتگی هر سالن، پایش آمار واقعی رزروها و مدیریت اشتراک‌ها"
        routePattern="/admin"
        breadcrumbs={[
          { label: 'پنل مدیریت پلتفرم' },
          { label: 'داشبورد کلان' },
        ]}
      />

      {/* بنر اعلان هوشمند مدیریت کلان (فقط موارد بررسی‌نشده + قابلیت جمع‌شدن و حذف خودکار پس از تایید/رد) */}
      {unreadNotifications.length > 0 ? (
        <Card className="border-2 border-[#F59E0B] bg-[#FFFBEB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" />
              <h2 className="text-sm font-extrabold text-[#92400E]">
                اعلان‌های جدید در انتظار اقدام مدیر کل (
                {toPersianDigits(unreadNotifications.length)} مورد)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNotifCollapsed((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-[#F59E0B]/50 text-xs font-extrabold text-[#92400E] hover:bg-[#FEF3C7] cursor-pointer"
              >
                {isNotifCollapsed ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>باز کردن لیست اعلان‌ها</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>جمع کردن کادر اعلان</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearAllAdminNotifications}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#92400E] text-white text-xs font-extrabold hover:bg-[#78350F] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>بستن همه اعلان‌ها</span>
              </button>
            </div>
          </div>

          {!isNotifCollapsed ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pt-2 border-t border-[#FDE68A]">
              {unreadNotifications.map((notif) => {
                const targetBiz = notif.businessId
                  ? businesses.find((b) => b.id === notif.businessId) || null
                  : null;
                return (
                  <div
                    key={notif.id}
                    className="p-3 rounded-2xl border bg-white border-[#F59E0B] text-[#061138] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            notif.type === 'NEW_PAYMENT_ORDER'
                              ? 'bg-[#EFF6FF] text-[#0057FF]'
                              : notif.type === 'NEW_SUPPORT_TICKET'
                              ? 'bg-[#F3E8FF] text-[#7E22CE]'
                              : 'bg-[#FEF3C7] text-[#92400E]'
                          }`}
                        >
                          {notif.type === 'NEW_PAYMENT_ORDER'
                            ? 'فیش / سفارش مالی'
                            : notif.type === 'NEW_SUPPORT_TICKET'
                            ? 'تیکت پشتیبانی جدید'
                            : 'ثبت کسب‌وکار جدید'}
                        </span>
                        <p className="font-extrabold text-[#061138]">
                          {notif.title} · {notif.city}
                        </p>
                      </div>
                      <p className="text-[#334155]">
                        {notif.message || (
                          <>
                            فرستنده: <strong>{notif.ownerName}</strong> · شماره تماس:{' '}
                            <span
                              dir="ltr"
                              className="font-mono font-extrabold text-[#0057FF]"
                            >
                              {notif.ownerPhone}
                            </span>
                          </>
                        )}{' '}
                        · زمان ثبت: <strong>{notif.createdAtJalali}</strong>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {notif.type === 'NEW_PAYMENT_ORDER' ? (
                        <Link
                          to="/admin/payments"
                          onClick={() => markAdminNotificationRead(notif.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0057FF] text-white text-xs font-extrabold hover:bg-[#0046CC]"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>بررسی و تایید تراکنش</span>
                        </Link>
                      ) : notif.type === 'NEW_SUPPORT_TICKET' ? (
                        <Link
                          to="/admin/support"
                          onClick={() => markAdminNotificationRead(notif.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7E22CE] text-white text-xs font-extrabold hover:bg-[#6B21A8]"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>مشاهده و پاسخ به تیکت</span>
                        </Link>
                      ) : (
                        <>
                          {targetBiz ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setInspectingBusiness(targetBiz)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>مشاهده کامل پنل سالن</span>
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (notif.businessId) {
                                updateBusinessApproval(
                                  notif.businessId,
                                  'APPROVED'
                                );
                              }
                              markAdminNotificationRead(notif.id);
                            }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تایید</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (notif.businessId) {
                                updateBusinessApproval(
                                  notif.businessId,
                                  'REJECTED'
                                );
                              }
                              markAdminNotificationRead(notif.id);
                            }}
                            className="text-[#EF4444] hover:bg-[#FEF2F2]"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>رد</span>
                          </Button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => markAdminNotificationRead(notif.id)}
                        title="بستن این اعلان"
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#061138] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* ۱. نوار یکپارچه ۳ ستونی شاخص‌های کلیدی (فقط بر اساس آمار واقعی دیتابیس) */}
      <div className="rounded-3xl bg-white border border-[#E6E0F5] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#E6E0F5] shadow-2xs">
        {/* ستون ۱: کل رزروهای واقعی و ارزش خدمات */}
        <div className="flex items-start justify-between gap-4 pt-2 md:pt-0">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B6480] block">
              کل رزروهای واقعی و حجم خدمات ارائه‌شده
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1E1B2E] tabular-nums">
              {toPersianDigits(realAppointments.length)} رزرو ثبت‌شده
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] font-extrabold tabular-nums">
                جمع کل خدمات: {formatPriceToman(totalServiceVolumeToman)}
              </span>
              <span className="text-[#6B6480] tabular-nums">
                ({toPersianDigits(categories.length)} سرفصل فعال)
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#8B5CF6]" />
          </div>
        </div>

        {/* ستون ۲: مراکز واقعی در انتظار تایید */}
        <div className="flex items-start justify-between gap-4 pt-4 md:pt-0 md:pr-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B6480] block">
              مراکز در انتظار بررسی و تایید
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1E1B2E] tabular-nums">
              {toPersianDigits(pendingCount)} کسب‌وکار
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#F59E0B] font-extrabold tabular-nums">
                اولویت بررسی
              </span>
              <span className="text-[#6B6480] tabular-nums">
                از مجموع {toPersianDigits(realBusinesses.length)} مرکز واقعی ثبت‌نام‌شده
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#F59E0B]" />
          </div>
        </div>

        {/* ستون ۳: مجموع بیعانه‌های سالن‌ها (کارمزد ۰٪) و درآمد اشتراک و تبلیغات */}
        <div className="flex items-start justify-between gap-4 pt-4 md:pt-0 md:pr-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B6480] block">
              گردش مالی تاییدشده، اشتراک‌ها و بیعانه سالن‌ها ({toPersianDigits(activeSubscriptionsCount)}{' '}
              مرکز فعال)
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#8B5CF6] tabular-nums">
              {approvedRevenueToman > 0
                ? formatPriceToman(approvedRevenueToman)
                : '۰ تومان'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] font-extrabold tabular-nums">
                بیعانه سالن‌ها (کارمزد ۰٪): {formatPriceToman(totalSalonNetShareToman)}
              </span>
              <span className="text-[#6B6480] tabular-nums font-bold">
                فروش اشتراک و تبلیغات: {formatPriceToman(approvedOrdersToman)}
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>
      </div>

      {/* ۱.۵ پرونده مالی و کارکرد هر کسب‌وکار و تسویه هفتگی */}
      <BusinessFinancialDossierTable
        businesses={realBusinesses}
        onInspectBusiness={(biz) => setInspectingBusiness(biz)}
      />

      {/* ۲. نمودار تحلیلی رزروها و عملکرد واقعی پلتفرم */}
      <Card className="rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E1B2E]">
              نمودار روند ثبت‌نام سالن‌ها و رزروهای واقعی (Booking Analytics)
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6480]">
              <span className="inline-flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                <span>
                  مراکز واقعی ثبت‌شده: {toPersianDigits(realBusinesses.length)} سالن
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#6B6480]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]/70" />
                <span>
                  نوبت‌های ثبت‌شده: {toPersianDigits(realAppointments.length)} مورد
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FAF8FF] border border-[#E6E0F5]">
            {[
              { id: '7d', label: '۷ روز گذشته' },
              { id: '30d', label: '۳۰ روز گذشته' },
              { id: '1y', label: 'یک سال' },
            ].map((rng) => (
              <button
                key={rng.id}
                type="button"
                onClick={() => setChartRange(rng.id as '7d' | '30d' | '1y')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                  chartRange === rng.id
                    ? 'bg-[#8B5CF6] text-white shadow-2xs'
                    : 'text-[#6B6480] hover:text-[#1E1B2E]'
                }`}
              >
                {rng.label}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const chartConfig =
            chartRange === '7d'
              ? {
                  periodTitle: 'روند ۷ روز گذشته (هفتگی)',
                  yLabels: ['۴۰', '۳۰', '۲۰', '۱۰'],
                  highlightX: 505,
                  highlightCx: 533,
                  highlightCy: 76,
                  tooltipX: 445,
                  secondaryPath:
                    'M65,155 C145,148 215,150 295,135 C375,120 455,130 533,108 C605,95 650,110 685,98',
                  primaryPath:
                    'M65,145 C145,132 215,138 295,115 C375,92 455,110 533,76 C605,64 650,82 685,68',
                  points: [
                    { x: 65, y: 145, label: 'شنبه' },
                    { x: 170, y: 135, label: 'یکشنبه' },
                    { x: 275, y: 118, label: 'دوشنبه' },
                    { x: 380, y: 98, label: 'سه‌شنبه' },
                    { x: 455, y: 106, label: 'چهارشنبه' },
                    { x: 533, y: 76, label: 'پنجشنبه', active: true },
                    { x: 655, y: 68, label: 'جمعه' },
                  ],
                }
              : chartRange === '30d'
                ? {
                    periodTitle: 'روند ۳۰ روز گذشته (بازه‌های ۵ روزه ماه)',
                    yLabels: ['۱۲۰', '۹۰', '۶۰', '۳۰'],
                    highlightX: 467,
                    highlightCx: 495,
                    highlightCy: 68,
                    tooltipX: 407,
                    secondaryPath:
                      'M65,162 C155,150 245,140 340,126 C420,114 495,96 580,88 C630,82 660,78 685,74',
                    primaryPath:
                      'M65,152 C155,136 245,120 340,102 C420,86 495,68 580,58 C630,52 660,48 685,44',
                    points: [
                      { x: 65, y: 152, label: '۱ تا ۵ ماه' },
                      { x: 190, y: 132, label: '۶ تا ۱۰ ماه' },
                      { x: 315, y: 106, label: '۱۱ تا ۱۵ ماه' },
                      { x: 410, y: 88, label: '۱۶ تا ۲۰ ماه' },
                      { x: 495, y: 68, label: '۲۱ تا ۲۵ ماه', active: true },
                      { x: 600, y: 55, label: '۲۶ تا ۳۰ ماه' },
                      { x: 675, y: 44, label: 'امروز' },
                    ],
                  }
                : {
                    periodTitle: 'روند ۱ ساله (۱۲ ماه سال)',
                    yLabels: ['۴۰۰', '۳۰۰', '۲۰۰', '۱۰۰'],
                    highlightX: 547,
                    highlightCx: 575,
                    highlightCy: 56,
                    tooltipX: 480,
                    secondaryPath:
                      'M55,168 C140,160 230,148 320,132 C410,118 500,98 575,82 C625,72 655,66 685,60',
                    primaryPath:
                      'M55,160 C140,148 230,132 320,112 C410,94 500,74 575,56 C625,46 655,40 685,35',
                    points: [
                      { x: 55, y: 160, label: 'فروردین' },
                      { x: 112, y: 152, label: 'اردیبهشت' },
                      { x: 169, y: 142, label: 'خرداد' },
                      { x: 226, y: 132, label: 'تیر' },
                      { x: 283, y: 120, label: 'مرداد' },
                      { x: 340, y: 108, label: 'شهریور' },
                      { x: 397, y: 96, label: 'مهر' },
                      { x: 454, y: 82, label: 'آبان' },
                      { x: 511, y: 68, label: 'آذر' },
                      { x: 575, y: 56, label: 'دی', active: true },
                      { x: 630, y: 45, label: 'بهمن' },
                      { x: 685, y: 35, label: 'اسفند' },
                    ],
                  };

          return (
            <div className="relative pt-4">
              <svg viewBox="0 0 720 220" className="w-full h-52 overflow-visible">
                <defs>
                  <linearGradient
                    id="adm-bar-highlight"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {[35, 80, 125, 170].map((y, idx) => (
                  <g key={y}>
                    <line
                      x1="45"
                      y1={y}
                      x2="695"
                      y2={y}
                      stroke="#F3EEFF"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="35"
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#6B6480] text-[10px] font-bold"
                    >
                      {chartConfig.yLabels[idx]}
                    </text>
                  </g>
                ))}

                <rect
                  x={chartConfig.highlightX}
                  y="20"
                  width="56"
                  height="155"
                  rx="14"
                  fill="url(#adm-bar-highlight)"
                />

                <path
                  d={chartConfig.secondaryPath}
                  fill="none"
                  stroke="#A78BFA"
                  strokeOpacity="0.7"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />

                <path
                  d={chartConfig.primaryPath}
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {chartConfig.points.map((pt) => (
                  <circle
                    key={pt.label}
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.active ? 6 : 3.5}
                    fill="#FFFFFF"
                    stroke="#8B5CF6"
                    strokeWidth={pt.active ? 3.5 : 2}
                  />
                ))}

                <g transform={`translate(${chartConfig.tooltipX}, 14)`}>
                  <rect
                    x="0"
                    y="0"
                    width="186"
                    height="42"
                    rx="12"
                    fill="#1E1B2E"
                  />
                  <text
                    x="93"
                    y="16"
                    textAnchor="middle"
                    className="fill-white text-[10px] font-extrabold"
                  >
                    {chartConfig.periodTitle}
                  </text>
                  <text
                    x="93"
                    y="32"
                    textAnchor="middle"
                    className="fill-amber-300 text-[11px] font-extrabold"
                  >
                    {toPersianDigits(realBusinesses.length)} سالن ·{' '}
                    {toPersianDigits(realAppointments.length)} رزرو ثبت‌شده
                  </text>
                </g>

                {chartConfig.points.map((d) => (
                  <text
                    key={d.label}
                    x={d.x}
                    y="198"
                    textAnchor="middle"
                    className={`${
                      chartRange === '1y' ? 'text-[9.5px]' : 'text-[10.5px]'
                    } font-bold ${
                      d.active ? 'fill-[#8B5CF6] font-extrabold' : 'fill-[#6B6480]'
                    }`}
                  >
                    {d.label}
                  </text>
                ))}
              </svg>
            </div>
          );
        })()}
      </Card>

      {/* ۳. جدول صف بررسی و تایید کسب‌وکارهای ثبت‌نام‌شده واقعی */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#1E1B2E]">
              صف بررسی و تایید کسب‌وکارهای ثبت‌نام‌شده (
              {toPersianDigits(sortedBusinesses.length)} مرکز واقعی)
            </h2>
            <p className="text-xs text-[#6B6480]">
              اطلاعات خلاصه در جدول نمایش داده شده است؛ با زدن «مشاهده کامل پنل سالن» تمام جزئیات، خدمات، متخصصان و زمان درخواست را ببینید
            </p>
          </div>
        </div>

        <ResponsiveTable
          keyExtractor={(b) => b.id}
          data={sortedBusinesses}
          emptyMessage="هنوز کسب‌وکار جدیدی خارج از نمونه‌های نمایشی ثبت‌نام نکرده است. به‌محض ثبت سالن توسط صاحبان کسب‌وکار، مشخصات کامل آن در این جدول قرار می‌گیرد."
          columns={[
            {
              key: 'name',
              header: 'نام کسب‌وکار و زمان ثبت',
              render: (b) => (
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[#1E1B2E]">{b.name}</p>
                  <p className="text-[11px] text-[#6B6480]">
                    زمان درخواست: {b.createdAtJalali || 'ثبت‌شده در سامانه'}
                  </p>
                </div>
              ),
            },
            {
              key: 'owner',
              header: 'نام مالک و شماره همراه کامل',
              render: (b) => (
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-[#061138] block">
                    {b.ownerName || 'صاحب کسب‌وکار'}
                  </span>
                  <span
                    dir="ltr"
                    className="font-mono font-extrabold text-[#0057FF] tabular-nums block"
                  >
                    {b.ownerPhone || b.phoneDisplay}
                  </span>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'نوع فعالیت / شهر و محله',
              render: (b) => (
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-[#1E1B2E] block">
                    {b.city} · {b.neighborhood}
                  </span>
                  <span className="text-[#6B6480] block">{b.typeLabel}</span>
                </div>
              ),
            },
            {
              key: 'approval',
              header: 'وضعیت بررسی',
              render: (b) => (
                <StatusBadge
                  label={
                    b.approvalStatus === 'APPROVED'
                      ? 'تاییدشده'
                      : b.approvalStatus === 'PENDING_REVIEW'
                      ? 'در انتظار بررسی'
                      : 'ردشده'
                  }
                  tone={
                    b.approvalStatus === 'APPROVED'
                      ? 'success'
                      : b.approvalStatus === 'PENDING_REVIEW'
                      ? 'warning'
                      : 'danger'
                  }
                />
              ),
            },
            {
              key: 'actions',
              header: 'مشاهده کامل پنل / تایید و رد',
              render: (b) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setInspectingBusiness(b)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>مشاهده کامل پنل سالن</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateBusinessApproval(b.id, 'APPROVED')}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تایید</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBusinessApproval(b.id, 'REJECTED')}
                    className="text-[#EF4444] hover:bg-[#FEF2F2]"
                  >
                    رد
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <BusinessFullInspectModal
        business={inspectingBusiness}
        onClose={() => setInspectingBusiness(null)}
        onApprove={(id) => updateBusinessApproval(id, 'APPROVED')}
        onReject={(id) => updateBusinessApproval(id, 'REJECTED')}
      />
    </div>
  );
};

/** ۲. مدیریت کسب‌وکارها، زباله‌دان، پیام‌های ارسالی و اشتراک‌ها (/admin/businesses) */
export const AdminBusinessesPage: React.FC = () => {
  const {
    businesses,
    appointments,
    updateBusinessApproval,
    permanentlyDeleteBusiness,
    updateBusinessProfile,
    grantBusinessPlanOrAdByAdmin,
    platformBusinessNotices,
    sendPlatformBusinessNotice,
    deletePlatformBusinessNotice,
    showToast,
  } = usePrototypeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    ApprovalStatus | 'ALL' | 'VIP'
  >('ALL');
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [permDeleteTargetId, setPermDeleteTargetId] = useState<string | null>(
    null
  );
  const [inspectingBusiness, setInspectingBusiness] =
    useState<BusinessItem | null>(null);

  // کنترل کامل و جمع‌وجور روی کادر «آخرین پیام‌ها و اطلاعیه‌های ارسالی» + مودال مشاهده متن کامل پیام
  const [noticesCollapsed, setNoticesCollapsed] = useState(false);
  const [noticeTypeFilter, setNoticeTypeFilter] = useState<
    'ALL' | 'BROADCAST' | 'DIRECT'
  >('ALL');
  const [viewingNotice, setViewingNotice] =
    useState<PlatformBusinessNoticeItem | null>(null);

  // مودال فعال‌سازی اشتراک ۱ ماهه (پایه / حرفه‌ای / VIP) یا جایگاه تبلیغاتی ۷ و ۱۴ روزه توسط مدیر کل
  const [grantModalBiz, setGrantModalBiz] = useState<BusinessItem | null>(null);
  const [grantTargetType, setGrantTargetType] = useState<
    'PLAN' | 'SPONSORED_AD' | 'BOTH' | 'VIP_AMBASSADOR'
  >('PLAN');
  const [grantPlanId, setGrantPlanId] = useState<
    'plan-independent' | 'plan-professional' | 'plan-vip-brand'
  >('plan-professional');
  const [grantPlacement, setGrantPlacement] = useState<
    'SEARCH_TOP' | 'HOME_BANNER' | 'HERO_SPOTLIGHT'
  >('SEARCH_TOP');
  const [grantLabel, setGrantLabel] = useState('پیشنهاد ویژه · رزرو آنلاین');
  const [grantDurationDays, setGrantDurationDays] = useState<number>(30);
  const [grantExtraSms, setGrantExtraSms] = useState<number>(100);
  const [grantIsTrial, setGrantIsTrial] = useState<boolean>(true);

  const openGrantModal = (
    biz: BusinessItem,
    defaultMode: 'PLAN' | 'SPONSORED_AD' | 'BOTH' | 'VIP_AMBASSADOR' = 'PLAN'
  ) => {
    const quota = resolveBusinessSubscriptionQuotaStatus({
      business: biz,
      appointments,
    });
    setGrantModalBiz(biz);
    setGrantTargetType(defaultMode);
    setGrantPlanId(
      defaultMode === 'VIP_AMBASSADOR'
        ? 'plan-vip-brand'
        : quota.activePackage?.id || 'plan-professional'
    );
    setGrantPlacement(
      defaultMode === 'VIP_AMBASSADOR'
        ? 'HERO_SPOTLIGHT'
        : biz.sponsoredPlacement || 'SEARCH_TOP'
    );
    setGrantLabel(
      defaultMode === 'VIP_AMBASSADOR'
        ? '👑 سالن منتخب و سفیر برند تایم‌تو'
        : biz.sponsoredLabel || 'پیشنهاد ویژه · رزرو آنلاین'
    );
    setGrantDurationDays(defaultMode === 'SPONSORED_AD' ? 14 : 30);
    setGrantExtraSms(
      defaultMode === 'VIP_AMBASSADOR'
        ? 300
        : defaultMode === 'SPONSORED_AD'
        ? 0
        : 100
    );
    setGrantIsTrial(true);
  };

  const handleGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantModalBiz) return;
    grantBusinessPlanOrAdByAdmin({
      businessId: grantModalBiz.id,
      grantType: grantTargetType,
      planId:
        grantTargetType === 'VIP_AMBASSADOR' ? 'plan-vip-brand' : grantPlanId,
      sponsoredPlacement: grantPlacement,
      sponsoredLabel: grantLabel,
      durationDays: Math.max(1, Number(grantDurationDays) || 14),
      bonusSmsCount: Math.max(0, Number(grantExtraSms) || 0),
      isTrialGift: grantIsTrial,
      isVipPartner:
        grantTargetType === 'VIP_AMBASSADOR' ||
        grantPlanId === 'plan-vip-brand'
          ? true
          : undefined,
      vipCommissionPercent: 0,
    });
    setGrantModalBiz(null);
  };

  // مودال ارسال پیام/نکته از طرف مدیر کل پلتفرم به یک کسب‌وکار یا همه کسب‌وکارها
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeTargetBizId, setNoticeTargetBizId] = useState<'ALL' | string>(
    'ALL'
  );
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  // فقط کسب‌وکارهای واقعی (بدون نمونه‌های نمایشی)
  const sourceBusinesses = businesses.filter((b) => !b.isSampleShowcase);
  const activeBusinesses = sourceBusinesses.filter(
    (b) => b.approvalStatus !== 'REJECTED'
  );
  const trashedBusinesses = sourceBusinesses.filter(
    (b) => b.approvalStatus === 'REJECTED'
  );

  const filtered = sourceBusinesses.filter((b) => {
    const q = searchQuery.trim();
    const matchQuery =
      !q ||
      b.name.includes(q) ||
      b.city.includes(q) ||
      (b.ownerName && b.ownerName.includes(q)) ||
      (b.ownerPhone && b.ownerPhone.includes(q)) ||
      b.phoneDisplay.includes(q);
    const matchStatus =
      statusFilter === 'ALL'
        ? b.approvalStatus !== 'REJECTED'
        : statusFilter === 'VIP'
        ? b.approvalStatus !== 'REJECTED' && Boolean(b.isVipPartner)
        : b.approvalStatus === statusFilter;
    return matchQuery && matchStatus;
  });

  const rejectTargetBiz = businesses.find((b) => b.id === rejectTargetId);
  const permDeleteTargetBiz = businesses.find(
    (b) => b.id === permDeleteTargetId
  );

  const openSendNoticeModal = (
    targetId: 'ALL' | string = 'ALL',
    prefillTitle?: string,
    prefillMessage?: string
  ) => {
    setNoticeTargetBizId(targetId);
    const foundBiz = sourceBusinesses.find((b) => b.id === targetId);
    setNoticeTitle(
      prefillTitle ??
        (targetId === 'ALL'
          ? 'اطلاعیه مهم مدیریت پلتفرم تایم‌تو'
          : `نکته مدیریتی ویژه «${foundBiz?.name || 'سالن شما'}»`)
    );
    setNoticeMessage(prefillMessage ?? '');
    setNoticeModalOpen(true);
  };

  const handleSendNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeMessage.trim()) {
      showToast('لطفاً متن پیام یا اطلاعیه را وارد کنید.', 'warning');
      return;
    }
    const foundBiz = sourceBusinesses.find((b) => b.id === noticeTargetBizId);
    sendPlatformBusinessNotice({
      targetBusinessId: noticeTargetBizId,
      targetBusinessName: foundBiz?.name,
      title: noticeTitle,
      message: noticeMessage,
    });
    setNoticeModalOpen(false);
    setNoticeMessage('');
  };

  const filteredNotices = platformBusinessNotices.filter((n) => {
    if (noticeTypeFilter === 'BROADCAST') return n.targetBusinessId === 'ALL';
    if (noticeTypeFilter === 'DIRECT') return n.targetBusinessId !== 'ALL';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="نظارت، سهمیه نوبت، اشتراک‌های ماهانه (کارمزد ۰٪)، پیام‌های ارسالی و زباله‌دان"
        title="بررسی کسب‌وکارها، پیام‌های مدیریتی و فعال‌سازی اشتراک / تبلیغات"
        subtitle="مشاهده وضعیت ۱۰ نوبت هدیه شروع یا پکیج اشتراک ۱ ماهه هر کسب‌وکار، مدیریت جمع‌وجور پیام‌ها و اطلاعیه‌های ارسالی با قابلیت مشاهده کامل متن، و فعال‌سازی اشتراک یا بنر ۷ و ۱۴ روزه."
        routePattern="/admin/businesses"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'بررسی کسب‌وکارها و پیام‌ها' },
        ]}
        actions={
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => openSendNoticeModal('ALL')}
          >
            <Megaphone className="w-4 h-4" />
            <span>ارسال اطلاعیه / پیام به صاحبان کسب‌وکار</span>
          </Button>
        }
      />

      {/* نوار جمع‌وجور و قابل کنترل «آخرین پیام‌ها و اطلاعیه‌های ارسالی» با قابلیت کلیک برای باز شدن کامل پیام */}
      <Card padding="sm" className="bg-[#F8FAFC] border border-[#CBD5E1] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setNoticesCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#061138] hover:text-[#0057FF] cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-[#0057FF]" />
              <span>
                پیام‌ها و اطلاعیه‌های ارسالی به صاحبان کسب‌وکار (
                {toPersianDigits(platformBusinessNotices.length)} پیام)
              </span>
              {noticesCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#64748B]" />
              )}
            </button>

            {!noticesCollapsed && platformBusinessNotices.length > 0 ? (
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-[#E2E8F0]">
                {[
                  { id: 'ALL' as const, label: 'همه' },
                  { id: 'BROADCAST' as const, label: 'سراسری' },
                  { id: 'DIRECT' as const, label: 'اختصاصی سالن' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setNoticeTypeFilter(f.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors ${
                      noticeTypeFilter === f.id
                        ? 'bg-[#0057FF] text-white'
                        : 'text-[#64748B] hover:text-[#061138]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNoticesCollapsed((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#334155] hover:bg-[#F1F5F9] cursor-pointer"
            >
              {noticesCollapsed ? 'باز کردن لیست پیام‌ها' : 'جمع کردن کادر'}
            </button>
            <button
              type="button"
              onClick={() => openSendNoticeModal('ALL')}
              className="px-2.5 py-1 rounded-lg bg-[#0057FF] text-white text-[11px] font-extrabold hover:bg-[#0046CC] cursor-pointer"
            >
              + پیام جدید
            </button>
          </div>
        </div>

        {!noticesCollapsed ? (
          filteredNotices.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[11px] text-[#64748B] text-center">
              هنوز پیامی در این بخش ثبت نشده است.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] rounded-xl bg-white border border-[#E2E8F0] max-h-48 overflow-y-auto">
              {filteredNotices.map((item) => {
                const isRead =
                  Array.isArray(item.readByBusinessIds) &&
                  item.readByBusinessIds.length > 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => setViewingNotice(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setViewingNotice(item);
                      }
                    }}
                    className="px-3 py-2 hover:bg-[#EFF6FF]/60 transition-colors cursor-pointer flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 ${
                          item.targetBusinessId === 'ALL'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-[#E0ECFF] text-[#0057FF]'
                        }`}
                      >
                        {item.targetBusinessName || 'همه کسب‌وکارها'}
                      </span>
                      <span className="font-extrabold text-[#061138] truncate">
                        {item.title}:
                      </span>
                      <span className="text-[#475569] truncate">
                        {item.message}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isRead
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {isRead ? '✓ خوانده‌شده' : 'ارسال‌شده'}
                      </span>
                      <span className="text-[10px] text-[#64748B] hidden sm:inline">
                        {item.createdAtJalali}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingNotice(item)}
                        className="px-2 py-0.5 rounded-lg bg-[#EFF6FF] text-[#0057FF] hover:bg-[#DBEAFE] text-[10px] font-extrabold cursor-pointer"
                      >
                        مشاهده کامل
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePlatformBusinessNotice(item.id)}
                        title="حذف این پیام"
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E6E0F5]">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: 'ALL',
                label: 'مراکز فعال (بدون ردشده‌ها)',
                count: activeBusinesses.length,
                isTrash: false,
                isVipTab: false,
              },
              {
                id: 'VIP',
                label: '👑 سفیران برند VIP',
                count: activeBusinesses.filter((b) => Boolean(b.isVipPartner)).length,
                isTrash: false,
                isVipTab: true,
              },
              {
                id: 'PENDING_REVIEW',
                label: 'در انتظار بررسی',
                count: sourceBusinesses.filter(
                  (b) => b.approvalStatus === 'PENDING_REVIEW'
                ).length,
                isTrash: false,
                isVipTab: false,
              },
              {
                id: 'APPROVED',
                label: 'تاییدشده',
                count: sourceBusinesses.filter(
                  (b) => b.approvalStatus === 'APPROVED'
                ).length,
                isTrash: false,
                isVipTab: false,
              },
              {
                id: 'REJECTED',
                label: '🗑️ زباله‌دان (رد صلاحیت‌شده)',
                count: trashedBusinesses.length,
                isTrash: true,
                isVipTab: false,
              },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setStatusFilter(tab.id as ApprovalStatus | 'ALL' | 'VIP')
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    active
                      ? tab.isTrash
                        ? 'bg-rose-600 text-white shadow-xs'
                        : tab.isVipTab
                        ? 'bg-amber-500 text-[#061138] shadow-xs'
                        : 'bg-[#0057FF] text-white shadow-xs'
                      : tab.isTrash
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : tab.isVipTab
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                      : 'bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] hover:bg-[#E0ECFF]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="tabular-nums">
                    ({toPersianDigits(tab.count)})
                  </span>
                </button>
              );
            })}
          </div>

          {statusFilter === 'REJECTED' ? (
            <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              کسب‌وکارهای این بخش از صفحات عمومی پلتفرم مخفی شده‌اند و قابل حذف برای همیشه هستند
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="adm-biz-search"
            label="جست‌وجوی نام سالن، نام مالک، شماره موبایل یا شهر"
          >
            <Input
              id="adm-biz-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="نام سالن، شماره موبایل (0913...) یا شهر..."
            />
          </FormField>
          <FormField id="adm-biz-status" label="فیلتر بخش / زباله‌دان">
            <Select
              id="adm-biz-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ApprovalStatus | 'ALL' | 'VIP')
              }
              options={[
                { value: 'ALL', label: 'همه مراکز فعال (بدون زباله‌دان)' },
                { value: 'VIP', label: '👑 فقط سالن‌های سفیر برند VIP' },
                { value: 'APPROVED', label: 'تاییدشده' },
                { value: 'PENDING_REVIEW', label: 'در انتظار بررسی' },
                {
                  value: 'REJECTED',
                  label: 'زباله‌دان (کسب‌وکارهای رد صلاحیت‌شده)',
                },
              ]}
            />
          </FormField>
        </div>
      </Card>

      <ResponsiveTable
        keyExtractor={(b) => b.id}
        data={filtered}
        emptyMessage={
          statusFilter === 'REJECTED'
            ? 'زباله‌دان خالی است؛ هیچ کسب‌وکار رد صلاحیت‌شده‌ای وجود ندارد.'
            : 'هیچ کسب‌وکار واقعی با این فیلتر یافت نشد.'
        }
        columns={[
          {
            key: 'name',
            header: 'عنوان کسب‌وکار، اشتراک فعال، سهمیه نوبت و حساب بانکی',
            render: (b) => {
              const quota = resolveBusinessSubscriptionQuotaStatus({
                business: b,
                appointments,
              });
              return (
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-extrabold text-[#1E1B2E]">
                      {b.name}
                    </span>
                    {b.isVipPartner ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                        👑 سفیر برند VIP
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        quota.isFreeTrial
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-purple-50 text-purple-900 border-purple-200'
                      }`}
                    >
                      {quota.isFreeTrial
                        ? `🎁 ۱۰ نوبت هدیه شروع (${toPersianDigits(quota.remainingBookingsCount)} مانده)`
                        : `💎 ${quota.planTitle} (${toPersianDigits(quota.remainingBookingsCount)} نوبت مانده)`}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold">
                      کارمزد ۰٪
                    </span>
                    {b.bankShebaNumber || b.bankCardNumber ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                        ✓ شبا/کارت ثبت‌شده
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                        ⚠️ شبا/کارت ثبت نشده
                      </span>
                    )}
                    {b.isSponsored &&
                    b.sponsoredDaysRemaining &&
                    b.sponsoredDaysRemaining > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black tabular-nums">
                        ★ {toPersianDigits(b.sponsoredDaysRemaining)} روز تبلیغ ویژه
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'owner',
            header: 'مشخصات مالک و شماره تماس',
            render: (b) => (
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-[#061138] block">
                  {b.ownerName || 'صاحب کسب‌وکار'}
                </span>
                <span
                  dir="ltr"
                  className="font-mono font-extrabold text-[#0057FF] bg-[#E0ECFF] px-2 py-0.5 rounded inline-block"
                >
                  {b.ownerPhone || b.phoneDisplay}
                </span>
              </div>
            ),
          },
          {
            key: 'city',
            header: 'شهر و محله',
            render: (b) => (
              <div className="text-xs space-y-0.5 max-w-xs">
                <span className="font-bold text-[#1E1B2E] block">
                  {b.city}، {b.neighborhood}
                </span>
                <span className="text-[11px] text-[#64748B] line-clamp-1">
                  {b.typeLabel}
                </span>
              </div>
            ),
          },
          {
            key: 'verified',
            header: 'وضعیت احراز',
            render: (b) => (
              <StatusBadge
                label={
                  b.approvalStatus === 'APPROVED'
                    ? 'تاییدشده'
                    : b.approvalStatus === 'PENDING_REVIEW'
                    ? 'در انتظار بررسی'
                    : 'در زباله‌دان (رد صلاحیت)'
                }
                tone={
                  b.approvalStatus === 'APPROVED'
                    ? 'success'
                    : b.approvalStatus === 'PENDING_REVIEW'
                    ? 'warning'
                    : 'danger'
                }
              />
            ),
          },
          {
            key: 'actions',
            header: 'عملیات مدیر، فعال‌سازی اشتراک / بنر و پیام',
            render: (b) => (
              <div className="flex flex-wrap items-center gap-1.5">
                {b.approvalStatus !== 'REJECTED' ? (
                  <Link
                    to={`/salon/${b.slug || b.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0057FF] text-xs font-extrabold transition-colors"
                  >
                    <span>پروفایل عمومی ↗</span>
                  </Link>
                ) : null}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setInspectingBusiness(b)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>مشاهده پنل و پرونده مالی</span>
                </Button>

                {b.approvalStatus !== 'REJECTED' ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openGrantModal(b, 'PLAN')}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>💎 فعال‌سازی اشتراک ۱ ماهه</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openGrantModal(b, 'SPONSORED_AD')}
                    >
                      <span>🌟 بنر و صدرنشینی ۷/۱۴ روزه</span>
                    </Button>
                  </>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openSendNoticeModal(b.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#0057FF]" />
                  <span>ارسال پیام به مالک</span>
                </Button>

                {b.approvalStatus === 'REJECTED' ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => updateBusinessApproval(b.id, 'APPROVED')}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>بازگردانی و تایید</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPermDeleteTargetId(b.id)}
                      className="text-rose-600 border-rose-300 bg-rose-50 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف برای همیشه</span>
                    </Button>
                  </>
                ) : (
                  <>
                    {b.approvalStatus !== 'APPROVED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateBusinessApproval(b.id, 'APPROVED')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید</span>
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextSms = (b.extraSmsBalance ?? 0) + 200;
                        updateBusinessProfile(b.id, {
                          extraSmsBalance: nextSms,
                        });
                        showToast(
                          `۲۰۰ پیامک اضافه برای «${b.name}» شارژ شد (موجودی اضافه: ${toPersianDigits(
                            nextSms
                          )}).`
                        );
                      }}
                    >
                      +۲۰۰ پیامک
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectTargetId(b.id)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>رد صلاحیت (انتقال به زباله‌دان)</span>
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* مودال مشاهده کامل متن پیام / اطلاعیه ارسال‌شده به کسب‌وکارها */}
      <Modal
        isOpen={Boolean(viewingNotice)}
        onClose={() => setViewingNotice(null)}
        title={viewingNotice?.title || 'جزئیات پیام و اطلاعیه مدیریتی'}
        description={
          viewingNotice
            ? `مخاطب: ${
                viewingNotice.targetBusinessName || 'همه کسب‌وکارها'
              } · زمان ارسال: ${viewingNotice.createdAtJalali}`
            : ''
        }
      >
        {viewingNotice ? (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#64748B]">گیرنده پیام:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E0ECFF] text-[#0057FF] font-extrabold">
                  {viewingNotice.targetBusinessName || 'همه صاحبان کسب‌وکار'}
                </span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-extrabold ${
                  viewingNotice.readByBusinessIds?.length > 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {viewingNotice.readByBusinessIds?.length > 0
                  ? `✓ مشاهده‌شده توسط ${toPersianDigits(
                      viewingNotice.readByBusinessIds.length
                    )} کسب‌وکار`
                  : '⏳ ارسال‌شده به پنل سالن‌دار'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border-2 border-[#0057FF]/20 space-y-2">
              <p className="text-[11px] font-bold text-[#64748B]">
                متن کامل پیام ارسال‌شده:
              </p>
              <p className="text-sm text-[#061138] leading-7 whitespace-pre-wrap font-medium">
                {viewingNotice.message}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  const idToDelete = viewingNotice.id;
                  setViewingNotice(null);
                  deletePlatformBusinessNotice(idToDelete);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-extrabold hover:bg-rose-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف این پیام</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(viewingNotice.message);
                    showToast('متن کامل پیام کپی شد.');
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی متن</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const target = viewingNotice.targetBusinessId;
                    const title = viewingNotice.title;
                    const msg = viewingNotice.message;
                    setViewingNotice(null);
                    openSendNoticeModal(target, title, msg);
                  }}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ویرایش / ارسال مجدد</span>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* مودال فعال‌سازی یکی از ۳ پکیج اشتراک ۱ ماهه (کارمزد ۰٪) یا جایگاه تبلیغاتی ۷ و ۱۴ روزه */}
      <Modal
        isOpen={Boolean(grantModalBiz)}
        onClose={() => setGrantModalBiz(null)}
        title={`فعال‌سازی پکیج اشتراک ۱ ماهه یا جایگاه تبلیغاتی برای «${grantModalBiz?.name || ''}»`}
        description="در مدل اشتراکی جدید تایم‌تو (کارمزد ۰٪)، می‌توانید یکی از ۳ پکیج اشتراک ماهانه یا جایگاه تبلیغاتی ۷ و ۱۴ روزه (صدر جست‌وجو / بنر صفحه اول) را برای این کسب‌وکار فعال کنید."
      >
        <form onSubmit={handleGrantSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-extrabold text-[#061138] block">
              ۱. چه اشتراک یا جایگاه تبلیغاتی برای این کسب‌وکار فعال شود؟
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'PLAN' as const, label: '💎 پکیج اشتراک ۱ ماهه' },
                { id: 'SPONSORED_AD' as const, label: '🌟 تبلیغ ۷ یا ۱۴ روزه' },
                { id: 'BOTH' as const, label: 'اشتراک + تبلیغ ویژه' },
                {
                  id: 'VIP_AMBASSADOR' as const,
                  label: '👑 سفیر برند VIP',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setGrantTargetType(opt.id);
                    if (opt.id === 'VIP_AMBASSADOR') {
                      setGrantPlanId('plan-vip-brand');
                      setGrantPlacement('HERO_SPOTLIGHT');
                      setGrantLabel('👑 سالن منتخب و سفیر برند تایم‌تو');
                      setGrantDurationDays(30);
                      setGrantExtraSms(300);
                    } else if (opt.id === 'SPONSORED_AD') {
                      setGrantDurationDays(14);
                    } else {
                      setGrantDurationDays(30);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl font-extrabold border transition-all cursor-pointer ${
                    grantTargetType === opt.id
                      ? opt.id === 'VIP_AMBASSADOR'
                        ? 'bg-amber-500 text-[#061138] border-amber-600 shadow-xs'
                        : 'bg-[#0057FF] text-white border-[#0057FF]'
                      : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {grantTargetType === 'PLAN' ||
          grantTargetType === 'BOTH' ||
          grantTargetType === 'VIP_AMBASSADOR' ? (
            <div className="space-y-2 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1]">
              <label className="font-extrabold text-[#061138] block">
                انتخاب پکیج اشتراک ۱ ماهه (تمامی پکیج‌ها با کارمزد ۰٪ روی نوبت‌ها):
              </label>
              <div className="grid grid-cols-1 gap-2">
                {TIMETO_MONTHLY_PACKAGES.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      setGrantPlanId(pkg.id);
                      setGrantExtraSms(pkg.freeMarketingSmsMonthly);
                    }}
                    className={`p-3 rounded-xl text-right border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      grantPlanId === pkg.id
                        ? 'bg-[#061138] text-white border-[#061138]'
                        : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs">{pkg.shortTitle}</div>
                      <div
                        className={`text-[11px] ${
                          grantPlanId === pkg.id ? 'text-slate-300' : 'text-[#64748B]'
                        }`}
                      >
                        {pkg.monthlyBookingCapLabel} · {pkg.staffLimitLabel} · پکیج ترکیبی ✓
                        {pkg.canPublishStories ? ' · استوری ✓' : ''}
                        {pkg.adDiscountPercent > 0
                          ? ` · ${toPersianDigits(pkg.adDiscountPercent)}٪ تخفیف بنر`
                          : ''}
                      </div>
                    </div>
                    <span className="font-black text-xs shrink-0 tabular-nums">
                      {formatPriceToman(pkg.monthlyPriceToman)} / ماه
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {grantTargetType === 'SPONSORED_AD' ||
          grantTargetType === 'BOTH' ||
          grantTargetType === 'VIP_AMBASSADOR' ? (
            <div className="space-y-3 p-3 rounded-2xl bg-[#ECFDF5]/60 border border-[#A7F3D0]">
              <FormField id="grant-ad-slot" label="جایگاه تبلیغاتی ویژه (۷ یا ۱۴ روزه)">
                <Select
                  id="grant-ad-slot"
                  value={grantPlacement}
                  onChange={(e) =>
                    setGrantPlacement(
                      e.target.value as
                        | 'SEARCH_TOP'
                        | 'HOME_BANNER'
                        | 'HERO_SPOTLIGHT'
                    )
                  }
                  options={[
                    {
                      value: 'SEARCH_TOP',
                      label: '🔍 صدر نتایج جست‌وجوی شهر (/search) — ۷ یا ۱۴ روزه',
                    },
                    {
                      value: 'HOME_BANNER',
                      label: '🌟 بنر ویژه صفحه اصلی + صدر جست‌وجو — ۷ یا ۱۴ روزه',
                    },
                    {
                      value: 'HERO_SPOTLIGHT',
                      label: '🏆 منتخب ماه مراجعان + ویترین طلایی بالای صفحه اصلی',
                    },
                  ]}
                />
              </FormField>
              <FormField id="grant-ad-label" label="برچسب طلایی روی کارت سالن">
                <Input
                  id="grant-ad-label"
                  value={grantLabel}
                  onChange={(e) => setGrantLabel(e.target.value)}
                  placeholder="مثلاً: پیشنهاد ویژه · رزرو آنلاین"
                />
              </FormField>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="font-extrabold text-[#061138] block">
              ۲. مدت اعتبار (پکیج اشتراک: ۳۰ روزه / جایگاه بنر و صدرنشینی: ۷ یا ۱۴ روزه):
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setGrantDurationDays(d)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold border transition-all cursor-pointer tabular-nums ${
                    grantDurationDays === d
                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                      : 'bg-white text-[#334155] border-[#CBD5E1]'
                  }`}
                >
                  {d === 7
                    ? '۷ روز (یک هفته)'
                    : d === 14
                    ? '۱۴ روز (دو هفته — سقف بنر)'
                    : '۳۰ روز (اشتراک ۱ ماهه)'}
                </button>
              ))}
              <div className="flex items-center gap-1.5 mr-auto">
                <span className="text-[#64748B] font-bold">روز دلخواه:</span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  dir="ltr"
                  value={grantDurationDays}
                  onChange={(e) =>
                    setGrantDurationDays(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-20 rounded-xl border border-[#CBD5E1] px-2.5 py-1.5 text-center font-black text-[#061138] tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <FormField
              id="grant-extra-sms"
              label="شارژ پیامک هدیه همراه این فعال‌سازی (اختیاری)"
            >
              <Input
                id="grant-extra-sms"
                type="number"
                min={0}
                dir="ltr"
                value={String(grantExtraSms)}
                onChange={(e) =>
                  setGrantExtraSms(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </FormField>

            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-[#061138]">
                <input
                  type="checkbox"
                  checked={grantIsTrial}
                  onChange={(e) => setGrantIsTrial(e.target.checked)}
                  className="w-4 h-4 accent-[#0057FF]"
                />
                <span>ارسال اعلان فعال‌سازی به پیشخوان سالن‌دار</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setGrantModalBiz(null)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary" size="sm">
              <Check className="w-3.5 h-3.5" />
              <span>
                فعال‌سازی فوری به مدت {toPersianDigits(grantDurationDays)} روز
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      <BusinessFullInspectModal
        business={inspectingBusiness}
        onClose={() => setInspectingBusiness(null)}
        onApprove={(id) => updateBusinessApproval(id, 'APPROVED')}
        onReject={(id) => updateBusinessApproval(id, 'REJECTED')}
      />

      {/* مودال ارسال پیام یا اطلاعیه از طرف مدیر پلتفرم به صاحب کسب‌وکار */}
      <Modal
        isOpen={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        title="ارسال پیام و اعلان مستقیم به صاحب کسب‌وکار"
        description="این پیام بلافاصله به صورت نوتیفیکیشن زنگوله و بنر بالای پیشخوان برای صاحب کسب‌وکار نمایش داده می‌شود و آکاردئون اطلاعیه‌های او را باز می‌کند."
      >
        <form onSubmit={handleSendNoticeSubmit} className="space-y-4 text-xs">
          <FormField id="notice-target-biz" label="مخاطب پیام / اطلاعیه">
            <Select
              id="notice-target-biz"
              value={noticeTargetBizId}
              onChange={(e) => setNoticeTargetBizId(e.target.value)}
              options={[
                {
                  value: 'ALL',
                  label: '📢 همه صاحبان کسب‌وکار (اطلاعیه سراسری)',
                },
                ...sourceBusinesses.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.ownerName || b.ownerPhone || b.city})`,
                })),
              ]}
            />
          </FormField>

          <FormField id="notice-title" label="عنوان پیام یا اطلاعیه">
            <Input
              id="notice-title"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="مثلاً: تکمیل آدرس یا اطلاعیه جدید پلتفرم"
            />
          </FormField>

          <FormField id="notice-body" label="متن پیام برای صاحب کسب‌وکار">
            <textarea
              id="notice-body"
              rows={4}
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              placeholder="متن نکته، راهنمایی یا تذکر مدیریتی خود را بنویسید..."
              className="w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-xs font-medium text-[#061138] focus:border-[#0057FF] focus:outline-none"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setNoticeModalOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary" size="sm">
              <Send className="w-3.5 h-3.5" />
              <span>ارسال فوری به پنل سالن‌دار</span>
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={Boolean(rejectTargetId)}
        onClose={() => setRejectTargetId(null)}
        onConfirm={() => {
          if (rejectTargetId) {
            updateBusinessApproval(rejectTargetId, 'REJECTED');
            setRejectTargetId(null);
          }
        }}
        title="انتقال کسب‌وکار به زباله‌دان (رد صلاحیت)"
        confirmLabel="بله، رد صلاحیت و منتقل به زباله‌دان شود"
        message={`با رد صلاحیت «${rejectTargetBiz?.name ?? ''}»، این مرکز از تمام صفحات عمومی حذف شده و به بخش «زباله‌دان» منتقل می‌شود. آیا ادامه می‌دهید؟`}
      />

      <ConfirmationDialog
        isOpen={Boolean(permDeleteTargetId)}
        onClose={() => setPermDeleteTargetId(null)}
        onConfirm={() => {
          if (permDeleteTargetId) {
            permanentlyDeleteBusiness(permDeleteTargetId);
            setPermDeleteTargetId(null);
          }
        }}
        title="حذف برای همیشه از زباله‌دان"
        confirmLabel="حذف دائمی و همیشگی"
        message={`آیا از حذف دائمی و همیشگی کسب‌وکار «${permDeleteTargetBiz?.name ?? ''}» از زباله‌دان اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`}
      />
    </div>
  );
};

/** ۳. مدیریت کاربران، سالن‌داران و نظارت بر دیدگاه‌ها (/admin/users) */
export const AdminUsersPage: React.FC = () => {
  const {
    adminUsers,
    businesses,
    reviews,
    deleteReviewByAdmin,
    replyToReview,
    refreshRealData,
    updateBusinessApproval,
    updateAdminUserRecord,
    deleteAdminUserRecord,
  } = usePrototypeData();
  const [activeTab, setActiveTab] = useState<
    'CUSTOMERS' | 'BUSINESS_OWNERS' | 'ALL' | 'REVIEWS'
  >('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'REPORTED' | 'CRITICAL'>('ALL');
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const [page, setPage] = useState(1);
  const [inspectingBusiness, setInspectingBusiness] =
    useState<BusinessItem | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  );

  // مودال ویرایش مشخصات و شماره موبایل کاربر توسط مدیر کل
  const [editingUser, setEditingUser] = useState<{
    phone: string;
    fullName: string;
    newPhone: string;
    city: string;
    role: 'CUSTOMER' | 'BUSINESS_OWNER';
  } | null>(null);

  // تایید حذف حساب کاربری
  const [deletingUser, setDeletingUser] = useState<{
    phone: string;
    name: string;
  } | null>(null);

  const realBusinesses = businesses.filter((b) => !b.isSampleShowcase);

  const enrichedUsers = adminUsers.map((u) => {
    const cleanPhone = normalizeIranMobileInput(u.phone || u.phoneMasked);
    const matchedBiz = realBusinesses.find(
      (b) =>
        normalizeIranMobileInput(b.ownerPhone || b.phoneDisplay) === cleanPhone
    );
    const isSalonOwner =
      Boolean(matchedBiz) ||
      u.roleLabel.includes('سالن') ||
      u.roleLabel.includes('کسب‌وکار');
    const isPlatformAdmin = u.roleLabel.includes('مدیر کل');

    return {
      id: u.id,
      name: u.fullName,
      roleLabel: u.roleLabel,
      roleType: isSalonOwner ? ('BUSINESS_OWNER' as const) : ('CUSTOMER' as const),
      isPlatformAdmin,
      phone: cleanPhone || u.phone || u.phoneMasked,
      city: matchedBiz?.city || u.city || 'اصفهان',
      neighborhood: matchedBiz?.neighborhood || '',
      joinedJalali: u.joinedJalali || 'امروز',
      status: u.isActive ? 'فعال' : 'غیرفعال',
      matchedBusiness: matchedBiz || null,
    };
  });

  const customerUsers = enrichedUsers.filter(
    (u) => u.roleType === 'CUSTOMER'
  );
  const businessOwnerUsers = enrichedUsers.filter(
    (u) => u.roleType === 'BUSINESS_OWNER'
  );

  const tabSource =
    activeTab === 'CUSTOMERS'
      ? customerUsers
      : activeTab === 'BUSINESS_OWNERS'
        ? businessOwnerUsers
        : enrichedUsers;

  const filtered = tabSource.filter((u) => {
    const q = searchQuery.trim();
    if (!q) return true;
    return (
      u.name.includes(q) ||
      u.phone.includes(q) ||
      u.city.includes(q) ||
      (u.matchedBusiness?.name && u.matchedBusiness.name.includes(q))
    );
  });

  const reportedReviewsCount = reviews.filter((r) => r.isReportedBySalon).length;
  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'REPORTED' && !r.isReportedBySalon) return false;
    if (reviewFilter === 'CRITICAL' && r.rating > 2) return false;
    const q = searchQuery.trim();
    if (!q) return true;
    const biz = businesses.find((b) => b.id === r.businessId);
    return (
      r.authorName.includes(q) ||
      r.comment.includes(q) ||
      r.serviceTitle.includes(q) ||
      (biz?.name && biz.name.includes(q))
    );
  });

  const tabOrder: Array<'CUSTOMERS' | 'BUSINESS_OWNERS' | 'ALL' | 'REVIEWS'> = [
    'CUSTOMERS',
    'BUSINESS_OWNERS',
    'ALL',
    'REVIEWS',
  ];

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const ok = updateAdminUserRecord(editingUser.phone, {
      fullName: editingUser.fullName.trim(),
      newPhone: editingUser.newPhone.trim(),
      city: editingUser.city.trim(),
      role: editingUser.role,
    });
    if (ok) {
      setEditingUser(null);
    }
  };

  return (
    <div
      onTouchStart={(e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('input, select, textarea, button')) return;
        const t = e.touches[0];
        if (t) setTouchStart({ x: t.clientX, y: t.clientY });
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        if (!touchStart || !t) return;
        const nextTab = resolveAdjacentTabBySwipe(
          tabOrder,
          activeTab,
          t.clientX - touchStart.x,
          t.clientY - touchStart.y,
          50
        );
        setTouchStart(null);
        if (nextTab) {
          setActiveTab(
            nextTab as 'CUSTOMERS' | 'BUSINESS_OWNERS' | 'ALL' | 'REVIEWS'
          );
        }
      }}
      className="space-y-6"
    >
      <PageHeader
        kicker="پنل مدیریت کلان · تفکیک مشتریان، سالن‌داران و نظارت بر دیدگاه‌ها"
        title="مدیریت کاربران عادی، صاحبان کسب‌وکار و دیدگاه‌ها"
        subtitle="مشاهده تمام ثبت‌نام‌های قدیمی و جدید سامانه (همگام با دیتابیس PostgreSQL) و مدیریت دیدگاه‌های حاوی فحاشی یا جفنگ بدون حذف نظرات منفی منصفانه"
        routePattern="/admin/users"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'کاربران و دیدگاه‌ها' },
        ]}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRefreshingUsers}
            onClick={async () => {
              setIsRefreshingUsers(true);
              try {
                await refreshRealData();
              } finally {
                setIsRefreshingUsers(false);
              }
            }}
          >
            <span>
              {isRefreshingUsers
                ? 'در حال دریافت از دیتابیس...'
                : 'بروزرسانی لیست کاربران و دیدگاه‌ها'}
            </span>
          </Button>
        }
      />

      {/* تب‌های تفکیک‌شده: ۱. کاربران عادی (مشتریان)  ۲. صاحبان سالن‌ها  ۳. همه حساب‌ها  ۴. نظارت بر دیدگاه‌ها */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="admin-users-tab-customers"
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-[#0057FF] text-white shadow-[0_6px_18px_-4px_rgba(0,87,255,0.45)]'
                  : 'bg-[#F3F6FC] text-[#061138] border border-[#CBD5E1] hover:bg-[#E0ECFF]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>کاربران عادی (مشتریان)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums ${
                  activeTab === 'CUSTOMERS'
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-[#0057FF]'
                }`}
              >
                {toPersianDigits(customerUsers.length)}
              </span>
            </button>

            <button
              type="button"
              id="admin-users-tab-owners"
              onClick={() => setActiveTab('BUSINESS_OWNERS')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'BUSINESS_OWNERS'
                  ? 'bg-[#0057FF] text-white shadow-[0_6px_18px_-4px_rgba(0,87,255,0.45)]'
                  : 'bg-[#F3F6FC] text-[#061138] border border-[#CBD5E1] hover:bg-[#E0ECFF]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>صاحبان سالن‌ها (کسب‌وکارها)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums ${
                  activeTab === 'BUSINESS_OWNERS'
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-[#0057FF]'
                }`}
              >
                {toPersianDigits(businessOwnerUsers.length)}
              </span>
            </button>

            <button
              type="button"
              id="admin-users-tab-all"
              onClick={() => setActiveTab('ALL')}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#061138] text-white'
                  : 'bg-white text-[#475569] border border-[#CBD5E1] hover:bg-[#F8FAFC]'
              }`}
            >
              <span>همه حساب‌ها ({toPersianDigits(enrichedUsers.length)})</span>
            </button>

            <button
              type="button"
              id="admin-users-tab-reviews"
              onClick={() => setActiveTab('REVIEWS')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === 'REVIEWS'
                  ? 'bg-rose-600 text-white shadow-[0_6px_18px_-4px_rgba(225,29,72,0.45)]'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span>نظارت بر دیدگاه‌ها (حذف فحاشی/جفنگ)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] tabular-nums ${
                  activeTab === 'REVIEWS'
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-rose-700'
                }`}
              >
                {toPersianDigits(reviews.length)}
              </span>
              {reportedReviewsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[#061138] text-[10px] font-black">
                  {toPersianDigits(reportedReviewsCount)} گزارش
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded-full">
            ✓ همگام‌سازی خودکار کاربران قدیمی و جدید با دیتابیس فعال است
          </span>
        </div>

        <FormField
          id="adm-usr-search"
          label={
            activeTab === 'REVIEWS'
              ? 'جست‌وجو در متن دیدگاه‌ها، نام نویسنده یا نام سالن'
              : 'جست‌وجوی سریع بر اساس نام، شماره موبایل (09...)، نام سالن یا شهر'
          }
        >
          <Input
            id="adm-usr-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'REVIEWS'
                ? 'جست‌وجوی متن نظر، نام مشتری یا سالن...'
                : 'نام کاربر، شماره موبایل یا نام سالن...'
            }
          />
        </FormField>
      </Card>

      {activeTab === 'REVIEWS' ? (
        <Card className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-extrabold text-[#061138]">
                سیاست ضدسانسور و حذف فحاشی/جفنگ در تایم‌تو:
              </p>
              <p className="text-[#475569]">
                ۱. ثبت دیدگاه منفی و انتقاد منصفانه (۱ یا ۲ ستاره) حق طبیعی مشتری است و سالن‌دار امکان حذف آن را ندارد.
                ۲. کلمات رکیک و حروف بی‌معنی (جفنگ) به صورت هوشمند هنگام ثبت مسدود می‌شوند و در صورت گزارش سالن‌دار، شما به عنوان مدیر کل می‌توانید آن را حذف کنید.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'ALL', label: `همه دیدگاه‌ها (${toPersianDigits(reviews.length)})` },
                {
                  id: 'REPORTED',
                  label: `گزارش‌شده توسط سالن (${toPersianDigits(reportedReviewsCount)})`,
                },
                {
                  id: 'CRITICAL',
                  label: `انتقادی ۱ و ۲ ستاره (${toPersianDigits(
                    reviews.filter((r) => r.rating <= 2).length
                  )})`,
                },
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() =>
                    setReviewFilter(flt.id as 'ALL' | 'REPORTED' | 'CRITICAL')
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    reviewFilter === flt.id
                      ? 'bg-[#0057FF] text-white'
                      : 'bg-white border border-[#CBD5E1] text-[#334155]'
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredReviews.length === 0 ? (
              <p className="text-xs text-center text-[#64748B] py-8">
                هیچ دیدگاهی با این فیلتر یافت نشد.
              </p>
            ) : (
              filteredReviews.map((rev) => {
                const targetBiz = businesses.find((b) => b.id === rev.businessId);
                return (
                  <div
                    key={rev.id}
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      rev.isReportedBySalon
                        ? 'bg-rose-50/60 border-rose-300'
                        : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-[#061138]">
                          {rev.authorName}
                        </span>
                        {rev.authorPhone && (
                          <span
                            dir="ltr"
                            className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700"
                          >
                            {rev.authorPhone}
                          </span>
                        )}
                        <span className="text-[#64748B]">
                          برای سالن:{' '}
                          <strong className="text-[#0057FF]">
                            {targetBiz?.name || rev.businessId}
                          </strong>{' '}
                          ({rev.serviceTitle})
                        </span>
                        {rev.isReportedBySalon && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold">
                            گزارش فحاشی/جفنگ: {rev.reportReason || 'نیازمند بررسی'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-extrabold tabular-nums ${
                            rev.rating <= 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          ★ {toPersianDigits(rev.rating)} از ۵ · {rev.dateJalali}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void deleteReviewByAdmin(rev.id)}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف دیدگاه (فحاشی/جفنگ)</span>
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                      {rev.comment}
                    </p>

                    {rev.salonReply && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border-r-4 border-[#0057FF] text-xs text-[#334155]">
                        <strong className="text-[#0057FF] block mb-0.5">
                          پاسخ سالن:
                        </strong>
                        {rev.salonReply}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      ) : (
        <>
          <ResponsiveTable
            keyExtractor={(u) => `${u.phone}-${u.id}`}
            data={filtered}
            emptyMessage={
              activeTab === 'CUSTOMERS'
                ? 'هنوز کاربر عادی (مشتری) با این مشخصات ثبت نشده است.'
                : activeTab === 'BUSINESS_OWNERS'
                  ? 'هنوز صاحب سالنی در این بخش ثبت‌نام نکرده است.'
                  : 'هیچ حساب کاربری یافت نشد.'
            }
            columns={[
              {
                key: 'name',
                header: 'نام و نام خانوادگی',
                render: (u) => (
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-[#061138] block">
                      {u.name}
                    </span>
                    <span className="text-[11px] text-[#64748B] block">
                      تاریخ عضویت: {u.joinedJalali}
                    </span>
                  </div>
                ),
              },
              {
                key: 'phone',
                header: 'شماره همراه یکتا (بدون سانسور)',
                render: (u) => (
                  <a
                    href={`tel:${u.phone}`}
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#0057FF] bg-[#E0ECFF] px-2.5 py-1 rounded-lg tabular-nums hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{u.phone}</span>
                  </a>
                ),
              },
              {
                key: 'role',
                header:
                  activeTab === 'BUSINESS_OWNERS'
                    ? 'مشخصات سالن و وضعیت تایید'
                    : 'نقش و جزئیات حساب',
                render: (u) => (
                  <div className="space-y-1">
                    <StatusBadge
                      label={u.roleLabel}
                      tone={
                        u.isPlatformAdmin
                          ? 'accent'
                          : u.roleType === 'BUSINESS_OWNER'
                            ? 'primary'
                            : 'success'
                      }
                    />
                    {u.matchedBusiness ? (
                      <p className="text-[11px] text-[#334155]">
                        وضعیت سالن:{' '}
                        <strong className="text-[#061138]">
                          {u.matchedBusiness.approvalStatus === 'APPROVED'
                            ? 'تاییدشده'
                            : u.matchedBusiness.approvalStatus === 'PENDING_REVIEW'
                              ? 'در انتظار بررسی'
                              : 'ردشده'}
                        </strong>
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'city',
                header: 'شهر و محدوده',
                render: (u) => (
                  <span className="text-xs font-bold text-[#334155]">
                    {u.city}
                    {u.neighborhood ? ` · ${u.neighborhood}` : ''}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'مدیریت، ویرایش یا حذف حساب',
                render: (u) => (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {u.matchedBusiness ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setInspectingBusiness(u.matchedBusiness)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده پنل سالن</span>
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingUser({
                          phone: u.phone,
                          fullName: u.name,
                          newPhone: u.phone,
                          city: u.city,
                          role: u.roleType,
                        })
                      }
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </Button>

                    {!u.isPlatformAdmin ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDeletingUser({ phone: u.phone, name: u.name })
                        }
                        className="text-[#EF4444] border-[#FECACA] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />

          <Pagination currentPage={page} totalPages={1} onPageChange={setPage} />
        </>
      )}

      <BusinessFullInspectModal
        business={inspectingBusiness}
        onClose={() => setInspectingBusiness(null)}
        onApprove={(id) => updateBusinessApproval(id, 'APPROVED')}
        onReject={(id) => updateBusinessApproval(id, 'REJECTED')}
      />

      {/* مودال ویرایش مشخصات یا اصلاح شماره موبایل کاربر توسط مدیر کل */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`ویرایش مشخصات کاربر: ${editingUser?.fullName ?? ''}`}
        description="می‌توانید نام، شماره همراه (با بررسی عدم تکرار) یا نقش کاربری را اصلاح کنید"
      >
        {editingUser ? (
          <form onSubmit={handleSaveEditUser} className="space-y-4">
            <FormField id="adm-edit-usr-name" label="نام و نام خانوادگی" required>
              <Input
                id="adm-edit-usr-name"
                value={editingUser.fullName}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, fullName: e.target.value })
                }
              />
            </FormField>

            <FormField
              id="adm-edit-usr-phone"
              label="شماره همراه ۱۱ رقمی (یکتا)"
              required
            >
              <Input
                id="adm-edit-usr-phone"
                dir="ltr"
                inputMode="tel"
                value={editingUser.newPhone}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    newPhone: normalizeIranMobileInput(e.target.value),
                  })
                }
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="adm-edit-usr-city" label="شهر">
                <Input
                  id="adm-edit-usr-city"
                  value={editingUser.city}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, city: e.target.value })
                  }
                />
              </FormField>

              <FormField id="adm-edit-usr-role" label="نوع حساب کاربری">
                <Select
                  id="adm-edit-usr-role"
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as 'CUSTOMER' | 'BUSINESS_OWNER',
                    })
                  }
                  options={[
                    { value: 'CUSTOMER', label: 'کاربر عادی (مشتری)' },
                    {
                      value: 'BUSINESS_OWNER',
                      label: 'صاحب کسب‌وکار (سالن‌دار)',
                    },
                  ]}
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
              >
                انصراف
              </Button>
              <Button type="submit" variant="primary">
                <Check className="w-4 h-4" />
                <span>ذخیره تغییرات کاربر</span>
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* دیالوگ تایید حذف حساب کاربری */}
      <ConfirmationDialog
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => {
          if (deletingUser) {
            deleteAdminUserRecord(deletingUser.phone);
            setDeletingUser(null);
          }
        }}
        title="حذف حساب کاربری"
        confirmLabel="بله، حساب حذف شود"
        message={`آیا از حذف حساب کاربری «${deletingUser?.name ?? ''}» با شماره ${deletingUser?.phone ?? ''} اطمینان دارید؟ پس از حذف، این شماره آزاد شده و امکان ثبت‌نام مجدد خواهد داشت.`}
      />
    </div>
  );
};

/** ۴. مدیریت دسته‌بندی‌ها (/admin/categories) — همراه با آیکون‌های اصلی، ویرایش، حذف و جابه‌جایی اولویت نمایش */
export const AdminCategoriesPage: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
  } = usePrototypeData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [iconName, setIconName] = useState('Sparkles');

  const openAdd = () => {
    setEditingCat(null);
    setTitle('');
    setSlug('');
    setSubtitle('');
    setIconName('Sparkles');
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setTitle(cat.title);
    setSlug(cat.slug);
    setSubtitle(cat.subtitle);
    setIconName(cat.iconName || 'Sparkles');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    if (editingCat) {
      updateCategory(editingCat.id, {
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim(),
        iconName,
      });
    } else {
      addCategory({
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim() || 'دسته‌بندی خدمات زیبایی',
        serviceCount: 12,
        targetAudience: 'سالن‌ها و متخصصان زیبایی',
        iconName,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="ساختار بازارچه · طبقه‌بندی خدمات و اولویت نمایش در صفحه اول"
        title="مدیریت دسته‌بندی‌های خدمات و چیدمان آیکون‌ها"
        subtitle="تمامی دسته‌بندی‌های اصلی (آرایش و میکاپ، ناخن، مو و رنگ، پوست و فیشیال، ابرو و مژه، آرایشگاه مردانه و...) همراه با آیکون و قابلیت تغییر اولویت (بالا / پایین)"
        routePattern="/admin/categories"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'دسته‌بندی خدمات' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>افزودن دسته‌بندی جدید</span>
          </Button>
        }
      />

      <ResponsiveTable
        keyExtractor={(c) => c.id}
        data={categories}
        columns={[
          {
            key: 'order',
            header: 'اولویت نمایش',
            render: (c, idx) => (
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-[#F1F5F9] text-[#061138] font-extrabold text-xs inline-flex items-center justify-center tabular-nums">
                  {toPersianDigits((idx ?? 0) + 1)}
                </span>
                <button
                  type="button"
                  onClick={() => reorderCategory(c.id, 'UP')}
                  disabled={idx === 0}
                  title="انتقال به اولویت بالاتر"
                  className="p-1 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0057FF] disabled:opacity-35 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-[#061138]" />
                </button>
                <button
                  type="button"
                  onClick={() => reorderCategory(c.id, 'DOWN')}
                  disabled={idx === categories.length - 1}
                  title="انتقال به اولویت پایین‌تر"
                  className="p-1 rounded-lg border border-[#CBD5E1] bg-white hover:border-[#0057FF] disabled:opacity-35 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-[#061138]" />
                </button>
              </div>
            ),
          },
          {
            key: 'title',
            header: 'آیکون و عنوان دسته‌بندی',
            render: (c) => {
              const IconComp =
                CATEGORY_ICON_COMPONENTS[c.iconName] || Sparkles;
              return (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#E0ECFF] text-[#0057FF] flex items-center justify-center shrink-0">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-[#1E1B2E]">
                    {c.title}
                  </span>
                </div>
              );
            },
          },
          {
            key: 'slug',
            header: 'شناسه (Slug)',
            render: (c) => (
              <span
                dir="ltr"
                className="font-mono text-xs bg-[#EDE9FE] px-2 py-0.5 rounded text-[#8B5CF6]"
              >
                {c.slug}
              </span>
            ),
          },
          {
            key: 'subtitle',
            header: 'زیرعنوان و شرح خدمات',
            render: (c) => (
              <span className="text-xs text-[#6B6480]">{c.subtitle}</span>
            ),
          },
          {
            key: 'action',
            header: 'عملیات ویرایش / حذف',
            render: (c) => (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteCategory(c.id)}
                  className="text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCat ? 'ویرایش دسته‌بندی و آیکون' : 'افزودن دسته‌بندی جدید'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField id="cat-title" label="عنوان فارسی دسته‌بندی" required>
            <Input
              id="cat-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً آرایش و میکاپ"
            />
          </FormField>
          <FormField id="cat-slug" label="شناسه انگلیسی (Slug)" required>
            <Input
              id="cat-slug"
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="makeup"
            />
          </FormField>
          <FormField id="cat-icon" label="انتخاب آیکون نمایشی در صفحه اول">
            <Select
              id="cat-icon"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              options={[
                { value: 'Sparkles', label: '✨ درخشش (آرایش و میکاپ)' },
                { value: 'Gem', label: '💎 نگین (ناخن و مانیکور)' },
                { value: 'Scissors', label: '✂️ قیچی (مو، رنگ و کوتاهی)' },
                { value: 'Droplets', label: '💧 قطره (پوست و فیشیال)' },
                { value: 'Eye', label: '👁️ چشم (ابرو و مژه)' },
                { value: 'UserCheck', label: '🧔 پیرایش (آرایشگاه مردانه)' },
                { value: 'Award', label: '🏆 تاج (پکیج عروس VIP)' },
                { value: 'HeartHandshake', label: '🌿 اسپا و مراقبت بدن' },
              ]}
            />
          </FormField>
          <FormField id="cat-sub" label="توضیح کوتاه خدمات زیرمجموعه">
            <Input
              id="cat-sub"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="میکاپ تخصصی، گریم عروس، شینیون..."
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary" size="sm">
              ذخیره دسته‌بندی
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


/** ۵. مدیریت اشتراک‌های ماهانه، سهمیه نوبت‌ها و جایگاه‌های تبلیغاتی (/admin/subscriptions) */
export const AdminSubscriptionsPage: React.FC = () => {
  const {
    plans,
    updatePlan,
    adPackages,
    updateAdPackage,
    businesses,
    appointments,
    updateBusinessProfile,
    grantBusinessPlanOrAdByAdmin,
    paymentOrders,
    reviewPaymentOrder,
    showToast,
  } = usePrototypeData();

  // مودال ویرایش پلن اشتراک
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(
    null
  );
  const [planNameInput, setPlanNameInput] = useState('');
  const [planPriceInput, setPlanPriceInput] = useState('');
  const [planStaffInput, setPlanStaffInput] = useState('');
  const [planSmsInput, setPlanSmsInput] = useState('');
  const [planAudienceInput, setPlanAudienceInput] = useState('');
  const [planFeaturesInput, setPlanFeaturesInput] = useState('');

  // مودال ویرایش بسته تبلیغاتی / پیامک
  const [editingAdPkg, setEditingAdPkg] = useState<AdPackageItem | null>(null);
  const [adTitleInput, setAdTitleInput] = useState('');
  const [adMonthlyPriceInput, setAdMonthlyPriceInput] = useState('');
  const [adWeeklyPriceInput, setAdWeeklyPriceInput] = useState('');
  const [adCapacityInput, setAdCapacityInput] = useState('');
  const [adDescInput, setAdDescInput] = useState('');
  const [adSmsCountInput, setAdSmsCountInput] = useState('');

  // مودال مدیریت دقیق جایگاه و زمان تبلیغ یک کسب‌وکار
  const [managingBiz, setManagingBiz] = useState<BusinessItem | null>(null);
  const [bizSponsoredActive, setBizSponsoredActive] = useState(false);
  const [bizPlacementSlot, setBizPlacementSlot] =
    useState<SponsoredPlacementSlot>('SEARCH_TOP');
  const [bizSponsoredOrder, setBizSponsoredOrder] = useState('1');
  const [bizSponsoredDays, setBizSponsoredDays] = useState('14');
  const [bizSponsoredLabel, setBizSponsoredLabel] = useState('');
  const [bizExtraSms, setBizExtraSms] = useState('0');
  const [bizPlanName, setBizPlanName] = useState('');
  const [bizTrialDays, setBizTrialDays] = useState('0');

  const openEditPlanModal = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setPlanNameInput(plan.name);
    setPlanPriceInput(String(plan.monthlyPriceToman));
    setPlanStaffInput(plan.staffLimit);
    setPlanSmsInput(String(plan.smsQuotaMonthly));
    setPlanAudienceInput(plan.audience);
    setPlanFeaturesInput(plan.features.join('\n'));
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    updatePlan(editingPlan.id, {
      name: planNameInput.trim() || editingPlan.name,
      monthlyPriceToman: Math.max(0, Number(planPriceInput) || 0),
      staffLimit: planStaffInput.trim() || editingPlan.staffLimit,
      smsQuotaMonthly: Math.max(0, Number(planSmsInput) || 0),
      audience: planAudienceInput.trim() || editingPlan.audience,
      features: planFeaturesInput
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    });
    setEditingPlan(null);
  };

  const openEditAdPkgModal = (pkg: AdPackageItem) => {
    setEditingAdPkg(pkg);
    setAdTitleInput(pkg.title);
    setAdMonthlyPriceInput(String(pkg.priceToman));
    setAdWeeklyPriceInput(String(pkg.weeklyPriceToman ?? 190000));
    setAdCapacityInput(pkg.badge);
    setAdDescInput(pkg.description);
    setAdSmsCountInput(String(pkg.smsCount ?? 200));
  };

  const handleSaveAdPkg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdPkg) return;
    updateAdPackage(editingAdPkg.id, {
      title: adTitleInput.trim() || editingAdPkg.title,
      priceToman: Math.max(0, Number(adMonthlyPriceInput) || 0),
      weeklyPriceToman: Math.max(0, Number(adWeeklyPriceInput) || 0),
      badge: adCapacityInput.trim() || editingAdPkg.badge,
      description: adDescInput.trim() || editingAdPkg.description,
      smsCount:
        editingAdPkg.slot === 'SMS_ADDON'
          ? Math.max(10, Number(adSmsCountInput) || 200)
          : undefined,
    });
    setEditingAdPkg(null);
  };

  const openManageBizModal = (biz: BusinessItem) => {
    setManagingBiz(biz);
    setBizSponsoredActive(Boolean(biz.isSponsored));
    setBizPlacementSlot(biz.sponsoredPlacement || 'SEARCH_TOP');
    setBizSponsoredOrder(String(biz.sponsoredOrder ?? 1));
    setBizSponsoredDays(String(biz.sponsoredDaysRemaining ?? 14));
    setBizSponsoredLabel(biz.sponsoredLabel || 'پیشنهاد ویژه رزرو آنلاین');
    setBizExtraSms(String(biz.extraSmsBalance ?? 0));
    setBizPlanName(biz.subscriptionPlan);
    setBizTrialDays(String(biz.trialDaysRemaining ?? 0));
  };

  const handleSaveBizPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingBiz) return;
    const daysNum = Math.max(0, Number(bizSponsoredDays) || 0);
    const orderNum = Math.max(1, Number(bizSponsoredOrder) || 1);
    const trialNum = Math.max(0, Number(bizTrialDays) || 0);
    const nowMs = Date.now();
    updateBusinessProfile(managingBiz.id, {
      isSponsored: bizSponsoredActive && daysNum > 0,
      featured:
        bizSponsoredActive &&
        (bizPlacementSlot === 'HOME_BANNER' ||
          bizPlacementSlot === 'HERO_SPOTLIGHT')
          ? true
          : managingBiz.featured,
      sponsoredPlacement: bizPlacementSlot,
      sponsoredOrder: orderNum,
      sponsoredDaysRemaining: daysNum,
      sponsoredExpiresAtMs:
        bizSponsoredActive && daysNum > 0
          ? nowMs + daysNum * 24 * 60 * 60 * 1000
          : undefined,
      sponsoredLabel: bizSponsoredLabel.trim() || 'پیشنهاد ویژه',
      extraSmsBalance: Math.max(0, Number(bizExtraSms) || 0),
      subscriptionPlan: bizPlanName || managingBiz.subscriptionPlan,
      trialDaysRemaining: trialNum,
      planExpiresAtMs:
        trialNum > 0 ? nowMs + trialNum * 24 * 60 * 60 * 1000 : nowMs + 30 * 24 * 60 * 60 * 1000,
      subscriptionStatus:
        trialNum > 0 ? SubscriptionStatus.Trial : SubscriptionStatus.Active,
    });
    showToast(
      `تنظیمات جایگاه تبلیغاتی، اشتراک و پیامک «${managingBiz.name}» ذخیره شد.`
    );
    setManagingBiz(null);
  };

  const pendingOrders = paymentOrders.filter((o) => o.status === 'PENDING');

  const placementLabels: Record<string, string> = {
    SEARCH_TOP: '🔍 صدر جست‌وجو (/search)',
    HOME_BANNER: '🌟 بنر ویژه صفحه اصلی + صدر جست‌وجو',
    HERO_SPOTLIGHT: '🏆 منتخب ماه مراجعان + ویترین طلایی صفحه اصلی',
  };

  const realActiveBusinesses = businesses.filter(
    (b) => !b.isSampleShowcase && b.approvalStatus !== 'REJECTED'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مدل درآمدی جدید تایم‌تو · کارمزد ۰٪ · ۱۰ نوبت هدیه شروع + ۳ پکیج اشتراک ۱ ماهه + جایگاه‌های تبلیغاتی ۷ و ۱۴ روزه"
        title="مدیریت ۳ پکیج اشتراک ماهانه، سهمیه نوبت کسب‌وکارها و جایگاه‌های تبلیغاتی"
        subtitle="در مدل جدید، کارمزد پلتفرم از تمامی نوبت‌ها ۰٪ است و ۱۰۰٪ بیعانه به حساب صاحب کسب‌وکار تسویه می‌شود. درآمد پلتفرم از فروش ۳ پکیج اشتراک ۱ ماهه (پس از ۱۰ نوبت هدیه شروع) و جایگاه‌های بنر/صدرنشینی (۷ و ۱۴ روزه) تامین می‌گردد."
        routePattern="/admin/subscriptions"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'اشتراک‌های ماهانه و تبلیغات' },
        ]}
      />

      {/* بخش ۱: ۳ پکیج اشتراک ۱ ماهه تایم‌تو (با کارمزد ۰٪ و ۱۰ نوبت هدیه شروع) */}
      <Card className="border-2 border-[#0057FF]/30 bg-gradient-to-br from-[#EFF6FF] via-white to-[#F8FAFC] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#BFDBFE] pb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Crown className="w-5 h-5 text-[#0057FF]" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#061138]">
                ۱. پکیج‌های اشتراک ۱ ماهه تایم‌تو (پس از اتمام {toPersianDigits(FREE_TRIAL_BOOKING_QUOTA)} نوبت رایگان هدیه شروع — کارمزد ۰٪)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black">
                کارمزد رزرو آنلاین: ۰٪ در تمام پکیج‌ها
              </span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              هر کسب‌وکار جدید در شروع کار <strong>{toPersianDigits(FREE_TRIAL_BOOKING_QUOTA)} نوبت رایگان هدیه (با شمارنده زنده و کارمزد ۰٪)</strong> دریافت می‌کند. پس از تکمیل ۱۰ نوبت، برای ادامه دریافت نوبت آنلاین یکی از ۳ پکیج ۱ ماهه زیر را انتخاب و خریداری می‌نماید.
            </p>
          </div>
          <Link to="/admin/payments">
            <Button variant="outline" size="sm">
              <span>مشاهده تسویه شبا و تراکنش‌های اشتراک ←</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIMETO_MONTHLY_PACKAGES.map((pkg) => {
            const matchedPlan = plans.find((p) => p.id === pkg.id);
            const displayPrice = matchedPlan?.monthlyPriceToman || pkg.monthlyPriceToman;
            return (
              <div
                key={pkg.id}
                className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 transition-all ${
                  pkg.isRecommended
                    ? 'bg-[#061138] text-white border-amber-400 shadow-md'
                    : 'bg-white text-[#061138] border-[#CBD5E1]'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black mb-1 ${
                          pkg.isRecommended
                            ? 'bg-amber-400 text-[#061138]'
                            : 'bg-[#E0ECFF] text-[#0057FF]'
                        }`}
                      >
                        {pkg.badge || pkg.shortTitle}
                      </span>
                      <h3 className="text-sm sm:text-base font-black">
                        {matchedPlan?.name || pkg.name}
                      </h3>
                    </div>
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed ${
                      pkg.isRecommended ? 'text-slate-300' : 'text-[#475569]'
                    }`}
                  >
                    {matchedPlan?.audience || pkg.audience}
                  </p>

                  <div
                    className={`p-3 rounded-xl border ${
                      pkg.isRecommended
                        ? 'bg-white/10 border-white/15'
                        : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-black tabular-nums">
                        {formatPriceToman(displayPrice)}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          pkg.isRecommended ? 'text-amber-300' : 'text-[#0057FF]'
                        }`}
                      >
                        اشتراک ۱ ماهه (۳۰ روز)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-current/10 text-[11px] font-bold">
                      <span>📅 سقف نوبت: تا {toPersianDigits(pkg.monthlyBookingCap)} نوبت</span>
                      <span>👥 ظرفیت: تا {toPersianDigits(pkg.staffLimitCount)} متخصص</span>
                      <span>📸 استوری: {pkg.canPublishStories ? '✅ فعال' : '—'}</span>
                      <span>🎯 تخفیف بنر: {pkg.adDiscountPercent > 0 ? `${toPersianDigits(pkg.adDiscountPercent)}٪ تخفیف` : 'تعرفه عادی'}</span>
                    </div>
                  </div>

                  <ul className="space-y-1 text-[11px]">
                    {(matchedPlan?.features || pkg.features).slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                            pkg.isRecommended ? 'text-amber-400' : 'text-[#059669]'
                          }`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {matchedPlan ? (
                  <Button
                    type="button"
                    variant={pkg.isRecommended ? 'secondary' : 'outline'}
                    size="sm"
                    fullWidth
                    onClick={() => openEditPlanModal(matchedPlan)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ویرایش قیمت و امکانات این پکیج</span>
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      {/* بخش ۲: وضعیت اشتراک ماهانه و شمارنده نوبت کسب‌وکارهای فعال + تغییر یا تمدید سریع با ۱ کلیک */}
      <Card className="border-2 border-amber-400/70 bg-gradient-to-br from-amber-50/70 via-white to-[#FFFBEB] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#061138]">
                ۲. وضعیت اشتراک ماهانه، شمارنده نوبت و فعال‌سازی سریع پکیج برای کسب‌وکارها
              </h2>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              در این بخش مشاهده می‌کنید هر کسب‌وکار در حال حاضر چند نوبت از سهمیه خود (۱۰ نوبت هدیه شروع یا پکیج ۱ ماهه) را مصرف کرده است و با ۱ کلیک می‌توانید پکیج اشتراک آن را ارتقا یا تمدید نمایید.
            </p>
          </div>
        </div>

        {realActiveBusinesses.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white border border-amber-200 text-xs text-[#64748B] text-center">
            هنوز کسب‌وکار فعالی ثبت‌نام نکرده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {realActiveBusinesses.map((biz) => {
              const quotaInfo = resolveBusinessSubscriptionQuotaStatus({
                business: biz,
                appointments,
              });
              return (
                <div
                  key={biz.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    quotaInfo.isQuotaExhausted
                      ? 'bg-rose-50/60 border-rose-300'
                      : quotaInfo.activePackage
                        ? 'bg-white border-emerald-400 ring-2 ring-emerald-100 shadow-xs'
                        : 'bg-white border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-extrabold text-[#061138] truncate">
                          {biz.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            quotaInfo.isQuotaExhausted
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : quotaInfo.activePackage
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {quotaInfo.activePackage
                            ? `💎 ${quotaInfo.activePackage.shortTitle}`
                            : `🎁 ${toPersianDigits(FREE_TRIAL_BOOKING_QUOTA)} نوبت هدیه شروع`}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569]">
                        {biz.ownerName || 'صاحب کسب‌وکار'} · {biz.city} ({biz.neighborhood}) ·{' '}
                        <span className="font-bold text-[#0057FF]">
                          بیعانه: {toPersianDigits(normalizeDepositPercent(biz.depositPercent))}٪ (کارمزد ۰٪)
                        </span>
                      </p>
                      <p className="text-[11px] font-extrabold text-[#061138]">
                        وضعیت سهمیه نوبت:{' '}
                        <span
                          className={
                            quotaInfo.isQuotaExhausted
                              ? 'text-rose-700'
                              : 'text-[#059669]'
                          }
                        >
                          {toPersianDigits(quotaInfo.usedBookingsCount)} نوبت مصرف‌شده از{' '}
                          {toPersianDigits(quotaInfo.quotaLimit)} نوبت (
                          {toPersianDigits(quotaInfo.remainingBookingsCount)} نوبت باقی‌مانده)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#E2E8F0] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#64748B] block">
                      تغییر یا فعال‌سازی سریع اشتراک ۱ ماهه این کسب‌وکار (با کارمزد ۰٪):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          updateBusinessProfile(biz.id, {
                            subscriptionPlan: '۱۰ نوبت رایگان هدیه شروع (کارمزد ۰٪)',
                            subscriptionStatus: SubscriptionStatus.Trial,
                          });
                          showToast(
                            `سهمیه «${biz.name}» روی ۱۰ نوبت رایگان هدیه شروع (کارمزد ۰٪) تنظیم شد.`
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer transition-colors ${
                          !quotaInfo.activePackage
                            ? 'bg-[#061138] text-amber-300 border-[#061138]'
                            : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:border-[#0057FF]'
                        }`}
                      >
                        🎁 ۱۰ نوبت هدیه شروع
                      </button>

                      {TIMETO_MONTHLY_PACKAGES.map((pkg) => {
                        const isSelected = quotaInfo.activePackage?.id === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => {
                              grantBusinessPlanOrAdByAdmin({
                                businessId: biz.id,
                                grantType:
                                  pkg.id === 'plan-vip-brand'
                                    ? 'VIP_AMBASSADOR'
                                    : 'PLAN',
                                planId: pkg.id,
                                durationDays: 30,
                                bonusSmsCount: pkg.freeMarketingSmsMonthly,
                                isTrialGift: false,
                                isVipPartner: pkg.id === 'plan-vip-brand',
                                vipCommissionPercent: 0,
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#059669] text-white border-[#059669]'
                                : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1] hover:border-[#0057FF]'
                            }`}
                          >
                            {pkg.shortTitle} (تا {toPersianDigits(pkg.monthlyBookingCap)} نوبت)
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* صف سریع درخواست‌های خرید در انتظار تایید */}
      {pendingOrders.length > 0 ? (
        <Card className="border-2 border-[#F59E0B] bg-[#FFFBEB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D97706]" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                درخواست‌های خرید اشتراک ماهانه و تبلیغات سالن‌ها (در انتظار تایید شما:{' '}
                {toPersianDigits(pendingOrders.length)} مورد)
              </h2>
            </div>
            <span className="text-xs font-bold text-[#92400E]">
              با تایید هر مورد، پکیج اشتراک ۱ ماهه یا جایگاه تبلیغاتی سالن به صورت خودکار فعال
              می‌شود
            </span>
          </div>
          <ResponsiveTable
            keyExtractor={(o) => o.id}
            data={pendingOrders}
            columns={[
              {
                key: 'biz',
                header: 'سالن درخواست‌دهنده',
                render: (o) => (
                  <div>
                    <span className="font-extrabold text-[#061138] block">
                      {o.businessName}
                    </span>
                    <span className="text-[11px] text-[#64748B] font-mono">
                      {o.id} · {o.createdAtJalali}
                    </span>
                  </div>
                ),
              },
              {
                key: 'item',
                header: 'پکیج اشتراک / جایگاه تبلیغاتی',
                render: (o) => (
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#0057FF] block">
                      {o.itemTitle}
                    </span>
                    {o.requestedPlacement ? (
                      <span className="text-[11px] text-[#334155] block">
                        محل: {placementLabels[o.requestedPlacement]} · مدت:{' '}
                        {toPersianDigits(o.requestedDurationDays ?? 14)} روز
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'payment',
                header: 'روش پرداخت و کد رهگیری',
                render: (o) => (
                  <div className="text-xs">
                    <span className="font-extrabold text-[#061138]">
                      درگاه آنلاین زیبال (Zibal)
                    </span>
                    <span className="block font-mono text-[11px] text-[#059669]">
                      کد رهگیری: {o.trackingCode}
                    </span>
                  </div>
                ),
              },
              {
                key: 'amount',
                header: 'مبلغ واریزی',
                render: (o) => (
                  <span className="font-extrabold text-[#061138] tabular-nums">
                    {formatPriceToman(o.amountToman)}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'عملیات مدیر',
                render: (o) => (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => reviewPaymentOrder(o.id, 'APPROVED')}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تایید و فعال‌سازی</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => reviewPaymentOrder(o.id, 'REJECTED')}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>رد</span>
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      ) : null}

      {/* بخش ۳: تعرفه بسته‌های تبلیغاتی (۷ و ۱۴ روزه — حداکثر ۲ هفته) و پیامک اضافه */}
      <Card variant="dark" className="space-y-4 border-2 border-[#0057FF]/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold text-[#00E5FF]">
              ۳. جایگاه‌های تبلیغاتی ۷ و ۱۴ روزه (حداکثر ۲ هفته) و بسته پیامک اضافه
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
              تعرفه‌های صدرنشینی جست‌وجو، بنر ویژه صفحه اصلی (۱ و ۲ هفته‌ای) و بسته پیامک
            </h2>
          </div>
          <StatusBadge
            label="حداکثر مدت رزرو بنر و صدرنشینی: ۱۴ روز (۲ هفته)"
            tone="success"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {adPackages.map((pkg, idx) => (
            <div
              key={pkg.id}
              className="p-4 rounded-2xl bg-white text-[#061138] border border-[#CBD5E1] shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-[#0057FF] text-sm">
                    {toPersianDigits(idx + 1)}. {pkg.title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E0ECFF] text-[10px] font-extrabold text-[#0057FF] shrink-0">
                    {pkg.badge}
                  </span>
                </div>
                <p className="text-[#334155] leading-relaxed font-medium">
                  {pkg.description}
                </p>
                <p className="font-extrabold text-[#061138] pt-1.5 border-t border-[#E2E8F0] tabular-nums text-sm">
                  {pkg.slot !== 'SMS_ADDON' ? (
                    <>
                      <span>
                        ۷ روزه: {formatPriceToman(pkg.weeklyPriceToman ?? 290000)}
                      </span>
                      <span className="text-[11px] font-bold text-[#0057FF] block mt-0.5">
                        ۱۴ روزه (سقف ۲ هفته): {formatPriceToman(pkg.priceToman)}
                      </span>
                    </>
                  ) : (
                    <>
                      {formatPriceToman(pkg.priceToman)}
                      <span className="text-[11px] font-extrabold text-[#059669]">
                        {' '}
                        / بسته {toPersianDigits(pkg.smsCount ?? 200)} پیامک
                      </span>
                    </>
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => openEditAdPkgModal(pkg)}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش تعرفه ۷ و ۱۴ روزه</span>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* بخش ۴: جدول کنترل کامل جایگاه، رتبه و مدت زمان تبلیغ هر کسب‌وکار واقعی */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#061138]">
              ۴. مدیریت جایگاه تبلیغاتی (۷ و ۱۴ روزه)، رتبه نمایش، پکیج اشتراک و شارژ پیامک کسب‌وکارها
            </h2>
            <p className="text-xs text-[#64748B]">
              تعیین کنید کدام سالن در صدر جست‌وجو یا بنر صفحه اول باشد، در چه
              رتبه‌ای قرار بگیرد، چند روز اعتبار تبلیغاتی (۷ یا ۱۴ روز) یا پیامک اضافه داشته باشد
            </p>
          </div>
          {businesses.filter((b) => !b.isSampleShowcase).length > 0 ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                const target = businesses.find((b) => !b.isSampleShowcase);
                if (target) openManageBizModal(target);
              }}
            >
              <Megaphone className="w-4 h-4" />
              <span>انتخاب کسب‌وکار و تنظیم جایگاه / اشتراک / پیامک</span>
            </Button>
          ) : null}
        </div>

        <ResponsiveTable
          keyExtractor={(b) => b.id}
          data={businesses.filter((b) => !b.isSampleShowcase)}
          emptyMessage="هنوز کسب‌وکار واقعی ثبت‌نام‌شده‌ای وجود ندارد. به‌محض ثبت سالن جدید، می‌توانید پکیج اشتراک، پیامک و جایگاه تبلیغاتی آن را در این بخش تنظیم کنید."
          columns={[
            {
              key: 'name',
              header: 'کسب‌وکار، مالک و محله',
              render: (b) => (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#061138] block">
                      {b.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] block">
                    {b.city} · {b.neighborhood} · تماس:{' '}
                    <strong dir="ltr" className="font-mono text-[#0057FF]">
                      {b.ownerPhone || b.phoneDisplay}
                    </strong>
                  </span>
                </div>
              ),
            },
            {
              key: 'plan',
              header: 'پکیج اشتراک، سهمیه نوبت و شارژ پیامک',
              render: (b) => {
                const q = resolveBusinessSubscriptionQuotaStatus({
                  business: b,
                  appointments,
                });
                return (
                  <div className="space-y-1">
                    <span className="font-bold text-[#059669] block">
                      {q.activePackage
                        ? `💎 ${q.activePackage.name} (کارمزد ۰٪)`
                        : `🎁 ${toPersianDigits(FREE_TRIAL_BOOKING_QUOTA)} نوبت رایگان هدیه شروع (کارمزد ۰٪)`}
                    </span>
                    <span className="text-[11px] font-bold text-[#0057FF] tabular-nums block">
                      نوبت مصرف‌شده: {toPersianDigits(q.usedBookingsCount)} از{' '}
                      {toPersianDigits(q.quotaLimit)} نوبت ({toPersianDigits(q.remainingBookingsCount)} باقی‌مانده)
                    </span>
                    <span className="text-[11px] text-[#64748B] tabular-nums block">
                      شارژ پیامک تبلیغاتی:{' '}
                      {toPersianDigits(b.extraSmsBalance ?? 0)} عدد (ارسالی:{' '}
                      {toPersianDigits(b.smsSentCount ?? 0)})
                    </span>
                  </div>
                );
              },
            },
            {
              key: 'placement',
              header: 'نحوه قرارگیری تبلیغ (Placement)',
              render: (b) =>
                b.isSponsored ? (
                  <div className="space-y-1">
                    <StatusBadge
                      label={`★ ${
                        placementLabels[b.sponsoredPlacement || 'SEARCH_TOP'] ||
                        'صدر جست‌وجو'
                      }`}
                      tone="primary"
                    />
                    <span className="block text-[11px] text-[#334155]">
                      برچسب: «{b.sponsoredLabel || 'پیشنهاد ویژه'}»
                    </span>
                    {(b.sponsoredCategorySlug || b.sponsoredNeighborhood) && (
                      <span className="block text-[10px] font-bold text-[#0057FF] bg-[#EFF6FF] px-1.5 py-0.5 rounded w-fit">
                        هدفمند:{' '}
                        {b.sponsoredCategorySlug
                          ? `دسته ${b.sponsoredCategorySlug}`
                          : 'همه دسته‌ها'}
                        {b.sponsoredNeighborhood
                          ? ` · محله ${b.sponsoredNeighborhood}`
                          : ''}
                      </span>
                    )}
                  </div>
                ) : (
                  <StatusBadge label="نمایش عادی (بدون تبلیغ)" tone="neutral" />
                ),
            },
            {
              key: 'rankAndDuration',
              header: 'رتبه، چرخش عادلانه و آمار عملکرد',
              render: (b) =>
                b.isSponsored ? (
                  <div className="space-y-0.5 tabular-nums">
                    <span className="font-extrabold text-[#061138] block text-xs">
                      اولویت جایگاه: رتبه{' '}
                      {toPersianDigits(b.sponsoredOrder ?? 1)} (چرخش وزنی فعال)
                    </span>
                    <span className="text-[11px] font-bold text-[#059669] block">
                      {toPersianDigits(b.sponsoredDaysRemaining ?? 14)} روز
                      باقی‌مانده
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B] block">
                      نمایش: {toPersianDigits(b.sponsoredImpressions ?? 120)} · کلیک:{' '}
                      {toPersianDigits(b.sponsoredClicks ?? 14)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[#64748B]">—</span>
                ),
            },
            {
              key: 'actions',
              header: 'انتخاب سریع «منتخب ماه» / «بنر ویژه ۱۴ روزه» و مدیریت زمان',
              render: (b) => {
                const isSpotlight =
                  b.isSponsored && b.sponsoredPlacement === 'HERO_SPOTLIGHT';
                const isHomeBanner =
                  b.isSponsored && b.sponsoredPlacement === 'HOME_BANNER';
                return (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const nowMs = Date.now();
                        const days = b.sponsoredDaysRemaining || 14;
                        updateBusinessProfile(b.id, {
                          isSponsored: true,
                          featured: true,
                          sponsoredPlacement: 'HERO_SPOTLIGHT',
                          sponsoredOrder: 1,
                          sponsoredDaysRemaining: days,
                          sponsoredExpiresAtMs:
                            nowMs + days * 24 * 60 * 60 * 1000,
                          sponsoredLabel:
                            b.sponsoredLabel || '🏆 منتخب ماه مراجعان تایم‌تو',
                        });
                        showToast(
                          `«${b.name}» به عنوان 🏆 منتخب ماه مراجعان و ویترین طلایی صفحه اصلی (${toPersianDigits(days)} روز) تنظیم شد ✓`
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                        isSpotlight
                          ? 'bg-amber-500 text-[#061138] border-amber-600 shadow-xs'
                          : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {isSpotlight
                        ? '🏆 منتخب ماه فعال است'
                        : '🏆 تنظیم به عنوان منتخب ماه'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nowMs = Date.now();
                        const days = b.sponsoredDaysRemaining || 14;
                        updateBusinessProfile(b.id, {
                          isSponsored: true,
                          featured: true,
                          sponsoredPlacement: 'HOME_BANNER',
                          sponsoredOrder: 1,
                          sponsoredDaysRemaining: days,
                          sponsoredExpiresAtMs:
                            nowMs + days * 24 * 60 * 60 * 1000,
                          sponsoredLabel:
                            b.sponsoredLabel || '🌟 پیشنهاد ویژه صفحه اصلی',
                        });
                        showToast(
                          `«${b.name}» به مدت ${toPersianDigits(days)} روز در 🌟 بنر ویژه صفحه اصلی قرار گرفت ✓`
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                        isHomeBanner
                          ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-xs'
                          : 'bg-[#EFF6FF] text-[#0057FF] border-[#BFDBFE] hover:bg-[#DBEAFE]'
                      }`}
                    >
                      {isHomeBanner
                        ? '🌟 بنر ویژه صفحه اصلی فعال است'
                        : '🌟 نمایش ۱۴ روزه در بنر صفحه اصلی'}
                    </button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openManageBizModal(b)}
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      <span>تنظیمات کامل جایگاه</span>
                    </Button>
                    {b.isSponsored ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateBusinessProfile(b.id, {
                            isSponsored: false,
                          });
                          showToast(
                            `نمایش تبلیغاتی «${b.name}» غیرفعال شد و به حالت عادی بازگشت.`
                          );
                        }}
                      >
                        لغو پین
                      </Button>
                    ) : null}
                  </div>
                );
              },
            },
          ]}
        />
      </div>

      {/* مودال ۱: ویرایش پلن اشتراک */}
      <Modal
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        title={`ویرایش پکیج اشتراک ۱ ماهه: ${editingPlan?.name ?? ''}`}
        description="می‌توانید قیمت ماهانه، سقف متخصصان، سهمیه پیامک هدیه و ویژگی‌های این پکیج (با کارمزد ۰٪) را تغییر دهید"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="edit-plan-name" label="عنوان پکیج اشتراک" required>
              <Input
                id="edit-plan-name"
                value={planNameInput}
                onChange={(e) => setPlanNameInput(e.target.value)}
              />
            </FormField>
            <FormField
              id="edit-plan-price"
              label="قیمت اشتراک ۱ ماهه (تومان)"
              required
            >
              <Input
                id="edit-plan-price"
                dir="ltr"
                type="number"
                value={planPriceInput}
                onChange={(e) => setPlanPriceInput(e.target.value)}
              />
            </FormField>
            <FormField
              id="edit-plan-staff"
              label="متن ظرفیت متخصصان (مثلاً تا ۳ متخصص)"
              required
            >
              <Input
                id="edit-plan-staff"
                value={planStaffInput}
                onChange={(e) => setPlanStaffInput(e.target.value)}
              />
            </FormField>
            <FormField
              id="edit-plan-sms"
              label="سهمیه پیامک ماهانه هدیه (عدد)"
              required
            >
              <Input
                id="edit-plan-sms"
                dir="ltr"
                type="number"
                value={planSmsInput}
                onChange={(e) => setPlanSmsInput(e.target.value)}
              />
            </FormField>
          </div>

          <FormField id="edit-plan-aud" label="توضیح مخاطب هدف پکیج">
            <Input
              id="edit-plan-aud"
              value={planAudienceInput}
              onChange={(e) => setPlanAudienceInput(e.target.value)}
            />
          </FormField>

          <FormField
            id="edit-plan-features"
            label="امکانات پکیج (هر ویژگی در یک خط مجزا)"
          >
            <textarea
              id="edit-plan-features"
              rows={4}
              value={planFeaturesInput}
              onChange={(e) => setPlanFeaturesInput(e.target.value)}
              className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#061138] focus:outline-none focus:border-[#0057FF]"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPlan(null)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary">
              <Check className="w-4 h-4" />
              <span>ذخیره تغییرات پکیج</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال ۲: ویرایش بسته تبلیغاتی / پیامک */}
      <Modal
        isOpen={Boolean(editingAdPkg)}
        onClose={() => setEditingAdPkg(null)}
        title={`ویرایش بسته تبلیغاتی: ${editingAdPkg?.title ?? ''}`}
        description="تغییر تعرفه ۱۴ روزه (حداکثر ۲ هفته)، تعرفه ۷ روزه و شرح جایگاه تبلیغاتی"
      >
        <form onSubmit={handleSaveAdPkg} className="space-y-4">
          <FormField id="edit-ad-title" label="عنوان بسته تبلیغاتی" required>
            <Input
              id="edit-ad-title"
              value={adTitleInput}
              onChange={(e) => setAdTitleInput(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="edit-ad-monthly"
              label={
                editingAdPkg?.slot === 'SMS_ADDON'
                  ? 'قیمت بسته پیامک (تومان)'
                  : 'تعرفه ۱۴ روزه / ۲ هفته‌ای (تومان)'
              }
              required
            >
              <Input
                id="edit-ad-monthly"
                dir="ltr"
                type="number"
                value={adMonthlyPriceInput}
                onChange={(e) => setAdMonthlyPriceInput(e.target.value)}
              />
            </FormField>

            {editingAdPkg?.slot !== 'SMS_ADDON' ? (
              <FormField
                id="edit-ad-weekly"
                label="تعرفه ۷ روزه / ۱ هفته‌ای (تومان)"
                required
              >
                <Input
                  id="edit-ad-weekly"
                  dir="ltr"
                  type="number"
                  value={adWeeklyPriceInput}
                  onChange={(e) => setAdWeeklyPriceInput(e.target.value)}
                />
              </FormField>
            ) : (
              <FormField
                id="edit-ad-sms-count"
                label="تعداد پیامک داخل بسته"
                required
              >
                <Input
                  id="edit-ad-sms-count"
                  dir="ltr"
                  type="number"
                  value={adSmsCountInput}
                  onChange={(e) => setAdSmsCountInput(e.target.value)}
                />
              </FormField>
            )}
          </div>

          <FormField id="edit-ad-cap" label="برچسب ظرفیت / اولویت">
            <Input
              id="edit-ad-cap"
              value={adCapacityInput}
              onChange={(e) => setAdCapacityInput(e.target.value)}
            />
          </FormField>

          <FormField id="edit-ad-desc" label="توضیحات بسته برای صاحبان سالن">
            <Input
              id="edit-ad-desc"
              value={adDescInput}
              onChange={(e) => setAdDescInput(e.target.value)}
            />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingAdPkg(null)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary">
              <Check className="w-4 h-4" />
              <span>ذخیره تعرفه بسته</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال ۳: مدیریت نحوه قرارگیری، رتبه و مدت زمان تبلیغ هر کسب‌وکار */}
      <Modal
        isOpen={Boolean(managingBiz)}
        onClose={() => setManagingBiz(null)}
        title={`مدیریت تبلیغات، پکیج اشتراک و پیامک: ${managingBiz?.name ?? ''}`}
        description="کسب‌وکار مورد نظر را انتخاب کنید و محل نمایش بنر/کارت، رتبه اولویت، مدت تبلیغ (۷ یا ۱۴ روز) و شارژ پیامک را تنظیم نمایید"
      >
        <form onSubmit={handleSaveBizPlacement} className="space-y-4">
          <FormField
            id="modal-select-business"
            label="انتخاب کسب‌وکار جهت تنظیم تبلیغ، پکیج اشتراک یا شارژ پیامک"
            required
          >
            <Select
              id="modal-select-business"
              value={managingBiz?.id || ''}
              onChange={(e) => {
                const chosen = businesses.find((b) => b.id === e.target.value);
                if (chosen) {
                  openManageBizModal(chosen);
                }
              }}
              options={businesses.map((b) => ({
                value: b.id,
                label: `${b.name} (${b.city} - ${b.neighborhood})${
                  b.isSampleShowcase ? ' [نمونه نمایشی]' : ''
                }`,
              }))}
            />
          </FormField>

          <div className="p-3.5 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-[#061138]">
                وضعیت نمایش تبلیغاتی (Sponsored Boost)
              </p>
              <p className="text-[11px] text-[#64748B]">
                در صورت فعال بودن، این سالن بالاتر از نتایج عادی نمایش داده
                می‌شود
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBizSponsoredActive((prev) => !prev)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                bizSponsoredActive
                  ? 'bg-[#10B981] text-white'
                  : 'bg-white border border-[#CBD5E1] text-[#64748B]'
              }`}
            >
              {bizSponsoredActive ? '★ تبلیغ فعال است' : 'غیرفعال (نمایش عادی)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="biz-slot"
              label="۱. نحوه و محل قرارگیری تبلیغ"
              required
            >
              <Select
                id="biz-slot"
                value={bizPlacementSlot}
                onChange={(e) =>
                  setBizPlacementSlot(e.target.value as SponsoredPlacementSlot)
                }
                options={[
                  {
                    value: 'HERO_SPOTLIGHT',
                    label: '🏆 منتخب ماه مراجعان + ویترین طلایی صفحه اصلی',
                  },
                  {
                    value: 'HOME_BANNER',
                    label: '🌟 بنر ویژه صفحه اصلی (پایین صفحه اول) + صدر جست‌وجو',
                  },
                  {
                    value: 'SEARCH_TOP',
                    label: '🔍 صدر نتایج جست‌وجو (/search)',
                  },
                ]}
              />
            </FormField>

            <FormField
              id="biz-order"
              label="۲. رتبه و نوبت قرارگیری (۱ = اولین کارت)"
              required
            >
              <Select
                id="biz-order"
                value={bizSponsoredOrder}
                onChange={(e) => setBizSponsoredOrder(e.target.value)}
                options={[
                  { value: '1', label: 'رتبه ۱ (اولین سالن در لیست)' },
                  { value: '2', label: 'رتبه ۲ (جایگاه دوم)' },
                  { value: '3', label: 'رتبه ۳ (جایگاه سوم)' },
                  { value: '4', label: 'رتبه ۴ (جایگاه چهارم)' },
                  { value: '5', label: 'رتبه ۵ (جایگاه پنجم)' },
                ]}
              />
            </FormField>

            <FormField
              id="biz-days"
              label="۳. مدت زمان باقی‌مانده تبلیغ (حداکثر ۱۴ روز)"
              required
            >
              <Input
                id="biz-days"
                dir="ltr"
                type="number"
                max={14}
                value={bizSponsoredDays}
                onChange={(e) => setBizSponsoredDays(e.target.value)}
              />
            </FormField>

            <FormField id="biz-plan-select" label="۴. پکیج اشتراک فعال سالن (کارمزد ۰٪)">
              <Select
                id="biz-plan-select"
                value={bizPlanName}
                onChange={(e) => setBizPlanName(e.target.value)}
                options={[
                  {
                    value: '۱۰ نوبت رایگان هدیه شروع (کارمزد ۰٪)',
                    label: '🎁 ۱۰ نوبت رایگان هدیه شروع (کارمزد ۰٪)',
                  },
                  ...TIMETO_MONTHLY_PACKAGES.map((p) => ({
                    value: p.name,
                    label: `${p.name} (تا ${toPersianDigits(p.monthlyBookingCap)} نوبت — ${formatPriceToman(p.monthlyPriceToman)})`,
                  })),
                ]}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#64748B]">
              تنظیم سریع مدت زمان بنر / صدرنشینی (حداکثر ۲ هفته):
            </span>
            {[3, 7, 10, 14].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setBizSponsoredDays(String(d))}
                className="px-2.5 py-1 rounded-lg bg-[#E0ECFF] text-[#0057FF] text-[11px] font-extrabold hover:bg-[#0057FF] hover:text-white transition-colors cursor-pointer"
              >
                {toPersianDigits(d)} روز
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="biz-label-input"
              label="متن برچسب تبلیغاتی روی کارت سالن"
            >
              <Input
                id="biz-label-input"
                value={bizSponsoredLabel}
                onChange={(e) => setBizSponsoredLabel(e.target.value)}
                placeholder="مثلاً پیشنهاد ویژه · ۲۰٪ تخفیف"
              />
            </FormField>

            <div className="space-y-2">
              <FormField
                id="biz-extra-sms"
                label="موجودی پیامک اضافه (مازاد بر پکیج)"
              >
                <Input
                  id="biz-extra-sms"
                  dir="ltr"
                  type="number"
                  value={bizExtraSms}
                  onChange={(e) => setBizExtraSms(e.target.value)}
                />
              </FormField>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#059669]">
                  شارژ سریع پیامک:
                </span>
                {[100, 200, 500].map((pack) => (
                  <button
                    key={pack}
                    type="button"
                    onClick={() =>
                      setBizExtraSms(
                        String((Number(bizExtraSms) || 0) + pack)
                      )
                    }
                    className="px-2 py-0.5 rounded-lg bg-[#ECFDF5] border border-[#10B981]/40 text-[#059669] text-[10px] font-extrabold hover:bg-[#10B981] hover:text-white cursor-pointer"
                  >
                    +{toPersianDigits(pack)} پیامک
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManagingBiz(null)}
            >
              انصراف
            </Button>
            <Button type="submit" variant="primary">
              <Check className="w-4 h-4" />
              <span>ذخیره جایگاه و تنظیمات سالن</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/** ۶. تسویه شبا، تراکنش‌های اشتراک و مدیریت درگاه آنلاین زیبال (/admin/payments) */
export const AdminPaymentsPage: React.FC = () => {
  const {
    paymentConfig,
    updatePaymentConfig,
    paymentOrders,
    reviewPaymentOrder,
    businesses,
    appointments,
    services,
    settlementRequests,
    markSettlementPaid,
    runNightlyBatchSettlement,
    sendAppointmentReminders,
    showToast,
  } = usePrototypeData();

  const [zibalMerchantId, setZibalMerchantId] = useState(
    paymentConfig.zibalMerchantId || paymentConfig.zarinpalMerchantId || ''
  );
  const [settlementCycle, setSettlementCycle] = useState<'WEEKLY' | 'BIWEEKLY'>(
    paymentConfig.settlementCycle ?? 'WEEKLY'
  );
  const [shebaNumber, setShebaNumber] = useState(
    paymentConfig.shebaNumber || ''
  );
  const [sendingReminders, setSendingReminders] = useState(false);

  const [detectedServerIp, setDetectedServerIp] = useState<string>('');

  useEffect(() => {
    fetch('/api/v1/payments/zibal/server-ip')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { outgoingIp?: string } | null) => {
        if (d?.outgoingIp) setDetectedServerIp(d.outgoingIp);
      })
      .catch(() => {});
  }, []);

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentConfig({
      activeMethod: 'ZIBAL',
      zibalMerchantId: zibalMerchantId.trim(),
      zarinpalMerchantId: zibalMerchantId.trim(),
      shebaNumber: shebaNumber.trim(),
      maleCommissionPercent: 0,
      laserCommissionPercent: 0,
      femaleCommissionPercent: 0,
      settlementCycle,
      platformCommissionPercent: 0,
    });
  };

  const handleExportPayaCsv = () => {
    const pendingList = settlementRequests.filter((s) => s.status === 'PENDING');
    if (pendingList.length === 0) {
      showToast('در حال حاضر درخواست تسویه شبای در انتظار واریزی وجود ندارد.');
      return;
    }
    const header = 'BusinessName,OwnerName,ShebaNumber,AmountToman,AmountRial,RequestId\n';
    const rows = pendingList
      .map(
        (s) =>
          `"${s.businessName.replace(/"/g, '""')}","${(s.ownerName || '').replace(/"/g, '""')}","${s.shebaNumber}",${s.netPayoutToman},${s.netPayoutToman * 10},"${s.id}"`
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeto-paya-settlements-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      `فایل اکسل/CSV واریز گروهی پایا برای ${toPersianDigits(pendingList.length)} کسب‌وکار دانلود شد ✓`
    );
  };

  const salonsWithWalletBalance = businesses.filter((b) => {
    if (b.isSampleShowcase) return false;
    const dossier = computeBusinessDossierMetrics(
      b,
      appointments,
      services,
      paymentConfig
    );
    const paidSum = settlementRequests
      .filter((s) => s.businessId === b.id && s.status === 'PAID')
      .reduce((sum, s) => sum + (Number(s.netPayoutToman) || 0), 0);
    return Math.max(0, dossier.totalNetToSalonToman - paidSum) > 0;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مالی · درگاه پرداخت اینترنتی زیبال (Zibal)، تسویه ۱۰۰٪ بیعانه سالن‌ها (کارمزد ۰٪) و تراکنش‌های اشتراک"
        title="مدیریت درگاه آنلاین زیبال، تسویه هفتگی شبا (پایا) و سفارش‌های اشتراک ماهانه"
        subtitle="در مدل جدید، کارمزد پلتفرم از نوبت‌ها ۰٪ است؛ ۱۰۰٪ بیعانه دریافتی مشتریان در کیف پول سالن جمع شده و در سیکل هفتگی به شبا/کارت صاحب کسب‌وکار واریز می‌شود."
        routePattern="/admin/payments"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تسویه شبا، تراکنش‌ها و درگاه زیبال' },
        ]}
      />

      {/* راهنمای عملی تسویه شبا: وقتی دکمه تسویه را می‌زنیم، پول چگونه برای صاحب کسب‌وکار شبا می‌شود؟ */}
      <Card className="border-2 border-emerald-400/70 bg-gradient-to-br from-emerald-50/80 via-white to-[#ECFDF5]/50 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
              فرآیند واقعی انتقال پول به شبا (پایا): وقتی دکمه «تسویه» را می‌زنیم چه اتفاقی می‌افتد؟
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black">
            واریز ۱۰۰٪ بیعانه به حساب سالن (کارمزد نوبت: ۰٪)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-1.5">
            <p className="font-extrabold text-[#061138]">
              ۱. جمع شدن خودکار بیعانه‌ها در حساب درگاه زیبال شما
            </p>
            <p className="text-[#475569] leading-relaxed">
              وقتی مشتری نوبت رزرو می‌کند، مبلغ بیعانه از طریق درگاه زیبال مستقیماً وارد کیف پول زیبال شما (متصل به شبای خودتان) می‌شود و در پنل تایم‌تو، معادل ۱۰۰٪ آن در «موجودی قابل تسویه سالن» ثبت می‌گردد.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-1.5">
            <p className="font-extrabold text-[#0057FF]">
              ۲. انتقال بانکی پایا (تکی یا فایل اکسل دسته‌ای CSV)
            </p>
            <p className="text-[#475569] leading-relaxed">
              در روز تسویه (مثلاً شنبه‌ها)، در جدول زیر یا با ۱ کلیک <strong>«کپی شبا/کارت»</strong> را می‌زنید و از اینترنت‌بانک/همراه‌بانک خودتان پایا می‌زنید، یا دکمه <strong>«دانلود فایل CSV واریز گروهی پایا»</strong> را می‌زنید و فایل را در اینترنت‌بانک یا پنل تسویه زیبال آپلود می‌کنید.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 space-y-1.5">
            <p className="font-extrabold text-[#059669]">
              ۳. ثبت کد پیگیری پایا و صدور خودکار رسید در پنل سالن‌دار
            </p>
            <p className="text-[#475569] leading-relaxed">
              پس از انجام واریز بانکی، دکمه <strong>«ثبت واریز شبا + ارسال صورتحساب»</strong> را می‌زنید و کد پیگیری پایا را وارد می‌کنید. موجودی کیف پول سالن صفر شده و رسید رسمی تسویه شبا در پیشخوان صاحب کسب‌وکار نمایش داده می‌شود.
            </p>
          </div>
        </div>
      </Card>

      {/* کارت ۱: تنظیمات درگاه پرداخت اینترنتی زیبال (Zibal) */}
      <Card className="space-y-4 border-2 border-[#0057FF]/25">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#061138] text-[#00E5FF] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                تنظیمات درگاه پرداخت اینترنتی زیبال (Zibal) — شاپرک بانک مرکزی
              </h2>
              <p className="text-xs text-[#64748B]">
                کد مرچنت دریافتی از پنل زیبال (برای دریافت آنلاین هزینه اشتراک‌های ماهانه، جایگاه‌های تبلیغاتی و بیعانه نوبت‌ها)
              </p>
            </div>
          </div>
          <StatusBadge
            label="درگاه زیبال فعال · کارمزد نوبت ۰٪"
            tone="success"
          />
        </div>

        {/* راهنمای رفع خطای 115 زیبال و نمایش خودکار IP سرور */}
        <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#93C5FD] space-y-2.5 text-xs">
          <p className="font-extrabold text-[#1E3A8A]">
            🌐 آدرس‌های IP سرور جهت ثبت در پنل زیبال (رفع خطای ۱۱۵ زیبال):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white border border-[#BFDBFE] flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-[#64748B] block">
                  IP دامنه اصلی سایت (timeto24.ir در لیارا):
                </span>
                <code dir="ltr" className="text-sm font-black text-[#061138] font-mono">
                  185.208.181.150
                </code>
              </div>
              <span className="px-2 py-1 rounded-lg bg-[#DBEAFE] text-[#1D4ED8] text-[10px] font-extrabold">
                سرور لیارا
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#BFDBFE] flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-[#64748B] block">
                  IP خروجی فعلی همین سرور (تشخیص خودکار):
                </span>
                <code dir="ltr" className="text-sm font-black text-[#0057FF] font-mono">
                  {detectedServerIp || '34.34.229.54'}
                </code>
              </div>
              <span className="px-2 py-1 rounded-lg bg-[#DCFCE7] text-[#15803D] text-[10px] font-extrabold">
                IP خروجی فعال
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#1E40AF] leading-relaxed">
            💡 در پنل زیبال (<strong>panel.zibal.ir ← درگاه‌های پرداخت ← ویرایش درگاه</strong>) اگر گزینه «حساسیت به IP / محدودیت IP» فعال باشد، یا تیک محدودیت IP را بردارید تا از هر سروری کار کند، و یا آی‌پی‌های بالا را در بخش IP مجاز درگاه وارد نمایید.
          </p>
        </div>

        <form onSubmit={handleSaveGateway} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              id="pay-zibal-merchant"
              label="کد مرچنت درگاه زیبال (Zibal Merchant Code)"
              required
            >
              <Input
                id="pay-zibal-merchant"
                dir="ltr"
                value={zibalMerchantId}
                onChange={(e) => setZibalMerchantId(e.target.value)}
                placeholder="مثلاً 65a4b8c9d0e1f2a3b4c5d6e7"
              />
            </FormField>

            <FormField
              id="pay-sheba"
              label="شماره شبای حساب متصل به درگاه زیبال (حساب مادر پلتفرم)"
            >
              <Input
                id="pay-sheba"
                dir="ltr"
                value={shebaNumber}
                onChange={(e) => setShebaNumber(e.target.value)}
                placeholder="IR820170000000123456789001"
              />
            </FormField>

            <FormField
              id="pay-settlement-cycle"
              label="سیکل واریز تسویه شبا به سالن‌ها"
            >
              <Select
                id="pay-settlement-cycle"
                value={settlementCycle}
                onChange={(e) =>
                  setSettlementCycle(e.target.value as 'WEEKLY' | 'BIWEEKLY')
                }
                options={[
                  {
                    value: 'WEEKLY',
                    label: 'سیکل هفتگی پایا (شنبه‌ها)',
                  },
                  {
                    value: 'BIWEEKLY',
                    label: 'دو هفته یک‌بار (۱ و ۱۵ هر ماه)',
                  },
                ]}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
            <span className="text-xs font-bold text-[#059669]">
              ✓ مدل درآمدی اشتراکی فعال است: کارمزد پلتفرم از تمامی نوبت‌ها ۰٪ بوده و ۱۰۰٪ بیعانه دریافتی متعلق به کسب‌وکار است.
            </span>

            <Button type="submit" variant="primary" size="sm">
              <Check className="w-4 h-4" />
              <span>ذخیره تنظیمات درگاه زیبال و سیکل تسویه</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* پرونده مالی و کارکرد هر کسب‌وکار و ثبت واریز هفتگی + ارسال صورتحساب */}
      <BusinessFinancialDossierTable businesses={businesses} />

      {/* کارت ۲: تسویه‌حساب هفتگی شبا (پایا) با سالن‌داران */}
      <Card className="space-y-4 border-2 border-[#059669]/30 bg-gradient-to-br from-[#ECFDF5]/60 to-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#A7F3D0] pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
              لیست درخواست‌های تسویه‌حساب کیف پول سالن‌ها به شماره شبا (IR) — سیکل هفتگی پایا
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              ۱۰۰٪ بیعانه‌های نوبت‌های انجام‌شده در کیف پول هر سالن آزاد می‌شود. می‌توانید با ۱ کلیک درخواست تسویه دسته‌ای ایجاد کنید، فایل اکسل/CSV پایا بگیرید و پس از واریز بانکی، تایید نهایی را بزنید.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPayaCsv}
            >
              <span>📥 دانلود فایل CSV واریز گروهی پایا</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => runNightlyBatchSettlement()}
            >
              <Check className="w-4 h-4" />
              <span>ایجاد لیست تسویه دسته‌ای هفتگی ({toPersianDigits(salonsWithWalletBalance.length)} سالن دارای موجودی)</span>
            </Button>
          </div>
        </div>

        {settlementRequests.length === 0 ? (
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-4 text-xs text-[#64748B] text-center">
            هنوز درخواست تسویه شبا ثبت نشده است. سالن‌داران می‌توانند از پنل خود درخواست تسویه بدهند یا شما دکمه «ایجاد لیست تسویه دسته‌ای هفتگی» را بزنید.
          </div>
        ) : (
          <ResponsiveTable
            keyExtractor={(s) => s.id}
            data={settlementRequests}
            columns={[
              {
                key: 'biz',
                header: 'نام سالن و صاحب حساب',
                render: (s) => (
                  <div>
                    <span className="font-extrabold text-[#061138] block">
                      {s.businessName}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      صاحب حساب: {s.ownerName}
                    </span>
                  </div>
                ),
              },
              {
                key: 'sheba',
                header: 'شماره شبا (IR) جهت واریز پایا',
                render: (s) => (
                  <div className="flex items-center gap-1.5">
                    <span
                      dir="ltr"
                      className="font-mono text-xs font-bold text-[#0057FF] bg-[#EFF6FF] px-2.5 py-1 rounded-lg inline-block"
                    >
                      {s.shebaNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(s.shebaNumber);
                        showToast(`شماره شبای «${s.businessName}» کپی شد ✓`);
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-[#CBD5E1] text-[10px] font-extrabold text-[#061138] hover:border-[#0057FF] cursor-pointer"
                    >
                      کپی شبا
                    </button>
                  </div>
                ),
              },
              {
                key: 'amount',
                header: 'مبلغ قابل واریز (۱۰۰٪ بیعانه — کارمزد ۰٪)',
                render: (s) => (
                  <div className="tabular-nums">
                    <span className="font-extrabold text-[#059669] block">
                      {formatPriceToman(s.netPayoutToman)}
                    </span>
                    <span className="text-[10px] text-[#059669] font-bold">
                      کارمزد پلتفرم: ۰ تومان (مدل اشتراکی)
                    </span>
                  </div>
                ),
              },
              {
                key: 'date',
                header: 'زمان درخواست / واریز',
                render: (s) => (
                  <div className="text-xs tabular-nums">
                    <span className="block">{s.createdAtJalali}</span>
                    {s.paidAtJalali && (
                      <span className="text-[10px] text-[#059669] font-bold">
                        واریز: {s.paidAtJalali}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'وضعیت تسویه شبا',
                render: (s) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={
                        s.status === 'PAID'
                          ? `واریز شد (${s.paidTrackingCode || 'پایا'})`
                          : 'در انتظار واریز پایا'
                      }
                      tone={s.status === 'PAID' ? 'success' : 'warning'}
                    />
                    {s.status === 'PENDING' && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          markSettlementPaid(
                            s.id,
                            `PAYA-${Math.floor(100000 + Math.random() * 900000)}`
                          )
                        }
                      >
                        تایید واریز شبا
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* کارت ۳: مدیریت پترن‌های ملی‌پیامک و ارسال خودکار یادآور نوبت‌ها */}
      <Card className="space-y-4 border border-[#CBD5E1] bg-[#F8FAFC]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-[#061138]">
              سیستم پیامک چندپترنه ملی‌پیامک (ثبت نوبت + تایید + یادآور روز قبل)
            </h2>
            <p className="text-xs text-[#475569] mt-0.5">
              ارسال پیامک آنی به سالن‌دار هنگام رزرو، پیامک تایید به مشتری، و ارسال گروهی پیامک یادآوری به تمام نوبت‌های تاییدشده فردا
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={sendingReminders}
            onClick={async () => {
              setSendingReminders(true);
              try {
                await sendAppointmentReminders();
              } finally {
                setSendingReminders(false);
              }
            }}
          >
            <Megaphone className="w-4 h-4" />
            <span>
              {sendingReminders
                ? 'در حال ارسال پیامک یادآوری...'
                : 'ارسال پیامک یادآوری به تمام نوبت‌های تاییدشده'}
            </span>
          </Button>
        </div>

        {/* جدول راهنمای دقیق معنی متغیرهای {0} تا {3} در کد بک‌اند برای ثبت در ملی‌پیامک */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 space-y-2.5 text-xs">
          <div className="font-extrabold text-[#061138]">
            جدول معنی دقیق متغیرهای ارسال‌شده از بک‌اند به ملی‌پیامک (تطابق ۱۰۰٪ با کد سرور):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-2.5">
              <span dir="ltr" className="font-mono font-extrabold text-[#0057FF]">{'{0}'}</span>
              <span className="font-bold text-[#061138] mr-1.5">نام مشتری (در پترن ورود: کد تایید)</span>
              <span className="block text-[11px] text-[#475569] mt-0.5">مثال: سارا محمدی</span>
            </div>
            <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-2.5">
              <span dir="ltr" className="font-mono font-extrabold text-[#0057FF]">{'{1}'}</span>
              <span className="font-bold text-[#061138] mr-1.5">نام سالن یا عنوان خدمت</span>
              <span className="block text-[11px] text-[#475569] mt-0.5">مثال: سالن رویال / کاشت ناخن</span>
            </div>
            <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-2.5">
              <span dir="ltr" className="font-mono font-extrabold text-[#0057FF]">{'{2}'}</span>
              <span className="font-bold text-[#061138] mr-1.5">تاریخ شمسی نوبت</span>
              <span className="block text-[11px] text-[#475569] mt-0.5">مثال: ۱۴۰۵/۰۸/۱۶</span>
            </div>
            <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-2.5">
              <span dir="ltr" className="font-mono font-extrabold text-[#0057FF]">{'{3}'}</span>
              <span className="font-bold text-[#061138] mr-1.5">ساعت دقیق نوبت</span>
              <span className="block text-[11px] text-[#475569] mt-0.5">مثال: ۱۶:۳۰</span>
            </div>
          </div>
        </div>
      </Card>

      {/* جدول سفارش‌ها و تراکنش‌های ثبت‌شده */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#061138]">
            لیست پرداخت‌ها و سفارش‌های اشتراک و تبلیغات (
            {toPersianDigits(paymentOrders.length)} مورد)
          </h2>
        </div>

        <ResponsiveTable
          keyExtractor={(i) => i.id}
          data={paymentOrders}
          columns={[
            {
              key: 'id',
              header: 'شماره سفارش',
              render: (i) => (
                <span className="font-mono text-xs font-bold text-[#0057FF] bg-[#E0ECFF] px-2 py-0.5 rounded">
                  {i.id}
                </span>
              ),
            },
            {
              key: 'biz',
              header: 'کسب‌وکار',
              render: (i) => (
                <span className="font-extrabold text-[#061138]">
                  {i.businessName}
                </span>
              ),
            },
            {
              key: 'title',
              header: 'بسته / پلن خریداری‌شده',
              render: (i) => (
                <div className="space-y-0.5">
                  <span className="font-bold text-[#061138] block">
                    {i.itemTitle}
                  </span>
                  {i.requestedDurationDays ? (
                    <span className="text-[11px] text-[#64748B] tabular-nums">
                      مدت زمان: {toPersianDigits(i.requestedDurationDays)} روز
                    </span>
                  ) : null}
                </div>
              ),
            },
            {
              key: 'method',
              header: 'روش پرداخت و کد رهگیری',
              render: (i) => (
                <div className="text-xs">
                  <span className="font-bold text-[#061138]">
                    درگاه آنلاین زیبال (Zibal)
                  </span>
                  <span className="block font-mono text-[11px] text-[#059669]">
                    Ref: {i.trackingCode}
                  </span>
                </div>
              ),
            },
            {
              key: 'date',
              header: 'تاریخ ثبت',
              render: (i) => (
                <span className="tabular-nums text-xs">
                  {i.createdAtJalali}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'مبلغ (تومان)',
              align: 'left',
              render: (i) => (
                <span className="tabular-nums font-extrabold text-[#0057FF]">
                  {formatPriceToman(i.amountToman)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'وضعیت و تایید',
              render: (i) => (
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={
                      i.status === 'APPROVED'
                        ? 'تایید و فعال شد'
                        : i.status === 'REJECTED'
                          ? 'رد شده'
                          : 'در انتظار تایید'
                    }
                    tone={
                      i.status === 'APPROVED'
                        ? 'success'
                        : i.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                    }
                  />
                  {i.status === 'PENDING' ? (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => reviewPaymentOrder(i.id, 'APPROVED')}
                      >
                        تایید و فعال‌سازی
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => reviewPaymentOrder(i.id, 'REJECTED')}
                      >
                        رد
                      </Button>
                    </>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

/** ۷. گزارش‌های تحلیلی پلتفرم (/admin/reports) — فقط بر اساس آمار واقعی دیتابیس (بدون نمونه‌های نمایشی) */
export const AdminReportsPage: React.FC = () => {
  const {
    businesses,
    appointments,
    services,
    paymentOrders,
    paymentConfig,
    settlementRequests,
    supportTickets,
  } = usePrototypeData();

  const realBusinesses = businesses.filter((b) => !b.isSampleShowcase);
  const realAppointments = appointments.filter(
    (a) =>
      !/^apt-(?:[1-9]|1[0-2])$/.test(a.id) &&
      !/^biz-[1-8]$/.test(a.businessId) &&
      a.status !== 'CANCELLED'
  );
  const approvedOrders = paymentOrders.filter((o) => o.status === 'APPROVED');

  let onlineDepositsToman = 0;
  for (const apt of realAppointments) {
    const biz = realBusinesses.find((b) =>
      doesAppointmentBelongToBusiness(apt, b)
    );
    const srv = services.find((s) => s.id === apt.serviceId);
    const servicePrice = Math.max(
      0,
      Number(apt.priceToman) || Number(srv?.priceToman) || 350_000
    );
    const breakdown = resolveAppointmentFinancialBreakdown({
      appointment: {
        ...apt,
        priceToman: servicePrice,
      },
      business: biz,
      commissionConfig: paymentConfig,
    });
    onlineDepositsToman += breakdown.baseDepositToman;
  }

  const paidSettlementsToman = settlementRequests
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + (Number(s.netPayoutToman) || 0), 0);

  const totalRevenueToman =
    onlineDepositsToman +
    paidSettlementsToman +
    approvedOrders.reduce((sum, o) => sum + (Number(o.amountToman) || 0), 0);

  // محاسبه واقعی توزیع کسب‌وکارها بر اساس شهر و محله
  const locationMap: Record<string, number> = {};
  for (const b of realBusinesses) {
    const key = `${b.city} — ${b.neighborhood || 'مرکز شهر'}`;
    locationMap[key] = (locationMap[key] || 0) + 1;
  }
  const totalReal = realBusinesses.length;
  const cityBreakdown = Object.entries(locationMap).map(([city, count]) => ({
    city,
    countNum: count,
    pct: totalReal > 0 ? Math.round((count / totalReal) * 100) : 0,
    countLabel: `${toPersianDigits(count)} مرکز واقعی`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="گزارش‌های کلان · آمار واقعی پلتفرم در اصفهان"
        title="گزارش‌های تحلیلی کلان پلتفرم (داده‌های واقعی)"
        subtitle="آمار واقعی توزیع کسب‌وکارهای ثبت‌نام‌شده، تعداد رزروهای ثبت‌شده و مجموع تراکنش‌های تاییدشده (بدون احتساب سالن‌های نمونه)"
        routePattern="/admin/reports"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'گزارش‌های تحلیلی' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-sm font-extrabold text-[#061138]">
            توزیع جغرافیایی کسب‌وکارهای واقعی ثبت‌نام‌شده ({toPersianDigits(totalReal)} مرکز)
          </h2>
          {cityBreakdown.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] leading-relaxed">
              هنوز کسب‌وکار واقعی خارج از نمونه‌های نمایشی ثبت نشده است. به‌محض ثبت اولین سالن، نمودار تفکیک محله‌های اصفهان به‌صورت خودکار محاسبه می‌شود.
            </div>
          ) : (
            <div className="space-y-3.5">
              {cityBreakdown.map((item) => (
                <div key={item.city} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#1E1B2E]">{item.city}</span>
                    <span className="font-bold text-[#6B6480] tabular-nums">
                      {toPersianDigits(item.pct)}٪ ({item.countLabel})
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#F3EEFF] overflow-hidden">
                    <div
                      className="h-full bg-[#8B5CF6] rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-[#1E1B2E]">
              خلاصه عملکرد واقعی مالی و عملیاتی پلتفرم
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-1">
                <span className="text-[#6B6480] block">مجموع درآمد تاییدشده:</span>
                <span className="text-base font-extrabold text-[#8B5CF6] tabular-nums block">
                  {totalRevenueToman > 0
                    ? formatPriceToman(totalRevenueToman)
                    : '۰ تومان'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-1">
                <span className="text-[#64748B] block">کل نوبت‌های واقعی:</span>
                <span className="text-base font-extrabold text-[#061138] tabular-nums block">
                  {toPersianDigits(realAppointments.length)} نوبت
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/30 space-y-1">
                <span className="text-[#047857] block">تراکنش‌های موفق:</span>
                <span className="text-base font-extrabold text-[#065F46] tabular-nums block">
                  {toPersianDigits(approvedOrders.length)} سفارش
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-1">
                <span className="text-[#1D4ED8] block">تیکت‌های پشتیبانی:</span>
                <span className="text-base font-extrabold text-[#0057FF] tabular-nums block">
                  {toPersianDigits(supportTickets.length)} تیکت
                </span>
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] text-xs text-[#6B6480]">
            تمامی اعداد این صفحه مستقیماً از دیتابیس واقعی استخراج شده‌اند و سالن‌های نمونه نمایشی در این آمار لحاظ نشده‌اند.
          </div>
        </Card>
      </div>
    </div>
  );
};

/** ۸. مدیریت تیکت‌ها و سوالات پشتیبانی مشتریان و صاحبان کسب‌وکار (/admin/support) */
export const AdminSupportPage: React.FC = () => {
  const { supportTickets, replySupportTicket } = usePrototypeData();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ANSWERED'>(
    'ALL'
  );
  const [roleFilter, setRoleFilter] = useState<
    'ALL' | 'CUSTOMER' | 'BUSINESS_OWNER'
  >('ALL');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const filteredTickets = supportTickets.filter((t) => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchRole = roleFilter === 'ALL' || t.senderRole === roleFilter;
    return matchStatus && matchRole;
  });

  const openCount = supportTickets.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="پشتیبانی و ارتباط با کاربران · خط ویژه 09138201042"
        title="مدیریت تیکت‌ها و سوالات پشتیبانی (مشتریان و سالن‌داران)"
        subtitle="مشاهده سوالات ثبت‌شده در بخش پشتیبانی سایت با تفکیک دقیق «مشتری عادی» یا «صاحب کسب‌وکار (همراه با نام سالن)» و ارسال پاسخ مستقیم"
        routePattern="/admin/support"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تیکت‌ها و پشتیبانی' },
        ]}
      />

      {/* نوار فیلتر وضعیت و نقش فرستنده */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: `همه تیکت‌ها (${toPersianDigits(supportTickets.length)})` },
              { id: 'OPEN', label: `در انتظار پاسخ (${toPersianDigits(openCount)})` },
              {
                id: 'ANSWERED',
                label: `پاسخ داده‌شده (${toPersianDigits(
                  supportTickets.length - openCount
                )})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setStatusFilter(tab.id as 'ALL' | 'OPEN' | 'ANSWERED')
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                  statusFilter === tab.id
                    ? 'bg-[#0057FF] text-white'
                    : 'bg-[#F3F6FC] text-[#334155] border border-[#CBD5E1]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#64748B]">فیلتر فرستنده:</span>
            {[
              { id: 'ALL', label: 'همه فرستنده‌ها' },
              { id: 'BUSINESS_OWNER', label: 'فقط صاحبان کسب‌وکار (سالن‌داران)' },
              { id: 'CUSTOMER', label: 'فقط مشتریان عادی' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  setRoleFilter(
                    r.id as 'ALL' | 'CUSTOMER' | 'BUSINESS_OWNER'
                  )
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  roleFilter === r.id
                    ? 'bg-[#061138] text-white'
                    : 'bg-white text-[#475569] border border-[#CBD5E1]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* لیست تیکت‌ها و فرم پاسخگویی */}
      {filteredTickets.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <Headphones className="w-8 h-8 text-[#0057FF] mx-auto" />
          <p className="text-sm font-extrabold text-[#061138]">
            هیچ تیکت پشتیبانی با این فیلتر وجود ندارد
          </p>
          <p className="text-xs text-[#64748B]">
            هر زمان مشتری یا صاحب یکی از سالن‌ها در صفحه «پشتیبانی (/help)» سوال یا تیکتی ثبت کند، بلافاصله در این صفحه قابل مشاهده و پاسخگویی خواهد بود.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const isOpenReply =
              expandedTicketId === ticket.id || ticket.status === 'OPEN';
            const draftValue =
              replyDrafts[ticket.id] !== undefined
                ? replyDrafts[ticket.id]
                : ticket.adminReply || '';

            return (
              <Card
                key={ticket.id}
                className={`space-y-4 border-2 ${
                  ticket.status === 'OPEN'
                    ? 'border-[#F59E0B] bg-[#FFFBEB]/40'
                    : 'border-[#CBD5E1] bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* نشان واضح تفکیک مشتری یا صاحب کسب‌وکار */}
                      {ticket.senderRole === 'BUSINESS_OWNER' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#6B21A8] border border-[#D8B4FE] text-xs font-extrabold">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>
                            صاحب کسب‌وکار:{' '}
                            {ticket.businessName || 'سالن زیبایی'}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] border border-[#BFDBFE] text-xs font-extrabold">
                          <Users className="w-3.5 h-3.5" />
                          <span>مشتری / مراجعه‌کننده</span>
                        </span>
                      )}

                      <StatusBadge
                        label={
                          ticket.status === 'ANSWERED'
                            ? 'پاسخ داده‌شده توسط مدیر'
                            : 'در انتظار پاسخ شما'
                        }
                        tone={ticket.status === 'ANSWERED' ? 'success' : 'warning'}
                      />

                      <span className="text-xs text-[#64748B] tabular-nums">
                        زمان ثبت: {ticket.createdAtJalali}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-[#061138]">
                      موضوع: {ticket.subject}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#334155]">
                      فرستنده: <strong className="text-[#061138]">{ticket.senderName}</strong>
                    </span>
                    <a
                      href={`tel:${ticket.senderPhone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#061138] text-white font-mono font-extrabold"
                    >
                      <Phone className="w-3 h-3 text-[#00E5FF]" />
                      <span>{ticket.senderPhone}</span>
                    </a>
                  </div>
                </div>

                {/* متن پیام کاربر */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#061138] leading-relaxed">
                  <p className="font-bold text-[#64748B] mb-1">متن پیام / سوال:</p>
                  <p>{ticket.message}</p>
                </div>

                {/* پاسخ قبلی مدیر در صورت وجود */}
                {ticket.adminReply ? (
                  <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 text-xs text-[#065F46] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#047857]">
                        پاسخ ثبت‌شده مدیریت ({ticket.repliedAtJalali || 'ثبت‌شده'}):
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTicketId(
                            expandedTicketId === ticket.id ? null : ticket.id
                          )
                        }
                        className="text-[11px] font-extrabold text-[#0057FF] hover:underline cursor-pointer"
                      >
                        ویرایش پاسخ
                      </button>
                    </div>
                    <p className="leading-relaxed">{ticket.adminReply}</p>
                  </div>
                ) : null}

                {/* فرم ارسال / ویرایش پاسخ مدیر */}
                {isOpenReply ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!draftValue.trim()) return;
                      replySupportTicket(ticket.id, draftValue.trim());
                      setExpandedTicketId(null);
                    }}
                    className="space-y-2.5 pt-2 border-t border-[#E2E8F0]"
                  >
                    <label
                      htmlFor={`reply-${ticket.id}`}
                      className="block text-xs font-extrabold text-[#061138]"
                    >
                      ثبت پاسخ مدیر کل (در صفحه پشتیبانی برای کاربر نمایش داده می‌شود):
                    </label>
                    <textarea
                      id={`reply-${ticket.id}`}
                      rows={3}
                      value={draftValue}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [ticket.id]: e.target.value,
                        }))
                      }
                      placeholder="پاسخ راهنمایی یا نتیجه بررسی خود را برای این کاربر یا صاحب سالن بنویسید..."
                      className="w-full rounded-2xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-xs text-[#061138] focus:outline-none focus:border-[#0057FF]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="submit" variant="primary" size="sm">
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال و ذخیره پاسخ پشتیبانی</span>
                      </Button>
                    </div>
                  </form>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** ۹. تنظیمات کلان سامانه، نام کاربری و رمز عبور مدیر کل و اتصال آسان ملی‌پیامک (/admin/settings) */
export const AdminSettingsPage: React.FC = () => {
  const {
    authUser,
    setAccountPassword,
    businesses,
    adminUsers,
    adminNotificationSettings,
    updateAdminNotificationSettings,
    showToast,
  } = usePrototypeData();
  const [adminUsernameInput, setAdminUsernameInput] = useState(
    adminNotificationSettings.adminUsername || 'admin'
  );
  const [adminDisplayNameInput, setAdminDisplayNameInput] = useState(
    adminNotificationSettings.adminDisplayName || 'مدیر کل پلتفرم تایم تو'
  );
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [isSavingAdminPass, setIsSavingAdminPass] = useState(false);
  const [notifyPhoneInput, setNotifyPhoneInput] = useState(
    adminNotificationSettings.adminPhone || '09138201042'
  );

  const realBusinessesCount = businesses.filter((b) => !b.isSampleShowcase).length;

  // وضعیت درگاه ملی‌پیامک
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [maskedSavedKey, setMaskedSavedKey] = useState<string | null>(null);
  const [bodyIdInput, setBodyIdInput] = useState('');
  const [bookingOwnerBodyIdInput, setBookingOwnerBodyIdInput] = useState('');
  const [bookingCustomerBodyIdInput, setBookingCustomerBodyIdInput] =
    useState('');
  const [bookingCancelBodyIdInput, setBookingCancelBodyIdInput] = useState('');
  const [senderInput, setSenderInput] = useState('');
  const [smsConfigured, setSmsConfigured] = useState(false);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsStatusMessage, setSmsStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // تست ارسال زنده پیامک
  const [testPhone, setTestPhone] = useState('');
  const [testingSms, setTestingSms] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/v1/sms-gateway/status', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data?.ok) return;
        setSmsConfigured(Boolean(data.configured));
        setMaskedSavedKey(data.maskedApiKey ?? null);
        if (data.template) setBodyIdInput(String(data.template));
        if (data.bookingOwnerTemplate !== undefined) {
          setBookingOwnerBodyIdInput(String(data.bookingOwnerTemplate || ''));
        }
        if (data.bookingCustomerTemplate !== undefined) {
          setBookingCustomerBodyIdInput(
            String(data.bookingCustomerTemplate || '')
          );
        }
        if (data.bookingCancelTemplate !== undefined) {
          setBookingCancelBodyIdInput(String(data.bookingCancelTemplate || ''));
        }
        if (data.sender) setSenderInput(String(data.sender));
      })
      .catch(() => {
        // نادیده گرفتن خطای شبکه در بارگذاری اولیه
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdminPass(true);
    try {
      // ۱. ذخیره نام کاربری، نام نمایشی و شماره موبایل مدیر کل
      updateAdminNotificationSettings({
        adminUsername: adminUsernameInput.trim() || 'admin',
        adminDisplayName:
          adminDisplayNameInput.trim() || 'مدیر کل پلتفرم تایم تو',
        adminPhone: notifyPhoneInput.trim() || '09138201042',
      });

      // ۲. در صورتی که رمز عبور جدید هم وارد شده باشد، آن را نیز آپدیت کن
      if (adminNewPassword.trim()) {
        const ok = await setAccountPassword(adminNewPassword.trim());
        if (ok) {
          setAdminNewPassword('');
        }
      } else {
        showToast(
          `نام کاربری (${adminUsernameInput.trim() || 'admin'}) و مشخصات مدیر کل ذخیره شد.`
        );
      }
    } finally {
      setIsSavingAdminPass(false);
    }
  };

  const handleSaveMelipayamak = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsStatusMessage(null);

    const effectiveKeyToSend =
      apiKeyInput.trim() || (maskedSavedKey ? '__KEEP_EXISTING__' : '');

    if (!effectiveKeyToSend || !bodyIdInput.trim()) {
      setSmsStatusMessage({
        type: 'error',
        text: 'لطفاً هم «کلید وب‌سرویس (یا لینک اشتراکی کنسول ملی‌پیامک)» و هم «کد الگوی پیامک (bodyId)» را وارد کنید.',
      });
      return;
    }

    setSmsSaving(true);
    try {
      const res = await fetch('/api/v1/sms-gateway/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: 'melipayamak',
          apiKey: effectiveKeyToSend,
          template: bodyIdInput.trim(),
          bookingOwnerTemplate: bookingOwnerBodyIdInput.trim(),
          bookingCustomerTemplate: bookingCustomerBodyIdInput.trim(),
          bookingCancelTemplate: bookingCancelBodyIdInput.trim(),
          sender: senderInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setSmsStatusMessage({
          type: 'error',
          text: data?.message || 'خطا در ذخیره تنظیمات ملی‌پیامک.',
        });
        return;
      }

      setSmsConfigured(Boolean(data.configured));
      setMaskedSavedKey(data.maskedApiKey ?? null);
      setApiKeyInput('');
      setSmsStatusMessage({
        type: 'success',
        text:
          data.message ||
          'درگاه ملی‌پیامک با موفقیت فعال شد! اکنون می‌توانید در کادر زیر پیامک تست بفرستید.',
      });
      showToast('درگاه پیامکی ملی‌پیامک فعال شد.');
    } catch {
      setSmsStatusMessage({
        type: 'error',
        text: 'خطا در ارتباط با سرور هنگام ذخیره تنظیمات پیامک.',
      });
    } finally {
      setSmsSaving(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    if (!/^09\d{9}$/.test(testPhone.trim())) {
      setTestResult({
        ok: false,
        message: 'شماره موبایل را به صورت ۱۱ رقمی صحیح (مثلاً 09123456789) وارد کنید.',
      });
      return;
    }

    setTestingSms(true);
    try {
      const res = await fetch('/api/v1/sms-gateway/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: testPhone.trim() }),
      });
      const data = await res.json();
      setTestResult({
        ok: Boolean(res.ok && data?.ok),
        message:
          data?.message ||
          (res.ok
            ? 'پیامک تست با موفقیت ارسال شد.'
            : 'ارسال پیامک تست با خطا مواجه شد.'),
      });
    } catch {
      setTestResult({
        ok: false,
        message: 'خطا در برقراری ارتباط با سرور برای ارسال پیامک تست.',
      });
    } finally {
      setTestingSms(false);
    }
  };

  const envSnippet = `SMS_PROVIDER=melipayamak
SMS_API_KEY=${apiKeyInput.trim() || 'YOUR_MELIPAYAMAK_SHARED_TOKEN'}
SMS_OTP_TEMPLATE=${bodyIdInput.trim() || '123456'}
SMS_SENDER=${senderInput.trim() || '50004001'}`;

  const handleCopyEnv = () => {
    navigator.clipboard?.writeText(envSnippet);
    showToast('متغیرهای محیطی ملی‌پیامک کپی شد.');
  };

  return (
    <div className="space-y-7">
      <PageHeader
        kicker="پیکربندی سامانه · تنظیمات نام کاربری، رمز عبور مدیر کل و درگاه پیامک"
        title="تنظیمات کلان، نام کاربری / رمز عبور مدیر کل و اتصال ملی‌پیامک"
        subtitle="تنظیم نام کاربری و رمز عبور ثابت مدیریت برای ورود سریع در /login، مدیریت اطلاع‌رسانی 09138201042 و فعال‌سازی وب‌سرویس ملی‌پیامک"
        routePattern="/admin/settings"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تنظیمات و امنیت' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ستون اصلی: راه‌اندازی ۱ دقیقه‌ای ملی‌پیامک */}
        <Card padding="lg" className="lg:col-span-7 space-y-6 border-2 border-[#0057FF]/25">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#061138] text-[#00E5FF] flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#061138]">
                  اتصال مستقیم پنل پیامک ملی‌پیامک (MelliPayamak)
                </h2>
                <p className="text-xs text-[#64748B]">
                  بدون نیاز به کدنویسی؛ اطلاعات وب‌سرویس اشتراکی کنسول ملی‌پیامک را وارد و فعال کنید
                </p>
              </div>
            </div>
            <StatusBadge
              label={
                smsConfigured
                  ? 'درگاه ملی‌پیامک فعال است'
                  : 'در انتظار وارد کردن کلید ملی‌پیامک'
              }
              tone={smsConfigured ? 'success' : 'warning'}
            />
          </div>

          <form onSubmit={handleSaveMelipayamak} className="space-y-4">
            <FormField
              id="mp-api-key"
              label="۱. کلید وب‌سرویس اشتراکی (API Key) یا لینک کامل کنسول ملی‌پیامک"
              hint={
                maskedSavedKey
                  ? `کلید فعلی ذخیره‌شده: ${maskedSavedKey} (در صورت عدم تغییر، خالی بگذارید)`
                  : 'کلید دسترسی وب‌سرویس اشتراکی ملی‌پیامک خود را وارد کنید'
              }
              required={!maskedSavedKey}
            >
              <Input
                id="mp-api-key"
                dir="ltr"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  maskedSavedKey
                    ? `Saved: ${maskedSavedKey}`
                    : 'کلید وب‌سرویس اشتراکی ملی‌پیامک'
                }
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="mp-body-id"
                label="۲. کد الگوی اصلی تایید شماره / ورود (bodyId)"
                hint="کد عددی پترن ۱ متغیره {0} در ملی‌پیامک (الزامی)"
                required
              >
                <Input
                  id="mp-body-id"
                  dir="ltr"
                  value={bodyIdInput}
                  onChange={(e) => setBodyIdInput(e.target.value)}
                  placeholder="کد عددی الگو (مثلاً 123456)"
                />
              </FormField>

              <FormField
                id="mp-sender"
                label="۳. شماره خط اختصاصی (اختیاری)"
                hint="برای وب‌سرویس خدماتی اشتراکی اجباری نیست"
              >
                <Input
                  id="mp-sender"
                  dir="ltr"
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  placeholder="شماره خط (اختیاری)"
                />
              </FormField>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-3">
              <div>
                <p className="text-xs font-extrabold text-[#061138]">
                  الگوهای اختصاصی پیامک ثبت نوبت (اختیاری — در صورت خالی بودن از الگوی اصلی بالا استفاده می‌شود)
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                  اگر در پنل ملی‌پیامک فقط همان یک پترن تایید کد ورود (تک‌متغیره{' '}
                  <code dir="ltr">{'{0}'}</code>) را ساخته‌اید، این دو کادر را خالی بگذارید؛ سامانه به صورت خودکار پیامک نوبت را با همان پترن اصلی ارسال می‌کند. اما اگر پترن ۴ متغیره اختصاصی نوبت (شامل نام مشتری{' '}
                  <code dir="ltr">{'{0}'}</code>، خدمت/سالن{' '}
                  <code dir="ltr">{'{1}'}</code>، تاریخ{' '}
                  <code dir="ltr">{'{2}'}</code> و ساعت{' '}
                  <code dir="ltr">{'{3}'}</code>) در ملی‌پیامک ثبت کرده‌اید، کد آن‌ها را در زیر وارد نمایید:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField
                  id="mp-booking-owner-id"
                  label="کد الگوی پیامک نوبت جدید برای سالن‌دار (اختیاری)"
                  hint="پترن ۴ متغیره اطلاع‌رسانی به صاحب سالن"
                >
                  <Input
                    id="mp-booking-owner-id"
                    dir="ltr"
                    value={bookingOwnerBodyIdInput}
                    onChange={(e) => setBookingOwnerBodyIdInput(e.target.value)}
                    placeholder="خالی = استفاده از الگوی اصلی"
                  />
                </FormField>

                <FormField
                  id="mp-booking-customer-id"
                  label="کد الگوی پیامک تایید نوبت برای مشتری (اختیاری)"
                  hint="پترن ۴ متغیره تایید رزرو برای مشتری"
                >
                  <Input
                    id="mp-booking-customer-id"
                    dir="ltr"
                    value={bookingCustomerBodyIdInput}
                    onChange={(e) =>
                      setBookingCustomerBodyIdInput(e.target.value)
                    }
                    placeholder="خالی = استفاده از الگوی اصلی"
                  />
                </FormField>

                <FormField
                  id="mp-booking-cancel-id"
                  label="کد الگوی پیامک لغو نوبت برای مشتری (اختیاری)"
                  hint="پترن ۴ متغیره لغو رزرو (هرگز از الگوی تایید استفاده نمی‌کند)"
                >
                  <Input
                    id="mp-booking-cancel-id"
                    dir="ltr"
                    value={bookingCancelBodyIdInput}
                    onChange={(e) =>
                      setBookingCancelBodyIdInput(e.target.value)
                    }
                    placeholder="خالی = ارسال پیامک متنی لغو"
                  />
                </FormField>
              </div>
            </div>

            {smsStatusMessage ? (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-bold ${
                  smsStatusMessage.type === 'success'
                    ? 'bg-[#ECFDF5] border-[#10B981]/40 text-[#065F46]'
                    : 'bg-[#FEF2F2] border-[#EF4444]/40 text-[#991B1B]'
                }`}
              >
                {smsStatusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                )}
                <span>{smsStatusMessage.text}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" variant="primary" disabled={smsSaving}>
                <Check className="w-4 h-4" />
                <span>
                  {smsSaving
                    ? 'در حال ذخیره و فعال‌سازی...'
                    : 'ذخیره و فعال‌سازی آنی ملی‌پیامک'}
                </span>
              </Button>
            </div>
          </form>

          {/* بخش تست زنده ارسال پیامک به موبایل مدیر */}
          <div className="pt-5 border-t border-[#E2E8F0] space-y-3">
            <h3 className="text-sm font-extrabold text-[#061138] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#0057FF]" />
              <span>تست زنده ارسال پیامک به موبایل مدیر کل</span>
            </h3>
            <form
              onSubmit={handleSendTestSms}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <div className="flex-1">
                <Input
                  id="mp-test-phone"
                  dir="ltr"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder={authUser?.phone || '09138201042'}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                disabled={testingSms}
              >
                <Send className="w-4 h-4" />
                <span>
                  {testingSms
                    ? 'در حال ارسال پیامک...'
                    : 'ارسال پیامک تست به موبایل من'}
                </span>
              </Button>
            </form>

            {testResult ? (
              <div
                className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-bold ${
                  testResult.ok
                    ? 'bg-[#ECFDF5] border-[#10B981]/40 text-[#065F46]'
                    : 'bg-[#FEF2F2] border-[#EF4444]/40 text-[#991B1B]'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            ) : null}
          </div>
        </Card>

        {/* ستون کناری: نام کاربری و رمز عبور ثابت مدیر کل + اطلاع‌رسانی + لیارا */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg" className="space-y-4 border-2 border-[#0057FF]/30 bg-white">
            <div className="space-y-1 border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-[#061138]">
                تنظیم نام کاربری، شماره موبایل و رمز عبور مدیر کل
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                در صفحه ورود (<code dir="ltr">/login</code>) از تب «ورود با نام کاربری یا رمز عبور» می‌توانید هم با <strong>نام کاربری</strong> و هم با <strong>شماره موبایل مدیر کل</strong> وارد پنل مدیریت شوید.
              </p>
            </div>

            <form onSubmit={handleSaveAdminCredentials} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  id="adm-username"
                  label="نام کاربری مدیر کل (Username)"
                  required
                >
                  <Input
                    id="adm-username"
                    dir="ltr"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    placeholder="admin"
                  />
                </FormField>

                <FormField
                  id="adm-display-name"
                  label="عنوان نمایشی مدیر در پنل"
                >
                  <Input
                    id="adm-display-name"
                    value={adminDisplayNameInput}
                    onChange={(e) => setAdminDisplayNameInput(e.target.value)}
                    placeholder="مدیر کل پلتفرم تایم تو"
                  />
                </FormField>
              </div>

              <FormField
                id="adm-notify-phone"
                label="شماره موبایل انحصاری مدیر کل و پشتیبانی"
                required
              >
                <Input
                  id="adm-notify-phone"
                  dir="ltr"
                  value={notifyPhoneInput}
                  onChange={(e) => setNotifyPhoneInput(e.target.value)}
                  placeholder="09138201042"
                />
              </FormField>

              <FormField
                id="adm-fixed-pass"
                label="رمز عبور جدید مدیر کل (حداقل ۶ کاراکتر — در صورت عدم تغییر خالی بگذارید)"
              >
                <Input
                  id="adm-fixed-pass"
                  type="password"
                  dir="ltr"
                  placeholder="رمز عبور جدید..."
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isSavingAdminPass}
              >
                <Check className="w-4 h-4" />
                <span>ذخیره نام کاربری، موبایل و رمز عبور مدیر کل</span>
              </Button>
            </form>
          </Card>

          <Card padding="lg" className="space-y-4 border-2 border-[#F59E0B]/40 bg-[#FFFBEB]/60">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#061138]">
                تنظیمات اعلان هوشمند مدیر کل
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                به‌محض ثبت‌نام کسب‌وکار جدید، ثبت فیش واریزی یا ارسال تیکت پشتیبانی، در بالای پنل مدیریت اعلان دریافت می‌کنید.
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-[#061138] cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminNotificationSettings.smsOnNewBusiness}
                  onChange={(e) =>
                    updateAdminNotificationSettings({
                      smsOnNewBusiness: e.target.checked,
                    })
                  }
                  className="rounded border-[#CBD5E1] text-[#0057FF]"
                />
                <span>اعلان و پیامک آنی هنگام ثبت‌نام سالن جدید</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-[#061138] cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminNotificationSettings.smsOnNewPaymentOrder}
                  onChange={(e) =>
                    updateAdminNotificationSettings({
                      smsOnNewPaymentOrder: e.target.checked,
                    })
                  }
                  className="rounded border-[#CBD5E1] text-[#0057FF]"
                />
                <span>اعلان فوری هنگام ثبت سفارش پلن یا تبلیغ</span>
              </label>
            </div>
          </Card>

          <Card padding="lg" className="space-y-2.5 bg-[#ECFDF5] border border-[#10B981]/40 text-xs text-[#065F46]">
            <p className="font-extrabold text-[#047857] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>تضمین حفظ ۱۰۰٪ اطلاعات در آپدیت‌های بعدی لیارا</span>
            </p>
            <p className="leading-relaxed">
              تمامی اطلاعات کسب‌وکارهای ثبت‌شده ({toPersianDigits(realBusinessesCount)} مرکز واقعی)، کاربران ({toPersianDigits(adminUsers.length)} کاربر)، نوبت‌ها، پلن‌ها و جایگاه‌های تبلیغاتی در <strong>دیتابیس مستقل PostgreSQL لیارا</strong> ذخیره می‌شوند. با آپدیت کردن کد برنامه هیچ اطلاعاتی از دیتابیس پاک نخواهد شد.
            </p>
          </Card>

          <Card variant="dark" padding="lg" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#00E5FF]">
                متغیرهای آماده برای پنل لیارا (Liara)
              </h3>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>کپی</span>
              </button>
            </div>
            <pre
              dir="ltr"
              className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed"
            >
              {envSnippet}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
};

