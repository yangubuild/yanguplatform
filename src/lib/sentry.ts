import * as Sentry from "@sentry/react";

const DSN = "https://0e07e15fab7f2aae503df3ebf0d889a0@o4511393961541632.ingest.us.sentry.io/4511394132393984";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  // Skip inside Lovable preview iframes to avoid noise
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovableproject-dev.com");
  if (isPreviewHost) return;

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  });
  initialized = true;
}

export { Sentry };
