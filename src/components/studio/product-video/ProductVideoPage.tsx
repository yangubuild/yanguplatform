import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, Lightbulb, Square, ChevronDown, ImagePlus,
  X, MessageSquareText, Check, UserPlus, Search, Image, Tag,
  RectangleHorizontal, Settings2, Plus, Sparkles, Bookmark,
  SlidersHorizontal, ArrowUpDown, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useVideoGenerate } from "@/hooks/useStudioEngine";
import type { VideoGenerateResult } from "@/lib/studio/StudioAIEngine";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import sampleProduct1 from "@/assets/sample-product-1.webp";
import sampleProduct2 from "@/assets/sample-product-2.webp";
import sampleProduct3 from "@/assets/sample-product-3.webp";
import sampleProduct4 from "@/assets/sample-product-4.webp";

import styleStudio from "@/assets/styles/style-studio.png";
import styleOutdoor from "@/assets/styles/style-outdoor.webp";
import styleLuxury from "@/assets/styles/style-luxury.png";
import styleCozy from "@/assets/styles/style-cozy.webp";
import styleBeauty from "@/assets/styles/style-beauty.webp";
import styleIndustrial from "@/assets/styles/style-industrial.png";
import styleRomantic from "@/assets/styles/style-romantic.webp";
import styleModern from "@/assets/styles/style-modern.webp";

import templateStep1 from "@/assets/video-templates/step1.png";
import templateStep2 from "@/assets/video-templates/step2.gif";
import templateStep3 from "@/assets/video-templates/step3.gif";

import tips1 from "@/assets/tips/ptv-tips-1.png";
import tips2 from "@/assets/tips/ptv-tips-2.png";
import tips3 from "@/assets/tips/ptv-tips-3.png";
import tips4 from "@/assets/tips/ptv-tips-4.png";
import tips5 from "@/assets/tips/ptv-tips-5.png";
import tips6 from "@/assets/tips/ptv-tips-6.png";

const TIPS_GRID: { src: string; label: string; good: boolean }[] = [
  { src: tips1, label: "Solid BG", good: true },
  { src: tips2, label: "Sharp focus", good: true },
  { src: tips3, label: "People/hands", good: false },
  { src: tips4, label: "Blur", good: false },
  { src: tips5, label: "Cropped", good: false },
  { src: tips6, label: "Out-of-focus", good: false },
];

const SAMPLE_IMAGES = [sampleProduct1, sampleProduct2, sampleProduct3, sampleProduct4];

/* ─── Types ─── */
type Tab = "clips" | "templates";
type AspectRatio = "portrait" | "landscape" | "square";
type VideoType = "product-shot" | "avatar-showcase" | "talking-video";

/* ─── Smart Assets Modal ─── */
function SmartAssetsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sampleAssets = [
    { name: "UCANBE Eyesh...", count: 7, image: sampleProduct1 },
    { name: "Dokotoo Wome...", count: 10, image: sampleProduct2 },
    { name: "ada ai", count: 2, image: sampleProduct3 },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl bg-card border-border/30 p-8 gap-6">
        <h2 className="text-xl font-semibold text-foreground text-center">Organize, search, and reuse your clips</h2>

        {/* Search bar */}
        <div className="rounded-xl bg-muted/10 border border-border/20 px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search product assets, ad creatives, video clips, and more"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/10 text-xs text-accent">
              Search by: Visual element <ChevronDown className="h-3 w-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/20 transition-colors">
              <Image className="h-3.5 w-3.5" /> Type
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/20 transition-colors">
              <Tag className="h-3.5 w-3.5" /> Tags
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/20 transition-colors">
              <RectangleHorizontal className="h-3.5 w-3.5" /> Aspect ratio
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/20 transition-colors">
              <Settings2 className="h-3.5 w-3.5" /> All status
            </button>
            <div className="ml-auto">
              <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-accent/40 text-xs text-accent hover:bg-accent/10 transition-colors">
                <Sparkles className="h-3.5 w-3.5" /> AI Search
              </button>
            </div>
          </div>
        </div>

        {/* Product assets */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-foreground">Product assets</span>
            <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-md">{sampleAssets.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {sampleAssets.map((asset) => (
              <button key={asset.name} className="flex flex-col gap-2 group">
                <div className="aspect-square rounded-xl border border-border/20 overflow-hidden bg-muted/10 hover:border-accent/40 transition-colors">
                  <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs text-foreground truncate">{asset.name}</p>
                  <p className="text-[10px] text-muted-foreground">{asset.count} assets</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div>
          <span className="text-sm font-semibold text-foreground mb-3 block">Collections</span>
          <button className="w-full rounded-xl border-2 border-dashed border-border/30 py-10 flex flex-col items-center gap-2 hover:border-border/50 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">New collections</span>
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={onClose}>Add assets (0)</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Style Selector Modal (Auto match dropdown) ─── */
function StyleSelectorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const styles: { label: string; image?: string }[] = [
    { label: "Auto match" },
    { label: "Studio", image: styleStudio },
    { label: "Outdoor", image: styleOutdoor },
    { label: "Luxury", image: styleLuxury },
    { label: "Cozy", image: styleCozy },
    { label: "Beauty", image: styleBeauty },
    { label: "Industrial", image: styleIndustrial },
    { label: "Romantic", image: styleRomantic },
    { label: "Modern", image: styleModern },
  ];
  const [selected, setSelected] = useState("Auto match");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border/30 p-6 gap-4">
        <h2 className="text-lg font-semibold text-foreground">Select Style</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {styles.map((s) => (
            <button
              key={s.label}
              onClick={() => setSelected(s.label)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-2 transition-colors ${selected === s.label ? "border-accent ring-2 ring-accent" : "border-border/30 hover:border-border/60"}`}
            >
              <div className="w-full aspect-square rounded-lg bg-muted/10 overflow-hidden relative">
                {s.image ? (
                  <img src={s.image} alt={s.label} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    {selected === s.label && <Check className="h-5 w-5 text-accent" />}
                    <MessageSquareText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="text-xs text-foreground">{s.label}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={onClose}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TEMPLATE_ITEMS: { src: string; type: "video" | "gif" }[] = [
  { src: "/videos/templates/template-preview.mp4", type: "video" },
  { src: "/videos/templates/template-2.mp4", type: "video" },
  { src: "/videos/templates/template-3.mp4", type: "video" },
  { src: "/videos/templates/template-4.mp4", type: "video" },
  { src: "/videos/templates/template-5.mp4", type: "video" },
  { src: "/videos/templates/template-6.mp4", type: "video" },
  { src: "/videos/templates/template-7.gif", type: "gif" },
  { src: "/videos/templates/template-8.gif", type: "gif" },
  { src: "/videos/templates/template-9.mp4", type: "video" },
  { src: "/videos/templates/template-10.mp4", type: "video" },
  { src: "/videos/templates/template-11.mp4", type: "video" },
  { src: "/videos/templates/template-12.mp4", type: "video" },
  { src: "/videos/templates/template-13.mp4", type: "video" },
];

/* ─── Template Selection Modal ─── */
function TemplateSelectionModal({ open, onClose, selected, onSelect }: { open: boolean; onClose: () => void; selected: number; onSelect: (i: number) => void }) {
  const categories = ["All", "Beverages", "Beauty & Personal care", "OTC / Medical", "Coming soon"];
  const [activeCategory, setActiveCategory] = useState("All");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl bg-card border-border/30 p-6 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Choose a template</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Each template is designed for a specific product type. For the best video results, choose templates that match your product category.
            </p>
          </div>
        </div>
        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => cat !== "Coming soon" && setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cat === "Coming soon"
                  ? "text-muted-foreground/50 border border-border/20 cursor-not-allowed"
                  : activeCategory === cat
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "border border-border/30 text-foreground hover:bg-muted/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[450px] overflow-y-auto">
          {TEMPLATE_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`relative rounded-xl overflow-hidden border-2 aspect-[3/4] transition-colors ${
                selected === i ? "border-accent ring-2 ring-accent" : "border-transparent hover:border-border/50"
              }`}
            >
              {selected === i && (
                <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
              )}
              {item.type === "video" ? (
                <video src={item.src} muted autoPlay loop playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={item.src} alt={`Template ${i + 1}`} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
        {/* Bottom actions */}
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="outline" className="px-8" onClick={onClose}>Cancel</Button>
          <Button variant="accent" className="px-8" onClick={onClose}>Use this template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Choose Avatar Modal ─── */
function ChooseAvatarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"realistic" | "styled" | "custom">("realistic");
  const tabs = [
    { key: "realistic" as const, label: "Realistic Avatar" },
    { key: "styled" as const, label: "Styled Avatar" },
    { key: "custom" as const, label: "Custom Avatar" },
  ];
  const filters = ["Gender", "Age", "Location", "Industry", "Style"];
  const avatars = [
    { name: "Breanna", styles: 5 },
    { name: "Desirae", styles: 6 },
    { name: "Keisha", styles: 6 },
    { name: "Stefan", styles: 1 },
    { name: "Sylvia", styles: 1 },
    { name: "Logan", styles: 2 },
    { name: "Diego", styles: 1 },
    { name: "Belen", styles: 3 },
    { name: "Anthony", styles: 1, pro: true },
    { name: "Faye", styles: 12 },
    { name: "Paige", styles: 2 },
    { name: "Carlyn", styles: 6 },
  ];
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl bg-card border-border/30 p-6 gap-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Choose avatar</h2>
            <div className="flex items-center gap-6 mt-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`text-sm pb-1 border-b-2 transition-colors ${
                    activeTab === t.key
                      ? "text-foreground border-accent font-medium"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Avatar Style view
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/30 text-xs text-muted-foreground hover:bg-muted/20 transition-colors"
            >
              {f} <ChevronDown className="h-3 w-3" />
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Bookmark className="h-3.5 w-3.5" /> Saved
            </button>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Search className="h-3.5 w-3.5" /> Search
            </button>
          </div>
        </div>

        {/* Avatar grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 max-h-[450px] overflow-y-auto">
          {avatars.map((av) => (
            <button
              key={av.name}
              onClick={() => setSelected(av.name)}
              className="flex flex-col gap-2 group"
            >
              <div
                className={`aspect-[3/4] rounded-xl border overflow-hidden bg-muted/10 transition-colors relative ${
                  selected === av.name
                    ? "border-accent ring-2 ring-accent"
                    : "border-border/20 hover:border-border/50"
                }`}
              >
                {/* Placeholder gradient for avatar image */}
                <div className="w-full h-full bg-gradient-to-b from-muted/30 to-muted/10 flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-muted-foreground/30" />
                </div>
                {/* Styles badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <span className="text-[10px] text-foreground">{av.styles} styles</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {av.pro && (
                  <span className="text-[9px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded">PRO</span>
                )}
                <span className="text-xs text-foreground">{av.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="outline" className="px-8" onClick={onClose}>Cancel</Button>
          <Button variant="accent" className="px-8" onClick={onClose}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Upload Box (shared between tabs) ─── */
function UploadBox({ onSmartAssets, onFileSelected, onSampleSelected }: { onSmartAssets: () => void; onFileSelected?: (file: File) => void; onSampleSelected?: (url: string) => void }) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedSample(URL.createObjectURL(file));
    onFileSelected?.(file);
  };

  const handleSampleClick = (src: string) => {
    setSelectedSample(src);
    onSampleSelected?.(src);
  };

  return (
    <div
      className="rounded-xl border-2 border-dashed border-border/40 p-6 flex flex-col items-center gap-2 relative cursor-pointer"
      onClick={() => !selectedSample && uploadRef.current?.click()}
    >
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {selectedSample ? (
        <div className="w-full relative">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedSample(null); }}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-card/80 hover:bg-destructive/80 transition-colors"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
          <img src={selectedSample} alt="Selected sample" className="w-full rounded-lg object-contain max-h-[280px]" />
        </div>
      ) : (
        <>
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={(e) => { e.stopPropagation(); setShowTips(!showTips); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/20 text-xs text-foreground hover:bg-muted/30 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5 text-accent" /> Tips
            </button>
            {showTips && (
              <div className="absolute top-full right-0 mt-2 w-[340px] rounded-xl bg-card border border-border/30 shadow-2xl z-50 p-4">
                <div className="grid grid-cols-3 gap-3">
                  {TIPS_GRID.map((tip) => (
                    <div key={tip.label} className="flex flex-col items-center gap-1.5">
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-border/20 bg-muted/5">
                        <img src={tip.src} alt={tip.label} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-medium text-foreground flex items-center gap-1">
                        {tip.good ? "✅" : "❌"} {tip.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Click or drop an image to upload</p>
          <p className="text-xs text-muted-foreground">Upload image up to 50 MB</p>
          <button onClick={(e) => { e.stopPropagation(); onSmartAssets(); }} className="text-xs text-accent hover:underline">
            Choose from Smart Assets
          </button>
          <div className="w-full flex items-center gap-3 mt-3">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Samples</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="flex gap-2 mt-1">
            {SAMPLE_IMAGES.map((src, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); handleSampleClick(src); }}
                className="w-10 h-10 rounded-full overflow-hidden border border-border/20 hover:border-accent transition-colors"
              >
                <img src={src} alt={`Sample ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Video Clips Tab ─── */
function VideoClipsTab({ onGenerated }: { onGenerated: (result: VideoGenerateResult) => void }) {
  const [selectedType, setSelectedType] = useState<VideoType>("product-shot");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("square");
  const [showAspectDropdown, setShowAspectDropdown] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showSmartAssets, setShowSmartAssets] = useState(false);
  const [showSmartAssetsPopover, setShowSmartAssetsPopover] = useState(false);
  const [showAvatarPopover, setShowAvatarPopover] = useState(false);
  const [showChooseAvatar, setShowChooseAvatar] = useState(false);
  const [placementText, setPlacementText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoGenerate = useVideoGenerate();

  const videoTypes: { key: VideoType; label: string; video: string }[] = [
    { key: "product-shot", label: "Product shot", video: "/videos/product-shot.mp4" },
    { key: "avatar-showcase", label: "Avatar showcase", video: "/videos/avatar-showcase.mp4" },
    { key: "talking-video", label: "Talking video", video: "/videos/talking-video.mp4" },
  ];

  const placeholders: Record<VideoType, string> = {
    "product-shot": "Tell us where you want to place your product. e.g., 'cosmetics on a marble vanity with morning light'.",
    "avatar-showcase": "Tell us how the avatar interacts with your product. e.g., 'model holding sunglasses near face'.",
    "talking-video": "Select an avatar and tell AI if you need any changes. e.g., 'change the background into a cozy living room.'",
  };

  const aspectRatios: { key: AspectRatio; label: string }[] = [
    { key: "portrait", label: "Portrait" },
    { key: "landscape", label: "Landscape" },
    { key: "square", label: "Square" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Upload */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">1. Upload a product image</h3>
        <UploadBox
          onSmartAssets={() => setShowSmartAssets(true)}
          onFileSelected={(file) => { setUploadedFile(file); setUploadedUrl(URL.createObjectURL(file)); }}
          onSampleSelected={(url) => { setUploadedFile(null); setUploadedUrl(url); }}
        />
      </div>

      {/* 2. Select a video type */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">2. Select a video type</h3>
         <div className="grid grid-cols-3 gap-3">
           {videoTypes.map((vt) => (
             <button
               key={vt.key}
               onClick={() => setSelectedType(vt.key)}
               className={`relative rounded-xl border overflow-hidden aspect-[4/3] flex items-start transition-colors ${
                 selectedType === vt.key
                   ? "border-accent ring-2 ring-accent"
                   : "border-border/30 hover:border-border/60"
               }`}
             >
               <video src={vt.video} muted autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover" />
               <span className="relative z-10 text-xs font-medium text-foreground m-2 drop-shadow-lg">{vt.label}</span>
             </button>
           ))}
         </div>
       </div>

       <textarea
         value={placementText}
         onChange={(e) => setPlacementText(e.target.value)}
         placeholder={placeholders[selectedType]}
         className="w-full min-h-[120px] rounded-xl bg-muted/10 border border-border/20 p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-accent/40"
       />

      {/* Options row — dynamic based on selected type */}
      <div className="flex items-center gap-3">
        {/* Avatar button (avatar-showcase & talking-video only) */}
        {(selectedType === "avatar-showcase" || selectedType === "talking-video") && (
          <div className="relative">
            <button
              onClick={() => setShowAvatarPopover(!showAvatarPopover)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/20 border border-border/20 text-sm text-foreground hover:bg-muted/30 transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Avatar
            </button>
            {showAvatarPopover && (
              <div className="absolute top-full left-0 mt-1 w-60 rounded-xl bg-card border border-border/30 shadow-xl z-50 py-1.5">
                <button
                  onClick={() => { setShowAvatarPopover(false); setShowChooseAvatar(true); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground hover:bg-muted/20 transition-colors"
                >
                  <UserPlus className="h-4 w-4 text-muted-foreground" /> Choose avatar
                </button>
                <button
                  onClick={() => { setShowAvatarPopover(false); setShowSmartAssets(true); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground hover:bg-muted/20 transition-colors"
                >
                  <ImagePlus className="h-4 w-4 text-muted-foreground" /> Select from smart assets
                </button>
                <button
                  onClick={() => setShowAvatarPopover(false)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground hover:bg-muted/20 transition-colors"
                >
                  <Image className="h-4 w-4 text-muted-foreground" /> Upload an image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Aspect Ratio dropdown (always shown) */}
        <div className="relative">
          <button
            onClick={() => setShowAspectDropdown(!showAspectDropdown)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/20 border border-border/20 text-sm text-foreground hover:bg-muted/30 transition-colors"
          >
            <Square className="h-4 w-4" />
            {aspectRatios.find((a) => a.key === aspectRatio)?.label}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {showAspectDropdown && (
            <div className="absolute top-full left-0 mt-1 w-44 rounded-xl bg-card border border-border/30 shadow-xl z-50 py-1.5">
              {aspectRatios.map((ar) => (
                <button
                  key={ar.key}
                  onClick={() => { setAspectRatio(ar.key); setShowAspectDropdown(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/20 transition-colors"
                >
                  <Square className="h-4 w-4 text-muted-foreground" />
                  {ar.label}
                  {ar.key === aspectRatio && <Check className="h-4 w-4 text-accent ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Style dropdown + Smart Assets (product-shot only) */}
        {selectedType === "product-shot" && (
          <>
            <button
              onClick={() => setShowStyleModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/20 border border-border/20 text-sm text-foreground hover:bg-muted/30 transition-colors"
            >
              Auto match
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSmartAssetsPopover(!showSmartAssetsPopover)}
                className="p-2.5 rounded-xl bg-muted/20 border border-border/20 hover:bg-muted/30 transition-colors"
              >
                <ImagePlus className="h-4 w-4 text-foreground" />
              </button>
              {showSmartAssetsPopover && (
                <div className="absolute top-full right-0 mt-1 w-56 rounded-xl bg-card border border-border/30 shadow-xl z-50 py-1.5">
                  <button
                    onClick={() => setShowSmartAssetsPopover(false)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground hover:bg-muted/20 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" /> Upload from local
                  </button>
                  <button
                    onClick={() => { setShowSmartAssetsPopover(false); setShowSmartAssets(true); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground hover:bg-muted/20 transition-colors"
                  >
                    <ImagePlus className="h-4 w-4 text-muted-foreground" /> Select from Smart Assets
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Button
        variant="accent"
        className="w-full"
        disabled={!uploadedUrl || videoGenerate.isPending}
        onClick={async () => {
          if (!uploadedUrl) return;
          const aspectMap: Record<AspectRatio, string> = { portrait: "9x16", landscape: "16x9", square: "1x1" };
          const prompt = uploadedUrl.startsWith("http") ? uploadedUrl : placementText || "Product video";
          try {
            const result = await videoGenerate.mutateAsync({
              tool: "product-video",
              type: "video.generate",
              prompt,
              params: {
                aspect_ratio: aspectMap[aspectRatio],
                visual_style: selectedType,
                script_text: placementText || undefined,
              },
            });
            onGenerated(result);
            toast.success("Video generated successfully!");
          } catch (err) {
            if ((err as Error).message === "UPGRADE_REQUIRED") {
              toast.error("Upgrade your plan to generate product videos.");
            }
          }
        }}
      >
        {videoGenerate.isPending ? (
          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating...</span>
        ) : (
          "Generate preview video"
        )}
      </Button>

      <SmartAssetsModal open={showSmartAssets} onClose={() => setShowSmartAssets(false)} />
      <StyleSelectorModal open={showStyleModal} onClose={() => setShowStyleModal(false)} />
      <ChooseAvatarModal open={showChooseAvatar} onClose={() => setShowChooseAvatar(false)} />
    </div>
  );
}

/* ─── Video Templates Tab ─── */
function VideoTemplatesTab() {
  const [showSmartAssets, setShowSmartAssets] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [hoveringPreview, setHoveringPreview] = useState(false);

  const currentTemplate = TEMPLATE_ITEMS[selectedTemplate];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Upload */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">1. Upload a product image</h3>
        <UploadBox onSmartAssets={() => setShowSmartAssets(true)} />
      </div>

      {/* 2. Select a template */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">2. Select a template</h3>
        <div className="rounded-xl border border-border/30 p-4 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Select a template, then customize the text overlay based on your product.
          </p>
          {/* Template preview with video */}
          <button
            onClick={() => setShowTemplateModal(true)}
            onMouseEnter={() => setHoveringPreview(true)}
            onMouseLeave={() => setHoveringPreview(false)}
            className="relative w-full aspect-[4/3] rounded-lg overflow-hidden group"
          >
            {currentTemplate.type === "video" ? (
              <video src={currentTemplate.src} muted autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={currentTemplate.src} alt="Template preview" className="w-full h-full object-cover" />
            )}
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${hoveringPreview ? "opacity-100" : "opacity-0"}`}>
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Change template <ChevronDown className="h-4 w-4 -rotate-90" />
              </span>
            </div>
          </button>

          {/* Heading input */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Heading</label>
            <input
              placeholder='"Perfumes changed my routine!"'
              className="w-full h-10 rounded-lg bg-muted/10 border border-border/20 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/40"
            />
          </div>

          {/* Subheading input */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Subheading</label>
            <input
              placeholder="- Emma T"
              className="w-full h-10 rounded-lg bg-muted/10 border border-border/20 px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/40"
            />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <Button variant="accent" className="w-full opacity-50 cursor-not-allowed" disabled>
        Generate
      </Button>

      <SmartAssetsModal open={showSmartAssets} onClose={() => setShowSmartAssets(false)} />
      <TemplateSelectionModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        selected={selectedTemplate}
        onSelect={setSelectedTemplate}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function ProductVideoPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("clips");
  const [generatedResult, setGeneratedResult] = useState<VideoGenerateResult | null>(null);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background" >
      {/* ── Top bar ── */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border/20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/studio")}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Studio
          </button>
          <span className="text-lg font-bold text-foreground">Product Video</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/20 transition-colors">
            <MessageSquareText className="h-4 w-4" /> Feedback
          </button>
        </div>
      </div>

      {/* ── Body: 2-panel layout ── */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL — scrollable */}
        <div className="w-[420px] shrink-0 border-r border-border/20 flex flex-col min-h-0">
          {/* Tabs header */}
          <div className="flex items-center gap-6 px-6 pt-4 pb-2 border-b border-border/20">
            <button
              onClick={() => setActiveTab("clips")}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === "clips"
                  ? "text-foreground border-accent"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Video Clips
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === "templates"
                  ? "text-foreground border-accent"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Video Templates
            </button>
          </div>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
            {activeTab === "clips" ? <VideoClipsTab onGenerated={(r) => setGeneratedResult(r)} /> : <VideoTemplatesTab />}
          </div>
        </div>

        {/* RIGHT PANEL — dynamic based on tab */}
        <div className="flex-1 flex flex-col items-center p-8 min-w-0 overflow-y-auto">
          {generatedResult?.ok && generatedResult.videoUrl ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">Your Video is Ready</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Preview your generated product video below.</p>
              <div className="w-full flex-1 max-w-[800px] rounded-2xl overflow-hidden border border-accent/30">
                <video src={generatedResult.videoUrl} controls autoPlay className="w-full h-full object-contain bg-black" />
              </div>
            </>
          ) : activeTab === "clips" ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">Turn Any Product Image into a Stunning Video</h1>
              <p className="text-sm text-muted-foreground text-center mb-6">Instantly transform product images into cinematic product shots or avatar videos — all with a single click.</p>
              <div className="w-full flex-1 max-w-[800px] rounded-2xl overflow-hidden border border-border/20">
                <video src="/videos/ptv_intro_2.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">How It Works</h1>
              <p className="text-sm text-muted-foreground text-center mb-8">Apply our templates and generate stunning product videos instantly — no editing needed.</p>
              <div className="w-full max-w-[1000px] grid grid-cols-3 gap-6 items-start">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/20 mb-4 bg-muted/5">
                    <img src={templateStep1} alt="Upload a product image" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Upload a product image</h3>
                  <p className="text-xs text-muted-foreground text-center">Upload a clear image of your product.</p>
                </div>

                {/* Plus sign */}
                <div className="flex flex-col items-center relative">
                  <span className="absolute -left-6 top-1/3 text-2xl text-muted-foreground/40 font-light">+</span>
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/20 mb-4 bg-muted/5">
                    <img src={templateStep2} alt="Select a template" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Select a template</h3>
                  <p className="text-xs text-muted-foreground text-center">Click "<span className="font-semibold text-foreground">Change Template</span>" to explore templates that suit your product.</p>
                </div>

                {/* Equals sign */}
                <div className="flex flex-col items-center relative">
                  <span className="absolute -left-6 top-1/3 text-2xl text-muted-foreground/40 font-light">=</span>
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-border/20 mb-4 bg-muted/5">
                    <img src={templateStep3} alt="Generate your video" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Generate your video</h3>
                  <p className="text-xs text-muted-foreground text-center">Click "<span className="font-semibold text-foreground">Generate</span>" and let our AI do the magic.</p>
                </div>
              </div>

              {/* Footer link */}
              <p className="text-xs text-muted-foreground mt-8">
                You can check the videos in the <button className="text-accent hover:underline">Project page</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
