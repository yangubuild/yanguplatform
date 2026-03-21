import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useActiveOrg } from "./useActiveOrg";

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export interface PublishResult {
  success: boolean;
  publish_id?: string;
  state?: "published" | "blocked";
  reasons?: string[];
  error?: string;
  slug?: string;
  domain?: string;
}

export interface OrgDomain {
  id: string;
  host: string;
  domain_type: string;
  is_active: boolean;
  owner_org_id: string | null;
}

// Domain types that support surface publishing
// LOCKED: studio and io do NOT support surface publishing
const PUBLISHABLE_DOMAIN_TYPES = ["shop", "store", "site", "community", "live"];

/**
 * Hook to fetch domains owned by an organization
 * Filters out studio/io domains - these do NOT support surface publishing
 */
export function useOrgDomains(orgId: string | null) {
  return useQuery({
    queryKey: ["org-domains", orgId],
    queryFn: async (): Promise<OrgDomain[]> => {
      // Safety check - should never happen due to enabled flag
      if (!orgId) {
        console.warn("[useOrgDomains] Called without orgId - returning empty");
        return [];
      }

      if (import.meta.env.DEV) console.log("[useOrgDomains] Fetching domains for org:", orgId);
      
      const { data, error } = await supabase
        .from("domains")
        .select("id, host, domain_type, is_active, owner_org_id")
        .eq("owner_org_id", orgId)
        .eq("is_active", true)
        .order("host");

      if (error) {
        console.error("[useOrgDomains] Error fetching org domains:", error.message, error.details, error.hint);
        throw error;
      }

      // Filter out studio/io domains - they don't support surface publishing
      // Studio uses album_slug + album_published for sharing (free)
      const publishableDomains = (data || []).filter(
        (domain) => PUBLISHABLE_DOMAIN_TYPES.includes(domain.domain_type)
      );

      return publishableDomains;
    },
    // CRITICAL: Only run when we have a valid orgId
    enabled: !!orgId && orgId.length > 0,
    // Don't retry on error to avoid spamming the server
    retry: false,
  });
}

/**
 * Hook to check publish eligibility for a surface on a specific domain
 */
/**
 * Hook to check publish eligibility for a surface on a specific domain
 * Relies ONLY on the Supabase RPC - no client-side blocking logic
 */
export function usePublishEligibility() {
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEligibility = useCallback(async (
    orgId: string,
    domainId: string,
    slug: string,
    surfaceId: string | null
  ): Promise<EligibilityResult> => {
    setIsChecking(true);
    setError(null);

    try {
      // Call RPC with exact signature: (p_org_id, p_domain_id, p_slug, p_surface_id)
      // Using type assertion as types may not be regenerated yet
      const { data, error: rpcError } = await (supabase.rpc as Function)(
        "evaluate_publish_eligibility",
        {
          p_org_id: orgId,
          p_domain_id: domainId,
          p_slug: slug,
          p_surface_id: surfaceId,
        }
      );

      if (rpcError) {
        console.error("Eligibility check error:", rpcError);
        throw new Error(rpcError.message);
      }

      // RPC returns: { eligible: boolean, reasons: string[] }[]
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      const result: EligibilityResult = row
        ? { eligible: Boolean(row.eligible), reasons: row.reasons || [] }
        : { eligible: false, reasons: ["Unable to check eligibility"] };

      setEligibility(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eligibility check failed";
      setError(message);
      const failResult = { eligible: false, reasons: [message] };
      setEligibility(failResult);
      return failResult;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setEligibility(null);
    setError(null);
  }, []);

  return {
    eligibility,
    isChecking,
    error,
    checkEligibility,
    reset,
  };
}

/**
 * Hook to request publishing a surface on a domain
 */
export function usePublishSurface() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      surfaceId,
      domainId,
      slug,
    }: {
      surfaceId: string;
      domainId: string;
      slug?: string;
    }): Promise<PublishResult> => {
      const { data, error } = await supabase.rpc("request_publish_surface", {
        p_surface_id: surfaceId,
        p_domain_id: domainId,
        p_slug: slug || null,
      });

      if (error) {
        console.error("Publish RPC error:", error);
        throw new Error(error.message);
      }

      // Parse the JSONB response - data comes back as unknown from RPC
      const result = data as unknown as PublishResult;
      
      if (!result.success) {
        // Don't throw - return the blocked result for UI to handle
        return result;
      }

      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate surfaces query to refresh status
        queryClient.invalidateQueries({ queryKey: ["surfaces"] });
      }
    },
  });
}

/**
 * Combined hook for the complete publish flow
 * Uses the user's active organization automatically - does NOT accept orgId from props
 */
/**
 * Combined hook for the complete publish flow
 * Uses the user's active organization automatically - does NOT accept orgId from props
 * Relies ONLY on the Supabase RPC for eligibility - no client-side blocking
 */
export function usePublishFlow(surfaceId: string, surfaceTitle?: string, draftSlug?: string | null) {
  const { data: activeOrg, isLoading: activeOrgLoading } = useActiveOrg();
  
  // Use active org ID - never accept from client
  const orgId = activeOrg?.id || null;
  
  const { data: domains, isLoading: domainsLoading } = useOrgDomains(orgId);
  const eligibilityHook = usePublishEligibility();
  const publishMutation = usePublishSurface();

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [customSlug, setCustomSlug] = useState<string | null>(null);

  // Generate a default slug: prefer draftSlug, then slugified title
  const defaultSlug = draftSlug
    ? draftSlug
    : surfaceTitle
      ? surfaceTitle
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      : null;

  // Check eligibility when domain or slug changes
  // RPC signature: (orgId, domainId, slug, surfaceId ?? null)
  const checkEligibilityForCurrentState = useCallback(async (domainId: string, slug: string) => {
    if (orgId) {
      await eligibilityHook.checkEligibility(orgId, domainId, slug, surfaceId ?? null);
    }
  }, [orgId, surfaceId, eligibilityHook]);

  // Select domain and trigger eligibility check
  const selectDomain = useCallback(async (domainId: string) => {
    setSelectedDomainId(domainId);
    const slugToCheck = customSlug || defaultSlug || "";
    await checkEligibilityForCurrentState(domainId, slugToCheck);
  }, [customSlug, defaultSlug, checkEligibilityForCurrentState]);

  // Update slug and re-check eligibility
  const updateSlug = useCallback(async (slug: string | null) => {
    setCustomSlug(slug);
    if (selectedDomainId) {
      const slugToCheck = slug || defaultSlug || "";
      await checkEligibilityForCurrentState(selectedDomainId, slugToCheck);
    }
  }, [selectedDomainId, defaultSlug, checkEligibilityForCurrentState]);

  // Publish to selected domain with optional custom slug
  const publish = useCallback(async (slug?: string) => {
    if (!selectedDomainId) {
      throw new Error("No domain selected");
    }

    const finalSlug = slug || customSlug || undefined;

    return publishMutation.mutateAsync({
      surfaceId,
      domainId: selectedDomainId,
      slug: finalSlug,
    });
  }, [selectedDomainId, surfaceId, customSlug, publishMutation]);

  const reset = useCallback(() => {
    setSelectedDomainId(null);
    setCustomSlug(null);
    eligibilityHook.reset();
  }, [eligibilityHook]);

  return {
    // Active org
    activeOrg,
    activeOrgLoading,
    
    // Domains
    domains: domains || [],
    domainsLoading: domainsLoading || activeOrgLoading,
    selectedDomainId,
    selectDomain,
    
    // Slug - use updateSlug to set and re-check eligibility
    customSlug,
    setCustomSlug: updateSlug,
    defaultSlug,
    
    // Eligibility - ONLY from RPC, no client-side blocking
    eligibility: eligibilityHook.eligibility,
    isCheckingEligibility: eligibilityHook.isChecking,
    eligibilityError: eligibilityHook.error,
    
    // Publishing
    publish,
    isPublishing: publishMutation.isPending,
    publishResult: publishMutation.data,
    publishError: publishMutation.error,
    
    // Utilities
    reset,
    // canPublish relies ONLY on RPC result - no client-side checks
    canPublish: eligibilityHook.eligibility?.eligible ?? false,
  };
}
