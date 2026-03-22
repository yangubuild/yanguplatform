import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Plus, Code, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <Button variant="accent" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New App
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <h3 className="text-foreground font-semibold text-sm mb-4">Create a new app</h3>
          <div className="space-y-3 mb-4">
            <input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }}
              placeholder="App name"
              className="w-full px-3 py-2 rounded-lg text-sm text-muted-foreground placeholder:text-muted-foreground"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="app-slug"
              className="w-full px-3 py-2 rounded-lg text-sm text-muted-foreground placeholder:text-muted-foreground font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="accent"
              onClick={() => createApp.mutate()}
              disabled={!newName || !newSlug || createApp.isPending}>
              {createApp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)} className="text-muted-foreground">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : apps && apps.length> 0 ? (
        <div className="space-y-3">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => navigate(`/developers/console/apps/${app.id}`)}
              className="w-full text-left rounded-xl p-5 transition-colors hover:border-white/20"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5" style={{ color: "#F46D2A" }} />
                <div>
                  <h3 className="text-foreground font-semibold text-sm">{app.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{app.slug}</p>
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
          <Code className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No apps yet. Create your first one.</p>
        </div>
      )}
    </DocsPage>
  );
}
