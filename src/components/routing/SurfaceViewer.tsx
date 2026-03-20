import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Layout } from "lucide-react";
import { PREVIEW_MAP } from "@/components/builder/BuilderPreview";
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

// Deduplication now handled by shared deduplicatePublishedSections from builderCoreSections

export function SurfaceViewer({ publishId, host, domainType }: SurfaceViewerProps) {
  const [data, setData] = useState<BuilderPublicSchemaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const currentHost = host ?? window.location.hostname.replace(/^www\./, "");
      const pathSlug = window.location.pathname.replace(/^\/+/, "").split("/")[0] || "home";

      console.log("[SurfaceViewer] Loading published content", { currentHost, pathSlug, publishId });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#08120D' }}>
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
  const schema = data.published_schema;
  const page = schema.pages?.[0];
  const title = schema.surface?.title || "Untitled";
  const surfaceType = schema.surface?.surface_type;
  const rawSections = page?.sections
    ?.slice()
    .sort((a: BuilderPublishedSection, b: BuilderPublishedSection) => a.position - b.position) ?? [];
  
  // Deduplicate using shared normalizer (matches editor canvas logic)
  const sections = deduplicatePublishedSections(rawSections, surfaceType || "quick_site");

  // Read theme
  const rawTheme = (schema.surface?.theme as Partial<BuilderTheme>) || {};
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

          if (fullBleed || section.section_type === "hero" || section.section_type === "hero_banner") {
            return (
              <div key={`${section.section_type}-${i}`} className="w-full">
                <div className={isInfluencer ? "px-4" : "max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8"}>
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
      <div className="min-h-screen bg-muted/30 flex justify-center">
        <div
          className="w-full max-w-[420px] min-h-screen bg-background yangu-live shadow-xl"
          style={themeStyle}
        >
          {pageContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background yangu-live" style={themeStyle}>
      {pageContent}
    </div>
  );
}
