import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Field, Input } from "../OfflineLayout";

export function AgentAddShop({ userId }: { userId: string }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [form, setForm] = useState({ owner_name: "", owner_phone: "", location: "", language: "en" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ shop_id: string; api_token: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setPhone(data.user?.phone ?? null));
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { data, error } = await supabase.functions.invoke("sync-register", {
      body: { ...form, foot_soldier_phone: phone },
    });
    setBusy(false);
    if (error || !(data as any)?.shop_id) { setErr(error?.message ?? "Failed"); return; }
    setResult(data as any);
  };

  if (result) {
    return (
      <Card>
        <h2 style={{ marginTop: 0, color: "#15261F" }}>Shop created</h2>
        <p>Hand this token to the shop owner — it will not be shown again.</p>
        <div style={{ background: "#F3F1EB", padding: 12, borderRadius: 8, fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", border: "1px solid #E4E0D6" }}>
          {result.api_token}
        </div>
        <p style={{ color: "#6B6660", fontSize: 13, marginTop: 12 }}>Shop ID: {result.shop_id}</p>
        <div style={{ marginTop: 12 }}>
          <Button onClick={() => { setResult(null); setForm({ owner_name: "", owner_phone: "", location: "", language: "en" }); }}>Add another</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 style={{ marginTop: 0 }}>Add a new shop</h2>
      <form onSubmit={submit}>
        <Field label="Owner name"><Input required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></Field>
        <Field label="Owner phone"><Input required type="tel" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} /></Field>
        <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Language">
          <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
        </Field>
        {err && <div style={{ color: "#9B221A", fontSize: 13, marginBottom: 8 }}>{err}</div>}
        <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create shop"}</Button>
      </form>
    </Card>
  );
}