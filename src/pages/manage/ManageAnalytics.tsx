import { useState } from "react";
import { BarChart3, Users, Layers, Globe, Shield, Activity, Package, TrendingUp } from "lucide-react";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { useManageAnalytics } from "@/hooks/manage/useManageAnalytics";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
] as const;

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <AdminGlassCard className="p-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
        <Icon className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[hsl(var(--admin-text-muted))] truncate">{label}</p>
        <p className="text-lg font-semibold text-[hsl(var(--admin-text))] font-display">{value}</p>
        {sub && <p className="text-xs text-[hsl(var(--admin-text-muted))]">{sub}</p>}
      </div>
    </AdminGlassCard>
  );
}

function MiniChart({ data, label, color = "hsl(var(--admin-accent))" }: { data: { day: string; count: number }[]; label: string; color?: string }) {
  if (!data.length) {
    return (
      <AdminGlassCard className="p-4">
        <p className="text-sm font-medium text-[hsl(var(--admin-text))] mb-2">{label}</p>
        <p className="text-xs text-[hsl(var(--admin-text-muted))]">No data in selected period</p>
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
                color: "hsl(var(--admin-text))",
              }}
            />
            <Area type="monotone" dataKey="count" stroke={color} fill={`url(#grad-${label})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AdminGlassCard>
  );
}

export default function ManageAnalytics() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useManageAnalytics(days);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--admin-surface-elevated)/0.6)]">
            <BarChart3 className="h-5 w-5 text-[hsl(var(--admin-accent))]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[hsl(var(--admin-text))] font-display">Platform Analytics</h1>
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">Live platform metrics from real data sources</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.4)] p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === opt.value
                  ? "bg-[hsl(var(--admin-accent))] text-[hsl(var(--admin-bg))]"
                  : "text-[hsl(var(--admin-text-muted))] hover:text-[hsl(var(--admin-text))]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <AdminGlassCard className="p-8 text-center">
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Loading analytics…</p>
        </AdminGlassCard>
      )}

      {error && (
        <AdminGlassCard className="p-6 border-red-500/30">
          <p className="text-sm text-red-400">Failed to load analytics: {(error as Error).message}</p>
        </AdminGlassCard>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon={Users} label="Total Users" value={data.totals.total_users} sub={`+${data.totals.users_7d} this week`} />
            <StatCard icon={Layers} label="Surfaces" value={data.totals.total_surfaces} />
            <StatCard icon={Globe} label="Active Domains" value={data.totals.active_domains} />
            <StatCard icon={Shield} label="Open Alerts" value={data.totals.open_alerts} />
            <StatCard icon={Package} label="App Installs" value={data.totals.active_app_installs} />
          </div>

          {/* Subscription + Events row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={TrendingUp} label="Active Subscriptions" value={data.totals.active_subscriptions} />
            <StatCard icon={Activity} label="Builder Events (7d)" value={data.totals.builder_events_7d} />
            <StatCard icon={Users} label="New Users (30d)" value={data.totals.users_30d} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MiniChart data={data.user_growth} label="User Registrations" color="hsl(var(--admin-accent))" />
            <MiniChart data={data.surface_growth} label="Surface Creation" color="hsl(150 60% 50%)" />
            <MiniChart data={data.domain_growth} label="Domain Registrations" color="hsl(200 70% 55%)" />
            <MiniChart data={data.builder_events} label="Builder Events" color="hsl(280 60% 60%)" />
            <MiniChart data={data.audit_activity} label="Audit Activity" color="hsl(40 80% 55%)" />
          </div>

          {/* Data source note */}
          <div className="text-xs text-[hsl(var(--admin-text-muted))] px-1">
            <span className="font-medium">Live sources:</span> auth.users · surfaces · domains · audit_logs · builder_events · billing_subscriptions · app_user_installs · platform_alerts
          </div>
        </>
      )}
    </div>
  );
}
