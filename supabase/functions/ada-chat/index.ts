import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, intent, search_context, stream: wantStream } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = `You are ADA, the AI assistant for YANGU — an African digital platform for creators, sellers, builders, and learners. You are knowledgeable, warm, and concise. Keep answers helpful and under 300 words unless the user asks for detail.

IMPORTANT: You have built-in capabilities to generate images and videos directly. When a user asks you to create, generate, draw, or design an image, do NOT suggest external tools. Instead, tell them to use the /image command followed by their prompt. For example: "/image a watermelon juice bottle with a minimalist label". For videos, they can use /video. You can generate these yourself — never redirect users to Midjourney, DALL-E, or other external services.

IMPORTANT: Never output any internal reasoning, thoughts, or system messages. Only output your final response text.`;

    if (intent === "search" && search_context) {
      systemPrompt += `\n\nThe user searched the YANGU platform. Here are the search results found:\n${search_context}\n\nSummarize and present these results clearly. If no results were found, suggest alternative keywords and ask a follow-up question.`;
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20),
    ];

    // Always stream from the gateway and transform into clean events
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("[ada-chat] AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!wantStream) {
      // Non-streaming: consume the SSE stream and return full JSON
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

      return new Response(JSON.stringify({ ok: true, content: fullContent || "I couldn't generate a response. Please try again." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming: Transform gateway SSE into clean {type:"token"} events
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
              // Skip SSE comments (e.g., ": OPENROUTER PROCESSING")
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
                // Only emit visible text tokens, skip reasoning/empty
                if (content) {
                  controller.enqueue(encoder.encode(sseEvent({ type: "token", text: content })));
                }
              } catch { /* skip malformed JSON */ }
            }
          }

          // Stream ended without [DONE]
          controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
          controller.close();
        } catch (err) {
          console.error("[ada-chat] stream transform error:", err);
          controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
          controller.close();
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
    console.error("[ada-chat] error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
