import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignWizard } from "@/components/ads/CampaignWizard";

const TABS = ["Campaigns", "Creatives", "Audiences", "Connections"] as const;

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState<string>("Campaigns");
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <CampaignWizard onClose={() => setShowWizard(false)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Ads</h1>
          <Button
            onClick={() => setShowWizard(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 h-10"
          >
            Launch new campaign
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 border-b border-white/10 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24">
          <div
            className="w-32 h-32 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: "rgba(59,130,246,0.08)" }}
          >
            <Megaphone className="w-16 h-16 text-blue-500/60" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-3">
            Reach millions through YANGU ads
          </h2>
          <p className="text-white/40 text-sm text-center max-w-md mb-8">
            Target high intent users via search, discovery, and platform surfaces
          </p>

          <Button
            onClick={() => setShowWizard(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 h-11"
          >
            Launch new campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
