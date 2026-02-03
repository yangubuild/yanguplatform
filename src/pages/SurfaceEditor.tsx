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

interface SurfaceData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_published: boolean;
  user_id: string;
  domain_id: string;
  domain: {
    id: string;
    domain: string;
    label: string;
    surface_type: string;
  };
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

      try {
        const { data: surfaceData, error: surfaceError } = await supabase
          .from("public_surfaces")
          .select(`
            id,
            title,
            description,
            slug,
            is_published,
            user_id,
            domain_id,
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

        // Check ownership
        const currentUserId = user?.id;
        if (!currentUserId || currentUserId !== surfaceData.user_id) {
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }

        const typedSurface: SurfaceData = {
          ...surfaceData,
          domain: surfaceData.domain as SurfaceData["domain"],
        };

        setSurface(typedSurface);
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
  }, [id, user?.id, authLoading]);

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
          surfaceTitle={surface.title}
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
