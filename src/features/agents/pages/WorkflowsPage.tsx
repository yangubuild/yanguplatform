import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { db } from "../data/mock";
import { PageHeader } from "../components/PageHeader";

export default function WorkflowsPage() {
  const workflows = db.workflows.list();
  return (
    <div className="space-y-5">
      <PageHeader title="Workflows" description="Automations that run on top of every conversation."
        actions={<Button><Plus className="h-4 w-4 mr-1.5" />New workflow</Button>} />
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Trigger</TableHead><TableHead>Steps</TableHead><TableHead>Runs</TableHead><TableHead>Status</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
          <TableBody>
            {workflows.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{w.trigger}</TableCell>
                <TableCell>{w.steps}</TableCell>
                <TableCell>{w.runs}</TableCell>
                <TableCell><Badge variant={w.status==="active"?"default":"secondary"} className="capitalize">{w.status}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(w.updatedAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}