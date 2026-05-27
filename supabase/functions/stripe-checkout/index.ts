// Stripe Checkout Session creator for surface orders.
// Uses the platform STRIPE_SECRET_KEY. If the seller's commerce config has a
// stripe_account_id, funds are routed via Stripe Connect transfer_data.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  if (!STRIPE_SECRET_KEY) {
    return json({ error: "Stripe not configured" }, 500);
  }

  try {
    const { order_id, success_url, cancel_url } = await req.json();
    if (!order_id) return json({ error: "order_id required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .maybeSingle();
    if (orderErr || !order) return json({ error: "Order not found" }, 404);

    const { data: cfg } = await supabase
      .from("surface_commerce_config")
      .select("stripe_account_id, currency")
      .eq("surface_id", order.surface_id)
      .maybeSingle();

    const currency = (order.currency || cfg?.currency || "USD").toLowerCase();
    const items = (order.order_items as any[]) || [];

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", success_url || `${req.headers.get("origin") || ""}/?stripe=success&order=${order.id}`);
    params.append("cancel_url", cancel_url || `${req.headers.get("origin") || ""}/?stripe=cancel&order=${order.id}`);
    params.append("client_reference_id", order.id);
    params.append("metadata[order_id]", order.id);
    if (order.buyer_email) params.append("customer_email", order.buyer_email);

    items.forEach((it, i) => {
      params.append(`line_items[${i}][quantity]`, String(it.quantity));
      params.append(`line_items[${i}][price_data][currency]`, currency);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(it.unit_price_cents));
      params.append(`line_items[${i}][price_data][product_data][name]`, it.product_name);
    });

    // Add delivery fee as a line item if order total > sum(items)
    const itemsTotal = items.reduce((s, i) => s + i.unit_price_cents * i.quantity, 0);
    const fee = order.total_cents - itemsTotal;
    if (fee > 0) {
      const i = items.length;
      params.append(`line_items[${i}][quantity]`, "1");
      params.append(`line_items[${i}][price_data][currency]`, currency);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(fee));
      params.append(`line_items[${i}][price_data][product_data][name]`, "Delivery / Fees");
    }

    // Route to seller via Stripe Connect if connected
    const sellerAcct = cfg?.stripe_account_id;
    if (sellerAcct && sellerAcct.startsWith("acct_")) {
      params.append("payment_intent_data[transfer_data][destination]", sellerAcct);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe error:", session);
      return json({ error: session.error?.message || "Stripe error" }, 500);
    }

    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id, stripe_payment_status: "pending" })
      .eq("id", order.id);

    return json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error("stripe-checkout error:", err);
    return json({ error: err.message || "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}