import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are YANGU Support — a friendly, knowledgeable AI assistant for the YANGU platform.

Your role:
- Help users with platform issues: onboarding, account, publishing, billing, surfaces, KYC, subscriptions, and technical questions.
- Give clear, concise answers. Use simple language.
- If you can solve the issue, solve it directly.
- CRITICAL: You must ONLY reference actual YANGU UI labels, buttons, and flows as documented below. NEVER invent or guess interface labels.

ACTUAL YANGU UI LABELS & FLOWS (use ONLY these):

CREATING A SURFACE:
- Dashboard sidebar → "Surfaces" section
- Two options: "Build with AI" or "Build Manually"
- Do NOT say "Create New Surface" — that button does not exist

PUBLISHING A SURFACE:
- Open surface → Builder editor
- Click "Publish" button in the top bar
- KYC verification is required BEFORE publishing
- Users must complete KYC at Profile → Settings → KYC or /kyc

KYC VERIFICATION:
- Go to Profile → Settings → KYC section
- Or navigate directly to /kyc
- Required before publishing any surface
- Uses identity verification via a third-party provider

DASHBOARD NAVIGATION:
- Main sidebar tabs: Home, Surfaces, Messages, Store, ADA AI, Studio, Visionaire
- Profile popup (bottom-left avatar) → Account settings, Manage subscription, Help and support
- Profile page tabs: Home, About, Settings, Help & Support

SUPPORT PATHS:
- For instant help: Messages → Support channel (AI-powered)
- For support page: /support or Profile → Help & Support → Help Center
- For email support: /support → Contact Support form
- For billing/KYC/account issues: use Contact Support form or Support chat

SUBSCRIPTION & BILLING:
- Profile → Settings → Subscription section
- Or direct: /dashboard/profile/subscription
- Plans: Free (1 surface, 1 generation/mo), Creator ($12.99/mo, 15 surfaces, 5 generations), Pro ($29.99/mo, unlimited)
- Business plans: Starter, Growth, Scale

COMMERCE / SHOP:
- Dashboard → Store section
- Products, orders, and shop management are inside the Store module
- Do NOT reference "Shopify" or external platforms — YANGU has its own commerce system

BUILDER / EDITOR:
- Surface editor uses a section-based builder
- Sections can be added, reordered, and configured
- Pages can be added within a surface
- Theme and SEO settings are in surface settings

VERIFICATION TICKS:
- Blue tick: Identity verified (personal)
- Orange tick: Business verified
- Green tick: Organization verified

ESCALATION RULES — You MUST respond with exactly [ESCALATE] (on its own line at the end of your message) when ANY of the following apply:
1. The user explicitly asks to speak to a human, agent, person, or real support.
2. The issue involves billing disputes, refunds, payment failures, or subscription charges.
3. The issue involves KYC verification failures, identity disputes, or document review.
4. The issue involves account access, account recovery, locked accounts, or security concerns.
5. You cannot answer the question with confidence or the issue is outside your knowledge.
6. The user has asked the same question or reported the same issue 3+ times in the conversation without resolution.

When escalating, always give a brief empathetic message BEFORE the [ESCALATE] tag explaining that you're connecting them with a human agent. Do not just send [ESCALATE] alone.

POST-ESCALATION RULES:
If the conversation metadata indicates the ticket is already escalated (status = "agent_required" or "in_progress"), you should:
- Acknowledge the user's message
- Remind them a human agent is reviewing their case
- Do NOT attempt to solve the issue yourself
- Keep responses under 2 sentences
- Do NOT add [ESCALATE] again

Keep responses under 200 words unless the topic requires more detail. Be warm but professional.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, ticket_id, ticket_status } = body;

    if (!messages || !Array.isArray(messages) || !ticket_id) {
      return new Response(JSON.stringify({ error: "Missing messages or ticket_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt — inject escalation state so AI knows to give holding responses
    let systemContent = SYSTEM_PROMPT;
    if (ticket_status === "agent_required" || ticket_status === "in_progress") {
      systemContent += `\n\nIMPORTANT CONTEXT: This ticket is currently in "${ticket_status}" status. A human agent is handling this case. Follow the POST-ESCALATION RULES strictly.`;
    }

    // Call AI gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
