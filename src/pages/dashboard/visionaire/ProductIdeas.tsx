import { useState } from "react";
import { Users, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useToolRuns, useSaveToolRun } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";

const FORMATS = ["E-book", "Course", "Template", "Software", "Membership", "Coaching"] as const;

const PREVIEW_CARDS = [
  { emoji: "📊", title: "Crypto Portfolio Simulator", desc: "An interactive tool that lets investors test trading strategies with historical crypto data without risking real money.", tags: ["Software", "Finance", "Web3"] },
  { emoji: "🎭", title: "Immersive Storytelling Masterclass", desc: "Learn to create captivating narratives across multiple platforms using cutting-edge AR and VR techniques.", tags: ["Course", "Creative", "Technology"] },
  { emoji: "🌱", title: "Vertical Farming Blueprint", desc: "A comprehensive guide to building and maintaining profitable vertical farms in...", tags: ["Course", "Eco-friendly", "Innovation"] },
];

export default function ProductIdeas() {
  const [audience, setAudience] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: history } = useToolRuns("product_ideas");
  const saveRun = useSaveToolRun();

  const toggleFormat = (f: string) =>
    setSelectedFormats((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const handleGenerate = async () => {
    if (!audience.trim()) return toast.error("Describe your ideal customer");
    setLoading(true);
    try {
      const prompt = `Target Audience: ${audience}\nTopic: ${topic || "any"}\nPreferred Formats: ${selectedFormats.join(", ") || "any"}\n\nGenerate 5-8 unique, creative digital product ideas. For each idea include: a title, a short description, the format type, and 2-3 relevant tags.`;
      const { data, error } = await supabase.functions.invoke("visionaire-llm", {
        body: { toolKey: "product_ideas", prompt },
      });
      if (error) throw error;
      const text = data?.text || "No output.";
      setOutput(text);
      saveRun.mutate({
        toolKey: "product_ideas",
        input: { audience, topic, formats: selectedFormats },
        output: text,
      });
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
            {/* Left: text */}
            <div className="flex-1 space-y-4 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                AI-Powered
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
                Digital Product Ideator
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-md leading-relaxed">
                Transform your knowledge into profitable digital products. Get personalized ideas tailored to your audience and expertise.
              </p>
            </div>

            {/* Right: floating cards */}
            <div className="relative w-full lg:w-[340px] h-[220px] shrink-0 hidden md:block">
              {PREVIEW_CARDS.map((card, i) => (
                <div
                  key={i}
                  className="absolute rounded-xl border border-border bg-card shadow-lg p-4 w-[240px]"
                  style={{
                    top: i === 0 ? "20px" : i === 1 ? "60px" : "10px",
                    right: i === 0 ? "120px" : i === 1 ? "20px" : "60px",
                    zIndex: i === 2 ? 30 : i === 0 ? 10 : 20,
                    transform: i === 0 ? "rotate(-4deg)" : i === 1 ? "rotate(2deg)" : "rotate(-1deg)" }}
                >
                  <div className="text-2xl mb-2">{card.emoji}</div>
                  <h3 className="text-sm font-semibold text-foreground leading-tight">{card.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.desc}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {card.tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 py-10 px-2 md:px-6">
          {/* Left: form */}
          <div className="space-y-8">
            {/* Who is this for? */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Who is this for?</h2>
              <p className="text-sm text-muted-foreground">Describe your ideal customer</p>
              <div className="relative mt-2">
                <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Busy moms, Real estate agents, Freelance designers..."
                  className="pl-10 h-12 text-sm border-border"
                />
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground">Topic</h2>
                <span className="text-xs text-muted-foreground">optional</span>
              </div>
              <p className="text-sm text-muted-foreground">Subject matter or problem to solve</p>
              <div className="relative mt-2">
                <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Time management, SEO, Personal finance..."
                  className="pl-10 h-12 text-sm border-border"
                />
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground">Format</h2>
                <span className="text-xs text-muted-foreground">optional</span>
              </div>
              <p className="text-sm text-muted-foreground">What do you want to build?</p>
              <div className="flex gap-2 flex-wrap mt-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFormat(f)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedFormats.includes(f)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted/50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium rounded-xl"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Ideas
            </Button>
          </div>

          {/* Right: Tips */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-bold text-foreground">Tips</h3>
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                Be specific. "Busy moms starting a side hustle" beats "Moms".
              </p>
              <p>
                Combine topics for unique angles. Gardening + Small spaces.
              </p>
              <p>
                Try different formats to see what resonates.
              </p>
            </div>
          </div>
        </div>

        {/* Output Section */}
        {output && (
          <>
            <div className="border-t border-border" />
            <div className="py-8 px-2 md:px-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Generated Ideas</h2>
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
