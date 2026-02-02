import { useNavigate } from "react-router-dom";
import { Card, SecondaryButton } from "@/components/primitives";
import { Shield, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KYC() {
  const navigate = useNavigate();

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
      </Card>
    </div>
  );
}
