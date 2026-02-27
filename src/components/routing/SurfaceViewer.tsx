import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Layout } from "lucide-react";
import { PREVIEW_MAP } from "@/components/builder/BuilderPreview";
import { DEFAULT_THEME, type BuilderTheme } from "@/components/builder/BuilderSettingsDrawer";
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

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Derive host and slug from the current URL
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

  // Render published schema
  const schema = data.published_schema;
  const page = schema.pages?.[0];
  const sections = page?.sections
    ?.slice()
    .sort((a: BuilderPublishedSection, b: BuilderPublishedSection) => a.position - b.position) ?? [];
  const title = schema.surface?.title || "Untitled";

  // Read theme
  const rawTheme = (schema.surface?.theme as Partial<BuilderTheme>) || {};
  const surfaceTheme: BuilderTheme = { ...DEFAULT_THEME, ...rawTheme };
  const themeStyle: React.CSSProperties = {
    fontFamily: surfaceTheme.font_family,
    fontWeight: Number(surfaceTheme.body_weight),
  };

  return (
    <div className="min-h-screen bg-background" style={themeStyle}>
      {/* Sections */}
      {sections.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p>This page has no content yet.</p>
        </div>
      ) : (
        sections.map((section: BuilderPublishedSection, i: number) => {
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
        })
      )}
    </div>
  );
}
