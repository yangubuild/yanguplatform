import {
  Bot, MessageSquare, Shield, Database, CheckCircle2,
  CreditCard, Plug, TrendingUp, Activity, AlertTriangle,
  Send, Zap, Eye, Users, FileWarning, ServerCrash,
  ToggleLeft, ToggleRight, ChevronRight, Sparkles,
  Inbox, Clock, ArrowUpRight, Search, Bell, UserCircle,
  Megaphone, BarChart3, Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

/* ── Live Metrics ─────────────────────────────────────── */
function LiveMetrics() {
  const metrics = [
    { label: "Active Users", value: "15,432", icon: Users, color: "text-[hsl(var(--admin-text-muted))]", sparkColor: "#5B8DEF" },
    { label: "Revenue Today", value: "$8,432", icon: CreditCard, color: "text-[hsl(160,84%,45%)]", sparkColor: "#4ADE80", trend: "↗" },
    { label: "Support Tickets", value: "24", icon: Inbox, color: "text-[hsl(24,95%,53%)]", sparkColor: "#F97316" },
  ];

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">Live Metrics</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="admin-glass-card p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[hsl(var(--admin-text-muted))]">{m.label}</span>
              <div className={`p-1.5 rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.6)] ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[hsl(var(--admin-text))] font-display">{m.value}</span>
              {m.trend && <span className="text-xs text-[hsl(160,84%,45%)]">{m.trend}</span>}
            </div>
            {/* Sparkline placeholder */}
            <svg className="absolute bottom-0 left-0 right-0 h-10 w-full opacity-30" viewBox="0 0 200 40" preserveAspectRatio="none">
              <path
                d={m.sparkColor === "#5B8DEF"
                  ? "M0 30 Q25 25 50 28 Q75 20 100 22 Q125 15 150 20 Q175 25 200 18"
                  : m.sparkColor === "#4ADE80"
                  ? "M0 35 Q25 30 50 25 Q75 32 100 20 Q125 28 150 15 Q175 22 200 10"
                  : "M0 20 L200 20"
                }
                fill="none"
                stroke={m.sparkColor}
                strokeWidth="2"
              />
            </svg>
            {/* Progress bar for tickets */}
            {m.sparkColor === "#F97316" && (
              <div className="mt-3 h-1.5 rounded-full bg-[hsl(var(--admin-surface-elevated))] overflow-hidden">
                <div className="h-full rounded-full bg-[hsl(24,95%,53%)]" style={{ width: "65%" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

/* ── Quick Actions ────────────────────────────────────── */
function QuickActions() {
  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display mb-4">Quick Actions</h3>
      <div className="flex flex-wrap gap-3">
        <button className="admin-btn-secondary flex items-center gap-2">
          <Megaphone className="h-4 w-4" />
          Send Announcement
        </button>
        <button className="admin-btn-secondary flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Monitor Transactions
        </button>
        <button className="ml-auto admin-btn-secondary flex items-center gap-2 border-[hsl(24,95%,53%/0.4)] text-[hsl(24,95%,53%)]">
          <Lock className="h-4 w-4" />
          Access Cloud
        </button>
      </div>
    </AdminGlassCard>
  );
}

/* ── ADA Action Required Banner ───────────────────────── */
function AdaActionBanner() {
  return (
    <div className="rounded-2xl border-2 border-[hsl(24,95%,53%/0.5)] bg-[hsl(24,95%,53%/0.05)] p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[hsl(0,72%,51%/0.15)]">
          <AlertTriangle className="h-5 w-5 text-[hsl(0,72%,51%)]" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-[hsl(var(--admin-text))] font-display">ADA Action Required</h4>
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Payment gateway latency (M-Pesa)</p>
        </div>
      </div>
      <button className="admin-btn-primary w-full py-3 text-center justify-center flex">
        Open ADA Context
      </button>
    </div>
  );
}

/* ── ADA AI Command Assistant ─────────────────────────── */
function AdaCommandWidget() {
  const alerts = [
    { label: "Users at risk", icon: Users, count: 3 },
    { label: "Content flagged", icon: FileWarning, count: 7 },
    { label: "System anomaly", icon: ServerCrash, count: 1 },
  ];

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2 text-[hsl(var(--admin-text))] font-display">
          <Bot className="h-5 w-5 text-[hsl(24,95%,53%)]" />
          ADA AI Command Assistant
        </h3>
        <Badge variant="outline" className="text-xs bg-[hsl(160,84%,45%,0.1)] text-[hsl(160,84%,45%)] border-[hsl(160,84%,45%,0.2)]">
          <Activity className="h-3 w-3 mr-1" /> Monitoring
        </Badge>
      </div>
      <div className="space-y-4">
        <Input
          placeholder="Ask ADA…"
          className="bg-[hsl(var(--admin-surface-elevated)/0.4)] border-[hsl(var(--admin-border)/0.5)] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))]"
        />
        <div className="space-y-2">
          <p className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">Suggested Alerts</p>
          {alerts.map((a) => (
            <button
              key={a.label}
              className="flex w-full items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.4)] px-3 py-2 text-sm hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors text-[hsl(var(--admin-text))]"
            >
              <span className="flex items-center gap-2">
                <a.icon className="h-4 w-4 text-[hsl(var(--admin-text-muted))]" />
                {a.label}
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-[hsl(var(--admin-border)/0.5)] text-[hsl(24,95%,53%)]">{a.count}</Badge>
                <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </AdminGlassCard>
  );
}

/* ── System Health HUD ────────────────────────────────── */
function SystemHealthWidget() {
  const items = [
    { label: "Security Audit", value: "Secure", icon: Shield, status: "active" as const },
    { label: "Database Latency", value: "24 ms", icon: Database, status: "active" as const },
    { label: "Compliance Status", value: "Verified", icon: CheckCircle2, status: "active" as const },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <AdminGlassCard key={item.label} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[hsl(160,84%,45%,0.1)]">
                <item.icon className="h-5 w-5 text-[hsl(160,84%,45%)]" />
              </div>
              <div>
                <p className="text-xs text-[hsl(var(--admin-text-muted))]">{item.label}</p>
                <p className="text-sm font-semibold text-[hsl(var(--admin-text))]">{item.value}</p>
              </div>
            </div>
            <AdminStatusBadge status={item.status} />
          </div>
        </AdminGlassCard>
      ))}
    </div>
  );
}

/* ── Monetization Status ──────────────────────────────── */
function MonetizationWidget() {
  const gateways = [
    { name: "Stripe", status: "active", latency: "45 ms" },
    { name: "PayPal", status: "active", latency: "78 ms" },
    { name: "M-Pesa", status: "verifying", latency: "120 ms" },
  ];

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--admin-text))] font-display">
        <CreditCard className="h-5 w-5 text-[hsl(24,95%,53%)]" />
        Gateway Health
      </h3>
      <div className="space-y-3">
        {gateways.map((g) => (
          <div key={g.name} className="flex items-center justify-between">
            <span className="text-sm font-medium text-[hsl(var(--admin-text))]">{g.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[hsl(var(--admin-text-muted))]">{g.latency}</span>
              <AdminStatusBadge status={g.status} />
            </div>
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

/* ── Integration Status ───────────────────────────────── */
function IntegrationWidget() {
  const integrations = [
    { name: "Mailchimp", enabled: true },
    { name: "SendGrid", enabled: false },
    { name: "Amazon SES", enabled: true },
    { name: "Ada AI", enabled: true },
  ];

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--admin-text))] font-display">
        <Plug className="h-5 w-5 text-[hsl(24,95%,53%)]" />
        Integrations
      </h3>
      <div className="space-y-3">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between">
            <span className="text-sm text-[hsl(var(--admin-text))]">{i.name}</span>
            {i.enabled ? (
              <ToggleRight className="h-5 w-5 text-[hsl(160,84%,45%)]" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-[hsl(var(--admin-text-muted))]" />
            )}
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

/* ── Growth Funnel ────────────────────────────────────── */
function GrowthFunnelWidget() {
  const steps = [
    { label: "Signup", value: 82 },
    { label: "Verification", value: 64 },
    { label: "Dashboard", value: 51 },
    { label: "Purchase", value: 23 },
  ];

  return (
    <AdminGlassCard className="col-span-full lg:col-span-2">
      <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--admin-text))] font-display">
        <TrendingUp className="h-5 w-5 text-[hsl(24,95%,53%)]" />
        Growth Funnel
      </h3>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[hsl(var(--admin-text))]">
                {idx < steps.length - 1 ? (
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(24,95%,53%)]" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-[hsl(38,92%,55%)]" />
                )}
                {step.label}
              </span>
              <span className="font-semibold text-[hsl(var(--admin-text))]">{step.value}%</span>
            </div>
            <Progress value={step.value} className="h-2 bg-[hsl(var(--admin-surface-elevated))]" />
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}

/* ── Support Tickets Widget ────────────────────────────── */
function SupportTicketsWidget() {
  const navigate = useNavigate();
  const items = [
    { label: "Open Tickets", count: 3, icon: Clock, color: "text-[hsl(38,92%,55%)]", filter: "open" },
    { label: "Urgent", count: 2, icon: AlertTriangle, color: "text-[hsl(0,72%,51%)]", filter: "urgent" },
    { label: "Unread", count: 2, icon: Inbox, color: "text-[hsl(24,95%,53%)]", filter: "unread" },
  ];

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--admin-text))] font-display">
        <Inbox className="h-5 w-5 text-[hsl(24,95%,53%)]" />
        Support Inbox
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            className="flex w-full items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.4)] px-3 py-2 text-sm hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors"
            onClick={() => navigate(`/manage/messages?filter=${item.filter}`)}
          >
            <span className="flex items-center gap-2 text-[hsl(var(--admin-text))]">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              {item.label}
            </span>
            <span className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-[hsl(var(--admin-border)/0.5)] text-[hsl(24,95%,53%)]">{item.count}</Badge>
              <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />
            </span>
          </button>
        ))}
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

      {/* Quick Actions */}
      <QuickActions />

      {/* ADA Action Required Banner */}
      <AdaActionBanner />

      {/* Row: ADA + Support */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdaCommandWidget />
        </div>
        <SupportTicketsWidget />
      </div>

      {/* System Health HUD */}
      <SystemHealthWidget />

      {/* Row: Monetization + Integration */}
      <div className="grid gap-4 md:grid-cols-2">
        <MonetizationWidget />
        <IntegrationWidget />
      </div>

      {/* Growth Funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GrowthFunnelWidget />
      </div>
    </div>
  );
}
