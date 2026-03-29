import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import type { SocialBrandProfile, UpdateBrandProfileInput } from "@/types/socialMedia";

export function useSocialBrandProfile(workspaceId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: socialKeys.brandProfile(),
    enabled: !!user,
    queryFn: async (): Promise<SocialBrandProfile | null> => {
      if (!user) return null;
      let q = supabase
        .from("social_brand_profiles")
        .select("*")
        .eq("user_id", user.id);

      if (workspaceId) {
        q = q.eq("workspace_id", workspaceId);
      }

      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        workspace_id: data.workspace_id || "",
        user_id: data.user_id,
        tone_of_voice: data.tone,
        brand_voice: data.brand_voice,
        caption_rules: [],
        banned_terms: [],
        preferred_ctas: [],
        hashtag_rules: null,
        emoji_policy: null,
        line_break_style: null,
        language: null,
        audience_notes: null,
        positioning: null,
        visual_style: null,
        brand_keywords: [],
        negative_keywords: [],
        target_audience: data.target_audience,
        metadata: data.metadata as Record<string, unknown> | null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: UpdateBrandProfileInput) => {
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        workspace_id: workspaceId || null,
        tone: input.tone_of_voice,
        brand_voice: input.brand_voice,
        target_audience: input.audience_notes,
        metadata: {
          caption_rules: input.caption_rules,
          banned_terms: input.banned_terms,
          preferred_ctas: input.preferred_ctas,
          hashtag_rules: input.hashtag_rules,
          emoji_policy: input.emoji_policy,
          language: input.language,
          positioning: input.positioning,
          visual_style: input.visual_style,
          brand_keywords: input.brand_keywords,
          negative_keywords: input.negative_keywords,
        },
        updated_at: new Date().toISOString(),
      };

      const existing = query.data;
      if (existing) {
        const { error } = await supabase
          .from("social_brand_profiles")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_brand_profiles")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.brandProfile() });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    isComplete: !!query.data?.tone_of_voice,
    updateProfile: upsertMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}
