import {
  admin,
  authenticateShop,
  buildCorsHeaders,
  json,
  logSync,
} from "../_shared/offlineSync.ts";

interface CatalogItem {
  client_uuid: string;
  name: string;
  description?: string | null;
  price?: number;
  stock_count?: number;
  category?: string | null;
  photo_url?: string | null;
  language?: string;
  sync_version?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: buildCorsHeaders(req) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, req);

  const auth = await authenticateShop(req);
  if (!auth) return json({ error: "unauthorized" }, 401, req);

  let body: { items?: CatalogItem[] };
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400, req); }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return json({ accepted: 0 }, 200, req);
  if (items.length > 500) return json({ error: "too_many" }, 400, req);

  const sb = admin();
  const rows = items
    .filter((i) => i && i.client_uuid && i.name)
    .map((i) => ({
      shop_id: auth.shop_id,
      client_uuid: i.client_uuid,
      name: String(i.name).slice(0, 200),
      description: i.description ?? null,
      price: Number(i.price ?? 0),
      stock_count: Number(i.stock_count ?? 0),
      category: i.category ?? null,
      photo_url: i.photo_url ?? null,
      language: i.language ?? "en",
      sync_version: Number(i.sync_version ?? 0),
      updated_at: new Date().toISOString(),
    }));

  // Upsert with last-write-wins via sync_version checked in DB? We use simple onConflict upsert.
  const { error, count } = await sb
    .from("offline_catalogs")
    .upsert(rows, { onConflict: "shop_id,client_uuid", count: "exact" });

  if (error) return json({ error: "upsert_failed", detail: error.message }, 500, req);

  await logSync(auth.shop_id, "catalog", { count: rows.length });

  return json({ accepted: count ?? rows.length }, 200, req);
});