/**
 * PaymentsSettingsPage — per-surface payment configuration hub.
 *
 * Lists the seller's surfaces and lets them open either the guided
 * CommerceSetupChat wizard or the advanced CommerceConfigPanel for each one.
 * All writes go to surface_commerce_config (per-surface). The legacy
 * creator_payment_profiles path is intentionally retired here.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles, Settings2, Store } from "lucide-react";
import { CommerceSetupChat } from "@/components/commerce/CommerceSetupChat";
import { CommerceConfigPanel } from "@/components/commerce/CommerceConfigPanel";

interface SurfaceRow {
  id: string;
  user_id: string;
  title: string | null;
  surface_type: string;
  slug: string | null;
  hasConfig: boolean;
}

type OpenMode = { surface: SurfaceRow; mode: "chat" | "advanced" } | null;

export default function PaymentsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [surfaces, setSurfaces] = useState<SurfaceRow[]>([]);
  const [open, setOpen] = useState<OpenMode>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: rows, error } = await supabase
      .from("builder_surfaces")
      .select("id, user_id, title, surface_type, slug")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[PaymentsSettingsPage] load surfaces error:", error.message);
      setLoading(false);
      return;
    }

    const ids = (rows || []).map((r) => r.id);
    let configured = new Set<string>();
    if (ids.length > 0) {
      const { data: cfg } = await supabase
        .from("surface_commerce_config")
        .select("surface_id, payment_methods")
        .in("surface_id", ids);
      configured = new Set(
        (cfg || [])
          .filter((c: any) => Array.isArray(c.payment_methods) && c.payment_methods.length > 0)
          .map((c: any) => c.surface_id as string),
      );
    }

    setSurfaces(
      (rows || []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        surface_type: r.surface_type,
        slug: r.slug,
        hasConfig: configured.has(r.id),
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-5 min-h-screen bg-background pb-24">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Payments & commerce</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Each site has its own payment setup. Pick a site to configure how customers pay you and reach you.
        </p>
      </div>

      {surfaces.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <Store className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            You haven't built any sites yet. Create one from the dashboard to set up payments.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {surfaces.map((s) => (
            <Card key={s.id} className="p-4 rounded-lg">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {s.title || "Untitled site"}
                    </p>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {s.surface_type}
                    </span>
                    {s.hasConfig ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        Configured
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        Not set up
                      </span>
                    )}
                  </div>
                  {s.slug && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">/{s.slug}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="accent"
                    className="gap-1.5 rounded-lg"
                    onClick={() => setOpen({ surface: s, mode: "chat" })}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {s.hasConfig ? "Update with Ada" : "Set up with Ada"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 rounded-lg"
                    onClick={() => setOpen({ surface: s, mode: "advanced" })}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Advanced
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ada chat wizard */}
      {open?.mode === "chat" && (
        <CommerceSetupChat
          open={true}
          onClose={() => { setOpen(null); load(); }}
          surfaceId={open.surface.id}
          ownerId={open.surface.user_id}
        />
      )}

      {/* Advanced panel in a dialog */}
      {open?.mode === "advanced" && userId && (
        <Dialog open={true} onOpenChange={(v) => { if (!v) { setOpen(null); load(); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <DialogHeader>
              <DialogTitle>{open.surface.title || "Untitled site"} — Commerce settings</DialogTitle>
            </DialogHeader>
            <CommerceConfigPanel
              surfaceId={open.surface.id}
              ownerId={open.surface.user_id}
              onClose={() => { setOpen(null); load(); }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
