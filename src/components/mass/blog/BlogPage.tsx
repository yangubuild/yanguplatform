import { useState, useCallback } from "react";
import { SecondaryPageHeaderShell } from "../SecondaryPageHeaderShell";
import { BlogHero } from "./BlogHero";
import { BlogStampStrip } from "./BlogStampStrip";
import { BlogFeaturedGrid } from "./BlogFeaturedGrid";
import { BlogSectionModule } from "./BlogSectionModule";
import { BlogArticleCard } from "./BlogArticleCard";
import { BlogProductCard } from "./BlogProductCard";
import { BlogPodcastSection } from "./BlogPodcastSection";
import { BlogConsultingBanner } from "./BlogConsultingBanner";
import { BlogExplorePanel } from "./BlogExplorePanel";
import { BlogSubscribeModal } from "./BlogSubscribeModal";
import { BlogFooter } from "./BlogFooter";
import { BlogInterstitialBanner } from "./BlogInterstitialBanner";
import { BlogEventCard } from "./BlogEventCard";
import {
  products,
  studioArticles,
  dispatchArticles,
  aiWorkArticles,
  programmingArticles,
  eventArticles,
  chipLabels,
} from "./blogData";

function ArticleGrid({ articles }: { articles: typeof studioArticles }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {articles.map((a) => (
        <BlogArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}

export function BlogPage() {
  const [showModal, setShowModal] = useState(false);

  const openSubscribe = useCallback(() => setShowModal(true), []);

  return (
    <div className="min-h-screen" style={{ background: "#08120D", color: "#FFFFFF", fontFamily: "'Lufga', sans-serif" }}>
      <main className="min-h-screen">
        <SecondaryPageHeaderShell />

        <BlogHero onSubscribeClick={openSubscribe} />
        <BlogStampStrip />

        {/* Source label */}
        <div className="px-6">
          <div className="mx-auto" style={{ maxWidth: 1100 }}>
            <p className="text-xs uppercase tracking-widest mt-2 mb-4" style={{ letterSpacing: "0.12em" }}>
              Anthropic AI Research Publication
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6">
          <div className="mx-auto" style={{ maxWidth: 1100, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        <BlogFeaturedGrid />

        {/* Divider above products */}
        <div className="px-6">
          <div className="mx-auto" style={{ maxWidth: 1100, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Built by yangu */}
        <BlogSectionModule title="Built by yangu" subtitle="Try out our AI-powered products.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <BlogProductCard key={p.id} product={p} />
            ))}
          </div>
        </BlogSectionModule>

        {/* Divider below products */}
        <div className="px-6">
          <div className="mx-auto" style={{ maxWidth: 1100, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* yangu Studio */}
        <BlogSectionModule title="yangu Studio" subtitle="Lessons from engineers shipping AI products." dashedBorder>
          <ArticleGrid articles={studioArticles} />
        </BlogSectionModule>

        {/* Dispatches */}
        <BlogSectionModule title="Dispatches From the Frontiers of AI" subtitle="The latest models, capabilities, products, and use cases." dashedBorder>
          <ArticleGrid articles={dispatchArticles} />
        </BlogSectionModule>

        {/* Interstitial Banner */}
        <BlogInterstitialBanner />

        {/* Putting AI to Work */}
        <BlogSectionModule title="Putting AI to Work" subtitle="Everything you need to know about how to use LLMs.">
          <ArticleGrid articles={aiWorkArticles} />
        </BlogSectionModule>

        {/* Future of Programming */}
        <BlogSectionModule title="The Future of Programming" subtitle="Build more. Code less.">
          <ArticleGrid articles={programmingArticles} />
        </BlogSectionModule>

        {/* yangu Events */}
        <BlogSectionModule title="yangu Events" subtitle="Upcoming events and meetups.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {eventArticles.map((ev) => (
              <BlogEventCard key={ev.id} event={ev} />
            ))}
          </div>
        </BlogSectionModule>

        {/* Podcast */}
        <BlogPodcastSection />

        {/* Consulting */}
        <BlogConsultingBanner />

        <BlogFooter />

        {/* Overlays */}
        <BlogExplorePanel />
        <BlogSubscribeModal />
      </main>
    </div>
  );
}
