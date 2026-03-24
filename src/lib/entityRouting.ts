import type { SearchEntityResult } from "@/types/search";
import { ENTITY_TYPE_CONFIG } from "@/types/search";

/**
 * Given a search entity result, return the best available detail route.
 *
 * Priority:
 * 1. Live domain → external link
 * 2. Slug → typed public detail page (/business/:slug, /creator/:slug, etc.)
 * 3. Fallback → discover filtered by entity type
 */
export function getEntityRoute(entity: SearchEntityResult): string {
  // If the entity has a live domain, link to it (include slug for container domains)
  if (entity.domain_host) {
    if (entity.slug) {
      return `https://${entity.domain_host}/${entity.slug}`;
    }
    return `https://${entity.domain_host}`;
  }

  // Typed detail route using entity_type config
  if (entity.slug) {
    const config = ENTITY_TYPE_CONFIG[entity.entity_type];
    if (config?.detailRoute) {
      return `${config.detailRoute}/${entity.slug}`;
    }
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
 * blue = individual/creator, orange = business, green = organization/community
 */
export function getVerifiedBadgeColor(
  entity: Pick<SearchEntityResult, "is_verified" | "entity_type">,
): "blue" | "orange" | "green" | null {
  if (!entity.is_verified) return null;
  switch (entity.entity_type) {
    case "business":
      return "orange";
    case "organization":
    case "community":
      return "green";
    default:
      return "blue";
  }
}
