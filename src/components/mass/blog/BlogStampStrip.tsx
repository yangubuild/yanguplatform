import { useState } from "react";
import { stamps } from "./blogData";

export function BlogStampStrip() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="px-6 py-8">
      <div
        className="mx-auto flex flex-nowrap gap-4 overflow-x-auto"
        style={{
          maxWidth: 1100,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.stamp-strip::-webkit-scrollbar { display: none; }`}</style>
        {stamps.map((stamp) => {
          const isHovered = hovered === stamp.id;
          return (
            <button
              key={stamp.id}
              onMouseEnter={() => setHovered(stamp.id)}
              onMouseLeave={() => setHovered(null)}
              className="stamp-strip relative flex-shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                width: 160,
                height: 190,
                background: stamp.color,
                borderRadius: 8,
                transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: isHovered
                  ? "0 8px 24px rgba(0,0,0,0.4)"
                  : "0 2px 8px rgba(0,0,0,0.2)",
                maskImage:
                  "radial-gradient(circle 6px at 6px 6px, transparent 5px, black 5.5px) -6px -6px / calc(100% + 12px) calc(100% + 12px)",
                WebkitMaskImage:
                  "radial-gradient(circle 6px at 6px 6px, transparent 5px, black 5.5px) -6px -6px / calc(100% + 12px) calc(100% + 12px)",
              }}
            >
              {/* Hover reveal text */}
              <span
                className="absolute top-3 left-3 text-xs font-medium transition-opacity duration-200"
                style={{
                  color: "rgba(0,0,0,0.7)",
                  opacity: isHovered ? 1 : 0,
                }}
              >
                {stamp.withText}
              </span>

              {/* Icon */}
              <span className="text-4xl mb-2">{stamp.icon}</span>

              {/* Label */}
              <span
                className="text-sm font-semibold"
                style={{ color: "rgba(0,0,0,0.8)" }}
              >
                {stamp.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
