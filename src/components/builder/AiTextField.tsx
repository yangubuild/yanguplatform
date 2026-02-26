import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AiTextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  context?: {
    fieldName?: string;
    sectionType?: string;
    surfaceType?: string;
  };
}

export function AiTextField({ label, value, onChange, multiline = false, placeholder, context }: AiTextFieldProps) {
  const [generating, setGenerating] = useState(false);

  const handleAiGenerate = async () => {
    setGenerating(true);
    try {
      const prompt = `Generate a short, compelling ${context?.fieldName || label.toLowerCase()} for a ${context?.sectionType?.replace(/_/g, " ") || "business"} section on a ${context?.surfaceType?.replace(/_/g, " ") || "website"}. Return ONLY the text, no quotes or explanation. Keep it under 15 words.`;

      const { data, error } = await supabase.functions.invoke("ada-chat", {
        body: {
          messages: [{ role: "user", content: prompt }],
          model: "google/gemini-2.5-flash-lite",
          max_tokens: 60,
        },
      });

      if (error) throw error;
      const text = (data?.reply || data?.content || "").trim();
      if (text) {
        onChange(text);
        toast.success("AI text generated");
      } else {
        toast.error("No text generated");
      }
    } catch (err) {
      console.error("AI generate failed:", err);
      toast.info("AI generation unavailable — type manually");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        {multiline ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="text-sm pr-9"
            placeholder={placeholder}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm pr-9"
            placeholder={placeholder}
          />
        )}
        <button
          type="button"
          onClick={handleAiGenerate}
          disabled={generating}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent/50 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          title="Generate with AI"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
