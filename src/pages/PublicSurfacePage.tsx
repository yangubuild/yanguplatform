import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PREVIEW_MAP } from "@/components/builder/BuilderPreview";
import { DEFAULT_THEME, type BuilderTheme } from "@/components/builder/BuilderSettingsDrawer";
import { deduplicatePublishedSections } from "@/config/builderCoreSections";
import type {
  BuilderPublicSchemaResult,
  BuilderPublishedSection,
} from "@/types/builder";
import { Loader2 } from "lucide-react";

/**
 * Public published page renderer.
 * Reads host + slug from the URL, calls builder_get_public_schema,
 * and renders the published schema using the same BuilderPreview renderers.
 */
export default function PublicSurfacePage() {
  const location = useLocation();

  // Derive host and slug
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
    staleTime: 60_000,
  });

  // Extract metadata for document head (must be before early returns)
  const surfaceData = (data?.published_schema?.surface || {}) as any;
  const pageTitle = surfaceData.seo_title || surfaceData.title || "Untitled";
  const seoDescription = surfaceData.seo_description || surfaceData.description || "";
  const faviconUrl = surfaceData.favicon_url || "";

  // Set document metadata (Block A — public page output)
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

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not found / error
  if (error || !data) {
    return <PublicNotFound host={host} slug={pathSlug} />;
  }

  // Render published schema — use same normalization as editor canvas
  const schema = data.published_schema;
  const page = schema.pages?.[0];
  const rawSections = page?.sections
    ?.slice()
    .sort((a: BuilderPublishedSection, b: BuilderPublishedSection) => a.position - b.position) ?? [];
  
  const sections = deduplicatePublishedSections(rawSections, surfaceData.surface_type || "quick_site");
  
  const title = pageTitle;
  const surfaceType = surfaceData.surface_type;
  const isInfluencer = surfaceType === "live_bio";
  
  // Read theme from published schema
  const rawTheme = (surfaceData.theme as Partial<BuilderTheme>) || {};
  const surfaceTheme: BuilderTheme = { ...DEFAULT_THEME, ...rawTheme };
  const themeStyle: React.CSSProperties = {
    fontFamily: surfaceTheme.font_family,
    fontWeight: Number(surfaceTheme.body_weight),
  };

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
          return (
            <div key={`${section.section_type}-${i}`} className="w-full">
              <div className={isInfluencer ? "px-4 py-4" : "max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-8 lg:py-12"}>
                {Preview ? (
                  isHero
                    ? <Preview schema={section.schema} surfaceType={surfaceType} />
                    : <Preview schema={section.schema} />
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
    </main>
  );

  if (isInfluencer) {
    return (
      <div className="min-h-screen bg-muted/30 flex justify-center">
        <div className="w-full max-w-[420px] min-h-screen bg-background yangu-live shadow-xl" style={themeStyle}>
          {sectionContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background yangu-live" style={themeStyle}>
      {/* Minimal header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-5 lg:px-6 xl:px-8 py-3">
          <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
        </div>
      </header>
      {sectionContent}
    </div>
  );
}

function PublicNotFound({ host, slug }: { host: string; slug: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-1">Page not found</p>
        <p className="text-xs text-muted-foreground/60">
          {host}/{slug}
        </p>
      </div>
    </div>
  );
}
