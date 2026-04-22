/**
 * SpeakToBuild — Voice-first onboarding flow.
 *
 * Independent from the event-stream "Build with Chat" system:
 *   - No events[] / no mutation engine / no chat schema.
 *   - Pure sequential state machine.
 *   - Voice in (Whisper via ada-transcribe-audio) → step advance → voice out
 *     (ElevenLabs/Google via ada-tts), with text typing as fallback.
 *
 * On completion, hands the collected answers to the parent's existing
 * onComplete pipeline (the same one used by the manual + AI flows).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Mic, MicOff, Send, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useChatAudioRecorder } from "@/hooks/useChatAudioRecorder";
import { speak as voiceSpeak, stopSpeaking, interrupt as voiceInterrupt, isSpeaking, onSpeakingChange } from "@/lib/voice/voiceController";
import { resolveLanguage, type AdaLanguage } from "@/lib/voice/languageDetect";
import {
  ACTION_LABELS,
  CATEGORY_OPTIONS,
  STYLE_OPTIONS,
  YES_NO_LABELS,
  getCopy,
} from "./copy";
import {
  DEFAULT_ANSWERS,
  type SpeakAnswers,
  type SpeakCategory,
  type SpeakStepId,
} from "./types";

interface Props {
  /** Optional pre-selected category from the entry page. */
  initialCategory?: SpeakCategory | null;
  /** Called with collected answers when the flow finishes. */
  onComplete: (answers: Record<string, unknown>) => Promise<unknown> | unknown;
  /** Called when the user wants to leave the flow. */
  onBack: () => void;
}

const STEPS: SpeakStepId[] = [
  "intro", "category", "business_info", "logo", "logo_create",
  "colors", "location", "style", "building", "done",
];

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

export function SpeakToBuild({ initialCategory, onComplete, onBack }: Props) {
  const [step, setStep] = useState<SpeakStepId>("intro");
  const [answers, setAnswers] = useState<SpeakAnswers>({
    ...DEFAULT_ANSWERS,
    category: (initialCategory as SpeakCategory) || null,
  });
  const [textInput, setTextInput] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [adaSpeaking, setAdaSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  const language = answers.language;
  const labels = ACTION_LABELS[language];
  const yn = YES_NO_LABELS[language];

  // Track whether intro voice has played.
  const spokenStepsRef = useRef<Set<SpeakStepId>>(new Set());
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Speak the prompt when entering a new step.
  useEffect(() => {
    const off = onSpeakingChange(setAdaSpeaking);
    return () => { off(); stopSpeaking(); };
  }, []);

  useEffect(() => {
    if (mutedRef.current) return;
    if (spokenStepsRef.current.has(step)) return;
    spokenStepsRef.current.add(step);
    const text = getCopy(language, step);
    if (text) voiceSpeak(text, language);
  }, [step, language]);

  // Reset spoken set when language changes so prompts replay in new language.
  useEffect(() => {
    spokenStepsRef.current = new Set();
  }, [language]);

  const updateAnswer = useCallback(<K extends keyof SpeakAnswers>(key: K, value: SpeakAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = useCallback((from: SpeakStepId) => {
    const idx = STEPS.indexOf(from);
    const next = STEPS[Math.min(idx + 1, STEPS.length - 1)];
    setStep(next);
  }, []);

  const goPrev = useCallback(() => {
    voiceInterrupt();
    setStep((cur) => {
      const idx = STEPS.indexOf(cur);
      const prev = STEPS[Math.max(idx - 1, 0)] as SpeakStepId;
      // Allow re-speaking the prompt for the previous step.
      spokenStepsRef.current.delete(prev);
      return prev;
    });
  }, []);

  /** Process a free-text answer for the current step. */
  const handleTextAnswer = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setTextInput("");
    voiceInterrupt();

    // Lock language on first non-trivial text input (sticky for session).
    if (step === "intro" || step === "category" || step === "business_info") {
      const detected = resolveLanguage({ text });
      if (detected !== answers.language) updateAnswer("language", detected);
    }

    switch (step) {
      case "intro":
      case "category": {
        const cat = categoryFromText(text) || answers.category;
        if (cat) {
          updateAnswer("category", cat);
          setStep("business_info");
        } else {
          // Couldn't parse — re-speak prompt.
          spokenStepsRef.current.delete("category");
          setStep("category");
        }
        break;
      }
      case "business_info": {
        // First sentence/comma → name, rest → description.
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
        else { spokenStepsRef.current.delete("logo"); setStep("logo"); }
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
  }, [step, answers.category, answers.language, goNext, updateAnswer]);

  /** Audio recorder → transcribe → handle as text answer. */
  const handleRecorded = useCallback(async (blob: Blob) => {
    if (blob.size < 500) return;
    setIsTranscribing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || "anon";
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
      const filePath = `${userId}/speak-to-build/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("ada-audio")
        .upload(filePath, blob, { contentType: blob.type, upsert: true });
      if (upErr) {
        toast({ title: `Audio upload failed: ${upErr.message}`, variant: "destructive" });
        return;
      }
      const { data, error: fnErr } = await supabase.functions.invoke("ada-transcribe-audio", {
        body: { bucket: "ada-audio", path: filePath },
      });
      if (fnErr || data?.ok === false) {
        toast({ title: data?.message || "Couldn't hear that — try again.", variant: "destructive" });
        return;
      }
      const transcript = (data?.transcript || "").trim();
      if (!transcript) {
        toast({ title: "Didn't catch that — try again.", variant: "destructive" });
        return;
      }
      // Sticky language detection from STT metadata when available.
      const detected = resolveLanguage({ sttLanguage: data?.language, text: transcript });
      if (detected !== answers.language) updateAnswer("language", detected);
      handleTextAnswer(transcript);
    } catch (err) {
      console.error("[SpeakToBuild mic] error:", err);
      toast({ title: "Voice processing error", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  }, [answers.language, handleTextAnswer, updateAnswer]);

  const { isRecording, isSupported, toggleRecording } = useChatAudioRecorder({
    onRecorded: handleRecorded,
    onError: (m) => toast({ title: m, variant: "destructive" }),
  });

  const handleMicClick = async () => {
    voiceInterrupt();
    await toggleRecording();
  };

  const toggleMute = () => {
    if (!muted) stopSpeaking();
    setMuted((m) => !m);
  };

  // Trigger the actual build when entering "building" step.
  const buildTriggeredRef = useRef(false);
  useEffect(() => {
    if (step !== "building" || buildTriggeredRef.current) return;
    buildTriggeredRef.current = true;
    setIsBuilding(true);

    const payload: Record<string, unknown> = {
      // Core info expected by handleComplete()
      business_name: answers.business_name || "Untitled",
      display_name: answers.business_name || "Untitled",
      community_name: answers.business_name || "Untitled",
      business_description: answers.business_description,
      industry: answers.category || "",
      location: answers.location,
      primary_color: answers.primary_color,

      // Speak-to-Build provenance (separate from chat/event metadata).
      _speak_to_build: true,
      _speak_language: answers.language,
      _speak_style: answers.style,
      _speak_has_logo: answers.has_logo,
      _speak_wants_ai_logo: answers.wants_ai_logo,
      _speak_brand_colors: answers.brand_colors,
      _speak_category: answers.category,
    };

    Promise.resolve(onComplete(payload))
      .then(() => {
        setStep("done");
      })
      .catch((err) => {
        console.error("[SpeakToBuild] build failed:", err);
        toast({ title: "Build failed — please try again.", variant: "destructive" });
        buildTriggeredRef.current = false;
        setStep("style");
      })
      .finally(() => setIsBuilding(false));
  }, [step, answers, onComplete]);

  // Render helpers.
  const promptText = getCopy(language, step);
  const showInput = useMemo(() =>
    !["intro", "building", "done"].includes(step), [step]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { voiceInterrupt(); onBack(); }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {labels.back}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMute} aria-label={muted ? "Unmute ADA" : "Mute ADA"}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <span className="text-xs text-muted-foreground uppercase">{language}</span>
        </div>
      </div>

      <Card className="p-5 sm:p-6 space-y-4 border-2 border-primary/30">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{labels.speak_to_build}</p>
            <p className="text-base text-foreground leading-relaxed">{promptText}</p>
            {adaSpeaking && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
                {labels.listening.replace("…", "")}…
              </p>
            )}
          </div>
        </div>

        {/* Step-specific quick options */}
        {step === "category" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={answers.category === opt.value ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => { voiceInterrupt(); updateAnswer("category", opt.value); setStep("business_info"); }}
              >
                {opt.label[language]}
              </Button>
            ))}
          </div>
        )}

        {(step === "logo" || step === "logo_create") && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                voiceInterrupt();
                if (step === "logo") { updateAnswer("has_logo", true); setStep("colors"); }
                else { updateAnswer("wants_ai_logo", true); setStep("colors"); }
              }}
            >
              {yn.yes}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                voiceInterrupt();
                if (step === "logo") { updateAnswer("has_logo", false); setStep("logo_create"); }
                else { updateAnswer("wants_ai_logo", false); setStep("colors"); }
              }}
            >
              {yn.no}
            </Button>
          </div>
        )}

        {step === "style" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STYLE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={answers.style === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => { voiceInterrupt(); updateAnswer("style", opt.value); setStep("building"); }}
              >
                {opt.label[language]}
              </Button>
            ))}
          </div>
        )}

        {step === "building" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isBuilding ? labels.build + "…" : "…"}
          </div>
        )}

        {step === "done" && (
          <Button onClick={onBack} className="w-full">{labels.next}</Button>
        )}

        {/* Free text + mic input */}
        {showInput && (
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-1.5">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleTextAnswer(textInput);
                }
              }}
              placeholder={labels.placeholder}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none px-2 py-1.5 max-h-[120px]"
            />
            {isSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                disabled={isTranscribing}
                aria-label={isRecording ? "Stop recording" : labels.mic}
                className={`p-1.5 rounded-full transition-colors shrink-0 ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "text-muted-foreground hover:text-foreground"
                } disabled:opacity-40`}
              >
                {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => handleTextAnswer(textInput)}
              disabled={!textInput.trim()}
              className="p-1.5 rounded-full bg-foreground text-background disabled:opacity-40 transition-opacity shrink-0"
              aria-label={labels.send}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </Card>

      {/* Step nav */}
      {step !== "intro" && step !== "building" && step !== "done" && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button onClick={goPrev} className="underline-offset-2 hover:underline">{labels.back}</button>
          <span>{STEPS.indexOf(step)} / {STEPS.length - 2}</span>
        </div>
      )}

      {/* Intro CTA */}
      {step === "intro" && (
        <div className="flex justify-center">
          <Button size="lg" onClick={() => { voiceInterrupt(); setStep("category"); }}>
            <Mic className="h-4 w-4 mr-2" /> {labels.start_speaking}
          </Button>
        </div>
      )}
    </div>
  );
}

// Avoid an unused-import warning for isSpeaking (reserved for future telemetry).
void isSpeaking;