import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { buildBusinessShortLink } from '../../utils/formatters';

const POSTER_TEMPLATE_SRC =
  '/assets/aistudio/photo_2026-11-08_06-55-01_15ac4247.jpg';

export interface BusinessQrCodeCardProps {
  businessName: string;
  slug: string;
  city?: string;
  neighborhood?: string;
  compact?: boolean;
}

export const BusinessQrCodeCard: React.FC<BusinessQrCodeCardProps> = ({
  businessName,
  slug,
  city = 'اصفهان',
  neighborhood,
  compact = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const shortLink = buildBusinessShortLink(slug, businessName);
  const profileUrl = shortLink.actualUrl;
  const cleanBizName = (businessName || 'سالن زیبایی').trim();
  const cleanLocation = neighborhood
    ? `${city} • ${neighborhood}`
    : `${city} • چهارباغ بالا`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(profileUrl, {
      width: 640,
      margin: 0,
      color: {
        dark: '#041238',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      active = false;
    };
  }, [profileUrl]);

  const handleCopyLink = async () => {
    try {
      if (
        typeof ClipboardItem !== 'undefined' &&
        navigator.clipboard?.write
      ) {
        const htmlBlob = new Blob(
          [`<a href="${profileUrl}">${shortLink.brandedTitle}</a>`],
          { type: 'text/html' }
        );
        const textBlob = new Blob([profileUrl], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(profileUrl);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      try {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      } catch {
        // ignore
      }
    }
  };

  const triggerCanvasDownload = (canvas: HTMLCanvasElement) => {
    const posterUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = posterUrl;
    link.download = `timeto-poster-${slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const customizePosterRegions = (
    ctx: CanvasRenderingContext2D,
    qrImg: HTMLImageElement
  ) => {
    // ۱. جایگزینی متن مرحله دوم با نام اختصاصی همین کسب‌وکار (حفظ تیک آبی سمت راست در x≈768)
    const bulletBg = ctx.createLinearGradient(60, 290, 742, 290);
    bulletBg.addColorStop(0, '#02123E');
    bulletBg.addColorStop(0.55, '#041B58');
    bulletBg.addColorStop(1, '#041952');
    ctx.fillStyle = bulletBg;
    ctx.fillRect(60, 292, 682, 42);

    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';
    ctx.font = 'bold 23px Tahoma, Vazirmatn, sans-serif';
    ctx.fillText(
      `بارکد زیر رو اسکن کن و وارد پروفایل «${cleanBizName.slice(0, 26)}» شو`,
      734,
      320
    );

    // ۲. جایگزینی بارکد اختصاصی این کسب‌وکار داخل کادر سفید سمت چپ (حفظ قاب بیرونی و نوشته «اسکن کن و وارد شوید» در پایین)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(84, 438, 344, 342, 16);
    ctx.fill();
    ctx.drawImage(qrImg, 94, 446, 324, 324);

    // ۳. بازطراحی اطلاعات اختصاصی کسب‌وکار داخل کارت آبی سمت راست (زیر کپسول «پروفایل رسمی سالن» و بالای «تایید فوری نوبت در تایم‌تو»)
    const cardInnerGrad = ctx.createLinearGradient(490, 520, 490, 765);
    cardInnerGrad.addColorStop(0, '#062060');
    cardInnerGrad.addColorStop(1, '#041646');
    ctx.fillStyle = cardInnerGrad;
    ctx.fillRect(490, 522, 310, 242);

    // نام سالن / کسب‌وکار (تنظیم خودکار اندازه فونت برای جا شدن کامل در کادر)
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    const nameLen = cleanBizName.length;
    const nameFontSize = nameLen > 24 ? 22 : nameLen > 18 ? 26 : 30;
    ctx.font = `900 ${nameFontSize}px Tahoma, Vazirmatn, sans-serif`;
    ctx.fillText(cleanBizName.slice(0, 28), 645, 582);

    // شهر و محله کسب‌وکار
    ctx.fillStyle = '#DBEAFE';
    ctx.font = 'bold 21px Tahoma, Vazirmatn, sans-serif';
    ctx.fillText(cleanLocation.slice(0, 30), 645, 632);

    // کپسول لینک کوتاه اختصاصی سالن (Timeto.ir/slug) به همراه آیکون لینک در سمت چپ
    ctx.fillStyle = '#03133D';
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(500, 682, 290, 64, 32);
    ctx.fill();
    ctx.stroke();

    // آیکون مربع و فلش لینک خارجی در سمت چپ کپسول
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.6;
    const lx = 524;
    const ly = 701;
    ctx.beginPath();
    ctx.roundRect(lx, ly + 4, 22, 22, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx + 11, ly + 15);
    ctx.lineTo(lx + 24, ly + 2);
    ctx.moveTo(lx + 16, ly + 2);
    ctx.lineTo(lx + 24, ly + 2);
    ctx.lineTo(lx + 24, ly + 10);
    ctx.stroke();

    // متن لینک کوتاه اختصاصی
    ctx.fillStyle = '#FFFFFF';
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    const shortUrlText = shortLink.displayShortUrl;
    const urlFontSize = shortUrlText.length > 24 ? 17 : 20;
    ctx.font = `bold ${urlFontSize}px Tahoma, monospace`;
    ctx.fillText(shortUrlText.slice(0, 28), 662, 721);
  };

  const handleDownloadPrintableStand = () => {
    if (!qrDataUrl || isDownloading) return;
    setIsDownloading(true);

    const canvas = document.createElement('canvas');
    canvas.width = 853;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsDownloading(false);
      return;
    }

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous';
      templateImg.onload = () => {
        ctx.drawImage(templateImg, 0, 0, 853, 1280);
        customizePosterRegions(ctx, qrImg);
        triggerCanvasDownload(canvas);
        setIsDownloading(false);
      };
      templateImg.onerror = () => {
        // پشتیبان در صورت عدم بارگذاری تصویر قالب
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1280);
        bgGrad.addColorStop(0, '#041B58');
        bgGrad.addColorStop(1, '#020D30');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 853, 1280);
        customizePosterRegions(ctx, qrImg);
        triggerCanvasDownload(canvas);
        setIsDownloading(false);
      };
      templateImg.src = POSTER_TEMPLATE_SRC;
    };
    qrImg.onerror = () => {
      setIsDownloading(false);
    };
    qrImg.src = qrDataUrl;
  };

  return (
    <div
      className={`w-full min-w-0 overflow-hidden rounded-3xl border border-[#CBD5E1] bg-white ${
        compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
      } space-y-3.5 shadow-2xs`}
    >
      {/* نمایش تمیز و مینیمال لینک مستقیم پروفایل بدون پیش‌نمایش پوستر */}
      <div className="space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-[#061138] truncate">
            لینک مستقیم پروفایل کسب‌وکار:
          </span>
          <Link
            to={shortLink.shortPath}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0057FF] hover:underline shrink-0"
          >
            <span>مشاهده پروفایل</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] min-w-0 overflow-hidden">
          <Link
            to={shortLink.shortPath}
            title={profileUrl}
            className="min-w-0 flex-1 flex items-center justify-between gap-2 text-xs font-extrabold text-[#0057FF] hover:text-[#0044CC] truncate"
          >
            <span className="truncate text-[#061138]">
              تایم‌تو • {cleanBizName}
            </span>
            <span
              dir="ltr"
              className="font-mono text-xs font-black text-[#0057FF] bg-[#EFF6FF] px-2.5 py-1 rounded-xl border border-[#BFDBFE] shrink-0"
            >
              {shortLink.displayShortUrl}
            </span>
          </Link>
        </div>
      </div>

      {/* دو دکمه اصلی: دانلود پوستر اختصاصی و کپی لینک */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        <Button
          type="button"
          variant="primary"
          size="sm"
          fullWidth
          disabled={!qrDataUrl || isDownloading}
          onClick={handleDownloadPrintableStand}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isDownloading ? 'در حال آماده‌سازی...' : 'دانلود پوستر'}
          </span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => void handleCopyLink()}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#10B981] shrink-0" />
              <span className="text-[#10B981] truncate">لینک کپی شد ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 shrink-0" />
              <span className="truncate">کپی لینک</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
