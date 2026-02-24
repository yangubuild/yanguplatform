import { useState } from "react";
import sampleProduct1 from "@/assets/sample-product-1.webp";
import sampleProduct2 from "@/assets/sample-product-2.webp";
import sampleProduct3 from "@/assets/sample-product-3.webp";
import sampleProduct4 from "@/assets/sample-product-4.webp";

const SAMPLE_IMAGES = [sampleProduct1, sampleProduct2, sampleProduct3, sampleProduct4];
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Upload, Lightbulb, Square, ChevronDown, ImagePlus,
  X, MessageSquareText, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ─── Types ─── */
type Tab = "clips" | "templates";
type AspectRatio = "portrait" | "landscape" | "square";
type VideoType = "product-shot" | "avatar-showcase" | "talking-video";

/* ─── Smart Assets Modal ─── */
function SmartAssetsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border/30 p-6 gap-4">
        <h2 className="text-lg font-semibold text-foreground">Smart Assets</h2>
        <p className="text-sm text-muted-foreground">Select assets from your library.</p>
        {/* Scrollable grid container — NO assets */}
        <div className="grid grid-cols-3 gap-3 min-h-[300px] max-h-[400px] overflow-y-auto" />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={onClose}>Select</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Style Selector Modal (Auto match dropdown) ─── */
function StyleSelectorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const styles = ["Auto match", "Studio", "Outdoor", "Luxury", "Cozy", "Beauty", "Industrial", "Romantic", "Modern"];
  const [selected, setSelected] = useState("Auto match");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border/30 p-6 gap-4">
        <h2 className="text-lg font-semibold text-foreground">Select Style</h2>
        {/* Grid container — NO images */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {styles.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${selected === s ? "border-accent bg-accent/10" : "border-border/30 hover:border-border/60"}`}
            >
              {/* Empty thumbnail container */}
              <div className="w-full aspect-square rounded-lg bg-muted/10" />
              <span className="text-xs text-foreground">{s}</span>
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

/* ─── Template Selection Modal ─── */
function TemplateSelectionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        {/* Grid container — NO template images */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-h-[300px] max-h-[450px] overflow-y-auto" />
        {/* Bottom actions */}
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="outline" className="px-8" onClick={onClose}>Cancel</Button>
          <Button variant="accent" className="px-8" onClick={onClose}>Use this template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Upload Box (shared between tabs) ─── */
function UploadBox({ onSmartAssets }: { onSmartAssets: () => void }) {
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  return (
    <div className="rounded-xl border-2 border-dashed border-border/40 p-6 flex flex-col items-center gap-2 relative">
      {selectedSample ? (
        /* Enlarged sample view */
        <div className="w-full relative">
          <button
            onClick={() => setSelectedSample(null)}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-card/80 hover:bg-destructive/80 transition-colors"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
          <img src={selectedSample} alt="Selected sample" className="w-full rounded-lg object-contain max-h-[280px]" />
        </div>
      ) : (
        /* Default upload state */
        <>
          <button className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/20 text-xs text-foreground hover:bg-muted/30 transition-colors">
            <Lightbulb className="h-3.5 w-3.5 text-accent" /> Tips
          </button>
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Click or drop an image to upload</p>
          <p className="text-xs text-muted-foreground">Upload image up to 50 MB</p>
          <button onClick={onSmartAssets} className="text-xs text-accent hover:underline">
            Choose from Smart Assets
          </button>
          {/* Samples divider */}
          <div className="w-full flex items-center gap-3 mt-3">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Samples</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          {/* Sample thumbnails */}
          <div className="flex gap-2 mt-1">
            {SAMPLE_IMAGES.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelectedSample(src)}
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
function VideoClipsTab() {
  const [selectedType, setSelectedType] = useState<VideoType>("product-shot");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("square");
  const [showAspectDropdown, setShowAspectDropdown] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showSmartAssets, setShowSmartAssets] = useState(false);
  const [showSmartAssetsPopover, setShowSmartAssetsPopover] = useState(false);

  const videoTypes: { key: VideoType; label: string }[] = [
    { key: "product-shot", label: "Product shot" },
    { key: "avatar-showcase", label: "Avatar showcase" },
    { key: "talking-video", label: "Talking video" },
  ];

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
        <UploadBox onSmartAssets={() => setShowSmartAssets(true)} />
      </div>

      {/* 2. Select a video type */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">2. Select a video type</h3>
        <div className="grid grid-cols-3 gap-3">
          {videoTypes.map((vt) => (
            <button
              key={vt.key}
              onClick={() => setSelectedType(vt.key)}
              className={`relative rounded-xl border p-3 aspect-[4/3] flex items-end transition-colors ${
                selectedType === vt.key
                  ? "border-accent bg-accent/5"
                  : "border-border/30 hover:border-border/60"
              }`}
            >
              {/* Empty card — NO visuals */}
              <span className="text-xs font-medium text-foreground">{vt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Placement description */}
      <textarea
        placeholder="Tell us where you want to place your product. e.g., 'cosmetics on a marble vanity with morning light'."
        className="w-full min-h-[120px] rounded-xl bg-muted/10 border border-border/20 p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-accent/40"
      />

      {/* Options row */}
      <div className="flex items-center gap-3">
        {/* Aspect Ratio dropdown */}
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

        {/* Style dropdown */}
        <button
          onClick={() => setShowStyleModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/20 border border-border/20 text-sm text-foreground hover:bg-muted/30 transition-colors"
        >
          Auto match
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {/* Smart Assets icon button */}
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
                onClick={() => { setShowSmartAssetsPopover(false); }}
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
      </div>

      {/* Generate button */}
      <Button variant="accent" className="w-full opacity-50 cursor-not-allowed" disabled>
        Generate preview image
      </Button>

      <SmartAssetsModal open={showSmartAssets} onClose={() => setShowSmartAssets(false)} />
      <StyleSelectorModal open={showStyleModal} onClose={() => setShowStyleModal(false)} />
    </div>
  );
}

/* ─── Video Templates Tab ─── */
function VideoTemplatesTab() {
  const [showSmartAssets, setShowSmartAssets] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

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
          {/* Template preview card container — NO images */}
          <button
            onClick={() => setShowTemplateModal(true)}
            className="w-full aspect-[4/3] rounded-lg bg-muted/10 border border-dashed border-border/30 flex items-center justify-center text-sm text-muted-foreground hover:bg-muted/20 transition-colors"
          >
            Click to select a template
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
      <TemplateSelectionModal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function ProductVideoPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("clips");

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#08120D" }}>
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
            {activeTab === "clips" ? <VideoClipsTab /> : <VideoTemplatesTab />}
          </div>
        </div>

        {/* RIGHT PANEL — static video preview */}
        <div className="flex-1 flex flex-col items-center p-8 min-w-0 overflow-y-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">Turn Any Product Image into a Stunning Video</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Instantly transform product images into cinematic product shots or avatar videos — all with a single click.</p>
          <div className="w-full flex-1 max-w-[800px] rounded-2xl overflow-hidden border border-border/20">
            <video src="/videos/ptv_intro_2.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}
