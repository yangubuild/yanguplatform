import { useState } from "react";
import { Coins, Image, Terminal, AlertTriangle } from "lucide-react";
import { AdaGlassModule, KpiCard } from "./AdaGlassModule";

const segments = ["All", "Builders", "Sellers", "Creators", "Organizations"] as const;

const segmentData: Record<string, { tokens: string; images: string; actions: string; rateWarnings: number }> = {
  All: { tokens: "2.4M", images: "1,842", actions: "3,291", rateWarnings: 3 },
  Builders: { tokens: "980K", images: "612", actions: "1,421", rateWarnings: 1 },
  Sellers: { tokens: "540K", images: "421", actions: "892", rateWarnings: 0 },
  Creators: { tokens: "620K", images: "689", actions: "612", rateWarnings: 2 },
  Organizations: { tokens: "260K", images: "120", actions: "366", rateWarnings: 0 },
};

export function UsageCostMonitoring() {
  const [segment, setSegment] = useState<string>("All");
  const data = segmentData[segment];

  return (
    <AdaGlassModule title="Usage & Cost Monitoring" icon={Coins}>
      {/* Segment filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {segments.map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={`px-2.5 py-1 text-[11px] rounded-md transition-colors font-medium ${
              segment === s
                ? "bg-[hsl(25,85%,45%/0.15)] text-[hsl(25,85%,45%)] border border-[hsl(25,85%,45%/0.3)]"
                : "text-[hsl(var(--admin-text-muted))] border border-[hsl(var(--admin-border)/0.3)] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Tokens (Today)" value={data.tokens} icon={Coins} trend="Daily consumption" />
        <KpiCard label="Images Generated" value={data.images} icon={Image} trend="Last 24h" />
        <KpiCard label="Actions Executed" value={data.actions} icon={Terminal} trend="Pages, commands, tasks" />
        <KpiCard
          label="Rate Warnings"
          value={data.rateWarnings}
          icon={AlertTriangle}
          severity={data.rateWarnings > 0 ? "warning" : "success"}
          trend={data.rateWarnings > 0 ? "Active throttling" : "All clear"}
        />
      </div>
    </AdaGlassModule>
  );
}
