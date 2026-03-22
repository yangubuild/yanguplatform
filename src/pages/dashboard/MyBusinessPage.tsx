import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ExternalLink, Pencil, ShoppingBag, Store, UtensilsCrossed, Globe, Users, Sparkles, Loader2, Trash2, CheckCircle2, BarChart3, Wallet, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card } from "@/components/primitives";
import { forceDeleteSurface } from "@/lib/forceDeleteSurface";
import { ICON_MAP, yanguBadge } from "@/lib/app-store/icon-map";
import { SurfaceSettingsDialog, type SurfaceMetadata } from "@/components/builder/SurfaceSettingsDialog";

const SURFACE_TYPE_META: Record<string, { label: string; icon: typeof ShoppingBag }> = {
  eshop: { label: "Eshop", icon: ShoppingBag },
  estore: { label: "Estore", icon: Store },
  emenu: { label: "Emenu", icon: UtensilsCrossed },
  esite: { label: "Esite", icon: Globe },
  influencer: { label: "Influencer", icon: Sparkles },
  community: { label: "Community", icon: Users },
  live_bio: { label: "Live Bio", icon: Globe },
};

// Domain mapping for building correct public live URLs
const SURFACE_DOMAIN_MAP: Record<string, string> = {
  eshop: "yangu.shop",
  emenu: "yangu.shop",
  estore: "yangu.store",
  esite: "yangu.site",
  quick_site: "yangu.site",
  influencer: "yangu.live",
  live_bio: "yangu.live",
  live_selling: "yangu.live",
  community_group: "yangu.community",
  community_listing: "yangu.community",
  studio_showcase: "yangu.studio",
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
  seo_title?: string | null;
  seo_description?: string | null;
  favicon_url?: string | null;
  cover_image_url?: string | null;
}

interface PublishInfo {
  surface_id: string;
  slug: string;
  domain_host: string;
}

const RECOMMENDED_APPS = [
  { name: "VLS", slug: "vls", desc: "Vision Leadership System assessment and coaching tools", provider: "yangu" },
  { name: "VisionBoard", slug: "visionboard", desc: "Productivity app to help businesses plan and execute", provider: "yangu" },
  { name: "Visionaire", slug: "visionaire", desc: "yangu digital university with more resources", provider: "yangu" },
];

const INSTALL_STATS = [
  { amount: "₺ 1,898", period: "7 days" },
  { amount: "₺ 3,241", period: "30 days" },
  { amount: "₺ 812", period: "2 days" },
];

export default function MyBusinessPage() {
  const navigate = useNavigate();
  const [surfaces, setSurfaces] = useState<Surface[]>([]);
  const [publishMap, setPublishMap] = useState<Record<string, PublishInfo>>({});
  const [loading, setLoading] = useState(true);
  const [settingsSurface, setSettingsSurface] = useState<Surface | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [surfaceRes, publishRes] = await Promise.all([
        supabase
          .from("builder_surfaces")
          .select("id, title, slug, surface_type, description, created_at, updated_at, metadata, cover_image_url")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("builder_publishes")
          .select("surface_id, slug, domain_id")
          .eq("state", "published"),
      ]);

      setSurfaces((surfaceRes.data as Surface[]) ?? []);

      // Build publish map with domain info
      const pubs = publishRes.data ?? [];
      if (pubs.length > 0) {
        const domainIds = [...new Set(pubs.map((p: any) => p.domain_id))];
        const { data: domains } = await supabase
          .from("domains")
          .select("id, host")
          .in("id", domainIds);
        const domainMap: Record<string, string> = {};
        (domains ?? []).forEach((d: any) => { domainMap[d.id] = d.host; });

        const pm: Record<string, PublishInfo> = {};
        pubs.forEach((p: any) => {
          pm[p.surface_id] = {
            surface_id: p.surface_id,
            slug: p.slug,
            domain_host: domainMap[p.domain_id] || "",
          };
        });
        setPublishMap(pm);
      }

      setLoading(false);
    })();
  }, []);

  const grouped = surfaces.reduce<Record<string, Surface[]>>((acc, s) => {
    const key = s.surface_type || "other";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  // Build live URL for a surface
  const getLiveUrl = (s: Surface): string | null => {
    const pub = publishMap[s.id];
    if (pub && pub.domain_host) {
      return `https://${pub.domain_host}/${pub.slug}`;
    }
    // Fallback: use domain mapping + slug
    const domain = SURFACE_DOMAIN_MAP[s.surface_type];
    if (domain) {
      return `https://${domain}/${s.slug}`;
    }
    return null;
  };

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
    <div className="p-6 space-y-8 max-w-6xl min-h-screen" style={{ background: "#08120D" }}>
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
            <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-2">
              {items.map((s) => {
                const isPublished = !!publishMap[s.id];
                const liveUrl = getLiveUrl(s);
                return (
                  <Card key={s.id} className="p-4 flex flex-col gap-3 bg-card border-border min-w-[280px] max-w-[320px] shrink-0">
                    {/* Cover image if present */}
                    {s.cover_image_url && (
                      <div className="rounded-lg overflow-hidden -mx-4 -mt-4 mb-1">
                        <img src={s.cover_image_url} alt="" className="w-full h-24 object-cover" />
                      </div>
                    )}

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

                    {/* Primary actions — Edit Builder + Surface Settings + Preview + Delete */}
                    <div className="flex gap-2">
                      {/* ACTION 1: Edit Builder */}
                      <Button size="sm" variant="outline" className="gap-1.5 flex-1 rounded-xl" onClick={() => navigate(`/builder/${s.id}`)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      {/* ACTION 2: Surface Settings */}
                      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => setSettingsSurface(s)}>
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                      {/* BLOCK C FIX: Open actual live public page */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 rounded-xl"
                        onClick={() => {
                          if (liveUrl) {
                            window.open(liveUrl, "_blank");
                          } else {
                            toast.info("This surface hasn't been published yet");
                          }
                        }}
                      >
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

                    {/* Management actions — 3 clear buttons */}
                    <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                      <Button size="sm" variant="ghost" className="gap-1 text-xs rounded-xl" onClick={() => navigate(`/dashboard/my-business/${s.id}/analytics`)}>
                        <BarChart3 className="h-3.5 w-3.5" /> Analytics
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 text-xs rounded-xl" onClick={() => navigate(`/dashboard/my-business/${s.id}/users`)}>
                        <Users className="h-3.5 w-3.5" /> Users
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 text-xs rounded-xl" onClick={() => navigate(`/dashboard/my-business/${s.id}/deposit`)}>
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

      {/* Surface Settings Dialog */}
      {settingsSurface && (
        <SurfaceSettingsDialog
          open={!!settingsSurface}
          onOpenChange={(open) => { if (!open) setSettingsSurface(null); }}
          surfaceId={settingsSurface.id}
          surfaceTitle={settingsSurface.title}
          initial={{
            seo_title: (settingsSurface as any).seo_title || "",
            seo_description: (settingsSurface as any).seo_description || "",
            favicon_url: (settingsSurface as any).favicon_url || "",
            cover_image_url: (settingsSurface as any).cover_image_url || "",
          }}
          onSaved={(meta) => {
            setSurfaces(prev =>
              prev.map(s =>
                s.id === settingsSurface.id
                  ? { ...s, ...meta }
                  : s
              )
            );
          }}
        />
      )}

      {/* Recommended apps */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-foreground">Recommended apps to grow your business</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RECOMMENDED_APPS.map((app, idx) => {
            const icon = ICON_MAP[app.slug];
            const stats = INSTALL_STATS[idx % INSTALL_STATS.length];
            return (
              <div
                key={app.slug}
                className="rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onClick={() => navigate("/dashboard/app-store")}
              >
                <div className="flex items-start gap-3">
                  {icon && (
                    <img src={icon} alt={app.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-foreground font-semibold text-sm leading-tight">{app.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <img src={yanguBadge} alt="yangu" className="w-3.5 h-3.5 object-contain" />
                      <span className="text-[11px] text-muted-foreground">{app.provider} • Free to install</span>
                    </div>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); navigate("/dashboard/app-store"); }}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">{app.desc}</p>
                <span className="text-[10px] text-muted-foreground/50">{stats.amount} installs in last {stats.period}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
