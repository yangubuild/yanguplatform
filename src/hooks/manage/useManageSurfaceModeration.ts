import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModeratedSurface {
  id: string;
  slug: string;
  state: string;
  published_at: string | null;
  unpublished_at: string | null;
  surface_title: string;
  surface_slug: string;
  surface_type: string;
  cover_image_url: string | null;
  user_id: string;
  org_id: string | null;
  domain_host: string;
  username: string | null;
  display_name: string | null;
  mod_status: string;
  has_cover_image: boolean;
}

export function useManageSurfaceModeration(filter: string | null = null, search: string | null = null) {
  return useQuery({
    queryKey: ["manage", "surface-moderation", filter, search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_surfaces_moderation", {
        p_filter: filter,
        p_search: search,
      });
      if (error) throw error;
      return (data as unknown as ModeratedSurface[]) ?? [];
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function useSurfaceAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { publishId: string; action: "unpublish" | "republish" }) => {
      const { error } = await supabase.rpc("manage_surface_action", {
        p_publish_id: params.publishId,
        p_action: params.action,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "surface-moderation"] });
      qc.invalidateQueries({ queryKey: ["manage", "command-center"] });
    },
  });
}
