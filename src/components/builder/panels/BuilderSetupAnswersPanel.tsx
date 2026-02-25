/**
 * Setup / Answers panel — shows saved AI answers in the editor
 * so users can review and modify their onboarding data.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  answers: Record<string, unknown>;
  source?: string;
  onClose: () => void;
  onUpdate: (answers: Record<string, unknown>) => void;
}

export function BuilderSetupAnswersPanel({ answers, source, onClose, onUpdate }: Props) {
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(answers).filter(([, v]) => typeof v === "string" || typeof v === "number")
        .map(([k, v]) => [k, String(v)])
    )
  );
  const [dirty, setDirty] = useState(false);

  const handleChange = (key: string, value: string) => {
    setEditedAnswers(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    onUpdate(editedAnswers);
    setDirty(false);
  };

  const displayKey = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const filteredEntries = Object.entries(editedAnswers).filter(
    ([k]) => !k.startsWith("_") && !k.startsWith("ai_")
  );

  return (
    <aside className="w-80 border-l border-border bg-sidebar flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Setup Answers</h3>
          {source && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Source: {source}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredEntries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No setup answers saved yet.</p>
        ) : (
          filteredEntries.map(([key, value]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{displayKey(key)}</Label>
              {value.length > 80 ? (
                <Textarea
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              ) : (
                <Input
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="text-sm"
                />
              )}
            </div>
          ))
        )}
      </div>

      {dirty && (
        <div className="p-4 border-t border-border">
          <Button onClick={handleSave} size="sm" className="w-full gap-2">
            <Save className="h-3.5 w-3.5" /> Update Content
          </Button>
        </div>
      )}
    </aside>
  );
}
