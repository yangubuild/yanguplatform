import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PRODUCT_CATEGORIES } from "./productCategories";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function CategoryDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHoveredIdx(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (sub: string) => {
    onChange(sub);
    setOpen(false);
    setHoveredIdx(null);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full h-10 rounded-lg bg-background border border-border/60 px-3 text-sm text-left outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors">
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Select a product category ..."}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Panels */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 flex">
          {/* Main categories */}
          <div className="w-[240px] max-h-[360px] overflow-y-auto rounded-xl border border-border/60 bg-card py-1 shadow-lg">
            {PRODUCT_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                type="button"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => {
                  if (cat.subcategories.length === 0) {
                    handleSelect(cat.label);
                  }
                }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-colors ${
                  hoveredIdx === idx
                    ? "bg-muted/40 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <span>{cat.label}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
              </button>
            ))}
          </div>

          {/* Subcategories */}
          {hoveredIdx !== null && PRODUCT_CATEGORIES[hoveredIdx]?.subcategories.length> 0 && (
            <div
              className="w-[280px] max-h-[360px] overflow-y-auto rounded-xl border border-border/60 bg-card py-1 shadow-lg ml-1"
              onMouseLeave={() => {}}>
              {PRODUCT_CATEGORIES[hoveredIdx].subcategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSelect(sub)}
                  className="w-full px-5 py-2.5 text-sm text-left text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
