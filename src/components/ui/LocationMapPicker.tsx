import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Crosshair,
  MapPin,
  Navigation,
} from 'lucide-react';
import { toEnglishDigitsClient } from '../../utils/formatters';

export interface LocationMapPickerProps {
  city: string;
  neighborhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  readOnly?: boolean;
  onSelectLocation?: (coords: {
    lat: number;
    lng: number;
    neighborhood?: string;
    suggestedAddress?: string;
    googleMapsUrl?: string;
  }) => void;
}

const ISFAHAN_AREAS: Array<{
  name: string;
  lat: number;
  lng: number;
  defaultStreet: string;
}> = [
  {
    name: 'چهارباغ بالا',
    lat: 32.6288,
    lng: 51.6621,
    defaultStreet: 'خیابان چهارباغ بالا',
  },
  {
    name: 'مرداویج',
    lat: 32.6114,
    lng: 51.6695,
    defaultStreet: 'مرداویج، خیابان فارابی',
  },
  {
    name: 'نظر شرقی',
    lat: 32.6365,
    lng: 51.6592,
    defaultStreet: 'خیابان نظر شرقی',
  },
  {
    name: 'شیخ صدوق جنوبی',
    lat: 32.6208,
    lng: 51.6745,
    defaultStreet: 'خیابان شیخ صدوق جنوبی',
  },
  {
    name: 'جلفا و حکیم نظامی',
    lat: 32.6341,
    lng: 51.6538,
    defaultStreet: 'خیابان حکیم نظامی',
  },
  {
    name: 'سپاهان‌شهر',
    lat: 32.5592,
    lng: 51.6512,
    defaultStreet: 'سپاهان‌شهر، بلوار غدیر',
  },
  {
    name: 'خانه اصفهان',
    lat: 32.6954,
    lng: 51.6391,
    defaultStreet: 'خانه اصفهان',
  },
];

function resolveClosestArea(lat: number, lng: number) {
  return ISFAHAN_AREAS.reduce((prev, curr) => {
    const prevDist = Math.hypot(prev.lat - lat, prev.lng - lng);
    const currDist = Math.hypot(curr.lat - lat, curr.lng - lng);
    return currDist < prevDist ? curr : prev;
  }, ISFAHAN_AREAS[0]);
}

export function parseCoordsFromMapInput(raw: string): {
  lat: number;
  lng: number;
} | null {
  const cleaned = toEnglishDigitsClient(raw || '').trim();
  if (!cleaned) return null;
  const plainMatch = cleaned.match(/(-?\d{1,2}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)/);
  if (plainMatch) {
    const lat = Number(plainMatch[1]);
    const lng = Number(plainMatch[2]);
    if (lat >= 24 && lat <= 40 && lng >= 44 && lng <= 64) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * نقشه فوق‌ساده و خلوت ثبت موقعیت مکانی (بدون پرش سریع شلوغ و بدون خروج از اپلیکیشن برای سالن‌دار)
 */
export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({
  city,
  neighborhood,
  address,
  lat = 32.6288,
  lng = 51.6621,
  readOnly = false,
  onSelectLocation,
}) => {
  const validInitialLat =
    typeof lat === 'number' && Number.isFinite(lat) && lat >= 24 && lat <= 40
      ? lat
      : 32.6288;
  const validInitialLng =
    typeof lng === 'number' && Number.isFinite(lng) && lng >= 44 && lng <= 64
      ? lng
      : 51.6621;

  const [selectedLat, setSelectedLat] = useState<number>(validInitialLat);
  const [selectedLng, setSelectedLng] = useState<number>(validInitialLng);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (
      typeof lat === 'number' &&
      Number.isFinite(lat) &&
      lat >= 24 &&
      lat <= 40
    ) {
      setSelectedLat(lat);
    }
    if (
      typeof lng === 'number' &&
      Number.isFinite(lng) &&
      lng >= 44 &&
      lng <= 64
    ) {
      setSelectedLng(lng);
    }
  }, [lat, lng]);

  const pinLeftPercent = Math.min(
    86,
    Math.max(14, Math.round(((selectedLng - 51.53) / 0.19) * 100))
  );
  const pinTopPercent = Math.min(
    84,
    Math.max(16, Math.round(((32.71 - selectedLat) / 0.17) * 100))
  );

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedLat},${selectedLng}`;
  const neshanDirectUrl = `https://nshn.ir/?lat=${selectedLat}&lng=${selectedLng}`;

  const applyCoordinates = (newLat: number, newLng: number) => {
    const fixedLat = Number(newLat.toFixed(5));
    const fixedLng = Number(newLng.toFixed(5));
    setSelectedLat(fixedLat);
    setSelectedLng(fixedLng);

    const closest = resolveClosestArea(fixedLat, fixedLng);
    const cleanArea = closest.name.split(' و ')[0];
    const autoGoogleUrl = `https://www.google.com/maps/search/?api=1&query=${fixedLat},${fixedLng}`;
    const suggestedAddress =
      address && address.trim().length > 5
        ? address.trim()
        : `${city || 'اصفهان'}، ${closest.defaultStreet}`;

    setSavedNotice(true);
    onSelectLocation?.({
      lat: fixedLat,
      lng: fixedLng,
      neighborhood: cleanArea,
      suggestedAddress,
      googleMapsUrl: autoGoogleUrl,
    });
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onSelectLocation) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const newLng = 51.53 + clickX * 0.19;
    const newLat = 32.71 - clickY * 0.17;
    applyCoordinates(newLat, newLng);
  };

  const handleUseCurrentGps = () => {
    if (readOnly || !onSelectLocation) return;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocatingGps(false);
          applyCoordinates(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLocatingGps(false);
          applyCoordinates(selectedLat, selectedLng);
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      applyCoordinates(selectedLat, selectedLng);
    }
  };

  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden">
      {/* هدر ساده و خلوت */}
      <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-[#061138]">
          <MapPin className="w-4 h-4 text-[#0057FF] shrink-0" />
          <span>
            {readOnly
              ? `موقعیت مکانی روی نقشه (${city}${neighborhood ? `، ${neighborhood}` : ''})`
              : 'انتخاب موقعیت مکانی سالن (اختیاری)'}
          </span>
        </div>

        {!readOnly ? (
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={locatingGps}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>
              {locatingGps
                ? 'در حال دریافت موقعیت...'
                : 'تشخیص خودکار موقعیت فعلی من (GPS)'}
            </span>
          </button>
        ) : null}
      </div>

      {/* نقشه تک‌بخشی، خلوت و بدون خروج از برنامه */}
      <div
        onClick={handleMapClick}
        role={readOnly ? 'region' : 'button'}
        tabIndex={readOnly ? -1 : 0}
        aria-label={
          readOnly
            ? `نقشه موقعیت در ${city}`
            : 'روی نقشه لمس کنید تا پین موقعیت سالن ثبت شود'
        }
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            applyCoordinates(selectedLat, selectedLng);
          }
        }}
        className={`relative h-44 w-full select-none overflow-hidden bg-[#EEF4FF] ${
          readOnly ? 'cursor-pointer group' : 'cursor-crosshair'
        }`}
      >
        <svg
          viewBox="0 0 600 220"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          aria-hidden="true"
        >
          <rect width="600" height="220" fill="#EEF4FF" />
          <path
            d="M 0 115 Q 160 85, 310 120 T 600 95"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="20"
            strokeLinecap="round"
          />
          <path
            d="M 40 20 L 560 195 M 150 0 L 195 220 M 415 0 L 385 220 M 0 60 L 600 60 M 0 165 L 600 165"
            stroke="#FFFFFF"
            strokeWidth="6"
          />
          <circle cx="120" cy="145" r="22" fill="#DCFCE7" opacity="0.85" />
          <circle cx="310" cy="88" r="26" fill="#DBEAFE" opacity="0.7" />
          <circle cx="470" cy="70" r="20" fill="#DCFCE7" opacity="0.85" />
        </svg>

        {/* پین موقعیت */}
        <div
          style={{ left: `${pinLeftPercent}%`, top: `${pinTopPercent}%` }}
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200 z-10"
        >
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-0.5 rounded-full bg-[#061138] text-white text-[10px] font-extrabold shadow-md whitespace-nowrap mb-1">
              {neighborhood ? `${city} · ${neighborhood}` : city}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0057FF] text-white flex items-center justify-center shadow-lg ring-4 ring-[#0057FF]/25">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* در حالت مشتری: دکمه‌های مسیریابی روی نقشه */}
        {readOnly ? (
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="باز کردن موقعیت و مسیریابی در گوگل‌مپ"
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#061138]/0 hover:bg-[#061138]/15 transition-colors"
          >
            <span className="px-3.5 py-1.5 rounded-full bg-[#061138]/90 text-white text-xs font-extrabold shadow-lg inline-flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>مسیریابی روی نقشه</span>
            </span>
          </a>
        ) : null}

        {/* نوار وضعیت ساده پایین نقشه */}
        <div className="absolute bottom-2 inset-x-2.5 z-10 px-3 py-1.5 rounded-xl bg-white/95 border border-[#CBD5E1] flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[#061138] font-bold truncate">
            {!readOnly
              ? savedNotice
                ? 'موقعیت مکانی سالن ثبت شد ✓'
                : 'روی نقشه بزنید یا فقط نشانی متنی را در کادر پایین بنویسید'
              : address || `${city}${neighborhood ? `، ${neighborhood}` : ''}`}
          </span>
          {savedNotice && !readOnly ? (
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          ) : null}
        </div>
      </div>

      {/* در حالت نمایش به مشتری: دکمه‌های مسیریابی مستقیم گوگل‌مپ و نشان */}
      {readOnly ? (
        <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#061138] truncate">
            📍 {address || `${city}${neighborhood ? `، ${neighborhood}` : ''}`}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>گوگل‌مپ</span>
            </a>
            <a
              href={neshanDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#061138] hover:bg-[#1E293B] text-white text-xs font-extrabold transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>نشان / بلد</span>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
};
