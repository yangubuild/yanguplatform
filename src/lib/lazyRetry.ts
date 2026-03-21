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
 * Embeds the build timestamp at build time; on visibility change (tab
 * refocus) it checks a lightweight version endpoint. If the deployed
 * version differs, it reloads to pick up fresh chunks.
 *
 * The endpoint is simply `/build-meta.json` which Vite writes at build
 * time via the plugin below.
 */
const BUILD_TS = Date.now(); // snapshot at module-eval time

let checking = false;

export function startBuildVersionGuard() {
  if (typeof document === "undefined") return;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || checking) return;
    checking = true;

    fetch("/build-meta.json?_=" + Date.now(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((meta) => {
        if (meta?.ts && Math.abs(meta.ts - BUILD_TS) > 30_000) {
          // Deployed build is newer (or significantly different) — reload
          window.location.reload();
        }
      })
      .catch(() => {
        /* network hiccup — ignore */
      })
      .finally(() => {
        checking = false;
      });
  });
}
