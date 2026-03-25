import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminGlassCard, AdminMetricCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, type AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  PaintBucket, Upload, CheckCircle2, XCircle, Clock, Image,
  MoreHorizontal, FileImage, Palette, Mail, Layout, Share2,
} from "lucide-react";
import { toast } from "sonner";

interface MgmtAsset {
  id: string;
  asset_type: string;
  title: string;
  description: string | null;
  file_url: string;
  thumbnail_url: string | null;
  status: string;
  tags: string[] | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  uploaded_by: string | null;
  created_at: string;
}

function useAssets(filter: string) {
  return useQuery({
    queryKey: ["manage", "design-assets", filter],
    queryFn: async () => {
      let q = supabase
        .from("management_assets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as MgmtAsset[];
    },
  });
}

const ASSET_TYPES = [
  { value: "banner", label: "Banner", icon: Image },
  { value: "template", label: "Template", icon: Layout },
  { value: "email_template", label: "Email Template", icon: Mail },
  { value: "social_template", label: "Social Template", icon: Share2 },
  { value: "landing_page", label: "Landing Page", icon: FileImage },
  { value: "general", label: "General", icon: Palette },
];

export default function ManageDesignStudio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", asset_type: "banner", file_url: "", tags: "" });
  const { data: assets = [], isLoading } = useAssets(filter);

  const uploadMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase.from("management_assets").insert({
        title: payload.title,
        description: payload.description || null,
        asset_type: payload.asset_type,
        file_url: payload.file_url,
        tags: payload.tags ? payload.tags.split(",").map((t) => t.trim()) : null,
        uploaded_by: user?.id,
        status: "pending_approval",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Asset uploaded for approval");
      queryClient.invalidateQueries({ queryKey: ["manage", "design-assets"] });
      setShowUpload(false);
      setForm({ title: "", description: "", asset_type: "banner", file_url: "", tags: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      const update = action === "approve"
        ? { status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() }
        : { status: "rejected" };
      const { error } = await supabase.from("management_assets").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Asset updated");
      queryClient.invalidateQueries({ queryKey: ["manage", "design-assets"] });
    },
  });

  const pending = assets.filter((a) => a.status === "pending_approval").length;
  const approved = assets.filter((a) => a.status === "approved").length;

  const columns: AdminColumn<MgmtAsset>[] = [
    {
      key: "title",
      header: "Asset",
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.thumbnail_url || r.file_url ? (
            <img src={r.thumbnail_url || r.file_url} alt={r.title} className="h-10 w-10 rounded object-cover border border-[hsl(var(--admin-border)/0.3)]" />
          ) : (
            <div className="h-10 w-10 rounded bg-[hsl(var(--admin-surface-elevated))] flex items-center justify-center">
              <FileImage className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{r.title}</p>
            {r.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description}</p>}
          </div>
        </div>
      ),
    },
    { key: "asset_type", header: "Type", render: (r) => <Badge variant="outline" className="text-xs capitalize">{r.asset_type.replace("_", " ")}</Badge> },
    { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status === "approved" ? "active" : r.status === "rejected" ? "inactive" : "pending"} /> },
    { key: "created_at", header: "Uploaded", render: (r) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "pending_approval" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actionMutation.mutate({ id: r.id, action: "approve" })}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actionMutation.mutate({ id: r.id, action: "reject" })}>
                <XCircle className="h-4 w-4 mr-2 text-red-500" /> Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Design Studio" description="Asset uploads, approvals, templates & brand resources" />

      <div className="grid gap-4 sm:grid-cols-4">
        <AdminMetricCard label="Total Assets" value={assets.length} icon={<PaintBucket className="h-4 w-4" />} />
        <AdminMetricCard label="Pending Approval" value={pending} icon={<Clock className="h-4 w-4" />} />
        <AdminMetricCard label="Approved" value={approved} icon={<CheckCircle2 className="h-4 w-4" />} />
        <AdminMetricCard label="Asset Types" value={ASSET_TYPES.length} icon={<Palette className="h-4 w-4" />} />
      </div>

      <AdminGlassCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4 mr-2" /> Upload Asset
          </Button>
        </div>
        <AdminTable columns={columns} data={assets} loading={isLoading} rowKey={(r) => r.id} />
      </AdminGlassCard>

      <Sheet open={showUpload} onOpenChange={setShowUpload}>
        <SheetContent>
          <SheetHeader><SheetTitle>Upload New Asset</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Asset title" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">File URL</label>
              <Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="hero, banner, dark" />
            </div>
            <Button onClick={() => uploadMutation.mutate(form)} disabled={!form.title || !form.file_url || uploadMutation.isPending} className="w-full">
              {uploadMutation.isPending ? "Uploading..." : "Submit for Approval"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
