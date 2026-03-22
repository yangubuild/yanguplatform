import { useEmojis } from "@/contexts/EmojiContext";
import type { YanguEmoji } from "@/lib/emojiSystem";

interface EmojiSuggestionsProps {
  /** The current word being typed (extracted from input cursor position) */
  currentWord: string;
  /** Called when user selects an emoji from suggestions */
  onSelect: (value: string | YanguEmoji, keyword: string) => void;
}

/**
 * EmojiSuggestions — Inline suggestion bar shown above input.
 * Appears when the user types a word matching emoji keywords.
 * WhatsApp-style horizontal scroll.
 */
export function EmojiSuggestions({ currentWord, onSelect }: EmojiSuggestionsProps) {
  const { getSuggestions } = useEmojis();

  if (!currentWord || currentWord.length < 2) return null;

  const { custom, system } = getSuggestions(currentWord);
  const hasResults = custom.length > 0 || system.length > 0;

  if (!hasResults) return null;

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none rounded-lg"
      style={{ background: "rgba(17,26,21,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Custom emojis first */}
      {custom.map((emoji) => (
        <button
          key={emoji.id}
          onClick={() => onSelect(emoji, currentWord)}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
          title={`:${emoji.keyword}:`}
        >
          <img
            src={emoji.thumbnailUrl}
            alt={emoji.keyword}
            className="w-5 h-5 object-contain"
          />
          <span className="text-[10px] text-white/50">{emoji.keyword}</span>
        </button>
      ))}

      {/* System emojis */}
      {system.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji, currentWord)}
          className="shrink-0 text-base px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors hover:scale-110"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
