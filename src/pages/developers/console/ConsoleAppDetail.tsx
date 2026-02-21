import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage, DocsSection, PlaceholderBlock } from "@/components/developers/DocsPage";
import { Key, Shield, Webhook, FileText, Loader2, Copy, RotateCcw, Plus, Lock } from "lucide-react";
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
      subtitle={app ? `Slug: ${app.slug} • Status: ${app.status}` : "Loading..."}
    >
      <div className="flex gap-1 mb-8 border-b border-white/10 pb-px">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors rounded-t-lg ${
              activeTab === id
                ? "text-accent bg-accent/8 border-b-2 border-accent"
                : "text-white/50 bg-transparent border-b-2 border-transparent"
            }`}
          >
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
          <p className="text-xs text-white/60 mb-2">Copy this key now. It will not be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-white/90 font-mono flex-1 break-all">{revealedKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success("Copied"); }} className="text-white/40 hover:text-white">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
      ) : keys && keys.length > 0 ? (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <code className="text-xs text-white/70 font-mono">{k.prefix}</code>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${k.environment === "prod" ? "bg-accent/10 text-accent" : "bg-blue-500/10 text-blue-400"}`}>{k.environment}</span>
                {k.revoked_at && <span className="ml-2 text-xs text-red-400/60">revoked</span>}
              </div>
              {!k.revoked_at && (
                <button onClick={() => rotateKey.mutate(k.id)} className="text-white/30 hover:text-white/60">
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/30 text-sm">No keys yet. Create one above.</p>
      )}
    </div>
  );
}

function OAuthTab({ appId }: { appId: string }) {
  const { data: oauth } = useQuery({
    queryKey: ["app-oauth", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_oauth")
        .select("*")
        .eq("app_id", appId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <DocsSection title="OAuth Configuration">
        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="mb-4">
            <label className="text-xs text-white/50 block mb-1">Redirect URIs</label>
            <div className="text-sm text-white/70 font-mono">
              {oauth?.redirect_uris?.length ? oauth.redirect_uris.join(", ") : "None configured"}
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 block mb-1">Scopes</label>
            <div className="text-sm text-white/70 font-mono">
              {oauth?.scopes?.length ? oauth.scopes.join(", ") : "None configured"}
            </div>
          </div>
        </div>
      </DocsSection>
      <PlaceholderBlock title="OAuth management" items={["Add/remove redirect URIs", "Configure allowed scopes", "Client secret rotation"]} />
    </div>
  );
}

function WebhooksTab({ appId }: { appId: string }) {
  const { data: webhooks } = useQuery({
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

  return (
    <div>
      {webhooks && webhooks.length > 0 ? (
        <div className="space-y-2 mb-6">
          {webhooks.map((wh) => (
            <div key={wh.id} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <code className="text-xs text-white/70 font-mono">{wh.url}</code>
              <span className={`ml-2 text-xs ${wh.is_active ? "text-green-400" : "text-red-400"}`}>
                {wh.is_active ? "active" : "disabled"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/30 text-sm mb-6">No webhooks configured.</p>
      )}
      <PlaceholderBlock title="Webhook management" items={["Add new webhook endpoint", "Configure event subscriptions", "View delivery history", "Test webhook delivery"]} />
    </div>
  );
}

function LogsTab({ appId }: { appId: string }) {
  const { data: deliveries } = useQuery({
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

  return (
    <div>
      {deliveries && deliveries.length > 0 ? (
        <div className="space-y-2">
          {deliveries.map((d) => (
            <div key={d.id} className="rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span className="text-xs text-white/50 font-mono">{d.event_type}</span>
              <span className={`text-xs ${d.http_status && d.http_status < 400 ? "text-green-400" : "text-red-400"}`}>{d.http_status ?? d.status}</span>
              <span className="text-xs text-white/30 ml-auto">{new Date(d.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/30 text-sm mb-6">No delivery logs yet.</p>
      )}
      <PlaceholderBlock title="Log features" items={["Real-time log streaming", "Filter by event type", "Replay failed deliveries", "Export log data"]} />
    </div>
  );
}
