import { useState } from "react";
import { ChevronRight, Plus, Search, Rocket, ChevronLeft, Copy, X, ChevronDown } from "lucide-react";
import { AffEmptyTable } from "../shared/AffEmptyTable";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface Props {
  isAuthenticated: boolean;
}

const SAMPLE_OFFERS = [
  {
    name: "KingCapS...",
    category: "Sports Picks Group",
    type: "One-time",
    price: "$50.00",
    rate: "30%",
    sales: "10,000+",
    earnings: "$100k+",
    conversion: "12.26%",
    epc: "$8.53",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=160&fit=crop",
  },
  {
    name: "ToolSuite ...",
    category: "Subscription Account Sharing",
    type: "Recurring",
    price: "$29.95 / month",
    rate: "50%",
    sales: "10,000+",
    earnings: "$250k+",
    conversion: "7.25%",
    epc: "$2.59",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=160&fit=crop",
  },
  {
    name: "PokePings ...",
    category: "Other General",
    type: "Recurring",
    price: "$8.99 / month",
    rate: "50%",
    sales: "1,000+",
    earnings: "$1k+",
    conversion: "6.25%",
    epc: "$0.19",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&h=160&fit=crop",
  },
];

const SAMPLE_PROGRAMS = [
  { name: "DEAL SOLDIER", icon: "🎮", color: "#4a90d9", clicks: 0, conversions: 0, earnings: "$0.00" },
  { name: "Whop Partners", icon: "🧡", color: "#e8732a", clicks: 0, conversions: 0, earnings: "$0.00" },
  { name: "Urban Oasis Salon & Spa", icon: "US", color: "#22c55e", clicks: 0, conversions: 0, earnings: "$0.00" },
  { name: "Fresh & Wholesome Foods Co.", icon: "FC", color: "#6366f1", clicks: 0, conversions: 0, earnings: "$0.00" },
];

const SAMPLE_LINKS = [
  { type: "Product", typeBg: "#22c55e", name: "Deal Soldier", price: "$44.00 / month", rate: "30.00%", link: "https://yangu.studio/deal-soldier/deal-soldier?a=...", earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
  { type: "Company", typeBg: "#f59e0b", name: "DEAL SOLDIER", price: "-", rate: "-", link: "https://yangu.studio/deal-soldier?a=heavyvrasp23", earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
];

export function ReferBuyersTab({ isAuthenticated }: Props) {
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [viewAssetsProgram, setViewAssetsProgram] = useState<string | null>(null);

  if (showMarketplace) {
    return <AffiliateMarketplace onBack={() => setShowMarketplace(false)} />;
  }

  return (
    <div>
      {/* Hot offers */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">Hot offers</h3>
        <button
          onClick={() => setShowMarketplace(true)}
          className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {SAMPLE_OFFERS.map((offer) => (
          <div key={offer.name} className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
            {/* Product image */}
            <div className="w-full h-[120px] overflow-hidden">
              <img src={offer.image} alt={offer.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white">{offer.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {offer.category} • <span className="text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded text-[10px]">{offer.type}</span>
                  </p>
                </div>
                <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-y-2 text-[11px]">
                <div><span className="text-white/30">Product price</span><br /><span className="text-white/80 font-medium">{offer.price}</span></div>
                <div><span className="text-white/30">Commission rate</span><br /><span className="text-white/80 font-medium">{offer.rate}</span></div>
                <div><span className="text-white/30">Affiliate sales</span><br /><span className="text-white/80 font-medium">{offer.sales}</span></div>
                <div><span className="text-white/30">Affiliate earnings</span><br /><span className="text-white/80 font-medium">{offer.earnings}</span></div>
                <div><span className="text-white/30">Conversion rate</span><br /><span className="text-white/80 font-medium">{offer.conversion}</span></div>
                <div><span className="text-white/30">Earnings per click</span><br /><span className="text-white/80 font-medium">{offer.epc}</span></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Your affiliate programs */}
      {isAuthenticated && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Your affiliate programs</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] w-56">
              <Search className="w-4 h-4 text-white/30" />
              <input className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full" placeholder="Search" />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
            {/* Header */}
            <div className="flex items-center border-b border-white/[0.04] px-4 py-3">
              <div className="flex-[2] text-xs text-white/30 font-medium">Company</div>
              <div className="flex-1 text-xs text-white/30 font-medium text-center">Clicks</div>
              <div className="flex-1 text-xs text-white/30 font-medium text-center">Conversions</div>
              <div className="flex-1 text-xs text-white/30 font-medium text-center">Earnings</div>
              <div className="flex-1 text-xs text-white/30 font-medium text-center">Assets</div>
            </div>
            {/* Rows */}
            {SAMPLE_PROGRAMS.map((prog) => (
              <div key={prog.name} className="flex items-center border-b border-white/[0.04] px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex-[2] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: prog.color }}>
                    {prog.icon}
                  </div>
                  <span className="text-sm text-white font-medium">{prog.name}</span>
                </div>
                <div className="flex-1 text-sm text-white/60 text-center">{prog.clicks}</div>
                <div className="flex-1 text-sm text-white/60 text-center">{prog.conversions}</div>
                <div className="flex-1 text-sm text-white/60 text-center">{prog.earnings}</div>
                <div className="flex-1 text-center">
                  <button
                    onClick={() => setViewAssetsProgram(prog.name)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
                  >
                    View assets
                  </button>
                </div>
              </div>
            ))}
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 text-xs text-white/30">
              <span>Showing 1 to {SAMPLE_PROGRAMS.length} of {SAMPLE_PROGRAMS.length}</span>
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

          {/* Pending applications */}
          <h3 className="text-base font-semibold text-white mt-8 mb-4">Pending applications</h3>
          <AffEmptyTable
            columns={["Company", "Status", "Date", "Actions"]}
            icon={<Rocket className="w-8 h-8 text-white/20" />}
            title="No pending applications"
            subtitle="You don't have any pending affiliate applications."
          />
        </>
      )}

      {/* View Assets Modal */}
      {viewAssetsProgram && (
        <ViewAssetsModal
          programName={viewAssetsProgram}
          onClose={() => setViewAssetsProgram(null)}
        />
      )}
    </div>
  );
}

function ViewAssetsModal({ programName, onClose }: { programName: string; onClose: () => void }) {
  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Affiliate link copied!");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-5xl rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-white">Your affiliate links</h3>
            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-white/20 text-xs text-white/50">
              <span className="text-white/30">⊕</span> Link type
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] w-56">
              <Search className="w-4 h-4 text-white/30" />
              <input className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full" placeholder="Search" />
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table */}
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
              {SAMPLE_LINKS.map((link, i) => (
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

        {/* Pagination */}
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
    </div>,
    document.body
  );
}

function AffiliateMarketplace({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-white">Affiliate marketplace</h3>
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-white/20 text-xs text-white/50">
            <span className="text-white/30">⊕</span> Industry type
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] w-56">
          <Search className="w-4 h-4 text-white/30" />
          <input className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full" placeholder="Search" />
        </div>
      </div>

      <AffEmptyTable
        columns={["Company", "Industry type", "Commission rate", "Affiliate earnings", "Conversions", "Earnings per click", "Conversion rate", "Actions"]}
        icon={<Rocket className="w-8 h-8 text-white/20" />}
        title="No marketplace listings yet"
        subtitle="Check back soon for affiliate opportunities."
      />
    </div>
  );
}
