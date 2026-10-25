import React from 'react';
import { Link } from 'react-router-dom';
import { usePrototypeData } from '../../context/PrototypeDataContext';

export const PublicFooter: React.FC = () => {
  const { authUser, dataMode } = usePrototypeData();
  const isPlatformAdmin =
    dataMode === 'real' &&
    Boolean(
      authUser?.isPlatformAdmin && authUser?.roles.includes('PLATFORM_ADMIN')
    );

  return (
    <footer className="bg-white border-t border-[#E6E3EE] mt-20">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-[#E6E3EE]">
          <div className="lg:col-span-4 space-y-3">
            <Link
              to="/"
              dir="ltr"
              className="text-lg font-bold tracking-tight text-[#2A0F54]"
            >
              BeautyHub
            </Link>
            <p className="text-xs sm:text-sm font-normal text-[#4A4458] leading-relaxed max-w-sm">
              بازارچه تخصصی رزرو آنلاین خدمات زیبایی و نرم‌افزار یکپارچه مدیریت
              سالن‌های زیبایی زنانه، آرایشگاه‌های مردانه و متخصصان مستقل در ایران.
            </p>
            <p className="text-xs text-[#756F86]">
              پلتفرم یکپارچه نوبت‌دهی آنلاین و مدیریت سالن‌های زیبایی
            </p>
          </div>

          <div className="lg:col-span-3 space-y-2.5">
            <h3 className="text-xs font-semibold text-[#120F1D]">
              بازارچه و کشف خدمات
            </h3>
            <ul className="space-y-2 text-xs text-[#4A4458]">
              <li>
                <Link to="/search" className="hover:text-[#2A0F54] transition-colors">
                  جست‌وجوی سالن و متخصص
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="hover:text-[#2A0F54] transition-colors"
                >
                  دسته‌بندی خدمات زیبایی
                </Link>
              </li>
              <li>
                <Link
                  to="/salon/royal-golzar"
                  className="hover:text-[#2A0F54] transition-colors"
                >
                  پروفایل نمونه سالن زیبایی
                </Link>
              </li>
              <li>
                <Link
                  to="/pro/sara-rad"
                  className="hover:text-[#2A0F54] transition-colors"
                >
                  پروفایل نمونه متخصص مستقل
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-2.5">
            <h3 className="text-xs font-semibold text-[#120F1D]">
              مشتریان و نوبت‌دهی
            </h3>
            <ul className="space-y-2 text-xs text-[#4A4458]">
              <li>
                <Link
                  to="/booking/royal-golzar"
                  className="hover:text-[#2A0F54] transition-colors"
                >
                  رزرو آنلاین نوبت
                </Link>
              </li>
              <li>
                <Link to="/me" className="hover:text-[#2A0F54] transition-colors">
                  پیشخوان حساب مشتری
                </Link>
              </li>
              <li>
                <Link
                  to="/me/appointments"
                  className="hover:text-[#2A0F54] transition-colors"
                >
                  پیگیری و مدیریت نوبت‌های من
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-[#2A0F54] transition-colors">
                  مرکز راهنما و پرسش‌های متداول
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-2.5">
            <h3 className="text-xs font-semibold text-[#120F1D]">
              کسب‌وکارها و مدیریت
            </h3>
            <ul className="space-y-2 text-xs text-[#4A4458]">
              <li>
                <Link
                  to="/business/register"
                  className="hover:text-[#2A0F54] transition-colors"
                >
                  ثبت‌نام و راه‌اندازی سالن
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#2A0F54] transition-colors">
                  تعرفه پلن‌های اشتراک
                </Link>
              </li>
              <li>
                <Link to="/app" className="hover:text-[#2A0F54] transition-colors">
                  پنل مدیریت کسب‌وکار
                </Link>
              </li>
              {isPlatformAdmin ? (
                <li>
                  <Link
                    to="/admin"
                    className="hover:text-[#2A0F54] transition-colors"
                  >
                    کنسول مدیریت پلتفرم
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#756F86]">
          <p>
            © ۱۴۰۵ BeautyHub — کلیه حقوق این سامانه محفوظ است.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-[#120F1D]">
              درباره BeautyHub
            </Link>
            <Link to="/help" className="hover:text-[#120F1D]">
              پشتیبانی و راهنما
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
