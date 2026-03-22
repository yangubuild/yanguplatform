import { useState } from "react";
import { Calendar, ChevronDown, Rocket } from "lucide-react";
import { AffEmptyTable } from "../shared/AffEmptyTable";

const STAT_CARDS = [
  { label: "Net commission", value: "$0.00" },
  { label: "Refunds & disputes (Gross)", value: "$0.00" },
  { label: "Refunds & disputes (Counts)", value: "0" },
  { label: "Users referred", value: "0" },
  { label: "Revenue produced", value: "$0.00" },
];

export function AffDashboardTab() {
  const [company, setCompany] = useState("All companies");
  const [period, setPeriod] = useState("Last 7 days");

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 border border-white/[0.06]">
          {company}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <span className="text-white/30 text-sm">in</span>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 border border-white/[0.06]">
          <Calendar className="w-3.5 h-3.5" />
          {period}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {STAT_CARDS.slice(0, 3).map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {STAT_CARDS.slice(3).map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      {/* All activity */}
      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-sm font-semibold text-white">All activity</h3>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-white/20 text-xs text-white/50">
          <span className="text-white/30">⊕</span> Transaction type
        </button>
      </div>

      <AffEmptyTable
        columns={["Gross amount", "Commission", "Type", "Company", "User", "Created at"]}
        icon={<Rocket className="w-8 h-8 text-white/20" />}
        title="No affiliate activity during this period"
        subtitle="Find more products to promote"
        actionLabel="Browse marketplace"
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] p-5 flex flex-col justify-between min-h-[180px]"
      style={{ background: "rgba(255,255,255,0.02)" }}>
      <div>
        <p className="text-sm text-white/50 mb-1">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.04]">
        <span className="text-[11px] text-white/20">Mar 3</span>
        <div className="flex-1 mx-4 flex items-center justify-center">
          <span className="text-[11px] text-white/30 px-2 py-0.5 rounded bg-white/5">No data available</span>
        </div>
        <span className="text-[11px] text-white/20">Today</span>
      </div>
    </div>
  );
}
