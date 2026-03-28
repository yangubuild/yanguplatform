import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/builder-new/ChatInterface";
import { SelectionPanel } from "@/components/builder-new/SelectionPanel";
import { useBuilderState } from "@/components/builder-new/hooks/useBuilderState";
import { useTogetherChat } from "@/components/builder-new/hooks/useTogetherChat";
import type { SelectionButton } from "@/components/builder-new/types/builder.types";
import yanguLogo from "@/assets/yangu-logo-full.png";

export default function BuilderNewPage() {
  const navigate = useNavigate();
  const { state, addMessage, addSelection, detectCategory, setCategory, updateConfig } = useBuilderState();
  const { sendMessage, isLoading } = useTogetherChat();

  // Send initial greeting on mount
  useEffect(() => {
    const greet = async () => {
      const resp = await sendMessage([], "Hello, I want to build a website.");
      addMessage({
        role: "assistant",
        content: resp.text,
        buttons: resp.buttons,
      });
    };
    if (state.messages.length === 0) greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (text: string) => {
    // Add user message
    addMessage({ role: "user", content: text });

    // Detect category from early messages
    if (!state.category) {
      const detected = detectCategory(text);
      if (detected) {
        setCategory(detected);
        addSelection({ type: "category", label: detected, value: detected });
      }
    }

    // Get AI response
    const allMessages = [...state.messages, { id: "", role: "user" as const, content: text, timestamp: Date.now() }];
    const resp = await sendMessage(allMessages, text);

    addMessage({
      role: "assistant",
      content: resp.text,
      buttons: resp.buttons,
    });
  }, [state.messages, state.category, addMessage, sendMessage, detectCategory, setCategory, addSelection]);

  const handleButtonClick = useCallback(async (button: SelectionButton) => {
    // Add selection
    addSelection({ type: button.type, label: button.label, value: button.value });

    // Update final config based on type
    switch (button.type) {
      case "scope":
        updateConfig({ scope: button.value });
        break;
      case "assets":
        updateConfig({ assets: button.value });
        break;
      case "sections":
        updateConfig({ sections: [...state.finalConfig.sections, button.value] });
        break;
      case "delivery_apps":
        updateConfig({ deliveryApps: [...state.finalConfig.deliveryApps, button.value] });
        break;
      case "style_category":
        updateConfig({ styleCategory: button.value });
        break;
      case "style_specific":
        updateConfig({ styleSpecific: button.value });
        break;
    }

    // Send the button selection as a user message
    addMessage({ role: "user", content: button.label });

    const allMessages = [
      ...state.messages,
      { id: "", role: "user" as const, content: button.label, timestamp: Date.now() },
    ];
    const resp = await sendMessage(allMessages, button.label);
    addMessage({
      role: "assistant",
      content: resp.text,
      buttons: resp.buttons,
    });
  }, [state.messages, state.finalConfig, addMessage, addSelection, sendMessage, updateConfig]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <img src={yanguLogo} alt="Yangu" className="h-6 w-auto opacity-70" />
        <span className="text-sm font-medium text-foreground">Website Builder</span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="flex-1 min-w-0 border-r border-border">
          <ChatInterface
            messages={state.messages}
            isLoading={isLoading}
            onSend={handleSend}
            onButtonClick={handleButtonClick}
          />
        </div>

        {/* Selections panel */}
        <div className="w-[320px] shrink-0 hidden md:block overflow-hidden">
          <SelectionPanel
            selections={state.selections}
            category={state.category}
          />
        </div>
      </div>
    </div>
  );
}
