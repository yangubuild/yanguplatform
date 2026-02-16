/**
 * Enterprise auth redirect helper.
 * Ensures all auth-required actions on non-primary domains
 * redirect to yangu.io with a safe returnTo param.
 */

const IDENTITY_ORIGIN = "https://yangu.io";
const LOGIN_PATH = "/auth/login";

/**
 * Allowed returnTo domains (prevent open-redirect).
 * Matches *.yangu.* (any TLD) and the identity origin itself.
 */
const ALLOWED_RETURN_PATTERNS = [
  /^https?:\/\/([a-z0-9-]+\.)*yangu\.[a-z]{2,}(\/|$)/i,
];

/**
 * Validate that a returnTo URL is safe (not an open-redirect vector).
 * Only allows yangu.* domains.
 */
export function isAllowedReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be http(s)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    return ALLOWED_RETURN_PATTERNS.some((p) => p.test(url));
  } catch {
    return false;
  }
}

/**
 * Parse and validate the returnTo param from the current URL search params.
 * Returns the validated URL or null if invalid/missing.
 */
export function getReturnToFromParams(searchParams: URLSearchParams): string | null {
  const raw = searchParams.get("returnTo");
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return isAllowedReturnUrl(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Check if the current host is the identity/auth domain (yangu.io).
 */
export function isIdentityDomain(host: string = window.location.hostname): boolean {
  const normalized = host.replace(/^www\./, "").toLowerCase();
  return normalized === "yangu.io";
}

/**
 * Redirect to the identity login on yangu.io, preserving the current URL
 * as a returnTo parameter so the user returns after authentication.
 *
 * @param returnToUrl - The full URL to return to after login.
 *   Defaults to the current page URL (window.location.href).
 */
export function redirectToIdentityLogin(returnToUrl?: string): void {
  const returnTo = returnToUrl ?? window.location.href;

  // Safety: only redirect if we're NOT already on the identity domain
  if (isIdentityDomain()) return;

  // Validate the returnTo URL
  if (!isAllowedReturnUrl(returnTo)) {
    // Fallback: redirect without returnTo
    window.location.href = `${IDENTITY_ORIGIN}${LOGIN_PATH}`;
    return;
  }

  const loginUrl = new URL(LOGIN_PATH, IDENTITY_ORIGIN);
  loginUrl.searchParams.set("returnTo", returnTo);
  window.location.href = loginUrl.toString();
}
