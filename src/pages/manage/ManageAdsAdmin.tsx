import { useRoles } from "@/hooks/useRoles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone, ShieldCheck, BarChart3, ClipboardList } from "lucide-react";

const sections = [
  {
    title: "Campaigns",
    description: "View and manage advertiser campaigns, delivery status, and budgets.",
    icon: Megaphone,
    status: "Coming soon",
  },
  {
    title: "Review Queue",
    description: "Approve or reject submitted ads before they go live.",
    icon: ClipboardList,
    status: "Coming soon",
  },
  {
    title: "Business KYC",
    description: "Review and verify advertiser business accounts.",
    icon: ShieldCheck,
    status: "Coming soon",
  },
  {
    title: "Performance Overview",
    description: "Ad impressions, completions, clicks, CTR, and unlock conversions.",
    icon: BarChart3,
    status: "Coming soon",
  },
];

export default function ManageAdsAdmin() {
  const { isAdmin } = useRoles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ads Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage ad campaigns, review queue, advertiser KYC, and performance analytics.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="text-[10px] border-[hsl(var(--admin-border)/0.4)] text-[hsl(var(--admin-text-muted))] bg-[hsl(var(--admin-surface-elevated)/0.3)]"
        >
          Infrastructure ready — UI modules coming soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Card
            key={s.title}
            className="border-[hsl(var(--admin-border)/0.3)] bg-[hsl(var(--admin-surface)/0.4)]"
          >
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <s.icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {s.title}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {s.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[9px] shrink-0">
                {s.status}
              </Badge>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
