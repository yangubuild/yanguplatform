import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useResetTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (surfaceId: string) => {
      const { error } = await supabase.rpc("manage_reset_theme", { p_surface_id: surfaceId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "branding"] });
      toast.success("Theme reset to default");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
