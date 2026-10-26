import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_STORAGE_KEY = 'timeto_pwa_banner_dismissed_v1';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const mobile =
      ios ||
      /android|webos|blackberry|iemobile|opera mini|mobile/.test(ua) ||
      window.innerWidth < 768;

    setIsIOS(ios);
    setIsMobileDevice(mobile);

    try {
      setIsBannerDismissed(
        window.sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1'
      );
    } catch {
      // ignore storage errors
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'manual_guide'> => {
    if (!deferredPrompt) {
      return 'manual_guide';
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return 'accepted';
    }
    return 'dismissed';
  };

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isMobileDevice,
    isBannerDismissed,
    install,
    dismissBanner,
  };
}
