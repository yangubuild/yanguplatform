import { useState } from "react";
import { Sun, Moon, Loader2 } from "lucide-react";
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
import { useCommunityListings } from "@/hooks/useCommunityListings";
import type { CommunityItem } from "./communityData";

function mapListingToItem(l: { surface_id: string; title: string; domain_host: string; slug: string; listed_at: string; cover_image: string | null; category: string | null }): CommunityItem {
  return {
    id: l.surface_id,
    image: l.cover_image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=375&fit=crop",
    title: l.title || "Untitled",
    description: l.title || "",
    category: l.category || "Explore",
    // link is constructed in the card via domain_host/slug
  };
}

function CommunityPageInner() {
  const [activeFilter, setActiveFilter] = useState("Explore");
  const { theme, toggle } = useCommunityTheme();
  const colors = getThemeColors(theme);

  const { data: liveListings, isLoading } = useCommunityListings(24, 0);

  // Map live listings into CommunityItem shape; fall back to static data when empty
  const hasLive = liveListings && liveListings.length > 0;
  const liveItems: CommunityItem[] = hasLive ? liveListings.map(mapListingToItem) : [];

  // Build a url map for live items so cards can link correctly
  const linkMap = new Map<string, string>();
  if (hasLive) {
    for (const l of liveListings) {
      linkMap.set(l.surface_id, `https://${l.domain_host}/${l.slug}`);
    }
  }

  // Use live data when available, otherwise fall back to static mock data
  const items = hasLive ? liveItems : communityItems;

  const isExplore = activeFilter === "Explore";

  const trendingItems = isExplore ? items.slice(0, 8) : [];
  const popularItems = isExplore ? items.slice(8, 16) : [];
  const productiveItems = isExplore
    ? items.filter((i) => i.category === "Be more productive").slice(0, 4)
    : [];
  const businessItems = isExplore
    ? items.filter((i) => i.category === "Start and scale my business").slice(0, 8)
    : [];
  const filteredItems = isExplore
    ? []
    : items.filter((i) => i.category === activeFilter);

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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.text }} />
        </div>
      ) : isExplore ? (
        <>
          <CommunitySection title="Trending" items={trendingItems} showSeeAll={false} linkMap={linkMap} />
          <CreatorSpotlight />
          <CommunitySection title="Popular" items={popularItems} showSeeAll={false} linkMap={linkMap} />
          <SubscribeCta />
          <CommunitySection title="Be more productive" items={productiveItems} linkMap={linkMap} />
          <CommunitySection title="Start and scale my business" items={businessItems} linkMap={linkMap} />
          <BottomCta />
          <CommunityFooter />
        </>
      ) : (
        <>
          <CommunitySection title={activeFilter} items={filteredItems} showSeeAll={false} linkMap={linkMap} />
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
