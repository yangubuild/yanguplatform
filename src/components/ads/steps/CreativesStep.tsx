import { useState, useRef } from "react";
import { Upload, Plus, Video, Image, Monitor, Search, Tv, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { CampaignData, CreativeItem } from "../CampaignWizard";

interface CreativesStepProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
}

const FORMATS = [
  { icon: Video, label: "Vertical video", reach: "45M - 55M" },
  { icon: Image, label: "Display ads", reach: "35M - 40M" },
  { icon: Monitor, label: "Horizontal video", reach: "20M - 25M" },
  { icon: Tv, label: "Physical display", reach: "5M - 8M" },
  { icon: Search, label: "Search ads", reach: "15M - 20M" },
];

const CROP_RATIOS = [
  { label: "Portrait (4:5)", size: "1080×1350", ratio: 4 / 5 },
  { label: "Square (1:1)", size: "1080×1080", ratio: 1 },
  { label: "Portrait (9:16)", size: "1080×1920", ratio: 9 / 16 },
];

type ModalState =
  | { type: "none" }
  | { type: "upload-choose" }
  | { type: "crop"; src: string; fileType: "image" | "video" }
  | { type: "caption"; item: CreativeItem }
  | { type: "preview"; item: CreativeItem };

export function CreativesStep({ data, onChange }: CreativesStepProps) {
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [selectedRatio, setSelectedRatio] = useState(0);
  const [zoom, setZoom] = useState([1]);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const totalReach = data.creatives.length > 0 ? "95M - 105M" : "0";
  const reachPercent = data.creatives.length > 0 ? 38 : 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    setModal({ type: "crop", src: url, fileType: isVideo ? "video" : "image" });
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
    <div className="space-y-8">
      {/* Top row: reach meter + formats */}
      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Circular reach meter */}
        <div className="flex flex-col items-center gap-3 min-w-[180px]">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none" stroke="#3b82f6" strokeWidth="8"
                strokeDasharray={`${reachPercent * 3.27} ${327 - reachPercent * 3.27}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white">{totalReach}</span>
              <span className="text-[10px] text-white/40">/ 265M</span>
            </div>
          </div>
          <span className="text-xs text-white/50">Potential reach</span>
        </div>

        {/* Format list */}
        <div className="flex-1 space-y-2">
          {FORMATS.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <f.icon className="w-4 h-4 text-white/40" />
                <span className="text-sm text-white/70">{f.label}</span>
              </div>
              <span className="text-xs text-white/30">{f.reach}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk upload card */}
      <div
        onClick={() => setModal({ type: "upload-choose" })}
        className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-white/20 transition-colors"
      >
        <Upload className="w-8 h-8 text-white/30 mb-3" />
        <span className="text-sm font-medium text-white/60">Bulk upload</span>
        <span className="text-xs text-white/30 mt-1">
          Upload images or videos for your creative sets
        </span>
      </div>

      {/* Creative rows */}
      {data.creatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/60">Creative sets</h3>
          {data.creatives.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
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
                className="text-xs text-blue-400 hover:text-blue-300 mr-2"
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

      {/* Add creative set button */}
      <Button
        variant="outline"
        onClick={() => setModal({ type: "upload-choose" })}
        className="border-white/10 text-white/60 hover:text-white hover:bg-white/5"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add creative set
      </Button>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

      {/* ─── MODALS ─── */}

      {/* Upload choose modal */}
      {modal.type === "upload-choose" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-white">Upload media</h3>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.accept = "image/*";
                  fileRef.current.click();
                }
              }}
              className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/10 text-left hover:bg-white/[0.08] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-white">Upload image</span>
                  <p className="text-xs text-white/40">Upload from my computer</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.accept = "video/*";
                  fileRef.current.click();
                }
              }}
              className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/10 text-left hover:bg-white/[0.08] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Video className="w-5 h-5 text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-white">Upload video</span>
                  <p className="text-xs text-white/40">Upload from my computer</p>
                </div>
              </div>
            </button>
            <button className="w-full text-center text-sm text-blue-400 hover:text-blue-300 py-2">
              Choose from my creatives library instead
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Crop modal */}
      {modal.type === "crop" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-lg space-y-5">
            <h3 className="text-lg font-semibold text-white">Crop media</h3>

            {/* Preview */}
            <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center h-64">
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

            {/* Ratio selection */}
            <div className="flex gap-2">
              {CROP_RATIOS.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setSelectedRatio(i)}
                  className={`flex-1 p-3 rounded-lg text-center text-xs transition-colors ${
                    selectedRatio === i
                      ? "bg-blue-600 text-white"
                      : "bg-white/[0.04] text-white/50 border border-white/10"
                  }`}
                >
                  <div className="font-medium">{r.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-60">{r.size}</div>
                </button>
              ))}
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <ZoomIn className="w-4 h-4 text-white/30" />
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModal({ type: "none" })} className="text-white/50">
                Cancel
              </Button>
              <Button onClick={handleCropSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Caption modal */}
      {modal.type === "caption" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-white mb-5">Add caption</h3>
            <div className="flex gap-6 flex-col md:flex-row">
              {/* Left: media preview */}
              <div className="w-full md:w-1/2">
                {modal.item.type === "image" ? (
                  <img src={modal.item.src} alt="" className="w-full rounded-xl object-cover aspect-[4/5]" />
                ) : (
                  <video src={modal.item.src} controls className="w-full rounded-xl aspect-[4/5] object-cover" />
                )}
              </div>

              {/* Right: caption */}
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
              <Button variant="ghost" onClick={() => setModal({ type: "none" })} className="text-white/50">
                Cancel
              </Button>
              <Button onClick={handleCaptionSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save & Continue
              </Button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Preview modal */}
      {modal.type === "preview" && (
        <ModalOverlay onClose={() => setModal({ type: "none" })}>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
            {modal.item.type === "image" ? (
              <img src={modal.item.src} alt="" className="w-full rounded-xl object-cover aspect-[4/5] mb-4" />
            ) : (
              <video src={modal.item.src} controls className="w-full rounded-xl aspect-[4/5] object-cover mb-4" />
            )}
            <p className="text-sm text-white/60 mb-6">{modal.item.caption || "No caption"}</p>
            <div className="flex justify-end">
              <Button onClick={() => setModal({ type: "none" })} className="bg-blue-600 hover:bg-blue-700 text-white">
                Done
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
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
