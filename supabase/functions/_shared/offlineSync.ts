import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^tauri:\/\/localhost$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/([a-z0-9-]+\.)*lovable\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)*yangu\.(io|store|studio|site|community|live|shop)$/i,
];

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "*",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-shop-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

// Backwards-compatible default (no per-request origin echo).
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-shop-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200, req?: Request): Response {
  const headers = req ? buildCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashToken(token: string) {
  return sha256(token);
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface AuthedShop {
  shop_id: string;
  status: string;
}

export async function authenticateShop(req: Request): Promise<AuthedShop | null> {
  const token = req.headers.get("x-shop-token");
  if (!token) return null;
  const hash = await hashToken(token);
  const sb = admin();
  const { data, error } = await sb
    .from("offline_shops")
    .select("id, status")
    .eq("api_token_hash", hash)
    .maybeSingle();
  if (error || !data) return null;
  if (data.status === "blocked") return null;
  await sb
    .from("offline_shops")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id);
  return { shop_id: data.id, status: data.status };
}

export async function logSync(
  shop_id: string | null,
  event_type: string,
  payload: unknown,
) {
  await admin().from("offline_sync_log").insert({
    shop_id,
    event_type,
    payload: payload as never,
  });
}