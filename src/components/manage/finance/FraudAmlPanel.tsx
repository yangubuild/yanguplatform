import { useState } from "react";
import { AdminGlassCard } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle, Eye, Ban, CheckCircle2 } from "lucide-react";

interface FraudAlert {
  id: string;
  type: "suspicious_payment" | "velocity_spike" | "chargeback" | "duplicate_account";
  severity: "high" | "medium" | "low";
  description: string;
  userId: string;
  timestamp: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
}

// Mock fraud alerts - will be replaced with real data
const MOCK_ALERTS: FraudAlert[] = [
  { id: "1", type: "suspicious_payment", severity: "high", description: "Multiple failed payment attempts from same IP", userId: "user-abc", timestamp: "2 min ago", status: "open" },
  { id: "2", type: "velocity_spike", severity: "medium", description: "Unusual spike in API usage (5x normal)", userId: "user-def", timestamp: "15 min ago", status: "investigating" },
  { id: "3", type: "chargeback", severity: "high", description: "Chargeback filed on subscription payment", userId: "user-ghi", timestamp: "1 hr ago", status: "open" },
  { id: "4", type: "duplicate_account", severity: "low", description: "Possible duplicate account detected via email pattern", userId: "user-jkl", timestamp: "3 hr ago", status: "resolved" },
];

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
  const [alerts, setAlerts] = useState<FraudAlert[]>(MOCK_ALERTS);

  const updateStatus = (id: string, status: FraudAlert["status"]) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const openAlerts = alerts.filter(a => a.status === "open" || a.status === "investigating");

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

      <div className="space-y-3">
        {alerts.map(alert => (
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
                <Badge variant="outline" className={`text-[9px] ${SEVERITY_BADGE[alert.severity]}`}>
                  {alert.severity}
                </Badge>
                <Badge variant="outline" className={`text-[9px] ${STATUS_BADGE[alert.status]}`}>
                  {alert.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="font-mono">{alert.userId}</span>
                <span>{alert.type.replace(/_/g, " ")}</span>
                <span>{alert.timestamp}</span>
              </div>
              {(alert.status === "open" || alert.status === "investigating") && (
                <div className="flex gap-1">
                  {alert.status === "open" && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"
                      onClick={() => updateStatus(alert.id, "investigating")}>
                      <Eye className="h-3 w-3 mr-1" />Investigate
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-green-500"
                    onClick={() => updateStatus(alert.id, "resolved")}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />Resolve
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-muted-foreground"
                    onClick={() => updateStatus(alert.id, "dismissed")}>
                    <Ban className="h-3 w-3 mr-1" />Dismiss
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminGlassCard>
  );
}
