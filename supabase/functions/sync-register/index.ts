import {
  admin,
  buildCorsHeaders,
  generateToken,
  hashToken,
  json,
  logSync,
} from "../_shared/offlineSync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: buildCorsHeaders(req) });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, req);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid_json" }, 400, req); }

  const owner_name = String(body.owner_name ?? "").trim();
  const owner_phone = String(body.owner_phone ?? "").trim();
  const location = body.location ? String(body.location) : null;
  const language = body.language ? String(body.language) : "en";
  const foot_soldier_phone = body.foot_soldier_phone
    ? String(body.foot_soldier_phone).trim()
    : null;

  if (!owner_name || owner_name.length > 200) return json({ error: "invalid_owner_name" }, 400, req);
  if (!owner_phone || owner_phone.length > 30) return json({ error: "invalid_owner_phone" }, 400, req);

  const sb = admin();

  let onboarded_by: string | null = null;
  if (foot_soldier_phone) {
    const { data: fs } = await sb
      .from("offline_foot_soldiers")
      .select("id")
      .eq("phone", foot_soldier_phone)
      .maybeSingle();
    onboarded_by = fs?.id ?? null;
  }

  const token = generateToken();
  const api_token_hash = await hashToken(token);

  const { data, error } = await sb
    .from("offline_shops")
    .insert({
      owner_name,
      owner_phone,
      location,
      language,
      onboarded_by,
      status: "active",
      api_token_hash,
      last_seen_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return json({ error: "insert_failed", detail: error?.message }, 500, req);

  await logSync(data.id, "register", { owner_phone, onboarded_by });

  return json({ shop_id: data.id, api_token: token }, 200, req);
});