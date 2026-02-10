import { useState } from "react";
import { CommunityTopBar } from "./CommunityTopBar";
import { CommunityHero } from "./CommunityHero";
import { CommunityFilterBar } from "./CommunityFilterBar";
import { CommunitySection } from "./CommunitySection";
import { communityItems, categories } from "./communityData";

export function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState("Explore");

  const isExplore = activeFilter === "Explore";

  const trendingItems = isExplore ? communityItems.slice(0, 6) : [];
  const filteredItems = isExplore
    ? []
    : communityItems.filter((i) => i.category === activeFilter);

  const categoryGroups = isExplore
    ? categories
        .slice(1)
        .map((cat) => ({
          title: cat,
          items: communityItems.filter((i) => i.category === cat),
        }))
        .filter((g) => g.items.length > 0)
    : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <CommunityTopBar />
      <CommunityHero />
      <CommunityFilterBar onFilterChange={setActiveFilter} />

      <div className="mt-0">
        {isExplore ? (
          <>
            <CommunitySection title="Trending" items={trendingItems} />
            {categoryGroups.map((g) => (
              <CommunitySection key={g.title} title={g.title} items={g.items} />
            ))}
          </>
        ) : (
          <CommunitySection title={activeFilter} items={filteredItems} />
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  );
}
