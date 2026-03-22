import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Webhook, Plus, Loader2, Trash2, Info, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_EVENTS = [
  { key: "surface.published", label: "Surface Published" },
  { key: "surface.unpublished", label: "Surface Unpublished" },
  { key: "app.installed", label: "App Installed" },
  { key: "app.uninstalled", label: "App Uninstalled" },
  { key: "key.created", label: "API Key Created" },
  { key: "key.revoked", label: "API Key Revoked" },
];

export default function PortalWebhooks() {
  const { user } = useAuth();
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Fetch apps
  const { data: apps } = useQuery({
    queryKey: ["portal-apps-webhooks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_apps")
        .select("id, name, slug")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Fetch webhooks
  const { data: webhooks, isLoading, refetch } = useQuery({
    queryKey: ["portal-webhooks", user?.id, selectedApp],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("developer_app_webhooks")
        .select("*, developer_apps!inner(name, slug, owner_user_id)")
        .eq("developer_apps.owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (selectedApp !== "all") q = q.eq("app_id", selectedApp);
      const { data } = await q;
      return data ?? [];
    },
  });

  const toggleEvent = (key: string) => {
    setSelectedEvents((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  const handleCreate = async () => {
    if (!newUrl.trim() || selectedEvents.length === 0 || selectedApp === "all") {
      toast.error("Select an app, enter a URL, and choose at least one event");
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from("developer_app_webhooks").insert({
        app_id: selectedApp,
        url: newUrl.trim(),
        events: selectedEvents,
        is_active: true,
      });
      if (error) throw error;
      toast.success("Webhook created");
      setShowCreate(false);
      setNewUrl("");
      setSelectedEvents([]);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to create webhook");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("developer_app_webhooks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Webhook removed");
      refetch();
    }
  };

  return (
    <DocsPage breadcrumb="Portal" title="Webhooks" subtitle="Receive real-time event notifications for your apps.">
      {/* Beta note */}
      <div className="flex items-start gap-2 mb-6 px-3 py-2 rounded-lg bg-accent/8 border border-accent/20">
        <Info className="w-4 h-4 mt-0.5 text-accent shrink-0" />
        <p className="text-muted-foreground text-xs">
          Webhooks are in <span className="text-accent font-medium">Beta</span> — event delivery is best-effort during this period. No charges apply.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={selectedApp} onValueChange={setSelectedApp}>
          <SelectTrigger className="w-[220px] bg-white/5 border-white/10 text-foreground text-sm">
            <SelectValue placeholder="All Apps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Apps</SelectItem>
            {apps?.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="accent" size="sm" onClick={() => setShowCreate(!showCreate)} disabled={!apps?.length}>
          <Plus className="w-4 h-4 mr-1" /> Add Webhook
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div
          className="rounded-xl p-5 mb-6 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          <h4 className="text-foreground font-semibold text-sm flex items-center gap-2">
            <Webhook className="w-4 h-4" style={{ color: "#F46D2A" }} />
            New Webhook
          </h4>

          {selectedApp === "all" && (
            <div>
              <Label className="text-muted-foreground text-xs">App</Label>
              <Select value="" onValueChange={setSelectedApp}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-foreground text-sm">
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  {apps?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-xs">Endpoint URL</Label>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/webhooks"
              className="mt-1 bg-white/5 border-white/10 text-foreground"
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-xs mb-2 block">Events</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map((ev) => (
                <label key={ev.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedEvents.includes(ev.key)}
                    onCheckedChange={() => toggleEvent(ev.key)}
                  />
                  <span className="text-muted-foreground text-sm">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="accent" size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Create Webhook
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-muted-foreground">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Webhooks list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : !webhooks?.length ? (
          <div className="text-center py-12">
            <Webhook className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No webhooks configured yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">URL</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Events</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs">Status</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((wh: any) => (
                <tr key={wh.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs truncate max-w-[240px]">
                    {wh.url}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(wh.events ?? []).map((ev: string) => (
                        <Badge key={ev} variant="outline" className="text-[10px] border-white/20 text-muted-foreground">
                          {ev}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={wh.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/10 text-muted-foreground border-white/20"}>
                      {wh.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(wh.id)} className="text-red-400/70 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DocsPage>
  );
}
