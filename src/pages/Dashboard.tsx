import { useAuth } from "@/hooks/useAuth";
import { useSurfaces } from "@/hooks/useSurfaces";
import { useNavigate } from "react-router-dom";
import { useDomain } from "@/contexts/DomainContext";
import { AppShell } from "@/components/primitives";
import { PageContainer, Card, Banner, PrimaryButton, SecondaryButton } from "@/components/primitives";
import { SurfaceCard } from "@/components/dashboard/SurfaceCard";
import { DomainBadge } from "@/components/domain/DomainBadge";
import { Plus, Rocket, Users, BarChart3, Loader2, Sparkles } from "lucide-react";


export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { domainType, routeConfig } = useDomain();
  const { data: surfaces, isLoading: surfacesLoading } = useSurfaces();

  const handleEdit = (surface: { id: string }) => {
    navigate(`/surfaces/${surface.id}/edit`);
  };

  const handlePreview = (surface: { id: string }) => {
    navigate(`/s/${surface.id}/preview`);
  };

  const hasSurfaces = surfaces && surfaces.length > 0;

  const handleCreateSurface = () => {
    console.log("[Dashboard] Navigating to /onboarding?new=1");
    navigate("/onboarding?new=1");
  };

  const handleOpenStudio = () => {
    navigate("/studio");
  };

  return (
    <AppShell>
      <PageContainer size="xl">
        <div className="space-y-8">
          {/* Welcome Banner */}
          <Banner variant="accent">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">
                    Welcome back, {profile?.display_name || `@${profile?.username}`}!
                  </h1>
                  {domainType !== "io" && <DomainBadge size="sm" />}
                </div>
                <p className="text-muted-foreground">
                  {routeConfig.primaryCta.replace(/^(Open|Claim|Build|Start|Showcase|Go)/, "Ready to $1").toLowerCase()}?
                </p>
              </div>
              <div className="flex gap-3">
                <SecondaryButton onClick={handleOpenStudio}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Studio
                </SecondaryButton>
                <PrimaryButton onClick={handleCreateSurface}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Surface
                </PrimaryButton>
              </div>
            </div>
          </Banner>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Rocket className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Surfaces</p>
                  <p className="text-2xl font-bold">
                    {surfaces?.filter((s) => s.is_published).length || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Visitors</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <BarChart3 className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">$0</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Surfaces Section */}
          {surfacesLoading ? (
            <Card className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground mt-4">Loading your surfaces...</p>
            </Card>
          ) : hasSurfaces ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Surfaces</h2>
                <PrimaryButton size="sm" onClick={handleCreateSurface}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Surface
                </PrimaryButton>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {surfaces.map((surface) => (
                  <SurfaceCard
                    key={surface.id}
                    surface={surface}
                    onEdit={handleEdit}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Rocket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No surfaces yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first surface to start building your online presence. Choose from shops, portfolios, communities, and more.
              </p>
              <PrimaryButton onClick={handleCreateSurface}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Surface
              </PrimaryButton>
            </Card>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
