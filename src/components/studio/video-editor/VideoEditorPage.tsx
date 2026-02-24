import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, User, Smile, Captions, Upload, Shapes, Type, Music, MousePointerClick,
  Search, MoreHorizontal, ChevronRight, ChevronLeft, Plus, Play, Trash2, Undo2, Redo2,
  Keyboard, MessageSquareText, Clock, MoreVertical, X, Sparkles, Maximize2,
  Scissors, ArrowLeftToLine, ArrowRightToLine, ZoomIn, ZoomOut, Smartphone,
  Square, CloudUpload, RefreshCw, Filter, SlidersHorizontal, Bookmark, Check,
  Crown, ChevronDown, Info, ArrowLeft, Copy, FolderOpen, LayoutTemplate, MicOff, ListOrdered, CopyPlus,
  Download, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useVideoRender } from "@/hooks/useVideoRender";
import yanguLogo from "@/assets/yangu-y-icon.png";

const REALISTIC_AVATARS = [
  { id: "sp4", name: "Avatar 1", video: "/avatars/sp_4.mp4" },
  { id: "sp2", name: "Avatar 2", video: "/avatars/sp_2-2.mp4" },
  { id: "sp6", name: "Avatar 3", video: "/avatars/sp_6-2.mp4" },
  { id: "sp9", name: "Avatar 4", video: "/avatars/sp_9-2.mp4" },
  { id: "sp14", name: "Avatar 5", video: "/avatars/sp_14.mp4" },
  { id: "sp1", name: "Avatar 6", video: "/avatars/sp_1-2.mp4" },
  { id: "sp3", name: "Avatar 7", video: "/avatars/sp_3-2.mp4" },
  { id: "sp5", name: "Avatar 8", video: "/avatars/sp_5-2.mp4" },
  { id: "sp7", name: "Avatar 9", video: "/avatars/sp_7-2.mp4" },
  { id: "sp8", name: "Avatar 10", video: "/avatars/sp_8-2.mp4" },
  { id: "sp10", name: "Avatar 11", video: "/avatars/sp_10-2.mp4" },
  { id: "sp11", name: "Avatar 12", video: "/avatars/sp_11-2.mp4" },
  { id: "sp12", name: "Avatar 13", video: "/avatars/sp_12-2.mp4" },
  { id: "sp13", name: "Avatar 14", video: "/avatars/sp_13.mp4" },
  { id: "sp18", name: "Avatar 15", video: "/avatars/sp_18.mp4" },
  { id: "sp15", name: "Avatar 16", video: "/avatars/sp_15.mp4" },
  { id: "sp16", name: "Avatar 17", video: "/avatars/sp_16.mp4" },
  { id: "sp17", name: "Avatar 18", video: "/avatars/sp_17.mp4" },
  { id: "sp19", name: "Avatar 19", video: "/avatars/sp_19.mp4" },
  { id: "sp-2", name: "Avatar 20", video: "/avatars/sp-2.mp4" },
];

const STYLED_AVATARS = [
  { id: "st1", name: "Styled 1", video: "/avatars/styled/sp_1.mp4" },
  { id: "st2", name: "Styled 2", video: "/avatars/styled/sp_2.mp4" },
  { id: "st4", name: "Styled 3", video: "/avatars/styled/sp_4.mp4" },
  { id: "st5", name: "Styled 4", video: "/avatars/styled/sp_5.mp4" },
  { id: "st6", name: "Styled 5", video: "/avatars/styled/sp_6.mp4" },
  { id: "st7", name: "Styled 6", video: "/avatars/styled/sp_7.mp4" },
  { id: "st8", name: "Styled 7", video: "/avatars/styled/sp_8.mp4" },
  { id: "st9", name: "Styled 8", video: "/avatars/styled/sp_9.mp4" },
  { id: "st10", name: "Styled 9", video: "/avatars/styled/sp_10.mp4" },
  { id: "st20", name: "Styled 10", video: "/avatars/styled/sp_20.mp4" },
];

type NavItem = "script" | "avatars" | "emotions" | "captions" | "assets" | "elements" | "text" | "audio" | "cta";

const NAV_ITEMS: { key: NavItem; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: "script", label: "Script", icon: FileText },
  { key: "avatars", label: "Avatars", icon: User },
  { key: "emotions", label: "Emotions", icon: Smile },
  { key: "captions", label: "Captions", icon: Captions },
  { key: "assets", label: "Assets", icon: CloudUpload, badge: "New" },
  { key: "elements", label: "Elements", icon: Shapes },
  { key: "text", label: "Text", icon: Type },
  { key: "audio", label: "Audio", icon: Music },
  { key: "cta", label: "CTA", icon: MousePointerClick },
];

/* ─── LEFT PANEL CONTENT PER NAV ─── */

function ScriptPanel() {
  const [showScriptMenu, setShowScriptMenu] = useState(false);
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Script</h2>
      <div className="border-t border-dashed border-border/30" />
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-muted/30 text-sm text-foreground">Scene 1</span>
        <div className="relative">
          <button className="p-1 rounded hover:bg-muted/20" onClick={() => setShowScriptMenu(!showScriptMenu)}>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
          {showScriptMenu && (
            <div className="absolute top-full right-0 mt-1 w-44 rounded-xl bg-card border border-border/30 shadow-xl z-50 py-1.5 overflow-hidden">
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/20 transition-colors" onClick={() => setShowScriptMenu(false)}>
                <CopyPlus className="h-4 w-4 text-muted-foreground" /> Duplicate
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/20 transition-colors" onClick={() => setShowScriptMenu(false)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <textarea
        placeholder="Enter script ..."
        className="w-full h-32 rounded-lg bg-transparent border-l-2 border-accent p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none"
      />
      {/* Toolbar row */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
          <Play className="h-4 w-4 text-foreground" />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/20 hover:bg-muted/30 text-sm text-foreground transition-colors">
          V3 <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
          <ListOrdered className="h-4 w-4 text-foreground" />
        </button>
        <button className="p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
          <MoreVertical className="h-4 w-4 text-foreground" />
        </button>
      </div>
      {/* Status row */}
      <div className="flex items-center gap-3">
        <button className="p-1.5 rounded hover:bg-muted/20"><Clock className="h-4 w-4 text-muted-foreground" /></button>
        <button className="p-1.5 rounded hover:bg-muted/20"><RefreshCw className="h-4 w-4 text-muted-foreground" /></button>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/20 text-xs text-muted-foreground">
          <MicOff className="h-3.5 w-3.5" /> OFF
        </div>
      </div>
      <div className="border-t border-dashed border-border/30" />
    </div>
  );
}

function AvatarsPanel({ onSelectAvatar }: { onSelectAvatar: (avatar: typeof REALISTIC_AVATARS[0]) => void }) {
  const [avatarTab, setAvatarTab] = useState<"realistic" | "styled" | "custom">("realistic");
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Avatar</h2>
      <div className="flex items-center gap-4">
        {([["realistic","Realistic"],["styled","Styled"],["custom","Custom"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setAvatarTab(key)} className={`text-sm font-medium pb-1 border-b-2 transition-colors ${avatarTab === key ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"}`}>{label}</button>
        ))}
        <div className="flex-1" />
        <button className="p-1 rounded hover:bg-muted/20"><Filter className="h-4 w-4 text-muted-foreground" /></button>
        <button className="p-1 rounded hover:bg-muted/20"><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /></button>
        <button className="p-1 rounded hover:bg-muted/20"><SlidersHorizontal className="h-4 w-4 text-muted-foreground rotate-90" /></button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Search avatars by keyword ..." className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/10 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
      </div>
      {avatarTab === "realistic" ? (
        <div className="grid grid-cols-2 gap-3">
          {REALISTIC_AVATARS.map((avatar) => (
            <AvatarVideoCard key={avatar.id} avatar={avatar} onClick={() => onSelectAvatar(avatar)} />
          ))}
        </div>
      ) : avatarTab === "styled" ? (
        <div className="grid grid-cols-2 gap-3">
          {STYLED_AVATARS.map((avatar) => (
            <AvatarVideoCard key={avatar.id} avatar={avatar} onClick={() => onSelectAvatar(avatar)} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 min-h-[200px]" />
      )}
    </div>
  );
}

function AvatarVideoCard({ avatar, onClick }: { avatar: typeof REALISTIC_AVATARS[0]; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
      className="relative rounded-lg overflow-hidden aspect-[3/4] bg-muted/10 border border-border/20 hover:border-primary/40 transition-colors group"
    >
      <video
        ref={videoRef}
        src={avatar.video}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
      <div className="absolute top-1.5 right-1.5">
        <Crown className="h-4 w-4 text-amber-400" />
      </div>
    </button>
  );
}

/* ── PREVIEW DIALOG ── */
function AvatarPreviewDialog({ avatar, open, onClose, onApply }: {
  avatar: typeof REALISTIC_AVATARS[0] | null;
  open: boolean;
  onClose: () => void;
  onApply: (mode: "scene" | "all") => void;
}) {
  if (!avatar) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border/30 p-6 gap-4">
        <h2 className="text-lg font-semibold text-foreground">Preview</h2>
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <video src={avatar.video} autoPlay loop muted playsInline className="h-full object-contain" />
        </div>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button onClick={() => onApply("scene")} className="px-5 py-2.5 rounded-lg bg-muted/30 border border-border/20 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
            Apply to this scene
          </button>
          <button onClick={() => onApply("all")} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Apply to all scenes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── UPGRADE DIALOG ── */
function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl bg-card border-border/30 p-0 gap-0 overflow-hidden">
        <div className="flex min-h-[520px]">
          {/* Left pricing */}
          <div className="flex-1 p-8 flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-foreground">Unlock Premium Avatar</h2>
            <p className="text-sm text-muted-foreground">Upgrade to Pro and access a growing library of 1,500+ premium avatars, optimized and updated regularly to maximize creative results.</p>

            <div className="flex rounded-full overflow-hidden border border-border/20">
              <button onClick={() => setBilling("monthly")} className={`flex-1 py-2 text-sm font-medium transition-colors ${billing === "monthly" ? "bg-muted/30 text-foreground" : "text-muted-foreground"}`}>Monthly</button>
              <button onClick={() => setBilling("yearly")} className={`flex-1 py-2 text-sm font-medium transition-colors ${billing === "yearly" ? "bg-muted/30 text-foreground" : "text-muted-foreground"}`}>Yearly (50% OFF)</button>
            </div>

            <div className="rounded-xl border border-border/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Pro Plan ({billing === "yearly" ? "Yearly" : "Monthly"})</span>
                <span className="text-sm text-foreground">{billing === "yearly" ? "$588/year" : "$98/mo"}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Upgrade now to start using Pro features right away.</p>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/20">
              <span className="text-amber-400">🟠</span>
              <span className="text-sm text-foreground">{billing === "yearly" ? "2,400 Credits (≈ 480 videos) / yr" : "200 Credits (≈ 40 videos) / mo"}</span>
              <div className="flex-1" />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">What's changing in your plan</span>
                <a href="#" className="text-xs text-primary hover:underline">Plan Benefits</a>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Plan:</span><span>Free (Monthly) → Pro ({billing === "yearly" ? "Yearly" : "Monthly"})</span></div>
                <div className="flex justify-between"><span>Credits:</span><span>10 Credits / mo → {billing === "yearly" ? "200 Credits / mo" : "200 Credits / mo"}</span></div>
                <div className="flex justify-between"><span>Price:</span><span>$0 USD / mo → {billing === "yearly" ? "$588 USD / year" : "$98 USD / mo"}</span></div>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">Cancel anytime</p>
            </div>

            <div className="flex items-center justify-between border-t border-border/20 pt-3">
              <span className="text-sm font-semibold text-foreground">Amount due</span>
              <span className="text-sm font-semibold text-foreground flex items-center gap-1">{billing === "yearly" ? "$588" : "$98"} <Info className="h-3.5 w-3.5 text-muted-foreground" /></span>
            </div>

            <Button variant="accent" className="w-full">Upgrade</Button>
            <p className="text-[10px] text-muted-foreground text-center">By clicking "Upgrade", you agree to our <a href="#" className="underline">Terms of Service</a>.</p>
          </div>

          {/* Right visual */}
          <div className="w-[380px] bg-muted/5 p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {REALISTIC_AVATARS.slice(0, 3).map((a) => (
                <div key={a.id} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/10">
                  <video src={a.video} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <h3 className="text-xl font-bold text-foreground text-center">Why users love Premium Avatars</h3>
            <div className="space-y-3 text-sm text-muted-foreground italic">
              <p>"Data shows that premium avatars deliver up to 1.5X higher ad engagement rates."</p>
              <p>"Unlock exclusive avatars with diverse voices, languages, and accents."</p>
              <p>"Create higher-quality visuals that convert better and scale campaigns faster."</p>
              <p>"Join thousands of marketers who've upgraded for industry-leading ROI."</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-auto">
              {REALISTIC_AVATARS.slice(2, 5).map((a) => (
                <div key={a.id} className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/10">
                  <video src={a.video} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmotionsPanel() {
  const tags = ["All", "Surprised with phone", "Surprised", "Thinking of an idea", "Happy", "Shock", "Worried", "It's a secret", "Looking up", "Wow"];
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Emotions</h2>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search avatars by name ..." className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/10 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
        </div>
        <button className="p-2 rounded-lg border border-border/20 hover:bg-muted/20"><Filter className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <button key={t} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted/20 text-foreground hover:bg-muted/30 border border-border/20"}`}>{t}</button>
        ))}
      </div>
      {/* EMPTY grid container */}
      <div className="grid grid-cols-2 gap-3 min-h-[200px]" />
    </div>
  );
}

function CaptionsPanel() {
  const [captionTab, setCaptionTab] = useState<"style" | "content">("style");
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Captions</h2>
      <div className="flex rounded-lg overflow-hidden border border-border/20">
        <button onClick={() => setCaptionTab("style")} className={`flex-1 py-2 text-sm font-medium transition-colors ${captionTab === "style" ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Style</button>
        <button onClick={() => setCaptionTab("content")} className={`flex-1 py-2 text-sm font-medium transition-colors ${captionTab === "content" ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Content</button>
      </div>
      {captionTab === "style" && (
        <>
          <p className="text-sm text-muted-foreground">Presets</p>
          {/* EMPTY presets list container */}
          <div className="flex flex-col gap-3 min-h-[200px]" />
        </>
      )}
      {captionTab === "content" && (
        <div className="min-h-[200px]" />
      )}
    </div>
  );
}

const STOCK_FOOTAGE = [
  { id: "sf1", video: "/stock-footage/sf_1.mp4", duration: "00:06" },
  { id: "sf2", video: "/stock-footage/sf_2.mp4", duration: "00:20" },
  { id: "sf3", video: "/stock-footage/sf_3.mp4", duration: "00:10" },
  { id: "sf4", video: "/stock-footage/sf_4.mp4", duration: "00:14" },
  { id: "sf5", video: "/stock-footage/sf_5.mp4", duration: "00:09" },
];

const STOCK_IMAGES = [
  { id: "si1", image: "/stock-footage/si_1.jpeg" },
  { id: "si2", image: "/stock-footage/si_2.jpeg" },
  { id: "si3", image: "/stock-footage/si_3.jpeg" },
  { id: "si4", image: "/stock-footage/si_4.jpeg" },
];

function StockFootageCard({ item, onClick }: { item: typeof STOCK_FOOTAGE[0]; onClick: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
      className="relative rounded-lg overflow-hidden aspect-[3/4] bg-muted/10 border border-border/20 hover:border-primary/40 transition-colors group"
    >
      <video ref={videoRef} src={item.video} muted loop playsInline preload="metadata" className="w-full h-full object-cover" />
      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">{item.duration}</div>
    </button>
  );
}

function StockImageCard({ item, onClick }: { item: typeof STOCK_IMAGES[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-lg overflow-hidden aspect-[3/4] bg-muted/10 border border-border/20 hover:border-primary/40 transition-colors group"
    >
      <img src={item.image} alt="" className="w-full h-full object-cover" />
    </button>
  );
}

type PreviewMediaItem = { id: string; type: "video"; video: string; duration: string } | { id: string; type: "image"; image: string };

function MediaPreviewDialog({ item, open, onClose, onNavigate }: {
  item: PreviewMediaItem | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (dir: 1 | -1) => void;
}) {
  if (!item) return null;
  const isVideo = item.type === "video";
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border/30 p-6 gap-4">
        <h2 className="text-lg font-semibold text-foreground">Preview</h2>
        <div className="relative w-full flex items-center justify-center">
          <button onClick={() => onNavigate(-1)} className="absolute left-2 p-2 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors z-10">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="w-full max-w-[360px] aspect-[9/16] bg-black rounded-lg overflow-hidden">
            {isVideo ? (
              <video src={(item as any).video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={(item as any).image} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <button onClick={() => onNavigate(1)} className="absolute right-2 p-2 rounded-full bg-muted/40 hover:bg-muted/60 transition-colors z-10">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-muted/30 border border-border/20 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
            {isVideo ? "Crop & Trim video" : "Crop image"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Add to scene
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssetsPanel() {
  const [stockExpanded, setStockExpanded] = useState(false);
  const [stockTab, setStockTab] = useState<"videos" | "images">("videos");
  const [previewItem, setPreviewItem] = useState<PreviewMediaItem | null>(null);
  const [showStockPreview, setShowStockPreview] = useState(false);

  const allMedia: PreviewMediaItem[] = stockTab === "videos"
    ? STOCK_FOOTAGE.map(f => ({ ...f, type: "video" as const }))
    : STOCK_IMAGES.map(i => ({ ...i, type: "image" as const }));

  const handleNavigate = (dir: 1 | -1) => {
    if (!previewItem) return;
    const idx = allMedia.findIndex(i => i.id === previewItem.id);
    const next = (idx + dir + allMedia.length) % allMedia.length;
    setPreviewItem(allMedia[next]);
  };

  if (stockExpanded) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setStockExpanded(false)} className="p-1 rounded hover:bg-muted/20">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">Stock Footage</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search" className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/10 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
        </div>
        <div className="flex rounded-lg overflow-hidden border border-border/20">
          <button onClick={() => setStockTab("videos")} className={`flex-1 py-2 text-sm font-medium transition-colors ${stockTab === "videos" ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Videos</button>
          <button onClick={() => setStockTab("images")} className={`flex-1 py-2 text-sm font-medium transition-colors ${stockTab === "images" ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Images</button>
        </div>
        {stockTab === "videos" ? (
          <div className="grid grid-cols-2 gap-3">
            {STOCK_FOOTAGE.map((item) => (
              <StockFootageCard key={item.id} item={item} onClick={() => { setPreviewItem({ ...item, type: "video" }); setShowStockPreview(true); }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {STOCK_IMAGES.map((item) => (
              <StockImageCard key={item.id} item={item} onClick={() => { setPreviewItem({ ...item, type: "image" }); setShowStockPreview(true); }} />
            ))}
          </div>
        )}
        <MediaPreviewDialog
          item={previewItem}
          open={showStockPreview}
          onClose={() => setShowStockPreview(false)}
          onNavigate={handleNavigate}
        />
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Assets</h2>
      <div className="flex gap-2">
        <Button variant="accent" size="sm" className="flex-1 gap-1.5">
          <Sparkles className="h-4 w-4" /> AI Generate
          <span className="ml-1 text-[10px] font-bold text-green-500">New</span>
        </Button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border/20 text-sm text-foreground hover:bg-muted/20 transition-colors">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Product Assets</p>
        <button className="text-xs text-accent hover:text-accent/80 font-medium shrink-0 transition-colors">See all</button>
      </div>
      <div className="min-h-[80px]" />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Stock Footage</p>
        <button onClick={() => setStockExpanded(true)} className="text-xs text-accent hover:text-accent/80 font-medium shrink-0 transition-colors">See all</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {STOCK_FOOTAGE.slice(0, 3).map((item) => (
          <div key={item.id} className="w-[100px] shrink-0">
            <StockFootageCard item={item} onClick={() => { setPreviewItem({ ...item, type: "video" }); setShowStockPreview(true); }} />
          </div>
        ))}
        <button onClick={() => setStockExpanded(true)} className="w-8 shrink-0 flex items-center justify-center rounded-lg bg-muted/10 hover:bg-muted/20 border border-border/20">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <MediaPreviewDialog
        item={previewItem}
        open={showStockPreview}
        onClose={() => setShowStockPreview(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

function ElementsPanel() {
  const sections = ["Shapes", "Effect overlay", "Emoji group", "Pets group", "Animated group", "Emotes group"];
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Elements</h2>
      {sections.map((s) => (
        <div key={s}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">{s}</p>
            <span className="text-xs text-muted-foreground">See all</span>
          </div>
          {/* EMPTY row container with right arrow */}
          <div className="flex items-center gap-2 min-h-[80px]">
            <div className="flex-1" />
            <button className="p-1 rounded-full bg-muted/20 hover:bg-muted/30"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextPanel() {
  const items = ["Headline", "Subheadline", "Body Text", "Description"];
  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Text</h2>
      {items.map((t) => (
        <button key={t} className="w-full py-4 rounded-lg border border-border/20 bg-muted/10 text-foreground font-semibold text-center hover:bg-muted/20 transition-colors" style={{ fontSize: t === "Headline" ? 20 : t === "Subheadline" ? 17 : 14 }}>
          {t}
        </button>
      ))}
    </div>
  );
}

function AudioPanel() {
  const [audioTab, setAudioTab] = useState<"library" | "effects" | "my">("library");
  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Music</h2>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/20 text-sm text-foreground hover:bg-muted/20 transition-colors">
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
      </div>
      {/* Generate Music card */}
      <div className="rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-border/20 p-6 flex items-center justify-center cursor-pointer hover:from-primary/30 transition-colors">
        <span className="text-sm font-medium text-foreground">Generate Music <ChevronRight className="inline h-4 w-4" /></span>
      </div>
      <div className="flex items-center gap-4">
        {(["Library", "Sound effects", "My music"] as const).map((t, i) => {
          const key = i === 0 ? "library" : i === 1 ? "effects" : "my";
          return (
            <button key={t} onClick={() => setAudioTab(key as any)} className={`text-sm font-medium pb-1 border-b-2 transition-colors ${audioTab === key ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"}`}>{t}</button>
          );
        })}
        <div className="flex-1" />
        <button className="p-1 rounded hover:bg-muted/20"><Bookmark className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      {audioTab === "library" && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Search" className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/10 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", "Jazz", "Dance", "Instrumental"].map((g, i) => (
              <button key={g} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted/20 text-foreground border border-border/20 hover:bg-muted/30"}`}>{g}</button>
            ))}
            <button className="p-1 rounded-full bg-muted/20 hover:bg-muted/30"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
          {/* EMPTY list container */}
          <div className="flex flex-col gap-2 min-h-[200px]" />
        </>
      )}
    </div>
  );
}

function CtaPanel() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">CTA</h2>
      {/* EMPTY grid container */}
      <div className="grid grid-cols-2 gap-3 min-h-[200px]" />
    </div>
  );
}

/* ─── MAIN PAGE ─── */

export default function VideoEditorPage() {
  const [activeNav, setActiveNav] = useState<NavItem>("script");
  const [previewMode, setPreviewMode] = useState<"portrait" | "background">("portrait");
  const [showAvatar, setShowAvatar] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<typeof REALISTIC_AVATARS[0] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showRenderDialog, setShowRenderDialog] = useState(false);
  const [tooltipId, setTooltipId] = useState<string | null>(null);
  const { status: renderStatus, videoUrl, error: renderError, progress, startRender, reset: resetRender } = useVideoRender();

  const handleSelectAvatar = (avatar: typeof REALISTIC_AVATARS[0]) => {
    setSelectedAvatar(avatar);
    setShowPreview(true);
  };

  const handleApply = () => {
    setShowPreview(false);
    setShowUpgrade(true);
  };

  const panelMap: Record<NavItem, React.ReactNode> = {
    script: <ScriptPanel />,
    avatars: <AvatarsPanel onSelectAvatar={handleSelectAvatar} />,
    emotions: <EmotionsPanel />,
    captions: <CaptionsPanel />,
    assets: <AssetsPanel />,
    elements: <ElementsPanel />,
    text: <TextPanel />,
    audio: <AudioPanel />,
    cta: <CtaPanel />,
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ background: "#08120D" }}>
      {/* ═══ TOP BAR ═══ */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border/20 shrink-0">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/dashboard/studio")}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded hover:bg-muted/20" title="Undo"><Undo2 className="h-4 w-4 text-muted-foreground" /></button>
          <button className="p-2 rounded hover:bg-muted/20" title="Redo"><Redo2 className="h-4 w-4 text-muted-foreground" /></button>
          <div className="w-px h-5 bg-border/20 mx-1" />
          {[
            { id: "shortcut", icon: Keyboard, label: "Shortcut" },
            { id: "feedback", icon: MessageSquareText, label: "Feedback" },
            { id: "version", icon: Clock, label: "Version History" },
          ].map((item) => (
            <div key={item.id} className="relative">
              <button
                className="p-2 rounded hover:bg-muted/20"
                onMouseEnter={() => setTooltipId(item.id)}
                onMouseLeave={() => setTooltipId(null)}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </button>
              {tooltipId === item.id && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-1.5 rounded-lg bg-muted/80 backdrop-blur text-xs text-foreground whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </div>
          ))}
          <div className="relative">
            <button
              className="p-2 rounded hover:bg-muted/20"
              onMouseEnter={() => setTooltipId("more")}
              onMouseLeave={() => setTooltipId(null)}
              onClick={() => setTooltipId(tooltipId === "more-menu" ? null : "more-menu")}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {tooltipId === "more" && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-1.5 rounded-lg bg-muted/80 backdrop-blur text-xs text-foreground whitespace-nowrap z-50 pointer-events-none">
                More
              </div>
            )}
            {tooltipId === "more-menu" && (
              <div className="absolute top-full right-0 mt-1 w-48 rounded-xl bg-card border border-border/30 shadow-xl z-50 py-1.5 overflow-hidden">
                {[
                  { icon: LayoutTemplate, label: "Save as Template" },
                  { icon: Copy, label: "Duplicate" },
                  { icon: FolderOpen, label: "Move" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/20 transition-colors"
                    onClick={() => setTooltipId(null)}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-full border border-border/30 bg-muted/10 text-sm">
            <span className="text-amber-400">🟠</span>
            <span className="text-foreground font-medium">9 credits</span>
            <span className="text-muted-foreground">Upgrade</span>
          </div>
          <Button variant="accent" size="sm" className="ml-2 gap-1.5" onClick={() => {
            if (renderStatus === "idle" || renderStatus === "failed") {
              setShowRenderDialog(true);
            }
          }} disabled={renderStatus === "starting" || renderStatus === "processing"}>
            {renderStatus === "processing" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Rendering...</>
            ) : renderStatus === "completed" ? (
              <><Download className="h-4 w-4" /> Download</>
            ) : (
              <><Check className="h-4 w-4" /> Render</>
            )}
          </Button>
        </div>
      </div>

      {/* ═══ MAIN BODY ═══ */}
      <div className="flex flex-1 min-h-0">
        {/* ─── LEFT NAV RAIL ─── */}
        <div className="w-[68px] flex flex-col items-center py-3 gap-1 border-r border-border/20 shrink-0 overflow-y-auto">
          <div className="mb-3">
            <img src={yanguLogo} alt="Yangu" className="h-8 w-8" />
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`relative flex flex-col items-center gap-0.5 w-14 py-2 rounded-lg text-[11px] transition-colors ${active ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/10"}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-0.5 right-1 px-1 py-px rounded text-[8px] font-bold bg-green-500 text-white">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── LEFT PANEL ─── */}
        <div className="w-[320px] border-r border-border/20 shrink-0 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {panelMap[activeNav]}
          </div>
        </div>

        {/* ─── CENTER + RIGHT ─── */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex flex-1 min-h-0">
            {/* CENTER PREVIEW */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 min-w-0">
              {/* Empty black canvas container */}
              <div className="w-full max-w-[340px] aspect-[9/16] bg-black rounded-lg" />
              {/* Toggle pills */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode("portrait")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${previewMode === "portrait" ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Smartphone className="h-4 w-4" /> Portrait <span className="text-muted-foreground text-xs">(9:16)</span>
                </button>
                <button
                  onClick={() => setPreviewMode("background")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${previewMode === "background" ? "bg-muted/30 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Square className="h-4 w-4" /> Background
                </button>
              </div>
            </div>

            {/* ─── RIGHT PANEL — SCENE ─── */}
            <div className="w-[260px] border-l border-border/20 p-5 shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Scene</h3>
                <button className="p-1 rounded hover:bg-muted/20"><X className="h-5 w-5 text-muted-foreground" /></button>
              </div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-sm text-foreground">Show avatar</span>
                <Switch checked={showAvatar} onCheckedChange={setShowAvatar} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Show captions</span>
                <Switch checked={showCaptions} onCheckedChange={setShowCaptions} />
              </div>
            </div>
          </div>

          {/* ═══ TIMELINE ═══ */}
          <div className="border-t border-border/20 shrink-0">
            {/* Timeline toolbar */}
            <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/10">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                <Maximize2 className="h-3.5 w-3.5" /> Expand scene
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 text-xs text-foreground hover:bg-muted/20 rounded transition-colors">
                <Scissors className="h-3.5 w-3.5" /> Split
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 text-xs text-foreground hover:bg-muted/20 rounded transition-colors">
                <ArrowLeftToLine className="h-3.5 w-3.5" /> Delete left
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 text-xs text-foreground hover:bg-muted/20 rounded transition-colors">
                <ArrowRightToLine className="h-3.5 w-3.5" /> Delete right
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground/50 rounded cursor-default">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button className="p-1.5 rounded hover:bg-muted/20 ml-1"><Play className="h-4 w-4 text-foreground" /></button>
              <span className="text-xs text-foreground font-mono ml-2">00:00.3</span>
              <span className="text-xs text-muted-foreground font-mono ml-1">00:10.0</span>
              <div className="flex-1" />
              <button className="p-1 rounded hover:bg-muted/20"><ZoomOut className="h-4 w-4 text-muted-foreground" /></button>
              <input type="range" className="w-24 accent-primary mx-1" defaultValue={50} />
              <button className="p-1 rounded hover:bg-muted/20"><ZoomIn className="h-4 w-4 text-muted-foreground" /></button>
              <span className="text-xs text-muted-foreground ml-1">Fit</span>
            </div>

            {/* Timeline tracks */}
            <div className="relative h-[140px] overflow-x-auto">
              {/* Time ruler */}
              <div className="h-5 flex items-end px-[60px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1 text-[10px] text-muted-foreground/60 border-l border-border/10 pl-1">{i}s</div>
                ))}
              </div>

              {/* Caption track */}
              <div className="flex items-center h-6">
                <span className="w-[60px] shrink-0 text-[11px] text-muted-foreground px-3">Caption</span>
                <div className="flex-1 h-full border-b border-border/10" />
              </div>

              {/* Overlay track */}
              <div className="flex items-center h-6">
                <span className="w-[60px] shrink-0 text-[11px] text-muted-foreground px-3">Overlay</span>
                <div className="flex-1 h-full border-b border-border/10 flex items-center">
                  <span className="text-[10px] text-muted-foreground/40 ml-2">Allows elements to span across scenes.</span>
                </div>
              </div>

              {/* Scene track */}
              <div className="flex items-center h-10">
                <span className="w-[60px] shrink-0 text-[11px] text-muted-foreground px-3">Scene</span>
                <div className="flex-1 flex items-center h-full pr-14 relative">
                  <div className="absolute left-0 top-0 flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold -translate-y-1">1</div>
                  <div className="w-full h-8 rounded border-2 border-cyan-400/60 bg-muted/10" />
                  <span className="absolute right-16 bottom-0 text-[10px] text-muted-foreground">10s</span>
                </div>
                <button className="p-2 rounded-lg border border-border/20 hover:bg-muted/20 shrink-0 mr-2">
                  <Plus className="h-5 w-5 text-foreground" />
                </button>
              </div>

              {/* Music track */}
              <div className="flex items-center h-6">
                <span className="w-[60px] shrink-0 text-[11px] text-muted-foreground px-3">Music</span>
                <div className="flex-1 h-full flex items-center">
                  <button className="flex items-center gap-1 px-2 py-1 rounded bg-muted/20 text-[11px] text-foreground hover:bg-muted/30 transition-colors">
                    <Music className="h-3 w-3" /> Add music
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AvatarPreviewDialog
        avatar={selectedAvatar}
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onApply={handleApply}
      />
      <UpgradeDialog open={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* Render Dialog */}
      <Dialog open={showRenderDialog} onOpenChange={(v) => !v && setShowRenderDialog(false)}>
        <DialogContent className="max-w-md bg-card border-border/30 p-6 gap-4">
          <div className="flex flex-col items-center gap-4 text-center">
            {renderStatus === "idle" || renderStatus === "failed" ? (
              <>
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Render Video</h2>
                <p className="text-sm text-muted-foreground">
                  This will send your timeline to the rendering pipeline. The process typically takes 30-120 seconds.
                </p>
                {renderError && (
                  <p className="text-sm text-red-400">{renderError}</p>
                )}
                <div className="flex gap-3 mt-2">
                  <Button variant="outline" onClick={() => { resetRender(); setShowRenderDialog(false); }}>Cancel</Button>
                  <Button variant="accent" onClick={() => startRender({ title: "Video Editor Export" })}>
                    Start Render
                  </Button>
                </div>
              </>
            ) : renderStatus === "starting" || renderStatus === "processing" ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <h2 className="text-lg font-semibold text-foreground">Rendering...</h2>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">{progress}% — Please wait while your video is being rendered.</p>
              </>
            ) : renderStatus === "completed" && videoUrl ? (
              <>
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="h-7 w-7 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Render Complete!</h2>
                <p className="text-sm text-muted-foreground">Your video is ready to download.</p>
                <div className="flex gap-3 mt-2">
                  <Button variant="outline" onClick={() => { resetRender(); setShowRenderDialog(false); }}>Close</Button>
                  <Button variant="accent" asChild>
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-2" /> Download Video
                    </a>
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
