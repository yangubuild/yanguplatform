import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionType: string;
  surfaceType: string;
  onGenerated: (schema: Record<string, unknown>) => void;
}

const TONES = ["professional", "casual", "playful", "luxury", "bold"];

export function BuilderAiFillModal({ open, onOpenChange, sectionType, surfaceType, onGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [busy, setBusy] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in first");

      const res = await supabase.functions.invoke("builder-ai-generate-section", {
        body: {
          surface_type: surfaceType,
          section_type: sectionType,
          prompt: `${prompt.trim()}. Tone: ${tone}`,
        },
      });

      if (res.error) throw new Error(res.error.message || "AI generation failed");
      const result = res.data as { ok: boolean; schema?: Record<string, unknown>; error?: string };
      if (!result.ok) throw new Error(result.error || "AI generation failed");
      if (!result.schema) throw new Error("No schema returned");

      onGenerated(result.schema);
      toast.success("AI content applied!");
      onOpenChange(false);
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Fill: {sectionType}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">What should this section say/do?</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A hero section for a fitness coach targeting young professionals..."
              rows={3}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" disabled={busy || !prompt.trim()} onClick={handleGenerate} className="gap-1.5">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
