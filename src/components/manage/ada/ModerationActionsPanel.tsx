import { useState } from "react";
import { ShieldAlert, Eye, CheckCircle, AlertTriangle, MessageSquare, ArrowUpCircle, Ban } from "lucide-react";
import { AdaGlassModule } from "./AdaGlassModule";
import { toast } from "@/hooks/use-toast";

interface Incident {
  id: string;
  message: string;
  severity: "critical" | "warning" | "info";
  time: string;
  user: string;
  status: "open" | "resolved" | "escalated";
  details?: string;
}

const mockIncidents: Incident[] = [
  { id: "1", message: "Prompt injection attempt blocked", severity: "critical", time: "3m ago", user: "user_8x92k", status: "open" },
  { id: "2", message: "NSFW content in image request", severity: "critical", time: "8m ago", user: "user_3jf91", status: "open" },
  { id: "3", message: "Unusual prompt pattern flagged", severity: "warning", time: "15m ago", user: "user_kq812", status: "open" },
  { id: "4", message: "Copyright content reference", severity: "warning", time: "22m ago", user: "user_p1m93", status: "resolved" },
  { id: "5", message: "Policy check passed for batch #88", severity: "info", time: "1h ago", user: "system", status: "resolved" },
];

const sevStyle: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-[hsl(0,72%,51%,0.1)]", text: "text-[hsl(0,72%,51%)]", label: "Critical" },
  warning: { bg: "bg-[hsl(38,92%,50%,0.1)]", text: "text-[hsl(38,92%,50%)]", label: "Warning" },
  info: { bg: "bg-[hsl(217,91%,60%,0.1)]", text: "text-[hsl(217,91%,60%)]", label: "Info" },
};

export function ModerationActionsPanel() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleAction = (id: string, action: string) => {
    switch (action) {
      case "resolve":
        setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status: "resolved" } : i));
        toast({ title: "Marked Resolved", description: "Pending backend wiring" });
        break;
      case "warn":
        toast({ title: "User Warning Sent", description: "Pending backend wiring" });
        break;
      case "restrict":
        toast({ title: "Feature Restricted", description: "Image gen/shopping restricted for user. Pending backend wiring" });
        break;
      case "escalate":
        setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status: "escalated" } : i));
        toast({ title: "Escalated to Support", description: "Pending backend wiring" });
        break;
      case "note":
        if (noteText.trim()) {
          toast({ title: "Note Added", description: noteText });
          setNoteText("");
        }
        break;
    }
  };

  return (
    <AdaGlassModule title="Moderation Actions" icon={ShieldAlert}>
      <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[hsl(var(--admin-border)/0.2)] flex items-center justify-between">
          <span className="text-xs font-medium text-[hsl(var(--admin-text))]">Flagged Incidents</span>
          <span className="text-[10px] text-[hsl(var(--admin-text-muted))]">{incidents.filter((i) => i.status === "open").length} open</span>
        </div>
        <div className="divide-y divide-[hsl(var(--admin-border)/0.15)]">
          {incidents.map((inc) => {
            const s = sevStyle[inc.severity];
            const isExpanded = expandedId === inc.id;
            return (
              <div key={inc.id}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--admin-surface-elevated)/0.3)] transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : inc.id)}>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${s.bg} ${s.text}`}>{s.label}</span>
                  <span className="text-xs text-[hsl(var(--admin-text))] flex-1 truncate">{inc.message}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${inc.status === "open" ? "bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)]" : inc.status === "escalated" ? "bg-[hsl(0,72%,51%/0.1)] text-[hsl(0,72%,51%)]" : "bg-[hsl(160,84%,39%/0.1)] text-[hsl(160,84%,39%)]"}`}>
                    {inc.status}
                  </span>
                  <span className="text-[10px] text-[hsl(var(--admin-text-muted))] shrink-0">{inc.time}</span>
                  <Eye className="h-3 w-3 text-[hsl(var(--admin-text-muted))]" />
                </div>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 bg-[hsl(var(--admin-surface)/0.3)]">
                    <div className="text-[10px] text-[hsl(var(--admin-text-muted))]">User: <span className="text-[hsl(var(--admin-text))]">{inc.user}</span></div>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => handleAction(inc.id, "resolve")} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[hsl(160,84%,39%/0.1)] text-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,39%/0.2)] transition-colors">
                        <CheckCircle className="h-3 w-3" /> Resolve
                      </button>
                      <button onClick={() => handleAction(inc.id, "warn")} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[hsl(38,92%,50%/0.1)] text-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,50%/0.2)] transition-colors">
                        <AlertTriangle className="h-3 w-3" /> Warn User
                      </button>
                      <button onClick={() => handleAction(inc.id, "restrict")} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[hsl(0,72%,51%/0.1)] text-[hsl(0,72%,51%)] hover:bg-[hsl(0,72%,51%/0.2)] transition-colors">
                        <Ban className="h-3 w-3" /> Restrict
                      </button>
                      <button onClick={() => handleAction(inc.id, "escalate")} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[hsl(217,91%,60%/0.1)] text-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,60%/0.2)] transition-colors">
                        <ArrowUpCircle className="h-3 w-3" /> Escalate
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add internal note..."
                        className="flex-1 px-2 py-1 rounded text-[10px] bg-[hsl(var(--admin-surface-elevated)/0.4)] border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text))] outline-none"
                      />
                      <button onClick={() => handleAction(inc.id, "note")} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border border-[hsl(var(--admin-border)/0.3)] text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
                        <MessageSquare className="h-3 w-3" /> Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdaGlassModule>
  );
}