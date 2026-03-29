import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";
import { TrendingUp, TrendingDown, Users, Eye, MousePointerClick, Heart } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { AnalyticsSummary, SocialAnalyticsSnapshot } from "@/types/socialMedia";

interface AnalyticsByPageTabProps {
  summary: AnalyticsSummary | undefined;
  snapshots: SocialAnalyticsSnapshot[];
  hasAccounts: boolean;
  isLoading: boolean;
  isReady: boolean;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
}) {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {trend !== undefined && (
            <span
              className={`text-[11px] font-medium flex items-center gap-0.5 ${
                trend >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

export function AnalyticsByPageTab({
  summary,
  snapshots,
  hasAccounts,
  isLoading,
  isReady,
}: AnalyticsByPageTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!hasAccounts || !isReady || !summary) {
    return <AnalyticsEmptyState hasAccounts={hasAccounts} />;
  }

  // Build chart data from snapshots
  const chartData = snapshots.map((s) => ({
    date: s.snapshot_date,
    followers: s.followers,
    impressions: s.impressions,
    engagement: s.engagement_rate,
  }));

  return (
    <div className="space-y-6 mt-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Followers"
          value={summary.total_followers}
          icon={Users}
        />
        <MetricCard
          label="Impressions"
          value={summary.total_impressions}
          icon={Eye}
        />
        <MetricCard
          label="Clicks"
          value={summary.total_clicks}
          icon={MousePointerClick}
        />
        <MetricCard
          label="Avg Engagement"
          value={`${summary.avg_engagement_rate.toFixed(2)}%`}
          icon={Heart}
        />
      </div>

      {/* Followers trend chart */}
      {chartData.length > 1 && (
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-4">
              Followers Growth
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="hsl(var(--accent))"
                  fill="url(#followersFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-account breakdown */}
      {summary.by_account.length > 0 && (
        <Card className="border border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-3">
              By Account
            </p>
            <div className="space-y-3">
              {summary.by_account.map((a) => (
                <div
                  key={a.account_id}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="text-foreground font-medium">
                      {a.display_name}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {a.provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{a.impressions.toLocaleString()} imp</span>
                    <span>{a.clicks.toLocaleString()} clicks</span>
                    <span>{a.engagement_rate.toFixed(2)}% eng</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
