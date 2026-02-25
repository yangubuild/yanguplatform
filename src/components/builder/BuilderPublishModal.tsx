import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/primitives";
import {
  Loader2,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Rocket,
  ExternalLink,
  Link2,
  Copy,
} from "lucide-react";
import { useBuilderPublish, type ActiveDomain } from "@/hooks/useBuilderPublish";
import type { BuilderSurfaceType } from "@/types/builder";
import { toast } from "sonner";

interface BuilderPublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaceId: string;
  surfaceType: BuilderSurfaceType;
  surfaceTitle: string;
  defaultSlug?: string;
}

export function BuilderPublishModal({
  open,
  onOpenChange,
  surfaceId,
  surfaceType,
  surfaceTitle,
  defaultSlug,
}: BuilderPublishModalProps) {
  const {
    allowedDomains,
    domainsLoading,
    selectedDomainId,
    setSelectedDomainId,
    selectedDomain,
    customSlug,
    setCustomSlug,
    isPublishing,
    publishResult,
    publishError,
    publish,
    reset,
  } = useBuilderPublish(surfaceId, surfaceType);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Auto-select first allowed domain on open
  useEffect(() => {
    if (open && allowedDomains.length > 0 && !selectedDomainId) {
      setSelectedDomainId(allowedDomains[0].id);
    }
  }, [open, allowedDomains, selectedDomainId, setSelectedDomainId]);

  // Set default slug on open
  useEffect(() => {
    if (open && defaultSlug && !customSlug) {
      setCustomSlug(defaultSlug);
    }
  }, [open, defaultSlug, customSlug, setCustomSlug]);

  const isSuccess = publishResult?.ok === true;
  const slugDisplay = customSlug || defaultSlug || "";
  const publishedUrl = selectedDomain
    ? `https://${selectedDomain.host}${slugDisplay ? `/${slugDisplay}` : ""}`
    : null;

  const handleCopyUrl = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      toast.success("URL copied to clipboard");
    }
  };

  // ─── Success State ───
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>

            <div>
              <h2 className="text-xl font-bold">Published! 🚀</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your surface is now live
              </p>
            </div>

            {/* Published URL */}
            <Card className="w-full p-4 space-y-2">
              <Label className="text-xs text-muted-foreground">Published to</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <code className="text-sm font-medium break-all flex-1">
                  {selectedDomain?.host}{slugDisplay ? `/${slugDisplay}` : ""}
                </code>
                <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>

            {/* Publish ID */}
            {publishResult?.publish_id && (
              <p className="text-xs text-muted-foreground">
                Publish ID: <code className="font-mono">{publishResult.publish_id}</code>
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full pt-2">
              {publishedUrl && (
                <Button
                  className="w-full gap-2"
                  onClick={() => window.open(publishedUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Live Page
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Main State ───
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Publish Surface
          </DialogTitle>
          <DialogDescription>
            Choose a domain to publish "{surfaceTitle}" on
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Domain Picker */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Domain</label>

            {domainsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allowedDomains.length === 0 ? (
              <Card className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No eligible domains for this surface type.
                </p>
              </Card>
            ) : (
              <div className="grid gap-2">
                {allowedDomains.map((domain: ActiveDomain) => (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomainId(domain.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedDomainId === domain.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        selectedDomainId === domain.id ? "bg-accent/10" : "bg-muted"
                      }`}
                    >
                      <Globe
                        className={`h-4 w-4 ${
                          selectedDomainId === domain.id
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <p className="font-medium truncate flex-1">{domain.host}</p>
                    {selectedDomainId === domain.id && (
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Slug Input */}
          {selectedDomain && (
            <div className="space-y-2">
              <Label htmlFor="builder-slug" className="text-sm font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL Slug
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">
                  {selectedDomain.host}/
                </span>
                <Input
                  id="builder-slug"
                  placeholder={defaultSlug || "my-page"}
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be the URL where your page is accessible
              </p>
            </div>
          )}

          {/* Error */}
          {publishError && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{publishError}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={publish}
            disabled={!selectedDomainId || isPublishing}
            className="gap-2"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
