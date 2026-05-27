// Stripe webhook: marks order paid + confirmed on checkout.session.completed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response("Not configured", { status: 500, headers: corsHeaders });
  }

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  if (!sig) return new Response("Missing signature", { status: 400, headers: corsHeaders });

  // Verify signature (HMAC-SHA256)
  try {
    const verified = await verifyStripeSignature(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    if (!verified) return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  } catch (e) {
    console.error("sig verify error:", e);
    return new Response("Invalid signature", { status: 400, headers: corsHeaders });
  }

  const event = JSON.parse(rawBody);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || session.client_reference_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            stripe_payment_status: session.payment_status || "paid",
          })
          .eq("id", orderId);
      }
    } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || session.client_reference_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({ payment_status: "failed", stripe_payment_status: session.payment_status || "failed" })
          .eq("id", orderId);
      }
    }
  } catch (e) {
    console.error("webhook handler error:", e);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(hex, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}