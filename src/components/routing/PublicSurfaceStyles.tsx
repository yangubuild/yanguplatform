/**
 * PublicSurfaceStyles — global responsive ruleset injected next to every
 * public surface (HTML-snapshot and JSON-section render paths alike).
 *
 * Goals (mirror of PublishedEmenuFrame's head-injected ruleset):
 *  - Eliminate horizontal page scroll on every device.
 *  - Hide template-supplied top navs on mobile (LiveShopAppShell already
 *    provides the canonical top bar + bottom tab bar — duplicate nav rows
 *    overlap content and waste vertical space).
 *  - Cap hero/product images on mobile so cards stay browsable.
 *  - Force product grids to a sensible column count on desktop/tablet so
 *    the published page matches the editor canvas instead of stacking
 *    every card full-width like a mobile view.
 *
 * Rendered once near the root of PublicSurfacePage. Pure CSS — no JS.
 */
export function PublicSurfaceStyles() {
  return (
    <style
      // Single global stylesheet — keep selectors aggressive enough to win
      // against template inline styles without breaking the editor canvas.
      dangerouslySetInnerHTML={{
        __html: `
/* Lock the public surface to vertical scrolling only */
html, body { overflow-x: hidden !important; max-width: 100vw; }
.yangu-public-snapshot, .yangu-public-snapshot * { box-sizing: border-box; }
.yangu-public-snapshot { width: 100%; max-width: 100vw; overflow-x: hidden; }
.yangu-public-snapshot img,
.yangu-public-snapshot video,
.yangu-public-snapshot svg,
.yangu-public-snapshot canvas { max-width: 100%; height: auto; }

/* Desktop / tablet: keep product grids as a grid (matches editor) */
@media (min-width: 769px) {
  .yangu-public-snapshot .yangu-product-grid,
  .yangu-public-snapshot [style*="grid-template-columns:repeat("] {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
    gap: 16px !important;
  }
  .yangu-public-snapshot .yangu-product-grid > *,
  .yangu-public-snapshot [style*="grid-template-columns"] > div[style*="border-radius"] {
    max-width: 360px !important;
    width: 100% !important;
    justify-self: center !important;
  }
  /* Cap any single section image on desktop so the live page never balloons */
  .yangu-public-snapshot section img,
  .yangu-public-snapshot article img { max-height: 560px; object-fit: cover; }
}

/* Mobile: hide duplicate template navigation so LiveShopAppShell owns nav */
@media (max-width: 768px) {
  .yangu-public-snapshot nav,
  .yangu-public-snapshot header nav,
  .yangu-public-snapshot [role="navigation"],
  .yangu-public-snapshot [class*="navbar"],
  .yangu-public-snapshot [class*="Navbar"] {
    display: none !important;
  }
  /* Template hero/product images must not dominate the viewport */
  .yangu-public-snapshot section:first-of-type,
  .yangu-public-snapshot [class*="hero"],
  .yangu-public-snapshot [class*="Hero"] { min-height: auto !important; max-height: none !important; }
  .yangu-public-snapshot section img,
  .yangu-public-snapshot article img,
  .yangu-public-snapshot [class*="hero"] img,
  .yangu-public-snapshot [class*="Hero"] img {
    max-height: 280px !important;
    width: 100% !important;
    object-fit: cover !important;
  }
  /* Card images shouldn't exceed ~220px on mobile so density improves */
  .yangu-public-snapshot .yangu-product-grid img,
  .yangu-public-snapshot [class*="product"] img,
  .yangu-public-snapshot [class*="Product"] img,
  .yangu-public-snapshot [class*="card"] img,
  .yangu-public-snapshot [class*="Card"] img {
    max-height: 220px !important;
    object-fit: cover !important;
  }
  /* Collapse product grids to one column, but never wider than viewport */
  .yangu-public-snapshot .yangu-product-grid,
  .yangu-public-snapshot [style*="grid-template-columns:repeat("] {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }
  /* Horizontal product rails: rail scrolls, page never does */
  .yangu-public-snapshot [class*="rail"],
  .yangu-public-snapshot [class*="Rail"],
  .yangu-public-snapshot [style*="overflow-x"] {
    max-width: 100vw !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch;
  }
  /* Generous bottom padding so content clears the 64px tab bar + badge */
  .yangu-public-snapshot { padding-bottom: 96px !important; }
}
        `,
      }}
    />
  );
}