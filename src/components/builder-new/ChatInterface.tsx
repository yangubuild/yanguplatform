import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Plus, Mic, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useChatAudioRecorder } from "@/hooks/useChatAudioRecorder";
import { interrupt as voiceInterrupt } from "@/lib/voice/voiceController";
import type { ChatMessage } from "./types/builder.types";
import type { Selection } from "./types/builder.types";
import type { StepConfig, StepOption, BuilderStep, UserAssets } from "./hooks/useStepController";
import type { Category } from "./types/builder.types";
import { MessageBubble } from "./MessageBubble";
import { BuilderPinnedNotice } from "./BuilderPinnedNotice";
import { StepRenderer } from "./StepRenderer";
import { YanguLoader } from "@/components/YanguLoader";
import { stopSpeaking } from "@/lib/voice/voiceController";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
  stepConfig: StepConfig;
  onOptionSelect: (option: StepOption) => void;
  onConfirmMulti: () => void;
  multiSelected: string[];
  inputAllowed: boolean;
  currentStep: BuilderStep;
  builderMode?: "new" | "edit";
  selections: Selection[];
  category?: Category | null;
  // Asset upload props
  userAssets?: UserAssets;
  onAssetsChange?: (assets: UserAssets) => void;
  onConfirmAssetUpload?: () => void;
  // AI logo props
  businessName?: string;
  onConfirmAiLogo?: (logoUrl: string, color?: string) => void;
}

const GREETING_PLACEHOLDERS: Record<Category, string> = {
  emenu: "e.g. Burger & Co, we serve fresh burgers and fries in Dubai...",
  eshop: "e.g. Urban Store, we sell premium clothing and accessories online...",
  esite: "e.g. Design Studio, we offer branding and web design services...",
  estore: "e.g. Fresh Farms, we supply wholesale produce and bulk groceries...",
  influencer: "e.g. Lifestyle Creator, I share fashion and beauty content daily...",
  community: "e.g. Fitness Circle, a community for health and wellness enthusiasts...",
};

export function ChatInterface({
  messages,
  isLoading,
  onSend,
  stepConfig,
  onOptionSelect,
  onConfirmMulti,
  multiSelected,
  inputAllowed,
  currentStep,
  builderMode = "new",
  selections,
  category,
  userAssets,
  onAssetsChange,
  onConfirmAssetUpload,
  businessName,
  onConfirmAiLogo,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [noticeHeight, setNoticeHeight] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleRecorded = useCallback(async (blob: Blob) => {
    if (blob.size < 500) return;
    setIsTranscribing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || "anon";
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
      const filePath = `${userId}/builder/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("ada-audio")
        .upload(filePath, blob, { contentType: blob.type, upsert: true });
      if (upErr) {
        toast({ title: `Audio upload failed: ${upErr.message || "unknown"}`, variant: "destructive" });
        return;
      }

      const { data, error: fnErr } = await supabase.functions.invoke("ada-transcribe-audio", {
        body: { bucket: "ada-audio", path: filePath },
      });

      if (fnErr || data?.ok === false) {
        toast({ title: data?.message || "Transcription failed. You can type instead.", variant: "destructive" });
        return;
      }
      const transcript = (data?.transcript || "").trim();
      if (!transcript) {
        toast({ title: "Didn't catch that — try again.", variant: "destructive" });
        return;
      }
      if (inputAllowed && !isLoading) {
        onSend(transcript);
      } else {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    } catch (err) {
      console.error("[Builder mic] error:", err);
      toast({ title: "Voice processing error", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  }, [inputAllowed, isLoading, onSend]);

  const { isRecording, isSupported, toggleRecording } = useChatAudioRecorder({
    onRecorded: handleRecorded,
    onError: (msg) => toast({ title: msg, variant: "destructive" }),
  });

  const handleMicClick = async () => {
    // Barge-in on tap
    voiceInterrupt();
    await toggleRecording();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, currentStep]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !inputAllowed) return;
    onSend(trimmed);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Typing = barge-in: stop any current ADA speech immediately.
    if (e.target.value && !input) stopSpeaking();
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const handleNoticeHeight = useCallback((h: number) => setNoticeHeight(h), []);

  const topPadding = noticeHeight > 0 ? noticeHeight + 28 : 16;

  const placeholder = currentStep === "greeting"
    ? (category && GREETING_PLACEHOLDERS[category]) || GREETING_PLACEHOLDERS.emenu
    : currentStep === "refinement"
    ? "e.g. Change the hero image, update the layout, make colors darker..."
    : currentStep === "business_location"
    ? "e.g. Dubai, UAE..."
    : "Click an option above to continue";

  return (
    <div className="flex flex-col h-full relative overflow-visible">
      <BuilderPinnedNotice mode={builderMode} onHeightChange={handleNoticeHeight} />

      {/* Messages + Step UI */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-4 space-y-4"
        style={{ paddingTop: topPadding + 18 }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Step options */}
        {!isLoading && (stepConfig.options.length > 0 || stepConfig.renderAs === "upload" || stepConfig.renderAs === "ai_logo") && (
          <div className="flex flex-col items-start gap-2 pt-1">
            <StepRenderer
              config={stepConfig}
              onSelect={onOptionSelect}
              onConfirmMulti={onConfirmMulti}
              multiSelected={multiSelected}
              currentStep={currentStep}
              category={category}
              userAssets={userAssets}
              onAssetsChange={onAssetsChange}
              onConfirmAssetUpload={onConfirmAssetUpload}
              businessName={businessName}
              onConfirmAiLogo={onConfirmAiLogo}
            />
          </div>
        )}

        {isLoading && (
          <div className="flex items-start gap-2 py-2">
            <YanguLoader size={24} fullArea={false} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`border-t border-border px-3 py-2.5 ${!inputAllowed ? "opacity-40 pointer-events-none" : ""}`}>
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-1.5">
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Plus className="h-4 w-4" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={!inputAllowed}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none py-1.5 max-h-[120px] disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !inputAllowed}
            className="p-1.5 rounded-full bg-foreground text-background disabled:opacity-40 transition-opacity shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
