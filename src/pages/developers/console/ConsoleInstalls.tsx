import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef, RowAction } from "@/components/developers/console/ConsoleDataTable";
import { ConsoleFormModal, ConsoleDeleteDialog } from "@/components/developers/console/ConsoleFormModal";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InstallRow {
  id: string;
  install_id: string;
  surface_id: string;
  widget_key: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ConsoleInstalls() {
  const { activeOrg, isLoading: orgLoading, canRead, canWrite } = useOrgRole();
  const qc = useQueryClient();

  const { data: installs = [], isLoading } = useQuery({
    queryKey: ["dev-installs", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("developer_surface_installs").select("*").order("created_at", { ascending: false });
      return (data ?? []) as InstallRow[];
    },
    enabled: canRead,
  });

  // Fetch surfaces for create dropdown
  const { data: surfaces = [] } = useQuery({
    queryKey: ["dev-surfaces-list", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("surfaces").select("id, title").order("title");
      return data ?? [];
    },
    enabled: canRead,
  });

  // Fetch widgets for create dropdown
  const { data: widgets = [] } = useQuery({
    queryKey: ["dev-widgets-list", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("developer_widget_registry").select("widget_key, title").order("widget_key");
      return data ?? [];
    },
    enabled: canRead,
  });

  // Fetch app installs for install_id dropdown
  const { data: appInstalls = [] } = useQuery({
    queryKey: ["dev-app-installs-list", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("developer_app_installs").select("id, listing_id, org_id").order("installed_at", { ascending: false });
      return data ?? [];
    },
    enabled: canRead,
  });

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [delRow, setDelRow] = useState<InstallRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Mint token state
  const [mintedToken, setMintedToken] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [copied, setCopied] = useState(false);

  const openCreate = () => {
    setForm({
      surface_id: surfaces[0]?.id || "",
      widget_key: widgets[0]?.widget_key || "",
      install_id: appInstalls[0]?.id || "",
      status: "active",
    });
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.surface_id) errs.surface_id = "Required";
    if (!form.widget_key) errs.widget_key = "Required";
    if (!form.install_id) errs.install_id = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("developer_surface_installs").insert({
        surface_id: String(form.surface_id),
        widget_key: String(form.widget_key),
        install_id: String(form.install_id),
        status: String(form.status || "active"),
      });
      if (error) throw error;
      toast({ title: "Install created" });
      qc.invalidateQueries({ queryKey: ["dev-installs"] });
      setModal(false);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (row: InstallRow) => {
    const newStatus = row.status === "active" || row.status === "enabled" ? "disabled" : "active";
    try {
      const { error } = await supabase.from("developer_surface_installs")
        .update({ status: newStatus })
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: `Install ${newStatus}` });
      qc.invalidateQueries({ queryKey: ["dev-installs"] });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!delRow) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("developer_surface_installs").delete().eq("id", delRow.id);
      if (error) throw error;
      toast({ title: "Install deleted" });
      qc.invalidateQueries({ queryKey: ["dev-installs"] });
      setDelRow(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const mintToken = async (row: InstallRow) => {
    setMinting(true);
    setCopied(false);
    try {
      const { data, error } = await supabase.rpc("create_widget_install_token", {
        p_surface_install_id: row.id,
      });
      if (error) throw error;
      if (!data) throw new Error("No token returned");
      setMintedToken(data);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to mint token", variant: "destructive" });
    } finally {
      setMinting(false);
    }
  };

  const copyToken = async () => {
    if (!mintedToken) return;
    await navigator.clipboard.writeText(mintedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Installs" title="Surface Installs" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Installs" title="Surface Installs" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-muted-foreground text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      enabled: "bg-green-500/20 text-green-400 border-green-500/30",
      disabled: "bg-white/10 text-muted-foreground border-white/20",
      revoked: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return <Badge className={`text-xs ${colors[status] || "bg-white/10 text-muted-foreground border-white/20"}`}>{status}</Badge>;
  };

  const cols: ColumnDef<InstallRow>[] = [
    { header: "Widget Key", accessor: "widget_key" },
    { header: "Surface ID", accessor: (r) => <span className="font-mono text-xs">{r.surface_id.slice(0, 8)}…</span> },
    { header: "Status", accessor: (r) => statusBadge(r.status) },
    { header: "Created", accessor: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const rowActions: RowAction<InstallRow>[] = [
    { label: "Toggle Status", onClick: toggleStatus },
    { label: "Mint Token", onClick: mintToken },
    { label: "Delete", onClick: (r) => setDelRow(r), destructive: true },
  ];

  const surfaceOptions = surfaces.map((s) => ({ label: s.title || s.id, value: s.id }));
  const widgetOptions = widgets.map((w) => ({ label: `${w.widget_key} — ${w.title}`, value: w.widget_key }));
  const installIdOptions = appInstalls.map((ai) => ({ label: `${ai.id.slice(0, 8)}… (org: ${ai.org_id.slice(0, 6)}…)`, value: ai.id }));

  return (
    <DocsPage breadcrumb="Console › Installs" title="Surface Installs" subtitle="Widget installations on surfaces.">
      <ConsoleDataTable
        data={installs}
        columns={cols}
        searchKey="widget_key"
        searchPlaceholder="Search installs…"
        isLoading={isLoading}
        canWrite={canWrite}
        onCreateClick={openCreate}
        createLabel="Create Install"
        rowActions={rowActions}
        statusFilter={{ key: "status", options: ["active", "enabled", "disabled", "revoked"] }}
        emptyMessage="No surface installs found."
      />

      <ConsoleFormModal
        open={modal}
        onClose={() => setModal(false)}
        title="Create Install"
        fields={[
          { key: "install_id", label: "App Install", type: "select", options: installIdOptions, required: true },
          { key: "surface_id", label: "Surface", type: "select", options: surfaceOptions, required: true },
          { key: "widget_key", label: "Widget", type: "select", options: widgetOptions, required: true },
          { key: "status", label: "Initial Status", type: "select", options: [
            { label: "Active", value: "active" },
            { label: "Disabled", value: "disabled" },
          ]},
        ]}
        values={form}
        onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))}
        onSubmit={submitCreate}
        isSubmitting={submitting}
        errors={errors}
      />

      <ConsoleDeleteDialog
        open={!!delRow}
        onClose={() => setDelRow(null)}
        onConfirm={doDelete}
        isDeleting={deleting}
        itemName="surface install"
      />

      {/* Mint Token Dialog — token shown once, not stored */}
      <Dialog open={!!mintedToken || minting} onOpenChange={(o) => { if (!o) { setMintedToken(null); setMinting(false); } }}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Widget Install Token</DialogTitle>
          </DialogHeader>
          {minting ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : mintedToken ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs">This token is shown once and will not be stored. Copy it now.</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={mintedToken}
                  className="bg-white/5 border-white/10 text-foreground font-mono text-xs h-9 flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToken}
                  className="text-muted-foreground hover:text-foreground shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DocsPage>
  );
}
