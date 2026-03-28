import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Initialize push notifications for native platforms.
 * Requests permission, registers for push, and handles incoming notifications.
 */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  // Check current permission status
  const permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
    const result = await PushNotifications.requestPermissions();
    if (result.receive !== 'granted') {
      console.log('[YANGU Push] Permission not granted');
      return;
    }
  } else if (permStatus.receive !== 'granted') {
    console.log('[YANGU Push] Permission denied');
    return;
  }

  // Register with APNs / FCM
  await PushNotifications.register();

  // Token received — log it; later store in Supabase
  PushNotifications.addListener('registration', (token) => {
    console.log('[YANGU Push] Token:', token.value);
    // TODO: Store token in Supabase push_tokens table
    // e.g. supabase.from('push_tokens').upsert({ user_id, token: token.value, platform })
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.error('[YANGU Push] Registration error:', err.error);
  });

  // Notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[YANGU Push] Foreground notification:', notification.title);
    // In foreground — could show a toast or in-app banner
    // For now, silently log; UI can be added later
  });

  // User tapped on a notification
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data;
    console.log('[YANGU Push] Notification tapped, data:', data);

    // Route to the correct page if a deep link is provided
    if (data?.route && typeof data.route === 'string') {
      navigateToRoute(data.route);
    } else if (data?.url && typeof data.url === 'string') {
      navigateToRoute(data.url);
    }
    // If no route data, app simply opens to current state (safe fallback)
  });
}

/**
 * Navigate to an internal route from a notification tap.
 * Falls back to homepage if route is invalid.
 */
function navigateToRoute(route: string) {
  try {
    // Strip domain if full URL was provided
    let path = route;
    if (path.startsWith('https://yangu.io')) {
      path = path.replace('https://yangu.io', '');
    }

    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Use history pushState to avoid full page reload
    window.location.href = path;
  } catch {
    // Fallback to homepage
    window.location.href = '/';
  }
}
