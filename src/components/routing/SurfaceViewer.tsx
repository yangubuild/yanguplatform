import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Layout } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SurfaceViewerProps {
  publishId: string;
  host?: string;
  domainType?: string;
}

interface PublishedSurface {
  surface_id: string;
  title: string | null;
  surface_type: string | null;
  publish_id: string;
  slug: string | null;
  domain_host: string | null;
  domain_type: string | null;
  org_id: string;
}

export function SurfaceViewer({ publishId, host, domainType }: SurfaceViewerProps) {
  const [data, setData] = useState<PublishedSurface | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      console.log("[SurfaceViewer] Calling get_published_surface", { p_publish_id: publishId });
      const { data: result, error: err } = await supabase.rpc("get_published_surface", {
        p_publish_id: publishId,
      });

      console.log("[SurfaceViewer] RPC response:", { data: result, error: err });

      if (err) {
        console.error("[SurfaceViewer] RPC error:", err);
        setError(`RPC error: ${err.message} (code: ${err.code})`);
      } else if (result && typeof result === "object" && "error" in (result as Record<string, unknown>)) {
        const rpcError = (result as Record<string, unknown>).error as string;
        console.error("[SurfaceViewer] RPC returned error payload:", result);
        setError(`RPC payload error: ${rpcError}`);
      } else {
        console.log("[SurfaceViewer] Parsed surface data:", result);
        setData(result as unknown as PublishedSurface);
      }
      setLoading(false);
    }
    load();
  }, [publishId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">{data.title ?? "Untitled Surface"}</h1>
            {data.surface_type && (
              <Badge variant="secondary" className="capitalize">{data.surface_type}</Badge>
            )}
          </div>
          {data.domain_host && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Globe className="h-4 w-4" />
              <span>{data.domain_host}{data.slug ? `/${data.slug}` : ""}</span>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-muted-foreground text-center">
          Surface content blocks will be rendered here once the block editor is built.
        </p>
      </main>
    </div>
  );
}
