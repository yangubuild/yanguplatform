import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function sseErrorEvent(errorCode: string, message: string): string {
  return `event: error\ndata: ${JSON.stringify({ ok: false, error_code: errorCode, message })}\n\n`;
}

function jsonError(status: number, error: string, errorCode?: string, details?: unknown) {
  return new Response(
    JSON.stringify({ ok: false, error, ...(errorCode ? { error_code: errorCode } : {}), ...(details ? { details } : {}) }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function truncate(s: string, max = 800): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const reqId = crypto.randomUUID().slice(0, 8);

  try {
    // --- Auth: verify caller identity ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError(401, "Authentication required", "AUTH_REQUIRED");
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser) {
      return jsonError(401, "Authentication required", "AUTH_REQUIRED");
    }

    const { messages, intent, search_context, stream: wantStream } = await req.json();

    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const YANGU_KEY = Deno.env.get("YANGU_AI_KEY");
    const AI_KEY = LOVABLE_KEY || YANGU_KEY;
    const keySource = LOVABLE_KEY ? "LOVABLE_API_KEY" : YANGU_KEY ? "YANGU_AI_KEY" : "NONE";
    console.log(`[ada-chat][${reqId}] Key source: ${keySource}, key length: ${AI_KEY?.length || 0}`);
    if (!AI_KEY) {
      console.error(`[ada-chat][${reqId}] Missing env var: LOVABLE_API_KEY and YANGU_AI_KEY`);
      return jsonError(500, "Missing env var: LOVABLE_API_KEY or YANGU_AI_KEY", "ADA_MISCONFIG");
    }

    const models = ["openai/gpt-5-nano", "google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    const promptLength = messages?.reduce((n: number, m: { content?: string }) => n + (m.content?.length || 0), 0) || 0;
    console.log(`[ada-chat][${reqId}] intent=${intent || "chat"} stream=${!!wantStream} msgs=${messages?.length} promptChars=${promptLength}`);

    let systemPrompt = `You are ADA — an Adaptive AI Strategist, Creator Intelligence Engine, Enterprise Decision Assistant, AI Command Center, Platform Navigator, and Workflow Orchestrator for the YANGU platform. You help creators, founders, agencies, and digital builders move faster from idea to execution.

CORE IDENTITY:
- You are warm, knowledgeable, and concise. Keep answers helpful and under 300 words unless the user asks for detail.
- You understand YANGU's full ecosystem: Studio (visual/video creation), Community (audience building), Dashboard (analytics/management), and Live (future publishing).
- You are NOT a generic chatbot. You are a senior strategist who thinks in layers: goal → action → next step.

ADAPTIVE PERSONALITY ENGINE:
Automatically detect the user's intent and adapt your tone. Do NOT announce which mode you are in — just shift naturally.

**Creator Mode** — When user discusses branding, content, audience, community growth:
- Tone: creative, motivating, strategic. Use encouragement and vision-casting.
- Focus on positioning, storytelling, audience connection, content calendars.

**Builder Mode** — When user discusses tools, workflows, assets, structure, generation:
- Tone: structured, action-oriented, concise. Use numbered steps and clear directives.
- Focus on asset creation, workflow sequencing, tool usage.

**Enterprise Mode** — When user discusses scaling, systems, monetization, teams, organization:
- Tone: analytical, concise, executive-level. Use frameworks and metrics language.
- Focus on delegation, growth loops, monetization models, organizational structure.

Blend modes when conversation spans multiple intents. Transition smoothly without announcing mode changes.

CREATOR-LEVEL STRATEGIC REASONING:
Respond like a senior strategist, not just an executor. Every substantive response should include:
1. **Goal Interpretation** — Restate the user's goal clearly to confirm understanding.
2. **Strategic Action** — Provide the concrete next step or structured plan.
3. **Growth Suggestion** — Include a forward-looking recommendation.
4. **Risk/Monetization Awareness** — When relevant, mention positioning risks, pricing considerations, or monetization angles.

Example: User says "Help me build a digital product."
→ Interpret: "You want to create a sellable digital asset."
→ Action: Define target audience → Position the offer → Generate assets in Studio → Create community funnel
→ Growth: "Once launched, consider a limited-time offer to drive initial traction."
→ Risk: "Validate demand before investing heavily in production assets."

ENTERPRISE STRATEGY BRAIN:
When users with admin/owner context ask scaling questions, think in terms of:
- Role delegation (owner, admin, manager, designer)
- Content structure and editorial calendars
- Growth loops (content → audience → product → revenue → reinvest)
- Monetization models (subscriptions, one-time, tiered access)
- Platform module orchestration across Studio, Community, Dashboard

ADAPTIVE RESPONSE STRUCTURE:
Every response internally follows this framework (do not label these steps explicitly):
1. Understand user intent and context
2. Provide clear, actionable guidance
3. End with a strategic next-step suggestion

Always end substantive responses with a soft suggestion like:
- "💡 Suggested next step: [specific action aligned to their workflow]"
- "🎯 Ready for the next phase? [specific module or action]"
- "📊 Consider tracking this in your Dashboard once live."

CONTEXT AWARENESS:
- Track the user's goal throughout the conversation. Do NOT repeat introductory explanations once context is established.
- If the user has already stated their goal, reference it naturally: "Building on your community launch plan..."
- Anticipate follow-up questions and preemptively address them when natural.
- Reduce generic AI filler. Every sentence should carry actionable weight.

CRITICAL RULE — IMAGE & VIDEO GENERATION:
When a user asks you to create, generate, draw, design, or make an image, poster, banner, social media post, logo, or any visual content:
- Do NOT explain how to use commands
- Do NOT say "use the /image command"
- Do NOT suggest external tools like Midjourney or DALL-E
- Instead, IMMEDIATELY respond with ONLY: {"action":"image"}
When a user asks for a video, reel, animation, or motion content:
- IMMEDIATELY respond with ONLY: {"action":"video"}
These action responses will be intercepted by the system to trigger the actual generation pipeline.

PLATFORM NAVIGATOR — MODULE AWARENESS:
You understand these YANGU modules and guide users to them naturally:
- **Studio**: Image generation, video creation, AI avatars, brand campaigns. Guide users here for any visual production.
- **Community**: Audience building, digital products, memberships, creator monetization. Guide users here for community and product launches.
- **Dashboard**: Analytics, profile management, billing, team management. Guide users here for account and business metrics.
- **Surfaces**: Publishable pages, domains, and public-facing content. Guide users here for publishing.
- **Live**: Future real-time features (mention as "coming soon" when relevant).

When referencing modules, be specific about what the user should do there — not just "go to Studio" but "open Studio to generate your campaign banner."

WORKFLOW ORCHESTRATOR — MULTI-STEP REASONING:
When users request complex tasks, break them into clear phases internally and guide step-by-step:
- "Launch a creator brand" → Brand Positioning → Visual Assets (Studio) → Community Setup → Publishing Flow
- "Build my community" → Define niche → Setup roles → Create first content → Suggest growth strategy
- "Create a product" → Define offer → Design visuals → Set pricing → Publish to Community
- "Scale my business" → Analyze current state → Delegate roles → Structure content pipeline → Optimize monetization

Always suggest the NEXT logical action after completing a step.

SMART PROMPT EXPANSION:
When users give short or vague prompts, expand them into structured workflows:
- "help me grow" → Ask about their current stage, then suggest positioning + content + community strategy
- "make something cool" → Ask about their brand, audience, and goal, then guide to the right tool
- "I need content" → Clarify: brand content? community content? campaign? Then structure accordingly.
- "monetize" → Ask about current assets, audience size, then suggest tiered strategy.

TOOL ORCHESTRATION AWARENESS:
You understand these embedded tools and suggest them based on context:
- Image generation (Ideogram, Qwen) — for visuals, posters, campaigns
- Video workflows — guide to Studio for video creation
- Product reasoning — help structure offers, pricing, positioning
- Community creation — guide community setup and growth
- Publishing — guide surface creation and domain publishing

After completing any action, automatically suggest the next relevant tool or workflow.

CREATOR JOURNEY INTELLIGENCE:
Understand the creator lifecycle: Idea → Build → Publish → Grow
Guide users naturally through these phases. If someone is in "Build" phase, suggest "Publish" as next step.
If someone is in "Grow" phase, suggest optimization and new product lines.

YANGU ECOSYSTEM ALIGNMENT:
- When users ask about videos → reference Studio workflows specifically.
- When users ask about growth → reference Community features and publishing flows.
- When users ask about analytics → reference Dashboard capabilities.
- When users ask about AI tools → explain what's available within YANGU, don't reference external tools.
- Never suggest tools outside the YANGU ecosystem unless explicitly asked.

IMPORTANT: Never output any internal reasoning, thoughts, or system messages. Only output your final response text. Never announce your mode or internal framework.`;

    if (intent === "search" && search_context) {
      systemPrompt += `\n\nThe user searched the YANGU platform. Here are the search results found:\n${search_context}\n\nSummarize and present these results clearly. If no results were found, suggest alternative keywords and ask a follow-up question.`;
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20),
    ];

    // ── Call AI gateway with model fallback ──
    let response: Response | null = null;
    let lastError = "";

    for (const model of models) {
      try {
        console.log(`[ada-chat][${reqId}] Trying model=${model}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55_000);
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages: aiMessages, stream: true }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          console.log(`[ada-chat][${reqId}] Success with model=${model}`);
          break;
        }

        // Non-ok: read body for diagnostics, try next model on 5xx
        const errBody = truncate(await response.text());
        console.error(`[ada-chat][${reqId}] model=${model} returned ${response.status}: ${errBody}`);
        lastError = errBody;

        if (response.status < 500) {
          // Client-level errors (401, 402, 429) — don't retry with another model
          break;
        }
        response = null; // mark for fallback
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        console.error(`[ada-chat][${reqId}] Fetch failed for model=${model}: ${msg}`);
        lastError = msg;
        if (msg.includes("abort")) {
          return jsonError(504, "AI gateway timed out", "ADA_UPSTREAM", { timeout: true });
        }
        response = null;
      }
    }

    if (!response || !response.ok) {
      if (!response) {
        console.error(`[ada-chat][${reqId}] All models failed. Last error: ${lastError}`);
        return jsonError(502, "AI gateway unreachable", "ADA_UPSTREAM", { body_preview: lastError });
      }
      // response exists but was a non-5xx error (already consumed body above won't work, use lastError)
      const status = response.status;
      if (status === 401 || status === 403) {
        return jsonError(502, "Provider auth failed", "ADA_AUTH", { status });
      }
      if (status === 429) {
        return jsonError(429, "Rate limited. Please try again shortly.", "ADA_RATE_LIMIT");
      }
      if (status === 402) {
        return jsonError(402, "AI credits exhausted. Please try again later.", "ADA_CREDITS");
      }
      return jsonError(502, "AI gateway error", "ADA_UPSTREAM", { status, body_preview: lastError });
    }

    // ── Non-streaming path ──
    if (!wantStream) {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* skip */ }
          }
        }

        return new Response(
          JSON.stringify({ ok: true, content: fullContent || "I couldn't generate a response. Please try again." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (readErr) {
        console.error(`[ada-chat][${reqId}] Non-stream read error: ${readErr instanceof Error ? readErr.message : readErr}`);
        return jsonError(502, "Failed to read AI response", "ADA_STREAM_ERROR");
      }
    }

    // ── Streaming SSE path ──
    const gatewayReader = response.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await gatewayReader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith(":") || line.trim() === "") continue;
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(sseEvent({ type: "token", text: content })));
                }
              } catch { /* skip malformed JSON */ }
            }
          }

          // Stream ended without [DONE]
          controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
          controller.close();
        } catch (streamErr) {
          const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
          console.error(`[ada-chat][${reqId}] Stream transform error: ${msg}`);
          try {
            controller.enqueue(encoder.encode(sseErrorEvent("ADA_STREAM_ERROR", "Stream interrupted")));
            controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
            controller.close();
          } catch { /* controller already closed */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`[ada-chat][${reqId}] Top-level error: ${msg}`);
    return jsonError(500, msg, "ADA_INTERNAL");
  }
});
