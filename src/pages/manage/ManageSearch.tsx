import { useState } from "react";
import { Search, Users, Layers, AlertTriangle, Headset, ExternalLink } from "lucide-react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGlobalSearch, type SearchResult } from "@/hooks/manage/useManageGlobalSearch";
import { useNavigate } from "react-router-dom";

const TYPE_CONFIG: Record<string, { icon: typeof Users; color: string; route: string }> = {
  user: { icon: Users, color: "text-blue-400", route: "/management/users" },
  surface: { icon: Layers, color: "text-[hsl(160,84%,45%)]", route: "/management/surfaces" },
  incident: { icon: AlertTriangle, color: "text-orange-500", route: "/management/incidents" },
  ticket: { icon: Headset, color: "text-yellow-500", route: "/management/support" },
};

function ResultCard({ result }: { result: SearchResult }) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[result.type] ?? TYPE_CONFIG.user;
  const Icon = config.icon;

  return (
    <button onClick={() => navigate(config.route)}
      className="w-full text-left rounded-lg border border-[hsl(var(--admin-border)/0.3)] p-3 hover:bg-[hsl(var(--admin-surface-elevated)/0.5)] transition-colors flex items-center gap-3">
      <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[hsl(var(--admin-text))] truncate">{result.title}</p>
        {result.subtitle && <p className="text-xs text-[hsl(var(--admin-text-muted))] truncate">{result.subtitle}</p>}
      </div>
      <Badge variant="outline" className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))] capitalize shrink-0">
        {result.type}
      </Badge>
      <ExternalLink className="h-3 w-3 text-[hsl(var(--admin-text-muted))] shrink-0" />
    </button>
  );
}

export default function ManageSearch() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGlobalSearch(query);

  const allResults: SearchResult[] = data
    ? [...(data.users ?? []), ...(data.surfaces ?? []), ...(data.incidents ?? []), ...(data.tickets ?? [])]
    : [];

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Global Search" description="Search across users, surfaces, incidents, and tickets" />

      <AdminGlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--admin-text-muted))]" />
          <Input
            placeholder="Search users, surfaces, incidents, tickets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 h-10 text-sm bg-[hsl(var(--admin-surface-elevated)/0.5)] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text))] placeholder:text-[hsl(var(--admin-text-muted))]"
            autoFocus
          />
        </div>
      </AdminGlassCard>

      {query.length < 2 ? (
        <AdminGlassCard className="p-8 text-center">
          <Search className="h-10 w-10 text-[hsl(var(--admin-text-muted))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Type at least 2 characters to search</p>
        </AdminGlassCard>
      ) : isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : allResults.length === 0 ? (
        <AdminGlassCard className="p-8 text-center">
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">No results found for "{query}"</p>
        </AdminGlassCard>
      ) : (
        <div className="space-y-4">
          {data?.users && data.users.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider mb-2">Users ({data.users.length})</h3>
              <div className="space-y-1.5">{data.users.map((r) => <ResultCard key={r.id} result={r} />)}</div>
            </div>
          )}
          {data?.surfaces && data.surfaces.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider mb-2">Surfaces ({data.surfaces.length})</h3>
              <div className="space-y-1.5">{data.surfaces.map((r) => <ResultCard key={r.id} result={r} />)}</div>
            </div>
          )}
          {data?.incidents && data.incidents.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider mb-2">Incidents ({data.incidents.length})</h3>
              <div className="space-y-1.5">{data.incidents.map((r) => <ResultCard key={r.id} result={r} />)}</div>
            </div>
          )}
          {data?.tickets && data.tickets.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--admin-text-muted))] uppercase tracking-wider mb-2">Tickets ({data.tickets.length})</h3>
              <div className="space-y-1.5">{data.tickets.map((r) => <ResultCard key={r.id} result={r} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
