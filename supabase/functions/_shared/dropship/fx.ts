/**
 * FX (foreign exchange) utilities for Eshop Connect.
 *
 * - Resolves display currency from the org that owns a shop surface.
 * - Looks up cached FX rates from the `fx_rates` table.
 * - Converts integer-cents between currencies.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ---------------------------------------------------------------------------
// Display currency resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the display (platform) currency for a given shop surface.
 *
 * Resolution chain:
 *   builder_surfaces.org_id → orgs.currency
 *   Fallback: "USD"
 */
export async function getDisplayCurrencyForShop(
  shopSurfaceId: string,
  supabase?: SupabaseClient,
): Promise<string> {
  const client = supabase ?? getServiceClient();

  // builder_surfaces holds org_id
  const { data: surface } = await client
    .from("builder_surfaces")
    .select("org_id")
    .eq("id", shopSurfaceId)
    .single();

  if (!surface?.org_id) return "USD";

  const { data: org } = await client
    .from("orgs")
    .select("currency")
    .eq("id", surface.org_id)
    .single();

  return (org?.currency as string) || "USD";
}

// ---------------------------------------------------------------------------
// FX rate lookup
// ---------------------------------------------------------------------------

export interface FxRateResult {
  rate: number;
  as_of: string;
}

/**
 * Look up a cached FX rate.
 *
 * @returns  `{ rate, as_of }` or throws with code `FX_RATE_MISSING`.
 */
export async function getFxRate(
  baseCurrency: string,
  quoteCurrency: string,
  supabase?: SupabaseClient,
): Promise<FxRateResult> {
  // Same currency — trivial 1:1
  if (baseCurrency.toUpperCase() === quoteCurrency.toUpperCase()) {
    return { rate: 1, as_of: new Date().toISOString() };
  }

  const client = supabase ?? getServiceClient();

  const { data, error } = await client
    .from("fx_rates")
    .select("rate, as_of")
    .eq("base_currency", baseCurrency.toUpperCase())
    .eq("quote_currency", quoteCurrency.toUpperCase())
    .single();

  if (error || !data) {
    // Try inverse
    const { data: inv, error: invErr } = await client
      .from("fx_rates")
      .select("rate, as_of")
      .eq("base_currency", quoteCurrency.toUpperCase())
      .eq("quote_currency", baseCurrency.toUpperCase())
      .single();

    if (invErr || !inv) {
      const err = new Error(
        `FX rate not found: ${baseCurrency} → ${quoteCurrency}. Seed it via upsert_fx_rate().`,
      ) as any;
      err.code = "FX_RATE_MISSING";
      throw err;
    }

    return { rate: 1 / Number(inv.rate), as_of: inv.as_of };
  }

  return { rate: Number(data.rate), as_of: data.as_of };
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

/**
 * Convert an amount in cents from one currency to another using a given rate.
 * Returns integer cents (rounded).
 */
export function convertCents(amountCents: number, rate: number): number {
  return Math.round(amountCents * rate);
}

/**
 * Convenience: convert a decimal price (e.g. 4.99) to display-currency cents.
 */
export function decimalToDisplayCents(decimalPrice: number, rate: number): number {
  return Math.round(decimalPrice * 100 * rate);
}
