import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PREVIEW_MAP } from "@/components/builder/BuilderPreview";
import { DEFAULT_THEME, type BuilderTheme } from "@/components/builder/BuilderSettingsDrawer";
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

  // Render published schema
  const schema = data.published_schema;
  const page = schema.pages?.[0]; // first page (home)
  const rawSections = page?.sections
    ?.slice()
    .sort((a, b) => a.position - b.position) ?? [];
  
  // Deduplicate sections that share the same section_type + position
  const seen = new Set<string>();
  const sections = rawSections.filter((s) => {
    const key = `${s.section_type}::${s.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  const title = schema.surface?.title || "Untitled";
  const surfaceType = schema.surface?.surface_type;
  const isInfluencer = surfaceType === "live_bio";
  
  // Read theme from published schema
  const rawTheme = (schema.surface?.theme as Partial<BuilderTheme>) || {};
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
