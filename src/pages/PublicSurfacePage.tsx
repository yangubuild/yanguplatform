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
  const sections = page?.sections
    ?.slice()
    .sort((a, b) => a.position - b.position) ?? [];
  const title = schema.surface?.title || "Untitled";
  
  // Read theme from published schema
  const rawTheme = (schema.surface?.theme as Partial<BuilderTheme>) || {};
  const surfaceTheme: BuilderTheme = { ...DEFAULT_THEME, ...rawTheme };
  const themeStyle: React.CSSProperties = {
    fontFamily: surfaceTheme.font_family,
    fontWeight: Number(surfaceTheme.body_weight),
  };

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      {/* Minimal header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
        </div>
      </header>

      {/* Sections */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {sections.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p>This page has no content yet.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
            {sections.map((section: BuilderPublishedSection, i: number) => {
              const Preview = PREVIEW_MAP[section.section_type];
              return (
                <div key={`${section.section_type}-${i}`}>
                  {Preview ? (
                    <Preview schema={section.schema} />
                  ) : (
                    <div className="px-6 py-4 text-sm text-muted-foreground italic">
                      [{section.section_type}]
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
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
