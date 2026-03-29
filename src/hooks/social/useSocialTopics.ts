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

      if (workspaceId) {
        q = q.eq("workspace_id", workspaceId);
      }

      const { data, error } = await q;
      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        workspace_id: row.workspace_id || "",
        title: row.name,
        description: row.description,
        color: row.color,
        sort_order: row.sort_order || 0,
        enabled: true,
        source_type: "manual" as const,
        created_at: row.created_at,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; description?: string; color?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("social_topics")
        .insert({
          user_id: user.id,
          workspace_id: workspaceId || null,
          name: input.title,
          description: input.description || null,
          color: input.color || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.topics() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("social_topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.topics() });
    },
  });

  return {
    topics: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createTopic: createMutation.mutateAsync,
    deleteTopic: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
