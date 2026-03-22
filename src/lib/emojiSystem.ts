/**
 * YANGU Global Emoji System
 *
 * Single shared emoji registry used across all inputs:
 * chat, comments, posts, DMs, etc.
 *
 * Custom emojis are fetched from Google Drive once per session
 * and cached in memory for fast access.
 */

export interface YanguEmoji {
  id: string;
  keyword: string;
  name: string;
  url: string;
  thumbnailUrl: string;
}

// Common system emojis for fallback / quick access
export const SYSTEM_EMOJIS = [
  "😀", "😂", "😍", "🥺", "😎", "🤔", "👍", "👎",
  "❤️", "🔥", "🎉", "💯", "😮", "👏", "🙏", "✨",
  "💪", "🚀", "😢", "😡", "🥰", "😴", "🤯", "🤩",
  "👀", "💀", "🫡", "🫶", "😤", "🥳", "💰", "⭐",
];

let cachedEmojis: YanguEmoji[] | null = null;
let fetchPromise: Promise<YanguEmoji[]> | null = null;

/**
 * Fetch custom emojis from Drive via edge function.
 * Results are cached in memory for the entire session.
 */
export async function fetchCustomEmojis(): Promise<YanguEmoji[]> {
  // Return cache if available
  if (cachedEmojis) return cachedEmojis;

  // Deduplicate concurrent calls
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/list-drive-emojis`,
        {
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
          },
        }
      );

      if (!res.ok) {
        console.error("Failed to fetch custom emojis:", res.status);
        return [];
      }

      const data = await res.json();
      cachedEmojis = data.emojis || [];
      return cachedEmojis!;
    } catch (err) {
      console.error("Error fetching custom emojis:", err);
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Search custom emojis by keyword.
 * Matches against the keyword (filename) and partial matches.
 */
export function searchCustomEmojis(
  emojis: YanguEmoji[],
  query: string
): YanguEmoji[] {
  if (!query.trim()) return emojis;
  const q = query.toLowerCase().trim();
  return emojis.filter(
    (e) =>
      e.keyword.includes(q) ||
      e.name.toLowerCase().includes(q)
  );
}

/**
 * Search system (unicode) emojis by rough keyword mapping.
 */
export function searchSystemEmojis(query: string): string[] {
  if (!query.trim()) return SYSTEM_EMOJIS;
  const q = query.toLowerCase().trim();

  const SYSTEM_EMOJI_KEYWORDS: Record<string, string[]> = {
    "😀": ["smile", "happy", "grin"],
    "😂": ["laugh", "lol", "cry", "funny"],
    "😍": ["love", "heart", "eyes", "adore"],
    "🥺": ["please", "sad", "puppy", "beg"],
    "😎": ["cool", "sunglasses", "boss"],
    "🤔": ["think", "hmm", "wonder"],
    "👍": ["like", "yes", "ok", "thumb", "up", "agree"],
    "👎": ["dislike", "no", "down", "disagree"],
    "❤️": ["love", "heart", "red"],
    "🔥": ["fire", "hot", "lit", "flame"],
    "🎉": ["party", "celebrate", "congrats"],
    "💯": ["perfect", "hundred", "score"],
    "😮": ["wow", "surprise", "shock", "omg"],
    "👏": ["clap", "bravo", "applause"],
    "🙏": ["pray", "thanks", "please", "hope"],
    "✨": ["sparkle", "star", "magic", "shine"],
    "💪": ["strong", "muscle", "power", "flex"],
    "🚀": ["rocket", "launch", "go", "fast"],
    "😢": ["cry", "sad", "tear"],
    "😡": ["angry", "mad", "rage"],
    "🥰": ["love", "blush", "sweet"],
    "😴": ["sleep", "tired", "zzz"],
    "🤯": ["mind", "blown", "explode"],
    "🤩": ["star", "excited", "amazing"],
    "👀": ["eyes", "look", "see", "watch"],
    "💀": ["dead", "skull", "dying"],
    "🫡": ["salute", "respect"],
    "🫶": ["heart", "hands", "love"],
    "😤": ["angry", "huff", "frustrated"],
    "🥳": ["party", "birthday", "celebrate"],
    "💰": ["money", "cash", "rich", "dollar"],
    "⭐": ["star", "favorite", "rating"],
  };

  return SYSTEM_EMOJIS.filter((emoji) => {
    const keywords = SYSTEM_EMOJI_KEYWORDS[emoji] || [];
    return keywords.some((kw) => kw.includes(q) || q.includes(kw));
  });
}

/** Clear the emoji cache (e.g., to force re-fetch) */
export function clearEmojiCache() {
  cachedEmojis = null;
  fetchPromise = null;
}
