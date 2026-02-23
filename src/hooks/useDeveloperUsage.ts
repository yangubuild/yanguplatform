import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UsageSummary {
  total_today: number;
  total_period: number;
  success_period: number;
  error_period: number;
  error_rate_24h: number;
  avg_latency_ms: number;
  daily_limit: number;
  monthly_limit: number;
  daily_used: number;
  monthly_used: number;
  daily_breakdown: Array<{ date: string; total: number; success: number; errors: number }>;
  top_endpoints: Array<{ endpoint: string; total: number }>;
}

/**
 * Hook to fetch developer usage summary via the developer_get_usage_summary RPC.
 * Cached for 30 seconds to prevent re-render spam.
 */
export function useDeveloperUsage(appId: string | null, days: number = 30) {
  const { user } = useAuth();

  return useQuery<UsageSummary | null>({
    queryKey: ["developer-usage-summary", appId, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("developer_get_usage_summary", {
        p_app_id: appId,
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as UsageSummary;
    },
    enabled: !!user,
    staleTime: 30_000, // 30s debounce
    refetchOnWindowFocus: false,
  });
}

interface IncrementResult {
  ok: boolean;
  code?: string;
  daily_used?: number;
  daily_limit?: number;
  monthly_used?: number;
  monthly_limit?: number;
}

/**
 * Increment developer usage after an action completes.
 * Shows a toast if quota is exceeded.
 * Returns the RPC result.
 */
export async function trackDeveloperAction(
  appId: string,
  actionName: string,
  success: boolean,
  latencyMs: number
): Promise<IncrementResult> {
  try {
    const { data, error } = await supabase.rpc("developer_check_and_increment_usage", {
      p_app_id: appId,
      p_endpoint: actionName,
      p_success: success,
      p_latency_ms: latencyMs,
    });

    if (error) {
      console.error("[usage-tracking] RPC error:", error.message);
      return { ok: true }; // Don't block on tracking errors
    }

    const result = data as unknown as IncrementResult;

    if (result && !result.ok && result.code === "QUOTA_EXCEEDED") {
      toast.error("API quota reached", {
        description: `Daily: ${result.daily_used}/${result.daily_limit} | Monthly: ${result.monthly_used}/${result.monthly_limit}`,
      });
    }

    return result ?? { ok: true };
  } catch (err) {
    console.error("[usage-tracking] unexpected error:", err);
    return { ok: true };
  }
}
