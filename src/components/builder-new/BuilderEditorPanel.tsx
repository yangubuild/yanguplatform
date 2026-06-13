/**
 * BuilderEditorPanel — Phase 2 canonical, registry-driven side panel.
 *
 * This file is the public entry point for the builder's right-hand
 * editor panel. It is intentionally a thin alias over the historical
 * EmenuEditorPanel implementation: the implementation already drives
 * its title, modules, primary CTA, category badge, and section labels
 * from a per-category PANEL_CONFIG table. Phase 2 contract:
 *
 *   1. Callers must import THIS file, not EmenuEditorPanel directly.
 *   2. Category is resolved from BuilderCategoryContext (locked) and
 *      passed in as the canonical BuilderCategory key.
 *   3. No surface_type aliasing happens inside the panel — the registry
 *      is the only source of truth.
 *
 * Step 3 (Phase 2+) will rename the underlying file and delete the
 * Emenu-named alias, but for safety we keep both exports until every
 * call site has migrated.
 */
export { EmenuEditorPanel as BuilderEditorPanel } from "./EmenuEditorPanel";