import { AppointmentItem, AppointmentStatus, BusinessItem } from '../types';

/**
 * تشخیص دقیق محیط پیش‌نمایش AI Studio یا اجرای محلی توسعه
 * در دامنه‌های اصلی و تولید (timeto24.ir، liara.run و ...) همواره false برمی‌گرداند
 * تا نوار پیش‌نمایش حتی برای ۱ میلی‌ثانیه هم روی سایت واقعی ظاهر نشود.
 */
export function isAiStudioOrLocalPreviewHost(hostname?: string): boolean {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  if (
    host === 'timeto24.ir' ||
    host.endsWith('.timeto24.ir') ||
    host.endsWith('.liara.run')
  ) {
    return false;
  }
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.scf.usercontent.goog') ||
    host.endsWith('.aistudio.google.com') ||
    host.endsWith('.webcontainer.io')
  );
}

/**
 * گارد قطعی نمایش نوار پیش‌نمایش AI Studio:
 * تا زمانی که بارگذاری اولیه از سرور تمام نشده (isLoadingInitialData === true) یا دامنه تولیدی است،
 * نوار هرگز رندر نمی‌شود (جلوگیری از فلش ۱–۲ ثانیه‌ای در سایت زنده).
 */
export function shouldShowAiStudioPreviewBar(params: {
  dataMode: 'mock' | 'real';
  isLoadingInitialData: boolean;
  hostname?: string;
}): boolean {
  if (params.isLoadingInitialData) return false;
  if (params.dataMode !== 'mock') return false;
  return isAiStudioOrLocalPreviewHost(params.hostname);
}

/**
 * متن نمایشی پروفایل عمومی سالن:
 * اولویت با فیلد ویرایش‌شده «توضیحات کوتاه سالن» است تا ذخیره صاحب سالن بلافاصله روی پروفایل دیده شود.
 */
export function resolveDisplayBusinessDescription(
  business?: Pick<BusinessItem, 'shortDescription' | 'aboutText'> | null
): string {
  const shortDesc = String(business?.shortDescription || '').trim();
  const aboutText = String(business?.aboutText || '').trim();
  return shortDesc || aboutText;
}

/**
 * تعیین وضعیت نهایی نوبت هنگام همگام‌سازی:
 * وقتی داده مستقیماً از سرور می‌آید (authoritativeFromServer = true)، وضعیت دیتابیس همواره ارجح است
 * و وضعیت قدیمی CONFIRMED/PENDING داخل localStorage هرگز اجازه بازنویسی آن را ندارد.
 */
export function resolveMergedAppointmentStatus(params: {
  serverStatus: AppointmentStatus;
  localStatus?: AppointmentStatus | null;
  authoritativeFromServer: boolean;
}): AppointmentStatus {
  if (params.authoritativeFromServer) {
    return params.serverStatus;
  }
  return params.localStatus || params.serverStatus;
}

/**
 * گارد جلوگیری از صفر شدن نوبت‌ها در بارگذاری عمومی (/api/v1/bootstrap):
 * مسیر عمومی bootstrap آرایه appointments را ارسال نمی‌کند (undefined است).
 * هرگز نباید عدم ارسال این فیلد را به معنی «لیست خالی [] و پاکسازی کش» تلقی کرد.
 */
export function resolveBootstrapAppointmentsUpdate(params: {
  bootstrapAppointments: AppointmentItem[] | undefined | null;
  previousAppointments: AppointmentItem[];
  mergeAuthoritative: (serverApts: AppointmentItem[]) => AppointmentItem[];
}): { appointments: AppointmentItem[]; shouldPersist: boolean } {
  if (!Array.isArray(params.bootstrapAppointments)) {
    return {
      appointments: params.previousAppointments,
      shouldPersist: false,
    };
  }
  return {
    appointments: params.mergeAuthoritative(params.bootstrapAppointments),
    shouldPersist: true,
  };
}

/**
 * مشخص می‌کند آیا پاسخ /me/bootstrap مجاز به بازنویسی قطعی نوبت‌ها هست یا خیر.
 * برای مدیر کل پلتفرم یا صاحب سالن، /me/bootstrap فقط نوبت‌های شخصی فرد را برمی‌گرداند
 * و هرگز نباید کل نوبت‌های سالن/پلتفرم را بازنویسی کند.
 */
export function shouldCustomerBootstrapOverwriteAppointments(
  roles?: ReadonlyArray<string> | null
): boolean {
  if (!Array.isArray(roles)) return true;
  if (roles.includes('PLATFORM_ADMIN') || roles.includes('BUSINESS_OWNER')) {
    return false;
  }
  return true;
}

/**
 * تشخیص خطای 401 یا ابطال نشست سمت سرور برای جلوگیری از نمایش داده‌های ۰ بدون احراز هویت واقعی.
 */
export function isUnauthorizedSessionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const record = err as { status?: unknown; errorCode?: unknown };
  if (record.status === 401) return true;
  const code = String(record.errorCode || '').toUpperCase();
  return (
    code === 'AUTHENTICATION_REQUIRED' ||
    code === 'SESSION_EXPIRED' ||
    code === 'SESSION_REVOKED'
  );
}

