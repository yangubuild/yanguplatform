import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef, RowAction } from "@/components/developers/console/ConsoleDataTable";
import { ConsoleFormModal, ConsoleDeleteDialog } from "@/components/developers/console/ConsoleFormModal";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WidgetRow {
  id: string;
  app_id: string;
  widget_key: string;
  title: string;
  description: string | null;
  iframe_url: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const SLUG_RE = /^[a-z0-9_-]+$/;

export default function ConsoleWidgets() {
  const { activeOrg, isLoading: orgLoading, canRead, canWrite } = useOrgRole();
  const qc = useQueryClient();

  const { data: apps = [] } = useQuery({
    queryKey: ["dev-apps-list"],
    queryFn: async () => {
      const { data } = await supabase.from("developer_apps").select("id, name").order("name");
      return data ?? [];
    },
    enabled: canRead,
  });

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ["dev-widgets", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("developer_widget_registry").select("*").order("widget_key");
      return (data ?? []) as WidgetRow[];
    },
    enabled: canRead,
  });

  const [modal, setModal] = useState<{ mode: "create" | "edit"; row?: WidgetRow } | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [delRow, setDelRow] = useState<WidgetRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm({ app_id: apps[0]?.id || "", widget_key: "", title: "", description: "", iframe_url: "", is_enabled: false });
    setErrors({});
    setModal({ mode: "create" });
  };

  const openEdit = (row: WidgetRow) => {
    setForm({ app_id: row.app_id, widget_key: row.widget_key, title: row.title, description: row.description || "", iframe_url: row.iframe_url, is_enabled: row.is_enabled });
    setErrors({});
    setModal({ mode: "edit", row });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.widget_key || !SLUG_RE.test(String(form.widget_key))) errs.widget_key = "Required, lowercase slug (a-z, 0-9, dash, underscore)";
    if (!form.title) errs.title = "Required";
    if (!form.iframe_url) errs.iframe_url = "Required";
    if (!form.app_id) errs.app_id = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (modal?.mode === "create") {
        const { error } = await supabase.from("developer_widget_registry").insert({
          app_id: String(form.app_id),
          widget_key: String(form.widget_key),
          title: String(form.title),
          description: String(form.description || "") || null,
          iframe_url: String(form.iframe_url),
          is_enabled: !!form.is_enabled,
        });
        if (error) throw error;
        toast({ title: "Widget created" });
      } else if (modal?.row) {
        const { error } = await supabase.from("developer_widget_registry")
          .update({
            title: String(form.title),
            description: String(form.description || "") || null,
            iframe_url: String(form.iframe_url),
            is_enabled: !!form.is_enabled,
          })
          .eq("id", modal.row.id);
        if (error) throw error;
        toast({ title: "Widget updated" });
      }
      qc.invalidateQueries({ queryKey: ["dev-widgets"] });
      setModal(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleEnabled = async (row: WidgetRow) => {
    const newVal = !row.is_enabled;
    try {
      const { error } = await supabase.from("developer_widget_registry")
        .update({ is_enabled: newVal })
        .eq("id", row.id);
      if (error) throw error;
      toast({ title: newVal ? "Widget published (enabled)" : "Widget unpublished (disabled)" });
      qc.invalidateQueries({ queryKey: ["dev-widgets"] });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!delRow) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("developer_widget_registry").delete().eq("id", delRow.id);
      if (error) throw error;
      toast({ title: "Widget deleted" });
      qc.invalidateQueries({ queryKey: ["dev-widgets"] });
      setDelRow(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Widgets" title="Widget Registry" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Widgets" title="Widget Registry" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-white/50 text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const cols: ColumnDef<WidgetRow>[] = [
    { header: "Key", accessor: "widget_key" },
    { header: "Title", accessor: "title" },
    {
      header: "Published",
      accessor: (r) => (
        <div className="flex items-center gap-2">
          {canWrite ? (
            <Switch
              checked={r.is_enabled}
              onCheckedChange={() => toggleEnabled(r)}
              className="data-[state=checked]:bg-green-500"
            />
          ) : (
            <Badge className={`text-xs ${r.is_enabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/10 text-white/50 border-white/20"}`}>
              {r.is_enabled ? "Published" : "Draft"}
            </Badge>
          )}
          <span className="text-xs text-white/40">{r.is_enabled ? "Published" : "Draft"}</span>
        </div>
      ),
    },
    { header: "Created", accessor: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const rowActions: RowAction<WidgetRow>[] = [
    { label: "Edit", onClick: openEdit },
    { label: "Delete", onClick: (r) => setDelRow(r), destructive: true },
  ];

  const appOptions = apps.map((a) => ({ label: a.name, value: a.id }));

  return (
    <DocsPage breadcrumb="Console › Widgets" title="Widget Registry" subtitle="Registered widgets and their configuration.">
      <ConsoleDataTable
        data={widgets}
        columns={cols}
        searchKey="widget_key"
        searchPlaceholder="Search widgets…"
        isLoading={isLoading}
        canWrite={canWrite}
        onCreateClick={openCreate}
        createLabel="Add Widget"
        rowActions={rowActions}
        statusFilter={{ key: "is_enabled" as keyof WidgetRow, options: ["true", "false"] }}
        emptyMessage="No widgets registered."
      />

      <ConsoleFormModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Widget" : "Add Widget"}
        fields={[
          { key: "app_id", label: "App", type: "select", options: appOptions, required: true },
          { key: "widget_key", label: "Widget Key", placeholder: "e.g. ada_image_gemini", required: true },
          { key: "title", label: "Title", placeholder: "Widget title", required: true },
          { key: "description", label: "Description", placeholder: "Optional description" },
          { key: "iframe_url", label: "iFrame URL", placeholder: "https://...", required: true },
          { key: "is_enabled", label: "Published", type: "checkbox" },
        ]}
        values={form}
        onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))}
        onSubmit={submit}
        isSubmitting={submitting}
        errors={errors}
      />

      <ConsoleDeleteDialog
        open={!!delRow}
        onClose={() => setDelRow(null)}
        onConfirm={doDelete}
        isDeleting={deleting}
        itemName="widget"
      />
    </DocsPage>
  );
}
