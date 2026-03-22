import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import banner1 from "@/assets/banner-build-with-1.png";
import banner2 from "@/assets/banner-build-with-2.png";

const banners = [banner1, banner2];

export function NavDashPromoCards() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % banners.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div className="p-4 md:p-5">
      {/* Banner Carousel */}
      <div
        className="rounded-2xl overflow-hidden relative h-[160px] sm:h-[200px] md:h-[240px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        {banners.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Yangu banner ${i + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1000ms] ease-in-out"
            style={{ opacity: current === i ? 1 : 0 }}
            draggable={false}
          />
        ))}
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: current === i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                transform: current === i ? "scale(1.3)" : "scale(1)" }}
            />
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div
        className="mt-4 flex items-center gap-3 rounded-xl px-4 h-11 bg-muted border border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search offers"
          className="flex-1 bg-transparent text-sm outline-none border-none placeholder:text-muted-foreground text-foreground"
        />
      </div>
    </div>
  );
}
