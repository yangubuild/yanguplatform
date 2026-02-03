// Not Published state
// Shows when no surface is published on the current domain

import { Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/primitives";
import { useDomain } from "@/contexts/DomainContext";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface NotPublishedProps {
  /** Whether the current user can publish to this domain */
  canPublish?: boolean;
}

export function NotPublished({ canPublish = false }: NotPublishedProps) {
  const { routeConfig, domainType } = useDomain();
  const { user } = useAuth();

  const isLoggedIn = !!user;
  const showPublishCTA = canPublish || isLoggedIn;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Globe className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          Nothing Here Yet
        </h1>
        
        <p className="text-muted-foreground mb-6">
          No content has been published to this domain yet.
          {domainType !== "io" && (
            <span className="block mt-2">
              This is a <strong>{routeConfig.label}</strong> domain.
            </span>
          )}
        </p>

        {showPublishCTA ? (
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Create and publish your surface to this domain
            </p>
          </div>
        ) : (
          <Button asChild variant="outline">
            <a href="https://yangu.io">
              Visit YANGU
            </a>
          </Button>
        )}
      </Card>
    </div>
  );
}
