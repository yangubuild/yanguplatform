import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { socialKeys } from "./queryKeys";
import { analyticsService } from "@/services/socialMedia";
import type { AnalyticsDateRange } from "@/types/socialMedia";

export function useSocialAnalytics(dateRange?: AnalyticsDateRange, accountId?: string) {
  const { user } = useAuth();

  const range = dateRange || {
    start_date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  };

  const summaryQuery = useQuery({
    queryKey: socialKeys.analyticsSummary(`${range.start_date}_${range.end_date}`),
    enabled: !!user,
    queryFn: () => analyticsService.getWorkspaceSummary(user!.id, range),
  });

  const snapshotsQuery = useQuery({
    queryKey: [...socialKeys.analytics(), "snapshots", range.start_date, range.end_date, accountId],
    enabled: !!user,
    queryFn: () => analyticsService.getSnapshots(user!.id, range, accountId),
  });

  const readyQuery = useQuery({
    queryKey: socialKeys.analyticsReady(),
    enabled: !!user,
    queryFn: () => analyticsService.isAnalyticsReady(user!.id),
  });

  return {
    summary: summaryQuery.data,
    snapshots: snapshotsQuery.data ?? [],
    isReady: readyQuery.data ?? false,
    isLoading: summaryQuery.isLoading,
    error: summaryQuery.error,
  };
}
