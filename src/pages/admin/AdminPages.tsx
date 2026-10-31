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
  normalizeIranMobileInput,
  resolveAdjacentTabBySwipe,
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

/** مودال بررسی کامل پنل ایجادشده توسط صاحب کسب‌وکار (نمایش تمام جزئیات، خدمات، متخصصان، ساعات کاری و زمان ثبت درخواست) */
const BusinessFullInspectModal: React.FC<{
  business: BusinessItem | null;
  onClose: () => void;
  onApprove: (businessId: string) => void;
  onReject: (businessId: string) => void;
}> = ({ business, onClose, onApprove, onReject }) => {
  const { services, specialists } = usePrototypeData();
  if (!business) return null;

  const bizServices = services.filter((s) => s.businessId === business.id);
  const bizSpecialists = specialists.filter((sp) => sp.businessId === business.id);
  const bizHours = business.workingHours || [];

  return (
    <Modal
      isOpen={Boolean(business)}
      onClose={onClose}
      title={`بررسی کامل پنل سالن: ${business.name}`}
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
        {/* ۱. خلاصه اطلاعات مالک، تماس، موقعیت و پلن */}
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
            <p className="text-[#64748B] font-bold">موقعیت مکانی و زمان ثبت:</p>
            <p className="font-extrabold text-[#061138]">
              {business.city} · محله {business.neighborhood}
            </p>
            <p className="text-[#334155] leading-relaxed">{business.address}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-[#E0ECFF] text-[#0057FF] font-extrabold">
                پلن: {business.subscriptionPlan}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] font-bold">
                زمان درخواست: {business.createdAtJalali || 'ثبت جدید'}
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
            to={`/salons/${business.id}`}
            target="_blank"
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
    paymentOrders,
    supportTickets,
    updateBusinessApproval,
    adminNotifications,
    markAdminNotificationRead,
    clearAllAdminNotifications,
  } = usePrototypeData();
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '1y'>('7d');
  const [isNotifCollapsed, setIsNotifCollapsed] = useState(false);
  const [inspectingBusiness, setInspectingBusiness] =
    useState<BusinessItem | null>(null);

  // در پنل مدیریت کلان، سالن‌های نمونه نمایشی به‌طور کامل کنار گذاشته می‌شوند و فقط کسب‌وکارهای واقعی نمایش می‌یابند
  const realBusinesses = businesses.filter((b) => !b.isSampleShowcase);

  const pendingCount = realBusinesses.filter(
    (b) => b.approvalStatus === 'PENDING_REVIEW'
  ).length;

  const activeSubscriptionsCount = realBusinesses.filter(
    (b) =>
      b.subscriptionStatus === 'ACTIVE' || b.subscriptionStatus === 'TRIAL'
  ).length;

  const realAppointments = appointments.filter((a) =>
    realBusinesses.some((b) => b.id === a.businessId)
  );

  const approvedRevenueToman = paymentOrders
    .filter((o) => o.status === 'APPROVED')
    .reduce((sum, o) => sum + (Number(o.amountToman) || 0), 0);

  const openTicketsCount = supportTickets.filter(
    (t) => t.status === 'OPEN'
  ).length;

  // اولویت نمایش با کسب‌وکارهای در انتظار بررسی
  const sortedBusinesses = [...realBusinesses].sort((a, b) => {
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

  // فقط اعلان‌های خوانده‌نشده در نوار بالا نمایش داده می‌شوند تا به‌محض تایید/رد یا بستن، از صفحه جمع شوند
  const unreadNotifications = adminNotifications.filter((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="پنل مدیریت کلان · Timeto (تایم تو)"
        title="داشبورد مدیریت پلتفرم"
        subtitle="بررسی کسب‌وکارهای واقعی ثبت‌نام‌شده، مشاهده کامل پنل هر سالن، پایش آمار واقعی رزروها و مدیریت اشتراک‌ها"
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

      {/* بنر دسترسی سریع به تنظیمات پیامک ملی‌پیامک و تیکت‌های پشتیبانی */}
      <div className="rounded-3xl bg-[#061138] text-white p-4 sm:p-5 border border-[#1E293B] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0057FF] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm font-extrabold text-white">
              تنظیمات مدیر کل، نام کاربری/رمز عبور و اتصال پیامک ملی‌پیامک
            </p>
            <p className="text-[11px] sm:text-xs text-slate-300">
              تنظیم نام کاربری و رمز عبور مدیریت، درگاه پیامک و پاسخگویی به تیکت‌های پشتیبانی ({toPersianDigits(openTicketsCount)} تیکت باز)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/support">
            <Button variant="secondary" size="sm">
              <Headphones className="w-4 h-4" />
              <span>تیکت‌های پشتیبانی ({toPersianDigits(openTicketsCount)})</span>
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button variant="accent" size="sm">
              <span>تنظیمات مدیر و پیامک</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ۱. نوار یکپارچه ۳ ستونی شاخص‌های کلیدی (فقط بر اساس آمار واقعی دیتابیس) */}
      <div className="rounded-3xl bg-white border border-[#E6E0F5] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#E6E0F5] shadow-2xs">
        {/* ستون ۱: کل رزروهای واقعی و دسته‌بندی‌ها */}
        <div className="flex items-start justify-between gap-4 pt-2 md:pt-0">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B6480] block">
              کل رزروهای واقعی و دسته‌بندی‌های فعال
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#1E1B2E] tabular-nums">
              {toPersianDigits(realAppointments.length)} رزرو ثبت‌شده
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] font-extrabold tabular-nums">
                آمار واقعی سامانه
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

        {/* ستون ۳: درآمد واقعی اشتراک‌ها و تبلیغات */}
        <div className="flex items-start justify-between gap-4 pt-4 md:pt-0 md:pr-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#6B6480] block">
              مجموع واریزی‌های تاییدشده ({toPersianDigits(activeSubscriptionsCount)}{' '}
              سالن فعال)
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#8B5CF6] tabular-nums">
              {approvedRevenueToman > 0
                ? formatPriceToman(approvedRevenueToman)
                : '۰ تومان'}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] font-extrabold tabular-nums">
                {toPersianDigits(
                  paymentOrders.filter((o) => o.status === 'APPROVED').length
                )}{' '}
                تراکنش موفق
              </span>
              <span className="text-[#6B6480]">بدون احتساب نمونه‌ها</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl border border-[#E6E0F5] bg-[#FAF8FF] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#10B981]" />
          </div>
        </div>
      </div>

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
                  {['۴۰', '۳۰', '۲۰', '۱۰'][idx]}
                </text>
              </g>
            ))}

            <rect
              x="505"
              y="20"
              width="56"
              height="155"
              rx="14"
              fill="url(#adm-bar-highlight)"
            />

            <path
              d="M65,155 C145,148 215,150 295,135 C375,120 455,130 533,108 C605,95 650,110 685,98"
              fill="none"
              stroke="#A78BFA"
              strokeOpacity="0.7"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            <path
              d="M65,145 C145,132 215,138 295,115 C375,92 455,110 533,76 C605,64 650,82 685,68"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            <circle
              cx="533"
              cy="76"
              r="6"
              fill="#FFFFFF"
              stroke="#8B5CF6"
              strokeWidth="3.5"
            />
            <g transform="translate(445, 22)">
              <rect
                x="0"
                y="0"
                width="176"
                height="40"
                rx="12"
                fill="#1E1B2E"
              />
              <text
                x="88"
                y="16"
                textAnchor="middle"
                className="fill-white text-[10px] font-extrabold"
              >
                وضعیت شبکه واقعی (اصفهان و درچه)
              </text>
              <text
                x="88"
                y="31"
                textAnchor="middle"
                className="fill-amber-300 text-[11px] font-extrabold"
              >
                {toPersianDigits(realBusinesses.length)} سالن ·{' '}
                {toPersianDigits(realAppointments.length)} رزرو
              </text>
            </g>

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
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [inspectingBusiness, setInspectingBusiness] =
    useState<BusinessItem | null>(null);

  // فقط کسب‌وکارهای واقعی (بدون نمونه‌های نمایشی)
  const sourceBusinesses = businesses.filter((b) => !b.isSampleShowcase);

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
        kicker="نظارت و عملیات · مراکز زیبایی ثبت‌نام‌شده واقعی"
        title="بررسی، تایید و مدیریت کسب‌وکارهای عضو"
        subtitle="مشاهده خلاصه اطلاعات در جدول و بررسی کامل تمام بخش‌های پنل ایجادشده توسط صاحب کسب‌وکار (خدمات، متخصصان، ساعات کاری و لوکیشن)"
        routePattern="/admin/businesses"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'کسب‌وکارها' },
        ]}
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
        emptyMessage="هیچ کسب‌وکار واقعی با این فیلتر یافت نشد."
        columns={[
          {
            key: 'name',
            header: 'عنوان کسب‌وکار و زمان ثبت',
            render: (b) => (
              <div className="space-y-0.5">
                <span className="font-extrabold text-[#1E1B2E] block">
                  {b.name}
                </span>
                <span className="text-[11px] text-[#0057FF] font-bold block">
                  {b.subscriptionPlan} · ثبت: {b.createdAtJalali || 'جدید'}
                </span>
              </div>
            ),
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
            header: 'مشاهده کامل پنل و عملیات مدیر',
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

      <BusinessFullInspectModal
        business={inspectingBusiness}
        onClose={() => setInspectingBusiness(null)}
        onApprove={(id) => updateBusinessApproval(id, 'APPROVED')}
        onReject={(id) => updateBusinessApproval(id, 'REJECTED')}
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

      {/* بخش ۲: تعرفه بسته‌های تبلیغاتی و پیامک اضافه (قابل ویرایش توسط مدیر کل — با کنتراست بالا و خوانایی کامل) */}
      <Card variant="dark" className="space-y-4 border-2 border-[#0057FF]/30">
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
                  {formatPriceToman(pkg.priceToman)}
                  {pkg.slot !== 'SMS_ADDON' ? (
                    <span className="text-[11px] font-bold text-[#64748B]">
                      {' '}
                      / ماهانه ({formatPriceToman(pkg.weeklyPriceToman ?? 190000)}{' '}
                      هفتگی)
                    </span>
                  ) : (
                    <span className="text-[11px] font-extrabold text-[#059669]">
                      {' '}
                      / بسته {toPersianDigits(pkg.smsCount ?? 200)} پیامک
                    </span>
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
                <span>ویرایش تعرفه و توضیحات بسته</span>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* بخش ۳: جدول کنترل کامل جایگاه، رتبه و مدت زمان تبلیغ هر کسب‌وکار واقعی */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#061138]">
              ۳. مدیریت جایگاه تبلیغاتی، رتبه نمایش، پلن و شارژ پیامک کسب‌وکارهای واقعی
            </h2>
            <p className="text-xs text-[#64748B]">
              تعیین کنید کدام سالن در صدر جست‌وجو یا بنر صفحه اول باشد، در چه
              رتبه‌ای قرار بگیرد، چند روز اعتبار تبلیغاتی یا پیامک اضافه داشته باشد
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
              <span>انتخاب کسب‌وکار و تنظیم جایگاه / پلن / پیامک</span>
            </Button>
          ) : null}
        </div>

        <ResponsiveTable
          keyExtractor={(b) => b.id}
          data={businesses.filter((b) => !b.isSampleShowcase)}
          emptyMessage="هنوز کسب‌وکار واقعی ثبت‌نام‌شده‌ای وجود ندارد. به‌محض ثبت سالن جدید، می‌توانید پلن، پیامک و جایگاه تبلیغاتی آن را در این بخش تنظیم کنید."
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

/** ۷. گزارش‌های تحلیلی پلتفرم (/admin/reports) — فقط بر اساس آمار واقعی دیتابیس (بدون نمونه‌های نمایشی) */
export const AdminReportsPage: React.FC = () => {
  const { businesses, appointments, paymentOrders, supportTickets } =
    usePrototypeData();

  const realBusinesses = businesses.filter((b) => !b.isSampleShowcase);
  const realAppointments = appointments.filter((a) =>
    realBusinesses.some((b) => b.id === a.businessId)
  );
  const approvedOrders = paymentOrders.filter((o) => o.status === 'APPROVED');
  const totalRevenueToman = approvedOrders.reduce(
    (sum, o) => sum + (Number(o.amountToman) || 0),
    0
  );

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
        kicker="گزارش‌های کلان · آمار واقعی پلتفرم در اصفهان و درچه"
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
              هنوز کسب‌وکار واقعی خارج از نمونه‌های نمایشی ثبت نشده است. به‌محض ثبت اولین سالن، نمودار تفکیک محله‌های اصفهان و درچه به‌صورت خودکار محاسبه می‌شود.
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

