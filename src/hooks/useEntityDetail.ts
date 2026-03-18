import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { personalizeResults } from "@/lib/personalizeExplore";
import { enforceRelatedPaidCap } from "@/lib/monetizationRules";

export interface EntityDetail {
  id: string;
  entity_type: string;
  entity_subtype: string;
  title: string;
  short_description: string | null;
  primary_category: string | null;
  tags: string[];
  visibility_tier: string;
  is_verified: boolean;
  domain_host: string | null;
  slug: string;
  industry: string | null;
  surface_type: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  owner_user_id: string | null;
  review_count: number;
  avg_rating: number | null;
  trust_score: number | null;
}

export interface EntityReview {
  id: string;
  entity_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
}

export interface EntityFaq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface RelatedEntity {
  id: string;
  entity_type: string;
  entity_subtype: string;
  title: string;
  short_description: string | null;
  primary_category: string | null;
  tags: string[];
  visibility_tier: string;
  is_verified: boolean;
  domain_host: string | null;
  slug: string;
  industry: string | null;
  surface_type: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  trust_score: number | null;
  relatedness_score: number | null;
}

export function useEntityDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ["entity_detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_entity_by_slug" as any, {
        p_slug: slug!,
      });
      if (error) throw error;
      const rows = data as unknown as EntityDetail[];
      return rows?.[0] ?? null;
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}

export function useEntityReviews(entityId: string | undefined) {
  return useQuery({
    queryKey: ["entity_reviews", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_reviews")
        .select("id, entity_id, user_id, rating, title, body, created_at")
        .eq("entity_id", entityId!)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as EntityReview[];
    },
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useEntityFaqs(entityId: string | undefined) {
  return useQuery({
    queryKey: ["entity_faqs", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_faqs")
        .select("id, question, answer, sort_order")
        .eq("entity_id", entityId!)
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as EntityFaq[];
    },
    enabled: !!entityId,
    staleTime: 60_000,
  });
}

/**
 * Intelligent related entities with session-aware personalization.
 * Pipeline: server relatedness ranking → personalization nudge.
 */
export function useRelatedEntities(entityId: string | undefined) {
  return useQuery({
    queryKey: ["related_entities_v2", entityId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_related_entities" as any, {
        p_entity_id: entityId!,
        p_limit: 9,
      });
      if (error) throw error;
      const results = (data ?? []) as RelatedEntity[];
      // Pipeline: personalize → enforce paid cap (Phase 8)
      return enforceRelatedPaidCap(personalizeResults(results));
    },
    enabled: !!entityId,
    staleTime: 60_000,
  });
}
