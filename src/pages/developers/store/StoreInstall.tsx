import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { ArrowLeft, Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function StoreInstall() {
  const { appSlug } = useParams<{ appSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState("");

  const { data: listing } = useQuery({
    queryKey: ["store-listing", appSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_store_listings")
        .select("*, developer_apps!inner(name, slug)")
        .eq("slug", appSlug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!appSlug,
  });

  const { data: orgs } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_memberships")
        .select("org_id, role, orgs!inner(id, name)")
        .eq("user_id", user!.id)
        .in("role", ["owner", "admin"]);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: existingInstalls } = useQuery({
    queryKey: ["my-installs", listing?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_installs")
        .select("*")
        .eq("listing_id", listing!.id)
        .neq("status", "uninstalled");
      if (error) throw error;
      return data;
    },
    enabled: !!listing?.id,
  });

  const installApp = useMutation({
    mutationFn: async () => {
      if (!listing || !selectedOrgId) throw new Error("Select an organization");
      const { error } = await supabase.from("developer_app_installs").insert({
        listing_id: listing.id,
        org_id: selectedOrgId,
        installed_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("App installed successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-installs", listing?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const installedOrgIds = new Set(existingInstalls?.map((i) => i.org_id) || []);

  if (!listing) {
    return (
      <DocsPage breadcrumb="App Store → Install" title="Not Found" subtitle="This app is not available for installation.">
        <Button variant="ghost" size="sm" onClick={() => navigate("/developers/store")} className="text-white/50">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Button>
      </DocsPage>
    );
  }

  return (
    <DocsPage breadcrumb="App Store → Install" title={`Install ${listing.name}`} subtitle="Choose an organization to install this app.">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/developers/store/${appSlug}`)} className="text-white/50 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to listing
      </Button>

      {!user ? (
        <div className="rounded-xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-3" />
          <p className="text-white/60 text-sm">Please sign in to install apps.</p>
        </div>
      ) : (
        <div className="max-w-lg">
          <div className="mb-4">
            <label className="text-xs text-white/50 block mb-2">Select Organization</label>
            {orgs && orgs.length > 0 ? (
              <div className="space-y-2">
                {orgs.map((om) => {
                  const org = om.orgs as any;
                  const alreadyInstalled = installedOrgIds.has(org.id);
                  return (
                    <div
                      key={org.id}
                      onClick={() => !alreadyInstalled && setSelectedOrgId(org.id)}
                      className={`rounded-lg p-3 cursor-pointer transition-colors ${
                        alreadyInstalled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      style={{
                        background: selectedOrgId === org.id ? "rgba(244,109,42,0.08)" : "rgba(255,255,255,0.03)",
                        border: selectedOrgId === org.id ? "1px solid rgba(244,109,42,0.3)" : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-white/80">{org.name}</p>
                          <p className="text-xs text-white/40">{om.role}</p>
                        </div>
                        {alreadyInstalled && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Installed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/30 text-sm">No organizations found. Create one first.</p>
            )}
          </div>

          <Button
            variant="accent"
            onClick={() => installApp.mutate()}
            disabled={!selectedOrgId || installApp.isPending || installedOrgIds.has(selectedOrgId)}
          >
            {installApp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Install App"}
          </Button>
        </div>
      )}
    </DocsPage>
  );
}
