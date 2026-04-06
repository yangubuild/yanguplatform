/**
 * Engine Resolver — resolves editorModules with inheritance support.
 * If an engine declares `extends`, its parent modules are merged first.
 */

import type { BuilderEngine } from "./types";
import { ALL_ENGINES } from "./engineRegistry";

/**
 * Resolve the full list of editor module keys for an engine,
 * including inherited modules from parent engines.
 * 
 * Inheritance: child modules override/extend parent modules.
 * Deduplication preserves child ordering.
 */
export function resolveEngineModules(engine: BuilderEngine): string[] {
  const parentKey = (engine as any).extends as string | undefined;
  if (!parentKey) return engine.editorModules;

  const parent = ALL_ENGINES[parentKey];
  if (!parent) return engine.editorModules;

  // Parent modules first, then child modules (deduped)
  const seen = new Set<string>();
  const result: string[] = [];

  // Parent modules as base
  for (const mod of resolveEngineModules(parent)) {
    if (!seen.has(mod)) {
      seen.add(mod);
      result.push(mod);
    }
  }

  // Child modules extend/override
  for (const mod of engine.editorModules) {
    if (!seen.has(mod)) {
      seen.add(mod);
      result.push(mod);
    }
  }

  return result;
}
