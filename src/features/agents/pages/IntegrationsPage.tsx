import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import * as Icons from "lucide-react";
import { db } from "../data/mock";
import type { Integration } from "../data/types";
import { PageHeader } from "../components/PageHeader";

const CATEGORIES: Integration["category"][] = ["channels","calendar","crm","payments","automation","storage"];

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>(() => db.integrations.list().map((i) => ({ ...i })));
  const [active, setActive] = useState<Integration | null>(null);

  const toggle = (id: string, next: boolean) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, connected: next } : i));

  return (
    <div className="space-y-6">
      <PageHeader title="Integrations" description="Connect the tools your business already uses." />
      {CATEGORIES.map((cat) => {
        const inCat = items.filter((i) => i.category === cat);
        const count = inCat.filter((i) => i.connected).length;
        return (
          <div key={cat}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold capitalize">{cat}</h3>
              <span className="text-xs text-muted-foreground">{count} connected</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inCat.map((i) => {
                const Icon = (Icons as any)[i.icon] ?? Icons.Puzzle;
                return (
                  <Card key={i.id}><CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                        <div><p className="font-semibold text-sm">{i.name}</p></div>
                      </div>
                      <Badge variant={i.connected ? "default" : "outline"}>{i.connected ? "Connected" : "Not connected"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{i.description}</p>
                    {i.connected ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setActive(i)}>Manage</Button>
                        <Button variant="ghost" size="sm" onClick={()=>toggle(i.id, false)}>Disconnect</Button>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => setActive(i)}>Connect</Button>
                    )}
                  </CardContent></Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{active?.connected ? "Manage" : "Connect"} {active?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {active?.connected ? (
              <>
                <p className="text-sm text-muted-foreground">You're connected. All events sync automatically.</p>
                <Button variant="outline" onClick={() => { toggle(active.id, false); setActive(null); }}>Disconnect</Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Continue with {active?.name} to grant access.</p>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">API key (optional)</label>
                  <Input placeholder="sk-…" />
                </div>
                <Button className="w-full" onClick={() => { if (active) { toggle(active.id, true); setActive(null); } }}>Continue with {active?.name}</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}