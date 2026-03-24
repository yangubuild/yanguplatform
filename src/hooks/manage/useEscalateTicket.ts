import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useEscalateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, reason }: { ticketId: string; reason?: string }) => {
      const { error } = await supabase.rpc("escalate_agency_ticket", {
        p_ticket_id: ticketId,
        ...(reason ? { p_reason: reason } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency", "support-tickets"] });
      toast.success("Ticket escalated to platform support");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}
