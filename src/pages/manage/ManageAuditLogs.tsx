import { useState } from "react";
import { format } from "date-fns";
import {
  ScrollText, Search, Filter, RefreshCw, User, ChevronDown,
  ChevronRight, ExternalLink,
} from "lucide-react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuditLogsList, useAuditLogFilters, type AuditLogRecord } from "@/hooks/manage/useManageAuditLogs";

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    create: "bg-[hsl(160,84%,45%/0.15)] text-[hsl(160,84%,45%)] border-[hsl(160,84%,45%/0.3)]",
    update: "bg-[hsl(210,60%,50%/0.15)] text-[hsl(210,60%,60%)] border-[hsl(210,60%,50%/0.3)]",
    delete: "bg-[hsl(0,72%,51%/0.15)] text-[hsl(0,72%,51%)] border-[hsl(0,72%,51%/0.3)]",
  };
  const base = action.split("_")[0]?.toLowerCase() ?? "";
  const cls = colorMap[base] ?? "bg-[hsl(var(--admin-surface-elevated)/0.5)] text-[hsl(var(--admin-text-muted))] border-[hsl(var(--admin-border)/0.3)]";
  return <Badge variant="outline" className={`text-[10px] ${cls}`}>{action}</Badge>;
}

function LogDetailRow({ log }: { log: AuditLogRecord }) {
  const [open, setOpen] = useState(false);
  const hasDetail = log.old_data || log.new_data;

  return (
    <>
      <TableRow className="border-[hsl(var(--admin-border)/0.2)] hover:bg-[hsl(var(--admin-surface-elevated)/0.3)]">
        <TableCell>
          <span className="text-xs text-[hsl(var(--admin-text-muted))]">
            {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
          </span>
        </TableCell>
        <TableCell><ActionBadge action={log.action} /></TableCell>
        <TableCell>
          <span className="text-xs text-[hsl(var(--admin-text))]">{log.entity_type}</span>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-[hsl(var(--admin-text-muted))]" />
            <span className="text-xs text-[hsl(var(--admin-text-muted))] truncate max-w-[120px]">
              {log.user_display_name ?? log.user_id?.slice(0, 8) ?? "system"}
            </span>
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <span className="text-[11px] text-[hsl(var(--admin-text-muted))] font-mono truncate max-w-[100px] block">
            {log.entity_id?.slice(0, 8) ?? "—"}
          </span>
        </TableCell>
        <TableCell>
          {hasDetail && (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <button className="p-1 rounded hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] text-[hsl(var(--admin-text-muted))]">
                  {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </TableCell>
      </TableRow>
      {hasDetail && open && (
        <TableRow className="border-[hsl(var(--admin-border)/0.1)]">
          <TableCell colSpan={6} className="py-2 px-4">
            <div className="grid gap-2 sm:grid-cols-2 text-[11px] font-mono">
              {log.old_data && (
                <div>
                  <p className="text-[hsl(var(--admin-text-muted))] mb-1 font-sans text-[10px] uppercase tracking-wider">Previous</p>
                  <pre className="bg-[hsl(var(--admin-surface-elevated)/0.4)] rounded-lg p-2 overflow-auto max-h-32 text-[hsl(var(--admin-text-muted))]">
                    {JSON.stringify(log.old_data, null, 2)}
                  </pre>
                </div>
              )}
              {log.new_data && (
                <div>
                  <p className="text-[hsl(var(--admin-text-muted))] mb-1 font-sans text-[10px] uppercase tracking-wider">New</p>
                  <pre className="bg-[hsl(var(--admin-surface-elevated)/0.4)] rounded-lg p-2 overflow-auto max-h-32 text-[hsl(var(--admin-text-muted))]">
                    {JSON.stringify(log.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function ManageAuditLogs() {
  const [action, setAction] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const debouncedSearch = search.length >= 2 ? search : null;
  const { data: logs, isLoading, isFetching, refetch } = useAuditLogsList({
    action,
    entityType,
    search: debouncedSearch,
    limit,
    offset: page * limit,
  });
  const { data: filters } = useAuditLogFilters();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Audit Logs"
        description="Complete record of administrative actions across the platform"
      />

      <AdminGlassCard>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[hsl(var(--admin-text-muted))]" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8 h-8 w-[180px] text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))]"
              />
            </div>
            <Select value={action ?? "all"} onValueChange={(v) => { setAction(v === "all" ? null : v); setPage(0); }}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {(filters?.actions ?? []).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityType ?? "all"} onValueChange={(v) => { setEntityType(v === "all" ? null : v); setPage(0); }}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(filters?.entity_types ?? []).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] transition-colors text-[hsl(var(--admin-text-muted))]"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !logs || logs.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <ScrollText className="h-8 w-8 text-[hsl(var(--admin-text-muted))]" />
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">No audit logs found</p>
            <p className="text-xs text-[hsl(var(--admin-text-muted))]">Logs will appear here as administrative actions are performed</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-[hsl(var(--admin-border)/0.3)] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--admin-border)/0.3)] hover:bg-transparent">
                    <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Time</TableHead>
                    <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Action</TableHead>
                    <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs">Entity</TableHead>
                    <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs hidden md:table-cell">User</TableHead>
                    <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs hidden lg:table-cell">ID</TableHead>
                    <TableHead className="text-[hsl(var(--admin-text-muted))] text-xs w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <LogDetailRow key={log.id} log={log} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-[hsl(var(--admin-text-muted))]">
                Showing {page * limit + 1}–{page * limit + logs.length}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="text-xs px-3 py-1 rounded-md border border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={logs.length < limit}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs px-3 py-1 rounded-md border border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </AdminGlassCard>
    </div>
  );
}
