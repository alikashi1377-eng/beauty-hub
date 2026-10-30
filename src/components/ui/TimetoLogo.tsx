import React from 'react';

export const TIMETO_LOGO_IMAGE_PATH = '/icon.svg';
export const TIMETO_BRAND_LOGO_URL = TIMETO_LOGO_IMAGE_PATH;
export const TIMETO_SHOWCASE_IMAGE_PATH = '/icon.svg';

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
        className="w-full h-full object-contain"
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
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  const textColor = resolvedTheme === 'dark' ? 'text-white' : 'text-[#061138]';
  const badgeBg =
    resolvedTheme === 'dark'
      ? 'bg-[#00D4FF]/20 text-[#4DF0FF] border-[#00D4FF]/30'
      : 'bg-[#061138] text-[#4DF0FF] border-[#0057FF]/30';

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      {/* لوگوی وکتور باکیفیت Timeto */}
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
 * صفحه اسپلش / پیش‌نمایش شروع اپلیکیشن با لوگوی وکتور شفاف و اندازه استاندارد اپ
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
        {/* آیکون اپ با ابعاد و حاشیه استاندارد iOS/Android و کیفیت وکتور بی‌نهایت */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] overflow-hidden border border-[#00E5FF]/35 shadow-[0_0_44px_rgba(0,229,255,0.3)] bg-[#030B26] flex items-center justify-center">
          <img
            src={TIMETO_LOGO_IMAGE_PATH}
            alt="Timeto App Icon"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span
              dir="ltr"
              className="text-2xl font-black tracking-wider text-white"
            >
              Timeto
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/35 text-[11px] font-extrabold text-[#00E5FF]">
              تایم تو
            </span>
          </div>
        </div>

        <div className="w-32 h-1 rounded-full bg-white/12 overflow-hidden">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#0057FF] to-[#00E5FF] animate-pulse" />
        </div>
      </div>
    </div>
  );
};
