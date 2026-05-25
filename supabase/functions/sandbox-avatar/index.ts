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

// Very small in-memory rate limit (per-isolate). Sandbox use only.
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || cur.reset < now) {
    hits.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }
  cur.count++;
  return cur.count > max;
}

async function uploadImageToDID(apiKey: string, imageBase64: string): Promise<string> {
  // imageBase64 is a data URL: data:image/png;base64,...
  const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data URL");
  const mime = match[1];
  const bin = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  const ext = mime.split("/")[1] || "png";
  const blob = new Blob([bin], { type: mime });
  const form = new FormData();
  form.append("image", blob, `upload.${ext}`);
  const res = await fetch("https://api.d-id.com/images", {
    method: "POST",
    headers: { Authorization: `Basic ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`D-ID image upload ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error("D-ID image upload returned no url");
  return data.url as string;
}

async function createDIDTalk(apiKey: string, imageUrl: string, text: string): Promise<string> {
  const createRes = await fetch("https://api.d-id.com/talks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      source_url: imageUrl,
      script: {
        type: "text",
        input: text,
        provider: { type: "microsoft", voice_id: "en-US-JennyNeural" },
      },
    }),
  });
  if (!createRes.ok) {
    const t = await createRes.text();
    const err: any = new Error(`D-ID talks ${createRes.status}: ${t.slice(0, 200)}`);
    err.status = createRes.status;
    err.body = t;
    throw err;
  }
  const create = await createRes.json();
  const id = create.id;
  if (!id) throw new Error("D-ID returned no talk id");

  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const pollRes = await fetch(`https://api.d-id.com/talks/${id}`, {
      headers: { Authorization: `Basic ${apiKey}` },
    });
    if (!pollRes.ok) continue;
    const poll = await pollRes.json();
    if (poll.status === "done" && poll.result_url) return poll.result_url as string;
    if (poll.status === "error" || poll.status === "rejected") {
      throw new Error(poll.error?.description || "D-ID generation failed");
    }
  }
  throw new Error("D-ID timed out");
}

async function listCreatifyAvatars(apiId: string, apiKey: string): Promise<unknown[]> {
  const headers = { "X-API-ID": apiId, "X-API-KEY": apiKey };
  // Try personas endpoint first, fall back to avatars
  const endpoints = [
    "https://api.creatify.ai/api/personas/",
    "https://api.creatify.ai/api/avatars/",
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) continue;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.results || data.data || [];
      if (Array.isArray(list) && list.length) return list;
    } catch (_) { /* try next */ }
  }
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) {
      return json({ ok: false, error: "Too many sandbox requests. Try again in a minute." }, 429);
    }

    const body = await req.json().catch(() => ({})) as {
      action?: string;
      image_base64?: string;
      name?: string;
    };
    const action = body.action;

    if (action === "did-talk") {
      const apiKey = Deno.env.get("DID_API_KEY");
      if (!apiKey) return json({ ok: false, error: "D-ID not configured" }, 500);
      if (!body.image_base64) return json({ ok: false, error: "image_base64 required" }, 400);
      // 5MB cap on the decoded payload (~ length * 0.75)
      if (body.image_base64.length > 7_000_000) {
        return json({ ok: false, error: "Image too large (max 5MB)" }, 400);
      }
      const name = (body.name || "there").toString().slice(0, 40).replace(/[^\p{L}\p{N}\s'-]/gu, "");
      const script = `Hi, I'm ${name || "there"}, and I build with Yangu.`;
      const imageUrl = await uploadImageToDID(apiKey, body.image_base64);
      try {
        const videoUrl = await createDIDTalk(apiKey, imageUrl, script);
        return json({ ok: true, video_url: videoUrl, image_url: imageUrl });
      } catch (e: any) {
        const status = e?.status as number | undefined;
        const insufficient =
          status === 402 ||
          (typeof e?.body === "string" && e.body.includes("InsufficientCreditsError"));
        if (insufficient) {
          return json({
            ok: true,
            fallback: true,
            image_url: imageUrl,
            video_url: null,
            notice:
              "Talking avatar preview is at capacity right now. Your photo is ready to use in your brand card.",
          });
        }
        if (status && status >= 400 && status < 500) {
          return json({
            ok: false,
            fallback: true,
            error: "Couldn't generate a talking preview from that photo. Try a clearer face-on shot.",
          }, 200);
        }
        throw e;
      }
    }

    if (action === "creatify-avatars") {
      const apiId = Deno.env.get("CREATIFY_API_ID");
      const apiKey = Deno.env.get("CREATIFY_API_KEY");
      if (!apiId || !apiKey) return json({ ok: false, error: "Creatify not configured" }, 500);
      const raw = await listCreatifyAvatars(apiId, apiKey);
      const avatars = raw.slice(0, 24).map((a: any) => ({
        id: a.id || a.persona_id || a.avatar_id,
        name: a.name || a.label || a.title || "Avatar",
        preview_url:
          a.preview_image_url ||
          a.preview_url ||
          a.thumbnail_url ||
          a.image_url ||
          a.avatar_url ||
          null,
        gender: a.gender || null,
      })).filter((a: any) => a.id && a.preview_url);
      return json({ ok: true, avatars });
    }

    return json({ ok: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[sandbox-avatar] error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});