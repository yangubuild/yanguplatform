/**
 * ADA Builder Edit — Returns structured AdaMutationPlan via Lovable AI Gateway.
 * Uses tool calling to enforce structured output.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userMessage, contextSummary, conversationHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Ada, a builder editing assistant for YANGU surfaces.

The user wants to edit their page. You receive a structured summary of the current page state.

CURRENT PAGE STATE:
${contextSummary || "No page context available."}

YOUR JOB:
- Analyze the user request against the current page state
- Return a structured mutation plan using the return_mutation_plan tool
- If the request is ambiguous or you can't find the target, use action "ask_clarification"
- If you can identify the exact target, return the mutation with specific field changes
- Never pretend you made a change — you only produce the plan, the system executes it
- Keep reply text natural, short, and conversational (no markdown headers or bold)

ACTIONS AVAILABLE:
- update_item: Change title/price/description of an existing item. Requires target.itemName matching current name.
- add_item: Add a new item. Requires changes.title and changes.price.
- update_contact: Update phone/email/whatsapp/address. Put values in changes.
- update_text: Update heading/subheadline/text in a section. Requires target.section.
- update_color: Change backgroundColor or textColor. Use CSS color values. target.section = "page" for whole page.
- ask_clarification: When the target is ambiguous. Put question in clarification field.
- unsupported: When the request cannot be handled. Put explanation in reason field.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).slice(-10),
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "return_mutation_plan",
            description: "Return a structured editing plan for the page",
            parameters: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["update_item", "add_item", "update_contact", "update_text", "update_color", "ask_clarification", "unsupported"],
                  description: "The type of mutation to perform",
                },
                target: {
                  type: "object",
                  properties: {
                    section: { type: "string", description: "Section name/id (e.g. hero, menu, footer, page)" },
                    itemName: { type: "string", description: "Current exact name of the item to update" },
                    categoryName: { type: "string", description: "Category containing the item" },
                    field: { type: "string", description: "Specific field to target" },
                  },
                },
                changes: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    price: { type: "string" },
                    description: { type: "string" },
                    headline: { type: "string" },
                    subheadline: { type: "string" },
                    text: { type: "string" },
                    backgroundColor: { type: "string" },
                    textColor: { type: "string" },
                    phone: { type: "string" },
                    email: { type: "string" },
                    whatsapp: { type: "string" },
                    address: { type: "string" },
                  },
                },
                clarification: { type: "string", description: "Question to ask user if target is ambiguous" },
                reason: { type: "string", description: "Explanation if action is unsupported" },
                reply: { type: "string", description: "Short natural reply to show user (no markdown)" },
              },
              required: ["action", "reply"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_mutation_plan" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ ok: false, error: "payment_required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status >= 500) return new Response(JSON.stringify({ ok: false, error: "service_unavailable" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const args = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    return new Response(JSON.stringify({ ok: true, plan: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ada-builder-edit error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
