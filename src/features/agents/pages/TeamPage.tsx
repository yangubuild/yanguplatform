import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { db } from "../data/mock";
import { PageHeader } from "../components/PageHeader";

export default function TeamPage() {
  const team = db.team.list();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-5">
      <PageHeader title="Team" description="Teammates who can manage your AI workforce."
        actions={<Button onClick={()=>setOpen(true)}><UserPlus className="h-4 w-4 mr-1.5" />Invite teammate</Button>} />
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last active</TableHead></TableRow></TableHeader>
          <TableBody>
            {team.map((m) => (
              <TableRow key={m.id}>
                <TableCell><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{m.avatar}</div><span className="font-medium">{m.name}</span></div></TableCell>
                <TableCell className="text-sm">{m.email}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{m.role}</Badge></TableCell>
                <TableCell><Badge variant={m.status==="active"?"default":"secondary"} className="capitalize">{m.status}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(m.lastActive).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite teammate</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Input placeholder="email@company.com" />
            <Select defaultValue="agent">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="agent">Agent</SelectItem></SelectContent>
            </Select>
            <Button className="w-full" onClick={()=>setOpen(false)}>Send invite</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}