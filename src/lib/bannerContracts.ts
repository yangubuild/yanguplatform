/**
 * Hero Banner Contracts — Locked Dimensions & Behavior
 *
 * Banner 1: Fixed system banner (MassHero). Non-editable, prompt-designed only.
 * Banner 2: Editable via management panel (slot="middle").
 * Banner 3: Editable via management panel (slot="lower").
 *
 * ALL banners render with identical dimensions, radius, spacing, and responsive behavior.
 */

// ── Locked Dimensions ──

export const BANNER_CONTRACT = {
  /** Desktop min-height in px */
  minHeight: 260,
  /** Border radius class */
  radiusClass: "rounded-2xl",
  /** Responsive padding: mobile → desktop */
  paddingClass: "p-8 md:p-10 lg:p-14",
  /** Bottom margin for spacing between sections */
  marginClass: "mb-12",
  /** Max width is inherited from parent container (1100px) */
  /** Full width within parent */
  widthClass: "w-full",
  /** Background border */
  borderStyle: "1px solid rgba(255,255,255,0.06)",
  /** Default background gradient */
  defaultBg: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
  /** Responsive height tokens */
  heights: {
    mobile: 220,
    tablet: 240,
    desktop: 260,
  },
} as const;

// ── Banner Slot IDs ──

export type BannerSlot = "system" | "middle" | "lower";

export interface BannerData {
  slot: BannerSlot;
  /** null = use default system content; string = custom image URL */
  image_url: string | null;
  /** Headline override */
  headline: string | null;
  /** Subheadline override */
  subheadline: string | null;
  /** CTA text */
  cta_text: string | null;
  /** CTA link */
  cta_link: string | null;
  /** Whether this banner is currently active (shown) */
  is_active: boolean;
}

/** Default content for each slot when no custom data exists */
export const BANNER_DEFAULTS: Record<Exclude<BannerSlot, "system">, BannerData> = {
  middle: {
    slot: "middle",
    image_url: null,
    headline: "yangu for enterprise",
    subheadline: "yangu isn't just for the best solo entrepreneurs, it's also effective for enterprises.",
    cta_text: "Learn more",
    cta_link: null,
    is_active: true,
  },
  lower: {
    slot: "lower",
    image_url: null,
    headline: "Meet yangu Treasury",
    subheadline: "Earn up to 6% yield on your cash.",
    cta_text: "Get started",
    cta_link: null,
    is_active: true,
  },
};
