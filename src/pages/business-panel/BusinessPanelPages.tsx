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
  Check,
  X,
  Megaphone,
  ShieldCheck,
  Instagram,
  MapPin,
  CheckCircle2,
  AlertCircle,
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
  getUpcomingJalaliDays,
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
import { ProfilePhotoUploader } from '../../components/ui/ProfilePhotoUploader';
import { MelipayamakQuickSetupCard } from '../../components/ui/MelipayamakQuickSetupCard';

/** ۱. پیشخوان عملیاتی کسب‌وکار (/app) — بازطراحی کامل مطابق Capture2.PNG (Salonia) و Capture8.PNG (Zolmilon) */
export const BusinessDashboardPage: React.FC = () => {
  const {
    dataMode,
    currentBusiness,
    businesses,
    appointments,
    services,
    specialists,
    customers,
    updateAppointmentStatus,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  const pendingAppointments = appointments.filter(
    (a) => a.status === AppointmentStatus.Pending
  );
  const confirmedAppointments = appointments.filter(
    (a) => a.status === AppointmentStatus.Confirmed
  );
  const activeAppointmentsCount =
    dataMode === 'real'
      ? pendingAppointments.length + confirmedAppointments.length
      : Math.max(pendingAppointments.length + confirmedAppointments.length, 8);

  const realRevenueToman = appointments
    .filter(
      (a) =>
        a.status === AppointmentStatus.Completed ||
        a.status === AppointmentStatus.Confirmed
    )
    .reduce((sum, a) => sum + (Number(a.priceToman) || 0), 0);

  const displayedRevenue = dataMode === 'real' ? realRevenueToman : 64800000;
  const displayedCustomersCount =
    dataMode === 'real' ? customers.length : customers.length + 124;

  const bizServicesCount = currentBiz
    ? services.filter(
        (s) => s.businessId === currentBiz.id && s.isActive !== false
      ).length
    : services.length;
  const bizSpecialists = currentBiz
    ? specialists.filter(
        (sp) => sp.businessId === currentBiz.id && sp.isActive !== false
      )
    : specialists.slice(0, 4);

  const scheduleBlocks = [
    {
      time: '۰۹:۳۰ - ۱۱:۰۰',
      title: appointments[0]?.serviceTitle || 'بالیاژ و لایت تخصصی مو',
      customer: appointments[0]?.customerName || 'المیرا شمس',
      specialist: bizSpecialists[0]?.fullName || 'مهسا کیانی',
      tone: 'bg-[#EDE9FE] border-[#EDE9FE] text-[#8B5CF6]',
      dot: 'bg-[#8B5CF6]',
    },
    {
      time: '۱۱:۰۰ - ۱۲:۳۰',
      title: appointments[1]?.serviceTitle || 'طراحی و کاشت ناخن ژلیش',
      customer: appointments[1]?.customerName || 'نگار رحیمی',
      specialist: bizSpecialists[1]?.fullName || 'نیلوفر تهرانی',
      tone: 'bg-[#FFFBEB] border-[#FDE68A] text-[#8B5CF6]',
      dot: 'bg-[#8B5CF6]',
    },
    {
      time: '۱۳:۳۰ - ۱۵:۰۰',
      title: appointments[2]?.serviceTitle || 'فیشیال تخصصی و آبرسانی',
      customer: appointments[2]?.customerName || 'پریسا نادری',
      specialist: bizSpecialists[2]?.fullName || 'سارا راد',
      tone: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#10B981]',
      dot: 'bg-[#10B981]',
    },
    {
      time: '۱۵:۳۰ - ۱۷:۰۰',
      title: 'پروتئین‌تراپی و احیای مو',
      customer: 'ترانه کاظمی',
      specialist: bizSpecialists[0]?.fullName || 'مهسا کیانی',
      tone: 'bg-[#EDE9FE] border-[#EDE9FE] text-[#8B5CF6]',
      dot: 'bg-[#8B5CF6]',
    },
  ].filter(
    (b) =>
      selectedStaffFilter === 'ALL' || b.specialist === selectedStaffFilter
  );

  return (
    <div className="space-y-6">
      {/* نوار کنترل بالایی و فیلتر سالن/متخصص/تاریخ — مطابق Zolmilon در Capture8.PNG */}
      <div className="rounded-3xl bg-white border border-[#E6E0F5] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#8B5CF6] font-bold">
            <span>پنل مدیریت سالن · {currentBiz?.name ?? 'کسب‌وکار شما'}</span>
            <StatusBadge label="رزرو آنلاین فعال" tone="success" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1E1B2E]">
            پیشخوان روزانه و تقویم عملیاتی سالن
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="فیلتر متخصص"
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="rounded-full border border-[#D4C9EE] bg-[#FAF8FF] px-4 py-2 text-xs font-bold text-[#1E1B2E] focus:outline-none cursor-pointer"
          >
            <option value="ALL">همه متخصصان ({toPersianDigits(bizSpecialists.length)})</option>
            {bizSpecialists.map((sp) => (
              <option key={sp.id} value={sp.fullName}>
                {sp.fullName}
              </option>
            ))}
          </select>

          <Link to="/app/services">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" />
              <span>خدمت جدید</span>
            </Button>
          </Link>

          <Link to="/app/calendar">
            <Button variant="primary" size="sm">
              <Calendar className="w-4 h-4" />
              <span>تقویم کامل</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* چیدمان ۳ ستونی دسکتاپ: ستون میانی (KPIهای موج‌دار + نمودارها + جدول زمان‌بندی) + ستون چپ (برنامه امروز + تقویم ماهانه) — مطابق Capture2.PNG و Capture8.PNG */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ستون اصلی میانی (۸ ستون) */}
        <div className="xl:col-span-8 space-y-6">
          {/* ۱. سه کارت شاخص کلیدی با نمودار موجی SVG (Sparkline Area Cards) — دقیقاً مطابق Salonia در Capture2.PNG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* کارت ۱: فروش کل */}
            <Card padding="none" className="rounded-3xl overflow-hidden border border-[#E6E0F5] bg-white">
              <div className="p-5 pb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B6480]">
                    {dataMode === 'real' ? 'ارزش نوبت‌های ثبت‌شده' : 'فروش و کارکرد ماه'}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] text-[11px] font-extrabold tabular-nums">
                    ↗ +۱۲٪
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
                  {formatPriceToman(displayedRevenue)}
                </p>
              </div>
              <svg viewBox="0 0 240 56" className="w-full h-14 block" aria-hidden="true">
                <defs>
                  <linearGradient id="spark-plum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,44 C40,42 65,18 110,24 C155,30 185,8 240,12 L240,56 L0,56 Z"
                  fill="url(#spark-plum)"
                />
                <path
                  d="M0,44 C40,42 65,18 110,24 C155,30 185,8 240,12"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </Card>

            {/* کارت ۲: نوبت‌های فعال */}
            <Card padding="none" className="rounded-3xl overflow-hidden border border-[#E6E0F5] bg-white">
              <div className="p-5 pb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B6480]">
                    نوبت‌های فعال امروز
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#8B5CF6] text-[11px] font-extrabold tabular-nums">
                    ↗ +۱۸٪
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
                  {toPersianDigits(activeAppointmentsCount)} نوبت فعال
                </p>
              </div>
              <svg viewBox="0 0 240 56" className="w-full h-14 block" aria-hidden="true">
                <defs>
                  <linearGradient id="spark-berry" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,40 C50,35 80,28 125,16 C170,4 200,22 240,10 L240,56 L0,56 Z"
                  fill="url(#spark-berry)"
                />
                <path
                  d="M0,40 C50,35 80,28 125,16 C170,4 200,22 240,10"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </Card>

            {/* کارت ۳: مشتریان فعال */}
            <Card padding="none" className="rounded-3xl overflow-hidden border border-[#E6E0F5] bg-white">
              <div className="p-5 pb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B6480]">
                    مشتریان پرونده‌دار
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] text-[11px] font-extrabold tabular-nums">
                    {toPersianDigits(bizServicesCount)} خدمت
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
                  {toPersianDigits(displayedCustomersCount)} مشتری
                </p>
              </div>
              <svg viewBox="0 0 240 56" className="w-full h-14 block" aria-hidden="true">
                <defs>
                  <linearGradient id="spark-emerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,46 C45,36 95,38 140,22 C185,6 210,16 240,8 L240,56 L0,56 Z"
                  fill="url(#spark-emerald)"
                />
                <path
                  d="M0,46 C45,36 95,38 140,22 C185,6 210,16 240,8"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </Card>
          </div>

          {/* ۲. صف تایید فوری نوبت‌های در انتظار */}
          <Card className="rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E0F5] pb-3.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                <div>
                  <h2 className="text-sm font-extrabold text-[#1E1B2E]">
                    نوبت‌های در انتظار تایید و اقدام فوری
                  </h2>
                  <p className="text-xs text-[#6B6480] mt-0.5">
                    تایید یا لغو مستقیم درخواست‌های جدید بدون نیاز به ترک پیشخوان
                  </p>
                </div>
              </div>
              <Link
                to="/app/appointments"
                className="text-xs font-bold text-[#8B5CF6] hover:underline"
              >
                همه نوبت‌ها ←
              </Link>
            </div>

            {pendingAppointments.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#E6E0F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#10B981] inline-flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#1E1B2E]">
                      همه نوبت‌های ورودی بررسی شده‌اند
                    </p>
                    <p className="text-xs text-[#6B6480]">
                      هیچ نوبت در انتظار تاییدی در صف وجود ندارد.
                    </p>
                  </div>
                </div>
                <Link to="/app/calendar">
                  <Button variant="outline" size="sm">
                    مشاهده تقویم امروز
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#E6E0F5]">
                {pendingAppointments.slice(0, 4).map((apt) => (
                  <div
                    key={apt.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={apt.customerName} size="sm" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold text-[#1E1B2E]">
                            {apt.customerName}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#8B5CF6] bg-[#EDE9FE] px-2 py-0.5 rounded-md">
                            {apt.referenceCode}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6480]">
                          <strong className="text-[#1E1B2E]">
                            {apt.serviceTitle}
                          </strong>{' '}
                          · متخصص: {apt.specialistName} ·{' '}
                          <span className="tabular-nums font-bold text-[#8B5CF6]">
                            {apt.dateJalali} ساعت {apt.timeSlot}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          updateAppointmentStatus(
                            apt.id,
                            AppointmentStatus.Confirmed
                          )
                        }
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید نوبت</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateAppointmentStatus(
                            apt.id,
                            AppointmentStatus.Cancelled
                          )
                        }
                      >
                        <X className="w-3.5 h-3.5 text-[#EF4444]" />
                        <span>لغو</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ۳. بخش تحلیلی دو ستونی: نمودار روند درآمد (Revenue Overview) + نمودار دونات ترکیب خدمات (Service Breakdown) — دقیقاً مطابق Capture2.PNG */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* نمودار روند درآمد ماهانه */}
            <Card className="md:col-span-7 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#1E1B2E]">
                    نمودار روند درآمد سالن (Revenue Overview)
                  </h2>
                  <p className="text-[11px] text-[#6B6480]">
                    روند کارکرد ۶ ماه اخیر به تومان
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EDE9FE] text-[#8B5CF6] text-[11px] font-bold">
                  نیم‌سال اول ۱۴۰۵
                </span>
              </div>

              <div className="pt-2">
                <svg viewBox="0 0 420 170" className="w-full h-40 overflow-visible">
                  <defs>
                    <linearGradient id="rev-area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {[30, 70, 110, 145].map((y) => (
                    <line
                      key={y}
                      x1="10"
                      y1={y}
                      x2="410"
                      y2={y}
                      stroke="#F3EEFF"
                      strokeDasharray="4 4"
                    />
                  ))}
                  <path
                    d="M15,125 C75,115 110,75 160,82 C210,89 250,42 310,48 C355,52 385,22 405,18 L405,145 L15,145 Z"
                    fill="url(#rev-area-grad)"
                  />
                  <path
                    d="M15,125 C75,115 110,75 160,82 C210,89 250,42 310,48 C355,52 385,22 405,18"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {[
                    { x: 15, y: 125, m: 'فروردین' },
                    { x: 95, y: 96, m: 'اردیبهشت' },
                    { x: 175, y: 82, m: 'خرداد' },
                    { x: 255, y: 55, m: 'تیر' },
                    { x: 330, y: 45, m: 'مرداد' },
                    { x: 405, y: 18, m: 'شهریور' },
                  ].map((pt) => (
                    <g key={pt.m}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill="#FFFFFF"
                        stroke="#8B5CF6"
                        strokeWidth="2.5"
                      />
                      <text
                        x={pt.x}
                        y="165"
                        textAnchor="middle"
                        className="fill-[#6B6480] text-[10px] font-bold"
                      >
                        {pt.m}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </Card>

            {/* نمودار دونات ترکیب خدمات (Service Breakdown) — مطابق Capture2.PNG */}
            <Card className="md:col-span-5 rounded-3xl flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-[#1E1B2E]">
                  ترکیب خدمات (Service Breakdown)
                </h2>
                <p className="text-[11px] text-[#6B6480]">
                  سهم لاین‌های زیبایی از کل رزروها
                </p>
              </div>

              <div className="flex items-center justify-center py-1">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#F3EEFF"
                      strokeWidth="5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="5"
                      strokeDasharray="35 65"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="5"
                      strokeDasharray="25 75"
                      strokeDashoffset="-35"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="5"
                      strokeDasharray="20 80"
                      strokeDashoffset="-60"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="5"
                      strokeDasharray="20 80"
                      strokeDashoffset="-80"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-extrabold text-[#1E1B2E] tabular-nums">
                      ۱۰۰٪
                    </span>
                    <span className="text-[10px] text-[#6B6480]">کل خدمات</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  <span className="text-[#6B6480] truncate">رنگ و لایت (۳۵٪)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  <span className="text-[#6B6480] truncate">طراحی ناخن (۲۵٪)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="text-[#6B6480] truncate">فیشیال پوست (۲۰٪)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <span className="text-[#6B6480] truncate">استایل مو (۲۰٪)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* ۴. جدول زمان‌بندی روزانه متخصصان با بلوک‌های پاستلی رنگی (Day Schedule) — دقیقاً مطابق Zolmilon در Capture8.PNG */}
          <Card className="rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E0F5] pb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#1E1B2E]">
                  جدول زمان‌بندی روزانه متخصصان (Day Schedule)
                </h2>
                <p className="text-xs text-[#6B6480]">
                  بلوک‌های رنگی به تفکیک هر متخصص در تقویم امروز
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {bizSpecialists.slice(0, 3).map((sp, i) => {
                  const dotColors = [
                    'bg-[#8B5CF6]',
                    'bg-[#8B5CF6]',
                    'bg-[#10B981]',
                  ];
                  return (
                    <span
                      key={sp.id}
                      className="inline-flex items-center gap-1.5 font-bold text-[#6B6480]"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          dotColors[i % dotColors.length]
                        }`}
                      />
                      <span>{sp.fullName}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {scheduleBlocks.map((blk, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-3 text-xs font-extrabold text-[#6B6480] tabular-nums">
                    {blk.time}
                  </div>
                  <div
                    className={`sm:col-span-9 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${blk.tone}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={blk.specialist} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-extrabold truncate">
                          {blk.title}
                        </p>
                        <p className="text-[11px] opacity-85 truncate">
                          مراجع: {blk.customer} · متخصص: {blk.specialist}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/app/calendar"
                      className="px-3 py-1 rounded-full bg-white/80 hover:bg-white text-[11px] font-bold shrink-0"
                    >
                      جزئیات
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ستون کناری چپ (۴ ستون): برنامه امروز (Today's Schedule) + تقویم ماهانه — دقیقاً مطابق Salonia در Capture2.PNG */}
        <div className="xl:col-span-4 space-y-6">
          {/* ۱. برنامه امروز (Today's Schedule) با تایم‌لاین عمودی و کارت‌های یاسی */}
          <Card className="rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1E1B2E]">
                  برنامه امروز (Today&apos;s Schedule)
                </h2>
                <p className="text-[11px] text-[#6B6480]">
                  نوبت‌های پیش‌روی امروز به ترتیب ساعت
                </p>
              </div>
              <Link
                to="/app/appointments"
                className="text-xs font-bold text-[#8B5CF6] hover:underline"
              >
                همه
              </Link>
            </div>

            <div className="space-y-3.5 relative before:absolute before:top-3 before:bottom-3 before:right-[19px] before:w-0.5 before:bg-[#EDE9FE]">
              {(appointments.slice(0, 4).length > 0
                ? appointments.slice(0, 4)
                : [
                    {
                      id: 'td-1',
                      timeSlot: '۱۰:۰۰',
                      serviceTitle: 'رنگ و مش تخصصی',
                      customerName: 'المیرا شمس',
                      specialistName: 'مهسا کیانی',
                    },
                    {
                      id: 'td-2',
                      timeSlot: '۱۱:۳۰',
                      serviceTitle: 'طراحی و کاشت ناخن',
                      customerName: 'نگار رحیمی',
                      specialistName: 'نیلوفر تهرانی',
                    },
                    {
                      id: 'td-3',
                      timeSlot: '۱۴:۰۰',
                      serviceTitle: 'فیشیال تخصصی پوست',
                      customerName: 'سارا احمدی',
                      specialistName: 'سارا راد',
                    },
                  ]
              ).map((apt) => (
                <div key={apt.id} className="relative flex items-start gap-3 min-w-0">
                  <span className="relative z-10 w-10 py-1 rounded-full bg-[#8B5CF6] text-white text-[10px] font-extrabold text-center tabular-nums shrink-0 mt-1">
                    {apt.timeSlot}
                  </span>
                  <div className="flex-1 min-w-0 p-3.5 rounded-2xl bg-[#EDE9FE]/80 border border-[#EDE9FE] flex items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-[#1E1B2E] truncate">
                        {apt.serviceTitle}
                      </p>
                      <p className="text-[11px] text-[#6B6480] truncate">
                        مراجع: {apt.customerName}
                      </p>
                      <p className="text-[10px] font-bold text-[#8B5CF6] truncate">
                        متخصص: {apt.specialistName}
                      </p>
                    </div>
                    <Avatar name={apt.specialistName} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ۲. تقویم ماهانه جمع‌وجور (Mini Jalali Calendar) — مطابق پایین ستون کناری در Capture2.PNG */}
          <Card className="rounded-3xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-2.5">
              <h2 className="text-sm font-extrabold text-[#1E1B2E]">
                تقویم ماهانه سالن
              </h2>
              <span className="text-xs font-bold text-[#8B5CF6] tabular-nums">
                آبان ۱۴۰۵
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#6B6480]">
              {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs tabular-nums">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                const isToday = day === 3;
                const hasBooking = day === 4 || day === 5 || day === 8 || day === 12;
                return (
                  <Link
                    key={day}
                    to="/app/calendar"
                    className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center font-bold transition-colors ${
                      isToday
                        ? 'bg-[#8B5CF6] text-white shadow-2xs'
                        : hasBooking
                        ? 'bg-[#EDE9FE] text-[#8B5CF6]'
                        : 'text-[#6B6480] hover:bg-[#FAF8FF]'
                    }`}
                  >
                    {toPersianDigits(day)}
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
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

  const upcomingDays = getUpcomingJalaliDays(7);
  const calendarDays = upcomingDays.map((d) => ({
    label: d.fullLabel,
    date: d.dateJalali,
  }));

  const currentDay = calendarDays[selectedDayIndex] ?? calendarDays[0];
  const timeSlots = [
    '۰۹:۳۰',
    '۱۰:۰۰',
    '۱۱:۰۰',
    '۱۲:۳۰',
    '۱۳:۳۰',
    '۱۵:۰۰',
    '۱۶:۳۰',
    '۱۷:۰۰',
  ];
  const visibleStaff =
    staffFilter === 'ALL'
      ? specialists.slice(0, 3)
      : specialists.filter((s) => s.id === staffFilter);

  return (
    <div>
      <PageHeader
        kicker="فعالیت روزانه · تقویم سالن"
        title="تقویم زمان‌بندی نوبت‌ها"
        subtitle="مشاهده برنامه روزانه متخصصان، بازه‌های آزاد و تغییر سریع وضعیت هر نوبت"
        routePattern="/app/calendar"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تقویم نوبت‌ها' },
        ]}
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6E0F5]">
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
            <div className="text-center px-3.5 py-1.5 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5]">
              <span className="text-sm font-extrabold text-[#1E1B2E] tabular-nums">
                {currentDay.label}
              </span>
              <span className="text-xs text-[#6B6480] mr-2 tabular-nums">
                ({currentDay.date})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedDayIndex >= calendarDays.length - 1}
              onClick={() =>
                setSelectedDayIndex((i) =>
                  Math.min(calendarDays.length - 1, i + 1)
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
              className="rounded-xl border border-[#D4C9EE] bg-white px-3.5 py-2 text-xs font-bold text-[#1E1B2E] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="ALL">همه متخصصان (نمای ستونی)</option>
              {specialists.slice(0, 4).map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.fullName}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-[#FAF8FF] p-1 rounded-xl border border-[#E6E0F5]">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  viewMode === 'day'
                    ? 'bg-[#8B5CF6] text-white shadow-2xs'
                    : 'text-[#6B6480] hover:text-[#1E1B2E]'
                }`}
              >
                نمای روزانه
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  viewMode === 'week'
                    ? 'bg-[#8B5CF6] text-white shadow-2xs'
                    : 'text-[#6B6480] hover:text-[#1E1B2E]'
                }`}
              >
                نمای هفتگی
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'day' ? (
          <div className="overflow-x-auto rounded-2xl border border-[#E6E0F5]">
            <table className="w-full text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E6E0F5] bg-[#FAF8FF]">
                  <th className="py-3.5 px-3 text-right w-24 font-extrabold text-[#6B6480]">
                    ساعت
                  </th>
                  {visibleStaff.map((sp) => (
                    <th
                      key={sp.id}
                      className="py-3.5 px-4 text-right font-extrabold text-[#1E1B2E] border-r border-[#E6E0F5]"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={sp.fullName} size="sm" tone="violet" />
                        <div>
                          <p className="text-xs font-extrabold">{sp.fullName}</p>
                          <p className="text-[11px] font-medium text-[#6B6480]">
                            {sp.roleTitle}
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E0F5]">
                {timeSlots.map((slot) => (
                  <tr key={slot} className="hover:bg-[#FAF8FF]/50">
                    <td className="py-4 px-3 font-extrabold text-[#6B6480] tabular-nums bg-[#FAF8FF]/40">
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
                          className="p-2.5 border-r border-[#E6E0F5] align-top"
                        >
                          {matched && statusMeta ? (
                            <button
                              type="button"
                              onClick={() => setSelectedApt(matched)}
                              className="w-full text-right p-3 rounded-xl bg-[#EDE9FE]/80 hover:bg-[#EDE9FE] border border-[#D4C9EE] space-y-1.5 cursor-pointer transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-[#1E1B2E]">
                                  {matched.customerName}
                                </span>
                                <StatusBadge
                                  label={statusMeta.label}
                                  tone={statusMeta.tone}
                                />
                              </div>
                              <p className="text-[11px] font-medium text-[#6B6480]">
                                {matched.serviceTitle}
                              </p>
                              <p className="text-[10px] text-[#8B5CF6]">
                                کد پیگیری:{' '}
                                <span dir="ltr" className="font-mono font-bold">
                                  {matched.referenceCode}
                                </span>
                              </p>
                            </button>
                          ) : (
                            <div className="p-3 rounded-xl border border-dashed border-[#E6E0F5] text-[#6B6480] text-[11px] flex items-center justify-between">
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
            {calendarDays.slice(0, 6).map((d) => (
              <div
                key={d.date}
                className="p-4 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#E6E0F5] pb-2.5">
                  <p className="text-xs font-extrabold text-[#1E1B2E]">
                    {d.label}
                  </p>
                  <span className="text-[11px] text-[#6B6480] tabular-nums">
                    {d.date}
                  </span>
                </div>
                {appointments.slice(0, 3).map((apt) => (
                  <button
                    key={`${d.date}-${apt.id}`}
                    type="button"
                    onClick={() => setSelectedApt(apt)}
                    className="w-full text-right p-3 rounded-xl bg-white hover:border-[#8B5CF6] border border-[#E6E0F5] text-xs space-y-1 cursor-pointer transition-all"
                  >
                    <p className="font-extrabold text-[#1E1B2E] tabular-nums">
                      ساعت {apt.timeSlot} — {apt.customerName}
                    </p>
                    <p className="text-[#6B6480]">{apt.serviceTitle}</p>
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
        title="جزئیات و تغییر وضعیت نوبت"
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
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">مشتری:</span>
              <span className="font-extrabold text-[#1E1B2E]">
                {selectedApt.customerName} ({selectedApt.customerPhoneMasked})
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">خدمت:</span>
              <span className="font-bold text-[#1E1B2E]">
                {selectedApt.serviceTitle}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">متخصص:</span>
              <span className="font-bold text-[#1E1B2E]">
                {selectedApt.specialistName}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#E6E0F5]">
              <span className="text-[#6B6480]">زمان مراجعه:</span>
              <span className="font-bold tabular-nums text-[#1E1B2E]">
                {selectedApt.dateJalali} ساعت {selectedApt.timeSlot}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#6B6480]">مبلغ خدمت:</span>
              <span className="font-extrabold text-[#8B5CF6] tabular-nums">
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

  const uniqueDates = Array.from(
    new Set(appointments.map((a) => a.dateJalali).filter(Boolean))
  );

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
        kicker="فعالیت روزانه · فهرست نوبت‌ها"
        title="مدیریت نوبت‌ها"
        subtitle="جست‌وجو و فیلتر نوبت‌ها بر اساس وضعیت، متخصص و تاریخ مراجعه همراه با امکان تغییر وضعیت"
        routePattern="/app/appointments"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'مدیریت نوبت‌ها' },
        ]}
      />

      <Card className="mb-6 space-y-4">
        {/* نوار وضعیت سریع */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6E0F5]">
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
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#FAF8FF] text-[#6B6480] border border-[#E6E0F5] hover:text-[#1E1B2E]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[11px] tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-[#E6E0F5]'
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
                ...uniqueDates.map((d) => ({ value: d, label: d })),
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
                <span className="font-mono text-xs font-bold text-[#8B5CF6] bg-[#EDE9FE] px-2 py-0.5 rounded-md">
                  {r.referenceCode}
                </span>
              ),
            },
            {
              key: 'customer',
              header: 'مشتری و زمان',
              render: (r) => (
                <div>
                  <p className="font-extrabold text-[#1E1B2E]">
                    {r.customerName}
                  </p>
                  <p className="text-xs text-[#6B6480] tabular-nums">
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
                  <p className="font-bold text-[#1E1B2E]">{r.serviceTitle}</p>
                  <p className="text-xs text-[#6B6480]">{r.specialistName}</p>
                </div>
              ),
            },
            {
              key: 'price',
              header: 'مبلغ',
              align: 'left',
              render: (r) => (
                <span className="tabular-nums font-extrabold text-[#8B5CF6]">
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
        title="مدیریت وضعیت نوبت"
        description={detailApt?.referenceCode}
      >
        {detailApt ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-1.5 text-xs">
              <p className="font-extrabold text-[#1E1B2E]">
                {detailApt.customerName} — {detailApt.serviceTitle}
              </p>
              <p className="text-[#6B6480]">
                متخصص: {detailApt.specialistName} · زمان: {detailApt.dateJalali}{' '}
                ساعت {detailApt.timeSlot}
              </p>
              {detailApt.notes ? (
                <p className="text-[#6B6480]">یادداشت: {detailApt.notes}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-extrabold text-[#1E1B2E]">
                تغییر وضعیت نوبت:
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
  const {
    currentBusiness,
    businesses,
    services,
    categories,
    addService,
    updateService,
    deleteService,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

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
      const matchedCat = categories.find((c) => c.title === category);
      addService({
        businessId: currentBiz?.id ?? 'biz-1',
        categorySlug: matchedCat?.slug ?? 'hair-color',
        title: title.trim(),
        category,
        durationMinutes: Number(durationMinutes),
        priceToman: Number(priceToman),
        description: description.trim() || 'خدمت تخصصی سالن زیبایی',
        isActive: true,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="کسب‌وکار · فهرست خدمات"
        title="مدیریت خدمات و تعرفه‌ها"
        subtitle="سازمان‌دهی منوی خدمات سالن، مدت زمان ارائه، تعرفه‌ها و وضعیت نمایش در صفحه رزرو آنلاین"
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
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white border border-[#E6E0F5] text-[#6B6480] hover:text-[#1E1B2E]'
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
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-white border border-[#E6E0F5] text-[#6B6480] hover:text-[#1E1B2E]'
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
                <p className="font-extrabold text-[#1E1B2E]">{s.title}</p>
                <p className="text-xs text-[#6B6480] mt-0.5">{s.description}</p>
              </div>
            ),
          },
          {
            key: 'cat',
            header: 'دسته‌بندی',
            render: (s) => <StatusBadge label={s.category} tone="primary" />,
          },
          {
            key: 'duration',
            header: 'مدت زمان',
            render: (s) => (
              <span className="tabular-nums text-xs font-semibold text-[#6B6480] inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#6B6480]" />
                {formatDurationMinutes(s.durationMinutes)}
              </span>
            ),
          },
          {
            key: 'price',
            header: 'تعرفه (تومان)',
            align: 'left',
            render: (s) => (
              <span className="font-extrabold text-[#8B5CF6] tabular-nums">
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
                  className="text-[#EF4444] hover:bg-[#FEF2F2]"
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
        title={editingService ? 'ویرایش خدمت' : 'افزودن خدمت جدید'}
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
        title="تایید حذف خدمت"
        message={`آیا از حذف خدمت «${deleteTarget?.title ?? ''}» از فهرست خدمات سالن اطمینان دارید؟`}
      />
    </div>
  );
};

/** ۵. متخصصان و پرسنل (/app/staff) */
export const BusinessStaffPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    specialists,
    addSpecialist,
    updateSpecialist,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
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
        businessId: currentBiz?.id ?? 'biz-1',
        slug: `staff-${Date.now()}`,
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        experienceYears: 4,
        rating: 4.8,
        reviewCount: 12,
        specialties: specs.length ? specs : ['خدمات تخصصی زیبایی'],
        bio: 'عضو تیم تخصصی سالن زیبایی.',
        isIndependent: false,
        isActive: true,
      });
    }
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        kicker="کسب‌وکار · اعضای تیم"
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
                    <h2 className="text-base font-extrabold text-[#1E1B2E]">
                      {sp.fullName}
                    </h2>
                    <p className="text-xs text-[#8B5CF6] font-bold mt-0.5">
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
              <p className="text-xs text-[#6B6480] leading-relaxed">{sp.bio}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sp.specialties.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8FF] border border-[#E6E0F5] text-[11px] font-semibold text-[#6B6480]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#E6E0F5] flex items-center justify-between text-xs">
              <span className="text-[#6B6480] font-semibold tabular-nums">
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
          editingStaff ? 'ویرایش اطلاعات متخصص' : 'افزودن متخصص جدید'
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
        kicker="مشتریان · پرونده مراجعان"
        title="فهرست و سوابق مشتریان"
        subtitle="جست‌وجوی مراجعان، مشاهده تعداد مراجعات، خدمات محبوب و یادداشت‌های تخصصی سالن"
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
          <p className="text-xs text-[#6B6480] font-bold">
            مشتریان وفادار (بیش از ۳ مراجعه)
          </p>
          <p className="text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {toPersianDigits(
              customers.filter((c) => c.totalVisits >= 3).length
            )}{' '}
            نفر
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
                  <p className="font-extrabold text-[#1E1B2E]">{r.fullName}</p>
                  <p className="text-xs text-[#6B6480]">{r.favoriteService}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'phone',
            header: 'شماره همراه',
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
            header: 'مجموع تراکنش‌ها',
            align: 'left',
            render: (r) => (
              <span className="tabular-nums font-extrabold text-[#8B5CF6]">
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
        description="سوابق مراجعات و یادداشت‌های تخصصی سالن"
      >
        {selectedCustomer ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-2">
              <p>
                <strong className="text-[#1E1B2E]">خدمت پرتکرار:</strong>{' '}
                {selectedCustomer.favoriteService}
              </p>
              <p>
                <strong className="text-[#1E1B2E]">آخرین مراجعه:</strong>{' '}
                <span className="tabular-nums">
                  {selectedCustomer.lastVisitJalali}
                </span>
              </p>
              <p>
                <strong className="text-[#1E1B2E]">یادداشت تخصصی سالن:</strong>{' '}
                {selectedCustomer.notes}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-[#1E1B2E]">
                تاریخچه نوبت‌های ثبت‌شده:
              </h3>
              {appointments
                .filter((a) =>
                  a.customerName.includes(selectedCustomer.fullName)
                )
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl border border-[#E6E0F5] flex items-center justify-between"
                  >
                    <span className="font-bold text-[#1E1B2E]">
                      {apt.serviceTitle} ({apt.dateJalali})
                    </span>
                    <span className="font-extrabold text-[#8B5CF6] tabular-nums">
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
  const {
    currentBusiness,
    businesses,
    gallery,
    addGalleryItem,
    removeGalleryItem,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const [title, setTitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('مو و رنگ');

  const handleAddDemoImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGalleryItem({
      businessId: currentBiz?.id ?? 'biz-1',
      title: title.trim(),
      categoryLabel,
      theme: 'violet',
    });
    setTitle('');
  };

  return (
    <div>
      <PageHeader
        kicker="کسب‌وکار · نمونه کارها"
        title="گالری نمونه کارها و تصاویر سالن"
        subtitle="مدیریت قاب‌های تصویری پروفایل عمومی سالن برای نمایش کیفیت خدمات به مشتریان"
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
              placeholder="مثلاً نمونه لایت و بالیاژ..."
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
            <span>افزودن به گالری</span>
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
                <p className="font-extrabold text-[#1E1B2E] truncate">
                  {item.title}
                </p>
                <p className="text-[11px] text-[#6B6480]">
                  {item.categoryLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeGalleryItem(item.id)}
                className="text-[#EF4444] font-semibold hover:underline cursor-pointer shrink-0"
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
  const {
    currentBusiness,
    businesses,
    updateBusinessProfile,
    updateOnboardingDraft,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [name, setName] = useState(currentBiz?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(currentBiz?.avatarUrl ?? '');
  const [instagramHandle, setInstagramHandle] = useState(
    currentBiz?.instagramHandle ?? ''
  );
  const [address, setAddress] = useState(currentBiz?.address ?? '');
  const [mapLat, setMapLat] = useState<number>(currentBiz?.mapLat ?? 32.6362);
  const [mapLng, setMapLng] = useState<number>(currentBiz?.mapLng ?? 51.665);
  const [shortDesc, setShortDesc] = useState(
    currentBiz?.shortDescription ?? ''
  );
  const [aboutText, setAboutText] = useState(currentBiz?.aboutText ?? '');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!currentBiz) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-bold text-[#1E1B2E]">
          کسب‌وکاری برای ویرایش یافت نشد.
        </p>
      </Card>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedInsta = instagramHandle.trim();
    updateBusinessProfile(currentBiz.id, {
      name,
      avatarUrl: avatarUrl || undefined,
      instagramHandle: cleanedInsta,
      address,
      mapLat,
      mapLng,
      shortDescription: shortDesc,
      aboutText,
    });
    updateOnboardingDraft({
      businessName: name,
      avatarUrl,
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
        kicker="کسب‌وکار · پروفایل عمومی"
        title="ویرایش پروفایل عمومی سالن"
        subtitle="تغییرات نشانی، موقعیت نقشه و آدرس اینستاگرام بلافاصله در صفحه عمومی سالن نمایش داده می‌شود."
        routePattern="/app/profile"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'پروفایل عمومی سالن' },
        ]}
        actions={
          <Link to={`/salon/${currentBiz.slug}`}>
            <Button variant="outline" size="sm">
              <span>مشاهده پروفایل سالن</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <Card padding="lg" className="lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-4">
            <ProfilePhotoUploader
              value={avatarUrl}
              onChange={(url) => setAvatarUrl(url)}
              label="تصویر پروفایل یا لوگوی سالن (برش خودکار مربع ۴۰۰×۴۰۰)"
            />

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
                ذخیره تغییرات پروفایل
              </Button>
              {savedNotice ? (
                <span className="text-xs font-bold text-[#10B981]">
                  تغییرات با موفقیت در پروفایل عمومی ذخیره شد.
                </span>
              ) : null}
            </div>
          </form>
        </Card>

        <Card variant="muted" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#8B5CF6]">
              پیش‌نمایش کارت و موقعیت در پروفایل عمومی
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
            <h3 className="text-sm font-extrabold text-[#1E1B2E]">{name}</h3>
            <p className="text-xs text-[#6B6480] leading-relaxed">
              {shortDesc}
            </p>
            <div className="pt-2 border-t border-[#E6E0F5] space-y-1.5 text-xs">
              <p className="text-[#6B6480] flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 mt-0.5" />
                <span>{address}</span>
              </p>
              {instagramHandle.trim() ? (
                <p className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[#6B6480]">
                    <Instagram className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>صفحه اینستاگرام:</span>
                  </span>
                  <span
                    dir="ltr"
                    className="font-mono font-bold text-[#8B5CF6] bg-[#EDE9FE] px-2 py-0.5 rounded border border-[#EDE9FE]"
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
  const { currentBusiness, businesses, updateBusinessWorkingHours } =
    usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];
  const [hours, setHours] = useState(currentBiz?.workingHours ?? []);

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
        kicker="کسب‌وکار · برنامه پذیرش"
        title="تنظیم ساعات کاری هفتگی"
        subtitle="تعیین روزهای کاری یا تعطیل و ویرایش ساعت شروع و پایان پذیرش نوبت آنلاین"
        routePattern="/app/working-hours"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'ساعات کاری هفتگی' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <Card padding="lg" className="lg:col-span-8 space-y-4">
          <div className="divide-y divide-[#E6E0F5]">
            {hours.map((d, idx) => (
              <div
                key={d.dayName}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <label className="inline-flex items-center gap-2.5 font-extrabold text-[#1E1B2E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={d.isOpen}
                    onChange={() => handleToggleDay(idx)}
                    className="accent-[#8B5CF6] w-4 h-4"
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
                      className="w-22 rounded-xl border border-[#D4C9EE] bg-white px-2.5 py-1.5 text-xs font-bold text-center tabular-nums focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <span className="text-[#6B6480] text-xs">تا</span>
                    <input
                      type="text"
                      value={d.closeTime}
                      onChange={(e) =>
                        handleTimeChange(idx, 'closeTime', e.target.value)
                      }
                      aria-label={`ساعت پایان ${d.dayName}`}
                      className="w-22 rounded-xl border border-[#D4C9EE] bg-white px-2.5 py-1.5 text-xs font-bold text-center tabular-nums focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                ) : (
                  <StatusBadge label="تعطیل" tone="neutral" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E6E0F5]">
            <Button
              variant="primary"
              disabled={!currentBiz}
              onClick={() => {
                if (currentBiz) {
                  updateBusinessWorkingHours(currentBiz.id, hours);
                }
              }}
            >
              ذخیره ساعات کاری
            </Button>
          </div>
        </Card>

        <Card variant="muted" className="lg:col-span-4 space-y-3">
          <p className="text-xs font-extrabold text-[#8B5CF6]">
            خلاصه برنامه هفتگی
          </p>
          <p className="text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
            {toPersianDigits(openDaysCount)} روز کاری فعال در هفته
          </p>
          <p className="text-xs text-[#6B6480] leading-relaxed">
            ساعات کاری تنظیم‌شده مستقیماً بازه‌های قابل انتخاب در تقویم رزرو آنلاین
            مشتریان را مشخص می‌کند.
          </p>
        </Card>
      </div>
    </div>
  );
};

/** ۱۰. تبلیغات، ارتقای جایگاه و کمپین‌ها (/app/marketing) */
export const BusinessMarketingPage: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    campaigns,
    addCampaign,
    updateBusinessProfile,
    showToast,
  } = usePrototypeData();
  const currentBiz = currentBusiness ?? businesses[0];

  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('15');
  const [segment, setSegment] = useState('مشتریان وفادار');
  const [sponsoredLabelInput, setSponsoredLabelInput] = useState(
    currentBiz?.sponsoredLabel || 'پیشنهاد ویژه · ۲۰٪ تخفیف'
  );

  const isSponsoredActive = Boolean(currentBiz?.isSponsored);
  const extraSms = currentBiz?.extraSmsBalance ?? 0;

  const handleToggleSearchBoost = () => {
    if (!currentBiz) return;
    const nextState = !isSponsoredActive;
    updateBusinessProfile(currentBiz.id, {
      isSponsored: nextState,
      sponsoredLabel:
        sponsoredLabelInput.trim() || 'پیشنهاد ویژه رزرو آنلاین',
    });
    showToast(
      nextState
        ? `جایگاه «صدرنشینی در جست‌وجو» برای «${currentBiz.name}» فعال شد! اکنون سالن شما در بالای صفحه جست‌وجو نمایش داده می‌شود.`
        : 'نمایش تبلیغاتی صدر جست‌وجو غیرفعال شد.'
    );
  };

  const handleBuyExtraSmsPack = () => {
    if (!currentBiz) return;
    const updatedSms = extraSms + 200;
    updateBusinessProfile(currentBiz.id, {
      extraSmsBalance: updatedSms,
    });
    showToast(
      `بسته ۲۰۰ پیامک خدماتی اضافه با موفقیت شارژ شد (موجودی پیامک اضافه: ${toPersianDigits(updatedSms)} عدد).`
    );
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCampaign({
      title: title.trim(),
      targetSegment: segment,
      discountPercent: Number(discount) || 10,
      channel: 'کمپین پیامکی مشتریان',
      statusLabel: 'فعال',
      createdAtJalali: '۱۴۰۵/۰۸/۰۳',
    });
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="جذب مشتری جدید · جایگاه‌های تبلیغاتی و کمپین‌ها"
        title="تبلیغات ویژه، صدرنشینی در جست‌وجو و کمپین‌ها"
        subtitle="جدا از پلن اشتراک ماهانه، می‌توانید با رزرو جایگاه تبلیغاتی در صدر نتایج جست‌وجو یا بنر صفحه اول، بازدید و رزرو سالن خود را تا ۳ برابر افزایش دهید"
        routePattern="/app/marketing"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تبلیغات و ارتقای جایگاه' },
        ]}
      />

      {/* بخش ۱: بسته‌های تبلیغاتی و ارتقای جایگاه (Sponsored Boost & Add-on SMS) */}
      <div className="rounded-3xl bg-[#061138] text-white p-5 sm:p-6 space-y-5 border border-[#1E293B] shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#00E5FF]">
              <Megaphone className="w-4 h-4" />
              <span>جایگاه‌های تبلیغاتی پربازده تایم تو (مستقل از پلن اشتراک)</span>
            </span>
            <h2 className="text-base sm:text-xl font-extrabold text-white">
              بنر و کارت سالن خود را بالاتر از سایر رقبا به مشتریان اصفهان نشان دهید
            </h2>
          </div>
          <Link to="/search">
            <Button variant="secondary" size="sm">
              <span>مشاهده جایگاه فعلی در صفحه جست‌وجو ←</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* کارت ۱: صدرنشینی در نتایج جست‌وجو (Search Pin Boost) */}
          <div className="rounded-2xl bg-white text-[#061138] p-5 flex flex-col justify-between space-y-4 border-2 border-[#00E5FF]">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-[11px] font-extrabold">
                  ★ پربازده‌ترین جایگاه
                </span>
                {isSponsoredActive ? (
                  <StatusBadge label="فعال روی سالن شما" tone="success" />
                ) : null}
              </div>
              <h3 className="text-base font-extrabold text-[#061138]">
                ۱. صدرنشینی در نتایج جست‌وجوی شهر
              </h3>
              <p className="text-xs text-[#334155] leading-relaxed">
                پین شدن کارت سالن شما در <strong>ردیف اول نتایج جست‌وجو (/search)</strong> با نشان طلایی و آبی «★ آگهی ویژه» و متن تبلیغاتی دلخواه شما.
              </p>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-baseline justify-between">
                <span className="text-xs text-[#64748B]">تعرفه جایگاه:</span>
                <div className="text-left">
                  <span className="text-lg font-extrabold text-[#0057FF] tabular-nums">
                    ۴۹۰,۰۰۰ تومان
                  </span>
                  <span className="text-[11px] text-[#64748B]"> / ماهانه (یا ۱۹۰ هزار تومان هفتگی)</span>
                </div>
              </div>

              <div className="pt-1">
                <label
                  htmlFor="boost-badge-label"
                  className="block text-[11px] font-bold text-[#334155] mb-1"
                >
                  متن برچسب ویژه روی کارت سالن شما:
                </label>
                <Input
                  id="boost-badge-label"
                  value={sponsoredLabelInput}
                  onChange={(e) => setSponsoredLabelInput(e.target.value)}
                  placeholder="مثلاً پیشنهاد ویژه چهارباغ · ۲۰٪ تخفیف"
                />
              </div>
            </div>

            <Button
              type="button"
              variant={isSponsoredActive ? 'outline' : 'primary'}
              size="sm"
              fullWidth
              onClick={handleToggleSearchBoost}
            >
              <span>
                {isSponsoredActive
                  ? 'بروزرسانی برچسب / غیرفعال‌سازی موقت'
                  : 'فعال‌سازی آنی صدرنشینی در جست‌وجو'}
              </span>
            </Button>
          </div>

          {/* کارت ۲: بنر بزرگ در صفحه اول (Home Featured Banner) */}
          <div className="rounded-2xl bg-white/10 border border-white/20 p-5 flex flex-col justify-between space-y-4 text-white">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] text-[11px] font-extrabold">
                  ویترین صفحه اول
                </span>
                <span className="text-[11px] text-slate-300 font-bold">
                  ظرفیت محدود (۲ اسلات در شهر)
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                ۲. بنر ویژه در صفحه اول تایم تو
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                نمایش بنر تصویری اختصاصی سالن شما در بخش <strong>«پیشنهادهای ویژه رزرو آنلاین»</strong> در صفحه اول سایت با دکمه رزرو مستقیم.
              </p>
              <div className="pt-2 border-t border-white/15 flex items-baseline justify-between">
                <span className="text-xs text-slate-300">تعرفه جایگاه:</span>
                <div className="text-left">
                  <span className="text-lg font-extrabold text-[#00E5FF] tabular-nums">
                    ۸۹۰,۰۰۰ تومان
                  </span>
                  <span className="text-[11px] text-slate-300"> / ماهانه (یا ۳۵۰ هزار تومان هفتگی)</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="accent"
              size="sm"
              fullWidth
              onClick={() => {
                if (currentBiz) {
                  updateBusinessProfile(currentBiz.id, {
                    featured: true,
                    isSponsored: true,
                    sponsoredLabel:
                      sponsoredLabelInput.trim() || 'بنر ویژه صفحه اول',
                  });
                }
                showToast(
                  'جایگاه «بنر ویژه صفحه اول و پیشنهاد برگزیده» برای سالن شما رزرو و فعال شد.'
                );
              }}
            >
              <span>رزرو و فعال‌سازی بنر صفحه اول</span>
            </Button>
          </div>

          {/* کارت ۳: بسته افزونه پیامک خدماتی (Add-on SMS Pack) */}
          <div className="rounded-2xl bg-white/10 border border-white/20 p-5 flex flex-col justify-between space-y-4 text-white">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-extrabold">
                  بسته افزونه پیامک
                </span>
                <span className="text-[11px] text-emerald-300 font-extrabold tabular-nums">
                  شارژ اضافه فعلی: {toPersianDigits(extraSms)} پیامک
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                ۳. بسته ۲۰۰ پیامک خدماتی و یادآور اضافه
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                اگر سهمیه پیامک ماهانه پلن شما تمام شده یا در پلن رایگان هستید، بدون تغییر پلن می‌توانید بسته ۲۰۰ تایی پیامک یادآور و تبریک تولد بخرید.
              </p>
              <div className="pt-2 border-t border-white/15 flex items-baseline justify-between">
                <span className="text-xs text-slate-300">تعرفه بسته ۲۰۰ تایی:</span>
                <span className="text-lg font-extrabold text-emerald-300 tabular-nums">
                  ۱۸۰,۰۰۰ تومان
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth
              onClick={handleBuyExtraSmsPack}
            >
              <span>افزودن فوری ۲۰۰ پیامک به اعتبار سالن</span>
            </Button>
          </div>
        </div>
      </div>

      {/* بخش ۲: تعریف کمپین‌های تخفیف باشگاه مشتریان */}
      <Card>
        <div className="mb-4 space-y-1">
          <h2 className="text-sm sm:text-base font-extrabold text-[#061138]">
            ساخت کمپین تخفیف برای مشتریان سالن
          </h2>
          <p className="text-xs text-[#64748B]">
            کد تخفیف یا پیشنهاد مناسبتی برای بازگشت مشتریان قبلی تعریف کنید
          </p>
        </div>
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
            <span>ایجاد کمپین</span>
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campaigns.map((cmp) => (
          <Card key={cmp.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#0057FF]" />
                <h2 className="text-sm font-extrabold text-[#061138]">
                  {cmp.title}
                </h2>
              </div>
              <StatusBadge label={cmp.statusLabel} tone="success" />
            </div>
            <p className="text-xs text-[#334155]">
              مخاطب هدف: <strong>{cmp.targetSegment}</strong> · کانال:{' '}
              {cmp.channel}
            </p>
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B] tabular-nums">
              <span className="font-extrabold text-[#0057FF]">
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
        kicker="مالی · گزارش عملکرد"
        title="گزارش‌ها و آمار عملکرد سالن"
        subtitle="بررسی کارکرد ماهانه، نرخ بازگشت مراجعان و سهم هر لاین خدمتی از کل درآمد"
        routePattern="/app/analytics"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'گزارش‌ها و آمار' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">درآمد کل ماه جاری</p>
          <p className="text-2xl font-extrabold text-[#8B5CF6] tabular-nums">
            {formatPriceToman(64800000)}
          </p>
          <p className="text-xs text-[#10B981] font-semibold">
            بر اساس ۱۰۲ نوبت انجام‌شده (+۱۴٪ رشد)
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">
            نرخ بازگشت مجدد مشتریان
          </p>
          <p className="text-2xl font-extrabold text-[#1E1B2E] tabular-nums">
            {toPersianDigits(76)}٪
          </p>
          <p className="text-xs text-[#6B6480]">
            مراجعه بیش از ۲ بار در فصل جاری
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs font-bold text-[#6B6480]">
            میانگین امتیاز رضایت مشتریان
          </p>
          <p className="text-2xl font-extrabold text-[#F59E0B] tabular-nums">
            ★ {toPersianDigits(4.9)} از ۵
          </p>
          <p className="text-xs text-[#6B6480]">بر اساس ۱۴۲ دیدگاه ثبت‌شده</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold text-[#1E1B2E]">
            سهم خدمات پرطرفدار از درآمد ماهانه
          </h2>
          <div className="space-y-4">
            {popularBreakdown.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#1E1B2E]">
                    {item.name}
                  </span>
                  <span className="tabular-nums text-[#6B6480] font-semibold">
                    {toPersianDigits(item.pct)}٪ ({formatPriceToman(item.amount)}
                    )
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

        <Card className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1E1B2E]">
              روند ۶ ماهه درآمد سالن (میلیون تومان)
            </h2>
            <p className="text-xs text-[#6B6480] mt-0.5">
              رشد پیوسته پس از فعال‌سازی رزرو آنلاین
            </p>
          </div>

          <div className="h-40 pt-4 flex items-end justify-between gap-2 border-b border-[#E6E0F5] pb-2">
            {monthlyTrend.map((m) => (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
              >
                <span className="text-[10px] font-bold text-[#6B6480] tabular-nums">
                  {m.label}
                </span>
                <div
                  className="w-full max-w-[30px] rounded-t-lg bg-[#8B5CF6]"
                  style={{ height: `${Math.round((m.value / 70) * 100)}%` }}
                />
                <span className="text-[11px] font-semibold text-[#6B6480]">
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
  const { plans, activePlanId, setActivePlanId, showToast, dataMode } =
    usePrototypeData();
  const currentPlan =
    plans.find((p) => p.id === activePlanId) ?? plans[1] ?? plans[0];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="مالی · اشتراک ماهانه"
        title="مدیریت اشتراک و ارتقای کسب‌وکار"
        subtitle="مقایسه شفاف مزایای ارتقا به پلن حرفه‌ای و VIP برای کاهش کنسلی نوبت‌ها و جذب مشتریان جدید در اصفهان"
        routePattern="/app/subscription"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'اشتراک و ارتقا' },
        ]}
      />

      {currentPlan ? (
        <Card variant="dark" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#00E5FF]">
                پلن فعال فعلی کسب‌وکار شما:
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {currentPlan.name}
              </h2>
              <p className="text-xs text-slate-200 tabular-nums">
                ظرفیت پرسنل: {currentPlan.staffLimit} · سهمیه پیامک یادآور
                ماهانه: {toPersianDigits(currentPlan.smsQuotaMonthly)} عدد
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white tabular-nums">
                {dataMode === 'real'
                  ? 'رزرو آنلاین بدون پیش‌پرداخت: فعال'
                  : 'وضعیت اشتراک: فعال'}
              </span>
            </div>
          </div>
        </Card>
      ) : null}

      {/* راهنمای ارزش ارتقا برای صاحب سالن */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-1.5">
          <p className="text-xs font-extrabold text-[#059669]">
            ۱. کاهش ۷۰٪ عدم حضور مشتری
          </p>
          <p className="text-xs text-[#334155] leading-relaxed">
            ارسال خودکار پیامک تایید و یادآور ۲۴ ساعت قبل از نوبت از طریق
            خط خدماتی.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-1.5">
          <p className="text-xs font-extrabold text-[#0057FF]">
            ۲. اولویت نمایش در جست‌وجوی اصفهان
          </p>
          <p className="text-xs text-[#334155] leading-relaxed">
            درج نشان «سالن برگزیده» و جایگاه بالاتر در لیست جست‌وجوی محله و
            خدمات.
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-1.5">
          <p className="text-xs font-extrabold text-[#D97706]">
            ۳. تقویم مجزا برای تمام متخصصان
          </p>
          <p className="text-xs text-[#334155] leading-relaxed">
            مدیریت همزمان شیفت‌ها، مرخصی‌ها و گزارش مالی تفکیکی هر پرسنل سالن.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === activePlanId;
          return (
            <Card
              key={plan.id}
              className={`space-y-5 flex flex-col justify-between ${
                isCurrent
                  ? 'border-2 border-[#0057FF] shadow-sm'
                  : plan.isRecommended
                    ? 'border-[#0057FF]/50'
                    : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-[#061138]">
                    {plan.name}
                  </h3>
                  {isCurrent ? (
                    <StatusBadge label="پلن فعال شما" tone="success" />
                  ) : plan.isRecommended ? (
                    <StatusBadge label="پیشنهاد ویژه" tone="primary" />
                  ) : null}
                </div>
                <p className="text-xl font-extrabold text-[#0057FF] tabular-nums">
                  {plan.monthlyPriceToman === 0
                    ? 'رایگان'
                    : formatPriceToman(plan.monthlyPriceToman)}
                  <span className="text-xs font-normal text-[#64748B]">
                    {' '}
                    {plan.monthlyPriceToman > 0 ? '/ ماهانه' : '(همیشگی)'}
                  </span>
                </p>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {plan.audience}
                </p>
                <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">ظرفیت متخصصان:</span>
                    <span className="font-bold text-[#061138]">
                      {plan.staffLimit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">سهمیه پیامک ماهانه:</span>
                    <span className="font-bold text-[#061138] tabular-nums">
                      {toPersianDigits(plan.smsQuotaMonthly)} پیامک
                    </span>
                  </div>
                </div>
                <ul className="space-y-2 pt-3 border-t border-[#E2E8F0] text-xs text-[#061138]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
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
                  showToast(`پلن کسب‌وکار به «${plan.name}» تغییر یافت.`);
                }}
              >
                {isCurrent
                  ? 'پلن فعال فعلی شما'
                  : plan.monthlyPriceToman === 0
                    ? 'تغییر به پلن پایه رایگان'
                    : `ارتقا و فعال‌سازی ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

/** ۱۳. تنظیمات پنل کسب‌وکار و اتصال سریع ملی‌پیامک (/app/settings) */
export const BusinessSettingsPage: React.FC = () => {
  const { showToast } = usePrototypeData();
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="تنظیمات · پیکربندی سالن و درگاه پیامک"
        title="تنظیمات پنل کسب‌وکار و اتصال ملی‌پیامک"
        subtitle="اتصال ۱ دقیقه‌ای پنل پیامک ملی‌پیامک (MelliPayamak)، مدیریت قوانین نوبت‌دهی و یادآورهای پیامکی"
        routePattern="/app/settings"
        breadcrumbs={[
          { label: 'پنل کسب‌وکار', href: '/app' },
          { label: 'تنظیمات و پیامک' },
        ]}
      />

      <div className="max-w-3xl space-y-5">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'notifications', label: 'اتصال ملی‌پیامک و اعلان‌ها' },
            { id: 'booking_rules', label: 'قوانین رزرو و لغو' },
            { id: 'security', label: 'امنیت و دسترسی' },
          ]}
        />

        {activeTab === 'notifications' ? (
          <div className="space-y-5">
            <MelipayamakQuickSetupCard />

            <Card padding="lg" className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#061138]">
                ترجیحات ارسال پیامک خودکار به مشتریان سالن
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-[#061138]">
                <label className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0] cursor-pointer">
                  <span className="font-bold">
                    ارسال پیامک تایید بلافاصله پس از ثبت نوبت
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-[#0057FF] w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0] cursor-pointer">
                  <span className="font-bold">
                    ارسال یادآور ۲۴ ساعت مانده به زمان مراجعه
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-[#0057FF] w-4 h-4"
                  />
                </label>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    showToast('ترجیحات اطلاع‌رسانی پیامکی ذخیره شد.')
                  }
                >
                  ذخیره ترجیحات اعلان
                </Button>
              </div>
            </Card>
          </div>
        ) : (
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
            ) : (
              <div className="p-4 rounded-xl bg-[#F3F6FC] border border-[#CBD5E1] flex items-start gap-3 text-xs text-[#334155]">
                <ShieldCheck className="w-5 h-5 text-[#0057FF] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  سطوح دسترسی مدیر سالن، منشی و متخصصان از طریق احراز هویت پیامکی
                  محافظت می‌شود.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() =>
                  showToast('تنظیمات پنل کسب‌وکار با موفقیت ذخیره شد.')
                }
              >
                ذخیره تنظیمات
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
