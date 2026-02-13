import { BlogArticleCard } from "./BlogArticleCard";
import { BlogEssayItem } from "./BlogEssayItem";
import { featuredArticles, recentEssays } from "./blogData";
import { useAnthropicPublications, type AnthropicPublication } from "@/hooks/useAnthropicPublications";
import { useBlogSlotImages } from "@/hooks/useBlogSlotImages";
import { ArrowRight } from "lucide-react";
import type { BlogArticle, BlogEssay } from "./blogData";

/** Decode common HTML entities like &#x27; &amp; etc. */
function decodeEntities(str: string | null | undefined): string | undefined {
  if (!str) return undefined;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function pubToArticle(pub: AnthropicPublication, slotImage: string): BlogArticle {
  return {
    id: pub.id,
    title: decodeEntities(pub.title) || pub.title,
    subtitle: decodeEntities(pub.excerpt) || undefined,
    date: pub.published_at
      ? new Date(pub.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    column: pub.category || "Research",
    author: pub.published_at
      ? new Date(pub.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    image: slotImage,
    url: pub.url,
  };
}

function pubToEssay(pub: AnthropicPublication, slotImage: string): BlogEssay {
  return {
    id: pub.id,
    title: decodeEntities(pub.title) || pub.title,
    author: pub.published_at
      ? new Date(pub.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "New",
    image: slotImage,
    url: pub.url,
  };
}

export function BlogFeaturedGrid() {
  const { data: publications } = useAnthropicPublications(7);
  const { getSlotImage } = useBlogSlotImages();

  const hasPubs = publications && publications.length >= 3;

  // Slot mapping: slot1 = left top, slot2 = left bottom, slot3 = center big
  const topCards = hasPubs
    ? [
        pubToArticle(publications[1], getSlotImage(1)),
        pubToArticle(publications[2], getSlotImage(2)),
      ]
    : [{ ...featuredArticles[1], image: getSlotImage(1) }, { ...featuredArticles[2], image: getSlotImage(2) }];

  const mainCard = hasPubs
    ? pubToArticle(publications[0], getSlotImage(3))
    : { ...featuredArticles[0], image: getSlotImage(3) };

  // Slots 4-7 for recent publications list
  const essayList = hasPubs
    ? publications.slice(3, 7).map((p, i) => pubToEssay(p, getSlotImage(4 + i)))
    : recentEssays.map((e, i) => ({ ...e, image: getSlotImage(4 + i) }));

  return (
    <section className="px-6 py-10">
      {/* Desktop 3-column grid */}
      <div
        className="mx-auto max-md:hidden"
        style={{
          maxWidth: 1100,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.6fr) 320px",
          gridTemplateRows: "1fr 1fr",
          gap: "28px 28px",
        }}
      >
        {/* Left col — 2 stacked cards, each in its own row */}
        {topCards.map((a, i) => (
          <div
            key={a.id}
            style={{ gridColumn: 1, gridRow: i + 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <BlogArticleCard article={a} size="default" fillImage titleClamp={2} excerptClamp={1} />
          </div>
        ))}

        {/* Center — big card spanning both rows */}
        <div style={{ gridColumn: 2, gridRow: "1 / span 2", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <BlogArticleCard article={mainCard} size="large" fillImage titleClamp={2} excerptClamp={2} />
        </div>

        {/* Right — Recent Publications spanning both rows */}
        <div style={{ gridColumn: 3, gridRow: "1 / span 2", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}
            >
              Recent Publications
            </h3>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 hover:translate-x-0.5" style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
          <div className="flex-1 flex flex-col">
            {essayList.map((essay) => (
              <BlogEssayItem key={essay.id} essay={essay} titleClamp={2} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="md:hidden mt-6 mx-auto flex flex-col gap-6" style={{ maxWidth: 1100 }}>
        {(hasPubs ? [mainCard, ...topCards] : featuredArticles.map((a, i) => ({ ...a, image: getSlotImage(i + 1) }))).map((a) => (
          <BlogArticleCard key={a.id} article={a} titleClamp={2} excerptClamp={2} />
        ))}
      </div>
    </section>
  );
}
