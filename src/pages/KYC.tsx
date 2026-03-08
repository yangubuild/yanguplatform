import { useEffect, useMemo, useState, type ReactNode } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type KycDbStatus = "pending" | "submitted" | "approved" | "rejected" | null;
type KycUiStatus = "not_started" | "pending" | "verified" | "rejected";

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

function mapToUiStatus(status: KycDbStatus): KycUiStatus {
  if (!status) return "not_started";
  if (status === "approved") return "verified";
  if (status === "rejected") return "rejected";
  return "pending";
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
      // Try to extract the real error message from the response body
      const body = data as DiditResponse | null;
      if (body?.error) throw new Error(body.error);
      throw error;
    }
    const response = (data ?? {}) as DiditResponse;
    if (response.error) throw new Error(response.error);
    return response;
  };

  const syncStatus = async (opts?: { verificationSessionId?: string; statusHint?: string }) => {
    if (!user) return;

    setIsSyncing(true);
    try {
      await invokeDidit("sync_status", opts);
      await fetchKycStatus();
    } catch (err) {
      console.error("Error syncing KYC status:", err);
      toast({
        title: "Status sync failed",
        description: err instanceof Error ? err.message : "Could not sync verification status.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user || (!callbackSessionId && !callbackStatus)) return;

    syncStatus({
      verificationSessionId: callbackSessionId ?? undefined,
      statusHint: callbackStatus ?? undefined,
    }).finally(() => {
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

  const uiStatus = useMemo(() => mapToUiStatus(kyc?.status ?? null), [kyc?.status]);
  const verificationUrl = useMemo(() => getDiditUrl(kyc?.metadata ?? null), [kyc?.metadata]);

  const statusConfig: Record<KycUiStatus, { label: string; description: string; badgeVariant: "default" | "secondary" | "destructive"; icon: ReactNode }> = {
    not_started: {
      label: "Not started",
      description: "Complete KYC verification before publishing.",
      badgeVariant: "secondary",
      icon: <Shield className="h-5 w-5 text-muted-foreground" />,
    },
    pending: {
      label: "Pending",
      description: "Your verification is in progress. Publishing stays locked until approval.",
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

  const ctaLabel =
    uiStatus === "verified"
      ? "Verified"
      : uiStatus === "pending"
      ? verificationUrl
        ? "Continue KYC"
        : "Start KYC"
      : uiStatus === "rejected"
      ? "Retry KYC"
      : "Start KYC";

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

            <div className="mb-8 space-y-3 p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="text-sm font-medium">What you&apos;ll need</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Government-issued ID</li>
                <li>• Proof of address</li>
                <li>• A few minutes to complete verification</li>
              </ul>
            </div>

            <div className="grid gap-3">
              {uiStatus !== "verified" && (
                <Button onClick={handleStartOrContinue} disabled={isStarting || isSyncing}>
                  {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {ctaLabel}
                  {verificationUrl ? <ExternalLink className="h-4 w-4 ml-2" /> : null}
                </Button>
              )}

              {uiStatus === "pending" && (
                <Button variant="outline" onClick={() => syncStatus()} disabled={isSyncing || isStarting}>
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Refresh verification status
                </Button>
              )}

              {uiStatus === "verified" && (
                <Button disabled>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verified
                </Button>
              )}

              <SecondaryButton onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </SecondaryButton>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
