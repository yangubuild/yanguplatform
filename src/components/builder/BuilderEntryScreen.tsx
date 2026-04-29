import { MessageSquare, Mic } from "lucide-react";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import type { BuilderEngine } from "@/lib/builder/types";
import { prewarmRealtimeMicStream } from "./speak-to-build/useRealtimeVoice";

interface Props {
  engine: BuilderEngine;
  /** Called with collected answers when wizard/AI completes */
  onComplete: (answers: Record<string, unknown>) => Promise<unknown>;
  /** Called when user wants to enter the AI chat flow (Build with Chat or "Add info manually") */
  onChatPath?: () => void;
  /** Called when user clicks Build with AI */
  onAiPath?: () => void;
  /** Called when user clicks Speak to Build (voice-first onboarding) */
  onSpeakPath?: () => void;
}

/**
 * Unified entry screen for ALL builder categories.
 * Shows two paths: "Speak to Build" and "Build with Chat".
 */
export function BuilderEntryScreen({ engine, onComplete, onChatPath, onAiPath, onSpeakPath }: Props) {
  const handleChat = () => {
    onChatPath?.();
  };

  const handleSpeak = () => {
    void prewarmRealtimeMicStream().catch((err) => {
      if (import.meta.env.DEV) console.error("[BuilderEntryScreen] mic prewarm failed", err);
    });
    onSpeakPath?.();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{engine.label}</h1>
        <p className="text-muted-foreground mt-1">{engine.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="p-5 sm:p-6 space-y-3 border-2 border-primary/30 hover:border-primary/60 transition-colors cursor-pointer"
          onClick={handleSpeak}>
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Speak to Build</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Voice-first onboarding. Just talk — ADA will build it.
          </p>
          <Button size="sm" className="w-full gap-2" onClick={(e) => { e.stopPropagation(); handleSpeak(); }}>
            <Mic className="h-4 w-4" /> Speak to Build
          </Button>
        </Card>

        <Card
          className="p-5 sm:p-6 space-y-3 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={handleChat}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Build with Chat</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Chat with AI to describe your business, content, design, and style.
          </p>
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={(e) => { e.stopPropagation(); handleChat(); }}>
            <MessageSquare className="h-4 w-4" /> Start Chat
          </Button>
        </Card>
      </div>
    </div>
  );
}
