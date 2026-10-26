import React from 'react';
import { Link } from 'react-router-dom';
import { usePrototypeData } from '../../context/PrototypeDataContext';
import { TimetoLogo, TIMETO_SHOWCASE_IMAGE_PATH } from '../ui/TimetoLogo';

export const PublicFooter: React.FC = () => {
  const { authUser, dataMode } = usePrototypeData();
  const isPlatformAdmin =
    dataMode === 'real' &&
    Boolean(
      authUser?.isPlatformAdmin && authUser?.roles.includes('PLATFORM_ADMIN')
    );

  return (
    <footer className="bg-[#061138] text-white border-t border-[#1E293B] mt-14">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 pb-8 border-b border-white/15">
          <div className="lg:col-span-4 space-y-3">
            <Link to="/" className="inline-flex items-center">
              <TimetoLogo
                size="md"
                theme="dark"
                subtitle="تایم تو · وقت زیبایی تو، به انتخاب تو"
              />
            </Link>
            <p className="text-xs font-medium text-slate-300 leading-relaxed max-w-sm">
              پلتفرم هوشمند رزرو آنلاین سالن‌های زیبایی، آرایشگاه‌های مردانه و
              متخصصان برتر اصفهان به همراه وب‌اپلیکیشن قابل نصب روی موبایل.
            </p>
            <div className="pt-1 flex items-center gap-2.5">
              <img
                src={TIMETO_SHOWCASE_IMAGE_PATH}
                alt="اپلیکیشن موبایل Timeto"
                loading="lazy"
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
              />
              <span className="text-[11px] text-slate-300 leading-snug">
                نسخه وب‌اپلیکیشن (PWA) قابل نصب روی آیفون و اندروید بدون نیاز به آپدیت دستی
              </span>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-2.5">
            <h3 className="text-xs font-extrabold text-[#00E5FF]">
              کشف سالن و خدمات
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link
                  to="/search"
                  className="hover:text-white transition-colors"
                >
                  جست‌وجوی سالن و متخصص
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="hover:text-white transition-colors"
                >
                  دسته‌بندی خدمات زیبایی
                </Link>
              </li>
              <li>
                <Link
                  to="/salon/royal-golzar"
                  className="hover:text-white transition-colors"
                >
                  نمونه پروفایل سالن زیبایی
                </Link>
              </li>
              <li>
                <Link
                  to="/pro/sara-rad"
                  className="hover:text-white transition-colors"
                >
                  نمونه پروفایل متخصص مستقل
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-2.5">
            <h3 className="text-xs font-extrabold text-[#00E5FF]">
              مراجعان و نوبت‌دهی
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  ورود سریع با شماره موبایل
                </Link>
              </li>
              <li>
                <Link
                  to="/me/appointments"
                  className="hover:text-white transition-colors"
                >
                  پیگیری و مدیریت نوبت‌ها
                </Link>
              </li>
              <li>
                <Link
                  to="/me/favorites"
                  className="hover:text-white transition-colors"
                >
                  سالن‌های منتخب من
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="hover:text-white transition-colors"
                >
                  راهنمای رزرو و قوانین بیعانه
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <h3 className="text-xs font-extrabold text-[#00E5FF]">
              مدیران سالن و متخصصان
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link
                  to="/business/register"
                  className="hover:text-white transition-colors"
                >
                  ثبت‌نام رایگان کسب‌وکار
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="hover:text-white transition-colors"
                >
                  پلن‌ها و تعرفه اشتراک
                </Link>
              </li>
              <li>
                <Link
                  to="/app"
                  className="hover:text-white transition-colors"
                >
                  ورود به پنل مدیریت سالن
                </Link>
              </li>
              {isPlatformAdmin ? (
                <li>
                  <Link
                    to="/admin"
                    className="hover:text-[#00E5FF] transition-colors font-bold"
                  >
                    کنسول مدیریت پلتفرم
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
          <p>© ۱۴۰۵ Timeto (تایم تو) — کلیه حقوق محفوظ است.</p>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-white transition-colors">
              درباره ما
            </Link>
            <Link to="/help" className="hover:text-white transition-colors">
              پشتیبانی و پرسش‌های متداول
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
