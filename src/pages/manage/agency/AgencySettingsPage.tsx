import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useRoles } from "@/hooks/useRoles";
import { Building2, Settings2, Shield, DollarSign, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SocialLinksSection } from "@/components/manage/SocialLinksSection";
import { ContractSection } from "@/components/manage/ContractSection";

const ROLE_ACCESS = [
  { role: "Agency Principal", db: "agency_admin", access: "Full access — team, finance, branding, settings, reports" },
  { role: "Sales Lead", db: "agency_manager", access: "Team management, onboarding metrics, performance, reports" },
  { role: "Foot Soldier", db: "foot_soldier", access: "Own referrals, own commissions, onboarding, learning" },
  { role: "Finance Officer", db: "finance_officer", access: "Commissions, payouts, budget tracking, financial reports" },
  { role: "Creator", db: "creator", access: "Learning, hub booking, certificates, product content" },
  { role: "Influencer", db: "influencer", access: "Campaigns, performance, commissions, learning, content" },
];

const DEFAULT_SPLITS = {
  foot_soldier: { phase1: 0.50, phase2: 1.00 },
  agency_manager: { phase1: 0.25, phase2: 0.50 },
  finance_officer: { phase1: 0, phase2: 0 },
  creator: { phase1: 0.50, phase2: 1.00 },
  influencer: { phase1: 0.50, phase2: 1.00 },
};

const SPLIT_ROLE_LABELS: Record<string, string> = {
  foot_soldier: "Foot Soldier",
  agency_manager: "Sales Lead (Override)",
  finance_officer: "Finance Officer",
  creator: "Creator",
  influencer: "Influencer",
};

type SplitConfig = Record<string, { phase1: number; phase2: number }>;

export default function AgencySettings() {
  const { isAgencyAdmin, isAdmin } = useRoles();
  const { data: ctx, isLoading } = useAgencyContext();
  const canEdit = isAgencyAdmin || isAdmin;

  // Commission splits state
  const agency = (ctx as any)?.agencies;
  const savedSplits: SplitConfig = (agency?.metadata as any)?.commission_config ?? DEFAULT_SPLITS;
  const [splits, setSplits] = useState<SplitConfig>(savedSplits);
  const [saving, setSaving] = useState(false);

  const handleSplitChange = (role: string, phase: "phase1" | "phase2", value: string) => {
    setSplits((prev) => ({
      ...prev,
      [role]: { ...prev[role], [phase]: parseFloat(value) || 0 },
    }));
  };

  const saveSplits = async () => {
    if (!agency?.id) return;
    setSaving(true);
    try {
      const newMetadata = { ...(agency.metadata ?? {}), commission_config: splits };
      const { error } = await supabase
        .from("agencies")
        .update({ metadata: newMetadata })
        .eq("id", agency.id);
      if (error) throw error;
      toast.success("Commission splits saved — applies to future commissions only");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Settings</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Agency profile, commission splits, and access configuration</p>
      </div>

      {/* Contract */}
      {agency?.id && ctx?.id && (
        <ContractSection agencyId={agency.id} memberId={ctx.id} canSign={canEdit} />
      )}

      {/* Agency Profile */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Agency Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Legal Business Name</label>
              <Input value={agency?.name ?? ""} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Slug</label>
              <Input value={agency?.slug ?? ""} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="mt-2">
                <Badge variant={agency?.status === "active" ? "default" : "secondary"}>
                  {agency?.status ?? "—"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Region</label>
              <Input value={agency?.region ?? "Not set"} disabled className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Contact Yangu Management to update legal business name, registration number, or tax details.
          </p>
        </CardContent>
      </Card>

      {/* Commission Split Configuration */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Commission Splits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure how Phase 1 ($1 KYC) and Phase 2 ($4/mo subscriber) commissions are split per role. Changes apply to future commissions only.
          </p>

          <div className="rounded-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_100px] gap-0 text-[10px] uppercase tracking-wider text-muted-foreground px-4 py-2.5 bg-muted/50 border-b border-border">
              <span>Role</span>
              <span className="text-center">Phase 1 ($)</span>
              <span className="text-center">Phase 2 ($)</span>
            </div>

            {Object.entries(SPLIT_ROLE_LABELS).map(([roleKey, label], i) => (
              <div
                key={roleKey}
                className={`grid grid-cols-[1fr_100px_100px] gap-0 items-center px-4 py-3 ${
                  i < Object.keys(SPLIT_ROLE_LABELS).length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="flex justify-center">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={roleKey === "agency_manager" ? "1" : "1"}
                    className="w-20 h-8 text-center text-sm"
                    value={splits[roleKey]?.phase1 ?? 0}
                    onChange={(e) => handleSplitChange(roleKey, "phase1", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="flex justify-center">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    className="w-20 h-8 text-center text-sm"
                    value={splits[roleKey]?.phase2 ?? 0}
                    onChange={(e) => handleSplitChange(roleKey, "phase2", e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Phase 1 total allocated</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                ${Object.values(splits).reduce((s, v) => s + (v.phase1 ?? 0), 0).toFixed(2)} / $1.00
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Phase 2 total allocated</p>
              <p className="text-sm font-bold text-foreground mt-0.5">
                ${Object.values(splits).reduce((s, v) => s + (v.phase2 ?? 0), 0).toFixed(2)} / $4.00
              </p>
            </div>
          </div>

          {canEdit && (
            <Button onClick={saveSplits} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Splits
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Payout Configuration */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Payout & Commission Structure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Phase 1 — KYC Reward</p>
              <p className="text-lg font-bold text-foreground mt-1">$1.00</p>
              <p className="text-xs text-muted-foreground">Per verified KYC user (7-day active)</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Phase 2 — Recurring</p>
              <p className="text-lg font-bold text-foreground mt-1">$4.00/mo</p>
              <p className="text-xs text-muted-foreground">Per active subscriber with payment</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Commission splits are configured above. Payouts are prepared by the agency and approved by Yangu Management.
          </p>
        </CardContent>
      </Card>

      {/* Social Links */}
      {agency?.id && (
        <SocialLinksSection
          agencyId={agency.id}
          metadata={agency.metadata}
          canEdit={canEdit}
        />
      )}

      {/* Role Access Matrix */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> Role Access Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {ROLE_ACCESS.map((r, i) => (
              <div key={r.db} className={`flex justify-between py-2 ${i < ROLE_ACCESS.length - 1 ? "border-b border-border" : ""}`}>
                <span className="text-foreground font-medium">{r.role}</span>
                <span className="text-muted-foreground text-right max-w-[60%]">{r.access}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
