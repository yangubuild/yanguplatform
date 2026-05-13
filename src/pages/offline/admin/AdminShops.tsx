import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Button, Card, Input, Table, lastSeenLabel, lastSeenTone } from "../OfflineLayout";

export function AdminShops() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("offline_shops")
      .select("id, owner_name, owner_phone, location, status, last_seen_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const toggleBlock = async (id: string, status: string) => {
    const next = status === "blocked" ? "active" : "blocked";
    await supabase.from("offline_shops").update({ status: next }).eq("id", id);
    load();
  };

  const filtered = rows.filter((r) =>
    !q || [r.owner_name, r.owner_phone, r.location ?? ""].join(" ").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Shops ({filtered.length})</h2>
      <div style={{ marginBottom: 12, maxWidth: 360 }}>
        <Input placeholder="Search name, phone, location…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["Name", "Phone", "Location", "Last seen", "Status", "Actions"]}
          rows={filtered.map((r) => [
            r.owner_name, r.owner_phone, r.location ?? "—",
            <Badge tone={lastSeenTone(r.last_seen_at)}>{lastSeenLabel(r.last_seen_at)}</Badge>,
            <Badge tone={r.status === "active" ? "ok" : r.status === "blocked" ? "bad" : "warn"}>{r.status}</Badge>,
            <Button variant={r.status === "blocked" ? "primary" : "danger"} onClick={() => toggleBlock(r.id, r.status)}>
              {r.status === "blocked" ? "Unblock" : "Block"}
            </Button>,
          ])}
        />
      </Card>
    </>
  );
}