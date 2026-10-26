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
        'تهران، ولنجک، خیابان سیزدهم، پلاک ۲۴، طبقه دوم',
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
      label: 'جردن · بلوار صبا',
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
    <div className="rounded-3xl border border-[#E6E0F5] bg-[#FAF8FF] p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#1E1B2E]">
          <MapPin className="w-4 h-4 text-[#8B5CF6]" />
          <span>
            {readOnly
              ? 'موقعیت مکانی روی نقشه'
              : 'تعیین موقعیت روی نقشه (با کلیک روی نقشه یا انتخاب محله)'}
          </span>
        </div>
        <span
          dir="ltr"
          className="text-[11px] font-mono font-semibold text-[#7C3AED] bg-white px-2.5 py-0.5 rounded-full border border-[#E6E0F5]"
        >
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

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
        className={`relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden border border-[#E6E0F5] bg-[#F3EEFF] select-none ${
          readOnly ? 'cursor-default' : 'cursor-crosshair group'
        }`}
      >
        <svg
          viewBox="0 0 600 240"
          className="w-full h-full object-cover"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect width="600" height="240" fill="#F3EEFF" />
          <rect x="40" y="25" width="120" height="70" rx="10" fill="#D1FAE5" />
          <rect x="420" y="135" width="135" height="75" rx="12" fill="#D1FAE5" />
          <rect x="180" y="25" width="140" height="65" rx="6" fill="#E6E0F5" />
          <rect x="340" y="25" width="210" height="65" rx="6" fill="#E6E0F5" />
          <rect x="40" y="120" width="190" height="90" rx="6" fill="#E6E0F5" />
          <rect x="250" y="120" width="150" height="90" rx="6" fill="#E6E0F5" />
          <path d="M 0 105 L 600 105" stroke="#FFFFFF" strokeWidth="14" />
          <path
            d="M 0 105 L 600 105"
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeDasharray="8 8"
          />
          <path d="M 168 0 L 168 240" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M 330 0 L 330 240" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M 412 0 L 412 240" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M 0 175 L 600 175" stroke="#FFFFFF" strokeWidth="7" />
        </svg>

        <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-[#E6E0F5] text-[11px] font-bold text-[#1E1B2E] inline-flex items-center gap-1 shadow-2xs">
          <Compass className="w-3.5 h-3.5 text-[#8B5CF6]" />
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
            <div className="px-2.5 py-1 rounded-full bg-[#1E1B2E] text-white text-[10px] font-bold shadow-md whitespace-nowrap mb-1">
              {neighborhood || city}
            </div>
            <div className="w-7 h-7 rounded-full bg-[#8B5CF6] text-white border-2 border-white shadow-md flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="w-2.5 h-1 rounded-full bg-black/30 mt-0.5" />
          </div>
        </div>

        {!readOnly ? (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-[#1E1B2E]/85 text-white text-[10px] font-medium">
            برای جابه‌جایی پین روی نقشه کلیک کنید
          </div>
        ) : null}
      </div>

      {!readOnly && onSelectLocation ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-[#6B6480]">
            انتخاب سریع محله‌های پرتردد {city}:
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
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-white border border-[#E6E0F5] text-[#1E1B2E] hover:border-[#8B5CF6]'
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

      {address ? (
        <div className="pt-2 border-t border-[#E6E0F5] flex items-start justify-between gap-2 text-xs text-[#6B6480]">
          <span>
            <strong className="text-[#1E1B2E]">نشانی:</strong> {address}
          </span>
          <span className="text-[11px] text-[#6B6480] shrink-0 tabular-nums">
            ({toPersianDigits(lat.toFixed(2))}°N)
          </span>
        </div>
      ) : null}
    </div>
  );
};
