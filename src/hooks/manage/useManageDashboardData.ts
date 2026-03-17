import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LifecycleStats {
  registered: number;
  verified_pending_onboarding: number;
  onboarding_in_progress: number;
  active: number;
  suspended: number;
  total: number;
}

interface OverviewStats {
  total_users: number;
  total_surfaces: number;
  total_orgs: number;
  total_domains: number;
  published_surfaces: number;
  draft_surfaces: number;
}

interface AlertData {
  manual_alerts: Array<{
    id: string;
    alert_type: string;
    severity: string;
    title: string;
    detail: string | null;
    source_entity_id: string | null;
    source_table: string | null;
    created_at: string;
  }>;
  auto_detected: {
    email_dlq_24h: number;
    failed_publishes: number;
    failed_webhooks_24h: number;
    stuck_jobs: number;
  };
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ["manage", "overview-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_overview_stats");
      if (error) throw error;
      return data as unknown as OverviewStats;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function useLifecycleStats() {
  return useQuery({
    queryKey: ["manage", "lifecycle-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_user_lifecycle_stats");
      if (error) throw error;
      return data as unknown as LifecycleStats;
    },
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePlatformAlerts() {
  return useQuery({
    queryKey: ["manage", "platform-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_platform_alerts");
      if (error) throw error;
      return data as unknown as AlertData;
    },
    staleTime: 15_000,
    refetchInterval: 30_000, // auto-refresh every 30s
    retry: 1,
  });
}

export function useRecentAuditLogs(limit = 10) {
  return useQuery({
    queryKey: ["manage", "recent-audit-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("manage_recent_audit_logs", {
        p_limit: limit,
      });
      if (error) throw error;
      return (data as unknown as Array<{
        id: string;
        action: string;
        entity_type: string;
        entity_id: string | null;
        created_at: string;
        user_id: string | null;
      }>) ?? [];
    },
    staleTime: 30_000,
    retry: 1,
  });
}

/** Total active critical issues count for the header badge */
export function useCriticalAlertCount() {
  const { data } = usePlatformAlerts();
  if (!data) return 0;

  const manualCritical = data.manual_alerts.filter(
    (a) => a.severity === "critical"
  ).length;
  const autoCritical =
    (data.auto_detected.email_dlq_24h > 0 ? 1 : 0) +
    (data.auto_detected.failed_publishes > 0 ? 1 : 0);

  return manualCritical + autoCritical;
}
