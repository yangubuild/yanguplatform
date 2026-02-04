import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { Card, SecondaryButton } from "@/components/primitives";
import { Shield, ArrowLeft, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function KYC() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOwner, isLoading: rolesLoading } = useRoles();
  const { toast } = useToast();
  
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchKycStatus() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check current KYC status
        const { data: kycData } = await supabase
          .from("kyc_verifications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        setKycStatus(kycData?.status ?? null);
      } catch (err) {
        console.error("Error checking KYC status:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchKycStatus();
  }, [user]);

  const handleApproveKyc = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Check if KYC record exists
      const { data: existingKyc } = await supabase
        .from("kyc_verifications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingKyc) {
        // Update existing record - trigger will sync to org_billing
        const { error } = await supabase
          .from("kyc_verifications")
          .update({ 
            status: "approved",
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new approved record - trigger will sync to org_billing
        const { error } = await supabase
          .from("kyc_verifications")
          .insert({
            user_id: user.id,
            status: "approved",
            submitted_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          });

        if (error) throw error;
      }

      setKycStatus("approved");
      toast({
        title: "KYC Approved",
        description: "Your KYC status has been synced. You can now publish surfaces.",
      });
    } catch (err) {
      console.error("Error approving KYC:", err);
      toast({
        title: "Error",
        description: "Failed to approve KYC. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isApproved = kycStatus === "approved";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Identity Verification</h1>
          <p className="text-muted-foreground">
            Complete KYC to unlock full publishing capabilities
          </p>
        </div>

        {/* Current Status */}
        {!isLoading && kycStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isApproved 
              ? "bg-success/10 border-success/20" 
              : "bg-muted/30 border-border"
          }`}>
            <div className="flex items-center gap-2">
              {isApproved ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">Current Status:</span>
              <Badge variant={isApproved ? "default" : "secondary"}>
                {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="font-medium">Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                Our identity verification system is currently under development. 
                You'll be able to verify your identity here once it's ready.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <h3 className="font-medium mb-2">What you'll need:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Government-issued ID (passport, driver's license)</li>
              <li>• Proof of address (utility bill, bank statement)</li>
              <li>• A few minutes to complete the process</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <SecondaryButton 
            onClick={() => navigate(-1)} 
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </SecondaryButton>
          <Button disabled className="flex-1">
            Start Verification
          </Button>
        </div>

        {/* Admin/Owner Dev Button */}
        {isOwner && !isLoading && !rolesLoading && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning mb-3 font-medium">
                ⚠️ Owner Only - Development Testing
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApproveKyc}
                disabled={isUpdating || isApproved}
                className="w-full"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isApproved ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : null}
                {isApproved ? "KYC Already Approved" : "Mark KYC Approved (dev only)"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
