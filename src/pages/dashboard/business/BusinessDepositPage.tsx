import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Upload, ArrowLeftRight, MoreVertical, Rocket, ExternalLink, Settings, Landmark, ChevronLeft, X, ArrowRightLeft, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Tab = "overview" | "withdrawals" | "topups" | "activity";
type ModalType = "deposit" | "withdraw" | "move" | null;

export default function BusinessDepositPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [businessTitle, setBusinessTitle] = useState("");
  const [modal, setModal] = useState<ModalType>(null);

  useEffect(() => {
    if (!businessId) return;
    supabase.from("builder_surfaces").select("title").eq("id", businessId).single().then(({ data }) => {
      if (data) setBusinessTitle(data.title);
    });
  }, [businessId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "withdrawals", label: "Withdrawals" },
    { key: "topups", label: "Top ups" },
    { key: "activity", label: "All activity" },
  ];

  const initials = businessTitle
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 space-y-6 max-w-5xl min-h-screen bg-background" >
      <button onClick={() => navigate("/dashboard/my-business")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to My Business
      </button>

      {/* Balance header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total balance</p>
          <p className="text-3xl font-bold text-foreground">$0.00 <span className="text-lg font-normal text-muted-foreground">USD</span></p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary" onClick={() => setModal("deposit")}><Download className="h-3.5 w-3.5" /> Deposit</Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary" onClick={() => setModal("withdraw")}><Upload className="h-3.5 w-3.5" /> Withdraw</Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-primary/30 text-primary" onClick={() => setModal("move")}><ArrowLeftRight className="h-3.5 w-3.5" /> Move</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                <Download className="h-4 w-4" /> Export all transactions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-2 text-sm font-medium transition-colors ${
              tab === t.key ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "withdrawals" && <EmptyTableTab columns={["Amount", "Status", "Sent to", "Initiated at", "Estimated arrival", "Receipt"]} title="No withdrawals yet" desc="When you withdraw money from your yangu account, it will be displayed here." />}
      {tab === "topups" && <EmptyTableTab columns={["Amount", "Status", "Method", "Created"]} title="No deposits yet" desc="Your deposits will appear here once you make a top-up." />}
      {tab === "activity" && <ActivityTab />}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center max-w-2xl mx-auto">
        *yangu is a technology company, not a bank. Cash balances are held for you at partner banks. Balances are not FDIC insured.
      </p>

      {/* Deposit Modal */}
      <Dialog open={modal === "deposit"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border p-0 gap-0">
          <DepositModal businessTitle={businessTitle} initials={initials} onClose={() => setModal(null)} />
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={modal === "withdraw"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border p-0 gap-0 max-h-[85vh] overflow-y-auto">
          <WithdrawModal onClose={() => setModal(null)} />
        </DialogContent>
      </Dialog>

      {/* Move / Treasury Modal */}
      <Dialog open={modal === "move"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border p-0 gap-0">
          <MoveModal onClose={() => setModal(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Deposit Modal ─── */
function DepositModal({ businessTitle, initials, onClose }: { businessTitle: string; initials: string; onClose: () => void }) {
  const [amount, setAmount] = useState("100");
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * 0.03;
  const total = numAmount + fee;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <h3 className="font-semibold text-foreground text-sm">Top up balance</h3>
        <Button size="sm" variant="accent" className="rounded-xl text-xs px-4">Pay</Button>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center py-8 px-6 gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          {initials}
        </div>
        <p className="text-sm text-muted-foreground">{businessTitle}</p>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-4xl font-bold text-foreground">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-4xl font-bold text-foreground bg-transparent border-none outline-none w-32 text-center"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Total ${total.toFixed(2)}</span>{" "}
          incl. 3% fee
        </p>
        <input
          placeholder="Write a note"
          className="text-sm text-muted-foreground bg-transparent border-none outline-none text-center mt-1 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Source */}
      <div className="mx-5 mb-5 rounded-xl border border-primary/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/20 flex items-center justify-center text-xs">💰</div>
          <div>
            <p className="text-sm font-medium text-foreground">Personal balance</p>
            <p className="text-xs text-muted-foreground">Balance: $0.00</p>
          </div>
        </div>
        <button className="text-xs text-primary font-medium flex items-center gap-1">Change ›</button>
      </div>
    </div>
  );
}

/* ─── Withdraw / Activate Payouts Modal ─── */
function WithdrawModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ["Tell us about yourself", "Get verified", "Additional information"];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Activate Payouts</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex min-h-[420px]">
        {/* Sidebar steps */}
        <div className="w-52 border-r border-border p-5 space-y-4">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 text-sm w-full text-left ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}
            >
              <span className={`h-2 w-2 rounded-full ${i === step ? "bg-primary" : i < step ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
              {s}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          {step === 0 && <StepAboutYou />}
          {step === 1 && <StepVerify />}
          {step === 2 && <StepAdditional />}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setStep(0)}>Restart</Button>
        <Button size="sm" variant="accent" className="rounded-xl text-xs px-6" onClick={() => step < 2 ? setStep(step + 1) : onClose()}>Continue</Button>
      </div>
    </div>
  );
}

function StepAboutYou() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-foreground">Tell us about yourself</h4>
        <p className="text-sm text-muted-foreground">Add your name, business type, and address to get started</p>
      </div>
      <Field label="First name" placeholder="John" />
      <Field label="Last name" placeholder="Smith" />
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Business type</label>
        <Select defaultValue="individual">
          <SelectTrigger className="bg-background border-border rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field label="Date of birth" placeholder="03/09/2026" />
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Mobile number</label>
        <div className="flex gap-2">
          <Select defaultValue="us">
            <SelectTrigger className="w-28 bg-background border-border rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="us">US +1</SelectItem>
              <SelectItem value="ug">UG +256</SelectItem>
              <SelectItem value="ke">KE +254</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="903-555-0145" className="bg-background border-border rounded-xl" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Country</label>
        <Select>
          <SelectTrigger className="bg-background border-border rounded-xl"><SelectValue placeholder="Select country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ug">Uganda</SelectItem>
            <SelectItem value="ke">Kenya</SelectItem>
            <SelectItem value="gb">United Kingdom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Field label="Line 1" placeholder="123 Main St" />
      <Field label="Line 2" placeholder="Apt 1" />
    </div>
  );
}

function StepVerify() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-foreground">Get verified</h4>
        <p className="text-sm text-muted-foreground">Upload a government-issued ID to verify your identity</p>
      </div>
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Drag & drop or click to upload your ID</p>
        <Button size="sm" variant="outline" className="rounded-xl text-xs mt-3">Choose file</Button>
      </div>
    </div>
  );
}

function StepAdditional() {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-foreground">Additional information</h4>
        <p className="text-sm text-muted-foreground">Provide any additional business details</p>
      </div>
      <Field label="Tax ID (optional)" placeholder="e.g. EIN, SSN" />
      <Field label="Website (optional)" placeholder="https://yourbusiness.com" />
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <Input placeholder={placeholder} className="bg-background border-border rounded-xl" />
    </div>
  );
}

/* ─── Move / Treasury Modal ─── */
function MoveModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-8 gap-5">
      {/* Vault icon area */}
      <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
        <Landmark className="h-14 w-14 text-muted-foreground" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-foreground">
          Meet <span className="text-primary">yangu Treasury</span>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Earn up to 6% effortlessly</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-2">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-tight">Earn yield<br />every minute</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center">
            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-tight">Invest in crypto<br />and tokenized stocks</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-tight">Send money<br />anywhere onchain</p>
        </div>
      </div>

      <Button variant="accent" className="w-full max-w-xs rounded-xl mt-2" onClick={onClose}>
        Join the waitlist
      </Button>

      <p className="text-[10px] text-muted-foreground mt-4 max-w-sm">
        yangu is a technology company, not a financial institution. All funds are held in USDT in a self-hosted wallet. USDT is a stablecoin pegged 1:1 to the U.S. dollar. Yield provided by third-party protocols. Balances not FDIC insured.
      </p>
    </div>
  );
}

/* ─── Existing sub-components ─── */

function OverviewTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Cash</h3>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">You have no cash. Deposit to get started</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Treasury</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-foreground font-medium">USDT</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium">6% APY ⓘ</span>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl text-xs">Request access</Button>
        </div>
      </div>
    </div>
  );
}

function EmptyTableTab({ columns, title, desc }: { columns: string[]; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th key={c} className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{c}</th>
            ))}
          </tr>
        </thead>
      </table>
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-16 w-16 rounded-2xl bg-muted/20 flex items-center justify-center">
          <Rocket className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">{desc}</p>
      </div>
      <div className="flex justify-end gap-2 p-3 border-t border-border">
        <Button size="sm" variant="ghost" disabled className="text-xs rounded-xl">Previous</Button>
        <Button size="sm" variant="ghost" disabled className="text-xs rounded-xl">Next</Button>
      </div>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-xs rounded-xl">⊕ Date range</Button>
          <Button size="sm" variant="ghost" className="text-xs rounded-xl">⊕ Status</Button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1"><ExternalLink className="h-3 w-3" /> Export</Button>
          <Button size="sm" variant="outline" className="text-xs rounded-xl gap-1"><Settings className="h-3 w-3" /> Edit</Button>
        </div>
      </div>
      <EmptyTableTab
        columns={["Amount", "Type", "From", "Destination", "Status", "Created at"]}
        title="No transactions yet"
        desc="Your activity will appear once some transactions are made."
      />
    </div>
  );
}
