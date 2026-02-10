import { useState, useRef } from "react";
import { categories } from "./communityData";

interface CommunityFilterBarProps {
  onFilterChange?: (category: string) => void;
}

export function CommunityFilterBar({ onFilterChange }: CommunityFilterBarProps) {
  const [active, setActive] = useState("Explore");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClick = (cat: string) => {
    setActive(cat);
    onFilterChange?.(cat);
  };

  return (
    <div
      className="sticky top-[60px] z-20 w-full border-b px-6"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}
    >
      <div
        ref={scrollRef}
        className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto py-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`[data-community-filters]::-webkit-scrollbar { display: none; }`}</style>
        <div data-community-filters className="contents">
          {categories.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => handleClick(cat)}
                className="shrink-0 whitespace-nowrap rounded-full px-4 py-[6px] text-[13px] font-medium transition-colors"
                style={
                  isActive
                    ? { backgroundColor: "#111827", color: "#FFFFFF" }
                    : { backgroundColor: "#F3F4F6", color: "#374151" }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
