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
} from 'lucide-react';
import { ApprovalStatus, CategoryItem } from '../../types';
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
  const { dataMode, businesses, categories, updateBusinessApproval } =
    usePrototypeData();
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '1y'>('7d');

  const pendingCount = businesses.filter(
    (b) => b.approvalStatus === 'PENDING_REVIEW'
  ).length;
  const activeSubscriptionsCount =
    dataMode === 'real'
      ? businesses.filter(
          (b) =>
            b.subscriptionStatus === 'ACTIVE' ||
            b.subscriptionStatus === 'TRIAL'
        ).length
      : 4;

  // اولویت نمایش با کسب‌وکارهای در انتظار بررسی
  const sortedBusinesses = [...businesses].sort((a, b) => {
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

      {/* ۳. جدول صف بررسی و تایید کسب‌وکارها با ستون‌های مرتب‌سازی — مطابق Capture6.PNG و Capture7.PNG */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1E1B2E]">
            صف بررسی و تایید کسب‌وکارها
          </h2>
          <span className="text-xs text-[#6B6480]">
            تایید یا رد مستقیم وضعیت انتشار کسب‌وکار
          </span>
        </div>

        <ResponsiveTable
          keyExtractor={(b) => b.id}
          data={sortedBusinesses}
          columns={[
            {
              key: 'name',
              header: 'نام کسب‌وکار ↕',
              render: (b) => (
                <div>
                  <p className="font-extrabold text-[#1E1B2E]">{b.name}</p>
                  <p dir="ltr" className="text-[11px] font-mono text-[#6B6480]">
                    /{b.slug}
                  </p>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'نوع فعالیت / شهر ↕',
              render: (b) => (
                <span className="font-medium text-[#6B6480]">
                  {b.typeLabel} · {b.city}
                </span>
              ),
            },
            {
              key: 'price',
              header: 'شروع تعرفه ↕',
              render: (b) => (
                <span className="font-bold text-[#1E1B2E] tabular-nums">
                  {formatPriceToman(b.startingPriceToman)}
                </span>
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
                    variant="outline"
                    size="sm"
                    onClick={() => updateBusinessApproval(b.id, 'APPROVED')}
                  >
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>تایید</span>
                  </Button>
                  <Button
                    variant="ghost"
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
  const { businesses, updateBusinessApproval } = usePrototypeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'ALL'>(
    'ALL'
  );
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);

  const filtered = businesses.filter((b) => {
    const matchQuery =
      b.name.includes(searchQuery.trim()) ||
      b.city.includes(searchQuery.trim());
    const matchStatus =
      statusFilter === 'ALL' || b.approvalStatus === statusFilter;
    return matchQuery && matchStatus;
  });

  const rejectTargetBiz = businesses.find((b) => b.id === rejectTargetId);

  return (
    <div>
      <PageHeader
        kicker="نظارت و عملیات · مراکز زیبایی"
        title="بررسی و تایید کسب‌وکارهای عضو"
        subtitle="جست‌وجو، فیلتر وضعیت احراز و تایید یا رد پروفایل سالن‌ها و متخصصان مستقل"
        routePattern="/admin/businesses"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'کسب‌وکارها' },
        ]}
      />

      <Card className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6E0F5]">
          {[
            { id: 'ALL', label: 'همه مراکز', count: businesses.length },
            {
              id: 'PENDING_REVIEW',
              label: 'در انتظار بررسی',
              count: businesses.filter(
                (b) => b.approvalStatus === 'PENDING_REVIEW'
              ).length,
            },
            {
              id: 'APPROVED',
              label: 'تاییدشده',
              count: businesses.filter((b) => b.approvalStatus === 'APPROVED')
                .length,
            },
            {
              id: 'REJECTED',
              label: 'ردشده',
              count: businesses.filter((b) => b.approvalStatus === 'REJECTED')
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
          <FormField id="adm-biz-search" label="جست‌وجوی نام کسب‌وکار یا شهر">
            <Input
              id="adm-biz-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="مثلاً رویال گلزار یا مشهد..."
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
            header: 'عنوان کسب‌وکار',
            render: (b) => (
              <span className="font-extrabold text-[#1E1B2E]">{b.name}</span>
            ),
          },
          {
            key: 'slug',
            header: 'شناسه مسیر (Slug)',
            render: (b) => (
              <span
                dir="ltr"
                className="font-mono text-xs bg-[#EDE9FE] px-2 py-0.5 rounded text-[#8B5CF6]"
              >
                {b.slug}
              </span>
            ),
          },
          {
            key: 'city',
            header: 'شهر و محله',
            render: (b) => (
              <span>
                {b.city}، {b.neighborhood}
              </span>
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
            header: 'عملیات بررسی',
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
  const { dataMode, adminUsers } = usePrototypeData();
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const sampleUsers = [
    {
      id: 'usr-1',
      name: 'المیرا شمس',
      role: 'مشتری',
      phone: '۰۹۱۲***۴۵۸۱',
      city: 'تهران',
      status: 'فعال',
    },
    {
      id: 'usr-2',
      name: 'مهسا کیانی',
      role: 'مدیر سالن',
      phone: '۰۹۱۲***۱۰۲۰',
      city: 'تهران',
      status: 'فعال',
    },
    {
      id: 'usr-3',
      name: 'سارا راد',
      role: 'متخصص مستقل',
      phone: '۰۹۱۷***۸۸۴۰',
      city: 'شیراز',
      status: 'فعال',
    },
    {
      id: 'usr-4',
      name: 'کیوان رضایی',
      role: 'مشتری',
      phone: '۰۹۱۲***۳۳۰۹',
      city: 'تهران',
      status: 'فعال',
    },
    {
      id: 'usr-5',
      name: 'آرش داوودی',
      role: 'مدیر سالن',
      phone: '۰۹۱۲***۵۵۱۰',
      city: 'تهران',
      status: 'فعال',
    },
  ];

  const sourceUsers =
    dataMode === 'real'
      ? adminUsers.map((u) => ({
          id: u.id,
          name: u.fullName,
          role: u.roleLabel,
          phone: u.phoneMasked,
          city: u.city,
          status: u.isActive ? 'فعال' : 'غیرفعال',
        }))
      : sampleUsers;

  const filtered =
    roleFilter === 'ALL'
      ? sourceUsers
      : sourceUsers.filter((u) => u.role.includes(roleFilter));

  return (
    <div>
      <PageHeader
        kicker="نظارت و عملیات · حساب‌های کاربری"
        title="مدیریت کاربران سامانه"
        subtitle="فهرست مشتریان، صاحبان سالن‌ها و متخصصان مستقل همراه با فیلتر نقش و صفحه‌بندی"
        routePattern="/admin/users"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'کاربران سامانه' },
        ]}
      />

      <Card className="mb-6 max-w-xs">
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
              { value: 'متخصص مستقل', label: 'متخصص مستقل' },
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
            header: 'نام کاربر',
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
            header: 'شماره همراه',
            render: (u) => (
              <span dir="ltr" className="text-xs font-mono tabular-nums">
                {u.phone}
              </span>
            ),
          },
          {
            key: 'city',
            header: 'شهر',
            render: (u) => <span>{u.city}</span>,
          },
          {
            key: 'status',
            header: 'وضعیت',
            render: (u) => <StatusBadge label={u.status} tone="success" />,
          },
        ]}
      />

      <Pagination currentPage={page} totalPages={2} onPageChange={setPage} />
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

/** ۵. مدیریت اشتراک‌ها (/admin/subscriptions) */
export const AdminSubscriptionsPage: React.FC = () => {
  const { plans, businesses } = usePrototypeData();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مالی و اشتراک · پلن‌های ماهانه"
        title="مدیریت پلن‌ها و اشتراک‌های ماهانه"
        subtitle="تعرفه پلن‌های اشتراک و وضعیت اشتراک کسب‌وکارهای عضو"
        routePattern="/admin/subscriptions"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'پلن‌ها و اشتراک‌ها' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <Card key={plan.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#1E1B2E]">
                {plan.name}
              </h2>
              {plan.isRecommended ? (
                <StatusBadge label="پرفروش" tone="accent" />
              ) : null}
            </div>
            <p className="text-xl font-extrabold text-[#8B5CF6] tabular-nums">
              {formatPriceToman(plan.monthlyPriceToman)}
            </p>
            <p className="text-xs text-[#6B6480]">ظرفیت: {plan.staffLimit}</p>
            <p className="text-xs text-[#6B6480] tabular-nums">
              سهمیه پیامک: {toPersianDigits(plan.smsQuotaMonthly)} عدد در ماه
            </p>
          </Card>
        ))}
      </div>

      <ResponsiveTable
        keyExtractor={(b) => b.id}
        data={businesses}
        columns={[
          {
            key: 'name',
            header: 'کسب‌وکار',
            render: (b) => (
              <span className="font-extrabold text-[#1E1B2E]">{b.name}</span>
            ),
          },
          {
            key: 'plan',
            header: 'پلن انتخابی',
            render: (b) => (
              <span className="font-bold text-[#8B5CF6]">
                {b.subscriptionPlan}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'وضعیت اشتراک',
            render: (b) => {
              const meta = getSubscriptionStatusMeta(b.subscriptionStatus);
              return <StatusBadge label={meta.label} tone={meta.tone} />;
            },
          },
        ]}
      />
    </div>
  );
};

/** ۶. تراکنش‌های حق اشتراک (/admin/payments) */
export const AdminPaymentsPage: React.FC = () => {
  const { dataMode } = usePrototypeData();

  const sampleInvoices = [
    {
      id: 'INV-901',
      business: 'سالن زیبایی رویال گلزار',
      plan: 'پلن حرفه‌ای',
      amount: 980000,
      date: '۱۴۰۵/۰۸/۰۱',
      status: 'پرداخت موفق',
    },
    {
      id: 'INV-902',
      business: 'آرایشگاه مردانه پارسه استایل',
      plan: 'پلن حرفه‌ای',
      amount: 980000,
      date: '۱۴۰۵/۰۷/۲۸',
      status: 'پرداخت موفق',
    },
    {
      id: 'INV-903',
      business: 'مرکز تخصصی نیلوفر آبی',
      plan: 'کسب‌وکار پیشرفته',
      amount: 1850000,
      date: '۱۴۰۵/۰۷/۲۵',
      status: 'پرداخت موفق',
    },
    {
      id: 'INV-904',
      business: 'لانژ زیبایی و اسپا آوا',
      plan: 'کسب‌وکار پیشرفته',
      amount: 1850000,
      date: '۱۴۰۵/۰۷/۲۰',
      status: 'پرداخت موفق',
    },
  ];

  const invoices = dataMode === 'real' ? [] : sampleInvoices;

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="مالی و صورتحساب · تراکنش‌های اشتراک"
        title="صورتحساب‌ها و تراکنش‌های اشتراک"
        subtitle={
          dataMode === 'real'
            ? 'فهرست تراکنش‌های تاییدشده درگاه پرداخت'
            : 'گزارش صورتحساب‌های حق اشتراک ماهانه کسب‌وکارها'
        }
        routePattern="/admin/payments"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تراکنش‌های اشتراک' },
        ]}
      />

      {dataMode === 'real' ? (
        <Card className="p-5 space-y-2 border border-[#E6E0F5] bg-[#FAF8FF]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-[#8B5CF6]">
              وضعیت درگاه پرداخت آنلاین: غیرفعال (رزرو بدون پیش‌پرداخت فعال است)
            </p>
            <StatusBadge label="بدون درگاه بانکی فعال" tone="warning" />
          </div>
          <p className="text-xs text-[#6B6480] leading-relaxed">
            در نسخه فعلی، ثبت نوبت مشتریان بدون اجبار به پرداخت آنلاین (تسویه در
            محل سالن) انجام می‌شود و هیچ تراکنش موفقی بدون تاییدیه معتبر سمت
            سرور درگاه بانکی در جدول پرداخت‌ها ثبت نمی‌گردد.
          </p>
        </Card>
      ) : null}

      {invoices.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-bold text-[#1E1B2E]">
            هیچ تراکنش بانکی تاییدشده‌ای در پایگاه داده ثبت نشده است.
          </p>
        </Card>
      ) : (
        <ResponsiveTable
          keyExtractor={(i) => i.id}
          data={invoices}
          columns={[
            {
              key: 'id',
              header: 'شماره صورتحساب',
              render: (i) => (
                <span className="font-mono text-xs font-bold text-[#8B5CF6] bg-[#EDE9FE] px-2 py-0.5 rounded">
                  {i.id}
                </span>
              ),
            },
            {
              key: 'biz',
              header: 'کسب‌وکار',
              render: (i) => (
                <span className="font-extrabold text-[#1E1B2E]">
                  {i.business}
                </span>
              ),
            },
            {
              key: 'plan',
              header: 'پلن اشتراک',
              render: (i) => <span>{i.plan}</span>,
            },
            {
              key: 'date',
              header: 'تاریخ ثبت',
              render: (i) => <span className="tabular-nums">{i.date}</span>,
            },
            {
              key: 'amount',
              header: 'مبلغ (تومان)',
              align: 'left',
              render: (i) => (
                <span className="tabular-nums font-extrabold text-[#8B5CF6]">
                  {formatPriceToman(i.amount)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'وضعیت',
              render: (i) => <StatusBadge label={i.status} tone="success" />,
            },
          ]}
        />
      )}
    </div>
  );
};

/** ۷. گزارش‌های تحلیلی پلتفرم (/admin/reports) */
export const AdminReportsPage: React.FC = () => {
  const cityBreakdown = [
    { city: 'تهران', pct: 50, count: '۳ مرکز فعال' },
    { city: 'شیراز', pct: 17, count: '۱ مرکز فعال' },
    { city: 'اصفهان', pct: 17, count: '۱ مرکز فعال' },
    { city: 'مشهد', pct: 16, count: '۱ مرکز فعال' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="گزارش‌های کلان · آمار پلتفرم"
        title="گزارش‌های تحلیلی کلان پلتفرم"
        subtitle="آمار توزیع جغرافیایی کسب‌وکارها، رشد نوبت‌دهی و نرخ تمدید اشتراک"
        routePattern="/admin/reports"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'گزارش‌های تحلیلی' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h2 className="text-sm font-extrabold text-[#1E1B2E]">
            توزیع کسب‌وکارهای عضو بر اساس شهر
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

/** ۸. تنظیمات کلان سامانه و اتصال آسان ملی‌پیامک (/admin/settings) */
export const AdminSettingsPage: React.FC = () => {
  const { showToast } = usePrototypeData();
  const [brandName, setBrandName] = useState('Timeto (تایم تو)');
  const [trialDays, setTrialDays] = useState('14');

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

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('تنظیمات عمومی پلتفرم ذخیره شد.');
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
        kicker="پیکربندی سامانه · تنظیمات پایه و درگاه پیامک"
        title="تنظیمات کلان و اتصال سریع ملی‌پیامک"
        subtitle="فعال‌سازی مستقیم وب‌سرویس خدماتی ملی‌پیامک (MelliPayamak) با ۳ فیلد ساده و تست زنده ارسال پیامک"
        routePattern="/admin/settings"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تنظیمات و پیامک' },
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

          {/* راهنمای ۳ گام بسیار ساده */}
          <div className="p-4 rounded-2xl bg-[#F3F6FC] border border-[#CBD5E1] space-y-2 text-xs text-[#061138]">
            <p className="font-extrabold text-[#0057FF] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>از کجای پنل ملی‌پیامک این ۲ مورد را بردارم؟</span>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[#334155] leading-relaxed">
              <li>
                وارد{' '}
                <strong className="text-[#061138]">
                  console.melipayamak.com
                </strong>{' '}
                شوید و از منوی <strong>«وب‌سرویس خدماتی (اشتراکی)»</strong> کلید
                یا لینک ارسال را کپی کنید و در کادر اول بگذارید (حتی اگر کل لینک{' '}
                <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded">
                  https://console.melipayamak.com/api/send/shared/...
                </code>{' '}
                را کپی کنید، سیستم خودش توکن را جدا می‌کند).
              </li>
              <li>
                از بخش <strong>«الگوها (پترن‌ها)»</strong> کد عددی الگوی تاییدشده‌ای
                که شامل یک متغیر{' '}
                <code className="font-mono bg-white px-1 rounded">{'{0}'}</code>{' '}
                است (مثلاً <code className="font-mono">184520</code>) را در کادر
                دوم وارد کنید.
              </li>
            </ol>
          </div>

          <form onSubmit={handleSaveMelipayamak} className="space-y-4">
            <FormField
              id="mp-api-key"
              label="۱. کلید وب‌سرویس اشتراکی (API Key) یا لینک کامل کنسول ملی‌پیامک"
              hint={
                maskedSavedKey
                  ? `کلید فعلی ذخیره‌شده: ${maskedSavedKey} (در صورت عدم تغییر، خالی بگذارید)`
                  : 'مثال: 8f3a9b2c... یا کل آدرس https://console.melipayamak.com/api/send/shared/...'
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
                    ? `Saved: ${maskedSavedKey} (Paste new key to replace)`
                    : 'https://console.melipayamak.com/api/send/shared/YOUR_TOKEN'
                }
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="mp-body-id"
                label="۲. کد الگوی پیامک تاییدشده (bodyId)"
                hint="کد عددی پترن در ملی‌پیامک (مثلاً 184520)"
                required
              >
                <Input
                  id="mp-body-id"
                  dir="ltr"
                  value={bodyIdInput}
                  onChange={(e) => setBodyIdInput(e.target.value)}
                  placeholder="184520"
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
                  placeholder="50004001..."
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
              <span>تست زنده ارسال پیامک به موبایل شما</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              پس از ذخیره تنظیمات بالا، شماره موبایل خود را وارد کنید تا همین الان
              یک پیامک واقعی آزمایشی برایتان ارسال شود:
            </p>
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
                  placeholder="09123456789"
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

        {/* ستون کناری: کپی متغیرهای لیارا + تنظیمات پایه */}
        <div className="lg:col-span-4 space-y-6">
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
            <p className="text-[11px] text-slate-300 leading-relaxed">
              علاوه بر فعال‌سازی آنی از فرم روبرو، می‌توانید این ۴ خط را در بخش
              «متغیرهای محیطی (Env)» لیارا کپی کنید تا پس از ری‌استارت سرور هم
              ثابت بماند:
            </p>
            <pre
              dir="ltr"
              className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed"
            >
              {envSnippet}
            </pre>
          </Card>

          <Card padding="lg">
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#061138] border-b border-[#E2E8F0] pb-2.5">
                تنظیمات عمومی پلتفرم
              </h3>
              <FormField id="adm-brand" label="عنوان تجاری پلتفرم">
                <Input
                  id="adm-brand"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </FormField>
              <FormField
                id="adm-trial"
                label="مدت دوره آزمایشی رایگان کسب‌وکارها (روز)"
              >
                <Input
                  id="adm-trial"
                  dir="ltr"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                />
              </FormField>
              <div className="pt-1">
                <Button type="submit" variant="outline" fullWidth>
                  ذخیره تنظیمات عمومی
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
