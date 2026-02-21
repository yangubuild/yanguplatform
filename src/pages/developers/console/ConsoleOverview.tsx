import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage, DocsCard } from "@/components/developers/DocsPage";
import { Loader2, Shield, Activity, Layout, Cable } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ConsoleOverview() {
  const { activeOrg, isLoading: orgLoading, canRead } = useOrgRole();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dev-console-overview", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg) return null;

      // Fetch all counts in parallel
      const [widgets, publishedWidgets, installs, rateLimits] = await Promise.all([
        supabase
          .from("developer_widget_registry")
          .select("id", { count: "exact", head: true })
          .then((r) => r.count ?? 0),
        supabase
          .from("developer_widget_registry")
          .select("id", { count: "exact", head: true })
          .eq("is_enabled", true)
          .then((r) => r.count ?? 0),
        supabase
          .from("developer_surface_installs")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .then((r) => r.count ?? 0),
        supabase
          .from("developer_rate_limit_config")
          .select("id", { count: "exact", head: true })
          .then((r) => r.count ?? 0),
      ]);

      return { widgets, publishedWidgets, installs, rateLimits };
    },
    enabled: canRead && !!activeOrg,
  });

  if (orgLoading || isLoading) {
    return (
      <DocsPage breadcrumb="Console" title="Developer Console" subtitle="Overview of your developer platform.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console" title="Developer Console" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-white/50 text-sm">You don't have permission to access the Developer Console.</p>
        </div>
      </DocsPage>
    );
  }

  const cards = [
    { icon: Layout, title: "Total Widgets", value: stats?.widgets ?? 0, route: "/developers/console/widgets" },
    { icon: Layout, title: "Published Widgets", value: stats?.publishedWidgets ?? 0, route: "/developers/console/widgets" },
    { icon: Cable, title: "Active Installs", value: stats?.installs ?? 0, route: "/developers/console/installs" },
    { icon: Activity, title: "Rate Limit Rules", value: stats?.rateLimits ?? 0, route: "/developers/console/runtime" },
  ];

  return (
    <DocsPage breadcrumb="Console" title="Developer Console" subtitle="Overview of your developer platform.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.route)}
            className="rounded-xl p-5 cursor-pointer hover:border-white/20 transition-colors"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <card.icon className="w-5 h-5 mb-3" strokeWidth={1.5} style={{ color: "#F46D2A" }} />
            <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
            <p className="text-xs text-white/50">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DocsCard icon={Shield} title="Permissions" description="Manage scopes and provider access." onClick={() => navigate("/developers/console/permissions")} />
        <DocsCard icon={Activity} title="Runtime" description="Rate limit rules and counters." onClick={() => navigate("/developers/console/runtime")} />
        <DocsCard icon={Layout} title="Widgets" description="Widget registry and configuration." onClick={() => navigate("/developers/console/widgets")} />
        <DocsCard icon={Cable} title="Installs" description="Surface installs and status." onClick={() => navigate("/developers/console/installs")} />
      </div>
    </DocsPage>
  );
}
