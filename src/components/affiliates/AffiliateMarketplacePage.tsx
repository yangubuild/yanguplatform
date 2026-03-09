import { useState } from "react";
import { ChevronLeft, ChevronDown, Search, Plus, Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onBack: () => void;
  onSwitchToCreator: () => void;
  onApplyPartner: () => void;
}

interface MarketplaceListing {
  id: string;
  company: string;
  icon: string;
  industryType: string;
  commissionRate: string;
  affiliateEarnings: string;
  conversions: string;
  earningsPerClick: string;
  conversionRate: string;
  isJoined: boolean;
}

const MARKETPLACE_DATA: MarketplaceListing[] = [
  { id: "1", company: "KingCapSports", icon: "🏀", industryType: "Sports Picks Group", commissionRate: "30%", affiliateEarnings: "$100k+", conversions: "10,000+", earningsPerClick: "$8.53", conversionRate: "12.26%", isJoined: false },
  { id: "2", company: "ToolSuite", icon: "🔧", industryType: "Subscription Account Sharing", commissionRate: "50%", affiliateEarnings: "$250k+", conversions: "10,000+", earningsPerClick: "$2.59", conversionRate: "7.25%", isJoined: false },
  { id: "3", company: "PokePings", icon: "📡", industryType: "Other General", commissionRate: "50%", affiliateEarnings: "$1k+", conversions: "1,000+", earningsPerClick: "$0.19", conversionRate: "6.25%", isJoined: false },
  { id: "4", company: "DEAL SOLDIER", icon: "🎖️", industryType: "Reselling", commissionRate: "30%", affiliateEarnings: "$500k+", conversions: "10,000+", earningsPerClick: "$0.17", conversionRate: "6.04%", isJoined: false },
  { id: "5", company: "Skylit", icon: "⚡", industryType: "Options Flow Tool", commissionRate: "20%", affiliateEarnings: "$500k+", conversions: "1,000+", earningsPerClick: "$18.23", conversionRate: "2.26%", isJoined: false },
  { id: "6", company: "PokeNotify", icon: "🔔", industryType: "Reselling", commissionRate: "40%", affiliateEarnings: "$100k+", conversions: "10,000+", earningsPerClick: "$0.08", conversionRate: "5.25%", isJoined: false },
  { id: "7", company: "PropFellas", icon: "📊", industryType: "Sports Picks Group", commissionRate: "-", affiliateEarnings: "$250k+", conversions: "10,000+", earningsPerClick: "$1.95", conversionRate: "6.8%", isJoined: false },
  { id: "8", company: "Owls Options Traders", icon: "🦉", industryType: "Options Alerts Group", commissionRate: "15%", affiliateEarnings: "$250k+", conversions: "10,000+", earningsPerClick: "$4.50", conversionRate: "3.54%", isJoined: false },
  { id: "9", company: "Poke Alerts", icon: "🃏", industryType: "Collectibles Community", commissionRate: "40%", affiliateEarnings: "$5k+", conversions: "1,000+", earningsPerClick: "$0.12", conversionRate: "14.43%", isJoined: false },
  { id: "10", company: "House of Stimms", icon: "☕", industryType: "Other General", commissionRate: "30%", affiliateEarnings: "$10k+", conversions: "1,000+", earningsPerClick: "$2.26", conversionRate: "8.43%", isJoined: false },
];

export function AffiliateMarketplacePage({ onBack, onSwitchToCreator, onApplyPartner }: Props) {
  const [listings, setListings] = useState(MARKETPLACE_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAssetsId, setViewAssetsId] = useState<string | null>(null);

  const handleBecomeAffiliate = (id: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, isJoined: true } : l));
    const item = listings.find(l => l.id === id);
    toast.success(`${item?.company} added to your affiliate programs`);
  };

  const filtered = listings.filter(l =>
    l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.industryType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (viewAssetsId) {
    const item = listings.find(l => l.id === viewAssetsId);
    return (
      <MarketplaceViewAssets
        companyName={item?.company || ""}
        onBack={() => setViewAssetsId(null)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-white">Affiliates</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onApplyPartner}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-accent/40 text-accent"
          >
            Apply to be a partner
          </button>
          <button
            onClick={onSwitchToCreator}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:text-white transition-colors"
          >
            Creator dashboard
          </button>
        </div>
      </div>

      {/* Tabs - keep consistent */}
      <div className="flex gap-6 border-b border-white/[0.06] mt-2 mb-6">
        <button className="pb-3 text-sm font-medium text-white/40">Dashboard</button>
        <button className="pb-3 text-sm font-medium text-white relative">
          Refer buyers
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full" />
        </button>
        <button className="pb-3 text-sm font-medium text-white/40">Refer sellers</button>
      </div>

      {/* Back + Title */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">Affiliate marketplace</h3>
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-white/20 text-xs text-white/50">
            <Plus className="w-3 h-3 text-white/30" /> Industry type
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] w-56">
          <Search className="w-4 h-4 text-white/30" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full"
            placeholder="Search"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Company</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Industry type</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Commission rate</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Affiliate earnings</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Conversions</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Earnings per click</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Conversion rate</th>
                <th className="text-right text-xs text-white/30 font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((listing) => (
                <tr key={listing.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{listing.icon}</span>
                      <span className="text-sm text-white font-medium">{listing.company}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{listing.industryType}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{listing.commissionRate}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{listing.affiliateEarnings}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{listing.conversions}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{listing.earningsPerClick}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{listing.conversionRate}</td>
                  <td className="px-4 py-3 text-right">
                    {listing.isJoined ? (
                      <button
                        onClick={() => setViewAssetsId(listing.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors"
                      >
                        View assets
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBecomeAffiliate(listing.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-white/[0.08] hover:bg-white/[0.04] transition-colors"
                      >
                        Become affiliate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-white/30 border-t border-white/[0.04]">
          <span>Showing 1 to {filtered.length} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-white/30">‹</button>
            <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-white bg-white/[0.06]">1</button>
            <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-white/30">›</button>
          </div>
          <div className="flex items-center gap-2">
            <span>Show</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.06] text-white/60">
              10 <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── View Assets from Marketplace ── */
function MarketplaceViewAssets({ companyName, onBack }: { companyName: string; onBack: () => void }) {
  const sampleLinks = [
    { type: "Product", typeBg: "#22c55e", name: companyName, price: "$44.00 / month", rate: "30.00%", link: `https://yangu.studio/${companyName.toLowerCase().replace(/\s/g, "-")}?a=ref123`, earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
    { type: "Company", typeBg: "#f59e0b", name: companyName, price: "-", rate: "-", link: `https://yangu.studio/${companyName.toLowerCase().replace(/\s/g, "-")}?a=heavyvrasp23`, earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
  ];

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Affiliate link copied!");
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Back to marketplace
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">Your affiliate links — {companyName}</h3>
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-white/20 text-xs text-white/50">
            <Plus className="w-3 h-3 text-white/30" /> Link type
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] w-56">
          <Search className="w-4 h-4 text-white/30" />
          <input className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full" placeholder="Search" />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Type</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Name</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Price</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Affiliate rate</th>
                <th className="text-left text-xs text-white/30 font-medium px-4 py-3">Affiliate link</th>
                <th className="text-right text-xs text-white/30 font-medium px-4 py-3">Earned</th>
                <th className="text-center text-xs text-white/30 font-medium px-4 py-3">Clicks</th>
                <th className="text-center text-xs text-white/30 font-medium px-4 py-3">Users</th>
                <th className="text-center text-xs text-white/30 font-medium px-4 py-3">Conversion rate</th>
              </tr>
            </thead>
            <tbody>
              {sampleLinks.map((link, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${link.typeBg}20`, color: link.typeBg }}>
                      {link.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{link.name}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{link.price}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{link.rate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/60 truncate max-w-[240px]">{link.link}</span>
                      <button onClick={() => handleCopy(link.link)} className="text-white/30 hover:text-white flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60 text-right">{link.earned}</td>
                  <td className="px-4 py-3 text-sm text-white/60 text-center">{link.clicks}</td>
                  <td className="px-4 py-3 text-sm text-white/60 text-center">{link.users}</td>
                  <td className="px-4 py-3 text-sm text-white/60 text-center">{link.conversionRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-white/30 border-t border-white/[0.04]">
          <span>Showing 1 to 2 of 2</span>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-white/30">‹</button>
            <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-white bg-white/[0.06]">1</button>
            <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-white/30">›</button>
          </div>
          <div className="flex items-center gap-2">
            <span>Show</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.06] text-white/60">
              10 <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
