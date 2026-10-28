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

function svgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

const SALON_WOMEN_PHOTOS = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1E1B4B"/>
          <stop offset="50%" stop-color="#311042"/>
          <stop offset="100%" stop-color="#061138"/>
        </linearGradient>
        <linearGradient id="gold1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FDE68A"/>
          <stop offset="50%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>
        <radialGradient id="glow1" cx="0.7" cy="0.3" r="0.55">
          <stop offset="0%" stop-color="#A855F7" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#061138" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="520" fill="url(#bg1)"/>
      <rect width="800" height="520" fill="url(#glow1)"/>
      <circle cx="620" cy="150" r="180" fill="#00E5FF" fill-opacity="0.1"/>
      <path d="M120 520 V210 A150 150 0 0 1 420 210 V520 Z" fill="#ffffff" fill-opacity="0.06" stroke="url(#gold1)" stroke-width="2.5"/>
      <circle cx="270" cy="220" r="95" fill="#F472B6" fill-opacity="0.18" stroke="url(#gold1)" stroke-width="2"/>
      <path d="M210 230 C215 155, 325 155, 330 230 C335 305, 360 360, 310 410 C270 380, 220 385, 200 410 C180 355, 205 305, 210 230 Z" fill="url(#gold1)" fill-opacity="0.82"/>
      <circle cx="270" cy="225" r="46" fill="#FDE8E8"/>
      <path d="M235 205 Q270 170 308 205 Q285 190 250 202 Z" fill="#1E1B2E"/>
      <path d="M254 222 Q262 227 268 222 M276 222 Q284 227 290 222" stroke="#1E1B2E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M264 242 Q272 248 280 242" stroke="#E11D48" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="490" y="120" width="210" height="290" rx="105" fill="#ffffff" fill-opacity="0.08" stroke="#00E5FF" stroke-opacity="0.45" stroke-width="2"/>
      <circle cx="595" cy="215" r="48" fill="url(#gold1)" fill-opacity="0.35"/>
      <path d="M550 320 H640 M530 350 H660" stroke="#ffffff" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `),
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="55%" stop-color="#1E1B4B"/>
          <stop offset="100%" stop-color="#3B0764"/>
        </linearGradient>
        <linearGradient id="accent2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#8B5CF6"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#bg2)"/>
      <circle cx="200" cy="160" r="190" fill="#8B5CF6" fill-opacity="0.22"/>
      <circle cx="620" cy="360" r="210" fill="#00E5FF" fill-opacity="0.14"/>
      <rect x="110" y="85" width="250" height="350" rx="125" fill="#ffffff" fill-opacity="0.07" stroke="url(#accent2)" stroke-width="2.5"/>
      <circle cx="235" cy="215" r="68" fill="#FDE68A" fill-opacity="0.85"/>
      <path d="M180 215 C180 140, 290 140, 290 215 C295 290, 320 350, 235 375 C150 350, 175 290, 180 215 Z" fill="#C084FC" fill-opacity="0.55"/>
      <rect x="420" y="130" width="270" height="260" rx="32" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.2"/>
      <circle cx="490" cy="210" r="32" fill="#00E5FF" fill-opacity="0.35"/>
      <circle cx="595" cy="210" r="32" fill="#F472B6" fill-opacity="0.35"/>
      <path d="M465 295 H640 M465 330 H590" stroke="#E2E8F0" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `),
];

const BARBER_MEN_PHOTOS = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
      <defs>
        <linearGradient id="barberBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#061138"/>
          <stop offset="55%" stop-color="#0F172A"/>
          <stop offset="100%" stop-color="#1E293B"/>
        </linearGradient>
        <linearGradient id="cyanGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#00E5FF"/>
          <stop offset="100%" stop-color="#0057FF"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#barberBg)"/>
      <circle cx="640" cy="140" r="190" fill="#0057FF" fill-opacity="0.25"/>
      <circle cx="180" cy="390" r="160" fill="#00E5FF" fill-opacity="0.14"/>
      <rect x="130" y="90" width="240" height="340" rx="28" fill="#ffffff" fill-opacity="0.06" stroke="url(#cyanGold)" stroke-width="2.5"/>
      <circle cx="250" cy="205" r="54" fill="#E2E8F0"/>
      <path d="M208 188 C212 145, 288 145, 292 188 Z" fill="#0F172A"/>
      <path d="M214 218 Q250 265 286 218 L278 252 Q250 278 222 252 Z" fill="#1E293B"/>
      <path d="M185 350 C195 290, 305 290, 315 350 Z" fill="url(#cyanGold)" fill-opacity="0.75"/>
      <g transform="translate(470, 140)">
        <circle cx="105" cy="105" r="95" fill="#ffffff" fill-opacity="0.05" stroke="#F59E0B" stroke-width="2"/>
        <path d="M65 65 L145 145 M145 65 L65 145" stroke="#F59E0B" stroke-width="7" stroke-linecap="round"/>
        <circle cx="60" cy="60" r="16" fill="none" stroke="#00E5FF" stroke-width="5"/>
        <circle cx="150" cy="60" r="16" fill="none" stroke="#00E5FF" stroke-width="5"/>
      </g>
    </svg>
  `),
];

const SKIN_FACIAL_PHOTOS = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
      <defs>
        <linearGradient id="skinBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#064E3B"/>
          <stop offset="50%" stop-color="#0F172A"/>
          <stop offset="100%" stop-color="#061138"/>
        </linearGradient>
        <linearGradient id="mintGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#34D399"/>
          <stop offset="100%" stop-color="#00E5FF"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#skinBg)"/>
      <circle cx="580" cy="170" r="190" fill="#10B981" fill-opacity="0.22"/>
      <circle cx="230" cy="250" r="145" fill="#ffffff" fill-opacity="0.07" stroke="url(#mintGlow)" stroke-width="2.5"/>
      <circle cx="230" cy="230" r="58" fill="#FDE68A" fill-opacity="0.9"/>
      <path d="M195 295 Q230 335 265 295" stroke="#34D399" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M470 150 Q560 90 650 180 Q580 260 470 150 Z" fill="url(#mintGlow)" fill-opacity="0.45"/>
      <path d="M510 260 Q610 210 680 300 Q590 370 510 260 Z" fill="#34D399" fill-opacity="0.35"/>
      <circle cx="490" cy="340" r="18" fill="#00E5FF" fill-opacity="0.6"/>
      <circle cx="545" cy="365" r="11" fill="#A7F3D0" fill-opacity="0.7"/>
    </svg>
  `),
];

const NAIL_ART_PHOTOS = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
      <defs>
        <linearGradient id="nailBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3B0764"/>
          <stop offset="50%" stop-color="#1E1B4B"/>
          <stop offset="100%" stop-color="#061138"/>
        </linearGradient>
        <linearGradient id="roseLav" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F472B6"/>
          <stop offset="50%" stop-color="#C084FC"/>
          <stop offset="100%" stop-color="#00E5FF"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#nailBg)"/>
      <circle cx="610" cy="180" r="185" fill="#F472B6" fill-opacity="0.2"/>
      <rect x="120" y="100" width="560" height="320" rx="40" fill="#ffffff" fill-opacity="0.06" stroke="#ffffff" stroke-opacity="0.2"/>
      <rect x="180" y="170" width="70" height="150" rx="35" fill="url(#roseLav)"/>
      <rect x="275" y="145" width="70" height="175" rx="35" fill="#F472B6"/>
      <rect x="370" y="160" width="70" height="160" rx="35" fill="#C084FC"/>
      <rect x="465" y="180" width="70" height="140" rx="35" fill="#38BDF8"/>
      <circle cx="595" cy="235" r="46" fill="#FDE68A" fill-opacity="0.85"/>
    </svg>
  `),
];

const MAKEUP_BRIDAL_PHOTOS = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="800" height="520">
      <defs>
        <linearGradient id="bridalBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4C0519"/>
          <stop offset="50%" stop-color="#1E1B4B"/>
          <stop offset="100%" stop-color="#061138"/>
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="url(#bridalBg)"/>
      <circle cx="240" cy="240" r="150" fill="#FB7185" fill-opacity="0.22" stroke="#FDE68A" stroke-width="2"/>
      <circle cx="240" cy="225" r="58" fill="#FFE4E6"/>
      <path d="M205 170 L225 140 L240 165 L255 140 L275 170 Z" fill="#FBBF24"/>
      <rect x="460" y="130" width="220" height="260" rx="30" fill="#ffffff" fill-opacity="0.07" stroke="#FBBF24" stroke-opacity="0.45"/>
      <circle cx="570" cy="225" r="50" fill="#FB7185" fill-opacity="0.5"/>
    </svg>
  `),
];

const SPECIALIST_PORTRAITS_WOMEN = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <defs>
        <linearGradient id="w1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7C3AED"/>
          <stop offset="100%" stop-color="#061138"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#w1)"/>
      <circle cx="120" cy="96" r="44" fill="#FDE8E8"/>
      <path d="M74 96 C74 44, 166 44, 166 96 C172 140, 178 175, 156 196 C135 182, 105 182, 84 196 C62 175, 68 140, 74 96 Z" fill="#F59E0B" fill-opacity="0.35"/>
      <path d="M56 232 C64 176, 176 176, 184 232 Z" fill="#00E5FF" fill-opacity="0.85"/>
    </svg>
  `),
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <defs>
        <linearGradient id="w2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0057FF"/>
          <stop offset="100%" stop-color="#1E1B4B"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#w2)"/>
      <circle cx="120" cy="96" r="44" fill="#FFE4E6"/>
      <path d="M56 232 C64 176, 176 176, 184 232 Z" fill="#F472B6" fill-opacity="0.85"/>
    </svg>
  `),
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <defs>
        <linearGradient id="w3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#061138"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#w3)"/>
      <circle cx="120" cy="96" r="44" fill="#FEF3C7"/>
      <path d="M56 232 C64 176, 176 176, 184 232 Z" fill="#34D399" fill-opacity="0.85"/>
    </svg>
  `),
];

const SPECIALIST_PORTRAITS_MEN = [
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <defs>
        <linearGradient id="m1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#061138"/>
          <stop offset="100%" stop-color="#0057FF"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#m1)"/>
      <circle cx="120" cy="94" r="42" fill="#E2E8F0"/>
      <path d="M88 108 Q120 142 152 108" stroke="#1E293B" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M54 232 C64 174, 176 174, 186 232 Z" fill="#00E5FF" fill-opacity="0.85"/>
    </svg>
  `),
  svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <defs>
        <linearGradient id="m2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="100%" stop-color="#334155"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="48" fill="url(#m2)"/>
      <circle cx="120" cy="94" r="42" fill="#F1F5F9"/>
      <path d="M54 232 C64 174, 176 174, 186 232 Z" fill="#38BDF8" fill-opacity="0.85"/>
    </svg>
  `),
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
