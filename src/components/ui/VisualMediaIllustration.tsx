import React from 'react';
import { Gem, Scissors, Sparkles, UserCheck } from 'lucide-react';

export interface VisualMediaIllustrationProps {
  theme: 'rose' | 'slate' | 'emerald' | 'violet';
  categoryLabel: string;
  title: string;
  city: string;
  subtitle?: string;
  composition?: 'arch' | 'mirror' | 'botanical' | 'atelier' | 'barber' | 'editorial';
  className?: string;
}

/**
 * تصویرساز معماری و ادیتوریال اختصاصی BeautyHub
 * دارای ۶ ترکیب‌بندی بصری متفاوت بر اساس نوع مرکز و دسته‌بندی برای جلوگیری از تکرار یکنواخت کارت‌ها
 */
export const VisualMediaIllustration: React.FC<VisualMediaIllustrationProps> = ({
  theme,
  categoryLabel,
  title,
  city,
  subtitle,
  composition,
  className = 'aspect-[16/10]',
}) => {
  const palette = {
    rose: {
      bg: 'bg-gradient-to-br from-[#F9EDF2] via-[#F2DCE6] to-[#E5C4D4]',
      stroke: 'stroke-[#831843]/25',
      fillSoft: 'fill-white/55',
      fillAccent: 'fill-[#9D174D]/12',
      titleColor: 'text-[#4A0D29]',
      metaColor: 'text-[#831843]/85',
      scrim: 'from-[#3B0820]/15 via-transparent to-transparent',
      icon: <Sparkles className="w-4 h-4 text-[#831843]" aria-hidden="true" />,
    },
    slate: {
      bg: 'bg-gradient-to-br from-[#EEF2F6] via-[#DCE4EE] to-[#C3D0E0]',
      stroke: 'stroke-slate-800/25',
      fillSoft: 'fill-white/60',
      fillAccent: 'fill-slate-900/10',
      titleColor: 'text-slate-950',
      metaColor: 'text-slate-700',
      scrim: 'from-slate-950/15 via-transparent to-transparent',
      icon: <Scissors className="w-4 h-4 text-slate-800" aria-hidden="true" />,
    },
    emerald: {
      bg: 'bg-gradient-to-br from-[#EAF4F0] via-[#D5E9E0] to-[#B8D8CA]',
      stroke: 'stroke-emerald-950/25',
      fillSoft: 'fill-white/55',
      fillAccent: 'fill-emerald-900/10',
      titleColor: 'text-emerald-950',
      metaColor: 'text-emerald-900/80',
      scrim: 'from-emerald-950/15 via-transparent to-transparent',
      icon: <UserCheck className="w-4 h-4 text-emerald-900" aria-hidden="true" />,
    },
    violet: {
      bg: 'bg-gradient-to-br from-[#F2ECFA] via-[#E4D7F5] to-[#CFC0EC]',
      stroke: 'stroke-[#2A0F54]/25',
      fillSoft: 'fill-white/60',
      fillAccent: 'fill-[#2A0F54]/10',
      titleColor: 'text-[#1D093B]',
      metaColor: 'text-[#2A0F54]/80',
      scrim: 'from-[#1D093B]/15 via-transparent to-transparent',
      icon: <Gem className="w-4 h-4 text-[#2A0F54]" aria-hidden="true" />,
    },
  }[theme];

  // انتخاب هوشمند ترکیب‌بندی بر اساس عنوان و دسته‌بندی تا کارت‌های مجاور یکسان نباشند
  const resolvedComposition =
    composition ??
    (categoryLabel.includes('مردانه') || categoryLabel.includes('پیرایش')
      ? 'barber'
      : categoryLabel.includes('پوست') || categoryLabel.includes('مستقل')
      ? 'botanical'
      : categoryLabel.includes('ناخن') || title.includes('نیلوفر')
      ? 'atelier'
      : title.includes('آوا') || categoryLabel.includes('اسپا')
      ? 'mirror'
      : 'arch');

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-black/5 ${palette.bg} ${className} flex flex-col justify-between p-4 sm:p-5 select-none`}
      role="img"
      aria-label={`${categoryLabel} — ${title}`}
    >
      {/* گرافیک برداری اختصاصی بر اساس ترکیب‌بندی */}
      <svg
        viewBox="0 0 360 240"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        aria-hidden="true"
      >
        {resolvedComposition === 'barber' ? (
          <>
            <rect
              x="210"
              y="28"
              width="115"
              height="184"
              rx="14"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1.5"
            />
            <line
              x1="230"
              y1="28"
              x2="230"
              y2="212"
              className={palette.stroke}
              strokeWidth="1"
            />
            <line
              x1="305"
              y1="28"
              x2="305"
              y2="212"
              className={palette.stroke}
              strokeWidth="1"
            />
            <circle
              cx="267"
              cy="105"
              r="34"
              className={`${palette.fillAccent} ${palette.stroke}`}
              strokeWidth="1.5"
            />
            <path
              d="M30,195 L330,195"
              className={palette.stroke}
              strokeWidth="1"
            />
          </>
        ) : resolvedComposition === 'botanical' ? (
          <>
            <circle
              cx="268"
              cy="115"
              r="68"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1.5"
            />
            <path
              d="M268,183 C268,135 230,105 230,72 C262,72 268,110 268,183 Z"
              className={`${palette.fillAccent} ${palette.stroke}`}
              strokeWidth="1.25"
            />
            <path
              d="M268,183 C268,135 306,105 306,72 C274,72 268,110 268,183 Z"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1.25"
            />
            <line
              x1="268"
              y1="58"
              x2="268"
              y2="205"
              className={palette.stroke}
              strokeWidth="1.25"
            />
          </>
        ) : resolvedComposition === 'atelier' ? (
          <>
            <rect
              x="205"
              y="40"
              width="120"
              height="160"
              rx="60"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1.5"
            />
            <rect
              x="175"
              y="95"
              width="85"
              height="115"
              rx="42"
              className={`${palette.fillAccent} ${palette.stroke}`}
              strokeWidth="1.25"
            />
            <circle
              cx="285"
              cy="82"
              r="16"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1.25"
            />
          </>
        ) : resolvedComposition === 'mirror' ? (
          <>
            <ellipse
              cx="265"
              cy="118"
              rx="56"
              ry="78"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1.5"
            />
            <ellipse
              cx="265"
              cy="118"
              rx="44"
              ry="64"
              className={`${palette.fillAccent} ${palette.stroke}`}
              strokeWidth="1"
            />
            <line
              x1="25"
              y1="202"
              x2="335"
              y2="202"
              className={palette.stroke}
              strokeWidth="1"
            />
          </>
        ) : (
          <>
            <path
              d="M205,240 L205,98 A62,62 0 0,1 329,98 L329,240 Z"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1.5"
            />
            <path
              d="M168,240 L168,136 A44,44 0 0,1 256,136 L256,240 Z"
              className={`${palette.fillAccent} ${palette.stroke}`}
              strokeWidth="1.25"
            />
            <circle
              cx="267"
              cy="92"
              r="24"
              className={`${palette.fillSoft} ${palette.stroke}`}
              strokeWidth="1"
            />
          </>
        )}
      </svg>

      {/* ردیف بالای تصویر: شهر و آیکون تخصصی */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${palette.metaColor}`}>
          {categoryLabel} · {city}
        </span>
        <div className="w-8 h-8 rounded-lg bg-white/85 backdrop-blur-xs flex items-center justify-center border border-white/70 shrink-0">
          {palette.icon}
        </div>
      </div>

      {/* ردیف پایین تصویر: عنوان مرکز یا سرویس */}
      <div className="relative z-10 pt-6 max-w-[78%]">
        <p
          className={`text-sm sm:text-base font-bold leading-snug ${palette.titleColor} line-clamp-1`}
        >
          {title}
        </p>
        {subtitle ? (
          <p className={`text-[11px] mt-0.5 ${palette.metaColor} line-clamp-1`}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
};
