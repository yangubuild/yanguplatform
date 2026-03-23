import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useEmojis } from "@/contexts/EmojiContext";
import type { YanguEmoji } from "@/lib/emojiSystem";

interface YanguEmojiPickerProps {
  onSelect: (value: string | YanguEmoji) => void;
  onClose: () => void;
}

export function YanguEmojiPicker({ onSelect, onClose }: YanguEmojiPickerProps) {
  const { systemEmojis, search } = useEmojis();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim() ? search(query) : { custom: [], system: systemEmojis };

  return (
    <div
      className="rounded-xl border border-white/10 overflow-hidden shadow-2xl"
      style={{ background: "#1a2027", width: 320, maxHeight: 360 }}
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

      {/* Grid */}
      <div className="px-3 pb-3 overflow-y-auto" style={{ maxHeight: 260 }}>
        {results.system.length === 0 ? (
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
