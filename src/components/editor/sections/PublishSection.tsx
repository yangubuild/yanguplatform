import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/hooks/useAuth";
import { PublishModal } from "@/components/editor/PublishModal";
import { DomainBadge } from "@/components/domain/DomainBadge";
import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Globe,
  ArrowRight,
} from "lucide-react";

interface SurfaceData {
  id: string;
  title: string;
  is_published: boolean;
  domain: {
    id: string;
    domain: string;
    label: string;
    surface_type: string;
  };
  slug: string;
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

  const isPublished = surface.is_published;
  const publicUrl = `${surface.domain.domain}/${surface.slug}`;
  const fullPublicUrl = `https://${publicUrl}`;

  // Permission check
  const showPermissionWarning = !rolesLoading && !isOwner;

  // Handle successful publish
  const handlePublishSuccess = (domainHost: string) => {
    onSurfaceUpdate?.({ is_published: true });
    toast({
      title: "Surface published! 🎉",
      description: `Your surface is now live at ${domainHost}/${surface.slug}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Publish</h2>
        <p className="text-muted-foreground">Make your surface live and accessible to everyone</p>
      </div>

      {/* Permission Warning */}
      {showPermissionWarning && (
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
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isPublished
                ? `Accessible at ${publicUrl}`
                : "Only you can view this surface. Publish to make it public."}
            </p>
            
            {isPublished && (
              <div className="flex items-center gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(fullPublicUrl, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  View Live
                </Button>
                <DomainBadge 
                  domainType={surface.domain.surface_type as any} 
                  size="sm" 
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Domain Info */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-accent/10">
            <Globe className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Current Domain</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This surface is configured to publish on:
            </p>
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{surface.domain.domain}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {surface.domain.label} • {surface.domain.surface_type}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {surface.slug}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Full URL: <span className="font-mono">{publicUrl}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Publish Action */}
      {!isPublished && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">
                {rolesLoading 
                  ? "Loading permissions..." 
                  : !isOwner
                  ? "No Permission"
                  : "Ready to Publish"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {rolesLoading
                  ? "Please wait while we verify your permissions."
                  : !isOwner
                  ? "Only organization owners or admins can publish surfaces."
                  : "Click the button to select a domain and publish your surface."}
              </p>
            </div>
            <Button
              size="lg"
              disabled={rolesLoading || !isOwner}
              onClick={() => setIsModalOpen(true)}
              className="gap-2"
            >
              <Rocket className="h-4 w-4" />
              Publish Surface
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Republish Action (when already published) */}
      {isPublished && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Manage Publication</h3>
              <p className="text-sm text-muted-foreground">
                Your surface is currently live. You can republish to a different domain if needed.
              </p>
            </div>
            <Button
              variant="outline"
              size="lg"
              disabled={rolesLoading || !isOwner}
              onClick={() => setIsModalOpen(true)}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Change Domain
            </Button>
          </div>
        </Card>
      )}

      {/* Publish Modal */}
      <PublishModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        surfaceId={surface.id}
        surfaceTitle={surface.title}
        currentDomainId={surface.domain.id}
        onPublishSuccess={handlePublishSuccess}
      />
    </div>
  );
}
