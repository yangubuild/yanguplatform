import { format } from "date-fns";
import {
  Bell, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, RefreshCw,
} from "lucide-react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSmartAlerts, useResolveSmartAlert, type SmartAlert } from "@/hooks/manage/useManageSmartAlerts";

function AlertCard({ alert }: { alert: SmartAlert }) {
  const resolve = useResolveSmartAlert();
  const sevColor = alert.severity === "critical"
    ? "border-destructive/40 bg-destructive/5"
    : alert.severity === "warning"
    ? "border-orange-500/30 bg-orange-500/5"
    : "border-[hsl(var(--admin-border)/0.3)]";

  const Icon = alert.alert_type === "spike" ? TrendingUp : alert.alert_type === "anomaly" ? TrendingDown : AlertTriangle;

  return (
    <AdminGlassCard className={`p-4 ${sevColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon className={`h-4 w-4 mt-0.5 ${alert.severity === "critical" ? "text-destructive" : "text-orange-500"}`} />
          <div>
            <p className="text-sm font-medium text-[hsl(var(--admin-text))]">{alert.message}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))] capitalize">{alert.alert_type}</Badge>
              <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">{alert.metric}</Badge>
              {alert.current_value !== null && alert.threshold_value !== null && (
                <span className="text-[11px] text-[hsl(var(--admin-text-muted))]">
                  {alert.current_value} / threshold {alert.threshold_value}
                </span>
              )}
            </div>
            <p className="text-xs text-[hsl(var(--admin-text-muted))] mt-1">{format(new Date(alert.created_at), "MMM d, HH:mm")}</p>
          </div>
        </div>
        {!alert.is_resolved && (
          <Button size="sm" variant="outline" onClick={() => resolve.mutate(alert.id)} disabled={resolve.isPending}
            className="text-xs shrink-0 border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
          </Button>
        )}
      </div>
    </AdminGlassCard>
  );
}

export default function ManageSmartAlerts() {
  const { data: active, isLoading: loadingActive, refetch: refetchActive } = useSmartAlerts(false);
  const { data: resolved, isLoading: loadingResolved } = useSmartAlerts(true);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <AdminPageHeader title="Smart Alerts" description="Threshold-based alerts and anomaly detection" />
        <Button size="sm" variant="outline" onClick={() => refetchActive()} className="gap-1.5 text-xs border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))]">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-[hsl(var(--admin-surface-elevated)/0.5)]">
          <TabsTrigger value="active" className="text-xs">Active ({active?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs">Resolved ({resolved?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-3 space-y-2">
          {loadingActive ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : !active || active.length === 0 ? (
            <AdminGlassCard className="p-8 text-center">
              <Bell className="h-10 w-10 text-[hsl(var(--admin-text-muted))] mx-auto mb-3" />
              <p className="text-sm text-[hsl(var(--admin-text-muted))]">No active alerts — system healthy</p>
            </AdminGlassCard>
          ) : (
            active.map((a) => <AlertCard key={a.id} alert={a} />)
          )}
        </TabsContent>
        <TabsContent value="resolved" className="mt-3 space-y-2">
          {loadingResolved ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : !resolved || resolved.length === 0 ? (
            <AdminGlassCard className="p-8 text-center">
              <p className="text-sm text-[hsl(var(--admin-text-muted))]">No resolved alerts</p>
            </AdminGlassCard>
          ) : (
            resolved.map((a) => <AlertCard key={a.id} alert={a} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
