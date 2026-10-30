import React, { useState } from 'react';
import {
  CheckCircle2,
  Crosshair,
  ExternalLink,
  MapPin,
  Navigation,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

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
    name: 'درچه',
    lat: 32.6152,
    lng: 51.5521,
    defaultStreet: 'میدان امام، بلوار اصلی درچه',
  },
  {
    name: 'چهارباغ بالا',
    lat: 32.6288,
    lng: 51.6621,
    defaultStreet: 'خیابان چهارباغ بالا، مجتمع پارک',
  },
  {
    name: 'مرداویج',
    lat: 32.6114,
    lng: 51.6695,
    defaultStreet: 'مرداویج، خیابان فارابی شمالی',
  },
  {
    name: 'نظر شرقی',
    lat: 32.6365,
    lng: 51.6592,
    defaultStreet: 'خیابان نظر شرقی، نبش کوچه کلیسا',
  },
  {
    name: 'شیخ صدوق جنوبی',
    lat: 32.6208,
    lng: 51.6745,
    defaultStreet: 'خیابان شیخ صدوق جنوبی، ابتدای پرواز',
  },
  {
    name: 'جلفا و حکیم نظامی',
    lat: 32.6341,
    lng: 51.6538,
    defaultStreet: 'خیابان حکیم نظامی، چهارراه جلفا',
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
    defaultStreet: 'خانه اصفهان، میدان پنج طبقه',
  },
];

function resolveClosestArea(lat: number, lng: number) {
  return ISFAHAN_AREAS.reduce((prev, curr) => {
    const prevDist = Math.hypot(prev.lat - lat, prev.lng - lng);
    const currDist = Math.hypot(curr.lat - lat, curr.lng - lng);
    return currDist < prevDist ? curr : prev;
  }, ISFAHAN_AREAS[0]);
}

/**
 * انتخابگر مینیمال و خودکار موقعیت مکانی سالن روی نقشه (بدون فیلدهای تکراری یا کپی دستی لینک)
 * با کلیک روی نقشه یا دریافت موقعیت فعلی (GPS)، لینک گوگل‌مپ و نشانی به صورت خودکار ثبت می‌شوند.
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
  const [selectedLat, setSelectedLat] = useState<number>(lat);
  const [selectedLng, setSelectedLng] = useState<number>(lng);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);
  const [autoLinkedNotice, setAutoLinkedNotice] = useState<boolean>(false);

  React.useEffect(() => {
    setSelectedLat(lat);
    setSelectedLng(lng);
  }, [lat, lng]);

  const pinLeftPercent = Math.min(
    86,
    Math.max(14, Math.round(((selectedLng - 51.53) / 0.19) * 100))
  );
  const pinTopPercent = Math.min(
    84,
    Math.max(16, Math.round(((32.71 - selectedLat) / 0.17) * 100))
  );

  const googleMapsUrl = `https://www.google.com/maps?q=${selectedLat},${selectedLng}`;

  const applyCoordinates = (newLat: number, newLng: number) => {
    const fixedLat = Number(newLat.toFixed(4));
    const fixedLng = Number(newLng.toFixed(4));
    setSelectedLat(fixedLat);
    setSelectedLng(fixedLng);

    const closest = resolveClosestArea(fixedLat, fixedLng);
    const cleanArea = closest.name.split(' و ')[0];
    const autoGoogleUrl = `https://www.google.com/maps?q=${fixedLat},${fixedLng}`;
    const suggestedAddress = `${city || 'اصفهان'}، ${closest.defaultStreet} (موقعیت ثبت‌شده روی نقشه)`;

    setAutoLinkedNotice(true);
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
          applyCoordinates(32.6288, 51.6621);
        },
        { timeout: 6000 }
      );
    } else {
      applyCoordinates(32.6288, 51.6621);
    }
  };

  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden">
      {/* نوار بالای مینیمال: عنوان و دکمه مکان‌یاب خودکار */}
      <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-[#061138]">
          <MapPin className="w-4 h-4 text-[#0057FF] shrink-0" />
          <span>
            {readOnly
              ? `موقعیت مکانی روی نقشه (${city}${neighborhood ? `، ${neighborhood}` : ''})`
              : 'انتخاب موقعیت سالن از روی نقشه گوگل'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!readOnly ? (
            <button
              type="button"
              onClick={handleUseCurrentGps}
              disabled={locatingGps}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white font-bold text-[11px] transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>
                {locatingGps ? 'در حال مکان‌یابی...' : 'مکان‌یابی خودکار (GPS)'}
              </span>
            </button>
          ) : null}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-[#E0ECFF] border border-[#CBD5E1] text-[#0057FF] font-bold text-[11px] transition-colors"
          >
            <Navigation className="w-3 h-3" />
            <span>گوگل‌مپ</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* بوم تعاملی نقشه: با یک کلیک هم لینک گوگل‌مپ و هم نشانی خودکار ثبت می‌شود */}
      <div
        onClick={handleMapClick}
        role={readOnly ? 'img' : 'button'}
        tabIndex={readOnly ? -1 : 0}
        aria-label={
          readOnly
            ? `نقشه موقعیت در ${city}`
            : 'برای ثبت خودکار لوکیشن و نشانی سالن، روی نقشه کلیک کنید'
        }
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            applyCoordinates(selectedLat + 0.002, selectedLng + 0.002);
          }
        }}
        className={`relative h-44 sm:h-48 w-full select-none overflow-hidden bg-[#E2E8F0] ${
          readOnly ? 'cursor-default' : 'cursor-crosshair'
        }`}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
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
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M 40 20 L 560 195 M 150 0 L 195 220 M 415 0 L 385 220 M 0 60 L 600 60 M 0 165 L 600 165"
            stroke="#FFFFFF"
            strokeWidth="7"
          />
          <circle cx="120" cy="145" r="24" fill="#DCFCE7" opacity="0.85" />
          <circle cx="310" cy="88" r="28" fill="#DBEAFE" opacity="0.7" />
          <circle cx="470" cy="70" r="22" fill="#DCFCE7" opacity="0.85" />
        </svg>

        {/* پین موقعیت مکانی انتخاب‌شده */}
        <div
          style={{ left: `${pinLeftPercent}%`, top: `${pinTopPercent}%` }}
          className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200"
        >
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-full bg-[#061138] text-white text-[10px] font-extrabold shadow-md whitespace-nowrap mb-1 border border-[#00E5FF]/50">
              {neighborhood ? `${city} · ${neighborhood}` : city}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0057FF] text-white flex items-center justify-center shadow-lg ring-4 ring-[#0057FF]/25">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* راهنمای شناور پایین نقشه */}
        <div className="absolute bottom-2 inset-x-2.5 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs border border-[#CBD5E1] flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[#061138] font-bold truncate">
            {!readOnly
              ? autoLinkedNotice
                ? 'لوکیشن و لینک گوگل‌مپ به صورت خودکار در نشانی ثبت شد ✓'
                : 'روی نقطه دلخواه نقشه بزنید تا لینک و آدرس خودکار ثبت شود'
              : address || `${city}، ${neighborhood || ''}`}
          </span>
          <span
            dir="ltr"
            className="text-[10px] font-mono font-bold text-[#0057FF] shrink-0 inline-flex items-center gap-1"
          >
            {autoLinkedNotice && !readOnly ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            ) : null}
            {toPersianDigits(selectedLat.toFixed(3))},{' '}
            {toPersianDigits(selectedLng.toFixed(3))}
          </span>
        </div>
      </div>
    </div>
  );
};
