import {
  admin,
  authenticateShop,
  corsHeaders,
  json,
  logSync,
} from "../_shared/offlineSync.ts";

interface SaleRow {
  client_uuid: string;
  product_id?: string | null;
  amount: number;
  customer_phone?: string | null;
  payment_method?: string;
  occurred_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = await authenticateShop(req);
  if (!auth) return json({ error: "unauthorized" }, 401);

  let body: { sales?: SaleRow[] };
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const sales = Array.isArray(body.sales) ? body.sales : [];
  if (sales.length === 0) return json({ accepted: 0 });
  if (sales.length > 1000) return json({ error: "too_many" }, 400);

  const rows = sales
    .filter((s) => s && s.client_uuid && s.occurred_at && Number.isFinite(Number(s.amount)))
    .map((s) => ({
      shop_id: auth.shop_id,
      client_uuid: s.client_uuid,
      product_id: s.product_id ?? null,
      amount: Number(s.amount),
      customer_phone: s.customer_phone ?? null,
      payment_method: s.payment_method ?? "cash",
      occurred_at: s.occurred_at,
      synced_at: new Date().toISOString(),
    }));

  const sb = admin();

  // Idempotent insert: ignore conflicts on (shop_id, client_uuid)
  const { error, count } = await sb
    .from("offline_sales")
    .upsert(rows, { onConflict: "shop_id,client_uuid", ignoreDuplicates: true, count: "exact" });

  if (error) return json({ error: "insert_failed", detail: error.message }, 500);

  await logSync(auth.shop_id, "sales", { count: rows.length });

  return json({ accepted: count ?? rows.length });
});