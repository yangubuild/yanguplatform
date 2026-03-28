import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Initialize deep link handling for yangu.io Universal Links / App Links.
 * When a yangu.io link is opened and the app is installed, it will be
 * intercepted here and routed to the correct in-app page.
 */
export function initDeepLinking() {
  if (!Capacitor.isNativePlatform()) return;

  App.addListener('appUrlOpen', ({ url }) => {
    console.log('[YANGU DeepLink] Received:', url);

    try {
      const parsedUrl = new URL(url);

      // Only handle yangu.io links internally
      if (parsedUrl.hostname === 'yangu.io' || parsedUrl.hostname === 'www.yangu.io') {
        const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;

        if (path && path !== '/') {
          // Navigate to the deep-linked route
          window.location.href = path;
        }
        // If root path, app is already open — do nothing
        return;
      }

      // External links → open in system browser
      window.open(url, '_blank');
    } catch {
      // If URL parsing fails, open in system browser as fallback
      window.open(url, '_blank');
    }
  });
}
