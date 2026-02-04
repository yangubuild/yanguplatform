import { User } from "lucide-react";

interface IdentityHubProps {
  username: string;
  host?: string;
  platformKey?: string;
}

/**
 * Placeholder component for identity profile pages
 * Shows when visiting /@username on a platform domain
 */
export function IdentityHub({ username, host, platformKey }: IdentityHubProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <User className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl font-bold">@{username}</h1>
        {host && (
          <p className="text-muted-foreground">
            on <code className="bg-muted px-2 py-1 rounded">{host}</code>
          </p>
        )}
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Identity profile page placeholder. Full profile rendering coming soon.
        </p>
        {platformKey && (
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            {platformKey}
          </span>
        )}
      </div>
    </div>
  );
}
