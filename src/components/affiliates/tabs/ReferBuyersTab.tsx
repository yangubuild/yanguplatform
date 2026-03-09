import { useState } from "react";
import { ChevronRight, Plus, Search, Rocket, ChevronLeft } from "lucide-react";
import { AffEmptyTable } from "../shared/AffEmptyTable";

interface Props {
  isAuthenticated: boolean;
}

const SAMPLE_OFFERS = [
  { name: "Premium Starter Kit", category: "Digital Products", type: "One-time", price: "$50.00", rate: "30%", sales: "10,000+", earnings: "$100k+", conversion: "12.27%", epc: "$8.54" },
  { name: "Growth Toolkit Pro", category: "Subscription", type: "Recurring", price: "$29.95 / month", rate: "50%", sales: "10,000+", earnings: "$250k+", conversion: "7.25%", epc: "$2.58" },
  { name: "Creator Essentials", category: "Other General", type: "Recurring", price: "$8.99 / month", rate: "50%", sales: "1,000+", earnings: "$1k+", conversion: "6.25%", epc: "$0.19" },
];

export function ReferBuyersTab({ isAuthenticated }: Props) {
  const [showMarketplace, setShowMarketplace] = useState(false);

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
          <div key={offer.name} className="rounded-xl border border-white/8 p-4" style={{ background: "#141A21" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-white">{offer.name}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {offer.category} • <span className="text-white/50 bg-white/8 px-1.5 py-0.5 rounded text-[10px]">{offer.type}</span>
                </p>
              </div>
              <button className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white">
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
        ))}
      </div>

      {/* Your affiliate programs */}
      {isAuthenticated && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Your affiliate programs</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 w-56">
              <Search className="w-4 h-4 text-white/30" />
              <input className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-full" placeholder="Search" />
            </div>
          </div>

          <AffEmptyTable
            columns={["Company", "Clicks", "Conversions", "Earnings", "Assets"]}
            icon={<Rocket className="w-8 h-8 text-white/20" />}
            title="No affiliate programs yet"
            subtitle="Join affiliate programs to start earning"
          />

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
    </div>
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 w-56">
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
