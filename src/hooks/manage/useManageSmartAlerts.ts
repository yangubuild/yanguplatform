import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SmartAlert {
  id: string;
  alert_type: string;
  metric: string;
  current_value: number | null;
  threshold_value: number | null;
  severity: string;
  message: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useSmartAlerts(resolved = false) {
  return useQuery({
    queryKey: ["manage", "smart-alerts", resolved],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_smart_alerts_list", { p_resolved: resolved });
      if (error) throw error;
      return (data as unknown as SmartAlert[]) ?? [];
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useResolveSmartAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.rpc("manage_resolve_smart_alert", { p_alert_id: alertId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Alert resolved"); qc.invalidateQueries({ queryKey: ["manage", "smart-alerts"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
