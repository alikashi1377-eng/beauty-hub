import { loadServerEnv } from '../config/env';
import { closeDatabasePool, getOrCreatePool } from './pool';
import { runMigrationsOnPool } from './migrate';

/**
 * اسکریپت اجرای دستی Migrationهای PostgreSQL 17 (فراخوانی با: npm run db:migrate)
 * این فایل در زمان Build یا Start سرور به صورت خودکار اجرا نمی‌شود و تنها زمانی که
 * اپراتور صراحتاً دستور `npm run db:migrate` را با DATABASE_URL معتبر اجرا کند، فراخوانی می‌گردد.
 */
async function main() {
  const config = loadServerEnv();

  if (!config.databaseUrl) {
    console.error(
      '[BeautyHub Migrate] خطا: متغیر محیطی DATABASE_URL تنظیم نشده است. اجرای Migration متوقف شد.'
    );
    process.exit(1);
  }

  if (!config.isDatabaseUrlValid) {
    console.error(
      '[BeautyHub Migrate] خطا: فرمت متغیر محیطی DATABASE_URL معتبر نیست. اجرای Migration متوقف شد.'
    );
    process.exit(1);
  }

  const pool = getOrCreatePool(config);
  if (!pool) {
    console.error(
      '[BeautyHub Migrate] خطا: امکان ایجاد استخر اتصال دیتابیس وجود ندارد.'
    );
    process.exit(1);
  }

  try {
    console.log('[BeautyHub Migrate] شروع بررسی و اجرای فایل‌های Migration...');
    const summary = await runMigrationsOnPool(pool);
    console.log(
      `[BeautyHub Migrate] تکمیل شد: کل فایل‌ها=${summary.totalFiles}، اجراشده قبلی=${summary.alreadyAppliedCount}، جدید=${summary.newlyAppliedVersions.length}`
    );
    if (summary.newlyAppliedVersions.length > 0) {
      console.log(
        `[BeautyHub Migrate] نسخه‌های جدید اعمال‌شده: ${summary.newlyAppliedVersions.join(', ')}`
      );
    }
  } catch (err) {
    console.error(
      '[BeautyHub Migrate] خطا در اجرای Migration:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}

main();
