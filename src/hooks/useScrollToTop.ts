import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * هوک مدیریت اسکرول (useScrollToTop)
 * در هر تغییر مسیر پس از بارگذاری اولیه، موقعیت اسکرول صفحه را به ابتدای صفحه بازمی‌گرداند
 * بدون ایجاد Forced Reflow در لحظه اول رندر صفحه.
 */
export function useScrollToTop(): void {
  const { pathname, search } = useLocation();
  const prevRouteRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentKey = `${pathname}${search}`;
    if (prevRouteRef.current === null) {
      prevRouteRef.current = currentKey;
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      return;
    }
    if (prevRouteRef.current === currentKey) return;
    prevRouteRef.current = currentKey;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, search]);
}

