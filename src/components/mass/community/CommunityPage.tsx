import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CommunityThemeProvider, useCommunityTheme, getThemeColors } from "./CommunityThemeContext";
import { CommunityHero } from "./CommunityHero";
import { CommunityFilterBar } from "./CommunityFilterBar";
import { CommunitySection } from "./CommunitySection";
import { CreatorSpotlight } from "./CreatorSpotlight";
import { SubscribeCta } from "./SubscribeCta";
import { BottomCta } from "./BottomCta";
import { CommunityFooter } from "./CommunityFooter";
import { useCommunitySection, type CommunitySectionItem } from "@/hooks/useCommunitySection";
import { useCommunityListings } from "@/hooks/useCommunityListings";
import { useBuilderCommunityListings, type BuilderCommunityListing } from "@/hooks/useBuilderCommunityListings";
import type { CommunityItem } from "./communityData";
import { SecondaryPageHeaderShell } from "../SecondaryPageHeaderShell";

function mapToItem(l: CommunitySectionItem): CommunityItem {
  return {
    id: l.surface_id,
    image: l.cover_image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=375&fit=crop",
    title: l.title || "Untitled",
    description: l.description || l.title || "",
    category: l.category || "Explore",
  };
}

function buildLinkMap(items: CommunitySectionItem[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const l of items) {
    m.set(l.surface_id, `https://${l.domain_host}/${l.slug}`);
  }
  return m;
}

function CommunityPageInner() {
  const [activeFilter, setActiveFilter] = useState("Explore");
  const { theme, toggle } = useCommunityTheme();
  const colors = getThemeColors(theme);

  // Section-specific RPC calls
  const trending = useCommunitySection("trending", null, 8, 0);
  const popular = useCommunitySection("popular", null, 8, 0);
  const productive = useCommunitySection("category", "be_more_productive", 4, 0);
  const business = useCommunitySection("category", "start_scale_business", 8, 0);

  // Fallback for filtered (non-Explore) view — only fetch when user leaves Explore tab
  const isFiltered = activeFilter !== "Explore";
  const { data: liveListings, isLoading: listingsLoading } = useCommunityListings(24, 0, isFiltered);

  // Builder community listings — deferred, loads after initial render
  const { data: builderListings } = useBuilderCommunityListings(12, 0);
  const builderItems: CommunityItem[] = (builderListings ?? []).map((bl) => ({
    id: bl.surface_id,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=375&fit=crop",
    title: bl.title || "Untitled",
    description: bl.description || bl.title || "",
    category: "Explore",
  }));
  const builderLinks = new Map<string, string>();
  for (const bl of builderListings ?? []) {
    builderLinks.set(bl.surface_id, `/s/${bl.surface_id}/preview`);
  }

  const isExplore = activeFilter === "Explore";
  const isLoading = isExplore
    ? trending.isLoading || popular.isLoading || productive.isLoading || business.isLoading
    : listingsLoading;

  // Section data
  const trendingItems = (trending.data ?? []).map(mapToItem);
  const trendingLinks = buildLinkMap(trending.data ?? []);
  const popularItems = (popular.data ?? []).map(mapToItem);
  const popularLinks = buildLinkMap(popular.data ?? []);
  const productiveItems = (productive.data ?? []).map(mapToItem);
  const productiveLinks = buildLinkMap(productive.data ?? []);
  const businessItems = (business.data ?? []).map(mapToItem);
  const businessLinks = buildLinkMap(business.data ?? []);

  // For non-Explore filters, use general listings filtered by category
  const filteredItems: CommunityItem[] = !isExplore
    ? (liveListings ?? [])
        .filter((l) => l.category === activeFilter)
        .map((l) => ({
          id: l.surface_id,
          image: l.cover_image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=375&fit=crop",
          title: l.title || "Untitled",
          description: l.title || "",
          category: l.category || "Explore",
        }))
    : [];
  const filteredLinks = new Map<string, string>();
  if (!isExplore) {
    for (const l of liveListings ?? []) {
      filteredLinks.set(l.surface_id, `https://${l.domain_host}/${l.slug}`);
    }
  }

  const allExploreEmpty =
    trendingItems.length === 0 &&
    popularItems.length === 0 &&
    productiveItems.length === 0 &&
    businessItems.length === 0;

  return (
    <div
      className="min-h-screen"
      style={{ background: '#08120D' }}
    >
      <main className="min-h-screen">
        <SecondaryPageHeaderShell />

        {/* Community content */}
        <CommunityHero />
        <CommunityFilterBar onFilterChange={setActiveFilter} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-white/60" />
          </div>
        ) : isExplore ? (
          allExploreEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <p className="text-[15px] font-medium text-white">No listings yet</p>
              <p className="mt-1 text-[13px] text-white/50">
                Communities listed on yangu will appear here.
              </p>
            </div>
          ) : (
            <>
              <CommunitySection title="Trending" items={trendingItems} linkMap={trendingLinks} seeAllHref="/community/see-all?section=trending" />
              <CreatorSpotlight />
              <CommunitySection title="Popular" items={popularItems} linkMap={popularLinks} seeAllHref="/community/see-all?section=popular" />
              <SubscribeCta />
              <CommunitySection title="Be more productive" items={productiveItems} linkMap={productiveLinks} seeAllHref="/community/see-all?section=category&category_key=be_more_productive" />
              <CommunitySection title="Start and scale my business" items={businessItems} linkMap={businessLinks} seeAllHref="/community/see-all?section=category&category_key=start_scale_business" />
              {builderItems.length > 0 && (
                <CommunitySection title="Community Listings" items={builderItems} linkMap={builderLinks} showSeeAll={false} />
              )}
              <BottomCta />
              <CommunityFooter />
            </>
          )
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <p className="text-[15px] font-medium text-white">No listings in this category</p>
              </div>
            ) : (
              <CommunitySection title={activeFilter} items={filteredItems} showSeeAll={false} linkMap={filteredLinks} />
            )}
            <CommunityFooter />
          </>
        )}
      </main>
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
