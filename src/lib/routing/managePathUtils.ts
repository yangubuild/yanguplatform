/**
 * Utilities for resolving manage-panel paths that work in both
 * /manage/* (main app) and /management/* (subdomain) contexts.
 */

/** Strip the management prefix if present, returning the panel-relative slug */
export function getManageSlug(pathname: string): string {
  return pathname
    .replace(/^\/manage(ment)?\/?/, "")
    .replace(/^\//, "");
}

/**
 * Build a manage-panel link that works in both /manage/* and subdomain contexts.
 * On the subdomain the path is /management/<slug>; in the main app it's /manage/<slug>.
 */
export function manageLink(slug: string): string {
  const isSubdomain = !window.location.pathname.startsWith("/manage/") && !window.location.pathname.startsWith("/manage");
  // On subdomain, management workspace uses /management/ prefix
  if (isSubdomain || window.location.pathname.startsWith("/management")) {
    return `/management/${slug}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/management";
  }
  // Main app uses /manage/
  return `/manage/${slug}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/manage";
}
