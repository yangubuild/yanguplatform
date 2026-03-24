import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MediaAsset {
  id: string;
  section_key: string;
  slot_key: string;
  image_url: string;
  updated_at: string;
}

export function useManageMedia(search: string | null = null) {
  return useQuery({
    queryKey: ["manage", "media", search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_media_list", {
        p_search: search || null,
      });
      if (error) throw error;
      return (data as unknown as MediaAsset[]) ?? [];
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useMediaUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; imageUrl: string }) => {
      const { error } = await supabase.rpc("manage_media_update", {
        p_id: params.id,
        p_image_url: params.imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manage", "media"] }),
  });
}

export function useMediaDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("manage_media_delete", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["manage", "media"] }),
  });
}
