import { useState, useRef, useEffect } from "react";
import {
  Calendar, ChevronDown, ChevronRight, Percent, Users, Link2, Rocket,
  X, Eye, ChevronUp, Search, ExternalLink, Plus, MoreVertical, Check
} from "lucide-react";
import { AffEmptyTable } from "../shared/AffEmptyTable";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { toast } from "sonner";

// ── helpers ──────────────────────────────────────────────────────────
function generateChartData(days: number) {
  const data: { date: string; direct: number; explore: number; affiliates: number }[] = [];
  const now = new Date();

  // For large ranges, aggregate into fewer points
  let step = 1;
  let formatOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (days <= 2) {
    // 48h: show hourly (48 points)
    const points: typeof data = [];
    for (let i = 47; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const label = d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
      const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      points.push({
        date: i % 6 === 0 ? `${datePart} ${label}` : label,
        direct: Math.floor(Math.random() * 3),
        explore: Math.floor(Math.random() * 2),
        affiliates: Math.floor(Math.random() * 2),
      });
    }
    return points;
  } else if (days <= 30) {
    step = 1;
    formatOpts = { month: "short", day: "numeric" };
  } else if (days <= 180) {
    step = 7; // weekly
    formatOpts = { month: "short", day: "numeric" };
  } else {
    step = 30; // monthly
    formatOpts = { month: "short", year: "2-digit" };
  }

  for (let i = Math.floor(days / step) - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * step);
    const scale = days <= 30 ? 1 : days <= 180 ? 7 : 30;
    data.push({
      date: d.toLocaleDateString("en-US", formatOpts),
      direct: Math.floor(Math.random() * 5 * scale),
      explore: Math.floor(Math.random() * 3 * scale),
      affiliates: Math.floor(Math.random() * 4 * scale),
    });
  }
  return data;
}

const PERIOD_OPTIONS = [
  { label: "Last 48 hours", days: 2 },
  { label: "Last 1 month", days: 30 },
  { label: "Last 6 months", days: 180 },
  { label: "Last 2 years", days: 730 },
];

// ── custom tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  const direct = payload.find((p: any) => p.dataKey === "direct")?.value ?? 0;
  const explore = payload.find((p: any) => p.dataKey === "explore")?.value ?? 0;
  const affiliates = payload.find((p: any) => p.dataKey === "affiliates")?.value ?? 0;
  const total = direct + explore + affiliates;
  const pct = (v: number) => (total === 0 ? "0%" : ((v / total) * 100).toFixed(0) + "%");

  return (
    <div className="rounded-lg border border-white/10 p-3 text-xs min-w-[180px]" style={{ background: "#1a1a1a" }}>
      <p className="text-white font-semibold mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Direct</span>
          <span className="text-white/70">{direct}</span>
          <span className="text-white/40">{pct(direct)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Explore</span>
          <span className="text-white/70">{explore}</span>
          <span className="text-white/40">{pct(explore)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Affiliates</span>
          <span className="text-white/70">{affiliates}</span>
          <span className="text-white/40">{pct(affiliates)}</span>
        </div>
      </div>
    </div>
  );
}

const Y_TICKS = [0, 2, 5, 7, 10, 12, 15, 17, 20];

// ── main component ──────────────────────────────────────────────────
export function CreatorDashboardTab() {
  const [metric, setMetric] = useState("New users from affiliates");
  const [periodIdx, setPeriodIdx] = useState(1);
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  // Sub-views
  const [activePanel, setActivePanel] = useState<"none" | "commission" | "invite" | "external">("none");

  const period = PERIOD_OPTIONS[periodIdx];
  const chartData = generateChartData(period.days);
  const maxVal = Math.max(10, ...chartData.map(d => Math.max(d.direct, d.explore, d.affiliates)));
  const yMax = Math.ceil(maxVal / 5) * 5;
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i));

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<{ email: string; referrals: number; rewards: string; retention: string }[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Sub-panel: Set commission for product ──
  if (activePanel === "commission") {
    return <CommissionPanel onBack={() => setActivePanel("none")} />;
  }
  // ── Sub-panel: Invite affiliate ──
  if (activePanel === "invite") {
    return (
      <InviteAffiliatePanel
        onBack={() => setActivePanel("none")}
        onInvited={(email) => {
          setLeaderboard((prev) => [
            ...prev,
            { email, referrals: "0" as any, rewards: "$0.00", retention: "0.0%" },
          ]);
          setActivePanel("none");
          toast.success(`${email} invited as affiliate`);
        }}
      />
    );
  }
  // ── Sub-panel: External links ──
  if (activePanel === "external") {
    return <ExternalLinksPanel onBack={() => setActivePanel("none")} />;
  }

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
        <div className="relative" ref={periodRef}>
          <button
            onClick={() => setPeriodOpen(!periodOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 border border-white/[0.06]"
          >
            <Calendar className="w-3.5 h-3.5" />
            {period.label}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {periodOpen && (
            <div className="absolute right-0 mt-1 z-50 rounded-xl border border-white/10 py-1 min-w-[180px]" style={{ background: "#1a1a1a" }}>
              {PERIOD_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  onClick={() => { setPeriodIdx(i); setPeriodOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
                >
                  {i === periodIdx && <Check className="w-4 h-4 text-white" />}
                  {i !== periodIdx && <span className="w-4" />}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/[0.04] p-6 mb-6" style={{ background: "#111a15" }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gDirect" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExplore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#fb923c" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gAff" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="6 6" stroke="rgba(255,255,255,0.06)" horizontal vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 20]} ticks={Y_TICKS} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }} />
            <Area type="monotone" dataKey="direct" stroke="#22d3ee" strokeWidth={2} fill="url(#gDirect)" />
            <Area type="monotone" dataKey="explore" stroke="#fb923c" strokeWidth={2} fill="url(#gExplore)" />
            <Area type="monotone" dataKey="affiliates" stroke="#4ade80" strokeWidth={2} fill="url(#gAff)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 text-[11px] text-white/40 mt-2">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-cyan-400 inline-block" /> Direct</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-orange-400 inline-block" /> Explore</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded bg-green-400 inline-block" /> Affiliates</span>
        </div>
      </div>

      {/* Action cards */}
      <div className="rounded-xl border border-white/[0.04] divide-y divide-white/[0.04] mb-8" style={{ background: "#111a15" }}>
        <ActionRow
          icon={<Percent className="w-5 h-5 text-white/40" />}
          title="Set the affiliate commission for a specific product"
          subtitle="All your products have a 30% commission by default"
          onClick={() => setActivePanel("commission")}
        />
        <ActionRow
          icon={<Users className="w-5 h-5 text-white/40" />}
          title="Set an affiliate commission for a specific user"
          subtitle="Invite a user to give them special rates"
          onClick={() => setActivePanel("invite")}
        />
        <ActionRow
          icon={<Link2 className="w-5 h-5 text-white/40" />}
          title="External links"
          subtitle="Set external sales page links you want affiliates to promote."
          onClick={() => setActivePanel("external")}
        />
      </div>

      {/* Leaderboard */}
      <h3 className="text-base font-semibold text-white mb-4">Leaderboard</h3>
      {leaderboard.length === 0 ? (
        <AffEmptyTable
          columns={["User", "Referrals", "Rewards (USD)", "Past three month retention"]}
          icon={<Rocket className="w-8 h-8 text-white/20" />}
          title="No affiliates yet"
          subtitle="Add affiliates to expand your reach by incentivizing users to refer their friends to your yangu."
        />
      ) : (
        <LeaderboardTable data={leaderboard} />
      )}
    </div>
  );
}

// ── ActionRow ────────────────────────────────────────────────────────
function ActionRow({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors">
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

// ── Leaderboard Table ────────────────────────────────────────────────
function LeaderboardTable({ data }: { data: { email: string; referrals: number; rewards: string; retention: string }[] }) {
  return (
    <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
      <div className="flex items-center border-b border-white/[0.04] px-4 py-3 text-xs text-white/30 font-medium">
        <div className="flex-[2]">User</div>
        <div className="flex-1 text-center">Referrals ↓</div>
        <div className="flex-1 text-center">Rewards (USD)</div>
        <div className="flex-1 text-center">Past three month retention</div>
        <div className="w-8" />
      </div>
      {data.map((row, i) => (
        <div key={i} className="flex items-center px-4 py-3 border-b border-white/[0.04] last:border-0">
          <div className="flex-[2] flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-[10px] text-white font-bold">
              {row.email.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white">{row.email.split("@")[0]}</span>
          </div>
          <div className="flex-1 text-center text-sm text-white">{row.referrals}</div>
          <div className="flex-1 text-center text-sm text-white">{row.rewards}</div>
          <div className="flex-1 text-center text-sm text-white">{row.retention}</div>
          <div className="w-8 flex justify-center">
            <MoreVertical className="w-4 h-4 text-white/30" />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-3 text-xs text-white/40">
        <span>Showing 1 to {data.length} of {data.length}</span>
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/30">‹</button>
          <button className="w-7 h-7 rounded border border-white/20 flex items-center justify-center text-white bg-white/5">1</button>
          <button className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/30">›</button>
          <span className="ml-2">Show</span>
          <button className="flex items-center gap-1 px-2 py-1 rounded border border-white/10 text-white">10 <ChevronDown className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}

// ── Commission Panel (screenshots 4-6) ──────────────────────────────
function CommissionPanel({ onBack }: { onBack: () => void }) {
  const [featuredEnabled, setFeaturedEnabled] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState("Budget-Friendly Meal Prep Kits");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [globalRate, setGlobalRate] = useState(30);
  const [memberRate, setMemberRate] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  if (showPreview) {
    return <CommissionPreview product={selectedProduct} onClose={() => setShowPreview(false)} />;
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-6">
        ← Back to dashboard
      </button>

      {/* Featured product */}
      <div className="rounded-xl border border-white/[0.06] p-5 mb-5" style={{ background: "#111a15" }}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-white">Featured product</h3>
            <p className="text-xs text-white/50 mt-1">
              Choose which product appears on the <span className="text-accent underline cursor-pointer">affiliate marketplace</span> for potential affiliates to discover and promote.
            </p>
          </div>
          <button
            onClick={() => setFeaturedEnabled(!featuredEnabled)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${featuredEnabled ? "bg-accent" : "bg-white/20"}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${featuredEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {featuredEnabled ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 p-2" style={{ background: "#0d1510" }}>
            <Check className="w-4 h-4 text-white/50" />
            <div className="w-7 h-7 rounded bg-accent/50 flex items-center justify-center text-[10px] text-white font-bold">BK</div>
            <span className="text-sm text-white flex-1">{selectedProduct}</span>
            <button onClick={() => setShowPreview(true)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white px-2 py-1 rounded border border-white/10">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-white/10 p-2" style={{ background: "#0d1510" }}>
            <button className="w-full flex items-center justify-between text-sm text-white/50 p-1">
              <span>Select product</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Affiliate instructions */}
      <div className="rounded-xl border border-white/[0.06] p-5 mb-5" style={{ background: "#111a15" }}>
        <h3 className="text-sm font-semibold text-white">Affiliate instructions</h3>
        <p className="text-xs text-white/50 mt-1 mb-3">Include clear affiliate instructions to guide them on how to promote your offer.</p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Provide affiliates rules and guides on how to promote your offer here."
          className="w-full h-[160px] rounded-lg border border-white/10 bg-transparent text-sm text-white p-3 resize-none placeholder:text-white/30 focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Commission per yangu */}
      <div className="rounded-xl border border-white/[0.06] p-5 mb-5" style={{ background: "#111a15" }}>
        <h3 className="text-sm font-semibold text-white">Affiliate commission per yangu</h3>
        <p className="text-xs text-white/50 mt-1 mb-4">
          If an affiliate refers a user to a yangu, they will earn a percentage of the revenue. The default is 30% of the recurring revenue the user pays, but you can set a custom rate depending on which yangu they invite someone to.
        </p>
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] p-3" style={{ background: "#0d1510" }}>
          <div className="w-9 h-9 rounded bg-accent/50 flex items-center justify-center text-[10px] text-white font-bold">BK</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">{selectedProduct}</p>
            <p className="text-xs text-accent">0 members</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-white/40 mb-1">Global affiliate rate ⓘ</p>
              <div className="flex items-center gap-1 rounded border border-white/10 px-2 py-1" style={{ background: "#0d1510" }}>
                <input type="number" value={globalRate} onChange={(e) => setGlobalRate(Number(e.target.value))} className="w-10 bg-transparent text-sm text-white text-center focus:outline-none" />
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3 text-white/30 cursor-pointer" onClick={() => setGlobalRate((v) => v + 1)} />
                  <ChevronDown className="w-3 h-3 text-white/30 cursor-pointer" onClick={() => setGlobalRate((v) => Math.max(0, v - 1))} />
                </div>
                <span className="text-xs text-white/40">%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-white/40 mb-1">Member affiliate rate ⓘ</p>
              <div className="flex items-center gap-1 rounded border border-white/10 px-2 py-1" style={{ background: "#0d1510" }}>
                <input type="number" value={memberRate} onChange={(e) => setMemberRate(Number(e.target.value))} className="w-10 bg-transparent text-sm text-white text-center focus:outline-none" />
                <div className="flex flex-col">
                  <ChevronUp className="w-3 h-3 text-white/30 cursor-pointer" onClick={() => setMemberRate((v) => v + 1)} />
                  <ChevronDown className="w-3 h-3 text-white/30 cursor-pointer" onClick={() => setMemberRate((v) => Math.max(0, v - 1))} />
                </div>
                <span className="text-xs text-white/40">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => { toast.success("Commission settings saved"); onBack(); }}
        className="w-full py-3 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
      >
        Save
      </button>
    </div>
  );
}

// ── Commission Preview (screenshot 6) ───────────────────────────────
function CommissionPreview({ product, onClose }: { product: string; onClose: () => void }) {
  const initials = product.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-[600px] rounded-2xl border border-white/10 p-6" style={{ background: "#1a1f24" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/30 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm">{initials}</div>
            <h2 className="text-lg font-semibold text-white">{product}</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-accent/20 text-accent text-sm text-center py-2 rounded-lg mb-5">
          How new affiliates will see your offer
        </div>

        <div className="w-20 h-20 rounded-xl bg-accent/20 border border-accent/20 flex items-center justify-center text-accent font-bold text-2xl mb-3">
          {initials}
        </div>
        <p className="text-white/60 text-sm mb-4">Meal Kits</p>

        <div className="grid grid-cols-3 gap-x-8 gap-y-4 mb-6">
          {["Product price", "Commission rate", "Affiliate sales", "Affiliate earnings", "Conversion rate", "Earnings per click"].map((label) => (
            <div key={label}>
              <p className="text-xs text-white/40">{label}</p>
              <p className="text-sm text-white mt-0.5">-</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/[0.06]">
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/10 text-sm text-white/70 hover:text-white">
            <ExternalLink className="w-4 h-4" /> View product
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/10 text-sm text-white/70 hover:text-white">
            <Plus className="w-4 h-4" /> Become an affiliate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite Affiliate Panel (screenshots 7-8) ────────────────────────
function InviteAffiliatePanel({ onBack, onInvited }: { onBack: () => void; onInvited: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [reward, setReward] = useState(40);
  const [rewardType, setRewardType] = useState("Percent");
  const [paymentType, setPaymentType] = useState("Recurring payments");
  const [searchProducts, setSearchProducts] = useState("");

  return (
    <div className="flex gap-0">
      {/* Left - faded dashboard behind */}
      <div className="flex-1 opacity-30 pointer-events-none">
        <div className="text-white/30 text-xs">Dashboard content behind...</div>
      </div>

      {/* Right sidebar */}
      <div className="w-[380px] ml-auto border-l border-white/[0.06] p-6 min-h-[600px] flex flex-col" style={{ background: "#111a15" }}>
        <h2 className="text-base font-semibold text-white mb-5">Invite affiliate</h2>

        <label className="text-xs text-white/50 mb-1">User</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="gilfoyle@piedpiper.net"
          className="w-full rounded-lg border border-white/10 bg-transparent text-sm text-white p-2.5 mb-1 placeholder:text-white/30 focus:outline-none focus:border-accent"
        />
        <p className="text-[11px] text-white/40 mb-5">You can add users by their email, yangu username, or yangu user ID.</p>

        <label className="text-xs text-white/50 mb-1">Reward</label>
        <div className="flex gap-2 mb-3">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 flex-1" style={{ background: "#0d1510" }}>
            <input type="number" value={reward} onChange={(e) => setReward(Number(e.target.value))} className="w-12 bg-transparent text-sm text-white focus:outline-none" />
            <div className="flex flex-col">
              <ChevronUp className="w-3 h-3 text-white/30 cursor-pointer" onClick={() => setReward((v) => v + 1)} />
              <ChevronDown className="w-3 h-3 text-white/30 cursor-pointer" onClick={() => setReward((v) => Math.max(0, v - 1))} />
            </div>
            <span className="text-xs text-white/40">%</span>
          </div>
          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value)}
            className="rounded-lg border border-white/10 bg-transparent text-sm text-white px-3 py-1.5 focus:outline-none"
            style={{ background: "#0d1510" }}
          >
            <option value="Percent">Percent</option>
            <option value="Fixed">Fixed</option>
          </select>
        </div>

        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-transparent text-sm text-white px-3 py-2.5 mb-5 focus:outline-none"
          style={{ background: "#0d1510" }}
        >
          <option value="Recurring payments">Recurring payments</option>
          <option value="One-time payment">One-time payment</option>
        </select>

        <label className="text-xs text-white/50 mb-2">Only allow referring to these products:</label>
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchProducts}
            onChange={(e) => setSearchProducts(e.target.value)}
            placeholder="Search products"
            className="w-full rounded-lg border border-white/10 bg-transparent text-sm text-white pl-8 pr-3 py-2 placeholder:text-white/30 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 mb-auto pb-6">
          <ChevronRight className="w-4 h-4 text-white/30" />
          <input type="checkbox" className="rounded border-white/20" />
          <span className="text-sm text-white">Budget-Friendly Meal Prep Kits</span>
        </div>

        <button
          disabled={!email.trim()}
          onClick={() => email.trim() && onInvited(email.trim())}
          className="w-full py-3 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
        >
          Invite
        </button>
      </div>
    </div>
  );
}

// ── External Links Panel (screenshots 9-10) ─────────────────────────
function ExternalLinksPanel({ onBack }: { onBack: () => void }) {
  const [links, setLinks] = useState<{ name: string; url: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  return (
    <div className="relative">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-6">
        ← Back to dashboard
      </button>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">External links</h2>
          <p className="text-xs text-white/50 mt-1">Set external sales page links you want affiliates to promote.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
        >
          Create
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
        <div className="flex items-center border-b border-white/[0.04] px-4 py-3 text-xs text-white/30 font-medium">
          <div className="w-[120px]">Name</div>
          <div className="w-[100px]">Link</div>
          <div className="flex-1 text-center">Clicks</div>
          <div className="flex-1 text-center">Converted users</div>
          <div className="flex-1 text-center">Conversion rate</div>
          <div className="flex-1 text-center">Revenue</div>
        </div>
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-4">
              <Rocket className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-sm font-medium text-white mb-1">No external links yet</p>
            <p className="text-xs text-white/40">Create an external link to allow affiliates to promote your external sales page.</p>
          </div>
        ) : (
          links.map((link, i) => (
            <div key={i} className="flex items-center px-4 py-3 border-b border-white/[0.04] last:border-0 text-sm text-white">
              <div className="w-[120px]">{link.name}</div>
              <div className="w-[100px] text-accent truncate">{link.url}</div>
              <div className="flex-1 text-center">0</div>
              <div className="flex-1 text-center">0</div>
              <div className="flex-1 text-center">0%</div>
              <div className="flex-1 text-center">$0.00</div>
            </div>
          ))
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="w-[380px] h-full border-l border-white/[0.06] p-6 flex flex-col" style={{ background: "#111a15" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-white">Create external link</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <label className="text-xs text-white/50 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name"
              className="w-full rounded-lg border border-white/10 bg-transparent text-sm text-white p-2.5 mb-4 placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />

            <label className="text-xs text-white/50 mb-1">Redirect URL</label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.example.com"
              className="w-full rounded-lg border border-white/10 bg-transparent text-sm text-white p-2.5 mb-4 placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />

            <div className="mt-auto flex items-center justify-between">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-lg text-sm text-white/70 border border-white/10 hover:text-white">
                Cancel
              </button>
              <button
                disabled={!newName.trim() || !newUrl.trim()}
                onClick={() => {
                  setLinks((prev) => [...prev, { name: newName, url: newUrl }]);
                  setNewName("");
                  setNewUrl("");
                  setShowCreate(false);
                  toast.success("External link created");
                }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}