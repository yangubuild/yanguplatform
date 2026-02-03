// Public Surface Page
// Renders published surface based on domain context
// Always resolves via surface_publishes - never queries surfaces directly

import { usePublicSurfaceResolver, type PublicSurfaceData } from "@/hooks/usePublicSurface";
import { DomainInactive, NotPublished, DevDomainDebug, DomainBadge } from "@/components/domain";
import { AppShell, PageContainer, Card } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function PublicSurfacePage() {
  const result = usePublicSurfaceResolver();

  // Loading state
  if (result.status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
        <DevDomainDebug />
      </div>
    );
  }

  // Domain is inactive
  if (result.status === "inactive_domain") {
    return (
      <>
        <DomainInactive />
        <DevDomainDebug />
      </>
    );
  }

  // No published surface
  if (result.status === "not_published") {
    return (
      <>
        <NotPublished canPublish={result.canPublish} />
        <DevDomainDebug />
      </>
    );
  }

  // Error state
  if (result.status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground">{result.message}</p>
        </Card>
        <DevDomainDebug />
      </div>
    );
  }

  // Published surface - render it
  return (
    <>
      <PublishedSurfaceView surface={result.surface} />
      <DevDomainDebug />
    </>
  );
}

// Renders the actual published surface content
function PublishedSurfaceView({ surface }: { surface: PublicSurfaceData }) {
  const fullUrl = `${surface.domainHost}`;

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
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Published
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{fullUrl}</span>
                </div>
              </div>

              {/* Surface Type Badge */}
              <div className="flex items-center gap-2">
                <DomainBadge />
              </div>

              {/* Published date */}
              {surface.publishedAt && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    Published {format(new Date(surface.publishedAt), "PPP")}
                  </span>
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
