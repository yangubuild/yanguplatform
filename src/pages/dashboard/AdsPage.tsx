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
    <div className="min-h-screen" style={{ background: "#08120D" }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Ads</h1>
          <Button
            variant="accent"
            onClick={() => setShowWizard(true)}
            className="rounded-xl px-5 h-10"
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
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#b5622a" }} />
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24">
          <div
            className="w-32 h-32 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: "rgba(181,98,42,0.1)" }}
          >
            <Megaphone className="w-16 h-16" style={{ color: "rgba(181,98,42,0.6)" }} />
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-3">
            Reach millions through YANGU ads
          </h2>
          <p className="text-muted-foreground text-sm text-center max-w-md mb-8">
            Target high intent users via search, explore, and platform surfaces
          </p>

          <Button
            variant="accent"
            onClick={() => setShowWizard(true)}
            className="rounded-xl px-6 h-11"
          >
            Launch new campaign
          </Button>
        </div>
      </div>
    </div>
  );
}
