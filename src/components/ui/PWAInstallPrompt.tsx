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
 * دکمه نصب اپلیکیشن
 */
export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const { isInstalled, install, confirmInstalled } = usePWAInstall();
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
          confirmInstalled();
          setGuideOpen(false);
        }}
      />
    </>
  );
};

/**
 * آیتم کوچک و خلوت «نصب اپ» مخصوص داخل پروفایل و منوی حساب کاربری
 * در صورتی که اپ نصب شده باشد، به‌طور کامل مخفی می‌شود (return null).
 */
export const PWAProfileInstallRow: React.FC<{
  variant?: 'card' | 'menu-row';
}> = ({ variant = 'card' }) => {
  const { isInstalled, install, confirmInstalled } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isInstalled) return null;

  const handleAction = async () => {
    const res = await install();
    if (res === 'manual_guide') {
      setGuideOpen(true);
    }
  };

  return (
    <>
      {variant === 'menu-row' ? (
        <button
          type="button"
          onClick={() => void handleAction()}
          className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl bg-[#EFF6FF] hover:bg-[#E0ECFF] border border-[#0057FF]/25 text-right transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={TIMETO_LOGO_IMAGE_PATH}
              alt="آیکون اپ تایم تو"
              className="w-7 h-7 rounded-lg object-contain bg-[#02081D] shrink-0"
            />
            <span className="text-xs font-extrabold text-[#061138] truncate">
              نصب وب‌اپلیکیشن
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0057FF] text-white text-[11px] font-extrabold shrink-0">
            <Download className="w-3 h-3" />
            <span>نصب</span>
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-l from-[#061138] to-[#0B1E5B] text-white border border-[#00E5FF]/30 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={TIMETO_LOGO_IMAGE_PATH}
              alt="Timeto App"
              className="w-9 h-9 rounded-xl object-contain bg-[#02081D] border border-[#00E5FF]/35 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">
                نصب اپلیکیشن تایم تو
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                اجرای سریع و تمام‌صفحه روی گوشی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleAction()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#00E5FF] hover:bg-[#38BDF8] text-[#061138] text-xs font-extrabold shrink-0 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نصب اپ</span>
          </button>
        </div>
      )}

      <PWAInstallGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        onConfirmInstalled={() => {
          confirmInstalled();
          setGuideOpen(false);
        }}
      />
    </>
  );
};

export const PWAMobileInstallBanner: React.FC = () => {
  const {
    isInstalled,
    justInstalled,
    isBannerDismissed,
    install,
    dismissBanner,
    confirmInstalled,
    dismissJustInstalled,
  } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [hasTriggeredByScrollOrDelay, setHasTriggeredByScrollOrDelay] =
    useState(false);

  useEffect(() => {
    if (!justInstalled) return;
    const timer = window.setTimeout(() => {
      dismissJustInstalled();
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [justInstalled, dismissJustInstalled]);

  useEffect(() => {
    if (typeof window === 'undefined' || isInstalled || isBannerDismissed) {
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 80) {
        setHasTriggeredByScrollOrDelay(true);
      }
    };

    const timer = window.setTimeout(() => {
      setHasTriggeredByScrollOrDelay(true);
    }, 3000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isInstalled, isBannerDismissed]);

  if (justInstalled) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:left-5 sm:w-96 z-50 rounded-2xl bg-[#065F46] text-white px-4 py-3.5 shadow-2xl border-2 border-[#34D399] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white">
              اپلیکیشن تایم تو روی گوشی شما نصب شد!
            </p>
            <p className="text-[11px] text-[#A7F3D0] mt-0.5">
              از این پس از آیکون تایم تو در صفحه اصلی گوشی وارد شوید.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissJustInstalled}
          aria-label="بستن"
          className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

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
        className="fixed bottom-20 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:left-5 sm:w-88 z-40 rounded-2xl bg-[#061138] text-white px-3.5 py-3 shadow-[0_16px_40px_-8px_rgba(6,17,56,0.85)] border border-[#00E5FF]/45 flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={TIMETO_LOGO_IMAGE_PATH}
            alt="Timeto"
            className="w-9 h-9 rounded-xl object-contain bg-[#02081D] border border-[#00E5FF]/40 shrink-0"
          />
          <p className="text-xs font-extrabold text-white truncate">
            نصب اپلیکیشن تایم تو
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleAction()}
            className="px-4 py-1.5 rounded-full bg-[#00E5FF] hover:bg-[#38BDF8] text-[#061138] text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
          >
            نصب
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="بستن"
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
          confirmInstalled();
          setGuideOpen(false);
        }}
      />
    </>
  );
};

export const PWAInstallGuideModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirmInstalled: () => void;
}> = ({ isOpen, onClose, onConfirmInstalled }) => {
  const { isIOS, isInAppBrowser, isInstallable, install } = usePWAInstall();

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
            className="w-16 h-16 rounded-2xl object-contain bg-[#030B26] border border-[#00E5FF]/40 shadow-[0_0_28px_rgba(0,212,255,0.35)]"
          />
          <div className="text-white space-y-1">
            <span className="text-[11px] font-bold text-[#00E5FF] inline-flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>
                {isIOS
                  ? 'نصب نسخه وب‌اپلیکیشن آیفون (iOS)'
                  : 'نصب وب‌اپلیکیشن روی گوشی'}
              </span>
            </span>
            <h3 className="text-base font-extrabold">
              افزودن آیکون Timeto به صفحه اصلی گوشی
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-3.5 text-right">
          {isInstallable ? (
            <button
              type="button"
              onClick={() => {
                void install().then((res) => {
                  if (res === 'accepted') {
                    onConfirmInstalled();
                    onClose();
                  }
                });
              }}
              className="w-full py-3 px-4 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>نصب خودکار اپلیکیشن Timeto</span>
            </button>
          ) : null}

          {isInAppBrowser ? (
            <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FCD34D] text-[#92400E] text-xs space-y-1">
              <p className="font-extrabold">
                ⚠️ شما داخل مرورگر اینستاگرام یا تلگرام هستید
              </p>
              <p className="text-[11px] leading-relaxed font-semibold">
                ابتدا روی منوی سه نقطه <strong>(•••)</strong> بالای صفحه بزنید و
                گزینه <strong>Open in Safari / باز کردن در مرورگر اصلی</strong>{' '}
                را انتخاب کنید.
              </p>
            </div>
          ) : null}

          {isIOS ? (
            <p className="text-[11px] text-[#475569] font-semibold leading-relaxed">
              در گوشی‌های آیفون (به‌دلیل محدودیت امنیتی سیستم‌عامل iOS اپل)، نصب
              برنامه در ۲ ثانیه از طریق منوی پایین مرورگر <strong>Safari</strong>{' '}
              انجام می‌شود:
            </p>
          ) : null}

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-[#F4F7FB] border border-[#CBD5E1] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#061138] text-[#00E5FF] flex items-center justify-center shrink-0">
                <Share className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-[#0B132B]">
                  {isIOS
                    ? '۱. در نوار پایین Safari دکمه Share (اشتراک‌گذاری) را بزنید'
                    : '۱. در بالای مرورگر کروم منوی سه نقطه (⋮) را بزنید'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F7FB] border border-[#CBD5E1] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0057FF] text-white flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-[#0B132B]">
                  {isIOS
                    ? '۲. منو را بالا بکشید و گزینه «Add to Home Screen» را بزنید'
                    : '۲. گزینه «Install App» یا «Add to Home Screen» را بزنید'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2.5 text-[#065F46]">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span className="font-bold">
                ۳. دکمه Add را بزنید تا آیکون Timeto به صفحه اصلی اضافه شود
              </span>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-full bg-[#0057FF] hover:bg-[#0044CC] text-white text-xs font-extrabold cursor-pointer transition-colors"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

