import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Defaults ────────────────────────────────────────────────────────
const DEFAULT_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 800;
const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";

// ── Reusable Together helper ────────────────────────────────────────
interface TogetherMessage {
  role: string;
  content: string;
}

interface TogetherRequestOpts {
  messages: TogetherMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface TogetherSuccess {
  success: true;
  provider: "together";
  model: string;
  content: string;
  raw: unknown;
}

interface TogetherFailure {
  success: false;
  provider: "together";
  error: string;
}

type TogetherResult = TogetherSuccess | TogetherFailure;

async function callTogether(opts: TogetherRequestOpts): Promise<TogetherResult> {
  const apiKey = Deno.env.get("TOGETHER_API_KEY");
  if (!apiKey) {
    return { success: false, provider: "together", error: "TOGETHER_API_KEY is not configured" };
  }

  const model = opts.model || DEFAULT_MODEL;
  const temperature = opts.temperature ?? DEFAULT_TEMPERATURE;
  const max_tokens = opts.max_tokens ?? DEFAULT_MAX_TOKENS;

  const response = await fetch(TOGETHER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const text = await response.text();
    console.error("Together API error:", status, text);
    return {
      success: false,
      provider: "together",
      error: status === 429 ? "Rate limited by Together AI. Try again shortly." :
             status === 401 ? "Invalid Together API key." :
             `Together API returned ${status}`,
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  return { success: true, provider: "together", model, content, raw: data };
}

// ── Validation ──────────────────────────────────────────────────────
function validateMessages(messages: unknown): string | null {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "messages must be a non-empty array";
  }
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m !== "object") return `messages[${i}] is invalid`;
    if (typeof m.role !== "string" || m.role.trim() === "") return `messages[${i}].role is required`;
    if (typeof m.content !== "string" || m.content.trim() === "") return `messages[${i}].content is required`;
  }
  return null;
}

// ── Handler ─────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, provider: "together", error: "Only POST allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("together-chat: invoked");

  try {
    const body = await req.json();
    const { messages, model, temperature, max_tokens } = body;

    const validationError = validateMessages(messages);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, provider: "together", error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await callTogether({ messages, model, temperature, max_tokens });
    const status = result.success ? 200 : 502;

    console.log("together-chat:", result.success ? "success" : "failure");

    return new Response(JSON.stringify(result), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("together-chat error:", e);
    return new Response(
      JSON.stringify({ success: false, provider: "together", error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
