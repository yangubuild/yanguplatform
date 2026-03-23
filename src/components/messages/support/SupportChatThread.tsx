import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, ArrowLeft, Headset, Plus, FileText, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupportChat, TicketStatus } from "@/hooks/useSupportChat";
import { SupportContactModal } from "./SupportContactModal";

interface SupportChatThreadProps {
  onBack: () => void;
}

const STATUS_LABELS: Record<TicketStatus, { label: string; className: string }> = {
  pending: { label: "AI Handling", className: "bg-accent/10 text-accent border-accent/20" },
  agent_required: { label: "Agent Requested", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  in_progress: { label: "Agent Active", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  resolved: { label: "Resolved", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

export function SupportChatThread({ onBack }: SupportChatThreadProps) {
  const {
    messages, isLoading, sendMessage, isEscalated, isAgentHandling,
    isResolved, ticketStatus, startNewConversation,
  } = useSupportChat();
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

  const statusConfig = STATUS_LABELS[ticketStatus];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
          {isAgentHandling ? <Headset className="h-5 w-5 text-accent" /> : <Bot className="h-5 w-5 text-accent" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">YANGU Support</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setShowContactForm(true)} title="Submit a request">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={startNewConversation} title="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Escalation banner */}
      {isEscalated && (
        <div className="px-4 py-2 bg-accent/10 border-b border-border flex items-center gap-2">
          <Headset className="h-4 w-4 text-accent" />
          <span className="text-xs text-accent font-medium">
            {ticketStatus === "in_progress"
              ? "A support agent is actively handling your case."
              : "Your case has been escalated. A human agent will respond soon."}
          </span>
        </div>
      )}

      {/* Resolved banner */}
      {isResolved && (
        <div className="px-4 py-2 bg-green-500/10 border-b border-border flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span className="text-xs text-green-400 font-medium">
            This support case has been {ticketStatus === "resolved" ? "resolved" : "closed"}.
          </span>
          <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={startNewConversation}>
            Start new
          </Button>
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
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors text-foreground">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          // System messages (escalation notices)
          if (msg.sender_type === "ai" && msg.content.startsWith("⚡")) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
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
              <div className="max-w-[80%]">
                {/* Sender label */}
                {msg.role === "assistant" && (
                  <span className="text-[10px] text-muted-foreground mb-0.5 block">
                    {msg.sender_type === "agent" ? "Support Agent" : "AI Assistant"}
                  </span>
                )}
                <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground rounded-br-sm"
                    : msg.sender_type === "agent"
                    ? "bg-blue-500/10 text-foreground rounded-bl-sm border border-blue-500/20"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}

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

      {/* Input — disabled for resolved/closed tickets */}
      <div className="p-3 border-t border-border">
        {isResolved ? (
          <p className="text-xs text-center text-muted-foreground py-2">
            This case is {ticketStatus}. <button onClick={startNewConversation} className="text-accent underline">Start a new conversation</button>
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={isAgentHandling ? "Add a message for the agent..." : "Ask YANGU Support..."}
              className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-accent transition-colors"
            />
            <Button size="icon" className="h-10 w-10 shrink-0" disabled={!input.trim() || isLoading} onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <SupportContactModal open={showContactForm} onOpenChange={setShowContactForm} />
    </div>
  );
}
