import { useEffect, useRef, useState, useCallback } from "react";
import { YANGU_EMOJIS, getEmojiAvatarUrl } from "@/lib/avatarUtils";

const preloadedUrls = new Set<string>();
let globalPreloaded = false;

/** Preload all emoji avatar images into browser cache */
function preloadAllEmojis(): Promise<void> {
  if (globalPreloaded) return Promise.resolve();
  globalPreloaded = true;

  const promises = YANGU_EMOJIS.map(({ key }) => {
    const url = getEmojiAvatarUrl(key);
    if (preloadedUrls.has(url)) return Promise.resolve();
    preloadedUrls.add(url);
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  });

  return Promise.all(promises).then(() => {});
}

/** Hook: starts preloading on mount; returns per-image loaded state */
export function useEmojiPreloader() {
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(() => {
    // If already globally preloaded, mark all as loaded
    if (globalPreloaded) {
      return new Set(YANGU_EMOJIS.map((e) => e.key));
    }
    return new Set<string>();
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Preload each emoji and track individually
    YANGU_EMOJIS.forEach(({ key }) => {
      const url = getEmojiAvatarUrl(key);
      const img = new Image();
      img.onload = () => {
        if (mountedRef.current) {
          setLoadedKeys((prev) => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
          });
        }
      };
      img.onerror = () => {
        if (mountedRef.current) {
          setLoadedKeys((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
          });
        }
      };
      img.src = url;
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { loadedKeys, allLoaded: loadedKeys.size >= YANGU_EMOJIS.length };
}

/** Call this early (e.g. on hover) to start background preloading */
export function triggerEmojiPreload() {
  preloadAllEmojis();
}
