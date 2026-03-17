import { useState } from "react";
import { Menu } from "lucide-react";
import { MassSidebar } from "./MassSidebar";
import { MassHeader } from "./MassHeader";
import { MassHero } from "./MassHero";
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
import {
  useVerifiedEntities,
  usePopularBusinesses,
  useServiceEntities,
  useCommunityEntities,
  useCreatorEntities,
} from "@/hooks/landing/useSearchEntities";

export function MassLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Canonical search queries
  const { data: verifiedEntities } = useVerifiedEntities(12);
  const { data: popularEntities } = usePopularBusinesses(16);
  const { data: serviceEntities } = useServiceEntities(8);
  const { data: communityEntities } = useCommunityEntities(8);
  const { data: creatorEntities } = useCreatorEntities(8);

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

          {/* Build/Explore input — wired to canonical search + ADA prompt transfer */}
          <LandingTestPromptArea />
          <LandingTestGettingStarted />

          {/* Verified — live data with static fallback */}
          <PremiumBusinessRow
            title="Verified Businesses"
            entities={verifiedEntities}
            businesses={verifiedBusinesses}
          />

          <BusinessIdeasRow />

          {/* Services — canonical search */}
          <PremiumBusinessRow
            title="Services"
            subtitle="Find expert services from coaches, consultants, and freelancers"
            entities={serviceEntities}
            businesses={salesCommunityBusinesses}
          />

          {/* Creators — canonical search */}
          <PremiumBusinessRow
            title="Creators"
            subtitle="Discover influencers, coaches, and content creators building on yangu"
            entities={creatorEntities}
            businesses={mindsetCoachingBusinesses}
          />

          <LandingTestDynamicBanner slot="middle" />

          {/* Community — canonical search */}
          <PremiumBusinessRow
            title="Community"
            subtitle="Join communities for learning, networking, and growth"
            entities={communityEntities}
            businesses={weightLossCoachingBusinesses}
          />

          <LandingTestDynamicBanner slot="lower" />

          {/* Popular businesses — canonical search with visibility tier ranking */}
          <PopularBusinessGrid
            entities={popularEntities}
            businesses={popularBusinesses}
          />

          <LandingTestFooter />
        </div>
      </main>
    </div>
  );
}
