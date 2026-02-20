import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Plus, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ConsoleApps() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // Get user's org
  const { data: membership } = useQuery({
    queryKey: ["my-org-membership"],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("org_memberships")
        .select("org_id, role")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"])
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: apps, isLoading } = useQuery({
    queryKey: ["developer-apps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_apps")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createApp = useMutation({
    mutationFn: async () => {
      if (!membership?.org_id) throw new Error("No org found");
      const { data, error } = await supabase.rpc("create_developer_app", {
        p_org_id: membership.org_id,
        p_name: newName,
        p_slug: newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (appId) => {
      toast.success("App created");
      queryClient.invalidateQueries({ queryKey: ["developer-apps"] });
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      navigate(`/developers/console/apps/${appId}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DocsPage breadcrumb="Console" title="My Apps" subtitle="Create and manage your developer applications.">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F46D2A, #d45a1f)" }}
        >
          <Plus className="w-4 h-4" /> New App
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <h3 className="text-white font-semibold text-sm mb-4">Create a new app</h3>
          <div className="space-y-3 mb-4">
            <input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }}
              placeholder="App name"
              className="w-full px-3 py-2 rounded-lg text-sm text-white/90 placeholder:text-white/30"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="app-slug"
              className="w-full px-3 py-2 rounded-lg text-sm text-white/90 placeholder:text-white/30 font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createApp.mutate()}
              disabled={!newName || !newSlug || createApp.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #F46D2A, #d45a1f)" }}
            >
              {createApp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/70">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : apps && apps.length > 0 ? (
        <div className="space-y-3">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(`/developers/console/apps/${app.id}`)}
              className="w-full text-left rounded-xl p-5 transition-colors hover:border-white/20"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5" style={{ color: "#F46D2A" }} />
                <div>
                  <h3 className="text-white font-semibold text-sm">{app.name}</h3>
                  <p className="text-xs text-white/40 font-mono">{app.slug}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${app.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {app.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Code className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No apps yet. Create your first one.</p>
        </div>
      )}
    </DocsPage>
  );
}
