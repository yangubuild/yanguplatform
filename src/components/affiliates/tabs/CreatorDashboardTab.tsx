import { useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Percent, Users, Link2, Rocket } from "lucide-react";
import { AffEmptyTable } from "../shared/AffEmptyTable";

export function CreatorDashboardTab() {
  const [metric, setMetric] = useState("New users from affiliates");
  const [period, setPeriod] = useState("Last 1 month");

  return (
    <div>
      {/* Metric selector + period */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button className="flex items-center gap-1 text-sm text-white/60 mb-1">
            {metric} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 border border-white/[0.06]">
          <Calendar className="w-3.5 h-3.5" />
          {period}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chart area placeholder */}
      <div className="rounded-xl border border-white/[0.04] p-6 mb-6 min-h-[200px] flex flex-col justify-end" style={{ background: "#111a15" }}>
        <div className="h-[160px] flex items-end border-b border-white/[0.04] mb-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 border-l border-dashed border-white/5 h-full" />
          ))}
        </div>
        <div className="flex items-center gap-6 text-[11px] text-white/40">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-cyan-400 inline-block" /> Direct</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-orange-400 inline-block" /> Discover</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-green-400 inline-block" /> Affiliates</span>
        </div>
      </div>

      {/* Action cards */}
      <div className="rounded-xl border border-white/[0.04] divide-y divide-white/[0.04] mb-8" style={{ background: "#111a15" }}>
        <ActionRow
          icon={<Percent className="w-5 h-5 text-white/40" />}
          title="Set the affiliate commission for a specific product"
          subtitle="All your products have a 30% commission by default"
        />
        <ActionRow
          icon={<Users className="w-5 h-5 text-white/40" />}
          title="Set an affiliate commission for a specific user"
          subtitle="Invite a user to give them special rates"
        />
        <ActionRow
          icon={<Link2 className="w-5 h-5 text-white/40" />}
          title="External links"
          subtitle="Set external sales page links you want affiliates to promote."
        />
      </div>

      {/* Leaderboard */}
      <h3 className="text-base font-semibold text-white mb-4">Leaderboard</h3>
      <AffEmptyTable
        columns={["User", "Referrals", "Rewards (USD)", "Past three month retention"]}
        icon={<Rocket className="w-8 h-8 text-white/20" />}
        title="No affiliates yet"
        subtitle="Add affiliates to expand your reach by incentivizing users to refer their friends to your yangu."
      />
    </div>
  );
}

function ActionRow({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
    </button>
  );
}
