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
          title="Verified"
          businesses={verifiedBusinesses}
        />
        <BusinessIdeasRow />
        <PremiumBusinessRow
          title="Products"
          subtitle="Shop products from verified sellers and businesses on yangu"
          businesses={salesCommunityBusinesses}
        />
        <LandingTestDynamicBanner slot="middle" />
        <PremiumBusinessRow
          title="Services"
          subtitle="Find expert services from coaches, consultants, and freelancers"
          businesses={mindsetCoachingBusinesses}
        />
        <PremiumBusinessRow
          title="Community"
          subtitle="Join communities for learning, networking, and growth"
          businesses={weightLossCoachingBusinesses}
        />
        <LandingTestDynamicBanner slot="lower" />
        <PopularBusinessGrid businesses={popularBusinesses} />
        <LandingTestFooter />
      </div>
    </div>
  );
}
