import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AlertRecord {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  detail: string | null;
  source_entity_id: string | null;
  source_table: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

interface UseAlertsListParams {
  severity?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
}

export function useAlertsList({ severity, status, limit = 50, offset = 0 }: UseAlertsListParams = {}) {
  return useQuery({
    queryKey: ["manage", "alerts-list", severity, status, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_alerts_list", {
        p_severity: severity ?? null,
        p_status: status ?? null,
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;
      return (data as unknown as AlertRecord[]) ?? [];
    },
    staleTime: 15_000,
    retry: 1,
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ alertId, resolve }: { alertId: string; resolve: boolean }) => {
      const { error } = await supabase.rpc("manage_resolve_alert", {
        p_alert_id: alertId,
        p_resolve: resolve,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "alerts-list"] });
      qc.invalidateQueries({ queryKey: ["manage", "platform-alerts"] });
    },
  });
}
