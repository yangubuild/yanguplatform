import { useState } from "react";
import { Sparkles, Wrench } from "lucide-react";
import { Card } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import type { BuilderEngine } from "@/lib/builder/types";
import { BuilderManualWizard } from "./BuilderManualWizard";
import { BuilderAiOnboarding } from "./BuilderAiOnboarding";

interface Props {
  engine: BuilderEngine;
  /** Called with collected answers when wizard/AI completes */
  onComplete: (answers: Record<string, unknown>) => Promise<void>;
}

/**
 * Unified entry screen for ALL builder categories.
 * Shows two paths: "Build with AI" and "Build Manually".
 */
export function BuilderEntryScreen({ engine, onComplete }: Props) {
  const [mode, setMode] = useState<"choice" | "ai" | "manual">("choice");

  if (mode === "manual") {
    return (
      <BuilderManualWizard
        engine={engine}
        onComplete={onComplete}
        onBack={() => setMode("choice")}
      />
    );
  }

  if (mode === "ai") {
    return (
      <BuilderAiOnboarding
        engine={engine}
        onComplete={onComplete}
        onBack={() => setMode("choice")}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{engine.label}</h1>
        <p className="text-muted-foreground mt-1">{engine.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="p-6 space-y-3 border-2 border-primary/30 hover:border-primary/60 transition-colors cursor-pointer"
          onClick={() => setMode("ai")}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Build with AI</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Import from a social profile or let AI help you set up quickly. You'll still edit everything manually after.
          </p>
          <Button size="sm" className="w-full gap-2" onClick={(e) => { e.stopPropagation(); setMode("ai"); }}>
            <Sparkles className="h-4 w-4" /> Start with AI
          </Button>
        </Card>

        <Card
          className="p-6 space-y-3 hover:border-primary/30 transition-colors cursor-pointer"
          onClick={() => setMode("manual")}
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Build Manually</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Answer a few questions step by step and configure everything yourself in the editor.
          </p>
          <Button size="sm" variant="outline" className="w-full gap-2" onClick={(e) => { e.stopPropagation(); setMode("manual"); }}>
            <Wrench className="h-4 w-4" /> Start Wizard
          </Button>
        </Card>
      </div>
    </div>
  );
}
