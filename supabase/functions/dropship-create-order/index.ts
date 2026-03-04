import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAdapter } from "../_shared/dropship/providerRegistry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const { shop_surface_id, provider_key, items, shipping_address, customer, notes } = body;

    // Validate required fields
    if (!shop_surface_id || !provider_key || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({
        error: { code: "BAD_REQUEST", message: "Missing required fields: shop_surface_id, provider_key, items[]" },
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!shipping_address || !customer) {
      return new Response(JSON.stringify({
        error: { code: "BAD_REQUEST", message: "Missing required fields: shipping_address, customer" },
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check provider exists
    const adapter = getAdapter(provider_key);
    if (!adapter) {
      return new Response(JSON.stringify({
        error: { code: "PROVIDER_NOT_FOUND", message: `Unknown provider: ${provider_key}` },
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check provider is enabled
    const { data: providerRow } = await supabase
      .from("dropship_providers")
      .select("is_enabled")
      .eq("provider_key", provider_key)
      .single();

    if (providerRow && !providerRow.is_enabled) {
      return new Response(JSON.stringify({
        error: { code: "PROVIDER_DISABLED", message: `Provider ${provider_key} is disabled` },
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check cooldown
    const { data: cooldown } = await supabase
      .from("dropship_provider_cooldowns")
      .select("cooldown_until")
      .eq("provider_key", provider_key)
      .single();

    if (cooldown && new Date(cooldown.cooldown_until) > new Date()) {
      return new Response(JSON.stringify({
        error: { code: "UPSTREAM_ERROR", message: `Provider ${provider_key} is rate-limited until ${cooldown.cooldown_until}. Try again later.` },
      }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 1. Create order intent in DB
    const { data: orderId, error: intentErr } = await supabase.rpc("create_dropship_order_intent", {
      p_shop_surface_id: shop_surface_id,
      p_provider_key: provider_key,
      p_items: items,
      p_shipping_address: shipping_address,
      p_customer: customer,
      p_notes: notes || null,
    });

    if (intentErr || !orderId) {
      console.error("create_dropship_order_intent error:", intentErr);
      return new Response(JSON.stringify({
        error: { code: "BAD_REQUEST", message: intentErr?.message || "Failed to create order intent" },
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Call provider adapter
    try {
      const orderPayload = { items, shipping_address, customer, notes };
      const result = await adapter.createOrder(orderPayload);

      // 3. Update order with success
      await supabase.rpc("update_dropship_order_result", {
        p_dropship_order_id: orderId,
        p_status: "submitted",
        p_provider_order_id: result.provider_order_id || null,
        p_provider_payload: result.raw || null,
        p_last_error: null,
      });

      return new Response(JSON.stringify({
        dropship_order_id: orderId,
        status: "submitted",
        provider_order_id: result.provider_order_id || null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (providerErr: unknown) {
      const errMsg = providerErr instanceof Error ? providerErr.message : String(providerErr);
      const is429 = errMsg.includes("429") || errMsg.toLowerCase().includes("rate");

      // Mark order failed
      await supabase.rpc("update_dropship_order_result", {
        p_dropship_order_id: orderId,
        p_status: "failed",
        p_provider_order_id: null,
        p_provider_payload: null,
        p_last_error: errMsg,
      });

      // Set cooldown on 429
      if (is429) {
        console.warn(`Rate limited by ${provider_key} during order creation, setting 15min cooldown`);
        await supabase.rpc("set_dropship_provider_cooldown", {
          p_provider_key: provider_key,
          p_minutes: 15,
        });
      }

      // Check for structured BAD_REQUEST from adapter
      if (providerErr instanceof Error && (providerErr as any).code === "BAD_REQUEST") {
        return new Response(JSON.stringify({
          error: { code: "BAD_REQUEST", message: errMsg, dropship_order_id: orderId },
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        error: { code: "UPSTREAM_ERROR", message: errMsg, dropship_order_id: orderId },
      }), { status: is429 ? 429 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("dropship-create-order fatal:", msg);
    return new Response(JSON.stringify({ error: { code: "BAD_REQUEST", message: msg } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
