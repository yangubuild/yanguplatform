import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgencySupportTicket {
  id: string;
  subject: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  messages: { id: string; content: string; sender_type: string; created_at: string }[];
}

export function useAgencySupportTickets(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency", "support-tickets", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_agency_support_tickets", { p_agency_id: agencyId! });
      if (error) throw error;
      return (data as unknown as AgencySupportTicket[]) ?? [];
    },
    enabled: !!agencyId,
    staleTime: 30_000,
  });
}
