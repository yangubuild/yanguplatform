import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, PageContainer, Card, SecondaryButton } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, ArrowLeft, Lock } from "lucide-react";

interface SurfaceData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  domain: {
    id: string;
    domain: string;
    label: string;
    surface_type: string;
  };
  settings: {
    primary_color: string | null;
    accent_color: string | null;
    logo_url: string | null;
  } | null;
}

export default function PublicSurface() {
  const { domain, slug } = useParams<{ domain: string; slug: string }>();
  const navigate = useNavigate();
  
  const [surface, setSurface] = useState<SurfaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSurface() {
      if (!domain || !slug) {
        setError("Invalid URL");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch published surface by domain and slug
        const { data: surfaceData, error: surfaceError } = await supabase
          .from("public_surfaces")
          .select(`
            id,
            title,
            description,
            slug,
            is_published,
            domain:surface_domains!inner(
              id,
              domain,
              label,
              surface_type
            )
          `)
          .eq("is_published", true)
          .eq("slug", slug.toLowerCase())
          .maybeSingle();

        if (surfaceError) {
          console.error("Surface fetch error:", surfaceError);
          setError("Failed to load surface");
          setIsLoading(false);
          return;
        }

        // Filter by domain after fetch (can't filter joined table directly)
        if (!surfaceData || (surfaceData.domain as SurfaceData["domain"]).domain !== domain) {
          setError("Surface not found");
          setIsLoading(false);
          return;
        }

        // Fetch settings separately
        const { data: settingsData } = await supabase
          .from("surface_settings")
          .select("primary_color, accent_color, logo_url")
          .eq("surface_id", surfaceData.id)
          .maybeSingle();

        setSurface({
          ...surfaceData,
          domain: surfaceData.domain as SurfaceData["domain"],
          settings: settingsData,
        });
      } catch (err) {
        console.error("Error fetching surface:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSurface();
  }, [domain, slug]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Error / Not found state
  if (error || !surface) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Not Available</h1>
          <p className="text-muted-foreground mb-6">
            {error || "This surface doesn't exist or isn't published yet."}
          </p>
          <SecondaryButton onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </SecondaryButton>
        </Card>
      </div>
    );
  }

  const fullUrl = `${surface.domain.domain}/${surface.slug}`;

  // Public surface view - this will be the actual rendered surface content
  return (
    <AppShell>
      <PageContainer size="md">
        <div className="space-y-6">
          {/* Surface Content */}
          <Card className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{surface.title}</h1>
                  <Badge variant="default">Published</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{fullUrl}</span>
                </div>
              </div>

              {/* Surface Type Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{surface.domain.label}</Badge>
              </div>

              {/* Description */}
              {surface.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p className="text-foreground">{surface.description}</p>
                </div>
              )}

              {/* Placeholder for actual surface content */}
              <div className="pt-6 border-t border-border">
                <p className="text-center text-muted-foreground">
                  Surface content will be rendered here once the Content editor is built.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
