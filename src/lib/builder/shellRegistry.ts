/**
 * SHELL REGISTRY — Phase 2.
 *
 * Maps each canonical BuilderCategory to:
 *   - shellComponentKey: the React component that owns the editor canvas.
 *   - panelComponentKey: the right-hand panel component used in that shell.
 *
 * Architectural decision (Phase 2): Option B — ONE configurable shell
 * + ONE configurable panel, both driven by the locked
 * BuilderCategoryContext. Reasoning:
 *   - The six categories share ~90% of editor behavior (selection,
 *     undo/redo, magic toolbar, publish, asset persistence, commerce).
 *   - Per-category divergence is data (labels, modules, primary CTA),
 *     not behavior — already isolated in PANEL_CONFIG and the
 *     category registry.
 *   - Separate components per category would duplicate ~2k lines six
 *     times and re-introduce the Emenu-as-master drift this plan is
 *     eliminating.
 *
 * This registry exists so that any future category-specific shell
 * (e.g. a dedicated Community shell with feed semantics) can be
 * registered here without touching the router. Today every category
 * resolves to the same configurable shell.
 */
import type { BuilderCategory } from "./categoryRegistry";

export type ShellComponentKey = "builder-editor";
export type PanelComponentKey = "builder-editor-panel";

export interface ShellBinding {
  shellComponentKey: ShellComponentKey;
  panelComponentKey: PanelComponentKey;
}

export const SHELL_REGISTRY: Readonly<Record<BuilderCategory, Readonly<ShellBinding>>> =
  Object.freeze({
    eshop: Object.freeze({ shellComponentKey: "builder-editor", panelComponentKey: "builder-editor-panel" }),
    estore: Object.freeze({ shellComponentKey: "builder-editor", panelComponentKey: "builder-editor-panel" }),
    emenu: Object.freeze({ shellComponentKey: "builder-editor", panelComponentKey: "builder-editor-panel" }),
    esite: Object.freeze({ shellComponentKey: "builder-editor", panelComponentKey: "builder-editor-panel" }),
    influencer: Object.freeze({ shellComponentKey: "builder-editor", panelComponentKey: "builder-editor-panel" }),
    community: Object.freeze({ shellComponentKey: "builder-editor", panelComponentKey: "builder-editor-panel" }),
  });

export function getShellBinding(category: BuilderCategory): Readonly<ShellBinding> {
  return SHELL_REGISTRY[category];
}