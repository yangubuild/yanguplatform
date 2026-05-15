import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initOfflinePostHog, posthog } from "@/lib/posthog";

/**
 * Initializes PostHog for /offline/* routes only and tracks SPA pageviews.
 * Mounted alongside <Routes /> in App.tsx; no-ops on non-offline routes.
 */
export function OfflineAnalytics() {
  const location = useLocation();
  const isOffline = location.pathname.startsWith("/offline");

  useEffect(() => {
    if (!isOffline) return;
    initOfflinePostHog();
    try {
      posthog.capture("$pageview", { path: location.pathname });
    } catch {
      /* ignore */
    }
  }, [isOffline, location.pathname]);

  return null;
}