import { useState } from "react";
import { AdminGlassCard, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users, DollarSign, Shield, AlertTriangle,
  CreditCard, Layers, Headset, Image, Flame,
  TrendingUp, CheckCircle2, Eye, ExternalLink,
  UserX, RotateCcw, ShieldCheck,
} from "lucide-react";
import { useManageCommandCenterV2, type CommandCenterV2Data } from "@/hooks/manage/useManageCommandCenterV2";
import { useQuickSuspendUser, useQuickRetryPayment, useQuickRetriggerKyc } from "@/hooks/manage/useManageQuickActions";
import { useNavigate } from "react-router-dom";

function LiveBadge() {
  return (
    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500 bg-green-500/10 gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      LIVE
    </Badge>
  );
}

function ClickableAlertCard({ alert, onClick }: { alert: CommandCenterV2Data["red_alerts"][0]; onClick: () => void }) {
  const sevColor = alert.severity === "critical"
    ? "border-destructive/40 bg-destructive/5"
    : "border-orange-500/40 bg-orange-500/5";

  return (
    <button onClick={onClick} className={`w-full text-left rounded-lg border p-3 ${sevColor} hover:opacity-80 transition-opacity`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{alert.affected_system ?? "system"} · {alert.status}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={`text-[10px] shrink-0 ${alert.severity === "critical" ? "border-destructive/30 text-destructive" : "border-orange-500/30 text-orange-500"}`}>
            {alert.severity.toUpperCase()}
          </Badge>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

function SpikeIndicator({ label, value, threshold = 3 }: { label: string; value: number; threshold?: number }) {
  const isSpike = value >= threshold;
  return (
    <div className={`rounded-lg border p-2.5 ${isSpike ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${isSpike ? "text-destructive" : "text-foreground"}`}>
        {value} {isSpike && <span className="text-xs">⚠️</span>}
      </p>
    </div>
  );
}

function QuickActionsPanel() {
  const [suspendId, setSuspendId] = useState("");
  const [retryId, setRetryId] = useState("");
  const [kycId, setKycId] = useState("");
  const suspendUser = useQuickSuspendUser();
  const retryPayment = useQuickRetryPayment();
  const retriggerKyc = useQuickRetriggerKyc();

  return (
    <AdminGlassCard className="p-4">
      <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-3">⚡ Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Suspend User</p>
          <div className="flex gap-1.5">
            <Input placeholder="User ID" value={suspendId} onChange={(e) => setSuspendId(e.target.value)}
              className="h-8 text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]" />
            <Button size="sm" variant="destructive" className="h-8 text-xs shrink-0" disabled={!suspendId || suspendUser.isPending}
              onClick={() => suspendUser.mutate(suspendId, { onSuccess: () => setSuspendId("") })}>
              <UserX className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Retry Payment</p>
          <div className="flex gap-1.5">
            <Input placeholder="Subscription ID" value={retryId} onChange={(e) => setRetryId(e.target.value)}
              className="h-8 text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]" />
            <Button size="sm" variant="outline" className="h-8 text-xs shrink-0 border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]" disabled={!retryId || retryPayment.isPending}
              onClick={() => retryPayment.mutate(retryId, { onSuccess: () => setRetryId("") })}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-[hsl(var(--admin-text-muted))]">Re-trigger KYC</p>
          <div className="flex gap-1.5">
            <Input placeholder="User ID" value={kycId} onChange={(e) => setKycId(e.target.value)}
              className="h-8 text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]" />
            <Button size="sm" variant="outline" className="h-8 text-xs shrink-0 border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]" disabled={!kycId || retriggerKyc.isPending}
              onClick={() => retriggerKyc.mutate(kycId, { onSuccess: () => setKycId("") })}>
              <ShieldCheck className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </AdminGlassCard>
  );
}

export default function ManageCommandCenter() {
  const { data, isLoading } = useManageCommandCenterV2();
  const navigate = useNavigate();

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
  const hasKycAlerts = data.kyc_alerts.length > 0;
  const hasPaymentAlerts = data.payment_alerts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Command Center</h2>
        <LiveBadge />
        <span className="text-xs text-muted-foreground ml-auto">Auto-refresh: 15s</span>
      </div>

      {/* RED ALERTS — clickable → incidents */}
      {hasRedAlerts && (
        <AdminGlassCard className="p-4 border-destructive/30">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">RED ALERTS ({data.red_alerts.length})</h3>
          </div>
          <div className="space-y-2">
            {data.red_alerts.map((alert) => (
              <ClickableAlertCard
                key={alert.id}
                alert={alert}
                onClick={() => navigate("/management/incidents")}
              />
            ))}
          </div>
        </AdminGlassCard>
      )}

      {/* KYC + Payment Alerts */}
      {(hasKycAlerts || hasPaymentAlerts) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {hasKycAlerts && (
            <AdminGlassCard className="p-4 border-orange-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-foreground">KYC Alerts ({data.kyc_alerts.length})</h3>
                </div>
                <button onClick={() => navigate("/management/kyc")} className="text-xs text-accent hover:underline flex items-center gap-1">
                  View All <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-1.5">
                {data.kyc_alerts.slice(0, 3).map((a) => (
                  <div key={a.id} className="text-xs text-muted-foreground flex justify-between">
                    <span>User {a.user_id.slice(0, 8)}… — <span className="text-destructive font-medium">{a.status}</span></span>
                    <span>{new Date(a.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                  </div>
                ))}
              </div>
            </AdminGlassCard>
          )}
          {hasPaymentAlerts && (
            <AdminGlassCard className="p-4 border-yellow-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-yellow-500" />
                  <h3 className="text-sm font-semibold text-foreground">Payment Alerts ({data.payment_alerts.length})</h3>
                </div>
                <button onClick={() => navigate("/management/payments")} className="text-xs text-accent hover:underline flex items-center gap-1">
                  View All <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-1.5">
                {data.payment_alerts.slice(0, 3).map((a) => (
                  <div key={a.id} className="text-xs text-muted-foreground flex justify-between">
                    <span>User {a.user_id.slice(0, 8)}… — <span className="text-orange-500 font-medium">{a.status}</span></span>
                    <span>{a.plan_id}</span>
                  </div>
                ))}
              </div>
            </AdminGlassCard>
          )}
        </div>
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
        <AdminMetricCard icon={<Layers className="h-4 w-4" />} label="Published Surfaces" value={data.surfaces_published} trend={<span className="text-xs text-muted-foreground">{data.surfaces_no_cover} no cover</span>} />
      </div>

      {/* Error Spikes */}
      <AdminGlassCard className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Error Spikes (24h)</h3>
        <div className="grid grid-cols-3 gap-3">
          <SpikeIndicator label="KYC Rejections" value={data.error_spikes.kyc_rejections_24h} />
          <SpikeIndicator label="Failed Payments" value={data.error_spikes.failed_payments_24h} />
          <SpikeIndicator label="AI Errors" value={data.error_spikes.ai_errors_24h} />
        </div>
      </AdminGlassCard>

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
          {data.support_escalated > 0 && (
            <Badge variant="outline" className="text-[10px] mt-1 border-orange-500/30 text-orange-500">{data.support_escalated} escalated</Badge>
          )}
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

      {/* Quick Actions */}
      <QuickActionsPanel />
    </div>
  );
}
