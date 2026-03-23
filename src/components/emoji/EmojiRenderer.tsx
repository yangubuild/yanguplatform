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
        // Custom emoji rendering disabled — Drive URLs broken.
        // Just render the text as-is (shortcodes will show as plain text).
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
