import { useState } from "react";
import { ChevronRight, Bookmark, MoreVertical } from "lucide-react";

const FILTER_CHIPS = [
  "Apparel & Accessories", "Appliances", "Apps", "Baby & Maternity",
  "Beauty & Personal Care", "Business Services", "E-Commerce", "Education",
  "Financial Services", "Food & Beverage", "Games", "Health",
  "Home Improvement", "Household Products", "Life Services",
  "News & Entertainment", "Pets", "Sports & Outdoors",
  "Tech & Electronics", "Travel", "Vehicle & Transportation",
] as const;

interface MetaAdCard {
  id: string;
  brand: string;
  avatar: string;
  isNew?: boolean;
  caption: string;
  image: string;
  hasVideo?: boolean;
  externalUrl?: string;
  externalCta?: string;
}

const META_ADS: MetaAdCard[] = [
  {
    id: "1",
    brand: "Getfitwith...",
    avatar: "🏋️",
    isNew: true,
    caption: "Follow @getfitwithabe for more high-protein Habesha recipes 😋...",
    image: "",
    hasVideo: true,
  },
  {
    id: "2",
    brand: "Lifeberry F...",
    avatar: "🎨",
    isNew: true,
    caption: "Every detail matters. Every morning. We compose the spac...",
    image: "",
    hasVideo: true,
  },
  {
    id: "3",
    brand: "Dr. James ...",
    avatar: "👨‍⚕️",
    isNew: true,
    caption: "Future dentist. Real treatment. Real results.✨ Watch Steven...",
    image: "",
    hasVideo: true,
  },
  {
    id: "4",
    brand: "StyleCraz...",
    avatar: "💄",
    isNew: true,
    caption: "Try This If Your Skin Is Stressing You Out The products you use...",
    image: "",
    externalUrl: "skinkraft.com",
    externalCta: "Shop Now",
  },
  {
    id: "5",
    brand: "Boom To o...",
    avatar: "📖",
    isNew: true,
    caption: "My husband fell in love with my little sister and wanted her as hi...",
    image: "",
    externalUrl: "b.rereadapps.com",
    externalCta: "Learn More",
  },
  {
    id: "6",
    brand: "Boom To o...",
    avatar: "📖",
    isNew: true,
    caption: "My husband fell in love with my little sister and wanted her as hi...",
    image: "",
    hasVideo: true,
  },
  {
    id: "7",
    brand: "PakWheel...",
    avatar: "🚗",
    isNew: true,
    caption: "Don't settle for weak cleaning. The Sogo SG-880 delivers 110 Ba...",
    image: "",
    hasVideo: true,
  },
  {
    id: "8",
    brand: "Alibaba Gr...",
    avatar: "🌐",
    isNew: true,
    caption: "Who knew a simple memo draw could spark so much excitement...",
    image: "",
    hasVideo: true,
  },
  {
    id: "9",
    brand: "Forged4x4",
    avatar: "🏎️",
    isNew: true,
    caption: "Want to be our 20th winner?! 👑 You could be the owner of this '2...",
    image: "",
  },
  {
    id: "10",
    brand: "StyleCraz...",
    avatar: "💄",
    isNew: true,
    caption: "Try This If Your Skin Is Stressing You Out The products you use...",
    image: "",
  },
];

export function MetaTopAdsSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground"
            style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}
          >
            META TOP ADS
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            See what's winning on Meta — and clone proven ad creatives in seconds.
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

      {/* top row – full cards with buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {META_ADS.slice(0, 5).map((ad) => (
          <div
            key={ad.id}
            className="rounded-xl border border-border/40 bg-card overflow-hidden flex flex-col"
          >
            {/* caption at top */}
            <p className="text-xs text-muted-foreground px-3 pt-3 pb-2 line-clamp-2 leading-relaxed">
              {ad.caption}
            </p>

            {/* media */}
            <div className="relative flex-1 min-h-[200px] bg-muted/30">
              {ad.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* external link bar */}
            {ad.externalUrl && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border/30">
                <span className="text-[10px] text-muted-foreground truncate">{ad.externalUrl}</span>
                <button className="text-[10px] font-medium text-foreground border border-border/40 rounded px-2 py-0.5 hover:bg-muted transition-colors">
                  {ad.externalCta}
                </button>
              </div>
            )}

            {/* clone button */}
            <div className="flex items-center gap-1 px-2 py-2 mt-auto">
              <button className="flex-1 py-1.5 text-xs font-semibold text-black bg-white border border-border/40 rounded-md hover:bg-accent hover:text-white hover:border-accent transition-colors">
                Clone this ad
              </button>
              <button className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* bottom row – brand header + fading image, no buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {META_ADS.slice(5, 10).map((ad) => (
          <div
            key={ad.id}
            className="rounded-xl border border-border/40 bg-card overflow-hidden flex flex-col"
          >
            {/* brand header */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center text-sm shrink-0">
                {ad.avatar}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground truncate">
                  {ad.brand}
                </span>
                {ad.isNew && (
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-medium text-muted-foreground">NEW</span>
                  </span>
                )}
              </div>
              <Bookmark className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>

            {/* caption */}
            <p className="text-xs text-muted-foreground px-3 pb-2 line-clamp-2 leading-relaxed">
              {ad.caption}
            </p>

            {/* fading image – no button */}
            <div className="relative h-[140px] bg-muted/30 overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-card to-transparent z-10" />
              {ad.hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                  <div className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[10px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* view all button */}
      <div className="flex justify-center pt-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
          View all <span className="font-semibold">Market Trends Ads</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
