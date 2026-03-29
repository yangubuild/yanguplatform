import { useState } from "react";
import { format, subDays } from "date-fns";
import { useConnectedAccounts } from "@/hooks/social/useConnectedAccounts";
import { useSocialAnalytics } from "@/hooks/social/useSocialAnalytics";
import { AnalyticsFilters } from "@/components/social-media/analytics/AnalyticsFilters";
import { AnalyticsByPageTab } from "@/components/social-media/analytics/AnalyticsByPageTab";
import { AnalyticsByPostTab } from "@/components/social-media/analytics/AnalyticsByPostTab";
import type { AnalyticsDateRange } from "@/types/socialMedia";

const defaultRange = (): AnalyticsDateRange => ({
  start_date: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  end_date: format(new Date(), "yyyy-MM-dd"),
});

export default function SocialMediaAnalytics() {
  const [tab, setTab] = useState<"page" | "post">("page");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>(defaultRange);

  const { accounts, activeAccounts } = useConnectedAccounts();
  const { summary, isReady, isLoading } = useSocialAnalytics(dateRange, selectedAccountId ?? undefined);

  // Fetch snapshots for chart (reuse analytics service)
  const { useQuery } = require("@tanstack/react-query");
  const { useAuth } = require("@/hooks/useAuth");
  const { analyticsService } = require("@/services/socialMedia");

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-lg font-semibold text-foreground mb-1">Analytics</h1>
      <p className="text-sm text-muted-foreground mb-6">
        View your social media performance
      </p>

      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6">
        <button
          onClick={() => setTab("page")}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            tab === "page"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          By Page
        </button>
        <button
          onClick={() => setTab("post")}
          className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
            tab === "post"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          By Post
        </button>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        accounts={activeAccounts}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Tab content */}
      {tab === "page" ? (
        <AnalyticsByPageTab
          summary={summary}
          snapshots={[]}
          hasAccounts={activeAccounts.length > 0}
          isLoading={isLoading}
          isReady={isReady}
        />
      ) : (
        <AnalyticsByPostTab
          hasAccounts={activeAccounts.length > 0}
          dateRange={dateRange}
          selectedAccountId={selectedAccountId}
        />
      )}
    </div>
  );
}
