import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HubBooking {
  id: string;
  booked_by: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  booker_name: string | null;
}

export function useHubBookings(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency", "hub-bookings", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_hub_bookings", { p_agency_id: agencyId! });
      if (error) throw error;
      return (data as unknown as HubBooking[]) ?? [];
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}

export function useCreateHubBooking(agencyId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { date: string; start: string; end: string; notes?: string }) => {
      const { data, error } = await supabase.rpc("create_hub_booking", {
        p_agency_id: agencyId!,
        p_date: args.date,
        p_start: args.start,
        p_end: args.end,
        ...(args.notes ? { p_notes: args.notes } : {}),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency", "hub-bookings", agencyId] });
    },
  });
}
