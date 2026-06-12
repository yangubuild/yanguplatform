import { injectItemAttributesInHtml } from "./core/universalItemDetection";
import type { BuilderSurfaceType } from "@/types/builder";

const EDITOR_STYLE_SNIPPETS = [
  "[contenteditable]:hover",
  "[contenteditable]:focus",
  ".section-hover",
  ".section-selected",
  ".yangu-img-selected",
  ".yangu-el-selected",
  ".yangu-btn-selected",
];

const EDITOR_SCRIPT_SNIPPETS = [
  "canvas-select",
  "section-select",
  "html-update",
  "image-click",
  "open-image-picker",
  "toggle-edit-mode",
  "notifyHtmlUpdate",
  "data-yangu-node-id",
];

export const EDITOR_NODE_ID_ATTRIBUTE = "data-yangu-node-id";

/**
 * Sanitize editor-only artifacts AND run BuilderCore Universal Item Detection
 * (Phase 1.1). Detection runs at publish/sanitize time so the published HTML
 * carries the same `data-yangu-item-*` contract that the editor canvas
 * injects on iframe load.
 */
export function sanitizeEditorHtml(
  html?: string | null,
  opts?: { surfaceType?: BuilderSurfaceType | string },
): string {
  if (!html) return "";
  if (typeof DOMParser === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll(".yangu-editor-inject").forEach((el) => el.remove());

  doc.querySelectorAll("style").forEach((styleEl) => {
    const text = styleEl.textContent || "";
    if (EDITOR_STYLE_SNIPPETS.some((snippet) => text.includes(snippet))) {
      styleEl.remove();
    }
  });

  doc.querySelectorAll("script").forEach((scriptEl) => {
    const text = scriptEl.textContent || "";
    if (EDITOR_SCRIPT_SNIPPETS.some((snippet) => text.includes(snippet))) {
      scriptEl.remove();
    }
  });

  doc.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
  doc.querySelectorAll("[data-section-idx]").forEach((el) => el.removeAttribute("data-section-idx"));

  doc.querySelectorAll("*").forEach((el) => {
    el.classList.remove(
      "section-hover",
      "section-selected",
      "yangu-img-selected",
      "yangu-el-selected",
      "yangu-btn-selected",
    );

    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-yangu-")) {
        // Preserve BuilderCore item-detection contract through sanitize.
        if (attr.name.startsWith("data-yangu-item")) return;
        el.removeAttribute(attr.name);
      }
    });

    const classAttr = el.getAttribute("class");
    if (classAttr !== null && !classAttr.trim()) {
      el.removeAttribute("class");
    }
  });

  const cleaned = doc.documentElement.outerHTML;
  // Run universal item detection on the sanitized output.
  return injectItemAttributesInHtml(cleaned, opts?.surfaceType);
}