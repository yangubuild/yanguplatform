import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BuilderSurfaceType } from "@/types/builder";
import { validatePagesForPublish, type PublishPage, type PublishValidationError } from "@/lib/builder/publishValidation";

// ─── Domain mapping (mirrors builder_is_domain_allowed in SQL) ───
const SURFACE_DOMAIN_MAP: Record<BuilderSurfaceType, string[]> = {
  live_bio: ["yangu.live"],
  live_selling: ["yangu.live"],
  community_group: ["yangu.community"],
  community_listing: ["yangu.community"],
  eshop: ["yangu.shop"],
  store_listing: ["yangu.store"],
  quick_site: ["yangu.site"],
  emenu: ["yangu.shop"],
  studio_showcase: ["yangu.studio"],
};

export interface ActiveDomain {
  id: string;
  host: string;
}

export interface BuilderPublishResult {
  ok: boolean;
  publish_id?: string;
  error?: string;
}

/**
 * Fetch all active domains from the domains table
 */
export function useActiveDomains() {
  return useQuery({
    queryKey: ["builder-active-domains"],
    queryFn: async (): Promise<ActiveDomain[]> => {
      const { data, error } = await supabase
        .from("domains")
        .select("id, host")
        .eq("is_active", true)
        .order("host");

      if (error) {
        console.error("[useActiveDomains] Error:", error.message);
        throw error;
      }

      return (data || []) as ActiveDomain[];
    },
  });
}

/**
 * Filter domains allowed for a given surface type
 */
export function filterDomainsForSurface(
  domains: ActiveDomain[],
  surfaceType: BuilderSurfaceType
): ActiveDomain[] {
  const allowedHosts = SURFACE_DOMAIN_MAP[surfaceType] || [];
  return domains.filter((d) => allowedHosts.includes(d.host));
}

/**
 * Hook for the builder publish flow
 */
export function useBuilderPublish(surfaceId: string, surfaceType: BuilderSurfaceType) {
  const { data: allDomains, isLoading: domainsLoading } = useActiveDomains();

  const allowedDomains = allDomains
    ? filterDomainsForSurface(allDomains, surfaceType)
    : [];

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<BuilderPublishResult | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const selectedDomain = allowedDomains.find((d) => d.id === selectedDomainId) ?? null;

  const publish = useCallback(async () => {
    if (!selectedDomainId) return;
    setIsPublishing(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      const { data, error } = await supabase.rpc("builder_publish_surface", {
        p_surface_id: surfaceId,
        p_domain_id: selectedDomainId,
        p_slug: customSlug || undefined,
      });

      if (error) {
        console.error("[useBuilderPublish] RPC error:", error);
        setPublishError(error.message);
        return;
      }

      const result = data as unknown as BuilderPublishResult;
      setPublishResult(result);

      if (!result.ok) {
        // Map known error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          surface_not_found_or_not_owner: "Surface not found or you don't own it.",
          domain_not_found_or_inactive: "The selected domain is not available.",
          domain_not_allowed_for_surface: "This domain is not allowed for this surface type.",
        };
        setPublishError(errorMessages[result.error || ""] || result.error || "Unknown error");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      setPublishError(msg);
    } finally {
      setIsPublishing(false);
    }
  }, [surfaceId, selectedDomainId, customSlug]);

  const reset = useCallback(() => {
    setSelectedDomainId(null);
    setCustomSlug("");
    setPublishResult(null);
    setPublishError(null);
  }, []);

  return {
    allDomains: allDomains || [],
    allowedDomains,
    domainsLoading,
    selectedDomainId,
    setSelectedDomainId,
    selectedDomain,
    customSlug,
    setCustomSlug,
    isPublishing,
    publishResult,
    publishError,
    publish,
    reset,
  };
}
