import { BlogArticleCard } from "./BlogArticleCard";
import { BlogEssayItem } from "./BlogEssayItem";
import { featuredArticles, recentEssays } from "./blogData";
import { useAnthropicPublications, type AnthropicPublication } from "@/hooks/useAnthropicPublications";
import { ArrowRight } from "lucide-react";
import type { BlogArticle, BlogEssay } from "./blogData";

function pubToArticle(pub: AnthropicPublication, fallbackImage: string): BlogArticle {
  return {
    id: pub.id,
    title: pub.title,
    subtitle: pub.excerpt || undefined,
    date: pub.published_at
      ? new Date(pub.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "New",
    column: pub.category || "Research",
    author: pub.published_at
      ? new Date(pub.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "New",
    image: pub.image_url || fallbackImage,
    url: pub.url,
  };
}

function pubToEssay(pub: AnthropicPublication, fallbackImage: string): BlogEssay {
  return {
    id: pub.id,
    title: pub.title,
    author: pub.published_at
      ? new Date(pub.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "New",
    image: pub.image_url || fallbackImage,
    url: pub.url,
  };
}

export function BlogFeaturedGrid() {
  const { data: publications } = useAnthropicPublications(7);

  // Use RPC data if available, otherwise fallback to static
  const hasPubs = publications && publications.length >= 3;

  const topCards = hasPubs
    ? [
        pubToArticle(publications[1], featuredArticles[1]?.image || ""),
        pubToArticle(publications[2], featuredArticles[2]?.image || ""),
      ]
    : [featuredArticles[1], featuredArticles[2]];

  const mainCard = hasPubs
    ? pubToArticle(publications[0], featuredArticles[0]?.image || "")
    : featuredArticles[0];

  const essayList = hasPubs
    ? publications.slice(3, 7).map((p, i) => pubToEssay(p, recentEssays[i]?.image || ""))
    : recentEssays;

  return (
    <section className="px-6 py-10">
      {/* Desktop 3-column grid with row spanning */}
      <div
        className="mx-auto max-md:hidden"
        style={{
          maxWidth: 1100,
          display: "grid",
          gridTemplateColumns: "1fr 1.6fr 340px",
          gridTemplateRows: "repeat(2, minmax(0, 1fr))",
          gap: "24px",
        }}
      >
        {/* Left col — 2 stacked medium cards */}
        {topCards.map((a, i) => (
          <div key={a.id} style={{ gridColumn: 1, gridRow: i + 1 }}>
            <BlogArticleCard article={a} size="default" />
          </div>
        ))}

        {/* Center — big card spanning both rows */}
        <div style={{ gridColumn: 2, gridRow: "1 / span 2" }}>
          <BlogArticleCard article={mainCard} size="large" />
        </div>

        {/* Right — Recent Publications spanning both rows */}
        <div style={{ gridColumn: 3, gridRow: "1 / span 2" }}>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}
            >
              Recent Publications
            </h3>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 hover:translate-x-0.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
          {essayList.map((essay) => (
            <BlogEssayItem key={essay.id} essay={essay} />
          ))}
        </div>
      </div>

      {/* Mobile fallback: show all featured cards stacked */}
      <div className="md:hidden mt-6 mx-auto flex flex-col gap-6" style={{ maxWidth: 1100 }}>
        {(hasPubs ? [mainCard, ...topCards] : featuredArticles).map((a) => (
          <BlogArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}
