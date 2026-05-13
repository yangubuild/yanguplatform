import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Card, Input, Table } from "../OfflineLayout";

export function AdminSyncActivity() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    supabase.from("offline_sync_log").select("*").order("received_at", { ascending: false }).limit(300)
      .then(({ data }) => setRows(data ?? []));
  }, []);

  const filtered = rows.filter((r) => !filter || r.event_type === filter);
  const types = Array.from(new Set(rows.map((r) => r.event_type)));

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Sync activity</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("")} style={{ background: filter === "" ? "#15261F" : "#fff", color: filter === "" ? "#fff" : "#15261F", border: "1px solid #E4E0D6", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>All</button>
        {types.map((t) => (
          <button key={t} onClick={() => setFilter(t)} style={{ background: filter === t ? "#15261F" : "#fff", color: filter === t ? "#fff" : "#15261F", border: "1px solid #E4E0D6", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>{t}</button>
        ))}
      </div>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["When", "Event", "Shop", "Payload"]}
          rows={filtered.map((r) => [
            new Date(r.received_at).toLocaleString(),
            <Badge tone="neutral">{r.event_type}</Badge>,
            r.shop_id ? r.shop_id.slice(0, 8) : "—",
            <code style={{ fontSize: 12 }}>{JSON.stringify(r.payload)}</code>,
          ])}
        />
      </Card>
    </>
  );
}