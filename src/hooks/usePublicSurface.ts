// Public Surface Resolver
// Resolves published surfaces via surface_publishes table
// NEVER queries surfaces directly for public views

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
 * Resolves the published surface for the current domain.
 * Always goes through surface_publishes - never queries surfaces directly.
 */
export function usePublicSurfaceResolver(): PublicSurfaceResult {
  const { domainId, isActive, isLoading: domainLoading } = useDomain();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-surface", domainId],
    queryFn: async () => {
      if (!domainId) return null;

      // Query surface_publishes joined with surfaces and domains
      const { data, error } = await supabase
        .from("surface_publishes")
        .select(`
          id,
          surface_id,
          published_at,
          state,
          surfaces!inner (
            id,
            title,
            surface_type,
            status
          ),
          domains!inner (
            host
          )
        `)
        .eq("domain_id", domainId)
        .eq("state", "published")
        .is("unpublished_at", null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!domainId && isActive,
    staleTime: 30_000, // Cache for 30 seconds
  });

  // Still loading domain
  if (domainLoading) {
    return { status: "loading" };
  }

  // Domain is inactive
  if (!isActive) {
    return { status: "inactive_domain" };
  }

  // Still loading surface
  if (isLoading) {
    return { status: "loading" };
  }

  // Error during fetch
  if (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to load surface",
    };
  }

  // No published surface found
  if (!data) {
    return {
      status: "not_published",
      canPublish: false, // Will be determined by auth state
    };
  }

  // Extract surface data safely
  const surface = data.surfaces as { id: string; title: string | null; surface_type: string; status: string };
  const domain = data.domains as { host: string };

  return {
    status: "published",
    surface: {
      publishId: data.id,
      surfaceId: data.surface_id,
      title: surface.title || "Untitled",
      surfaceType: surface.surface_type,
      status: surface.status,
      publishedAt: data.published_at,
      domainHost: domain.host,
    },
  };
}

/**
 * Resolves a public surface by slug within the current domain.
 * Used for routes like /@username or /store
 */
export function usePublicSurfaceBySlug(slug: string): PublicSurfaceResult {
  const { domainId, isActive, isLoading: domainLoading } = useDomain();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-surface-slug", domainId, slug],
    queryFn: async () => {
      if (!domainId || !slug) return null;

      // Query surface_publishes joined with public_surfaces
      const { data, error } = await supabase
        .from("surface_publishes")
        .select(`
          id,
          surface_id,
          published_at,
          state,
          surfaces!inner (
            id,
            title,
            surface_type,
            status
          ),
          domains!inner (
            host
          )
        `)
        .eq("domain_id", domainId)
        .eq("state", "published")
        .is("unpublished_at", null)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!domainId && !!slug && isActive,
    staleTime: 30_000,
  });

  if (domainLoading || isLoading) {
    return { status: "loading" };
  }

  if (!isActive) {
    return { status: "inactive_domain" };
  }

  if (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to load surface",
    };
  }

  if (!data) {
    return { status: "not_published", canPublish: false };
  }

  const surface = data.surfaces as { id: string; title: string | null; surface_type: string; status: string };
  const domain = data.domains as { host: string };

  return {
    status: "published",
    surface: {
      publishId: data.id,
      surfaceId: data.surface_id,
      title: surface.title || "Untitled",
      surfaceType: surface.surface_type,
      status: surface.status,
      publishedAt: data.published_at,
      domainHost: domain.host,
    },
  };
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
  const { domainId, domainType, host, isActive, isFallback } = useDomain();
  const result = usePublicSurfaceResolver();

  return {
    domainId,
    surfaceId: result.status === "published" ? result.surface.surfaceId : null,
    publishId: result.status === "published" ? result.surface.publishId : null,
    domainType,
    host,
    isActive,
    isFallback,
  };
}
