import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImagePlus,
  Trash2,
  CheckCircle2,
  Crop,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Move,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

export type ImageAspectPreset = '1:1' | '16:9' | '4:3' | '4:5';

export interface ProfilePhotoUploaderProps {
  value?: string;
  onChange: (dataUrl: string, compressedSizeKb?: number) => void;
  businessName?: string;
  label?: string;
  helperText?: string;
  aspectRatio?: ImageAspectPreset;
  /**
   * در صورتی که برای پروفایل کسب‌وکار فعال شود، به صاحب سالن اجازه می‌دهد
   * یا یک عکس واحد برای همه‌جا بگذارد، یا در صورت تمایل یک عکس افقی (۱۶:۹) مجزا برای کارت صفحه اصلی و بنر پروفایل تنظیم کند.
   */
  enableCoverBannerOption?: boolean;
  coverValue?: string;
  onCoverChange?: (coverDataUrl: string) => void;
}

const ASPECT_CONFIG: Record<
  ImageAspectPreset,
  {
    ratio: number;
    outWidth: number;
    outHeight: number;
    label: string;
  }
> = {
  '1:1': {
    ratio: 1,
    outWidth: 520,
    outHeight: 520,
    label: 'مربع ۱:۱ (مناسب آواتار و گالری)',
  },
  '16:9': {
    ratio: 16 / 9,
    outWidth: 880,
    outHeight: 495,
    label: 'افقی ۱۶:۹ (مناسب کارت صفحه اصلی و بنر بالا)',
  },
  '4:3': {
    ratio: 4 / 3,
    outWidth: 720,
    outHeight: 540,
    label: 'کادر ۴:۳ (استاندارد گالری نمونه‌کار)',
  },
  '4:5': {
    ratio: 4 / 5,
    outWidth: 600,
    outHeight: 750,
    label: 'عمودی ۴:۵ (مناسب استوری و پرتره)',
  },
};

function estimateDataUrlSizeKb(dataUrl: string): number {
  if (!dataUrl || !dataUrl.startsWith('data:')) return 0;
  const base64Part = dataUrl.split(',')[1] || '';
  const bytes = Math.round((base64Part.length * 3) / 4);
  return Math.max(1, Math.round(bytes / 1024));
}

/**
 * رندر تصویر با اعمال زوم، جابه‌جایی افقی/عمودی (چپ و راست / بالا و پایین)، چرخش، قرینه افقی و بهینه‌سازی WebP
 */
function renderEditedImageToWebP(params: {
  sourceUrl: string;
  aspectPreset: ImageAspectPreset;
  zoom: number;
  panX: number; // -100 تا +100
  panY: number; // -100 تا +100
  rotationDeg: number; // 0, 90, 180, 270
  flipH: boolean;
  toneMode: 'NORMAL' | 'BRIGHT' | 'WARM';
}): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('فرمت تصویر انتخاب‌شده معتبر نیست.'));
    img.onload = () => {
      const cfg = ASPECT_CONFIG[params.aspectPreset] || ASPECT_CONFIG['1:1'];
      const canvas = document.createElement('canvas');
      canvas.width = cfg.outWidth;
      canvas.height = cfg.outHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ sourceUrl: params.sourceUrl } as unknown as {
          dataUrl: string;
          sizeKb: number;
        });
        return;
      }

      ctx.fillStyle = '#FAF8FF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (params.toneMode === 'BRIGHT') {
        ctx.filter = 'brightness(1.08) contrast(1.05) saturate(1.06)';
      } else if (params.toneMode === 'WARM') {
        ctx.filter = 'brightness(1.04) contrast(1.08) saturate(1.15)';
      } else {
        ctx.filter = 'none';
      }

      const isRotated90 = Math.abs(params.rotationDeg % 180) === 90;
      const srcW = isRotated90 ? img.height : img.width;
      const srcH = isRotated90 ? img.width : img.height;

      const baseScale = Math.max(canvas.width / srcW, canvas.height / srcH);
      const finalScale = baseScale * Math.max(1, params.zoom);

      const drawW = img.width * finalScale;
      const drawH = img.height * finalScale;

      const maxOffsetX = Math.max(
        0,
        ((isRotated90 ? drawH : drawW) - canvas.width) / 2 + canvas.width * 0.25
      );
      const maxOffsetY = Math.max(
        0,
        ((isRotated90 ? drawW : drawH) - canvas.height) / 2 +
          canvas.height * 0.25
      );

      const offsetX = (params.panX / 100) * maxOffsetX;
      const offsetY = (params.panY / 100) * maxOffsetY;

      ctx.save();
      ctx.translate(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY);
      ctx.rotate((params.rotationDeg * Math.PI) / 180);
      if (params.flipH) {
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // خروجی فوق‌سبک WebP برای جلوگیری از افت سرعت لود سایت
      let webpDataUrl = canvas.toDataURL('image/webp', 0.82);
      if (!webpDataUrl.startsWith('data:image/webp')) {
        webpDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      }
      const sizeKb = estimateDataUrlSizeKb(webpDataUrl);
      resolve({ dataUrl: webpDataUrl, sizeKb });
    };
    img.src = params.sourceUrl;
  });
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  value,
  onChange,
  businessName = 'سالن زیبایی',
  label = 'تصویر پروفایل و ویترین کسب‌وکار',
  helperText,
  aspectRatio = '1:1',
  enableCoverBannerOption = false,
  coverValue,
  onCoverChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastCompressedKb, setLastCompressedKb] = useState<number | null>(() =>
    value && value.startsWith('data:') ? estimateDataUrlSizeKb(value) : null
  );

  // استیت‌های مودال ادیت و کراپ زنده
  const [editorTarget, setEditorTarget] = useState<'MAIN' | 'COVER' | null>(
    null
  );
  const [rawImageSource, setRawImageSource] = useState<string>('');
  const [activeAspect, setActiveAspect] =
    useState<ImageAspectPreset>(aspectRatio);
  const [zoom, setZoom] = useState<number>(1.05);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [toneMode, setToneMode] = useState<'NORMAL' | 'BRIGHT' | 'WARM'>(
    'NORMAL'
  );
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>('');
  const [livePreviewKb, setLivePreviewKb] = useState<number>(0);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // درگ کردن تصویر با موس یا تاچ موبایل در مودال کراپ
  const dragStateRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialPanX: number;
    initialPanY: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  useEffect(() => {
    if (!editorTarget || !rawImageSource) return;
    let cancelled = false;
    void renderEditedImageToWebP({
      sourceUrl: rawImageSource,
      aspectPreset: activeAspect,
      zoom,
      panX,
      panY,
      rotationDeg,
      flipH,
      toneMode,
    })
      .then((res) => {
        if (!cancelled) {
          setLivePreviewUrl(res.dataUrl);
          setLivePreviewKb(res.sizeKb);
        }
      })
      .catch(() => {
        // ignore transient error
      });
    return () => {
      cancelled = true;
    };
  }, [
    editorTarget,
    rawImageSource,
    activeAspect,
    zoom,
    panX,
    panY,
    rotationDeg,
    flipH,
    toneMode,
  ]);

  const openEditorWithFile = (file: File, target: 'MAIN' | 'COVER') => {
    if (!file.type.startsWith('image/')) {
      setUploadError(
        'لطفاً یک فایل تصویری معتبر (JPG، PNG یا WebP) از گالری انتخاب کنید.'
      );
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      setRawImageSource(src);
      setEditorTarget(target);
      setActiveAspect(target === 'COVER' ? '16:9' : aspectRatio);
      setZoom(1.05);
      setPanX(0);
      setPanY(0);
      setRotationDeg(0);
      setFlipH(false);
      setToneMode('NORMAL');
    };
    reader.readAsDataURL(file);
  };

  const openEditorForExisting = (target: 'MAIN' | 'COVER') => {
    const existingSrc = target === 'COVER' ? coverValue || value : value;
    if (!existingSrc) return;
    setRawImageSource(existingSrc);
    setEditorTarget(target);
    setActiveAspect(target === 'COVER' ? '16:9' : aspectRatio);
    setZoom(1.05);
    setPanX(0);
    setPanY(0);
    setRotationDeg(0);
    setFlipH(false);
    setToneMode('NORMAL');
  };

  const handleConfirmCrop = async () => {
    if (!rawImageSource || !editorTarget) return;
    setIsApplying(true);
    try {
      const res = await renderEditedImageToWebP({
        sourceUrl: rawImageSource,
        aspectPreset: activeAspect,
        zoom,
        panX,
        panY,
        rotationDeg,
        flipH,
        toneMode,
      });
      if (editorTarget === 'COVER' && onCoverChange) {
        onCoverChange(res.dataUrl);
      } else {
        onChange(res.dataUrl, res.sizeKb);
        setLastCompressedKb(res.sizeKb);
      }
      setEditorTarget(null);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'خطا در برش و بهینه‌سازی تصویر'
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panX,
      initialPanY: panY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    const nextX = Math.max(
      -100,
      Math.min(100, Math.round(dragStateRef.current.initialPanX + dx * 0.45))
    );
    const nextY = Math.max(
      -100,
      Math.min(100, Math.round(dragStateRef.current.initialPanY + dy * 0.45))
    );
    setPanX(nextX);
    setPanY(nextY);
  };

  const handlePointerUp = () => {
    dragStateRef.current.isDragging = false;
  };

  const hasUploadedMain = Boolean(value && value.trim().length > 0);
  const effectiveCoverPreview = coverValue || value || '';

  return (
    <div className="rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label className="block text-xs sm:text-sm font-extrabold text-[#061138]">
            {label}
          </label>
          <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">
            {helperText ||
              'پس از انتخاب عکس، ابزار «کراپ، جابه‌جایی چپ/راست و پیش‌نمایش زنده» باز می‌شود و عکس شما به‌صورت خودکار به فرمت فوق‌سبک WebP (بدون افت سرعت سایت) تبدیل می‌گردد.'}
          </p>
        </div>
        {lastCompressedKb ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-extrabold text-[#059669]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>حجم بهینه WebP: {toPersianDigits(lastCompressedKb)} KB</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#0057FF]">
            <Crop className="w-3.5 h-3.5 text-[#0057FF]" />
            <span>کراپ و فشرده‌سازی هوشمند WebP</span>
          </span>
        )}
      </div>

      {/* ردیف اصلی آپلود و پیش‌نمایش */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          onClick={() =>
            hasUploadedMain
              ? openEditorForExisting('MAIN')
              : fileInputRef.current?.click()
          }
          className={`relative overflow-hidden border-2 border-dashed ${
            hasUploadedMain
              ? 'border-[#0057FF] bg-white'
              : 'border-[#94A3B8] bg-white hover:border-[#0057FF]'
          } ${
            aspectRatio === '16:9'
              ? 'w-44 h-24 rounded-2xl'
              : aspectRatio === '4:3'
              ? 'w-36 h-28 rounded-2xl'
              : 'w-28 h-28 rounded-2xl'
          } shadow-xs shrink-0 group cursor-pointer flex items-center justify-center`}
        >
          {hasUploadedMain ? (
            <>
              <img
                src={value}
                alt={businessName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#061138]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1">
                <Crop className="w-4 h-4 text-[#00E5FF]" />
                <span>کراپ و تنظیم کادر</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2 text-[#64748B] group-hover:text-[#0057FF] transition-colors">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-extrabold">
                انتخاب عکس واقعی
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) openEditorWithFile(f, 'MAIN');
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
            >
              <ImagePlus className="w-4 h-4" />
              <span>
                {hasUploadedMain
                  ? 'تغییر عکس از گالری گوشی / سیستم'
                  : 'آپلود عکس از گالری گوشی / سیستم'}
              </span>
            </button>

            {hasUploadedMain ? (
              <>
                <button
                  type="button"
                  onClick={() => openEditorForExisting('MAIN')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-[#061138] text-xs font-extrabold cursor-pointer transition-colors"
                >
                  <Crop className="w-3.5 h-3.5 text-[#0057FF]" />
                  <span>کراپ، چپ/راست و ویرایش کادر</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange('', 0);
                    setLastCompressedKb(null);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white border border-[#CBD5E1] text-xs font-bold text-[#EF4444] hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف عکس</span>
                </button>
              </>
            ) : null}
          </div>

          {uploadError ? (
            <p className="text-xs font-bold text-[#EF4444]">{uploadError}</p>
          ) : null}
        </div>
      </div>

      {/* بخش پیش‌نمایش هوشمند چندحالته و امکان انتخاب عکس کاور افقی مجزا (ویژه پروفایل کسب‌وکار) */}
      {enableCoverBannerOption && hasUploadedMain ? (
        <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-[#061138] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>
                  پیش‌نمایش نمایش عکس شما در جاهای مختلف سایت (صفحه اصلی و پروفایل)
                </span>
              </h4>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                به‌صورت پیش‌فرض همان یک عکس بالا هم در «دایره پروفایل» و هم در «کارت صفحه اصلی» استفاده می‌شود. اگر عکس بالا لوگوی گرد است، می‌توانید برای کارت صفحه اصلی یک عکس افقی (مثل محیط سالن) جداگانه بگذارید:
              </p>
            </div>
            <div>
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) openEditorWithFile(f, 'COVER');
                  if (coverFileInputRef.current)
                    coverFileInputRef.current.value = '';
                }}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] text-[11px] font-extrabold cursor-pointer transition-colors"
                >
                  {coverValue
                    ? 'تغییر عکس افقی کارت صفحه اصلی'
                    : '+ انتخاب عکس مجزا برای کارت صفحه اصلی (اختیاری)'}
                </button>
                {coverValue ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditorForExisting('COVER')}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[11px] font-bold text-[#061138] cursor-pointer"
                    >
                      ✂️ کراپ کاور
                    </button>
                    <button
                      type="button"
                      onClick={() => onCoverChange && onCoverChange('')}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-bold cursor-pointer"
                    >
                      استفاده از همان عکس اول
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* پیش‌نمایش ۱: آواتار دایره‌ای پروفایل */}
            <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center gap-2.5">
              <img
                src={value}
                alt="آواتار پروفایل"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#8B5CF6]/40 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-[#8B5CF6] block">
                  ۱. دایره پروفایل سالن
                </span>
                <p className="text-xs font-extrabold text-[#061138] truncate">
                  {businessName}
                </p>
                <span className="text-[10px] text-[#64748B]">کادر ۱:۱ دایره‌ای</span>
              </div>
            </div>

            {/* پیش‌نمایش ۲: کارت ویترین در صفحه اصلی */}
            <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1.5">
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[#E2E8F0]">
                <img
                  src={effectiveCoverPreview}
                  alt="کارت صفحه اصلی"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-bold">
                  ۲. کارت در صفحه اصلی (۱۶:۹)
                </span>
              </div>
            </div>

            {/* پیش‌نمایش ۳: بنر بالای پروفایل */}
            <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1.5">
              <div className="relative h-16 rounded-lg overflow-hidden bg-[#E2E8F0]">
                <img
                  src={effectiveCoverPreview}
                  alt="بنر بالای پروفایل"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-bold">
                  ۳. بنر عریض بالای پروفایل
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* مودال تعاملی کراپ، چپ/راست، چرخش و پیش‌نمایش زنده */}
      {editorTarget && rawImageSource ? (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setEditorTarget(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* هدر مودال ادیت عکس */}
            <div className="px-4 py-3.5 bg-[#061138] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-[#00E5FF]" />
                <h3 className="text-xs sm:text-sm font-extrabold">
                  تنظیم کادر، جابه‌جایی (چپ/راست) و پیش‌نمایش قبل از ذخیره
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditorTarget(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* انتخاب نسبت کادر برش */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#061138]">
                  نسبت کادر عکس:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['1:1', '4:3', '16:9', '4:5'] as ImageAspectPreset[]).map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setActiveAspect(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border cursor-pointer transition-all ${
                          activeAspect === preset
                            ? 'bg-[#0057FF] text-white border-[#0057FF]'
                            : 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1]'
                        }`}
                      >
                        {preset === '1:1'
                          ? '۱:۱ مربع/پروفایل'
                          : preset === '16:9'
                          ? '۱۶:۹ افقی کارت/بنر'
                          : preset === '4:3'
                          ? '۴:۳ گالری نمونه‌کار'
                          : '۴:۵ عمودی استوری'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* بوم تعاملی درگ با موس و انگشت */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#475569]">
                  <span className="inline-flex items-center gap-1 font-bold text-[#0057FF]">
                    <Move className="w-3.5 h-3.5" />
                    <span>
                      روی عکس بکشید (چپ، راست، بالا، پایین) یا از دکمه‌های زیر استفاده کنید
                    </span>
                  </span>
                  {livePreviewKb > 0 ? (
                    <span className="font-extrabold text-[#059669]">
                      حجم خروجی: {toPersianDigits(livePreviewKb)} کیلوبایت (WebP)
                    </span>
                  ) : null}
                </div>

                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="relative w-full h-60 sm:h-64 rounded-2xl bg-[#0F172A] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none border-2 border-[#0057FF]/40"
                >
                  {livePreviewUrl ? (
                    <img
                      src={livePreviewUrl}
                      alt="پیش‌نمایش برش"
                      draggable={false}
                      className={`max-h-full max-w-full object-contain shadow-lg pointer-events-none ${
                        activeAspect === '1:1'
                          ? 'aspect-square'
                          : activeAspect === '16:9'
                          ? 'aspect-[16/9]'
                          : activeAspect === '4:3'
                          ? 'aspect-[4/3]'
                          : 'aspect-[4/5]'
                      }`}
                    />
                  ) : null}

                  {/* خطوط راهنمای کادر طلایی */}
                  <div className="pointer-events-none absolute inset-4 border border-white/25 rounded-xl grid grid-cols-3 grid-rows-3">
                    <div className="border-l border-b border-white/15" />
                    <div className="border-l border-b border-white/15" />
                    <div className="border-b border-white/15" />
                    <div className="border-l border-b border-white/15" />
                    <div className="border-l border-b border-white/15" />
                    <div className="border-b border-white/15" />
                  </div>
                </div>
              </div>

              {/* کنترل‌های دقیق بزرگ‌نمایی، چپ/راست، چرخش و نور */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                {/* زوم */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#061138]">
                    <span className="inline-flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-[#0057FF]" />
                      <span>بزرگ‌نمایی (Zoom):</span>
                    </span>
                    <span className="text-[#0057FF] tabular-nums">
                      {toPersianDigits(Math.round(zoom * 100))}٪
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))
                      }
                      className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#061138] cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={2.6}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-[#0057FF]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setZoom((z) =>
                          Math.min(2.6, Number((z + 0.1).toFixed(2)))
                        )
                      }
                      className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#061138] cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* دکمه‌های حرکت به چپ و راست و بالا و پایین */}
                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-[#061138] block">
                    جابه‌جایی دقیق کادر (چپ / راست / بالا / پایین):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPanX((x) => Math.min(100, x + 15))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-xs font-bold cursor-pointer"
                    >
                      ➡️ راست
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanX((x) => Math.max(-100, x - 15))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-xs font-bold cursor-pointer"
                    >
                      ⬅️ چپ
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanY((y) => Math.max(-100, y - 15))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-xs font-bold cursor-pointer"
                    >
                      ⬆️ بالا
                    </button>
                    <button
                      type="button"
                      onClick={() => setPanY((y) => Math.min(100, y + 15))}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-xs font-bold cursor-pointer"
                    >
                      ⬇️ پایین
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPanX(0);
                        setPanY(0);
                        setZoom(1.05);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#E0ECFF] text-[#0057FF] text-[11px] font-extrabold cursor-pointer"
                    >
                      وسط‌چین
                    </button>
                  </div>
                </div>

                {/* چرخش و قرینه */}
                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-[#061138] block">
                    چرخش و قرینه‌سازی (چپ و راست):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRotationDeg((d) => (d - 90 + 360) % 360)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#0057FF]" />
                      <span>چرخش چپ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationDeg((d) => (d + 90) % 360)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#CBD5E1] hover:border-[#0057FF] text-xs font-bold cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#0057FF]" />
                      <span>چرخش راست</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipH((f) => !f)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                        flipH
                          ? 'bg-[#0057FF] text-white border-[#0057FF]'
                          : 'bg-white text-[#061138] border-[#CBD5E1]'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>قرینه افقی</span>
                    </button>
                  </div>
                </div>

                {/* بهبود نور و شفافیت */}
                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-[#061138] block">
                    تنظیم نور و شفافیت عکس:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'NORMAL' as const, label: 'طبیعی' },
                      { id: 'BRIGHT' as const, label: '✨ روشن‌تر و شفاف' },
                      { id: 'WARM' as const, label: '🔥 رنگ گرم و زنده' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setToneMode(t.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                          toneMode === t.id
                            ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                            : 'bg-white text-[#334155] border-[#CBD5E1]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* پیش‌نمایش زنده هم‌زمان در دایره پروفایل و کارت صفحه اصلی */}
              {livePreviewUrl ? (
                <div className="p-3 rounded-2xl bg-[#FAF8FF] border border-[#E6E0F5] space-y-2">
                  <span className="text-[11px] font-extrabold text-[#6B6480] block">
                    پیش‌نمایش زنده خروجی در سایت:
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={livePreviewUrl}
                        alt="نمای دایره‌ای"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[#8B5CF6]"
                      />
                      <span className="text-[11px] font-bold text-[#1E1B2E]">
                        نمای دایره‌ای پروفایل
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        src={livePreviewUrl}
                        alt="نمای کارت افقی"
                        className="w-20 h-12 rounded-xl object-cover border border-[#CBD5E1]"
                      />
                      <span className="text-[11px] font-bold text-[#1E1B2E]">
                        نمای کارت صفحه اصلی و گالری
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* دکمه‌های تایید و ذخیره */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditorTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] text-xs font-extrabold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={() => void handleConfirmCrop()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs sm:text-sm font-extrabold shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isApplying
                      ? 'در حال بهینه‌سازی WebP...'
                      : 'تایید کادر و ذخیره عکس بهینه'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
