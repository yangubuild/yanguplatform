import { useEmojis } from "@/contexts/EmojiContext";

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
  const parts = text.split(/(:[\w]+:)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^:([\w]+):$/);
        if (match) {
          const keyword = match[1].toLowerCase();
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
