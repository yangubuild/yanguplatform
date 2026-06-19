/**
 * ADA TTS — multilingual speech synthesis.
 *
 * Primary:  ElevenLabs (eleven_multilingual_v2) for en/ar/fr/sw.
 * Fallback: Google Translate public TTS for lg/rw and any unsupported case.
 *
 * Returns base64 MP3 + provider used so the client can play it.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { requireUser } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Lang = "en" | "ar" | "fr" | "sw" | "lg" | "rw";

// ElevenLabs voice IDs (multilingual v2 supports these widely-spoken languages).
// Luganda + Kinyarwanda are NOT covered → fall back to Google.
const ELEVEN_VOICE_MAP: Partial<Record<Lang, string>> = {
  en: "EXAVITQu4vr4xnSDxMaL", // Sarah
  ar: "XrExE9yKIg1WjnnlVkGX", // Matilda (multilingual)
  fr: "FGY2WhTYpPnrIDTdsKH5", // Laura (multilingual)
  sw: "EXAVITQu4vr4xnSDxMaL", // Sarah (multilingual handles sw reasonably)
};

// Google Translate TTS uses ISO codes; lg unsupported, fall back to sw.
const GOOGLE_LANG_MAP: Record<Lang, string> = {
  en: "en", ar: "ar", fr: "fr", sw: "sw", lg: "sw", rw: "rw",
};

async function synthElevenLabs(text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`elevenlabs_${res.status}: ${body.slice(0, 200)}`);
  }
  return res.arrayBuffer();
}

/**
 * Google Translate public TTS. Free, no key, but limited to ~200 chars per call.
 * We chunk by sentence-ish boundary and concatenate MP3 frames.
 */
async function synthGoogleTTS(text: string, lang: string): Promise<ArrayBuffer> {
  const chunks: string[] = [];
  const max = 180;
  let buf = "";
  for (const word of text.split(/\s+/)) {
    if ((buf + " " + word).trim().length > max) {
      if (buf) chunks.push(buf.trim());
      buf = word;
    } else {
      buf = buf ? `${buf} ${word}` : word;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());

  const buffers: Uint8Array[] = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Referer": "https://translate.google.com/",
      },
    });
    if (!res.ok) throw new Error(`google_tts_${res.status}`);
    buffers.push(new Uint8Array(await res.arrayBuffer()));
  }
  // Concatenate MP3 frames (browsers play this fine for short clips).
  const total = buffers.reduce((n, b) => n + b.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const b of buffers) { out.set(b, off); off += b.length; }
  return out.buffer;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req, corsHeaders);
  if (auth.response) return auth.response;


  try {
    const { text, language, voice_id } = await req.json().catch(() => ({}));
    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return new Response(JSON.stringify({ ok: false, error: "missing_text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang: Lang = (["en","ar","fr","sw","lg","rw"] as const).includes(language)
      ? language as Lang : "en";

    const elevenKey = Deno.env.get("ELEVENLABS_API_KEY");
    const elevenVoice =
      (typeof voice_id === "string" && voice_id.trim().length > 0)
        ? voice_id.trim()
        : ELEVEN_VOICE_MAP[lang];

    let audio: ArrayBuffer | null = null;
    let provider: "elevenlabs" | "google" = "elevenlabs";
    let elevenError: string | null = null;

    if (elevenKey && elevenVoice) {
      try {
        audio = await synthElevenLabs(cleanText, elevenVoice, elevenKey);
      } catch (e) {
        elevenError = e instanceof Error ? e.message : String(e);
        console.warn("[ada-tts] elevenlabs failed, falling back:", elevenError);
      }
    }

    if (!audio) {
      provider = "google";
      audio = await synthGoogleTTS(cleanText, GOOGLE_LANG_MAP[lang]);
    }

    const base64 = base64Encode(new Uint8Array(audio));
    return new Response(
      JSON.stringify({
        ok: true,
        provider,
        language: lang,
        mime: "audio/mpeg",
        audio_base64: base64,
        eleven_error: elevenError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[ada-tts] error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
