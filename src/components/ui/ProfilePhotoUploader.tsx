import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, CheckCircle2 } from 'lucide-react';
import { getBeautyPhotoUrl } from './VisualMediaIllustration';

export interface ProfilePhotoUploaderProps {
  value?: string;
  onChange: (dataUrlOrPresetUrl: string) => void;
  businessName?: string;
  label?: string;
}

const PRESET_SALON_AVATARS = [
  {
    label: 'سالن لوکس مدرن',
    url: getBeautyPhotoUrl('سالن زیبایی ارکیده', 'مو و رنگ'),
  },
  {
    label: 'استودیو پوست و میکاپ',
    url: getBeautyPhotoUrl('استودیو پوست سارا', 'فیشیال و پوست', 'botanical'),
  },
  {
    label: 'مرکز تخصصی ناخن',
    url: getBeautyPhotoUrl('مرکز ناخن نیلوفر', 'ناخن و مژه', 'atelier'),
  },
  {
    label: 'آرایشگاه مردانه VIP',
    url: getBeautyPhotoUrl('پیرایش مردانه آرش', 'پیرایش مردانه', 'barber'),
  },
];

/**
 * برش خودکار تصویر انتخاب‌شده از گالری گوشی یا کامپیوتر به ابعاد استاندارد مربع ۴۰۰×۴۰۰ پیکسل
 */
function resizeAndCropImageToSquare(file: File, targetSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('فرمت فایل تصویر معتبر نیست'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);
        resolve(compressedDataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  value,
  onChange,
  businessName = 'سالن زیبایی',
  label = 'تصویر پروفایل و لوگوی سالن / متخصص',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const currentPreview = value || PRESET_SALON_AVATARS[0].url;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('لطفاً یک فایل تصویری معتبر (JPG، PNG یا WebP) انتخاب کنید.');
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    try {
      const croppedUrl = await resizeAndCropImageToSquare(file, 400);
      onChange(croppedUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'خطا در پردازش تصویر پروفایل'
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-[#F3F6FC] p-4 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs sm:text-sm font-extrabold text-[#061138]">
            {label}
          </label>
          <p className="text-[11px] text-[#334155] mt-0.5">
            ابعاد استاندارد: مربع ۱:۱ (۴۰۰×۴۰۰ پیکسل) — سیستم به‌طور خودکار عکس شما را تنظیم و برش می‌دهد.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#0057FF]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
          <span>تنظیم خودکار ابعاد ۱:۱</span>
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* قاب پیش‌نمایش مربع استاندارد */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#0057FF] bg-white shadow-sm shrink-0 group">
          <img
            src={currentPreview}
            alt={businessName}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-[#061138]/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#00E5FF]" />
            <span>تغییر عکس</span>
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="business-profile-photo-input"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>
                {isProcessing
                  ? 'در حال تنظیم ابعاد...'
                  : 'انتخاب عکس از گالری گوشی / سیستم'}
              </span>
            </button>

            {value && value.startsWith('data:image/') ? (
              <button
                type="button"
                onClick={() => onChange(PRESET_SALON_AVATARS[0].url)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white border border-[#CBD5E1] text-xs font-bold text-[#EF4444] hover:bg-red-50 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف عکس شخصی</span>
              </button>
            ) : null}
          </div>

          {uploadError ? (
            <p className="text-xs font-bold text-[#EF4444]">{uploadError}</p>
          ) : null}

          {/* گزینه‌های آماده برای شروع سریع */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#334155] block">
              یا انتخاب از تصاویر آماده استاندارد:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_SALON_AVATARS.map((preset) => {
                const active = currentPreview === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className={`inline-flex items-center gap-1.5 pr-1.5 pl-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                      active
                        ? 'bg-[#061138] text-white border-[#061138]'
                        : 'bg-white text-[#061138] border-[#CBD5E1] hover:border-[#0057FF]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
