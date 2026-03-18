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
  useProductEntities,
  useServiceEntities,
  useCommunityEntities,
  useCreatorEntities,
} from "@/hooks/landing/useSearchEntities";
import { useLandingBanners } from "@/hooks/landing/useLandingBanners";
import { rotateForSlots, LANDING_SLOTS } from "@/lib/landingInventory";

export function MassLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Canonical search queries — fetch more than visible slots for rotation pool
  const { data: verifiedEntities } = useVerifiedEntities(20);
  const { data: popularEntities } = usePopularBusinesses(24);
  const { data: productEntities } = useProductEntities(20);
  const { data: serviceEntities } = useServiceEntities(20);
  const { data: communityEntities } = useCommunityEntities(20);
  const { data: creatorEntities } = useCreatorEntities(20);

  // Editable banners
  const { data: banners } = useLandingBanners();

  // Apply fixed slot rotation — landing never expands into extra rows
  const verifiedSlotted = rotateForSlots(verifiedEntities ?? [], LANDING_SLOTS["verified-businesses"]);
  const productSlotted = rotateForSlots(productEntities ?? [], LANDING_SLOTS["products"]);
  const serviceSlotted = rotateForSlots(serviceEntities ?? [], LANDING_SLOTS["services"]);
  const creatorSlotted = rotateForSlots(creatorEntities ?? [], LANDING_SLOTS["influencers-creators"]);
  const communitySlotted = rotateForSlots(communityEntities ?? [], LANDING_SLOTS["community"]);
  const popularSlotted = rotateForSlots(popularEntities ?? [], LANDING_SLOTS["popular-grid"]);

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
          {/* Banner 1: Fixed system banner — non-editable */}
          <MassHero />

          {/* Build/Explore input — wired to canonical search + ADA prompt transfer */}
          <LandingTestPromptArea />
          <LandingTestGettingStarted />

          {/* Verified — live data with static fallback, fixed slots */}
          <PremiumBusinessRow
            title="Verified Businesses"
            entities={verifiedSlotted.length > 0 ? verifiedSlotted : undefined}
            businesses={verifiedBusinesses}
          />

          <BusinessIdeasRow />

          {/* Products — fixed slots with rotation */}
          <PremiumBusinessRow
            title="Products"
            subtitle="Shop products from verified sellers and businesses on yangu"
            entities={productSlotted.length > 0 ? productSlotted : undefined}
            businesses={salesCommunityBusinesses}
          />

          {/* Services — fixed slots with rotation */}
          <PremiumBusinessRow
            title="Services"
            subtitle="Find expert services from coaches, consultants, and freelancers"
            entities={serviceSlotted.length > 0 ? serviceSlotted : undefined}
            businesses={mindsetCoachingBusinesses}
          />

          {/* Influencers / Creators — fixed slots with rotation */}
          <PremiumBusinessRow
            title="Influencers / Creators"
            subtitle="Discover influencers, coaches, and content creators building on yangu"
            entities={creatorSlotted.length > 0 ? creatorSlotted : undefined}
            businesses={mindsetCoachingBusinesses}
          />

          {/* Banner 2: Editable via management panel */}
          <LandingTestDynamicBanner slot="middle" bannerData={banners?.middle} />

          {/* Community — fixed slots with rotation */}
          <PremiumBusinessRow
            title="Community"
            subtitle="Join communities for learning, networking, and growth"
            entities={communitySlotted.length > 0 ? communitySlotted : undefined}
            businesses={weightLossCoachingBusinesses}
          />

          {/* Banner 3: Editable via management panel */}
          <LandingTestDynamicBanner slot="lower" bannerData={banners?.lower} />

          {/* Popular businesses — fixed grid slots with rotation */}
          <PopularBusinessGrid
            entities={popularSlotted.length > 0 ? popularSlotted : undefined}
            businesses={popularBusinesses}
          />

          <LandingTestFooter />
        </div>
      </main>
    </div>
  );
}
