import { useEmojis } from "@/contexts/EmojiContext";
import { normalizeEmojiKeyword } from "@/lib/emojiSystem";

interface EmojiRendererProps {
  /** Text that may contain :keyword: shortcodes */
  text: string;
  className?: string;
}

/**
 * EmojiRenderer — Renders text with :keyword: shortcodes replaced
 * by custom emoji images inline.
 *
 * Usage: <EmojiRenderer text="Hello :love: world :fire:" />
 */
export function EmojiRenderer({ text, className }: EmojiRendererProps) {
  const { customEmojis } = useEmojis();

  if (!text) return null;

  // Match :keyword: patterns
  const parts = text.split(/(:[a-z0-9_-]+:)/gi);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^:([a-z0-9_-]+):$/i);
        if (match) {
          const keyword = normalizeEmojiKeyword(match[1]);
          const emoji = customEmojis.find((e) => e.keyword === keyword);
          if (emoji) {
            return (
              <img
                key={i}
                src={emoji.thumbnailUrl}
                alt={`:${emoji.keyword}:`}
                title={`:${emoji.keyword}:`}
                className="inline-block align-text-bottom"
                style={{ width: "1.2em", height: "1.2em" }}
              />
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
