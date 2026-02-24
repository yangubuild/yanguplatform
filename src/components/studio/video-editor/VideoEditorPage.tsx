import { useState } from "react";
import {
  FileText, User, Smile, Captions, Upload, Shapes, Type, Music, MousePointerClick,
  Search, MoreHorizontal, ChevronRight, Plus, Play, Trash2, Undo2, Redo2,
  Keyboard, MessageSquareText, Clock, MoreVertical, X, Sparkles, Maximize2,
  Scissors, ArrowLeftToLine, ArrowRightToLine, ZoomIn, ZoomOut, Smartphone,
  Square, CloudUpload, RefreshCw, Filter, SlidersHorizontal, Bookmark, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import yanguLogo from "@/assets/yangu-y-icon.png";

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
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Script</h2>
      <div className="border-t border-dashed border-border/30" />
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-muted/30 text-sm text-foreground">Scene 1</span>
        <button className="p-1 rounded hover:bg-muted/20"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
      </div>
      <textarea
        placeholder="Enter script ..."
        className="w-full h-32 rounded-lg bg-muted/10 border border-border/20 p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/40"
      />
      <div className="border-t border-dashed border-border/30" />
    </div>
  );
}

function AvatarsPanel() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Avatar</h2>
      <div className="flex items-center gap-4">
        {["Realistic", "Styled", "Custom"].map((t, i) => (
          <button key={t} className={`text-sm font-medium pb-1 border-b-2 transition-colors ${i === 0 ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"}`}>{t}</button>
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
      {/* EMPTY grid container */}
      <div className="grid grid-cols-2 gap-3 min-h-[200px]" />
    </div>
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

function AssetsPanel() {
  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Assets</h2>
      <div className="flex gap-2">
        <Button variant="accent" size="sm" className="flex-1 gap-1.5">
          <Sparkles className="h-4 w-4" /> AI Generate
          <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500 text-white">New</span>
        </Button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border/20 text-sm text-foreground hover:bg-muted/20 transition-colors">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Product Assets</p>
        <span className="text-xs text-muted-foreground">See all</span>
      </div>
      {/* EMPTY container */}
      <div className="min-h-[80px]" />
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Stock Footage</p>
        <span className="text-xs text-muted-foreground">See all</span>
      </div>
      {/* EMPTY container */}
      <div className="min-h-[80px]" />
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

  const panelMap: Record<NavItem, React.ReactNode> = {
    script: <ScriptPanel />,
    avatars: <AvatarsPanel />,
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
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Default video</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded hover:bg-muted/20" title="Undo"><Undo2 className="h-4 w-4 text-muted-foreground" /></button>
          <button className="p-2 rounded hover:bg-muted/20" title="Redo"><Redo2 className="h-4 w-4 text-muted-foreground" /></button>
          <div className="w-px h-5 bg-border/20 mx-1" />
          <button className="p-2 rounded hover:bg-muted/20" title="Shortcut"><Keyboard className="h-4 w-4 text-muted-foreground" /></button>
          <button className="p-2 rounded hover:bg-muted/20" title="Feedback"><MessageSquareText className="h-4 w-4 text-muted-foreground" /></button>
          <button className="p-2 rounded hover:bg-muted/20" title="Version History"><Clock className="h-4 w-4 text-muted-foreground" /></button>
          <button className="p-2 rounded hover:bg-muted/20"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
          <div className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-full border border-border/30 bg-muted/10 text-sm">
            <span className="text-amber-400">🟠</span>
            <span className="text-foreground font-medium">9 credits</span>
            <span className="text-muted-foreground">Upgrade</span>
          </div>
          <Button variant="accent" size="sm" className="ml-2 gap-1.5">
            <Check className="h-4 w-4" /> Render
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
          <ScrollArea className="flex-1">
            {panelMap[activeNav]}
          </ScrollArea>
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
    </div>
  );
}
