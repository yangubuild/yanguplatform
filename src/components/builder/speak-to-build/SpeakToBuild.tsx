// LOCKED: Voice-only UI. Do not reintroduce chat UI.
/**
 * SpeakToBuild — Full-screen, phone-call style voice interface.
 *
 * The legacy chat/text/category UI is gone. Interaction is voice-first:
 *   ADA speaks → user answers by voice → step machine advances → repeat.
 *
 * Preserved from the previous implementation:
 *   - STEPS state machine
 *   - parsers (categoryFromText / styleFromText / extractPrimaryColor / isYes / isNo)
 *   - handleTextAnswer() — the single entry point for advancing on any transcript
 *   - completion payload + onComplete pipeline
 *
 * UI:
 *   - Top: status line ("ADA is speaking…", "Listening…", "Thinking…")
 *   - Center: VoiceOrb (idle/listening/speaking/thinking, audio-reactive)
 *   - Bottom: End Call
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, PhoneOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  speakAsync,
  voiceInterrupt,
  beginSession,
  stopSpeaking,
} from "@/lib/voice/voiceController";
import { resolveLanguage, type AdaLanguage } from "@/lib/voice/languageDetect";
import { useVoiceCall } from "./useVoiceCall";
import { VoiceOrb } from "./VoiceOrb";
import {
  ACTION_LABELS,
  STYLE_OPTIONS,
  getCopy,
} from "./copy";
import {
  DEFAULT_ANSWERS,
  type SpeakAnswers,
  type SpeakCategory,
  type SpeakStepId,
} from "./types";

interface Props {
  initialCategory?: SpeakCategory | null;
  onComplete: (answers: Record<string, unknown>) => Promise<unknown> | unknown;
  onBack: () => void;
  onSwitchToChat?: (answers: Record<string, unknown>) => void;
}

/** Shared sessionStorage key for handing off the voice transcript to the chat builder. */
export const SPEAK_TO_CHAT_SEED_KEY = "speak_to_chat_seed_v1";

type TranscriptEntry = { role: "assistant" | "user"; text: string; ts: number };

const STEPS: SpeakStepId[] = [
  "intro", "category", "business_info", "logo", "logo_create",
  "colors", "location", "style", "building", "done",
];

// ----- parsers (preserved) -------------------------------------------------

const HEX_RE = /#?([0-9a-f]{6}|[0-9a-f]{3})\b/i;
const NAMED_COLORS: Record<string, string> = {
  red: "#dc2626", blue: "#2563eb", green: "#16a34a", black: "#111111",
  white: "#ffffff", yellow: "#eab308", orange: "#ea580c", purple: "#7c3aed",
  pink: "#db2777", brown: "#78350f", gold: "#d4af37", silver: "#9ca3af",
};
function extractPrimaryColor(text: string): string | null {
  const m = text.match(HEX_RE);
  if (m) return m[0].startsWith("#") ? m[0] : `#${m[0]}`;
  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) return hex;
  }
  return null;
}
function isYes(text: string): boolean {
  return /\b(yes|yeah|yep|sure|ok|okay|oui|نعم|ndiyo|yee|yego)\b/i.test(text);
}
function isNo(text: string): boolean {
  return /\b(no|nope|nah|non|لا|hapana|nedda|oya)\b/i.test(text);
}
function categoryFromText(text: string): SpeakCategory | null {
  const t = text.toLowerCase();
  if (/\b(eshop|shop|store|product|boutique|duka|iduka|متجر|eduuka)\b/.test(t) && !/\b(agri|farm|kilimo)\b/.test(t)) return "eshop";
  if (/\b(emenu|menu|food|restaurant|cafe|chakula|emmere|طعام|ibiryo)\b/.test(t)) return "emenu";
  if (/\b(eservice|service|services|huduma|empeereza|serivisi|خدمات)\b/.test(t)) return "esite";
  if (/\b(creator|influencer|content|muumbaji|umuhanzi|مؤثر)\b/.test(t)) return "influencer";
  if (/\b(community|organisation|organization|ngo|jumuiya|umuryango|ekibinja|مجتمع)\b/.test(t)) return "community";
  if (/\b(agri|agriculture|farm|farming|estore|kilimo|ubuhinzi|obulimi|زراع)\b/.test(t)) return "estore";
  return null;
}
function styleFromText(text: string): string | null {
  const t = text.toLowerCase();
  for (const opt of STYLE_OPTIONS) {
    if (new RegExp(`\\b${opt.value}\\b`, "i").test(t)) return opt.value;
  }
  if (/\bafric/i.test(t)) return "african";
  return null;
}

// ----- component -----------------------------------------------------------

export function SpeakToBuild({ initialCategory, onComplete, onBack, onSwitchToChat }: Props) {
  const [step, setStep] = useState<SpeakStepId>("intro");
  const [answers, setAnswers] = useState<SpeakAnswers>({
    ...DEFAULT_ANSWERS,
    category: (initialCategory as SpeakCategory) || null,
  });
  const [fadingOut, setFadingOut] = useState(false);
  const [sttFailures, setSttFailures] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const language = answers.language;
  const labels = ACTION_LABELS[language];

  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const sessionRef = useRef<ReturnType<typeof beginSession> | null>(null);
  if (sessionRef.current == null) sessionRef.current = beginSession();

  // ---- Audio unlock (browser autoplay policy) --------------------------
  // First user click resumes the AudioContext and flips audioReady=true.
  // ADA's intro speech is gated behind audioReady so it never silently fails.
  const unlockAudio = useCallback(async () => {
    if (audioReady) return;
    try {
      const Ctx: typeof AudioContext | undefined =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx && !audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      // Play a 1-frame silent buffer to fully unlock on iOS / strict browsers.
      if (audioCtxRef.current) {
        const buf = audioCtxRef.current.createBuffer(1, 1, 22050);
        const src = audioCtxRef.current.createBufferSource();
        src.buffer = buf;
        src.connect(audioCtxRef.current.destination);
        src.start(0);
      }
      // Also nudge speechSynthesis (Safari requires speak() inside a gesture).
      try {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance("");
          u.volume = 0;
          window.speechSynthesis.speak(u);
        }
      } catch { /* ignore */ }
      console.log("[SpeakToBuild] audio unlocked");
      setAudioReady(true);
    } catch (err) {
      console.error("[SpeakToBuild] audio unlock failed:", err);
      // Still flip ready so we attempt playback rather than block forever.
      setAudioReady(true);
    }
  }, [audioReady]);

  // Conversation log shared with chat builder on handoff.
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const logTurn = useCallback((role: "assistant" | "user", text: string) => {
    const t = (text || "").trim();
    if (!t) return;
    transcriptRef.current.push({ role, text: t, ts: Date.now() });
  }, []);

  const updateAnswer = useCallback(<K extends keyof SpeakAnswers>(key: K, value: SpeakAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = useCallback((from: SpeakStepId) => {
    const idx = STEPS.indexOf(from);
    setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  }, []);

  // ---- handleTextAnswer (preserved logic) -------------------------------
  const handleTextAnswer = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    logTurn("user", text);

    // Reset STT failure counter on a successful turn
    setSttFailures(0);

    // Lock language sticky on first turns
    const cur = stepRef.current;
    if (cur === "intro" || cur === "category" || cur === "business_info") {
      const detected = resolveLanguage({ text });
      if (detected !== answersRef.current.language) updateAnswer("language", detected);
    }

    switch (cur) {
      case "intro":
      case "category": {
        const cat = categoryFromText(text) || answersRef.current.category;
        if (cat) {
          updateAnswer("category", cat);
          setStep("business_info");
        } else {
          setStep("category");
        }
        break;
      }
      case "business_info": {
        const split = text.split(/[,—–\-:.\n]/);
        const name = split[0].trim();
        const desc = split.slice(1).join(", ").trim() || text;
        updateAnswer("business_name", name || text.slice(0, 60));
        updateAnswer("business_description", desc);
        goNext("business_info");
        break;
      }
      case "logo": {
        if (isYes(text)) { updateAnswer("has_logo", true); setStep("colors"); }
        else if (isNo(text)) { updateAnswer("has_logo", false); setStep("logo_create"); }
        else { setStep("logo"); }
        break;
      }
      case "logo_create": {
        updateAnswer("wants_ai_logo", isYes(text) ? true : isNo(text) ? false : null);
        setStep("colors");
        break;
      }
      case "colors": {
        const hex = extractPrimaryColor(text);
        updateAnswer("brand_colors", text);
        if (hex) updateAnswer("primary_color", hex);
        goNext("colors");
        break;
      }
      case "location": {
        updateAnswer("location", text);
        goNext("location");
        break;
      }
      case "style": {
        const s = styleFromText(text);
        updateAnswer("style", s || text);
        setStep("building");
        break;
      }
      default:
        break;
    }
  }, [goNext, updateAnswer, logTurn]);

  // ---- voice engine -----------------------------------------------------

  const onSilenceRecovery = useCallback(() => {
    const recovery: Record<AdaLanguage, string> = {
      en: "I didn't catch that. You can speak now, or tap the orb.",
      fr: "Je n'ai pas compris. Parlez maintenant, ou touchez l'orbe.",
      ar: "لم أسمعك. يمكنك التحدث الآن أو لمس الكرة.",
      sw: "Sikukusikia. Sema sasa au gusa duara.",
      lg: "Sikukutegedde. Yogera kati oba okwate orb.",
      rw: "Sinakumvise. Vuga ubu cyangwa ukande orb.",
    };
    void speakAsync(recovery[language] || recovery.en, language);
  }, [language]);

  const voice = useVoiceCall({
    onTranscript: handleTextAnswer,
    onSilenceRecovery,
    onSttError: () => setSttFailures((n) => n + 1),
    onMicDenied: () => {
      toast.error("Microphone permission is required for Speak to Build.");
    },
    enabled: !fadingOut && step !== "done",
  });

  // ---- ADA speaks the prompt for each step ------------------------------
  const spokenStepsRef = useRef<Set<SpeakStepId>>(new Set());
  const firstSpeechDoneRef = useRef(false);

  useEffect(() => {
    if (fadingOut) return;
    if (!audioReady) return;
    if (spokenStepsRef.current.has(step)) return;
    spokenStepsRef.current.add(step);

    // Skip auto-speak for terminal building/done — handled separately below.
    if (step === "building") return;

    const text = getCopy(language, step);
    if (!text) return;

    void (async () => {
      logTurn("assistant", text);
      console.log("[SpeakToBuild] speak start →", step, text.slice(0, 60));
      try {
        await speakAsync(text, language);
        console.log("[SpeakToBuild] speak end →", step);
      } catch (err) {
        console.error("[SpeakToBuild] speakAsync error:", err);
      }
      if (!firstSpeechDoneRef.current) {
        firstSpeechDoneRef.current = true;
        // Lazy-mic activation after first speech (LOCK).
        voice.notifyFirstSpeechEnded();
      }
    })();
  }, [step, language, fadingOut, voice, logTurn, audioReady]);

  // Reset spoken set when language changes so prompts replay in new language.
  useEffect(() => {
    spokenStepsRef.current = new Set();
  }, [language]);

  // ---- Build trigger ----------------------------------------------------
  const buildTriggeredRef = useRef(false);
  useEffect(() => {
    if (step !== "building" || buildTriggeredRef.current) return;
    buildTriggeredRef.current = true;

    // Speak "I'm building your website now." then run the build.
    const buildLine = getCopy(language, "building");
    logTurn("assistant", buildLine);
    void speakAsync(buildLine, language);

    const payload: Record<string, unknown> = {
      business_name: answers.business_name || "Untitled",
      display_name: answers.business_name || "Untitled",
      community_name: answers.business_name || "Untitled",
      business_description: answers.business_description,
      industry: answers.category || "",
      location: answers.location,
      primary_color: answers.primary_color,
      _speak_to_build: true,
      _speak_language: answers.language,
      _speak_style: answers.style,
      _speak_has_logo: answers.has_logo,
      _speak_wants_ai_logo: answers.wants_ai_logo,
      _speak_brand_colors: answers.brand_colors,
      _speak_category: answers.category,
    };

    Promise.resolve(onComplete(payload))
      .then(async () => {
        // Completion line + brief pause + fade to editor.
        const done: Record<AdaLanguage, string> = {
          en: "Your website is ready.",
          fr: "Votre site est prêt.",
          ar: "موقعك جاهز.",
          sw: "Tovuti yako iko tayari.",
          lg: "Websaiti yo emaze.",
          rw: "Urubuga rwawe rwiteguye.",
        };
        const doneLine = done[language] || done.en;
        logTurn("assistant", doneLine);
        await speakAsync(doneLine, language);
        setStep("done");
        await new Promise((r) => setTimeout(r, 1500));
        setFadingOut(true);
        await new Promise((r) => setTimeout(r, 300));
        toast.success("Built with Speak to Build");
        // Parent's onComplete already handled navigation; nothing to do here.
      })
      .catch((err) => {
        console.error("[SpeakToBuild] build failed:", err);
        toast.error("Build failed — please try again.");
        buildTriggeredRef.current = false;
        setStep("style");
      });
  }, [step, answers, onComplete, language, logTurn]);

  // ---- cleanup on unmount ----------------------------------------------
  useEffect(() => {
    return () => {
      try { voice.stop(); } catch { /* ignore */ }
      try { stopSpeaking(); } catch { /* ignore */ }
    };
  }, [voice]);

  // ---- footer actions ---------------------------------------------------
  /**
   * End Call — stops mic and TTS but does NOT reset conversation/builder state.
   * Persists the current transcript + answers to sessionStorage so the user can
   * resume in the chat builder if they choose to.
   */
  const persistSnapshot = useCallback(() => {
    try {
      const snapshot = {
        transcript: transcriptRef.current,
        answers: answersRef.current,
        ts: Date.now(),
      };
      sessionStorage.setItem(SPEAK_TO_CHAT_SEED_KEY, JSON.stringify(snapshot));
    } catch { /* ignore */ }
  }, []);

  const handleEndCall = useCallback(() => {
    try { voice.stop(); } catch { /* ignore */ }
    try { voiceInterrupt(); } catch { /* ignore */ }
    persistSnapshot();
    onBack();
  }, [onBack, voice, persistSnapshot]);

  const handleOpenChat = useCallback(() => {
    try { voice.stop(); } catch { /* ignore */ }
    try { voiceInterrupt(); } catch { /* ignore */ }
    persistSnapshot();
    if (onSwitchToChat) {
      onSwitchToChat({
        business_name: answers.business_name,
        business_description: answers.business_description,
        industry: answers.category || "",
        location: answers.location,
        primary_color: answers.primary_color,
        _speak_category: answers.category,
        _speak_language: answers.language,
        _speak_style: answers.style,
        _speak_transcript: transcriptRef.current,
      });
    } else {
      onBack();
    }
  }, [voice, onSwitchToChat, onBack, answers, persistSnapshot]);

  // ---- header status ----------------------------------------------------
  const status = useMemo(() => {
    if (step === "building") return labels.build + "…";
    if (step === "done") return labels.next;
    switch (voice.uiState) {
      case "speaking":  return "ADA is speaking…";
      case "thinking":  return "Thinking…";
      case "listening": return labels.listening;
      default:          return "Tap the orb to speak";
    }
  }, [voice.uiState, step, labels]);

  // ---- render -----------------------------------------------------------
  return (
    <div
      className={`fixed inset-0 z-50 bg-background text-foreground flex flex-col transition-opacity duration-300 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      onClick={voice.notifyUserGesture}
    >
      {/* Top status */}
      <header className="px-6 pt-8 sm:pt-12 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          aria-label="Back"
          className="absolute left-4 top-4 sm:left-6 sm:top-6 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {labels.speak_to_build}
        </p>
        <h1 className="mt-2 text-xl sm:text-2xl font-medium">{status}</h1>
        {voice.hint && (
          <p className="mt-2 text-sm text-muted-foreground">{voice.hint}</p>
        )}
      </header>

      {/* Center orb */}
      <main className="flex-1 grid place-items-center px-6">
        <VoiceOrb
          state={voice.uiState}
          level={voice.level}
          onTap={() => {
            voice.notifyUserGesture();
            voice.toggle();
          }}
          ariaLabel={labels.mic}
        />
      </main>

      {/* Bottom actions */}
      <footer className="px-6 pb-10 sm:pb-14 flex items-center justify-center gap-3">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-2xl px-6 h-14 gap-2"
          onClick={(e) => { e.stopPropagation(); handleEndCall(); }}
        >
          <PhoneOff className="h-5 w-5" />
          End Call
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="rounded-2xl px-6 h-14 gap-2"
          onClick={(e) => { e.stopPropagation(); handleOpenChat(); }}
        >
          <MessageSquare className="h-5 w-5" />
          Open Chat
        </Button>
      </footer>
    </div>
  );
}
