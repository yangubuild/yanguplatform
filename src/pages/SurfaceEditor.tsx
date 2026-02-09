import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { EditorSidebar, EditorSection } from "@/components/editor/EditorSidebar";
import { OverviewSection } from "@/components/editor/sections/OverviewSection";
import { PublishSection } from "@/components/editor/sections/PublishSection";
import { Card, SecondaryButton } from "@/components/primitives";
import { Loader2, ArrowLeft, Lock } from "lucide-react";

interface ActivePublish {
  id: string;
  domain_id: string;
  domain_host: string;
  slug: string | null;
  published_at: string | null;
}

interface SurfaceData {
  id: string;
  title: string | null;
  surface_type: string;
  status: string;
  org_id: string;
  archived_at: string | null;
  draft_slug: string | null;
  draft_domain_id: string | null;
  activePublishes: ActivePublish[];
}

export default function SurfaceEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [surface, setSurface] = useState<SurfaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeSection, setActiveSection] = useState<EditorSection>("overview");

  // Fetch surface data
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
          .select("id, title, surface_type, status, org_id, archived_at, draft_slug, draft_domain_id")
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
            domain_id,
            slug,
            published_at,
            domains!inner (
              host,
              domain_type
            )
          `)
          .eq("surface_id", id)
          .eq("state", "published")
          .is("unpublished_at", null);

        const activePublishes: ActivePublish[] = (publishes || []).map((pub) => ({
          id: pub.id,
          domain_id: pub.domain_id,
          domain_host: (pub.domains as any)?.host || "",
          slug: pub.slug || null,
          published_at: pub.published_at,
        }));

        setSurface({
          ...surfaceData,
          draft_slug: (surfaceData as any).draft_slug || null,
          draft_domain_id: (surfaceData as any).draft_domain_id || null,
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

  const handleSurfaceUpdate = (updates: Partial<SurfaceData>) => {
    setSurface((prev) => (prev ? { ...prev, ...updates } : null));
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading editor...</p>
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
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to edit this surface.
          </p>
          <SecondaryButton onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
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
          <p className="text-muted-foreground mb-6">{error || "Surface not found"}</p>
          <SecondaryButton onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </SecondaryButton>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <EditorSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          surfaceTitle={surface.title || "Untitled Surface"}
        />
        <SidebarInset>
          {/* Top bar */}
          <header className="sticky top-0 z-40 h-14 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
              {activeSection === "overview" && (
                <OverviewSection
                  surface={surface}
                  userId={user!.id}
                  onSurfaceUpdate={handleSurfaceUpdate}
                />
              )}
              {activeSection === "publish" && (
                <PublishSection
                  surface={surface}
                  userId={user!.id}
                  orgId={surface.org_id || undefined}
                  onSurfaceUpdate={handleSurfaceUpdate}
                />
              )}
              {(activeSection === "content" || activeSection === "appearance" || activeSection === "seo") && (
                <Card className="p-8 text-center">
                  <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
                  <p className="text-muted-foreground">
                    The {activeSection} section is under development.
                  </p>
                </Card>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
