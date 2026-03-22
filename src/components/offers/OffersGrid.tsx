import { useState, useCallback } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";

/**
 * Offer tile data – Phase 2 will inject real poster images.
 * For now we use the existing custom-product-source covers as placeholders.
 */
const OFFER_TILES = [
  { id: "1", image: "/images/custom-product-source/cover-1.jpg", title: "Premium Branding Kit", description: "Complete identity package for creators", cta: "View Offer" },
  { id: "2", image: "/images/custom-product-source/cover-2.jpg", title: "Social Media Bundle", description: "30-day content calendar + templates", cta: "View Offer" },
  { id: "3", image: "/images/custom-product-source/cover-3.jpg", title: "E-Book Design Package", description: "Professional layout & cover design", cta: "View Offer" },
  { id: "4", image: "/images/custom-product-source/cover-4.jpg", title: "Launch Strategy Kit", description: "Step-by-step product launch plan", cta: "View Offer" },
  { id: "5", image: "/images/custom-product-source/cover-5.jpg", title: "Video Ad Production", description: "High-converting video ads in 48h", cta: "View Offer" },
  { id: "6", image: "/images/custom-product-source/cover-6.jpg", title: "Coaching Program", description: "1-on-1 business coaching sessions", cta: "View Offer" },
  { id: "7", image: "/images/custom-product-source/cover-7.jpg", title: "Website Starter Pack", description: "Custom landing page + domain setup", cta: "View Offer" },
  { id: "8", image: "/images/custom-product-source/cover-8.jpg", title: "Print-on-Demand Setup", description: "Store launch with 10 product designs", cta: "View Offer" },
  { id: "9", image: "/images/custom-product-source/cover-9.jpg", title: "Digital Course Template", description: "Ready-to-launch course framework", cta: "View Offer" },
  { id: "10", image: "/images/custom-product-source/cover-10.jpg", title: "Photography Pack", description: "Professional product photography", cta: "View Offer" },
  { id: "11", image: "/images/custom-product-source/cover-11.jpg", title: "SEO Audit Service", description: "Full site audit & action plan", cta: "View Offer" },
  { id: "12", image: "/images/custom-product-source/cover-12.jpg", title: "Email Marketing Kit", description: "Sequences, templates & strategy", cta: "View Offer" },
];

interface OfferTile {
  id: string;
  image: string;
  title: string;
  description: string;
  cta: string;
}

function TileCard({
  tile,
  height,
  onClick,
}: {
  tile: OfferTile;
  height: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl text-left transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ height }}
    >
      {/* Image */}
      <img
        src={tile.image}
        alt={tile.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white sm:text-base">{tile.title}</h3>
          <p className="mt-0.5 truncate text-[11px] text-white/70 sm:text-xs">{tile.description}</p>
        </div>
        <span
          className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}
        >
          {tile.cta}
        </span>
      </div>

      {/* Social bar */}
      <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 backdrop-blur-sm">
        <Heart className="h-3.5 w-3.5 text-white/80" />
        <MessageCircle className="h-3.5 w-3.5 text-white/80" />
        <Share2 className="h-3.5 w-3.5 text-white/80" />
      </div>
    </button>
  );
}

export function OffersGrid() {
  const [featuredIdx, setFeaturedIdx] = useState(0);

  const swap = useCallback(
    (clickedIdx: number) => {
      if (clickedIdx === featuredIdx) return;
      setFeaturedIdx(clickedIdx);
    },
    [featuredIdx]
  );

  // Build ordered list: featured first, then rest
  const featured = OFFER_TILES[featuredIdx];
  const rest = OFFER_TILES.filter((_, i) => i !== featuredIdx);

  // Chunk helpers
  const row1Right = rest.slice(0, 2); // 2 stacked beside featured
  const row2 = rest.slice(2, 5);       // 3 equal
  const row3Left = rest.slice(5, 6);   // 1 tall
  const row3Right = rest.slice(6, 8);  // 2 stacked
  const row4 = rest.slice(8);          // remaining

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10">
      {/* ── ROW 1: Featured (2-col) + 2 stacked ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Featured big card */}
        <div className="md:col-span-2">
          <TileCard tile={featured} height="360px" onClick={() => {}} />
        </div>

        {/* 2 stacked small cards */}
        <div className="flex flex-col gap-4">
          {row1Right.map((tile) => {
            const realIdx = OFFER_TILES.findIndex((t) => t.id === tile.id);
            return (
              <TileCard key={tile.id} tile={tile} height="172px" onClick={() => swap(realIdx)} />
            );
          })}
        </div>
      </div>

      {/* ── ROW 2: 3 equal cards ── */}
      {row2.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {row2.map((tile) => {
            const realIdx = OFFER_TILES.findIndex((t) => t.id === tile.id);
            return (
              <TileCard key={tile.id} tile={tile} height="220px" onClick={() => swap(realIdx)} />
            );
          })}
        </div>
      )}

      {/* ── ROW 3: 1 tall left + 2 stacked right ── */}
      {row3Left.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            {row3Left.map((tile) => {
              const realIdx = OFFER_TILES.findIndex((t) => t.id === tile.id);
              return (
                <TileCard key={tile.id} tile={tile} height="360px" onClick={() => swap(realIdx)} />
              );
            })}
          </div>
          <div className="flex flex-col gap-4 md:col-span-2">
            {row3Right.map((tile) => {
              const realIdx = OFFER_TILES.findIndex((t) => t.id === tile.id);
              return (
                <TileCard key={tile.id} tile={tile} height="172px" onClick={() => swap(realIdx)} />
              );
            })}
          </div>
        </div>
      )}

      {/* ── ROW 4+: remaining in 3-col grid ── */}
      {row4.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {row4.map((tile) => {
            const realIdx = OFFER_TILES.findIndex((t) => t.id === tile.id);
            return (
              <TileCard key={tile.id} tile={tile} height="220px" onClick={() => swap(realIdx)} />
            );
          })}
        </div>
      )}
    </div>
  );
}
