import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Upload, ArrowLeftRight, MoreVertical, Rocket, ExternalLink, Settings, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type Tab = "overview" | "withdrawals" | "topups" | "activity";

export default function BusinessDepositPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [businessTitle, setBusinessTitle] = useState("");

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

  return (
    <div className="p-6 space-y-6 max-w-5xl">
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
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 border-primary/30 text-primary"><Download className="h-3.5 w-3.5" /> Deposit</Button>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 border-primary/30 text-primary"><Upload className="h-3.5 w-3.5" /> Withdraw</Button>
          <Button size="sm" variant="outline" className="rounded-xl gap-1.5 border-primary/30 text-primary"><ArrowLeftRight className="h-3.5 w-3.5" /> Move</Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
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
      {tab === "withdrawals" && <EmptyTableTab columns={["Amount", "Status", "Sent to", "Initiated at", "Estimated arrival", "Receipt"]} title="No withdrawals yet" desc="When you withdraw money from your YANGU account, it will be displayed here." />}
      {tab === "topups" && <EmptyTableTab columns={["Amount", "Status", "Method", "Created"]} title="No deposits yet" desc="Your deposits will appear here once you make a top-up." />}
      {tab === "activity" && <ActivityTab />}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center max-w-2xl mx-auto">
        *YANGU is a technology company, not a bank. Cash balances are held for you at partner banks. Balances are not FDIC insured.
      </p>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-4">
      {/* Cash */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Cash</h3>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">You have no cash. Deposit to get started</p>
        </div>
      </div>

      {/* Treasury */}
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
