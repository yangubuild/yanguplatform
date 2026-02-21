import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Key, Loader2 } from "lucide-react";

export default function PortalApiKeys() {
  const { user } = useAuth();

  const { data: keys, isLoading } = useQuery({
    queryKey: ["portal-api-keys"],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_app_keys")
        .select("id, prefix, environment, created_at, revoked_at, app_id, developer_apps(name)")
        .is("revoked_at", null)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <DocsPage breadcrumb="Portal" title="API Keys" subtitle="View and manage API keys across all your apps.">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : keys && keys.length > 0 ? (
        <div className="space-y-3">
          {keys.map((key: any) => (
            <div
              key={key.id}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <Key className="w-4 h-4" style={{ color: "#F46D2A" }} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-mono">{key.prefix}•••</p>
                <p className="text-white/40 text-xs">{key.developer_apps?.name ?? "Unknown app"} · {key.environment}</p>
              </div>
              <span className="text-xs text-white/30">{new Date(key.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Key className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No API keys yet. Create an app first to generate keys.</p>
        </div>
      )}
    </DocsPage>
  );
}
