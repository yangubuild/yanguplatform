import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell, PageContainer, Card, PrimaryButton, SecondaryButton } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Pencil, ArrowLeft, Lock, ExternalLink } from "lucide-react";

interface ActivePublish {
  id: string;
  domain_host: string;
  domain_type: string;
  published_at: string | null;
}

interface SurfaceData {
  id: string;
  title: string | null;
  surface_type: string;
  status: string;
  org_id: string;
  archived_at: string | null;
  activePublishes: ActivePublish[];
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

      if (!user) {
        setAccessDenied(true);
        setIsLoading(false);
        return;
      }

      try {
        // Get user's org memberships to check access
        const { data: memberships, error: membershipError } = await supabase
          .from("org_memberships")
          .select("org_id, role")
          .eq("user_id", user.id);

        if (membershipError) {
          console.error("Membership fetch error:", membershipError);
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        const orgIds = memberships?.map((m) => m.org_id) || [];

        // Fetch surface from surfaces table
        const { data: surfaceData, error: surfaceError } = await supabase
          .from("surfaces")
          .select("id, title, surface_type, status, org_id, archived_at")
          .eq("id", id)
          .maybeSingle();

        if (surfaceError) {
          console.error("Surface fetch error:", surfaceError);
          setError("Failed to load surface");
          setIsLoading(false);
          return;
        }

        if (!surfaceData) {
          setError("Surface not found");
          setIsLoading(false);
          return;
        }

        // Check if user has access to this surface's org
        if (!orgIds.includes(surfaceData.org_id)) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        // Fetch active publishes
        const { data: publishes } = await supabase
          .from("surface_publishes")
          .select(`
            id,
            published_at,
            domains!surface_publishes_domain_id_fkey (
              host,
              domain_type
            )
          `)
          .eq("surface_id", id)
          .eq("state", "published")
          .is("unpublished_at", null);

        const activePublishes: ActivePublish[] = (publishes || []).map((pub) => ({
          id: pub.id,
          domain_host: (pub.domains as any)?.host || "",
          domain_type: (pub.domains as any)?.domain_type || "",
          published_at: pub.published_at,
        }));

        setSurface({
          ...surfaceData,
          activePublishes,
        });
      } catch (err) {
        console.error("Error fetching surface:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchSurface();
    }
  }, [id, user?.id, authLoading, user]);

  const handleEdit = () => {
    navigate(`/surfaces/${id}/edit`);
  };

  const handleBack = () => {
    navigate("/dashboard");
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
          <SecondaryButton onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
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
          <SecondaryButton onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go to Dashboard
          </SecondaryButton>
        </Card>
      </div>
    );
  }

  const isPublished = surface.activePublishes.length > 0;
  const isArchived = !!surface.archived_at;

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
            Back to Dashboard
          </button>

          {/* Owner Preview Banner */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <p className="text-sm text-primary">
              <strong>Owner Preview</strong> — Only you can see this view
            </p>
            {isPublished && surface.activePublishes[0] && (
              <a
                href={`https://${surface.activePublishes[0].domain_host}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View public page
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Surface Preview Card */}
          <Card className="p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{surface.title || "Untitled Surface"}</h1>
                    <Badge 
                      variant={isPublished ? "default" : "secondary"}
                      className={isPublished ? "bg-success text-success-foreground" : ""}
                    >
                      {isArchived ? "Archived" : isPublished ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm capitalize">{surface.surface_type}</span>
                  </div>
                </div>

                <PrimaryButton onClick={handleEdit} disabled={isArchived}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Surface
                </PrimaryButton>
              </div>

              {/* Active Publishes */}
              {isPublished && (
                <div className="flex flex-wrap gap-2">
                  {surface.activePublishes.map((pub) => (
                    <Badge key={pub.id} variant="outline" className="text-xs">
                      {pub.domain_host}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Surface Info Grid */}
              <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
                  <p className="text-foreground capitalize">{surface.surface_type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                  <p className="text-foreground">
                    {isArchived ? "Archived" : isPublished ? "Live" : "Draft (not visible to public)"}
                  </p>
                </div>
              </div>

              {/* Draft Notice */}
              {!isPublished && !isArchived && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning">
                    This surface is still a draft. Complete your setup and publish it to make it visible to the public.
                  </p>
                </div>
              )}

              {/* Archived Notice */}
              {isArchived && (
                <div className="p-4 rounded-lg bg-muted border border-border">
                  <p className="text-sm text-muted-foreground">
                    This surface is archived. Restore it from your dashboard to make changes.
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
