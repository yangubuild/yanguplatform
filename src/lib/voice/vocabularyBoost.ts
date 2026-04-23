/**
 * Vocabulary boost for Whisper ASR.
 *
 * Whisper accepts an optional `prompt` parameter that biases the language
 * model toward specific words and phrases. We seed it with East African
 * commerce, food, currency, and everyday vocabulary so that local terms
 * like "matoke", "boda", "kitenge" or shilling codes (UGX, KES, TZS, RWF,
 * CDF) are transcribed correctly instead of being mangled into English
 * phonetic guesses.
 */

export const VOCABULARY_BOOST: string[] = [
  // Foods & dishes
  "matoke", "boda", "chapati", "mandazi", "kanga", "kitenge",
  "rolex", "luwombo", "posho", "beans", "g-nut", "simsim",
  // Currencies
  "ugx", "kes", "tzs", "rwf", "cdf",
  // Goods & trades
  "mtumba", "kiondo", "mbao", "jembe", "pikipiki",
];

/** Human-readable language hints for the Whisper prompt. */
const LANGUAGE_HINTS: Record<string, string> = {
  en: "English",
  sw: "Swahili",
  lg: "Luganda",
  rw: "Kinyarwanda",
  fr: "French",
  ar: "Arabic",
};

/**
 * Build a Whisper prompt string that biases recognition toward East
 * African commerce vocabulary plus any detected language / user context.
 *
 * Whisper caps the prompt at ~224 tokens, so we keep it compact: a short
 * language hint, the boost list, and a trimmed slice of the latest user
 * message for topical context.
 */
export function buildWhisperPrompt(
  userMessage: string,
  detectedLanguage: string,
): string {
  const langKey = (detectedLanguage || "").toLowerCase().trim();
  const langName = LANGUAGE_HINTS[langKey] || "English";

  const boostList = VOCABULARY_BOOST.join(", ");

  const trimmedContext = (userMessage || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);

  const parts: string[] = [
    `Language: ${langName}.`,
    `Common terms: ${boostList}.`,
  ];

  if (trimmedContext) {
    parts.push(`Recent context: ${trimmedContext}`);
  }

  return parts.join(" ");
}
