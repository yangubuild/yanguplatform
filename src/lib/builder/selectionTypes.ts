/**
 * Shared selection types for the builder editor.
 * Used across EditablePreview, EditorToolsPanel, and BuilderNewPage.
 */

export type SelectionKind =
  | "page"
  | "section"
  | "text"
  | "image"
  | "button"
  | "card"
  | "background";

export interface CanvasSelection {
  kind: SelectionKind;
  /** Section index if applicable */
  sectionIndex?: number;
  /** Tag name of the selected element */
  tag?: string;
  /** Short content preview (first 60 chars of text, or image src) */
  preview?: string;
  /** Section id attribute if present */
  sectionId?: string;
}

/** Classify an element tag + context into a SelectionKind */
export function classifyElement(tag: string, classList: string[], parentTag: string): SelectionKind {
  const t = tag.toUpperCase();

  if (t === "BUTTON" || (t === "A" && classList.some(c => c.includes("btn") || c.includes("button") || c.includes("cta")))) {
    return "button";
  }
  if (t === "IMG") return "image";
  if (["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "LI", "LABEL"].includes(t)) return "text";
  if (t === "A") return "button"; // links act as buttons in this context
  if (t === "SECTION" || t === "FOOTER" || t === "NAV" || t === "HEADER") return "section";

  // Card detection: divs inside repeated structures
  if (t === "DIV" && (classList.some(c => c.includes("card") || c.includes("item") || c.includes("product") || c.includes("menu-item")))) {
    return "card";
  }

  return "page";
}
