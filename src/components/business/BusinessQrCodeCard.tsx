import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, QrCode, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

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

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/salon/${slug}`
      : `https://timeto.ir/salon/${slug}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(profileUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#061138',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
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
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleDownloadRawQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `timeto-qr-${slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPrintableStand = () => {
    if (!qrDataUrl) return;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1160;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      handleDownloadRawQr();
      return;
    }

    // پس‌زمینه سرمه‌ای برند تایم تو
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#040D2C');
    grad.addColorStop(0.5, '#061547');
    grad.addColorStop(1, '#030A21');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // کادر سفید مرکزی برای QR
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(95, 190, 710, 790, 44);
    ctx.fill();

    // هدر برند بالای کارت
    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Timeto | تایم تو — سامانه رزرو آنلاین نوبت', 450, 95);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('برای رزرو آنلاین نوبت، بارکد زیر را با دوربین گوشی اسکن کنید', 450, 145);

    // نام سالن داخل کارت سفید
    ctx.fillStyle = '#061138';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(businessName || 'سالن زیبایی', 450, 275);

    ctx.fillStyle = '#0057FF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(
      neighborhood ? `${city} · ${neighborhood}` : city,
      450,
      322
    );

    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 200, 355, 500, 500);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(profileUrl, 450, 915);

      ctx.fillStyle = '#00E5FF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('رزرو ۲۴ ساعته بدون نیاز به تماس تلفنی', 450, 1065);

      const posterUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = posterUrl;
      link.download = `timeto-stand-${slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    qrImg.src = qrDataUrl;
  };

  return (
    <div
      className={`rounded-3xl border border-[#CBD5E1] bg-gradient-to-b from-[#EFF6FF] via-white to-[#F8FAFC] ${
        compact ? 'p-4' : 'p-5'
      } space-y-4 shadow-2xs`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#061138] text-[#00E5FF] text-[11px] font-extrabold">
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code اختصاصی پروفایل سالن</span>
          </span>
          <h3 className="text-sm sm:text-base font-extrabold text-[#061138]">
            بارکد رزرو مستقیم «{businessName}»
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            مشتریان با اسکن این بارکد توسط دوربین موبایل، مستقیماً وارد صفحه رزرو نوبت سالن شما می‌شوند (مناسب چاپ روی کارت ویزیت و استند رومیزی سالن).
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl border border-[#CBD5E1] p-4">
        <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl border-2 border-[#0057FF]/25 bg-white p-2 flex items-center justify-center shrink-0 shadow-xs">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code ${businessName}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xs font-bold text-[#64748B]">
              در حال ساخت QR...
            </div>
          )}
        </div>

        <div className="flex-1 w-full space-y-3 text-center sm:text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-[#64748B] block">
              لینک مستقیم پروفایل و نوبت‌دهی سالن شما:
            </span>
            <div
              dir="ltr"
              className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] font-mono text-xs font-bold text-[#0057FF] truncate select-all"
            >
              {profileUrl}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleDownloadPrintableStand}
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود پوستر استند چاپی</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadRawQr}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>دانلود تصویر QR</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleCopyLink()}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981]">لینک کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی لینک</span>
                </>
              )}
            </Button>

            <Link
              to={`/salon/${slug}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-[#0057FF] hover:bg-[#EFF6FF]"
            >
              <span>مشاهده صفحه</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
