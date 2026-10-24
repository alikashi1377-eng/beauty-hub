import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Calendar,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Clock,
  Users,
  Sparkles,
  Check,
  Megaphone,
  ShieldCheck,
  Instagram,
  MapPin,
} from 'lucide-react';
import {
  AppointmentItem,
  AppointmentStatus,
  CustomerRecord,
  ServiceItem,
  SpecialistItem,
} from '../../types';
import {
  formatDurationMinutes,
  formatPriceToman,
  getAppointmentStatusMeta,
  toPersianDigits,
  validateServiceForm,
} from '../../utils/formatters';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { ResponsiveTable } from '../../components/ui/ResponsiveTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { VisualMediaIllustration } from '../../components/ui/VisualMediaIllustration';
import { EmptyState } from '../../components/ui/StateViews';
import {
  Avatar,
  ConfirmationDialog,
  Tabs,
} from '../../components/ui/MarketplaceComponents';
import { LocationMapPicker } from '../../components/ui/LocationMapPicker';

/** ۱. پیشخوان کسب‌وکار (/app) */
export const BusinessDashboardPage: React.FC = () => {
  const { businesses, appointments, services, specialists, customers } =
    usePrototypeData();
  const currentBiz = businesses[0];

  const weeklyActivity = [
    { day: 'شنبه', count: 14, heightPct: 70 },
    { day: 'یکشنبه', count: 11, heightPct: 55 },
    { day: 'دوشنبه', count: 16, heightPct: 80 },
    { day: 'سه‌شنبه', count: 18, heightPct: 90 },
    { day: 'چهارشنبه', count: 19, heightPct: 95 },
    { day: 'پنج‌شنبه', count: 20, heightPct: 100 },
    { day: 'جمعه', count: 4, heightPct: 20 },
  ];

  const pendingAppointments = appointments.filter(
    (a) => a.status === AppointmentStatus.Pending
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="عملیات روزانه · سالن زیبایی رویال گلزار"
        title="پیشخوان مدیریت کسب‌وکار"
        subtitle="پایش لحظه‌ای نوبت‌های روز، عملکرد هفتگی، شاخص‌های مالی دمو و دسترسی سریع به عملیات سالن"
        routePattern="/app"
        breadcrumbs={[{ label: 'پنل کسب‌وکار' }, { label: 'پیشخوان' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/app/services">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                <span>خدمت جدید</span>
              </Button>
            </Link>
            <Link to="/app/calendar">
              <Button variant="primary" size="sm">
                <Calendar className="w-4 h-4" />
                <span>تقویم روزانه</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* ۴ شاخص کلیدی عملکرد با سلسله‌مراتب عددی شفاف */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">نوبت‌های امروز</p>
            <StatusBadge
              label={`${toPersianDigits(pendingAppointments.length)} در انتظار تایید`}
              tone="warning"
            />
          </div>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(8)} نوبت فعال
          </p>
          <p className="text-[11px] text-[#4E4760]">
            اولین مراجعه امروز: ساعت ۱۰:۰۰ صبح
          </p>
        </Card>

        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">
              درآمد ماه جاری (نمونه)
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md tabular-nums">
              <TrendingUp className="w-3 h-3" />
              +۱۴٪
            </span>
          </div>
          <p className="text-xl font-extrabold text-[#2A0F54] tabular-nums">
            {formatPriceToman(64800000)}
          </p>
          <p className="text-[11px] text-[#4E4760] tabular-nums">
            از مجموع ۱۰۲ نوبت انجام‌شده در آبان
          </p>
        </Card>

        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">مشتریان پرونده‌دار</p>
            <Users className="w-4 h-4 text-[#2A0F54]" />
          </div>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(customers.length + 124)} نفر
          </p>
          <p className="text-[11px] text-[#4E4760] tabular-nums">
            {toPersianDigits(services.length)} خدمت فعال ·{' '}
            {toPersianDigits(specialists.length)} متخصص
          </p>
        </Card>

        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">
              نرخ تکمیل نوبت‌ها
            </p>
            <StatusBadge label="عملکرد عالی" tone="success" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 tabular-nums">
            {toPersianDigits(92)}٪
          </p>
          <p className="text-[11px] text-[#4E4760]">
            میانگین رضایت ثبت‌شده: ★ ۴.۹ از ۵
          </p>
        </Card>
      </div>

      {/* نمودار فعالیت هفتگی و صف اولویت‌های امروز */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <Card className="lg:col-span-8 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E3EE] pb-3.5">
            <div>
              <h2 className="text-sm font-extrabold text-[#171226]">
                نمودار تراکم نوبت‌های هفتگی (داده آزمایشی)
              </h2>
              <p className="text-xs text-[#787189] mt-0.5">
                مقایسه تعداد نوبت‌های ثبت‌شده در روزهای هفته جاری
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-extrabold text-[#2A0F54] bg-[#F3E8FF]/70 px-2.5 py-1 rounded-lg tabular-nums">
                مجموع هفته: ۱۰۲ نوبت
              </span>
            </div>
          </div>

          <div className="h-48 pt-6 flex items-end justify-between gap-2 sm:gap-4 border-b border-[#E6E3EE] pb-3 px-2">
            {weeklyActivity.map((item) => {
              const isPeak = item.heightPct >= 95;
              return (
                <div
                  key={item.day}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-[11px] font-extrabold text-[#171226] tabular-nums">
                    {toPersianDigits(item.count)}
                  </span>
                  <div
                    className={`w-full max-w-[42px] rounded-t-xl transition-all ${
                      isPeak
                        ? 'bg-[#9D174D] hover:bg-[#831843]'
                        : 'bg-[#2A0F54] hover:bg-[#1E0A3C]'
                    }`}
                    style={{ height: `${item.heightPct}%` }}
                  />
                  <span className="text-[11px] font-bold text-[#4E4760] whitespace-nowrap">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#787189]">
            <span>پرترافیک‌ترین روزها: چهارشنبه و پنج‌شنبه</span>
            <Link
              to="/app/analytics"
              className="font-extrabold text-[#2A0F54] hover:underline"
            >
              مشاهده گزارش تحلیلی کامل ←
            </Link>
          </div>
        </Card>

        <Card className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="border-b border-[#E6E3EE] pb-3">
              <h2 className="text-sm font-extrabold text-[#171226]">
                عملیات سریع مدیریت سالن
              </h2>
              <p className="text-xs text-[#787189] mt-0.5">
                میانبرهای اجرایی پرکاربرد برای مدیر سالن
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Link to="/app/calendar">
                <Button variant="outline" size="sm" fullWidth>
                  مشاهده تقویم روزانه و شیفت متخصصان
                </Button>
              </Link>
              <Link to="/app/services">
                <Button variant="outline" size="sm" fullWidth>
                  افزودن یا بروزرسانی تعرفه خدمات
                </Button>
              </Link>
              <Link to="/app/working-hours">
                <Button variant="outline" size="sm" fullWidth>
                  تنظیم ساعات کاری و روزهای تعطیل
                </Button>
              </Link>
              <Link to="/app/marketing">
                <Button variant="outline" size="sm" fullWidth>
                  تعریف کمپین تخفیف مشتریان وفادار
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#2A0F54]">
                وضعیت ویترین عمومی
              </span>
              <StatusBadge label="منتشرشده" tone="success" />
            </div>
            <p className="text-[#4E4760] leading-relaxed">
              صفحه اختصاصی «{currentBiz.name}» در بازارچه فعال است.
            </p>
            <div className="pt-1.5 border-t border-[#E6E3EE] space-y-1.5 text-[11px] text-[#4E4760]">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2A0F54] shrink-0 mt-0.5" />
                <span>
                  {currentBiz.city}، {currentBiz.neighborhood} —{' '}
                  {currentBiz.address}
                </span>
              </div>
              {currentBiz.instagramHandle ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[#787189]">
                    <Instagram className="w-3.5 h-3.5 text-[#9D174D]" />
                    <span>اینستاگرام ثبت‌شده:</span>
                  </span>
                  <span
                    dir="ltr"
                    className="font-mono font-bold text-[#9D174D] bg-pink-50 px-2 py-0.5 rounded border border-pink-200"
                  >
                    {currentBiz.instagramHandle.startsWith('@')
                      ? currentBiz.instagramHandle
                      : `@${currentBiz.instagramHandle}`}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-between pt-1">
              <Link
                to={`/salon/${currentBiz.slug}`}
                className="inline-flex items-center gap-1 font-bold text-[#2A0F54] hover:underline"
              >
                <span>مشاهده ویترین سالن</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                to="/app/profile"
                className="text-[11px] font-bold text-[#787189] hover:text-[#2A0F54]"
              >
                ویرایش نشانی و اینستاگرام
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* نوبت‌های اخیر */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#171226]">
              نوبت‌های اخیر ثبت‌شده
            </h2>
            <p className="text-xs text-[#787189]">
              آخرین درخواست‌های رزرو مشتریان در وضعیت دمو
            </p>
          </div>
          <Link
            to="/app/appointments"
            className="text-xs font-extrabold text-[#2A0F54] hover:underline"
          >
            مدیریت کامل نوبت‌ها ←
          </Link>
        </div>

        <ResponsiveTable<AppointmentItem>
          keyExtractor={(row) => row.id}
          data={appointments.slice(0, 5)}
          columns={[
            {
              key: 'code',
              header: 'کد رهگیری',
              render: (row) => (
                <span className="font-mono text-xs font-bold text-[#2A0F54] bg-[#F4F3F8] px-2 py-0.5 rounded">
                  {row.referenceCode}
                </span>
              ),
            },
            {
              key: 'customer',
              header: 'مشتری',
              render: (row) => (
                <div>
                  <p className="font-bold text-[#171226]">{row.customerName}</p>
                  <p dir="ltr" className="text-xs text-[#787189] tabular-nums">
                    {row.customerPhoneMasked}
                  </p>
                </div>
              ),
            },
            {
              key: 'service',
              header: 'خدمت و متخصص',
              render: (row) => (
                <div>
                  <p className="text-[#171226] font-bold">{row.serviceTitle}</p>
                  <p className="text-xs text-[#4E4760]">
                    متخصص: {row.specialistName}
                  </p>
                </div>
              ),
            },
            {
              key: 'datetime',
              header: 'تاریخ و ساعت',
              render: (row) => (
                <span className="text-xs font-semibold text-[#171226] tabular-nums">
                  {row.dateJalali} · ساعت {row.timeSlot}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'وضعیت',
              render: (row) => {
                const meta = getAppointmentStatusMeta(row.status);
                return <StatusBadge label={meta.label} tone={meta.tone} />;
              },
            },
          ]}
        />
      </div>
    </div>
  );
};

/** ۲. تقویم نوبت‌ها (/app/calendar) */
export const BusinessCalendarPage: React.FC = () => {
  const { appointments, specialists, updateAppointmentStatus } =
    usePrototypeData();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);

  const sampleDays = [
    { label: 'یکشنبه ۳ آبان ۱۴۰۵', date: '۱۴۰۵/۰۸/۰۳' },
    { label: 'دوشنبه ۴ آبان ۱۴۰۵', date: '۱۴۰۵/۰۸/۰۴' },
    { label: 'سه‌شنبه ۵ آبان ۱۴۰۵', date: '۱۴۰۵/۰۸/۰۵' },
  ];

  const currentDay = sampleDays[selectedDayIndex] ?? sampleDays[0];
  const timeSlots = ['۰۹:۳۰', '۱۰:۰۰', '۱۱:۰۰', '۱۳:۳۰', '۱۵:۰۰', '۱۷:۰۰'];
  const visibleStaff =
    staffFilter === 'ALL'
      ? specialists.slice(0, 3)
      : specialists.filter((s) => s.id === staffFilter);

  return (
    <div>
      <PageHeader
        kicker="عملیات روزانه · زمان‌بندی"
        title="تقویم زمان‌بندی نوبت‌ها"
        subtitle="نمای ستونی شیفت متخصصان، جابه‌جایی بین روزها و مدیریت سریع وضعیت هر نوبت"
        routePattern="/app/calendar"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تقویم نوبت‌ها' },
        ]}
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6E3EE]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedDayIndex <= 0}
              onClick={() => setSelectedDayIndex((i) => Math.max(0, i - 1))}
              aria-label="روز قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-extrabold text-[#171226] tabular-nums px-3 py-1.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE]">
              {currentDay.label}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedDayIndex >= sampleDays.length - 1}
              onClick={() =>
                setSelectedDayIndex((i) =>
                  Math.min(sampleDays.length - 1, i + 1)
                )
              }
              aria-label="روز بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="فیلتر متخصص در تقویم"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="rounded-xl border border-[#D0CADF] bg-white px-3.5 py-2 text-xs font-bold text-[#171226]"
            >
              <option value="ALL">همه متخصصان (نمای ستونی)</option>
              {specialists.slice(0, 3).map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.fullName}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-[#F4F3F8] p-1 rounded-xl border border-[#E6E3EE]">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  viewMode === 'day'
                    ? 'bg-[#2A0F54] text-white shadow-2xs'
                    : 'text-[#4E4760] hover:text-[#171226]'
                }`}
              >
                نمای روزانه
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  viewMode === 'week'
                    ? 'bg-[#2A0F54] text-white shadow-2xs'
                    : 'text-[#4E4760] hover:text-[#171226]'
                }`}
              >
                خلاصه هفتگی
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'day' ? (
          <div className="overflow-x-auto rounded-xl border border-[#E6E3EE]">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E6E3EE] bg-[#F4F3F8]">
                  <th className="py-3.5 px-3 text-right w-24 font-extrabold text-[#4E4760]">
                    ساعت
                  </th>
                  {visibleStaff.map((sp) => (
                    <th
                      key={sp.id}
                      className="py-3.5 px-4 text-right font-extrabold text-[#171226] border-r border-[#E6E3EE]"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={sp.fullName} size="sm" tone="violet" />
                        <div>
                          <p className="text-xs font-extrabold">{sp.fullName}</p>
                          <p className="text-[11px] font-medium text-[#787189]">
                            {sp.roleTitle}
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3EE]">
                {timeSlots.map((slot) => (
                  <tr key={slot} className="hover:bg-[#FAF9FC]/60">
                    <td className="py-4 px-3 font-extrabold text-[#4E4760] tabular-nums bg-[#FAF9FC]/40">
                      {slot}
                    </td>
                    {visibleStaff.map((sp) => {
                      const matched = appointments.find(
                        (a) =>
                          a.timeSlot === slot &&
                          (a.specialistId === sp.id ||
                            a.specialistName === sp.fullName)
                      );
                      const statusMeta = matched
                        ? getAppointmentStatusMeta(matched.status)
                        : null;
                      return (
                        <td
                          key={sp.id}
                          className="p-2.5 border-r border-[#E6E3EE] align-top"
                        >
                          {matched && statusMeta ? (
                            <button
                              type="button"
                              onClick={() => setSelectedApt(matched)}
                              className="w-full text-right p-3 rounded-xl bg-[#F3E8FF]/65 hover:bg-[#F3E8FF] border border-[#D0CADF] space-y-1.5 cursor-pointer transition-all shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-[#171226]">
                                  {matched.customerName}
                                </span>
                                <StatusBadge
                                  label={statusMeta.label}
                                  tone={statusMeta.tone}
                                />
                              </div>
                              <p className="text-[11px] font-medium text-[#4E4760]">
                                {matched.serviceTitle}
                              </p>
                              <p className="text-[10px] text-[#2A0F54]">
                                کد پیگیری:{' '}
                                <span dir="ltr" className="font-mono font-bold">
                                  {matched.referenceCode}
                                </span>
                              </p>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl border border-dashed border-[#E6E3EE] text-[#787189] text-[11px] flex items-center justify-between">
                              <span>بازه آزاد</span>
                              <span className="text-[10px]">قابل رزرو</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleDays.map((d) => (
              <div
                key={d.date}
                className="p-4 rounded-2xl border border-[#E6E3EE] bg-[#FAF9FC] space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#E6E3EE] pb-2.5">
                  <p className="text-xs font-extrabold text-[#171226]">
                    {d.label}
                  </p>
                  <span className="text-[11px] text-[#787189] tabular-nums">
                    {d.date}
                  </span>
                </div>
                {appointments.slice(0, 3).map((apt) => (
                  <button
                    key={`${d.date}-${apt.id}`}
                    type="button"
                    onClick={() => setSelectedApt(apt)}
                    className="w-full text-right p-3 rounded-xl bg-white hover:border-[#2A0F54] border border-[#E6E3EE] text-xs space-y-1 cursor-pointer transition-all"
                  >
                    <p className="font-extrabold text-[#171226] tabular-nums">
                      ساعت {apt.timeSlot} — {apt.customerName}
                    </p>
                    <p className="text-[#4E4760]">{apt.serviceTitle}</p>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* مودال جزئیات نوبت در تقویم */}
      <Modal
        isOpen={Boolean(selectedApt)}
        onClose={() => setSelectedApt(null)}
        title="جزئیات و مدیریت وضعیت نوبت"
        description={selectedApt?.referenceCode}
        footer={
          selectedApt ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  updateAppointmentStatus(
                    selectedApt.id,
                    AppointmentStatus.Confirmed
                  );
                  setSelectedApt(null);
                }}
              >
                تایید نوبت
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateAppointmentStatus(
                    selectedApt.id,
                    AppointmentStatus.Completed
                  );
                  setSelectedApt(null);
                }}
              >
                ثبت انجام‌شده
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  updateAppointmentStatus(
                    selectedApt.id,
                    AppointmentStatus.Cancelled
                  );
                  setSelectedApt(null);
                }}
              >
                لغو نوبت
              </Button>
            </div>
          ) : null
        }
      >
        {selectedApt ? (
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">مشتری:</span>
              <span className="font-extrabold text-[#171226]">
                {selectedApt.customerName} ({selectedApt.customerPhoneMasked})
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">خدمت:</span>
              <span className="font-bold text-[#171226]">
                {selectedApt.serviceTitle}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">متخصص:</span>
              <span className="font-bold">{selectedApt.specialistName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E3EE]">
              <span className="text-[#787189]">زمان مراجعه:</span>
              <span className="font-bold tabular-nums">
                {selectedApt.dateJalali} ساعت {selectedApt.timeSlot}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#787189]">مبلغ خدمت:</span>
              <span className="font-extrabold text-[#2A0F54] tabular-nums">
                {formatPriceToman(selectedApt.priceToman)}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

/** ۳. مدیریت نوبت‌ها (/app/appointments) */
export const BusinessAppointmentsPage: React.FC = () => {
  const { appointments, specialists, updateAppointmentStatus } =
    usePrototypeData();
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>(
    'ALL'
  );
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [detailApt, setDetailApt] = useState<AppointmentItem | null>(null);

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchStaff =
      staffFilter === 'ALL' || a.specialistName === staffFilter;
    const matchDate = dateFilter === 'ALL' || a.dateJalali === dateFilter;
    return matchStatus && matchStaff && matchDate;
  });

  return (
    <div>
      <PageHeader
        kicker="عملیات روزانه · فهرست نوبت‌ها"
        title="مدیریت و پایش نوبت‌ها"
        subtitle="فیلتر چندبعدی بر اساس وضعیت، متخصص و تاریخ همراه با تغییر وضعیت فوری"
        routePattern="/app/appointments"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'مدیریت نوبت‌ها' },
        ]}
      />

      <Card className="mb-6 space-y-4">
        {/* نوار وضعیت سریع */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6E3EE]">
          {[
            { id: 'ALL', label: 'همه نوبت‌ها', count: appointments.length },
            {
              id: AppointmentStatus.Pending,
              label: 'در انتظار تایید',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Pending
              ).length,
            },
            {
              id: AppointmentStatus.Confirmed,
              label: 'تاییدشده',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Confirmed
              ).length,
            },
            {
              id: AppointmentStatus.Completed,
              label: 'انجام‌شده',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Completed
              ).length,
            },
            {
              id: AppointmentStatus.Cancelled,
              label: 'لغوشده',
              count: appointments.filter(
                (a) => a.status === AppointmentStatus.Cancelled
              ).length,
            },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setStatusFilter(tab.id as AppointmentStatus | 'ALL')
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#2A0F54] text-white'
                    : 'bg-[#FAF9FC] text-[#4E4760] border border-[#E6E3EE] hover:text-[#171226]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[11px] tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-[#E6E3EE]'
                  }`}
                >
                  {toPersianDigits(tab.count)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField id="apt-status-filter" label="فیلتر وضعیت">
            <Select
              id="apt-status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as AppointmentStatus | 'ALL')
              }
              options={[
                { value: 'ALL', label: 'همه وضعیت‌ها' },
                { value: AppointmentStatus.Confirmed, label: 'تاییدشده' },
                { value: AppointmentStatus.Pending, label: 'در انتظار تایید' },
                { value: AppointmentStatus.Completed, label: 'انجام‌شده' },
                { value: AppointmentStatus.Cancelled, label: 'لغوشده' },
              ]}
            />
          </FormField>

          <FormField id="apt-staff-filter" label="فیلتر متخصص">
            <Select
              id="apt-staff-filter"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'همه متخصصان' },
                ...specialists.map((sp) => ({
                  value: sp.fullName,
                  label: sp.fullName,
                })),
              ]}
            />
          </FormField>

          <FormField id="apt-date-filter" label="فیلتر تاریخ مراجعه">
            <Select
              id="apt-date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'همه تاریخ‌ها' },
                { value: '۱۴۰۵/۰۸/۰۳', label: '۱۴۰۵/۰۸/۰۳' },
                { value: '۱۴۰۵/۰۸/۰۲', label: '۱۴۰۵/۰۸/۰۲' },
                { value: '۱۴۰۵/۰۸/۰۱', label: '۱۴۰۵/۰۸/۰۱' },
              ]}
            />
          </FormField>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="نوبتی با این فیلترها یافت نشد"
          onAction={() => {
            setStatusFilter('ALL');
            setStaffFilter('ALL');
            setDateFilter('ALL');
          }}
        />
      ) : (
        <ResponsiveTable<AppointmentItem>
          keyExtractor={(r) => r.id}
          data={filtered}
          columns={[
            {
              key: 'code',
              header: 'کد پیگیری',
              render: (r) => (
                <span className="font-mono text-xs font-bold text-[#2A0F54] bg-[#F4F3F8] px-2 py-0.5 rounded">
                  {r.referenceCode}
                </span>
              ),
            },
            {
              key: 'customer',
              header: 'مشتری و زمان',
              render: (r) => (
                <div>
                  <p className="font-extrabold text-[#171226]">
                    {r.customerName}
                  </p>
                  <p className="text-xs text-[#787189] tabular-nums">
                    {r.dateJalali} · ساعت {r.timeSlot}
                  </p>
                </div>
              ),
            },
            {
              key: 'service',
              header: 'خدمت / متخصص',
              render: (r) => (
                <div>
                  <p className="font-bold text-[#171226]">{r.serviceTitle}</p>
                  <p className="text-xs text-[#4E4760]">{r.specialistName}</p>
                </div>
              ),
            },
            {
              key: 'price',
              header: 'مبلغ',
              align: 'left',
              render: (r) => (
                <span className="tabular-nums font-extrabold text-[#2A0F54]">
                  {formatPriceToman(r.priceToman)}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'وضعیت',
              render: (r) => {
                const meta = getAppointmentStatusMeta(r.status);
                return <StatusBadge label={meta.label} tone={meta.tone} />;
              },
            },
            {
              key: 'action',
              header: 'عملیات',
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailApt(r)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>جزئیات و وضعیت</span>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Modal
        isOpen={Boolean(detailApt)}
        onClose={() => setDetailApt(null)}
        title="مدیریت وضعیت نوبت (نسخه دمو)"
        description={detailApt?.referenceCode}
      >
        {detailApt ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE] space-y-1.5 text-xs">
              <p className="font-extrabold text-[#171226]">
                {detailApt.customerName} — {detailApt.serviceTitle}
              </p>
              <p className="text-[#4E4760]">
                متخصص: {detailApt.specialistName} · زمان: {detailApt.dateJalali}{' '}
                ساعت {detailApt.timeSlot}
              </p>
              {detailApt.notes ? (
                <p className="text-[#787189]">یادداشت: {detailApt.notes}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#171226]">
                تغییر وضعیت آزمایشی نوبت:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { st: AppointmentStatus.Confirmed, label: 'تاییدشده' },
                  { st: AppointmentStatus.Pending, label: 'در انتظار تایید' },
                  { st: AppointmentStatus.Completed, label: 'انجام‌شده' },
                  { st: AppointmentStatus.Cancelled, label: 'لغوشده' },
                ].map((opt) => (
                  <Button
                    key={opt.st}
                    variant={
                      detailApt.status === opt.st ? 'primary' : 'outline'
                    }
                    size="sm"
                    onClick={() => {
                      updateAppointmentStatus(detailApt.id, opt.st);
                      setDetailApt({ ...detailApt, status: opt.st });
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

/** ۴. خدمات و تعرفه‌ها (/app/services) */
export const BusinessServicesPage: React.FC = () => {
  const { services, categories, addService, updateService, deleteService } =
    usePrototypeData();

  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('مو و رنگ');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [priceToman, setPriceToman] = useState('650000');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const uniqueCats = Array.from(new Set(services.map((s) => s.category)));
  const visibleServices =
    selectedCat === 'ALL'
      ? services
      : services.filter((s) => s.category === selectedCat);

  const openAddModal = () => {
    setEditingService(null);
    setTitle('');
    setCategory('مو و رنگ');
    setDurationMinutes('60');
    setPriceToman('650000');
    setDescription('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setTitle(srv.title);
    setCategory(srv.category);
    setDurationMinutes(String(srv.durationMinutes));
    setPriceToman(String(srv.priceToman));
    setDescription(srv.description);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateServiceForm({
      title,
      category,
      durationMinutes: Number(durationMinutes),
      priceToman: Number(priceToman),
    });
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    if (editingService) {
      updateService(editingService.id, {
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes),
        priceToman: Number(priceToman),
        description: description.trim() || 'خدمت تخصصی زیبایی',
      });
    } else {
      addService({
        businessId: 'biz-1',
        categorySlug: 'hair-color',
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes),
        priceToman: Number(priceToman),
        description: description.trim() || 'خدمت تخصصی اضافه‌شده در حالت دمو',
        isActive: true,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="خدمات، تیم و مشتریان · کاتالوگ خدمات"
        title="مدیریت خدمات و تعرفه‌ها"
        subtitle="سازمان‌دهی منوی خدمات سالن، زمان ارائه، تعرفه‌ها و وضعیت نمایش در صفحه رزرو آنلاین"
        routePattern="/app/services"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'خدمات و تعرفه‌ها' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={openAddModal}>
            <Plus className="w-4 h-4" />
            <span>افزودن خدمت جدید</span>
          </Button>
        }
      />

      {/* فیلتر دسته‌بندی خدمات */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCat('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            selectedCat === 'ALL'
              ? 'bg-[#2A0F54] text-white'
              : 'bg-white border border-[#E6E3EE] text-[#4E4760] hover:text-[#171226]'
          }`}
        >
          همه خدمات ({toPersianDigits(services.length)})
        </button>
        {uniqueCats.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCat(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              selectedCat === cat
                ? 'bg-[#2A0F54] text-white'
                : 'bg-white border border-[#E6E3EE] text-[#4E4760] hover:text-[#171226]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ResponsiveTable<ServiceItem>
        keyExtractor={(s) => s.id}
        data={visibleServices}
        columns={[
          {
            key: 'title',
            header: 'عنوان و شرح خدمت',
            render: (s) => (
              <div>
                <p className="font-extrabold text-[#171226]">{s.title}</p>
                <p className="text-xs text-[#787189] mt-0.5">{s.description}</p>
              </div>
            ),
          },
          {
            key: 'cat',
            header: 'لاین خدمتی',
            render: (s) => <StatusBadge label={s.category} tone="primary" />,
          },
          {
            key: 'duration',
            header: 'مدت زمان',
            render: (s) => (
              <span className="tabular-nums text-xs font-semibold text-[#4E4760] inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#787189]" />
                {formatDurationMinutes(s.durationMinutes)}
              </span>
            ),
          },
          {
            key: 'price',
            header: 'تعرفه (تومان)',
            align: 'left',
            render: (s) => (
              <span className="font-extrabold text-[#2A0F54] tabular-nums">
                {formatPriceToman(s.priceToman)}
              </span>
            ),
          },
          {
            key: 'active',
            header: 'وضعیت رزرو',
            render: (s) => (
              <button
                type="button"
                onClick={() =>
                  updateService(s.id, { isActive: !(s.isActive ?? true) })
                }
                className="cursor-pointer"
              >
                <StatusBadge
                  label={s.isActive !== false ? 'فعال در رزرو' : 'غیرفعال'}
                  tone={s.isActive !== false ? 'success' : 'neutral'}
                />
              </button>
            ),
          },
          {
            key: 'actions',
            header: 'عملیات',
            render: (s) => (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(s)}
                  aria-label={`ویرایش ${s.title}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(s)}
                  aria-label={`حذف ${s.title}`}
                  className="text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* مودال افزودن / ویرایش خدمت */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? 'ویرایش خدمت (دمو)' : 'افزودن خدمت جدید (دمو)'}
      >
        <form onSubmit={handleSaveService} className="space-y-4" noValidate>
          <FormField
            id="srv-form-title"
            label="نام خدمت"
            required
            error={formErrors.title}
          >
            <Input
              id="srv-form-title"
              value={title}
              hasError={Boolean(formErrors.title)}
              onChange={(e) => setTitle(e.target.value)}
            />
          </FormField>

          <FormField
            id="srv-form-cat"
            label="دسته‌بندی"
            required
            error={formErrors.category}
          >
            <Select
              id="srv-form-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories.map((c) => ({
                value: c.title,
                label: c.title,
              }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="srv-form-dur"
              label="مدت زمان (دقیقه)"
              required
              error={formErrors.durationMinutes}
            >
              <Input
                id="srv-form-dur"
                dir="ltr"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </FormField>

            <FormField
              id="srv-form-price"
              label="قیمت (تومان)"
              required
              error={formErrors.priceToman}
            >
              <Input
                id="srv-form-price"
                dir="ltr"
                type="number"
                value={priceToman}
                onChange={(e) => setPriceToman(e.target.value)}
              />
            </FormField>
          </div>

          <FormField
            id="srv-form-desc"
            label="توضیحات کوتاه خدمت"
            optionalLabel="اختیاری"
          >
            <Input
              id="srv-form-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              ذخیره خدمت
            </Button>
          </div>
        </form>
      </Modal>

      {/* دیالوگ تایید حذف خدمت */}
      <ConfirmationDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteService(deleteTarget.id);
        }}
        title="تایید حذف خدمت آزمایشی"
        message={`آیا از حذف خدمت «${deleteTarget?.title ?? ''}» از فهرست خدمات سالن اطمینان دارید؟`}
      />
    </div>
  );
};

/** ۵. متخصصان و پرسنل (/app/staff) */
export const BusinessStaffPage: React.FC = () => {
  const { specialists, addSpecialist, updateSpecialist } = usePrototypeData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<SpecialistItem | null>(null);
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');

  const openAdd = () => {
    setEditingStaff(null);
    setFullName('');
    setRoleTitle('');
    setSpecialtiesText('کوتاهی ژورنالی، براشینگ');
    setModalOpen(true);
  };

  const openEdit = (sp: SpecialistItem) => {
    setEditingStaff(sp);
    setFullName(sp.fullName);
    setRoleTitle(sp.roleTitle);
    setSpecialtiesText(sp.specialties.join('، '));
    setModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !roleTitle.trim()) return;
    const specs = specialtiesText
      .split(/[,،]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingStaff) {
      updateSpecialist(editingStaff.id, {
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        specialties: specs.length ? specs : editingStaff.specialties,
      });
    } else {
      addSpecialist({
        businessId: 'biz-1',
        slug: `staff-${Date.now()}`,
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        experienceYears: 4,
        rating: 4.8,
        reviewCount: 12,
        specialties: specs.length ? specs : ['خدمات تخصصی زیبایی'],
        bio: 'عضو تیم تخصصی سالن زیبایی (ثبت‌شده در حالت دمو).',
        isIndependent: false,
        isActive: true,
      });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        kicker="خدمات، تیم و مشتریان · اعضای تیم"
        title="مدیریت متخصصان و پرسنل"
        subtitle="مدیریت اعضای تیم، مهارت‌های تخصصی و وضعیت فعال بودن تقویم پذیرش هر متخصص"
        routePattern="/app/staff"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'متخصصان و پرسنل' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            <span>افزودن متخصص جدید</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {specialists.map((sp) => (
          <Card key={sp.id} className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <Avatar name={sp.fullName} size="lg" tone="violet" />
                  <div>
                    <h2 className="text-base font-extrabold text-[#171226]">
                      {sp.fullName}
                    </h2>
                    <p className="text-xs text-[#2A0F54] font-bold mt-0.5">
                      {sp.roleTitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSpecialist(sp.id, {
                      isActive: !(sp.isActive ?? true),
                    })
                  }
                  className="cursor-pointer"
                >
                  <StatusBadge
                    label={sp.isActive !== false ? 'تقویم فعال' : 'غیرفعال'}
                    tone={sp.isActive !== false ? 'success' : 'neutral'}
                  />
                </button>
              </div>
              <p className="text-xs text-[#4E4760] leading-relaxed">{sp.bio}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sp.specialties.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF9FC] border border-[#E6E3EE] text-[11px] font-semibold text-[#4E4760]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#E6E3EE] flex items-center justify-between text-xs">
              <span className="text-[#787189] font-semibold tabular-nums">
                سابقه: {toPersianDigits(sp.experienceYears)} سال · امتیاز: ★{' '}
                {toPersianDigits(sp.rating)}
              </span>
              <Button variant="outline" size="sm" onClick={() => openEdit(sp)}>
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingStaff ? 'ویرایش اطلاعات متخصص (دمو)' : 'افزودن متخصص جدید (دمو)'
        }
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <FormField id="stf-name" label="نام و نام خانوادگی متخصص" required>
            <Input
              id="stf-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormField>
          <FormField id="stf-role" label="عنوان تخصصی / سمت" required>
            <Input
              id="stf-role"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </FormField>
          <FormField
            id="stf-specs"
            label="مهارت‌ها و خدمات (با ویرگول جدا کنید)"
          >
            <Input
              id="stf-specs"
              value={specialtiesText}
              onChange={(e) => setSpecialtiesText(e.target.value)}
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
              ذخیره اطلاعات
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

/** ۶. پرونده مشتریان (/app/customers) */
export const BusinessCustomersPage: React.FC = () => {
  const { customers, appointments } = usePrototypeData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.fullName.includes(searchQuery.trim()) ||
      c.favoriteService.includes(searchQuery.trim())
  );

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="خدمات، تیم و مشتریان · CRM سالن"
        title="پرونده و سوابق مشتریان"
        subtitle="جست‌وجوی مراجعان، مشاهده فراوانی مراجعات، ارزش طول عمر مشتری و یادداشت‌های تخصصی"
        routePattern="/app/customers"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'پرونده مشتریان' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <FormField
            id="cust-search"
            label="جست‌وجوی نام مشتری یا خدمت پرتکرار"
          >
            <Input
              id="cust-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="مثلاً المیرا شمس یا فیشیال..."
            />
          </FormField>
        </Card>
        <Card variant="muted" className="flex flex-col justify-center space-y-1">
          <p className="text-xs text-[#787189] font-bold">
            مشتریان وفادار (بیش از ۳ مراجعه)
          </p>
          <p className="text-2xl font-extrabold text-[#2A0F54] tabular-nums">
            {toPersianDigits(
              customers.filter((c) => c.totalVisits >= 3).length
            )}{' '}
            نفر در فهرست نمونه
          </p>
        </Card>
      </div>

      <ResponsiveTable<CustomerRecord>
        keyExtractor={(row) => row.id}
        data={filtered}
        columns={[
          {
            key: 'name',
            header: 'نام مشتری',
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <Avatar name={r.fullName} size="sm" tone="rose" />
                <div>
                  <p className="font-extrabold text-[#171226]">{r.fullName}</p>
                  <p className="text-xs text-[#787189]">{r.favoriteService}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'phone',
            header: 'شماره همراه (ماسک‌شده)',
            render: (r) => (
              <span dir="ltr" className="text-xs font-mono tabular-nums">
                {r.phoneMasked}
              </span>
            ),
          },
          {
            key: 'visits',
            header: 'تعداد مراجعات',
            render: (r) => (
              <StatusBadge
                label={`${toPersianDigits(r.totalVisits)} نوبت`}
                tone="primary"
              />
            ),
          },
          {
            key: 'spent',
            header: 'مجموع تراکنش نمونه',
            align: 'left',
            render: (r) => (
              <span className="tabular-nums font-extrabold text-[#2A0F54]">
                {formatPriceToman(r.totalSpentToman)}
              </span>
            ),
          },
          {
            key: 'action',
            header: 'پرونده',
            render: (r) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(r)}
              >
                مشاهده سوابق
              </Button>
            ),
          },
        ]}
      />

      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={`پرونده مشتری: ${selectedCustomer?.fullName ?? ''}`}
        description="سوابق مراجعات آزمایشی و یادداشت‌های خدمتی"
      >
        {selectedCustomer ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE] space-y-2">
              <p>
                <strong className="text-[#171226]">خدمت پرتکرار:</strong>{' '}
                {selectedCustomer.favoriteService}
              </p>
              <p>
                <strong className="text-[#171226]">آخرین مراجعه:</strong>{' '}
                <span className="tabular-nums">
                  {selectedCustomer.lastVisitJalali}
                </span>
              </p>
              <p>
                <strong className="text-[#171226]">یادداشت تخصصی سالن:</strong>{' '}
                {selectedCustomer.notes}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-[#171226]">
                تاریخچه نوبت‌های ثبت‌شده (دمو):
              </h3>
              {appointments
                .filter((a) => a.customerName.includes(selectedCustomer.fullName))
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl border border-[#E6E3EE] flex items-center justify-between"
                  >
                    <span className="font-bold text-[#171226]">
                      {apt.serviceTitle} ({apt.dateJalali})
                    </span>
                    <span className="font-extrabold text-[#2A0F54] tabular-nums">
                      {formatPriceToman(apt.priceToman)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

/** ۷. گالری نمونه کارها (/app/gallery) */
export const BusinessGalleryPage: React.FC = () => {
  const { gallery, addGalleryItem, removeGalleryItem } = usePrototypeData();
  const [title, setTitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('مو و رنگ');

  const handleAddDemoImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGalleryItem({
      businessId: 'biz-1',
      title: title.trim(),
      categoryLabel,
      theme: 'violet',
    });
    setTitle('');
  };

  return (
    <div>
      <PageHeader
        kicker="ویترین و رشد کسب‌وکار · نمونه کارها"
        title="گالری نمونه کارها و تصاویر سالن"
        subtitle="مدیریت قاب‌های تصویری ویترین عمومی سالن برای نمایش کیفیت خدمات به مشتریان"
        routePattern="/app/gallery"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'گالری نمونه کارها' },
        ]}
      />

      <Card className="mb-6">
        <form
          onSubmit={handleAddDemoImage}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <FormField id="gal-title" label="عنوان نمونه کار جدید" required>
            <Input
              id="gal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً نمونه لایت کهکشانی..."
            />
          </FormField>
          <FormField id="gal-cat" label="دسته‌بندی تخصصی">
            <Input
              id="gal-cat"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="primary">
            <Plus className="w-4 h-4" />
            <span>افزودن به گالری ویترین</span>
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {gallery.map((item) => (
          <Card key={item.id} padding="sm" className="space-y-3">
            <VisualMediaIllustration
              theme={item.theme}
              categoryLabel={item.categoryLabel}
              title={item.title}
              city="تهران"
            />
            <div className="flex items-center justify-between text-xs px-1 pt-0.5">
              <div>
                <p className="font-extrabold text-[#171226] truncate">
                  {item.title}
                </p>
                <p className="text-[11px] text-[#787189]">
                  {item.categoryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeGalleryItem(item.id)}
                className="text-red-700 font-semibold hover:underline cursor-pointer shrink-0"
              >
                حذف
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/** ۸. پروفایل عمومی سالن (/app/profile) */
export const BusinessProfileEditPage: React.FC = () => {
  const { businesses, updateBusinessProfile, updateOnboardingDraft } =
    usePrototypeData();
  const currentBiz = businesses[0];

  const [name, setName] = useState(currentBiz.name);
  const [instagramHandle, setInstagramHandle] = useState(
    currentBiz.instagramHandle ?? ''
  );
  const [address, setAddress] = useState(currentBiz.address);
  const [mapLat, setMapLat] = useState<number>(currentBiz.mapLat ?? 35.7596);
  const [mapLng, setMapLng] = useState<number>(currentBiz.mapLng ?? 51.4072);
  const [shortDesc, setShortDesc] = useState(currentBiz.shortDescription);
  const [aboutText, setAboutText] = useState(currentBiz.aboutText);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedInsta = instagramHandle.trim();
    updateBusinessProfile(currentBiz.id, {
      name,
      instagramHandle: cleanedInsta,
      address,
      mapLat,
      mapLng,
      shortDescription: shortDesc,
      aboutText,
    });
    updateOnboardingDraft({
      businessName: name,
      instagramHandle: cleanedInsta,
      address,
      mapLat,
      mapLng,
      shortDescription: shortDesc,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div>
      <PageHeader
        kicker="ویترین و رشد کسب‌وکار · تنظیمات ویترین"
        title="ویرایش پروفایل عمومی کسب‌وکار"
        subtitle="تغییرات نشانی، موقعیت نقشه و آدرس اینستاگرام بلافاصله در صفحه عمومی /salon/royal-golzar نمایش داده می‌شود."
        routePattern="/app/profile"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'پروفایل عمومی سالن' },
        ]}
        actions={
          <Link to={`/salon/${currentBiz.slug}`}>
            <Button variant="outline" size="sm">
              <span>مشاهده ویترین زنده</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <Card padding="lg" className="lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="prof-name" label="نام سالن یا مرکز زیبایی" required>
                <Input
                  id="prof-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>
              <FormField
                id="prof-instagram"
                label="آدرس صفحه اینستاگرام (اختیاری)"
                hint="نمایش در پروفایل عمومی سالن"
              >
                <Input
                  id="prof-instagram"
                  dir="ltr"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@royal_golzar_beauty"
                />
              </FormField>
            </div>

            <FormField id="prof-address" label="نشانی کامل پستی" required>
              <Input
                id="prof-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </FormField>

            <LocationMapPicker
              city={currentBiz.city}
              neighborhood={currentBiz.neighborhood}
              address={address}
              lat={mapLat}
              lng={mapLng}
              onSelectLocation={(coords) => {
                setMapLat(coords.lat);
                setMapLng(coords.lng);
                if (!address.trim() && coords.suggestedAddress) {
                  setAddress(coords.suggestedAddress);
                }
              }}
            />

            <FormField
              id="prof-short"
              label="خلاصه یک‌خطی (نمایش در کارت جست‌وجو)"
            >
              <Input
                id="prof-short"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </FormField>
            <FormField id="prof-about" label="توضیحات کامل معرفی سالن">
              <Textarea
                id="prof-about"
                rows={3}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
              />
            </FormField>
            <div className="pt-2 flex items-center gap-3">
              <Button type="submit" variant="primary">
                ذخیره تغییرات پروفایل (دمو)
              </Button>
              {savedNotice ? (
                <span className="text-xs font-bold text-emerald-700">
                  تغییرات با موفقیت در پروفایل و ویترین عمومی ذخیره شد.
                </span>
              ) : null}
            </div>
          </form>
        </Card>

        <Card variant="muted" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#2A0F54]">
              پیش‌نمایش کارت و موقعیت در ویترین عمومی
            </span>
            <StatusBadge label="زنده" tone="primary" />
          </div>
          <VisualMediaIllustration
            theme="violet"
            categoryLabel={currentBiz.typeLabel}
            title={name}
            city={currentBiz.city}
          />
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-[#171226]">{name}</h3>
            <p className="text-xs text-[#4E4760] leading-relaxed">
              {shortDesc}
            </p>
            <div className="pt-2 border-t border-[#E6E3EE] space-y-1.5 text-xs">
              <p className="text-[#4E4760] flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2A0F54] shrink-0 mt-0.5" />
                <span>{address}</span>
              </p>
              {instagramHandle.trim() ? (
                <p className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[#787189]">
                    <Instagram className="w-3.5 h-3.5 text-[#9D174D]" />
                    <span>صفحه اینستاگرام:</span>
                  </span>
                  <span
                    dir="ltr"
                    className="font-mono font-bold text-[#9D174D] bg-pink-50 px-2 py-0.5 rounded border border-pink-200"
                  >
                    {instagramHandle.trim().startsWith('@')
                      ? instagramHandle.trim()
                      : `@${instagramHandle.trim()}`}
                  </span>
                </p>
              ) : null}
            </div>
            <LocationMapPicker
              city={currentBiz.city}
              neighborhood={currentBiz.neighborhood}
              address={address}
              lat={mapLat}
              lng={mapLng}
              readOnly
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

/** ۹. ساعات کاری هفتگی (/app/working-hours) */
export const BusinessWorkingHoursPage: React.FC = () => {
  const { businesses, updateBusinessWorkingHours } = usePrototypeData();
  const currentBiz = businesses[0];
  const [hours, setHours] = useState(currentBiz.workingHours);

  const handleToggleDay = (index: number) => {
    setHours((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  const handleTimeChange = (
    index: number,
    field: 'openTime' | 'closeTime',
    val: string
  ) => {
    setHours((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: val } : item
      )
    );
  };

  const openDaysCount = hours.filter((h) => h.isOpen).length;

  return (
    <div>
      <PageHeader
        kicker="عملیات روزانه · برنامه پذیرش"
        title="تنظیم ساعات کاری هفتگی"
        subtitle="تعیین روزهای باز یا تعطیل و ویرایش ساعت شروع و پایان پذیرش نوبت آنلاین"
        routePattern="/app/working-hours"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'ساعات کاری هفتگی' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <Card padding="lg" className="lg:col-span-8 space-y-4">
          <div className="divide-y divide-[#E6E3EE]">
            {hours.map((d, idx) => (
              <div
                key={d.dayName}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <label className="inline-flex items-center gap-2.5 font-extrabold text-[#171226] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.isOpen}
                    onChange={() => handleToggleDay(idx)}
                    className="accent-[#2A0F54] w-4 h-4"
                  />
                  <span>{d.dayName}</span>
                </label>

                {d.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={d.openTime}
                      onChange={(e) =>
                        handleTimeChange(idx, 'openTime', e.target.value)
                      }
                      aria-label={`ساعت شروع ${d.dayName}`}
                      className="w-22 rounded-xl border border-[#D0CADF] bg-white px-2.5 py-1.5 text-xs font-bold text-center tabular-nums"
                    />
                    <span className="text-[#787189] text-xs">تا</span>
                    <input
                      type="text"
                      value={d.closeTime}
                      onChange={(e) =>
                        handleTimeChange(idx, 'closeTime', e.target.value)
                      }
                      aria-label={`ساعت پایان ${d.dayName}`}
                      className="w-22 rounded-xl border border-[#D0CADF] bg-white px-2.5 py-1.5 text-xs font-bold text-center tabular-nums"
                    />
                  </div>
                ) : (
                  <StatusBadge label="تعطیل" tone="neutral" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E6E3EE]">
            <Button
              variant="primary"
              onClick={() => updateBusinessWorkingHours(currentBiz.id, hours)}
            >
              ذخیره ساعات کاری (دمو)
            </Button>
          </div>
        </Card>

        <Card variant="muted" className="lg:col-span-4 space-y-3">
          <p className="text-xs font-extrabold text-[#2A0F54]">
            خلاصه برنامه هفتگی
          </p>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(openDaysCount)} روز کاری فعال در هفته
          </p>
          <p className="text-xs text-[#4E4760] leading-relaxed">
            ساعات کاری تنظیم‌شده مستقیماً بازه‌های قابل انتخاب در تقویم رزرو آنلاین
            مشتریان را مشخص می‌کند.
          </p>
        </Card>
      </div>
    </div>
  );
};

/** ۱۰. بازاریابی و کمپین‌ها (/app/marketing) */
export const BusinessMarketingPage: React.FC = () => {
  const { campaigns, addCampaign } = usePrototypeData();
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('15');
  const [segment, setSegment] = useState('مشتریان وفادار');

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCampaign({
      title: title.trim(),
      targetSegment: segment,
      discountPercent: Number(discount) || 10,
      channel: 'کمپین پیامکی شبیه‌سازی‌شده',
      statusLabel: 'فعال (آزمایشی)',
      createdAtJalali: '۱۴۰۵/۰۸/۰۳',
    });
    setTitle('');
  };

  return (
    <div>
      <PageHeader
        kicker="ویترین و رشد کسب‌وکار · باشگاه مشتریان"
        title="بازاریابی و کمپین‌های تخفیف"
        subtitle="طراحی کمپین‌های بازگشت مشتری و تخفیف‌های فصلی (در این مرحله ارسال پیامک شبیه‌سازی شده است)"
        routePattern="/app/marketing"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'بازاریابی و کمپین‌ها' },
        ]}
      />

      <Card className="mb-6">
        <form
          onSubmit={handleCreateCampaign}
          className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <FormField id="cmp-title" label="عنوان کمپین تبلیغاتی" required>
              <Input
                id="cmp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً تخفیف ویژه خدمات ناخن وسط هفته..."
              />
            </FormField>
          </div>
          <FormField id="cmp-segment" label="جامعه هدف">
            <Select
              id="cmp-segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              options={[
                { value: 'مشتریان وفادار', label: 'مشتریان وفادار' },
                { value: 'مشتریان غیرفعال', label: 'مشتریان غیرفعال (۲ ماه)' },
                { value: 'همه مشتریان', label: 'همه مشتریان پرونده‌دار' },
              ]}
            />
          </FormField>
          <FormField id="cmp-disc" label="درصد تخفیف">
            <Input
              id="cmp-disc"
              dir="ltr"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </FormField>
          <Button type="submit" variant="primary">
            <Plus className="w-4 h-4" />
            <span>ایجاد کمپین دمو</span>
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((cmp) => (
          <Card key={cmp.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#9D174D]" />
                <h2 className="text-sm font-extrabold text-[#171226]">
                  {cmp.title}
                </h2>
              </div>
              <StatusBadge label={cmp.statusLabel} tone="success" />
            </div>
            <p className="text-xs text-[#4E4760]">
              مخاطب هدف: <strong>{cmp.targetSegment}</strong> · کانال:{' '}
              {cmp.channel}
            </p>
            <div className="pt-3 border-t border-[#E6E3EE] flex items-center justify-between text-xs text-[#787189] tabular-nums">
              <span className="font-extrabold text-[#2A0F54]">
                تخفیف: {toPersianDigits(cmp.discountPercent)}٪
              </span>
              <span>تاریخ ثبت: {cmp.createdAtJalali}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/** ۱۱. گزارش‌ها و آمار عملکرد (/app/analytics) */
export const BusinessAnalyticsPage: React.FC = () => {
  const popularBreakdown = [
    { name: 'پروتئین‌تراپی و احیای مو', pct: 42, amount: 27200000 },
    { name: 'کوتاهی ژورنالی و براشینگ', pct: 28, amount: 18100000 },
    { name: 'مانیکور روسی و لمینت ناخن', pct: 18, amount: 11600000 },
    { name: 'میکاپ و شینیون محفلی', pct: 12, amount: 7900000 },
  ];

  const monthlyTrend = [
    { month: 'خرداد', value: 41, label: '۴۱ م' },
    { month: 'تیر', value: 48, label: '۴۸ م' },
    { month: 'مرداد', value: 52, label: '۵۲ م' },
    { month: 'شهریور', value: 59, label: '۵۹ م' },
    { month: 'مهر', value: 56, label: '۵۶ م' },
    { month: 'آبان', value: 65, label: '۶۴.۸ م' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="ویترین و رشد کسب‌وکار · هوش تجاری"
        title="گزارش‌ها و آمار عملکرد سالن"
        subtitle="تحلیل درآمد ماهانه، نرخ بازگشت مراجعان و سهم هر لاین خدمتی از کل درآمد"
        routePattern="/app/analytics"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'گزارش‌ها و آمار' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#787189]">
            درآمد کل ماه جاری (داده نمونه)
          </p>
          <p className="text-2xl font-extrabold text-[#2A0F54] tabular-nums">
            {formatPriceToman(64800000)}
          </p>
          <p className="text-xs text-emerald-700 font-semibold">
            بر اساس ۱۰۲ نوبت انجام‌شده (+۱۴٪ رشد)
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#787189]">
            نرخ بازگشت مجدد مشتریان
          </p>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(76)}٪
          </p>
          <p className="text-xs text-[#4E4760]">
            مراجعه بیش از ۲ بار در فصل جاری
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#787189]">
            میانگین امتیاز رضایت مشتریان
          </p>
          <p className="text-2xl font-extrabold text-amber-600 tabular-nums">
            ★ {toPersianDigits(4.9)} از ۵
          </p>
          <p className="text-xs text-[#4E4760]">بر اساس ۱۴۲ دیدگاه نمونه</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold text-[#171226]">
            سهم خدمات پرطرفدار از درآمد ماهانه
          </h2>
          <div className="space-y-4">
            {popularBreakdown.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#171226]">
                    {item.name}
                  </span>
                  <span className="tabular-nums text-[#4E4760] font-semibold">
                    {toPersianDigits(item.pct)}٪ ({formatPriceToman(item.amount)}
                    )
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F4F3F8] overflow-hidden">
                  <div
                    className="h-full bg-[#2A0F54] rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#171226]">
              روند ۶ ماهه درآمد سالن (میلیون تومان)
            </h2>
            <p className="text-xs text-[#787189] mt-0.5">
              رشد پیوسته پس از فعال‌سازی رزرو آنلاین
            </p>
          </div>

          <div className="h-40 pt-4 flex items-end justify-between gap-2 border-b border-[#E6E3EE] pb-2">
            {monthlyTrend.map((m) => (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <span className="text-[10px] font-bold text-[#4E4760] tabular-nums">
                  {m.label}
                </span>
                <div
                  className="w-full max-w-[30px] rounded-t-lg bg-[#2A0F54]"
                  style={{ height: `${Math.round((m.value / 70) * 100)}%` }}
                />
                <span className="text-[11px] font-semibold text-[#787189]">
                  {m.month}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

/** ۱۲. اشتراک و صورتحساب (/app/subscription) */
export const BusinessSubscriptionPage: React.FC = () => {
  const { plans, activePlanId, setActivePlanId, showToast } =
    usePrototypeData();
  const currentPlan =
    plans.find((p) => p.id === activePlanId) ?? plans[1];

  return (
    <div>
      <PageHeader
        kicker="حساب و تنظیمات · اشتراک ماهانه"
        title="مدیریت اشتراک ماهانه کسب‌وکار"
        subtitle="مشاهده پلن فعال، سهمیه پیامک ماهانه و تغییر آزمایشی پلن (بدون اتصال به درگاه بانکی در این مرحله)"
        routePattern="/app/subscription"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'اشتراک و ارتقا' },
        ]}
      />

      <Card variant="dark" className="mb-7 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#F5D0FE]">
              پلن فعال فعلی شما (حالت دمو):
            </span>
            <h2 className="text-xl font-extrabold text-white">
              {currentPlan.name}
            </h2>
            <p className="text-xs text-[#E9D5FF] tabular-nums">
              ظرفیت پرسنل: {currentPlan.staffLimit} · سهمیه پیامک ماهانه:{' '}
              {toPersianDigits(currentPlan.smsQuotaMonthly)} عدد
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white tabular-nums">
              اعتبار آزمایشی: ۲۴ روز باقیمانده
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === activePlanId;
          return (
            <Card
              key={plan.id}
              className={`space-y-5 flex flex-col justify-between ${
                isCurrent ? 'border-2 border-[#2A0F54] shadow-md' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#171226]">
                    {plan.name}
                  </h3>
                  {isCurrent ? (
                    <StatusBadge label="پلن فعال شما" tone="success" />
                  ) : null}
                </div>
                <p className="text-xl font-extrabold text-[#2A0F54] tabular-nums">
                  {formatPriceToman(plan.monthlyPriceToman)}
                  <span className="text-xs font-normal text-[#787189]">
                    {' '}
                    / ماهانه
                  </span>
                </p>
                <p className="text-xs text-[#4E4760]">{plan.audience}</p>
                <ul className="space-y-2 pt-3 border-t border-[#E6E3EE] text-xs text-[#171226]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant={isCurrent ? 'outline' : 'primary'}
                size="sm"
                fullWidth
                disabled={isCurrent}
                onClick={() => {
                  setActivePlanId(plan.id);
                  showToast(
                    `پلن آزمایشی کسب‌وکار به «${plan.name}» تغییر یافت (بدون پرداخت واقعی).`
                  );
                }}
              >
                {isCurrent ? 'پلن انتخاب‌شده' : `ارتقا / تغییر به ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/** ۱۳. تنظیمات پنل کسب‌وکار (/app/settings) */
export const BusinessSettingsPage: React.FC = () => {
  const { showToast } = usePrototypeData();
  const [activeTab, setActiveTab] = useState('booking_rules');

  return (
    <div>
      <PageHeader
        kicker="حساب و تنظیمات · پیکربندی سالن"
        title="تنظیمات پنل کسب‌وکار"
        subtitle="مدیریت قوانین نوبت‌دهی، ترجیحات اطلاع‌رسانی پیامکی و امنیت حساب در حالت دمو"
        routePattern="/app/settings"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تنظیمات پنل' },
        ]}
      />

      <div className="max-w-2xl space-y-5">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'booking_rules', label: 'قوانین رزرو و لغو' },
            { id: 'notifications', label: 'اعلان‌ها و پیامک' },
            { id: 'security', label: 'امنیت و دسترسی' },
          ]}
        />

        <Card padding="lg" className="space-y-5">
          {activeTab === 'booking_rules' ? (
            <>
              <FormField
                id="set-buffer"
                label="فاصله استراحت بین دو نوبت متوالی"
                hint="این زمان برای آماده‌سازی میز کار بین دو مراجع در نظر گرفته می‌شود"
              >
                <Select
                  id="set-buffer"
                  defaultValue="15"
                  options={[
                    { value: '0', label: 'بدون فاصله' },
                    { value: '15', label: '۱۵ دقیقه' },
                    { value: '30', label: '۳۰ دقیقه' },
                  ]}
                />
              </FormField>

              <FormField
                id="set-cancel"
                label="حداقل زمان مجاز برای لغو نوبت توسط مشتری"
              >
                <Select
                  id="set-cancel"
                  defaultValue="24"
                  options={[
                    { value: '12', label: '۱۲ ساعت پیش از نوبت' },
                    { value: '24', label: '۲۴ ساعت پیش از نوبت' },
                    { value: '48', label: '۴۸ ساعت پیش از نوبت' },
                  ]}
                />
              </FormField>
            </>
          ) : activeTab === 'notifications' ? (
            <div className="space-y-3 text-xs sm:text-sm text-[#171226]">
              <label className="flex items-center justify-between py-2.5 border-b border-[#E6E3EE] cursor-pointer">
                <span className="font-bold">
                  ارسال پیامک تایید بلافاصله پس از ثبت نوبت
                </span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#2A0F54] w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between py-2.5 border-b border-[#E6E3EE] cursor-pointer">
                <span className="font-bold">
                  ارسال یادآور ۲۴ ساعت مانده به زمان مراجعه
                </span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#2A0F54] w-4 h-4"
                />
              </label>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE] flex items-start gap-3 text-xs text-[#4E4760]">
              <ShieldCheck className="w-5 h-5 text-[#2A0F54] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                در نسخه تجاری، نشست‌های فعال، سطوح دسترسی منشی و متخصصان و احراز
                هویت دو مرحله‌ای پیامکی در این بخش مدیریت می‌شوند.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() =>
                showToast('تنظیمات پنل کسب‌وکار در وضعیت فرانت‌اند ذخیره شد.')
              }
            >
              ذخیره تنظیمات آزمایشی
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
