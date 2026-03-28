import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

/**
 * Initialize native Capacitor plugins when running as a native app.
 * Call once at app startup.
 */
export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  // Status bar: dark content, YANGU dark green background
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#08120D' });
  } catch {
    // StatusBar not available on this platform
  }

  // Hide splash screen (auto-hide is on, but ensure it's dismissed)
  try {
    await SplashScreen.hide();
  } catch {
    // SplashScreen not available
  }

  // Handle back button on Android — let the WebView handle navigation
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  // Handle external URLs — open in system browser
  App.addListener('appUrlOpen', ({ url }) => {
    const isInternal =
      url.includes('yangu.io') ||
      url.includes('yanguplatform.lovable.app');
    if (!isInternal) {
      window.open(url, '_blank');
    }
  });
}

/** True when running inside a native Capacitor shell */
export const isNativeApp = Capacitor.isNativePlatform();
