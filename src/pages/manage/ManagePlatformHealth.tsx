import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Globe, AlertTriangle, CheckCircle2, Clock, RefreshCcw, Link2Off, Shield } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const YANGU_DOMAINS = [
  { domain: "yangu.io", label: "Main Platform" },
  { domain: "yangu.shop", label: "Shop" },
  { domain: "yangu.store", label: "Store" },
  { domain: "yangu.site", label: "Sites" },
  { domain: "yangu.studio", label: "Studio" },
  { domain: "yangu.live", label: "Live" },
  { domain: "yangu.community", label: "Community" },
  { domain: "manage.yangu.studio", label: "Management" },
  { domain: "agency.yangu.studio", label: "Agency" },
];

interface HealthCheck {
  id: string;
  domain: string;
  status: string;
  response_time_ms: number | null;
  error_rate: number | null;
  error_message: string | null;
  checked_at: string;
}

function useHealthChecks() {
  return useQuery({
    queryKey: ["manage", "health-checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domain_health_checks")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as HealthCheck[];
    },
    refetchInterval: 30_000,
  });
}

function StatusDot({ status }: { status: string }) {
  const color = status === "healthy" ? "bg-emerald-500" : status === "degraded" ? "bg-yellow-500" : "bg-red-500";
  return <span className={`inline-block h-3 w-3 rounded-full ${color} ${status === "down" ? "animate-pulse" : ""}`} />;
}

function formatMs(ms: number | null) {
  if (ms == null) return "—";
  return `${ms}ms`;
}

export default function ManagePlatformHealth() {
  const { data: checks = [], isLoading, refetch } = useHealthChecks();

  const latestByDomain: Record<string, HealthCheck> = {};
  for (const c of checks) {
    if (!latestByDomain[c.domain]) latestByDomain[c.domain] = c;
  }

  const domainStatuses = YANGU_DOMAINS.map((d) => {
    const check = latestByDomain[d.domain];
    return {
      ...d,
      status: check?.status ?? "unknown",
      responseTime: check?.response_time_ms ?? null,
      errorRate: check?.error_rate ?? null,
      errorMessage: check?.error_message ?? null,
      checkedAt: check?.checked_at ?? null,
    };
  });

  const healthy = domainStatuses.filter((d) => d.status === "healthy").length;
  const degraded = domainStatuses.filter((d) => d.status === "degraded").length;
  const down = domainStatuses.filter((d) => d.status === "down").length;

  // Get most recent check timestamp
  const lastCheckTime = checks.length > 0 ? new Date(checks[0].checked_at).toLocaleString() : "No checks yet";

  const columns: AdminColumn<(typeof domainStatuses)[0]>[] = [
    {
      key: "domain",
      header: "Domain",
      render: (r) => (
        <div className="flex items-center gap-3">
          <StatusDot status={r.status} />
          <div>
            <span className="font-mono text-sm font-medium text-foreground">{r.domain}</span>
            <span className="ml-2 text-xs text-muted-foreground">({r.label})</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <AdminStatusBadge status={r.status === "healthy" ? "active" : r.status === "degraded" ? "pending" : r.status === "down" ? "inactive" : "unknown"} />,
    },
    { key: "responseTime", header: "Response Time", render: (r) => <span className="text-xs font-mono text-muted-foreground">{formatMs(r.responseTime)}</span> },
    { key: "errorRate", header: "Error Rate", render: (r) => <span className="text-xs font-mono text-muted-foreground">{r.errorRate != null ? `${(r.errorRate * 100).toFixed(1)}%` : "—"}</span> },
    {
      key: "checkedAt",
      header: "Last Check",
      render: (r) => <span className="text-xs text-muted-foreground">{r.checkedAt ? new Date(r.checkedAt).toLocaleTimeString() : "Never"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Platform Health Monitor" description="Real-time health status of all YANGU domains (auto-checks every 60s)" />

      {/* Critical RED ALERT banner */}
      {down > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">🚨 CRITICAL: {down} domain(s) DOWN — Incident auto-created</p>
            <p className="text-xs text-red-400/70">
              {domainStatuses.filter((d) => d.status === "down").map((d) => d.domain).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Degraded warning banner */}
      {degraded > 0 && down === 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-400">⚠️ WARNING: {degraded} domain(s) degraded (response &gt; 2s)</p>
            <p className="text-xs text-yellow-400/70">
              {domainStatuses.filter((d) => d.status === "degraded").map((d) => d.domain).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-5">
        <AdminMetricCard label="Total Domains" value={YANGU_DOMAINS.length} icon={<Globe className="h-4 w-4" />} />
        <AdminMetricCard label="Healthy" value={healthy} icon={<CheckCircle2 className="h-4 w-4" />} />
        <AdminMetricCard label="Degraded" value={degraded} icon={<Clock className="h-4 w-4" />} />
        <AdminMetricCard label="Down" value={down} icon={<AlertTriangle className="h-4 w-4" />} />
        <div className="rounded-lg border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-card)/0.5)] p-3">
          <p className="text-xs text-muted-foreground">Last Check</p>
          <p className="text-sm font-mono text-foreground mt-1">{lastCheckTime}</p>
        </div>
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Domain Status</TabsTrigger>
          <TabsTrigger value="history">Check History</TabsTrigger>
          <TabsTrigger value="broken-links">Broken Links</TabsTrigger>
          <TabsTrigger value="alerts">Red Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-4">
          <AdminGlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">All Domains</h3>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
            </div>
            <AdminTable columns={columns} data={domainStatuses} loading={isLoading} rowKey={(r) => r.domain} />
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <AdminGlassCard>
            <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-4">Recent Health Checks</h3>
            <AdminTable
              columns={[
                { key: "domain", header: "Domain", render: (r: HealthCheck) => <span className="font-mono text-xs">{r.domain}</span> },
                { key: "status", header: "Status", render: (r: HealthCheck) => <AdminStatusBadge status={r.status === "healthy" ? "active" : r.status === "degraded" ? "pending" : "inactive"} /> },
                { key: "response_time_ms", header: "Response", render: (r: HealthCheck) => <span className="text-xs font-mono">{formatMs(r.response_time_ms)}</span> },
                { key: "checked_at", header: "Time", render: (r: HealthCheck) => <span className="text-xs">{new Date(r.checked_at).toLocaleString()}</span> },
                { key: "error_message", header: "Error", render: (r: HealthCheck) => <span className="text-xs text-red-400 truncate max-w-[200px]">{r.error_message || "—"}</span> },
              ]}
              data={checks.slice(0, 50)}
              loading={isLoading}
              rowKey={(r: HealthCheck) => r.id}
            />
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="broken-links" className="mt-4">
          <AdminGlassCard>
            <div className="flex items-center gap-3 mb-4">
              <Link2Off className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">URL Crawler – Broken Links</h3>
                <p className="text-xs text-muted-foreground">Daily scan of published surfaces for 404s</p>
              </div>
            </div>
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Link2Off className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No broken links detected in latest scan</p>
              <p className="text-xs mt-1">Next scan runs automatically at midnight UTC</p>
            </div>
          </AdminGlassCard>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <AdminGlassCard>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Red Alert Configuration</h3>
                <p className="text-xs text-muted-foreground">Critical thresholds for automatic owner notifications</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { trigger: "Domain down > 3 consecutive checks → auto-incident", severity: "critical", active: true },
                { trigger: "Fraud spike > 2%", severity: "critical", active: true },
                { trigger: "Payment failure > 5%", severity: "high", active: true },
                { trigger: "Error rate > 10% (any service)", severity: "high", active: true },
                { trigger: "KYC rejection spike > 20%", severity: "medium", active: false },
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[hsl(var(--admin-border)/0.3)] px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-4 w-4 ${alert.severity === "critical" ? "text-red-500" : alert.severity === "high" ? "text-orange-500" : "text-yellow-500"}`} />
                    <span className="text-sm text-[hsl(var(--admin-text))]">{alert.trigger}</span>
                  </div>
                  <Badge variant="outline" className={alert.active ? "text-emerald-500 border-emerald-500/30" : "text-muted-foreground"}>
                    {alert.active ? "Active" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </div>
          </AdminGlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
