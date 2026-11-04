import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Compass,
  Crosshair,
  ExternalLink,
  Link2,
  MapPin,
  Navigation,
} from 'lucide-react';
import { toEnglishDigitsClient, toPersianDigits } from '../../utils/formatters';

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
 * استخراج مختصات جغرافیایی (lat, lng) از لینک گوگل‌مپ، نشان، بلد یا متن مختصات
 */
export function parseCoordsFromMapInput(raw: string): {
  lat: number;
  lng: number;
} | null {
  const cleaned = toEnglishDigitsClient(raw || '').trim();
  if (!cleaned) return null;

  // فرمت @32.6288,51.6621 در لینک‌های گوگل‌مپ
  const atMatch = cleaned.match(/[@/](-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (lat >= 24 && lat <= 40 && lng >= 44 && lng <= 64) {
      return { lat, lng };
    }
  }

  // فرمت q=32.6288,51.6621 یا ll=32.6288,51.6621 یا lat=...&lng=...
  const queryMatch = cleaned.match(
    /(?:q|ll|destination|center)=(-?\d{1,2}\.\d+)\s*(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i
  );
  if (queryMatch) {
    const lat = Number(queryMatch[1]);
    const lng = Number(queryMatch[2]);
    if (lat >= 24 && lat <= 40 && lng >= 44 && lng <= 64) {
      return { lat, lng };
    }
  }

  const latParamMatch = cleaned.match(/lat=(-?\d{1,2}\.\d+)/i);
  const lngParamMatch = cleaned.match(/lng=(-?\d{1,3}\.\d+)/i);
  if (latParamMatch && lngParamMatch) {
    const lat = Number(latParamMatch[1]);
    const lng = Number(lngParamMatch[1]);
    if (lat >= 24 && lat <= 40 && lng >= 44 && lng <= 64) {
      return { lat, lng };
    }
  }

  // فرمت ساده دو عدد اعشاری: 32.6288, 51.6621
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
 * انتخابگر تعاملی و دقیق موقعیت مکانی سالن روی نقشه گوگل + مسیریاب مستقیم برای مشتریان
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
  const [autoLinkedNotice, setAutoLinkedNotice] = useState<boolean>(false);
  const [mapPasteInput, setMapPasteInput] = useState<string>('');
  const [pasteError, setPasteError] = useState<string>('');

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
    88,
    Math.max(12, Math.round(((selectedLng - 51.53) / 0.19) * 100))
  );
  const pinTopPercent = Math.min(
    86,
    Math.max(14, Math.round(((32.71 - selectedLat) / 0.17) * 100))
  );

  const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${selectedLat},${selectedLng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedLat},${selectedLng}`;
  const neshanDirectUrl = `https://nshn.ir/?lat=${selectedLat}&lng=${selectedLng}`;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${selectedLat},${selectedLng}&z=15&ie=UTF8&iwloc=&output=embed&hl=fa`;

  const applyCoordinates = (
    newLat: number,
    newLng: number,
    explicitArea?: { name: string; defaultStreet: string }
  ) => {
    const fixedLat = Number(newLat.toFixed(5));
    const fixedLng = Number(newLng.toFixed(5));
    setSelectedLat(fixedLat);
    setSelectedLng(fixedLng);
    setPasteError('');

    const closest = explicitArea ?? resolveClosestArea(fixedLat, fixedLng);
    const cleanArea = closest.name.split(' و ')[0];
    const autoGoogleUrl = `https://www.google.com/maps/search/?api=1&query=${fixedLat},${fixedLng}`;
    const suggestedAddress =
      address &&
      address.trim().length > 5 &&
      !address.includes('(موقعیت ثبت‌شده روی نقشه)')
        ? address.trim()
        : `${city || 'اصفهان'}، ${closest.defaultStreet}`;

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
    if (readOnly) {
      // برای مشتری عادی، کلیک روی نقشه مستقیماً گوگل‌مپ را برای مسیریابی باز می‌کند
      return;
    }
    if (!onSelectLocation) return;
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

  const handleApplyPastedLink = () => {
    if (!mapPasteInput.trim()) return;
    const parsed = parseCoordsFromMapInput(mapPasteInput);
    if (parsed) {
      applyCoordinates(parsed.lat, parsed.lng);
      setMapPasteInput('');
      setPasteError('');
      return;
    }
    // اگر نام محله در متن بود
    const matchedArea = ISFAHAN_AREAS.find((a) =>
      mapPasteInput.includes(a.name.split(' و ')[0])
    );
    if (matchedArea) {
      applyCoordinates(matchedArea.lat, matchedArea.lng, matchedArea);
      setMapPasteInput('');
      setPasteError('');
      return;
    }
    setPasteError(
      'مختصات در لینک یافت نشد؛ لطفاً روی نقشه زیر کلیک کنید یا دکمه GPS را بزنید.'
    );
  };

  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden shadow-2xs">
      {/* نوار بالای انتخابگر نقشه */}
      <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-[#061138]">
          <MapPin className="w-4 h-4 text-[#0057FF] shrink-0" />
          <span>
            {readOnly
              ? `موقعیت مکانی و مسیریابی (${city}${neighborhood ? `، ${neighborhood}` : ''})`
              : 'تعیین و ثبت مستقیم لوکیشن سالن روی نقشه'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {!readOnly ? (
            <button
              type="button"
              onClick={handleUseCurrentGps}
              disabled={locatingGps}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>
                {locatingGps
                  ? 'در حال دریافت GPS...'
                  : 'ثبت موقعیت فعلی من (GPS)'}
              </span>
            </button>
          ) : null}

          <a
            href={readOnly ? googleMapsDirectionsUrl : googleMapsDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#E0ECFF] border border-[#CBD5E1] text-[#0057FF] font-bold text-[11px] transition-colors"
          >
            <Navigation className="w-3 h-3" />
            <span>{readOnly ? 'مسیریابی در گوگل‌مپ' : 'مشاهده در گوگل‌مپ'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* نوار انتخاب سریع محدوده برای سالن‌دار (تسهیل انتخاب دقیق بدون نیاز به اسکرول طولانی) */}
      {!readOnly ? (
        <div className="px-3.5 py-2 bg-[#F1F5F9]/70 border-b border-[#E2E8F0] space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-[11px] font-bold text-[#475569] shrink-0">
              پرش سریع به محدوده:
            </span>
            {ISFAHAN_AREAS.map((area) => {
              const isSelectedArea =
                Math.hypot(area.lat - selectedLat, area.lng - selectedLng) <
                0.006;
              return (
                <button
                  key={area.name}
                  type="button"
                  onClick={() => applyCoordinates(area.lat, area.lng, area)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                    isSelectedArea
                      ? 'bg-[#061138] text-white shadow-2xs'
                      : 'bg-white text-[#334155] border border-[#CBD5E1] hover:border-[#0057FF]'
                  }`}
                >
                  {area.name}
                </button>
              );
            })}
          </div>

          {/* امکان جای‌گذاری اختیاری لینک گوگل‌مپ یا مختصات */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                dir="ltr"
                value={mapPasteInput}
                onChange={(e) => setMapPasteInput(e.target.value)}
                placeholder="لینک گوگل‌مپ یا مختصات (مثلاً 32.6288, 51.6621) را اینجا پیست کنید..."
                className="w-full pr-8 pl-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[11px] text-[#061138] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0057FF]"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyPastedLink}
              className="px-3 py-1.5 rounded-xl bg-[#061138] hover:bg-[#0057FF] text-white text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
            >
              اعمال روی نقشه
            </button>
          </div>
          {pasteError ? (
            <p className="text-[11px] font-bold text-rose-600">{pasteError}</p>
          ) : null}
        </div>
      ) : null}

      {/* بوم نقشه: در حالت سالن‌دار با کلیک روی هر نقطه ثبت می‌شود + پیش‌نمایش زنده نقشه گوگل */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#E2E8F0]">
        {/* بخش ۱: بوم کلیک مستقیم پین (برای جابه‌جایی آنی پین با یک لمس) یا کارت مسیریابی مشتری */}
        <div
          onClick={handleMapClick}
          role={readOnly ? 'region' : 'button'}
          tabIndex={readOnly ? -1 : 0}
          aria-label={
            readOnly
              ? `نقشه موقعیت در ${city}`
              : 'برای ثبت خودکار لوکیشن و نشانی سالن، روی نقشه کلیک کنید'
          }
          onKeyDown={(e) => {
            if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              applyCoordinates(selectedLat, selectedLng);
            }
          }}
          className={`relative h-48 sm:h-52 w-full select-none overflow-hidden bg-[#E2E8F0] ${
            readOnly ? 'cursor-pointer group' : 'cursor-crosshair'
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
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200 z-10"
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

          {/* در حالت مشتری (readOnly): لینک تمام‌صفحه روی بوم برای باز شدن مستقیم در گوگل‌مپ */}
          {readOnly ? (
            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="باز کردن موقعیت و مسیریابی در گوگل‌مپ"
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#061138]/0 hover:bg-[#061138]/15 transition-colors"
            >
              <span className="px-3 py-1.5 rounded-full bg-[#061138]/90 text-white text-[11px] font-extrabold shadow-lg inline-flex items-center gap-1.5 opacity-95 group-hover:scale-105 transition-transform">
                <Navigation className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>لمس جهت مسیریابی مستقیم روی نقشه</span>
              </span>
            </a>
          ) : null}

          {/* راهنمای شناور پایین نقشه تعاملی */}
          <div className="absolute bottom-2 inset-x-2.5 z-10 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs border border-[#CBD5E1] flex items-center justify-between gap-2 text-[11px]">
            <span className="text-[#061138] font-bold truncate">
              {!readOnly
                ? autoLinkedNotice
                  ? 'لوکیشن انتخابی در پروفایل سالن ثبت شد ✓'
                  : 'روی نقطه دلخواه نقشه بزنید تا پین جابه‌جا و ثبت شود'
                : address || `${city}، ${neighborhood || ''}`}
            </span>
            <span
              dir="ltr"
              className="text-[10px] font-mono font-bold text-[#0057FF] shrink-0 inline-flex items-center gap-1"
            >
              {autoLinkedNotice && !readOnly ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              ) : null}
              {toPersianDigits(selectedLat.toFixed(4))},{' '}
              {toPersianDigits(selectedLng.toFixed(4))}
            </span>
          </div>
        </div>

        {/* بخش ۲: نقشه واقعی گوگل‌مپ از مختصات انتخاب‌شده */}
        <div className="relative h-48 sm:h-52 w-full bg-[#F1F5F9]">
          <iframe
            title={`نقشه گوگل ${city}`}
            src={googleEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* نوار پایینی: دکمه‌های ثبت قطعی لوکیشن (ویژه سالن‌دار) یا دکمه‌های مسیریابی سریع (ویژه مشتری) */}
      <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
        {!readOnly ? (
          <>
            <div className="text-[11px] font-bold text-[#334155]">
              {autoLinkedNotice ? (
                <span className="text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    موقعیت مکانی ({toPersianDigits(selectedLat.toFixed(4))}،{' '}
                    {toPersianDigits(selectedLng.toFixed(4))}) به صورت خودکار ذخیره
                    شد.
                  </span>
                </span>
              ) : (
                <span>
                  پس از انتخاب نقطه روی نقشه یا زدن دکمه مقابل، لوکیشن سالن ذخیره
                  می‌شود.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => applyCoordinates(selectedLat, selectedLng)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت قطعی همین موقعیت روی نقشه</span>
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <p className="text-xs font-bold text-[#061138] truncate">
              📍 {address || `${city}${neighborhood ? `، ${neighborhood}` : ''}`}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>مسیریابی با گوگل‌مپ</span>
              </a>
              <a
                href={neshanDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#061138] hover:bg-[#1E293B] text-white text-xs font-extrabold transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>باز کردن در نشان / بلد</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
