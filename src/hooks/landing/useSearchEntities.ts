import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SearchEntityResult, SearchEntitiesParams } from "@/types/search";

/**
 * Generic hook that calls the canonical search_entities RPC.
 * Every landing section uses this with different filter params.
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
      return (data ?? []) as unknown as SearchEntityResult[];
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

/** Verified entities */
export function useVerifiedEntities(limit = 12) {
  return useSearchEntities(
    { verified_only: true, limit },
    true,
    "verified",
  );
}

/** Business entities ranked by visibility tier */
export function usePopularBusinesses(limit = 16) {
  return useSearchEntities(
    { entity_type: "business", limit },
    true,
    "popular-businesses",
  );
}

/** Product discovery — bridges through business/shop surfaces until item-level indexing exists */
export function useProductEntities(limit = 8) {
  return useSearchEntities(
    { entity_type: "business", category: "shop", limit },
    true,
    "products-bridge",
  );
}

/** Service entities */
export function useServiceEntities(limit = 8) {
  return useSearchEntities(
    { entity_type: "service", limit },
    true,
    "services",
  );
}

/** Community entities */
export function useCommunityEntities(limit = 8) {
  return useSearchEntities(
    { entity_type: "community", limit },
    true,
    "communities",
  );
}

/** Creator entities (includes influencers, coaches, etc.) */
export function useCreatorEntities(limit = 8) {
  return useSearchEntities(
    { entity_type: "creator", limit },
    true,
    "creators",
  );
}
