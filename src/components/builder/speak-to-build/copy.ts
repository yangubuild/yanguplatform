/**
 * Speak to Build — Multilingual prompt copy.
 * Kept intentionally short and conversational for natural TTS.
 */

import type { AdaLanguage } from "@/lib/voice/languageDetect";
import type { SpeakStepId } from "./types";

type CopyMap = Record<SpeakStepId, string>;

const EN: CopyMap = {
  intro: "Hi, I'm ADA AI. Let's build your website together. What would you like to build?",
  category: "What would you like to build?",
  business_info: "Great. What do you sell or offer? Give me your business name and a short description.",
  logo: "Do you already have a logo?",
  logo_create: "Would you like me to create a logo for you?",
  colors: "What colors represent your brand?",
  location: "Where are you located?",
  style: "Choose a style you love.",
  building: "Got it. I'm building your website now.",
  done: "I've built your website. You can now edit anything by voice or chat.",
};

const FR: CopyMap = {
  intro: "Bonjour, je suis ADA AI. Construisons votre site ensemble. Que voulez-vous créer ?",
  category: "Que voulez-vous créer ?",
  business_info: "Parfait. Que vendez-vous ou proposez-vous ? Donnez-moi le nom de votre entreprise et une courte description.",
  logo: "Avez-vous déjà un logo ?",
  logo_create: "Voulez-vous que je crée un logo pour vous ?",
  colors: "Quelles couleurs représentent votre marque ?",
  location: "Où êtes-vous situé ?",
  style: "Choisissez un style que vous aimez.",
  building: "Très bien. Je construis votre site maintenant.",
  done: "J'ai construit votre site. Vous pouvez tout modifier par la voix ou le chat.",
};

const AR: CopyMap = {
  intro: "مرحبًا، أنا ADA AI. لنبنِ موقعك معًا. ماذا تريد أن تبني؟",
  category: "ماذا تريد أن تبني؟",
  business_info: "رائع. ماذا تبيع أو تقدم؟ أعطني اسم عملك ووصفًا قصيرًا.",
  logo: "هل لديك شعار بالفعل؟",
  logo_create: "هل تريد أن أصمم لك شعارًا؟",
  colors: "ما الألوان التي تمثل علامتك التجارية؟",
  location: "أين تقع؟",
  style: "اختر النمط الذي تحبه.",
  building: "حسنًا. أبني موقعك الآن.",
  done: "لقد بنيت موقعك. يمكنك الآن تعديل أي شيء بالصوت أو الدردشة.",
};

const SW: CopyMap = {
  intro: "Habari, mimi ni ADA AI. Tujenge tovuti yako pamoja. Ungependa kujenga nini?",
  category: "Ungependa kujenga nini?",
  business_info: "Vizuri. Unauza au kutoa nini? Nipe jina la biashara yako na maelezo mafupi.",
  logo: "Je, una nembo tayari?",
  logo_create: "Je, ungependa nikutengenezee nembo?",
  colors: "Ni rangi gani zinazowakilisha biashara yako?",
  location: "Uko wapi?",
  style: "Chagua mtindo unaoupenda.",
  building: "Sawa. Ninajenga tovuti yako sasa.",
  done: "Nimemaliza tovuti yako. Sasa unaweza kuhariri chochote kwa sauti au gumzo.",
};

const LG: CopyMap = {
  intro: "Oli otya, nze ADA AI. Tuzimbe websaiti yo wamu. Oyagala kuzimba ki?",
  category: "Oyagala kuzimba ki?",
  business_info: "Kirungi. Otunda ki oba owa ki? Mpa erinnya lya bizinensi yo n'ennyinnyonnyola entono.",
  logo: "Olina logo dda?",
  logo_create: "Oyagala nkukolere logo?",
  colors: "Langi ki ezikiikirira bizinensi yo?",
  location: "Oli wa?",
  style: "Londa style gw'oyagala.",
  building: "Kale. Nzimba websaiti yo kati.",
  done: "Mmaze okuzimba websaiti yo. Kati osobola okukyusa kyonna n'eddoboozi oba chat.",
};

const RW: CopyMap = {
  intro: "Muraho, ndi ADA AI. Reka twubake urubuga rwawe hamwe. Urashaka kubaka iki?",
  category: "Urashaka kubaka iki?",
  business_info: "Byiza. Ni iki ucuruza cyangwa utanga? Mpa izina ry'ubucuruzi bwawe n'incamake ngufi.",
  logo: "Ufite ikirango ko?",
  logo_create: "Urashaka nkugirire ikirango?",
  colors: "Ni amabara ki ahagarariye ikirango cyawe?",
  location: "Uri he?",
  style: "Hitamo imisusire ukunda.",
  building: "Sawa. Ndimo kubaka urubuga rwawe.",
  done: "Narangije kubaka urubuga rwawe. Ubu ushobora guhindura ikintu cyose ukoresheje ijwi cyangwa chat.",
};

const TABLE: Record<AdaLanguage, CopyMap> = {
  en: EN, fr: FR, ar: AR, sw: SW, lg: LG, rw: RW,
};

export function getCopy(lang: AdaLanguage, step: SpeakStepId): string {
  return (TABLE[lang] || EN)[step] || EN[step];
}

/** Localised label for the supported builder categories. */
export const CATEGORY_OPTIONS: Array<{
  value: "eshop" | "emenu" | "esite" | "influencer" | "community" | "estore";
  label: Record<AdaLanguage, string>;
}> = [
  { value: "eshop",      label: { en: "Eshop (products)",        fr: "Boutique (produits)",        ar: "متجر (منتجات)",       sw: "Duka (bidhaa)",          lg: "Eduuka (ebintu)",       rw: "Iduka (ibicuruzwa)" } },
  { value: "emenu",      label: { en: "Emenu (food)",            fr: "Menu (restauration)",        ar: "قائمة (طعام)",         sw: "Menyu (chakula)",        lg: "Menyu (emmere)",        rw: "Menu (ibiryo)" } },
  { value: "esite",      label: { en: "Eservice (services)",     fr: "Eservice (services)",        ar: "خدمات",                 sw: "Huduma",                  lg: "Empeereza",             rw: "Serivisi" } },
  { value: "influencer", label: { en: "Creator / influencer",    fr: "Créateur / influenceur",     ar: "منشئ محتوى / مؤثر",     sw: "Muumbaji / mshawishi",   lg: "Omukozi / influencer",  rw: "Umuhanzi / influencer" } },
  { value: "community",  label: { en: "Community / organization", fr: "Communauté / organisation",  ar: "مجتمع / منظمة",         sw: "Jumuiya / shirika",      lg: "Ekibinja / ekibiina",   rw: "Umuryango / ishyirahamwe" } },
  { value: "estore",     label: { en: "Agriculture store",       fr: "Magasin agricole",           ar: "متجر زراعي",            sw: "Duka la kilimo",         lg: "Eduuka ly'eby'obulimi", rw: "Iduka ry'ubuhinzi" } },
];

export const STYLE_OPTIONS: Array<{ value: string; label: Record<AdaLanguage, string> }> = [
  { value: "modern",   label: { en: "Modern",   fr: "Moderne",   ar: "عصري",     sw: "Kisasa",     lg: "Eya kati",        rw: "Igezweho" } },
  { value: "minimal",  label: { en: "Minimal",  fr: "Minimal",   ar: "بسيط",     sw: "Rahisi",     lg: "Entonotono",      rw: "Yoroshye" } },
  { value: "luxury",   label: { en: "Luxury",   fr: "Luxe",      ar: "فاخر",     sw: "Anasa",      lg: "Ey'ekitiibwa",    rw: "Ubuhanzi bw'agaciro" } },
  { value: "bold",     label: { en: "Bold",     fr: "Audacieux", ar: "جريء",     sw: "Jasiri",     lg: "Eyetongodde",     rw: "Igaragara" } },
  { value: "african",  label: { en: "African traditional", fr: "Africain traditionnel", ar: "أفريقي تقليدي", sw: "Kiafrika cha jadi", lg: "Eky'Afrika", rw: "Gakondo y'Afrika" } },
  { value: "creative", label: { en: "Creative", fr: "Créatif",   ar: "إبداعي",   sw: "Ubunifu",    lg: "Ey'obuyiiya",     rw: "Ubuhanzi" } },
];

export const YES_NO_LABELS: Record<AdaLanguage, { yes: string; no: string }> = {
  en: { yes: "Yes", no: "No" },
  fr: { yes: "Oui", no: "Non" },
  ar: { yes: "نعم", no: "لا" },
  sw: { yes: "Ndiyo", no: "Hapana" },
  lg: { yes: "Yee", no: "Nedda" },
  rw: { yes: "Yego", no: "Oya" },
};

export const ACTION_LABELS: Record<AdaLanguage, { mic: string; send: string; next: string; back: string; build: string; placeholder: string; listening: string; speak_to_build: string; speak_subtitle: string; start_speaking: string }> = {
  en: { mic: "Tap to speak", send: "Send", next: "Continue", back: "Back", build: "Build my site", placeholder: "Type your answer or tap the mic", listening: "Listening…", speak_to_build: "Speak to Build", speak_subtitle: "Voice-first onboarding. Just talk — ADA will build it.", start_speaking: "Start speaking" },
  fr: { mic: "Touchez pour parler", send: "Envoyer", next: "Continuer", back: "Retour", build: "Construire mon site", placeholder: "Tapez votre réponse ou utilisez le micro", listening: "À l'écoute…", speak_to_build: "Parler pour créer", speak_subtitle: "Onboarding vocal. Parlez — ADA s'occupe du reste.", start_speaking: "Commencez à parler" },
  ar: { mic: "اضغط للتحدث", send: "إرسال", next: "متابعة", back: "رجوع", build: "ابنِ موقعي", placeholder: "اكتب إجابتك أو اضغط على الميكروفون", listening: "أستمع…", speak_to_build: "تحدث لتبني", speak_subtitle: "إعداد صوتي. تحدث فقط — ستبنيه ADA.", start_speaking: "ابدأ التحدث" },
  sw: { mic: "Bofya kuongea", send: "Tuma", next: "Endelea", back: "Rudi", build: "Jenga tovuti yangu", placeholder: "Andika au tumia kipaza sauti", listening: "Nakusikiliza…", speak_to_build: "Sema ili Ujenge", speak_subtitle: "Onboarding ya sauti. Sema tu — ADA atajenga.", start_speaking: "Anza kuongea" },
  lg: { mic: "Nyiga okwogera", send: "Sindika", next: "Weeyongere", back: "Komawo", build: "Zimba websaiti yange", placeholder: "Wandiika oba kozesa mic", listening: "Mpuliriza…", speak_to_build: "Yogera Ozimbe", speak_subtitle: "Onboarding y'eddoboozi. Yogera bukya — ADA ajja kuzimba.", start_speaking: "Tandika okwogera" },
  rw: { mic: "Kanda uvuge", send: "Ohereza", next: "Komeza", back: "Subira", build: "Ubake urubuga rwanjye", placeholder: "Andika cyangwa koresha mic", listening: "Ndumva…", speak_to_build: "Vuga Wubake", speak_subtitle: "Onboarding y'amajwi. Vuga gusa — ADA azabaka.", start_speaking: "Tangira kuvuga" },
};