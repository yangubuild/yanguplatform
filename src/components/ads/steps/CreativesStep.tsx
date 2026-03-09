import { useState, useRef, useEffect } from "react";
import { Upload, Plus, Video, Image, Monitor, Search, Tv, X, ZoomIn, Grid2x2, Film, MessageSquare, Store, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import yanguYGreen from "@/assets/yangu-y-loader.png";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignData, CreativeItem, SearchAdEntry } from "../CampaignWizard";

interface CreativesStepProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
}

const REACH_STATS = [
  { icon: Film, label: "Vertical video", reach: "+100M", color: "" },
  { icon: MessageSquare, label: "Display ads", reach: "+100M", color: "" },
  { icon: Film, label: "Horizontal video", reach: "+50M", color: "" },
  { icon: Monitor, label: "Physical display", reach: "+10M", color: "" },
  { icon: Search, label: "Search ads", reach: "5M", color: "" },
];

const CROP_RATIOS = [
  { label: "Portrait (4:5)", size: "1080×1350", ratio: 4 / 5 },
  { label: "Square (1:1)", size: "1080×1080", ratio: 1 },
  { label: "Portrait (9:16)", size: "1080×1920", ratio: 9 / 16 },
];

const AI_CAPTIONS = [
  "👉 Tired of wondering what to cook every night?\n\nMeal planning can feel overwhelming, especially when you are juggling a busy schedule and trying to save money.\n\n✅ Enjoy delicious, ready-to-cook meals that save you time.\n✅ Slash your grocery bills in half while still eating healthy.\n✅ Explore a variety of cuisines to keep your taste buds excited.\n\nClick the link and join my Whop community 👇",
  "👉 Are you fed up with grocery store chaos and waste?\n\nIf you find yourself tossing out expired food and overspending each week, it is time for a change.\n\n✅ Get perfectly portioned ingredients sent right to your door.\n✅ Say goodbye to food waste and hello to fresh meals every day.\n✅ Save hours of meal prep with easy step-by-step recipes.",
  "👉 Ready to transform how you eat and save?\n\nStop overspending on food you never eat. Join thousands who've already simplified their kitchen routine.\n\n✅ Budget-friendly meal plans curated weekly.\n✅ Fresh ingredients delivered to your doorstep.\n✅ Beginner-friendly recipes anyone can follow.\n\nStart your journey today 🚀",
];

type ModalState =
  | { type: "none" }
  | { type: "bulk-upload" }
  | { type: "upload-video" }
  | { type: "upload-image" }
  | { type: "crop"; src: string; fileType: "image" | "video" }
  | { type: "confirm-creative"; item: CreativeItem }
  | { type: "preview"; item: CreativeItem }
  | { type: "search-ads" }
  | { type: "search-ads-form"; surface: { id: string; title: string; slug: string; coverImage?: string } };

export function CreativesStep({ data, onChange }: CreativesStepProps) {
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [selectedRatio, setSelectedRatio] = useState(0);
  const [zoom, setZoom] = useState([1]);
  const [caption, setCaption] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCaptions, setAiCaptions] = useState<string[]>([]);
  const [selectedCaptionIdx, setSelectedCaptionIdx] = useState<number | null>(null);
  const [writeOwn, setWriteOwn] = useState(false);
  const [publishedSurfaces, setPublishedSurfaces] = useState<Array<{ id: string; title: string; slug: string; coverImage?: string }>>([]);
  const [surfacesLoading, setSurfacesLoading] = useState(false);
  const [searchAdForm, setSearchAdForm] = useState({ productType: "", category: "", description: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Find which format categories have creatives
  const videoCreatives = data.creatives.filter((c) => c.type === "video");
  const imageCreatives = data.creatives.filter((c) => c.type === "image");

  // Calculate reach dynamically
  const MAX_REACH = 265;
  let activeReach = 0;
  if (videoCreatives.length > 0) activeReach += 100;
  if (imageCreatives.length > 0) activeReach += 100;
  if (data.searchAd) activeReach += 5;
  const reachPercent = MAX_REACH > 0 ? (activeReach / MAX_REACH) * 100 : 0;
  const totalReach = activeReach > 0 ? `${activeReach}M` : "0";
  const hasCreatives = data.creatives.length > 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    setModal({ type: "crop", src: url, fileType: isVideo ? "video" : "image" });
    e.target.value = "";
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newCreatives: CreativeItem[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video");
      newCreatives.push({
        id: crypto.randomUUID(),
        type: isVideo ? "video" : "image",
        src: url,
        caption: "",
      });
    });
    onChange({ ...data, creatives: [...data.creatives, ...newCreatives] });
    setModal({ type: "none" });
    e.target.value = "";
  };

  const handleCropSave = async () => {
    if (modal.type !== "crop") return;
    const item: CreativeItem = {
      id: crypto.randomUUID(),
      type: modal.fileType,
      src: modal.src,
      caption: "",
      cropRatio: CROP_RATIOS[selectedRatio].label,
    };
    setCaption("");
    setWriteOwn(false);
    setSelectedCaptionIdx(null);
    setAiCaptions([]);
    setAiLoading(true);
    setModal({ type: "confirm-creative", item });

    // Convert image blob URL to data URL for AI vision analysis
    let imageDataUrl: string | undefined;
    try {
      const resp = await fetch(modal.src);
      const blob = await resp.blob();
      imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      // If conversion fails, proceed without image
    }

    // Call AI caption generation edge function
    try {
      const { data: aiData, error } = await supabase.functions.invoke("ad-caption-generate", {
        body: {
          image_data_url: imageDataUrl,
          campaign_name: data.name,
          product_name: data.selectedProduct || data.name,
          location: data.location || "Global",
          media_type: modal.fileType,
        },
      });

      if (error) throw error;

      if (aiData?.captions && Array.isArray(aiData.captions) && aiData.captions.length > 0) {
        setAiCaptions(aiData.captions);
        setSelectedCaptionIdx(0);
      } else {
        setAiCaptions(AI_CAPTIONS);
        setSelectedCaptionIdx(0);
      }
    } catch (err) {
      console.error("AI caption generation failed:", err);
      // Fallback to static captions
      setAiCaptions(AI_CAPTIONS);
      setSelectedCaptionIdx(0);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmSave = () => {
    if (modal.type !== "confirm-creative") return;
    let finalCaption = "";
    if (writeOwn) {
      finalCaption = caption;
    } else if (selectedCaptionIdx !== null && aiCaptions[selectedCaptionIdx]) {
      finalCaption = aiCaptions[selectedCaptionIdx];
    }
    const updated = { ...modal.item, caption: finalCaption };
    onChange({ ...data, creatives: [...data.creatives, updated] });
    setModal({ type: "none" });
  };

  const removeCreative = (id: string) => {
    onChange({ ...data, creatives: data.creatives.filter((c) => c.id !== id) });
  };

  const fetchPublishedSurfaces = async () => {
    setSurfacesLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;
      const { data: surfaces } = await supabase
        .from("builder_publishes")
        .select("id, slug, surface_id, published_schema, builder_surfaces!inner(title, metadata, user_id)")
        .eq("state", "published")
        .eq("builder_surfaces.user_id", user.user.id);
      if (surfaces) {
        setPublishedSurfaces(
          surfaces.map((s: any) => ({
            id: s.surface_id,
            title: s.builder_surfaces?.title || s.slug,
            slug: s.slug,
            coverImage: (s.builder_surfaces?.metadata as any)?.coverImage,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch surfaces:", err);
    } finally {
      setSurfacesLoading(false);
    }
  };

  const handleSearchAdSave = () => {
    if (modal.type !== "search-ads-form") return;
    const entry: SearchAdEntry = {
      surfaceId: modal.surface.id,
      surfaceTitle: modal.surface.title,
      surfaceSlug: modal.surface.slug,
      coverImage: modal.surface.coverImage,
      productType: searchAdForm.productType,
      category: searchAdForm.category,
      description: searchAdForm.description,
    };
    onChange({ ...data, searchAd: entry });
    setModal({ type: "none" });
    setSearchAdForm({ productType: "", category: "", description: "" });
  };

  const removeSearchAd = () => {
    onChange({ ...data, searchAd: null });
  };

  // Determine highlighted reach stats based on creatives
  const getReachHighlight = (label: string) => {
    if (label === "Display ads" && imageCreatives.length > 0) return true;
    if (label === "Vertical video" && videoCreatives.length > 0) return true;
    if (label === "Search ads" && data.searchAd) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top section: Circle graph left + reach stats right */}
      <div className="flex gap-10 items-center">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-40 h-40">
            <div
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{ background: "#d4a843", top: "2px", left: "50%", transform: "translateX(-50%)" }}
            />
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={hasCreatives ? "#b5622a" : "rgba(255,255,255,0.15)"}
                strokeWidth="6"
                strokeDasharray={`${reachPercent * 3.27} ${327 - reachPercent * 3.27}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{totalReach === "0" ? "0" : totalReach}</span>
              <span className="text-xs text-white/40">/ 265M</span>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {REACH_STATS.map((stat) => {
            const highlighted = getReachHighlight(stat.label);
            return (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <stat.icon className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white/70">{stat.label}</span>
                </div>
                <span className={`text-sm ${highlighted ? "text-green-400 font-medium" : "text-white/50"}`}>
                  {stat.reach}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Upload bar */}
      <div
        onClick={() => setModal({ type: "bulk-upload" })}
        className="flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-colors"
        style={{ background: "rgba(30, 64, 120, 0.5)", border: "1px solid rgba(60, 100, 170, 0.3)" }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(50, 90, 160, 0.6)" }}>
          <Grid2x2 className="w-5 h-5 text-white/80" />
        </div>
        <div>
          <span className="text-sm font-medium text-white">Bulk upload</span>
          <p className="text-xs text-white/40">Upload multiple files at once</p>
        </div>
      </div>

      {/* Vertical video bar */}
      <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(200, 140, 50, 0.2)" }}>
              <Film className="w-5 h-5" style={{ color: "#d4a843" }} />
            </div>
            <div>
              <span className="text-sm font-medium text-white">Vertical video</span>
              <p className="text-xs text-white/40">Short-form video ads optimized for mobile discovery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-lg ${videoCreatives.length > 0 ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-white/40"}`} style={videoCreatives.length === 0 ? { background: "rgba(255,255,255,0.06)" } : {}}>
              +100M reach/mo
            </span>
            <Button variant="accent" className="rounded-xl px-4 h-8 text-xs" onClick={() => setModal({ type: "upload-video" })}>
              Add creative set
            </Button>
          </div>
        </div>
        {videoCreatives.length > 0 && (
          <div className="px-5 pb-4 flex items-center gap-3">
            {videoCreatives.map((c) => (
              <div key={c.id} className="relative w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden group">
                <Video className="w-6 h-6 text-white/40" />
                <button onClick={() => removeCreative(c.id)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <div
              onClick={() => setModal({ type: "upload-video" })}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer hover:border-white/25 transition-colors"
            >
              <Plus className="w-4 h-4 text-white/30" />
              <span className="text-[8px] text-white/30 mt-0.5 text-center leading-tight">Upload another set</span>
            </div>
          </div>
        )}
      </div>

      {/* Display ads bar */}
      <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(120, 80, 180, 0.2)" }}>
              <MessageSquare className="w-5 h-5" style={{ color: "#9b7abf" }} />
            </div>
            <div>
              <span className="text-sm font-medium text-white">Display ads</span>
              <p className="text-xs text-white/40">Clickable display banners across high-traffic web placements</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-lg ${imageCreatives.length > 0 ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-white/40"}`} style={imageCreatives.length === 0 ? { background: "rgba(255,255,255,0.06)" } : {}}>
              +100M reach/mo
            </span>
            <Button variant="accent" className="rounded-xl px-4 h-8 text-xs" onClick={() => setModal({ type: "upload-image" })}>
              Add creative set
            </Button>
          </div>
        </div>
        {imageCreatives.length > 0 && (
          <div className="px-5 pb-4 flex items-center gap-3">
            {imageCreatives.map((c) => (
              <div key={c.id} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                <img src={c.src} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeCreative(c.id)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <div
              onClick={() => setModal({ type: "upload-image" })}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-white/15 flex flex-col items-center justify-center cursor-pointer hover:border-white/25 transition-colors"
            >
              <Plus className="w-4 h-4 text-white/30" />
              <span className="text-[8px] text-white/30 mt-0.5 text-center leading-tight">Upload another set</span>
            </div>
          </div>
        )}
      </div>

      {/* Search ads bar - active */}
      <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <Search className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <span className="text-sm font-medium text-white">Search ads</span>
              <p className="text-xs text-white/40">Appears in YANGU Explore search results based on keywords</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1.5 rounded-lg ${data.searchAd ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-white/40"}`} style={!data.searchAd ? { background: "rgba(255,255,255,0.06)" } : {}}>
              5M reach/mo
            </span>
            <Button
              variant="accent"
              className="rounded-xl px-4 h-8 text-xs"
              onClick={() => { fetchPublishedSurfaces(); setModal({ type: "search-ads" }); }}
            >
              Add your business
            </Button>
          </div>
        </div>
        {data.searchAd && (
          <div className="px-5 pb-4 flex items-center gap-3">
            <div className="relative flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-1">
              {data.searchAd.coverImage && (
                <img src={data.searchAd.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
              )}
              {!data.searchAd.coverImage && (
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{data.searchAd.surfaceTitle}</p>
                <p className="text-xs text-white/40">{data.searchAd.category} · {data.searchAd.productType}</p>
              </div>
              <button onClick={removeSearchAd} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
      <input ref={bulkFileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleBulkFileSelect} />

      {/* ─── MODALS ─── */}

      {/* Bulk upload modal */}
      {modal.type === "bulk-upload" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl w-full max-w-xl" style={{ background: "#1a1a1a" }}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Bulk upload creatives</h3>
              <button onClick={() => setModal({ type: "none" })} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div onClick={() => bulkFileRef.current?.click()} className="border-2 border-dashed border-white/15 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-white/25 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Film className="w-5 h-5 text-white/50" /></div>
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Image className="w-5 h-5 text-white/50" /></div>
                </div>
                <span className="text-sm text-white/60">Drop files or click to select</span>
                <span className="text-xs text-white/30 mt-1">Videos (MP4, MOV) and images (PNG, JPG, GIF)</span>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <Button variant="outline" onClick={() => setModal({ type: "none" })} className="flex-1 rounded-xl border-white/10 text-white/60">Cancel</Button>
              <Button variant="secondary" className="flex-1 rounded-xl opacity-50 cursor-not-allowed" disabled>Upload 0 files</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Upload video modal */}
      {modal.type === "upload-video" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl w-full max-w-md" style={{ background: "#1a1a1a" }}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Upload video</h3>
              <button onClick={() => setModal({ type: "none" })} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 text-sm text-white/70">Upload from my computer<span className="text-white/40">∧</span></button>
              <div onClick={() => { if (fileRef.current) { fileRef.current.accept = "video/*"; fileRef.current.click(); } }} className="border-2 border-dashed border-white/15 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-white/25 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4"><Film className="w-5 h-5 text-white/50" /></div>
                <span className="text-sm text-white/60">Choose a file or drag and drop here</span>
                <span className="text-xs text-white/30 mt-1">.MP4 and .MOV formats</span>
              </div>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 text-sm text-white/50">Choose from my creatives library instead<span className="text-white/40">∨</span></button>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <Button variant="outline" onClick={() => setModal({ type: "none" })} className="flex-1 rounded-xl border-white/10 text-white/60">Cancel</Button>
              <Button variant="secondary" className="flex-1 rounded-xl opacity-50 cursor-not-allowed" disabled>Continue</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Upload image modal */}
      {modal.type === "upload-image" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl w-full max-w-md" style={{ background: "#1a1a1a" }}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Upload image</h3>
              <button onClick={() => setModal({ type: "none" })} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 text-sm text-white/70">Upload from my computer<span className="text-white/40">∧</span></button>
              <div onClick={() => { if (fileRef.current) { fileRef.current.accept = "image/*"; fileRef.current.click(); } }} className="border-2 border-dashed border-white/15 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-white/25 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4"><Image className="w-5 h-5 text-white/50" /></div>
                <span className="text-sm text-white/60">Choose a file or drag and drop here</span>
                <span className="text-xs text-white/30 mt-1">.PNG and .JPG formats up to 25MB</span>
              </div>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 text-sm text-white/50">Choose from my creatives library instead<span className="text-white/40">∨</span></button>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <Button variant="outline" onClick={() => setModal({ type: "none" })} className="flex-1 rounded-xl border-white/10 text-white/60">Cancel</Button>
              <Button variant="secondary" className="flex-1 rounded-xl opacity-50 cursor-not-allowed" disabled>Continue</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Crop modal */}
      {modal.type === "crop" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl p-6 w-full max-w-lg space-y-5" style={{ background: "#1a1a1a" }}>
            <h3 className="text-lg font-semibold text-white">Crop media</h3>
            <div className="rounded-xl overflow-hidden flex items-center justify-center h-64" style={{ background: "#111111" }}>
              {modal.fileType === "image" ? (
                <img src={modal.src} alt="crop preview" className="max-h-full max-w-full object-contain" style={{ transform: `scale(${zoom[0]})` }} />
              ) : (
                <video src={modal.src} className="max-h-full max-w-full" style={{ transform: `scale(${zoom[0]})` }} />
              )}
            </div>
            <div className="flex gap-2">
              {CROP_RATIOS.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setSelectedRatio(i)}
                  className="flex-1 p-3 rounded-xl text-center text-xs transition-colors"
                  style={{
                    background: selectedRatio === i ? "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" : "rgba(255,255,255,0.04)",
                    color: selectedRatio === i ? "#fff" : "rgba(255,255,255,0.5)",
                    border: selectedRatio === i ? "none" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="font-medium">{r.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-60">{r.size}</div>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <ZoomIn className="w-4 h-4 text-white/30" />
              <Slider value={zoom} onValueChange={setZoom} min={1} max={3} step={0.1} className="flex-1" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModal({ type: "none" })} className="text-white/50">Cancel</Button>
              <Button variant="accent" onClick={handleCropSave} className="rounded-xl">Save</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Confirm Creative modal — two-column: Media | Caption with AI generation */}
      {modal.type === "confirm-creative" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl w-full max-w-4xl flex flex-col" style={{ background: "#1a1a1a", maxHeight: "90vh" }}>
            {/* Header */}
            <div className="text-center py-5 border-b border-white/10 shrink-0">
              <h3 className="text-lg font-semibold text-white">Confirm Creative</h3>
            </div>

            {/* Two-column body */}
            <div className="flex flex-1 min-h-0">
              {/* Left: Media */}
              <div className="w-1/2 p-6 border-r border-white/10">
                <h4 className="text-sm font-semibold text-white mb-4">Media</h4>
                {modal.item.type === "image" ? (
                  <img src={modal.item.src} alt="" className="w-full rounded-xl object-cover aspect-[4/5]" />
                ) : (
                  <video src={modal.item.src} controls className="w-full rounded-xl aspect-[4/5] object-cover" />
                )}
              </div>

              {/* Right: Caption */}
              <div className="w-1/2 p-6 flex flex-col min-h-0">
                <h4 className="text-sm font-semibold text-white mb-4">Caption</h4>

                {/* Write your own from scratch */}
                <button
                  onClick={() => setWriteOwn(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-white/15 text-sm text-white/50 hover:border-white/25 transition-colors mb-4 shrink-0"
                >
                  + Write your own from scratch
                </button>

                {writeOwn && (
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={5}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 outline-none resize-none mb-4 shrink-0"
                    placeholder="Write a caption for your ad..."
                    autoFocus
                  />
                )}

                {/* AI loading state */}
                {aiLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 relative">
                      <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
                      <img
                        src={yanguYGreen}
                        alt="Generating"
                        className="w-full h-full object-contain animate-spin"
                        style={{ animationDuration: "2s" }}
                      />
                    </div>
                    <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 animate-pulse" style={{ width: "60%" }} />
                    </div>
                    <span className="text-sm text-white/50">Generating AI captions...</span>
                  </div>
                )}

                {/* AI captions results — scrollable */}
                {!aiLoading && aiCaptions.length > 0 && (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                    {aiCaptions.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedCaptionIdx(i); setWriteOwn(false); }}
                        className="w-full text-left p-4 rounded-xl text-sm transition-colors"
                        style={{
                          background: selectedCaptionIdx === i ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                          border: selectedCaptionIdx === i ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                            style={{
                              borderColor: selectedCaptionIdx === i ? "#3b82f6" : "rgba(255,255,255,0.2)",
                              background: selectedCaptionIdx === i ? "#3b82f6" : "transparent",
                            }}
                          >
                            {selectedCaptionIdx === i && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <p className="text-white/70 whitespace-pre-line leading-relaxed">{c}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-white/10 shrink-0">
              <Button
                variant="outline"
                onClick={() => setModal({ type: "none" })}
                className="flex-1 rounded-xl border-white/10 text-white/60 h-12"
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={handleConfirmSave}
                disabled={aiLoading && !writeOwn}
                className="flex-1 rounded-xl h-12"
              >
                Save & Continue
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}
      {/* Search ads - select business modal */}
      {modal.type === "search-ads" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl w-full max-w-lg" style={{ background: "#1a1a1a" }}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Add your business</h3>
              <button onClick={() => setModal({ type: "none" })} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-white/50 mb-4">Select a published business to promote on Explore</p>
              {surfacesLoading ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <img src={yanguYGreen} alt="Loading" className="w-10 h-10 animate-spin" style={{ animationDuration: "2s" }} />
                  <span className="text-sm text-white/40">Loading businesses...</span>
                </div>
              ) : publishedSurfaces.length === 0 ? (
                <div className="text-center py-10">
                  <Store className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">No published businesses found</p>
                  <p className="text-xs text-white/25 mt-1">Publish a business first to use Search ads</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {publishedSurfaces.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setModal({ type: "search-ads-form", surface: s })}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-white/[0.06]"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {s.coverImage ? (
                        <img src={s.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Store className="w-5 h-5 text-white/40" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{s.title}</p>
                        <p className="text-xs text-white/30">/{s.slug}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <Button variant="outline" onClick={() => setModal({ type: "none" })} className="flex-1 rounded-xl border-white/10 text-white/60">Cancel</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Search ads - business details form */}
      {modal.type === "search-ads-form" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl w-full max-w-lg" style={{ background: "#1a1a1a" }}>
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Business details</h3>
              <button onClick={() => setModal({ type: "none" })} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {modal.surface.coverImage ? (
                  <img src={modal.surface.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Store className="w-5 h-5 text-white/40" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-white font-medium">{modal.surface.title}</p>
                  <p className="text-xs text-white/30">/{modal.surface.slug}</p>
                </div>
                <Check className="w-5 h-5 text-green-400 ml-auto" />
              </div>

              <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">Product type</label>
                <input
                  type="text"
                  value={searchAdForm.productType}
                  onChange={(e) => setSearchAdForm((f) => ({ ...f, productType: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                  placeholder="e.g. SaaS, Fashion, Food, Service..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">Category of business</label>
                <input
                  type="text"
                  value={searchAdForm.category}
                  onChange={(e) => setSearchAdForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                  placeholder="e.g. Technology, Lifestyle, Health..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 block mb-1.5">Business description</label>
                <textarea
                  value={searchAdForm.description}
                  onChange={(e) => setSearchAdForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none resize-none"
                  placeholder="Briefly describe what your business offers..."
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <Button variant="outline" onClick={() => setModal({ type: "search-ads" })} className="flex-1 rounded-xl border-white/10 text-white/60">Back</Button>
              <Button
                variant="accent"
                onClick={handleSearchAdSave}
                disabled={!searchAdForm.productType || !searchAdForm.category || !searchAdForm.description}
                className="flex-1 rounded-xl"
              >
                Save
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full flex justify-center">{children}</div>
    </div>
  );
}
