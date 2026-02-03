import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/primitives";
import { usePublishFlow, type OrgDomain } from "@/hooks/usePublish";
import { useDomain } from "@/contexts/DomainContext";
import {
  Loader2,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Rocket,
  ExternalLink,
  ArrowRight,
  Shield,
  CreditCard,
} from "lucide-react";

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaceId: string;
  surfaceTitle: string;
  orgId: string;
  currentDomainId?: string;
  onPublishSuccess?: (domainHost: string, surfaceSlug: string) => void;
}

// Map blocked reasons to actionable items
const REASON_ACTIONS: Record<string, { icon: typeof Shield; route: string; label: string }> = {
  "KYC verification required": { icon: Shield, route: "/kyc", label: "Complete KYC" },
  "Active subscription required for additional surfaces": { icon: CreditCard, route: "/billing", label: "Upgrade Plan" },
  "User must be owner or admin to publish": { icon: Shield, route: "/dashboard", label: "Contact Owner" },
};

export function PublishModal({
  open,
  onOpenChange,
  surfaceId,
  surfaceTitle,
  orgId,
  currentDomainId,
  onPublishSuccess,
}: PublishModalProps) {
  const navigate = useNavigate();
  const { domainId: activeDomainId } = useDomain();
  
  const {
    domains,
    domainsLoading,
    selectedDomainId,
    selectDomain,
    eligibility,
    isCheckingEligibility,
    publish,
    isPublishing,
    publishResult,
    canPublish,
    reset,
  } = usePublishFlow(surfaceId, orgId);

  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  // Auto-select domain on open
  useEffect(() => {
    if (open && domains.length > 0 && !selectedDomainId) {
      // Priority: current surface domain > active domain context > first domain
      const defaultDomain = 
        domains.find((d) => d.id === currentDomainId) ||
        domains.find((d) => d.id === activeDomainId) ||
        domains[0];
      
      if (defaultDomain) {
        selectDomain(defaultDomain.id);
      }
    }
  }, [open, domains, selectedDomainId, currentDomainId, activeDomainId, selectDomain]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      reset();
      setPublishSuccess(false);
      setPublishedUrl(null);
    }
  }, [open, reset]);

  // Handle publish
  const handlePublish = async () => {
    try {
      const result = await publish();
      
      if (result.success) {
        const selectedDomain = domains.find((d) => d.id === selectedDomainId);
        if (selectedDomain) {
          setPublishedUrl(`https://${selectedDomain.host}`);
          onPublishSuccess?.(selectedDomain.host, surfaceTitle);
        }
        setPublishSuccess(true);
      }
    } catch (err) {
      console.error("Publish failed:", err);
    }
  };

  // Handle domain selection
  const handleDomainSelect = (domain: OrgDomain) => {
    selectDomain(domain.id);
  };

  // Get selected domain details
  const selectedDomain = domains.find((d) => d.id === selectedDomainId);

  // Success state
  if (publishSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-2xl mb-2">Published! 🎉</DialogTitle>
            <DialogDescription className="mb-6">
              Your surface is now live and accessible to everyone.
            </DialogDescription>
            
            {publishedUrl && (
              <Card className="w-full p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-2">Your surface is live at:</p>
                <div className="flex items-center justify-center gap-2">
                  <Globe className="h-4 w-4 text-accent" />
                  <a 
                    href={publishedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent font-medium hover:underline"
                  >
                    {publishedUrl.replace("https://", "")}
                  </a>
                </div>
              </Card>
            )}
            
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {publishedUrl && (
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => window.open(publishedUrl, "_blank")}
                >
                  View Live
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
          {/* Domain Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Domain</label>
            
            {domainsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : domains.length === 0 ? (
              <Card className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No domains available for this organization.
                </p>
              </Card>
            ) : (
              <div className="grid gap-2">
                {domains.map((domain) => (
                  <button
                    key={domain.id}
                    onClick={() => handleDomainSelect(domain)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedDomainId === domain.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      selectedDomainId === domain.id ? "bg-accent/10" : "bg-muted"
                    }`}>
                      <Globe className={`h-4 w-4 ${
                        selectedDomainId === domain.id ? "text-accent" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{domain.host}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {domain.domain_type}
                      </p>
                    </div>
                    {selectedDomainId === domain.id && (
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Eligibility Status */}
          {selectedDomainId && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Eligibility Check</label>
              
              {isCheckingEligibility ? (
                <Card className="p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Checking eligibility...
                  </span>
                </Card>
              ) : eligibility ? (
                <Card className={`p-4 ${
                  eligibility.eligible 
                    ? "border-success/50 bg-success/5" 
                    : "border-warning/50 bg-warning/5"
                }`}>
                  <div className="flex items-start gap-3">
                    {eligibility.eligible ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${
                        eligibility.eligible ? "text-success" : "text-warning"
                      }`}>
                        {eligibility.eligible 
                          ? "Ready to publish!" 
                          : "Cannot publish yet"}
                      </p>
                      
                      {!eligibility.eligible && eligibility.reasons.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {eligibility.reasons.map((reason, idx) => {
                            const action = REASON_ACTIONS[reason];
                            return (
                              <div 
                                key={idx}
                                className="flex items-center justify-between gap-2 text-sm"
                              >
                                <span className="text-muted-foreground">{reason}</span>
                                {action && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 gap-1"
                                    onClick={() => {
                                      onOpenChange(false);
                                      navigate(action.route);
                                    }}
                                  >
                                    {action.label}
                                    <ArrowRight className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          )}

          {/* Publish Result Error */}
          {publishResult && !publishResult.success && (
            <Card className="p-4 border-destructive/50 bg-destructive/5">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Publish blocked</p>
                  {publishResult.reasons && publishResult.reasons.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {publishResult.reasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
            onClick={handlePublish}
            disabled={!selectedDomainId || !canPublish || isPublishing}
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
