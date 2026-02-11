import { useState } from "react";
import { stamps } from "./blogData";

/* Inline SVG icons for each stamp — no external assets */
function NewspaperIcon() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <pattern id="halftone-news" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.2" fill="rgba(255,255,255,0.25)" />
        </pattern>
      </defs>
      {/* Folded newspaper */}
      <rect x="20" y="30" width="80" height="65" rx="2" fill="rgba(255,255,255,0.85)" />
      <rect x="20" y="30" width="80" height="65" rx="2" fill="url(#halftone-news)" />
      <rect x="28" y="36" width="30" height="4" rx="1" fill="rgba(0,0,0,0.5)" />
      <rect x="28" y="44" width="64" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
      <rect x="28" y="50" width="64" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
      <rect x="28" y="56" width="64" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
      <rect x="28" y="62" width="40" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
      <rect x="28" y="70" width="28" height="20" rx="1" fill="rgba(0,0,0,0.12)" />
      <rect x="62" y="70" width="30" height="2" rx="1" fill="rgba(0,0,0,0.15)" />
      <rect x="62" y="76" width="30" height="2" rx="1" fill="rgba(0,0,0,0.15)" />
      <rect x="62" y="82" width="30" height="2" rx="1" fill="rgba(0,0,0,0.15)" />
      <rect x="62" y="88" width="20" height="2" rx="1" fill="rgba(0,0,0,0.15)" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <pattern id="halftone-env" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1" fill="rgba(255,255,255,0.2)" />
        </pattern>
      </defs>
      <rect x="18" y="35" width="84" height="55" rx="3" fill="rgba(255,255,255,0.85)" />
      <rect x="18" y="35" width="84" height="55" rx="3" fill="url(#halftone-env)" />
      <path d="M18 38 L60 68 L102 38" stroke="rgba(0,0,0,0.35)" strokeWidth="2" fill="none" />
      <path d="M18 87 L45 62" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />
      <path d="M102 87 L75 62" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />
      {/* Wax seal */}
      <circle cx="60" cy="72" r="10" fill="rgba(180,40,40,0.6)" />
      <circle cx="60" cy="72" r="7" fill="rgba(200,50,50,0.4)" />
      <text x="60" y="76" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.8)" fontFamily="serif">Y</text>
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <pattern id="halftone-mic" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1" fill="rgba(255,255,255,0.22)" />
        </pattern>
      </defs>
      {/* Mic body */}
      <rect x="48" y="20" width="24" height="50" rx="12" fill="rgba(255,255,255,0.8)" />
      <rect x="48" y="20" width="24" height="50" rx="12" fill="url(#halftone-mic)" />
      {/* Grille lines */}
      {[28, 34, 40, 46, 52, 58].map((y) => (
        <line key={y} x1="52" y1={y} x2="68" y2={y} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
      ))}
      {/* Stand arc */}
      <path d="M40 65 Q40 82 60 82 Q80 82 80 65" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" fill="none" />
      {/* Stand */}
      <line x1="60" y1="82" x2="60" y2="100" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
      <line x1="45" y1="100" x2="75" y2="100" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
    </svg>
  );
}

function BustIcon() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <pattern id="halftone-bust" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.1" fill="rgba(255,255,255,0.2)" />
        </pattern>
      </defs>
      {/* Head */}
      <ellipse cx="60" cy="42" rx="18" ry="22" fill="rgba(255,255,255,0.75)" />
      <ellipse cx="60" cy="42" rx="18" ry="22" fill="url(#halftone-bust)" />
      {/* Shoulders */}
      <path d="M30 95 Q30 72 60 72 Q90 72 90 95" fill="rgba(255,255,255,0.65)" />
      <path d="M30 95 Q30 72 60 72 Q90 72 90 95" fill="url(#halftone-bust)" />
      {/* Headphone band */}
      <path d="M38 35 Q38 15 60 15 Q82 15 82 35" stroke="rgba(255,255,255,0.9)" strokeWidth="3" fill="none" />
      {/* Ear cups */}
      <rect x="33" y="32" width="10" height="16" rx="4" fill="rgba(255,255,255,0.8)" />
      <rect x="77" y="32" width="10" height="16" rx="4" fill="rgba(255,255,255,0.8)" />
    </svg>
  );
}

function TypewriterIcon() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <pattern id="halftone-type" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1" fill="rgba(255,255,255,0.22)" />
        </pattern>
      </defs>
      {/* Paper */}
      <rect x="35" y="18" width="50" height="30" rx="1" fill="rgba(255,255,255,0.85)" />
      <rect x="42" y="24" width="36" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
      <rect x="42" y="30" width="36" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
      <rect x="42" y="36" width="24" height="2" rx="1" fill="rgba(0,0,0,0.2)" />
      {/* Body */}
      <rect x="20" y="50" width="80" height="35" rx="4" fill="rgba(255,255,255,0.7)" />
      <rect x="20" y="50" width="80" height="35" rx="4" fill="url(#halftone-type)" />
      {/* Keys row 1 */}
      {[30, 42, 54, 66, 78].map((x) => (
        <circle key={x} cx={x} cy="62" r="5" fill="rgba(0,0,0,0.25)" />
      ))}
      {/* Keys row 2 */}
      {[36, 48, 60, 72, 84].map((x) => (
        <circle key={x} cx={x} cy="76" r="5" fill="rgba(0,0,0,0.2)" />
      ))}
      {/* Platen */}
      <rect x="25" y="46" width="70" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
      {/* Base */}
      <rect x="18" y="85" width="84" height="8" rx="3" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

function FilingCabinetIcon() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <pattern id="halftone-file" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1" fill="rgba(255,255,255,0.2)" />
        </pattern>
      </defs>
      {/* Cabinet body */}
      <rect x="28" y="15" width="64" height="90" rx="3" fill="rgba(255,255,255,0.7)" />
      <rect x="28" y="15" width="64" height="90" rx="3" fill="url(#halftone-file)" />
      {/* Drawers */}
      {[20, 50, 80].map((y) => (
        <g key={y}>
          <rect x="32" y={y} width="56" height="24" rx="2" fill="rgba(255,255,255,0.3)" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <rect x="54" y={y + 9} width="12" height="5" rx="2" fill="rgba(0,0,0,0.2)" />
        </g>
      ))}
      {/* Label on top drawer */}
      <rect x="42" y="24" width="20" height="8" rx="1" fill="rgba(255,255,200,0.4)" />
    </svg>
  );
}

const stampSvgMap: Record<string, () => JSX.Element> = {
  read: NewspaperIcon,
  email: EnvelopeIcon,
  speak: MicrophoneIcon,
  listen: BustIcon,
  write: TypewriterIcon,
  organize: FilingCabinetIcon,
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
      <circle cx="900" cy="290" r="48" stroke="#333" strokeWidth="1.5" fill="none" />
      <circle cx="900" cy="290" r="36" stroke="#333" strokeWidth="0.8" fill="none" />
      <line x1="848" y1="285" x2="952" y2="285" stroke="#333" strokeWidth="1" />
      <line x1="848" y1="295" x2="952" y2="295" stroke="#333" strokeWidth="1" />
    </svg>
  );
}

/* Scalloped perforation mask — all 4 edges */
const S = 12;
const R = 5;
const PERFORATION_MASK = [
  `radial-gradient(circle at 0 50%, transparent ${R}px, #000 ${R + 0.5}px) left / ${S}px ${S}px repeat-y`,
  `radial-gradient(circle at 100% 50%, transparent ${R}px, #000 ${R + 0.5}px) right / ${S}px ${S}px repeat-y`,
  `radial-gradient(circle at 50% 0, transparent ${R}px, #000 ${R + 0.5}px) top / ${S}px ${S}px repeat-x`,
  `radial-gradient(circle at 50% 100%, transparent ${R}px, #000 ${R + 0.5}px) bottom / ${S}px ${S}px repeat-x`,
].join(", ");

export function BlogStampStrip() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="px-4 py-6">
      <div className="relative mx-auto overflow-hidden" style={{ maxWidth: 1200 }}>
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
            const SvgIcon = stampSvgMap[stamp.id];
            return (
              <button
                key={stamp.id}
                onMouseEnter={() => setHovered(stamp.id)}
                onMouseLeave={() => setHovered(null)}
                className="stamp-scroll relative flex-shrink-0 cursor-pointer transition-all duration-200 overflow-hidden"
                style={{
                  width: 195,
                  height: 260,
                  /* COLOR on the masked element itself — prevents black */
                  background: stamp.color,
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
                {/* Paper border frame */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "#f0ece6" }}
                />

                {/* Colored inner area with SVG art */}
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
                  {/* SVG icon art — zero network requests */}
                  {SvgIcon && (
                    <div className="absolute inset-0" style={{ opacity: 0.7 }}>
                      <SvgIcon />
                    </div>
                  )}
                </div>

                {/* Stamp title */}
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

                {/* Hover description */}
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

        {/* Postmark overlays */}
        <PostmarkOverlay />
      </div>

      {/* Debug proof — remove after confirmation */}
      <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        STAMP STRIP BUILD OK ✅
      </p>
    </section>
  );
}
