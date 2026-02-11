import { useState } from "react";
import { stamps } from "./blogData";

/* SVG halftone-style icons for each stamp */
const stampIcons: Record<string, JSX.Element> = {
  read: (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="18" y="22" width="44" height="36" rx="2" fill="rgba(255,255,255,0.85)" />
      <rect x="22" y="28" width="16" height="2" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="22" y="33" width="36" height="2" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="22" y="38" width="36" height="2" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="22" y="43" width="28" height="2" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="22" y="48" width="32" height="2" rx="1" fill="currentColor" opacity="0.3" />
      <path d="M42 24L54 24L54 36L42 36Z" fill="currentColor" opacity="0.2" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="14" y="24" width="52" height="34" rx="3" fill="rgba(255,255,255,0.85)" />
      <path d="M14 27L40 44L66 27" stroke="currentColor" strokeWidth="2.5" opacity="0.5" fill="none" />
      <path d="M14 58L30 42" stroke="currentColor" strokeWidth="1.5" opacity="0.3" fill="none" />
      <path d="M66 58L50 42" stroke="currentColor" strokeWidth="1.5" opacity="0.3" fill="none" />
    </svg>
  ),
  speak: (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="34" y="18" width="12" height="30" rx="6" fill="rgba(255,255,255,0.85)" />
      <path d="M26 40C26 50 32 56 40 56C48 56 54 50 54 40" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" fill="none" />
      <line x1="40" y1="56" x2="40" y2="66" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
      <line x1="32" y1="66" x2="48" y2="66" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
    </svg>
  ),
  listen: (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <circle cx="40" cy="36" r="18" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" fill="none" />
      <circle cx="40" cy="36" r="8" fill="rgba(255,255,255,0.85)" />
      <path d="M28 54C28 54 32 62 40 62C48 62 52 54 52 54" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" />
      <line x1="36" y1="36" x2="36" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="40" y1="34" x2="40" y2="44" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="44" y1="36" x2="44" y2="42" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  ),
  write: (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <path d="M52 18L24 58" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 58L22 66L30 62L52 18" stroke="rgba(255,255,255,0.85)" strokeWidth="2" fill="rgba(255,255,255,0.15)" />
      <line x1="48" y1="22" x2="56" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
    </svg>
  ),
  organize: (
    <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
      <rect x="20" y="20" width="16" height="16" rx="3" fill="rgba(255,255,255,0.8)" />
      <rect x="44" y="20" width="16" height="16" rx="3" fill="rgba(255,255,255,0.6)" />
      <rect x="20" y="44" width="16" height="16" rx="3" fill="rgba(255,255,255,0.6)" />
      <rect x="44" y="44" width="16" height="16" rx="3" fill="rgba(255,255,255,0.8)" />
      <circle cx="28" cy="28" r="3" fill="currentColor" opacity="0.4" />
      <circle cx="52" cy="52" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  ),
};

/* Postmark SVG overlay */
function PostmarkOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1100 260"
      preserveAspectRatio="none"
      style={{ opacity: 0.08 }}
    >
      {/* Circular postmark 1 */}
      <circle cx="280" cy="100" r="70" stroke="#000" strokeWidth="2" fill="none" />
      <circle cx="280" cy="100" r="55" stroke="#000" strokeWidth="1" fill="none" />
      <line x1="200" y1="95" x2="360" y2="95" stroke="#000" strokeWidth="1.5" />
      <line x1="200" y1="105" x2="360" y2="105" stroke="#000" strokeWidth="1.5" />
      <text x="280" y="88" textAnchor="middle" fontSize="8" fill="#000" fontFamily="serif">YOUR FULFILLMENT</text>
      <text x="280" y="118" textAnchor="middle" fontSize="7" fill="#000" fontFamily="serif">2026</text>

      {/* Circular postmark 2 */}
      <circle cx="780" cy="140" r="60" stroke="#000" strokeWidth="1.5" fill="none" />
      <circle cx="780" cy="140" r="48" stroke="#000" strokeWidth="1" fill="none" />
      <line x1="710" y1="135" x2="850" y2="135" stroke="#000" strokeWidth="1.5" />
      <line x1="710" y1="145" x2="850" y2="145" stroke="#000" strokeWidth="1.5" />
      <text x="780" y="128" textAnchor="middle" fontSize="7" fill="#000" fontFamily="serif">EVERY · AI</text>
      <text x="780" y="158" textAnchor="middle" fontSize="7" fill="#000" fontFamily="serif">FIRST CLASS</text>

      {/* Wavy cancellation lines */}
      <path d="M50,160 Q100,145 150,160 Q200,175 250,160 Q300,145 350,160 Q400,175 450,160" stroke="#000" strokeWidth="1" fill="none" />
      <path d="M600,80 Q650,65 700,80 Q750,95 800,80 Q850,65 900,80 Q950,95 1000,80" stroke="#000" strokeWidth="1" fill="none" />
    </svg>
  );
}

/* Paper grain noise overlay */
function PaperGrain() {
  return (
    <div
      className="absolute inset-0 pointer-events-none rounded-[20px]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
        opacity: 0.5,
      }}
    />
  );
}

const PERFORATION_MASK = [
  "radial-gradient(circle at 0 50%, transparent 6px, #000 6.5px) left / 14px 14px repeat-y",
  "radial-gradient(circle at 100% 50%, transparent 6px, #000 6.5px) right / 14px 14px repeat-y",
  "radial-gradient(circle at 50% 0, transparent 6px, #000 6.5px) top / 14px 14px repeat-x",
  "radial-gradient(circle at 50% 100%, transparent 6px, #000 6.5px) bottom / 14px 14px repeat-x",
].join(", ");

export function BlogStampStrip() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="px-6 py-4">
      {/* The stamp band container */}
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          maxWidth: 1100,
          background: "#f0ede8",
          borderRadius: 20,
          padding: "28px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <PaperGrain />
        <PostmarkOverlay />

        {/* Scrollable stamp row */}
        <div
          className="relative flex flex-nowrap gap-3 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
          }}
        >
          <style>{`.stamp-band-inner::-webkit-scrollbar { display: none; }`}</style>

          {stamps.map((stamp) => {
            const isHovered = hovered === stamp.id;
            return (
              <button
                key={stamp.id}
                onMouseEnter={() => setHovered(stamp.id)}
                onMouseLeave={() => setHovered(null)}
                className="stamp-band-inner relative flex-shrink-0 cursor-pointer transition-all duration-200"
                style={{
                  width: 175,
                  height: 220,
                  background: stamp.color,
                  transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                  boxShadow: isHovered
                    ? "0 10px 30px rgba(0,0,0,0.35)"
                    : "0 2px 8px rgba(0,0,0,0.15)",
                  mask: PERFORATION_MASK,
                  WebkitMask: PERFORATION_MASK,
                  scrollSnapAlign: "start",
                }}
              >
                {/* Stamp title — top left, large serif */}
                <span
                  className="absolute top-4 left-4 font-bold"
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 22,
                    color: "rgba(0,0,0,0.75)",
                    lineHeight: 1,
                  }}
                >
                  {stamp.label}
                </span>

                {/* Hover reveal text */}
                <span
                  className="absolute top-12 left-4 text-xs transition-opacity duration-200"
                  style={{
                    color: "rgba(0,0,0,0.55)",
                    opacity: isHovered ? 1 : 0,
                    fontStyle: "italic",
                  }}
                >
                  {stamp.withText}
                </span>

                {/* Icon area — centered, halftone style */}
                <div
                  className="absolute bottom-6 left-1/2 -translate-x-1/2"
                  style={{
                    width: 72,
                    height: 72,
                    color: "rgba(0,0,0,0.35)",
                  }}
                >
                  {stampIcons[stamp.id]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
