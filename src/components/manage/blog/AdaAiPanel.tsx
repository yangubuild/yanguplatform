import { Shield, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";

const mockAlerts = [
  { id: "1", message: "Image moderation check passed", time: "2 min ago", level: "ok" },
  { id: "2", message: "Flagged content in draft #4", time: "12 min ago", level: "warn" },
  { id: "3", message: "Compliance scan completed", time: "1 hr ago", level: "ok" },
  { id: "4", message: "New article submitted for review", time: "2 hr ago", level: "info" },
];

export function AdaAiPanel() {
  return (
    <aside className="w-64 shrink-0 space-y-4 hidden xl:block">
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <h4 className="text-sm font-semibold">ADA AI Monitoring</h4>
        </div>

        {/* Content Safety */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Content Safety</span>
            <AdminStatusBadge status="active" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">AI Compliance</span>
            <AdminStatusBadge status="active" />
          </div>
        </div>

        {/* Activity Alerts */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Activity Alerts</span>
          </div>
          <div className="space-y-2">
            {mockAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 text-xs">
                {alert.level === "warn" ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-foreground leading-tight">{alert.message}</p>
                  <p className="text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
