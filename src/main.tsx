import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { startBuildVersionGuard } from "./lib/lazyRetry";
import { initCapacitor } from "./lib/capacitor";
import { initSentry, Sentry } from "./lib/sentry";
import { DevErrorButton } from "./components/DevErrorButton";
import "./index.css";

// Initialize Sentry as early as possible (skips Lovable preview hosts)
initSentry();

// Detect stale builds when user refocuses tab
startBuildVersionGuard();

// Initialize native plugins when running as a Capacitor app
initCapacitor();

// --- PWA Service Worker safety ---
// Never register SW inside iframes or Lovable preview hosts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Create QueryClient instance ONCE at module scope (outside component render)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Sentry.ErrorBoundary fallback={<div style={{ padding: 24 }}>Something went wrong. The team has been notified.</div>}>
        <App />
        <DevErrorButton />
      </Sentry.ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);
