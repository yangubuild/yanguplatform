import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Plus } from "lucide-react";
import type { ChatMessage } from "./types/builder.types";
import type { Selection } from "./types/builder.types";
import type { StepConfig, StepOption, BuilderStep, UserAssets } from "./hooks/useStepController";
import { MessageBubble } from "./MessageBubble";
import { BuilderPinnedNotice } from "./BuilderPinnedNotice";
import { StepRenderer } from "./StepRenderer";
import { YanguLoader } from "@/components/YanguLoader";

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
  // Asset upload props
  userAssets?: UserAssets;
  onAssetsChange?: (assets: UserAssets) => void;
  onConfirmAssetUpload?: () => void;
  // AI logo props
  businessName?: string;
  onConfirmAiLogo?: (logoUrl: string, color?: string) => void;
}

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
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const handleNoticeHeight = useCallback((h: number) => setNoticeHeight(h), []);

  const topPadding = noticeHeight > 0 ? noticeHeight + 28 : 16;

  const placeholder = currentStep === "greeting"
    ? "e.g. EZI FOOD, we sell burgers and fries in Dubai..."
    : currentStep === "refinement"
    ? "Describe what you'd like to change..."
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
