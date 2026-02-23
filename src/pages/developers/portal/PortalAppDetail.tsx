import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDeveloperUsage, trackDeveloperAction } from "@/hooks/useDeveloperUsage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Loader2, Code, Shield, Save, Key, Webhook, Activity, Link2, Plus, Trash2, Copy, Check, AlertTriangle, ShieldAlert, Zap, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type Tab = "overview" | "oauth" | "webhooks" | "keys" | "logs" | "permissions";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  disabled: "bg-white/10 text-white/50 border-white/20",
};

const AVAILABLE_EVENTS = [
  { key: "surface.published", label: "Surface Published" },
  { key: "surface.unpublished", label: "Surface Unpublished" },
  { key: "app.installed", label: "App Installed" },
  { key: "app.uninstalled", label: "App Uninstalled" },
  { key: "key.created", label: "API Key Created" },
  { key: "key.revoked", label: "API Key Revoked" },
];

export default function PortalAppDetail() {
  const { id: appId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: app, isLoading } = useQuery({
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

  const tabs: { id: Tab; label: string; icon: typeof Code }[] = [
    { id: "overview", label: "Overview", icon: Code },
    { id: "oauth", label: "OAuth", icon: Link2 },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "keys", label: "Keys", icon: Key },
    { id: "logs", label: "Logs", icon: Activity },
    { id: "permissions", label: "Permissions", icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-16">
        <p className="text-white/50 text-sm mb-4">App not found.</p>
        <Button variant="ghost" onClick={() => navigate("/developers/portal/apps")}>
          <ArrowLeft className="w-4 h-4" /> Back to Apps
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/developers/portal/apps")}
        className="text-white/50 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Apps
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <Code className="w-5 h-5 text-accent" />
        <div>
          <h2 className="text-lg font-semibold text-white">{app.name}</h2>
          <p className="text-xs text-white/40 font-mono">{app.slug}</p>
        </div>
        <Badge className={`ml-auto text-xs ${statusColors[app.status] || statusColors.draft}`}>
          {app.status}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 pb-px overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors rounded-t-lg whitespace-nowrap ${
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

      {activeTab === "overview" && <OverviewTab app={app} />}
      {activeTab === "oauth" && <OAuthTab appId={app.id} />}
      {activeTab === "webhooks" && <WebhooksTab appId={app.id} />}
      {activeTab === "keys" && <KeysTab appId={app.id} />}
      {activeTab === "logs" && <LogsTab appId={app.id} />}
      {activeTab === "permissions" && <PermissionsTab appId={app.id} />}
    </div>
  );
}

/* ── Overview Tab ──────────────────────────── */
function OverviewTab({ app }: { app: any }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description || "");

  // App-specific usage (14 days for chart, 30 for quotas)
  const { data: usage } = useDeveloperUsage(app.id, 30);

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("developer_apps")
        .update({ name: name.trim(), description: description.trim() || null })
        .eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("App updated");
      queryClient.invalidateQueries({ queryKey: ["developer-app", app.id] });
      setEditing(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async () => {
      const newStatus = app.status === "active" ? "disabled" : "active";
      const { error } = await supabase
        .from("developer_apps")
        .update({ status: newStatus })
        .eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["developer-app", app.id] });
      queryClient.invalidateQueries({ queryKey: ["developer-apps"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Last 14 days for chart
  const chartDays = (usage?.daily_breakdown ?? []).slice(-14);
  const maxVal = Math.max(1, ...chartDays.map(d => d.total));

  return (
    <div className="space-y-6">
      {/* Usage summary cards */}
      {usage && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/10">
            <Zap className="w-4 h-4 mb-2 text-accent" />
            <p className="text-lg font-bold text-white">{usage.total_today}</p>
            <p className="text-[10px] text-white/40">Today</p>
          </div>
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/10">
            <Activity className="w-4 h-4 mb-2 text-accent" />
            <p className="text-lg font-bold text-white">{usage.total_period}</p>
            <p className="text-[10px] text-white/40">Monthly</p>
          </div>
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/10">
            <AlertTriangle className="w-4 h-4 mb-2" style={{ color: usage.error_rate_24h > 10 ? "#ef4444" : "#F46D2A" }} />
            <p className="text-lg font-bold text-white">{usage.error_rate_24h.toFixed(1)}%</p>
            <p className="text-[10px] text-white/40">Error Rate</p>
          </div>
          <div className="rounded-xl p-4 bg-white/[0.02] border border-white/10">
            <Clock className="w-4 h-4 mb-2 text-accent" />
            <p className="text-lg font-bold text-white">{usage.avg_latency_ms.toFixed(0)}ms</p>
            <p className="text-[10px] text-white/40">Avg Latency</p>
          </div>
        </div>
      )}

      {/* Usage chart (last 14 days) */}
      {chartDays.length > 0 && (
        <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4">API Calls (Last 14 Days)</h3>
          <div className="flex items-end gap-1 h-24">
            {chartDays.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-accent/60 min-h-[2px] transition-all"
                  style={{ height: `${(day.total / maxVal) * 100}%` }}
                  title={`${day.date}: ${day.total} calls`}
                />
                {i % 2 === 0 && (
                  <span className="text-[8px] text-white/30">{day.date.slice(5)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quota progress bars */}
      {usage && (usage.daily_limit > 0 || usage.monthly_limit > 0) && (
        <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
          <h3 className="text-white font-semibold text-sm mb-4">Quota Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">Daily</span>
                <span className="text-white/70">{usage.daily_used} / {usage.daily_limit}</span>
              </div>
              <Progress value={usage.daily_limit > 0 ? (usage.daily_used / usage.daily_limit) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">Monthly</span>
                <span className="text-white/70">{usage.monthly_used} / {usage.monthly_limit}</span>
              </div>
              <Progress value={usage.monthly_limit > 0 ? (usage.monthly_used / usage.monthly_limit) * 100 : 0} className="h-2" />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
        <h3 className="text-white font-semibold text-sm mb-4">App Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/50 text-xs block mb-1">App Name</Label>
            {editing ? (
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white" maxLength={100} />
            ) : (
              <p className="text-white text-sm">{app.name}</p>
            )}
          </div>
          <div>
            <Label className="text-white/50 text-xs block mb-1">App Key</Label>
            <p className="text-white/70 text-sm font-mono">{app.slug}</p>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-white/50 text-xs block mb-1">Description</Label>
            {editing ? (
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" maxLength={500} />
            ) : (
              <p className="text-white/60 text-sm">{app.description || "No description"}</p>
            )}
          </div>
          <div>
            <Label className="text-white/50 text-xs block mb-1">Status</Label>
            <Badge className={`text-xs ${statusColors[app.status] || statusColors.draft}`}>{app.status}</Badge>
          </div>
          <div>
            <Label className="text-white/50 text-xs block mb-1">Created</Label>
            <p className="text-white/60 text-sm">{new Date(app.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          {editing ? (
            <>
              <Button variant="accent" size="sm" onClick={() => update.mutate()} disabled={update.isPending || !name.trim()} className="gap-1.5">
                {update.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setName(app.name); setDescription(app.description || ""); }} className="text-white/50">Cancel</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">Edit</Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate()} disabled={toggleStatus.isPending} className="text-white/50 ml-auto">
            {app.status === "active" ? "Disable" : "Enable"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── OAuth Tab ──────────────────────────── */
function OAuthTab({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [newUri, setNewUri] = useState("");

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
      const quotaCheck = await trackDeveloperAction(appId, "oauth.redirect_uri.create", true, 0);
      if (!quotaCheck.ok) throw new Error("API quota reached");
      const { error } = await supabase
        .from("developer_app_oauth")
        .update({ redirect_uris: uris })
        .eq("app_id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-oauth", appId] });
      toast.success("Redirect URIs updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addUri = () => {
    const trimmed = newUri.trim();
    if (!trimmed) return;
    const current = oauth?.redirect_uris ?? [];
    if (current.includes(trimmed)) {
      toast.error("URI already exists");
      return;
    }
    updateUris.mutate([...current, trimmed]);
    setNewUri("");
  };

  const removeUri = (uri: string) => {
    const current = oauth?.redirect_uris ?? [];
    updateUris.mutate(current.filter((u) => u !== uri));
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  return (
    <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
      <h3 className="text-white font-semibold text-sm mb-1">OAuth Configuration</h3>
      <p className="text-white/40 text-xs mb-5">Manage redirect URIs for your OAuth flow.</p>

      <div className="space-y-3 mb-5">
        {(oauth?.redirect_uris ?? []).length === 0 ? (
          <p className="text-white/30 text-xs">No redirect URIs configured.</p>
        ) : (
          (oauth?.redirect_uris ?? []).map((uri) => (
            <div key={uri} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
              <Link2 className="w-3.5 h-3.5 text-accent shrink-0" />
              <code className="flex-1 text-xs text-white/70 font-mono break-all">{uri}</code>
              <Button variant="ghost" size="sm" onClick={() => removeUri(uri)} className="text-red-400/70 hover:text-red-400 h-7 px-2">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newUri}
          onChange={(e) => setNewUri(e.target.value)}
          placeholder="https://your-app.com/callback"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 flex-1"
          onKeyDown={(e) => e.key === "Enter" && addUri()}
        />
        <Button variant="accent" size="sm" onClick={addUri} disabled={updateUris.isPending}>
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {oauth?.scopes && oauth.scopes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <Label className="text-white/50 text-xs block mb-2">Granted Scopes</Label>
          <div className="flex flex-wrap gap-1">
            {oauth.scopes.map((s) => (
              <Badge key={s} variant="outline" className="text-[10px] border-white/20 text-white/50">{s}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Webhooks Tab ──────────────────────────── */
function WebhooksTab({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["app-webhooks", appId],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_app_webhooks")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const handleCreate = async () => {
    if (!newUrl.trim() || selectedEvents.length === 0) {
      toast.error("Enter a URL and select at least one event");
      return;
    }
    setCreating(true);
    const start = Date.now();
    let success = false;
    try {
      const quotaCheck = await trackDeveloperAction(appId, "webhook.create", true, 0);
      if (!quotaCheck.ok) { setCreating(false); return; }
      const { error } = await supabase.from("developer_app_webhooks").insert({
        app_id: appId,
        url: newUrl.trim(),
        events: selectedEvents,
        is_active: true,
      });
      if (error) throw error;
      success = true;
      toast.success("Webhook created");
      setShowCreate(false);
      setNewUrl("");
      setSelectedEvents([]);
      queryClient.invalidateQueries({ queryKey: ["app-webhooks", appId] });
    } catch (e: any) {
      toast.error(e.message || "Failed to create webhook");
    } finally {
      if (!success) trackDeveloperAction(appId, "webhook.create", false, Date.now() - start);
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("developer_app_webhooks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Webhook removed");
      queryClient.invalidateQueries({ queryKey: ["app-webhooks", appId] });
    }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm">Webhooks</h3>
        <Button variant="accent" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" /> Add Webhook
        </Button>
      </div>

      {showCreate && (
        <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <div>
            <Label className="text-white/40 text-xs">Endpoint URL</Label>
            <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/webhooks" className="mt-1 bg-white/5 border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-2 block">Events</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map((ev) => (
                <label key={ev.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={selectedEvents.includes(ev.key)} onCheckedChange={() => setSelectedEvents(prev => prev.includes(ev.key) ? prev.filter(e => e !== ev.key) : [...prev, ev.key])} />
                  <span className="text-white/70 text-sm">{ev.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="accent" size="sm" onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Create
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-white/50">Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
        {!webhooks?.length ? (
          <div className="text-center py-10">
            <Webhook className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No webhooks for this app.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">URL</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Events</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
            </tr></thead>
            <tbody>
              {webhooks.map((wh: any) => (
                <tr key={wh.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white/70 font-mono text-xs truncate max-w-[200px]">{wh.url}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(wh.events ?? []).map((ev: string) => (
                        <Badge key={ev} variant="outline" className="text-[10px] border-white/20 text-white/50">{ev}</Badge>
                      ))}
                    </div>
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
    </div>
  );
}

/* ── Keys Tab ──────────────────────────── */
function KeysTab({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [keyEnv, setKeyEnv] = useState<"dev" | "prod">("dev");
  const [createOpen, setCreateOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [newKeyPlain, setNewKeyPlain] = useState("");
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["app-keys", appId],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_app_keys")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const quotaCheck = await trackDeveloperAction(appId, "api_key.create", true, 0);
      if (!quotaCheck.ok) throw new Error("API quota reached");
      const start = Date.now();
      const { data, error } = await supabase.rpc("create_app_key", {
        p_app_id: appId,
        p_environment: keyEnv,
      });
      if (error) {
        trackDeveloperAction(appId, "api_key.create", false, Date.now() - start);
        throw error;
      }
      return data as { id: string; prefix: string; key: string };
    },
    onSuccess: (data) => {
      setNewKeyPlain(data.key);
      setCreateOpen(false);
      setCopyOpen(true);
      setCopied(false);
      queryClient.invalidateQueries({ queryKey: ["app-keys", appId] });
      toast.success("API key created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create key"),
  });

  const revokeMut = useMutation({
    mutationFn: async (keyId: string) => {
      const quotaCheck = await trackDeveloperAction(appId, "api_key.revoke", true, 0);
      if (!quotaCheck.ok) throw new Error("API quota reached");
      const start = Date.now();
      const { error } = await supabase.from("developer_app_keys").update({ revoked_at: new Date().toISOString() }).eq("id", keyId);
      if (error) {
        trackDeveloperAction(appId, "api_key.revoke", false, Date.now() - start);
        throw error;
      }
    },
    onSuccess: () => {
      setRevokeTarget(null);
      queryClient.invalidateQueries({ queryKey: ["app-keys", appId] });
      toast.success("Key revoked");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to revoke"),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm">API Keys</h3>
        <Button variant="accent" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Key
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
        {!keys?.length ? (
          <div className="text-center py-10">
            <Key className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No API keys for this app.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Prefix</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Env</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Created</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
            </tr></thead>
            <tbody>
              {keys.map((k: any) => {
                const revoked = !!k.revoked_at;
                return (
                  <tr key={k.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3"><span className="font-mono text-sm text-white">{k.prefix}</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${k.environment === "prod" ? "bg-red-500/10 text-red-400" : "bg-accent/10 text-accent"}`}>{k.environment}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${revoked ? "text-red-400" : "text-emerald-400"}`}>{revoked ? "Revoked" : "Active"}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {!revoked && (
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setRevokeTarget(k.id)}>Revoke</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-background border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription className="text-white/50">Generate a new key for this app.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-white/70">Environment</Label>
            <div className="flex gap-2 mt-1">
              {(["dev", "prod"] as const).map((env) => (
                <button key={env} type="button" onClick={() => setKeyEnv(env)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${keyEnv === env ? "bg-accent/20 text-accent border border-accent/40" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"}`}>
                  {env === "dev" ? "Development" : "Production"}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="accent" disabled={createMut.isPending} onClick={() => createMut.mutate()}>
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy-once modal */}
      <Dialog open={copyOpen} onOpenChange={(open) => { if (!open) { setNewKeyPlain(""); setCopyOpen(false); } }}>
        <DialogContent className="bg-background border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-accent" /> Copy Your API Key</DialogTitle>
            <DialogDescription className="text-white/50">This is the only time you'll see this key.</DialogDescription>
          </DialogHeader>
          <div className="bg-black/30 rounded-lg p-4 flex items-center gap-3 border border-white/10">
            <code className="flex-1 text-sm font-mono text-accent break-all select-all">{newKeyPlain}</code>
            <Button variant="ghost" size="icon" onClick={async () => { await navigator.clipboard.writeText(newKeyPlain); setCopied(true); toast.success("Copied"); }} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
            </Button>
          </div>
          <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>You won't be able to see this key again.</span>
          </div>
          <DialogFooter>
            <Button variant="accent" onClick={() => { setNewKeyPlain(""); setCopyOpen(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <Dialog open={!!revokeTarget} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}>
        <DialogContent className="bg-background border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke API Key?</DialogTitle>
            <DialogDescription className="text-white/50">This cannot be undone. Integrations using this key will break.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={revokeMut.isPending} onClick={() => revokeTarget && revokeMut.mutate(revokeTarget)}>
              {revokeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Logs Tab ──────────────────────────── */
function LogsTab({ appId }: { appId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["app-logs", appId],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_runtime_audit")
        .select("*")
        .eq("app_id", appId)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
      {!logs?.length ? (
        <div className="text-center py-12">
          <Activity className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No runtime logs for this app yet.</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10">
            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Action</th>
            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Details</th>
            <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Time</th>
          </tr></thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs border-white/20 text-white/60">{log.action}</Badge>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs font-mono hidden md:table-cell truncate max-w-[200px]">
                  {log.details ? JSON.stringify(log.details).slice(0, 80) : "—"}
                </td>
                <td className="px-4 py-3 text-white/40 text-xs">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Permissions Tab ──────────────────────────── */
function PermissionsTab({ appId }: { appId: string }) {
  const { data: scopes, isLoading: scopesLoading } = useQuery({
    queryKey: ["app-scopes", appId],
    queryFn: async () => {
      const { data, error } = await supabase.from("developer_app_scopes").select("*").eq("app_id", appId);
      if (error) throw error;
      return data;
    },
  });

  const { data: providers, isLoading: provsLoading } = useQuery({
    queryKey: ["app-providers", appId],
    queryFn: async () => {
      const { data, error } = await supabase.from("developer_provider_permissions").select("*").eq("app_id", appId);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = scopesLoading || provsLoading;

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      granted: "bg-green-500/20 text-green-400",
      requested: "bg-yellow-500/20 text-yellow-400",
      denied: "bg-red-500/20 text-red-400",
    };
    return <Badge className={`text-xs ${colors[status] || "bg-white/10 text-white/50"}`}>{status}</Badge>;
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
        <h3 className="text-white font-semibold text-sm mb-3">App Scopes</h3>
        {scopes && scopes.length > 0 ? (
          <div className="space-y-2">
            {scopes.map((s) => (
              <div key={s.scope_key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                <code className="text-xs text-white/70 font-mono">{s.scope_key}</code>
                {statusBadge(s.status)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs">No scopes configured.</p>
        )}
      </div>

      <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
        <h3 className="text-white font-semibold text-sm mb-3">Provider Permissions</h3>
        {providers && providers.length > 0 ? (
          <div className="space-y-2">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                <code className="text-xs text-white/70 font-mono">{p.provider_key}</code>
                <Badge className={`text-xs ${p.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {p.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs">No provider permissions configured.</p>
        )}
      </div>
    </div>
  );
}
