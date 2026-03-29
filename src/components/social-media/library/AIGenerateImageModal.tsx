import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (url: string, title: string) => Promise<void>;
}

const ASPECT_RATIOS = [
  { label: "Square (1:1)", value: "1:1" },
  { label: "Portrait (4:5)", value: "4:5" },
  { label: "Story (9:16)", value: "9:16" },
  { label: "Landscape (16:9)", value: "16:9" },
];

const MODELS = [
  { label: "Nano Banana", value: "google/gemini-2.5-flash-image", desc: "Fast generation for everyday use" },
  { label: "Nano Banana Pro", value: "google/gemini-3-pro-image-preview", desc: "Higher quality, slower" },
  { label: "Nano Banana 2", value: "google/gemini-3.1-flash-image-preview", desc: "Fast with pro-level quality" },
];

export function AIGenerateImageModal({ open, onOpenChange, onSave }: Props) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(MODELS[0].value);
  const [aspect, setAspect] = useState("1:1");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setPreviewUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("social-ai-generate-image", {
        body: { prompt: prompt.trim(), model, aspect_ratio: aspect },
      });
      if (error) throw error;
      if (data?.image_url) {
        setPreviewUrl(data.image_url);
      } else {
        toast.error(data?.error || "Generation failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Image generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    setSaving(true);
    try {
      await onSave(previewUrl, `AI: ${prompt.slice(0, 60)}`);
      setPrompt("");
      setPreviewUrl(null);
      onOpenChange(false);
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate AI Image</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Preview */}
          <div>
            <p className="text-xs font-medium text-foreground mb-2">Preview</p>
            <div className="aspect-square rounded-xl border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              {generating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-accent animate-spin" />
                  <p className="text-xs text-muted-foreground">Generating...</p>
                </div>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Generated" className="w-full h-full object-cover" />
              ) : (
                <p className="text-xs text-muted-foreground px-4 text-center">Run a prompt to see the preview here</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Describe the image you want to create</p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Subject, style, lighting, setting, colors, composition..."
                rows={4}
                className="w-full text-sm bg-muted/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Aspect Ratio</p>
                <Select value={aspect} onValueChange={setAspect}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">AI Model</p>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {MODELS.find((m) => m.value === model)?.desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {previewUrl ? (
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save to Library
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="gap-2">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Generate
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
