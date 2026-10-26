import React, { useState } from 'react';
import { Download, Share, Smartphone, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  TIMETO_LOGO_IMAGE_PATH,
  TIMETO_SHOWCASE_IMAGE_PATH,
} from './TimetoLogo';

/**
 * دکمه نصب اپلیکیشن در هدر + بنر پیشنهاد نصب روی موبایل (PWA Install Prompt)
 */
export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const { isInstalled, install } = usePWAInstall();
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
      />
    </>
  );
};

export const PWAMobileInstallBanner: React.FC = () => {
  const {
    isInstalled,
    isBannerDismissed,
    install,
    dismissBanner,
  } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (isInstalled || isBannerDismissed) return null;

  const handleAction = async () => {
    const res = await install();
    if (res === 'manual_guide') {
      setGuideOpen(true);
    }
  };

  return (
    <>
      <div className="lg:hidden mb-4 rounded-2xl bg-gradient-to-r from-[#061138] via-[#0B1D52] to-[#0044CC] text-white p-3 shadow-[0_10px_28px_-8px_rgba(6,17,56,0.5)] border border-[#00D4FF]/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={TIMETO_LOGO_IMAGE_PATH}
            alt="Timeto App Icon"
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-xl object-cover border border-[#00E5FF]/40 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-white truncate">
              نصب وب‌اپلیکیشن تایم تو (Timeto)
            </p>
            <p className="text-[11px] text-[#BAE6FD] truncate">
              دسترسی سریع‌تر و تمام‌صفحه روی گوشی شما
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleAction()}
            className="px-3.5 py-1.5 rounded-full bg-[#00E5FF] hover:bg-[#38BDF8] text-[#061138] text-xs font-extrabold cursor-pointer transition-colors shadow-xs"
          >
            نصب روی گوشی
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="بستن پیشنهاد نصب"
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <PWAInstallGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
};

const PWAInstallGuideModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
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
        <div className="relative h-44 bg-[#061138] overflow-hidden">
          <img
            src={TIMETO_SHOWCASE_IMAGE_PATH}
            alt="Timeto Mobile App Preview"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061138] via-[#061138]/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between text-white">
            <div>
              <span className="text-[11px] font-bold text-[#00E5FF] block">
                نسخه وب‌اپلیکیشن موبایل (PWA)
              </span>
              <h3 className="text-base font-extrabold">
                نصب Timeto (تایم تو) روی صفحه اصلی گوشی
              </h3>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4 text-right">
          <p className="text-xs text-[#334155] leading-relaxed">
            با افزودن <strong>تایم تو (Timeto)</strong> به صفحه اصلی موبایل، بدون
            نیاز به مرورگر و دقیقاً مانند یک اپلیکیشن مستقل و تمام‌صفحه به نوبت‌ها
            و سالن‌ها دسترسی خواهید داشت:
          </p>

          {isInstallable ? (
            <button
              type="button"
              onClick={() => {
                void install().then(() => onClose());
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
                    ? '۱. در مرورگر Safari روی دکمه Share بزنید'
                    : '۱. در مرورگر کروم یا موبایل منوی (⋮) یا Share را باز کنید'}
                </p>
                <p className="text-[#475569] mt-0.5">
                  آیکون اشتراک‌گذاری در نوار پایین یا منوی بالای مرورگر قرار دارد.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4F7FB] border border-[#CBD5E1] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0057FF] text-white flex items-center justify-center shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-extrabold text-[#0B132B]">
                  ۲. گزینه «Add to Home Screen» (افزودن به صفحه اصلی) را انتخاب کنید
                </p>
                <p className="text-[#475569] mt-0.5">
                  آیکون اختصاصی <strong>Timeto</strong> روی صفحه گوشی شما اضافه
                  می‌شود.
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

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[#061138] hover:bg-[#0A1D56] text-white text-xs font-extrabold cursor-pointer transition-colors"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
