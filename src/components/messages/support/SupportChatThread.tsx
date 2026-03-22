import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, ArrowLeft, Headset, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupportChat } from "@/hooks/useSupportChat";
import { SupportContactModal } from "./SupportContactModal";

interface SupportChatThreadProps {
  onBack: () => void;
}

export function SupportChatThread({ onBack }: SupportChatThreadProps) {
  const { messages, isLoading, sendMessage, isEscalated, startNewConversation } = useSupportChat();
  const [input, setInput] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">YANGU Support</p>
          <p className="text-[11px] text-muted-foreground">
            {isEscalated ? "Escalated to human agent" : "AI Assistant • 24/7"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowContactForm(true)}
            title="Submit a request">
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={startNewConversation}
            title="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Escalation banner */}
      {isEscalated && (
        <div className="px-4 py-2 bg-accent/10 border-b border-border flex items-center gap-2">
          <Headset className="h-4 w-4 text-accent" />
          <span className="text-xs text-accent font-medium">
            Your case has been escalated to a human agent. They'll respond soon.
          </span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Bot className="h-7 w-7 text-accent" />
            </div>
            <p className="text-sm font-semibold text-foreground">Hi! How can I help?</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Ask me anything about YANGU — accounts, publishing, billing, KYC, surfaces, or technical issues. I'll help directly or connect you with a human agent.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {["How do I publish?", "KYC help", "Billing question", "Talk to a human"].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                {msg.sender_type === "agent" ? (
                  <Headset className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-accent" />
                )}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="bg-muted rounded-xl px-3.5 py-2.5 rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isEscalated ? "Add a message for the agent..." : "Ask YANGU Support..."}
            className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-accent transition-colors"
          />
          <Button
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!input.trim() || isLoading}
            onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SupportContactModal open={showContactForm} onOpenChange={setShowContactForm} />
    </div>
  );
}
