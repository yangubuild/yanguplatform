import { BlogArticleCard } from "./BlogArticleCard";
import { BlogEssayItem } from "./BlogEssayItem";
import { featuredArticles, recentEssays } from "./blogData";
import { ArrowRight } from "lucide-react";

export function BlogFeaturedGrid() {
  return (
    <section className="px-6 py-10">
      <div
        className="mx-auto grid gap-8"
        style={{
          maxWidth: 1100,
          gridTemplateColumns: "1fr 1.4fr 1fr",
        }}
      >
        {/* Left — 2 stacked cards */}
        <div className="flex flex-col gap-8 max-md:hidden">
          <BlogArticleCard article={featuredArticles[1]} />
          <BlogArticleCard article={featuredArticles[2]} />
        </div>

        {/* Center — large featured */}
        <div>
          <BlogArticleCard article={featuredArticles[0]} size="large" />
        </div>

        {/* Right — Recent Essays */}
        <div className="max-md:hidden">
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}
            >
              Recent Essays
            </h3>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 hover:translate-x-0.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
          {recentEssays.map((essay) => (
            <BlogEssayItem key={essay.id} essay={essay} />
          ))}
        </div>
      </div>

      {/* Mobile fallback: show all featured cards stacked */}
      <div className="md:hidden mt-6 mx-auto flex flex-col gap-6" style={{ maxWidth: 1100 }}>
        {featuredArticles.map((a) => (
          <BlogArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
