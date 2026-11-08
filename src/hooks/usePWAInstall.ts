import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const INSTALLED_STORAGE_KEY = 'timeto_pwa_confirmed_installed_v3';
const BANNER_DISMISS_STORAGE_KEY = 'timeto_pwa_banner_dismissed_v3';

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

    let confirmedInstalled = false;
    let bannerDismissed = false;
    try {
      confirmedInstalled =
        window.localStorage.getItem(INSTALLED_STORAGE_KEY) === '1';
      bannerDismissed =
        confirmedInstalled ||
        window.localStorage.getItem(BANNER_DISMISS_STORAGE_KEY) === '1' ||
        window.sessionStorage.getItem(BANNER_DISMISS_STORAGE_KEY) === '1';
    } catch {
      // ignore storage errors
    }

    setIsInstalled(isStandalone || confirmedInstalled);
    setIsBannerDismissed(bannerDismissed);

    const ua = window.navigator.userAgent.toLowerCase();
    const ios =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' &&
        window.navigator.maxTouchPoints > 1);
    const mobile =
      ios ||
      /android|webos|blackberry|iemobile|opera mini|mobile/.test(ua) ||
      window.innerWidth < 768;

    setIsIOS(ios);
    setIsMobileDevice(mobile);

    const existingGlobalPrompt = (
      window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent | null }
    ).__deferredPwaPrompt;
    if (existingGlobalPrompt) {
      setDeferredPrompt(existingGlobalPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (
        window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent | null }
      ).__deferredPwaPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsBannerDismissed(true);
      setJustInstalled(true);
      setDeferredPrompt(null);
      (
        window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent | null }
      ).__deferredPwaPrompt = null;
      try {
        window.localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
        window.localStorage.setItem(BANNER_DISMISS_STORAGE_KEY, '1');
      } catch {
        // ignore
      }
      window.dispatchEvent(new Event('timeto-pwa-installed-success'));
    };

    const handleCustomSuccess = () => {
      setJustInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('timeto-pwa-installed-success', handleCustomSuccess);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('timeto-pwa-installed-success', handleCustomSuccess);
    };
  }, []);

  const [justInstalled, setJustInstalled] = useState(false);

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      window.localStorage.setItem(BANNER_DISMISS_STORAGE_KEY, '1');
      window.sessionStorage.setItem(BANNER_DISMISS_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  const confirmInstalled = () => {
    setIsInstalled(true);
    setIsBannerDismissed(true);
    setJustInstalled(true);
    try {
      window.localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
      window.localStorage.setItem(BANNER_DISMISS_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('timeto-pwa-installed-success'));
    }
  };

  const dismissJustInstalled = () => {
    setJustInstalled(false);
  };

  const install = async (): Promise<'accepted' | 'dismissed' | 'manual_guide'> => {
    if (!deferredPrompt) {
      return 'manual_guide';
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      confirmInstalled();
      setDeferredPrompt(null);
      return 'accepted';
    }
    return 'dismissed';
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    justInstalled,
    isIOS,
    isMobileDevice,
    isBannerDismissed,
    install,
    dismissBanner,
    confirmInstalled,
    dismissJustInstalled,
  };
}
