import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Field, Input, Table } from "../OfflineLayout";

export function AdminBountyConfig() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ tier: "", rate_per_shop: "", rate_per_sale_pct: "" });

  const load = async () => {
    const { data } = await supabase.from("offline_bounty_rates").select("*").order("effective_from", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tier) return;
    await supabase.from("offline_bounty_rates").insert({
      tier: form.tier,
      rate_per_shop: Number(form.rate_per_shop || 0),
      rate_per_sale_pct: Number(form.rate_per_sale_pct || 0),
    });
    setForm({ tier: "", rate_per_shop: "", rate_per_sale_pct: "" });
    load();
  };

  return (
    <>
      <h2 style={{ marginTop: 0 }}>Bounty rates</h2>
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Add a new rate row</h3>
        <form onSubmit={submit}>
          <Field label="Tier"><Input value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} placeholder="bronze / silver / gold" /></Field>
          <Field label="Rate per shop"><Input type="number" value={form.rate_per_shop} onChange={(e) => setForm({ ...form, rate_per_shop: e.target.value })} /></Field>
          <Field label="Rate per sale (fraction, e.g. 0.01)"><Input type="number" step="0.0001" value={form.rate_per_sale_pct} onChange={(e) => setForm({ ...form, rate_per_sale_pct: e.target.value })} /></Field>
          <Button type="submit">Save rate</Button>
        </form>
      </Card>
      <Card style={{ padding: 0 }}>
        <Table
          headers={["Tier", "Per shop", "Per sale", "Effective from"]}
          rows={rows.map((r) => [r.tier, Number(r.rate_per_shop).toLocaleString(), r.rate_per_sale_pct, new Date(r.effective_from).toLocaleString()])}
        />
      </Card>
    </>
  );
}