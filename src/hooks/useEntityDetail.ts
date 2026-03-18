import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useRelatedEntities(entityType: string | undefined, currentId: string | undefined) {
  return useQuery({
    queryKey: ["related_entities", entityType, currentId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_entities" as any, {
        p_entity_type: entityType as any,
        p_limit: 6,
        p_offset: 0,
      });
      if (error) throw error;
      return ((data ?? []) as any[]).filter((e: any) => e.id !== currentId);
    },
    enabled: !!entityType && !!currentId,
    staleTime: 60_000,
  });
}
