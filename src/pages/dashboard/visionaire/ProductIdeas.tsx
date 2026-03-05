import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, History, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { useToolRuns, useSaveToolRun } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";

const FORMATS = ["ebook", "course", "template", "printable", "membership", "software"] as const;

export default function ProductIdeas() {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [formats, setFormats] = useState<string[]>([]);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("output");

  const { data: history } = useToolRuns("product_ideas");
  const saveRun = useSaveToolRun();

  const toggleFormat = (f: string) => setFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const handleGenerate = async () => {
    if (!niche.trim()) return toast.error("Enter a niche");
    setLoading(true);
    setTab("output");
    try {
      const prompt = `Niche: ${niche}\nTarget Audience: ${audience}\nPreferred Formats: ${formats.join(", ") || "any"}\n\nGenerate 5-8 unique digital product ideas.`;
      const { data, error } = await supabase.functions.invoke("visionaire-llm", {
        body: { toolKey: "product_ideas", prompt },
      });
      if (error) throw error;
      const text = data?.text || "No output.";
      setOutput(text);
      saveRun.mutate({ toolKey: "product_ideas", input: { niche, audience, formats }, output: text });
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <VisionairePageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Product Ideas Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover profitable digital product ideas for any niche</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="space-y-2">
              <Label>Niche / Industry</Label>
              <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Health & Wellness" />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Busy professionals aged 25-40" />
            </div>
            <div className="space-y-2">
              <Label>Preferred Formats</Label>
              <div className="flex gap-2 flex-wrap">
                {FORMATS.map((f) => (
                  <Button key={f} variant={formats.includes(f) ? "secondary" : "outline"} size="sm" onClick={() => toggleFormat(f)} className="capitalize">
                    {f}
                  </Button>
                ))}
              </div>
            </div>
            <Button variant="accent" className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Ideas
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full rounded-none border-b border-border bg-transparent">
                <TabsTrigger value="output" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Output</TabsTrigger>
                <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> History</TabsTrigger>
              </TabsList>
              <TabsContent value="output" className="p-5">
                {output ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground">{output}</div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Output will appear here after generation.</p>
                )}
              </TabsContent>
              <TabsContent value="history" className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
                {history?.length ? (
                  history.map((run) => (
                    <div key={run.id} className="rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50" onClick={() => { setOutput(run.output || ""); setTab("output"); }}>
                      <p className="text-xs font-medium text-foreground truncate">{(run.input as any)?.niche || "Untitled"}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(run.created_at).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No history yet.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </VisionairePageContainer>
  );
}
