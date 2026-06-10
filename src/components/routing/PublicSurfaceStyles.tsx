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
/* Global commerce renderer contract: vertical page scroll only */
html, body { overflow-x: hidden !important; max-width: 100vw; }
.yangu-public-snapshot,
.yangu-public-snapshot * { box-sizing: border-box; min-width: 0; }
.yangu-public-snapshot { width: 100%; max-width: 100vw; overflow-x: hidden; }
.yangu-public-snapshot img,
.yangu-public-snapshot video,
.yangu-public-snapshot svg,
.yangu-public-snapshot canvas { max-width: 100%; height: auto; }

/* Shared commerce grids for every template and future template */
.yangu-public-snapshot .yangu-commerce-grid,
.yangu-public-snapshot .yangu-product-grid,
.yangu-public-snapshot [data-products-grid="true"],
.yangu-public-snapshot [data-section-type="products"],
.yangu-public-snapshot [data-section-type="product_grid"],
.yangu-public-snapshot [data-section-type="menu"],
.yangu-public-snapshot [data-section-type="listings"],
.yangu-public-snapshot [data-section-type="listing_grid"],
.yangu-public-snapshot [data-section-type="featured"],
.yangu-public-snapshot [style*="grid-template-columns:repeat("] {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
  gap: 16px !important;
  align-items: stretch !important;
  width: 100% !important;
  max-width: 100% !important;
}

.yangu-public-snapshot .yangu-commerce-card,
.yangu-public-snapshot [data-product-card="true"],
.yangu-public-snapshot [data-yangu-product="true"],
.yangu-public-snapshot .yangu-product-card {
  width: 100% !important;
  max-width: 360px !important;
  min-width: 0 !important;
  justify-self: center !important;
  align-self: stretch !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.yangu-public-snapshot .yangu-commerce-card img,
.yangu-public-snapshot [data-product-card="true"] img,
.yangu-public-snapshot [data-yangu-product="true"] img,
.yangu-public-snapshot .yangu-product-card img,
.yangu-public-snapshot .yangu-commerce-card-image {
  width: 100% !important;
  aspect-ratio: 4 / 3 !important;
  max-height: 260px !important;
  object-fit: cover !important;
  flex: none !important;
}

.yangu-public-snapshot .yangu-product-footer {
  margin-top: auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  width: 100% !important;
}

.yangu-public-snapshot .yangu-price-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px !important;
  width: 100% !important;
}

.yangu-public-snapshot .yangu-live-cta,
.yangu-public-snapshot [data-yangu-commerce-cta="true"] {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 40px !important;
  min-width: 96px !important;
  max-width: 100% !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.yangu-public-snapshot [data-yangu-injected-cta="true"] {
  font-weight: 600 !important;
  cursor: pointer !important;
  /* color/background/radius come from inline styles set by the normalizer
     (saved metadata.button_style wins) — do NOT force them here. */
}

@media (min-width: 1025px) {
  .yangu-public-snapshot .yangu-commerce-grid,
  .yangu-public-snapshot .yangu-product-grid,
  .yangu-public-snapshot [data-products-grid="true"],
  .yangu-public-snapshot [style*="grid-template-columns:repeat("] {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .yangu-public-snapshot .yangu-commerce-grid,
  .yangu-public-snapshot .yangu-product-grid,
  .yangu-public-snapshot [data-products-grid="true"],
  .yangu-public-snapshot [style*="grid-template-columns:repeat("] {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
  .yangu-public-snapshot .yangu-commerce-card,
  .yangu-public-snapshot [data-product-card="true"],
  .yangu-public-snapshot [data-yangu-product="true"],
  .yangu-public-snapshot .yangu-product-card { max-width: 100% !important; }
}

/* Mobile: app shell owns navigation and cards stay catalog-browsable */
@media (max-width: 768px) {
  .yangu-public-snapshot nav,
  .yangu-public-snapshot header nav,
  .yangu-public-snapshot [role="navigation"],
  .yangu-public-snapshot [class*="navbar"],
  .yangu-public-snapshot [class*="Navbar"] {
    display: none !important;
  }
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
  .yangu-public-snapshot .yangu-commerce-grid,
  .yangu-public-snapshot .yangu-product-grid,
  .yangu-public-snapshot [data-products-grid="true"],
  .yangu-public-snapshot [data-section-type="products"],
  .yangu-public-snapshot [data-section-type="product_grid"],
  .yangu-public-snapshot [data-section-type="menu"],
  .yangu-public-snapshot [data-section-type="listings"],
  .yangu-public-snapshot [data-section-type="listing_grid"],
  .yangu-public-snapshot [data-section-type="featured"],
  .yangu-public-snapshot [style*="grid-template-columns:repeat("] {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }
  .yangu-public-snapshot .yangu-commerce-card,
  .yangu-public-snapshot [data-product-card="true"],
  .yangu-public-snapshot [data-yangu-product="true"],
  .yangu-public-snapshot .yangu-product-card {
    max-width: 100% !important;
  }
  .yangu-public-snapshot .yangu-commerce-card img,
  .yangu-public-snapshot [data-product-card="true"] img,
  .yangu-public-snapshot [data-yangu-product="true"] img,
  .yangu-public-snapshot .yangu-product-card img,
  .yangu-public-snapshot .yangu-commerce-card-image {
    aspect-ratio: 4 / 3 !important;
    max-height: 220px !important;
    object-fit: cover !important;
  }
  .yangu-public-snapshot .yangu-price-row { flex-direction: column !important; align-items: stretch !important; }
  .yangu-public-snapshot .yangu-live-cta,
  .yangu-public-snapshot [data-yangu-commerce-cta="true"] { width: 100% !important; }
  .yangu-public-snapshot [class*="rail"],
  .yangu-public-snapshot [class*="Rail"],
  .yangu-public-snapshot [style*="overflow-x"] {
    max-width: 100vw !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch;
  }
  .yangu-public-snapshot { padding-bottom: 152px !important; }
}
        `,
      }}
    />
  );
}