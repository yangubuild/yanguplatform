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
    <div className="w-full px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#FFFFFF" }}>
      <div
        className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => handleClick(cat)}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0"
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
  );
}
