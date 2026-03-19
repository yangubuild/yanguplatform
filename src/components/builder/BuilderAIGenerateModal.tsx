import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSectionPalette } from "@/config/builderSectionPalettes";
import { enrichSchemaWithAiImages } from "@/lib/builder/aiImageEnrich";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surfaceType: string;
  onGenerated: (sectionType: string, schema: Record<string, unknown>) => Promise<void>;
}

export function BuilderAIGenerateModal({ open, onOpenChange, surfaceType, onGenerated }: Props) {
  const [sectionType, setSectionType] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const palette = getSectionPalette(surfaceType);

  const handleGenerate = async () => {
    if (!sectionType) {
      toast.error("Please select a section type");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("builder-ai-generate-section", {
        body: { surface_type: surfaceType, section_type: sectionType, prompt },
      });

      if (error) throw new Error(error.message);
      if (!data?.ok) {
        const msg = data?.error === "rate_limited" ? "Rate limited — try again shortly"
          : data?.error === "payment_required" ? "AI credits exhausted"
          : data?.error === "quota_exceeded" ? "Daily AI quota reached — try again tomorrow"
          : data?.error === "unauthorized" ? "Please log in to use AI generation"
          : data?.error || "Generation failed";
        throw new Error(msg);
      }

      await onGenerated(sectionType, data.schema);
      toast.success(`${sectionType} section generated`);
      onOpenChange(false);
      setSectionType("");
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Section Type</Label>
            <Select value={sectionType} onValueChange={setSectionType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a section type" />
              </SelectTrigger>
              <SelectContent>
                {palette.map(({ type, label }) => (
                  <SelectItem key={type} value={type}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Prompt (optional)</Label>
            <Textarea
              placeholder="Describe what you want, e.g. 'A fitness influencer hero section with motivational headline'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              disabled={isGenerating}
            />
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !sectionType} className="w-full gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
