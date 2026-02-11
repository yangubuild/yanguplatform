import { useState } from "react";
import { stamps } from "./blogData";

import stampRead from "@/assets/stamps/stamp-read.png";
import stampEmail from "@/assets/stamps/stamp-email.png";
import stampSpeak from "@/assets/stamps/stamp-speak.png";
import stampListen from "@/assets/stamps/stamp-listen.png";
import stampWrite from "@/assets/stamps/stamp-write.png";
import stampOrganize from "@/assets/stamps/stamp-organize.png";

const stampImages: Record<string, string> = {
  read: stampRead,
  email: stampEmail,
  speak: stampSpeak,
  listen: stampListen,
  write: stampWrite,
  organize: stampOrganize,
};

/* Postmark SVG overlay */
function PostmarkOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 360"
      preserveAspectRatio="none"
      style={{ opacity: 0.12 }}
    >
      <circle cx="220" cy="280" r="55" stroke="#333" strokeWidth="1.5" fill="none" />
      <circle cx="220" cy="280" r="42" stroke="#333" strokeWidth="1" fill="none" />
      <line x1="160" y1="275" x2="280" y2="275" stroke="#333" strokeWidth="1.2" />
      <line x1="160" y1="285" x2="280" y2="285" stroke="#333" strokeWidth="1.2" />
      <text x="220" y="270" textAnchor="middle" fontSize="6" fill="#333" fontFamily="serif">TOUR EIFFEL</text>
      <text x="220" y="296" textAnchor="middle" fontSize="5" fill="#333" fontFamily="serif">2026</text>

      <circle cx="520" cy="300" r="50" stroke="#333" strokeWidth="1.2" fill="none" />
      <circle cx="520" cy="300" r="38" stroke="#333" strokeWidth="0.8" fill="none" />
      <line x1="465" y1="295" x2="575" y2="295" stroke="#333" strokeWidth="1.2" />
      <line x1="465" y1="305" x2="575" y2="305" stroke="#333" strokeWidth="1.2" />
      <text x="520" y="290" textAnchor="middle" fontSize="5.5" fill="#333" fontFamily="serif">TOUR EIFFEL</text>

      <circle cx="900" cy="290" r="48" stroke="#333" strokeWidth="1.5" fill="none" />
      <circle cx="900" cy="290" r="36" stroke="#333" strokeWidth="0.8" fill="none" />
      <line x1="848" y1="285" x2="952" y2="285" stroke="#333" strokeWidth="1" />
      <line x1="848" y1="295" x2="952" y2="295" stroke="#333" strokeWidth="1" />

      <circle cx="1100" cy="260" r="44" stroke="#333" strokeWidth="1.2" fill="none" />
      <circle cx="1100" cy="260" r="33" stroke="#333" strokeWidth="0.8" fill="none" />
      <line x1="1052" y1="255" x2="1148" y2="255" stroke="#333" strokeWidth="1" />
      <line x1="1052" y1="265" x2="1148" y2="265" stroke="#333" strokeWidth="1" />
    </svg>
  );
}

/* The scalloped perforation mask for each stamp — all 4 edges */
const PERF_SIZE = 12; // scallop period
const PERF_R = 5;     // hole radius

const PERFORATION_MASK = [
  `radial-gradient(circle at 0 50%, transparent ${PERF_R}px, #000 ${PERF_R + 0.5}px) left / ${PERF_SIZE}px ${PERF_SIZE}px repeat-y`,
  `radial-gradient(circle at 100% 50%, transparent ${PERF_R}px, #000 ${PERF_R + 0.5}px) right / ${PERF_SIZE}px ${PERF_SIZE}px repeat-y`,
  `radial-gradient(circle at 50% 0, transparent ${PERF_R}px, #000 ${PERF_R + 0.5}px) top / ${PERF_SIZE}px ${PERF_SIZE}px repeat-x`,
  `radial-gradient(circle at 50% 100%, transparent ${PERF_R}px, #000 ${PERF_R + 0.5}px) bottom / ${PERF_SIZE}px ${PERF_SIZE}px repeat-x`,
].join(", ");

export function BlogStampStrip() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="px-4 py-6">
      <div
        className="relative mx-auto overflow-hidden"
        style={{
          maxWidth: 1200,
        }}
      >
        {/* Scrollable stamp row */}
        <div
          className="relative flex flex-nowrap gap-0 overflow-x-auto justify-center"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
            padding: "16px 8px",
          }}
        >
          <style>{`.stamp-scroll::-webkit-scrollbar { display: none; }`}</style>

          {stamps.map((stamp) => {
            const isHovered = hovered === stamp.id;
            return (
              <button
                key={stamp.id}
                onMouseEnter={() => setHovered(stamp.id)}
                onMouseLeave={() => setHovered(null)}
                className="stamp-scroll relative flex-shrink-0 cursor-pointer transition-all duration-200 overflow-hidden"
                style={{
                  width: 195,
                  height: 260,
                  background: "#f0ece6",
                  transform: isHovered ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
                  filter: isHovered ? "brightness(1.1) contrast(1.05)" : "brightness(1) contrast(1)",
                  boxShadow: isHovered
                    ? "0 12px 36px rgba(0,0,0,0.5)"
                    : "0 4px 16px rgba(0,0,0,0.3)",
                  mask: PERFORATION_MASK,
                  WebkitMask: PERFORATION_MASK,
                  scrollSnapAlign: "start",
                  marginLeft: -2,
                  marginRight: -2,
                }}
              >
                {/* Paper grain texture */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")`,
                    backgroundSize: "128px 128px",
                    mixBlendMode: "multiply",
                  }}
                />

                {/* Color block with image */}
                <div
                  className="absolute"
                  style={{
                    top: 14,
                    left: 14,
                    right: 14,
                    bottom: 14,
                    background: stamp.color,
                    overflow: "hidden",
                  }}
                >
                  {/* Halftone stamp image */}
                  <img
                    src={stampImages[stamp.id]}
                    alt={stamp.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      mixBlendMode: "multiply",
                      opacity: 0.9,
                      filter: "contrast(1.2) saturate(1.1)",
                    }}
                  />
                </div>

                {/* Stamp title — top left inside color block */}
                <span
                  className="absolute z-20"
                  style={{
                    top: 22,
                    left: 22,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 28,
                    fontWeight: 400,
                    color: "#FFFFFF",
                    lineHeight: 1,
                    textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {stamp.label}
                </span>

                {/* Hover reveal: description text */}
                <span
                  className="absolute z-20 transition-all duration-200"
                  style={{
                    top: 52,
                    left: 22,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: 14,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.9)",
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? "translateY(0)" : "translateY(4px)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                >
                  {stamp.withText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Postmark overlays across the strip */}
        <PostmarkOverlay />
      </div>
    </section>
  );
}
