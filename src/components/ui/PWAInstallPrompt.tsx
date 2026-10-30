import React, { useEffect, useState } from 'react';
import {
  Download,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { TIMETO_LOGO_IMAGE_PATH } from './TimetoLogo';

/**
 * دکمه نصب اپلیکیشن + پاپ‌آپ شناور پیشنهاد نصب در پایین صفحه (پس از اسکرول یا مکث کوتاه)
 */
export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const { isInstalled, install, dismissBanner } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    const result = await install();
    if (result === 'manual_guide') {
      setGuideOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInstallClick()}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#061138] to-[#0057FF] hover:from-[#0A1D56] hover:to-[#0044CC] text-white font-bold transition-all cursor-pointer shadow-[0_6px_16px_-4px_rgba(0,87,255,0.45)] whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
        }`}
        aria-label="نصب اپلیکیشن تایم تو روی گوشی"
      >
        <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
        <span>نصب اپ</span>
      </button>

      <PWAInstallGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        onConfirmInstalled={() => {
          dismissBanner();
          setGuideOpen(false);
        }}
      />
    </>
  );
};

export const PWAMobileInstallBanner: React.FC = () => {
  const {
    isInstalled,
    isBannerDismissed,
    isIOS,
    install,
    dismissBanner,
  } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasTriggeredByScrollOrDelay, setHasTriggeredByScrollOrDelay] =
    useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || isInstalled || isBannerDismissed) {
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 140) {
        setHasTriggeredByScrollOrDelay(true);
      }
    };

    const timer = window.setTimeout(() => {
      setHasTriggeredByScrollOrDelay(true);
    }, 4500);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isInstalled, isBannerDismissed]);

  if (isInstalled || isBannerDismissed || !hasTriggeredByScrollOrDelay) {
    return null;
  }

  const handleAction = async () => {
    const res = await install();
    if (res === 'manual_guide') {
      setGuideOpen(true);
    }
  };

  return (
    <>
      <div
        role="region"
        aria-label="پاپ‌آپ نصب وب‌اپلیکیشن تایم تو"
        className="fixed bottom-20 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:left-5 sm:w-96 z-40 rounded-2xl bg-gradient-to-r from-[#061138] via-[#0B1D52] to-[#0044CC] text-white p-3.5 shadow-[0_16px_40px_-8px_rgba(6,17,56,0.75)] border border-[#00E5FF]/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={TIMETO_LOGO_IMAGE_PATH}
            alt="Timeto App Icon"
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-xl object-cover border border-[#00E5FF]/40 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">
              نصب اپلیکیشن تایم تو روی گوشی
            </p>
            <p className="text-[11px] text-[#BAE6FD] truncate">
              {isIOS
                ? 'ویژه آیفون (iOS) و اندروید · تمام‌صفحه و سریع'
                : 'دسترسی سریع و تمام‌صفحه بدون نیاز به مرورگر'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleAction()}
            className="px-3.5 py-2 rounded-full bg-[#00E5FF] hover:bg-[#38BDF8] text-[#061138] text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
          >
            {isIOS ? 'نصب در آیفون' : 'نصب اپ'}
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="بستن و عدم نمایش مجدد پیشنهاد نصب"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <PWAInstallGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        onConfirmInstalled={() => {
          dismissBanner();
          setGuideOpen(false);
        }}
      />
    </>
  );
};

const PWAInstallGuideModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirmInstalled: () => void;
}> = ({ isOpen, onClose, onConfirmInstalled }) => {
  const { isIOS, isInstallable, install } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="راهنمای نصب اپلیکیشن تایم تو روی گوشی"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#061138]/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden">
        <div className="relative py-5 px-5 bg-[#02081D] overflow-hidden flex flex-col items-center text-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={TIMETO_LOGO_IMAGE_PATH}
            alt="Timeto Mobile App Icon"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00E5FF]/40 shadow-[0_0_28px_rgba(0,212,255,0.35)]"
          />
          <div className="text-white space-y-1">
            <span className="text-[11px] font-bold text-[#00E5FF] inline-flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>وب‌اپلیکیشن رسمی آیفون (iOS) و اندروید</span>
            </span>
            <h3 className="text-base font-extrabold">
              نصب Timeto روی صفحه اصلی گوشی در ۱۰ ثانیه
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-4 text-right">
          {isInstallable ? (
            <button
              type="button"
              onClick={() => {
                void install().then(() => onConfirmInstalled());
              }}
              className="w-full py-3 px-4 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>نصب مستقیم اپلیکیشن Timeto</span>
            </button>
          ) : null}

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-[#F4F7FB] border border-[#CBD5E1] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#061138] text-[#00E5FF] flex items-center justify-center shrink-0">
                <Share className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-[#0B132B]">
                  {isIOS
                    ? '۱. در مرورگر Safari آیفون، دکمه Share (مربع و فلش پایین صفحه) را لمس کنید'
                    : '۱. در نوار پایین Safari (آیفون) دکمه Share یا در Chrome منوی (⋮) را بزنید'}
                </p>
                <p className="text-[#475569] mt-0.5">
                  در آیفون، اپل به دلایل امنیتی نصب تمام وب‌اپلیکیشن‌ها را از طریق منوی Share مرورگر Safari انجام می‌دهد.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F7FB] border border-[#CBD5E1] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0057FF] text-white flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-[#0B132B]">
                  ۲. گزینه «Add to Home Screen» را انتخاب و در بالا دکمه Add را بزنید
                </p>
                <p className="text-[#475569] mt-0.5">
                  آیکون اختصاصی <strong>Timeto</strong> دقیقاً مانند یک اپلیکیشن بومی روی صفحه آیفون یا اندروید شما اضافه می‌شود.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2.5 text-[#065F46]">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span className="font-bold">
                اجرای تمام‌صفحه، سریع و بدون نوار آدرس مرورگر
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onConfirmInstalled}
              className="w-full py-2.5 px-3 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold cursor-pointer transition-colors"
            >
              نصب کردم / دیگر نمایش نده
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-[#061138] text-xs font-bold cursor-pointer transition-colors"
            >
              فعلاً بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
