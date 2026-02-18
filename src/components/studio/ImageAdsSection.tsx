import { useState } from "react";
import { ChevronRight, ThumbsUp } from "lucide-react";

const FILTER_CHIPS = [
  "SALE", "New Year", "Beauty & Personal Care", "Apparel", "Accessories",
  "Apps", "Sports & Outdoor", "Pets", "Food & Beverage",
  "Baby, Kids & Maternity", "Tech & Electronics", "SaaS", "Health",
] as const;

interface ImageCard {
  id: string;
  votes: number;
  isPro?: boolean;
  image: string;
  span?: string; // grid span classes
}

const IMAGE_CARDS: ImageCard[] = [
  // Row 1: 4 tall cards with recreate buttons
  { id: "1", votes: 31, image: "/studio/img-ad-1.webp", span: "col-span-1 row-span-3" },
  { id: "2", votes: 20, image: "/studio/img-ad-2.webp", span: "col-span-1 row-span-3" },
  { id: "3", votes: 23, image: "/studio/img-ad-3.webp", span: "col-span-1 row-span-3" },
  { id: "4", votes: 21, image: "/studio/img-ad-4.webp", span: "col-span-1 row-span-3" },
  // Card 5: short, sits on top in last column
  { id: "5", votes: 20, image: "/studio/img-ad-5.webp", span: "col-span-1 row-span-1" },
  // Card 6: tall below card 5, NO recreate button, gradient fade
  { id: "6", votes: 22, image: "/studio/img-ad-6.webp", span: "col-span-1 row-span-2" },
  // Bottom row: partially visible under gradient
  { id: "7", votes: 22, image: "/studio/img-ad-7.webp", span: "col-span-1 row-span-2" },
  { id: "8", votes: 20, image: "/studio/img-ad-8.webp", span: "col-span-1 row-span-2" },
  { id: "9", votes: 24, image: "/studio/img-ad-9.webp", span: "col-span-1 row-span-2" },
  { id: "10", votes: 25, image: "/studio/img-ad-10.webp", span: "col-span-1 row-span-1" },
];

export function ImageAdsSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-2"
            style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
          >
            IMAGE ADS
            <span className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
              AI
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse high-impact image ads designed to stop the scroll.
          </p>
        </div>
        <button className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
          See all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveFilter(activeFilter === chip ? null : chip)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === chip
                ? "border-accent bg-accent/20 text-accent"
                : "border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* masonry-style grid with gradient fade */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-[140px] gap-2">
          {IMAGE_CARDS.map((card) => (
            <div
              key={card.id}
              className={`relative rounded-xl overflow-hidden bg-muted/30 cursor-pointer group ${card.span ?? ""}`}
            >
              {card.image ? (
                <img
                  src={card.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/20" />
              )}

              {/* vote badge */}
              <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-white">
                <ThumbsUp className="h-3 w-3" />
                {card.votes}
              </div>

              {/* PRO badge */}
              {card.isPro && (
                <div className="absolute top-2 right-2 z-10 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  PRO
                </div>
              )}

              {/* Recreate button on hover — first 5 cards (4 tall + card 5 short) */}
              {parseInt(card.id) <= 5 && (
                <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-accent/20 to-accent/5 px-2 py-1.5">
                  <button className="w-full py-1.5 text-xs font-semibold text-white bg-accent border border-accent rounded-md hover:bg-accent/80 transition-colors">
                    Recreate
                  </button>
                </div>
              )}

              {/* Gradient fade on card 6 (tall, no button) */}
              {card.id === "6" && (
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none z-20" />
              )}
            </div>
          ))}
        </div>

        {/* bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
      </div>

      {/* view all button */}
      <div className="flex justify-center pt-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
          View all <span className="font-semibold">Image Ads</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
