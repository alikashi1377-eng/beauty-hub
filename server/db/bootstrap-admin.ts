import { loadServerEnv } from '../config/env';
import { closeDatabasePool, getOrCreatePool } from './pool';
import { bootstrapInitialPlatformAdminInDb } from '../repositories/beautyhubRepository';

/**
 * اسکریپت یک‌بارمصرف و امن ایجاد اولین مدیر کل سامانه (PLATFORM_ADMIN)
 * اجرا به صورت دستی پس از اجرای Migrationها:
 *   INITIAL_ADMIN_PHONE="0912..." npm run db:bootstrap-admin
 *
 * نکات امنیتی:
 * - هیچ شماره موبایل یا رمز پیش‌فرض ثابتی در کد وجود ندارد.
 * - تنها زمانی اجرا می‌شود که هیچ ادمین فعالی در جدول platform_admins وجود نداشته باشد.
 */
async function main() {
  const config = loadServerEnv();

  if (!config.databaseUrl || !config.isDatabaseUrlValid) {
    console.error(
      '[BeautyHub Bootstrap Admin] خطا: متغیر محیطی DATABASE_URL تنظیم نشده یا نامعتبر است.'
    );
    process.exit(1);
  }

  const rawPhone =
    process.env.INITIAL_ADMIN_PHONE?.trim() || process.argv[2]?.trim() || '';
  const fullName =
    process.env.INITIAL_ADMIN_FULL_NAME?.trim() || 'مدیر ارشد پلتفرم';

  if (!rawPhone) {
    console.error(
      '[BeautyHub Bootstrap Admin] خطا: متغیر محیطی INITIAL_ADMIN_PHONE تنظیم نشده است.'
    );
    process.exit(1);
  }

  const pool = getOrCreatePool(config);
  if (!pool) {
    console.error(
      '[BeautyHub Bootstrap Admin] خطا در ایجاد Pool اتصال به دیتابیس.'
    );
    process.exit(1);
  }

  try {
    const created = await bootstrapInitialPlatformAdminInDb(pool, {
      phone: rawPhone,
      fullName,
    });
    const maskedPhone = `${created.phone.slice(0, 4)}***${created.phone.slice(-2)}`;
    console.log(
      `[BeautyHub Bootstrap Admin] اولین حساب مدیر کل سامانه (PLATFORM_ADMIN) با موفقیت برای شماره ${maskedPhone} (userId=${created.userId}) ایجاد شد.`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg === 'PLATFORM_ADMIN_ALREADY_BOOTSTRAPPED') {
      console.error(
        '[BeautyHub Bootstrap Admin] رد شد: قبلاً حداقل یک مدیر فعال در جدول platform_admins ثبت شده است و این ابزار یک‌بارمصرف دیگر مجاز به اجرا نیست.'
      );
    } else {
      console.error('[BeautyHub Bootstrap Admin] خطا:', msg);
    }
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}

void main();
