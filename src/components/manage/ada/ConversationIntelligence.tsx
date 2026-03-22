import { MessageSquare, Zap, BarChart3, TrendingDown, Search } from "lucide-react";
import { AdaGlassModule, KpiCard } from "./AdaGlassModule";
import { Badge } from "@/components/ui/badge";

const topQueries = [
  { query: "How do I publish my surface?", count: 142 },
  { query: "Reset my password", count: 98 },
  { query: "Create a store page", count: 87 },
  { query: "Billing and subscription help", count: 64 },
  { query: "Image generation not working", count: 51 },
];

export function ConversationIntelligence() {
  return (
    <AdaGlassModule
      title="Live Conversation Intelligence"
      icon={MessageSquare}
      headerRight={
        <Badge variant="outline" className="text-[10px] border-[hsl(25,85%,45%/0.3)] text-[hsl(25,85%,45%)] bg-[hsl(25,85%,45%/0.08)]">
          ● Live
        </Badge>
      }>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Active Sessions" value={234} icon={MessageSquare} trend="+18% vs yesterday" severity="success" />
        <KpiCard label="Chat Queue" value={12} icon={Zap} trend="Avg 3.2s response" />
        <KpiCard label="Avg Wait Time" value="1.4s" icon={BarChart3} severity="success" />
        <KpiCard label="Drop-off Rate" value="4.2%" icon={TrendingDown} trend="-0.8% this week" severity="success" />
      </div>

      <div className="rounded-md border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.3)] p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Search className="h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />
          <span className="text-xs font-medium text-[hsl(var(--admin-text))]">Top Queries</span>
        </div>
        <div className="space-y-1.5">
          {topQueries.map((q, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
              <span className="text-[hsl(var(--admin-text-muted))]">{q.query}</span>
              <span className="text-[hsl(25,85%,45%)] font-medium">{q.count}</span>
            </div>
          ))}
        </div>
      </div>
    </AdaGlassModule>
  );
}
