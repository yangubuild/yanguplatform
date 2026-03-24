import { AdminGlassCard, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, DollarSign, Shield, Activity, AlertTriangle,
  CreditCard, Layers, Headset, Image, Flame,
  TrendingUp, CheckCircle2, Clock,
} from "lucide-react";
import { useManageCommandCenter, type CommandCenterData } from "@/hooks/manage/useManageIncidents";

function LiveBadge() {
  return (
    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500 bg-green-500/10 gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      LIVE
    </Badge>
  );
}

function AlertCard({ alert }: { alert: CommandCenterData["red_alerts"][0] }) {
  const sevColor = alert.severity === "critical"
    ? "border-destructive/40 bg-destructive/5"
    : "border-orange-500/40 bg-orange-500/5";

  return (
    <div className={`rounded-lg border p-3 ${sevColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{alert.affected_system ?? "system"} · {alert.status}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${alert.severity === "critical" ? "border-destructive/30 text-destructive" : "border-orange-500/30 text-orange-500"}`}>
          {alert.severity.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
}

export default function ManageCommandCenter() {
  const { data, isLoading } = useManageCommandCenter();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Command Center</h2>
          <LiveBadge />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const hasRedAlerts = data.red_alerts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Command Center</h2>
        <LiveBadge />
        <span className="text-xs text-muted-foreground ml-auto">Auto-refresh: 15s</span>
      </div>

      {/* RED ALERTS */}
      {hasRedAlerts && (
        <AdminGlassCard className="p-4 border-destructive/30">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">RED ALERTS ({data.red_alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {data.red_alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </AdminGlassCard>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminMetricCard icon={<Users className="h-4 w-4" />} label="Active Users (24h)" value={data.active_users_24h} trend={<span className="text-xs text-muted-foreground">{data.active_users_7d} in 7d</span>} />
        <AdminMetricCard icon={<Users className="h-4 w-4" />} label="Total Users" value={data.total_users} />
        <AdminMetricCard icon={<DollarSign className="h-4 w-4" />} label="Transactions Today" value={data.transactions_today} trend={<span className="text-xs text-muted-foreground">{data.transactions_7d} in 7d</span>} />
        <AdminMetricCard icon={<TrendingUp className="h-4 w-4" />} label="Revenue Today" value={`$${(data.revenue_today_cents / 100).toFixed(2)}`} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminMetricCard icon={<Shield className="h-4 w-4" />} label="KYC Pending" value={data.kyc_pending} trend={<span className="text-xs text-muted-foreground">{data.kyc_approved_today} approved today</span>} />
        <AdminMetricCard icon={<CreditCard className="h-4 w-4" />} label="Active Subs" value={data.active_subscriptions} trend={<span className="text-xs text-muted-foreground">{data.past_due_subscriptions} past due</span>} />
        <AdminMetricCard icon={<Image className="h-4 w-4" />} label="AI Generations Today" value={data.ai_generations_today} />
        <AdminMetricCard icon={<Layers className="h-4 w-4" />} label="Published Surfaces" value={data.surfaces_published} />
      </div>

      {/* System Health */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AdminGlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`h-4 w-4 ${data.open_incidents > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">Open Incidents</p>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--admin-text))]">{data.open_incidents}</p>
          {data.critical_incidents > 0 && (
            <Badge variant="destructive" className="text-[10px] mt-1">{data.critical_incidents} critical</Badge>
          )}
        </AdminGlassCard>

        <AdminGlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Headset className={`h-4 w-4 ${data.support_pending > 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">Support Pending</p>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--admin-text))]">{data.support_pending}</p>
        </AdminGlassCard>

        <AdminGlassCard className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">System Status</p>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--admin-text))]">
            {data.critical_incidents === 0 && data.past_due_subscriptions === 0 ? "Healthy" : "Degraded"}
          </p>
        </AdminGlassCard>
      </div>
    </div>
  );
}
