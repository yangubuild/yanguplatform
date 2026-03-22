import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  fetchCustomEmojis,
  searchCustomEmojis,
  searchSystemEmojis,
  SYSTEM_EMOJIS,
  type YanguEmoji,
} from "@/lib/emojiSystem";

interface EmojiContextValue {
  /** All custom YANGU emojis from Drive */
  customEmojis: YanguEmoji[];
  /** System (unicode) emojis */
  systemEmojis: string[];
  /** Whether custom emojis are still loading */
  isLoading: boolean;
  /** Search both custom and system emojis */
  search: (query: string) => {
    custom: YanguEmoji[];
    system: string[];
  };
  /** Get suggestions for type-to-suggest (partial word match) */
  getSuggestions: (word: string) => {
    custom: YanguEmoji[];
    system: string[];
  };
}

const EmojiContext = createContext<EmojiContextValue | null>(null);

export function EmojiProvider({ children }: { children: ReactNode }) {
  const [customEmojis, setCustomEmojis] = useState<YanguEmoji[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchCustomEmojis()
      .then((emojis) => {
        if (mounted) {
          setCustomEmojis(emojis);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const search = useCallback(
    (query: string) => ({
      custom: searchCustomEmojis(customEmojis, query),
      system: searchSystemEmojis(query),
    }),
    [customEmojis]
  );

  const getSuggestions = useCallback(
    (word: string) => {
      if (!word || word.length < 2) return { custom: [], system: [] };
      const q = word.toLowerCase();
      return {
        custom: customEmojis
          .filter((e) => e.keyword.startsWith(q) || e.keyword.includes(q))
          .slice(0, 8),
        system: searchSystemEmojis(q).slice(0, 6),
      };
    },
    [customEmojis]
  );

  return (
    <EmojiContext.Provider
      value={{
        customEmojis,
        systemEmojis: SYSTEM_EMOJIS,
        isLoading,
        search,
        getSuggestions }}
    >
      {children}
    </EmojiContext.Provider>
  );
}

export function useEmojis() {
  const ctx = useContext(EmojiContext);
  if (!ctx) {
    throw new Error("useEmojis must be used within an EmojiProvider");
  }
  return ctx;
}
