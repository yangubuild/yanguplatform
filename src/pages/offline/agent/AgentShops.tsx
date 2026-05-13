import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Card, Table, lastSeenLabel, lastSeenTone } from "../OfflineLayout";

interface Row {
  id: string; owner_name: string; owner_phone: string; location: string | null;
  status: string; last_seen_at: string | null; created_at: string;
}

export function AgentShops({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("offline_shops")
      .select("id, owner_name, owner_phone, location, status, last_seen_at, created_at")
      .eq("onboarded_by", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setRows((data as Row[]) ?? []); setLoading(false); });
  }, [userId]);

  if (loading) return <Card>Loading…</Card>;

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Your shops ({rows.length})</h2>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["Shop", "Phone", "Location", "Last seen", "Status"]}
          rows={rows.map((r) => [
            <Link to={`/offline/agent/shop/${r.id}`} style={{ color: "#15261F", fontWeight: 600 }}>{r.owner_name}</Link>,
            r.owner_phone,
            r.location ?? "—",
            <Badge tone={lastSeenTone(r.last_seen_at)}>{lastSeenLabel(r.last_seen_at)}</Badge>,
            <Badge tone={r.status === "active" ? "ok" : r.status === "blocked" ? "bad" : "warn"}>{r.status}</Badge>,
          ])}
        />
      </Card>
    </>
  );
}