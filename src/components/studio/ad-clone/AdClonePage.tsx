import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Info, Search, Plus, Bookmark, MoreVertical, Upload as UploadIcon, Share2, Eye, Loader2, CheckCircle2 } from "lucide-react";
import { CreditBadge } from "@/components/studio/CreditBadge";
import { AddProductModal } from "@/components/studio/image-ads/AddProductModal";
import { useAdClone } from "@/hooks/useAdClone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RightTab = "trending" | "upload";

const TRENDING_VIDEOS = [
  { video: "/studio/ad-clone/trending-1.mp4", name: "Vintage White Fa...", desc: "Comment FEBRUARY to shop this beautiful storage cabinet for small..." },
  { video: "/studio/ad-clone/trending-2.mp4", name: "Drama TV Club", desc: "Connor Reed, the most powerful arms dealer in the world, saves a Charlotte..." },
  { video: "/studio/ad-clone/trending-3.mp4", name: "Hitwicket Supers...", desc: "Yorker incoming! Block for safety or risk the six? 🎯 Every read matters. Master th..." },
  { video: "/studio/ad-clone/trending-4.mp4", name: "28 -Day Make Mo...", desc: "" },
  { video: "/studio/ad-clone/trending-5.mp4", name: "Freedom With AI", desc: "🧧 Urgent Offer: Master AI & Smart Automation in 3 Hours for Just Rs. 99 😲..." },
  { video: "/studio/ad-clone/trending-6.mp4", name: "Zorkleofficial", desc: "Stand out. Repeat. Designed to look elegant everywhere your day takes you...." },
];

export default function AdClonePage() {
  const navigate = useNavigate();
  const [rightTab, setRightTab] = useState<RightTab>("trending");
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [adSearch, setAdSearch] = useState("");
  const [aspectRatio, setAspectRatio] = useState("9x16");
  const [language, setLanguage] = useState("original");
  const [uploadedAdUrl, setUploadedAdUrl] = useState("");
  const { analyzeAd, isAnalyzing, result } = useAdClone();

  const handleBack = () => navigate("/dashboard/studio");
  const handleSyncBusiness = () => navigate("/dashboard/my-business");

  const handleGenerate = async () => {
    if (!uploadedAdUrl) return;
    await analyzeAd(uploadedAdUrl);
  };

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden" style={{ background: "#08120D" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Studio
          </button>
          <span className="text-lg font-bold text-foreground">Ad Clone</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="h-3.5 w-3.5" /> Feedback
          </button>
          <CreditBadge />
        </div>
      </div>

      {/* Main content — two panels */}
      <div className="flex-1 min-h-0 flex gap-0 px-4 pb-0 overflow-hidden">
        {/* LEFT PANEL — Select Product */}
        <div className="w-[35%] min-w-[280px] flex flex-col border border-border/40 rounded-xl bg-card/40 mr-3 overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <h2 className="text-base font-bold text-foreground">Select Product</h2>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 px-5 pb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search by product name ..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                className="w-full h-9 rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
            </div>
            <button onClick={() => setAddProductOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-accent/60 px-3 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors whitespace-nowrap">
              <Plus className="h-3.5 w-3.5" /> New product
            </button>
          </div>

          {/* Analysis result display */}
          {result && (
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-accent text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Analysis Complete
                </div>
                {result.analysis.headline && (
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">Headline:</span> {result.analysis.headline}</p>
                )}
                {result.analysis.offer && (
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">Offer:</span> {result.analysis.offer}</p>
                )}
                {result.analysis.cta_text && (
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">CTA:</span> {result.analysis.cta_text}</p>
                )}
                {result.analysis.format && (
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">Format:</span> {result.analysis.format}</p>
                )}
                {result.analysis.style_notes && (
                  <p className="text-sm text-foreground"><span className="text-muted-foreground">Style:</span> {result.analysis.style_notes}</p>
                )}
                {result.analysis.colors && result.analysis.colors.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">Colors:</span>
                    {result.analysis.colors.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-muted/30 text-xs text-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              {result.variations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Generated Variations</p>
                  {result.variations.map((v, i) => (
                    <div key={i} className="rounded-lg border border-border/30 bg-card/30 p-3">
                      <p className="text-xs text-muted-foreground">Variation {v.variation_index + 1}</p>
                      {v.file_url ? (
                        <img src={v.file_url} alt={`Variation ${i + 1}`} className="mt-2 rounded-lg w-full object-contain max-h-48" />
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">Image generation in progress or unavailable</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!result && <div className="flex-1 overflow-y-auto px-5 pb-4" />}
        </div>

        {/* RIGHT PANEL — Choose Reference Ad */}
        <div className="flex-1 min-w-0 flex flex-col border border-border/40 rounded-xl bg-card/40 overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3">
            <h2 className="text-base font-bold text-foreground">Choose Reference Ad</h2>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="px-5 pb-3">
            <div className="flex rounded-lg border border-border/40 overflow-hidden">
              <button onClick={() => setRightTab("trending")}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${rightTab === "trending" ? "bg-accent/20 text-foreground border border-accent/50 rounded-lg" : "text-muted-foreground hover:text-foreground"}`}>
                Choose from Trending Ads
              </button>
              <button onClick={() => setRightTab("upload")}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${rightTab === "upload" ? "bg-accent/20 text-foreground border border-accent/50 rounded-lg" : "text-muted-foreground hover:text-foreground"}`}>
                Upload Image/URL
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
            {rightTab === "trending" && <TrendingAdsTab search={adSearch} onSearchChange={setAdSearch} />}
            {rightTab === "upload" && <UploadAdTab adUrl={uploadedAdUrl} onUrlChange={setUploadedAdUrl} />}
          </div>
        </div>
      </div>

      {/* BOTTOM STICKY BAR */}
      <div className="shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-3 gap-3">
          <div className="flex items-center gap-3">
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="w-[130px] h-9 rounded-lg bg-card border-border/60 text-xs font-medium"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="9x16">9x16</SelectItem>
                <SelectItem value="16x9">16x9</SelectItem>
                <SelectItem value="1x1">1x1</SelectItem>
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[170px] h-9 rounded-lg bg-card border-border/60 text-xs font-medium"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="original">Original Language</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!uploadedAdUrl || isAnalyzing}
              className={`h-10 rounded-lg bg-accent text-accent-foreground text-sm font-semibold px-6 flex items-center gap-2 transition-opacity ${!uploadedAdUrl || isAnalyzing ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
            >
              {isAnalyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</> : "Generate cloned ad (3 credits/5s)"}
            </button>
            <span className="text-xs text-accent flex items-center gap-1">⚡ First time free for videos under 60 seconds</span>
          </div>
        </div>
      </div>

      <AddProductModal open={addProductOpen} onClose={() => setAddProductOpen(false)} onSyncBusiness={handleSyncBusiness} />
    </div>
  );
}

/* ─── Trending Ads sub-tab ─── */
function TrendingAdsTab({ search, onSearchChange }: { search: string; onSearchChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search" value={search} onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 rounded-lg border border-border/40 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50" />
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Bookmark className="h-4 w-4" /> Saved ads
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRENDING_VIDEOS.map((item, i) => (
          <TrendingAdCardEmpty key={i} videoSrc={item.video} name={item.name} desc={item.desc} />
        ))}
      </div>
    </div>
  );
}

function TrendingAdCardEmpty({ videoSrc, name, desc }: { videoSrc?: string; name?: string; desc?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex flex-col rounded-xl border border-border/30 bg-card/30 overflow-hidden">
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div className="h-7 w-7 rounded-full bg-muted/40 shrink-0" />
        <p className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">{name || ""}</p>
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" /> NEW
        </span>
        <Bookmark className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      {desc && <p className="px-3 py-1.5 text-xs text-muted-foreground line-clamp-2">{desc}</p>}
      <div className="mx-3 mb-2 aspect-[9/16] rounded-lg bg-muted/10 border border-border/20 overflow-hidden">
        {videoSrc && <video src={videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover" />}
      </div>
      <div className="flex items-center gap-2 px-3 pb-3 relative">
        <button disabled className="flex-1 h-8 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground cursor-not-allowed">Clone this ad</button>
        <button onClick={() => setMenuOpen(!menuOpen)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 bottom-12 z-50 w-44 rounded-xl border border-border/40 bg-card shadow-xl py-1.5">
              <button onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors">
                <Eye className="h-4 w-4" /> View insights
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Upload Ad sub-tab (image URL input) ─── */
function UploadAdTab({ adUrl, onUrlChange }: { adUrl: string; onUrlChange: (v: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-full max-w-md space-y-4">
        <div className="w-full min-h-[200px] rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-3">
          <UploadIcon className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Paste an ad image URL below</p>
        </div>
        <input
          type="url"
          placeholder="https://example.com/ad-image.jpg"
          value={adUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full h-10 rounded-lg border border-border/40 bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        {adUrl && (
          <div className="rounded-lg border border-border/30 overflow-hidden">
            <img src={adUrl} alt="Ad preview" className="w-full max-h-64 object-contain bg-muted/10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
      </div>
    </div>
  );
}
