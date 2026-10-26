import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * هوک مدیریت اسکرول (useScrollToTop)
 * در هر تغییر مسیر (pathname یا پارامترهای جست‌وجو)، موقعیت اسکرول صفحه را
 * بلافاصله به ابتدای صفحه (top: 0) بازمی‌گرداند تا صفحه هرگز از پایین یا فوتر نمایش داده نشود.
 */
export function useScrollToTop(): void {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
    };

    resetScroll();
    const rafId = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(rafId);
  }, [pathname, search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo(0, 0);
  }, [pathname, search]);
}
