import { useState } from "react";

import stampRead from "@/assets/every-stamps/Read.png";
import stampEmail from "@/assets/every-stamps/Email.png";
import stampSpeak from "@/assets/every-stamps/Speak.png";
import stampListen from "@/assets/every-stamps/Listen.png";
import stampWrite from "@/assets/every-stamps/Write.png";
import stampOrganize from "@/assets/every-stamps/Organize.png";

const STAMPS = [
  {
    id: "read",
    src: stampRead,
    transform: "rotate(-1.5deg) translateY(2px)",
    overlayColor: "rgba(47,143,106,1)",
  },
  {
    id: "email",
    src: stampEmail,
    transform: "rotate(1.2deg) translateY(-1px)",
    overlayColor: "rgba(20,59,255,1)",
  },
  {
    id: "speak",
    src: stampSpeak,
    transform: "rotate(-0.8deg) translateY(1px)",
    overlayColor: "rgba(107,24,255,1)",
  },
  {
    id: "listen",
    src: stampListen,
    transform: "rotate(0.9deg) translateY(-2px)",
    overlayColor: "rgba(176,70,35,1)",
  },
  {
    id: "write",
    src: stampWrite,
    transform: "rotate(-0.7deg) translateY(1px)",
    overlayColor: "rgba(215,122,32,1)",
  },
  {
    id: "organize",
    src: stampOrganize,
    transform: "rotate(1.0deg) translateY(-1px)",
    overlayColor: "rgba(201,178,74,1)",
  },
];

export function BlogStampStrip() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="px-4 py-8">
      <div
        className="relative mx-auto flex flex-nowrap justify-center overflow-x-auto"
        style={{
          maxWidth: 1200,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.stamp-strip-wrap::-webkit-scrollbar{display:none}`}</style>

        <div className="stamp-strip-wrap flex flex-nowrap justify-center">
          {STAMPS.map((stamp) => {
            const isHov = hovered === stamp.id;
            return (
              <button
                key={stamp.id}
                onMouseEnter={() => setHovered(stamp.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex-shrink-0 cursor-pointer overflow-hidden"
                style={{
                  width: 195,
                  height: 260,
                  marginLeft: -6,
                  marginRight: -6,
                  transform: isHov
                    ? `${stamp.transform} translateY(-2px)`
                    : stamp.transform,
                  filter: isHov
                    ? "brightness(1.08) saturate(1.1)"
                    : "brightness(1) saturate(1)",
                  boxShadow: isHov
                    ? "0 10px 30px rgba(0,0,0,0.45)"
                    : "0 4px 14px rgba(0,0,0,0.25)",
                  transition: "transform 200ms ease, filter 200ms ease, box-shadow 200ms ease",
                  zIndex: isHov ? 10 : 1,
                }}
              >
                {/* The stamp image — real <img>, no background-image */}
                <img
                  src={stamp.src}
                  alt={stamp.id}
                  style={{
                    display: "block",
                    width: 195,
                    height: 260,
                    objectFit: "contain",
                  }}
                />

                {/* Overlay that hides the "with …" line — fades out on hover */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: 22,
                    right: 22,
                    top: 100,
                    height: 34,
                    background: stamp.overlayColor,
                    opacity: isHov ? 0 : 1,
                    transition: "opacity 200ms ease",
                    borderRadius: 2,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Debug proof — remove after confirmation */}
      <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
        STAMP STRIP BUILD OK ✅
      </p>
    </section>
  );
}
