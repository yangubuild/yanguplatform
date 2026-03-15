/**
 * Global typography tokens for all public-facing pages.
 * Import `T` and use these classes instead of hardcoded font sizes.
 *
 * NEVER override these locally in individual components.
 */
export const T = {
  /** Hero banners — "Build and. Sell Online.", discover hero, community hero */
  hero: "text-[36px] md:text-[42px] font-semibold leading-[1.1] tracking-tight",

  /** Page headers / section entry titles — "Image Ads", CTA banners, discover h2s */
  header: "text-[24px] md:text-[36px] font-bold leading-[1.2]",

  /** Subtitle text under hero / header */
  subheader: "text-sm leading-relaxed",          // 14px

  /** Standard body — cards, rows, descriptions, labels, footer */
  body: "text-sm leading-relaxed",               // 14px

  /** Compact body — metadata, bylines */
  bodyCompact: "text-xs leading-relaxed",         // 12px

  /** Card titles */
  cardTitle: "text-base font-semibold",           // 16px

  /** Section row headings — "Getting started", "Verified Businesses", etc. */
  sectionH2: "text-xl font-bold",                 // 20px
} as const;
