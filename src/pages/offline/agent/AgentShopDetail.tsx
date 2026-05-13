import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Card, Table, lastSeenLabel, lastSeenTone } from "../OfflineLayout";

type Tab = "catalog" | "sales" | "sync";

export function AgentShopDetail() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("catalog");
  const [catalog, setCatalog] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("offline_shops").select("*").eq("id", id).maybeSingle().then(({ data }) => setShop(data));
    supabase.from("offline_catalogs").select("*").eq("shop_id", id).order("updated_at", { ascending: false }).limit(200).then(({ data }) => setCatalog(data ?? []));
    supabase.from("offline_sales").select("*").eq("shop_id", id).order("occurred_at", { ascending: false }).limit(50).then(({ data }) => setSales(data ?? []));
    supabase.from("offline_sync_log").select("*").eq("shop_id", id).order("received_at", { ascending: false }).limit(50).then(({ data }) => setLogs(data ?? []));
  }, [id]);

  if (!shop) return <Card>Loading shop…</Card>;

  return (
    <>
      <Link to="/offline/agent" style={{ color: "#15261F", fontSize: 14 }}>&larr; All shops</Link>
      <h2 style={{ marginTop: 8 }}>{shop.owner_name}</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Badge tone={shop.status === "active" ? "ok" : "warn"}>{shop.status}</Badge>
        <Badge tone={lastSeenTone(shop.last_seen_at)}>Last sync: {lastSeenLabel(shop.last_seen_at)}</Badge>
        <span style={{ color: "#6B6660", fontSize: 14 }}>{shop.owner_phone} · {shop.location ?? "—"}</span>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E4E0D6", marginBottom: 16 }}>
        {(["catalog", "sales", "sync"] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: "transparent", border: "none",
            padding: "10px 14px", cursor: "pointer", fontWeight: 600,
            color: tab === k ? "#F46D2A" : "#15261F",
            borderBottom: tab === k ? "2px solid #F46D2A" : "2px solid transparent",
          }}>{k === "catalog" ? `Catalog (${catalog.length})` : k === "sales" ? `Sales (${sales.length})` : `Sync (${logs.length})`}</button>
        ))}
      </div>

      <Card style={{ padding: 0 }}>
        {tab === "catalog" && (
          <Table
            headers={["Name", "Category", "Price", "Stock", "Updated"]}
            rows={catalog.map((c) => [c.name, c.category ?? "—", c.price, c.stock_count, new Date(c.updated_at).toLocaleString()])}
          />
        )}
        {tab === "sales" && (
          <Table
            headers={["When", "Amount", "Method", "Customer"]}
            rows={sales.map((s) => [new Date(s.occurred_at).toLocaleString(), s.amount, s.payment_method, s.customer_phone ?? "—"])}
          />
        )}
        {tab === "sync" && (
          <Table
            headers={["When", "Event", "Payload"]}
            rows={logs.map((l) => [new Date(l.received_at).toLocaleString(), l.event_type, <code style={{ fontSize: 12 }}>{JSON.stringify(l.payload)}</code>])}
          />
        )}
      </Card>
    </>
  );
}