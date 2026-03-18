import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SearchEntityResult, SearchEntitiesParams } from "@/types/search";
import { diversifyResults } from "@/lib/discoveryDiversity";
import { personalizeResults } from "@/lib/personalizeExplore";
import { preWarmTuningCache } from "@/lib/adaptiveTuning";

// Pre-warm adaptive tuning cache on module load (non-blocking)
preWarmTuningCache();

/**
 * Generic hook that calls the canonical search_entities RPC.
 * Pipeline: server ranking → personalization nudge → diversity interleaving.
 */
export function useSearchEntities(
  params: SearchEntitiesParams,
  enabled = true,
  queryKeySuffix?: string,
) {
  return useQuery({
    queryKey: ["search_entities", queryKeySuffix ?? JSON.stringify(params)],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_entities" as any, {
        p_query: params.query ?? undefined,
        p_entity_type: params.entity_type ?? undefined,
        p_entity_subtype: params.entity_subtype ?? undefined,
        p_category: params.category ?? undefined,
        p_visibility_tier: params.visibility_tier ?? undefined,
        p_verified_only: params.verified_only ?? undefined,
        p_limit: params.limit ?? 20,
        p_offset: params.offset ?? 0,
      });
      if (error) throw error;
      const results = (data ?? []) as unknown as SearchEntityResult[];
      return diversifyResults(personalizeResults(results));
    },
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Paid/premium entities for trends bar */
export function useTrendEntities(limit = 20) {
  return useSearchEntities(
    { visibility_tier: "paid", limit },
    true,
    "trends-paid",
  );
}

/** Verified entities — fetch pool for 4-slot rotation */
export function useVerifiedEntities(limit = 16) {
  return useSearchEntities(
    { verified_only: true, limit },
    true,
    "verified",
  );
}

/** Business entities for popular grid — fetch pool for 16-slot grid */
export function usePopularBusinesses(limit = 32) {
  return useSearchEntities(
    { entity_type: "business", limit },
    true,
    "popular-businesses",
  );
}

/** Product entities — fetch pool for 4-slot rotation */
export function useProductEntities(limit = 16) {
  return useSearchEntities(
    { entity_type: "business", category: "shop", limit },
    true,
    "products-bridge",
  );
}

/** Service entities — fetch pool for 4-slot rotation */
export function useServiceEntities(limit = 16) {
  return useSearchEntities(
    { entity_type: "service", limit },
    true,
    "services",
  );
}

/** Community entities — fetch pool for 4-slot rotation */
export function useCommunityEntities(limit = 16) {
  return useSearchEntities(
    { entity_type: "community", limit },
    true,
    "communities",
  );
}

/** Creator entities */
export function useCreatorEntities(limit = 16) {
  return useSearchEntities(
    { entity_type: "creator", limit },
    true,
    "creators",
  );
}
