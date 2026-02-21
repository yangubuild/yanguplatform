import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Code, ExternalLink, Shield, Save } from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "uploads" | "permissions";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  disabled: "bg-white/10 text-white/50 border-white/20",
};

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
    { id: "uploads", label: "Uploads", icon: ExternalLink },
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
      {/* Back + header */}
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
      <div className="flex gap-1 mb-6 border-b border-white/10 pb-px">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
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

      {activeTab === "overview" && <OverviewTab app={app} />}
      {activeTab === "uploads" && <UploadsTab app={app} />}
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
        <h3 className="text-white font-semibold text-sm mb-4">App Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/50 text-xs block mb-1">App Name</Label>
            {editing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                maxLength={100}
              />
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
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                maxLength={500}
              />
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
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setName(app.name); setDescription(app.description || ""); }} className="text-white/50">
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus.mutate()}
            disabled={toggleStatus.isPending}
            className="text-white/50 ml-auto"
          >
            {app.status === "active" ? "Disable" : "Enable"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Uploads Tab ──────────────────────────── */

function UploadsTab({ app }: { app: any }) {
  const queryClient = useQueryClient();
  const [appUrl, setAppUrl] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [saved, setSaved] = useState(false);

  // For now, store URLs in the description/metadata — or simply show as form fields
  // Since we don't have dedicated columns yet, this is a UI-only placeholder
  const handleSave = () => {
    // In v1, we just show a success toast — real persistence would need a metadata column or new table
    toast.success("URLs saved (local only in v1)");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-xl p-5 bg-white/[0.02] border border-white/10">
      <h3 className="text-white font-semibold text-sm mb-1">App URLs</h3>
      <p className="text-white/40 text-xs mb-5">Link your app's repository or hosted URL.</p>

      <div className="space-y-4">
        <div>
          <Label className="text-white/50 text-xs block mb-1.5">App URL (GitHub repo or hosted)</Label>
          <Input
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            placeholder="https://github.com/your-org/your-app"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div>
          <Label className="text-white/50 text-xs block mb-1.5">Callback URL (optional)</Label>
          <Input
            value={callbackUrl}
            onChange={(e) => setCallbackUrl(e.target.value)}
            placeholder="https://your-app.com/callback"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <Button variant="accent" size="sm" onClick={handleSave} className="mt-5 gap-1.5">
        <Save className="w-3.5 h-3.5" /> Save URLs
      </Button>
    </div>
  );
}

/* ── Permissions Tab ──────────────────────────── */

function PermissionsTab({ appId }: { appId: string }) {
  const { data: scopes, isLoading: scopesLoading } = useQuery({
    queryKey: ["app-scopes", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_scopes")
        .select("*")
        .eq("app_id", appId);
      if (error) throw error;
      return data;
    },
  });

  const { data: providers, isLoading: provsLoading } = useQuery({
    queryKey: ["app-providers", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_provider_permissions")
        .select("*")
        .eq("app_id", appId);
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scopes */}
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

      {/* Provider Permissions */}
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

      <p className="text-white/30 text-xs">
        For advanced scope and provider management, use the{" "}
        <a href="/developers/console/permissions" className="text-accent hover:underline">Developer Console</a>.
      </p>
    </div>
  );
}
