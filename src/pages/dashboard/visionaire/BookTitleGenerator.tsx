import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, History, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToolRuns, useSaveToolRun } from "@/hooks/useVisionaireItems";
import { toast } from "sonner";

export default function BookTitleGenerator() {
  const [description, setDescription] = useState("");
  const [titleLength, setTitleLength] = useState<"short" | "medium" | "long">("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("output");

  const { data: history } = useToolRuns("book_title_generator");
  const saveRun = useSaveToolRun();

  const handleGenerate = async () => {
    if (!description.trim()) return toast.error("Enter a book description");
    setLoading(true);
    setTab("output");
    try {
      const prompt = `Book Description: ${description}\nTitle Length Preference: ${titleLength}\n\nGenerate 8-10 catchy book title options with subtitles.`;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Book Title Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate catchy book titles from your description</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-2">
            <Label>Book Description</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your book is about..."
            />
          </div>
          <div className="space-y-2">
            <Label>Title Length</Label>
            <div className="flex gap-2">
              {(["short", "medium", "long"] as const).map((l) => (
                <Button key={l} variant={titleLength === l ? "secondary" : "outline"} size="sm" onClick={() => setTitleLength(l)} className="capitalize">
                  {l}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="accent" className="w-full" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Titles
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
                    <p className="text-xs font-medium text-foreground truncate">{(run.input as any)?.description?.slice(0, 60) || "Untitled"}</p>
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
  );
}
