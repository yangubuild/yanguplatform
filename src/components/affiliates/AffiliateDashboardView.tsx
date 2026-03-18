import { useState } from "react";
import { Gift } from "lucide-react";
import { AffDashboardTab } from "./tabs/AffDashboardTab";
import { ReferBuyersTab } from "./tabs/ReferBuyersTab";
import { ReferSellersTab } from "./tabs/ReferSellersTab";
import { AffiliateMarketplacePage } from "./AffiliateMarketplacePage";
import { AffiliateJoinProvider } from "./AffiliateJoinContext";

interface Props {
  isAuthenticated: boolean;
  onSwitchToCreator: () => void;
}

const TABS_AUTH = ["Dashboard", "Refer buyers", "Refer sellers"] as const;
const TABS_PUBLIC = ["Refer buyers", "Refer sellers"] as const;

export function AffiliateDashboardView({ isAuthenticated, onSwitchToCreator }: Props) {
  const tabs = isAuthenticated ? TABS_AUTH : TABS_PUBLIC;
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [showMarketplace, setShowMarketplace] = useState(false);

  return (
    <AffiliateJoinProvider>
      {showMarketplace ? (
        <AffiliateMarketplacePage
          onBack={() => setShowMarketplace(false)}
          onSwitchToCreator={onSwitchToCreator}
          onApplyPartner={() => {
            setShowMarketplace(false);
            setActiveTab("Refer sellers");
          }}
        />
      ) : (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-semibold text-white">Affiliates</h1>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowMarketplace(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <Gift className="w-4 h-4 text-accent" />
                    Affiliate marketplace
                  </button>
                  <button
                    onClick={() => setActiveTab("Refer sellers")}
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
                </>
              ) : (
                <button
                  onClick={() => setActiveTab("Refer sellers")}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-accent/40 text-accent"
                >
                  Apply to be a partner
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-white/[0.06] mt-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab ? "text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "Dashboard" && isAuthenticated && <AffDashboardTab />}
          {activeTab === "Refer buyers" && (
            <ReferBuyersTab
              isAuthenticated={isAuthenticated}
              onOpenMarketplace={() => setShowMarketplace(true)}
            />
          )}
          {activeTab === "Refer sellers" && <ReferSellersTab />}
        </div>
      )}
    </AffiliateJoinProvider>
  );
}
