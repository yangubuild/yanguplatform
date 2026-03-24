import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  BarChart3,
  DollarSign,
  ShieldCheck,
  HeadphonesIcon,
  CreditCard,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoles } from "@/hooks/useRoles";

const stats = [
  { label: "Total Members", value: 0, color: "hsl(var(--foreground))" },
  { label: "LEARN Phase", value: 0, color: "hsl(142 71% 45%)" },
  { label: "BUILD Phase", value: 0, color: "hsl(239 84% 67%)" },
  { label: "SCALE Phase", value: 0, color: "hsl(280 65% 60%)" },
  { label: "Managers", value: 0, color: "hsl(var(--foreground))" },
];

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const { isAgencyAdmin, isAgencyManager } = useRoles();
  const isLeader = isAgencyAdmin || isAgencyManager;

  const actionCards = [
    {
      icon: UserPlus,
      title: "Onboarding",
      desc: "Manage member onboarding",
      onClick: () => navigate("/agency/onboarding"),
      visible: isLeader,
    },
    {
      icon: BarChart3,
      title: "Analytics",
      desc: "View member insights and data",
      onClick: () => navigate("/agency/analytics"),
      visible: isLeader,
    },
    {
      icon: TrendingUp,
      title: "Performance",
      desc: "Track team performance",
      onClick: () => navigate("/agency/performance"),
      visible: isLeader,
    },
    {
      icon: DollarSign,
      title: "Commissions",
      desc: "Track earnings and payouts",
      onClick: () => navigate("/agency/commissions"),
      visible: true,
    },
    {
      icon: ShieldCheck,
      title: "KYC Status",
      desc: "Member verification tracking",
      onClick: () => navigate("/agency/kyc"),
      visible: isAgencyAdmin,
    },
    {
      icon: HeadphonesIcon,
      title: "Support",
      desc: "View and respond to issues",
      onClick: () => navigate("/agency/support"),
      visible: isLeader,
    },
    {
      icon: CreditCard,
      title: "Pricing & Packages",
      desc: "Set up subscription plans",
      onClick: () => navigate("/agency/pricing"),
      visible: isAgencyAdmin,
    },
    {
      icon: Users,
      title: "Members",
      desc: "Manage team members",
      onClick: () => navigate("/agency/members"),
      visible: isLeader,
    },
  ].filter((c) => c.visible);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Agency Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your agency operations</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actionCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow border border-border"
            onClick={card.onClick}>
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted">
                <card.icon className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLeader && (
        <Card className="border border-border">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
            <Input placeholder="Search members..." className="flex-1" />
            <Button variant="outline" onClick={() => navigate("/agency/members")}>
              View All Members
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
