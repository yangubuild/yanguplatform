import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef, RowAction } from "@/components/developers/console/ConsoleDataTable";
import { ConsoleFormModal, ConsoleDeleteDialog } from "@/components/developers/console/ConsoleFormModal";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AppScope {
  id?: string;
  app_id: string;
  scope_key: string;
  status: string;
  notes: string | null;
  granted_at: string | null;
}

interface ProviderPerm {
  id: string;
  app_id: string;
  provider_key: string;
  is_active: boolean;
  granted_at: string | null;
}

const SLUG_RE = /^[a-z0-9_-]+$/;

export default function ConsolePermissions() {
  const { activeOrg, isLoading: orgLoading, canRead, canWrite } = useOrgRole();
  const qc = useQueryClient();

  // ── App list for selects ──
  const { data: apps = [] } = useQuery({
    queryKey: ["dev-apps-list"],
    queryFn: async () => {
      const { data } = await supabase.from("developer_apps").select("id, name").order("name");
      return data ?? [];
    },
    enabled: canRead,
  });

  // ── Scopes ──
  const { data: scopes = [], isLoading: scopesLoading } = useQuery({
    queryKey: ["dev-scopes", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("developer_app_scopes").select("*").order("scope_key");
      return (data ?? []) as AppScope[];
    },
    enabled: canRead,
  });

  // ── Provider Permissions ──
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["dev-provider-perms", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("developer_provider_permissions").select("*").order("provider_key");
      return (data ?? []) as ProviderPerm[];
    },
    enabled: canRead,
  });

  // ── Scope CRUD state ──
  const [scopeModal, setScopeModal] = useState<{ mode: "create" | "edit"; row?: AppScope } | null>(null);
  const [scopeForm, setScopeForm] = useState<Record<string, unknown>>({});
  const [scopeErrors, setScopeErrors] = useState<Record<string, string>>({});
  const [scopeSubmitting, setScopeSubmitting] = useState(false);
  const [scopeDelete, setScopeDelete] = useState<AppScope | null>(null);
  const [scopeDeleting, setScopeDeleting] = useState(false);

  const openScopeCreate = () => {
    setScopeForm({ app_id: apps[0]?.id || "", scope_key: "", status: "requested", notes: "" });
    setScopeErrors({});
    setScopeModal({ mode: "create" });
  };
  const openScopeEdit = (row: AppScope) => {
    setScopeForm({ app_id: row.app_id, scope_key: row.scope_key, status: row.status, notes: row.notes || "" });
    setScopeErrors({});
    setScopeModal({ mode: "edit", row });
  };

  const validateScope = () => {
    const errs: Record<string, string> = {};
    if (!scopeForm.scope_key || !SLUG_RE.test(String(scopeForm.scope_key))) errs.scope_key = "Required, lowercase slug (a-z, 0-9, dash, underscore)";
    if (!scopeForm.app_id) errs.app_id = "Required";
    setScopeErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitScope = async () => {
    if (!validateScope()) return;
    setScopeSubmitting(true);
    try {
      if (scopeModal?.mode === "create") {
        const { error } = await supabase.from("developer_app_scopes").insert({
          app_id: String(scopeForm.app_id),
          scope_key: String(scopeForm.scope_key),
          status: String(scopeForm.status || "requested"),
          notes: String(scopeForm.notes || "") || null,
        });
        if (error) throw error;
        toast({ title: "Scope created" });
      } else if (scopeModal?.row) {
        // Composite key: update by app_id + scope_key
        const { error } = await supabase.from("developer_app_scopes")
          .update({ status: String(scopeForm.status), notes: String(scopeForm.notes || "") || null })
          .eq("app_id", scopeModal.row.app_id)
          .eq("scope_key", scopeModal.row.scope_key);
        if (error) throw error;
        toast({ title: "Scope updated" });
      }
      qc.invalidateQueries({ queryKey: ["dev-scopes"] });
      setScopeModal(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setScopeSubmitting(false);
    }
  };

  const deleteScope = async () => {
    if (!scopeDelete) return;
    setScopeDeleting(true);
    try {
      const { error } = await supabase.from("developer_app_scopes")
        .delete()
        .eq("app_id", scopeDelete.app_id)
        .eq("scope_key", scopeDelete.scope_key);
      if (error) throw error;
      toast({ title: "Scope deleted" });
      qc.invalidateQueries({ queryKey: ["dev-scopes"] });
      setScopeDelete(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setScopeDeleting(false);
    }
  };

  // ── Provider CRUD state ──
  const [provModal, setProvModal] = useState<{ mode: "create" | "edit"; row?: ProviderPerm } | null>(null);
  const [provForm, setProvForm] = useState<Record<string, unknown>>({});
  const [provErrors, setProvErrors] = useState<Record<string, string>>({});
  const [provSubmitting, setProvSubmitting] = useState(false);
  const [provDelete, setProvDelete] = useState<ProviderPerm | null>(null);
  const [provDeleting, setProvDeleting] = useState(false);

  const openProvCreate = () => {
    setProvForm({ app_id: apps[0]?.id || "", provider_key: "", is_active: true });
    setProvErrors({});
    setProvModal({ mode: "create" });
  };
  const openProvEdit = (row: ProviderPerm) => {
    setProvForm({ app_id: row.app_id, provider_key: row.provider_key, is_active: row.is_active });
    setProvErrors({});
    setProvModal({ mode: "edit", row });
  };

  const validateProv = () => {
    const errs: Record<string, string> = {};
    if (!provForm.provider_key || !SLUG_RE.test(String(provForm.provider_key))) errs.provider_key = "Required, lowercase slug format";
    if (!provForm.app_id) errs.app_id = "Required";
    setProvErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitProv = async () => {
    if (!validateProv()) return;
    setProvSubmitting(true);
    try {
      if (provModal?.mode === "create") {
        const { error } = await supabase.from("developer_provider_permissions").insert({
          app_id: String(provForm.app_id),
          provider_key: String(provForm.provider_key),
          is_active: !!provForm.is_active,
        });
        if (error) throw error;
        toast({ title: "Provider permission created" });
      } else if (provModal?.row) {
        const { error } = await supabase.from("developer_provider_permissions")
          .update({ is_active: !!provForm.is_active })
          .eq("id", provModal.row.id);
        if (error) throw error;
        toast({ title: "Provider permission updated" });
      }
      qc.invalidateQueries({ queryKey: ["dev-provider-perms"] });
      setProvModal(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProvSubmitting(false);
    }
  };

  const deleteProv = async () => {
    if (!provDelete) return;
    setProvDeleting(true);
    try {
      const { error } = await supabase.from("developer_provider_permissions").delete().eq("id", provDelete.id);
      if (error) throw error;
      toast({ title: "Provider permission deleted" });
      qc.invalidateQueries({ queryKey: ["dev-provider-perms"] });
      setProvDelete(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProvDeleting(false);
    }
  };

  // ── Render ──
  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Permissions" title="Permissions" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Permissions" title="Permissions" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-muted-foreground text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: "bg-green-500/20 text-green-400 border-green-500/30",
      requested: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      denied: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return <Badge className={`text-xs ${colors[status] || "bg-white/10 text-muted-foreground border-white/20"}`}>{status}</Badge>;
  };

  const scopeCols: ColumnDef<AppScope>[] = [
    { header: "Scope", accessor: "scope_key" },
    { header: "Status", accessor: (r) => statusBadge(r.status) },
    { header: "Notes", accessor: (r) => r.notes || "—" },
    { header: "Granted", accessor: (r) => r.granted_at ? new Date(r.granted_at).toLocaleDateString() : "—" },
  ];

  const scopeActions: RowAction<AppScope>[] = [
    { label: "Edit", onClick: openScopeEdit },
    { label: "Delete", onClick: (r) => setScopeDelete(r), destructive: true },
  ];

  const provCols: ColumnDef<ProviderPerm>[] = [
    { header: "Provider", accessor: "provider_key" },
    { header: "Active", accessor: (r) => (
      <Badge className={`text-xs ${r.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
        {r.is_active ? "Active" : "Inactive"}
      </Badge>
    )},
    { header: "Granted", accessor: (r) => r.granted_at ? new Date(r.granted_at).toLocaleDateString() : "—" },
  ];

  const provActions: RowAction<ProviderPerm>[] = [
    { label: "Edit", onClick: openProvEdit },
    { label: "Delete", onClick: (r) => setProvDelete(r), destructive: true },
  ];

  const appOptions = apps.map((a) => ({ label: a.name, value: a.id }));

  return (
    <DocsPage breadcrumb="Console › Permissions" title="Permissions" subtitle="Manage app scopes and provider access.">
      <h2 className="text-lg font-semibold text-foreground mb-4">App Scopes</h2>
      <ConsoleDataTable
        data={scopes}
        columns={scopeCols}
        searchKey="scope_key"
        searchPlaceholder="Search scopes…"
        isLoading={scopesLoading}
        canWrite={canWrite}
        onCreateClick={openScopeCreate}
        createLabel="Add Scope"
        rowActions={scopeActions}
        statusFilter={{ key: "status", options: ["approved", "requested", "denied"] }}
        emptyMessage="No scopes configured."
      />

      <h2 className="text-lg font-semibold text-foreground mb-4 mt-10">Provider Permissions</h2>
      <ConsoleDataTable
        data={providers}
        columns={provCols}
        searchKey="provider_key"
        searchPlaceholder="Search providers…"
        isLoading={providersLoading}
        canWrite={canWrite}
        onCreateClick={openProvCreate}
        createLabel="Add Provider"
        rowActions={provActions}
        emptyMessage="No provider permissions configured."
      />

      {/* Scope modal */}
      <ConsoleFormModal
        open={!!scopeModal}
        onClose={() => setScopeModal(null)}
        title={scopeModal?.mode === "edit" ? "Edit Scope" : "Add Scope"}
        fields={[
          { key: "app_id", label: "App", type: "select", options: appOptions, required: true },
          { key: "scope_key", label: "Scope Key", placeholder: "e.g. media.generate", required: true, pattern: SLUG_RE, patternMessage: "Lowercase slug" },
          { key: "status", label: "Status", type: "select", options: [{ label: "Requested", value: "requested" }, { label: "Approved", value: "approved" }, { label: "Denied", value: "denied" }] },
          { key: "notes", label: "Notes", placeholder: "Optional notes" },
        ]}
        values={scopeForm}
        onChange={(k, v) => setScopeForm((p) => ({ ...p, [k]: v }))}
        onSubmit={submitScope}
        isSubmitting={scopeSubmitting}
        errors={scopeErrors}
      />

      {/* Provider modal */}
      <ConsoleFormModal
        open={!!provModal}
        onClose={() => setProvModal(null)}
        title={provModal?.mode === "edit" ? "Edit Provider Permission" : "Add Provider Permission"}
        fields={[
          { key: "app_id", label: "App", type: "select", options: appOptions, required: true },
          { key: "provider_key", label: "Provider Key", placeholder: "e.g. openai, gemini", required: true },
          { key: "is_active", label: "Active", type: "checkbox" },
        ]}
        values={provForm}
        onChange={(k, v) => setProvForm((p) => ({ ...p, [k]: v }))}
        onSubmit={submitProv}
        isSubmitting={provSubmitting}
        errors={provErrors}
      />

      {/* Delete dialogs */}
      <ConsoleDeleteDialog
        open={!!scopeDelete}
        onClose={() => setScopeDelete(null)}
        onConfirm={deleteScope}
        isDeleting={scopeDeleting}
        itemName="scope"
      />
      <ConsoleDeleteDialog
        open={!!provDelete}
        onClose={() => setProvDelete(null)}
        onConfirm={deleteProv}
        isDeleting={provDeleting}
        itemName="provider permission"
      />
    </DocsPage>
  );
}
