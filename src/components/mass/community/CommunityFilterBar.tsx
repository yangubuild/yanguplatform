import { useState } from "react";
import { categories } from "./communityData";

interface CommunityFilterBarProps {
  onFilterChange?: (category: string) => void;
}

export function CommunityFilterBar({ onFilterChange }: CommunityFilterBarProps) {
  const [active, setActive] = useState("Explore");

  const handleClick = (cat: string) => {
    setActive(cat);
    onFilterChange?.(cat);
  };

  return (
    <div
      className="sticky top-0 z-20 w-full border-b px-6"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}
    >
      <div
        className="mx-auto flex max-w-[1200px] gap-1.5 overflow-x-auto py-2.5"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => handleClick(cat)}
              className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-[5px] text-[12px] font-medium transition-colors"
              style={
                isActive
                  ? { backgroundColor: "#111827", color: "#FFFFFF" }
                  : { backgroundColor: "#F3F4F6", color: "#4B5563" }
              }
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
