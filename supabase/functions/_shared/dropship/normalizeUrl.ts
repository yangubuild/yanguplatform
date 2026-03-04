/**
 * Normalize an image/asset URL:
 *  - protocol-relative `//` → `https://`
 *  - `http://` → `https://`
 *  - empty / falsy → null
 */
export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  let u = url.trim();
  if (!u) return null;
  if (u.startsWith("//")) u = `https:${u}`;
  else if (u.startsWith("http://")) u = u.replace("http://", "https://");
  return u;
}

/**
 * Extract image URLs from a raw provider value that could be:
 *  - a string (single URL)
 *  - a comma-separated string
 *  - an array of strings
 *  - an array of objects with `imageUrl` / `src` / `url` keys
 *  Returns a normalized, deduplicated string[].
 */
export function extractImageUrls(raw: unknown): string[] {
  if (!raw) return [];

  let urls: string[] = [];

  if (typeof raw === "string") {
    urls = raw.includes(",") ? raw.split(",").map((s) => s.trim()) : [raw];
  } else if (Array.isArray(raw)) {
    urls = raw.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return (item as Record<string, string>).imageUrl
          || (item as Record<string, string>).src
          || (item as Record<string, string>).url
          || "";
      }
      return "";
    });
  }

  return urls
    .map(normalizeUrl)
    .filter((u): u is string => u !== null);
}
