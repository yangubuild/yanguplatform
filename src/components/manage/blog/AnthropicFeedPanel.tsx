import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { useAnthropicPublications } from "@/hooks/useAnthropicPublications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AnthropicFeedPanel() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const { data: publications, refetch } = useAnthropicPublications(10);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-anthropic-research");
      if (error) throw error;
      setLastSync(new Date().toLocaleString());
      toast.success(`Synced: ${data?.new_inserted ?? 0} new, ${data?.already_existing ?? 0} existing`);
      refetch();
    } catch (err) {
      toast.error("Sync failed: " + String(err));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Anthropic AI Research Publication (Auto-feed)</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lastSync ? `Last sync: ${lastSync}` : "Not synced yet"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync now"}
        </Button>
      </div>

      {publications && publications.length> 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {publications.map((pub) => (
            <div key={pub.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50 last:border-0">
              <span className="flex-1 truncate font-medium">{pub.title}</span>
              <span className="text-muted-foreground shrink-0">
                {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : "—"}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">{pub.image_source}</span>
              <a href={pub.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
