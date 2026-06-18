// Public renderer: prefers the sanitized HTML snapshot embedded by useBuilderPublish
// (published_schema.surface.html / surface.pages_html[slug]) so the live page matches
// the builder exactly. Falls back to compiled JSON sections when no HTML is present.
import { useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PREVIEW_MAP } from "@/components/builder/BuilderPreview";
import { PublicCommerceShell } from "@/components/commerce/PublicCommerceShell";
import { PUBLIC_RESPONSIVE_CSS } from "@/components/commerce/publicResponsiveCss";
import { YanguBadge } from "@/components/routing/YanguBadge";
import { PublicSurfaceStyles } from "@/components/routing/PublicSurfaceStyles";
import { DEFAULT_THEME, type BuilderTheme } from "@/components/builder/BuilderSettingsDrawer";
import { deduplicatePublishedSections } from "@/config/builderCoreSections";
import type {
  BuilderPublicSchemaResult,
  BuilderPublishedSection,
} from "@/types/builder";
import { Loader2 } from "lucide-react";
import { recordSurfaceView } from "@/lib/analytics/recordSurfaceView";

/**
 * Public published page renderer.
 * All surfaces render from compiled JSON sections in published_schema via the React
 * commerce shell. HTML snapshot rendering is retired.
 */
export default function PublicSurfacePage() {
  const location = useLocation();

  const host = window.location.hostname.replace(/^www\./, "");
  const pathSlug = location.pathname.replace(/^\/+/, "").split("/")[0] || "home";

  const { data, isLoading, error } = useQuery({
    queryKey: ["builder_public_schema", host, pathSlug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("builder_get_public_schema", {
        p_host: host,
        p_slug: pathSlug,
      });
      if (error) throw error;
      const result = data as unknown as BuilderPublicSchemaResult | { ok: false; error: string };
      if (!result?.ok) {
        throw new Error((result as any)?.error || "not_found");
      }
      return result as BuilderPublicSchemaResult;
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const surfaceType = (data?.published_schema?.surface as any)?.surface_type;

  const surfaceData = (data?.published_schema?.surface || {}) as any;
  const pageTitle = surfaceData.seo_title || surfaceData.title || "Untitled";
  const seoDescription = surfaceData.seo_description || surfaceData.description || "";
  const faviconUrl = surfaceData.favicon_url || "";
  const showBadge = surfaceData.show_yangu_badge === true;
  const surfaceId = surfaceData.id || "";
  const ownerId = surfaceData.user_id || "";
  const businessName = surfaceData.title || "";

  // Saved CTA button style — copied into published_schema.surface.button_style
  // (and top-level published_schema.button_style) by useBuilderPublish. Passed
  // straight to PublicCommerceShell so PublicCommerceNormalizer can render the
  // user's chosen color/shape/size on the live page.
  const publishedButtonStyle =
    (surfaceData.button_style as any) ??
    ((data?.published_schema as any)?.button_style as any) ??
    null;

  // HTML snapshot (preferred): per-page slug map, then surface-wide fallback
  const pagesHtmlMap = (surfaceData.pages_html || {}) as Record<string, string>;
  const rawHtml: string | null =
    pagesHtmlMap[pathSlug] ||
    pagesHtmlMap["home"] ||
    (surfaceData.html as string | null) ||
    null;

  // Opt-in flag — only use the HTML snapshot when the publisher has flagged it
  // as responsive/publish-ready. Otherwise the desktop-only builder canvas HTML
  // breaks mobile layouts, so we fall back to the JSON-section renderer.
  const htmlSnapshotEnabled = surfaceData.html_snapshot_responsive === true;

  const isBazaroClassicSnapshot =
    surfaceData.builder_new_template === "estore_bazaro_classic" ||
    surfaceData.design_template === "estore_bazaro_classic" ||
    (typeof rawHtml === "string" && rawHtml.includes("/templates/bazaro-classic/"));

  const sanitizedHtml = useMemo(() => {
    if (!rawHtml) return null;
    try {
      const clean = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ["style", "link", "iframe"],
        ADD_ATTR: [
          "target",
          "rel",
          "allow",
          "allowfullscreen",
          "frameborder",
          "loading",
          "referrerpolicy",
          "data-yangu-node-id",
        ],
        FORBID_TAGS: ["script"],
        FORBID_ATTR: ["onerror", "onload", "onclick"],
      });
      if (isBazaroClassicSnapshot) return clean;
      // Prepend responsive CSS so mobile breakpoints exist even when the
      // stored desktop template HTML omits them.
      return PUBLIC_RESPONSIVE_CSS + clean;
    } catch (e) {
      console.error("[PublicSurfacePage] sanitize error:", e);
      return null;
    }
  }, [rawHtml, isBazaroClassicSnapshot]);

  // Set document metadata
  useEffect(() => {
    if (!data) return;
    document.title = pageTitle;
    
    let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = seoDescription;
    
    if (faviconUrl) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
    
    return () => { document.title = "YANGU"; };
  }, [data, pageTitle, seoDescription, faviconUrl]);

  // Record a view once per (surface, path) per session
  useEffect(() => {
    if (!surfaceId) return;
    recordSurfaceView(surfaceId, pathSlug);
  }, [surfaceId, pathSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return <PublicNotFound host={host} slug={pathSlug} />;
  }

  const pubSurfaceType = surfaceData.surface_type;

  // ─── Source-extracted Bazaro Classic render path ───
  if (sanitizedHtml && htmlSnapshotEnabled && isBazaroClassicSnapshot) {
    return (
      <div className="min-h-screen bg-white">
        <iframe
          title={pageTitle}
          srcDoc={sanitizedHtml}
          className="block w-full h-screen border-0 bg-white"
          sandbox="allow-same-origin"
        />
        {showBadge && <YanguBadge />}
      </div>
    );
  }

  // ─── HTML snapshot render path (preferred) ───
  if (sanitizedHtml && htmlSnapshotEnabled) {
    const handleCartDelegate = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const ctaBtn = target.closest('.yangu-cta');
      const card = target.closest('.yangu-card');
      if (!ctaBtn || !card) return;
      const nameEl = card.querySelector('p.truncate, h3, h4');
      const priceEl = card.querySelector('.text-primary');
      const imgEl = card.querySelector('img');
      const name = nameEl?.textContent?.trim() || "Product";
      const priceText = priceEl?.textContent?.trim() || "$0";
      const currencyMatch = priceText.match(/^([A-Z]{3}|[\$€£])/);
      const cur = currencyMatch?.[1] || "USD";
      const numStr = priceText.replace(/^[A-Z]{3}|[\$€£]/, "").replace(/,/g, "").trim();
      const priceCents = Math.round((parseFloat(numStr) || 0) * 100);
      const imageUrl = imgEl?.getAttribute("src") || null;
      const itemId = btoa(`${name}_${priceCents}`).replace(/=/g, "");
      (window as any).__yangu_add_to_cart?.({
        id: itemId, name, price_cents: priceCents, currency: cur,
        image_url: imageUrl, variant: null,
      });
      const btn = ctaBtn as HTMLElement;
      btn.textContent = "✓ Added";
      setTimeout(() => { btn.textContent = "Add to Cart"; }, 1200);
    };
    return (
      <PublicCommerceShell surfaceId={surfaceId} ownerId={ownerId} businessName={businessName} surfaceType={pubSurfaceType} buttonStyle={publishedButtonStyle}>
        <PublicSurfaceStyles />
        <div
          className="min-h-screen bg-background yangu-live yangu-public-snapshot"
          onClick={handleCartDelegate}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
        {showBadge && <YanguBadge />}
      </PublicCommerceShell>
    );
  }

  // ─── JSON-section fallback (legacy path) ───
  const schema = data.published_schema;
  const page = schema.pages?.[0];
  const rawSections = page?.sections
    ?.slice()
    .sort((a: BuilderPublishedSection, b: BuilderPublishedSection) => a.position - b.position) ?? [];
  
  const sections = deduplicatePublishedSections(rawSections, surfaceData.surface_type || "quick_site");
  
  const title = pageTitle;
  const isInfluencer = pubSurfaceType === "live_bio";
  
  const rawTheme = (surfaceData.theme as Partial<BuilderTheme>) || {};
  const surfaceTheme: BuilderTheme = { ...DEFAULT_THEME, ...rawTheme };
  const themeStyle: React.CSSProperties = {
    fontFamily: surfaceTheme.font_family,
    fontWeight: Number(surfaceTheme.body_weight),
  };

  // Determine if surface supports ordering (eshop, estore, emenu variants)
  const ORDER_CAPABLE_TYPES = ["eshop", "estore", "live_selling", "store_listing", "emenu"];
  const isOrderCapable = ORDER_CAPABLE_TYPES.includes(pubSurfaceType || "");
  const PRODUCT_SECTION_TYPES = ["products", "product_grid", "listings", "listing_grid", "featured"];

  const sectionContent = (
    <main>
      {sections.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground max-w-[1200px] mx-auto">
          <p>This page has no content yet.</p>
        </div>
      ) : (
        sections.map((section: BuilderPublishedSection, i: number) => {
          const Preview = PREVIEW_MAP[section.section_type];
          const isHero = section.section_type === "hero" || section.section_type === "hero_banner";
          const isProductSection = PRODUCT_SECTION_TYPES.includes(section.section_type);

          // For order-capable surfaces, wrap product sections with click-to-add-to-cart
          const sectionEl = Preview ? (
            isHero
              ? <Preview schema={section.schema} {...({ pubSurfaceType } as any)} />
              : <Preview schema={section.schema} />
          ) : (
            <div className="py-4 text-sm text-muted-foreground italic">
              [{section.section_type}]
            </div>
          );

          return (
            <div
              key={`${section.section_type}-${i}`}
              className="w-full"
              {...(isOrderCapable && isProductSection ? {
                onClick: (e: React.MouseEvent) => {
                  // Delegate: find the closest .yangu-cta button click
                  const target = e.target as HTMLElement;
                  const ctaBtn = target.closest('.yangu-cta');
                  const card = target.closest('.yangu-card');
                  if (!ctaBtn || !card) return;

                  // Extract product info from the card
                  const nameEl = card.querySelector('p.truncate, h3, h4');
                  const priceEl = card.querySelector('.text-primary');
                  const imgEl = card.querySelector('img');
                  
                  const name = nameEl?.textContent?.trim() || "Product";
                  const priceText = priceEl?.textContent?.trim() || "$0";
                  const currencyMatch = priceText.match(/^([A-Z]{3}|[\$€£])/);
                  const cur = currencyMatch?.[1] || "USD";
                  const numStr = priceText.replace(/^[A-Z]{3}|[\$€£]/, "").replace(/,/g, "").trim();
                  const priceCents = Math.round((parseFloat(numStr) || 0) * 100);
                  const imageUrl = imgEl?.getAttribute("src") || null;
                  const itemId = btoa(`${name}_${priceCents}`).replace(/=/g, "");

                  (window as any).__yangu_add_to_cart?.({
                    id: itemId,
                    name,
                    price_cents: priceCents,
                    currency: cur,
                    image_url: imageUrl,
                    variant: null,
                  });

                  // Visual feedback on the CTA
                  const btn = ctaBtn as HTMLElement;
                  btn.textContent = "✓ Added";
                  setTimeout(() => { btn.textContent = "Add to Cart"; }, 1200);
                },
              } : {})}
            >
              <div className={isInfluencer ? "px-4 py-4" : "max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-8 lg:py-12"}>
                {sectionEl}
              </div>
            </div>
          );
        })
      )}
    </main>
  );

  if (isInfluencer) {
    return (
      <PublicCommerceShell surfaceId={surfaceId} ownerId={ownerId} businessName={businessName} surfaceType={pubSurfaceType} buttonStyle={publishedButtonStyle}>
        <PublicSurfaceStyles />
        <div className="min-h-screen bg-muted/30 flex justify-center">
          <div className="w-full max-w-[420px] min-h-screen bg-background yangu-live shadow-xl" style={themeStyle}>
            {sectionContent}
          </div>
          {showBadge && <YanguBadge />}
        </div>
      </PublicCommerceShell>
    );
  }

  return (
    <PublicCommerceShell surfaceId={surfaceId} ownerId={ownerId} businessName={businessName} surfaceType={pubSurfaceType} buttonStyle={publishedButtonStyle}>
      <PublicSurfaceStyles />
      <div className="min-h-screen bg-background yangu-live yangu-public-snapshot" style={themeStyle}>
        <header className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-3">
            <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
          </div>
        </header>
        {sectionContent}
        {showBadge && <YanguBadge />}
      </div>
    </PublicCommerceShell>
  );
}

function PublicNotFound({ host, slug, message = "Page not found" }: { host: string; slug: string; message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-1">{message}</p>
        <p className="text-xs text-muted-foreground/60">
          {host}/{slug}
        </p>
      </div>
    </div>
  );
}
