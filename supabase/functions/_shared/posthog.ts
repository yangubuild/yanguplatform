// Lightweight PostHog server-side capture for Yangu Offline edge functions.
// Fire-and-forget; never block the request.

const POSTHOG_KEY = "phc_qRPLTFy3vvd54zUK6tEhqheG48DYQMSMrvf8mmSDrXj9";
const POSTHOG_HOST = "https://us.i.posthog.com";

export function capturePostHog(
  event: string,
  distinctId: string,
  properties: Record<string, unknown> = {},
): void {
  try {
    const body = JSON.stringify({
      api_key: POSTHOG_KEY,
      event,
      distinct_id: distinctId || "anonymous",
      properties: { ...properties, source: "edge-function" },
      timestamp: new Date().toISOString(),
    });
    // Don't await — fire and forget
    fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  } catch {
    /* swallow */
  }
}