import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, Check, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const riskColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  high: "bg-red-500/10 text-red-400",
};

const statusColors: Record<string, string> = {
  requested: "bg-blue-500/10 text-blue-400",
  granted: "bg-green-500/10 text-green-400",
  denied: "bg-red-500/10 text-red-400",
};

export default function ConsoleAppPermissions({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [showScopeList, setShowScopeList] = useState(false);

  const { data: appScopes, isLoading: scopesLoading } = useQuery({
    queryKey: ["app-scopes", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_app_scopes")
        .select("*")
        .eq("app_id", appId);
      if (error) throw error;
      return data;
    },
  });

  const { data: registry } = useQuery({
    queryKey: ["scope-registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_scope_registry")
        .select("*")
        .eq("is_enabled", true)
        .order("category")
        .order("scope_key");
      if (error) throw error;
      return data;
    },
  });

  const requestScope = useMutation({
    mutationFn: async (scopeKey: string) => {
      const { error } = await supabase.from("developer_app_scopes").insert({
        app_id: appId,
        scope_key: scopeKey,
        status: "requested",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Scope requested");
      queryClient.invalidateQueries({ queryKey: ["app-scopes", appId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const requestedKeys = new Set(appScopes?.map((s) => s.scope_key) || []);

  const granted = appScopes?.filter((s) => s.status === "granted") || [];
  const requested = appScopes?.filter((s) => s.status === "requested") || [];
  const denied = appScopes?.filter((s) => s.status === "denied") || [];

  const groupedRegistry = registry?.reduce((acc, scope) => {
    if (!acc[scope.category]) acc[scope.category] = [];
    acc[scope.category].push(scope);
    return acc;
  }, {} as Record<string, typeof registry>) || {};

  return (
    <div>
      {/* Granted scopes */}
      <div className="mb-8">
        <h3 className="text-foreground text-sm font-semibold mb-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" /> Granted ({granted.length})
        </h3>
        {granted.length> 0 ? (
          <div className="space-y-2">
            {granted.map((s) => {
              const reg = registry?.find((r) => r.scope_key === s.scope_key);
              return (
                <ScopeRow key={s.scope_key} scopeKey={s.scope_key} description={reg?.description} riskLevel={reg?.risk_level} status="granted" />
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No scopes granted yet.</p>
        )}
      </div>

      {/* Requested scopes */}
      {requested.length> 0 && (
        <div className="mb-8">
          <h3 className="text-foreground text-sm font-semibold mb-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400" /> Pending ({requested.length})
          </h3>
          <div className="space-y-2">
            {requested.map((s) => {
              const reg = registry?.find((r) => r.scope_key === s.scope_key);
              return (
                <ScopeRow key={s.scope_key} scopeKey={s.scope_key} description={reg?.description} riskLevel={reg?.risk_level} status="requested" />
              );
            })}
          </div>
        </div>
      )}

      {/* Denied scopes */}
      {denied.length> 0 && (
        <div className="mb-8">
          <h3 className="text-foreground text-sm font-semibold mb-3 flex items-center gap-2">
            <X className="w-4 h-4 text-red-400" /> Denied ({denied.length})
          </h3>
          <div className="space-y-2">
            {denied.map((s) => {
              const reg = registry?.find((r) => r.scope_key === s.scope_key);
              return (
                <ScopeRow key={s.scope_key} scopeKey={s.scope_key} description={reg?.description} riskLevel={reg?.risk_level} status="denied" notes={s.notes} />
              );
            })}
          </div>
        </div>
      )}

      {/* Request more scopes */}
      <div className="mt-6">
        <button
          onClick={() => setShowScopeList(!showScopeList)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground"
          style={{ background: "rgba(255,255,255,0.08)" }}>
          <Plus className="w-3 h-3" /> Request Scopes
        </button>

        {showScopeList && registry && (
          <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {Object.entries(groupedRegistry).map(([category, scopes]) => (
              <div key={category} className="mb-4 last:mb-0">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{category}</h4>
                <div className="space-y-1">
                  {scopes.map((scope) => {
                    const alreadyRequested = requestedKeys.has(scope.scope_key);
                    return (
                      <div
                        key={scope.scope_key}
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="flex-1">
                          <code className="text-xs text-muted-foreground font-mono">{scope.scope_key}</code>
                          <p className="text-xs text-muted-foreground mt-0.5">{scope.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${riskColors[scope.risk_level]}`}>
                              {scope.risk_level}
                            </span>
                            {scope.requires_review && (
                              <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Requires review
                              </span>
                            )}
                          </div>
                        </div>
                        {alreadyRequested ? (
                          <span className="text-xs text-muted-foreground">Added</span>
                        ) : (
                          <button
                            onClick={() => requestScope.mutate(scope.scope_key)}
                            disabled={requestScope.isPending}
                            className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground"
                            style={{ background: "rgba(255,255,255,0.06)" }}>
                            Request
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeRow({ scopeKey, description, riskLevel, status, notes }: {
  scopeKey: string;
  description?: string;
  riskLevel?: string;
  status: string;
  notes?: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div>
        <code className="text-xs text-muted-foreground font-mono">{scopeKey}</code>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        {notes && <p className="text-xs text-red-400/60 mt-1 italic">{notes}</p>}
      </div>
      <div className="flex items-center gap-2">
        {riskLevel && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${riskColors[riskLevel] || ""}`}>{riskLevel}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status] || ""}`}>{status}</span>
      </div>
    </div>
  );
}
