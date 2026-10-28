import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Check,
  X,
  Building2,
  CreditCard,
  Layers,
  TrendingUp,
  MessageSquare,
  Send,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit3,
  Megaphone,
} from 'lucide-react';
import {
  AdPackageItem,
  ApprovalStatus,
  BusinessItem,
  CategoryItem,
  SubscriptionPlanItem,
  SubscriptionStatus,
  SponsoredPlacementSlot,
} from '../../types';
import {
  formatPriceToman,
  getSubscriptionStatusMeta,
  toPersianDigits,
} from '../../utils/formatters';
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

/** ۱. داشبورد مدیریت پلتفرم (/admin) — بازطراحی کامل مطابق Capture6.PNG و Capture7.PNG */
export const AdminDashboardPage: React.FC = () => {
  const {
    dataMode,
    businesses,
    categories,
    updateBusinessApproval,
    adminNotifications,
    markAdminNotificationRead,
    clearAllAdminNotifications,
  } = usePrototypeData();
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '1y'>('7d');
  const [showSampleSalons, setShowSampleSalons] = useState(false);

  const realBusinesses = businesses.filter((b) => !b.isSampleShowcase);
  const visibleBusinesses = showSampleSalons ? businesses : realBusinesses;

  const pendingCount = realBusinesses.filter(
    (b) => b.approvalStatus === 'PENDING_REVIEW'
  ).length;
  const activeSubscriptionsCount =
    dataMode === 'real'
      ? realBusinesses.filter(
          (b) =>
            b.subscriptionStatus === 'ACTIVE' ||
            b.subscriptionStatus === 'TRIAL'
        ).length
      : 4;

  // اولویت نمایش با کسب‌وکارهای در انتظار بررسی
  const sortedBusinesses = [...visibleBusinesses].sort((a, b) => {
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

  const unreadNotifications = adminNotifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="پنل مدیریت کلان · Timeto (تایم تو)"
        title="داشبورد مدیریت پلتفرم"
        subtitle="بررسی کسب‌وکارهای در انتظار تایید، پایش آمار رزروهای شبکه و مدیریت اشتراک‌ها"
        routePattern="/admin"
        breadcrumbs={[
          { label: 'پنل مدیریت پلتفرم' },
          { label: 'داشبورد کلان' },
        ]}
      />

      {/* بنر اعلان هوشمند مدیریت کلان (ثبت سالن جدید و فیش‌های واریزی — فقط قابل مشاهده برای مدیر کل) */}
      {adminNotifications.length > 0 ? (
        <Card className="border-2 border-[#F59E0B] bg-[#FFFBEB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FDE68A] pb-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" />
              <h2 className="text-sm font-extrabold text-[#92400E]">
                مرکز اعلان‌های آنی مدیر کل: کسب‌وکارهای جدید و سفارش‌های مالی (
                {toPersianDigits(
                  unreadNotifications.length || adminNotifications.length
                )}{' '}
                مورد)
              </h2>
            </div>
            <button
              type="button"
              onClick={clearAllAdminNotifications}
              className="text-xs font-extrabold text-[#B45309] hover:underline cursor-pointer"
            >
              علامت‌گذاری همه به‌عنوان خوانده‌شده
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {adminNotifications.slice(0, 8).map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                  notif.isRead
                    ? 'bg-white/70 border-[#E2E8F0] text-[#475569]'
                    : 'bg-white border-[#F59E0B] text-[#061138] shadow-2xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        notif.type === 'NEW_PAYMENT_ORDER'
                          ? 'bg-[#EFF6FF] text-[#0057FF]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      {notif.type === 'NEW_PAYMENT_ORDER'
                        ? 'فیش / سفارش مالی'
                        : 'ثبت کسب‌وکار جدید'}
                    </span>
                    <p className="font-extrabold text-[#061138]">
                      {notif.title} · شهر {notif.city}
                    </p>
                  </div>
                  <p className="text-[#334155]">
                    {notif.message || (
                      <>
                        مالک: <strong>{notif.ownerName}</strong> · شماره تماس:{' '}
                        <span
                          dir="ltr"
                          className="font-mono font-extrabold text-[#0057FF]"
                        >
                          {notif.ownerPhone}
                        </span>
                      </>
                    )}{' '}
                    · زمان ثبت: {notif.createdAtJalali}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notif.type === 'NEW_PAYMENT_ORDER' ? (
                    <Link
                      to="/admin/payments"
                      onClick={() => markAdminNotificationRead(notif.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0057FF] text-white text-xs font-extrabold hover:bg-[#0046CC]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>بررسی و تایید تراکنش</span>
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (notif.businessId) {
                          updateBusinessApproval(notif.businessId, 'APPROVED');
                        }
                        markAdminNotificationRead(notif.id);
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تایید و انتشار سالن</span>
                    </Button>
                  )}
                  {!notif.isRead ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => markAdminNotificationRead(notif.id)}
                    >
                      خوانده شد
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* بنر دسترسی سریع به تنظیمات پیامک ملی‌پیامک */}
      <div className="rounded-3xl bg-[#061138] text-white p-4 sm:p-5 border border-[#1E293B] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0057FF] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-extrabold text-white">
              اتصال مستقیم و ۱ دقیقه‌ای پنل پیامک ملی‌پیامک (MelliPayamak)
            </p>
            <p className="text-[11px] sm:text-xs text-slate-300">
              کلید وب‌سرویس و کد الگوی پیامک (bodyId) خود را بدون درگیری با تنظیمات پیچیده وارد و در لحظه تست کنید.
            </p>
          </div>
        </div>
        <Link to="/admin/settings">
          <Button variant="accent" size="sm">
            <span>راه‌اندازی و تست پیامک</span>
          </Button>
        </Link>
      </div>

      {/* ۱. نوار یکپارچه ۳ ستونی شاخص‌های کلیدی (KPI Strip) با آیکون کادردار و روند هفتگی — دقیقاً مطابق Capture6.PNG */}
      <div className="rounded-3xl bg-white border border-[#E6E0F5] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#E6E0F5] shadow-2xs">
        {/* ستون ۱: کل رزروها و دسته‌بندی‌ها */}
        <div className="flex items-start justify-between gap-4 pt-2 md:pt-0">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B6480] block">
              کل رزروها و دسته‌بندی‌های فعال
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1E1B2E] tabular-nums">
              ۱,۲۸۴ رزرو
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] font-extrabold tabular-nums">
                ↗ +۱۴.۶٪ این هفته
              </span>
              <span className="text-[#6B6480] tabular-nums">
                ({toPersianDigits(categories.length)} سرفصل)
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-[#8B5CF6]" />
          </div>
        </div>

        {/* ستون ۲: مراکز در انتظار تایید */}
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
                از مجموع {toPersianDigits(businesses.length)} مرکز
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#F59E0B]" />
          </div>
        </div>

        {/* ستون ۳: درآمد اشتراک‌ها */}
        <div className="flex items-start justify-between gap-4 pt-4 md:pt-0 md:pr-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B6480] block">
              درآمد ماهانه اشتراک‌ها ({toPersianDigits(activeSubscriptionsCount)}{' '}
              اشتراک فعال)
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#8B5CF6] tabular-nums">
              {formatPriceToman(6640000)}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] font-extrabold tabular-nums">
                ↗ +۱۰.۲٪ این هفته
              </span>
              <span className="text-[#6B6480]">نرخ تمدید ۸۹٪</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>
      </div>

      {/* ۲. نمودار تحلیلی دوخطی (Order / Booking Analytics) با ستون هایلایت و تولتیپ شناور — دقیقاً مطابق Capture6.PNG */}
      <Card className="rounded-3xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E1B2E]">
              آمار رزروها و عملکرد مالی پلتفرم (Booking Analytics)
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6480]">
              <span className="inline-flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                <span>دوره جاری (این ماه)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[#6B6480]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]/70" />
                <span>دوره مشابه قبل</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FAF8FF] border border-[#E6E0F5]">
            {[
              { id: '7d', label: '۷ روز گذشته' },
              { id: '30d', label: '۳۰ روز گذشته' },
              { id: '1y', label: 'امسال' },
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

        <div className="relative pt-4">
          <svg viewBox="0 0 720 220" className="w-full h-52 overflow-visible">
            <defs>
              <linearGradient id="adm-bar-highlight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* خطوط افقی راهنما */}
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
                  {['۱۰۰', '۷۵', '۵۰', '۲۵'][idx]}
                </text>
              </g>
            ))}

            {/* ستون عمودی هایلایت روز پنجشنبه — مطابق Capture6.PNG */}
            <rect
              x="505"
              y="20"
              width="56"
              height="155"
              rx="14"
              fill="url(#adm-bar-highlight)"
            />

            {/* خط نقطه‌چین ماه قبل */}
            <path
              d="M65,148 C145,130 215,142 295,112 C375,82 455,118 533,88 C605,60 650,92 685,78"
              fill="none"
              stroke="#A78BFA"
              strokeOpacity="0.7"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            {/* خط اصلی دوره جاری */}
            <path
              d="M65,132 C145,98 215,122 295,84 C375,46 455,96 533,46 C605,18 650,64 685,42"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* نقطه فعال روی پنجشنبه + تولتیپ شناور سفید مطابق Capture6.PNG */}
            <circle
              cx="533"
              cy="46"
              r="6"
              fill="#FFFFFF"
              stroke="#8B5CF6"
              strokeWidth="3.5"
            />
            <g transform="translate(455, -4)">
              <rect
                x="0"
                y="0"
                width="156"
                height="38"
                rx="12"
                fill="#1E1B2E"
              />
              <text
                x="78"
                y="16"
                textAnchor="middle"
                className="fill-white text-[10px] font-extrabold"
              >
                پنجشنبه · اوج رزرو هفتگی
              </text>
              <text
                x="78"
                y="30"
                textAnchor="middle"
                className="fill-amber-300 text-[11px] font-extrabold"
              >
                ۶۴,۸۰۰,۰۰۰ تومان
              </text>
            </g>

            {/* برچسب روزهای هفته */}
            {[
              { x: 65, label: 'شنبه' },
              { x: 170, label: 'یکشنبه' },
              { x: 275, label: 'دوشنبه' },
              { x: 380, label: 'سه‌شنبه' },
              { x: 455, label: 'چهارشنبه' },
              { x: 533, label: 'پنجشنبه' },
              { x: 655, label: 'جمعه' },
            ].map((d) => (
              <text
                key={d.label}
                x={d.x}
                y="198"
                textAnchor="middle"
                className={`text-[11px] font-bold ${
                  d.label === 'پنجشنبه' ? 'fill-[#8B5CF6]' : 'fill-[#6B6480]'
                }`}
              >
                {d.label}
              </text>
            ))}
          </svg>
        </div>
      </Card>

      {/* ۳. جدول صف بررسی و تایید کسب‌وکارهای ثبت‌نام‌شده واقعی */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#1E1B2E]">
              صف بررسی و تایید کسب‌وکارهای ثبت‌نام‌شده (
              {toPersianDigits(sortedBusinesses.length)} مورد)
            </h2>
            <p className="text-xs text-[#6B6480]">
              به‌طور پیش‌فرض فقط کسب‌وکارهای واقعی ثبت‌نام‌شده نمایش داده می‌شوند و نمونه‌های نمایشی پنهان شده‌اند
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSampleSalons((p) => !p)}
            className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#334155] hover:border-[#0057FF] cursor-pointer"
          >
            {showSampleSalons
              ? 'پنهان کردن سالن‌های نمونه نمایشی'
              : 'نمایش سالن‌های نمونه نمایشی'}
          </button>
        </div>

        <ResponsiveTable
          keyExtractor={(b) => b.id}
          data={sortedBusinesses}
          columns={[
            {
              key: 'name',
              header: 'نام کسب‌وکار و مسیر ↕',
              render: (b) => (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-[#1E1B2E]">{b.name}</p>
                    {b.isSampleShowcase ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                        نمونه
                      </span>
                    ) : null}
                  </div>
                  <p dir="ltr" className="text-[11px] font-mono text-[#6B6480]">
                    /{b.slug}
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
              header: 'نوع فعالیت / شهر و محله ↕',
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
              header: 'تایید / رد سریع',
              render: (b) => (
                <div className="flex items-center gap-1.5">
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
    </div>
  );
};


/** ۲. مدیریت کسب‌وکارها (/admin/businesses) */
export const AdminBusinessesPage: React.FC = () => {
  const {
    businesses,
    updateBusinessApproval,
    updateBusinessProfile,
    showToast,
  } = usePrototypeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'ALL'>(
    'ALL'
  );
  const [showSampleSalons, setShowSampleSalons] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const sourceBusinesses = showSampleSalons
    ? businesses
    : businesses.filter((b) => !b.isSampleShowcase);

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
      statusFilter === 'ALL' || b.approvalStatus === statusFilter;
    return matchQuery && matchStatus;
  });

  const rejectTargetBiz = businesses.find((b) => b.id === rejectTargetId);

  return (
    <div>
      <PageHeader
        kicker="نظارت و عملیات · مراکز زیبایی ثبت‌نام‌شده"
        title="بررسی، تایید و مدیریت کسب‌وکارهای عضو"
        subtitle="مشاهده اطلاعات کامل صاحب کسب‌وکار، شماره موبایل کامل، شارژ فوری پیامک و تایید یا رد پروفایل سالن‌ها"
        routePattern="/admin/businesses"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'کسب‌وکارها' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => setShowSampleSalons((p) => !p)}
            className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-extrabold text-[#061138] hover:border-[#0057FF] cursor-pointer"
          >
            {showSampleSalons
              ? 'پنهان کردن سالن‌های نمونه نمایشی'
              : 'نمایش سالن‌های نمونه نمایشی'}
          </button>
        }
      />

      <Card className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6E0F5]">
          {[
            { id: 'ALL', label: 'همه مراکز واقعی', count: sourceBusinesses.length },
            {
              id: 'PENDING_REVIEW',
              label: 'در انتظار بررسی',
              count: sourceBusinesses.filter(
                (b) => b.approvalStatus === 'PENDING_REVIEW'
              ).length,
            },
            {
              id: 'APPROVED',
              label: 'تاییدشده',
              count: sourceBusinesses.filter((b) => b.approvalStatus === 'APPROVED')
                .length,
            },
            {
              id: 'REJECTED',
              label: 'ردشده',
              count: sourceBusinesses.filter((b) => b.approvalStatus === 'REJECTED')
                .length,
            },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setStatusFilter(tab.id as ApprovalStatus | 'ALL')
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#FAF8FF] text-[#6B6480] border border-[#E6E0F5]'
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="adm-biz-search" label="جست‌وجوی نام سالن، نام مالک، شماره موبایل یا شهر">
            <Input
              id="adm-biz-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="نام سالن، شماره موبایل (0913...) یا شهر..."
            />
          </FormField>
          <FormField id="adm-biz-status" label="فیلتر وضعیت تایید">
            <Select
              id="adm-biz-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ApprovalStatus | 'ALL')
              }
              options={[
                { value: 'ALL', label: 'همه کسب‌وکارها' },
                { value: 'APPROVED', label: 'تاییدشده' },
                { value: 'PENDING_REVIEW', label: 'در انتظار بررسی' },
                { value: 'REJECTED', label: 'ردشده' },
              ]}
            />
          </FormField>
        </div>
      </Card>

      <ResponsiveTable
        keyExtractor={(b) => b.id}
        data={filtered}
        columns={[
          {
            key: 'name',
            header: 'عنوان کسب‌وکار و پلن',
            render: (b) => (
              <div className="space-y-0.5">
                <span className="font-extrabold text-[#1E1B2E] block">
                  {b.name}
                </span>
                <span className="text-[11px] text-[#0057FF] font-bold block">
                  {b.subscriptionPlan} · ارسال پیامک:{' '}
                  {toPersianDigits(b.smsSentCount ?? 0)} عدد (شارژ اضافه:{' '}
                  {toPersianDigits(b.extraSmsBalance ?? 0)})
                </span>
              </div>
            ),
          },
          {
            key: 'owner',
            header: 'مشخصات کامل مالک و شماره تماس',
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
            header: 'شهر، محله و نشانی',
            render: (b) => (
              <div className="text-xs space-y-0.5 max-w-xs">
                <span className="font-bold text-[#1E1B2E] block">
                  {b.city}، {b.neighborhood}
                </span>
                <span className="text-[11px] text-[#64748B] line-clamp-1">
                  {b.address}
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
            header: 'عملیات بررسی و شارژ پیامک',
            render: (b) => (
              <div className="flex flex-wrap items-center gap-1.5">
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
                  onClick={() => {
                    const nextSms = (b.extraSmsBalance ?? 0) + 200;
                    updateBusinessProfile(b.id, { extraSmsBalance: nextSms });
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
                >
                  <X className="w-3.5 h-3.5" />
                  <span>رد</span>
                </Button>
              </div>
            ),
          },
        ]}
      />

      <ConfirmationDialog
        isOpen={Boolean(rejectTargetId)}
        onClose={() => setRejectTargetId(null)}
        onConfirm={() => {
          if (rejectTargetId) {
            updateBusinessApproval(rejectTargetId, 'REJECTED');
          }
        }}
        title="تایید رد صلاحیت کسب‌وکار"
        confirmLabel="بله، وضعیت به ردشده تغییر کند"
        message={`آیا از تغییر وضعیت «${rejectTargetBiz?.name ?? ''}» به حالت ردشده اطمینان دارید؟`}
      />
    </div>
  );
};

/** ۳. مدیریت کاربران (/admin/users) */
export const AdminUsersPage: React.FC = () => {
  const { adminUsers } = usePrototypeData();
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const sourceUsers = adminUsers.map((u) => ({
    id: u.id,
    name: u.fullName,
    role: u.roleLabel,
    phone: u.phone || u.phoneMasked,
    city: u.city,
    joinedJalali: u.joinedJalali || '—',
    status: u.isActive ? 'فعال' : 'غیرفعال',
  }));

  const filtered = sourceUsers.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role.includes(roleFilter);
    const q = searchQuery.trim();
    const matchQuery =
      !q ||
      u.name.includes(q) ||
      u.phone.includes(q) ||
      u.city.includes(q);
    return matchRole && matchQuery;
  });

  return (
    <div>
      <PageHeader
        kicker="نظارت و عملیات · حساب‌های کاربری واقعی"
        title="مدیریت کاربران و صاحبان کسب‌وکار"
        subtitle="مشاهده فهرست کامل کاربران ثبت‌نام‌شده همراه با شماره موبایل کامل (بدون سانسور)، نقش کاربری و تاریخ عضویت"
        routePattern="/admin/users"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'کاربران سامانه' },
        ]}
      />

      <Card className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="adm-usr-search" label="جست‌وجوی نام یا شماره موبایل کاربر">
          <Input
            id="adm-usr-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="نام کاربر یا شماره موبایل (0913...)"
          />
        </FormField>
        <FormField id="adm-usr-role" label="فیلتر نقش کاربری">
          <Select
            id="adm-usr-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'همه نقش‌ها' },
              { value: 'مشتری', label: 'مشتری' },
              { value: 'کسب‌وکار', label: 'مالک / عضو کسب‌وکار' },
              { value: 'مدیر', label: 'مدیر کل / مدیر سالن' },
            ]}
          />
        </FormField>
      </Card>

      <ResponsiveTable
        keyExtractor={(u) => u.id}
        data={filtered}
        columns={[
          {
            key: 'name',
            header: 'نام و نام خانوادگی کاربر',
            render: (u) => (
              <span className="font-extrabold text-[#1E1B2E]">{u.name}</span>
            ),
          },
          {
            key: 'role',
            header: 'نقش در سامانه',
            render: (u) => <StatusBadge label={u.role} tone="primary" />,
          },
          {
            key: 'phone',
            header: 'شماره همراه کامل',
            render: (u) => (
              <span
                dir="ltr"
                className="text-xs font-mono font-extrabold text-[#0057FF] bg-[#E0ECFF] px-2.5 py-1 rounded-lg tabular-nums"
              >
                {u.phone}
              </span>
            ),
          },
          {
            key: 'city',
            header: 'شهر و تاریخ عضویت',
            render: (u) => (
              <span className="text-xs text-[#334155] tabular-nums">
                {u.city} ({u.joinedJalali})
              </span>
            ),
          },
          {
            key: 'status',
            header: 'وضعیت',
            render: (u) => <StatusBadge label={u.status} tone="success" />,
          },
        ]}
      />

      <Pagination currentPage={page} totalPages={1} onPageChange={setPage} />
    </div>
  );
};

/** ۴. مدیریت دسته‌بندی‌ها (/admin/categories) */
export const AdminCategoriesPage: React.FC = () => {
  const { categories, addCategory, updateCategory } = usePrototypeData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const openAdd = () => {
    setEditingCat(null);
    setTitle('');
    setSlug('');
    setSubtitle('');
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setTitle(cat.title);
    setSlug(cat.slug);
    setSubtitle(cat.subtitle);
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
      });
    } else {
      addCategory({
        title: title.trim(),
        slug: slug.trim(),
        subtitle: subtitle.trim() || 'دسته‌بندی خدمات زیبایی',
        serviceCount: 12,
        targetAudience: 'سالن‌ها و متخصصان زیبایی',
        iconName: 'Sparkles',
      });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        kicker="ساختار بازارچه · طبقه‌بندی خدمات"
        title="مدیریت دسته‌بندی‌های خدمات"
        subtitle="افزودن و ویرایش سرفصل‌های استاندارد خدمات زیبایی در پلتفرم"
        routePattern="/admin/categories"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'دسته‌بندی خدمات' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>افزودن دسته‌بندی</span>
          </Button>
        }
      />

      <ResponsiveTable
        keyExtractor={(c) => c.id}
        data={categories}
        columns={[
          {
            key: 'title',
            header: 'عنوان دسته‌بندی',
            render: (c) => (
              <span className="font-extrabold text-[#1E1B2E]">{c.title}</span>
            ),
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
            key: 'count',
            header: 'تعداد خدمات',
            render: (c) => (
              <span className="tabular-nums font-bold text-[#8B5CF6]">
                {toPersianDigits(c.serviceCount)} خدمت
              </span>
            ),
          },
          {
            key: 'action',
            header: 'ویرایش',
            render: (c) => (
              <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                ویرایش
              </Button>
            ),
          },
        ]}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingCat ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormField id="cat-title" label="عنوان فارسی دسته‌بندی" required>
            <Input
              id="cat-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>
          <FormField id="cat-slug" label="شناسه انگلیسی (Slug)" required>
            <Input
              id="cat-slug"
              dir="ltr"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </FormField>
          <FormField id="cat-sub" label="توضیح کوتاه خدمات زیرمجموعه">
            <Input
              id="cat-sub"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
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

/** ۵. مدیریت اشتراک‌ها و جایگاه‌های تبلیغاتی (/admin/subscriptions) */
export const AdminSubscriptionsPage: React.FC = () => {
  const {
    plans,
    updatePlan,
    adPackages,
    updateAdPackage,
    businesses,
    updateBusinessProfile,
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
  const [bizSponsoredDays, setBizSponsoredDays] = useState('30');
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
    setBizSponsoredDays(String(biz.sponsoredDaysRemaining ?? 30));
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
      sponsoredLabel: bizSponsoredLabel.trim() || 'پیشنهاد ویژه',
      extraSmsBalance: Math.max(0, Number(bizExtraSms) || 0),
      subscriptionPlan: bizPlanName || managingBiz.subscriptionPlan,
      trialDaysRemaining: trialNum,
      subscriptionStatus:
        trialNum > 0 ? SubscriptionStatus.Trial : SubscriptionStatus.Active,
    });
    showToast(
      `تنظیمات جایگاه تبلیغاتی، دوره تست (${toPersianDigits(
        trialNum
      )} روز) و اشتراک «${managingBiz.name}» ذخیره شد.`
    );
    setManagingBiz(null);
  };

  const pendingOrders = paymentOrders.filter((o) => o.status === 'PENDING');

  const placementLabels: Record<string, string> = {
    SEARCH_TOP: 'صدر جست‌وجو (/search)',
    HOME_BANNER: 'بنر صفحه اول + صدر جست‌وجو',
    HERO_SPOTLIGHT: 'ویترین طلایی بالای صفحه اول',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مالی، اشتراک و تبلیغات · کنترل کامل پلن‌ها و جایگاه‌های ویژه"
        title="مدیریت و ویرایش پلن‌های اشتراک و جایگاه‌های تبلیغاتی (Boost)"
        subtitle="ویرایش مستقیم قیمت و ظرفیت پلن‌ها، تعرفه بسته‌های تبلیغاتی، تایید سفارش‌های خرید سالن‌ها و تنظیم نحوه قرارگیری و مدت زمان تبلیغ هر کسب‌وکار"
        routePattern="/admin/subscriptions"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'پلن‌ها و تبلیغات' },
        ]}
      />

      {/* راهنمای عملی مدیر کل: دقیقاً کجا چیکار کنم؟ */}
      <Card className="bg-[#F3F6FC] border-2 border-[#0057FF]/25 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-extrabold text-[#0057FF] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>راهنمای سریع مدیر کل: کجا چیکار کنم؟</span>
          </p>
          <Link to="/admin/payments">
            <Button variant="outline" size="sm">
              <span>مشاهده همه صورتحساب‌ها و تنظیم بله‌پی / کارت‌به‌کارت ←</span>
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#061138]">
          <div className="p-3 rounded-xl bg-white border border-[#CBD5E1] space-y-1">
            <p className="font-extrabold text-[#0057FF]">
              ۱. تغییر قیمت و ظرفیت پلن‌ها و بسته‌ها
            </p>
            <p className="text-[#334155] leading-relaxed">
              روی دکمه <strong>«ویرایش پلن»</strong> یا{' '}
              <strong>«ویرایش تعرفه بسته»</strong> در کارت‌های زیر بزنید تا قیمت
              ماهانه/هفتگی، سقف متخصصان یا سهمیه پیامک بلافاصله در کل سایت آپدیت
              شود.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#CBD5E1] space-y-1">
            <p className="font-extrabold text-[#059669]">
              ۲. وقتی صاحب سالن بسته یا پلن می‌خرد
            </p>
            <p className="text-[#334155] leading-relaxed">
              سفارش او (با کد رهگیری بله‌پی یا کارت‌به‌کارت) همین پایین در بخش{' '}
              <strong>«درخواست‌های خرید سالن‌ها»</strong> می‌آید. با زدن دکمه{' '}
              <strong>«تایید و فعال‌سازی»</strong>، جایگاه و مدت زمان تبلیغ او
              خودکار فعال می‌شود.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#CBD5E1] space-y-1">
            <p className="font-extrabold text-[#D97706]">
              ۳. تنظیم دستی جایگاه، رتبه و مدت زمان
            </p>
            <p className="text-[#334155] leading-relaxed">
              در جدول پایین صفحه روی دکمه{' '}
              <strong>«تنظیم جایگاه و زمان تبلیغ»</strong> هر سالن بزنید تا محل
              نمایش (صفحه اول یا صدر جست‌وجو)، رتبه ۱ تا ۱۰ و تعداد روزهای
              باقی‌مانده را دقیق تنظیم کنید.
            </p>
          </div>
        </div>
      </Card>

      {/* صف سریع درخواست‌های خرید در انتظار تایید */}
      {pendingOrders.length > 0 ? (
        <Card className="border-2 border-[#F59E0B] bg-[#FFFBEB] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D97706]" />
              <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                درخواست‌های خرید جدید سالن‌ها (در انتظار تایید شما:{' '}
                {toPersianDigits(pendingOrders.length)} مورد)
              </h2>
            </div>
            <span className="text-xs font-bold text-[#92400E]">
              با تایید هر مورد، پلن یا جایگاه تبلیغاتی سالن به صورت خودکار فعال
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
                header: 'بسته / جایگاه انتخابی',
                render: (o) => (
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#0057FF] block">
                      {o.itemTitle}
                    </span>
                    {o.requestedPlacement ? (
                      <span className="text-[11px] text-[#334155] block">
                        محل: {placementLabels[o.requestedPlacement]} · مدت:{' '}
                        {toPersianDigits(o.requestedDurationDays ?? 30)} روز
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
                      {o.paymentMethod === 'BALEPAY'
                        ? 'بله‌پی (BalePay)'
                        : 'کارت‌به‌کارت'}
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

      {/* بخش ۱: پلن‌های اشتراک ماهانه (قابل ویرایش توسط مدیر کل) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#061138]">
            ۱. پلن‌های اشتراک ماهانه کسب‌وکارها (قابل ویرایش)
          </h2>
          <span className="text-xs text-[#64748B]">
            تغییرات شما بلافاصله در صفحه تعرفه‌ها و پنل سالن‌ها اعمال می‌شود
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#061138]">
                    {plan.name}
                  </h3>
                  {plan.isRecommended ? (
                    <StatusBadge label="پرفروش" tone="accent" />
                  ) : null}
                </div>
                <p className="text-xl font-extrabold text-[#0057FF] tabular-nums">
                  {plan.monthlyPriceToman === 0
                    ? 'رایگان (۰ تومان)'
                    : formatPriceToman(plan.monthlyPriceToman)}
                </p>
                <div className="space-y-1 text-xs text-[#334155] pt-2 border-t border-[#E2E8F0]">
                  <p>
                    ظرفیت متخصصان: <strong>{plan.staffLimit}</strong>
                  </p>
                  <p className="tabular-nums">
                    سهمیه پیامک ماهانه:{' '}
                    <strong>{toPersianDigits(plan.smsQuotaMonthly)} عدد</strong>
                  </p>
                  <p className="text-[11px] text-[#64748B] pt-1">
                    {plan.audience}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-[#E2E8F0]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => openEditPlanModal(plan)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش قیمت، ظرفیت و ویژگی‌ها</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* بخش ۲: تعرفه بسته‌های تبلیغاتی و پیامک اضافه (قابل ویرایش توسط مدیر کل) */}
      <Card className="bg-[#061138] text-white border-[#1E293B] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold text-[#00E5FF]">
              ۲. بسته‌های تبلیغات و جایگاه‌های ویژه (قابل ویرایش توسط شما)
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
              تعرفه‌های ارتقای جایگاه سالن‌ها و بسته پیامک اضافه
            </h2>
          </div>
          <StatusBadge
            label="متصل به درگاه بله‌پی و کارت‌به‌کارت"
            tone="success"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {adPackages.map((pkg, idx) => (
            <div
              key={pkg.id}
              className="p-4 rounded-2xl bg-white/10 border border-white/15 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-[#00E5FF]">
                    {toPersianDigits(idx + 1)}. {pkg.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-slate-200">
                    {pkg.badge}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  {pkg.description}
                </p>
                <p className="font-extrabold text-white pt-1 tabular-nums text-sm">
                  {formatPriceToman(pkg.priceToman)}
                  {pkg.slot !== 'SMS_ADDON' ? (
                    <span className="text-[11px] font-normal text-slate-300">
                      {' '}
                      / ماهانه ({formatPriceToman(pkg.weeklyPriceToman ?? 190000)}{' '}
                      هفتگی)
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-emerald-300">
                      {' '}
                      / بسته {toPersianDigits(pkg.smsCount ?? 200)} پیامک
                    </span>
                  )}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => openEditAdPkgModal(pkg)}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش تعرفه و توضیحات بسته</span>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* بخش ۳: جدول کنترل کامل جایگاه، رتبه و مدت زمان تبلیغ هر کسب‌وکار */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#061138]">
              ۳. مدیریت جایگاه تبلیغاتی، رتبه نمایش، پلن و شارژ پیامک هر کسب‌وکار
            </h2>
            <p className="text-xs text-[#64748B]">
              تعیین کنید کدام سالن در صدر جست‌وجو یا بنر صفحه اول باشد، در چه
              رتبه‌ای قرار بگیرد، چند روز اعتبار تبلیغاتی یا پیامک اضافه داشته باشد
            </p>
          </div>
          {businesses.length > 0 ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                const target =
                  businesses.find((b) => !b.isSampleShowcase) ?? businesses[0];
                if (target) openManageBizModal(target);
              }}
            >
              <Megaphone className="w-4 h-4" />
              <span>انتخاب کسب‌وکار و تنظیم جایگاه / پلن / پیامک</span>
            </Button>
          ) : null}
        </div>

        <ResponsiveTable
          keyExtractor={(b) => b.id}
          data={businesses}
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
                    {b.isSampleShowcase ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
                        نمونه
                      </span>
                    ) : null}
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
              header: 'پلن، دوره تست و پیامک',
              render: (b) => (
                <div className="space-y-1">
                  <span className="font-bold text-[#0057FF] block">
                    {b.subscriptionPlan}
                  </span>
                  {b.trialDaysRemaining && b.trialDaysRemaining > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#F59E0B]/40 text-[11px] font-extrabold tabular-nums">
                      تست تاییدشده مدیریت: {toPersianDigits(b.trialDaysRemaining)} روز باقی‌مانده
                    </span>
                  ) : null}
                  <span className="text-[11px] text-[#64748B] tabular-nums block">
                    شارژ پیامک اضافه:{' '}
                    {toPersianDigits(b.extraSmsBalance ?? 0)} عدد (ارسالی:{' '}
                    {toPersianDigits(b.smsSentCount ?? 0)})
                  </span>
                </div>
              ),
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
                  </div>
                ) : (
                  <StatusBadge label="نمایش عادی (بدون تبلیغ)" tone="neutral" />
                ),
            },
            {
              key: 'rankAndDuration',
              header: 'رتبه نمایش و مدت زمان باقی‌مانده',
              render: (b) =>
                b.isSponsored ? (
                  <div className="space-y-0.5 tabular-nums">
                    <span className="font-extrabold text-[#061138] block text-xs">
                      اولویت جایگاه: رتبه{' '}
                      {toPersianDigits(b.sponsoredOrder ?? 1)}
                    </span>
                    <span className="text-[11px] font-bold text-[#059669] block">
                      {toPersianDigits(b.sponsoredDaysRemaining ?? 30)} روز
                      باقی‌مانده
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[#64748B]">—</span>
                ),
            },
            {
              key: 'actions',
              header: 'مدیریت کامل جایگاه و زمان',
              render: (b) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => openManageBizModal(b)}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>تنظیم جایگاه و زمان تبلیغ</span>
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
              ),
            },
          ]}
        />
      </div>

      {/* مودال ۱: ویرایش پلن اشتراک */}
      <Modal
        isOpen={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        title={`ویرایش پلن اشتراک: ${editingPlan?.name ?? ''}`}
        description="می‌توانید قیمت ماهانه، سقف متخصصان، سهمیه پیامک و ویژگی‌های این پلن را تغییر دهید"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField id="edit-plan-name" label="عنوان پلن" required>
              <Input
                id="edit-plan-name"
                value={planNameInput}
                onChange={(e) => setPlanNameInput(e.target.value)}
              />
            </FormField>
            <FormField
              id="edit-plan-price"
              label="قیمت ماهانه (تومان — ۰ برای رایگان)"
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
              label="سهمیه پیامک ماهانه (عدد)"
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

          <FormField id="edit-plan-aud" label="توضیح مخاطب هدف پلن">
            <Input
              id="edit-plan-aud"
              value={planAudienceInput}
              onChange={(e) => setPlanAudienceInput(e.target.value)}
            />
          </FormField>

          <FormField
            id="edit-plan-features"
            label="امکانات پلن (هر ویژگی در یک خط مجزا)"
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
              <span>ذخیره تغییرات پلن</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال ۲: ویرایش بسته تبلیغاتی / پیامک */}
      <Modal
        isOpen={Boolean(editingAdPkg)}
        onClose={() => setEditingAdPkg(null)}
        title={`ویرایش بسته تبلیغاتی: ${editingAdPkg?.title ?? ''}`}
        description="تغییر قیمت ماهانه، قیمت هفتگی و شرح جایگاه تبلیغاتی"
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
                  : 'تعرفه ۳۰ روزه / ماهانه (تومان)'
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
                label="تعرفه ۷ روزه / هفتگی (تومان)"
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

      {/* مودال ۳: مدیریت نحوه قرارگیری، رتبه و مدت زمان تبلیغ هر کسب‌وکار (با قابلیت انتخاب مستقیم کسب‌وکار از لیست) */}
      <Modal
        isOpen={Boolean(managingBiz)}
        onClose={() => setManagingBiz(null)}
        title={`مدیریت تبلیغات، پلن و پیامک: ${managingBiz?.name ?? ''}`}
        description="کسب‌وکار مورد نظر را انتخاب کنید و محل نمایش بنر/کارت، رتبه اولویت، تعداد روزها و شارژ پیامک را تنظیم نمایید"
      >
        <form onSubmit={handleSaveBizPlacement} className="space-y-4">
          {/* انتخابگر مستقیم کسب‌وکار در بالای مودال */}
          <FormField
            id="modal-select-business"
            label="انتخاب کسب‌وکار جهت تنظیم تبلیغ، پلن یا شارژ پیامک"
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
                    value: 'SEARCH_TOP',
                    label: 'صدر نتایج جست‌وجو (/search)',
                  },
                  {
                    value: 'HOME_BANNER',
                    label: 'بنر ویژه صفحه اول + صدر جست‌وجو',
                  },
                  {
                    value: 'HERO_SPOTLIGHT',
                    label: 'ویترین طلایی صفحه اول + صدر جست‌وجو',
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
              label="۳. مدت زمان باقی‌مانده تبلیغ (روز)"
              required
            >
              <Input
                id="biz-days"
                dir="ltr"
                type="number"
                value={bizSponsoredDays}
                onChange={(e) => setBizSponsoredDays(e.target.value)}
              />
            </FormField>

            <FormField id="biz-plan-select" label="۴. پلن اشتراک فعال سالن">
              <Select
                id="biz-plan-select"
                value={bizPlanName}
                onChange={(e) => setBizPlanName(e.target.value)}
                options={plans.map((p) => ({ value: p.name, label: p.name }))}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#64748B]">
              تنظیم سریع مدت زمان:
            </span>
            {[7, 14, 30, 60, 90].map((d) => (
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
                label="موجودی پیامک اضافه (مازاد بر پلن)"
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

          {/* اعطای دوره تست رایگان با تایید مستقیم مدیر کل + شمارنده روز */}
          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-extrabold text-[#92400E]">
                  ۵. اعطای دوره تست رایگان (صرفاً با تایید مدیر کل)
                </p>
                <p className="text-[11px] text-[#B45309]">
                  اگر صاحب سالن درخواست تست داده است، تعداد روز تست را مشخص کنید تا در پنل او روزشمار باقی‌مانده نمایش داده شود (۰ = بدون دوره تست)
                </p>
              </div>
              <input
                type="number"
                dir="ltr"
                min={0}
                max={60}
                value={bizTrialDays}
                onChange={(e) => setBizTrialDays(e.target.value)}
                className="w-20 rounded-xl border border-[#F59E0B] bg-white px-2.5 py-1.5 text-xs font-extrabold text-center text-[#92400E] tabular-nums"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { d: 0, label: '۰ روز (غیرفعال)' },
                { d: 3, label: '۳ روز تست' },
                { d: 5, label: '۵ روز تست' },
                { d: 7, label: '۷ روز تست' },
                { d: 14, label: '۱۴ روز تست' },
              ].map((item) => (
                <button
                  key={item.d}
                  type="button"
                  onClick={() => setBizTrialDays(String(item.d))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors ${
                    Number(bizTrialDays) === item.d
                      ? 'bg-[#D97706] text-white'
                      : 'bg-white text-[#92400E] border border-[#F59E0B]/40 hover:bg-[#FEF3C7]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
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

/** ۶. تراکنش‌های حق اشتراک و مدیریت درگاه بله‌پی و کارت‌به‌کارت (/admin/payments) */
export const AdminPaymentsPage: React.FC = () => {
  const {
    paymentConfig,
    updatePaymentConfig,
    paymentOrders,
    reviewPaymentOrder,
  } = usePrototypeData();

  const [cardNumber, setCardNumber] = useState(paymentConfig.cardNumber);
  const [cardHolderName, setCardHolderName] = useState(
    paymentConfig.cardHolderName
  );
  const [bankName, setBankName] = useState(paymentConfig.bankName);
  const [balePayLink, setBalePayLink] = useState(paymentConfig.balePayLink);
  const [supportHandle, setSupportHandle] = useState(
    paymentConfig.supportTelegramOrBale
  );

  const handleSaveGateway = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentConfig({
      cardNumber: cardNumber.trim(),
      cardHolderName: cardHolderName.trim(),
      bankName: bankName.trim(),
      balePayLink: balePayLink.trim(),
      supportTelegramOrBale: supportHandle.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مالی و تسویه آسان · درگاه بله‌پی (BalePay) و کارت‌به‌کارت"
        title="مدیریت پرداخت‌ها، فیش‌های واریزی و درگاه بدون اینماد"
        subtitle="تنظیم شماره کارت و لینک بله‌پی برای دریافت هزینه اشتراک و تبلیغات سالن‌ها بدون نیاز به ای‌نماد و تایید ۱-کلیکی واریزی‌ها"
        routePattern="/admin/payments"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تراکنش‌ها و درگاه پرداخت' },
        ]}
      />

      {/* کارت تنظیمات درگاه بله‌پی و کارت‌به‌کارت */}
      <Card className="space-y-4 border-2 border-[#0057FF]/25">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#061138] text-[#00E5FF] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
                تنظیمات درگاه پرداخت آسان (بله‌پی + کارت‌به‌کارت)
              </h2>
              <p className="text-xs text-[#64748B]">
                این اطلاعات هنگام خرید اشتراک، جایگاه تبلیغاتی یا بسته پیامک به
                صاحبان سالن نمایش داده می‌شود
              </p>
            </div>
          </div>
          <StatusBadge
            label="فعال و بدون نیاز به اینماد"
            tone="success"
          />
        </div>

        <form onSubmit={handleSaveGateway} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              id="pay-card-num"
              label="شماره کارت ۱۶ رقمی (جهت کارت‌به‌کارت)"
              required
            >
              <Input
                id="pay-card-num"
                dir="ltr"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="6037-9975-0000-0000"
              />
            </FormField>

            <FormField id="pay-holder" label="نام صاحب حساب / کارت" required>
              <Input
                id="pay-holder"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                placeholder="مدیریت پلتفرم تایم تو"
              />
            </FormField>

            <FormField id="pay-bank" label="نام بانک" required>
              <Input
                id="pay-bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="بانک ملی ایران"
              />
            </FormField>

            <FormField
              id="pay-bale"
              label="لینک پرداخت یا آیدی بازرگان بله‌پی (BalePay)"
              required
            >
              <Input
                id="pay-bale"
                dir="ltr"
                value={balePayLink}
                onChange={(e) => setBalePayLink(e.target.value)}
                placeholder="https://ble.ir/timeto_pay"
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <span>آیدی پشتیبانی بله / تلگرام جهت ارسال فیش:</span>
              <input
                dir="ltr"
                value={supportHandle}
                onChange={(e) => setSupportHandle(e.target.value)}
                className="rounded-xl border border-[#CBD5E1] px-2.5 py-1 text-xs font-mono text-[#061138]"
              />
            </div>

            <Button type="submit" variant="primary" size="sm">
              <Check className="w-4 h-4" />
              <span>ذخیره تنظیمات درگاه بله‌پی و کارت‌به‌کارت</span>
            </Button>
          </div>
        </form>
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
                    {i.paymentMethod === 'BALEPAY'
                      ? 'بله‌پی (BalePay)'
                      : 'کارت‌به‌کارت'}
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

/** ۷. گزارش‌های تحلیلی پلتفرم (/admin/reports) */
export const AdminReportsPage: React.FC = () => {
  const cityBreakdown = [
    { city: 'اصفهان — چهارباغ بالا و نظر شرقی', pct: 35, count: '۳ مرکز فعال' },
    { city: 'درچه (اصفهان)', pct: 25, count: '۲ مرکز فعال' },
    { city: 'اصفهان — مرداویج و شیخ صدوق', pct: 25, count: '۲ مرکز فعال' },
    { city: 'اصفهان — جلفا و سپاهان‌شهر', pct: 15, count: '۱ مرکز فعال' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="گزارش‌های کلان · آمار پلتفرم در اصفهان و درچه"
        title="گزارش‌های تحلیلی کلان پلتفرم"
        subtitle="آمار توزیع کسب‌وکارها در محله‌های اصفهان و درچه، رشد نوبت‌دهی و نرخ تمدید اشتراک"
        routePattern="/admin/reports"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'گزارش‌های تحلیلی' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-sm font-extrabold text-[#061138]">
            توزیع کسب‌وکارهای عضو در محله‌های اصفهان و درچه
          </h2>
          <div className="space-y-3.5">
            {cityBreakdown.map((item) => (
              <div key={item.city} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-[#1E1B2E]">{item.city}</span>
                  <span className="font-bold text-[#6B6480] tabular-nums">
                    {toPersianDigits(item.pct)}٪ ({item.count})
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
        </Card>

        <Card className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-extrabold text-[#1E1B2E]">
              شاخص ماندگاری و تمدید اشتراک ماهانه
            </h2>
            <p className="text-3xl font-extrabold text-[#8B5CF6] tabular-nums">
              {toPersianDigits(89)}٪
            </p>
            <p className="text-xs text-[#6B6480] leading-relaxed">
              میانگین نرخ تمدید اشتراک سالن‌ها پس از پایان دوره آزمایشی ۱۴ روزه.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] text-xs text-[#6B6480]">
            بیشترین تقاضای رزرو آنلاین در ماه جاری: لاین «مو و رنگ» و «ناخن و
            مانیکور».
          </div>
        </Card>
      </div>
    </div>
  );
};

/** ۸. تنظیمات کلان سامانه، رمز عبور مدیر کل و اتصال آسان ملی‌پیامک (/admin/settings) */
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
        if (data.sender) setSenderInput(String(data.sender));
      })
      .catch(() => {
        // نادیده گرفتن خطای شبکه در بارگذاری اولیه
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAdminPass(true);
    try {
      const ok = await setAccountPassword(adminNewPassword);
      if (ok) {
        setAdminNewPassword('');
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
        kicker="پیکربندی سامانه · تنظیمات مدیر کل، امنیت و درگاه پیامک"
        title="تنظیمات کلان، رمز عبور مدیر کل و اتصال ملی‌پیامک"
        subtitle="مدیریت رمز عبور ثابت مدیر کل، بررسی پایداری دیتابیس PostgreSQL و فعال‌سازی مستقیم وب‌سرویس خدماتی ملی‌پیامک"
        routePattern="/admin/settings"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تنظیمات و امنیت' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ستون اصلی: راه‌اندازی ۱ دقیقه‌ای ملی‌پیامک */}
        <Card padding="lg" className="lg:col-span-8 space-y-6 border-2 border-[#0057FF]/25">
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
                label="۲. کد الگوی پیامک تاییدشده (bodyId)"
                hint="کد عددی پترن تاییدشده در ملی‌پیامک"
                required
              >
                <Input
                  id="mp-body-id"
                  dir="ltr"
                  value={bodyIdInput}
                  onChange={(e) => setBodyIdInput(e.target.value)}
                  placeholder="کد عددی الگو (bodyId)"
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
                  placeholder={authUser?.phone || 'شماره موبایل ۱۱ رقمی'}
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

        {/* ستون کناری: رمز عبور ثابت مدیر کل + وضعیت پایداری دیتابیس PostgreSQL + متغیرهای لیارا */}
        <div className="lg:col-span-4 space-y-6">
          <Card padding="lg" className="space-y-4 border-2 border-[#0057FF]/25">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#061138]">
                تنظیم یا تغییر رمز عبور ثابت مدیر کل
              </h3>
              <p className="text-xs text-[#64748B]">
                حساب فعال: <strong dir="ltr">{authUser?.phone || 'مدیر کل'}</strong>. با تنظیم رمز عبور ثابت می‌توانید بدون نیاز به پیامک وارد پنل مدیریت کلان شوید.
              </p>
            </div>
            <form onSubmit={handleSaveAdminPassword} className="space-y-3">
              <FormField id="adm-fixed-pass" label="رمز عبور جدید مدیر کل (حداقل ۶ کاراکتر)" required>
                <Input
                  id="adm-fixed-pass"
                  type="password"
                  dir="ltr"
                  placeholder="رمز عبور جدید..."
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                />
              </FormField>
              <Button type="submit" variant="primary" fullWidth isLoading={isSavingAdminPass}>
                ذخیره رمز عبور مدیر کل
              </Button>
            </form>
          </Card>

          <Card padding="lg" className="space-y-4 border-2 border-[#F59E0B]/40 bg-[#FFFBEB]/60">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[#061138]">
                اطلاع‌رسانی هوشمند به مدیر کل (پیامک و پنل)
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                به‌محض ثبت‌نام کسب‌وکار جدید یا ثبت فیش واریزی اشتراک/تبلیغات، هم در بالای پنل مدیریت اعلان دریافت می‌کنید و هم پیامک هشدار به شماره موبایل مدیر کل ارسال می‌شود.
              </p>
            </div>
            <div className="space-y-3">
              <FormField
                id="adm-notify-phone"
                label="شماره موبایل انحصاری مدیر کل (دریافت پیامک و ورود به /admin)"
              >
                <Input
                  id="adm-notify-phone"
                  dir="ltr"
                  value={notifyPhoneInput}
                  onChange={(e) => setNotifyPhoneInput(e.target.value)}
                  placeholder="09138201042"
                />
              </FormField>

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
                <span>ارسال پیامک آنی هنگام ثبت‌نام سالن جدید</span>
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

              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() =>
                  updateAdminNotificationSettings({
                    adminPhone: notifyPhoneInput.trim() || '09138201042',
                  })
                }
              >
                ذخیره تنظیمات اطلاع‌رسانی مدیر
              </Button>
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

          <Card padding="lg" className="space-y-3 bg-[#061138] text-white border-[#1E293B]">
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
