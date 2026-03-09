import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ExternalLink, Pencil, ShoppingBag, Store, UtensilsCrossed, Globe, Users, Sparkles, Loader2, Trash2, CheckCircle2, BarChart3, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card } from "@/components/primitives";
import { forceDeleteSurface } from "@/lib/forceDeleteSurface";

const SURFACE_TYPE_META: Record<string, { label: string; icon: typeof ShoppingBag }> = {
  eshop: { label: "Eshop", icon: ShoppingBag },
  estore: { label: "Estore", icon: Store },
  emenu: { label: "Emenu", icon: UtensilsCrossed },
  esite: { label: "Esite", icon: Globe },
  influencer: { label: "Influencer", icon: Sparkles },
  community: { label: "Community", icon: Users },
  live_bio: { label: "Live Bio", icon: Globe },
};

interface Surface {
  id: string;
  title: string;
  slug: string;
  surface_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

const RECOMMENDED_APPS = [
  { name: "Automations", provider: "YANGU", desc: "Send emails and create workflows (replaces Zapier and N8N)" },
  { name: "Email Marketing & Automations", provider: "YANGU", desc: "Email marketing campaigns and automated sequences" },
  { name: "Contracts", provider: "YANGU", desc: "Create contracts, collect signatures and payments, and automate invoices." },
];

export default function MyBusinessPage() {
  const navigate = useNavigate();
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [surfaceRes, publishRes] = await Promise.all([
        supabase
          .from("builder_surfaces")
          .select("id, title, slug, surface_type, description, created_at, updated_at, metadata")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("builder_publishes")
          .select("surface_id")
          .eq("state", "published"),
      ]);

      setSurfaces((surfaceRes.data as Surface[]) ?? []);
      const pubIds = new Set((publishRes.data ?? []).map((p: { surface_id: string }) => p.surface_id));
      setPublishedIds(pubIds);
      setLoading(false);
    })();
  }, []);

  const grouped = surfaces.reduce<Record<string, Surface[]>>((acc, s) => {
    const key = s.surface_type || "other";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (surfaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">My Business</h2>
        <p className="text-sm max-w-xs text-muted-foreground">
          No pages yet. Create your first business page from the Seller menu.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Business</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all your published pages</p>
      </div>

      {Object.entries(grouped).map(([type, items]) => {
        const meta = SURFACE_TYPE_META[type] ?? { label: type, icon: Building2 };
        const Icon = meta.icon;
        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{meta.label}</h2>
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => {
                const isPublished = publishedIds.has(s.id);
                return (
                  <Card key={s.id} className="p-4 flex flex-col gap-3 bg-card border-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">{s.title}</h3>
                        {isPublished && (
                          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] px-1.5 py-0 shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Published
                          </Badge>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(s.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Primary actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5 flex-1 rounded-xl" onClick={() => navigate(`/builder/${s.id}`)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1.5 rounded-xl" onClick={() => window.open(`/s/${s.id}/preview`, "_blank")}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="gap-1.5 text-[#b5622a] hover:text-[#b5622a] hover:bg-[#b5622a]/10 rounded-xl">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{s.title}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {isPublished
                                ? "⚠️ This business page is currently PUBLISHED and live. Deleting it will take it offline immediately and remove all associated data. This action cannot be undone."
                                : "This will permanently delete this business page and all its data. This action cannot be undone."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-[#b5622a] text-white hover:bg-[#b5622a]/90 rounded-xl" onClick={async () => {
                              const { error } = await supabase.from("builder_surfaces").delete().eq("id", s.id);
                              if (error) { toast.error("Failed to delete"); return; }
                              await forceDeleteSurface(s.id);
                              setSurfaces(prev => prev.filter(x => x.id !== s.id));
                              toast.success("Deleted successfully");
                            }}>
                              {isPublished ? "Yes, delete published page" : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Management actions */}
                    <div className="flex gap-2 border-t border-border pt-3">
                      <Button size="sm" variant="ghost" className="flex-1 gap-1.5 text-xs rounded-xl" onClick={() => navigate(`/dashboard/my-business/${s.id}/analytics`)}>
                        <BarChart3 className="h-3.5 w-3.5" /> Analytics
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 gap-1.5 text-xs rounded-xl" onClick={() => navigate(`/dashboard/my-business/${s.id}/users`)}>
                        <Users className="h-3.5 w-3.5" /> Users
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 gap-1.5 text-xs rounded-xl" onClick={() => navigate(`/dashboard/my-business/${s.id}/deposit`)}>
                        <Wallet className="h-3.5 w-3.5" /> Deposit
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Recommended apps */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-foreground">Recommended apps to grow your business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECOMMENDED_APPS.map((app) => (
            <Card key={app.name} className="p-4 bg-card border-border space-y-2">
              <div>
                <p className="font-medium text-foreground text-sm">{app.name}</p>
                <p className="text-xs text-muted-foreground">{app.provider}</p>
              </div>
              <p className="text-xs text-muted-foreground">{app.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
