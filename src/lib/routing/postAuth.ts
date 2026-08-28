/**
 * Canonical post-authentication routing.
 *
 * The public Yangu homepage (yangu.io / www.yangu.io) is a separate marketing
 * site and has no app routes. Sending an authenticated user there — which used
 * to happen whenever a `returnTo` pointed at the marketing host — lands them on
 * a marketing 404 instead of the app. Every sign-in path (password, magic link,
 * OAuth callback) must resolve its destination through this helper.
 */

/** Canonical authenticated home route. */
export const POST_AUTH_HOME = "/dashboard";

/** Hosts that serve the public marketing site, never the app. */
const MARKETING_HOSTS = ["yangu.io"];

function normalizeHost(host: string): string {
  return host.replace(/^www\./, "").toLowerCase();
}

function isMarketingHost(host: string): boolean {
  return MARKETING_HOSTS.includes(normalizeHost(host));
}

/**
 * Resolve a raw `returnTo` value into a safe in-app destination.
 * Returns a relative path (always starting with "/") or null when the value is
 * missing/unsafe/marketing-only, in which case callers should use POST_AUTH_HOME.
 */
export function resolvePostAuthPath(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // keep the raw value
  }

  // Protocol-relative or malformed values are rejected outright.
  if (value.startsWith("//")) return null;

  if (value.startsWith("/")) {
    return value === "/" ? null : value;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (isMarketingHost(parsed.hostname)) return null;
    if (typeof window !== "undefined" && parsed.origin !== window.location.origin) return null;
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return !path || path === "/" ? null : path;
  } catch {
    return null;
  }
}

/** Same as resolvePostAuthPath but always returns a usable destination. */
export function getPostAuthDestination(raw?: string | null): string {
  return resolvePostAuthPath(raw) ?? POST_AUTH_HOME;
}

/** Convenience wrapper for URLSearchParams-based callers. */
export function getPostAuthDestinationFromParams(params: URLSearchParams): string {
  return getPostAuthDestination(params.get("returnTo"));
}
