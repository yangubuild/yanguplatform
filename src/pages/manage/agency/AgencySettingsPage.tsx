import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useRoles } from "@/hooks/useRoles";
import { Building2, Settings2, Shield } from "lucide-react";

const ROLE_ACCESS = [
  { role: "Agency Principal", db: "agency_admin", access: "Full access — team, finance, branding, settings, reports" },
  { role: "Sales Lead", db: "agency_manager", access: "Team management, onboarding metrics, performance, reports" },
  { role: "Foot Soldier", db: "foot_soldier", access: "Own referrals, own commissions, onboarding, learning" },
  { role: "Finance Officer", db: "finance_officer", access: "Commissions, payouts, budget tracking, financial reports" },
  { role: "Creator", db: "creator", access: "Learning, hub booking, certificates, product content" },
  { role: "Influencer", db: "influencer", access: "Campaigns, performance, commissions, learning, content" },
];

export default function AgencySettings() {
  const { isAgencyAdmin, isAdmin } = useRoles();
  const { data: ctx, isLoading } = useAgencyContext();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  const agency = (ctx as any)?.agencies;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Settings</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Agency profile, branding, and access configuration</p>
      </div>

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

      {/* Payout Configuration */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Payout & Commission Configuration
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
            Commission splits are configured by the Agency Principal. Payouts are prepared by the agency and approved by Yangu Management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
