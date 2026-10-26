import React from 'react';

export const TIMETO_LOGO_IMAGE_PATH =
  '/assets/aistudio/photo_2026-10-26_09-25-18_f42e916e.jpg';
export const TIMETO_SHOWCASE_IMAGE_PATH =
  '/assets/aistudio/photo_2026-10-26_09-25-12_fd4cca7d.jpg';

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
  const iconBoxSize =
    size === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-10 h-10 rounded-2xl';

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
      {/* آیکون اصلی Timeto منطبق با لوگوی بارگذاری‌شده */}
      <div
        className={`relative ${iconBoxSize} bg-gradient-to-br from-[#0A1D56] via-[#061138] to-[#030920] border border-[#0084FF]/40 shadow-[0_6px_18px_-4px_rgba(0,87,255,0.45)] flex items-center justify-center overflow-hidden shrink-0`}
      >
        <svg
          viewBox="0 0 256 256"
          className="w-7 h-7"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="tm-top"
              x1="36"
              y1="74"
              x2="162"
              y2="112"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#007BFF" />
            </linearGradient>
            <linearGradient
              id="tm-stem"
              x1="120"
              y1="74"
              x2="108"
              y2="204"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="55%" stopColor="#0084FF" />
              <stop offset="100%" stopColor="#0051FF" />
            </linearGradient>
          </defs>
          <path
            d="M84 72H158C136 86 118 106 112 114H56C47.1634 114 42 106.5 45.5 97.5C51.5 82 66.5 72 84 72Z"
            fill="url(#tm-top)"
          />
          <path
            d="M158 72C145 82 138 96 138 114V168C138 187.882 121.882 204 102 204C87.6406 204 76 192.359 76 178V144C76 112 108 84 146 72H158Z"
            fill="url(#tm-stem)"
          />
          <circle cx="186" cy="92" r="24" fill="#00E5FF" />
          <path
            d="M184 79V93H196"
            stroke="#061138"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

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
