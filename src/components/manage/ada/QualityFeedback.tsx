import { ThumbsUp, ThumbsDown, RefreshCw, UserCheck, Lightbulb } from "lucide-react";
import { AdaGlassModule, KpiCard } from "./AdaGlassModule";

export function QualityFeedback() {
  return (
    <AdaGlassModule title="Quality & Feedback Loop" icon={ThumbsUp}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Positive Ratings" value="89%" icon={ThumbsUp} trend="👍 2,341 responses" severity="success" />
        <KpiCard label="Negative Ratings" value="11%" icon={ThumbsDown} trend="👎 287 responses" severity="warning" />
        <KpiCard label="Correction Loops" value={42} icon={RefreshCw} trend="User corrected ADA" />
        <KpiCard label="Human Escalations" value={18} icon={UserCheck} trend="Routed to support" severity="warning" />
      </div>

      <div className="mt-3 rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-3.5 w-3.5 text-[hsl(25,85%,45%)]" />
          <span className="text-xs font-medium text-[hsl(var(--admin-text))]">ADA Suggestions Triggered</span>
          <span className="text-[10px] text-[hsl(25,85%,45%)] font-semibold ml-auto">1,204 today</span>
        </div>
        <div className="h-1.5 rounded-full bg-[hsl(var(--admin-border)/0.3)] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[hsl(25,85%,45%)] to-[hsl(25,85%,55%)]" style={{ width: "78%" }} />
        </div>
        <p className="text-[10px] text-[hsl(var(--admin-text-muted))] mt-1">78% acceptance rate</p>
      </div>
    </AdaGlassModule>
  );
}
