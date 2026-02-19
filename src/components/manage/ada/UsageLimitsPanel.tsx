import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { AdaGlassModule } from "./AdaGlassModule";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RotateCcw, Gauge } from "lucide-react";

interface QuotaRow {
  key: string;
  free_limit: number;
  starter_limit: number;
  creator_limit: number | null;
  reset_days: number;
  is_enabled: boolean;
}

interface UserUsage {
  quota_key: string;
  used_count: number;
  locked_until: string | null;
  period_started_at: string;
}

const QUOTA_LABELS: Record<string, string> = {
  ada_image: "ADA Image Limits",
  yangu_image: "YANGU Image Limits",
  yangu_video: "YANGU Video Limits",
};

export function UsageLimitsPanel() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<QuotaRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuotaRow>>({});
  const [usage, setUsage] = useState<UserUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: cfgs } = await supabase.from("usage_quota_config" as any).select("*");
    const { data: usg } = await supabase.from("user_usage_quotas" as any).select("*");
    const rows = (cfgs || []) as unknown as QuotaRow[];
    setConfigs(rows);
    const draftMap: Record<string, QuotaRow> = {};
    rows.forEach(r => { draftMap[r.key] = { ...r }; });
    setDrafts(draftMap);
    setUsage((usg || []) as unknown as UserUsage[]);
    setLoading(false);
  }

  function updateDraft(key: string, field: keyof QuotaRow, value: any) {
    setDrafts(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function saveConfig(key: string) {
    const d = drafts[key];
    if (!d) return;
    setSaving(key);
    const { error } = await supabase.rpc("admin_update_quota_config" as any, {
      p_key: key,
      p_free_limit: d.free_limit,
      p_starter_limit: d.starter_limit,
      p_creator_limit: d.creator_limit,
      p_reset_days: d.reset_days,
      p_is_enabled: d.is_enabled,
    });
    setSaving(null);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${QUOTA_LABELS[key] || key} updated` });
      loadData();
    }
  }

  async function resetMyUsage(quotaKey: string) {
    if (!user) return;
    const { error } = await supabase.rpc("admin_reset_user_quota" as any, {
      p_user_id: user.id,
      p_quota_key: quotaKey,
    });
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usage reset" });
      loadData();
    }
  }

  if (loading) {
    return (
      <AdaGlassModule title="Usage Limits" icon={Gauge}>
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      </AdaGlassModule>
    );
  }

  return (
    <AdaGlassModule title="Usage Limits" icon={Gauge}>
      <div className="space-y-6">
        {configs.map(cfg => {
          const d = drafts[cfg.key];
          if (!d) return null;
          const myUsage = usage.find(u => u.quota_key === cfg.key);

          return (
            <div key={cfg.key} className="space-y-3 border border-[hsl(var(--admin-border)/0.3)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[hsl(var(--admin-text))]">{QUOTA_LABELS[cfg.key] || cfg.key}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[hsl(var(--admin-text-muted))]">Enabled</span>
                  <Switch
                    checked={d.is_enabled}
                    onCheckedChange={(v) => updateDraft(cfg.key, "is_enabled", v)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-[hsl(var(--admin-text-muted))] block mb-1">Free limit</label>
                  <Input
                    type="number"
                    value={d.free_limit}
                    onChange={e => updateDraft(cfg.key, "free_limit", parseInt(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[hsl(var(--admin-text-muted))] block mb-1">Starter limit</label>
                  <Input
                    type="number"
                    value={d.starter_limit}
                    onChange={e => updateDraft(cfg.key, "starter_limit", parseInt(e.target.value) || 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[hsl(var(--admin-text-muted))] block mb-1">Creator limit</label>
                  <Input
                    type="number"
                    value={d.creator_limit ?? ""}
                    placeholder="∞"
                    onChange={e => {
                      const v = e.target.value;
                      updateDraft(cfg.key, "creator_limit", v === "" ? null : parseInt(v) || 0);
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[hsl(var(--admin-text-muted))] block mb-1">Reset days</label>
                  <Input
                    type="number"
                    value={d.reset_days}
                    onChange={e => updateDraft(cfg.key, "reset_days", parseInt(e.target.value) || 10)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* My usage */}
              {myUsage && (
                <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--admin-text-muted))]">
                  <span>Your usage: {myUsage.used_count}/{d.free_limit}</span>
                  {myUsage.locked_until && (
                    <Badge variant="outline" className="text-[9px]">
                      Locked until {new Date(myUsage.locked_until).toLocaleDateString()}
                    </Badge>
                  )}
                  <button
                    onClick={() => resetMyUsage(cfg.key)}
                    className="flex items-center gap-1 text-[10px] text-accent hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => saveConfig(cfg.key)}
                  disabled={saving === cfg.key}
                  className="h-7 text-xs gap-1"
                >
                  {saving === cfg.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </AdaGlassModule>
  );
}
