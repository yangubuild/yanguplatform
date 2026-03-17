import type { SearchEntityResult } from "@/types/search";

/**
 * Given a search entity result, return the best available detail route.
 *
 * For now most surfaces don't have a dedicated public detail page yet,
 * so we route to discover or the domain host when available.
 * This will be updated as detail pages ship.
 */
export function getEntityRoute(entity: SearchEntityResult): string {
  // If the entity has a live domain, link to it
  if (entity.domain_host) {
    return `https://${entity.domain_host}`;
  }

  // If it has a slug, route to the discover page with slug
  if (entity.slug) {
    return `/discover/${entity.slug}`;
  }

  // Fallback: discover page filtered by entity type
  return `/discover?type=${entity.entity_type}`;
}

/**
 * Whether a route is an external URL (opens in new tab).
 */
export function isExternalRoute(route: string): boolean {
  return route.startsWith("http://") || route.startsWith("https://");
}

/**
 * Badge color for verified entities.
 * blue = individual/creator, orange = business, green = organization
 */
export function getVerifiedBadgeColor(
  entity: SearchEntityResult,
): "blue" | "orange" | "green" | null {
  if (!entity.is_verified) return null;
  switch (entity.entity_type) {
    case "business":
      return "orange";
    case "organization":
      return "green";
    default:
      return "blue";
  }
}
