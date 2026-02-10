import { useState } from "react";
import { CommunityTopBar } from "./CommunityTopBar";
import { CommunityHero } from "./CommunityHero";
import { CommunityFilterBar } from "./CommunityFilterBar";
import { CommunitySection } from "./CommunitySection";
import { communityItems, categories, creatorItems } from "./communityData";

function SubscribeCta() {
  return (
    <section className="w-full px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <div
        className="mx-auto my-10 max-w-[1200px] rounded-2xl px-8 py-12 text-center"
        style={{ backgroundColor: "#F9FAFB" }}
      >
        <h2
          className="text-[22px] font-bold leading-tight sm:text-[26px]"
          style={{ color: "#111827" }}
        >
          Be the first to
          <br />
          know about new creators
          <br />
          and communities
        </h2>
        <button
          className="mt-6 inline-flex items-center rounded-lg px-6 py-[10px] text-[14px] font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#7C3AED" }}
        >
          Subscribe to Discover
        </button>
      </div>
    </section>
  );
}

function CreatorSpotlight() {
  return (
    <section className="w-full px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1200px] pb-4 pt-10">
        <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {creatorItems.map((creator) => (
            <a
              key={creator.id}
              href="#"
              className="group flex w-[180px] shrink-0 flex-col items-center text-center"
            >
              <div className="mb-3 h-[120px] w-[120px] overflow-hidden rounded-full">
                <img
                  src={creator.image}
                  alt={creator.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-[14px] font-semibold" style={{ color: "#111827" }}>
                {creator.name}
              </h3>
              <p className="text-[13px]" style={{ color: "#6B7280" }}>
                {creator.role}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section className="w-full px-6 pb-16" style={{ backgroundColor: "#FFFFFF" }}>
      <div
        className="mx-auto max-w-[1200px] rounded-2xl px-8 py-16 text-center"
        style={{ backgroundColor: "#111827" }}
      >
        <h2 className="mx-auto max-w-[400px] text-[28px] font-bold leading-tight text-white sm:text-[32px]">
          Circle powers the top communities. Now it's your turn.
        </h2>
        <a
          href="#"
          className="mt-6 inline-flex items-center rounded-lg px-6 py-[10px] text-[14px] font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: "#7C3AED" }}
        >
          Create a Circle
        </a>
      </div>
    </section>
  );
}

export function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState("Explore");

  const isExplore = activeFilter === "Explore";

  // First 6 items for Trending
  const trendingItems = isExplore ? communityItems.slice(0, 6) : [];
  const filteredItems = isExplore
    ? []
    : communityItems.filter((i) => i.category === activeFilter);

  // Group remaining items by category for Explore view
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
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#FFFFFF",
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <CommunityTopBar />
      <CommunityHero />
      <CommunityFilterBar onFilterChange={setActiveFilter} />

      {isExplore ? (
        <>
          {/* Trending */}
          <CommunitySection title="Trending" items={trendingItems} showSeeAll={false} />

          {/* Creator spotlight */}
          <CreatorSpotlight />

          {/* Subscribe CTA */}
          <SubscribeCta />

          {/* Category sections */}
          {categoryGroups.map((g) => (
            <CommunitySection key={g.title} title={g.title} items={g.items} />
          ))}

          {/* Bottom CTA */}
          <BottomCta />
        </>
      ) : (
        <CommunitySection title={activeFilter} items={filteredItems} showSeeAll={false} />
      )}
    </div>
  );
}
