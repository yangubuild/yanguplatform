import { useState } from "react";
import { X, Search } from "lucide-react";

interface TypographyPopupProps {
  onClose: () => void;
  onApply: (style: Record<string, string>) => void;
}

const FONT_FAMILIES = [
  "Inter", "Playfair Display", "Montserrat", "Lora", "Roboto", "Open Sans",
  "Poppins", "Raleway", "Merriweather", "Oswald", "Source Sans Pro", "Nunito",
  "DM Sans", "Crimson Text", "Libre Baskerville", "Work Sans", "Fira Sans",
  "Josefin Sans", "Cormorant Garamond", "Archivo",
];

const HEADING_STYLES = [
  { label: "Heading 1", value: "2.5rem", weight: "700" },
  { label: "Heading 2", value: "2rem", weight: "700" },
  { label: "Heading 3", value: "1.5rem", weight: "600" },
  { label: "Body", value: "1rem", weight: "400" },
  { label: "Small", value: "0.875rem", weight: "400" },
];

export function TypographyPopup({ onClose, onApply }: TypographyPopupProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"fonts" | "styles">("fonts");

  const filtered = FONT_FAMILIES.filter(f =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-[260px] bg-background rounded-xl shadow-2xl border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-sm font-semibold text-foreground">Typography</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Toggle */}
      <div className="flex mx-4 mb-2 rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setView("fonts")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${view === "fonts" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >Fonts</button>
        <button
          onClick={() => setView("styles")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${view === "styles" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
        >Styles</button>
      </div>

      {view === "fonts" ? (
        <>
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search fonts..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto px-2 pb-2">
            {filtered.map(font => (
              <button
                key={font}
                onClick={() => onApply({ fontFamily: font })}
                className="w-full px-3 py-2 text-sm text-left rounded-md hover:bg-muted/60 transition-colors"
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="max-h-[240px] overflow-y-auto px-2 pb-2">
          {HEADING_STYLES.map(s => (
            <button
              key={s.label}
              onClick={() => onApply({ fontSize: s.value, fontWeight: s.weight })}
              className="w-full px-3 py-2.5 text-left rounded-md hover:bg-muted/60 transition-colors border border-border/40 mb-1"
            >
              <span className="text-foreground" style={{ fontSize: s.value, fontWeight: s.weight }}>{s.label}</span>
              <span className="text-xs text-muted-foreground ml-2">{s.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
