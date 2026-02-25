/**
 * Central Builder Engine registry.
 * Maps category keys to their engine configs.
 */
import type { BuilderEngine } from "./types";
import { emenuEngine } from "./engines/emenu";
import { esiteEngine } from "./engines/esite";
import { eshopEngine } from "./engines/eshop";
import { estoreEngine } from "./engines/estore";
import { influencerEngine } from "./engines/influencer";
import { communityEngine } from "./engines/community";

export const ALL_ENGINES: Record<string, BuilderEngine> = {
  emenu: emenuEngine,
  esite: esiteEngine,
  eshop: eshopEngine,
  estore: estoreEngine,
  influencer: influencerEngine,
  community: communityEngine,
};

/** Get engine by category key */
export function getEngine(key: string): BuilderEngine | undefined {
  return ALL_ENGINES[key];
}

/** Get engine by surface_type value */
export function getEngineForSurfaceType(surfaceType: string): BuilderEngine | undefined {
  return Object.values(ALL_ENGINES).find((e) => e.surfaceType === surfaceType);
}

/** Surface type → seller key mapping (reverse lookup) */
export function getSellerKeyForSurfaceType(surfaceType: string): string | undefined {
  const engine = getEngineForSurfaceType(surfaceType);
  return engine?.key;
}
