import React, { useState } from 'react';
import { Gem, Scissors, Sparkles, Star, UserCheck } from 'lucide-react';

export interface VisualMediaIllustrationProps {
  theme: 'rose' | 'slate' | 'emerald' | 'violet';
  categoryLabel: string;
  title: string;
  city: string;
  subtitle?: string;
  composition?: 'arch' | 'mirror' | 'botanical' | 'atelier' | 'barber' | 'editorial';
  className?: string;
  imageUrl?: string;
  hideOverlayText?: boolean;
}

const SALON_WOMEN_PHOTOS = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80',
];

const BARBER_MEN_PHOTOS = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=1000&q=80',
];

const SKIN_FACIAL_PHOTOS = [
  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
];

const NAIL_ART_PHOTOS = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80',
];

const MAKEUP_BRIDAL_PHOTOS = [
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1000&q=80',
];

const SPECIALIST_PORTRAITS_WOMEN = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
];

const SPECIALIST_PORTRAITS_MEN = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80',
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getSpecialistAvatarUrl(name: string, roleTitle = ''): string {
  const combined = `${name} ${roleTitle}`;
  const isMale =
    combined.includes('آرش') ||
    combined.includes('کیوان') ||
    combined.includes('امیر') ||
    combined.includes('سهراب') ||
    combined.includes('مردانه') ||
    combined.includes('بربر');
  const pool = isMale ? SPECIALIST_PORTRAITS_MEN : SPECIALIST_PORTRAITS_WOMEN;
  return pool[hashSeed(name) % pool.length];
}

export function getBeautyPhotoUrl(
  seed: string,
  categoryHint = '',
  composition?: string
): string {
  const text = `${seed} ${categoryHint} ${composition ?? ''}`;
  const idx = hashSeed(text);

  if (
    composition === 'barber' ||
    text.includes('مردانه') ||
    text.includes('پیرایش') ||
    text.includes('آرش') ||
    text.includes('کلاسیک') ||
    text.includes('ریش')
  ) {
    return BARBER_MEN_PHOTOS[idx % BARBER_MEN_PHOTOS.length];
  }
  if (
    composition === 'botanical' ||
    text.includes('پوست') ||
    text.includes('فیشیال') ||
    text.includes('اسپا') ||
    text.includes('سارا')
  ) {
    return SKIN_FACIAL_PHOTOS[idx % SKIN_FACIAL_PHOTOS.length];
  }
  if (
    composition === 'atelier' ||
    text.includes('ناخن') ||
    text.includes('مانیکور') ||
    text.includes('پدیکور') ||
    text.includes('ژلیش') ||
    text.includes('نیلوفر')
  ) {
    return NAIL_ART_PHOTOS[idx % NAIL_ART_PHOTOS.length];
  }
  if (
    text.includes('میکاپ') ||
    text.includes('عروس') ||
    text.includes('مژه') ||
    text.includes('ابرو') ||
    text.includes('فرشته')
  ) {
    return MAKEUP_BRIDAL_PHOTOS[idx % MAKEUP_BRIDAL_PHOTOS.length];
  }
  return SALON_WOMEN_PHOTOS[idx % SALON_WOMEN_PHOTOS.length];
}

export const VisualMediaIllustration: React.FC<VisualMediaIllustrationProps> = ({
  theme,
  categoryLabel,
  title,
  city,
  subtitle,
  composition,
  className = 'aspect-[16/10]',
  imageUrl,
  hideOverlayText = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const palette = {
    rose: {
      bg: 'bg-gradient-to-br from-[#F3EEFF] via-[#EDE9FE] to-[#DDD6FE]',
      badgeText: 'text-[#8B5CF6]',
      icon: <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" aria-hidden="true" />,
    },
    slate: {
      bg: 'bg-gradient-to-br from-[#FAF8FF] via-[#F3EEFF] to-[#E6E0F5]',
      badgeText: 'text-[#7C3AED]',
      icon: <Scissors className="w-3.5 h-3.5 text-[#7C3AED]" aria-hidden="true" />,
    },
    emerald: {
      bg: 'bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5] to-[#A7F3D0]',
      badgeText: 'text-[#10B981]',
      icon: <UserCheck className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />,
    },
    violet: {
      bg: 'bg-gradient-to-br from-[#EDE9FE] via-[#DDD6FE] to-[#C4B5FD]',
      badgeText: 'text-[#7C3AED]',
      icon: <Gem className="w-3.5 h-3.5 text-[#7C3AED]" aria-hidden="true" />,
    },
  }[theme];

  const resolvedUrl =
    imageUrl ?? getBeautyPhotoUrl(title, categoryLabel, composition);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-[#E6E0F5] ${palette.bg} ${className} flex flex-col justify-between p-4 sm:p-5 select-none group`}
      role="img"
      aria-label={`${categoryLabel} — ${title}`}
    >
      {!imgError ? (
        <img
          src={resolvedUrl}
          alt={`${title} - ${categoryLabel}`}
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}

      {/* لایه گرادیان نرم برای خوانایی کامل متن روی تصویر واقعی */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#1E1B2E]/85 via-[#1E1B2E]/30 to-black/15 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-bold text-[#1E1B2E] shadow-xs">
          {palette.icon}
          <span>
            {categoryLabel}
            {city ? ` · ${city}` : ''}
          </span>
        </span>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1E1B2E]/85 backdrop-blur-md text-[11px] font-bold text-white tabular-nums">
          <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
          <span>منتخب</span>
        </span>
      </div>

      {!hideOverlayText ? (
        <div className="relative z-10 pt-6 max-w-[92%]">
          <p className="text-sm sm:text-base font-extrabold leading-snug text-white drop-shadow-xs line-clamp-1">
            {title}
          </p>
          {subtitle ? (
            <p className="text-xs mt-1 text-white/85 font-medium line-clamp-1">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
};
