import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { categories } from "./communityData";
import { useCommunityTheme, getThemeColors } from "./CommunityThemeContext";

interface CommunityFilterBarProps {
  onFilterChange?: (category: string) => void;
}

export function CommunityFilterBar({ onFilterChange }: CommunityFilterBarProps) {
  const [active, setActive] = useState("Explore");
  const { theme } = useCommunityTheme();
  const c = getThemeColors(theme);

  const handleClick = (cat: string) => {
    setActive(cat);
    onFilterChange?.(cat);
  };

  return (
    <div
      className="sticky top-0 z-20 w-full px-6 transition-colors duration-300"
      style={{ backgroundColor: c.bg }}>
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 py-4 px-4 sm:px-6 lg:px-10">
        <div className="flex flex-1 gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {categories.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => handleClick(cat)}
                className="shrink-0 whitespace-nowrap rounded-lg px-4 py-[7px] text-[13px] font-medium transition-colors"
                style={
                  isActive
                    ? { background: c.filterActiveBg, color: c.filterActiveText }
                    : {
                        backgroundColor: c.filterInactiveBg,
                        color: c.filterInactiveText,
                        border: `1px solid ${c.filterInactiveBorder}`,
                      }
                }>
                {cat}
              </button>
            );
          })}
        </div>
        <button
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors"
          style={{ borderColor: c.scrollBtnBorder, color: c.scrollBtnText }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
