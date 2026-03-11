import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserInstalls, uninstallApp } from "@/lib/app-store/queries";
import { connectApp } from "@/lib/app-store/connect";
import { supabase } from "@/integrations/supabase/client";
import { ICON_MAP } from "@/lib/app-store/icon-map";
import { Plus, Loader2, Trash2, ExternalLink, Grid3X3, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { AppRegistryEntry } from "@/lib/app-store/types";

interface InstalledApp {
  id: string;
  app_id: string;
  status: string;
  installed_at: string;
  app: AppRegistryEntry;
}

export default function MyAppsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: installs, isLoading } = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_user_installs")
        .select("id, app_id, status, installed_at")
        .eq("user_id", user!.id)
        .order("installed_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch app details
      const appIds = data.map((i) => i.app_id);
      const { data: apps, error: appsError } = await supabase
        .from("app_registry")
        .select("*")
        .in("id", appIds);
      if (appsError) throw appsError;

      const appMap = new Map((apps || []).map((a) => [a.id, a]));
      return data
        .map((install) => ({
          ...install,
          app: appMap.get(install.app_id),
        }))
        .filter((i) => i.app) as InstalledApp[];
    },
  });

  const handleRemove = async (appId: string, appName: string) => {
    if (!user?.id) return;
    try {
      await uninstallApp(user.id, appId);
      queryClient.invalidateQueries({ queryKey: ["my-apps"] });
      queryClient.invalidateQueries({ queryKey: ["app-install-state"] });
      toast.success(`${appName} removed`);
    } catch {
      toast.error("Failed to remove app");
    }
  };

  return (
    <div className="w-full min-h-screen px-6 py-6" style={{ background: "#08120D" }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">My Apps</h1>
        <button
          onClick={() => navigate("/dashboard/app-store")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
        >
          <Plus className="w-4 h-4" />
          Add App
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      ) : !installs || installs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <Grid3X3 className="w-8 h-8 text-white/20" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">No apps yet</h2>
          <p className="text-sm text-white/40 mb-6">Browse the app store to add apps to your dashboard.</p>
          <button
            onClick={() => navigate("/dashboard/app-store")}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
          >
            Browse App Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {installs.map((item) => {
            const icon = ICON_MAP[item.app.slug] || item.app.icon;
            const installedDate = new Date(item.installed_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={item.id}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={icon}
                    alt={item.app.name}
                    className="w-11 h-11 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-sm leading-tight">{item.app.name}</h4>
                    <span className="text-[11px] text-white/35">
                      {item.app.provider_name} • {item.status === "connected" ? "Connected" : "Installed"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed line-clamp-1">
                  {item.app.short_description || "No description."}
                </p>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-[10px] text-white/25">Added {installedDate}</span>
                  <div className="flex items-center gap-1.5">
                    {item.app.launch_route && (
                      <button
                        onClick={() => navigate(item.app.launch_route!)}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-80"
                        style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}
                      >
                        Open
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(item.app_id, item.app.name)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
