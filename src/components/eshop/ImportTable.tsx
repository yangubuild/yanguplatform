import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportRow {
  id: string;
  title: string;
  provider_key: string;
  provider_currency: string | null;
  provider_price_cents: number | null;
  display_currency: string | null;
  display_price_cents: number | null;
  sync_status: string;
  last_synced_at: string | null;
  created_at: string;
}

interface Props {
  formatPrice: (cents: number | undefined, currency: string | undefined) => string;
}

export default function ImportTable({ formatPrice }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dropship_imports")
      .select("id, title, provider_key, provider_currency, provider_price_cents, display_currency, display_price_cents, sync_status, last_synced_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as ImportRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const timeAgo = (ts: string | null) => {
    if (!ts) return "—";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">No imports yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Search and import products from the Products tab</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">{rows.length} imports</p>
        <Button size="sm" variant="ghost" onClick={load} className="text-xs gap-1 text-muted-foreground">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="text-left px-3 py-2 font-medium">Product</th>
              <th className="text-left px-3 py-2 font-medium">Provider</th>
              <th className="text-right px-3 py-2 font-medium">Cost</th>
              <th className="text-right px-3 py-2 font-medium">Display Price</th>
              <th className="text-left px-3 py-2 font-medium">Synced</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/40 hover:bg-muted/20">
                <td className="px-3 py-2 text-foreground max-w-[200px] truncate">{r.title}</td>
                <td className="px-3 py-2 text-muted-foreground capitalize">{r.provider_key}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {formatPrice(r.provider_price_cents ?? undefined, r.provider_currency ?? undefined)}
                </td>
                <td className="px-3 py-2 text-right text-accent font-medium">
                  {formatPrice(r.display_price_cents ?? undefined, r.display_currency ?? undefined)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{timeAgo(r.last_synced_at)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    r.sync_status === "synced" ? "bg-success/10 text-success" :
                    r.sync_status === "pending" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {r.sync_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
