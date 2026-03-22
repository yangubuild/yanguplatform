import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgRole } from "@/hooks/useOrgRole";
import { DocsPage } from "@/components/developers/DocsPage";
import { ConsoleDataTable, ColumnDef, RowAction } from "@/components/developers/console/ConsoleDataTable";
import { ConsoleFormModal, ConsoleDeleteDialog } from "@/components/developers/console/ConsoleFormModal";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RateLimitConfig {
  id: string;
  app_id: string;
  bucket_key: string;
  max_requests: number;
  window_seconds: number;
  created_at: string;
  updated_at: string;
}

const SLUG_RE = /^[a-z0-9_-]+$/;

export default function ConsoleRuntime() {
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

  const { data: limits = [], isLoading } = useQuery({
    queryKey: ["dev-rate-limits", activeOrg?.id],
    queryFn: async () => {
      const { data } = await supabase.from("developer_rate_limit_config").select("*").order("bucket_key");
      return (data ?? []) as RateLimitConfig[];
    },
    enabled: canRead,
  });

  const [modal, setModal] = useState<{ mode: "create" | "edit"; row?: RateLimitConfig } | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [delRow, setDelRow] = useState<RateLimitConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setForm({ app_id: apps[0]?.id || "", bucket_key: "", max_requests: 100, window_seconds: 60 });
    setErrors({});
    setModal({ mode: "create" });
  };

  const openEdit = (row: RateLimitConfig) => {
    setForm({ app_id: row.app_id, bucket_key: row.bucket_key, max_requests: row.max_requests, window_seconds: row.window_seconds });
    setErrors({});
    setModal({ mode: "edit", row });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.bucket_key || !SLUG_RE.test(String(form.bucket_key))) errs.bucket_key = "Required, lowercase slug format";
    if (!form.app_id) errs.app_id = "Required";
    if (!form.max_requests || Number(form.max_requests) <= 0) errs.max_requests = "Must be> 0";
    if (!form.window_seconds || Number(form.window_seconds) <= 0) errs.window_seconds = "Must be> 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (modal?.mode === "create") {
        const { error } = await supabase.from("developer_rate_limit_config").insert({
          app_id: String(form.app_id),
          bucket_key: String(form.bucket_key),
          max_requests: Number(form.max_requests),
          window_seconds: Number(form.window_seconds),
        });
        if (error) throw error;
        toast({ title: "Rate limit rule created" });
      } else if (modal?.row) {
        const { error } = await supabase.from("developer_rate_limit_config")
          .update({
            bucket_key: String(form.bucket_key),
            max_requests: Number(form.max_requests),
            window_seconds: Number(form.window_seconds),
          })
          .eq("id", modal.row.id);
        if (error) throw error;
        toast({ title: "Rate limit rule updated" });
      }
      qc.invalidateQueries({ queryKey: ["dev-rate-limits"] });
      setModal(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const doDelete = async () => {
    if (!delRow) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("developer_rate_limit_config").delete().eq("id", delRow.id);
      if (error) throw error;
      toast({ title: "Rate limit rule deleted" });
      qc.invalidateQueries({ queryKey: ["dev-rate-limits"] });
      setDelRow(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (orgLoading) {
    return (
      <DocsPage breadcrumb="Console › Runtime" title="Runtime" subtitle="">
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </DocsPage>
    );
  }

  if (!canRead) {
    return (
      <DocsPage breadcrumb="Console › Runtime" title="Runtime" subtitle="">
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.10)" }}>
          <p className="text-muted-foreground text-sm">You don't have permission to access this page.</p>
        </div>
      </DocsPage>
    );
  }

  const cols: ColumnDef<RateLimitConfig>[] = [
    { header: "Bucket", accessor: "bucket_key" },
    { header: "Max Requests", accessor: (r) => String(r.max_requests) },
    { header: "Window", accessor: (r) => `${r.window_seconds}s` },
    { header: "Updated", accessor: (r) => new Date(r.updated_at).toLocaleDateString() },
  ];

  const rowActions: RowAction<RateLimitConfig>[] = [
    { label: "Edit", onClick: openEdit },
    { label: "Delete", onClick: (r) => setDelRow(r), destructive: true },
  ];

  const appOptions = apps.map((a) => ({ label: a.name, value: a.id }));

  return (
    <DocsPage breadcrumb="Console › Runtime" title="Runtime" subtitle="Rate limit rules and execution configuration.">
      <ConsoleDataTable
        data={limits}
        columns={cols}
        searchKey="bucket_key"
        searchPlaceholder="Search buckets…"
        isLoading={isLoading}
        canWrite={canWrite}
        onCreateClick={openCreate}
        createLabel="Add Rule"
        rowActions={rowActions}
        emptyMessage="No rate limit rules configured."
      />

      <ConsoleFormModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Edit Rate Limit" : "Add Rate Limit"}
        fields={[
          { key: "app_id", label: "App", type: "select", options: appOptions, required: true },
          { key: "bucket_key", label: "Bucket Key", placeholder: "e.g. image, video", required: true },
          { key: "max_requests", label: "Max Requests", type: "number", min: 1, required: true },
          { key: "window_seconds", label: "Window (seconds)", type: "number", min: 1, required: true },
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
        itemName="rate limit rule"
      />
    </DocsPage>
  );
}
