import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage, DocsCard } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { Code, Key, Webhook, Activity, BookOpen, Plus, Loader2 } from "lucide-react";

export default function PortalOverview() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["portal-overview-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [appsRes, keysRes, webhooksRes] = await Promise.all([
        supabase.from("developer_apps").select("id", { count: "exact", head: true }),
        supabase.from("developer_app_keys").select("id", { count: "exact", head: true }).is("revoked_at", null),
        supabase.from("developer_app_webhooks").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        apps: appsRes.count ?? 0,
        activeKeys: keysRes.count ?? 0,
        webhooks: webhooksRes.count ?? 0,
      };
    },
  });

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Developer";

  return (
    <DocsPage breadcrumb="Portal" title={`Welcome back, ${displayName}`} subtitle="Manage your apps, keys, and integrations from one place.">
      {/* Quick stats */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-white/30" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Code, label: "Apps", value: stats?.apps ?? 0, route: "/developers/portal/apps" },
            { icon: Key, label: "Active Keys", value: stats?.activeKeys ?? 0, route: "/developers/portal/api-keys" },
            { icon: Webhook, label: "Webhooks", value: stats?.webhooks ?? 0, route: "/developers/portal/webhooks" },
          ].map((card) => (
            <div
              key={card.label}
              onClick={() => navigate(card.route)}
              className="rounded-xl p-5 cursor-pointer hover:border-white/20 transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <card.icon className="w-5 h-5 mb-3" strokeWidth={1.5} style={{ color: "#F46D2A" }} />
              <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
              <p className="text-xs text-white/50">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button variant="accent" onClick={() => navigate("/developers/portal/apps?new=1")}>
          <Plus className="w-4 h-4" /> Create App
        </Button>
        <Button
          variant="outline"
          className="border-white/20 text-white/70 hover:bg-white/5"
          onClick={() => navigate("/developers")}
        >
          <BookOpen className="w-4 h-4" /> View API Docs
        </Button>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocsCard icon={Code} title="My Apps" description="Create, configure, and manage your developer applications." onClick={() => navigate("/developers/portal/apps")} />
        <DocsCard icon={Key} title="API Keys" description="Generate and manage API keys for your apps." onClick={() => navigate("/developers/portal/api-keys")} />
        <DocsCard icon={Activity} title="Logs" description="View runtime activity and webhook deliveries." onClick={() => navigate("/developers/portal/logs")} />
        <DocsCard icon={BookOpen} title="Documentation" description="Explore the full developer docs and API reference." onClick={() => navigate("/developers")} />
      </div>
    </DocsPage>
  );
}
