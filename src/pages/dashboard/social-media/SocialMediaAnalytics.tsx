import { useState } from "react";
import { format } from "date-fns";
import {
  useOperationalAnalytics,
  type DatePreset,
} from "@/hooks/social/useOperationalAnalytics";
import { useConnectedAccounts } from "@/hooks/social/useConnectedAccounts";
import { useSocialAnalytics } from "@/hooks/social/useSocialAnalytics";
import { AnalyticsFilters } from "@/components/social-media/analytics/AnalyticsFilters";
import { OperationalSummaryCards } from "@/components/social-media/analytics/OperationalSummaryCards";
import { PublishingTrendChart } from "@/components/social-media/analytics/PublishingTrendChart";
import { PlatformBreakdownChart } from "@/components/social-media/analytics/PlatformBreakdownChart";
import { FailureBreakdownChart } from "@/components/social-media/analytics/FailureBreakdownChart";
import { RecentPublishedTable } from "@/components/social-media/analytics/RecentPublishedTable";
import { FailedJobsTable } from "@/components/social-media/analytics/FailedJobsTable";
import { AccountHealthTable } from "@/components/social-media/analytics/AccountHealthTable";
import { AnalyticsByPageTab } from "@/components/social-media/analytics/AnalyticsByPageTab";
import { AnalyticsByPostTab } from "@/components/social-media/analytics/AnalyticsByPostTab";
import type { AnalyticsDateRange } from "@/types/socialMedia";
import { subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const defaultRange = (): AnalyticsDateRange => ({
  start_date: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  end_date: format(new Date(), "yyyy-MM-dd"),
});

type AnalyticsTab = "overview" | "page" | "post";

export default function SocialMediaAnalytics() {
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>(defaultRange);

  const { activeAccounts } = useConnectedAccounts();
  const { summary, snapshots, isReady, isLoading: engLoading } = useSocialAnalytics(dateRange, selectedAccountId ?? undefined);
  const {
    metrics,
    platformBreakdown,
    trend,
    failures,
    recentPublished,
    failedJobs,
    accountHealth,
    isLoading: opLoading,
  } = useOperationalAnalytics(preset);

  const TABS: { key: AnalyticsTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "page", label: "By Page" },
    { key: "post", label: "By Post" },
  ];

  const PRESETS: { label: string; value: DatePreset }[] = [
    { label: "Today", value: "today" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-1">
        <h1 className="text-lg font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your content output, publishing performance, and account health.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 mt-5 mb-5 border-b border-border pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative text-sm font-medium pb-2 transition-colors ${
              tab === t.key
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Date preset filter */}
          <div className="flex items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  preset === p.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {opLoading || !metrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <>
              <OperationalSummaryCards metrics={metrics} />
              {trend.length > 1 && <PublishingTrendChart data={trend} />}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {platformBreakdown.length > 0 && <PlatformBreakdownChart data={platformBreakdown} />}
                {failures.length > 0 && <FailureBreakdownChart data={failures} />}
              </div>
              {recentPublished.length > 0 && <RecentPublishedTable data={recentPublished} />}
              {failedJobs.length > 0 && <FailedJobsTable data={failedJobs} />}
              {accountHealth.length > 0 && <AccountHealthTable data={accountHealth} />}
            </>
          )}
        </div>
      )}

      {/* By Page Tab */}
      {tab === "page" && (
        <>
          <AnalyticsFilters
            accounts={activeAccounts}
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <AnalyticsByPageTab
            summary={summary}
            snapshots={snapshots}
            hasAccounts={activeAccounts.length > 0}
            isLoading={engLoading}
            isReady={isReady}
          />
        </>
      )}

      {/* By Post Tab */}
      {tab === "post" && (
        <>
          <AnalyticsFilters
            accounts={activeAccounts}
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <AnalyticsByPostTab
            hasAccounts={activeAccounts.length > 0}
            dateRange={dateRange}
            selectedAccountId={selectedAccountId}
          />
        </>
      )}
    </div>
  );
}
