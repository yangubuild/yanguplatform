/**
 * Utilities for resolving manage-panel paths that work in both
 * /manage/* (main app) and / (subdomain) contexts.
 */

/** Strip the /manage prefix if present, returning the panel-relative slug */
export function getManageSlug(pathname: string): string {
  return pathname.replace(/^\/manage\/?/, "").replace(/^\//, "");
}

/**
 * Build a manage-panel link that works in both /manage/* and subdomain contexts.
 * In the main app the path is /manage/<slug>; on the subdomain it's /<slug>.
 */
export function manageLink(slug: string): string {
  const isSubdomain = !window.location.pathname.startsWith("/manage");
  const base = isSubdomain ? "" : "/manage";
  return `${base}/${slug}`.replace(/\/+/g, "/");
}
