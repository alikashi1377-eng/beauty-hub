import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, User, X } from 'lucide-react';
import { IRAN_CITIES } from '../../mocks/sampleData';
import { usePrototypeData } from '../../context/PrototypeDataContext';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedCity, setSelectedCity } = usePrototypeData();

  const navItems = [
    { to: '/search', label: 'جست‌وجوی سالن' },
    { to: '/categories', label: 'دسته‌بندی‌ها' },
    { to: '/pricing', label: 'تعرفه کسب‌وکارها' },
    { to: '/about', label: 'درباره ما' },
    { to: '/help', label: 'راهنما' },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-[#E6E3EE] sticky top-0 z-30">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: تک‌المان برند */}
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-[#2A0F54] whitespace-nowrap shrink-0"
        >
          BeautyHub
        </Link>

        {/* Zone 2: ۵ لینک ناوبری تک‌خطی */}
        <nav
          aria-label="ناوبری اصلی عمومی"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#4A4458]"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                  isActive
                    ? 'text-[#2A0F54] border-[#2A0F54] font-bold'
                    : 'border-transparent hover:text-[#120F1D] hover:border-[#D0CADF]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: ورود و فراخوان اصلی ثبت کسب‌وکار */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#4A4458] hover:text-[#120F1D] hover:bg-[#F4F3F8] rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <User className="w-3.5 h-3.5" />
            <span>ورود / حساب من</span>
          </Link>

          <Link
            to="/business/register"
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#2A0F54] rounded-xl hover:bg-[#1D093B] transition-colors whitespace-nowrap shrink-0"
          >
            ثبت رایگان کسب‌وکار
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl text-[#120F1D] hover:bg-[#F4F3F8] cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'بستن منوی اصلی' : 'باز کردن منوی اصلی'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* منوی کشویی موبایل و تبلت */}
      {mobileMenuOpen ? (
        <nav
          aria-label="منوی موبایل عمومی"
          className="lg:hidden border-t border-[#E6E3EE] bg-white px-4 py-3.5 space-y-3"
        >
          <div className="flex items-center justify-between bg-[#F4F3F8] p-2.5 rounded-xl text-xs">
            <span className="font-semibold text-[#4A4458]">شهر پیش‌فرض جست‌وجو:</span>
            <select
              aria-label="انتخاب شهر در موبایل"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white border border-[#D0CADF] rounded-lg px-2.5 py-1 font-semibold text-[#120F1D]"
            >
              <option value="ALL">همه شهرها</option>
              {IRAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#F3EEFA] text-[#2A0F54] font-bold'
                      : 'text-[#4A4458] hover:bg-[#F4F3F8]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="pt-2.5 border-t border-[#E6E3EE] grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-center text-[#120F1D] px-3 py-2 rounded-xl bg-[#F4F3F8]"
            >
              ورود مشتری (/login)
            </Link>
            <Link
              to="/me"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-center text-[#120F1D] px-3 py-2 rounded-xl bg-[#F4F3F8]"
            >
              حساب مشتری (/me)
            </Link>
            <Link
              to="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-center text-[#120F1D] px-3 py-2 rounded-xl bg-[#F4F3F8]"
            >
              پنل کسب‌وکار (/app)
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-center text-[#120F1D] px-3 py-2 rounded-xl bg-[#F4F3F8]"
            >
              پنل مدیریت (/admin)
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
};
