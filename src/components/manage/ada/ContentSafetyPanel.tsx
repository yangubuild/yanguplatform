import { Shield, AlertOctagon, Ban, FileWarning, Scale } from "lucide-react";
import { AdaGlassModule, KpiCard } from "./AdaGlassModule";

const incidents = [
  { id: 1, message: "Prompt injection attempt blocked", severity: "critical", time: "3m ago" },
  { id: 2, message: "NSFW content detected in image request", severity: "critical", time: "8m ago" },
  { id: 3, message: "Unusual prompt pattern flagged", severity: "warning", time: "15m ago" },
  { id: 4, message: "Copyright content reference detected", severity: "warning", time: "22m ago" },
  { id: 5, message: "Policy check passed for batch #88", severity: "info", time: "1h ago" },
];

const sevStyle: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-[hsl(0,72%,51%,0.1)]", text: "text-[hsl(0,72%,51%)]", label: "Critical" },
  warning: { bg: "bg-[hsl(38,92%,50%,0.1)]", text: "text-[hsl(38,92%,50%)]", label: "Warning" },
  info: { bg: "bg-[hsl(217,91%,60%,0.1)]", text: "text-[hsl(217,91%,60%)]", label: "Info" },
};

export function ContentSafetyPanel() {
  return (
    <AdaGlassModule title="Content Safety & Moderation" icon={Shield}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Flagged Prompts" value={23} icon={FileWarning} severity="warning" />
        <KpiCard label="Blocked Requests" value={8} icon={Ban} severity="error" />
        <KpiCard label="Sensitive Alerts" value={14} icon={AlertOctagon} severity="warning" />
        <KpiCard label="Policy Violations" value={3} icon={Scale} severity="error" />
      </div>

      <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[hsl(var(--admin-border)/0.2)]">
          <span className="text-xs font-medium text-[hsl(var(--admin-text))]">Recent Incidents</span>
        </div>
        <div className="divide-y divide-[hsl(var(--admin-border)/0.15)]">
          {incidents.map((inc) => {
            const s = sevStyle[inc.severity];
            return (
              <div key={inc.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${s.bg} ${s.text}`}>{s.label}</span>
                <span className="text-xs text-[hsl(var(--admin-text))] flex-1 truncate">{inc.message}</span>
                <span className="text-[10px] text-[hsl(var(--admin-text-muted))] shrink-0">{inc.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AdaGlassModule>
  );
}
