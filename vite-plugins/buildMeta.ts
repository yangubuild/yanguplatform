import { writeFileSync } from "fs";
import { resolve } from "path";
import type { Plugin } from "vite";

/**
 * Vite plugin that writes /public/build-meta.json with a timestamp
 * at build time. The app uses this to detect stale chunks after deploy.
 */
export function buildMetaPlugin(): Plugin {
  return {
    name: "build-meta",
    writeBundle() {
      const meta = JSON.stringify({ ts: Date.now() });
      writeFileSync(resolve("dist", "build-meta.json"), meta);
    },
  };
}
