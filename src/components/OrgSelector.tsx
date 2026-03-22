import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { useUserOrgs, type OrgMembership } from "@/hooks/useActiveOrg";
import { Building2, Loader2, AlertTriangle, Users } from "lucide-react";

interface OrgSelectorProps {
  onSelect: (orgId: string) => void;
  title?: string;
  description?: string;
}

export function OrgSelector({
  onSelect,
  title = "Select Organization",
  description = "Choose an organization to continue",
}: OrgSelectorProps) {
  const { data: orgs, isLoading, error } = useUserOrgs();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading organizations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive">Failed to load organizations</p>
      </Card>
    );
  }

  if (!orgs || orgs.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Organization Found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You need to be part of an organization to create surfaces.
          An organization is automatically created when you complete onboarding.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-3">
        {orgs.map((membership) => (
          <Button
            key={membership.org_id}
            variant="outline"
            className="w-full h-auto p-4 justify-start gap-4"
            onClick={() => onSelect(membership.org_id)}>
            <div className="p-2 rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">{membership.org.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {membership.role}
              </p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
