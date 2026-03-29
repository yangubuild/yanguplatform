import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAITopicGeneration } from "@/hooks/social/useAITopicGeneration";
import { useSocialTopics } from "@/hooks/social/useSocialTopics";
import { useSocialTopicCategories } from "@/hooks/social/useSocialTopicCategories";
import type { SocialTopicCategory } from "@/types/socialMedia";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: SocialTopicCategory[];
}

export function TopicImportModal({ open, onClose, categories }: Props) {
  const [inputType, setInputType] = useState<"url" | "csv">("url");
  const [url, setUrl] = useState("");
  const [scanMode, setScanMode] = useState<"entire" | "single">("entire");
  const [targetCategory, setTargetCategory] = useState("");
  const { generateTopics, isGenerating } = useAITopicGeneration();
  const { bulkCreate } = useSocialTopics();
  const { createCategory } = useSocialTopicCategories();

  const handleImport = async () => {
    if (inputType === "url" && !url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    const result = await generateTopics({ website: url }, url);
    if (result && result.length > 0) {
      for (const cat of result) {
        let catId = targetCategory;
        if (!catId) {
          try {
            const created = await createCategory({ title: cat.title, color: cat.color });
            catId = created.id;
          } catch {
            continue;
          }
        }
        if (cat.topics?.length > 0) {
          await bulkCreate(cat.topics.map((t) => ({
            title: t.title,
            description: t.description,
            category_id: catId,
            source_type: "imported",
          })));
        }
      }
      toast.success("Topics imported successfully");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Topics</DialogTitle>
          <DialogDescription>Import a batch of topics to your business.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Input Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <Button
                variant={inputType === "url" ? "default" : "outline"}
                className="justify-center"
                onClick={() => setInputType("url")}
              >
                <Link2 className="w-4 h-4 mr-1.5" /> URL
              </Button>
              <Button
                variant={inputType === "csv" ? "default" : "outline"}
                className="justify-center"
                onClick={() => setInputType("csv")}
              >
                <FileText className="w-4 h-4 mr-1.5" /> CSV
              </Button>
            </div>
          </div>

          {inputType === "url" && (
            <>
              <div>
                <Label>Website URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Drop a link to your website, blog post, news article, etc."
                  className="mt-1.5"
                />
              </div>
              <RadioGroup value={scanMode} onValueChange={(v) => setScanMode(v as "entire" | "single")}>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="entire" id="entire" />
                    <label htmlFor="entire" className="text-sm">Scan entire site</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="single" id="single" />
                    <label htmlFor="single" className="text-sm">Scan single page</label>
                  </div>
                </div>
              </RadioGroup>
            </>
          )}

          {inputType === "csv" && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">CSV import coming soon</p>
            </div>
          )}

          <div>
            <Label>Target Category</Label>
            <Select value={targetCategory} onValueChange={setTargetCategory}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select or type to create a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-create categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={isGenerating}>
            {isGenerating ? "Importing..." : "Import Topics"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
