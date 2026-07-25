import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useWorkflows } from "../data/hooks";
import { PageHeader } from "../components/PageHeader";

export default function WorkflowsPage() {
  const { data: workflows = [], isLoading, error, refetch } = useWorkflows();
  return (
    <div className="space-y-5">
      <PageHeader title="Workflows" description="Automations that run on top of every conversation."
        actions={<Button><Plus className="h-4 w-4 mr-1.5" />New workflow</Button>} />
      <Card>
        {error && <div className="p-4 text-sm flex items-center justify-between"><span>Could not load workflows.</span><Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button></div>}
        {!isLoading && !error && workflows.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No workflows yet.</div>}
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