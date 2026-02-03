import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/useRoles";
import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  Shield, 
  CreditCard,
  ArrowRight,
  Loader2,
  ExternalLink
} from "lucide-react";

interface SurfaceData {
  id: string;
  title: string;
  is_published: boolean;
  domain: {
    domain: string;
    label: string;
  };
  slug: string;
}

interface PublishSectionProps {
  surface: SurfaceData;
  userId: string;
  onSurfaceUpdate?: (updates: Partial<SurfaceData>) => void;
}

interface EligibilityStatus {
  hasApprovedKyc: boolean;
  hasUsedTrial: boolean;
  publishedCount: number;
  canPublish: boolean;
}

export function PublishSection({ surface, userId, onSurfaceUpdate }: PublishSectionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOwner, isLoading: rolesLoading } = useRoles();
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const isPublished = surface.is_published;
  const publicUrl = `${surface.domain.domain}/${surface.slug}`;

  // Fetch eligibility status from database
  useEffect(() => {
    async function fetchEligibility() {
      try {
        // Run all eligibility checks in parallel
        const [kycResult, trialResult, countResult] = await Promise.all([
          supabase.rpc("has_approved_kyc", { _user_id: userId }),
          supabase.rpc("has_used_trial", { _user_id: userId }),
          supabase.rpc("count_published_surfaces", { _user_id: userId }),
        ]);

        const hasApprovedKyc = kycResult.data ?? false;
        const hasUsedTrial = trialResult.data ?? false;
        const publishedCount = countResult.data ?? 0;

        // Determine if user can publish:
        // - If KYC approved, can always publish
        // - If first surface (publishedCount === 0) and trial not used, can publish (free trial)
        const canPublish = hasApprovedKyc || (publishedCount === 0 && !hasUsedTrial);

        setEligibility({
          hasApprovedKyc,
          hasUsedTrial,
          publishedCount,
          canPublish,
        });
      } catch (err) {
        console.error("Error fetching eligibility:", err);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchEligibility();
    }
  }, [userId]);

  // Publish handler with eligibility guard
  const handlePublish = async () => {
    const canPublish = eligibility?.canPublish ?? false;

    // Guard: only owner/admin can publish
    if (!isOwner) {
      toast({
        title: "Permission denied",
        description: "Only owners can publish surfaces.",
        variant: "destructive",
      });
      return;
    }

    // Guard: prevent publishing if not eligible
    if (!canPublish) {
      toast({
        title: "Cannot publish",
        description: "Complete KYC and Subscription to publish.",
        variant: "destructive",
      });
      return;
    }

    // Guard: prevent publishing if already published
    if (isPublished) {
      toast({
        title: "Already published",
        description: "This surface is already live.",
      });
      return;
    }

    setIsPublishing(true);

    try {
      // If user hasn't used trial and has no KYC, create a trial record first
      const needsTrial = !eligibility?.hasApprovedKyc && !eligibility?.hasUsedTrial;
      
      if (needsTrial) {
        // Create trial record (30 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        
        const { error: trialError } = await supabase
          .from("trials")
          .insert({
            user_id: userId,
            surface_id: surface.id,
            expires_at: expiresAt.toISOString(),
          });

        if (trialError) {
          console.error("Trial creation error:", trialError);
          toast({
            title: "Failed to activate trial",
            description: trialError.message,
            variant: "destructive",
          });
          setIsPublishing(false);
          return;
        }
      }

      // Update surface to published
      const { error: publishError } = await supabase
        .from("public_surfaces")
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq("id", surface.id);

      if (publishError) {
        console.error("Publish error:", publishError);
        toast({
          title: "Publish failed",
          description: publishError.message,
          variant: "destructive",
        });
        return;
      }

      // Update local state
      onSurfaceUpdate?.({ is_published: true });

      toast({
        title: "Surface published! 🎉",
        description: `Your surface is now live at ${publicUrl}`,
      });

      // Refetch eligibility to update trial status
      setEligibility((prev) => prev ? {
        ...prev,
        hasUsedTrial: needsTrial ? true : prev.hasUsedTrial,
        publishedCount: prev.publishedCount + 1,
      } : null);

    } catch (err) {
      console.error("Error publishing:", err);
      toast({
        title: "Publish failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Loading state
  if (isLoading || rolesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Publish</h2>
          <p className="text-muted-foreground">Make your surface live and accessible to everyone</p>
        </div>
        <Card className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      </div>
    );
  }

  // Build requirements list with real status
  const requirements: Array<{
    id: string;
    label: string;
    description: string;
    status: "pending" | "completed";
    icon: typeof Shield;
    ctaLabel?: string;
    ctaRoute?: string;
  }> = [];

  // KYC requirement
  requirements.push({
    id: "kyc",
    label: "Identity Verification (KYC)",
    description: eligibility?.hasApprovedKyc
      ? "Your identity has been verified"
      : "Complete identity verification to publish surfaces",
    status: eligibility?.hasApprovedKyc ? "completed" : "pending",
    icon: Shield,
    ctaLabel: eligibility?.hasApprovedKyc ? undefined : "Start KYC",
    ctaRoute: eligibility?.hasApprovedKyc ? undefined : "/kyc",
  });

  // Trial/Subscription requirement
  // User can publish if: KYC approved OR (first surface AND trial not used)
  const hasTrialAvailable = eligibility?.publishedCount === 0 && !eligibility?.hasUsedTrial;
  const hasActiveSubscription = eligibility?.hasApprovedKyc; // For now, KYC approval implies full access

  let trialStatus: "pending" | "completed" = "pending";
  let trialDescription = "";
  let trialCtaLabel: string | undefined;
  let trialCtaRoute: string | undefined;

  if (hasActiveSubscription) {
    trialStatus = "completed";
    trialDescription = "You have full publishing access";
  } else if (hasTrialAvailable) {
    trialStatus = "completed";
    trialDescription = "Your first surface is free! You can publish this one without payment.";
  } else {
    trialStatus = "pending";
    trialDescription = "You've used your free trial. Subscribe to publish more surfaces.";
    trialCtaLabel = "Start Trial / Subscribe";
    trialCtaRoute = "/billing";
  }

  requirements.push({
    id: "trial",
    label: "Trial or Subscription",
    description: trialDescription,
    status: trialStatus,
    icon: CreditCard,
    ctaLabel: trialCtaLabel,
    ctaRoute: trialCtaRoute,
  });

  const canPublish = eligibility?.canPublish ?? false;

  // Determine what's blocking publishing
  const blockers: string[] = [];
  if (!eligibility?.hasApprovedKyc && !hasTrialAvailable) {
    if (!eligibility?.hasApprovedKyc) {
      blockers.push("Complete identity verification (KYC)");
    }
    if (eligibility?.hasUsedTrial && eligibility?.publishedCount > 0) {
      blockers.push("Subscribe to publish additional surfaces");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Publish</h2>
        <p className="text-muted-foreground">Make your surface live and accessible to everyone</p>
      </div>

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
            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={() => window.open(`https://${publicUrl}`, "_blank")}
              >
                <ExternalLink className="h-3 w-3" />
                View Live
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Publishing Requirements */}
      {!isPublished && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Publishing Requirements</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {canPublish 
              ? "You're ready to publish! Click the button below to make your surface live."
              : "Complete the following requirements to publish your surface:"}
          </p>

          <div className="space-y-4">
            {requirements.map((req) => (
              <div 
                key={req.id} 
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  req.status === "completed" 
                    ? "border-success/20 bg-success/5" 
                    : "border-border bg-muted/30"
                }`}
              >
                <div className={`p-2 rounded-full ${
                  req.status === "completed" ? "bg-success/10" : "bg-warning/10"
                }`}>
                  <req.icon className={`h-4 w-4 ${
                    req.status === "completed" ? "text-success" : "text-warning"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{req.label}</span>
                    <Badge 
                      variant={req.status === "completed" ? "default" : "outline"} 
                      className={`text-xs ${req.status === "completed" ? "bg-success text-success-foreground" : ""}`}
                    >
                      {req.status === "completed" ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                  
                  {/* CTA Button for pending requirements */}
                  {req.ctaLabel && req.ctaRoute && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate(req.ctaRoute!)}
                    >
                      {req.ctaLabel}
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Publish Action */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              {isPublished ? "Manage Publication" : canPublish ? "Ready to Publish!" : "Cannot Publish Yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isPublished
                ? "Your surface is currently live and accessible."
                : canPublish
                ? "All requirements met. You can now publish your surface."
                : "Complete the requirements above to enable publishing."}
            </p>
          </div>
          <Button
            size="lg"
            disabled={!canPublish || isPublished || isPublishing}
            onClick={handlePublish}
            className="gap-2"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {isPublished ? "Published" : isPublishing ? "Publishing..." : "Publish Surface"}
          </Button>
        </div>

        {/* Show blocking reasons */}
        {!canPublish && !isPublished && blockers.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              To publish, you need to:
            </p>
            <ul className="space-y-1">
              {blockers.map((blocker, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                  {blocker}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
