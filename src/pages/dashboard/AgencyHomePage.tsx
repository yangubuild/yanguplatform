import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  BarChart3,
  Palette,
  Link2,
  MessageSquare,
  DollarSign,
  ShieldCheck,
  Image,
  HeadphonesIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const stats = [
  { label: "Total Members", value: 11, color: "hsl(var(--foreground))" },
  { label: "LEARN Phase", value: 3, color: "hsl(142 71% 45%)" },
  { label: "BUILD Phase", value: 2, color: "hsl(239 84% 67%)" },
  { label: "SCALE Phase", value: 2, color: "hsl(280 65% 60%)" },
  { label: "Managers", value: 2, color: "hsl(var(--foreground))" },
];

export default function AgencyHomePage() {
  const navigate = useNavigate();
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [communityLinkOpen, setCommunityLinkOpen] = useState(false);
  const [communityUrl, setCommunityUrl] = useState("");

  const actionCards = [
    {
      icon: UserPlus,
      title: "Get Invite Link",
      desc: "Invite new members to join",
      color: "hsl(210 80% 55%)",
      bg: "hsl(210 80% 96%)",
      onClick: () => {},
    },
    {
      icon: BarChart3,
      title: "User Analytics",
      desc: "View member insights and data",
      color: "hsl(142 71% 45%)",
      bg: "hsl(142 71% 95%)",
      onClick: () => navigate("/dashboard/agency/analytics"),
    },
    {
      icon: Palette,
      title: "Organization Branding",
      desc: "✓ Customized",
      color: "hsl(330 80% 55%)",
      bg: "hsl(330 80% 96%)",
      onClick: () => setBrandingOpen(true),
    },
    {
      icon: Link2,
      title: "Set Community Link",
      desc: "Your org's community access link",
      color: "hsl(270 70% 55%)",
      bg: "hsl(270 70% 96%)",
      onClick: () => setCommunityLinkOpen(true),
    },
    {
      icon: HeadphonesIcon,
      title: "Member Support",
      desc: "View and respond to member issues",
      color: "hsl(142 71% 45%)",
      bg: "hsl(142 71% 95%)",
      onClick: () => navigate("/dashboard/agency/support"),
    },
    {
      icon: DollarSign,
      title: "Pricing & Packages",
      desc: "Set up subscription plans",
      color: "hsl(38 92% 50%)",
      bg: "hsl(38 92% 95%)",
      onClick: () => navigate("/dashboard/agency/pricing"),
    },
  ];

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-8 min-h-screen bg-background">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
          Agency Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Managing: My Organization</p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actionCards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-md transition-shadow border border-border"
            onClick={card.onClick}>
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: card.bg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick member search + nav */}
      <Card className="border border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <Input placeholder="Search members..." className="flex-1" />
          <Button variant="outline" onClick={() => navigate("/dashboard/agency/members")}>
            View All Members
          </Button>
        </CardContent>
      </Card>

      {/* Admin Tools */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Admin Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent/10">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Activity Log & Backups</p>
                <p className="text-xs text-muted-foreground">Track all platform changes in real-time and export data backups</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(142 71% 95%)" }}>
                <MessageSquare className="w-5 h-5" style={{ color: "hsl(142 71% 45%)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Marketplace Support</p>
                <p className="text-xs text-muted-foreground">Manage customer inquiries and support tickets</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Organization Branding Modal ── */}
      <Dialog open={brandingOpen} onOpenChange={setBrandingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" /> Organization Branding
            </DialogTitle>
            <DialogDescription>Customize your organization's cover images and colors</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Desktop Cover Image (1400×400px recommended)</p>
              <div className="h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <Image className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">Click to upload</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Mobile Cover Image (800×600px recommended)</p>
              <div className="h-28 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <Image className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">Click to upload</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">💡 If not set, desktop cover will be used for mobile</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Primary Color</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-border" style={{ background: "#61090b" }} />
                <Input defaultValue="#61090b" className="flex-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">This color will be used for buttons, links, and headers</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandingOpen(false)}>Cancel</Button>
            <Button onClick={() => setBrandingOpen(false)}>
              <Palette className="w-4 h-4 mr-2" /> Save Branding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Community Link Modal ── */}
      <Dialog open={communityLinkOpen} onOpenChange={setCommunityLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Community Link</DialogTitle>
            <DialogDescription>
              This is your organization's community access link for members.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground block mb-2">Community Link</label>
            <Input
              placeholder="https://example.com/community"
              value={communityUrl}
              onChange={(e) => setCommunityUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommunityLinkOpen(false)}>Cancel</Button>
            <Button onClick={() => setCommunityLinkOpen(false)}>Save Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
