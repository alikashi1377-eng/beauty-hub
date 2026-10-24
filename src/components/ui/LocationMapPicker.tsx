import React from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface LocationPreset {
  label: string;
  neighborhood: string;
  lat: number;
  lng: number;
  sampleAddress: string;
}

const CITY_PRESETS: Record<string, LocationPreset[]> = {
  تهران: [
    {
      label: 'ولنجک · خیابان سیزدهم',
      neighborhood: 'ولنجک',
      lat: 35.8058,
      lng: 51.4018,
      sampleAddress:
        'تهران، ولنجک، خیابان سیزدهم، پلاک ۲۴، طبقه دوم (مکان انتخاب‌شده روی نقشه)',
    },
    {
      label: 'فرمانیه · چهارراه کامرانیه',
      neighborhood: 'فرمانیه',
      lat: 35.7982,
      lng: 51.4673,
      sampleAddress:
        'تهران، خیابان فرمانیه، نرسیده به چهارراه کامرانیه، پلاک ۴۲، واحد ۳',
    },
    {
      label: 'سعادت‌آباد · میدان کاج',
      neighborhood: 'سعادت‌آباد',
      lat: 35.7815,
      lng: 51.3752,
      sampleAddress:
        'تهران، سعادت‌آباد، میدان کاج، ابتدای سرو شرقی، ساختمان پارسه، طبقه اول',
    },
    {
      label: 'جردن (نلسون ماندلا) · بلوار صبا',
      neighborhood: 'جردن',
      lat: 35.7691,
      lng: 51.4154,
      sampleAddress:
        'تهران، خیابان جردن، بالاتر از بلوار صبا، پلاک ۱۱۸، واحد ۵',
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
    {
      label: 'قصرالدشت · چهارراه زرگری',
      neighborhood: 'قصرالدشت',
      lat: 29.6498,
      lng: 52.5012,
      sampleAddress: 'شیراز، خیابان قصرالدشت، نرسیده به چهارراه زرگری، پلاک ۵۶',
    },
  ],
  اصفهان: [
    {
      label: 'مرداویج · فارابی جنوبی',
      neighborhood: 'مرداویج',
      lat: 32.6154,
      lng: 51.6698,
      sampleAddress: 'اصفهان، خیابان مرداویج، خیابان فارابی جنوبی، پلاک ۱۸',
    },
    {
      label: 'چهارباغ بالا · مجتمع پارک',
      neighborhood: 'چهارباغ بالا',
      lat: 32.6288,
      lng: 51.6621,
      sampleAddress: 'اصفهان، چهارباغ بالا، روبه‌روی مجتمع پارک، ساختمان نگین',
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
    {
      label: 'احمدآباد · بلوار بعثت',
      neighborhood: 'احمدآباد',
      lat: 36.2985,
      lng: 59.5681,
      sampleAddress: 'مشهد، خیابان احمدآباد، نبش بلوار بعثت، ساختمان رویال',
    },
  ],
};

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
  lat = 35.8058,
  lng = 51.4018,
  readOnly = false,
  onSelectLocation,
}) => {
  const presets = CITY_PRESETS[city] ?? CITY_PRESETS['تهران'];

  // تبدیل مختصات جغرافیایی به موقعیت نسبی پین روی بوم نقشه (۲۰٪ تا ۸۰٪)
  const normX = Math.max(
    16,
    Math.min(84, Math.round(((lng * 1000) % 100 + 100) % 100))
  );
  const normY = Math.max(
    20,
    Math.min(80, Math.round(((lat * 1000) % 100 + 100) % 100))
  );

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

    onSelectLocation({
      lat: newLat,
      lng: newLng,
    });
  };

  return (
    <div className="rounded-2xl border border-[#D0CADF] bg-[#FAF9FC] p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-extrabold text-[#171226]">
          <MapPin className="w-4 h-4 text-[#9D174D]" />
          <span>
            {readOnly
              ? 'موقعیت ثبت‌شده کسب‌وکار روی نقشه'
              : 'تعیین موقعیت دقیق روی نقشه (با کلیک روی نقشه یا انتخاب محدوده)'}
          </span>
        </div>
        <span
          dir="ltr"
          className="text-[11px] font-mono font-bold text-[#2A0F54] bg-white px-2.5 py-0.5 rounded-lg border border-[#E6E3EE]"
        >
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

      {/* بوم نقشه تعاملی */}
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
        className={`relative w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-[#D0CADF] bg-[#EFECE6] select-none ${
          readOnly ? 'cursor-default' : 'cursor-crosshair group'
        }`}
      >
        {/* شبکه خیابان‌ها و بلوک‌های شهری */}
        <svg
          viewBox="0 0 600 240"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width="600" height="240" fill="#F2EFE9" />
          {/* پارک‌ها و فضای سبز */}
          <rect x="40" y="25" width="120" height="70" rx="10" fill="#DCFCE7" />
          <rect x="420" y="135" width="135" height="75" rx="12" fill="#DCFCE7" />
          {/* بلوک‌های شهری */}
          <rect x="180" y="25" width="140" height="65" rx="6" fill="#E6E2DA" />
          <rect x="340" y="25" width="210" height="65" rx="6" fill="#E6E2DA" />
          <rect x="40" y="120" width="190" height="90" rx="6" fill="#E6E2DA" />
          <rect x="250" y="120" width="150" height="90" rx="6" fill="#E6E2DA" />
          {/* بزرگراه‌ها و خیابان‌های اصلی */}
          <path
            d="M 0 105 L 600 105"
            stroke="#FFFFFF"
            strokeWidth="14"
          />
          <path
            d="M 0 105 L 600 105"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeDasharray="8 8"
          />
          <path d="M 168 0 L 168 240" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M 330 0 L 330 240" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M 412 0 L 412 240" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M 0 175 L 600 175" stroke="#FFFFFF" strokeWidth="7" />
        </svg>

        {/* برچسب شهر روی نقشه */}
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs border border-[#E6E3EE] text-[11px] font-bold text-[#171226] inline-flex items-center gap-1 shadow-2xs">
          <Compass className="w-3.5 h-3.5 text-[#2A0F54]" />
          <span>
            نقشه محدوده {city}
            {neighborhood ? ` · ${neighborhood}` : ''}
          </span>
        </div>

        {/* پین موقعیت انتخاب‌شده */}
        <div
          className="absolute -translate-x-1/2 -translate-y-full transition-all duration-200 pointer-events-none"
          style={{ left: `${normX}%`, top: `${normY}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded-lg bg-[#2A0F54] text-white text-[10px] font-extrabold shadow-md whitespace-nowrap mb-1">
              {neighborhood || city}
            </div>
            <div className="w-7 h-7 rounded-full bg-[#9D174D] text-white border-2 border-white shadow-md flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="w-2.5 h-1 rounded-full bg-black/30 mt-0.5" />
          </div>
        </div>

        {!readOnly ? (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-[#171226]/80 text-white text-[10px] font-medium">
            برای جابه‌جایی پین روی نقشه کلیک کنید
          </div>
        ) : null}
      </div>

      {/* دکمه‌های انتخاب سریع محدوده در حالت قابل ویرایش */}
      {!readOnly && onSelectLocation ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-[#4E4760]">
            یا یکی از نقاط پیشنهادی شهر {city} را روی نقشه انتخاب کنید:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const isSelected =
                Math.abs(lat - p.lat) < 0.001 && Math.abs(lng - p.lng) < 0.001;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() =>
                    onSelectLocation({
                      lat: p.lat,
                      lng: p.lng,
                      neighborhood: p.neighborhood,
                      suggestedAddress: p.sampleAddress,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#2A0F54] text-white'
                      : 'bg-white border border-[#D0CADF] text-[#171226] hover:border-[#2A0F54]'
                  }`}
                >
                  <Navigation className="w-3 h-3" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* نمایش آدرس ثبت‌شده در زیر نقشه */}
      {address ? (
        <div className="pt-2 border-t border-[#E6E3EE] flex items-start justify-between gap-2 text-xs text-[#4E4760]">
          <span>
            <strong className="text-[#171226]">نشانی ثبت‌شده:</strong> {address}
          </span>
          <span className="text-[11px] text-[#787189] shrink-0 tabular-nums">
            پین‌شده ({toPersianDigits(lat.toFixed(2))}°N)
          </span>
        </div>
      ) : null}
    </div>
  );
};
