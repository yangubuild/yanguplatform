// Domain Inactive page
// Shows when a domain is not active

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/primitives";

export function DomainInactive() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Domain Inactive</h1>
        <p className="text-muted-foreground mb-6">
          This domain is currently not active. Please contact the administrator
          or visit the main platform.
        </p>
        <Button asChild>
          <a href="https://yangu.io">Go to YANGU</a>
        </Button>
      </Card>
    </div>
  );
}
