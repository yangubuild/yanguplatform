import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCancelHubBooking(agencyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase.rpc("cancel_hub_booking", { p_booking_id: bookingId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency", "hub-bookings", agencyId] });
      toast.success("Booking cancelled");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}

export function useModifyHubBooking(agencyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { bookingId: string; date: string; start: string; end: string; notes?: string }) => {
      const { error } = await supabase.rpc("modify_hub_booking", {
        p_booking_id: args.bookingId,
        p_date: args.date,
        p_start: args.start,
        p_end: args.end,
        ...(args.notes ? { p_notes: args.notes } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency", "hub-bookings", agencyId] });
      toast.success("Booking updated");
    },
    onError: (e) => toast.error("Failed: " + e.message),
  });
}
