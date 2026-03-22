import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, Download, Search, Store, CalendarPlus, Edit2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const mockMembers = [
  { name: "Atukunda Blessing Faith", email: "atukundablessing32@gmail.com", role: "Member", phase: "BUILD", joined: "12/7/2025" },
  { name: "kalindaemma92", email: "kalindaemma92@gmail.com", role: "Member", phase: "LEARN", joined: "12/6/2025" },
  { name: "lutherombekahanguzi", email: "lutherombekahanguzi@gmail.com", role: "Manager", phase: "BUILD", joined: "12/5/2025" },
  { name: "Agnes Murungi", email: "aggiemur09@gmail.com", role: "Member", phase: "SCALE", joined: "12/5/2025" },
];

const mockShops = [
  { name: "Blessing's Boutique", owner: "Atukunda Blessing Faith", type: "E-Shop", status: "Published", listings: 12 },
  { name: "Emma's Crafts", owner: "kalindaemma92", type: "E-Shop", status: "Published", listings: 8 },
  { name: "Luther's Tech", owner: "lutherombekahanguzi", type: "E-Site", status: "Draft", listings: 3 },
  { name: "Agnes Collections", owner: "Agnes Murungi", type: "E-Shop", status: "Published", listings: 15 },
];

const orgOverview = [
  { name: "Digital Tribe", count: 26, color: "hsl(0 72% 51%)" },
  { name: "No Organization", count: 13, color: "hsl(239 84% 67%)" },
  { name: "Kafeero Foundation", count: 9, color: "hsl(142 71% 45%)" },
  { name: "HER Working Women", count: 8, color: "hsl(280 65% 60%)" },
];

export default function AgencyMembersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("members");

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 min-h-screen bg-background">
      <button
        onClick={() => navigate("/dashboard/agency")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Agency Management
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
          Member Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage roles, invite new members, and control access to premium tools.</p>
      </div>

      {/* Organization Overview */}
      <Card className="border border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Organization Overview</h2>
            <Button variant="outline" size="sm">
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Platform Name
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {orgOverview.map((org) => (
              <div key={org.name} className="text-center">
                <p className="text-2xl font-bold" style={{ color: org.color }}>{org.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{org.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" />
          </div>
          <Select><SelectTrigger className="w-48"><SelectValue placeholder="All Organizations" /></SelectTrigger><SelectContent><SelectItem value="all">All Organizations</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-36"><SelectValue placeholder="All Roles" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem></SelectContent></Select>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" /> Invite User
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <CalendarPlus className="w-4 h-4 mr-2" /> Create Event
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members">Members ({mockMembers.length})</TabsTrigger>
          <TabsTrigger value="managers">Managers (2)</TabsTrigger>
          <TabsTrigger value="shops">Member yangu Apps (4)</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliate Applications (0)</TabsTrigger>
          <TabsTrigger value="bounced">Bounced (0)</TabsTrigger>
          <TabsTrigger value="orders">Custom Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>ROLE</TableHead>
                  <TableHead>PHASE</TableHead>
                  <TableHead>JOINED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMembers.map((m) => (
                  <TableRow key={m.email}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{m.role}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.phase}</Badge></TableCell>
                    <TableCell className="text-xs">{m.joined}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="managers">
          <Card className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME</TableHead>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>PERMISSIONS</TableHead>
                  <TableHead>JOINED</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMembers.filter(m => m.role === "Manager").map((m) => (
                  <TableRow key={m.email}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{m.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">Full Access</Badge></TableCell>
                    <TableCell className="text-xs">{m.joined}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="shops">
          <Card className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SHOP NAME</TableHead>
                  <TableHead>OWNER</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead>LISTINGS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockShops.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Store className="w-4 h-4 text-muted-foreground" />
                      {s.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.owner}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{s.type}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={s.status === "Published" ? "default" : "secondary"} className="text-xs">
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{s.listings}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="affiliates">
          <Card className="border border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No affiliate applications yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bounced">
          <Card className="border border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No bounced members.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="border border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No custom orders yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Showing 1-{mockMembers.length} of {mockMembers.length} users
      </p>
    </div>
  );
}
