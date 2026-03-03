// YANGU Animal Emoji avatar system utilities

export const YANGU_EMOJIS = [
  { key: "bear", label: "Bear" },
  { key: "cat", label: "Cat" },
  { key: "chipmunk", label: "Chipmunk" },
  { key: "cow", label: "Cow" },
  { key: "dog", label: "Dog" },
  { key: "elephant", label: "Elephant" },
  { key: "female_lion", label: "Lioness" },
  { key: "fox", label: "Fox" },
  { key: "giraffe", label: "Giraffe" },
  { key: "horse", label: "Horse" },
  { key: "lion", label: "Lion" },
  { key: "monkey", label: "Monkey" },
  { key: "mouse", label: "Mouse" },
  { key: "panda", label: "Panda" },
  { key: "pig", label: "Pig" },
  { key: "sheep", label: "Sheep" },
  { key: "tiger", label: "Tiger" },
  { key: "unicorn", label: "Unicorn" },
  { key: "wolf", label: "Wolf" },
] as const;

export type EmojiKey = (typeof YANGU_EMOJIS)[number]["key"];

/** Get the public URL for an emoji avatar key */
export function getEmojiAvatarUrl(key: string): string {
  return `/avatars/${key}.png`;
}

/** Resolve the display avatar URL given profile fields */
export function resolveAvatarUrl(profile: {
  avatar_mode?: string | null;
  avatar_emoji_key?: string | null;
  avatar_url?: string | null;
}): string | null {
  if (profile.avatar_mode === "emoji" && profile.avatar_emoji_key) {
    return getEmojiAvatarUrl(profile.avatar_emoji_key);
  }
  if (profile.avatar_url) {
    return profile.avatar_url;
  }
  return null;
}
