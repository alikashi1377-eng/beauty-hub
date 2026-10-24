import React, { useState } from 'react';
import {
  Plus,
  Check,
  X,
  Building2,
  CreditCard,
  Layers,
  TrendingUp,
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

/** ۱. داشبورد مدیریت پلتفرم (/admin) */
export const AdminDashboardPage: React.FC = () => {
  const { businesses, categories, updateBusinessApproval } = usePrototypeData();
  const pendingCount = businesses.filter(
    (b) => b.approvalStatus === 'PENDING_REVIEW'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="کنسول مدیریت کلان · BeautyHub Governance"
        title="داشبورد مدیریت کلان پلتفرم"
        subtitle="پایش کسب‌وکارهای عضو، اشتراک‌های ماهانه، دسته‌بندی‌های بازارچه و صف بررسی مدارک"
        routePattern="/admin"
        breadcrumbs={[{ label: 'پنل مدیریت پلتفرم' }, { label: 'داشبورد کلان' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">
              کسب‌وکارهای ثبت‌شده
            </p>
            <Building2 className="w-4 h-4 text-[#2A0F54]" />
          </div>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(businesses.length)} مرکز نمونه
          </p>
          <p className="text-[11px] text-amber-800 font-bold tabular-nums">
            {toPersianDigits(pendingCount)} مورد در صف بررسی مدارک
          </p>
        </Card>

        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">
              اشتراک‌های فعال ماهانه
            </p>
            <CreditCard className="w-4 h-4 text-[#2A0F54]" />
          </div>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(4)} اشتراک تجاری
          </p>
          <p className="text-[11px] text-[#4E4760]">+ ۱ دوره آزمایشی ۱۴ روزه</p>
        </Card>

        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">
              دسته‌بندی‌های بازارچه
            </p>
            <Layers className="w-4 h-4 text-[#2A0F54]" />
          </div>
          <p className="text-2xl font-extrabold text-[#171226] tabular-nums">
            {toPersianDigits(categories.length)} سرفصل فعال
          </p>
          <p className="text-[11px] text-[#4E4760]">
            پوشش کامل خدمات زنانه و مردانه
          </p>
        </Card>

        <Card padding="sm" className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#787189]">
              درآمد ماهانه اشتراک‌ها (MRR)
            </p>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-extrabold text-[#2A0F54] tabular-nums">
            {formatPriceToman(6640000)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold">
            نرخ تمدید ماهانه: ۸۹٪ (نمونه)
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#171226]">
            صف بررسی و وضعیت کسب‌وکارهای عضو
          </h2>
          <span className="text-xs text-[#787189]">
            تایید یا رد سریع در وضعیت دمو
          </span>
        </div>

        <ResponsiveTable
          keyExtractor={(b) => b.id}
          data={businesses}
          columns={[
            {
              key: 'name',
              header: 'نام کسب‌وکار',
              render: (b) => (
                <div>
                  <p className="font-extrabold text-[#171226]">{b.name}</p>
                  <p dir="ltr" className="text-[11px] font-mono text-[#787189]">
                    /{b.slug}
                  </p>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'نوع فعالیت / شهر',
              render: (b) => (
                <span className="font-medium text-[#4E4760]">
                  {b.typeLabel} · {b.city}
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
              header: 'تایید / رد سریع (دمو)',
              render: (b) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateBusinessApproval(b.id, 'APPROVED')}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>تایید</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateBusinessApproval(b.id, 'REJECTED')}
                    className="text-red-700 hover:bg-red-50"
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
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[#E6E3EE]">
          {[
            { id: 'ALL', label: 'همه مراکز', count: businesses.length },
            {
              id: 'APPROVED',
              label: 'تاییدشده',
              count: businesses.filter((b) => b.approvalStatus === 'APPROVED')
                .length,
            },
            {
              id: 'PENDING_REVIEW',
              label: 'در انتظار بررسی',
              count: businesses.filter(
                (b) => b.approvalStatus === 'PENDING_REVIEW'
              ).length,
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
                    ? 'bg-[#2A0F54] text-white'
                    : 'bg-[#FAF9FC] text-[#4E4760] border border-[#E6E3EE]'
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
              <span className="font-extrabold text-[#171226]">{b.name}</span>
            ),
          },
          {
            key: 'slug',
            header: 'شناسه مسیر (Slug)',
            render: (b) => (
              <span
                dir="ltr"
                className="font-mono text-xs bg-[#F4F3F8] px-2 py-0.5 rounded text-[#2A0F54]"
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
            header: 'وضعیت احراز دمو',
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
        title="تایید رد صلاحیت آزمایشی کسب‌وکار"
        confirmLabel="بله، وضعیت به ردشده تغییر کند"
        message={`آیا از تغییر وضعیت «${rejectTargetBiz?.name ?? ''}» به حالت ردشده اطمینان دارید؟`}
      />
    </div>
  );
};

/** ۳. مدیریت کاربران (/admin/users) */
export const AdminUsersPage: React.FC = () => {
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

  const filtered =
    roleFilter === 'ALL'
      ? sampleUsers
      : sampleUsers.filter((u) => u.role === roleFilter);

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
              { value: 'مدیر سالن', label: 'مدیر سالن' },
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
              <span className="font-extrabold text-[#171226]">{u.name}</span>
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
        title="مدیریت دسته‌بندی‌های خدمات بازارچه"
        subtitle="افزودن و ویرایش سرفصل‌های استاندارد خدمات زیبایی در حالت دمو"
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
              <span className="font-extrabold text-[#171226]">{c.title}</span>
            ),
          },
          {
            key: 'slug',
            header: 'شناسه (Slug)',
            render: (c) => (
              <span
                dir="ltr"
                className="font-mono text-xs bg-[#F4F3F8] px-2 py-0.5 rounded text-[#2A0F54]"
              >
                {c.slug}
              </span>
            ),
          },
          {
            key: 'subtitle',
            header: 'زیرعنوان و شرح خدمات',
            render: (c) => (
              <span className="text-xs text-[#4E4760]">{c.subtitle}</span>
            ),
          },
          {
            key: 'count',
            header: 'تعداد خدمات نمونه',
            render: (c) => (
              <span className="tabular-nums font-bold text-[#2A0F54]">
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
          editingCat ? 'ویرایش دسته‌بندی (دمو)' : 'افزودن دسته‌بندی جدید (دمو)'
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
        kicker="مدل درآمدی B2B · اشتراک ماهانه"
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
              <h2 className="text-base font-extrabold text-[#171226]">
                {plan.name}
              </h2>
              {plan.isRecommended ? (
                <StatusBadge label="پرفروش" tone="accent" />
              ) : null}
            </div>
            <p className="text-xl font-extrabold text-[#2A0F54] tabular-nums">
              {formatPriceToman(plan.monthlyPriceToman)}
            </p>
            <p className="text-xs text-[#4E4760]">ظرفیت: {plan.staffLimit}</p>
            <p className="text-xs text-[#4E4760] tabular-nums">
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
              <span className="font-extrabold text-[#171226]">{b.name}</span>
            ),
          },
          {
            key: 'plan',
            header: 'پلن انتخابی',
            render: (b) => (
              <span className="font-bold text-[#2A0F54]">
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
  const sampleInvoices = [
    {
      id: 'INV-901',
      business: 'سالن زیبایی رویال گلزار',
      plan: 'پلن حرفه‌ای',
      amount: 980000,
      date: '۱۴۰۵/۰۸/۰۱',
      status: 'پرداخت آزمایشی موفق',
    },
    {
      id: 'INV-902',
      business: 'آرایشگاه مردانه پارسه استایل',
      plan: 'پلن حرفه‌ای',
      amount: 980000,
      date: '۱۴۰۵/۰۷/۲۸',
      status: 'پرداخت آزمایشی موفق',
    },
    {
      id: 'INV-903',
      business: 'مرکز تخصصی نیلوفر آبی',
      plan: 'کسب‌وکار پیشرفته',
      amount: 1850000,
      date: '۱۴۰۵/۰۷/۲۵',
      status: 'پرداخت آزمایشی موفق',
    },
    {
      id: 'INV-904',
      business: 'لانژ زیبایی و اسپا آوا',
      plan: 'کسب‌وکار پیشرفته',
      amount: 1850000,
      date: '۱۴۰۵/۰۷/۲۰',
      status: 'پرداخت آزمایشی موفق',
    },
  ];

  return (
    <div>
      <PageHeader
        kicker="مالی و صورتحساب · تراکنش‌های اشتراک"
        title="صورتحساب‌ها و تراکنش‌های اشتراک"
        subtitle="گزارش صورتحساب‌های آزمایشی حق اشتراک ماهانه کسب‌وکارها"
        routePattern="/admin/payments"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تراکنش‌های اشتراک' },
        ]}
      />

      <ResponsiveTable
        keyExtractor={(i) => i.id}
        data={sampleInvoices}
        columns={[
          {
            key: 'id',
            header: 'شماره صورتحساب',
            render: (i) => (
              <span className="font-mono text-xs font-bold text-[#2A0F54] bg-[#F4F3F8] px-2 py-0.5 rounded">
                {i.id}
              </span>
            ),
          },
          {
            key: 'biz',
            header: 'کسب‌وکار',
            render: (i) => (
              <span className="font-extrabold text-[#171226]">{i.business}</span>
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
              <span className="tabular-nums font-extrabold text-[#2A0F54]">
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
    </div>
  );
};

/** ۷. گزارش‌های تحلیلی پلتفرم (/admin/reports) */
export const AdminReportsPage: React.FC = () => {
  const cityBreakdown = [
    { city: 'تهران', pct: 50, count: '۳ مرکز نمونه' },
    { city: 'شیراز', pct: 17, count: '۱ مرکز نمونه' },
    { city: 'اصفهان', pct: 17, count: '۱ مرکز نمونه' },
    { city: 'مشهد', pct: 16, count: '۱ مرکز نمونه' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="هوش تجاری پلتفرم · آمار کلان"
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
          <h2 className="text-sm font-extrabold text-[#171226]">
            توزیع کسب‌وکارهای نمونه بر اساس شهر
          </h2>
          <div className="space-y-3.5">
            {cityBreakdown.map((item) => (
              <div key={item.city} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-[#171226]">{item.city}</span>
                  <span className="font-bold text-[#4E4760] tabular-nums">
                    {toPersianDigits(item.pct)}٪ ({item.count})
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

        <Card className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-extrabold text-[#171226]">
              شاخص ماندگاری و تمدید اشتراک ماهانه (Retention)
            </h2>
            <p className="text-3xl font-extrabold text-[#2A0F54] tabular-nums">
              {toPersianDigits(89)}٪
            </p>
            <p className="text-xs text-[#4E4760] leading-relaxed">
              میانگین نرخ تمدید اشتراک سالن‌ها پس از پایان دوره آزمایشی ۱۴ روزه
              در مدل شبیه‌سازی‌شده محصول.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E6E3EE] text-xs text-[#787189]">
            بیشترین تقاضای رزرو آنلاین در ماه جاری: لاین «مو و رنگ» و «ناخن و
            مانیکور».
          </div>
        </Card>
      </div>
    </div>
  );
};

/** ۸. تنظیمات کلان سامانه (/admin/settings) */
export const AdminSettingsPage: React.FC = () => {
  const { showToast } = usePrototypeData();
  const [brandName, setBrandName] = useState('BeautyHub');
  const [trialDays, setTrialDays] = useState('14');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('تنظیمات کلان پلتفرم در حالت دمو ذخیره شد.');
  };

  return (
    <div>
      <PageHeader
        kicker="پیکربندی سامانه · تنظیمات پایه"
        title="تنظیمات کلان سامانه"
        subtitle="پیکربندی عمومی نام پلتفرم، مدت دوره آزمایشی رایگان و سیاست‌های بررسی کسب‌وکارها"
        routePattern="/admin/settings"
        breadcrumbs={[
          { label: 'پنل مدیریت', href: '/admin' },
          { label: 'تنظیمات پلتفرم' },
        ]}
      />

      <Card padding="lg" className="max-w-xl">
        <form onSubmit={handleSave} className="space-y-4">
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
          <div className="pt-2">
            <Button type="submit" variant="primary">
              ذخیره تنظیمات آزمایشی
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
