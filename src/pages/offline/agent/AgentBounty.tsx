import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Field, Input, Table } from "../OfflineLayout";

export function AgentBounty({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    supabase.from("offline_foot_soldiers").select("*").eq("id", userId).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("offline_bounty_payouts").select("*").eq("foot_soldier_id", userId).order("created_at", { ascending: false }).then(({ data }) => setPayouts(data ?? []));
  };
  useEffect(load, [userId]);

  const requestPayout = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    await supabase.from("offline_bounty_payouts").insert({
      foot_soldier_id: userId, amount: n, method: "mobile_money", status: "requested",
    });
    setAmount(""); setBusy(false); load();
  };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Bounty</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ color: "#6B6660", fontSize: 13 }}>Balance</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#15261F" }}>{profile?.bounty_balance ?? 0}</div>
        </Card>
        <Card>
          <div style={{ color: "#6B6660", fontSize: 13 }}>Tier</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F46D2A", textTransform: "capitalize" }}>{profile?.tier ?? "bronze"}</div>
        </Card>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Request a payout</h3>
        <Field label="Amount">
          <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
        </Field>
        <Button onClick={requestPayout} disabled={busy || !amount}>Request</Button>
      </Card>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["When", "Amount", "Method", "Status"]}
          rows={payouts.map((p) => [new Date(p.created_at).toLocaleString(), p.amount, p.method, p.status])}
        />
      </Card>
    </>
  );
}