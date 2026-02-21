import { ReactNode, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

export interface RowAction<T> {
  label: string;
  onClick: (row: T) => void;
  destructive?: boolean;
}

interface ConsoleDataTableProps<T extends { id?: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
  rowActions?: RowAction<T>[];
  onCreateClick?: () => void;
  createLabel?: string;
  canWrite?: boolean;
  isLoading?: boolean;
  statusFilter?: { key: keyof T; options: string[] };
  emptyMessage?: string;
}

export function ConsoleDataTable<T extends { id?: string }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search…",
  rowActions,
  onCreateClick,
  createLabel = "Create",
  canWrite = false,
  isLoading = false,
  statusFilter,
  emptyMessage = "No data found.",
}: ConsoleDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  let filtered = data;
  if (search && searchKey) {
    const q = search.toLowerCase();
    filtered = filtered.filter((row) => {
      const val = row[searchKey];
      return typeof val === "string" && val.toLowerCase().includes(q);
    });
  }
  if (statusFilter && filterStatus !== "all") {
    filtered = filtered.filter((row) => String(row[statusFilter.key]) === filterStatus);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm h-9"
          />
        </div>
        {statusFilter && (
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border border-white/10 bg-white/5 text-white text-sm px-3"
          >
            <option value="all">All statuses</option>
            {statusFilter.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}
        {canWrite && onCreateClick && (
          <Button
            onClick={onCreateClick}
            size="sm"
            variant="accent"
            className="ml-auto gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {createLabel}
          </Button>
        )}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {isLoading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">{emptyMessage}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map((col, i) => (
                  <th key={i} className={`text-left text-white/50 font-medium px-4 py-3 ${col.className || ""}`}>
                    {col.header}
                  </th>
                ))}
                {rowActions && rowActions.length > 0 && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, ri) => (
                <tr key={row.id || ri} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {columns.map((col, ci) => (
                    <td key={ci} className={`px-4 py-3 text-white/80 ${col.className || ""}`}>
                      {typeof col.accessor === "function"
                        ? col.accessor(row)
                        : String(row[col.accessor] ?? "—")}
                    </td>
                  ))}
                  {rowActions && rowActions.length > 0 && (
                    <td className="px-2 py-3">
                      {canWrite ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10">
                            {rowActions.map((action) => (
                              <DropdownMenuItem
                                key={action.label}
                                onClick={() => action.onClick(row)}
                                className={`text-sm ${action.destructive ? "text-red-400" : "text-white/80"}`}
                              >
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
