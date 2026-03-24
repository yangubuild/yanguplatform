import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useToggleIntegrationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase.rpc("manage_toggle_integration", { p_app_id: appId, p_status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "integrations"] });
      toast.success("Integration status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, featured }: { appId: string; featured: boolean }) => {
      const { error } = await supabase.rpc("manage_toggle_featured", { p_app_id: appId, p_featured: featured });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "integrations"] });
      toast.success("Featured status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
