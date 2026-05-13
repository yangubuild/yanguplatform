import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "../OfflineLayout";

export function AdminOverview() {
  const [stats, setStats] = useState({ shops: 0, agents: 0, sales7d: 0, salesAmount7d: 0, owedBounty: 0 });
  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ count: shops }, { count: agents }, sales, payouts] = await Promise.all([
        supabase.from("offline_shops").select("id", { count: "exact", head: true }),
        supabase.from("offline_foot_soldiers").select("id", { count: "exact", head: true }),
        supabase.from("offline_sales").select("amount").gte("occurred_at", since),
        supabase.from("offline_foot_soldiers").select("bounty_balance"),
      ]);
      const sumAmt = (sales.data ?? []).reduce((a, r: any) => a + Number(r.amount || 0), 0);
      const owed = (payouts.data ?? []).reduce((a, r: any) => a + Number(r.bounty_balance || 0), 0);
      setStats({ shops: shops ?? 0, agents: agents ?? 0, sales7d: sales.data?.length ?? 0, salesAmount7d: sumAmt, owedBounty: owed });
    })();
  }, []);

  const tile = (label: string, value: string | number) => (
    <Card>
      <div style={{ color: "#6B6660", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#15261F" }}>{value}</div>
    </Card>
  );

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {tile("Total shops", stats.shops)}
        {tile("Foot soldiers", stats.agents)}
        {tile("Sales (7d)", stats.sales7d)}
        {tile("Sales amount (7d)", stats.salesAmount7d.toLocaleString())}
        {tile("Bounty owed", stats.owedBounty.toLocaleString())}
      </div>
    </>
  );
}