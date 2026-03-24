import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgencyContext } from "@/hooks/manage/useAgencyContext";
import { useRoles } from "@/hooks/useRoles";
import { Building2, Settings2 } from "lucide-react";

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
  const isOwner = isAdmin || isAgencyAdmin;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--admin-text))]">Settings</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">Agency profile and configuration</p>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Agency Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Name</label>
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
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Team Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-foreground font-medium">Agency Admin</span>
              <span className="text-muted-foreground">Full access to all sections</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-foreground font-medium">Agency Manager</span>
              <span className="text-muted-foreground">Operations, reports, members (no settings/pricing)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-foreground font-medium">Foot Soldier</span>
              <span className="text-muted-foreground">Own referrals, own commissions, own performance</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Payout Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payout method configuration will be available in the next update.
            Commissions are tracked and will be disbursed once payout integration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
