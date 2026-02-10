import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { CommunityThemeProvider, useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import { CommunityTopBar } from "./CommunityTopBar";
import { CommunityHero } from "./CommunityHero";
import { CommunityFilterBar } from "./CommunityFilterBar";
import { CommunitySection } from "./CommunitySection";
import { CreatorSpotlight } from "./CreatorSpotlight";
import { SubscribeCta } from "./SubscribeCta";
import { BottomCta } from "./BottomCta";
import { CommunityFooter } from "./CommunityFooter";
import { communityItems } from "./communityData";

function CommunityPageInner() {
  const [activeFilter, setActiveFilter] = useState("Explore");
  const { theme, toggle } = useCommunityTheme();
  const colors = getThemeColors(theme);

  const isExplore = activeFilter === "Explore";

  const trendingItems = isExplore ? communityItems.slice(0, 8) : [];
  const popularItems = isExplore ? communityItems.slice(8, 16) : [];
  const productiveItems = isExplore
    ? communityItems.filter((i) => i.category === "Be more productive").slice(0, 4)
    : [];
  const businessItems = isExplore
    ? communityItems.filter((i) => i.category === "Start and scale my business").slice(0, 8)
    : [];
  const filteredItems = isExplore
    ? []
    : communityItems.filter((i) => i.category === activeFilter);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: colors.bg,
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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

      {/* Theme toggle FAB */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        style={{
          backgroundColor: theme === "light" ? "#111827" : "#F0F0F0",
          color: theme === "light" ? "#F0F0F0" : "#111827",
        }}
        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      >
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </div>
  );
}

export function CommunityPage() {
  return (
    <CommunityThemeProvider>
      <CommunityPageInner />
    </CommunityThemeProvider>
  );
}
