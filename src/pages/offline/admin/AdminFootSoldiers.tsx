import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Button, Card, Table } from "../OfflineLayout";

export function AdminFootSoldiers() {
  const [rows, setRows] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const load = async () => {
    const { data: fs } = await supabase.from("offline_foot_soldiers").select("*").order("joined_at", { ascending: false });
    setRows(fs ?? []);
    const { data: p } = await supabase.from("offline_bounty_payouts").select("*").order("created_at", { ascending: false }).limit(100);
    setPayouts(p ?? []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "paid" | "rejected" | "approved" | "requested") => {
    await supabase.from("offline_bounty_payouts").update({ status }).eq("id", id);
    load();
  };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Foot soldiers ({rows.length})</h2>
      <Card style={{ padding: 0, marginBottom: 24 }}>
        <Table
          headers={["Name", "Phone", "Region", "Tier", "Balance"]}
          rows={rows.map((r) => [r.name ?? "—", r.phone, r.region ?? "—", r.tier, Number(r.bounty_balance).toLocaleString()])}
        />
      </Card>

      <h3>Payout requests</h3>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["When", "Foot soldier", "Amount", "Method", "Status", "Actions"]}
          rows={payouts.map((p) => {
            const fs = rows.find((r) => r.id === p.foot_soldier_id);
            return [
              new Date(p.created_at).toLocaleString(),
              fs ? `${fs.name ?? fs.phone}` : p.foot_soldier_id.slice(0, 8),
              Number(p.amount).toLocaleString(),
              p.method,
              <Badge tone={p.status === "paid" ? "ok" : p.status === "rejected" ? "bad" : "warn"}>{p.status}</Badge>,
              p.status === "requested" ? (
                <span style={{ display: "flex", gap: 6 }}>
                  <Button onClick={() => setStatus(p.id, "paid")}>Mark paid</Button>
                  <Button variant="ghost" onClick={() => setStatus(p.id, "rejected")}>Reject</Button>
                </span>
              ) : "—",
            ];
          })}
        />
      </Card>
    </>
  );
}