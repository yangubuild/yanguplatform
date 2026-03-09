import { useState } from "react";
import { ChevronRight, Plus, Search, Rocket, ChevronLeft, Copy, X, ChevronDown, Check } from "lucide-react";
import { AffEmptyTable } from "../shared/AffEmptyTable";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface Props {
  isAuthenticated: boolean;
}

interface Offer {
  id: string;
  name: string;
  category: string;
  type: string;
  price: string;
  rate: string;
  sales: string;
  earnings: string;
  conversion: string;
  epc: string;
  image: string;
  color: string;
}

const ALL_OFFERS: Offer[] = [
  {
    id: "1",
    name: "KingCapSports Full Access",
    category: "Sports Picks Group",
    type: "One-time",
    price: "$50.00",
    rate: "30%",
    sales: "10,000+",
    earnings: "$100k+",
    conversion: "12.26%",
    epc: "$8.53",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=160&fit=crop",
    color: "#e8732a",
  },
  {
    id: "2",
    name: "ToolSuite VIP Access",
    category: "Subscription Account Sharing",
    type: "Recurring",
    price: "$29.95 / month",
    rate: "50%",
    sales: "10,000+",
    earnings: "$250k+",
    conversion: "7.25%",
    epc: "$2.59",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=160&fit=crop",
    color: "#4a90d9",
  },
  {
    id: "3",
    name: "PokePings Premium",
    category: "Other General",
    type: "Recurring",
    price: "$8.99 / month",
    rate: "50%",
    sales: "1,000+",
    earnings: "$1k+",
    conversion: "6.25%",
    epc: "$0.19",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=300&h=160&fit=crop",
    color: "#6366f1",
  },
];

const SAMPLE_LINKS = [
  { type: "Product", typeBg: "#22c55e", name: "Deal Soldier", price: "$44.00 / month", rate: "30.00%", link: "https://yangu.studio/deal-soldier/deal-soldier?a=...", earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
  { type: "Company", typeBg: "#f59e0b", name: "DEAL SOLDIER", price: "-", rate: "-", link: "https://yangu.studio/deal-soldier?a=heavyvrasp23", earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
];

export function ReferBuyersTab({ isAuthenticated }: Props) {
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [viewAssetsProgram, setViewAssetsProgram] = useState<string | null>(null);
  const [joinedOffers, setJoinedOffers] = useState<Offer[]>([]);

  const handleAddOffer = (offer: Offer) => {
    if (joinedOffers.find(o => o.id === offer.id)) {
      toast.info("Already added to your programs");
      return;
    }
    setJoinedOffers(prev => [...prev, offer]);
    toast.success(`${offer.name} added to your affiliate programs`);
  };

  const isJoined = (id: string) => joinedOffers.some(o => o.id === id);

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
        {ALL_OFFERS.map((offer) => (
          <div key={offer.id} className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
            <div className="flex gap-3 p-4 pb-3">
              {/* Thumbnail */}
              <div className="w-[120px] h-[72px] rounded-lg overflow-hidden flex-shrink-0">
                <img src={offer.image} alt={offer.name} className="w-full h-full object-cover" />
              </div>
              {/* Title + category */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-medium text-white leading-tight">{offer.name}</p>
                  <button
                    onClick={() => handleAddOffer(offer)}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isJoined(offer.id)
                        ? "border-green-500/40 text-green-400 bg-green-500/10"
                        : "border-white/[0.06] text-white/40 hover:text-white"
                    }`}
                  >
                    {isJoined(offer.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {offer.category} • <span className="text-white/50 bg-white/[0.06] px-1.5 py-0.5 rounded text-[10px]">{offer.type}</span>
                </p>
              </div>
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-y-2 text-[11px] px-4 pb-4">
              <div><span className="text-white/30">Product price</span><br /><span className="text-white/80 font-medium">{offer.price}</span></div>
              <div><span className="text-white/30">Commission rate</span><br /><span className="text-white/80 font-medium">{offer.rate}</span></div>
              <div><span className="text-white/30">Affiliate sales</span><br /><span className="text-white/80 font-medium">{offer.sales}</span></div>
              <div><span className="text-white/30">Affiliate earnings</span><br /><span className="text-white/80 font-medium">{offer.earnings}</span></div>
              <div><span className="text-white/30">Conversion rate</span><br /><span className="text-white/80 font-medium">{offer.conversion}</span></div>
              <div><span className="text-white/30">Earnings per click</span><br /><span className="text-white/80 font-medium">{offer.epc}</span></div>
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

          {joinedOffers.length === 0 ? (
            <AffEmptyTable
              columns={["Company", "Clicks", "Conversions", "Earnings", "Assets"]}
              icon={<Rocket className="w-8 h-8 text-white/20" />}
              title="No affiliate programs yet"
              subtitle="Join affiliate programs to start earning"
            />
          ) : (
            <div className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
              <div className="flex items-center border-b border-white/[0.04] px-4 py-3">
                <div className="flex-[2] text-xs text-white/30 font-medium">Company</div>
                <div className="flex-1 text-xs text-white/30 font-medium text-center">Clicks</div>
                <div className="flex-1 text-xs text-white/30 font-medium text-center">Conversions</div>
                <div className="flex-1 text-xs text-white/30 font-medium text-center">Earnings</div>
                <div className="flex-1 text-xs text-white/30 font-medium text-center">Assets</div>
              </div>
              {joinedOffers.map((prog) => (
                <div key={prog.id} className="flex items-center border-b border-white/[0.04] px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-[2] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={prog.image} alt={prog.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-white font-medium">{prog.name}</span>
                  </div>
                  <div className="flex-1 text-sm text-white/60 text-center">0</div>
                  <div className="flex-1 text-sm text-white/60 text-center">0</div>
                  <div className="flex-1 text-sm text-white/60 text-center">$0.00</div>
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
              <div className="flex items-center justify-between px-4 py-3 text-xs text-white/30">
                <span>Showing 1 to {joinedOffers.length} of {joinedOffers.length}</span>
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
          )}

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
