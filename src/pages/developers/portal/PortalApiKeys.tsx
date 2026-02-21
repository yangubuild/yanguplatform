import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DocsPage } from "@/components/developers/DocsPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { Key, Plus, Loader2, Copy, Check, AlertTriangle, ShieldAlert } from "lucide-react";

export default function PortalApiKeys() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ── state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [newKeyPlain, setNewKeyPlain] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>("all");
  const [keyName, setKeyName] = useState("");
  const [keyEnv, setKeyEnv] = useState<"dev" | "prod">("dev");
  const [showRevoked, setShowRevoked] = useState(false);

  // ── queries ──
  const { data: apps } = useQuery({
    queryKey: ["portal-apps-for-keys"],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_apps")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: keys, isLoading } = useQuery({
    queryKey: ["portal-api-keys", showRevoked],
    queryFn: async () => {
      let q = supabase
        .from("developer_app_keys")
        .select("id, prefix, environment, created_at, revoked_at, app_id, developer_apps(name)")
        .order("created_at", { ascending: false });
      if (!showRevoked) q = q.is("revoked_at", null);
      const { data } = await q;
      return data ?? [];
    },
    enabled: !!user,
  });

  const filteredKeys = (keys ?? []).filter(
    (k: any) => selectedAppId === "all" || k.app_id === selectedAppId,
  );

  // ── create mutation ──
  const createMut = useMutation({
    mutationFn: async () => {
      if (selectedAppId === "all" && apps && apps.length === 1) {
        // auto-select sole app
      }
      const appId = createAppId;
      if (!appId) throw new Error("Select an app");
      const { data, error } = await supabase.rpc("create_app_key", {
        p_app_id: appId,
        p_environment: keyEnv,
      });
      if (error) throw error;
      return data as { id: string; prefix: string; key: string };
    },
    onSuccess: (data) => {
      setNewKeyPlain(data.key);
      setCreateOpen(false);
      setCopyOpen(true);
      setCopied(false);
      setKeyName("");
      qc.invalidateQueries({ queryKey: ["portal-api-keys"] });
      toast.success("API key created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create key"),
  });

  // ── revoke mutation ──
  const revokeMut = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from("developer_app_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      setRevokeTarget(null);
      qc.invalidateQueries({ queryKey: ["portal-api-keys"] });
      toast.success("Key revoked");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to revoke"),
  });

  // derive app id for create
  const [createAppSelected, setCreateAppSelected] = useState<string>("");
  const createAppId = createAppSelected || (apps?.length === 1 ? apps[0].id : "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(newKeyPlain);
    setCopied(true);
    toast.success("Copied to clipboard");
  };

  return (
    <DocsPage breadcrumb="Portal" title="API Keys" subtitle="Create, view, and revoke API keys for your apps.">
      {/* ── toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={selectedAppId}
          onChange={(e) => setSelectedAppId(e.target.value)}
          className="h-9 rounded-md border border-white/10 bg-white/5 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">All Apps</option>
          {(apps ?? []).map((a: any) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showRevoked}
            onChange={(e) => setShowRevoked(e.target.checked)}
            className="accent-accent"
          />
          Show revoked
        </label>

        <div className="flex-1" />

        <Button variant="accent" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create API Key
        </Button>
      </div>

      {/* ── beta note ── */}
      <p className="text-xs text-white/30 mb-4">
        Free during beta — usage is currently unlimited. Limits may apply later.
      </p>

      {/* ── table ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : filteredKeys.length > 0 ? (
        <div className="rounded-xl overflow-hidden border border-white/10">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Key</TableHead>
                <TableHead className="text-white/50">App</TableHead>
                <TableHead className="text-white/50">Env</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="text-white/50">Created</TableHead>
                <TableHead className="text-white/50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKeys.map((k: any) => {
                const revoked = !!k.revoked_at;
                return (
                  <TableRow key={k.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-accent" />
                        <span className="font-mono text-sm text-white">{k.prefix}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {k.developer_apps?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        k.environment === "prod"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-accent/10 text-accent"
                      }`}>
                        {k.environment}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${revoked ? "text-red-400" : "text-emerald-400"}`}>
                        {revoked ? "Revoked" : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-white/40 text-xs">
                      {new Date(k.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!revoked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => setRevokeTarget(k.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16">
          <Key className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No API keys yet. Create one to get started.</p>
        </div>
      )}

      {/* ── Create Modal ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-background border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription className="text-white/50">
              Generate a new key for your app. You'll only see it once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-white/70">App</Label>
              <select
                value={createAppId}
                onChange={(e) => setCreateAppSelected(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-white/10 bg-white/5 text-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select app…</option>
                {(apps ?? []).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-white/70">Environment</Label>
              <div className="flex gap-2 mt-1">
                {(["dev", "prod"] as const).map((env) => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setKeyEnv(env)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      keyEnv === env
                        ? "bg-accent/20 text-accent border border-accent/40"
                        : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {env === "dev" ? "Development" : "Production"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="accent"
              disabled={!createAppId || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Copy-once Modal ── */}
      <Dialog open={copyOpen} onOpenChange={(open) => { if (!open) { setNewKeyPlain(""); setCopyOpen(false); } }}>
        <DialogContent className="bg-background border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accent" />
              Copy Your API Key
            </DialogTitle>
            <DialogDescription className="text-white/50">
              This is the only time you'll see this key. Copy it now and store it securely.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-black/30 rounded-lg p-4 flex items-center gap-3 border border-white/10">
            <code className="flex-1 text-sm font-mono text-accent break-all select-all">
              {newKeyPlain}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/60" />}
            </Button>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>You won't be able to see this key again. If you lose it, you'll need to create a new one.</span>
          </div>

          <DialogFooter>
            <Button variant="accent" onClick={() => { setNewKeyPlain(""); setCopyOpen(false); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Revoke Confirm ── */}
      <Dialog open={!!revokeTarget} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}>
        <DialogContent className="bg-background border-border text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke API Key?</DialogTitle>
            <DialogDescription className="text-white/50">
              This action cannot be undone. Any integrations using this key will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={revokeMut.isPending}
              onClick={() => revokeTarget && revokeMut.mutate(revokeTarget)}
            >
              {revokeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Revoke Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DocsPage>
  );
}
