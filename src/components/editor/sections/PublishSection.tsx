import { Card } from "@/components/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2, AlertCircle, Clock, Shield, CreditCard } from "lucide-react";

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
}

export function PublishSection({ surface }: PublishSectionProps) {
  const isPublished = surface.is_published;

  // Placeholder requirements - these will be checked via API later
  const requirements: Array<{
    id: string;
    label: string;
    description: string;
    status: "pending" | "completed";
    icon: typeof Shield;
  }> = [
    {
      id: "kyc",
      label: "Identity Verification (KYC)",
      description: "Complete identity verification to publish surfaces",
      status: "pending",
      icon: Shield,
    },
    {
      id: "trial",
      label: "Trial or Subscription",
      description: "Your first surface is free. Additional surfaces require a subscription.",
      status: "pending",
      icon: CreditCard,
    },
  ];

  const allRequirementsMet = false; // Placeholder

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
                ? `Accessible at ${surface.domain.domain}/${surface.slug}`
                : "Only you can view this surface. Publish to make it public."}
            </p>
          </div>
        </div>
      </Card>

      {/* Publishing Requirements */}
      {!isPublished && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Publishing Requirements</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Complete the following requirements to publish your surface:
          </p>

          <div className="space-y-4">
            {requirements.map((req) => (
              <div key={req.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                <div className={`p-2 rounded-full ${
                  req.status === "completed" ? "bg-success/10" : "bg-warning/10"
                }`}>
                  <req.icon className={`h-4 w-4 ${
                    req.status === "completed" ? "text-success" : "text-warning"
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{req.label}</span>
                    <Badge variant={req.status === "completed" ? "default" : "outline"} className="text-xs">
                      {req.status === "completed" ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
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
              {isPublished ? "Manage Publication" : "Ready to Publish?"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isPublished
                ? "Your surface is currently live and accessible."
                : "Once published, your surface will be visible to everyone."}
            </p>
          </div>
          <Button
            size="lg"
            disabled={!allRequirementsMet || isPublished}
            className="gap-2"
          >
            <Rocket className="h-4 w-4" />
            {isPublished ? "Published" : "Publish Surface"}
          </Button>
        </div>

        {!allRequirementsMet && !isPublished && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Complete all requirements above to enable publishing.</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
