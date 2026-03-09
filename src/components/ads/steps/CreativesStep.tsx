import { useState, useRef } from "react";
import { Upload, Plus, Video, Image, Monitor, Search, Tv, X, ZoomIn, Grid2x2, Film, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { CampaignData, CreativeItem } from "../CampaignWizard";

interface CreativesStepProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
}

const REACH_STATS = [
  { icon: Film, label: "Vertical video", reach: "+100M" },
  { icon: MessageSquare, label: "Display ads", reach: "+100M" },
  { icon: Film, label: "Horizontal video", reach: "+50M" },
  { icon: Monitor, label: "Physical display", reach: "+10M" },
  { icon: Search, label: "Search ads", reach: "5M" },
];

const CROP_RATIOS = [
  { label: "Portrait (4:5)", size: "1080×1350", ratio: 4 / 5 },
  { label: "Square (1:1)", size: "1080×1080", ratio: 1 },
  { label: "Portrait (9:16)", size: "1080×1920", ratio: 9 / 16 },
];

type ModalState =
  | { type: "none" }
  | { type: "bulk-upload" }
  | { type: "upload-video" }
  | { type: "crop"; src: string; fileType: "image" | "video" }
  | { type: "caption"; item: CreativeItem }
  | { type: "preview"; item: CreativeItem };

export function CreativesStep({ data, onChange }: CreativesStepProps) {
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [selectedRatio, setSelectedRatio] = useState(0);
  const [zoom, setZoom] = useState([1]);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const totalReach = data.creatives.length > 0 ? "265M" : "0";
  const reachPercent = data.creatives.length > 0 ? 38 : 0;

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

  const handleCropSave = () => {
    if (modal.type !== "crop") return;
    const item: CreativeItem = {
      id: crypto.randomUUID(),
      type: modal.fileType,
      src: modal.src,
      caption: "",
      cropRatio: CROP_RATIOS[selectedRatio].label,
    };
    setCaption("");
    setModal({ type: "caption", item });
  };

  const handleCaptionSave = () => {
    if (modal.type !== "caption") return;
    const updated = { ...modal.item, caption };
    onChange({ ...data, creatives: [...data.creatives, updated] });
    setModal({ type: "preview", item: updated });
  };

  const removeCreative = (id: string) => {
    onChange({ ...data, creatives: data.creatives.filter((c) => c.id !== id) });
  };

  return (
    <div className="space-y-6">
      {/* Top section: Circle graph left + reach stats right */}
      <div className="flex gap-10 items-center">
        {/* Circular reach meter */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative w-40 h-40">
            {/* Orange dot at top */}
            <div
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                background: "#d4a843",
                top: "2px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6"
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

        {/* Reach stats list */}
        <div className="flex-1 space-y-3">
          {REACH_STATS.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <stat.icon className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/70">{stat.label}</span>
              </div>
              <span className="text-sm text-white/50">{stat.reach}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Upload bar - highlighted blue background, full clickable */}
      <div
        onClick={() => setModal({ type: "bulk-upload" })}
        className="flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-colors"
        style={{ background: "rgba(30, 64, 120, 0.5)", border: "1px solid rgba(60, 100, 170, 0.3)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(50, 90, 160, 0.6)" }}
        >
          <Grid2x2 className="w-5 h-5 text-white/80" />
        </div>
        <div>
          <span className="text-sm font-medium text-white">Bulk upload</span>
          <p className="text-xs text-white/40">Upload multiple files at once</p>
        </div>
      </div>

      {/* Vertical video bar */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(200, 140, 50, 0.2)" }}
          >
            <Film className="w-5 h-5" style={{ color: "#d4a843" }} />
          </div>
          <div>
            <span className="text-sm font-medium text-white">Vertical video</span>
            <p className="text-xs text-white/40">Short-form video ads optimized for mobile discovery</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            +100M reach/mo
          </span>
          <Button
            variant="accent"
            className="rounded-xl px-4 h-8 text-xs"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.accept = "video/*";
                fileRef.current.click();
              }
            }}
          >
            Add creative set
          </Button>
        </div>
      </div>

      {/* Display ads bar */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(120, 80, 180, 0.2)" }}
          >
            <MessageSquare className="w-5 h-5" style={{ color: "#9b7abf" }} />
          </div>
          <div>
            <span className="text-sm font-medium text-white">Display ads</span>
            <p className="text-xs text-white/40">Clickable display banners across high-traffic web placements</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            +100M reach/mo
          </span>
          <Button
            variant="accent"
            className="rounded-xl px-4 h-8 text-xs"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.accept = "image/*";
                fileRef.current.click();
              }
            }}
          >
            Add creative set
          </Button>
        </div>
      </div>

      {/* Search ads bar - disabled/muted */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-xl opacity-60"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <Search className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <span className="text-sm font-medium text-white">Search ads</span>
            <p className="text-xs text-white/40">Appears in YANGU Discover search results based on keywords</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            5M reach/mo
          </span>
          <span className="text-xs text-white/30 max-w-[160px] text-right">
            Your product must be on Discover to serve search ads
          </span>
        </div>
      </div>

      {/* Creative rows */}
      {data.creatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">Creative sets</h3>
          {data.creatives.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              {item.type === "image" ? (
                <img src={item.src} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-white/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.caption || "No caption"}</p>
                <p className="text-xs text-white/30">{item.cropRatio}</p>
              </div>
              <button
                onClick={() => setModal({ type: "preview", item })}
                className="text-xs mr-2 hover:brightness-110"
                style={{ color: "#b5622a" }}
              >
                Preview
              </button>
              <button onClick={() => removeCreative(item.id)} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

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
              <button onClick={() => setModal({ type: "none" })} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div
                onClick={() => bulkFileRef.current?.click()}
                className="border-2 border-dashed border-white/15 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-white/25 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Film className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Image className="w-5 h-5 text-white/50" />
                  </div>
                </div>
                <span className="text-sm text-white/60">drop_files_or_click_to_select</span>
                <span className="text-xs text-white/30 mt-1">Videos (MP4, MOV) and images (PNG, JPG, GIF)</span>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setModal({ type: "none" })}
                className="flex-1 rounded-xl border-white/10 text-white/60"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="flex-1 rounded-xl opacity-50 cursor-not-allowed"
                disabled
              >
                Upload 0 files
              </Button>
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
              <button onClick={() => setModal({ type: "none" })} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 text-sm text-white/70">
                Upload from my computer
                <span className="text-white/40">∧</span>
              </button>
              <div
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.accept = "video/*";
                    fileRef.current.click();
                  }
                }}
                className="border-2 border-dashed border-white/15 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-white/25 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <Film className="w-5 h-5 text-white/50" />
                </div>
                <span className="text-sm text-white/60">Choose a file or drag and drop here</span>
                <span className="text-xs text-white/30 mt-1">.MP4 and .MOV formats</span>
              </div>
              <button className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 text-sm text-white/50">
                Choose from my creatives library instead
                <span className="text-white/40">∨</span>
              </button>
            </div>
            <div className="flex gap-3 p-5 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setModal({ type: "none" })}
                className="flex-1 rounded-xl border-white/10 text-white/60"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="flex-1 rounded-xl opacity-50 cursor-not-allowed"
                disabled
              >
                Continue
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Crop modal */}
      {modal.type === "crop" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl p-6 w-full max-w-lg space-y-5" style={{ background: "#0f1f17" }}>
            <h3 className="text-lg font-semibold text-white">Crop media</h3>
            <div className="rounded-xl overflow-hidden flex items-center justify-center h-64" style={{ background: "#08120D" }}>
              {modal.fileType === "image" ? (
                <img
                  src={modal.src}
                  alt="crop preview"
                  className="max-h-full max-w-full object-contain"
                  style={{ transform: `scale(${zoom[0]})` }}
                />
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
                    background: selectedRatio === i
                      ? "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)"
                      : "rgba(255,255,255,0.04)",
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

      {/* Caption modal */}
      {modal.type === "caption" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl p-6 w-full max-w-2xl" style={{ background: "#0f1f17" }}>
            <h3 className="text-lg font-semibold text-white mb-5">Add caption</h3>
            <div className="flex gap-6 flex-col md:flex-row">
              <div className="w-full md:w-1/2">
                {modal.item.type === "image" ? (
                  <img src={modal.item.src} alt="" className="w-full rounded-xl object-cover aspect-[4/5]" />
                ) : (
                  <video src={modal.item.src} controls className="w-full rounded-xl aspect-[4/5] object-cover" />
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-xs font-medium text-white/60 block mb-2">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 outline-none resize-none"
                    placeholder="Write a caption for your ad..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/40 block mb-2">Suggestions</label>
                  <div className="space-y-2">
                    {[
                      "Build visibility faster with YANGU Ads.",
                      "Reach buyers, clients, and communities across YANGU surfaces.",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setCaption(s)}
                        className="block w-full text-left text-xs p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setModal({ type: "none" })} className="text-white/50">Cancel</Button>
              <Button variant="accent" onClick={handleCaptionSave} className="rounded-xl">Save & Continue</Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Preview modal */}
      {modal.type === "preview" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "#0f1f17" }}>
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            {modal.item.type === "image" ? (
              <img src={modal.item.src} alt="" className="w-full rounded-xl object-cover aspect-[4/5] mb-4" />
            ) : (
              <video src={modal.item.src} controls className="w-full rounded-xl aspect-[4/5] object-cover mb-4" />
            )}
            <p className="text-sm text-white/60 mb-6">{modal.item.caption || "No caption"}</p>
            <div className="flex justify-end">
              <Button variant="accent" onClick={() => setModal({ type: "none" })} className="rounded-xl">Done</Button>
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
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
