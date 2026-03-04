/**
 * Shipping address & price normalization helpers for dropship providers.
 *
 * Internal standard (what our edge functions + DB use):
 *   address: string        (street line 1)
 *   address2: string       (street line 2, optional)
 *   city: string
 *   province: string       (state / province / region)
 *   country: string        (full name, e.g. "United States")
 *   country_code: string   (ISO-3166 alpha-2, e.g. "US")
 *   zip: string            (postal code)
 *
 * Prices:
 *   Internal = integer cents (unit_price_cents).
 *   Provider APIs may expect decimal dollars.
 */

// ─── Address types ──────────────────────────────────────────────────────

export interface InternalAddress {
  address: string;
  address2?: string;
  city: string;
  province?: string;
  state?: string;
  country: string;
  country_code?: string;
  zip?: string;
  postal_code?: string;
}

export interface CJAddress {
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingZip: string;
}

export interface ModernDropshipAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
}

// ─── Address normalizers ────────────────────────────────────────────────

/**
 * CJ requires:
 *   shippingCountryCode (ISO alpha-2, e.g. "US")
 *   shippingProvince
 *   shippingCity
 *   shippingAddress (street)
 *   shippingZip
 */
export function normalizeAddressForCJ(addr: InternalAddress): CJAddress {
  return {
    shippingCountryCode: addr.country_code || addr.country || "",
    shippingProvince: addr.province || addr.state || "",
    shippingCity: addr.city || "",
    shippingAddress: [addr.address, addr.address2].filter(Boolean).join(", "),
    shippingZip: addr.zip || addr.postal_code || "",
  };
}

/**
 * ModernDropship requires:
 *   address1, address2, city, province, country, zip, phone
 *   first_name / last_name
 */
export function normalizeAddressForModern(
  addr: InternalAddress,
  customer: { name?: string; phone?: string },
): ModernDropshipAddress {
  const nameParts = (customer.name || "").split(" ");
  return {
    first_name: nameParts[0] || customer.name || "",
    last_name: nameParts.slice(1).join(" ") || "",
    address1: addr.address || "",
    address2: addr.address2 || "",
    city: addr.city || "",
    province: addr.province || addr.state || "",
    country: addr.country_code || addr.country || "",
    zip: addr.zip || addr.postal_code || "",
    phone: customer.phone || "",
  };
}

// ─── Price helpers ──────────────────────────────────────────────────────

/** Convert a decimal price (e.g. 4.99) to integer cents (499). */
export function toCents(decimalPrice: number): number {
  return Math.round(decimalPrice * 100);
}

/** Convert integer cents (499) to decimal (4.99). Providers that expect decimals use this. */
export function toDecimal(cents: number): number {
  return cents / 100;
}

/**
 * Smart cents conversion: if a value looks like it's already in cents (>= 100 and integer),
 * return as-is. Otherwise treat as decimal and convert.
 * Use this when you're unsure whether the caller sent cents or dollars.
 */
export function ensureCents(price: number): number {
  // If price has decimal places, it's definitely dollars → convert
  if (price !== Math.floor(price)) {
    return Math.round(price * 100);
  }
  // Integer: could be cents already or a whole-dollar amount.
  // Convention: we trust the caller. Return as-is.
  return price;
}
