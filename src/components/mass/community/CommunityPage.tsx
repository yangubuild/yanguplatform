import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CommunityTopBar } from "./CommunityTopBar";
import { CommunityHero } from "./CommunityHero";
import { CommunityFilterBar } from "./CommunityFilterBar";
import { CommunitySection } from "./CommunitySection";
import { communityItems, categories, creatorItems } from "./communityData";
import yanguLogo from "@/assets/yangu-logo-community.png";

/* ── Creators you might like ── */
function CreatorSpotlight() {
  return (
    <section className="w-full px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1200px] pb-4 pt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>
            Creators you might like
          </h2>
          <div className="flex gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={16} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {creatorItems.map((creator) => (
            <a
              key={creator.id}
              href="#"
              className="group flex w-[140px] shrink-0 flex-col items-center text-center"
            >
              <div className="mb-2 h-[100px] w-[100px] overflow-hidden rounded-full">
                <img
                  src={creator.image}
                  alt={creator.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-[13px] font-semibold" style={{ color: "#111827" }}>
                {creator.name}
              </h3>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
                {creator.role}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Subscribe CTA ── */
function SubscribeCta() {
  return (
    <section className="w-full px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <div
        className="mx-auto my-10 flex max-w-[1200px] items-center justify-between overflow-hidden rounded-2xl px-10 py-12"
        style={{ backgroundColor: "#111827" }}
      >
        <div>
          <h2 className="max-w-[320px] text-[22px] font-bold leading-tight text-white sm:text-[26px]">
            Be the first to
            <br />
            know about new creators
            <br />
            and communities
          </h2>
          <button
            className="mt-5 rounded-lg border border-white/30 px-5 py-[8px] text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Subscribe to Discover
          </button>
        </div>
        {/* Decorative placeholder images */}
        <div className="hidden gap-3 sm:flex">
          <div className="h-[120px] w-[120px] rounded-xl bg-gradient-to-br from-teal-400 to-teal-600" />
          <div className="h-[120px] w-[120px] rounded-xl bg-gradient-to-br from-amber-300 to-amber-500" />
        </div>
      </div>
    </section>
  );
}

/* ── Bottom CTA ── */
function BottomCta() {
  return (
    <section className="w-full px-6 pb-0" style={{ backgroundColor: "#FFFFFF" }}>
      <div
        className="mx-auto max-w-[1200px] overflow-hidden rounded-2xl px-10 py-14"
        style={{ background: "linear-gradient(135deg, #EF4444 0%, #F97316 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="max-w-[360px] text-[26px] font-bold leading-tight text-white sm:text-[30px]">
              Circle powers the top communities. Now it's your turn.
            </h2>
            <button className="mt-5 rounded-lg border border-white/40 px-5 py-[8px] text-[13px] font-medium text-white transition-colors hover:bg-white/10">
              Create a Circle
            </button>
          </div>
          {/* Decorative logos */}
          <div className="hidden gap-3 sm:flex">
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-xl bg-white/20 text-[10px] font-bold text-white">
              spi
            </div>
            <div className="flex h-[80px] w-[80px] items-center justify-center rounded-xl bg-white/20 text-[10px] font-bold text-white">
              MAKER
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function CommunityFooter() {
  return (
    <footer className="w-full px-6 py-8" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <img src={yanguLogo} alt="Yangu" className="h-[22px] w-auto opacity-40" />
        <div className="flex gap-6">
          <a href="#" className="text-[12px] text-gray-400 hover:text-gray-600">
            Terms of service
          </a>
          <a href="#" className="text-[12px] text-gray-400 hover:text-gray-600">
            Privacy policy
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ── Main Page ── */
export function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState("Explore");

  const isExplore = activeFilter === "Explore";

  // Trending: first 8 items
  const trendingItems = isExplore ? communityItems.slice(0, 8) : [];
  const filteredItems = isExplore
    ? []
    : communityItems.filter((i) => i.category === activeFilter);

  // "Popular" items for explore view
  const popularItems = isExplore ? communityItems.slice(2, 10) : [];

  // Category sections for Explore
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
          {categoryGroups.map((g) => (
            <CommunitySection key={g.title} title={g.title} items={g.items} />
          ))}
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
