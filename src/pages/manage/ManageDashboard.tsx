import {
  Bot, MessageSquare, Shield, Database, CheckCircle2,
  CreditCard, Plug, TrendingUp, Activity, AlertTriangle,
  Send, Zap, Eye, Users, FileWarning, ServerCrash,
  ToggleLeft, ToggleRight, ChevronRight, Sparkles,
  Inbox, Clock, ArrowUpRight, Search, Bell, UserCircle,
  Megaphone, BarChart3, Lock, Layers, Globe, AlertCircle,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { manageLink } from "@/lib/routing/managePathUtils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGlassCard, AdminPageHeader, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import {
  useOverviewStats,
  useLifecycleStats,
  usePlatformAlerts,
  useRecentAuditLogs,
} from "@/hooks/manage/useManageDashboardData";

/* ── Live Metrics (real data) ─────────────────────────── */
function LiveMetrics() {
  const { data: stats, isLoading } = useOverviewStats();
  const { data: lifecycle, isLoading: lcLoading } = useLifecycleStats();

  if (isLoading || lcLoading) {
    return (
      <AdminGlassCard>
        <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">Platform Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-glass-card p-4"><Skeleton className="h-10 w-24" /></div>
          ))}
        </div>
      </AdminGlassCard>
    );
  }

  const metrics = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users },
    { label: "Active Users", value: lifecycle?.active ?? 0, icon: CheckCircle2 },
    { label: "Surfaces", value: stats?.total_surfaces ?? 0, icon: Layers },
    { label: "Published", value: stats?.published_surfaces ?? 0, icon: Globe },
  ];

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">Platform Metrics</h3>
      <div className="grid gap-4 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="admin-glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[hsl(var(--admin-text-muted))]">{m.label}</span>
              <div className="p-1.5 rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.6)] text-[hsl(var(--admin-text-muted))]">
                <m.icon className="h-4 w-4" />
              </div>
            </div>
            <span className="text-2xl font-bold text-[hsl(var(--admin-text))] font-display">
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </span>
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

/* ── User Lifecycle Funnel (real data) ────────────────── */
function LifecycleFunnel() {
  const { data, isLoading } = useLifecycleStats();

  if (isLoading || !data) {
    return (
      <AdminGlassCard className="col-span-full lg:col-span-2">
        <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">User Lifecycle</h3>
        <Skeleton className="h-32 w-full" />
      </AdminGlassCard>
    );
  }

  const total = data.total || 1;
  const steps = [
    { label: "Registered", value: data.registered, pct: Math.round((data.registered / total) * 100) },
    { label: "Verified (Pending Onboarding)", value: data.verified_pending_onboarding, pct: Math.round((data.verified_pending_onboarding / total) * 100) },
    { label: "Onboarding In Progress", value: data.onboarding_in_progress, pct: Math.round((data.onboarding_in_progress / total) * 100) },
    { label: "Active", value: data.active, pct: Math.round((data.active / total) * 100) },
    { label: "Suspended", value: data.suspended, pct: Math.round((data.suspended / total) * 100) },
  ];

  return (
    <AdminGlassCard className="col-span-full lg:col-span-2">
      <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--admin-text))] font-display">
        <TrendingUp className="h-5 w-5 text-[hsl(24,95%,53%)]" />
        User Lifecycle ({total} total)
      </h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[hsl(var(--admin-text))]">{step.label}</span>
              <span className="font-semibold text-[hsl(var(--admin-text))]">{step.value} ({step.pct}%)</span>
            </div>
            <Progress value={step.pct} className="h-2 bg-[hsl(var(--admin-surface-elevated))]" />
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

/* ── Operational Alerts (real data) ───────────────────── */
function OperationalAlerts() {
  const navigate = useNavigate();
  const { data, isLoading } = usePlatformAlerts();

  if (isLoading) {
    return <AdminGlassCard><Skeleton className="h-24 w-full" /></AdminGlassCard>;
  }

  const alerts = data?.manual_alerts ?? [];
  const auto = data?.auto_detected ?? { email_dlq_24h: 0, failed_publishes: 0, failed_webhooks_24h: 0, stuck_jobs: 0 };
  const hasCritical = alerts.some((a) => a.severity === "critical") || auto.email_dlq_24h> 0 || auto.failed_publishes> 0 || auto.failed_webhooks_24h> 0;

  // Build unified list
  const items: Array<{ id: string; severity: string; title: string; detail: string; icon: typeof AlertTriangle }> = [];

  if (auto.email_dlq_24h> 0) {
    items.push({ id: "auto-dlq", severity: "critical", title: "Email DLQ failures", detail: `${auto.email_dlq_24h} email(s) failed delivery in last 24h`, icon: Mail });
  }
  if (auto.failed_publishes> 0) {
    items.push({ id: "auto-pub", severity: "critical", title: "Publish failures", detail: `${auto.failed_publishes} surface publish(es) in failed state`, icon: Globe });
  }
  if (auto.failed_webhooks_24h> 0) {
    items.push({ id: "auto-whk", severity: "critical", title: "Webhook failures", detail: `${auto.failed_webhooks_24h} webhook delivery failure(s) in last 24h`, icon: Globe });
  }
  if (auto.stuck_jobs> 0) {
    items.push({ id: "auto-jobs", severity: "warning", title: "Stuck jobs", detail: `${auto.stuck_jobs} job(s) stuck for over 1 hour`, icon: FileWarning });
  }
  alerts.forEach((a) => {
    items.push({ id: a.id, severity: a.severity, title: a.title, detail: a.detail ?? "", icon: a.severity === "critical" ? ServerCrash : FileWarning });
  });

  if (items.length === 0) {
    return (
      <AdminGlassCard>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[hsl(160,84%,45%,0.1)]">
            <CheckCircle2 className="h-5 w-5 text-[hsl(160,84%,45%)]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[hsl(var(--admin-text))]">All Clear</h4>
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">No active platform issues detected</p>
          </div>
        </div>
      </AdminGlassCard>
    );
  }

  return (
    <div className={`rounded-2xl border-2 p-5 ${hasCritical ? "border-[hsl(0,72%,51%/0.6)] bg-[hsl(0,72%,51%/0.04)]" : "border-[hsl(38,92%,50%/0.5)] bg-[hsl(38,92%,50%/0.04)]"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasCritical ? "bg-[hsl(0,72%,51%/0.15)]" : "bg-[hsl(38,92%,50%/0.15)]"}`}>
            <AlertTriangle className={`h-5 w-5 ${hasCritical ? "text-[hsl(0,72%,51%)] animate-pulse" : "text-[hsl(38,92%,55%)]"}`} />
          </div>
          <div>
            <h4 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display">
              {hasCritical ? "Critical Issues" : "Warnings"}
            </h4>
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">{items.length} active issue{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs ${hasCritical ? "border-[hsl(0,72%,51%/0.4)] text-[hsl(0,72%,51%)]" : "border-[hsl(38,92%,50%/0.4)] text-[hsl(38,92%,55%)]"}`}>
          {items.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <button
            key={item.id}
            className="flex w-full items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.4)] px-3 py-2 text-sm hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors"
            onClick={() => navigate(manageLink("alerts-security"))}>
            <span className="flex items-center gap-2 text-[hsl(var(--admin-text))]">
              <item.icon className={`h-4 w-4 ${item.severity === "critical" ? "text-[hsl(0,72%,51%)]" : "text-[hsl(38,92%,55%)]"}`} />
              {item.title}
            </span>
            <span className="text-xs text-[hsl(var(--admin-text-muted))] max-w-[50%] truncate text-right">{item.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Recent Activity (real audit logs) ────────────────── */
function RecentActivity() {
  const { data: logs, isLoading } = useRecentAuditLogs(8);

  if (isLoading) {
    return <AdminGlassCard><Skeleton className="h-32 w-full" /></AdminGlassCard>;
  }

  if (!logs || logs.length === 0) {
    return (
      <AdminGlassCard>
        <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">Recent Activity</h3>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">No recent activity recorded</p>
      </AdminGlassCard>
    );
  }

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">Recent Activity</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.3)] px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Activity className="h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))] shrink-0" />
              <span className="text-xs text-[hsl(var(--admin-text))] truncate">
                {log.action} <span className="text-[hsl(var(--admin-text-muted))]">on {log.entity_type}</span>
              </span>
            </div>
            <span className="text-[10px] text-[hsl(var(--admin-text-muted))] shrink-0 ml-2">
              {new Date(log.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

/* ── Quick Actions ────────────────────────────────────── */
function QuickActions() {
  const navigate = useNavigate();
  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">Quick Actions</h3>
      <div className="flex flex-wrap gap-3">
        <button className="admin-btn-secondary flex items-center gap-2" onClick={() => navigate(manageLink("users"))}>
          <Users className="h-4 w-4" />
          Manage Users
        </button>
        <button className="admin-btn-secondary flex items-center gap-2" onClick={() => navigate(manageLink("surfaces"))}>
          <Layers className="h-4 w-4" />
          Surfaces
        </button>
        <button className="admin-btn-secondary flex items-center gap-2" onClick={() => navigate(manageLink("domains"))}>
          <Globe className="h-4 w-4" />
          Domains
        </button>
      </div>
    </AdminGlassCard>
  );
}

/* ── Main Dashboard ───────────────────────────────────── */
export default function ManageDashboard() {
  return (
    <div className="space-y-5">
      {/* Live Metrics */}
      <LiveMetrics />

      {/* Operational Alerts (real) */}
      <OperationalAlerts />

      {/* Quick Actions */}
      <QuickActions />

      {/* Row: Lifecycle Funnel + Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <LifecycleFunnel />
        <RecentActivity />
      </div>
    </div>
  );
}
