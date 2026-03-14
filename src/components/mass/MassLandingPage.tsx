import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "./MassSidebar";
import { MassHeader } from "./MassHeader";
import { MassHero } from "./MassHero";
import { MassSearchBar } from "./MassSearchBar";
import { LandingTestPromptArea } from "@/components/landing-test/LandingTestPromptArea";
import { LandingTestGettingStarted } from "@/components/landing-test/LandingTestGettingStarted";
import { PremiumBusinessRow } from "@/components/landing-test/PremiumBusinessRow";
import { BusinessIdeasRow } from "@/components/landing-test/BusinessIdeasRow";
import { LandingTestDynamicBanner } from "@/components/landing-test/LandingTestDynamicBanner";
import { PopularBusinessGrid } from "@/components/landing-test/PopularBusinessGrid";
import { LandingTestFooter } from "@/components/landing-test/LandingTestFooter";
import {
  verifiedBusinesses,
  salesCommunityBusinesses,
  mindsetCoachingBusinesses,
  weightLossCoachingBusinesses,
  popularBusinesses,
} from "@/components/landing-test/landingTestData";

export function MassLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div 
      className="min-h-screen"
      style={{
        background: '#08120D',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8">
          <MassHeader />
          <MassHero />
          <MassSearchBar />

          {/* Lower body transplanted from /landingtest */}
          <LandingTestPromptArea />
          <LandingTestGettingStarted />
          <PremiumBusinessRow
            title="Verified Businesses"
            businesses={verifiedBusinesses}
          />
          <BusinessIdeasRow />
          <PremiumBusinessRow
            title="Sales community"
            subtitle="Network with founders, e-com sellers, and entrepreneurs building real businesses"
            businesses={salesCommunityBusinesses}
          />
          <PremiumBusinessRow
            title="Mindset coaching"
            subtitle="Level up your mindset, productivity, public speaking, and leadership skills"
            businesses={mindsetCoachingBusinesses}
          />
          <LandingTestDynamicBanner slot="middle" />
          <PremiumBusinessRow
            title="Weight loss coaching"
            subtitle="Custom workout plans, nutrition coaching, and accountability from certified trainers"
            businesses={weightLossCoachingBusinesses}
          />
          <LandingTestDynamicBanner slot="lower" />
          <PopularBusinessGrid businesses={popularBusinesses} />
          <LandingTestFooter />
        </div>
      </main>
    </div>
  );
}
