import {
  Bot, MessageSquare, Shield, Database, CheckCircle2,
  CreditCard, Plug, TrendingUp, Activity, AlertTriangle,
  Send, Zap, Eye, Users, FileWarning, ServerCrash,
  ToggleLeft, ToggleRight, ChevronRight, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

/* ── ADA AI Command Assistant ─────────────────────────── */
function AdaCommandWidget() {
  const alerts = [
    { label: "Users at risk", icon: Users, count: 3 },
    { label: "Content flagged", icon: FileWarning, count: 7 },
    { label: "System anomaly", icon: ServerCrash, count: 1 },
  ];

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            ADA AI Command Assistant
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
            <Activity className="h-3 w-3 mr-1" /> Monitoring Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Ask ADA…" className="bg-muted/50" />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Suggested Alerts</p>
          {alerts.map((a) => (
            <button
              key={a.label}
              className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                {a.label}
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{a.count}</Badge>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          Live Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="h-4 w-4" />
              {s.label}
            </span>
            <span className="text-sm font-semibold">{s.value}</span>
          </div>
        ))}
        {/* Mock chat bubble */}
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Users className="h-3 w-3 text-accent" />
            </div>
            <div className="text-xs">
              <p className="font-medium">User #1042</p>
              <p className="text-muted-foreground">Having trouble with payment…</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
        <Card key={item.label} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <item.icon className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            </div>
            <AdminStatusBadge status={item.status} />
          </div>
        </Card>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          Monetization Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gateway Health</p>
        {gateways.map((g) => (
          <div key={g.name} className="flex items-center justify-between">
            <span className="text-sm font-medium">{g.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{g.latency}</span>
              <AdminStatusBadge status={g.status} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plug className="h-5 w-5 text-accent" />
          Integration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {integrations.map((i) => (
          <div key={i.name} className="flex items-center justify-between">
            <span className="text-sm">{i.name}</span>
            <div className="flex items-center gap-2">
              {i.enabled ? (
                <ToggleRight className="h-5 w-5 text-success" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
              <AdminStatusBadge status={i.enabled ? "active" : "paused"} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
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
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Growth Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {idx < steps.length - 1 && (
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                )}
                {idx === steps.length - 1 && (
                  <Zap className="h-3.5 w-3.5 text-warning" />
                )}
                {step.label}
              </span>
              <span className="font-semibold">{step.value}%</span>
            </div>
            <Progress value={step.value} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Live Metrics (existing-style quick stats) ────────── */
function LiveMetrics() {
  const metrics = [
    { label: "Active Users", value: "1,247", icon: Users, color: "text-accent" },
    { label: "Page Views (24h)", value: "8,903", icon: Eye, color: "text-success" },
    { label: "Uptime", value: "99.97%", icon: Activity, color: "text-success" },
  ];

  return (
    <div className="col-span-full grid gap-4 sm:grid-cols-3">
      {metrics.map((m) => (
        <Card key={m.label} className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10">
              <m.icon className={`h-6 w-6 ${m.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold">{m.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────── */
export default function ManageDashboard() {
  return (
    <div className="space-y-6">
      {/* Live Metrics */}
      <LiveMetrics />

      {/* Row: ADA + Messages */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AdaCommandWidget />
        <MessagesWidget />
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
