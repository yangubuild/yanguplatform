import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserFullLifecycle {
  profile: any;
  kyc: any | null;
  subscription: any | null;
  roles: string[] | null;
  surfaces_count: number;
  ai_images_count: number;
  ai_videos_count: number;
  support_tickets_count: number;
  recent_audit: Array<{ action: string; entity_type: string; created_at: string }> | null;
}

export function useUserFullLifecycle(userId: string | null) {
  return useQuery({
    queryKey: ["manage", "user-lifecycle", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_user_full_lifecycle", {
        p_user_id: userId!,
      });
      if (error) throw error;
      return data as unknown as UserFullLifecycle;
    },
    staleTime: 15_000,
  });
}

export function useUserModerationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { userId: string; action: "suspend" | "reactivate" | "reset_onboarding" }) => {
      const { error } = await supabase.rpc("manage_user_moderation_action", {
        p_user_id: params.userId,
        p_action: params.action,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage"] });
    },
  });
}
