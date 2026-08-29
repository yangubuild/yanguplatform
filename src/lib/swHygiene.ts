/**
 * Service-worker hygiene.
 *
 * Root cause this guards against: a precached index.html / old JS bundle from a
 * previous deploy can keep controlling live routes (showing an older version of
 * a page after refresh) and can reference hashed assets that no longer exist on
 * the CDN (which then load as broken images).
 *
 * Behaviour:
 *  - ask the browser for a SW update on load and on tab refocus
 *  - drop caches that belong to older builds (page/HTML caches only)
 *  - when a new worker takes control, reload once so the new bundle is active
 */

const RELOAD_FLAG = "yangu-sw-reloaded";

export function startServiceWorkerHygiene() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const purgeStaleHtmlCaches = async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          // Old plugin versions precached HTML; those entries can serve an
          // outdated app shell. Page responses are re-fetched from network.
          .filter((k) => /html|pages/i.test(k) && k !== "yangu-pages")
          .map((k) => caches.delete(k)),
      );
    } catch {
      /* cache API unavailable — nothing to clean */
    }
  };

  const checkForUpdate = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.update()));
    } catch {
      /* ignore */
    }
  };

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
    window.location.reload();
  });

  void purgeStaleHtmlCaches().then(checkForUpdate);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkForUpdate();
  });
}
