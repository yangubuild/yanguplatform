import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, Eye, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const SEVERITY_BADGE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const STATUS_BADGE: Record<string, string> = {
  open: "bg-destructive/10 text-destructive border-destructive/20",
  investigating: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",
  dismissed: "bg-muted text-muted-foreground border-border",
};

export function FraudAmlPanel() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["manage", "fraud-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fraud_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  const updateAlert = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === "resolved" || status === "dismissed") {
        updates.resolved_by = user?.id;
        updates.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("fraud_alerts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manage", "fraud-alerts"] });
      toast.success("Alert updated");
    },
    onError: () => toast.error("Failed to update alert"),
  });

  const openAlerts = alerts.filter((a: any) => a.status === "open" || a.status === "investigating");

  return (
    <AdminGlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-[hsl(var(--admin-text))]">Fraud & AML Alerts</h3>
          {openAlerts.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {openAlerts.length} active
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>No fraud alerts — all clear</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${
                alert.status === "open" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-3.5 w-3.5 ${alert.severity === "high" ? "text-destructive" : "text-yellow-500"}`} />
                  <span className="text-sm font-medium text-foreground">{alert.description}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className={`text-[9px] ${SEVERITY_BADGE[alert.severity] || ""}`}>
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] ${STATUS_BADGE[alert.status] || ""}`}>
                    {alert.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="font-mono">{alert.user_id ? alert.user_id.slice(0, 8) : "—"}</span>
                  <span>{alert.alert_type?.replace(/_/g, " ")}</span>
                  <span>{format(new Date(alert.created_at), "MMM d, HH:mm")}</span>
                </div>
                {(alert.status === "open" || alert.status === "investigating") && (
                  <div className="flex gap-1">
                    {alert.status === "open" && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                        onClick={() => updateAlert.mutate({ id: alert.id, status: "investigating" })}>
                        <Eye className="h-3 w-3 mr-1" />Investigate
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-green-500"
                      onClick={() => updateAlert.mutate({ id: alert.id, status: "resolved" })}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />Resolve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground"
                      onClick={() => updateAlert.mutate({ id: alert.id, status: "dismissed" })}>
                      <Ban className="h-3 w-3 mr-1" />Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGlassCard>
  );
}
