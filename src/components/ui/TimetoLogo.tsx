import React from 'react';

export const TIMETO_LOGO_IMAGE_PATH =
  '/assets/aistudio/photo_2026-10-26_09-25-182_bded1c84.jpg';
export const TIMETO_BRAND_LOGO_URL = TIMETO_LOGO_IMAGE_PATH;
export const TIMETO_SHOWCASE_IMAGE_PATH =
  '/assets/aistudio/photo_2026-10-26_09-25-182_bded1c84.jpg';

export const TimetoIconMark: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const iconBoxSize =
    size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : size === 'lg'
        ? 'w-12 h-12 rounded-2xl'
        : size === 'xl'
          ? 'w-24 h-24 rounded-3xl'
          : 'w-10 h-10 rounded-2xl';

  return (
    <div
      className={`relative ${iconBoxSize} bg-[#02081D] border border-[#00D4FF]/35 shadow-[0_6px_18px_-4px_rgba(0,132,255,0.45)] flex items-center justify-center overflow-hidden shrink-0 ${className}`}
    >
      <img
        src={TIMETO_LOGO_IMAGE_PATH}
        alt="لوگوی تایم تو (Timeto)"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export const TimetoLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  theme?: 'light' | 'dark';
  subtitle?: string;
  showPersianSubtitle?: boolean;
}> = ({
  size = 'md',
  variant,
  theme,
  subtitle,
  showPersianSubtitle = true,
}) => {
  const resolvedTheme = theme ?? variant ?? 'light';

  const brandTextSize =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
        ? 'text-2xl'
        : 'text-xl';

  const textColor = resolvedTheme === 'dark' ? 'text-white' : 'text-[#061138]';
  const badgeBg =
    resolvedTheme === 'dark'
      ? 'bg-[#00D4FF]/20 text-[#4DF0FF] border-[#00D4FF]/30'
      : 'bg-[#061138] text-[#4DF0FF] border-[#0057FF]/30';

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      {/* تصویر لوگوی اصلی Timeto */}
      <TimetoIconMark size={size} />

      {/* تایپوگرافی برند Timeto | تایم تو */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-2">
          <span
            dir="ltr"
            style={{ fontFamily: "'Plus Jakarta Sans', 'Estedad', sans-serif" }}
            className={`${brandTextSize} font-extrabold tracking-tight ${textColor}`}
          >
            Timeto
          </span>
          {showPersianSubtitle ? (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeBg}`}
            >
              تایم تو
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <span
            className={`hidden sm:block text-[11px] font-semibold mt-1 ${
              resolvedTheme === 'dark' ? 'text-[#94A3B8]' : 'text-[#475569]'
            }`}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
};

/**
 * صفحه اسپلش / راه‌اندازی اولیه اپلیکیشن (هنگام بالا آمدن اپ) با لوگوی رسمی تایم تو
 */
export const TimetoStartupSplash: React.FC<{ visible: boolean }> = ({
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="در حال راه‌اندازی اپلیکیشن تایم تو"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#02081D] text-white transition-opacity duration-300"
    >
      <div className="relative flex flex-col items-center gap-5 px-6 text-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-2 border-[#00E5FF]/40 shadow-[0_0_48px_rgba(0,212,255,0.35)] bg-[#02081D]">
          <img
            src={TIMETO_LOGO_IMAGE_PATH}
            alt="Timeto App Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span
              dir="ltr"
              className="text-2xl sm:text-3xl font-black tracking-tight text-white"
            >
              Timeto
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-xs font-extrabold text-[#00E5FF]">
              تایم تو
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            رزرو آنلاین سالن‌های زیبایی و متخصصان
          </p>
        </div>

        <div className="w-40 h-1.5 rounded-full bg-white/15 overflow-hidden mt-1">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#0057FF] to-[#00E5FF] animate-pulse" />
        </div>
      </div>
    </div>
  );
};
