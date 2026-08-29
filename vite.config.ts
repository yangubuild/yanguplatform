import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { buildMetaPlugin } from "./vite-plugins/buildMeta";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    buildMetaPlugin(),
    mcpPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      manifest: false, // we use our own public/manifest.json
      includeAssets: ["offline.html"],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // HTML is deliberately NOT precached. A precached index.html keeps an
        // old deploy's bundle (and its hashed asset URLs, which 503 after the
        // next deploy) alive and lets stale app versions control live routes.
        globPatterns: ["**/*.{js,css,ico,svg,woff,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // NOTE: `navigateFallback` is deliberately NOT used. Workbox registers
        // its NavigationRoute BEFORE runtimeCaching routes, so it hijacked every
        // navigation and served /offline.html from precache even while online
        // (the "You're offline" regression). The offline page is instead used
        // only as a last-resort error fallback of the navigation strategy below.
        runtimeCaching: [
          {
            // Navigations: network first, cache only as an offline safety net.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "yangu-pages",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 20 },
              plugins: [
                {
                  // Only reached when the network failed AND no cached page
                  // exists — i.e. a genuine offline navigation.
                  handlerDidError: async () =>
                    (await caches.match("/offline.html")) ??
                    Response.error(),
                },
              ],
            },
          },

          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
