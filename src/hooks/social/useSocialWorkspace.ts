import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import type { SocialWorkspace, CreateWorkspaceInput } from "@/types/socialMedia";

export function useSocialWorkspace() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: socialKeys.workspace(),
    enabled: !!user,
    queryFn: async (): Promise<SocialWorkspace | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("social_workspaces")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        business_website: data.website_url,
        business_description: data.business_description,
        posting_goals: data.goals || [],
        posting_frequency: data.post_frequency,
        status: "active",
        onboarding_completed: false,
        metadata: data.metadata as Record<string, unknown> | null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("social_workspaces")
        .insert({
          user_id: user.id,
          name: input.name || "My Workspace",
          website_url: input.business_website,
          business_description: input.business_description,
          goals: input.posting_goals,
          post_frequency: input.posting_frequency,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialKeys.workspace() });
    },
  });

  return {
    workspace: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createWorkspace: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
