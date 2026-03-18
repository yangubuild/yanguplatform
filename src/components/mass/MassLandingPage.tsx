import { useState, useMemo } from "react";
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
} from "@/hooks/landing/useSearchEntities";
import { useLandingBanners } from "@/hooks/landing/useLandingBanners";
import { rotateForSlots, LANDING_SLOTS } from "@/lib/landingInventory";

export function MassLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Canonical search queries — fetch pool larger than visible slots for rotation
  const { data: verifiedEntities } = useVerifiedEntities(16);
  const { data: popularEntities } = usePopularBusinesses(32);
  const { data: productEntities } = useProductEntities(16);
  const { data: serviceEntities } = useServiceEntities(16);
  const { data: communityEntities } = useCommunityEntities(16);

  // Editable banners
  const { data: banners } = useLandingBanners();

  // Global appearance tracker for controlled repeat (max 2 across key surfaces)
  const {
    verifiedSlotted,
    productSlotted,
    serviceSlotted,
    communitySlotted,
    popularSlotted,
  } = useMemo(() => {
    const globalAppearances = new Map<string, number>();
    const opts = { phase: "bootstrap" as const, globalAppearances };

    const v = rotateForSlots(verifiedEntities ?? [], LANDING_SLOTS["verified"], opts);
    const p = rotateForSlots(productEntities ?? [], LANDING_SLOTS["products"], opts);
    const s = rotateForSlots(serviceEntities ?? [], LANDING_SLOTS["services"], opts);
    const c = rotateForSlots(communityEntities ?? [], LANDING_SLOTS["community"], opts);
    // Popular grid uses separate appearance tracking
    const pop = rotateForSlots(popularEntities ?? [], LANDING_SLOTS["popular-grid"]);

    return {
      verifiedSlotted: v,
      productSlotted: p,
      serviceSlotted: s,
      communitySlotted: c,
      popularSlotted: pop,
    };
  }, [verifiedEntities, productEntities, serviceEntities, communityEntities, popularEntities]);

  return (
    <div 
      className="min-h-screen"
      style={{ background: '#08120D' }}
    >
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#1c1c1c] text-white lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <MassSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[240px] min-h-screen">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-6 pt-16 lg:pt-8">
          <MassHeader />
          <MassHero />

          <LandingTestPromptArea />
          <LandingTestGettingStarted />

          {/* Row 1: Verified — 4 key surfaces */}
          <PremiumBusinessRow
            title="Trusted Businesses"
            entities={verifiedSlotted.length > 0 ? verifiedSlotted : undefined}
            businesses={verifiedBusinesses}
          />

          <BusinessIdeasRow />

          {/* Row 2: Products — 4 key surfaces */}
          <PremiumBusinessRow
            title="Products"
            subtitle="Shop products from verified sellers and businesses on yangu"
            entities={productSlotted.length > 0 ? productSlotted : undefined}
            businesses={salesCommunityBusinesses}
          />

          {/* Banner 2 */}
          <LandingTestDynamicBanner slot="middle" bannerData={banners?.middle} />

          {/* Row 3: Services — 4 key surfaces */}
          <PremiumBusinessRow
            title="Services"
            subtitle="Find expert services from coaches, consultants, and freelancers"
            entities={serviceSlotted.length > 0 ? serviceSlotted : undefined}
            businesses={mindsetCoachingBusinesses}
          />

          {/* Row 4: Community — 4 key surfaces */}
          <PremiumBusinessRow
            title="Community"
            subtitle="Join communities for learning, networking, and growth"
            entities={communitySlotted.length > 0 ? communitySlotted : undefined}
            businesses={weightLossCoachingBusinesses}
          />

          {/* Banner 3 */}
          <LandingTestDynamicBanner slot="lower" bannerData={banners?.lower} />

          {/* Popular grid — 16 surfaces without cover images */}
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
