// Development-only debug panel for domain resolution
// Shows domain_id, surface_id, publish_id for verification

import { usePublicSurfaceDebug } from "@/hooks/usePublicSurface";

const isDev = import.meta.env.DEV;

export function DevDomainDebug() {
  const debug = usePublicSurfaceDebug();

  // Only show in development
  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background/95 backdrop-blur border border-border rounded-lg shadow-lg p-3 text-xs font-mono max-w-xs">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span className="font-semibold text-foreground">Domain Debug</span>
      </div>
      
      <div className="space-y-1 text-muted-foreground">
        <Row label="host" value={debug.host} />
        <Row label="domain_type" value={debug.domainType} />
        <Row label="domain_id" value={debug.domainId} />
        <Row label="surface_id" value={debug.surfaceId} />
        <Row label="publish_id" value={debug.publishId} />
        <Row label="is_active" value={debug.isActive ? "true" : "false"} />
        <Row label="is_fallback" value={debug.isFallback ? "true" : "false"} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground truncate max-w-[150px]" title={value || "null"}>
        {value || <span className="text-muted-foreground/50">null</span>}
      </span>
    </div>
  );
}
