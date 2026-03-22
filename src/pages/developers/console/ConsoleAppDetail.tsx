import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage, DocsSection } from "@/components/developers/DocsPage";
import { Key, Shield, Webhook, FileText, Loader2, Copy, RotateCcw, Plus, Lock, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ConsoleAppPermissions from "./ConsoleAppPermissions";

type Tab = "keys" | "oauth" | "webhooks" | "logs" | "permissions";

export default function ConsoleAppDetail() {
  const { appId } = useParams<{ appId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const pathEnd = location.pathname.split("/").pop();
  const activeTab: Tab = (["keys", "oauth", "webhooks", "logs", "permissions"].includes(pathEnd || "") ? pathEnd : "keys") as Tab;

  const { data: app } = useQuery({
    queryKey: ["developer-app", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_apps")
        .select("*")
        .eq("id", appId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!appId && !!user,
  });

  const setTab = (tab: Tab) => {
    navigate(`/developers/console/apps/${appId}/${tab}`);
  };

  const tabs = [
    { id: "keys" as Tab, label: "Keys", icon: Key },
    { id: "permissions" as Tab, label: "Permissions", icon: Lock },
    { id: "oauth" as Tab, label: "OAuth", icon: Shield },
    { id: "webhooks" as Tab, label: "Webhooks", icon: Webhook },
    { id: "logs" as Tab, label: "Logs", icon: FileText },
  ];

  return (
    <DocsPage
      breadcrumb="Console → Apps"
      title={app?.name ?? "App Detail"}
      subtitle={app ? `Slug: ${app.slug} • Status: ${app.status}` : "Loading..."}>
      <div className="flex gap-1 mb-8 border-b border-white/10 pb-px">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors rounded-t-lg ${
              activeTab === id
                ? "text-accent bg-accent/8 border-b-2 border-accent"
                : "text-muted-foreground bg-transparent border-b-2 border-transparent"
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "keys" && <KeysTab appId={appId!} />}
      {activeTab === "permissions" && <ConsoleAppPermissions appId={appId!} />}
      {activeTab === "oauth" && <OAuthTab appId={appId!} />}
      {activeTab === "webhooks" && <WebhooksTab appId={appId!} />}
      {activeTab === "logs" && <LogsTab appId={appId!} />}
    </DocsPage>
  );
}

function KeysTab({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["app-keys", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_keys")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createKey = useMutation({
    mutationFn: async (env: string) => {
      const { data, error } = await supabase.rpc("create_app_key", { p_app_id: appId, p_environment: env });
      if (error) throw error;
      return data as unknown as { id: string; prefix: string; key: string };
    },
    onSuccess: (data) => {
      setRevealedKey((data as any).key);
      toast.success("Key created. Copy it now — it won't be shown again.");
      queryClient.invalidateQueries({ queryKey: ["app-keys", appId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rotateKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await supabase.rpc("rotate_app_key", { p_key_id: keyId });
      if (error) throw error;
      return data as unknown as { id: string; prefix: string; key: string };
    },
    onSuccess: (data) => {
      setRevealedKey((data as any).key);
      toast.success("Key rotated. Copy the new key now.");
      queryClient.invalidateQueries({ queryKey: ["app-keys", appId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <Button variant="secondary" size="sm" onClick={() => createKey.mutate("dev")} disabled={createKey.isPending}>
          <Plus className="w-3 h-3" /> Dev Key
        </Button>
        <Button variant="accent" size="sm" onClick={() => createKey.mutate("prod")} disabled={createKey.isPending}>
          <Plus className="w-3 h-3" /> Prod Key
        </Button>
      </div>

      {revealedKey && (
        <div className="rounded-lg p-4 mb-6 bg-accent/8 border border-accent/20">
          <p className="text-xs text-muted-foreground mb-2">Copy this key now. It will not be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-muted-foreground font-mono flex-1 break-all">{revealedKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success("Copied"); }} className="text-muted-foreground hover:text-foreground">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      ) : keys && keys.length> 0 ? (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <code className="text-xs text-muted-foreground font-mono">{k.prefix}</code>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${k.environment === "prod" ? "bg-accent/10 text-accent" : "bg-blue-500/10 text-blue-400"}`}>{k.environment}</span>
                {k.revoked_at && <span className="ml-2 text-xs text-red-400/60">revoked</span>}
              </div>
              {!k.revoked_at && (
                <button onClick={() => rotateKey.mutate(k.id)} className="text-muted-foreground hover:text-muted-foreground">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No keys yet. Create one above.</p>
      )}
    </div>
  );
}

function OAuthTab({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [newUri, setNewUri] = useState("");
  const [showAddUri, setShowAddUri] = useState(false);

  const { data: oauth, isLoading } = useQuery({
    queryKey: ["app-oauth", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_oauth")
        .select("*")
        .eq("app_id", appId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateUris = useMutation({
    mutationFn: async (uris: string[]) => {
      if (oauth) {
        const { error } = await supabase
          .from("developer_app_oauth")
          .update({ redirect_uris: uris })
          .eq("app_id", appId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("developer_app_oauth")
          .insert({ app_id: appId, redirect_uris: uris, scopes: [] });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-oauth", appId] });
    },
  });

  const handleAddUri = () => {
    if (!newUri.trim()) return;
    try { new URL(newUri.trim()); } catch { toast.error("Invalid URL"); return; }
    const current = oauth?.redirect_uris || [];
    updateUris.mutate([...current, newUri.trim()]);
    setNewUri("");
    setShowAddUri(false);
    toast.success("Redirect URI added");
  };

  const handleRemoveUri = (uri: string) => {
    const current = oauth?.redirect_uris || [];
    updateUris.mutate(current.filter((u) => u !== uri));
    toast.success("Redirect URI removed");
  };

  if (isLoading) return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />;

  const uris = oauth?.redirect_uris || [];
  const scopes = oauth?.scopes || [];

  return (
    <div>
      <DocsSection title="Redirect URIs">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">URLs where users will be redirected after OAuth authorization.</p>
          <button
            onClick={() => setShowAddUri(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Plus className="w-3 h-3" /> Add URI
          </button>
        </div>

        {showAddUri && (
          <div className="flex gap-2 mb-3">
            <input
              value={newUri}
              onChange={(e) => setNewUri(e.target.value)}
              placeholder="https://yourapp.com/callback"
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
            />
            <button onClick={handleAddUri} className="px-3 py-2 rounded-lg text-sm text-foreground bg-accent/20 hover:bg-accent/30">Add</button>
            <button onClick={() => { setShowAddUri(false); setNewUri(""); }} className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-muted-foreground">Cancel</button>
          </div>
        )}

        {uris.length> 0 ? (
          <div className="space-y-1">
            {uris.map((uri) => (
              <div key={uri} className="flex items-center justify-between rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <code className="text-xs text-muted-foreground font-mono break-all">{uri}</code>
                <button onClick={() => handleRemoveUri(uri)} className="text-muted-foreground hover:text-red-400 ml-2 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-4 text-center">No redirect URIs configured.</p>
        )}
      </DocsSection>

      <DocsSection title="Scopes">
        {scopes.length> 0 ? (
          <div className="flex flex-wrap gap-2">
            {scopes.map((s) => (
              <span key={s} className="text-xs px-2 py-1 rounded bg-white/5 text-muted-foreground font-mono">{s}</span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No scopes configured.</p>
        )}
      </DocsSection>
    </div>
  );
}

function WebhooksTab({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["app-webhooks", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_webhooks")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addWebhook = useMutation({
    mutationFn: async () => {
      try { new URL(newUrl.trim()); } catch { throw new Error("Invalid URL"); }
      const { error } = await supabase
        .from("developer_app_webhooks")
        .insert({ app_id: appId, url: newUrl.trim(), is_active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Webhook added");
      queryClient.invalidateQueries({ queryKey: ["app-webhooks", appId] });
      setNewUrl("");
      setShowAdd(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("developer_app_webhooks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Webhook deleted");
      queryClient.invalidateQueries({ queryKey: ["app-webhooks", appId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">Receive HTTP callbacks when events occur in your app.</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Plus className="w-3 h-3" /> Add Webhook
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-4">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://yourapp.com/webhook"
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
          />
          <button onClick={() => addWebhook.mutate()} disabled={addWebhook.isPending} className="px-3 py-2 rounded-lg text-sm text-foreground bg-accent/20 hover:bg-accent/30">
            {addWebhook.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </button>
          <button onClick={() => { setShowAdd(false); setNewUrl(""); }} className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-muted-foreground">Cancel</button>
        </div>
      )}

      {webhooks && webhooks.length> 0 ? (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex-1 min-w-0">
                <code className="text-xs text-muted-foreground font-mono break-all">{wh.url}</code>
                <span className={`ml-2 text-xs ${wh.is_active ? "text-green-400" : "text-red-400"}`}>
                  {wh.is_active ? "active" : "disabled"}
                </span>
              </div>
              <button onClick={() => deleteWebhook.mutate(wh.id)} className="text-muted-foreground hover:text-red-400 ml-2 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm py-4 text-center">No webhooks configured. Add one to receive event notifications.</p>
      )}
    </div>
  );
}

function LogsTab({ appId }: { appId: string }) {
  const [eventFilter, setEventFilter] = useState("");

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["app-deliveries", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_webhook_deliveries")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />;

  const filtered = deliveries?.filter((d) =>
    !eventFilter || d.event_type.toLowerCase().includes(eventFilter.toLowerCase())
  ) || [];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        <input
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          placeholder="Filter by event type…"
          className="flex-1 max-w-xs px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/50"
        />
      </div>

      {filtered.length> 0 ? (
        <div className="space-y-2">
          {filtered.map((d) => (
            <div key={d.id} className="rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xs text-muted-foreground font-mono">{d.event_type}</span>
              <span className={`text-xs ${d.http_status && d.http_status < 400 ? "text-green-400" : "text-red-400"}`}>{d.http_status ?? d.status}</span>
              <span className="text-xs text-muted-foreground ml-auto">{new Date(d.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : deliveries && deliveries.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Logs will appear here when webhook events fire.</p>
      ) : (
        <p className="text-muted-foreground text-sm py-4 text-center">No logs match the current filter.</p>
      )}
    </div>
  );
}
