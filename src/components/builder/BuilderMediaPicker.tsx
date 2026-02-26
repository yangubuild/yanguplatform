import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Link,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Search,
  ExternalLink,
  Expand,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MediaValue {
  type: "none" | "image" | "video";
  source: "url" | "upload" | "stock" | "ai";
  fit?: "contain" | "cover";
  url?: string;
  provider?: "pexels" | "unsplash";
  assetId?: string;
  alt?: string;
}

interface BuilderMediaPickerProps {
  value: MediaValue;
  onChange: (value: MediaValue) => void;
  surfaceId: string;
}

interface StockResult {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  author: string;
  sourceUrl: string;
}

export function BuilderMediaPicker({ value, onChange, surfaceId }: BuilderMediaPickerProps) {
  const mediaType = value.type || "none";

  return (
    <div className="space-y-3">
      {/* Media Type */}
      <div className="space-y-1.5">
        <Label className="text-xs">Media Type</Label>
        <Select
          value={mediaType}
          onValueChange={(v) => onChange({ ...value, type: v as MediaValue["type"] })}
        >
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mediaType !== "none" && (
        <MediaSourceTabs
          mediaType={mediaType as "image" | "video"}
          value={value}
          onChange={onChange}
          surfaceId={surfaceId}
        />
      )}

      {/* Alt text */}
      {mediaType === "image" && value.url && (
        <div className="space-y-1.5">
          <Label className="text-xs">Alt text</Label>
          <Input
            value={value.alt || ""}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Describe the image..."
            className="text-sm"
          />
        </div>
      )}

      {/* Preview */}
      {value.url && mediaType === "image" && (
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="relative group w-full cursor-pointer rounded overflow-hidden border border-border">
              <img
                src={value.url}
                alt={value.alt || "Preview"}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Expand className="h-5 w-5 text-white" />
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-2">
            <img
              src={value.url}
              alt={value.alt || "Full preview"}
              className="w-full max-h-[80vh] object-contain rounded"
            />
            {value.alt && (
              <p className="text-xs text-muted-foreground text-center mt-1">{value.alt}</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MediaSourceTabs({
  mediaType,
  value,
  onChange,
  surfaceId,
}: {
  mediaType: "image" | "video";
  value: MediaValue;
  onChange: (v: MediaValue) => void;
  surfaceId: string;
}) {
  const showAiTab = mediaType === "image";

  return (
    <Tabs defaultValue="url" className="w-full">
      <TabsList className="w-full h-8">
        <TabsTrigger value="url" className="text-xs gap-1 flex-1">
          <Link className="h-3 w-3" /> URL
        </TabsTrigger>
        <TabsTrigger value="upload" className="text-xs gap-1 flex-1">
          <Upload className="h-3 w-3" /> Upload
        </TabsTrigger>
        <TabsTrigger value="stock" className="text-xs gap-1 flex-1">
          <ImageIcon className="h-3 w-3" /> Stock
        </TabsTrigger>
        {showAiTab && (
          <TabsTrigger value="ai" className="text-xs gap-1 flex-1">
            <Sparkles className="h-3 w-3" /> AI
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="url" className="mt-2 space-y-1.5">
        <UrlTab mediaType={mediaType} value={value} onChange={onChange} />
      </TabsContent>
      <TabsContent value="upload" className="mt-2">
        <UploadTab mediaType={mediaType} value={value} onChange={onChange} surfaceId={surfaceId} />
      </TabsContent>
      <TabsContent value="stock" className="mt-2">
        <StockTab mediaType={mediaType} value={value} onChange={onChange} />
      </TabsContent>
      {showAiTab && (
        <TabsContent value="ai" className="mt-2">
          <AiImageTab value={value} onChange={onChange} surfaceId={surfaceId} />
        </TabsContent>
      )}
    </Tabs>
  );
}

/* ─── URL Tab ─── */
function UrlTab({
  mediaType,
  value,
  onChange,
}: {
  mediaType: "image" | "video";
  value: MediaValue;
  onChange: (v: MediaValue) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{mediaType === "image" ? "Image URL" : "Video URL"}</Label>
      <Input
        value={value.url || ""}
        onChange={(e) => onChange({ ...value, source: "url", url: e.target.value })}
        placeholder={mediaType === "image" ? "https://...jpg" : "https://youtube.com/..."}
        className="text-sm"
      />
      <p className="text-[10px] text-muted-foreground">
        {mediaType === "image"
          ? "Paste a direct image URL"
          : "Paste a YouTube URL or direct video URL"}
      </p>
    </div>
  );
}

/* ─── Upload Tab ─── */
function UploadTab({
  mediaType,
  value,
  onChange,
  surfaceId,
}: {
  mediaType: "image" | "video";
  value: MediaValue;
  onChange: (v: MediaValue) => void;
  surfaceId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const accept = mediaType === "image"
    ? "image/png,image/jpeg,image/webp"
    : "video/mp4,video/webm";

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(10);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to upload files");
        return;
      }

      const userId = session.user.id;
      const ext = file.name.split(".").pop() || "bin";
      const ts = Date.now();
      const path = `${userId}/${surfaceId}/${ts}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      setProgress(30);

      const { error: uploadErr } = await supabase.storage
        .from("builder-media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      setProgress(80);

      const { data: publicData } = supabase.storage
        .from("builder-media")
        .getPublicUrl(path);

      setProgress(100);

      onChange({
        ...value,
        source: "upload",
        url: publicData.publicUrl,
        assetId: path,
      });

      toast.success("Uploaded!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [surfaceId, value, onChange]);

  return (
    <div className="space-y-2">
      <Label className="text-xs">Upload {mediaType}</Label>
      <div className="border border-dashed border-border rounded-lg p-4 text-center">
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <label className="cursor-pointer">
              <span className="text-xs text-primary hover:underline">Choose file</span>
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </label>
            <p className="text-[10px] text-muted-foreground mt-1">Max 20MB</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Stock Tab ─── */
function StockTab({
  mediaType,
  value,
  onChange,
}: {
  mediaType: "image" | "video";
  value: MediaValue;
  onChange: (v: MediaValue) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await supabase.functions.invoke("builder-stock-search", {
        body: { query: query.trim(), mediaType },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as { ok: boolean; results?: StockResult[]; error?: string };
      if (!data.ok) throw new Error(data.error || "Search failed");
      setResults(data.results || []);
      if ((data.results || []).length === 0) toast.info("No results found");
    } catch (err) {
      console.error("Stock search error:", err);
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Pexels..."
          className="text-sm flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onChange({
                  ...value,
                  source: "stock",
                  url: r.fullUrl,
                  provider: "pexels",
                  assetId: r.id,
                });
                toast.success(`Photo by ${r.author}`);
              }}
              className="relative group rounded overflow-hidden border border-border hover:ring-2 hover:ring-primary"
            >
              <img src={r.thumbUrl} alt={r.author} className="w-full h-16 object-cover" />
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white truncate px-1">
                {r.author}
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        Photos from <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline">Pexels</a>
        <ExternalLink className="h-2.5 w-2.5" />
      </p>
    </div>
  );
}

/* ─── AI Image Tab ─── */
function AiImageTab({
  value,
  onChange,
  surfaceId,
}: {
  value: MediaValue;
  onChange: (v: MediaValue) => void;
  surfaceId: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate images");
        return;
      }

      // Call the AI image generation via existing ada-generate-image or inline
      const res = await supabase.functions.invoke("ada-generate-image", {
        body: {
          prompt: prompt.trim(),
          model: "google/gemini-2.5-flash-image",
        },
      });

      if (res.error) throw new Error(res.error.message);
      const data = res.data as any;

      // Extract the image URL from response
      let imageUrl: string | null = null;

      if (data?.image_url) {
        imageUrl = data.image_url;
      } else if (data?.url) {
        imageUrl = data.url;
      } else if (data?.images?.[0]?.url) {
        imageUrl = data.images[0].url;
      } else if (data?.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
        // base64 image - upload to storage
        const base64Url = data.choices[0].message.images[0].image_url.url;
        const base64Data = base64Url.split(",")[1];
        if (base64Data) {
          const binaryStr = atob(base64Data);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          const blob = new Blob([bytes], { type: "image/png" });

          const userId = session.user.id;
          const path = `${userId}/${surfaceId}/${Date.now()}-ai-generated.png`;
          const { error: uploadErr } = await supabase.storage
            .from("builder-media")
            .upload(path, blob, { contentType: "image/png" });
          if (uploadErr) throw uploadErr;

          const { data: publicData } = supabase.storage
            .from("builder-media")
            .getPublicUrl(path);
          imageUrl = publicData.publicUrl;
        }
      }

      if (!imageUrl) {
        console.error("AI image response:", data);
        throw new Error("Could not extract image from response");
      }

      onChange({
        ...value,
        source: "ai",
        url: imageUrl,
        assetId: undefined,
      });
      toast.success("AI image generated!");
    } catch (err) {
      console.error("AI image error:", err);
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Describe the image</Label>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="A modern hero banner for a fitness brand..."
        rows={2}
        className="text-sm"
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
      >
        {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Generate Image
      </Button>
    </div>
  );
}
