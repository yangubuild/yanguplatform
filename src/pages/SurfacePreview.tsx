import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell, PageContainer, Card, PrimaryButton, SecondaryButton } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Pencil, ArrowLeft, Lock, ExternalLink } from "lucide-react";

interface SurfaceData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  user_id: string;
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

export default function SurfacePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  const [surface, setSurface] = useState<SurfaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function fetchSurface() {
      if (!id) {
        setError("Surface ID is required");
        setIsLoading(false);
        return;
      }

      // Must be authenticated to use owner preview
      if (!user) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch surface with domain
        const { data: surfaceData, error: surfaceError } = await supabase
          .from("public_surfaces")
          .select(`
            id,
            title,
            description,
            slug,
            is_published,
            user_id,
            domain:surface_domains!inner(
              id,
              domain,
              label,
              surface_type
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (surfaceError) {
          console.error("Surface fetch error:", surfaceError);
          
          // Check if it's an RLS error
          if (surfaceError.code === "PGRST116" || surfaceError.message.includes("security")) {
            setAccessDenied(true);
            setIsLoading(false);
            return;
          }
          
          setError("Failed to load surface");
          setIsLoading(false);
          return;
        }

        if (!surfaceData) {
          setError("Surface not found");
          setIsLoading(false);
          return;
        }

        // Owner check: only the owner can use this preview route
        if (user.id !== surfaceData.user_id) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        // Fetch settings separately
        const { data: settingsData } = await supabase
          .from("surface_settings")
          .select("primary_color, accent_color, logo_url")
          .eq("surface_id", id)
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

    // Wait for auth to finish loading before checking access
    if (!authLoading) {
      fetchSurface();
    }
  }, [id, user?.id, authLoading, user]);

  const handleEdit = () => {
    navigate(`/surfaces/${id}/edit`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewPublic = () => {
    if (surface?.is_published) {
      navigate(`/s/${surface.domain.domain}/${surface.slug}`);
    }
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading surface...</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Not Available</h1>
          <p className="text-muted-foreground mb-6">
            This preview is only available to the surface owner.
          </p>
          <SecondaryButton onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Home
          </SecondaryButton>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !surface) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Oops!</h1>
          <p className="text-muted-foreground mb-6">
            {error || "Surface not found"}
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

  return (
    <AppShell>
      <PageContainer size="md">
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Owner Preview Banner */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <p className="text-sm text-primary">
              <strong>Owner Preview</strong> — Only you can see this view
            </p>
            {surface.is_published && (
              <button
                onClick={handleViewPublic}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View public page
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Surface Preview Card */}
          <Card className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{surface.title}</h1>
                    <Badge 
                      variant={surface.is_published ? "default" : "secondary"}
                    >
                      {surface.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{fullUrl}</span>
                  </div>
                </div>

                <PrimaryButton onClick={handleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Surface
                </PrimaryButton>
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

              {/* Surface Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Domain</h3>
                  <p className="text-foreground">{surface.domain.domain}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Slug</h3>
                  <p className="text-foreground font-mono">/{surface.slug}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
                  <p className="text-foreground capitalize">{surface.domain.surface_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                  <p className="text-foreground">
                    {surface.is_published ? "Live" : "Draft (not visible to public)"}
                  </p>
                </div>
              </div>

              {/* Draft Notice */}
              {!surface.is_published && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning">
                    This surface is still a draft. Complete your setup and publish it to make it visible to the public.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
