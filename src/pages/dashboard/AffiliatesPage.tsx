import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AffiliateDashboardView } from "@/components/affiliates/AffiliateDashboardView";
import { CreatorDashboardView } from "@/components/affiliates/CreatorDashboardView";

const AffiliatesPage = () => {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<"affiliate" | "creator">("affiliate");

  return (
    <div className="w-full min-h-screen px-6 py-6 bg-background" >
      {view === "affiliate" ? (
        <AffiliateDashboardView
          isAuthenticated={isAuthenticated}
          onSwitchToCreator={() => setView("creator")}
        />
      ) : (
        <CreatorDashboardView onBack={() => setView("affiliate")} />
      )}
    </div>
  );
};

export default AffiliatesPage;
