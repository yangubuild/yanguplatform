import { useState, useCallback, useRef } from "react";
import type { YanguEmoji } from "@/lib/emojiSystem";

/**
 * useEmojiInput — Hook to add emoji support to any text input.
 *
 * Provides:
 * - currentWord tracking for type-to-suggest
 * - insertEmoji to insert at cursor position
 * - replaceCurrentWord to swap typed keyword with emoji
 */
export function useEmojiInput(
  value: string,
  onChange: (newValue: string) => void
) {
  const [currentWord, setCurrentWord] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  /**
   * Call this on every input change to track the current word
   * being typed (for emoji suggestions).
   */
  const handleInputChange = useCallback(
    (newValue: string, cursorPos?: number) => {
      onChange(newValue);

      // Extract the word at cursor position
      const pos = cursorPos ?? newValue.length;
      const before = newValue.slice(0, pos);
      const wordMatch = before.match(/(\S+)$/);
      const word = wordMatch?.[1] || "";

      // Only suggest if word is 2+ chars and doesn't start with special chars
      if (word.length >= 2 && !/^[@#\[]/.test(word)) {
        setCurrentWord(word);
      } else {
        setCurrentWord("");
      }
    },
    [onChange]
  );

  /**
   * Insert an emoji at the end of the current text.
   */
  const insertEmoji = useCallback(
    (emoji: string | YanguEmoji) => {
      if (typeof emoji === "string") {
        // Unicode emoji — just append
        onChange(value + emoji);
      } else {
        // Custom emoji — insert as :keyword: shortcode
        onChange(value + `:${emoji.keyword}:`);
      }
      setCurrentWord("");
    },
    [value, onChange]
  );

  /**
   * Replace the currently typed word with an emoji.
   * Used by type-to-suggest when user clicks a suggestion.
   */
  const replaceCurrentWord = useCallback(
    (emoji: string | YanguEmoji, word: string) => {
      if (!word) {
        insertEmoji(emoji);
        return;
      }

      // Find the last occurrence of the word and replace it
      const lastIdx = value.lastIndexOf(word);
      if (lastIdx === -1) {
        insertEmoji(emoji);
        return;
      }

      const before = value.slice(0, lastIdx);
      const after = value.slice(lastIdx + word.length);

      if (typeof emoji === "string") {
        onChange(before + emoji + after);
      } else {
        onChange(before + `:${emoji.keyword}:` + after);
      }
      setCurrentWord("");
    },
    [value, onChange, insertEmoji]
  );

  return {
    currentWord,
    handleInputChange,
    insertEmoji,
    replaceCurrentWord,
    inputRef,
  };
}
