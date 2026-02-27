import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ExternalLink, Pencil, ShoppingBag, Store, UtensilsCrossed, Globe, Users, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Card } from "@/components/primitives";

const SURFACE_TYPE_META: Record<string, { label: string; icon: typeof ShoppingBag }> = {
  eshop: { label: "Eshop", icon: ShoppingBag },
  estore: { label: "Estore", icon: Store },
  emenu: { label: "Emenu", icon: UtensilsCrossed },
  esite: { label: "Esite", icon: Globe },
  influencer: { label: "Influencer", icon: Sparkles },
  community: { label: "Community", icon: Users },
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

export default function MyBusinessPage() {
  const navigate = useNavigate();
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("builder_surfaces")
        .select("id, title, slug, surface_type, description, created_at, updated_at, metadata")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      setSurfaces((data as Surface[]) ?? []);
      setLoading(false);
    })();
  }, []);

  // Group by surface_type
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
    <div className="p-6 space-y-8 max-w-5xl">
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <Card key={s.id} className="p-4 flex flex-col gap-3 bg-card border-border">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground truncate">{s.title}</h3>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated {new Date(s.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => navigate(`/builder/${s.id}`)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => window.open(`/s/${s.id}/preview`, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{s.title}"?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete this business page and all its data. This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
                            const { error } = await supabase.from("builder_surfaces").delete().eq("id", s.id);
                            if (error) { toast.error("Failed to delete"); return; }
                            setSurfaces(prev => prev.filter(x => x.id !== s.id));
                            toast.success("Deleted successfully");
                          }}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
