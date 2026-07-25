import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { db } from "../data/mock";
import { PageHeader } from "../components/PageHeader";

export default function AppointmentsPage() {
  const appts = db.appointments.list();
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div className="space-y-5">
      <PageHeader title="Appointments" description="Bookings across every channel."
        actions={<div className="flex gap-2">
          <Button size="sm" variant={view==="list"?"default":"outline"} onClick={()=>setView("list")}>List</Button>
          <Button size="sm" variant={view==="calendar"?"default":"outline"} onClick={()=>setView("calendar")}>Calendar</Button>
          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New booking</Button>
        </div>} />
      {view === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appts.map((a) => (
            <Card key={a.id}><CardContent className="p-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm">{a.title}</p>
                <Badge variant="secondary" className="capitalize">{a.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{a.contact}</p>
              <p className="text-xs">{new Date(a.when).toLocaleString()} · {a.duration} min</p>
              <Badge variant="outline">{a.channel}</Badge>
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-5">
          <div className="grid grid-cols-7 gap-2 text-xs">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="text-center font-medium text-muted-foreground">{d}</div>)}
            {Array.from({length: 7}).map((_, i) => (
              <div key={i} className="min-h-24 rounded-md border border-border p-1 space-y-1">
                {appts.filter((a)=>new Date(a.when).getDay() === (i+1)%7).map((a) => (
                  <div key={a.id} className="rounded bg-primary/10 text-primary text-[10px] px-1.5 py-1 truncate">{a.title}</div>
                ))}
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}