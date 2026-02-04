// Public Surface Resolver
// DEPRECATED: Use PublicRouteResolver with resolve_route RPC instead
// These hooks are kept for backwards compatibility but should be migrated

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDomain } from "@/contexts/DomainContext";

// Public surface data (safe to expose)
export interface PublicSurfaceData {
  publishId: string;
  surfaceId: string;
  title: string;
  surfaceType: string;
  status: string;
  publishedAt: string | null;
  domainHost: string;
}

// Resolution result states
export type PublicSurfaceResult =
  | { status: "loading" }
  | { status: "inactive_domain" }
  | { status: "not_published"; canPublish: boolean }
  | { status: "published"; surface: PublicSurfaceData }
  | { status: "error"; message: string };

/**
 * DEPRECATED: Use PublicRouteResolver instead.
 * This hook is kept for backwards compatibility.
 */
export function usePublicSurfaceResolver(): PublicSurfaceResult {
  const { isActive, isLoading: domainLoading, host } = useDomain();

  // Since we no longer have domainId from static resolution,
  // return not_published - actual resolution happens via RPC
  if (domainLoading) {
    return { status: "loading" };
  }

  if (!isActive) {
    return { status: "inactive_domain" };
  }

  // Without domainId, we can't query surface_publishes
  // The new PublicRouteResolver handles this via RPC
  return {
    status: "not_published",
    canPublish: false,
  };
}

/**
 * DEPRECATED: Use PublicRouteResolver instead.
 * This hook is kept for backwards compatibility.
 */
export function usePublicSurfaceBySlug(slug: string): PublicSurfaceResult {
  const { isActive, isLoading: domainLoading } = useDomain();

  if (domainLoading) {
    return { status: "loading" };
  }

  if (!isActive) {
    return { status: "inactive_domain" };
  }

  // Without domainId, we can't query surface_publishes
  // The new PublicRouteResolver handles this via RPC
  return { status: "not_published", canPublish: false };
}

// Debug info (only for development)
export interface PublicSurfaceDebugInfo {
  domainId: string | null;
  surfaceId: string | null;
  publishId: string | null;
  domainType: string;
  host: string;
  isActive: boolean;
  isFallback: boolean;
}

export function usePublicSurfaceDebug(): PublicSurfaceDebugInfo {
  const { domainType, host, isActive, isFallback } = useDomain();
  const result = usePublicSurfaceResolver();

  return {
    domainId: null, // No longer available from static resolution
    surfaceId: result.status === "published" ? result.surface.surfaceId : null,
    publishId: result.status === "published" ? result.surface.publishId : null,
    domainType,
    host,
    isActive,
    isFallback,
  };
}
