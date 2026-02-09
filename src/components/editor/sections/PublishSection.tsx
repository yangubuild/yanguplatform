import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/useRoles";
import { PublishModal } from "@/components/editor/PublishModal";
import { useSurfaceActions } from "@/hooks/useSurfaceActions";
import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Globe,
  ArrowRight,
  GlobeIcon,
} from "lucide-react";

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

interface PublishSectionProps {
  surface: SurfaceData;
  userId: string;
  orgId?: string;
  onSurfaceUpdate?: (updates: Partial<SurfaceData>) => void;
}

export function PublishSection({ surface, userId, orgId, onSurfaceUpdate }: PublishSectionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner, isLoading: rolesLoading } = useRoles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { unpublishSurface } = useSurfaceActions();

  const isPublished = surface.activePublishes.length > 0;
  const isArchived = !!surface.archived_at;

  // Permission check
  const showPermissionWarning = !rolesLoading && !isOwner;

  // Handle successful publish
  const handlePublishSuccess = (domainHost: string) => {
    // Refetch will happen via query invalidation
    toast({
      title: "Surface published! 🎉",
      description: `Your surface is now live at ${domainHost}`,
    });
  };

  // Handle unpublish
  const handleUnpublish = (domainId: string) => {
    unpublishSurface.mutate(
      { surfaceId: surface.id, domainId },
      {
        onSuccess: () => {
          toast({
            title: "Surface unpublished",
            description: "Your surface is no longer live.",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Publish</h2>
        <p className="text-muted-foreground">Make your surface live and accessible to everyone</p>
      </div>

      {/* Archived Warning */}
      {isArchived && (
        <Card className="p-4 border-warning/50 bg-warning/5">
          <p className="text-sm text-warning font-medium">
            This surface is archived. Unarchive it to publish.
          </p>
        </Card>
      )}

      {/* Permission Warning */}
      {!isArchived && showPermissionWarning && (
        <Card className="p-4 border-destructive/50 bg-destructive/5">
          <p className="text-sm text-destructive font-medium">
            You don't have permission to publish. Only organization owners or admins can publish surfaces.
          </p>
        </Card>
      )}

      {/* Current Status */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isPublished ? "bg-success/10" : "bg-muted"}`}>
            {isPublished ? (
              <CheckCircle2 className="h-6 w-6 text-success" />
            ) : (
              <Clock className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">
                {isPublished ? "Your surface is live!" : "Your surface is in draft mode"}
              </h3>
              <Badge 
                variant={isPublished ? "default" : "secondary"}
                className={isPublished ? "bg-success text-success-foreground" : ""}
              >
                {isPublished ? "Live" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isPublished
                ? `Published on ${surface.activePublishes.length} domain${surface.activePublishes.length > 1 ? "s" : ""}`
                : "Only you can view this surface. Publish to make it public."}
            </p>
          </div>
        </div>
      </Card>

      {/* Active Publishes */}
      {isPublished && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Active Publications</h3>
          <div className="space-y-3">
            {surface.activePublishes.map((pub) => (
              <div
                key={pub.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {pub.domain_host}{pub.slug ? `/${pub.slug}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Published {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const path = pub.slug ? `/${pub.slug}` : "/";
                      window.open(`https://${pub.domain_host}${path}`, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnpublish(pub.domain_id)}
                    disabled={unpublishSurface.isPending || !isOwner}
                  >
                    <GlobeIcon className="h-4 w-4 mr-1" />
                    Unpublish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Publish Action */}
      {!isArchived && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">
                {rolesLoading 
                  ? "Loading permissions..." 
                  : !isOwner
                  ? "No Permission"
                  : isPublished
                  ? "Publish to Another Domain"
                  : "Ready to Publish"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {rolesLoading
                  ? "Please wait while we verify your permissions."
                  : !isOwner
                  ? "Only organization owners or admins can publish surfaces."
                  : isPublished
                  ? "You can publish this surface to additional domains."
                  : "Click the button to select a domain and publish your surface."}
              </p>
            </div>
            <Button
              size="lg"
              variant={isPublished ? "outline" : "default"}
              disabled={rolesLoading || !isOwner || isArchived}
              onClick={() => setIsModalOpen(true)}
              className="gap-2"
            >
              <Rocket className="h-4 w-4" />
              {isPublished ? "Add Domain" : "Publish Surface"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Publish Modal */}
      <PublishModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        surfaceId={surface.id}
        surfaceTitle={surface.title || "Untitled Surface"}
        draftSlug={surface.draft_slug}
        currentDomainId={surface.activePublishes[0]?.domain_id}
        onPublishSuccess={handlePublishSuccess}
      />
    </div>
  );
}
