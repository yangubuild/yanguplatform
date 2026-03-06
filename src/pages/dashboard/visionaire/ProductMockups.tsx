import { useState } from "react";
import { ExternalLink, Sparkles, Loader2, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import gradientsImg from "@/assets/mockups/gradients.png";
import shotsSoImg from "@/assets/mockups/shots-so.jpg";
import boxMockupsImg from "@/assets/mockups/box-mockups.png";

const RESOURCES = [
  {
    id: "gradients",
    title: "Gradients",
    description: "Beautiful gradient backgrounds and patterns",
    image: gradientsImg,
    url: "https://www.entrepedia.co/tools/gradients",
    type: "external" as const,
  },
  {
    id: "shots-so",
    title: "Shots.so",
    description: "Professional screenshot templates",
    image: shotsSoImg,
    url: "https://shots.so",
    type: "external" as const,
  },
  {
    id: "box-mockups",
    title: "Box Mockups",
    description: "3D product box mockup templates",
    image: boxMockupsImg,
    url: "",
    type: "ai" as const,
  },
];

export default function ProductMockups() {
  const [activeView, setActiveView] = useState<"grid" | "box-generator">("grid");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleCardClick = (resource: (typeof RESOURCES)[number]) => {
    if (resource.type === "external") {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    } else {
      setActiveView("box-generator");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe your box mockup");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-box-mockup", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const urls = (data.images || []).map(
        (img: { image_url: { url: string } }) => img.image_url.url
      );
      if (!urls.length) throw new Error("No images generated");
      setGeneratedImages((prev) => [...urls, ...prev]);
      toast.success("Box mockup generated!");
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (dataUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `box-mockup-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (activeView === "box-generator") {
    return (
      <VisionairePageContainer>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveView("grid")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Box Mockup Generator</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Describe your product box and AI will generate a professional mockup
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="max-w-2xl space-y-4">
            <Textarea
              placeholder="e.g. A premium skincare product box with gold accents and minimalist typography on a matte black surface..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Mockup
                </>
              )}
            </Button>
          </div>

          {/* Generated images gallery */}
          {generatedImages.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                Generated Mockups ({generatedImages.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((src, i) => (
                  <div
                    key={i}
                    className="group relative rounded-xl border border-border overflow-hidden bg-muted"
                  >
                    <img
                      src={src}
                      alt={`Box mockup ${i + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(src, i)}
                      >
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
      </VisionairePageContainer>
    );
  }

  return (
    <VisionairePageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Design Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Professional mockups and design tools for your digital products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RESOURCES.map((r) => (
            <button
              key={r.id}
              onClick={() => handleCardClick(r)}
              className="group text-left rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="overflow-hidden">
                <img
                  src={r.image}
                  alt={r.title}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg px-4 py-2 w-full justify-center hover:bg-muted transition-colors">
                    {r.type === "ai" ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Download
                      </>
                    )}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </VisionairePageContainer>
  );
}
