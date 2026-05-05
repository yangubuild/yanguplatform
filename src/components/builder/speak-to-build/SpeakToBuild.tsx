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
import { resolveLanguage, type AdaLanguage } from "@/lib/voice/languageDetect";
import { useRealtimeVoice } from "./useRealtimeVoice";
import { VoiceOrb } from "./VoiceOrb";
import { supabase } from "@/integrations/supabase/client";
import { getEngine } from "@/lib/builder/engineRegistry";
import { validateDraft } from "@/lib/builder/aiPipeline";
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
  console.log("SpeakToBuild render");
  const [step, setStep] = useState<SpeakStepId>("intro");
  const [answers, setAnswers] = useState<SpeakAnswers>({
    ...DEFAULT_ANSWERS,
    category: (initialCategory as SpeakCategory) || null,
  });
  const [fadingOut, setFadingOut] = useState(false);

  const language = answers.language;
  const labels = ACTION_LABELS[language];

  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

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

  // After handleTextAnswer advances `step`, we need to prompt ADA with the
  // next step's question. We compute it from the just-updated stepRef.
  const pendingNextPromptRef = useRef<SpeakStepId | null>(null);

  // ---- handleTextAnswer (preserved logic) -------------------------------
  const handleTextAnswer = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    console.log("[SpeakToBuild] transcript ←", text);
    logTurn("user", text);

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
          pendingNextPromptRef.current = "business_info";
        } else {
          setStep("category");
          pendingNextPromptRef.current = "category";
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
        pendingNextPromptRef.current = "logo";
        break;
      }
      case "logo": {
        if (isYes(text)) {
          updateAnswer("has_logo", true); setStep("colors");
          pendingNextPromptRef.current = "colors";
        } else if (isNo(text)) {
          updateAnswer("has_logo", false); setStep("logo_create");
          pendingNextPromptRef.current = "logo_create";
        } else {
          setStep("logo");
          pendingNextPromptRef.current = "logo";
        }
        break;
      }
      case "logo_create": {
        updateAnswer("wants_ai_logo", isYes(text) ? true : isNo(text) ? false : null);
        setStep("colors");
        pendingNextPromptRef.current = "colors";
        break;
      }
      case "colors": {
        const hex = extractPrimaryColor(text);
        updateAnswer("brand_colors", text);
        if (hex) updateAnswer("primary_color", hex);
        goNext("colors");
        pendingNextPromptRef.current = "location";
        break;
      }
      case "location": {
        updateAnswer("location", text);
        goNext("location");
        pendingNextPromptRef.current = "style";
        break;
      }
      case "style": {
        const s = styleFromText(text);
        updateAnswer("style", s || text);
        setStep("building");
        // No next prompt — build trigger takes over.
        pendingNextPromptRef.current = null;
        break;
      }
      default:
        break;
    }
  }, [goNext, updateAnswer, logTurn]);

  // ---- voice engine -----------------------------------------------------

  // OpenAI Realtime drives the entire conversation. The hook handles mic,
  // VAD, STT, LLM and TTS. We just observe transcripts to advance our local
  // step machine (so the build trigger still fires after enough info).
  const handleRealtimeMessage = useCallback(
    (text: string, role: "assistant" | "user") => {
      if (role === "user") {
        handleTextAnswer(text);
      } else {
        logTurn("assistant", text);
        // Build-handoff trigger: ADA confirms intake is complete.
        if (
          /\b(building|creating|generating)\b[^.]{0,40}\b(your|the)\b[^.]{0,20}\b(shop|store|site|menu|page|website)\b/i.test(
            text,
          ) ||
          /\b(let's build|let me build|i('?ll| will) build|now building)\b/i.test(text)
        ) {
          if (stepRef.current !== "building" && stepRef.current !== "done") {
            console.log("[SpeakToBuild] build trigger phrase detected →", text);
            pendingNextPromptRef.current = null;
            setStep("building");
          }
        }
      }
    },
    [handleTextAnswer, logTurn],
  );

  const voice = useRealtimeVoice({
    language,
    onMessage: handleRealtimeMessage,
    onError: (err) => {
      console.error("[SpeakToBuild] realtime error", err);
      toast.error(err.message || "Voice connection failed");
    },
    enabled: !fadingOut && step !== "done" && step !== "building",
  });

  // After each user turn advances the step, ask ADA to speak the next prompt.
  // This is the conversation-loop driver: user → handleTextAnswer →
  // pendingNextPromptRef set → here we send the next response.create.
  const voiceSendRef = useRef(voice.sendInstruction);
  useEffect(() => { voiceSendRef.current = voice.sendInstruction; }, [voice.sendInstruction]);
  useEffect(() => {
    const next = pendingNextPromptRef.current;
    if (!next) return;
    pendingNextPromptRef.current = null;
    const prompt = getCopy(language, next);
    if (!prompt) return;
    // Tiny delay so the previous user turn is fully committed server-side.
    const id = window.setTimeout(() => {
      try { voiceSendRef.current?.(prompt); } catch { /* ignore */ }
    }, 150);
    return () => window.clearTimeout(id);
  }, [step, language]);

  // ---- Build trigger ----------------------------------------------------
  const buildTriggeredRef = useRef(false);
  const [buildTimedOut, setBuildTimedOut] = useState(false);
  useEffect(() => {
    if (step !== "building" || buildTriggeredRef.current) return;
    buildTriggeredRef.current = true;

    // FIX 2: Fully terminate voice session before build starts.
    // 1) Clear any pending audio buffer over the data channel
    // 2) Close data channel + RTCPeerConnection cleanly via voice.stop()
    try { voice.sendRaw({ type: "input_audio_buffer.clear" }); } catch { /* ignore */ }
    try { voice.stop(); } catch { /* ignore */ }

    const buildLine = getCopy(language, "building");
    logTurn("assistant", buildLine);
    toast.info(buildLine);

    // Same request shape as the chat builder uses (BuilderAiOnboarding).
    const engineKey = answers.category || "eshop";
    const engine = getEngine(engineKey);
    const allowedTypes =
      engine?.aiGenerationRules?.allowedSectionTypes || ["hero", "text", "contact"];

    const aiAnswers: Record<string, unknown> = {
      business_name: answers.business_name || "Untitled",
      business_description: answers.business_description,
      industry: answers.category || "",
      location: answers.location,
      primary_color: answers.primary_color,
      style: answers.style,
      brand_colors: answers.brand_colors,
      has_logo: answers.has_logo,
      wants_ai_logo: answers.wants_ai_logo,
      language: answers.language,
    };

    (async () => {
      // FIX 3: Build timeout watchdog — if not navigated within 30s, surface retry.
      const timeoutId = window.setTimeout(() => {
        setBuildTimedOut(true);
      }, 30000);

      let draftResult: Record<string, unknown> | null = null;
      try {
        const { data, error } = await supabase.functions.invoke(
          "builder-ai-generate-draft",
          {
            body: {
              engineKey,
              answers: aiAnswers,
              allowedSectionTypes: allowedTypes,
              source: "speak_to_build",
            },
          },
        );
        if (error) throw new Error(error.message);
        if (!data?.ok) throw new Error(data?.error || "Generation failed");

        const validation = validateDraft(
          engineKey,
          (data.sections || []).map((s: { type: string; schema?: Record<string, unknown> }) => ({
            type: s.type,
            schema: s.schema || {},
          })),
        );
        const businessName =
          (data.business_name as string) ||
          (aiAnswers.business_name as string) ||
          "Untitled";

        draftResult = {
          ...aiAnswers,
          business_name: businessName,
          display_name: businessName,
          community_name: businessName,
          business_description: (data.description as string) || aiAnswers.business_description || "",
          primary_color: (data.primary_color as string) || answers.primary_color || "#2563eb",
          slug: String(businessName)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            .slice(0, 40),
          _ai_setup: true,
          _ai_source: "speak_to_build",
          _ai_sections: validation.cleanedSections,
          _ai_repairs: validation.repairs,
          _ai_answers: aiAnswers,
          _ai_profile: {
            businessName,
            description: (data.description as string) || "",
            primaryColor: (data.primary_color as string) || "#2563eb",
            source: "speak_to_build",
          },
          _speak_to_build: true,
          _speak_language: answers.language,
          _speak_style: answers.style,
          _speak_category: answers.category,
        };
      } catch (err) {
        console.warn("[SpeakToBuild] AI draft generation failed, falling back:", err);
        draftResult = {
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
          _speak_category: answers.category,
        };
      }

      return Promise.resolve(onComplete(draftResult))
      .then(async () => {
        window.clearTimeout(timeoutId);
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
        toast.success(doneLine);
        setStep("done");
        await new Promise((r) => setTimeout(r, 1500));
        setFadingOut(true);
        await new Promise((r) => setTimeout(r, 300));
        toast.success("Built with Speak to Build");
      })
      .catch((err) => {
        window.clearTimeout(timeoutId);
        console.error("[SpeakToBuild] build failed:", err);
        toast.error("Build failed — please try again.");
        buildTriggeredRef.current = false;
        setStep("style");
      });
    })();
  }, [step, answers, onComplete, language, logTurn, voice]);

  // ---- cleanup on unmount ----------------------------------------------
  // CRITICAL: `voice` identity changes ~60×/sec (audio level updates).
  // Depending on it would tear down the WebRTC session every frame and
  // trap the UI in "Connecting…". Capture latest via ref, run cleanup once.
  const voiceRef = useRef(voice);
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);
  useEffect(() => {
    return () => {
      try { voiceRef.current?.stop(); } catch { /* ignore */ }
    };
  }, []);

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
    persistSnapshot();
    onBack();
  }, [onBack, voice, persistSnapshot]);

  const handleOpenChat = useCallback(() => {
    try { voice.stop(); } catch { /* ignore */ }
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
    if (step === "building") return "Building your shop…";
    if (step === "done") return labels.next;
    switch (voice.uiState) {
      case "speaking":  return "ADA is speaking…";
      case "thinking":  return "Thinking…";
      case "listening": return labels.listening;
      case "connecting":return "Connecting…";
      case "error":     return "Voice unavailable";
      default:          return "Connecting…";
    }
  }, [voice.uiState, step, labels]);

  // Map realtime states → orb visual states (orb only knows 4 states).
  const orbState = useMemo(() => {
    if (voice.uiState === "speaking") return "speaking" as const;
    if (voice.uiState === "thinking") return "thinking" as const;
    if (voice.uiState === "listening") return "listening" as const;
    return "idle" as const;
  }, [voice.uiState]);

  // ---- render -----------------------------------------------------------
  return (
    <div
      className={`fixed inset-0 z-50 bg-background text-foreground flex flex-col transition-opacity duration-300 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
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
      </header>

      {/* Center orb */}
      <main className="flex-1 grid place-items-center px-6 relative">
        <VoiceOrb
          state={orbState}
          level={voice.level}
          onTap={voice.audioBlocked ? voice.unlockAudio : undefined}
          ariaLabel={labels.mic}
        />
        {step === "building" && buildTimedOut && (
          <div className="absolute inset-x-6 bottom-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Build is taking longer than expected — tap here to try again.
            </p>
            <Button
              variant="default"
              size="lg"
              className="rounded-2xl px-6 h-12"
              onClick={(e) => {
                e.stopPropagation();
                setBuildTimedOut(false);
                buildTriggeredRef.current = false;
                setStep("style");
              }}
            >
              Retry build
            </Button>
          </div>
        )}
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

      {voice.needsMicPicker && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-lg p-5">
            <h2 className="text-lg font-medium">Choose your microphone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We didn't hear any audio from your current mic. Pick a different input device.
            </p>
            <div className="mt-4 flex flex-col gap-2 max-h-64 overflow-y-auto">
              {voice.micDevices.length === 0 && (
                <p className="text-sm text-muted-foreground">No input devices found.</p>
              )}
              {voice.micDevices.map((d) => (
                <button
                  key={d.deviceId}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); voice.selectMicDevice(d.deviceId); }}
                  className="w-full text-left rounded-lg border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); voice.selectMicDevice(null); }}
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
