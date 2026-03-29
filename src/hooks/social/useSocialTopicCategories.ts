import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import type { SocialTopicCategory } from "@/types/socialMedia";

export function useSocialTopicCategories(workspaceId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: socialKeys.topicCategories(),
    enabled: !!user,
    queryFn: async (): Promise<SocialTopicCategory[]> => {
      if (!user) return [];
      let q = supabase
        .from("social_topic_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (workspaceId) q = q.eq("workspace_id", workspaceId);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((r) => ({
        id: r.id,
        workspace_id: r.workspace_id || "",
        title: r.title,
        color: r.color,
        sort_order: r.sort_order || 0,
        enabled: r.enabled ?? true,
        description: r.description,
        created_at: r.created_at || "",
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; color?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("social_topic_categories")
        .insert({
          user_id: user.id,
          workspace_id: workspaceId || null,
          title: input.title,
          color: input.color || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.topicCategories() }),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; title?: string; color?: string; enabled?: boolean }) => {
      const payload: Record<string, unknown> = {};
      if (input.title !== undefined) payload.title = input.title;
      if (input.color !== undefined) payload.color = input.color;
      if (input.enabled !== undefined) payload.enabled = input.enabled;
      const { error } = await supabase
        .from("social_topic_categories")
        .update(payload)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.topicCategories() }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_topic_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.topicCategories() });
      qc.invalidateQueries({ queryKey: socialKeys.topics() });
    },
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
