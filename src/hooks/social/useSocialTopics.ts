import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import type { SocialTopic } from "@/types/socialMedia";

export function useSocialTopics(workspaceId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: socialKeys.topics(),
    enabled: !!user,
    queryFn: async (): Promise<SocialTopic[]> => {
      if (!user) return [];
      let q = supabase
        .from("social_topics")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      if (workspaceId) q = q.eq("workspace_id", workspaceId);

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        workspace_id: row.workspace_id || "",
        category_id: row.category_id,
        title: row.name,
        description: row.description,
        color: row.color,
        sort_order: row.sort_order || 0,
        enabled: row.enabled ?? true,
        source_type: (row.source_type as "manual" | "ai_generated" | "imported") || "manual",
        created_at: row.created_at,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; description?: string; color?: string; category_id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("social_topics")
        .insert({
          user_id: user.id,
          workspace_id: workspaceId || null,
          name: input.title,
          description: input.description || null,
          color: input.color || null,
          category_id: input.category_id || null,
          source_type: "manual",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.topics() }),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; title?: string; description?: string; enabled?: boolean; category_id?: string }) => {
      const payload: Record<string, unknown> = {};
      if (input.title !== undefined) payload.name = input.title;
      if (input.description !== undefined) payload.description = input.description;
      if (input.enabled !== undefined) payload.enabled = input.enabled;
      if (input.category_id !== undefined) payload.category_id = input.category_id;
      const { error } = await supabase.from("social_topics").update(payload).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.topics() }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.topics() }),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (items: { title: string; description?: string; category_id?: string; source_type?: string }[]) => {
      if (!user) throw new Error("Not authenticated");
      const rows = items.map((item) => ({
        user_id: user.id,
        workspace_id: workspaceId || null,
        name: item.title,
        description: item.description || null,
        category_id: item.category_id || null,
        source_type: item.source_type || "ai_generated",
      }));
      const { error } = await supabase.from("social_topics").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: socialKeys.topics() }),
  });

  return {
    topics: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createTopic: createMutation.mutateAsync,
    updateTopic: updateMutation.mutateAsync,
    deleteTopic: deleteMutation.mutateAsync,
    bulkCreate: bulkCreateMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
