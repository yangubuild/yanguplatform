import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase.rpc("manage_delete_page", { p_page_id: pageId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "pages"] });
      toast.success("Page deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
