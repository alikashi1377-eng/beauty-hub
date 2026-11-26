import { AppointmentStatus, BusinessItem } from '../types';

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
