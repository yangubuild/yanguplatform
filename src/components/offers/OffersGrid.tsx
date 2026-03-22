import { useState } from "react";
import { Heart, MessageCircle, Share2, ExternalLink, MoreHorizontal, ChevronDown } from "lucide-react";

const TILES = [
  { id: "1", image: "/images/custom-product-source/cover-1.jpg", title: "Chips Product Poster Design", description: "Snack advertisement design for a chips brand — Ideal for fo...", author: "Mohammed Shalash", avatar: "/images/custom-product-source/happy-1.avif", comments: 1, likes: 9 },
  { id: "2", image: "/images/custom-product-source/cover-2.jpg" },
  { id: "3", image: "/images/custom-product-source/cover-3.jpg" },
  { id: "4", image: "/images/custom-product-source/cover-4.jpg" },
  { id: "5", image: "/images/custom-product-source/cover-5.jpg" },
  { id: "6", image: "/images/custom-product-source/cover-6.jpg" },
  { id: "7", image: "/images/custom-product-source/cover-7.jpg" },
  { id: "8", image: "/images/custom-product-source/cover-8.jpg" },
  { id: "9", image: "/images/custom-product-source/cover-9.jpg" },
  { id: "10", image: "/images/custom-product-source/cover-10.jpg" },
  { id: "11", image: "/images/custom-product-source/cover-11.jpg" },
  { id: "12", image: "/images/custom-product-source/cover-12.jpg" },
];

/* Varying heights to create masonry feel like the screenshot */
const MASONRY_HEIGHTS = [
  "210px", "210px", "260px",
  "260px", "260px", "280px",
  "260px", "310px", "210px",
  "260px", "210px", "280px",
];

interface Tile {
  id: string;
  image: string;
  title?: string;
  description?: string;
  author?: string;
  avatar?: string;
  comments?: number;
  likes?: number;
}

export function OffersGrid() {
  const [featuredIdx, setFeaturedIdx] = useState(0);

  const featured = TILES[featuredIdx] as Tile;
  const grid = TILES.filter((_, i) => i !== featuredIdx);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10">
      <div className="flex gap-4">
        {/* ── LEFT: Featured Pin (Pinterest detail view) ── */}
        <div className="w-full max-w-[480px] shrink-0">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-foreground" />
                <span className="text-sm font-semibold text-foreground">{featured.likes ?? 9}</span>
                <MessageCircle className="h-5 w-5 text-foreground ml-2" />
                <Share2 className="h-5 w-5 text-foreground ml-2" />
                <MoreHorizontal className="h-5 w-5 text-foreground ml-2" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Profile</span>
                <ChevronDown className="h-4 w-4 text-foreground" />
                <button className="ml-2 rounded-lg bg-destructive px-4 py-1.5 text-sm font-bold text-white">
                  Save
                </button>
              </div>
            </div>

            {/* Main image */}
            <div className="relative">
              <img
                src={featured.image}
                alt={featured.title ?? "Featured offer"}
                className="w-full object-cover"
                style={{ maxHeight: "560px" }}
              />
              {/* Overlay icons bottom-right like screenshot */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow">
                  <ExternalLink className="h-4 w-4 text-black" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12l2 2 4-4"/></svg>
                </button>
              </div>
            </div>

            {/* Details below image */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{featured.title ?? "Offer"}</h2>
                <button className="rounded-lg border border-border px-4 py-1.5 text-sm font-semibold text-foreground">
                  Visit site
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {featured.description ?? ""}
                <span className="ml-1 font-semibold text-foreground cursor-pointer">... more</span>
              </p>
              {/* Author */}
              <div className="mt-3 flex items-center gap-2">
                <img
                  src={featured.avatar ?? "/images/custom-product-source/happy-1.avif"}
                  alt={featured.author ?? "Author"}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-semibold text-foreground">{featured.author ?? "Author"}</span>
              </div>
              {/* Comments */}
              <div className="mt-3 flex items-center gap-1 text-sm text-foreground cursor-pointer">
                <span>{featured.comments ?? 1} Comment</span>
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: 3-column masonry grid ── */}
        <div className="flex-1 min-w-0">
          <div className="columns-3 gap-3">
            {grid.map((tile, i) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => {
                  const realIdx = TILES.findIndex((t) => t.id === tile.id);
                  setFeaturedIdx(realIdx);
                }}
                className="mb-3 block w-full overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none break-inside-avoid"
              >
                <img
                  src={tile.image}
                  alt={`Offer ${tile.id}`}
                  className="w-full object-cover rounded-xl"
                  style={{ height: MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length] }}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
