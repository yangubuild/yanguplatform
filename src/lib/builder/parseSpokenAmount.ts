/**
 * parseSpokenAmount
 * -----------------
 * Convert spoken East African amount strings into integer amounts.
 *
 * Note: per spec, the returned integer is the **literal numeric value**
 * spoken (e.g. "elfu tano" -> 5000, "5,000" -> 5000). Callers that need
 * cents should multiply by 100 themselves; this keeps the parser symmetric
 * with how amounts are typed and spoken in East African commerce flows.
 *
 * Supported lexicons:
 *  - English      : "ten thousand", "five hundred", "1,200"
 *  - Swahili      : "elfu tano", "mia tano", "kumi"
 *  - Luganda      : "olukumi", "kakadde", "ttaano", "kkumi"
 *  - Mixed        : "shilingi elfu tano", "ugx 5,000", "ksh 10k"
 *
 * Returns:
 *  - integer cents (e.g. "5,000" -> 500_000)  ← amounts are interpreted as
 *    whole-currency units (shillings/dollars) and converted to cents.
 *  - null when no amount can be confidently extracted.
 */

type WordMap = Record<string, number>;

// Units 0–9 across English / Swahili / Luganda (normalized, lowercase, no accents).
const UNITS: WordMap = {
  // English
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9,
  // Swahili
  sifuri: 0, moja: 1, mbili: 2, tatu: 3, nne: 4, tano: 5,
  sita: 6, saba: 7, nane: 8, tisa: 9, kenda: 9,
  // Luganda (common spellings, with and without doubled consonants)
  emu: 1, zimu: 1,
  bbiri: 2, biri: 2,
  ssatu: 3, satu: 3,
  nnya: 4, nya: 4,
  ttaano: 5, taano: 5, taano2: 5,
  mukaaga: 6, mukaga: 6,
  musanvu: 7,
  munaana: 8, munana: 8,
  mwenda: 9,
};

// Tens 10–90.
const TENS: WordMap = {
  // English
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  // Swahili "kumi" = 10
  kumi: 10,
  // Luganda "kkumi" = 10
  kkumi: 10, ekkumi: 10,
};

// Scale words (multipliers).
const SCALES: WordMap = {
  hundred: 100,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
  k: 1_000,        // "10k"
  m: 1_000_000,    // "2m"
  // Swahili
  mia: 100,        // mia (tano) = 500
  elfu: 1_000,     // elfu (tano) = 5000
  milioni: 1_000_000,
  bilioni: 1_000_000_000,
  // Luganda
  kikumi: 100, ebikumi: 100,
  lukumi: 1_000, olukumi: 1_000, enkumi: 1_000,
  kakadde: 1_000_000, obukadde: 1_000_000,
};

// Currency prefix words to strip (they don't carry numeric value).
const CURRENCY_NOISE = new Set<string>([
  "shilingi", "shillings", "shilling", "shs", "sh",
  "ugx", "ksh", "kes", "tzs", "rwf",
  "usd", "dollars", "dollar", "$",
  "francs", "franc", "fr",
  "of", "and", "na", // glue words ("elfu tano na mia mbili")
]);

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,](?=\d{3}\b)/g, "") // strip thousand separators inside digits
    .replace(/[^\p{L}\p{N}\s$]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize and merge "10k" / "2m" style suffixes into separate tokens. */
function tokenize(text: string): string[] {
  const raw = text.split(" ").filter(Boolean);
  const out: string[] = [];
  for (const tok of raw) {
    const m = /^(\d+)([km])$/.exec(tok);
    if (m) {
      out.push(m[1], m[2]);
    } else {
      out.push(tok);
    }
  }
  return out;
}

/**
 * Parse a stream of word-tokens into a number using a small accumulator.
 * Handles: "five hundred thousand", "elfu tano", "mia tano", "kumi tano",
 * "olukumi bbiri", "twenty five thousand", "5 elfu", etc.
 */
function wordsToNumber(tokens: string[]): number | null {
  let total = 0;
  let current = 0;
  let sawAny = false;
  let pendingScale = 0; // scale word seen with no preceding multiplier (e.g. "elfu" then "tano")

  for (const tok of tokens) {
    if (CURRENCY_NOISE.has(tok)) continue;

    // Pure digits.
    if (/^\d+$/.test(tok)) {
      const n = parseInt(tok, 10);
      if (pendingScale) {
        total += n * pendingScale;
        pendingScale = 0;
      } else {
        current += n;
      }
      sawAny = true;
      continue;
    }

    if (tok in UNITS) {
      if (pendingScale) {
        total += UNITS[tok] * pendingScale;
        pendingScale = 0;
      } else {
        current += UNITS[tok];
      }
      sawAny = true;
      continue;
    }

    if (tok in TENS) {
      if (pendingScale) {
        total += TENS[tok] * pendingScale;
        pendingScale = 0;
      } else {
        current += TENS[tok];
      }
      sawAny = true;
      continue;
    }

    if (tok in SCALES) {
      const scale = SCALES[tok];
      if (current === 0) {
        // Scale spoken first ("elfu tano" / "mia tano" / "olukumi bbiri").
        // Defer until we see the multiplier; if none follows, treat as 1×scale.
        pendingScale = (pendingScale || 1) * scale;
      } else {
        const product = current * scale;
        if (scale >= 1000) {
          total += product;
          current = 0;
        } else {
          current = product;
        }
      }
      sawAny = true;
      continue;
    }
    // Unknown token: ignore silently (lets us tolerate ASR noise).
  }

  if (!sawAny) return null;
  if (pendingScale) total += pendingScale; // "elfu" alone => 1000
  return total + current;
}

/**
 * Public API. Returns integer **cents**, or null when nothing parseable.
 */
export function parseSpokenAmount(input: string | null | undefined): number | null {
  if (!input) return null;
  const normalized = normalize(String(input));
  if (!normalized) return null;

  const directDigits = normalized.replace(/\s+/g, "");
  if (/^\d+(\.\d{1,2})?$/.test(directDigits)) {
    const asNum = parseFloat(directDigits);
    if (!isFinite(asNum)) return null;
    return Math.round(asNum);
  }

  const tokens = tokenize(normalized);
  const value = wordsToNumber(tokens);
  if (value == null || value <= 0) return null;
  return Math.round(value);
}

export default parseSpokenAmount;