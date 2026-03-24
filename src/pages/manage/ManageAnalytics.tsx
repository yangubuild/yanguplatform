import { useState } from "react";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Users, DollarSign, TrendingUp, Shield,
  CreditCard, Layers, Download,
} from "lucide-react";
import { useManageAnalyticsInvestor, type InvestorAnalytics } from "@/hooks/manage/useManageAnalyticsInvestor";
import { useManageAnalytics } from "@/hooks/manage/useManageAnalytics";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const PERIOD_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

function MiniChart({ data, label, color = "hsl(var(--admin-accent))", dataKey = "count" }: { data: any[] | null; label: string; color?: string; dataKey?: string }) {
  if (!data?.length) {
    return (
      <AdminGlassCard className="p-4">
        <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-2">{label}</p>
        <p className="text-xs text-[hsl(var(--admin-text-muted))]">No data</p>
      </AdminGlassCard>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
  }));

  return (
    <AdminGlassCard className="p-4">
      <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-3">{label}</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-border))" strokeOpacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--admin-text-muted))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--admin-text-muted))" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--admin-surface))",
                border: "1px solid hsl(var(--admin-border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--admin-text))"
              }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${label})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AdminGlassCard>
  );
}

function exportSnapshot(data: InvestorAnalytics, days: number) {
  const snapshot = {
    exported_at: new Date().toISOString(),
    period_days: days,
    metrics: {
      revenue_total: `$${(data.revenue_total_cents / 100).toFixed(2)}`,
      revenue_period: `$${(data.revenue_period_cents / 100).toFixed(2)}`,
      total_users: data.total_users,
      active_users_period: data.active_users_period,
      new_users_period: data.new_users_period,
      kyc_conversion_rate: `${data.kyc_conversion_rate}%`,
      subscription_conversion_rate: `${data.subscription_conversion_rate}%`,
      subscriptions_active: data.subscriptions_active,
      surfaces_published: data.surfaces_published,
    },
    daily_revenue: data.daily_revenue,
    daily_signups: data.daily_signups,
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `yangu-analytics-${days}d-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ManageAnalytics() {
  const [days, setDays] = useState(30);
  const { data: investor, isLoading: investorLoading } = useManageAnalyticsInvestor(days);
  const { data: original, isLoading: originalLoading } = useManageAnalytics(days);

  const isLoading = investorLoading || originalLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AdminPageHeader title="Platform Analytics" description="Investor-ready metrics and growth data" />
        <div className="flex items-center gap-3">
          {investor && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => exportSnapshot(investor, days)}>
              <Download className="h-3.5 w-3.5" /> Export Snapshot
            </Button>
          )}
          <div className="flex gap-1 rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.4)] p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  days === opt.value
                    ? "bg-[hsl(var(--admin-accent))] text-[hsl(var(--admin-bg))]"
                    : "text-[hsl(var(--admin-text-muted))] hover:text-[hsl(var(--admin-text))]"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      )}

      {investor && (
        <>
          {/* Revenue + Growth KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AdminMetricCard icon={<DollarSign className="h-4 w-4" />} label="Total Revenue" value={`$${(investor.revenue_total_cents / 100).toFixed(2)}`} />
            <AdminMetricCard icon={<TrendingUp className="h-4 w-4" />} label={`Revenue (${days}d)`} value={`$${(investor.revenue_period_cents / 100).toFixed(2)}`} />
            <AdminMetricCard icon={<Users className="h-4 w-4" />} label="Total Users" value={investor.total_users} trend={<span className="text-xs text-muted-foreground">+{investor.new_users_period} new</span>} />
            <AdminMetricCard icon={<Users className="h-4 w-4" />} label={`Active (${days}d)`} value={investor.active_users_period} />
          </div>

          {/* Conversion KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AdminMetricCard icon={<Shield className="h-4 w-4" />} label="KYC Conversion" value={`${investor.kyc_conversion_rate}%`} trend={<span className="text-xs text-muted-foreground">{investor.kyc_approved}/{investor.kyc_total}</span>} />
            <AdminMetricCard icon={<CreditCard className="h-4 w-4" />} label="Sub Conversion" value={`${investor.subscription_conversion_rate}%`} trend={<span className="text-xs text-muted-foreground">{investor.subscriptions_active} active</span>} />
            <AdminMetricCard icon={<Layers className="h-4 w-4" />} label="Surfaces Published" value={investor.surfaces_published} trend={<span className="text-xs text-muted-foreground">{investor.surfaces_total} total</span>} />
            <AdminMetricCard icon={<CreditCard className="h-4 w-4" />} label="Total Subs" value={investor.subscriptions_total} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MiniChart data={investor.daily_revenue} label="Daily Revenue (cents)" color="hsl(150 60% 50%)" dataKey="cents" />
            <MiniChart data={investor.daily_signups} label="Daily Signups" color="hsl(var(--admin-accent))" dataKey="count" />
            {original?.user_growth && <MiniChart data={original.user_growth} label="User Registrations" color="hsl(200 70% 55%)" />}
            {original?.surface_growth && <MiniChart data={original.surface_growth} label="Surface Creation" color="hsl(280 60% 60%)" />}
          </div>
        </>
      )}
    </div>
  );
}
