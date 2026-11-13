import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  Trash2,
  Upload,
  Sparkles,
  ImagePlus,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

export interface CropAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StudioAdjustments {
  brightness?: number;
  contrast?: number;
  saturate?: number;
  flipH?: boolean;
}

/**
 * برش، چرخش، قرینه‌سازی و بهینه‌سازی تصویر با HTML5 Canvas و خروجی کم‌حجم WebP
 */
export async function getCroppedPhotoDataUrl(
  imageSrc: string,
  pixelCrop: CropAreaPixels,
  rotation = 0,
  targetWidth = 720,
  targetHeight = 720,
  adjustments?: StudioAdjustments
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const rotRad = (rotation * Math.PI) / 180;
        const bBoxWidth =
          Math.abs(Math.cos(rotRad) * image.width) +
          Math.abs(Math.sin(rotRad) * image.height);
        const bBoxHeight =
          Math.abs(Math.sin(rotRad) * image.width) +
          Math.abs(Math.cos(rotRad) * image.height);

        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = Math.max(1, Math.round(bBoxWidth));
        rotCanvas.height = Math.max(1, Math.round(bBoxHeight));
        const rotCtx = rotCanvas.getContext('2d');
        if (!rotCtx) {
          reject(new Error('مرورگر از پردازش تصویر پشتیبانی نمی‌کند.'));
          return;
        }

        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rotCtx.rotate(rotRad);
        if (adjustments?.flipH) {
          rotCtx.scale(-1, 1);
        }
        rotCtx.translate(-image.width / 2, -image.height / 2);
        rotCtx.drawImage(image, 0, 0);

        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetWidth;
        outCanvas.height = targetHeight;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) {
          reject(new Error('مرورگر از برش تصویر پشتیبانی نمی‌کند.'));
          return;
        }

        outCtx.fillStyle = '#FFFFFF';
        outCtx.fillRect(0, 0, targetWidth, targetHeight);
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'high';

        outCtx.drawImage(
          rotCanvas,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          targetWidth,
          targetHeight
        );

        const webpUrl = outCanvas.toDataURL('image/webp', 0.84);
        if (webpUrl.startsWith('data:image/webp')) {
          resolve(webpUrl);
        } else {
          resolve(outCanvas.toDataURL('image/jpeg', 0.84));
        }
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = () => reject(new Error('خطا در بارگذاری تصویر برای برش.'));
    image.src = imageSrc;
  });
}

/**
 * فشرده‌سازی و تغییر ابعاد هوشمند تصویر در مرورگر (HTML5 Canvas) با خروجی کم‌حجم WebP
 */
export async function resizeImageFileToDataUrl(
  file: File,
  maxDimension = 800,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('لطفاً فقط فایل تصویری (JPG, PNG, WEBP) انتخاب کنید.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('فایل تصویر معتبر نیست.'));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result));
            return;
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          if (webpDataUrl.startsWith('data:image/webp')) {
            resolve(webpDataUrl);
          } else {
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
        } catch {
          resolve(String(reader.result));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * تولید خروجی برش‌خورده بر اساس موقعیت جابجایی (panX, panY) و بزرگ‌نمایی (zoom) مستقیم روی تصویر
 */
async function renderPositionedPhotoDataUrl(
  src: string,
  zoom: number,
  panXPercent: number,
  panYPercent: number,
  outW = 720,
  outH = 720
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, outW, outH);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const imgAspect = img.width / Math.max(1, img.height);
        const frameAspect = outW / Math.max(1, outH);

        // ابعاد پایه به نحوی که کادر را پوشش دهد (object-cover)
        let baseDrawW = outW;
        let baseDrawH = outH;
        if (imgAspect > frameAspect) {
          baseDrawH = outH;
          baseDrawW = outH * imgAspect;
        } else {
          baseDrawW = outW;
          baseDrawH = outW / imgAspect;
        }

        const drawW = baseDrawW * zoom;
        const drawH = baseDrawH * zoom;

        const centerX = outW / 2 + (panXPercent / 100) * outW;
        const centerY = outH / 2 + (panYPercent / 100) * outH;
        const drawX = centerX - drawW / 2;
        const drawY = centerY - drawH / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        const webpUrl = canvas.toDataURL('image/webp', 0.85);
        if (webpUrl.startsWith('data:image/webp')) {
          resolve(webpUrl);
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('خطا در بارگذاری تصویر.'));
    img.src = src;
  });
}

export interface ProfilePhotoUploaderProps {
  value?: string;
  onChange: (dataUrl: string, sizeKb?: number) => void;
  label?: string;
  hint?: string;
  helperText?: string;
  placeholderName?: string;
  businessName?: string;
  aspectRatio?: number | '1:1' | '4:3' | '16:9' | string;
  shape?: 'square' | 'round' | 'banner';
  enableCoverBannerOption?: boolean;
  coverValue?: string;
  onCoverChange?: (newCover: string) => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  value,
  onChange,
  label = 'تصویر پروفایل یا لوگوی مرکز زیبایی',
  hint = 'روی تصویر بکشید تا جایگاه آن تنظیم شود و با نوار زیر تصویر اندازه آن را کوچک یا بزرگ کنید.',
  helperText,
  placeholderName,
  businessName,
  aspectRatio = 1,
}) => {
  const effectiveHint = helperText || hint;
  const effectivePlaceholder = businessName || placeholderName || 'تایم‌تو';
  const numericAspectRatio =
    typeof aspectRatio === 'number'
      ? aspectRatio
      : aspectRatio === '16:9'
        ? 16 / 9
        : aspectRatio === '4:3'
          ? 4 / 3
          : 1;
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // نگه داشتن تصویر اصلی آپلودشده جهت جابجایی و تغییر اندازه بدون افت کیفیت
  const [sourceImageUrl, setSourceImageUrl] = useState<string>(value || '');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  // همگام‌سازی زمانی که مقدار اولیه از بیرون تغییر کند
  useEffect(() => {
    if (value && !sourceImageUrl) {
      setSourceImageUrl(value);
    } else if (!value && sourceImageUrl) {
      setSourceImageUrl('');
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [value, sourceImageUrl]);

  const commitPositionedImage = useCallback(
    async (src: string, nextZoom: number, nextPan: { x: number; y: number }) => {
      if (!src) return;
      try {
        const outW = numericAspectRatio > 1.2 ? 960 : 720;
        const outH = Math.round(outW / Math.max(0.5, numericAspectRatio));
        const resultDataUrl = await renderPositionedPhotoDataUrl(
          src,
          nextZoom,
          nextPan.x,
          nextPan.y,
          outW,
          outH
        );
        const approxKb = Math.max(1, Math.round((resultDataUrl.length * 0.75) / 1024));
        onChange(resultDataUrl, approxKb);
      } catch {
        // در صورت خطای CORS روی تصاویر خارجی، همان آدرس فعلی حفظ شود
      }
    },
    [numericAspectRatio, onChange]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const optimizedSource = await resizeImageFileToDataUrl(file, 1400, 0.9);
      setSourceImageUrl(optimizedSource);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      onChange(optimizedSource);
      await commitPositionedImage(optimizedSource, 1, { x: 0, y: 0 });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در بارگذاری تصویر انتخابی.'
      );
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sourceImageUrl) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: pan.x,
      startY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dxPercent =
      ((e.clientX - dragStartRef.current.clientX) / Math.max(1, rect.width)) *
      100;
    const dyPercent =
      ((e.clientY - dragStartRef.current.clientY) / Math.max(1, rect.height)) *
      100;

    const maxPan = Math.max(35, (zoom - 0.5) * 65);
    const nextX = Math.max(
      -maxPan,
      Math.min(maxPan, dragStartRef.current.startX + dxPercent)
    );
    const nextY = Math.max(
      -maxPan,
      Math.min(maxPan, dragStartRef.current.startY + dyPercent)
    );
    setPan({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
    dragStartRef.current = null;
    if (sourceImageUrl) {
      void commitPositionedImage(sourceImageUrl, zoom, pan);
    }
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!sourceImageUrl) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZoom = Number(
      Math.max(0.6, Math.min(2.6, zoom + delta)).toFixed(2)
    );
    setZoom(nextZoom);
    void commitPositionedImage(sourceImageUrl, nextZoom, pan);
  };

  const handleZoomChange = (nextZoomValue: number) => {
    const clamped = Number(
      Math.max(0.6, Math.min(2.6, nextZoomValue)).toFixed(2)
    );
    setZoom(clamped);
    if (sourceImageUrl) {
      void commitPositionedImage(sourceImageUrl, clamped, pan);
    }
  };

  const handleResetPosition = () => {
    const resetPan = { x: 0, y: 0 };
    setZoom(1);
    setPan(resetPan);
    if (sourceImageUrl) {
      void commitPositionedImage(sourceImageUrl, 1, resetPan);
    }
  };

  const activePreviewUrl = sourceImageUrl || value || '';

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* کادر تعاملی تصویر: فقط کشیدن با دست/موس برای تنظیم جایگاه */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div
            ref={frameRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheelZoom}
            style={{ touchAction: activePreviewUrl ? 'none' : 'auto' }}
            className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-[#0057FF]/35 bg-[#0F172A] shadow-sm flex items-center justify-center select-none ${
              activePreviewUrl
                ? isDragging
                  ? 'cursor-grabbing ring-2 ring-[#0057FF]'
                  : 'cursor-grab'
                : 'cursor-pointer'
            }`}
            onClick={() => {
              if (!activePreviewUrl) {
                inputRef.current?.click();
              }
            }}
            title={
              activePreviewUrl
                ? 'روی تصویر بکشید تا جایگاه آن تنظیم شود'
                : 'انتخاب تصویر پروفایل'
            }
          >
            {activePreviewUrl ? (
              <>
                <img
                  src={activePreviewUrl}
                  alt={effectivePlaceholder}
                  draggable={false}
                  style={{
                    transform: `translate3d(${pan.x}%, ${pan.y}%, 0) scale(${zoom})`,
                    transformOrigin: 'center center',
                  }}
                  className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-75"
                />
                <div className="pointer-events-none absolute bottom-1.5 inset-x-1.5 px-2 py-0.5 rounded-lg bg-[#061138]/75 backdrop-blur-xs text-[10px] font-bold text-white flex items-center justify-center gap-1">
                  <Move className="w-3 h-3 text-[#00E5FF] shrink-0" />
                  <span>بکشید و جابجا کنید</span>
                </div>
              </>
            ) : (
              <div className="text-center p-2 text-white">
                <Camera className="w-7 h-7 mx-auto mb-1 text-[#00E5FF]" />
                <span className="text-[11px] font-bold block">انتخاب عکس</span>
              </div>
            )}
          </div>
        </div>

        {/* توضیحات، نوار کوچک/بزرگ کردن و دکمه‌های انتخاب یا حذف */}
        <div className="flex-1 space-y-3 text-center sm:text-right w-full">
          <div>
            <p className="text-xs sm:text-sm font-extrabold text-[#061138]">
              {label}
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
              {effectiveHint}
            </p>
          </div>

          {activePreviewUrl ? (
            <div className="p-3 rounded-xl bg-white border border-[#CBD5E1] space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#061138]">
                <span className="inline-flex items-center gap-1 text-[#0057FF]">
                  <Move className="w-3.5 h-3.5" />
                  <span>کوچک یا بزرگ کردن تصویر:</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetPosition}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64748B] hover:text-[#0057FF] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>مرکز کادر</span>
                </button>
              </div>
              <div className="flex items-center gap-2.5" dir="ltr">
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom - 0.1)}
                  className="p-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#061138] cursor-pointer"
                  aria-label="کوچک‌نمایی"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={0.6}
                  max={2.6}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => handleZoomChange(Number(e.target.value))}
                  aria-label="اندازه تصویر"
                  className="w-full accent-[#0057FF] h-2 bg-[#E2E8F0] rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom + 0.1)}
                  className="p-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#061138] cursor-pointer"
                  aria-label="بزرگ‌نمایی"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? 'در حال پردازش...'
                  : activePreviewUrl
                    ? 'تغییر تصویر'
                    : 'آپلود عکس از گوشی / سیستم'}
              </span>
            </button>

            {activePreviewUrl ? (
              <button
                type="button"
                onClick={() => {
                  setSourceImageUrl('');
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  onChange('');
                }}
                className="px-3 py-2 rounded-xl bg-white hover:bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            ) : null}
          </div>

          {error ? (
            <p className="text-xs font-bold text-[#EF4444]">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export interface GalleryPhotoItem {
  id: string;
  url: string;
  title: string;
  categoryLabel?: string;
}

interface GalleryUploaderGridProps {
  items: GalleryPhotoItem[];
  onAddPhoto: (photo: {
    url: string;
    title: string;
    categoryLabel: string;
  }) => void;
  onRemovePhoto: (id: string) => void;
  maxPhotos?: number;
  title?: string;
  subtitle?: string;
  defaultCategoryLabel?: string;
}

export const GalleryUploaderGrid: React.FC<GalleryUploaderGridProps> = ({
  items,
  onAddPhoto,
  onRemovePhoto,
  maxPhotos = 12,
  title = 'آلبوم تصاویر محیط سالن و نمونه‌کارهای واقعی',
  subtitle = 'تصاویر واقعی از محیط سالن، تجهیزات و نمونه‌کارهای خود اضافه کنید تا در صفحه پروفایل شما به مشتریان نمایش داده شود.',
  defaultCategoryLabel = 'محیط سالن و نمونه‌کار',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [captionInput, setCaptionInput] = useState('');
  const [categoryInput, setCategoryInput] = useState(defaultCategoryLabel);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    if (files.length === 0) return;
    setError('');

    if (items.length >= maxPhotos) {
      setError(`حداکثر ${maxPhotos} تصویر در گالری قابل ثبت است.`);
      return;
    }

    setUploading(true);
    try {
      const remainingSlots = Math.max(0, maxPhotos - items.length);
      const targetFiles = files.slice(0, remainingSlots);
      for (let i = 0; i < targetFiles.length; i++) {
        const f = targetFiles[i];
        const dataUrl = await resizeImageFileToDataUrl(f, 1080, 0.84);
        const cleanTitle =
          captionInput.trim() ||
          f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') ||
          `نمونه‌کار شماره ${items.length + i + 1}`;
        onAddPhoto({
          url: dataUrl,
          title: cleanTitle,
          categoryLabel: categoryInput.trim() || defaultCategoryLabel,
        });
      }
      setCaptionInput('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در آپلود تصویر نمونه‌کار.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-[#061138] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#0057FF]" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#E0ECFF] text-[#0057FF] text-xs font-extrabold tabular-nums">
          {items.length} / {maxPhotos} تصویر
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-5">
          <label className="block text-[11px] font-bold text-[#334155] mb-1">
            عنوان نمونه‌کار یا بخش سالن (اختیاری)
          </label>
          <input
            type="text"
            value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            placeholder="مثلاً: لایت و بالیاژ مو / فضای VIP سالن"
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#061138] focus:outline-none focus:border-[#0057FF]"
          />
        </div>
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-[#334155] mb-1">
            دسته‌بندی تصویر
          </label>
          <select
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-bold text-[#061138] focus:outline-none focus:border-[#0057FF]"
          >
            <option value="محیط سالن و دکوراسیون">محیط سالن و دکوراسیون</option>
            <option value="نمونه‌کار رنگ و لایت">نمونه‌کار رنگ و لایت</option>
            <option value="نمونه‌کار ناخن و طراحی">نمونه‌کار ناخن و طراحی</option>
            <option value="نمونه‌کار مژه و ابرو">نمونه‌کار مژه و ابرو</option>
            <option value="نمونه‌کار میکاپ و شینیون">
              نمونه‌کار میکاپ و شینیون
            </option>
            <option value="نمونه‌کار فیشیال و پوست">
              نمونه‌کار فیشیال و پوست
            </option>
            <option value="نمونه‌کار لیزر موهای زائد">
              نمونه‌کار لیزر موهای زائد
            </option>
            <option value="نمونه‌کار اصلاح و فید مردانه">
              نمونه‌کار اصلاح و فید مردانه
            </option>
          </select>
        </div>
        <div className="sm:col-span-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleSelectFiles}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading || items.length >= maxPhotos}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0057FF] hover:bg-[#0046CC] disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <ImagePlus className="w-4 h-4" />
            <span>
              {uploading
                ? 'در حال بارگذاری...'
                : 'انتخاب و افزودن عکس به گالری'}
            </span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-xs font-bold text-[#EF4444]">{error}</p>
      ) : null}

      {items.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#CBD5E1] hover:border-[#0057FF] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/70"
        >
          <ImagePlus className="w-8 h-8 text-[#0057FF] mx-auto mb-2" />
          <p className="text-xs font-extrabold text-[#061138]">
            هنوز تصویری از محیط سالن یا نمونه‌کارها اضافه نکرده‌اید
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            کلیک کنید و عکس‌های سالن یا نمونه‌کارهای خود را از گالری گوشی انتخاب
            کنید
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden border border-[#CBD5E1] bg-white shadow-xs"
            >
              <div className="aspect-square w-full bg-[#E2E8F0] overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5 flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#061138] truncate">
                    {item.title}
                  </p>
                  {item.categoryLabel ? (
                    <span className="text-[10px] text-[#64748B] block truncate">
                      {item.categoryLabel}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePhoto(item.id)}
                  title="حذف تصویر"
                  className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
