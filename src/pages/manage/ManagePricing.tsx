import { useState, useEffect, useCallback } from "react";
import { CreditCard, Plus, Save, UserPlus, Loader2 } from "lucide-react";
import { AdminGlassCard, AdminPageHeader } from "@/components/manage/AdminGlassCard";
import { AdminTable, AdminColumn } from "@/components/manage/AdminTable";
import { AdminStatusBadge } from "@/components/manage/AdminStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ---- types ---- */
interface Plan {
  id: string;
  key: string;
  name: string;
  billing_period: string;
  is_active: boolean;
  created_at: string;
}

interface Entitlement {
  id: string;
  plan_id: string;
  asset_type: string;
  monthly_quota: number;
}

const ASSET_TYPES = ["image", "video", "poster", "influencer"] as const;

/* ---- component ---- */
export default function ManagePricing() {
  /* ---- Plans state ---- */
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  /* ---- New plan form ---- */
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  /* ---- Entitlements state ---- */
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [entLoading, setEntLoading] = useState(false);
  const [quotaDraft, setQuotaDraft] = useState<Record<string, number>>({});
  const [savingAsset, setSavingAsset] = useState<string | null>(null);

  /* ---- Assign state ---- */
  const [assignEmail, setAssignEmail] = useState("");
  const [assignPlanKey, setAssignPlanKey] = useState("");
  const [assigning, setAssigning] = useState(false);

  /* ---- Fetch plans ---- */
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    // Admin reads all plans (RLS allows admin SELECT)
    const { data, error } = await supabase
      .from("subscription_plans" as any)
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[ManagePricing] fetchPlans error:", error);
      toast({ title: "Failed to load plans", variant: "destructive" });
    } else {
      setPlans((data || []) as unknown as Plan[]);
    }
    setPlansLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ---- Create plan ---- */
  const handleCreatePlan = async () => {
    if (!newKey.trim() || !newName.trim()) return;
    setCreating(true);
    const { error } = await supabase.rpc("admin_upsert_plan" as any, {
      p_key: newKey.trim().toLowerCase(),
      p_name: newName.trim(),
      p_billing_period: "month",
      p_is_active: true,
    });
    if (error) {
      console.error("[ManagePricing] create plan error:", error);
      toast({ title: error.message || "Failed to create plan", variant: "destructive" });
    } else {
      toast({ title: `Plan "${newName}" created` });
      setNewKey("");
      setNewName("");
      await fetchPlans();
    }
    setCreating(false);
  };

  /* ---- Toggle active ---- */
  const handleToggleActive = async (plan: Plan) => {
    const { error } = await supabase.rpc("admin_upsert_plan" as any, {
      p_key: plan.key,
      p_name: plan.name,
      p_billing_period: plan.billing_period,
      p_is_active: !plan.is_active,
    });
    if (error) {
      toast({ title: "Toggle failed", variant: "destructive" });
    } else {
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
    }
  };

  /* ---- Fetch entitlements when plan selected ---- */
  useEffect(() => {
    if (!selectedPlanId) { setEntitlements([]); return; }
    let cancelled = false;
    (async () => {
      setEntLoading(true);
      const { data, error } = await supabase
        .from("plan_entitlements" as any)
        .select("*")
        .eq("plan_id", selectedPlanId);
      if (!cancelled) {
        if (error) {
          console.error("[ManagePricing] fetchEntitlements:", error);
        }
        const ents = (data || []) as unknown as Entitlement[];
        setEntitlements(ents);
        const draft: Record<string, number> = {};
        ents.forEach(e => { draft[e.asset_type] = e.monthly_quota; });
        setQuotaDraft(draft);
        setEntLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPlanId]);

  /* ---- Save entitlement ---- */
  const handleSaveEntitlement = async (assetType: string) => {
    if (!selectedPlanId) return;
    const quota = quotaDraft[assetType] ?? 0;
    setSavingAsset(assetType);
    const { error } = await supabase.rpc("admin_set_plan_entitlement" as any, {
      p_plan_id: selectedPlanId,
      p_asset_type: assetType,
      p_monthly_quota: quota,
    });
    if (error) {
      toast({ title: error.message || "Failed to save entitlement", variant: "destructive" });
    } else {
      toast({ title: `${assetType} quota set to ${quota}` });
      // Refresh
      const { data } = await supabase
        .from("plan_entitlements" as any)
        .select("*")
        .eq("plan_id", selectedPlanId);
      if (data) {
        const ents = data as unknown as Entitlement[];
        setEntitlements(ents);
        const draft: Record<string, number> = {};
        ents.forEach(e => { draft[e.asset_type] = e.monthly_quota; });
        setQuotaDraft(draft);
      }
    }
    setSavingAsset(null);
  };

  /* ---- Assign plan to user ---- */
  const handleAssign = async () => {
    if (!assignEmail.trim() || !assignPlanKey) return;
    setAssigning(true);
    const { error } = await supabase.rpc("admin_assign_user_plan_by_email" as any, {
      p_email: assignEmail.trim(),
      p_plan_key: assignPlanKey,
    });
    if (error) {
      toast({ title: error.message || "Assignment failed", variant: "destructive" });
    } else {
      toast({ title: `Plan "${assignPlanKey}" assigned to ${assignEmail}` });
      setAssignEmail("");
    }
    setAssigning(false);
  };

  /* ---- Plan table columns ---- */
  const planColumns: AdminColumn<Plan>[] = [
    { key: "key", header: "Key", render: (r) => <code className="text-xs">{r.key}</code> },
    { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "billing", header: "Period", render: (r) => r.billing_period },
    {
      key: "status",
      header: "Status",
      render: (r) => <AdminStatusBadge status={r.is_active ? "active" : "draft"} />,
    },
    {
      key: "toggle",
      header: "",
      render: (r) => (
        <Switch
          checked={r.is_active}
          onCheckedChange={() => handleToggleActive(r)}
          aria-label="Toggle active"
        />
      ),
      className: "w-16",
    },
  ];

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pricing & Subscriptions"
        description="Manage plans, entitlement quotas, and user assignments."
      />

      {/* ──────── A) Plans ──────── */}
      <AdminGlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[hsl(var(--admin-text))] flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[hsl(24,95%,53%)]" />
            Plans
          </h2>
        </div>

        {/* Create plan row */}
        <div className="flex flex-wrap items-end gap-3 mb-4 p-3 rounded-lg bg-[hsl(var(--admin-surface-elevated)/0.3)]">
          <div className="space-y-1 flex-1 min-w-[120px]">
            <Label className="text-xs text-[hsl(var(--admin-text-muted))]">Key</Label>
            <Input
              placeholder="e.g. pro"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[160px]">
            <Label className="text-xs text-[hsl(var(--admin-text-muted))]">Name</Label>
            <Input
              placeholder="e.g. Pro Plan"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={handleCreatePlan}
            disabled={creating || !newKey.trim() || !newName.trim()}
            className="gap-1.5 rounded-md">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create
          </Button>
        </div>

        <AdminTable
          columns={planColumns}
          data={plans}
          loading={plansLoading}
          rowKey={(r) => r.id}
          emptyMessage="No plans yet. Create one above."
        />

        {/* Plan selector for entitlements */}
        {plans.length> 0 && (
          <div className="mt-4 flex items-center gap-3">
            <Label className="text-sm text-[hsl(var(--admin-text-muted))]">Select plan to edit entitlements:</Label>
            <Select value={selectedPlanId || ""} onValueChange={setSelectedPlanId}>
              <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Choose plan…" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.key})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </AdminGlassCard>

      {/* ──────── B) Entitlements ──────── */}
      {selectedPlanId && (
        <AdminGlassCard>
          <h2 className="text-lg font-semibold text-[hsl(var(--admin-text))] mb-1">
            Entitlements — {selectedPlan?.name || ""}
          </h2>
          <p className="text-xs text-[hsl(var(--admin-text-muted))] mb-4">
            Set monthly quotas per asset type. Changes take effect immediately.
          </p>

          {entLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-[hsl(var(--admin-text-muted))]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {ASSET_TYPES.map(at => {
                const current = entitlements.find(e => e.asset_type === at);
                return (
                  <div
                    key={at}
                    className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface-elevated)/0.2)]">
                    <span className="text-sm font-medium capitalize flex-1 text-[hsl(var(--admin-text))]">{at}</span>
                    <Input
                      type="number"
                      min={0}
                      value={quotaDraft[at] ?? current?.monthly_quota ?? 0}
                      onChange={e => setQuotaDraft(prev => ({ ...prev, [at]: parseInt(e.target.value) || 0 }))}
                      className="w-20 h-8 text-sm text-center"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveEntitlement(at)}
                      disabled={savingAsset === at}
                      className="gap-1 rounded-md">
                      {savingAsset === at ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </AdminGlassCard>
      )}

      {/* ──────── C) Assign Plan to User ──────── */}
      <AdminGlassCard>
        <h2 className="text-lg font-semibold text-[hsl(var(--admin-text))] flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-[hsl(24,95%,53%)]" />
          Assign Plan to User
        </h2>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-xs text-[hsl(var(--admin-text-muted))]">User Email</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={assignEmail}
              onChange={e => setAssignEmail(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-xs text-[hsl(var(--admin-text-muted))]">Plan</Label>
            <Select value={assignPlanKey} onValueChange={setAssignPlanKey}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select plan…" />
              </SelectTrigger>
              <SelectContent>
                {plans.filter(p => p.is_active).map(p => (
                  <SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={assigning || !assignEmail.trim() || !assignPlanKey}
            className="gap-1.5 rounded-md">
            {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Assign
          </Button>
        </div>
      </AdminGlassCard>
    </div>
  );
}
