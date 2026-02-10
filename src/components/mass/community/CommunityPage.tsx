import { useState } from "react";
import { CommunityTopBar } from "./CommunityTopBar";
import { CommunityHero } from "./CommunityHero";
import { CommunityFilterBar } from "./CommunityFilterBar";
import { CommunitySection } from "./CommunitySection";
import { CreatorSpotlight } from "./CreatorSpotlight";
import { SubscribeCta } from "./SubscribeCta";
import { BottomCta } from "./BottomCta";
import { CommunityFooter } from "./CommunityFooter";
import { communityItems, categories } from "./communityData";

export function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState("Explore");

  const isExplore = activeFilter === "Explore";

  // Trending: first 8 items (2 rows of 4)
  const trendingItems = isExplore ? communityItems.slice(0, 8) : [];
  // Popular: next 8 items (2 rows of 4)
  const popularItems = isExplore ? communityItems.slice(8, 16) : [];
  // Be more productive: 4 items (1 row)
  const productiveItems = isExplore
    ? communityItems.filter((i) => i.category === "Be more productive").slice(0, 4)
    : [];
  // Start and scale my business: 8 items (2 rows)
  const businessItems = isExplore
    ? communityItems.filter((i) => i.category === "Start and scale my business").slice(0, 8)
    : [];

  const filteredItems = isExplore
    ? []
    : communityItems.filter((i) => i.category === activeFilter);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#FFFFFF",
        fontFamily:
          "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <CommunityTopBar />
      <CommunityHero />
      <CommunityFilterBar onFilterChange={setActiveFilter} />

      {isExplore ? (
        <>
          <CommunitySection title="Trending" items={trendingItems} showSeeAll={false} />
          <CreatorSpotlight />
          <CommunitySection title="Popular" items={popularItems} showSeeAll={false} />
          <SubscribeCta />
          <CommunitySection title="Be more productive" items={productiveItems} />
          <CommunitySection title="Start and scale my business" items={businessItems} />
          <BottomCta />
          <CommunityFooter />
        </>
      ) : (
        <>
          <CommunitySection title={activeFilter} items={filteredItems} showSeeAll={false} />
          <CommunityFooter />
        </>
      )}
    </div>
  );
}
