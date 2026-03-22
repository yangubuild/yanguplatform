import { useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle, CheckCircle2, Mail, Globe, Webhook, Clock,
  ShieldAlert, Filter, RefreshCw, ChevronDown, ServerCrash,
  FileWarning, Loader2, RotateCcw,
} from "lucide-react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePlatformAlerts } from "@/hooks/manage/useManageDashboardData";
import { useAlertsList, useResolveAlert, type AlertRecord } from "@/hooks/manage/useManageAlerts";
import { toast } from "sonner";

/* ── Auto-detected sources card ──────────────────────── */
function AutoDetectedSources() {
  const { data, isLoading } = usePlatformAlerts();
  const auto = data?.auto_detected ?? { email_dlq_24h: 0, failed_publishes: 0, failed_webhooks_24h: 0, stuck_jobs: 0 };

  const sources = [
    { key: "email_dlq", label: "Email DLQ (24h)", value: auto.email_dlq_24h, icon: Mail, color: "0,72%,51%" },
    { key: "publishes", label: "Failed Publishes", value: auto.failed_publishes, icon: Globe, color: "0,72%,51%" },
    { key: "webhooks", label: "Webhook Failures (24h)", value: (auto as any).failed_webhooks_24h ?? 0, icon: Webhook, color: "24,95%,53%" },
    { key: "jobs", label: "Stuck Jobs", value: (auto as any).stuck_jobs ?? 0, icon: Clock, color: "38,92%,50%" },
  ];

  if (isLoading) {
    return (
      <AdminGlassCard>
        <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-3">Auto-Detected Sources</h3>
        <Skeleton className="h-16 w-full" />
      </AdminGlassCard>
    );
  }

  const hasAny = sources.some((s) => s.value> 0);

  return (
    <AdminGlassCard>
      <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-3">Auto-Detected Issues</h3>
      {!hasAny ? (
        <div className="flex items-center gap-2 py-2">
          <CheckCircle2 className="h-4 w-4 text-[hsl(160,84%,45%)]" />
          <span className="text-xs text-[hsl(var(--admin-text-muted))]">No auto-detected issues</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((s) => (
            <div
              key={s.key}
              className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
                s.value> 0
                  ? `border-[hsl(${s.color}/0.4)] bg-[hsl(${s.color}/0.05)]`
                  : "border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)]"
              }`}>
              <div className={`p-1.5 rounded-lg ${s.value> 0 ? `bg-[hsl(${s.color}/0.12)]` : "bg-[hsl(var(--admin-surface-elevated)/0.5)]"}`}>
                <s.icon className={`h-4 w-4 ${s.value> 0 ? `text-[hsl(${s.color})]` : "text-[hsl(var(--admin-text-muted))]"}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-[hsl(var(--admin-text))]">{s.value}</p>
                <p className="text-[11px] text-[hsl(var(--admin-text-muted))]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGlassCard>
  );
}

/* ── Severity badge ──────────────────────────────────── */
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    critical: { cls: "bg-[hsl(0,72%,51%/0.15)] text-[hsl(0,72%,51%)] border-[hsl(0,72%,51%/0.3)]", label: "Critical" },
    warning: { cls: "bg-[hsl(38,92%,50%/0.15)] text-[hsl(38,92%,55%)] border-[hsl(38,92%,50%/0.3)]", label: "Warning" },
    info: { cls: "bg-[hsl(210,60%,50%/0.15)] text-[hsl(210,60%,60%)] border-[hsl(210,60%,50%/0.3)]", label: "Info" },
  };
  const m = map[severity] ?? map.info;
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
}

/* ── Alerts table ────────────────────────────────────── */
function AlertsTable() {
  const [severity, setSeverity] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>("active");

  const { data: alerts, isLoading, refetch, isFetching } = useAlertsList({ severity, status });
  const resolveMut = useResolveAlert();

  const handleResolve = (alert: AlertRecord) => {
    const next = !alert.is_resolved;
    resolveMut.mutate(
      { alertId: alert.id, resolve: next },
      {
        onSuccess: () => toast.success(next ? "Alert resolved" : "Alert reopened"),
        onError: (e) => toast.error("Failed: " + (e as Error).message),
      },
    );
  };

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))] flex items-center gap-2">
          <Filter className="h-4 w-4 text-[hsl(var(--admin-text-muted))]" />
          Platform Alerts
        </h3>
        <div className="flex items-center gap-2">
          <Select value={status ?? "all"} onValueChange={(v) => setStatus(v === "all" ? null : v)}>
            <SelectTrigger className="h-8 w-[120px] text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severity ?? "all"} onValueChange={(v) => setSeverity(v === "all" ? null : v)}>
            <SelectTrigger className="h-8 w-[120px] text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] transition-colors text-[hsl(var(--admin-text-muted))]">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !alerts || alerts.length === 0 ? (
        <div className="flex items-center gap-3 py-6 justify-center">
          <CheckCircle2 className="h-5 w-5 text-[hsl(160,84%,45%)]" />
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">No alerts match current filters</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[hsl(var(--admin-border)/0.3)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(var(--admin-border)/0.3)] hover:bg-transparent">
                <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Severity</TableHead>
                <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Title</TableHead>
                <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs hidden md:table-cell">Type</TableHead>
                <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs hidden lg:table-cell">Source</TableHead>
                <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Created</TableHead>
                <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Status</TableHead>
                <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((a) => (
                <TableRow key={a.id} className="border-[hsl(var(--admin-border)/0.2)] hover:bg-[hsl(var(--admin-surface-elevated)/0.3)]">
                  <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm text-[hsl(var(--admin-text))]">{a.title}</p>
                      {a.detail && <p className="text-[11px] text-[hsl(var(--admin-text-muted))] mt-0.5 max-w-xs truncate">{a.detail}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-[hsl(var(--admin-text-muted))]">{a.alert_type}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-xs text-[hsl(var(--admin-text-muted))]">{a.source_table ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[hsl(var(--admin-text-muted))]">
                      {format(new Date(a.created_at), "MMM d, HH:mm")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {a.is_resolved ? (
                      <Badge variant="outline" className="text-[10px] border-[hsl(160,84%,45%/0.3)] text-[hsl(160,84%,45%)]">Resolved</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-[hsl(0,72%,51%/0.3)] text-[hsl(0,72%,51%)]">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleResolve(a)}
                      disabled={resolveMut.isPending}
                      className="text-xs px-2 py-1 rounded-md hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] text-[hsl(var(--admin-text-muted))] hover:text-[hsl(var(--admin-text))] transition-colors disabled:opacity-50">
                      {resolveMut.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : a.is_resolved ? (
                        <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Reopen</span>
                      ) : (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Resolve</span>
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminGlassCard>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export default function ManageAlertsSecurity() {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Alerts & Security"
        description="Real-time platform incident visibility and alert management"
      />
      <AutoDetectedSources />
      <AlertsTable />
    </div>
  );
}
