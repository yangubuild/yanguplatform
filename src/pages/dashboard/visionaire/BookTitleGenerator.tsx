import { useState } from "react";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useToolRuns, useSaveToolRun } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";

const TITLE_LENGTHS = [
  { key: "short", label: "Short (1-3 words)" },
  { key: "medium", label: "Medium (4-6 words)" },
  { key: "long", label: "Long (7+ words)" },
] as const;

const PREVIEW_CARDS = [
  { title: "Digital Transformation Playbook", subtitle: "Rethink Your Business for the Digital Age", emoji: "💻" },
  { title: "Mindful Leadership", subtitle: "Navigating Complexity with Clarity and Purpose", emoji: "🧠" },
  { title: "THE LEAN STARTUP", subtitle: "How Today's Entrepreneurs Use Continuous Innovation to Create Success", emoji: "🚀" },
];

export default function BookTitleGenerator() {
  const [description, setDescription] = useState("");
  const [titleLength, setTitleLength] = useState<"short" | "medium" | "long">("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: history } = useToolRuns("book_title_generator");
  const saveRun = useSaveToolRun();

  const handleGenerate = async () => {
    if (!description.trim()) return toast.error("Describe your book first");
    setLoading(true);
    try {
      const prompt = `Book Description: ${description}\nTitle Length Preference: ${titleLength}\n\nGenerate 8-10 creative and compelling book title options. For each, include a main title and a subtitle. Vary the styles between punchy, descriptive, and intriguing.`;
      const { data, error } = await supabase.functions.invoke("visionaire-llm", {
        body: { toolKey: "book_title_generator", prompt },
      });
      if (error) throw error;
      const text = data?.text || "No output.";
      setOutput(text);
      saveRun.mutate({ toolKey: "book_title_generator", input: { description, titleLength }, output: text });
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisionairePageContainer>
      <div className="space-y-0">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-background py-12 px-6 md:px-12 mb-0">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="flex-1 space-y-4 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                AI-Powered
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Book Title Generator
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-md leading-relaxed">
                Generate creative and compelling book titles and taglines. Describe your book and get professionally crafted titles instantly.
              </p>
            </div>

            {/* Floating preview cards */}
            <div className="relative w-full lg:w-[340px] h-[240px] shrink-0 hidden md:block">
              {PREVIEW_CARDS.map((card, i) => (
                <div
                  key={i}
                  className="absolute rounded-xl border border-border bg-card shadow-lg p-5 w-[230px] text-center"
                  style={{
                    top: i === 0 ? "30px" : i === 1 ? "70px" : "0px",
                    right: i === 0 ? "140px" : i === 1 ? "10px" : "70px",
                    zIndex: i === 2 ? 30 : i === 0 ? 10 : 20,
                    transform: i === 0 ? "rotate(-6deg)" : i === 1 ? "rotate(3deg)" : "rotate(-2deg)" }}>
                  <div className="text-2xl mb-2">{card.emoji}</div>
                  <h3 className="text-sm font-bold text-foreground leading-tight uppercase tracking-wide">{card.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{card.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 py-10 px-2 md:px-6">
          <div className="space-y-8">
            {/* What's your book about? */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">What's your book about?</h2>
              <p className="text-sm text-muted-foreground">Describe your book's content, theme, and target audience</p>
              <div className="relative mt-2">
                <BookOpen className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A self-help guide for entrepreneurs struggling with work-life balance, offering practical strategies to build sustainable businesses while maintaining personal wellbeing..."
                  className="pl-10 min-h-[120px] text-sm border-border"
                  rows={4}
                />
              </div>
            </div>

            {/* Title Length */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground">Title Length</h2>
                <span className="text-xs text-muted-foreground">optional</span>
              </div>
              <p className="text-sm text-muted-foreground">How long should your title be?</p>
              <div className="flex gap-2 flex-wrap mt-2">
                {TITLE_LENGTHS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTitleLength(key)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      titleLength === key
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted/50"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium rounded-xl"
              onClick={handleGenerate}
              disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Titles
            </Button>
          </div>

          {/* Tips */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-foreground">Tips</h3>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>Be specific about your book's core message and unique angle.</p>
              <p>Include your target reader's pain points or desires.</p>
              <p>Experiment with different title lengths for different genres.</p>
            </div>
          </div>
        </div>

        {/* Output */}
        {output && (
          <>
            <div className="border-t border-border" />
            <div className="py-8 px-2 md:px-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Generated Titles</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground rounded-xl border border-border bg-card p-6">
                {output}
              </div>
            </div>
          </>
        )}
      </div>
    </VisionairePageContainer>
  );
}
