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

export default function DashboardExplore() {
  return (
    <div className="min-h-full" style={{ background: '#08120D' }}>
      <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto">
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
    </div>
  );
}
