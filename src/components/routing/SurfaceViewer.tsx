// Public renderer (custom-domain path): prefers the sanitized HTML snapshot embedded by
// useBuilderPublish (published_schema.surface.html / surface.pages_html[slug]). Falls back
// to compiled JSON sections when no HTML is present.
import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Layout } from "lucide-react";
import { PREVIEW_MAP } from "@/components/builder/BuilderPreview";
import { PublicCommerceShell } from "@/components/commerce/PublicCommerceShell";
import { PUBLIC_RESPONSIVE_CSS } from "@/components/commerce/publicResponsiveCss";
import { YanguBadge } from "@/components/routing/YanguBadge";
import { PublicSurfaceStyles } from "@/components/routing/PublicSurfaceStyles";
import { DEFAULT_THEME, type BuilderTheme } from "@/components/builder/BuilderSettingsDrawer";
import { deduplicatePublishedSections } from "@/config/builderCoreSections";
import { neutralizePlaceholderLinks } from "@/lib/builder/neutralizePlaceholderLinks";
import type {
  BuilderPublicSchemaResult,
  BuilderPublishedSection,
} from "@/types/builder";

interface SurfaceViewerProps {
  publishId: string;
  host?: string;
  domainType?: string;
}
export function SurfaceViewer({ publishId, host, domainType }: SurfaceViewerProps) {
  const [data, setData] = useState<BuilderPublicSchemaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract surface metadata early for hooks (before conditional returns)
  const schema = data?.published_schema;
  const surfaceMeta = (schema?.surface || {}) as Record<string, any>;
  const pageTitle = surfaceMeta.seo_title || surfaceMeta.title || "Untitled";
  const faviconUrl = (surfaceMeta.favicon_url as string | null) || null;
  const showBadge = surfaceMeta.show_yangu_badge === true;
  const pathSlugForHtml = (typeof window !== "undefined"
    ? window.location.pathname.replace(/^\/+/, "").split("/")[0]
    : "") || "home";
  const pagesHtmlMap = (surfaceMeta.pages_html || {}) as Record<string, string>;
  const rawHtml: string | null =
    pagesHtmlMap[pathSlugForHtml] ||
    pagesHtmlMap["home"] ||
    (surfaceMeta.html as string | null) ||
    null;
  // HTML snapshot is opt-in. Builder canvas HTML is desktop-only and breaks
  // mobile layouts, so default to JSON-section rendering unless the publisher
  // flags the snapshot as responsive/publish-ready.
  const htmlSnapshotEnabled = surfaceMeta.html_snapshot_responsive === true;
  const surfaceIdForShell = (surfaceMeta.id as string) || "";
  const ownerIdForShell = (surfaceMeta.user_id as string) || "";
  const businessNameForShell = (surfaceMeta.title as string) || "";
  const isBazaroClassicSnapshot =
    surfaceMeta.builder_new_template === "estore_bazaro_classic" ||
    surfaceMeta.design_template === "estore_bazaro_classic" ||
    (typeof rawHtml === "string" && rawHtml.includes("/templates/bazaro-classic/"));

  const sanitizedHtml = useMemo(() => {
    if (!rawHtml) return null;
    try {
      const clean = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ["style", "link", "iframe"],
        ADD_ATTR: [
          "target", "rel", "allow", "allowfullscreen",
          "frameborder", "loading", "referrerpolicy", "data-yangu-node-id",
        ],
        FORBID_TAGS: ["script"],
        FORBID_ATTR: ["onerror", "onload", "onclick"],
        // Iframe srcDoc path needs full <html>/<head>/<link> preservation so
        // template stylesheets load. Only enabled for the extracted-template
        // iframe branch — all other callers keep default fragment behavior.
        ...(isBazaroClassicSnapshot ? { WHOLE_DOCUMENT: true } : {}),
      });
      if (isBazaroClassicSnapshot) return neutralizePlaceholderLinks(clean);
      // Same responsive layer as PublicSurfacePage — keeps the custom-domain
      // path (yangu.shop etc.) in lockstep with the lovable.app renderer.
      return PUBLIC_RESPONSIVE_CSS + clean;
    } catch (e) {
      console.error("[SurfaceViewer] sanitize error:", e);
      return null;
    }
  }, [rawHtml, isBazaroClassicSnapshot]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const currentHost = host ?? window.location.hostname.replace(/^www\./, "");
      const pathSlug = window.location.pathname.replace(/^\/+/, "").split("/")[0] || "home";

      if (import.meta.env.DEV) console.log("[SurfaceViewer] Loading published content", { currentHost, pathSlug, publishId });

      const { data: result, error: err } = await supabase.rpc("builder_get_public_schema", {
        p_host: currentHost,
        p_slug: pathSlug,
      });

      if (err) {
        console.error("[SurfaceViewer] RPC error:", err);
        setError(`RPC error: ${err.message} (code: ${err.code})`);
      } else if (result && typeof result === "object" && !(result as any)?.ok) {
        console.error("[SurfaceViewer] Not found:", result);
        setError((result as any)?.error || "not_found");
      } else {
        setData(result as unknown as BuilderPublicSchemaResult);
      }
      setLoading(false);
    }
    load();
  }, [publishId, host]);

  // Set per-surface favicon and title
  useEffect(() => {
    if (!data) return;

    document.title = pageTitle;

    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [data, pageTitle, faviconUrl]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center" >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Layout className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error ?? "Surface not found"}</p>
      </div>
    );
  }

  // Source-extracted Bazaro Classic: render the same full HTML document the
  // editor iframe uses. Do not wrap with PublicCommerceShell/Normalizer or
  // delegate universal CTA clicks, because those mutate the template layout.
  if (sanitizedHtml && htmlSnapshotEnabled && isBazaroClassicSnapshot) {
    return (
      <div className="min-h-screen bg-background">
        <iframe
          title={pageTitle}
          srcDoc={sanitizedHtml}
          className="block w-full h-screen border-0 bg-background"
          sandbox="allow-same-origin"
        />
        {showBadge && <YanguBadge />}
      </div>
    );
  }

  // HTML snapshot render path (opt-in only)
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
      <PublicCommerceShell
        surfaceId={surfaceIdForShell}
        ownerId={ownerIdForShell}
        businessName={businessNameForShell}
        surfaceType={surfaceMeta.surface_type as string | undefined}
      >
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

  // Render published schema — use same normalization as editor canvas
  const page = schema?.pages?.[0];
  const title = pageTitle;
  const surfaceType = surfaceMeta.surface_type;
  // JSON-section render path is the only publish renderer for all surface types.

  const rawSections = page?.sections
    ?.slice()
    .sort((a: BuilderPublishedSection, b: BuilderPublishedSection) => a.position - b.position) ?? [];
  
  // Deduplicate using shared normalizer (matches editor canvas logic)
  const sections = deduplicatePublishedSections(rawSections, surfaceType || "quick_site");

  // Read theme
  const rawTheme = (schema?.surface?.theme as Partial<BuilderTheme>) || {};
  const surfaceTheme: BuilderTheme = { ...DEFAULT_THEME, ...rawTheme };
  const themeStyle: React.CSSProperties = {
    fontFamily: surfaceTheme.font_family,
    fontWeight: Number(surfaceTheme.body_weight),
  };

  // Influencer / live_bio: always render as mobile-width centered on desktop
  const isInfluencer = surfaceType === "live_bio";

  const isFullBleedSection = (type: string) => {
    return type === "header" || type === "header_logo";
  };

  const pageContent = (
    <div className="w-full">
      {sections.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>This page has no content yet.</p>
        </div>
      ) : (
        sections.map((section: BuilderPublishedSection, i: number) => {
          const Preview = PREVIEW_MAP[section.section_type];
          const fullBleed = isFullBleedSection(section.section_type);
          const isHero = section.section_type === "hero" || section.section_type === "hero_banner";
          const heroProps = isHero ? { surfaceType: surfaceType } as any : {};

          if (fullBleed || isHero) {
            return (
              <div key={`${section.section_type}-${i}`} className="w-full">
                <div className={isInfluencer ? "px-4" : "max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8"}>
                  {Preview ? (
                    <Preview schema={section.schema} {...heroProps} />
                  ) : (
                    <div className="py-4 text-sm text-muted-foreground italic">
                      [{section.section_type}]
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={`${section.section_type}-${i}`} className="w-full">
              <div className={isInfluencer ? "px-4 py-4" : "max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-8 lg:py-12"}>
                {Preview ? (
                  <Preview schema={section.schema} />
                ) : (
                  <div className="py-4 text-sm text-muted-foreground italic">
                    [{section.section_type}]
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Influencer: wrap in mobile frame on desktop
  if (isInfluencer) {
    return (
      <PublicCommerceShell
        surfaceId={surfaceIdForShell}
        ownerId={ownerIdForShell}
        businessName={businessNameForShell}
        surfaceType={surfaceType as string | undefined}
      >
        <PublicSurfaceStyles />
        <div className="bg-background min-h-screen bg-muted/30 flex justify-center yangu-public-snapshot">
          <div
            className="w-full max-w-[420px] min-h-screen bg-background yangu-live shadow-xl"
            style={themeStyle}>
            {pageContent}
          </div>
          {showBadge && <YanguBadge />}
        </div>
      </PublicCommerceShell>
    );
  }

  return (
    <PublicCommerceShell
      surfaceId={surfaceIdForShell}
      ownerId={ownerIdForShell}
      businessName={businessNameForShell}
      surfaceType={surfaceType as string | undefined}
    >
      <PublicSurfaceStyles />
      <div className="min-h-screen bg-background yangu-live yangu-public-snapshot" style={themeStyle}>
        {pageContent}
        {showBadge && <YanguBadge />}
      </div>
    </PublicCommerceShell>
  );
}

