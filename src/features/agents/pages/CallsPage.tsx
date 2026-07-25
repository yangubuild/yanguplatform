import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PhoneIncoming, PhoneOutgoing, Play } from "lucide-react";
import { db } from "../data/mock";
import type { Call } from "../data/types";
import { PageHeader } from "../components/PageHeader";

const outcomeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  booked: "default", qualified: "secondary", voicemail: "outline",
  "no-answer": "outline", transferred: "secondary",
};

export default function CallsPage() {
  const calls = db.calls.list();
  const [open, setOpen] = useState<Call | null>(null);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <PageHeader title="Calls" description="Every inbound and outbound call, transcribed." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[["Answered", 1247],["Bookings", 168],["Voicemails", 42],["Avg duration", "3:12"]].map(([l,v]) => (
          <Card key={l as string}><CardContent className="p-5"><div className="text-2xl font-semibold">{v}</div><p className="text-xs text-muted-foreground mt-1">{l}</p></CardContent></Card>
        ))}
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>Contact</TableHead><TableHead>Direction</TableHead><TableHead>Duration</TableHead><TableHead>Outcome</TableHead><TableHead>When</TableHead><TableHead className="text-right">Recording</TableHead></TableRow></TableHeader>
          <TableBody>
            {calls.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.contact}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    {c.direction === "inbound" ? <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" /> : <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />}
                    {c.direction}
                  </span>
                </TableCell>
                <TableCell>{fmt(c.duration)}</TableCell>
                <TableCell><Badge variant={outcomeVariant[c.outcome]}>{c.outcome}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(c.when).toLocaleString()}</TableCell>
                <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setOpen(c)}><Play className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent>
          <SheetHeader><SheetTitle>{open?.contact}</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex gap-2 text-xs text-muted-foreground"><span>{open && fmt(open.duration)}</span>·<span className="capitalize">{open?.outcome}</span></div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 whitespace-pre-wrap">
              {open?.transcript ?? "No transcript available."}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}