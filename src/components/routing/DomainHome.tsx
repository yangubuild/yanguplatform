import { Globe } from "lucide-react";

interface DomainHomeProps {
  domainType?: string;
  host?: string;
}

/**
 * Placeholder component for platform home pages
 * Shows when visiting a platform domain root without a primary surface
 */
export function DomainHome({ domainType, host }: DomainHomeProps) {
  const platformLabels: Record<string, string> = {
    io: "Identity Hub",
    shop: "Shop",
    store: "Store",
    site: "Site",
    studio: "Studio",
    live: "Live",
    community: "Community",
  };

  const label = domainType ? platformLabels[domainType] || domainType : "Home";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Globe className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl font-bold">yangu {label}</h1>
        {host && (
          <p className="text-muted-foreground">
            Serving from <code className="bg-muted px-2 py-1 rounded">{host}</code>
          </p>
        )}
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This platform domain is active. Configure a primary surface to display content here.
        </p>
      </div>
    </div>
  );
}
