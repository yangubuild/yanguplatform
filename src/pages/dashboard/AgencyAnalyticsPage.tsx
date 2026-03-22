import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, GraduationCap, Hammer, TrendingUp, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statCards = [
  { label: "Total Users", value: 58, color: "hsl(var(--foreground))" },
  { label: "LEARN Phase", value: 15, color: "hsl(142 71% 45%)" },
  { label: "BUILD Phase", value: 30, color: "hsl(239 84% 67%)" },
  { label: "SCALE Phase", value: 13, color: "hsl(280 65% 60%)" },
];

const mockMembers = [
  { name: "Atukunda Blessing Faith", email: "atukundablessing32@gmail.com", phone: "+256700333340", org: "Digital Tribe", business: "Catson the Ceo", profile: "Builder", phase: "BUILD", joined: "12/7/2025" },
  { name: "kalindaemma92", email: "kalindaemma92@gmail.com", phone: "0776219634", org: "Digital Tribe", business: "Velora Jewelry", profile: "Explorer", phase: "LEARN", joined: "12/6/2025" },
  { name: "lutherombekahanguzi", email: "lutherombekahanguzi@gmail.com", phone: "+256789205690", org: "Digital Tribe", business: "Shamba furniture", profile: "Builder", phase: "BUILD", joined: "12/5/2025" },
  { name: "Agnes Murungi", email: "aggiemur09@gmail.com", phone: "+256771898208", org: "Digital Tribe", business: "Divine Scents", profile: "Builder", phase: "BUILD", joined: "12/5/2025" },
];

const phaseColors: Record<string, string> = {
  LEARN: "hsl(142 71% 45%)",
  BUILD: "hsl(239 84% 67%)",
  SCALE: "hsl(280 65% 60%)",
};

export default function AgencyAnalyticsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 min-h-screen bg-background">
      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/agency")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Agency Management
      </button>

      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
            User Segmentation & Analytics
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Comprehensive user insights and metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input placeholder="Search by name, email, or business..." />
            <Select><SelectTrigger><SelectValue placeholder="All Organizations" /></SelectTrigger><SelectContent><SelectItem value="all">All Organizations</SelectItem></SelectContent></Select>
            <Select><SelectTrigger><SelectValue placeholder="Profile Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem></SelectContent></Select>
            <Select><SelectTrigger><SelectValue placeholder="Primary Goal" /></SelectTrigger><SelectContent><SelectItem value="all">All Goals</SelectItem></SelectContent></Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select><SelectTrigger><SelectValue placeholder="Business Stage" /></SelectTrigger><SelectContent><SelectItem value="all">All Stages</SelectItem></SelectContent></Select>
            <Select><SelectTrigger><SelectValue placeholder="Current Phase" /></SelectTrigger><SelectContent><SelectItem value="all">All Phases</SelectItem></SelectContent></Select>
            <Select><SelectTrigger><SelectValue placeholder="AI Experience" /></SelectTrigger><SelectContent><SelectItem value="all">All Levels</SelectItem></SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {mockMembers.length} users</p>
        <div className="flex gap-2 flex-wrap">
          {["Export All", "Export LEARN", "Export BUILD", "Export SCALE"].map((label) => (
            <Button key={label} variant="outline" size="sm">{label}</Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>ORGANIZATION</TableHead>
              <TableHead>BUSINESS</TableHead>
              <TableHead>PROFILE</TableHead>
              <TableHead>PHASE</TableHead>
              <TableHead>JOINED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockMembers.map((m) => (
              <TableRow key={m.email}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{m.email}</TableCell>
                <TableCell className="text-xs">{m.phone}</TableCell>
                <TableCell className="text-xs">{m.org}</TableCell>
                <TableCell className="text-xs">{m.business}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{m.profile}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className="text-xs text-foreground"
                    style={{ background: phaseColors[m.phase] || "hsl(var(--muted))" }}>
                    {m.phase}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{m.joined}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
