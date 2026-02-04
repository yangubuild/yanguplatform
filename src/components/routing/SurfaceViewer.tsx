import { Layout } from "lucide-react";

interface SurfaceViewerProps {
  surfaceId: string;
  publishId?: string;
  host?: string;
  platformKey?: string;
}

/**
 * Placeholder component for rendering a published surface
 * Will be replaced with full surface rendering logic
 */
export function SurfaceViewer({ surfaceId, publishId, host, platformKey }: SurfaceViewerProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Layout className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">Surface Viewer</h1>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Surface ID: <code className="bg-muted px-2 py-1 rounded">{surfaceId}</code>
          </p>
          {publishId && (
            <p>
              Publish ID: <code className="bg-muted px-2 py-1 rounded">{publishId}</code>
            </p>
          )}
          {host && (
            <p>
              Host: <code className="bg-muted px-2 py-1 rounded">{host}</code>
            </p>
          )}
        </div>
        {platformKey && (
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            {platformKey}
          </span>
        )}
        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-4">
          Full surface rendering coming soon.
        </p>
      </div>
    </div>
  );
}
