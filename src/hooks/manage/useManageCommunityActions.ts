import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTogglePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ promoId, active }: { promoId: string; active: boolean }) => {
      const { error } = await supabase.rpc("manage_toggle_promo", { p_promo_id: promoId, p_active: active });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "community"] });
      toast.success("Promotion updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (promoId: string) => {
      const { error } = await supabase.rpc("manage_delete_promo", { p_promo_id: promoId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "community"] });
      toast.success("Promotion deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
