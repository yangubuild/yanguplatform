import posthog from "posthog-js";

const KEY = "phc_qRPLTFy3vvd54zUK6tEhqheG48DYQMSMrvf8mmSDrXj9";
const HOST = "https://us.i.posthog.com";

let initialized = false;

function dntEnabled(): boolean {
  if (typeof navigator === "undefined") return false;
  const dnt =
    (navigator as any).doNotTrack ||
    (window as any).doNotTrack ||
    (navigator as any).msDoNotTrack;
  return dnt === "1" || dnt === "yes" || dnt === true;
}

/** Initialize PostHog. Safe to call multiple times — only inits once. */
export function initOfflinePostHog() {
  if (initialized || typeof window === "undefined") return;
  if (dntEnabled()) {
    initialized = true;
    return;
  }
  // Skip Lovable preview hosts
  const host = window.location.hostname;
  if (host.includes("id-preview--") || host.includes("lovableproject.com")) {
    initialized = true;
    return;
  }
  posthog.init(KEY, {
    api_host: HOST,
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
    },
    // Error tracking
    capture_exceptions: true,
    respect_dnt: true,
    persistence: "localStorage+cookie",
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.debug(false);
    },
  });
  initialized = true;
}

export function trackOffline(event: string, props?: Record<string, unknown>) {
  if (!initialized || typeof window === "undefined") return;
  if (dntEnabled()) return;
  try {
    posthog.capture(event, props);
  } catch {
    // ignore
  }
}

export { posthog };