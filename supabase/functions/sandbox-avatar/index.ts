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

const VOICE_MAP: Record<string, string> = {
  female_us: "en-US-JennyNeural",
  male_us: "en-US-GuyNeural",
  female_uk: "en-GB-SoniaNeural",
  male_uk: "en-GB-RyanNeural",
};

async function createDIDTalk(
  apiKey: string,
  imageUrl: string,
  text: string,
  voiceId: string,
): Promise<string> {
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
        provider: { type: "microsoft", voice_id: voiceId },
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

async function listDIDPresenters(apiKey: string): Promise<unknown[]> {
  const headers = { Authorization: `Basic ${apiKey}` };
  const out: any[] = [];
  // D-ID Studio "V3 Pro" presenters (Diana, Jaimie, Joseph, Lana, Anita, etc.)
  // are served from /clips/presenters/v2. The legacy /clips/presenters endpoint
  // returns multiple clip-looks of the same presenter (e.g. 12 cards of "Adam"),
  // which is what the user was seeing. Try v2 first, fall back to v1.
  const endpoints = [
    "https://api.d-id.com/clips/presenters/v2",
    "https://api.d-id.com/clips/presenters",
  ];
  for (const endpoint of endpoints) {
    const collected: any[] = [];
    let token: string | undefined;
    let ok = false;
    for (let i = 0; i < 8; i++) {
      const url = new URL(endpoint);
      url.searchParams.set("limit", "100");
      if (token) url.searchParams.set("token", token);
      const res = await fetch(url.toString(), { headers });
      if (!res.ok) break;
      ok = true;
      const data = await res.json();
      const list = data.presenters || data.results || [];
      if (Array.isArray(list)) collected.push(...list);
      token = data.token;
      if (!token) break;
    }
    if (ok && collected.length > 0) {
      out.push(...collected);
      break;
    }
  }
  return out;
}

// Explicit presenter ordering: these four names (as returned by D-ID's
// /clips/presenters API) are surfaced first, in this exact order. All other
// presenters keep their default API order after these four.
const PRIORITY_NAMES = ["diana", "jaimie", "joseph", "lana"];

function priorityRank(a: { id: string; name: string }): number {
  const name = (a.name || "").trim().toLowerCase();
  const idx = PRIORITY_NAMES.indexOf(name);
  return idx === -1 ? PRIORITY_NAMES.length : idx;
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
      const presenterImage = (body as any).presenter_image_url as string | undefined;
      if (!body.image_base64 && !presenterImage) {
        return json({ ok: false, error: "image_base64 or presenter_image_url required" }, 400);
      }
      if (body.image_base64 && body.image_base64.length > 7_000_000) {
        return json({ ok: false, error: "Image too large (max 5MB)" }, 400);
      }
      const voiceKey = ((body as any).voice as string | undefined) || "female_us";
      const voiceId = VOICE_MAP[voiceKey] || VOICE_MAP.female_us;
      const name = (body.name || "there").toString().slice(0, 40).replace(/[^\p{L}\p{N}\s'-]/gu, "");
      // Optional custom script (used by Studio); sandbox uses default greeting.
      const customScript = (body as any).script as string | undefined;
      const script = customScript && customScript.trim().length > 0
        ? customScript.toString().slice(0, 1000)
        : `Hi, I'm ${name || "there"}, and I build with Yangu.`;
      const imageUrl = presenterImage
        ? presenterImage
        : await uploadImageToDID(apiKey, body.image_base64!);
      try {
        const videoUrl = await createDIDTalk(apiKey, imageUrl, script, voiceId);
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

    if (action === "did-presenters" || action === "creatify-avatars") {
      const apiKey = Deno.env.get("DID_API_KEY");
      if (!apiKey) return json({ ok: false, error: "D-ID not configured" }, 500);
      const raw = await listDIDPresenters(apiKey);
      const mapped = raw.map((a: any) => ({
        id: a.presenter_id || a.id,
        name: a.name || a.presenter_id || "Presenter",
        preview_url: a.thumbnail_url || a.image_url || a.preview_url || null,
        source_url: a.image_url || a.source_url || a.thumbnail_url || null,
        gender: a.gender || null,
      })).filter((a: any) => a.id && a.preview_url && a.source_url);
      // Dedupe non-priority presenters by name (D-ID returns multiple "looks"
      // per presenter). For priority names (Diana, Jaimie, Joseph, Lana), keep
      // ALL variations so users see the full range of diverse avatar options.
      const seenOther = new Set<string>();
      const filtered = mapped.filter((a) => {
        const key = (a.name || "").trim().toLowerCase();
        if (PRIORITY_NAMES.includes(key)) return true;
        if (!key || seenOther.has(key)) return false;
        seenOther.add(key);
        return true;
      });
      // Stable sort: ALL variations of priority presenters first, grouped in
      // the exact PRIORITY_NAMES order; all other presenters retain original
      // API order after.
      const avatars = filtered
        .map((a, i) => ({ a, i, s: priorityRank(a) }))
        .sort((x, y) => x.s - y.s || x.i - y.i)
        .map((x) => x.a)
        .slice(0, 48);
      return json({ ok: true, avatars });
    }

    return json({ ok: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[sandbox-avatar] error:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});