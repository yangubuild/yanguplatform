import { useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AffDashboardTab } from "./tabs/AffDashboardTab";
import { ReferBuyersTab } from "./tabs/ReferBuyersTab";
import { ReferSellersTab } from "./tabs/ReferSellersTab";
import { AffiliateMarketplacePage } from "./AffiliateMarketplacePage";
import { AffiliateJoinProvider } from "./AffiliateJoinContext";
import { AffiliateSignupGateModal } from "./AffiliateSignupGateModal";

interface Props {
  isAuthenticated: boolean;
  onSwitchToCreator: () => void;
  isLandingPage?: boolean;
}

const TABS_AUTH = ["Dashboard", "Refer buyers", "Refer sellers"] as const;
const TABS_PUBLIC = ["Refer buyers", "Refer sellers"] as const;

export function AffiliateDashboardView({ isAuthenticated, onSwitchToCreator, isLandingPage }: Props) {
  const tabs = (isAuthenticated && !isLandingPage) ? TABS_AUTH : TABS_PUBLIC;
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showSignupGate, setShowSignupGate] = useState(false);

  const handlePublicGatedAction = () => {
    if (isLandingPage || !isAuthenticated) {
      setShowSignupGate(true);
    } else {
      setShowMarketplace(true);
    }
  };

  return (
    <AffiliateJoinProvider>
      {showMarketplace && isAuthenticated ? (
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">Affiliates</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {isAuthenticated && !isLandingPage ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowMarketplace(true)}>
                    <Gift className="w-4 h-4 text-accent" />
                    <span className="hidden sm:inline">Affiliate marketplace</span>
                    <span className="sm:hidden">Marketplace</span>
                  </Button>
                  <Button variant="accent-light" size="sm" onClick={() => setActiveTab("Refer sellers")}>
                    <span className="hidden sm:inline">Apply to be a partner</span>
                    <span className="sm:hidden">Apply</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={onSwitchToCreator}>
                    <span className="hidden sm:inline">Creator dashboard</span>
                    <span className="sm:hidden">Creator</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handlePublicGatedAction}>
                    <Gift className="w-4 h-4 text-accent" />
                    <span className="hidden sm:inline">Affiliate marketplace</span>
                    <span className="sm:hidden">Marketplace</span>
                  </Button>
                  <Button variant="accent-light" size="sm" onClick={() => setActiveTab("Refer sellers")}>
                    <span className="hidden sm:inline">Apply to be a partner</span>
                    <span className="sm:hidden">Apply</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 sm:gap-6 border-b border-white/[0.06] mt-2 mb-6 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-muted-foreground"
                }`}>
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
              onOpenMarketplace={handlePublicGatedAction}
              onGatedAction={!isAuthenticated ? () => setShowSignupGate(true) : undefined}
            />
          )}
          {activeTab === "Refer sellers" && <ReferSellersTab />}
        </div>
      )}

      {/* Signup gate popup for anonymous users */}
      {showSignupGate && (
        <AffiliateSignupGateModal onClose={() => setShowSignupGate(false)} />
      )}
    </AffiliateJoinProvider>
  );
}
