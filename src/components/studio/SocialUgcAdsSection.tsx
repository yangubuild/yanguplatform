import { useState } from "react";
import { ChevronRight, ThumbsUp } from "lucide-react";

const FILTER_CHIPS = [
  "Hook", "Viral", "SALE", "Multi-Industry", "Apparel", "Accessories",
  "Beauty & Personal Care", "Services", "Physical Goods", "Apps",
  "Food & Beverage", "Financial", "Health", "Tech & Electronics",
  "Sports & Outdoor", "Household Product", "Home Improvement", "Pets",
  "Education", "Billboards", "New Year", "UGC", "Cinematic", "Aesthetic",
  "Avatar Swap",
] as const;

interface UgcCard {
  id: string;
  votes: number;
  isPro?: boolean;
  thumbnail: string;
  caption?: string;
}

const UGC_CARDS: UgcCard[] = [
  { id: "1", votes: 52, thumbnail: "/studio/ugc-1.mp4", caption: "it is the only SPF I actually" },
  { id: "2", votes: 53, thumbnail: "/studio/ugc-2.mp4", caption: "REALLY NEED TO TRY IT." },
  { id: "3", votes: 42, thumbnail: "/studio/ugc-3.mp4" },
  { id: "4", votes: 44, thumbnail: "/studio/ugc-4.mp4", caption: "Despite the huge size, it" },
  { id: "5", votes: 41, thumbnail: "/studio/ugc-5.mp4", isPro: true, caption: "Confused by multiple logins?" },
  { id: "6", votes: 46, thumbnail: "/studio/ugc-6.mp4", caption: "Honestly, it is the only" },
  { id: "7", votes: 30, thumbnail: "/studio/ugc-7.mp4" },
  { id: "8", votes: 40, thumbnail: "/studio/ugc-8.mp4" },
  { id: "9", votes: 33, thumbnail: "/studio/ugc-9.mp4" },
  { id: "10", votes: 33, thumbnail: "/studio/ugc-10.mp4" },
  { id: "11", votes: 30, thumbnail: "/studio/ugc-11.mp4" },
  { id: "12", votes: 32, thumbnail: "/studio/ugc-12.mp4" },
];

export function SocialUgcAdsSection() {
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
            SOCIAL &amp; UGC ADS
            <span className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
              AI
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover social-first and UGC-style ads made to feel native and authentic.
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

      {/* grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {UGC_CARDS.map((card) => (
          <div
            key={card.id}
            className="relative rounded-xl overflow-hidden aspect-[3/4] bg-muted/30 cursor-pointer group"
          >
            {card.thumbnail ? (
              <video
                src={card.thumbnail}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                loop
                playsInline
                autoPlay
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

            {/* caption overlay */}
            {card.caption && (
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 group-hover:bottom-8 transition-all duration-300">
                <p className="text-xs text-white/90 line-clamp-2">{card.caption}</p>
              </div>
            )}

            {/* Recreate button – absolute at bottom, slides up on hover */}
            <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-accent/20 to-accent/5 px-2 py-1.5">
              <button className="w-full py-1.5 text-xs font-semibold text-black bg-white border border-border/40 rounded-md hover:bg-muted transition-colors">
                Recreate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* view all button */}
      <div className="flex justify-center pt-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
          View all <span className="font-semibold">Social &amp; UGC Ads</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
