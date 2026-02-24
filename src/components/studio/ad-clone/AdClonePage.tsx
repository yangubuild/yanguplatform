import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Info, Search, Plus, Bookmark, MoreVertical, Upload as UploadIcon } from "lucide-react";
import { CreditBadge } from "@/components/studio/CreditBadge";
import { AddProductModal } from "@/components/studio/image-ads/AddProductModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RightTab = "trending" | "upload";

export default function AdClonePage() {
  const navigate = useNavigate();
  const [rightTab, setRightTab] = useState<RightTab>("trending");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [adSearch, setAdSearch] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9x16");
  const [language, setLanguage] = useState("original");

  const handleBack = () => {
    navigate("/dashboard/studio");
  };

  const handleSyncBusiness = () => {
    navigate("/dashboard/my-business");
  };

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden" style={{ background: "#08120D" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Studio
          </button>
          <span className="text-lg font-bold text-foreground">Ad Clone</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-3.5 w-3.5" />
            Feedback
          </button>
          <CreditBadge />
        </div>
      </div>

      {/* Main content — two panels */}
      <div className="flex-1 min-h-0 flex gap-0 px-4 pb-0 overflow-hidden">
        {/* LEFT PANEL — Select Product */}
        <div className="w-[35%] min-w-[280px] flex flex-col border border-border/40 rounded-xl bg-card/40 mr-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <h2 className="text-base font-bold text-foreground">Select Product</h2>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Search + New product */}
          <div className="flex items-center gap-2 px-5 pb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by product name ..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
            <button
              onClick={() => setAddProductOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-accent/60 px-3 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              New product
            </button>
          </div>

          {/* Product list — empty */}
          <div className="flex-1 overflow-y-auto px-5 pb-4" />
        </div>

        {/* RIGHT PANEL — Choose Reference Ad */}
        <div className="flex-1 min-w-0 flex flex-col border border-border/40 rounded-xl bg-card/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <h2 className="text-base font-bold text-foreground">Choose Reference Ad</h2>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Tabs */}
          <div className="px-5 pb-3">
            <div className="flex rounded-lg border border-border/40 overflow-hidden">
              <button
                onClick={() => setRightTab("trending")}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                  rightTab === "trending"
                    ? "bg-accent/20 text-foreground border border-accent/50 rounded-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Choose from Trending Ads
              </button>
              <button
                onClick={() => setRightTab("upload")}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
                  rightTab === "upload"
                    ? "bg-accent/20 text-foreground border border-accent/50 rounded-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Upload Video
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
            {rightTab === "trending" && <TrendingAdsTab search={adSearch} onSearchChange={setAdSearch} />}
            {rightTab === "upload" && <UploadVideoTab />}
          </div>
        </div>
      </div>

      {/* BOTTOM STICKY BAR */}
      <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3 gap-3">
          <div className="flex items-center gap-3">
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-card border-border/60 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="9x16">9x16</SelectItem>
                <SelectItem value="16x9">16x9</SelectItem>
                <SelectItem value="1x1">1x1</SelectItem>
              </SelectContent>
            </Select>

            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[170px] h-9 rounded-lg bg-card border-border/60 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="original">Original Language</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled
              className="h-10 rounded-lg bg-accent text-accent-foreground text-sm font-semibold px-6 flex items-center gap-2 opacity-50 cursor-not-allowed"
            >
              Generate cloned ad (3 credits/5s)
            </button>
            <span className="text-xs text-accent flex items-center gap-1">
              ⚡ First time free for videos under 60 seconds
            </span>
          </div>
        </div>
      </div>

      {/* Reuse existing Add Product Modal */}
      <AddProductModal
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onSyncBusiness={handleSyncBusiness}
      />
    </div>
  );
}

/* ─── Trending Ads sub-tab ─── */
function TrendingAdsTab({ search, onSearchChange }: { search: string; onSearchChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search + Saved ads row */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Bookmark className="h-4 w-4" />
          Saved ads
        </button>
      </div>

      {/* Empty grid — 3 columns of card frames */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <TrendingAdCardEmpty key={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── Empty ad card frame (matches screenshot structure) ─── */
function TrendingAdCardEmpty() {
  return (
    <div className="flex flex-col rounded-xl border border-border/30 bg-card/30 overflow-hidden">
      {/* Header row: avatar + name + NEW + bookmark */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="h-7 w-7 rounded-full bg-muted/30 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-3 w-24 rounded bg-muted/20" />
        </div>
        <div className="h-3 w-8 rounded bg-muted/20" />
        <Bookmark className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      </div>

      {/* Description lines */}
      <div className="px-3 py-1.5 space-y-1">
        <div className="h-2.5 w-full rounded bg-muted/15" />
        <div className="h-2.5 w-3/4 rounded bg-muted/15" />
      </div>

      {/* Vertical video container */}
      <div className="mx-3 mb-2 aspect-[9/16] rounded-lg bg-muted/10 border border-border/20" />

      {/* Clone + 3-dot row */}
      <div className="flex items-center gap-2 px-3 pb-3">
        <button
          disabled
          className="flex-1 h-8 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground cursor-not-allowed"
        >
          Clone this ad
        </button>
        <button disabled className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground cursor-not-allowed">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Upload Video sub-tab ─── */
function UploadVideoTab() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="w-full h-full min-h-[400px] rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-3">
        <UploadIcon className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Upload a video</p>
        <p className="text-xs text-muted-foreground">
          <span className="text-accent cursor-pointer">Click to upload</span> or{" "}
          <span className="text-accent cursor-pointer">drop a video here</span> to import your reference ad
        </p>
      </div>
    </div>
  );
}
