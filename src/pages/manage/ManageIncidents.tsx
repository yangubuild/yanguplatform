import { useState } from "react";
import { AdminGlassCard, AdminMetricCard } from "@/components/manage/AdminGlassCard";
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle, Plus, MoreHorizontal, Eye, CheckCircle2,
  Search, Shield, Flame, Bug, ServerCrash,
} from "lucide-react";
import { useManageIncidents, useIncidentUpsert, type Incident } from "@/hooks/manage/useManageIncidents";
import { toast } from "sonner";

const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"] as const;
const STATUS_OPTIONS = ["open", "investigating", "mitigated", "resolved"] as const;
const SYSTEM_OPTIONS = ["auth", "payments", "kyc", "builder", "ai", "storage", "email", "domains", "other"] as const;

const severityColor: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ManageIncidents() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  // Create form state
  const [form, setForm] = useState({ title: "", description: "", severity: "medium", status: "open", affected_system: "" });

  const { data: incidents = [], isLoading } = useManageIncidents(
    filterStatus === "all" ? null : filterStatus,
    filterSeverity === "all" ? null : filterSeverity
  );
  const upsert = useIncidentUpsert();

  const openCount = incidents.filter((i) => i.status === "open" || i.status === "investigating").length;
  const critCount = incidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length;

  const handleCreate = () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    upsert.mutate(
      { title: form.title, description: form.description, severity: form.severity, status: form.status, affected_system: form.affected_system || undefined },
      {
        onSuccess: () => {
          toast.success("Incident created");
          setShowCreate(false);
          setForm({ title: "", description: "", severity: "medium", status: "open", affected_system: "" });
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleStatusChange = (incident: Incident, newStatus: string) => {
    upsert.mutate(
      { id: incident.id, title: incident.title, severity: incident.severity, status: newStatus },
      {
        onSuccess: () => toast.success(`Incident ${newStatus}`),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const columns: AdminColumn<Incident>[] = [
    {
      key: "severity",
      header: "",
      render: (r) => (
        <Badge variant="outline" className={`text-[10px] ${severityColor[r.severity] ?? ""}`}>
          {r.severity.toUpperCase()}
        </Badge>
      ),
    },
    { key: "title", header: "Title", render: (r) => <span className="text-sm font-medium text-foreground">{r.title}</span> },
    { key: "affected_system", header: "System", render: (r) => <span className="text-xs text-muted-foreground capitalize">{r.affected_system ?? "—"}</span> },
    { key: "status", header: "Status", render: (r) => <AdminStatusBadge status={r.status} /> },
    { key: "reporter_username", header: "Reporter", render: (r) => <span className="text-xs text-muted-foreground">{r.reporter_username ? `@${r.reporter_username}` : r.reporter_email ?? "—"}</span> },
    { key: "created_at", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span> },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelected(r)}><Eye className="mr-2 h-3.5 w-3.5" />View</DropdownMenuItem>
            {r.status === "open" && <DropdownMenuItem onClick={() => handleStatusChange(r, "investigating")}><Search className="mr-2 h-3.5 w-3.5" />Start Investigation</DropdownMenuItem>}
            {r.status === "investigating" && <DropdownMenuItem onClick={() => handleStatusChange(r, "mitigated")}><Shield className="mr-2 h-3.5 w-3.5" />Mark Mitigated</DropdownMenuItem>}
            {r.status !== "resolved" && <DropdownMenuItem onClick={() => handleStatusChange(r, "resolved")}><CheckCircle2 className="mr-2 h-3.5 w-3.5 text-success" />Resolve</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminMetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Total Incidents" value={incidents.length} />
        <AdminMetricCard icon={<Flame className="h-4 w-4" />} label="Open" value={openCount} />
        <AdminMetricCard icon={<ServerCrash className="h-4 w-4" />} label="Critical" value={critCount} />
        <AdminMetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Resolved" value={incidents.filter((i) => i.status === "resolved").length} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {SEVERITY_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowCreate(true)} className="ml-auto gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Incident
        </Button>
      </div>

      {/* Table */}
      <AdminTable columns={columns} data={incidents} loading={isLoading} rowKey={(r) => r.id} />

      {/* Create Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Incident</SheetTitle>
            <SheetDescription>Log a new platform incident</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>{SEVERITY_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.affected_system || "other"} onValueChange={(v) => setForm((f) => ({ ...f, affected_system: v }))}>
                <SelectTrigger><SelectValue placeholder="System" /></SelectTrigger>
                <SelectContent>{SYSTEM_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={upsert.isPending} className="w-full">
              {upsert.isPending ? "Creating…" : "Create Incident"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selected?.title}</SheetTitle>
            <SheetDescription>Incident Detail</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Severity</p>
                  <Badge variant="outline" className={severityColor[selected.severity]}>{selected.severity}</Badge>
                </div>
                <div><p className="text-muted-foreground text-xs">Status</p><AdminStatusBadge status={selected.status} /></div>
                <div><p className="text-muted-foreground text-xs">System</p><p className="capitalize">{selected.affected_system ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Created</p><p>{formatDate(selected.created_at)}</p></div>
                <div><p className="text-muted-foreground text-xs">Reporter</p><p>{selected.reporter_username ? `@${selected.reporter_username}` : selected.reporter_email ?? "—"}</p></div>
                <div><p className="text-muted-foreground text-xs">Resolved</p><p>{formatDate(selected.resolved_at)}</p></div>
              </div>
              {selected.description && (
                <AdminGlassCard className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
                </AdminGlassCard>
              )}
              <div className="flex gap-2 pt-2 flex-wrap">
                {selected.status === "open" && <Button size="sm" onClick={() => { handleStatusChange(selected, "investigating"); setSelected(null); }}>Start Investigation</Button>}
                {selected.status === "investigating" && <Button size="sm" onClick={() => { handleStatusChange(selected, "mitigated"); setSelected(null); }}>Mark Mitigated</Button>}
                {selected.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => { handleStatusChange(selected, "resolved"); setSelected(null); }}>Resolve</Button>}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
