// Mints an ephemeral OpenAI Realtime session for browser WebRTC clients.
// The client uses `client_secret.value` as a Bearer token to negotiate
// a WebRTC SDP offer/answer with https://api.openai.com/v1/realtime

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_PROMPT = `You are ADA, the voice builder assistant for YANGU.
Your job: guide the user through a short, friendly conversation to set up their business surface.
Ask ONE thing at a time, in this order, and wait for the user's spoken answer between each:
1. What kind of business they want to build (eshop / emenu / esite / estore / community / influencer).
2. Business name + a one-line description.
3. Whether they already have a logo (yes/no). If no, ask if ADA should create one.
4. Brand colors (free text or hex).
5. Location (city / country).
6. Visual style preference (modern, minimal, bold, african, luxury, playful...).
After collecting everything, say a short confirmation like "Great, I'm building your site now."
Be warm, concise, and conversational. Never read long lists. Never speak more than two short sentences in a row.`;

const LANGUAGE_ADDONS: Record<string, string> = {
  en: "Speak in English.",
  sw: "Speak in Swahili (Kiswahili).",
  fr: "Parle en français.",
  ar: "تحدث بالعربية.",
  lg: "Yogera mu Luganda.",
  rw: "Vuga mu Kinyarwanda.",
};

const WHISPER_LANG: Record<string, string> = {
  en: "en", sw: "sw", fr: "fr", ar: "ar",
  // whisper has no lg/rw — fall back to auto by omitting language
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: { language?: string; voice?: string } = {};
    try { body = await req.json(); } catch { /* allow empty */ }
    const language = (body.language || "en").toLowerCase();
    const voice = body.voice || "marin";

    const instructions =
      BASE_PROMPT + "\n" + (LANGUAGE_ADDONS[language] ?? LANGUAGE_ADDONS.en);

    // GA Realtime API: POST /v1/realtime/client_secrets with { session: {...} }
    const openAiHeaders = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    console.log("HEADERS", {
      Authorization: "Bearer sk_…",
      "Content-Type": openAiHeaders["Content-Type"],
    });

    const r = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: openAiHeaders,
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions,
          audio: {
            input: {
              turn_detection: { type: "server_vad" },
            },
            output: { voice },
          },
        },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("[realtime-token] OpenAI error", r.status, errText);
      return new Response(
        JSON.stringify({ error: "OpenAI session create failed", status: r.status, detail: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await r.json();

    // GA response shape: { value: "ek_...", expires_at: 123, session: {...} }
    // Some variants nest under client_secret — handle both.
    const secretValue = data?.value ?? data?.client_secret?.value;
    const secretExp = data?.expires_at ?? data?.client_secret?.expires_at;

    return new Response(
      JSON.stringify({
        client_secret: secretValue,
        expires_at: secretExp,
        model: "gpt-realtime",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[realtime-token] error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});