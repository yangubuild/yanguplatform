import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bluetooth, Loader2, CheckCircle2, Smartphone } from "lucide-react";
import { db } from "../data/mock";
import { PageHeader } from "../components/PageHeader";

type Step = 1 | 2 | 3 | 4 | "paired";

export default function MobilePage() {
  const agents = db.agents.list();
  const [step, setStep] = useState<Step>(1);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(false);
  const [pin, setPin] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id);

  const scan = () => {
    setScanning(true); setFound(false);
    setTimeout(() => { setScanning(false); setFound(true); }, 1500);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Mobile & Pendant" description="Take Yangu with you — pocket or wearable." />
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="mx-auto lg:mx-0 relative rounded-[2.5rem] border-8 border-foreground bg-background w-[280px] h-[560px] p-4 shadow-2xl">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-foreground" />
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /><span className="text-sm font-semibold">Yangu Mobile</span></div>
            <div className="rounded-lg bg-muted p-3 text-xs">Amara booked a viewing for Ruth · Saturday 10am</div>
            <div className="rounded-lg bg-muted p-3 text-xs">Kito answered 3 calls · 1 booking</div>
            <div className="rounded-lg bg-primary/10 text-primary p-3 text-xs">"How many leads this week?"</div>
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">App download</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button variant="outline">App Store</Button>
              <Button variant="outline">Google Play</Button>
              <div className="h-24 w-24 rounded-md border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground">QR</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Yangu Pendant pairing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {step === "paired" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">Paired</span></div>
                  <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                    <div>Device: <span className="font-medium">Yangu Pendant · #YP-7742</span></div>
                    <div>Battery: <span className="font-medium">84%</span></div>
                    <div>Firmware: <span className="font-medium">v1.4.2</span></div>
                    <div>Assigned agent: <span className="font-medium">{agents.find(a=>a.id===agentId)?.name}</span></div>
                  </div>
                  <Button variant="outline" onClick={() => { setStep(1); setFound(false); setPin(""); }}>Unpair</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {[1,2,3,4].map((n) => <div key={n} className={`rounded-md py-2 border ${step===n?"border-primary bg-primary/10 text-primary font-semibold":"border-border text-muted-foreground"}`}>{n}</div>)}
                  </div>
                  {step === 1 && <>
                    <p className="text-sm">Hold the button on your Yangu pendant for 3 seconds until the ring pulses orange.</p>
                    <Button onClick={() => setStep(2)}>Next</Button>
                  </>}
                  {step === 2 && <>
                    <p className="text-sm">Scan for nearby pendants.</p>
                    <Button onClick={scan} disabled={scanning}>{scanning ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin"/>Scanning…</> : <><Bluetooth className="h-4 w-4 mr-1.5"/>Scan for pendants</>}</Button>
                    {found && <div className="rounded-md border border-border p-3 flex items-center justify-between text-sm"><span>Yangu Pendant · #YP-7742</span><Button size="sm" onClick={()=>setStep(3)}>Select</Button></div>}
                  </>}
                  {step === 3 && <>
                    <p className="text-sm">Enter the 6-digit pairing code shown on your pendant.</p>
                    <Input maxLength={6} value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="123456" />
                    <Button disabled={pin.length !== 6} onClick={()=>setStep(4)}>Continue</Button>
                  </>}
                  {step === 4 && <>
                    <p className="text-sm">Assign this pendant to one of your agents.</p>
                    <Select value={agentId} onValueChange={setAgentId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{agents.map(a=>(<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button onClick={()=>setStep("paired")}>Confirm pairing</Button>
                  </>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}