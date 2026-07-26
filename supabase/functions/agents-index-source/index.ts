// Phase 7 — Index/embed a knowledge source for retrieval.
//
// Request: { sourceId: string }
// - Loads the source (org-scoped, RLS via user JWT)
// - Extracts plaintext (from source.text_content, description, or URL fetch)
// - Splits into overlapping chunks (~1000 chars, 150 overlap)
// - Embeds each chunk via Lovable AI Gateway (openai/text-embedding-3-small)
// - Writes chunks to agent_knowledge_chunks (service role)
// - Updates status: extracting → chunking → embedding → indexed / failed

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1";
const EMBED_MODEL = "openai/text-embedding-3-small";

async function embedBatch(apiKey: string, inputs: string[]): Promise<number[][]> {
  const res = await fetch(`${AI_URL}/embeddings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs, dimensions: 1536 }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`embed_${res.status}: ${body.slice(0, 200)}`);
    (err as any).status = res.status;
    throw err;
  }
  const j = await res.json();
  return (j.data as any[]).sort((a, b) => a.index - b.index).map((d) => d.embedding as number[]);
}

function chunkText(text: string, size = 1000, overlap = 150): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    out.push(clean.slice(i, i + size));
    i += size - overlap;
    if (out.length > 500) break; // safety cap
  }
  return out;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "AI gateway not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const svc = createClient(SUPABASE_URL, SERVICE_KEY);

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  const sourceId = body?.sourceId;
  if (!sourceId) return new Response(JSON.stringify({ error: "sourceId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // Load source via USER client so RLS enforces org membership.
  const { data: src, error: srcErr } = await userClient
    .from("agent_knowledge_sources").select("*").eq("id", sourceId).maybeSingle();
  if (srcErr || !src) {
    return new Response(JSON.stringify({ error: "source_not_found_or_forbidden" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const setStatus = (status: string, patch: Record<string, unknown> = {}) =>
    svc.from("agent_knowledge_sources").update({ status, ...patch }).eq("id", sourceId);

  try {
    await setStatus("processing", { failure_reason: null });

    // Extract text
    let text = "";
    const content = (src as any).content ?? {};
    if (typeof (src as any).text_content === "string" && (src as any).text_content.trim()) {
      text = (src as any).text_content;
    } else if (typeof content?.text === "string" && content.text.trim()) {
      text = content.text;
    } else if (typeof content?.description === "string") {
      text = [content.name, content.description, ...(content.features ?? [])].filter(Boolean).join("\n");
    } else if ((src as any).kind === "url" && (src as any).source_url) {
      const r = await fetch((src as any).source_url, { headers: { "User-Agent": "yangu-agents/1.0" } });
      if (!r.ok) throw new Error(`fetch_url_${r.status}`);
      const raw = await r.text();
      text = stripHtml(raw);
    } else if ((src as any).kind === "faq" && content?.question) {
      text = `Q: ${content.question}\nA: ${content.answer ?? ""}`;
    } else {
      text = (src as any).name;
    }

    if (!text.trim()) throw new Error("no_extractable_text");

    // Chunk
    const chunks = chunkText(text);
    if (chunks.length === 0) throw new Error("no_chunks_produced");

    // Delete existing chunks for this source (re-index)
    await svc.from("agent_knowledge_chunks").delete().eq("source_id", sourceId);

    // Embed in batches of 20
    const rows: any[] = [];
    for (let i = 0; i < chunks.length; i += 20) {
      const batch = chunks.slice(i, i + 20);
      const vectors = await embedBatch(LOVABLE_API_KEY, batch);
      batch.forEach((c, k) => {
        rows.push({
          org_id: (src as any).org_id,
          source_id: sourceId,
          collection_id: (src as any).collection_id ?? null,
          chunk_index: i + k,
          content: c,
          language: (src as any).language ?? null,
          embedding: vectors[k] as unknown as any,
        });
      });
    }

    // Insert chunks
    const { error: insErr } = await svc.from("agent_knowledge_chunks").insert(rows);
    if (insErr) throw new Error(`insert_chunks: ${insErr.message}`);

    await setStatus("indexed", {
      chunk_count: rows.length,
      chunks: rows.length,
      indexed_at: new Date().toISOString(),
      text_content: text.slice(0, 20000),
      failure_reason: null,
    });

    return new Response(JSON.stringify({ ok: true, chunks: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500);
    await setStatus("failed", { failure_reason: msg });
    const status = (e as any).status === 429 ? 429 : (e as any).status === 402 ? 402 : 500;
    return new Response(JSON.stringify({ error: "index_failed", message: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});