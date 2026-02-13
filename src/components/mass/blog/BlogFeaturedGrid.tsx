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

function pubToArticle(pub: AnthropicPublication, slotImage: string | undefined): BlogArticle {
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
    image: slotImage || "",
    url: pub.url,
  };
}

function pubToEssay(pub: AnthropicPublication, slotImage: string | undefined): BlogEssay {
  return {
    id: pub.id,
    title: decodeEntities(pub.title) || pub.title,
    author: pub.published_at
      ? new Date(pub.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "New",
    image: slotImage || "",
    url: pub.url,
  };
}

function fallbackArticle(article: BlogArticle, slotImage: string | undefined): BlogArticle {
  return { ...article, image: slotImage || "" };
}

function fallbackEssay(essay: BlogEssay, slotImage: string | undefined): BlogEssay {
  return { ...essay, image: slotImage || "" };
}

export function BlogFeaturedGrid() {
  const { data: publications } = useAnthropicPublications(7);
  const { data: slotMap } = useBlogSlotImages("anthropic_research");
  const slots = slotMap || {};

  const hasPubs = publications && publications.length >= 3;

  // Slot mapping: slot1=left-top, slot2=center-big, slot3=left-bottom, slot4-7=right list
  const topCards = hasPubs
    ? [
        pubToArticle(publications[1], slots.slot1),
        pubToArticle(publications[2], slots.slot3),
      ]
    : [
        fallbackArticle(featuredArticles[1], slots.slot1),
        fallbackArticle(featuredArticles[2], slots.slot3),
      ];

  const mainCard = hasPubs
    ? pubToArticle(publications[0], slots.slot2)
    : fallbackArticle(featuredArticles[0], slots.slot2);

  const essaySlotKeys = ["slot4", "slot5", "slot6", "slot7"];
  const essayList = hasPubs
    ? publications.slice(3, 7).map((p, i) => pubToEssay(p, slots[essaySlotKeys[i]]))
    : recentEssays.map((e, i) => fallbackEssay(e, slots[essaySlotKeys[i]]));

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
            data-slot={i === 0 ? "slot1" : "slot3"}
            style={{ gridColumn: 1, gridRow: i + 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <BlogArticleCard article={a} size="default" fillImage titleClamp={2} excerptClamp={1} />
          </div>
        ))}

        {/* Center — big card spanning both rows */}
        <div data-slot="slot2" style={{ gridColumn: 2, gridRow: "1 / span 2", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
            {essayList.map((essay, i) => (
              <div key={essay.id} data-slot={essaySlotKeys[i]}>
                <BlogEssayItem essay={essay} titleClamp={2} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile fallback */}
      <div className="md:hidden mt-6 mx-auto flex flex-col gap-6" style={{ maxWidth: 1100 }}>
        {(hasPubs ? [mainCard, ...topCards] : [
          fallbackArticle(featuredArticles[0], slots.slot2),
          fallbackArticle(featuredArticles[1], slots.slot1),
          fallbackArticle(featuredArticles[2], slots.slot3),
        ]).map((a) => (
          <BlogArticleCard key={a.id} article={a} titleClamp={2} excerptClamp={2} />
        ))}
      </div>
    </section>
  );
}
