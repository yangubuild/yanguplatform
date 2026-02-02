import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, SecondaryButton } from "@/components/primitives";
import { CreditCard, ArrowLeft, Clock, Check, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Billing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function checkAdminAndTrialStatus() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is admin
        const { data: adminData } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        setIsAdmin(adminData ?? false);

        // Check current trial status
        const { data: trialData } = await supabase.rpc("has_used_trial", {
          _user_id: user.id,
        });
        setHasUsedTrial(trialData ?? false);
      } catch (err) {
        console.error("Error checking status:", err);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminAndTrialStatus();
  }, [user]);

  const handleActivateTrial = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Create a trial record (expires in 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error } = await supabase
        .from("trials")
        .insert({
          user_id: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      setHasUsedTrial(true);
      toast({
        title: "Trial Activated",
        description: "Your trial has been activated for testing (30 days).",
      });
    } catch (err) {
      console.error("Error activating trial:", err);
      toast({
        title: "Error",
        description: "Failed to activate trial. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Subscription & Billing</h1>
          <p className="text-muted-foreground">
            Unlock unlimited publishing with a subscription
          </p>
        </div>

        {/* Current Status */}
        {!isLoading && (
          <div className={`mb-6 p-4 rounded-lg border ${
            hasUsedTrial 
              ? "bg-success/10 border-success/20" 
              : "bg-muted/30 border-border"
          }`}>
            <div className="flex items-center gap-2">
              {hasUsedTrial ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">Trial Status:</span>
              <Badge variant={hasUsedTrial ? "default" : "secondary"}>
                {hasUsedTrial ? "Trial Used" : "Trial Available"}
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
                Our billing system is currently under development. 
                Subscription plans will be available here once ready.
              </p>
            </div>
          </div>

          {/* Placeholder pricing cards */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-lg mb-2">Free Trial</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  1 published surface
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Basic analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Standard support
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </div>

            <div className="p-6 rounded-lg border-2 border-primary bg-card relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="font-semibold text-lg mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">
                $9<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Unlimited surfaces
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  Custom domains
                </li>
              </ul>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <SecondaryButton onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </SecondaryButton>
        </div>

        {/* Admin Dev Button */}
        {isAdmin && !isLoading && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-xs text-warning mb-3 font-medium">
                ⚠️ Admin Only - Development Testing
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleActivateTrial}
                disabled={isUpdating || hasUsedTrial}
                className="w-full"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : hasUsedTrial ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : null}
                {hasUsedTrial ? "Trial Already Used" : "Activate Trial (dev only)"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
