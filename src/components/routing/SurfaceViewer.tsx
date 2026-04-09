import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Layout } from "lucide-react";
import { PREVIEW_MAP } from "@/components/builder/BuilderPreview";
import { PublishedEmenuFrame } from "@/components/routing/PublishedEmenuFrame";
import { DEFAULT_THEME, type BuilderTheme } from "@/components/builder/BuilderSettingsDrawer";
import { deduplicatePublishedSections } from "@/config/builderCoreSections";
import type {
  BuilderPublicSchemaResult,
  BuilderPublishedSection,
} from "@/types/builder";

interface SurfaceViewerProps {
  publishId: string;
  host?: string;
  domainType?: string;
}

/** Inline SVG for the YANGU badge icon */
const BADGE_SVG_DATA = "data:image/svg+xml," + encodeURIComponent(
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="22" fill="#E8612D"/><path d="M50 30L35 50h10v20h10V50h10L50 30z" fill="white"/></svg>'
);

function YanguBadge() {
  return (
    <a
      href="https://yangu.io"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "6px 12px 6px 8px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 12,
        color: "#333",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        textDecoration: "none",
        cursor: "pointer",
        lineHeight: 1,
      }}
    >
      <img src={BADGE_SVG_DATA} alt="" style={{ width: 14, height: 14, borderRadius: 3 }} />
      Made in YANGU
    </a>
  );
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
  const showBadge = surfaceMeta.show_yangu_badge !== false;

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

  // Render published schema — use same normalization as editor canvas
  const page = schema?.pages?.[0];
  const title = pageTitle;
  const surfaceType = surfaceMeta.surface_type;
  const publishedEmenuHtml = surfaceType === "emenu"
    ? ((surfaceMeta.emenu_html as string | null) || null)
    : null;

  if (surfaceType === "emenu") {
    if (!publishedEmenuHtml) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
          <Layout className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">This menu needs to be republished.</p>
        </div>
      );
    }

    return (
      <PublishedEmenuFrame
        html={publishedEmenuHtml}
        title={title}
        faviconUrl={faviconUrl}
        showBadge={showBadge}
      />
    );
  }

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
      <div className="bg-background min-h-screen bg-muted/30 flex justify-center">
        <div
          className="w-full max-w-[420px] min-h-screen bg-background yangu-live shadow-xl"
          style={themeStyle}>
          {pageContent}
        </div>
        {showBadge && <YanguBadge />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background yangu-live" style={themeStyle}>
      {pageContent}
      {showBadge && <YanguBadge />}
    </div>
  );
}
