import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useEmojis } from "@/contexts/EmojiContext";
import type { YanguEmoji } from "@/lib/emojiSystem";

interface YanguEmojiPickerProps {
  /** Called when an emoji is selected — either a unicode string or a custom emoji object */
  onSelect: (value: string | YanguEmoji) => void;
  onClose: () => void;
}

/**
 * YanguEmojiPicker — Global emoji picker panel.
 * Shows custom YANGU emojis (from Drive) + system unicode emojis.
 * Searchable grid, fast insert on click.
 */
export function YanguEmojiPicker({ onSelect, onClose }: YanguEmojiPickerProps) {
  const { customEmojis, systemEmojis, isLoading, search } = useEmojis();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"custom" | "system">("system");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim() ? search(query) : { custom: customEmojis, system: systemEmojis };

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden shadow-2xl"
      style={{ background: "#111a15", width: 320, maxHeight: 360 }}
      onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs font-semibold text-muted-foreground">Emojis</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-muted-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-border"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pb-1.5">
        <button
          onClick={() => setTab("custom")}
          className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
            tab === "custom"
              ? "bg-success/20 text-success"
              : "text-muted-foreground hover:text-muted-foreground hover:bg-white/5"
          }`}>
          yangu ({results.custom.length})
        </button>
        <button
          onClick={() => setTab("system")}
          className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
            tab === "system"
              ? "bg-success/20 text-success"
              : "text-muted-foreground hover:text-muted-foreground hover:bg-white/5"
          }`}>
          System ({results.system.length})
        </button>
      </div>

      {/* Grid */}
      <div className="px-3 pb-3 overflow-y-auto" style={{ maxHeight: 220 }}>
        {tab === "custom" ? (
          isLoading ? (
            <div className="text-center py-6 text-muted-foreground text-xs">Loading emojis...</div>
          ) : results.custom.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">No matching emojis</div>
          ) : (
            <div className="grid grid-cols-6 gap-1">
              {results.custom.map((emoji) => (
                <button
                  key={emoji.id}
                  onClick={() => onSelect(emoji)}
                  title={emoji.keyword}
                  className="aspect-square rounded-lg hover:bg-white/10 p-1 transition-colors flex items-center justify-center group relative">
                  <img
                    src={emoji.thumbnailUrl}
                    alt={emoji.keyword}
                    className="w-7 h-7 object-contain"
                    loading="lazy"
                  />
                  {/* Tooltip */}
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] bg-black/90 text-muted-foreground px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    :{emoji.keyword}:
                  </span>
                </button>
              ))}
            </div>
          )
        ) : results.system.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">No matching emojis</div>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {results.system.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-white/10">
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
