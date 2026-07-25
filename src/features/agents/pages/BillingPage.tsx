import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

const PLANS = [
  { name: "Starter", price: "$189", setup: "$950 setup", features: ["1,000 conversations / mo", "200 voice minutes / mo", "2 seats", "1 agent", "WhatsApp + Web channels"] },
  { name: "Growth", price: "$399", setup: "$2,000 setup", features: ["10,000 conversations / mo", "2,000 voice minutes / mo", "10 seats", "Unlimited agents", "All channels", "Workflows & integrations"], recommended: true },
  { name: "Enterprise", price: "Custom", setup: "Implementation from $5,500", features: ["Unlimited conversations & minutes", "Unlimited seats & agents", "SSO / SAML", "Dedicated CSM", "On-prem option", "Custom SLAs"] },
];

const INVOICES = [
  { id: "inv-002", date: "2026-07-01", desc: "Growth · July 2026", amount: "$399.00", status: "paid" },
  { id: "inv-001", date: "2026-06-01", desc: "Growth · June 2026", amount: "$399.00", status: "paid" },
  { id: "inv-000", date: "2026-05-01", desc: "Growth · May 2026", amount: "$399.00", status: "paid" },
];

function Meter({ label, value, limit }: { label: string; value: number; limit: number }) {
  return (
    <div><div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="text-muted-foreground">{value.toLocaleString()} / {limit.toLocaleString()}</span></div>
      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{width:`${Math.min(100, value/limit*100)}%`}}/></div></div>
  );
}

export default function BillingPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-5">
      <PageHeader title="Billing" description="Plans, usage and invoices." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">Current plan · Growth <Badge>active</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-semibold">$399<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
            <div className="space-y-3">
              <Meter label="Conversations" value={3240} limit={10000} />
              <Meter label="Voice minutes" value={640} limit={2000} />
              <Meter label="Team seats" value={4} limit={10} />
            </div>
            <div className="flex gap-2"><Button>Upgrade</Button><Button variant="outline" onClick={()=>setOpen(true)}>Change plan</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Payment method</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border p-3 flex items-center justify-between">
              <div><p className="text-sm font-medium">Visa ending 4242</p><p className="text-xs text-muted-foreground">Expires 08/28</p></div>
              <Badge variant="secondary">Default</Badge>
            </div>
            <Button variant="outline">Update card</Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Invoices</CardTitle></CardHeader>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {INVOICES.map((i) => (<TableRow key={i.id}><TableCell>{i.date}</TableCell><TableCell>{i.desc}</TableCell><TableCell>{i.amount}</TableCell><TableCell><Badge variant="secondary" className="capitalize">{i.status}</Badge></TableCell><TableCell><Button variant="ghost" size="sm">Download</Button></TableCell></TableRow>))}
          </TableBody>
        </Table>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Change plan</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            {PLANS.map((p) => (
              <div key={p.name} className={`rounded-lg border p-4 flex flex-col gap-3 ${p.recommended ? "border-primary" : "border-border"}`}>
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xl font-semibold mt-1">{p.price}<span className="text-xs text-muted-foreground font-normal">{p.price!=="Custom"?"/mo":""}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.setup}</p>
                </div>
                <ul className="space-y-1.5 text-xs flex-1">{p.features.map((f)=>(<li key={f} className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0"/>{f}</li>))}</ul>
                <Button variant={p.recommended ? "default" : "outline"} size="sm">{p.price === "Custom" ? "Contact us" : "Select"}</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}