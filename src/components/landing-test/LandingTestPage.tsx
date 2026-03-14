import { useState } from "react";
import { LandingTestHeader } from "./LandingTestHeader";
import { LandingTestSidebar } from "./LandingTestSidebar";
import { LandingTestHero } from "./LandingTestHero";
import { LandingTestPromptArea } from "./LandingTestPromptArea";
import { LandingTestGettingStarted } from "./LandingTestGettingStarted";
import { PremiumBusinessRow } from "./PremiumBusinessRow";
import { BusinessIdeasRow } from "./BusinessIdeasRow";
import { LandingTestDynamicBanner } from "./LandingTestDynamicBanner";
import { PopularBusinessGrid } from "./PopularBusinessGrid";
import { LandingTestFooter } from "./LandingTestFooter";
import {
  verifiedBusinesses,
  salesCommunityBusinesses,
  mindsetCoachingBusinesses,
  weightLossCoachingBusinesses,
  popularBusinesses,
} from "./landingTestData";

export function LandingTestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#08120D' }}>
      <LandingTestSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="min-h-screen">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
          <LandingTestHeader onMenuClick={() => setSidebarOpen(true)} />
          <LandingTestHero />
          <LandingTestPromptArea />
          <LandingTestGettingStarted />
          <PremiumBusinessRow
            title="Verified Businesses"
            businesses={verifiedBusinesses}
          />
          <BusinessIdeasRow />
          <LandingTestDynamicBanner slot="middle" />
          <PremiumBusinessRow
            title="Sales community"
            subtitle="Network with founders, e-com sellers, and entrepreneurs building real businesses"
            businesses={salesCommunityBusinesses}
          />
          <LandingTestDynamicBanner slot="lower" />
          <PopularBusinessGrid businesses={popularBusinesses} />
          <LandingTestFooter />
        </div>
      </main>
    </div>
  );
}
