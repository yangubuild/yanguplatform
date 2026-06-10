/**
 * Shared responsive layer for ALL public surface render paths.
 *
 * Prepended to the sanitized HTML snapshot by BOTH:
 *   - src/pages/PublicSurfacePage.tsx        (lovable.app / yangu path renderer)
 *   - src/components/routing/SurfaceViewer.tsx (custom-domain renderer, e.g. yangu.shop)
 *
 * This guarantees editor↔published parity: every renderer ships the exact
 * same breakpoint contract. Never fork this CSS per renderer again.
 *
 * Breakpoint contract:
 *   ≤767px            → single column, stacked
 *   768–1023px        → 2-column max
 *   ≥1024px           → template's own desktop layout (untouched)
 *
 * NOTE: deliberately contains NO [class*="flex"] selectors — those were too
 * broad and broke icon rows, nav items, and price rows on live templates.
 */
export const PUBLIC_RESPONSIVE_CSS = `
<style data-yangu-responsive="true">
/* ── Global overflow guards ── */
html, body { overflow-x: hidden !important; max-width: 100vw !important; }
.yangu-public-snapshot, .yangu-public-snapshot * { box-sizing: border-box; min-width: 0; }
.yangu-public-snapshot { width: 100%; max-width: 100vw; overflow-x: hidden; overflow-wrap: break-word; }
.yangu-public-snapshot img,
.yangu-public-snapshot video,
.yangu-public-snapshot iframe,
.yangu-public-snapshot svg,
.yangu-public-snapshot canvas { max-width: 100% !important; height: auto; }

/* ── Mobile: ≤767px — single column, stacked ── */
@media (max-width: 767px) {
  /* Hide template-supplied horizontal nav link lists (app shell owns nav) */
  .yangu-public-snapshot nav ul, .yangu-public-snapshot nav ol,
  .yangu-public-snapshot header ul, .yangu-public-snapshot header ol { display: none !important; }
  .yangu-public-snapshot nav, .yangu-public-snapshot header { overflow: hidden !important; }

  /* Collapse every multi-column grid to a single column */
  .yangu-public-snapshot [class*="grid-cols-2"],
  .yangu-public-snapshot [class*="grid-cols-3"],
  .yangu-public-snapshot [class*="grid-cols-4"],
  .yangu-public-snapshot [style*="grid-template-columns"] {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }
  .yangu-public-snapshot [class*="columns-"] { column-count: 1 !important; }
  .yangu-public-snapshot [class*="col-span-"] { grid-column: span 1 !important; }

  /* Hero clamp — no full-desktop hero on a phone */
  .yangu-public-snapshot section:first-of-type,
  .yangu-public-snapshot [class*="hero"], .yangu-public-snapshot [class*="Hero"],
  .yangu-public-snapshot [class*="banner"] {
    min-height: unset !important; max-height: none !important; height: auto !important;
  }
  .yangu-public-snapshot [class*="hero"] h1,
  .yangu-public-snapshot [class*="banner"] h1,
  .yangu-public-snapshot section:first-of-type h1 { font-size: clamp(1.5rem, 6vw, 2.25rem) !important; line-height: 1.15 !important; }

  /* Card media stays browsable, never stretched */
  .yangu-public-snapshot .yangu-commerce-card img,
  .yangu-public-snapshot [data-product-card="true"] img { max-height: 220px !important; object-fit: cover !important; width: 100% !important; }
  .yangu-public-snapshot section img { max-height: 320px; object-fit: cover; }

  /* Keep bottom tab bar + badge clear of content */
  .yangu-public-snapshot { padding-bottom: 152px !important; }
}

/* ── Tablet: 768–1023px — 2-column max ── */
@media (min-width: 768px) and (max-width: 1023px) {
  .yangu-public-snapshot [class*="grid-cols-3"],
  .yangu-public-snapshot [class*="grid-cols-4"] {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 16px !important;
  }
}

/* ── Badge: fixed, left, above bottom tab bar, safe-area aware ── */
[data-yangu-badge], .yangu-badge, [class*="made-in-yangu"] {
  position: fixed !important;
  bottom: calc(env(safe-area-inset-bottom, 16px) + 72px) !important;
  left: 16px !important;
  right: auto !important;
  z-index: 9999 !important;
  max-width: 160px !important;
}
</style>
`;