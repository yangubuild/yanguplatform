import { useMemo } from "react";
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
import { backfillWithPlaceholders } from "@/lib/explorePlaceholders";

export default function DashboardExplore() {
  // Same real entity hooks as landing page
  const { data: verifiedEntities } = useVerifiedEntities(16);
  const { data: popularEntities } = usePopularBusinesses(32);
  const { data: productEntities } = useProductEntities(16);
  const { data: serviceEntities } = useServiceEntities(16);
  const { data: communityEntities } = useCommunityEntities(16);
  const { data: banners } = useLandingBanners();

  const {
    verifiedSlotted,
    productSlotted,
    serviceSlotted,
    communitySlotted,
    popularSlotted,
  } = useMemo(() => {
    const globalAppearances = new Map<string, number>();
    const opts = { phase: "bootstrap" as const, globalAppearances };

    const vRaw = rotateForSlots(verifiedEntities ?? [], LANDING_SLOTS["verified"], opts);
    const pRaw = rotateForSlots(productEntities ?? [], LANDING_SLOTS["products"], opts);
    const sRaw = rotateForSlots(serviceEntities ?? [], LANDING_SLOTS["services"], opts);
    const cRaw = rotateForSlots(communityEntities ?? [], LANDING_SLOTS["community"], opts);
    const popRaw = rotateForSlots(popularEntities ?? [], LANDING_SLOTS["popular-grid"]);

    return {
      verifiedSlotted: backfillWithPlaceholders(vRaw, "verified", LANDING_SLOTS["verified"]),
      productSlotted: backfillWithPlaceholders(pRaw, "products", LANDING_SLOTS["products"]),
      serviceSlotted: backfillWithPlaceholders(sRaw, "services", LANDING_SLOTS["services"]),
      communitySlotted: backfillWithPlaceholders(cRaw, "community", LANDING_SLOTS["community"]),
      popularSlotted: backfillWithPlaceholders(popRaw, "popular", LANDING_SLOTS["popular-grid"]),
    };
  }, [verifiedEntities, productEntities, serviceEntities, communityEntities, popularEntities]);

  return (
    <div className="min-h-full" style={{ background: '#08120D' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto">
        <LandingTestPromptArea />
        <LandingTestGettingStarted />
        <PremiumBusinessRow
          title="Trusted Businesses"
          entities={verifiedSlotted.length> 0 ? verifiedSlotted : undefined}
          businesses={verifiedBusinesses}
        />
        <BusinessIdeasRow />
        <PremiumBusinessRow
          title="Buy From"
          subtitle="Shop products from verified sellers and businesses on yangu"
          entities={productSlotted.length> 0 ? productSlotted : undefined}
          businesses={salesCommunityBusinesses}
        />
        <LandingTestDynamicBanner slot="middle" bannerData={banners?.middle} />
        <PremiumBusinessRow
          title="Find Services"
          subtitle="Find expert services from coaches, consultants, and freelancers"
          entities={serviceSlotted.length> 0 ? serviceSlotted : undefined}
          businesses={mindsetCoachingBusinesses}
        />
        <PremiumBusinessRow
          title="Join Communities"
          subtitle="Join communities for learning, networking, and growth"
          entities={communitySlotted.length> 0 ? communitySlotted : undefined}
          businesses={weightLossCoachingBusinesses}
        />
        <LandingTestDynamicBanner slot="lower" bannerData={banners?.lower} />
        
        <PopularBusinessGrid
          entities={popularSlotted.length> 0 ? popularSlotted : undefined}
          businesses={popularBusinesses}
        />
        <LandingTestFooter />
      </div>
    </div>
  );
}
