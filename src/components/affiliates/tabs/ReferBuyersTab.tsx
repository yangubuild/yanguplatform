import { useState } from "react";
import { ChevronRight, Plus, Search, Rocket, ChevronLeft, Copy, ChevronDown, Check } from "lucide-react";
import { AffEmptyTable } from "../shared/AffEmptyTable";
import { toast } from "sonner";
import { useAffiliateJoin } from "../AffiliateJoinContext";
import type { AffiliateOffer } from "@/lib/affiliateCanonicalData";

interface Props {
  isAuthenticated: boolean;
  onOpenMarketplace?: () => void;
  onGatedAction?: () => void;
}

export function ReferBuyersTab({ isAuthenticated, onOpenMarketplace, onGatedAction }: Props) {
  const { hotOffers, isJoined, joinAffiliate } = useAffiliateJoin();
  const [viewAssetsProgram, setViewAssetsProgram] = useState<string | null>(null);

  const handleAddOffer = (offer: AffiliateOffer) => {
    joinAffiliate(offer.id, offer.name);
  };

  // Build joined list from hotOffers + all canonical that are joined
  const { marketplaceListings } = useAffiliateJoin();
  const allJoinedOffers = [
    ...hotOffers.filter(o => isJoined(o.id)),
    ...marketplaceListings
      .filter(m => isJoined(m.id) && !hotOffers.some(o => o.id === m.id))
      .map(m => ({
        id: m.id,
        name: m.company,
        category: m.industryType,
        type: "Recurring",
        price: "-",
        rate: m.commissionRate,
        sales: m.conversions,
        earnings: m.affiliateEarnings,
        conversion: m.conversionRate,
        epc: m.earningsPerClick,
        image: m.avatarUrl,
        avatarUrl: m.avatarUrl,
        color: "#e8732a",
        slug: m.company.toLowerCase().replace(/\s+/g, "-"),
        industry: m.industryType,
      } satisfies AffiliateOffer)),
  ];

  return (
    <div>
      {/* Hot offers */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">Hot offers</h3>
        <button
          onClick={onOpenMarketplace}
          className="flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {hotOffers.map((offer) => (
          <div key={offer.id} className="rounded-xl border border-white/[0.04] overflow-hidden" style={{ background: "#111a15" }}>
            <div className="flex gap-3 p-4 pb-3">
              <div className="w-[120px] h-[72px] rounded-lg overflow-hidden flex-shrink-0">
                <img src={offer.image} alt={offer.name} className="w-full h-full object-cover" />
              </div>
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

          {allJoinedOffers.length === 0 ? (
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
              {allJoinedOffers.map((prog) => (
                <div key={prog.id} className="flex items-center border-b border-white/[0.04] px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-[2] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={prog.avatarUrl || prog.image} alt={prog.name} className="w-full h-full object-cover" />
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
                <span>Showing 1 to {allJoinedOffers.length} of {allJoinedOffers.length}</span>
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

          {/* Your affiliate links */}
          <h3 className="text-base font-semibold text-white mt-8 mb-4">Your affiliate links</h3>
          {allJoinedOffers.length === 0 ? (
            <AffEmptyTable
              columns={["Type", "Name", "Price", "Affiliate rate", "Affiliate link", "Earned", "Clicks", "Users", "Conversion rate"]}
              icon={<Rocket className="w-8 h-8 text-white/20" />}
              title="No affiliate links yet"
              subtitle="Join affiliate programs to generate links"
            />
          ) : (
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
                    {allJoinedOffers.flatMap((prog) => {
                      const slug = prog.slug || prog.name.toLowerCase().replace(/\s+/g, "-");
                      return [
                        {
                          type: "Product",
                          typeBg: "#22c55e",
                          name: prog.name,
                          price: prog.price || "-",
                          rate: prog.rate || "-",
                          link: `https://yangu.studio/${slug}?a=ref123`,
                        },
                        {
                          type: "Company",
                          typeBg: "#f59e0b",
                          name: prog.name,
                          price: "-",
                          rate: "-",
                          link: `https://yangu.studio/${slug}?a=heavyvrasp23`,
                        },
                      ];
                    }).map((link, i) => (
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
                            <button onClick={() => { navigator.clipboard.writeText(link.link); toast.success("Affiliate link copied!"); }} className="text-white/30 hover:text-white flex-shrink-0">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white/60 text-right">$0.00</td>
                        <td className="px-4 py-3 text-sm text-white/60 text-center">0</td>
                        <td className="px-4 py-3 text-sm text-white/60 text-center">0</td>
                        <td className="px-4 py-3 text-sm text-white/60 text-center">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs text-white/30 border-t border-white/[0.04]">
                <span>Showing 1 to {allJoinedOffers.length * 2} of {allJoinedOffers.length * 2}</span>
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
        <ViewAssetsPage
          programName={viewAssetsProgram}
          onClose={() => setViewAssetsProgram(null)}
        />
      )}
    </div>
  );
}

/* ── View Assets Full Page ── */
function ViewAssetsPage({ programName, onClose }: { programName: string; onClose: () => void }) {
  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Affiliate link copied!");
  };

  const slug = programName.toLowerCase().replace(/\s+/g, "-");
  const sampleLinks = [
    { type: "Product", typeBg: "#22c55e", name: programName, price: "$44.00 / month", rate: "30.00%", link: `https://yangu.studio/${slug}?a=ref123`, earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
    { type: "Company", typeBg: "#f59e0b", name: programName, price: "-", rate: "-", link: `https://yangu.studio/${slug}?a=heavyvrasp23`, earned: "$0.00", clicks: 0, users: 0, conversionRate: "-" },
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ background: "#08120D" }}>
      <div className="w-full px-6 py-6">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-white">Your affiliate links — {programName}</h3>
            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-white/20 text-xs text-white/50">
              <span className="text-white/30">⊕</span> Link type
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
    </div>
  );
}
