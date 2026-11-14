import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isPreviewOrIframe =
    import.meta.env.DEV ||
    window.self !== window.top ||
    window.location.hostname.endsWith('.run.app') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isPreviewOrIframe) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});
  } else {
    let refreshing = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });

          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              void registration.update().catch(() => {});
            }
          });
        })
        .catch(() => {
          // Service worker registration optional in restricted contexts
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
