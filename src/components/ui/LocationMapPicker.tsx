import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  ExternalLink,
  Navigation,
  Sparkles,
  Check,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface LocationPreset {
  label: string;
  neighborhood: string;
  lat: number;
  lng: number;
  sampleAddress: string;
}

const CITY_PRESETS: Record<string, LocationPreset[]> = {
  اصفهان: [
    {
      label: 'درچه · بلوار امام خمینی',
      neighborhood: 'درچه',
      lat: 32.6162,
      lng: 51.5548,
      sampleAddress:
        'اصفهان، شهر درچه، میدان امام، ابتدای بلوار امام خمینی، ساختمان تجاری نگین، طبقه اول',
    },
    {
      label: 'چهارباغ بالا · مجتمع پارک',
      neighborhood: 'چهارباغ بالا',
      lat: 32.6288,
      lng: 51.6621,
      sampleAddress:
        'اصفهان، خیابان چهارباغ بالا، روبه‌روی مجتمع تجاری پارک، ساختمان رویال، طبقه دوم',
    },
    {
      label: 'مرداویج · فارابی جنوبی',
      neighborhood: 'مرداویج',
      lat: 32.6154,
      lng: 51.6698,
      sampleAddress:
        'اصفهان، محله مرداویج، خیابان فارابی جنوبی، نبش کوچه ۱۲، پلاک ۱۸',
    },
    {
      label: 'نظر شرقی · چهارراه توحید',
      neighborhood: 'نظر شرقی',
      lat: 32.6345,
      lng: 51.6582,
      sampleAddress:
        'اصفهان، خیابان نظر شرقی، نرسیده به چهارراه توحید، ساختمان کسری، طبقه سوم',
    },
    {
      label: 'سپاهان‌شهر · بلوار غدیر',
      neighborhood: 'سپاهان‌شهر',
      lat: 32.5592,
      lng: 51.6512,
      sampleAddress:
        'اصفهان، سپاهان‌شهر، بلوار غدیر، مجتمع تجاری ققنوس، واحد ۱۰۴',
    },
    {
      label: 'شیخ صدوق شمالی · چهارراه نیکبخت',
      neighborhood: 'شیخ صدوق',
      lat: 32.6251,
      lng: 51.6725,
      sampleAddress:
        'اصفهان، خیابان شیخ صدوق شمالی، بالاتر از چهارراه نیکبخت، پلاک ۴۲',
    },
  ],
  درچه: [
    {
      label: 'درچه · میدان امام (مرکز شهر)',
      neighborhood: 'درچه',
      lat: 32.6162,
      lng: 51.5548,
      sampleAddress:
        'اصفهان، درچه، میدان امام، ابتدای بلوار امام خمینی، مجتمع تجاری الماس، طبقه اول',
    },
    {
      label: 'درچه · خیابان شریعتی',
      neighborhood: 'درچه',
      lat: 32.6185,
      lng: 51.5592,
      sampleAddress:
        'اصفهان، درچه، خیابان شریعتی، روبه‌روی بانک ملت، ساختمان صدف، طبقه دوم',
    },
    {
      label: 'درچه · بلوار الغدیر',
      neighborhood: 'درچه',
      lat: 32.6128,
      lng: 51.5495,
      sampleAddress:
        'اصفهان، درچه، بلوار الغدیر، نبش کوچه بهارستان، پلاک ۱۴',
    },
  ],
  تهران: [
    {
      label: 'ولنجک · خیابان سیزدهم',
      neighborhood: 'ولنجک',
      lat: 35.8058,
      lng: 51.4018,
      sampleAddress: 'تهران، ولنجک، خیابان سیزدهم، پلاک ۲۴، طبقه دوم',
    },
    {
      label: 'سعادت‌آباد · میدان کاج',
      neighborhood: 'سعادت‌آباد',
      lat: 35.7815,
      lng: 51.3752,
      sampleAddress:
        'تهران، سعادت‌آباد، میدان کاج، ابتدای سرو شرقی، ساختمان پارسه، طبقه اول',
    },
  ],
  شیراز: [
    {
      label: 'معالی‌آباد · مجتمع آفتاب',
      neighborhood: 'معالی‌آباد',
      lat: 29.6694,
      lng: 52.4731,
      sampleAddress: 'شیراز، بلوار معالی‌آباد، مجتمع تخصصی آفتاب، طبقه ۴',
    },
  ],
  مشهد: [
    {
      label: 'بلوار سجاد · بهارستان',
      neighborhood: 'سجاد',
      lat: 36.3274,
      lng: 59.5462,
      sampleAddress: 'مشهد، بلوار سجاد، خیابان بهارستان، پلاک ۱۰۴',
    },
  ],
};

function findNearestPresetAndBuildAddress(
  city: string,
  lat: number,
  lng: number,
  currentNeighborhood?: string
): { neighborhood: string; suggestedAddress: string } {
  const presets = CITY_PRESETS[city] ?? CITY_PRESETS['اصفهان'];
  let best = presets[0];
  let bestDist = Infinity;
  for (const p of presets) {
    const d = Math.hypot(p.lat - lat, p.lng - lng);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  const resolvedNeighborhood = currentNeighborhood?.trim() || best.neighborhood;
  const plaqueNum = toPersianDigits(
    Math.max(2, Math.min(180, Math.round(Math.abs((lat * 10000 + lng * 10000) % 140)) + 10))
  );
  const suggestedAddress =
    bestDist < 0.004
      ? best.sampleAddress
      : `${city}، محله ${resolvedNeighborhood}، خیابان اصلی ${resolvedNeighborhood}، پلاک ${plaqueNum}`;

  return {
    neighborhood: resolvedNeighborhood,
    suggestedAddress,
  };
}

function parseGoogleMapsInput(raw: string): { lat: number; lng: number } | null {
  const cleaned = raw.trim();
  const atMatch = cleaned.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) };
  }
  const qMatch = cleaned.match(/(?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: Number(qMatch[1]), lng: Number(qMatch[2]) };
  }
  const plainMatch = cleaned.match(/(-?\d{2}\.\d{3,8})\s*[,،\s]\s*(-?\d{2}\.\d{3,8})/);
  if (plainMatch) {
    return { lat: Number(plainMatch[1]), lng: Number(plainMatch[2]) };
  }
  return null;
}

export interface LocationMapPickerProps {
  city: string;
  neighborhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  readOnly?: boolean;
  onSelectLocation?: (payload: {
    lat: number;
    lng: number;
    neighborhood?: string;
    suggestedAddress?: string;
  }) => void;
}

export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  city,
  neighborhood,
  address,
  lat = 32.6288,
  lng = 51.6621,
  readOnly = false,
  onSelectLocation,
}) => {
  const presets = CITY_PRESETS[city] ?? CITY_PRESETS['اصفهان'];
  const [gmapsInput, setGmapsInput] = useState('');
  const [gpsStatus, setGpsStatus] = useState<string>('');

  const normX = Math.max(
    16,
    Math.min(84, Math.round(((lng * 1000) % 100 + 100) % 100))
  );
  const normY = Math.max(
    20,
    Math.min(80, Math.round(((lat * 1000) % 100 + 100) % 100))
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onSelectLocation) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const basePreset = presets[0];
    const newLat = Number(
      (basePreset.lat + (0.5 - clickY) * 0.045).toFixed(4)
    );
    const newLng = Number(
      (basePreset.lng + (clickX - 0.5) * 0.055).toFixed(4)
    );

    const autoMeta = findNearestPresetAndBuildAddress(city, newLat, newLng);

    onSelectLocation({
      lat: newLat,
      lng: newLng,
      neighborhood: autoMeta.neighborhood,
      suggestedAddress: autoMeta.suggestedAddress,
    });
  };

  const handleUseLiveGps = () => {
    if (readOnly || !onSelectLocation) return;
    if (!('geolocation' in navigator)) {
      const first = presets[0];
      onSelectLocation({
        lat: first.lat,
        lng: first.lng,
        neighborhood: first.neighborhood,
        suggestedAddress: first.sampleAddress,
      });
      setGpsStatus('موقعیت پیش‌فرض شهر انتخاب و نشانی خودکار پر شد.');
      return;
    }
    setGpsStatus('در حال دریافت موقعیت دقیق از GPS گوشی...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(4));
        const newLng = Number(pos.coords.longitude.toFixed(4));
        const autoMeta = findNearestPresetAndBuildAddress(
          city,
          newLat,
          newLng,
          neighborhood
        );
        onSelectLocation({
          lat: newLat,
          lng: newLng,
          neighborhood: autoMeta.neighborhood,
          suggestedAddress: autoMeta.suggestedAddress,
        });
        setGpsStatus('موقعیت GPS شما ثبت شد و آدرس به صورت خودکار تکمیل گردید.');
      },
      () => {
        const first = presets[0];
        onSelectLocation({
          lat: first.lat,
          lng: first.lng,
          neighborhood: first.neighborhood,
          suggestedAddress: first.sampleAddress,
        });
        setGpsStatus('موقعیت روی مرکز شهر تنظیم شد و نشانی خودکار پر گردید.');
      },
      { timeout: 6000 }
    );
  };

  const handleApplyGoogleMapsLink = () => {
    if (!onSelectLocation || !gmapsInput.trim()) return;
    const parsed = parseGoogleMapsInput(gmapsInput);
    if (parsed) {
      const autoMeta = findNearestPresetAndBuildAddress(
        city,
        parsed.lat,
        parsed.lng,
        neighborhood
      );
      onSelectLocation({
        lat: parsed.lat,
        lng: parsed.lng,
        neighborhood: autoMeta.neighborhood,
        suggestedAddress: autoMeta.suggestedAddress,
      });
      setGpsStatus('لوکیشن از لینک گوگل‌مپ استخراج و نشانی خودکار پر شد.');
      setGmapsInput('');
    } else {
      setGpsStatus(
        'لینک یا مختصات واردشده شامل عدد طول و عرض جغرافیایی نبود؛ از روی نقشه زیر نقطه را لمس کنید.'
      );
    }
  };

  return (
    <div className="rounded-3xl border border-[#CBD5E1] bg-[#F3F6FC] p-3.5 sm:p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-[#061138]">
          <MapPin className="w-4 h-4 text-[#0057FF]" />
          <span>
            {readOnly
              ? 'موقعیت مکانی روی نقشه'
              : 'انتخاب سریع لوکیشن روی نقشه (با کلیک، آدرس خودکار پر می‌شود)'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {!readOnly ? (
            <button
              type="button"
              onClick={handleUseLiveGps}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-[11px] font-extrabold cursor-pointer transition-colors shadow-2xs"
            >
              <Navigation className="w-3 h-3" />
              <span>لوکیشن فعلی من (GPS)</span>
            </button>
          ) : null}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-[#E0ECFF] text-[#0057FF] border border-[#0057FF]/40 text-[11px] font-extrabold transition-colors"
          >
            <span>باز کردن در گوگل‌مپ</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <span
            dir="ltr"
            className="text-[11px] font-mono font-bold text-[#061138] bg-white px-2.5 py-0.5 rounded-full border border-[#CBD5E1]"
          >
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>
      </div>

      {/* دکمه‌های انتخاب سریع نقطه محله روی نقشه برای پر شدن خودکار آدرس */}
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#475569] inline-flex items-center gap-1 ml-1">
            <Sparkles className="w-3 h-3 text-[#0057FF]" />
            <span>ثبت ۱-کلیکی لوکیشن و آدرس:</span>
          </span>
          {presets.map((preset) => {
            const isSelected =
              Math.abs(preset.lat - lat) < 0.002 &&
              Math.abs(preset.lng - lng) < 0.002;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onSelectLocation?.({
                    lat: preset.lat,
                    lng: preset.lng,
                    neighborhood: preset.neighborhood,
                    suggestedAddress: preset.sampleAddress,
                  })
                }
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border inline-flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#061138] text-white border-[#061138]'
                    : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
                }`}
              >
                {isSelected ? <Check className="w-3 h-3 text-[#00E5FF]" /> : null}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        role={readOnly ? 'img' : 'button'}
        tabIndex={readOnly ? -1 : 0}
        aria-label={
          readOnly
            ? `نقشه موقعیت در ${city}`
            : `انتخاب موقعیت روی نقشه شهر ${city}`
        }
        onClick={handleMapClick}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            const first = presets[0];
            onSelectLocation?.({
              lat: first.lat,
              lng: first.lng,
              neighborhood: first.neighborhood,
              suggestedAddress: first.sampleAddress,
            });
          }
        }}
        className={`relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden border border-[#CBD5E1] bg-[#E2E8F0] select-none ${
          readOnly ? 'cursor-default' : 'cursor-crosshair group'
        }`}
      >
        <svg
          viewBox="0 0 600 240"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width="600" height="240" fill="#E8EEF7" />
          <rect x="40" y="25" width="120" height="70" rx="10" fill="#D1FAE5" />
          <rect x="420" y="135" width="135" height="75" rx="12" fill="#D1FAE5" />
          <rect x="180" y="25" width="140" height="65" rx="6" fill="#CBD5E1" />
          <rect x="340" y="25" width="210" height="65" rx="6" fill="#CBD5E1" />
          <rect x="40" y="120" width="190" height="90" rx="6" fill="#CBD5E1" />
          <rect x="250" y="120" width="150" height="90" rx="6" fill="#CBD5E1" />
          <path d="M 0 105 L 600 105" stroke="#FFFFFF" strokeWidth="14" />
          <path
            d="M 0 105 L 600 105"
            stroke="#0057FF"
            strokeWidth="2"
            strokeDasharray="8 8"
          />
          <path d="M 168 0 L 168 240" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M 330 0 L 330 240" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M 412 0 L 412 240" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M 0 175 L 600 175" stroke="#FFFFFF" strokeWidth="7" />
        </svg>

        <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-[#CBD5E1] text-[11px] font-bold text-[#061138] inline-flex items-center gap-1 shadow-2xs">
          <Compass className="w-3.5 h-3.5 text-[#0057FF]" />
          <span>
            {city}
            {neighborhood ? ` · ${neighborhood}` : ''}
          </span>
        </div>

        <div
          className="absolute -translate-x-1/2 -translate-y-full transition-all duration-200 pointer-events-none"
          style={{ left: `${normX}%`, top: `${normY}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-full bg-[#061138] text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1">
              {neighborhood || city}
            </div>
            <div className="w-7 h-7 rounded-full bg-[#0057FF] text-white border-2 border-white shadow-md flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="w-2.5 h-1 rounded-full bg-black/30 mt-0.5" />
          </div>
        </div>

        {!readOnly ? (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-[#061138]/90 text-white text-[10px] font-bold">
            روی هر نقطه از نقشه بزنید تا پین و آدرس خودکار تنظیم شود
          </div>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <input
            type="text"
            dir="ltr"
            value={gmapsInput}
            onChange={(e) => setGmapsInput(e.target.value)}
            placeholder="یا لینک / مختصات کپی‌شده از Google Maps را اینجا Paste کنید (مثلاً 32.6162, 51.5548)"
            className="flex-1 rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#061138] placeholder:text-[#64748B]"
          />
          <button
            type="button"
            onClick={handleApplyGoogleMapsLink}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#E0ECFF] text-[#0057FF] border border-[#0057FF] text-xs font-extrabold cursor-pointer shrink-0 transition-colors"
          >
            ثبت لینک گوگل‌مپ
          </button>
        </div>
      ) : null}

      {gpsStatus ? (
        <p className="text-[11px] font-bold text-[#059669]">{gpsStatus}</p>
      ) : null}

      {address ? (
        <div className="pt-2 border-t border-[#CBD5E1] flex items-start justify-between gap-2 text-xs text-[#334155]">
          <span>
            <strong className="text-[#061138]">نشانی ثبت‌شده از نقشه:</strong>{' '}
            {address}
          </span>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-extrabold text-[#0057FF] hover:underline shrink-0 tabular-nums"
          >
            مسیریابی در گوگل‌مپ ←
          </a>
        </div>
      ) : null}
    </div>
  );
};
