/**
 * Shared Docs typography tokens for Builder + Developer audiences.
 * Use these everywhere to guarantee identical vertical rhythm.
 */
export const DocsTypography = {
  /** Top-level sidebar header ("Getting Started") */
  sidebarHeader: "text-white/90 text-sm font-semibold leading-5",
  /** Sidebar section label ("OVERVIEW", "APIS", etc.) */
  sidebarSectionLabel: "text-white/50 text-xs font-semibold uppercase tracking-wider leading-4 mb-2 px-1",
  /** Sidebar link item */
  sidebarLink: "w-full text-left px-3 py-1.5 rounded-md text-sm leading-5 transition-colors",
  /** Sidebar link list container */
  sidebarLinkList: "space-y-0.5",
  /** Sidebar section group */
  sidebarSection: "mb-5",
  /** Page kicker / breadcrumb ("Overview") */
  pageKicker: "text-sm leading-5 mb-2",
  /** Page H1 */
  h1: "text-3xl font-bold text-white leading-tight mb-3",
  /** Page subtitle */
  subtitle: "text-base leading-6 mb-10",
  /** Section H2 */
  h2: "text-xl font-semibold text-white leading-7 mb-2",
  /** Section description under H2 */
  sectionDesc: "text-sm leading-5 mb-6",
} as const;
