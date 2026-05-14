import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PhoneOtpLogin } from "../PhoneOtpLogin";
import { OfflineLayout, Card, Table, Badge, lastSeenLabel, lastSeenTone } from "../OfflineLayout";
import { offlineTheme as t } from "../theme";

function ShopHome({ shop }: { shop: any }) {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>{shop.owner_name}</h2>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Badge tone={shop.status === "active" ? "ok" : "bad"}>{shop.status}</Badge>
        <Badge tone={lastSeenTone(shop.last_seen_at)}>Last sync: {lastSeenLabel(shop.last_seen_at)}</Badge>
        <span style={{ color: "#6B6660", fontSize: 14 }}>{shop.owner_phone} · {shop.location ?? "—"}</span>
      </div>
      <Card>This is a read-only mirror of your shop. Editing from the web is coming soon.</Card>
    </>
  );
}

function ShopCatalog({ shopId }: { shopId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("offline_catalogs").select("*").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(500)
      .then(({ data }) => setRows(data ?? []));
  }, [shopId]);
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Catalog ({rows.length})</h2>
      <Card style={{ padding: 0 }}>
        <Table headers={["Name", "Category", "Price", "Stock"]} rows={rows.map((r) => [r.name, r.category ?? "—", r.price, r.stock_count])} />
      </Card>
    </>
  );
}

function ShopSales({ shopId }: { shopId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("offline_sales").select("*").eq("shop_id", shopId).order("occurred_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows(data ?? []));
  }, [shopId]);
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Recent sales ({rows.length})</h2>
      <Card style={{ padding: 0 }}>
        <Table headers={["When", "Amount", "Method", "Customer"]} rows={rows.map((r) => [new Date(r.occurred_at).toLocaleString(), r.amount, r.payment_method, r.customer_phone ?? "—"])} />
      </Card>
    </>
  );
}

export default function ShopApp() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [shop, setShop] = useState<any | null | undefined>(undefined);

  useEffect(() => {
    const load = async (uid: string | null) => {
      setUserId(uid);
      if (!uid) { setShop(null); return; }
      const { data: u } = await supabase.auth.getUser();
      const phone = u.user?.phone;
      if (!phone) { setShop(null); return; }
      const { data } = await supabase.from("offline_shops").select("*").eq("owner_phone", phone).maybeSingle();
      setShop(data ?? null);
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => load(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (userId === undefined) return null;
  if (!userId) return <PhoneOtpLogin title="Shop owner login" subtitle="Sign in with the phone number on your shop." onSuccess={() => {}} />;
  if (shop === undefined) return null;

  if (!shop) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: t.fontFamily, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ maxWidth: 420, color: t.text }}>
          <h2 style={{ marginTop: 0, color: t.text }}>No shop linked</h2>
          <p style={{ color: t.text, lineHeight: 1.5 }}>
            We could not find a shop registered with this phone number. Ask your foot soldier to register you.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >Sign out</button>
        </Card>
      </div>
    );
  }

  return (
    <OfflineLayout
      title="Shop owner"
      nav={[
        { to: "/offline/shop", label: "Overview" },
        { to: "/offline/shop/catalog", label: "Catalog" },
        { to: "/offline/shop/sales", label: "Sales" },
      ]}
      rightSlot={
        <button onClick={() => supabase.auth.signOut()} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>Sign out</button>
      }
    >
      <Routes>
        <Route index element={<ShopHome shop={shop} />} />
        <Route path="catalog" element={<ShopCatalog shopId={shop.id} />} />
        <Route path="sales" element={<ShopSales shopId={shop.id} />} />
        <Route path="*" element={<Navigate to="/offline/shop" replace />} />
      </Routes>
    </OfflineLayout>
  );
}