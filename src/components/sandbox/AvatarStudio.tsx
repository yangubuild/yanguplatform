import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Sparkles, Check, ImageOff, Download, RefreshCw } from "lucide-react";
import { toPng } from "html-to-image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const DID_USED_KEY = "yangu:sandbox:did-used";

type StockAvatar = {
  id: string;
  name: string;
  preview_url: string;
  gender?: string | null;
};

type Selected =
  | { kind: "photo"; imageDataUrl: string; videoUrl?: string }
  | { kind: "stock"; avatar: StockAvatar }
  | null;

function NotSavedBadge() {
  return (
    <Badge className="bg-amber-500/15 text-amber-200 border border-amber-500/30 hover:bg-amber-500/15 text-[10px]">
      Not saved
    </Badge>
  );
}

function PhotoTab({ onResult, name }: { onResult: (s: Selected) => void; name: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedUp, setUsedUp] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DID_USED_KEY) === "1"; } catch { return false; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!/^image\/(png|jpe?g)$/i.test(f.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller");
      return;
    }
    setFile(f);
    setVideoUrl(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const generate = async () => {
    if (!preview) return;
    if (usedUp) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("sandbox-avatar", {
        body: { action: "did-talk", image_base64: preview, name },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Generation failed");
      setVideoUrl(data.video_url || null);
      onResult({ kind: "photo", imageDataUrl: preview, videoUrl: data.video_url || undefined });
      try { sessionStorage.setItem(DID_USED_KEY, "1"); } catch {}
      setUsedUp(true);
      if (data.video_url) {
        toast.success("Avatar preview ready");
      } else if (data.fallback) {
        toast.message(data.notice || "Talking preview unavailable — using your photo.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not generate avatar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0] || null);
        }}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer p-6 min-h-[260px] flex flex-col items-center justify-center text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {preview ? (
          <img src={preview} alt="Uploaded preview" className="max-h-48 rounded-lg object-cover" />
        ) : (
          <>
            <Upload className="w-7 h-7 text-muted-foreground mb-2" />
            <p className="text-sm text-foreground">Drop a photo or click to upload</p>
            <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</p>
          </>
        )}
        {file && (
          <p className="text-[11px] text-muted-foreground mt-3 truncate max-w-full">{file.name}</p>
        )}
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-foreground">Talking preview</div>
          <NotSavedBadge />
        </div>
        <div className="flex-1 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden min-h-[160px]">
          {videoUrl ? (
            <video src={videoUrl} controls autoPlay className="w-full h-full max-h-60 object-contain" />
          ) : loading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating (~20s)…
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center px-4">
              Upload a photo, then generate a short greeting video.
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="accent"
            disabled={!preview || loading || usedUp}
            onClick={generate}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate preview
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Preview only — save to your account to use in videos.
          </p>
        </div>
        {usedUp && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-amber-100">
              You've used your free preview. Sign up to generate unlimited avatars.
            </p>
            <Button asChild size="sm" variant="accent">
              <Link to="/auth/signup">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StockTab({ onResult }: { onResult: (s: Selected) => void }) {
  const [avatars, setAvatars] = useState<StockAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("sandbox-avatar", {
        body: { action: "creatify-avatars" },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Could not load avatars");
      setAvatars(data.avatars || []);
    } catch (e: any) {
      setError(e?.message || "Could not load avatars");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = avatars.find((a) => a.id === selectedId) || null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Pick an avatar to use as your face. This avatar will be available in your Studio once you sign up.
        </p>
        <Button size="sm" variant="ghost" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>
      {loading ? (
        <div className="h-40 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-center text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading avatars…
        </div>
      ) : error ? (
        <div className="h-40 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-center text-xs text-amber-300 text-center px-4">
          {error}
        </div>
      ) : avatars.length === 0 ? (
        <div className="h-40 rounded-lg bg-white/[0.02] border border-white/10 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <ImageOff className="w-4 h-4" /> No avatars available right now.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {avatars.map((a) => {
            const active = a.id === selectedId;
            return (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedId(a.id);
                  onResult({ kind: "stock", avatar: a });
                }}
                className={`relative rounded-lg overflow-hidden border transition group ${
                  active
                    ? "border-[#F4A83D] ring-2 ring-[#F4A83D]/40"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <img
                  src={a.preview_url}
                  alt={a.name}
                  loading="lazy"
                  className="w-full aspect-[3/4] object-cover bg-black/30"
                />
                {active && (
                  <div className="absolute top-1 right-1 bg-[#F4A83D] text-black rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[10px] text-white truncate text-left">
                  {a.name}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {selected && (
        <div className="flex items-center gap-2 text-xs text-foreground">
          <Check className="w-3.5 h-3.5 text-[#F4A83D]" />
          Using <span className="font-medium">{selected.name}</span>
          <NotSavedBadge />
        </div>
      )}
    </div>
  );
}

function BrandCard({
  selected,
  brand,
  tagline,
}: {
  selected: Selected;
  brand: string;
  tagline: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const avatarSrc =
    selected?.kind === "photo"
      ? selected.imageDataUrl
      : selected?.kind === "stock"
      ? selected.avatar.preview_url
      : null;

  const download = async () => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0A1410",
      });
      const link = document.createElement("a");
      link.download = `${(brand || "yangu-brand").toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e: any) {
      toast.error("Could not download card. Try a stock avatar instead.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      ref={ref}
      className="relative rounded-2xl overflow-hidden p-6 flex items-center gap-5"
      style={{
        background:
          "linear-gradient(135deg, #152A20 0%, #0A1410 60%, #1F0F08 100%)",
        border: "1px solid rgba(244,168,61,0.18)",
      }}
    >
      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
        {avatarSrc ? (
          <img src={avatarSrc} alt="Avatar" crossOrigin="anonymous" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No avatar
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-amber-300/70 mb-1">
          Built with yangu
        </div>
        <div className="text-2xl font-semibold text-white truncate">
          {brand || "Your brand name"}
        </div>
        <div className="text-sm text-white/70 mt-1 line-clamp-2">
          {tagline || "A one-line tagline that says what you do."}
        </div>
      </div>
      <div className="absolute top-3 right-3">
        <NotSavedBadge />
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={download}
        disabled={downloading}
        className="absolute bottom-3 right-3 text-white/70 hover:text-white"
      >
        {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        PNG
      </Button>
    </div>
  );
}

export function AvatarStudio() {
  const [selected, setSelected] = useState<Selected>(null);
  const [brand, setBrand] = useState("");
  const [tagline, setTagline] = useState("");
  const firstName = brand.split(/\s+/)[0] || "there";

  return (
    <section
      id="avatar-studio"
      className="rounded-lg border border-white/10 overflow-hidden scroll-mt-24"
      style={{ background: "#070D0A" }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Avatar Studio — Test Mode</span>
          <NotSavedBadge />
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">Nothing here is saved</span>
      </div>
      <div className="p-4 flex flex-col gap-5">
        <Tabs defaultValue="photo" className="w-full">
          <TabsList className="bg-white/[0.04] border border-white/10">
            <TabsTrigger value="photo">Use my photo</TabsTrigger>
            <TabsTrigger value="stock">Pick an avatar</TabsTrigger>
          </TabsList>
          <TabsContent value="photo" className="mt-4">
            <PhotoTab onResult={setSelected} name={firstName} />
          </TabsContent>
          <TabsContent value="stock" className="mt-4">
            <StockTab onResult={setSelected} />
          </TabsContent>
        </Tabs>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground">Brand name</label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value.slice(0, 40))}
              placeholder="e.g. Mara Coffee"
              className="bg-white/[0.03] border-white/10"
            />
            <label className="text-xs text-muted-foreground mt-2">Tagline</label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value.slice(0, 80))}
              placeholder="One line that says what you do"
              className="bg-white/[0.03] border-white/10"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              This is your takeaway — a brand card you can download even without an account.
            </p>
          </div>
          <BrandCard selected={selected} brand={brand} tagline={tagline} />
        </div>
      </div>
    </section>
  );
}