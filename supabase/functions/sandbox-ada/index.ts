import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string, max = 12, windowMs = 60_000): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < now) {
    hits.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  cur.count++;
  return cur.count > max;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) {
      return json({ ok: false, error: "Too many requests. Try again in a minute." }, 429);
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ ok: false, error: "AI not configured" }, 500);

    const body = await req.json().catch(() => ({})) as {
      system?: string;
      prompt?: string;
    };
    const system = (body.system || "You are Ada, a helpful assistant.").slice(0, 4000);
    const prompt = (body.prompt || "").slice(0, 4000);
    if (!prompt.trim()) return json({ ok: false, error: "prompt required" }, 400);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (res.status === 429) return json({ ok: false, error: "Rate limited. Try again shortly." }, 429);
    if (res.status === 402) return json({ ok: false, error: "AI credits exhausted." }, 402);
    if (!res.ok) {
      const t = await res.text();
      return json({ ok: false, error: `AI error ${res.status}: ${t.slice(0, 200)}` }, 500);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return json({ ok: true, text });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});