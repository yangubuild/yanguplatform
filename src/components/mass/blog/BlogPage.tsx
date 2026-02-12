import { useState, useCallback } from "react";
import { BlogHeader } from "./BlogHeader";
import { BlogHero } from "./BlogHero";
import { BlogStampStrip } from "./BlogStampStrip";
import { BlogFeaturedGrid } from "./BlogFeaturedGrid";
import { BlogSectionModule } from "./BlogSectionModule";
import { BlogArticleCard } from "./BlogArticleCard";
import { BlogProductCard } from "./BlogProductCard";
import { BlogColumnistBlock } from "./BlogColumnistBlock";
import { BlogPodcastSection } from "./BlogPodcastSection";
import { BlogConsultingBanner } from "./BlogConsultingBanner";
import { BlogExplorePanel } from "./BlogExplorePanel";
import { BlogSubscribeModal } from "./BlogSubscribeModal";
import { BlogFooter } from "./BlogFooter";
import {
  products,
  studioArticles,
  dispatchArticles,
  aiWorkArticles,
  programmingArticles,
  writingArticles,
  chipLabels,
} from "./blogData";

function InterstitialBlock() {
  return (
    <section className="px-6 py-14">
      <div className="mx-auto text-center" style={{ maxWidth: 1100 }}>
        <span
          className="text-lg"
          style={{ fontFamily: "'Lufga', sans-serif", color: "rgba(255,255,255,0.3)" }}
        >
          YANGU
        </span>
        <h2
          className="mt-4 text-xl md:text-2xl font-medium leading-tight"
          style={{ fontFamily: "'Lufga', sans-serif", color: "#fff" }}
        >
          Ideas and Apps to Thrive in the AI Age
        </h2>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {chipLabels.map((label) => (
            <span
              key={label}
              className="px-4 py-1.5 rounded-full text-xs"
              style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.55)" }}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="mt-8 mx-auto" style={{ maxWidth: 600, height: 1, borderTop: "1px dashed rgba(255,255,255,0.15)" }} />
      </div>
    </section>
  );
}

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
      <BlogHeader onSubscribeClick={openSubscribe} />
      <BlogHero onSubscribeClick={openSubscribe} />
      <BlogStampStrip />

      {/* Divider */}
      <div className="px-6">
        <div className="mx-auto" style={{ maxWidth: 1100, height: 1, background: "rgba(255,255,255,0.1)" }} />
      </div>

      <BlogFeaturedGrid />

      {/* Divider above products */}
      <div className="px-6">
        <div className="mx-auto" style={{ maxWidth: 1100, height: 1, background: "rgba(255,255,255,0.1)" }} />
      </div>

      {/* Built by Yangu */}
      <BlogSectionModule title="Built by Yangu" subtitle="Try out our AI-powered products.">
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


      {/* Yangu Studio */}
      <BlogSectionModule title="Yangu Studio" subtitle="Lessons from engineers shipping AI products.">
        <ArticleGrid articles={studioArticles} />
      </BlogSectionModule>

      {/* Dispatches */}
      <BlogSectionModule title="Dispatches From the Frontiers of AI">
        <ArticleGrid articles={dispatchArticles} />
      </BlogSectionModule>


      {/* Putting AI to Work */}
      <BlogSectionModule title="Putting AI to Work">
        <ArticleGrid articles={aiWorkArticles} />
      </BlogSectionModule>

      {/* Future of Programming */}
      <BlogSectionModule title="The Future of Programming">
        <ArticleGrid articles={programmingArticles} />
      </BlogSectionModule>

      {/* New Rules of Writing */}
      <BlogSectionModule title="The New Rules of Writing">
        <ArticleGrid articles={writingArticles} />
      </BlogSectionModule>

      {/* Columnists */}
      <BlogColumnistBlock />

      {/* Podcast */}
      <BlogPodcastSection />

      {/* Consulting */}
      <BlogConsultingBanner />

      <BlogFooter />

      {/* Overlays */}
      <BlogExplorePanel />
      <BlogSubscribeModal />
    </div>
  );
}
