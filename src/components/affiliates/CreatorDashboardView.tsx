import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { CreatorDashboardTab } from "./tabs/CreatorDashboardTab";
import { AffiliatePortalTab } from "./tabs/AffiliatePortalTab";
import { RevenueShareTab } from "./tabs/RevenueShareTab";

const TABS = ["Creator dashboard", "Affiliate portal", "Revenue share"] as const;

interface Props {
  onBack: () => void;
}

export function CreatorDashboardView({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<string>(TABS[0]);

  const handleBack = () => {
    onBack();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-white">Affiliates</h1>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Affiliate dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/[0.06] mt-2 mb-6">
        {TABS.map((tab) => (
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

      {activeTab === "Creator dashboard" && <CreatorDashboardTab />}
      {activeTab === "Affiliate portal" && <AffiliatePortalTab />}
      {activeTab === "Revenue share" && <RevenueShareTab />}
    </div>
  );
}
