/**
 * BuilderCore — Canonical button_style token (Phase 2.1, G-0).
 *
 * Source of truth: builder_surfaces.metadata.button_style.
 * No separate table. Not stored in surface_commerce_config.
 *
 * 11-field shape. All fields optional in the DB row; defaults are merged
 * at read time via `resolveButtonStyle()`. This is a CREATE with defaults,
 * not a backfill of a prior 3-field row — no prior shape exists.
 */

export interface ButtonStyle {
  /** Background color (CSS color, hex preferred). */
  color: string;
  /** Foreground / text color. */
  textColor: string;
  /** Border radius. G-0 locks default to 8px globally. */
  borderRadius: string;
  /** Horizontal padding. */
  paddingX: string;
  /** Vertical padding. */
  paddingY: string;
  /** Font size. */
  fontSize: string;
  /** Font weight (CSS). */
  fontWeight: string;
  /** Minimum width — used by CTA on commerce cards. */
  minWidth: string;
  /** Minimum height — must satisfy 44px mobile touch target. */
  minHeight: string;
  /** Default label text (overridden per item if the card sets one). */
  text: string;
  /** Whether buttons render. False hides all surface CTAs. */
  visible: boolean;
}

/** G-0 locked defaults. */
export const DEFAULT_BUTTON_STYLE: ButtonStyle = {
  color: "#152A20",
  textColor: "#FFFFFF",
  borderRadius: "8px",
  paddingX: "16px",
  paddingY: "10px",
  fontSize: "14px",
  fontWeight: "600",
  minWidth: "96px",
  minHeight: "44px",
  text: "+ Add",
  visible: true,
};

/**
 * Merge a partial DB row (or null/undefined) with defaults.
 * Unknown / extra keys are dropped silently.
 */
export function resolveButtonStyle(raw: unknown): ButtonStyle {
  const src = (raw && typeof raw === "object") ? (raw as Record<string, unknown>) : {};
  // Back-compat: previous editor wrote `padding: "8px 0"` and `borderRadius`.
  // Split legacy `padding` into paddingY/paddingX if present.
  let legacyPaddingY: string | undefined;
  let legacyPaddingX: string | undefined;
  if (typeof src.padding === "string") {
    const parts = src.padding.trim().split(/\s+/);
    if (parts.length === 1) { legacyPaddingY = parts[0]; legacyPaddingX = parts[0]; }
    else if (parts.length >= 2) { legacyPaddingY = parts[0]; legacyPaddingX = parts[1]; }
  }
  const pick = (key: keyof ButtonStyle, fallback: string | boolean): string | boolean => {
    const v = src[key as string];
    if (v === undefined || v === null || v === "") return fallback;
    return v as string | boolean;
  };
  return {
    color: pick("color", DEFAULT_BUTTON_STYLE.color) as string,
    textColor: pick("textColor", DEFAULT_BUTTON_STYLE.textColor) as string,
    borderRadius: pick("borderRadius", DEFAULT_BUTTON_STYLE.borderRadius) as string,
    paddingX: pick("paddingX", legacyPaddingX ?? DEFAULT_BUTTON_STYLE.paddingX) as string,
    paddingY: pick("paddingY", legacyPaddingY ?? DEFAULT_BUTTON_STYLE.paddingY) as string,
    fontSize: pick("fontSize", DEFAULT_BUTTON_STYLE.fontSize) as string,
    fontWeight: pick("fontWeight", DEFAULT_BUTTON_STYLE.fontWeight) as string,
    minWidth: pick("minWidth", DEFAULT_BUTTON_STYLE.minWidth) as string,
    minHeight: pick("minHeight", DEFAULT_BUTTON_STYLE.minHeight) as string,
    text: pick("text", DEFAULT_BUTTON_STYLE.text) as string,
    visible: src.visible === false ? false : true,
  };
}

/** Serialize to a CSS inline style string for injected CTAs. */
export function buttonStyleToCss(style: ButtonStyle): string {
  return [
    `background:${style.color}`,
    `color:${style.textColor}`,
    `border-radius:${style.borderRadius}`,
    `padding:${style.paddingY} ${style.paddingX}`,
    `font-size:${style.fontSize}`,
    `font-weight:${style.fontWeight}`,
    `min-width:${style.minWidth}`,
    `min-height:${style.minHeight}`,
    `display:${style.visible ? "inline-flex" : "none"}`,
    `align-items:center`,
    `justify-content:center`,
    `border:0`,
    `cursor:pointer`,
  ].join(";");
}

/** Build the merge-update payload to write back partial edits. */
export function mergeButtonStylePatch(
  current: unknown,
  patch: Partial<ButtonStyle> & { padding?: string },
): ButtonStyle {
  const base = resolveButtonStyle(current);
  const next: ButtonStyle = { ...base };
  // Accept legacy `padding` shorthand and split.
  if (typeof patch.padding === "string") {
    const parts = patch.padding.trim().split(/\s+/);
    if (parts.length === 1) { next.paddingY = parts[0]; next.paddingX = parts[0]; }
    else if (parts.length >= 2) { next.paddingY = parts[0]; next.paddingX = parts[1]; }
  }
  (Object.keys(patch) as Array<keyof ButtonStyle>).forEach((k) => {
    const v = patch[k];
    if (v === undefined || k === ("padding" as keyof ButtonStyle)) return;
    (next as any)[k] = v;
  });
  return next;
}