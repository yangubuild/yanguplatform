/**
 * Wraps a dynamic import with retry + cache-bust logic so that
 * stale-chunk / deploy-mismatch errors auto-recover instead of
 * showing a blank screen.
 *
 * Usage:  lazy(() => lazyRetry(() => import("./MyPage")))
 */
export function lazyRetry<T>(
  factory: () => Promise<T>,
  retries = 2,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const attempt = (remaining: number) => {
      factory()
        .then(resolve)
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          const isChunkError =
            msg.includes("Failed to fetch dynamically imported module") ||
            msg.includes("Importing a module script failed") ||
            msg.includes("error loading dynamically imported module") ||
            msg.includes("Loading chunk") ||
            msg.includes("Loading CSS chunk");

          if (isChunkError && remaining > 0) {
            // Small delay then retry — the browser may resolve the
            // new chunk URL once DNS / CDN propagation settles.
            setTimeout(() => attempt(remaining - 1), 1500);
          } else if (isChunkError && remaining === 0) {
            // All retries exhausted — force a full page reload once.
            // Guard with sessionStorage so we don't infinite-loop.
            const key = "chunk-reload-" + window.location.pathname;
            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, "1");
              window.location.reload();
            } else {
              // Already reloaded once this session for this page — surface error
              sessionStorage.removeItem(key);
              reject(err);
            }
          } else {
            reject(err);
          }
        });
    };
    attempt(retries);
  });
}

/**
 * Build-version guard.
 * On first load, fetches `/build-meta.json` and remembers the deployed
 * timestamp.  On subsequent tab-refocus events it re-fetches the file and
 * reloads **only** if the deployed timestamp has *changed* (i.e. a new
 * build was deployed while the tab was in the background).
 *
 * Previous implementation compared a runtime `Date.now()` against the
 * build-time value, which always differed by >30 s and caused an
 * infinite reload loop.
 */

let knownBuildTs: number | null = null;
let checking = false;

function fetchBuildMeta(): Promise<number | null> {
  return fetch("/build-meta.json?_=" + Date.now(), { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((meta) => (meta?.ts as number) ?? null)
    .catch(() => null);
}

export function startBuildVersionGuard() {
  if (typeof document === "undefined") return;

  // Capture the current deployment's timestamp on first load
  fetchBuildMeta().then((ts) => {
    knownBuildTs = ts;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || checking) return;
    checking = true;

    fetchBuildMeta()
      .then((ts) => {
        if (
          ts !== null &&
          knownBuildTs !== null &&
          ts !== knownBuildTs
        ) {
          // A different build is now deployed — reload to pick up fresh chunks
          window.location.reload();
        }
      })
      .finally(() => {
        checking = false;
      });
  });
}
