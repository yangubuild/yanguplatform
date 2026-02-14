import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, UserPlus, Download, Search } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockMembers = [
  { name: "Atukunda Blessing Faith", email: "atukundablessing32@gmail.com", role: "Member", phase: "BUILD", joined: "12/7/2025" },
  { name: "kalindaemma92", email: "kalindaemma92@gmail.com", role: "Member", phase: "LEARN", joined: "12/6/2025" },
  { name: "lutherombekahanguzi", email: "lutherombekahanguzi@gmail.com", role: "Manager", phase: "BUILD", joined: "12/5/2025" },
  { name: "Agnes Murungi", email: "aggiemur09@gmail.com", role: "Member", phase: "SCALE", joined: "12/5/2025" },
];

export default function AgencyMembersPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <button
        onClick={() => navigate("/dashboard/dashboard/agency")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Agency Management
      </button>

      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Lufga', 'Inter', sans-serif" }}>
          Member Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage roles, invite new members, and control access to premium tools.</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({mockMembers.length})</TabsTrigger>
          <TabsTrigger value="managers">Managers (2)</TabsTrigger>
          <TabsTrigger value="shops">Member Yangu Apps (4)</TabsTrigger>
        </TabsList>
      </Tabs>

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
        <Button size="sm">
          <Download className="w-4 h-4 mr-2" /> Export CSV ({mockMembers.length})
        </Button>
      </div>

      {/* Table */}
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
    </div>
  );
}
