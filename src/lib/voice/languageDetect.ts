/**
 * Lightweight language detection for ADA multilingual voice routing.
 * Supports: en (English), ar (Arabic), fr (French),
 *           sw (Swahili), lg (Luganda), rw (Kinyarwanda).
 *
 * Strategy:
 *  1. If STT supplies a language hint (Whisper returns ISO names or codes),
 *     map it directly.
 *  2. Otherwise run a script + keyword heuristic on the raw text.
 *  3. Default to "en" when nothing matches.
 */

export type AdaLanguage = "en" | "ar" | "fr" | "sw" | "lg" | "rw";

export const SUPPORTED_LANGUAGES: AdaLanguage[] = ["en", "ar", "fr", "sw", "lg", "rw"];

const LANGUAGE_NAMES: Record<AdaLanguage, string> = {
  en: "English",
  ar: "Arabic",
  fr: "French",
  sw: "Swahili",
  lg: "Luganda",
  rw: "Kinyarwanda",
};

export function languageName(lang: AdaLanguage): string {
  return LANGUAGE_NAMES[lang] || "English";
}

/** Map a Whisper language label (e.g. "english", "swahili", "ar") to AdaLanguage. */
export function normalizeWhisperLanguage(raw?: string | null): AdaLanguage | null {
  if (!raw) return null;
  const v = raw.toLowerCase().trim();
  const map: Record<string, AdaLanguage> = {
    en: "en", english: "en",
    ar: "ar", arabic: "ar",
    fr: "fr", french: "fr",
    sw: "sw", swahili: "sw",
    lg: "lg", luganda: "lg", ganda: "lg",
    rw: "rw", kinyarwanda: "rw", rwanda: "rw",
  };
  return map[v] || null;
}

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F]/;

// Small but disambiguating keyword sets. Lowercased; word-boundary checked.
const KEYWORDS: Record<Exclude<AdaLanguage, "en" | "ar">, string[]> = {
  fr: [
    "bonjour","salut","merci","oui","non","je","tu","vous","nous","s'il","stp","svp",
    "voudrais","ajouter","modifier","changer","prix","menu","page","client","commande",
  ],
  sw: [
    "habari","jambo","mambo","asante","karibu","tafadhali","ninataka","unaweza",
    "bei","menyu","ongeza","badilisha","duka","chakula","mteja",
  ],
  lg: [
    "oli","otya","webale","nkwagala","nsaba","nnyabo","ssebo","mukama",
    "ekitabo","emmere","ssente","kati","kkooti","mukozi","gyenda",
  ],
  rw: [
    "muraho","murakoze","yego","oya","mwiriwe","mwaramutse","ndabizi",
    "amafaranga","ibiryo","gucuruza","ushobora","gukora","ubufasha","kwongera",
  ],
};

function scoreKeywords(text: string, words: string[]): number {
  let score = 0;
  for (const w of words) {
    const re = new RegExp(`(^|\\W)${w.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}(\\W|$)`, "i");
    if (re.test(text)) score += 1;
  }
  return score;
}

/**
 * Detect AdaLanguage from arbitrary text. Falls back to "en" if uncertain.
 */
export function detectLanguageFromText(input: string): AdaLanguage {
  const text = (input || "").trim();
  if (!text) return "en";

  // Arabic script is unambiguous.
  if (ARABIC_RE.test(text)) return "ar";

  const scores: Array<{ lang: AdaLanguage; score: number }> = [
    { lang: "fr", score: scoreKeywords(text, KEYWORDS.fr) },
    { lang: "sw", score: scoreKeywords(text, KEYWORDS.sw) },
    { lang: "lg", score: scoreKeywords(text, KEYWORDS.lg) },
    { lang: "rw", score: scoreKeywords(text, KEYWORDS.rw) },
  ];
  scores.sort((a, b) => b.score - a.score);
  if (scores[0].score >= 1 && scores[0].score > (scores[1]?.score ?? 0)) {
    return scores[0].lang;
  }
  return "en";
}

/**
 * Resolve a language given an STT hint and/or raw text. STT wins when known.
 */
export function resolveLanguage(opts: { sttLanguage?: string | null; text?: string }): AdaLanguage {
  const fromStt = normalizeWhisperLanguage(opts.sttLanguage);
  if (fromStt) return fromStt;
  return detectLanguageFromText(opts.text || "");
}
