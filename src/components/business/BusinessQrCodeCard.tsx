import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { buildBusinessShortLink } from '../../utils/formatters';

/**
 * ضریب بزرگ‌نمایی ۳ برابری (2559×3840 پیکسل — کیفیت 4K / بیش از 440 DPI واقعی در چاپ A5 و 310 DPI در چاپ A4)
 * کل پوستر از پس‌زمینه، موج‌های نوری، تیتر، آیکون‌ها، کادرها، بارکد 1920px و لوگوی سه‌بعدی Timeto
 * به‌صورت ۱۰۰٪ وکتور روی بوم 4K ترسیم می‌شود تا در چاپ A5/A4 هیچ‌گونه افت کیفیت، تاری JPEG یا دوخطی شدن وجود نداشته باشد.
 */
const PRINT_SCALE = 3;
const BASE_WIDTH = 853;
const BASE_HEIGHT = 1280;

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
      width: 1920,
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
    if (canvas.toBlob) {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const fallbackUrl = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.href = fallbackUrl;
            link.download = `timeto-poster-A5-print-${slug}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = `timeto-poster-A5-print-${slug}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
        },
        'image/png',
        1.0
      );
      return;
    }

    const posterUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = posterUrl;
    link.download = `timeto-poster-A5-print-${slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** ۱. رسم پس‌زمینه سرمه‌ای عمیق و موج‌های نوری بالا-چپ و پایین-راست دقیقاً مطابق پوستر اصلی */
  const drawPosterBackgroundAndWaves = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    const baseGrad = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
    baseGrad.addColorStop(0, '#021038');
    baseGrad.addColorStop(0.45, '#03174E');
    baseGrad.addColorStop(1, '#010A26');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // هاله نوری مرکزی پشت تیتر و کارت‌ها
    const centerGlow = ctx.createRadialGradient(426, 480, 40, 426, 480, 520);
    centerGlow.addColorStop(0, 'rgba(0, 110, 255, 0.28)');
    centerGlow.addColorStop(0.6, 'rgba(4, 27, 88, 0.12)');
    centerGlow.addColorStop(1, 'rgba(1, 10, 38, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // موج‌های نوری گوشه بالا-چپ
    const tlOuterGrad = ctx.createLinearGradient(0, 0, 280, 210);
    tlOuterGrad.addColorStop(0, '#0066FF');
    tlOuterGrad.addColorStop(0.65, '#003BB5');
    tlOuterGrad.addColorStop(1, '#031546');
    ctx.fillStyle = tlOuterGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(278, 0);
    ctx.bezierCurveTo(255, 82, 195, 92, 130, 112);
    ctx.bezierCurveTo(68, 132, 28, 175, 0, 215);
    ctx.closePath();
    ctx.fill();

    const tlInnerGrad = ctx.createLinearGradient(0, 0, 215, 145);
    tlInnerGrad.addColorStop(0, '#38BDF8');
    tlInnerGrad.addColorStop(0.55, '#0077FF');
    tlInnerGrad.addColorStop(1, '#0044CC');
    ctx.fillStyle = tlInnerGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(212, 0);
    ctx.bezierCurveTo(190, 58, 142, 68, 92, 84);
    ctx.bezierCurveTo(44, 100, 18, 128, 0, 152);
    ctx.closePath();
    ctx.fill();

    // موج‌های نوری گوشه پایین-راست
    const brOuterGrad = ctx.createLinearGradient(560, 1280, 853, 1020);
    brOuterGrad.addColorStop(0, '#031A56');
    brOuterGrad.addColorStop(0.5, '#0047CC');
    brOuterGrad.addColorStop(1, '#0077FF');
    ctx.fillStyle = brOuterGrad;
    ctx.beginPath();
    ctx.moveTo(853, 1280);
    ctx.lineTo(545, 1280);
    ctx.bezierCurveTo(585, 1185, 650, 1165, 725, 1140);
    ctx.bezierCurveTo(790, 1118, 828, 1075, 853, 1030);
    ctx.closePath();
    ctx.fill();

    const brMidGrad = ctx.createLinearGradient(640, 1280, 853, 1070);
    brMidGrad.addColorStop(0, '#0055E6');
    brMidGrad.addColorStop(0.6, '#0088FF');
    brMidGrad.addColorStop(1, '#29B6F6');
    ctx.fillStyle = brMidGrad;
    ctx.beginPath();
    ctx.moveTo(853, 1280);
    ctx.lineTo(638, 1280);
    ctx.bezierCurveTo(675, 1195, 735, 1175, 785, 1148);
    ctx.bezierCurveTo(822, 1128, 842, 1095, 853, 1068);
    ctx.closePath();
    ctx.fill();

    const brInnerGrad = ctx.createLinearGradient(710, 1280, 853, 1175);
    brInnerGrad.addColorStop(0, '#00A8FF');
    brInnerGrad.addColorStop(1, '#38BDF8');
    ctx.fillStyle = brInnerGrad;
    ctx.beginPath();
    ctx.moveTo(853, 1280);
    ctx.lineTo(712, 1280);
    ctx.bezierCurveTo(745, 1225, 795, 1205, 853, 1175);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  /** ۲. رسم تیتر اصلی بالای پوستر: «اینجا نوبتت رو آنلاین رزرو کن» با رنگ فیروزه‌ای روی کلمه آنلاین */
  const drawHeadlineSection = (
    ctx: CanvasRenderingContext2D,
    fontStack: string
  ) => {
    ctx.save();
    ctx.direction = 'rtl';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `900 54px ${fontStack}`;

    const part1 = 'اینجا نوبتت رو ';
    const part2 = 'آنلاین';
    const part3 = ' رزرو کن';

    const w1 = ctx.measureText(part1).width;
    const w2 = ctx.measureText(part2).width;
    const w3 = ctx.measureText(part3).width;
    const totalW = w1 + w2 + w3;

    const rightStart = (BASE_WIDTH + totalW) / 2;
    const yPos = 166;

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(part1, rightStart, yPos);

    ctx.fillStyle = '#29D8FF';
    ctx.fillText(part2, rightStart - w1, yPos);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(part3, rightStart - w1 - w2, yPos);

    // خط افقی فیروزه‌ای زیر تیتر
    const lineGrad = ctx.createLinearGradient(322, 216, 531, 216);
    lineGrad.addColorStop(0, 'rgba(41, 216, 255, 0.25)');
    lineGrad.addColorStop(0.5, 'rgba(41, 216, 255, 0.95)');
    lineGrad.addColorStop(1, 'rgba(41, 216, 255, 0.25)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(322, 216);
    ctx.lineTo(531, 216);
    ctx.stroke();
    ctx.restore();
  };

  /** رسم آیکون دایره و تیک آبی وکتور برای ۳ مرحله راهنما */
  const drawCheckmarkCircle = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number
  ) => {
    ctx.save();
    const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, '#38BDF8');
    grad.addColorStop(1, '#0284C7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#031542';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 5.5, cy + 0.5);
    ctx.lineTo(cx - 1.5, cy + 4.8);
    ctx.lineTo(cx + 6.2, cy - 4.2);
    ctx.stroke();
    ctx.restore();
  };

  /** رسم آیکون پین مکان وکتور در پایین کادر سفید QR */
  const drawLocationPinIcon = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number
  ) => {
    ctx.save();
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 11.5, Math.PI, 0, false);
    ctx.bezierCurveTo(cx + 11.5, cy + 4, cx + 3, cy + 12, cx, cy + 17);
    ctx.bezierCurveTo(cx - 3, cy + 12, cx - 11.5, cy + 4, cx - 11.5, cy - 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /** رسم آیکون صاعقه تایید فوری نوبت */
  const drawLightningIcon = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number
  ) => {
    ctx.save();
    const grad = ctx.createLinearGradient(cx, cy - 13, cx, cy + 13);
    grad.addColorStop(0, '#38BDF8');
    grad.addColorStop(1, '#0284C7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 13);
    ctx.lineTo(cx - 9, cy + 1);
    ctx.lineTo(cx - 1, cy + 1);
    ctx.lineTo(cx - 3, cy + 13);
    ctx.lineTo(cx + 9, cy - 2);
    ctx.lineTo(cx + 1, cy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /** رسم آیکون تقویم وکتور در کپسول پایین */
  const drawCalendarIcon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    ctx.save();
    ctx.strokeStyle = '#29B6F6';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.roundRect(x, y + 4, size, size - 4, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 10, y + 8);
    ctx.moveTo(x + size - 10, y);
    ctx.lineTo(x + size - 10, y + 8);
    ctx.moveTo(x, y + 14);
    ctx.lineTo(x + size, y + 14);
    ctx.stroke();

    ctx.fillStyle = '#29B6F6';
    const dotRows = [22, 29];
    const dotCols = [9, 18, 27];
    for (const dy of dotRows) {
      for (const dx of dotCols) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  /** ۵. رسم لوگوی سه‌بعدی وکتور Timeto و آدرس سایت timeto24.ir در پایین پوستر */
  const drawBottomBrandAndWebsite = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // ترسیم وکتور لوگوی سه‌بعدی Timeto (مطابق /public/icon.svg) با ماسک وکتور واقعی دور دایره ساعت
    ctx.save();
    ctx.translate(184, 956);
    ctx.scale(0.5, 0.5);

    // ایجاد ماسک برش وکتور (Even-Odd Clip) دور دایره ساعت تا پس‌زمینه زیر آن کاملاً یکپارچه بماند
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 512, 512);
    ctx.arc(386, 168, 76, 0, Math.PI * 2, true);
    ctx.clip();

    // الف) بال افقی بالای حرف T
    const wingGrad = ctx.createLinearGradient(72, 112, 346, 224);
    wingGrad.addColorStop(0, '#00F0FF');
    wingGrad.addColorStop(0.48, '#00B8FF');
    wingGrad.addColorStop(0.85, '#0066FF');
    wingGrad.addColorStop(1, '#0040CC');
    ctx.fillStyle = wingGrad;
    const wingPath = new Path2D(
      'M192 114H346L218 220H98C78.1177 220 64 205.5 68.5 186C78.5 142 128 114 192 114Z'
    );
    ctx.fill(wingPath);

    // زائده ظریف آبی تیره زیر برش ساعت
    ctx.fillStyle = '#0037B8';
    ctx.fillRect(296, 196, 36, 24);

    // ب) ستون منحنی سه‌بعدی حرف T
    const stemGrad = ctx.createLinearGradient(330, 114, 210, 412);
    stemGrad.addColorStop(0, '#1AF2FF');
    stemGrad.addColorStop(0.36, '#00BAFF');
    stemGrad.addColorStop(0.74, '#0072FF');
    stemGrad.addColorStop(1, '#0047E0');
    ctx.fillStyle = stemGrad;
    const stemPath = new Path2D(
      'M346 114C276 156 186 232 184 334V346C184 383.555 214.445 414 252 414C289.555 414 320 383.555 320 346V162C320 140 330 124 346 114Z'
    );
    ctx.fill(stemPath);

    // سایه درونی پایین راست ستون برای حجم سه‌بعدی
    const stemDepth = ctx.createRadialGradient(280, 340, 10, 280, 340, 120);
    stemDepth.addColorStop(0, 'rgba(0, 43, 153, 0.72)');
    stemDepth.addColorStop(0.7, 'rgba(0, 81, 255, 0.22)');
    stemDepth.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = stemDepth;
    ctx.fill(stemPath);
    ctx.restore();

    // د) دایره فیروزه‌ای ساعت و عقربه L شکل
    const clockGrad = ctx.createLinearGradient(336, 118, 438, 218);
    clockGrad.addColorStop(0, '#00D8FF');
    clockGrad.addColorStop(0.55, '#00EEFF');
    clockGrad.addColorStop(1, '#4DF7FF');
    ctx.fillStyle = clockGrad;
    ctx.beginPath();
    ctx.arc(386, 168, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#020924';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(382, 138);
    ctx.lineTo(382, 172);
    ctx.lineTo(416, 172);
    ctx.stroke();
    ctx.restore();

    // نوشتار Timeto کنار لوگو
    ctx.fillStyle = '#FFFFFF';
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.font = '900 84px "Plus Jakarta Sans", Tahoma, sans-serif';
    ctx.fillText('Timeto', 402, 1104);

    // ردیف پایین: آیکون کره زمین + timeto24.ir + خطوط کناری
    ctx.strokeStyle = 'rgba(41, 182, 246, 0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(142, 1197);
    ctx.lineTo(292, 1197);
    ctx.moveTo(575, 1197);
    ctx.lineTo(712, 1197);
    ctx.stroke();

    // آیکون کره زمین (Globe) در مختصات (332, 1197)
    const gx = 332;
    const gy = 1197;
    const gr = 20;
    ctx.strokeStyle = '#29B6F6';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(gx, gy, 9.5, gr, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx - gr, gy);
    ctx.lineTo(gx + gr, gy);
    ctx.moveTo(gx - 17, gy - 9);
    ctx.lineTo(gx + 17, gy - 9);
    ctx.moveTo(gx - 17, gy + 9);
    ctx.lineTo(gx + 17, gy + 9);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.font = 'bold 34px "Plus Jakarta Sans", Tahoma, sans-serif';
    ctx.fillText('timeto24.ir', 376, 1208);

    ctx.restore();
  };

  /**
   * ترسیم ۱۰۰٪ وکتور کل پوستر در رزولوشن 4K (2559×3840 پیکسل) با تایپوگرافی اختصاصی Estedad
   */
  const renderFullVectorPoster4K = (
    ctx: CanvasRenderingContext2D,
    qrImg: HTMLImageElement
  ) => {
    const fontStack = '"Estedad", -apple-system, BlinkMacSystemFont, sans-serif';

    // ۱. پس‌زمینه سرمه‌ای و موج‌های نوری گوشه‌ها
    drawPosterBackgroundAndWaves(ctx);

    // ۲. تیتر اصلی بالای پوستر
    drawHeadlineSection(ctx, fontStack);

    // ۳. سه سطر راهنما + دایره‌های تیک آبی (بدون هیچ کادر مستطیلی اضافه در پس‌زمینه)
    const bullets = [
      {
        text: 'دوربین گوشی یا بارکدخوان رو باز کن',
        yText: 274,
        yCircle: 266,
      },
      {
        text: `بارکد زیر رو اسکن کن و وارد پروفایل «${cleanBizName.slice(0, 26)}» شو`,
        yText: 320,
        yCircle: 312,
      },
      {
        text: 'خدمت و ساعت دلخواهت رو انتخاب کن و آنلاین نوبت بگیر',
        yText: 366,
        yCircle: 358,
      },
    ];

    for (const item of bullets) {
      drawCheckmarkCircle(ctx, 768, item.yCircle, 15.5);
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.font = `700 22.5px ${fontStack}`;
      ctx.fillText(item.text, 738, item.yText);
    }

    // ۴. کارت سفید سمت چپ (بارکد وکتور 1920px + نوشته اسکن کن و وارد شوید)
    ctx.save();
    ctx.shadowColor = 'rgba(41, 182, 246, 0.28)';
    ctx.shadowBlur = 22;
    const leftCardOuterGrad = ctx.createLinearGradient(56, 421, 461, 844);
    leftCardOuterGrad.addColorStop(0, '#38BDF8');
    leftCardOuterGrad.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = leftCardOuterGrad;
    ctx.beginPath();
    ctx.roundRect(56, 421, 405, 423, 38);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(61, 426, 395, 413, 34);
    ctx.fill();

    // رسم بارکد با غیرفعال کردن smoothing برای تیزی ۱۰۰٪ لبه‌ها در چاپ کاغذی A5
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrImg, 94, 446, 328, 328);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#061A48';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.font = `800 25px ${fontStack}`;
    ctx.fillText('اسکن کن و وارد شوید', 282, 814);
    drawLocationPinIcon(ctx, 140, 804);
    ctx.restore();

    // ۵. کارت سرمه‌ای سمت راست (پروفایل رسمی سالن + نام + محله + لینک بدون تداخل + تایید فوری)
    ctx.save();
    const rightCardBg = ctx.createLinearGradient(482, 421, 482, 844);
    rightCardBg.addColorStop(0, '#072266');
    rightCardBg.addColorStop(0.6, '#051A52');
    rightCardBg.addColorStop(1, '#03123A');
    ctx.fillStyle = rightCardBg;
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(482, 421, 326, 423, 38);
    ctx.fill();
    ctx.stroke();

    // کپسول فیروزه‌ای بالای کارت سمت راست: «پروفایل رسمی سالن»
    const topBadgeGrad = ctx.createLinearGradient(523, 452, 767, 504);
    topBadgeGrad.addColorStop(0, '#18A4E0');
    topBadgeGrad.addColorStop(1, '#29B6F6');
    ctx.fillStyle = topBadgeGrad;
    ctx.beginPath();
    ctx.roundRect(523, 452, 244, 52, 26);
    ctx.fill();

    ctx.fillStyle = '#03123A';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.font = `800 21.5px ${fontStack}`;
    ctx.fillText('پروفایل رسمی سالن', 645, 485);

    // نام سالن / کسب‌وکار
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    const nameLen = cleanBizName.length;
    const nameFontSize = nameLen > 24 ? 22 : nameLen > 18 ? 26 : 30;
    ctx.font = `900 ${nameFontSize}px ${fontStack}`;
    ctx.fillText(cleanBizName.slice(0, 28), 645, 580, 296);

    // شهر و محله کسب‌وکار
    ctx.fillStyle = '#DBEAFE';
    ctx.font = `700 20.5px ${fontStack}`;
    ctx.fillText(cleanLocation.slice(0, 30), 645, 630, 296);

    // خط جداکننده ظریف وسط کارت
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(502, 656);
    ctx.lineTo(788, 656);
    ctx.stroke();

    // کپسول لینک کوتاه اختصاصی سالن (Timeto.ir/slug)
    ctx.fillStyle = '#03133D';
    ctx.strokeStyle = '#1D4ED8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(498, 680, 294, 62, 31);
    ctx.fill();
    ctx.stroke();

    // آیکون مربع و فلش لینک خارجی در سمت چپ کپسول
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.4;
    const lx = 514;
    const ly = 699;
    ctx.beginPath();
    ctx.roundRect(lx, ly + 4, 20, 20, 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx + 10, ly + 14);
    ctx.lineTo(lx + 22, ly + 2);
    ctx.moveTo(lx + 14, ly + 2);
    ctx.lineTo(lx + 22, ly + 2);
    ctx.lineTo(lx + 22, ly + 10);
    ctx.stroke();

    // متن لینک کوتاه اختصاصی بدون تداخل با آیکون سمت چپ (محدوده x: 544 تا 778)
    ctx.fillStyle = '#FFFFFF';
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';
    const shortUrlText = shortLink.displayShortUrl;
    const urlFontSize =
      shortUrlText.length > 25
        ? 15
        : shortUrlText.length > 21
        ? 17
        : 19;
    ctx.font = `800 ${urlFontSize}px "Estedad", "Plus Jakarta Sans", monospace`;
    ctx.fillText(shortUrlText.slice(0, 30), 662, 717, 226);

    // ردیف پایین کارت راست: «تایید فوری نوبت در تایم‌تو» + آیکون صاعقه
    drawLightningIcon(ctx, 758, 792);
    ctx.fillStyle = '#E2E8F0';
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.font = `700 18.5px ${fontStack}`;
    ctx.fillText('تایید فوری نوبت در تایم‌تو', 634, 799);
    ctx.restore();

    // ۶. کپسول سرتاسری پایین («می‌تونی بدون تماس تلفنی، ۲۴ ساعته از ما نوبت بگیری»)
    ctx.save();
    const bottomPillBg = ctx.createLinearGradient(55, 876, 808, 950);
    bottomPillBg.addColorStop(0, '#021036');
    bottomPillBg.addColorStop(0.5, '#041648');
    bottomPillBg.addColorStop(1, '#021036');
    ctx.fillStyle = bottomPillBg;
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(55, 876, 753, 74, 37);
    ctx.fill();
    ctx.stroke();

    drawCalendarIcon(ctx, 92, 894, 36);
    ctx.fillStyle = '#FFFFFF';
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.font = `800 23.5px ${fontStack}`;
    ctx.fillText(
      'می‌تونی بدون تماس تلفنی، ۲۴ ساعته از ما نوبت بگیری',
      456,
      921
    );
    ctx.restore();

    // ۷. لوگوی سه‌بعدی وکتور Timeto و آدرس timeto24.ir در پایین پوستر
    drawBottomBrandAndWebsite(ctx);
  };

  const ensurePosterFontsLoaded = async () => {
    if (typeof document === 'undefined' || !document.fonts) return;
    try {
      if (typeof FontFace !== 'undefined') {
        const extraBoldFace = new FontFace(
          'Estedad',
          'url(/fonts/Estedad-ExtraBold.woff2) format("woff2")',
          { weight: '800 900', style: 'normal' }
        );
        const boldFace = new FontFace(
          'Estedad',
          'url(/fonts/Estedad-Bold.woff2) format("woff2")',
          { weight: '700', style: 'normal' }
        );
        const loadedFaces = await Promise.allSettled([
          extraBoldFace.load(),
          boldFace.load(),
        ]);
        for (const res of loadedFaces) {
          if (res.status === 'fulfilled') {
            document.fonts.add(res.value);
          }
        }
      }
      await Promise.allSettled([
        document.fonts.load('900 54px "Estedad"'),
        document.fonts.load('800 30px "Estedad"'),
        document.fonts.load('700 24px "Estedad"'),
      ]);
      await document.fonts.ready;
    } catch {
      // ignore font loading fallback
    }
  };

  const handleDownloadPrintableStand = async () => {
    if (!qrDataUrl || isDownloading) return;
    setIsDownloading(true);

    await ensurePosterFontsLoaded();

    const canvas = document.createElement('canvas');
    canvas.width = BASE_WIDTH * PRINT_SCALE; // 2559px
    canvas.height = BASE_HEIGHT * PRINT_SCALE; // 3840px (4K Print Resolution — 440 DPI on A5)
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsDownloading(false);
      return;
    }

    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      ctx.save();
      ctx.scale(PRINT_SCALE, PRINT_SCALE);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      renderFullVectorPoster4K(ctx, qrImg);
      ctx.restore();
      triggerCanvasDownload(canvas);
      setIsDownloading(false);
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

      {/* دو دکمه اصلی: دانلود پوستر اختصاصی (کیفیت چاپ A5/A4 - 4K) و کپی لینک */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        <Button
          type="button"
          variant="primary"
          size="sm"
          fullWidth
          disabled={!qrDataUrl || isDownloading}
          onClick={() => void handleDownloadPrintableStand()}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isDownloading
              ? 'در حال آماده‌سازی کیفیت چاپ...'
              : 'دانلود پوستر (کیفیت چاپ A5)'}
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
