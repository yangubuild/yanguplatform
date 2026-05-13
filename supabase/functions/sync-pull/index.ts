import {
  admin,
  authenticateShop,
  corsHeaders,
  json,
} from "../_shared/offlineSync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const auth = await authenticateShop(req);
  if (!auth) return json({ error: "unauthorized" }, 401);

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(0);
  if (Number.isNaN(sinceDate.getTime())) return json({ error: "invalid_since" }, 400);

  const sb = admin();
  const { data, error } = await sb
    .from("offline_catalogs")
    .select(
      "id, client_uuid, name, description, price, stock_count, category, photo_url, language, sync_version, updated_at",
    )
    .eq("shop_id", auth.shop_id)
    .gt("updated_at", sinceDate.toISOString())
    .order("updated_at", { ascending: true })
    .limit(500);

  if (error) return json({ error: "pull_failed", detail: error.message }, 500);

  const cursor = data && data.length > 0
    ? data[data.length - 1].updated_at
    : sinceDate.toISOString();

  return json({ catalogs: data ?? [], cursor });
});