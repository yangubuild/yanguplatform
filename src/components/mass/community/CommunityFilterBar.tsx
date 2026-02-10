import { useState } from "react";
import { ChevronRight } from "lucide-react";
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
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 py-3">
        <div
          className="flex flex-1 gap-3 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
          {categories.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => handleClick(cat)}
                className="shrink-0 whitespace-nowrap rounded-full px-4 py-[7px] text-[13px] font-medium transition-colors"
                style={
                  isActive
                    ? { backgroundColor: "#111827", color: "#FFFFFF" }
                    : {
                        backgroundColor: "#FFFFFF",
                        color: "#374151",
                        border: "1px solid #E5E7EB",
                      }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
        {/* Scroll arrow */}
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-600">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
