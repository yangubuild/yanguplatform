import { useState } from "react";

import stampRead from "@/assets/every-stamps/Read.png";
import stampEmail from "@/assets/every-stamps/Email.png";
import stampSpeak from "@/assets/every-stamps/Speak.png";
import stampListen from "@/assets/every-stamps/Listen.png";
import stampWrite from "@/assets/every-stamps/Write.png";
import stampOrganize from "@/assets/every-stamps/Organize.png";

const STAMPS = [
  { id: "read", src: stampRead, y: 3, w: 210, h: 430 },
  { id: "email", src: stampEmail, y: -3, w: 210, h: 430 },
  { id: "speak", src: stampSpeak, y: 4, w: 210, h: 430 },
  { id: "listen", src: stampListen, y: -2, w: 210, h: 430 },
  { id: "write", src: stampWrite, y: 3, w: 210, h: 430 },
  { id: "organize", src: stampOrganize, y: -3, w: 230, h: 460 },
];

export function BlogStampStrip() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="px-4 pt-2 pb-8">
      <div
        className="relative mx-auto flex flex-nowrap justify-center overflow-hidden md:overflow-hidden"
        style={{ maxWidth: 1100 }}
      >
        <style>{`.stamp-strip-wrap::-webkit-scrollbar{display:none}`}</style>

        <div className="stamp-strip-wrap flex flex-nowrap items-end justify-start md:justify-center overflow-x-auto md:overflow-x-hidden -webkit-overflow-scrolling-touch gap-0">
          {STAMPS.map((stamp) => {
            const isHov = hovered === stamp.id;
            return (
              <button
                key={stamp.id}
                onMouseEnter={() => setHovered(stamp.id)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex-shrink-0 cursor-pointer"
                style={{
                  width: stamp.w,
                  height: stamp.h,
                  marginLeft: -18,
                  marginRight: -18,
                  marginBottom: stamp.y,
                  transform: isHov ? "scale(1.12) translateY(-6px)" : "scale(1)",
                  filter: isHov ? "brightness(1.06) saturate(1.08)" : "brightness(1) saturate(1)",
                  boxShadow: isHov ? "0 14px 40px rgba(0,0,0,0.55)" : "0 4px 14px rgba(0,0,0,0.25)",
                  transition: "transform 250ms ease, filter 200ms ease, box-shadow 250ms ease",
                  zIndex: isHov ? 10 : 1,
                }}
              >
                <img
                  src={stamp.src}
                  alt={stamp.id}
                  loading="eager"
                  style={{ display: "block", width: stamp.w, height: stamp.h, objectFit: "contain" }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}