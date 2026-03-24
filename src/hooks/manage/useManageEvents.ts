import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventOverview {
  event_type: string;
  event_count: number;
  last_seen: string;
}

export function useManageEvents() {
  return useQuery({
    queryKey: ["manage", "events-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_events_overview");
      if (error) throw error;
      return (data as unknown as EventOverview[]) ?? [];
    },
    staleTime: 15_000,
    retry: 1,
  });
}
