import {
  Bot, MessageSquare, Shield, Database, CheckCircle2,
  CreditCard, Plug, TrendingUp, Activity, AlertTriangle,
  Send, Zap, Eye, Users, FileWarning, ServerCrash,
  ToggleLeft, ToggleRight, ChevronRight, Sparkles,
  Inbox, Clock, ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminGlassCard, AdminPageHeader, AdminMetricCard } from "@/components/manage/AdminGlassCard";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

/* ── ADA AI Command Assistant ─────────────────────────── */
function AdaCommandWidget() {
  const alerts = [
    { label: "Users at risk", icon: Users, count: 3 },
    { label: "Content flagged", icon: FileWarning, count: 7 },
    { label: "System anomaly", icon: ServerCrash, count: 1 },
  ];

  return (
    <AdminGlassCard className="col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold flex items-center gap-2 text-[hsl(var(--admin-text))] font-display">
          <Bot className="h-5 w-5 text-[hsl(24,95%,53%)]" />
          ADA AI Command Assistant
        </h3>
        <Badge variant="outline" className="text-xs bg-[hsl(160,84%,45%,0.1)] text-[hsl(160,84%,45%)] border-[hsl(160,84%,45%,0.2)]">
          <Activity className="h-3 w-3 mr-1" /> Monitoring Active
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

/* ── Live Communications ──────────────────────────────── */
function MessagesWidget() {
  const stats = [
    { label: "Active Conversations", value: 12, icon: MessageSquare },
    { label: "New Messages", value: 34, icon: Send },
    { label: "Open Tickets", value: 5, icon: AlertTriangle },
  ];

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--admin-text))] font-display">
        <MessageSquare className="h-5 w-5 text-[hsl(24,95%,53%)]" />
        Live Communications
      </h3>
      <div className="space-y-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-[hsl(var(--admin-text-muted))]">
              <s.icon className="h-4 w-4" />
              {s.label}
            </span>
            <span className="text-sm font-semibold text-[hsl(var(--admin-text))]">{s.value}</span>
          </div>
        ))}
        <div className="rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.3)] border border-[hsl(var(--admin-border)/0.3)] p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-[hsl(24,95%,53%,0.15)] flex items-center justify-center shrink-0">
              <Users className="h-3 w-3 text-[hsl(24,95%,53%)]" />
            </div>
            <div className="text-xs">
              <p className="font-medium text-[hsl(var(--admin-text))]">User #1042</p>
              <p className="text-[hsl(var(--admin-text-muted))]">Having trouble with payment…</p>
            </div>
          </div>
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
    <div className="col-span-full grid gap-4 sm:grid-cols-3">
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
        Monetization Status
      </h3>
      <div className="space-y-3">
        <p className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider">Gateway Health</p>
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
    { name: "Kitchen Visionboard", enabled: false },
  ];

  return (
    <AdminGlassCard>
      <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-[hsl(var(--admin-text))] font-display">
        <Plug className="h-5 w-5 text-[hsl(24,95%,53%)]" />
        Integration Status
      </h3>
      <div className="space-y-3">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between">
            <span className="text-sm text-[hsl(var(--admin-text))]">{i.name}</span>
            <div className="flex items-center gap-2">
              {i.enabled ? (
                <ToggleRight className="h-5 w-5 text-[hsl(160,84%,45%)]" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-[hsl(var(--admin-text-muted))]" />
              )}
              <AdminStatusBadge status={i.enabled ? "active" : "paused"} />
            </div>
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
                {idx < steps.length - 1 && (
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(24,95%,53%)]" />
                )}
                {idx === steps.length - 1 && (
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
    { label: "Urgent Tickets", count: 2, icon: AlertTriangle, color: "text-[hsl(0,72%,51%)]", filter: "urgent" },
    { label: "Unread Tickets", count: 2, icon: Inbox, color: "text-[hsl(24,95%,53%)]", filter: "unread" },
    { label: "Escalated", count: 1, icon: ArrowUpRight, color: "text-[hsl(0,72%,51%)]", filter: "escalated" },
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform Health Dashboard"
        description="Real-time overview of your platform operations"
      />

      {/* Live Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard
          label="Active Users"
          value="1,247"
          icon={<Users className="h-5 w-5" />}
        />
        <AdminMetricCard
          label="Page Views (24h)"
          value="8,903"
          icon={<Eye className="h-5 w-5" />}
          trend={<span className="text-xs text-[hsl(160,84%,45%)]">↑ 12%</span>}
        />
        <AdminMetricCard
          label="Uptime"
          value="99.97%"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      {/* Row: ADA + Support */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AdaCommandWidget />
        <div className="space-y-4">
          <SupportTicketsWidget />
        </div>
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
