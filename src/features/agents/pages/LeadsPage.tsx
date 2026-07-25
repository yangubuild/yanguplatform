import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLeads } from "../data/hooks";
import type { Lead } from "../data/types";
import { PageHeader } from "../components/PageHeader";

const STAGES: Lead["stage"][] = ["new","qualified","booked","won","lost"];

export default function LeadsPage() {
  const { data: leads = [], isLoading, error, refetch } = useLeads();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [active, setActive] = useState<Lead | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader title="Leads" description="Every qualified prospect in one pipeline."
        actions={<div className="flex gap-2"><Button size="sm" variant={view==="table"?"default":"outline"} onClick={()=>setView("table")}>Table</Button><Button size="sm" variant={view==="kanban"?"default":"outline"} onClick={()=>setView("kanban")}>Kanban</Button></div>} />
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <span>Could not load leads.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {!isLoading && !error && leads.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No leads yet.</div>
      )}
      {view === "table" ? (
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>Intent</TableHead><TableHead>Score</TableHead><TableHead>Stage</TableHead><TableHead>Owner</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id} onClick={()=>setActive(l)} className="cursor-pointer">
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell><Badge variant="outline">{l.source}</Badge></TableCell>
                  <TableCell className="text-sm">{l.intent}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{width:`${l.score}%`}}/></div><span className="text-xs">{l.score}</span></div>
                  </TableCell>
                  <TableCell><Badge className="capitalize">{l.stage}</Badge></TableCell>
                  <TableCell className="text-sm">{l.owner}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {STAGES.map((s) => (
            <Card key={s}><CardContent className="p-3 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground capitalize">{s}</p>
              {leads.filter((l)=>l.stage===s).map((l) => (
                <div key={l.id} onClick={()=>setActive(l)} className="rounded-md border border-border p-2 text-sm cursor-pointer hover:border-primary">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.intent}</p>
                  <p className="text-xs mt-1">Score {l.score}</p>
                </div>
              ))}
            </CardContent></Card>
          ))}
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o)=>!o && setActive(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>{active?.name}</SheetTitle></SheetHeader>
          {active && (
            <div className="mt-4 space-y-3 text-sm">
              <div><span className="text-muted-foreground">Source: </span>{active.source}</div>
              <div><span className="text-muted-foreground">Intent: </span>{active.intent}</div>
              <div><span className="text-muted-foreground">Score: </span>{active.score}</div>
              <div><span className="text-muted-foreground">Stage: </span>{active.stage}</div>
              <div><span className="text-muted-foreground">Owner: </span>{active.owner}</div>
              <div className="pt-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Activity</p>
                <div className="space-y-2">
                  <div className="text-xs">Created via {active.source} · {new Date(active.createdAt).toLocaleString()}</div>
                  <div className="text-xs">Assigned to {active.owner}</div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}