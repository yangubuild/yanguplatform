// Shared auth gate for edge functions that should only be callable by
// authenticated users. Validates the JWT against Supabase and returns the
// user record on success, or a 401 Response on failure.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireUser(req: Request, corsHeaders: Record<string, string>) {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return {
      user: null,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    } as const;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace(/^[Bb]earer\s+/, "");
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return {
      user: null,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    } as const;
  }

  return { user: data.user, response: null as Response | null } as const;
}

// In-memory per-IP rate limiter for guest endpoints. Cleared on cold start.
const rateBuckets = new Map<string, { count: number; windowStart: number }>();

export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= opts.windowMs) {
    rateBuckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= opts.max) {
    return { allowed: false, retryAfterSec: Math.ceil((opts.windowMs - (now - bucket.windowStart)) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}