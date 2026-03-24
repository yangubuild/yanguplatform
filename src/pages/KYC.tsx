import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, SecondaryButton } from "@/components/primitives";
import {
  Shield,
  ArrowLeft,
  Clock3,
  CheckCircle2,
  Loader2,
  XCircle,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import kycGuideImg from "@/assets/kyc-guide.png";

const checklistItems = [
  "I have my ID ready and clearly visible",
  "I am in a well-lit environment",
  "My camera is clean and working",
];

type KycDbStatus = "pending" | "submitted" | "approved" | "rejected" | null;
type KycUiStatus = "not_started" | "in_progress" | "pending_review" | "verified" | "rejected";

interface KycRecord {
  status: KycDbStatus;
  metadata: Record<string, unknown> | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

interface DiditResponse {
  verification_url?: string;
  mapped_status?: string;
  error?: string;
}

function isStaleSession(record: KycRecord): boolean {
  // If metadata has a verification URL and submitted_at is older than 48 hours, consider it stale
  if (!record.submitted_at) return false;
  const submittedAt = new Date(record.submitted_at).getTime();
  const hoursSinceSubmit = (Date.now() - submittedAt) / (1000 * 60 * 60);
  return hoursSinceSubmit > 48;
}

function mapToUiStatus(record: KycRecord | null): KycUiStatus {
  if (!record || !record.status) return "not_started";
  if (record.status === "approved") return "verified";
  if (record.status === "rejected") return "rejected";

  // Distinguish between "has a verification URL to continue" vs "submitted and awaiting review"
  const hasVerificationUrl =
    record.metadata &&
    typeof record.metadata["didit_verification_url"] === "string" &&
    record.metadata["didit_verification_url"].length > 0;

  const lastProviderStatus =
    record.metadata && typeof record.metadata["didit_last_status"] === "string"
      ? (record.metadata["didit_last_status"] as string).toLowerCase()
      : null;

  // If provider says "Approved" / "Completed" but DB hasn't caught up yet
  if (lastProviderStatus && ["approved", "verified", "completed"].includes(lastProviderStatus)) {
    return "verified";
  }

  // If session is stale (submitted > 48h ago, no resolution), let user restart
  if (isStaleSession(record)) {
    return "not_started";
  }

  // Provider says "In Review" — pending review
  if (lastProviderStatus && ["in review", "in_review", "processing"].includes(lastProviderStatus)) {
    return "pending_review";
  }

  // If the user has submitted to the provider (no active URL or status indicates submission)
  if (record.status === "submitted" || (record.status === "pending" && !hasVerificationUrl)) {
    return "pending_review";
  }

  // Has a URL to continue — still in progress
  return "in_progress";
}

function getDiditUrl(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const url = metadata["didit_verification_url"];
  return typeof url === "string" && url.length > 0 ? url : null;
}

export default function KYC() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>([false, false, false]);
  const hasSyncedCallback = useRef(false);

  const callbackSessionId = searchParams.get("verificationSessionId");
  const callbackStatus = searchParams.get("status");

  const fetchKycStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("status, metadata, rejection_reason, submitted_at, reviewed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      setKyc(
        data
          ? {
              status: data.status,
              metadata: (data.metadata as Record<string, unknown> | null) ?? null,
              rejection_reason: data.rejection_reason,
              submitted_at: data.submitted_at,
              reviewed_at: data.reviewed_at,
            }
          : null
      );
    } catch (err) {
      console.error("Error loading KYC status:", err);
      toast({
        title: "Unable to load KYC",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchKycStatus();
  }, [user?.id]);

  const invokeDidit = async (action: "start_or_continue" | "sync_status", payload?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("kyc-didit-session", {
      body: { action, ...(payload ?? {}) },
    });

    if (error) {
      let backendMessage: string | null = null;
      const body = data as DiditResponse | null;

      if (body?.error) {
        backendMessage = body.error;
      }

      const errorWithContext = error as { context?: Response; message?: string };
      if (!backendMessage && errorWithContext.context) {
        try {
          const cloned = errorWithContext.context.clone();
          const contextJson = (await cloned.json()) as DiditResponse;
          if (typeof contextJson?.error === "string" && contextJson.error.length > 0) {
            backendMessage = contextJson.error;
          }
        } catch {
          try {
            const contextText = await errorWithContext.context.clone().text();
            if (contextText) backendMessage = contextText;
          } catch {
            // ignore secondary parse errors
          }
        }
      }

      throw new Error(backendMessage ?? error.message ?? "Could not start verification.");
    }

    const response = (data ?? {}) as DiditResponse;
    if (response.error) throw new Error(response.error);
    return response;
  };

  const syncStatus = async (opts?: { verificationSessionId?: string; statusHint?: string }) => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const result = await invokeDidit("sync_status", opts);
      await fetchKycStatus();

      // If the sync resolved to approved, show success toast
      if (result.mapped_status === "approved") {
        toast({
          title: "Verification complete!",
          description: "Your identity has been verified. You can now publish.",
        });
      }
    } catch (err) {
      console.error("Error syncing KYC status:", err);
      toast({
        title: "Status not available yet",
        description: "Verification may still be processing. Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle callback from provider — only once
  useEffect(() => {
    if (!user || (!callbackSessionId && !callbackStatus) || hasSyncedCallback.current) return;
    hasSyncedCallback.current = true;

    syncStatus({
      verificationSessionId: callbackSessionId ?? undefined,
      statusHint: callbackStatus ?? undefined,
    }).finally(() => {
      // Strip callback params from URL
      navigate("/kyc", { replace: true });
    });
  }, [user?.id, callbackSessionId, callbackStatus]);

  const handleStartOrContinue = async () => {
    if (!user) return;

    setIsStarting(true);
    try {
      const response = await invokeDidit("start_or_continue");
      await fetchKycStatus();

      if (response.verification_url) {
        window.location.assign(response.verification_url);
        return;
      }

      toast({
        title: "KYC already verified",
        description: "Your account is already verified for publishing.",
      });
    } catch (err) {
      console.error("Error starting KYC:", err);
      toast({
        title: "Could not start KYC",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const uiStatus = useMemo(() => mapToUiStatus(kyc), [kyc]);
  const verificationUrl = useMemo(() => getDiditUrl(kyc?.metadata ?? null), [kyc?.metadata]);

  const statusConfig: Record<KycUiStatus, { label: string; description: string; badgeVariant: "default" | "secondary" | "destructive"; icon: ReactNode }> = {
    not_started: {
      label: "Not started",
      description: "Complete KYC verification before publishing.",
      badgeVariant: "secondary",
      icon: <Shield className="h-5 w-5 text-muted-foreground" />,
    },
    in_progress: {
      label: "In Progress",
      description: "You've started verification. Continue where you left off.",
      badgeVariant: "secondary",
      icon: <Clock3 className="h-5 w-5 text-accent" />,
    },
    pending_review: {
      label: "Pending Review",
      description: "Your verification has been submitted and is under review. This can take 1–24 hours depending on the provider. This is not a rejection — please wait for the result before retrying.",
      badgeVariant: "secondary",
      icon: <Clock3 className="h-5 w-5 text-muted-foreground" />,
    },
    verified: {
      label: "Verified",
      description: "Your identity is verified. You can publish now.",
      badgeVariant: "default",
      icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
    },
    rejected: {
      label: "Rejected",
      description: "Your previous verification was rejected. Submit again to continue.",
      badgeVariant: "destructive",
      icon: <XCircle className="h-5 w-5 text-destructive" />,
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-xl w-full p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Identity Verification</h1>
          <p className="text-muted-foreground">Verify your identity to unlock publishing.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                {statusConfig[uiStatus].icon}
                <span className="font-medium">Current status</span>
                <Badge variant={statusConfig[uiStatus].badgeVariant}>{statusConfig[uiStatus].label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{statusConfig[uiStatus].description}</p>
              {uiStatus === "rejected" && kyc?.rejection_reason ? (
                <div className="mt-3 flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{kyc.rejection_reason}</span>
                </div>
              ) : null}
            </div>

            {uiStatus !== "verified" && (
              <div className="mb-8 space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                <h3 className="text-sm font-medium">What you&apos;ll need</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Government-issued ID</li>
                  <li>• Proof of address</li>
                  <li>• A few minutes to complete verification</li>
                </ul>
              </div>
            )}

            <div className="grid gap-3">
              {/* Primary CTA based on state */}
              {uiStatus === "not_started" && (
                <Button onClick={() => setShowGuidance(true)} disabled={isStarting}>
                  {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Start KYC
                </Button>
              )}

              {uiStatus === "in_progress" && (
                <Button onClick={handleStartOrContinue} disabled={isStarting}>
                  {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Continue KYC
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              )}

              {uiStatus === "pending_review" && (
                <Button variant="outline" onClick={() => syncStatus()} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Refresh verification status
                </Button>
              )}

              {uiStatus === "rejected" && (
                <Button onClick={() => setShowGuidance(true)} disabled={isStarting}>
                  {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Retry KYC
                </Button>
              )}

              {uiStatus === "verified" && (
                <Button disabled>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verified
                </Button>
              )}

              {/* Secondary: Refresh for in_progress too */}
              {uiStatus === "in_progress" && (
                <Button variant="outline" onClick={() => syncStatus()} disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Refresh verification status
                </Button>
              )}

              {/* Always show back to dashboard */}
              <SecondaryButton onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </SecondaryButton>
            </div>
          </>
        )}
      </Card>

      {/* Pre-start KYC Guidance Modal */}
      <Dialog open={showGuidance} onOpenChange={setShowGuidance}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold text-center">Get ready for verification</DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground -mt-1">
            Follow these tips for the fastest approval
          </DialogDescription>

          {/* Visual guide image */}
          <div className="my-3">
            <img
              src={kycGuideImg}
              alt="Left: well-lit clear photo with green check. Right: dark unclear photo with red cross."
              className="w-full rounded-lg"
            />
          </div>

          {/* Interactive checklist */}
          <div className="space-y-2.5 mb-3">
            {checklistItems.map((item, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={checkedItems[i]}
                  onCheckedChange={() =>
                    setCheckedItems((prev) => {
                      const next = [...prev];
                      next[i] = !next[i];
                      return next;
                    })
                  }
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {item}
                </span>
              </label>
            ))}
          </div>

          {/* Subtle hint when nothing checked */}
          {checkedItems.every((v) => !v) && (
            <p className="text-xs text-muted-foreground/70 text-center mb-1">
              For best results, confirm all items above
            </p>
          )}

          {/* Info box */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 mb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              For immediate approval, make sure your photo and ID are clear. Poor lighting or unclear images may result in{" "}
              <span className="font-medium text-foreground">manual review (1–24 hours)</span>.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowGuidance(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={isStarting}
              onClick={() => {
                setShowGuidance(false);
                handleStartOrContinue();
              }}
            >
              {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Start KYC
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
