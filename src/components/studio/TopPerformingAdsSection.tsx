import { useState } from "react";
import { ChevronRight, ThumbsUp } from "lucide-react";

const FILTER_CHIPS = [
  "SALE", "Multi-Industry", "New Year", "Tech & Electronics",
  "Food & Beverages", "Beauty & Skincare", "Apparel & Acc",
  "Viral", "Sports & Outdoor",
] as const;

interface VideoCard {
  id: string;
  votes: number;
  video: string;
  span?: string;
}

const VIDEO_CARDS: VideoCard[] = [
  // Row 1: 5 visual slots — card 4 is the wide one (col-span-2)
  { id: "1", votes: 30, video: "/studio/pve-1.mp4", span: "col-span-1 row-span-1" },
  { id: "2", votes: 27, video: "/studio/pve-2.mp4", span: "col-span-1 row-span-1" },
  { id: "3", votes: 21, video: "/studio/pve-3.mp4", span: "col-span-1 row-span-1" },
  { id: "4", votes: 23, video: "/studio/pve-4.mp4", span: "col-span-2 row-span-1" }, // BIG
  { id: "5", votes: 23, video: "/studio/pve-5.mp4", span: "col-span-1 row-span-1" },
  // Row 2: 3 cards
  { id: "6", votes: 21, video: "/studio/pve-6.mp4", span: "col-span-1 row-span-1" },
  { id: "7", votes: 20, video: "/studio/pve-7.mp4", span: "col-span-1 row-span-1" },
  { id: "8", votes: 21, video: "/studio/pve-8.mp4", span: "col-span-1 row-span-1" },
  { id: "9", votes: 19, video: "/studio/pve-9.mp4", span: "col-span-1 row-span-1" },
  { id: "10", votes: 18, video: "/studio/pve-10.mp4", span: "col-span-1 row-span-1" },
  { id: "11", votes: 22, video: "/studio/pve-11.mp4", span: "col-span-1 row-span-1" },
];

export function TopPerformingAdsSection() {
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
            PRODUCT VISUAL EFFECTS
            <span className="inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-bold text-accent">
              AI
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Turn products into eye-catching visuals with bold, creative effects.
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {VIDEO_CARDS.map((card) => (
          <div
            key={card.id}
            className={`relative rounded-xl overflow-hidden bg-muted/30 cursor-pointer group ${card.span ?? ""}`}
            style={{ aspectRatio: card.span?.includes("col-span-2") ? "16/9" : "3/4" }}
          >
            <video
              src={card.video}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />

            {/* vote badge */}
            <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[11px] font-semibold text-white">
              <ThumbsUp className="h-3 w-3" />
              {card.votes}
            </div>

            {/* Recreate button on hover */}
            <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-accent/20 to-accent/5 px-2 py-1.5">
              <button className="w-full py-1.5 text-xs font-semibold text-black bg-white border border-border/40 rounded-md hover:bg-accent hover:text-white hover:border-accent transition-colors">
                Recreate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* view all button */}
      <div className="flex justify-center pt-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
          View all <span className="font-semibold">Product Visual Effects</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
