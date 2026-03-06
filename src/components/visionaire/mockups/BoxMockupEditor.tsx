import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, Download, RotateCcw, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BoxMockup } from "./BoxMockupGallery";

interface BoxMockupEditorProps {
  mockup: BoxMockup;
  onBack: () => void;
}

type GenerationMode = "angles" | "design";

export function BoxMockupEditor({ mockup, onBack }: BoxMockupEditorProps) {
  const [mode, setMode] = useState<GenerationMode>("angles");
  const [designPrompt, setDesignPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt =
        mode === "angles"
          ? `Generate a different camera angle or perspective of this exact same ${mockup.label} product mockup. Keep the same box shape, proportions and style but show it from a new angle. Photorealistic, studio lighting, clean background, commercial product photography.`
          : `Take this ${mockup.label} product mockup and apply this design to it: ${designPrompt.trim()}. Keep the same box shape and perspective. The design should look professionally printed on the packaging. Photorealistic, studio lighting, clean background.`;

      const { data, error } = await supabase.functions.invoke("generate-box-mockup", {
        body: { prompt, referenceImage: mockup.src },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const urls = (data.images || []).map(
        (img: { image_url: { url: string } }) => img.image_url.url
      );
      if (!urls.length) throw new Error("No images generated");
      setGeneratedImages((prev) => [...urls, ...prev]);
      toast.success("Mockup generated!");
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (src: string, index: number) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `${mockup.id}-variation-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{mockup.label} – AI Editor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate new angles or apply custom designs to this mockup
          </p>
        </div>
      </div>

      {/* Source preview + controls */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Source image */}
        <div className="shrink-0">
          <div className="w-full lg:w-64 aspect-square rounded-xl border border-border overflow-hidden bg-muted">
            <img src={mockup.src} alt={mockup.label} className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Source mockup</p>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("angles")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                mode === "angles"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Angles
            </button>
            <button
              onClick={() => setMode("design")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                mode === "design"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              <Paintbrush className="h-3.5 w-3.5" />
              Apply Design
            </button>
          </div>

          {/* Design prompt (only for design mode) */}
          {mode === "design" && (
            <Textarea
              placeholder="e.g. Minimalist luxury skincare brand with gold foil logo and matte black finish..."
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (mode === "design" && !designPrompt.trim())}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {mode === "angles" ? "Generate New Angle" : "Apply Design"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated images */}
      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Generated Variations ({generatedImages.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedImages.map((src, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-border overflow-hidden bg-muted aspect-square"
              >
                <img src={src} alt={`Variation ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="sm" variant="secondary" onClick={() => handleDownload(src, i)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
