import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/builder-new/ChatInterface";
import { SelectionPanel } from "@/components/builder-new/SelectionPanel";
import { SitePreview } from "@/components/builder-new/SitePreview";
import { useBuilderState } from "@/components/builder-new/hooks/useBuilderState";
import { useTogetherChat } from "@/components/builder-new/hooks/useTogetherChat";
import { generateWebsiteHTML } from "@/components/builder-new/utils/websiteGenerator";
import type { SelectionButton } from "@/components/builder-new/types/builder.types";
import yanguLogo from "@/assets/yangu-logo-full.png";

export default function BuilderNewPage() {
  const navigate = useNavigate();
  const { state, addMessage, addSelection, detectCategory, setCategory, updateConfig, setGenerating } = useBuilderState();
  const { sendMessage, isLoading } = useTogetherChat();
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  // Send initial greeting on mount
  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current || state.messages.length > 0) return;
    greetedRef.current = true;
    const greet = async () => {
      const resp = await sendMessage([], "Hello, I want to build a website.");
      addMessage({ role: "assistant", content: resp.text, buttons: resp.buttons });
    };
    greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (text: string) => {
    addMessage({ role: "user", content: text });

    if (!state.category) {
      const detected = detectCategory(text);
      if (detected) {
        setCategory(detected);
        addSelection({ type: "category", label: detected, value: detected });
      }
    }

    const allMessages = [...state.messages, { id: "", role: "user" as const, content: text, timestamp: Date.now() }];
    const resp = await sendMessage(allMessages, text);
    addMessage({ role: "assistant", content: resp.text, buttons: resp.buttons });
  }, [state.messages, state.category, addMessage, sendMessage, detectCategory, setCategory, addSelection]);

  const handleButtonClick = useCallback(async (button: SelectionButton) => {
    addSelection({ type: button.type, label: button.label, value: button.value });

    switch (button.type) {
      case "scope": updateConfig({ scope: button.value }); break;
      case "assets": updateConfig({ assets: button.value }); break;
      case "sections": updateConfig({ sections: [...state.finalConfig.sections, button.value] }); break;
      case "delivery_apps": updateConfig({ deliveryApps: [...state.finalConfig.deliveryApps, button.value] }); break;
      case "style_category": updateConfig({ styleCategory: button.value }); break;
      case "style_specific": updateConfig({ styleSpecific: button.value }); break;
    }

    // If confirm/generate, trigger generation
    if (button.type === "confirm" && button.value === "generate") {
      handleGenerate();
    }

    addMessage({ role: "user", content: button.label });

    const allMessages = [
      ...state.messages,
      { id: "", role: "user" as const, content: button.label, timestamp: Date.now() },
    ];
    const resp = await sendMessage(allMessages, button.label);
    addMessage({ role: "assistant", content: resp.text, buttons: resp.buttons });
  }, [state.messages, state.finalConfig, addMessage, addSelection, sendMessage, updateConfig]);

  const handleGenerate = useCallback(() => {
    if (!state.category) return;
    setGenerating(true);

    // Extract business name from the first user message
    const firstUserMsg = state.messages.find((m) => m.role === "user");
    const businessName = state.finalConfig.businessName || firstUserMsg?.content?.split(/[-–,]/)[0]?.trim() || "My Website";
    const location = state.finalConfig.location || "Dubai, UAE";

    const html = generateWebsiteHTML({
      category: state.category,
      businessName,
      location,
      scope: state.finalConfig.scope || "showcase",
      style: state.finalConfig.styleCategory || "modern",
      styleSpecific: state.finalConfig.styleSpecific || "",
      sections: state.finalConfig.sections,
      deliveryApps: state.finalConfig.deliveryApps,
      userIdea: firstUserMsg?.content || "",
    });

    // Small delay for UX feel
    setTimeout(() => {
      setGeneratedHtml(html);
      setGenerating(false);
    }, 1500);
  }, [state.category, state.messages, state.finalConfig, setGenerating]);

  const showPreview = !!generatedHtml;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <img src={yanguLogo} alt="Yangu" className="h-6 w-auto opacity-70" />
        <span className="text-sm font-medium text-foreground">Website Builder</span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className={`${showPreview ? "w-[380px]" : "flex-1"} min-w-0 border-r border-border shrink-0 transition-all`}>
          <ChatInterface
            messages={state.messages}
            isLoading={isLoading}
            onSend={handleSend}
            onButtonClick={handleButtonClick}
          />
        </div>

        {/* Preview panel - shown after generation */}
        {showPreview && (
          <div className="flex-1 min-w-0 border-r border-border">
            <SitePreview html={generatedHtml!} />
          </div>
        )}

        {/* Selections panel */}
        <div className="w-[280px] shrink-0 hidden md:block overflow-hidden">
          <SelectionPanel
            selections={state.selections}
            category={state.category}
            generatedHtml={generatedHtml}
            isGenerating={state.isGenerating}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
    </div>
  );
}
