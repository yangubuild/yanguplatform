import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Type, ImageIcon, Video, Upload, Lightbulb, AudioLines, ChevronDown, ChevronRight,
  Wand2, Clock, Eye, Mic, Settings2, Users, CheckCircle2, XCircle, Loader2, AlertTriangle
} from "lucide-react";
import { VoiceLibraryModal } from "./VoiceLibraryModal";
import { useAvatarTraining } from "@/hooks/useAvatarTraining";
import { consumeAiAvatarCredit } from "@/lib/aiCredits";
import { toast } from "@/hooks/use-toast";

type ModeTab = "text" | "image" | "video";
type VoiceMode = "select" | "upload";

const OUTFIT_CHIPS = ["Casual", "Formal", "Sporty", "Doctor", "Nurse", "Chef", "Worker"];
const SCENE_CHIPS = ["Living room", "Bedroom", "Kitchen", "Home office", "Gym", "Office"];

export default function CreateAvatarPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ModeTab>("image");
  const { startTraining, isStarting, latestJob, fetchJobs, jobs, isLoading } = useAvatarTraining();

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleGenerate = async () => {
    const credit = await consumeAiAvatarCredit();
    if (!credit.allowed) {
      toast({ title: credit.reason || "Monthly avatar limit reached.", variant: "destructive", description: "Upgrade your plan for more AI avatar credits." });
      return;
    }
    await startTraining("heygen", { mode, timestamp: Date.now() });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back */}
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <button onClick={() => navigate("/dashboard/studio")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Studio
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex justify-center pt-2 pb-6">
        <div className="inline-flex rounded-full border border-border/40 bg-card/60 p-1">
          {([
            { key: "text" as const, label: "Text to Avatar", icon: Type },
            { key: "image" as const, label: "Image to Avatar", icon: ImageIcon },
            { key: "video" as const, label: "Video to Avatar", icon: Video },
          ]).map((t) => (
            <button key={t.key} onClick={() => setMode(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${mode === t.key ? "bg-muted/60 text-foreground border border-border/50" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {mode === "image" && <ImageToAvatarTab />}
        {mode === "text" && <TextToAvatarTab />}
        {mode === "video" && <VideoToAvatarTab />}

        {/* Training job status */}
        {latestJob && (
          <TrainingJobStatus job={latestJob} />
        )}

        {/* Previous jobs */}
        {jobs.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-foreground">Training History</p>
            {jobs.slice(0, 5).map((job) => (
              <TrainingJobStatus key={job.id} job={job} compact />
            ))}
          </div>
        )}

        {/* Generate CTA */}
        <div className="flex justify-center pt-8 pb-6">
          <Button variant="accent" size="lg" onClick={handleGenerate} disabled={isStarting}>
            {isStarting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Starting...</> : "Generate Avatar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Training Job Status Banner ─── */
function TrainingJobStatus({ job, compact = false }: { job: { id: string; status: string; provider: string; error: string | null; created_at: string }; compact?: boolean }) {
  const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    pending: { icon: Clock, color: "text-yellow-400", label: "Pending" },
    processing: { icon: Loader2, color: "text-blue-400", label: "Processing" },
    completed: { icon: CheckCircle2, color: "text-emerald-400", label: "Completed" },
    failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
    not_enabled: { icon: AlertTriangle, color: "text-amber-400", label: "Not Enabled" },
  };

  const config = statusConfig[job.status] || statusConfig.pending;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/30 px-4 py-2.5">
        <Icon className={`h-4 w-4 ${config.color} ${job.status === "processing" ? "animate-spin" : ""}`} />
        <span className="text-sm text-foreground">{config.label}</span>
        <span className="text-xs text-muted-foreground">{job.provider}</span>
        <span className="text-xs text-muted-foreground ml-auto">{new Date(job.created_at).toLocaleDateString()}</span>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border/30 bg-card/40 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.color} ${job.status === "processing" ? "animate-spin" : ""}`} />
        <span className="text-base font-semibold text-foreground">Training: {config.label}</span>
      </div>
      {job.error && (
        <p className="text-sm text-muted-foreground">{job.error}</p>
      )}
      {job.status === "not_enabled" && (
        <p className="text-xs text-muted-foreground mt-1">
          Avatar training requires provider API access that is not currently configured. Contact your administrator to enable this feature.
        </p>
      )}
    </div>
  );
}

/* ─── IMAGE TO AVATAR ─── */
function ImageToAvatarTab() {
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("select");
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="rounded-2xl border border-border/30 bg-card/40 p-6 space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">Upload an image</h3>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border/40 rounded-xl bg-muted/10 flex flex-col items-center justify-center py-20 cursor-pointer hover:border-border/60 transition-colors">
            <Upload className="h-10 w-10 text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium text-foreground">
              Upload a photo
              <span className="inline-flex items-center gap-1 ml-2 text-accent text-xs"><Lightbulb className="h-3 w-3" /> Tips</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Max 10MB for uploaded photo</p>
            {imageFile && <p className="text-xs text-primary mt-2">{imageFile.name}</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Choose voice</h3>
          <div className="flex rounded-lg border border-border/40 overflow-hidden mb-3">
            <button onClick={() => setVoiceMode("select")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${voiceMode === "select" ? "bg-muted/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Select Voice</button>
            <button onClick={() => setVoiceMode("upload")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-border/40 ${voiceMode === "upload" ? "bg-muted/50 text-foreground border border-primary/60 rounded-lg" : "text-muted-foreground hover:text-foreground"}`}>Upload Audio</button>
          </div>
          {voiceMode === "select" ? (
            <button onClick={() => setVoiceModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
              <AudioLines className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-left text-sm text-muted-foreground">{selectedVoice || "Select voice"}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <div className="border-2 border-dashed border-border/40 rounded-xl bg-muted/10 flex flex-col items-center justify-center py-12">
              <AudioLines className="h-8 w-8 text-muted-foreground/60 mb-3" />
              <p className="text-sm font-medium text-foreground">Drag and drop audio here to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Up to 5MB, Support MP3, WAV, M4A.</p>
            </div>
          )}
        </div>
      </div>
      <VoiceLibraryModal open={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} onSelect={(v) => setSelectedVoice(v.name)} />
    </>
  );
}

/* ─── TEXT TO AVATAR ─── */
function TextToAvatarTab() {
  const [gender, setGender] = useState("Male");
  const [ageGroup, setAgeGroup] = useState("Young Adult");
  const [ethnicity, setEthnicity] = useState("Caucasian");
  const [outfit, setOutfit] = useState("");
  const [details, setDetails] = useState("");
  const [scene, setScene] = useState("");
  const [lighting, setLighting] = useState("Day");
  const [cameraDistance, setCameraDistance] = useState<"wide" | "middle">("middle");

  return (
    <div className="rounded-2xl border border-border/30 bg-card/40 p-6 space-y-8">
      <div>
        <h3 className="text-lg font-bold text-foreground">Appearance</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Describe the appearance of your avatar.</p>
        <p className="text-sm font-semibold text-foreground mb-2">Basic Info</p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <SelectDropdown label="Gender" value={gender} onChange={setGender} options={["Male", "Female"]} />
          <SelectDropdown label="Age" value={ageGroup} onChange={setAgeGroup} options={["Young Adult", "Early Middle Age", "Late Middle Age", "Senior"]} />
          <SelectDropdown label="Ethnicity" value={ethnicity} onChange={setEthnicity} options={["Caucasian", "Black / African American", "East Asian", "Southeast Asian", "South Asian", "Middle Eastern", "Hispanic / Latino", "Native American / Indigenous", "Multiracial"]} />
        </div>
        <p className="text-sm font-semibold text-foreground mb-2">Outfit (Optional)</p>
        <textarea value={outfit} onChange={(e) => setOutfit(e.target.value)} placeholder="e.g. casual, formal, sporty, business, trendy, vintage..."
          className="w-full h-24 rounded-xl bg-muted/15 border border-border/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary/50" />
        <ChipRow chips={OUTFIT_CHIPS} onSelect={(c) => setOutfit((p) => (p ? p + ", " + c : c))} />
        <p className="text-sm font-semibold text-foreground mt-5 mb-2">More details (Optional)</p>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. hair, tattoo, beards, freckles..."
          className="w-full h-24 rounded-xl bg-muted/15 border border-border/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary/50" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">Background</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Describe the background scene of your avatar.</p>
        <p className="text-sm font-semibold text-foreground mb-2">Scene type (Optional)</p>
        <textarea value={scene} onChange={(e) => setScene(e.target.value)} placeholder="e.g. living room, bedroom, kitchen, reading room, gym, office, clinic, pool, car, beach ..."
          className="w-full h-24 rounded-xl bg-muted/15 border border-border/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary/50" />
        <ChipRow chips={SCENE_CHIPS} onSelect={(c) => setScene((p) => (p ? p + ", " + c : c))} />
        <p className="text-sm font-semibold text-foreground mt-5 mb-2">Lighting style (Optional)</p>
        <SelectDropdown label="" value={lighting} onChange={setLighting} options={["Day", "Night", "Golden Hour", "Cloudy"]} className="max-w-[220px]" />
        <p className="text-sm font-semibold text-foreground mt-5 mb-2">Camera distance</p>
        <div className="grid grid-cols-2 gap-3">
          {(["wide", "middle"] as const).map((d) => (
            <button key={d} onClick={() => setCameraDistance(d)}
              className={`flex flex-col items-center gap-2 py-5 rounded-xl border transition-all ${cameraDistance === d ? "bg-muted/40 border-border/60" : "border-border/30 hover:border-border/50"}`}>
              <Users className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">{d === "wide" ? "Wide" : "Middle"}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-6">
          <a href="#" className="text-sm text-accent hover:underline">Product & brand settings</a>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">PRO</span>
        </div>
      </div>
    </div>
  );
}

/* ─── VIDEO TO AVATAR ─── */
function VideoToAvatarTab() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const videoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/30 bg-card/40 p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Upload a video</h3>
        <div onClick={() => videoRef.current?.click()}
          className="border-2 border-dashed border-border/40 rounded-xl bg-muted/10 flex flex-col items-center justify-center py-16 cursor-pointer hover:border-border/60 transition-colors">
          <Video className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <p className="text-sm font-medium text-foreground">Upload your video</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md text-center">You can upload videos up to 1000 MB in size. We support MP4, MOV, and WebM formats.</p>
          {videoFile && <p className="text-xs text-primary mt-2">{videoFile.name}</p>}
          <div className="flex items-center gap-3 w-full max-w-sm mt-5">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <div className="flex items-center gap-2 mt-4 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
              <span className="text-base">🔗</span>
              <input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="Paste your Google Drive URL here"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
            </div>
          </div>
        </div>
        <input ref={videoRef} type="file" accept="video/mp4,video/mov,video/webm" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
      </div>
      <div className="rounded-2xl border border-border/30 bg-card/40 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">Video requirement</h4>
            <ul className="space-y-3">
              {[
                { icon: Clock, text: "Video must be over 15 seconds" },
                { icon: Eye, text: "Clear, unobstructed video of one person" },
                { icon: Mic, text: "Speak clearly for voice cloning" },
                { icon: Settings2, text: "16:9 aspect ratio, minimum 720p resolution" },
              ].map((r, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground"><r.icon className="h-4 w-4 shrink-0" />{r.text}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Clear face", ok: true },
              { label: "Blurred", ok: false },
              { label: "Obstructed", ok: false },
              { label: "Too far", ok: false },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative w-full aspect-[4/3] rounded-lg bg-muted/20 border border-border/20">
                  <div className={`absolute top-1 left-1 h-5 w-5 rounded-full flex items-center justify-center ${t.ok ? "bg-emerald-500" : "bg-red-500"}`}>
                    {t.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <XCircle className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground mt-1">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared: Select Dropdown ─── */
function SelectDropdown({ value, onChange, options, label, className = "" }: { value: string; onChange: (v: string) => void; options: string[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <button onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm text-foreground transition-colors ${open ? "border-primary/60 bg-muted/20" : "border-border/40 bg-muted/15 hover:border-border/60"}`}>
        <span>{value}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 top-full mt-1 w-full min-w-[200px] rounded-xl border border-border/40 bg-card shadow-xl py-1 max-h-72 overflow-y-auto">
            {options.map((o) => (
              <button key={o} onClick={() => { onChange(o); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/30 transition-colors">
                {value === o && <span className="text-foreground">✓</span>}
                <span className={value === o ? "" : "ml-5"}>{o}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Shared: Chip Row ─── */
function ChipRow({ chips, onSelect }: { chips: string[]; onSelect: (c: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="flex items-center gap-2 mt-2 overflow-hidden">
      <button onClick={() => scrollRef.current?.scrollBy({ left: -120, behavior: "smooth" })} className="p-1 rounded hover:bg-muted/20 shrink-0">
        <ChevronRight className="h-4 w-4 text-muted-foreground rotate-180" />
      </button>
      <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {chips.map((c) => (
          <button key={c} onClick={() => onSelect(c)} className="px-3 py-1.5 rounded-full border border-border/30 bg-muted/10 text-xs text-foreground hover:bg-muted/20 whitespace-nowrap transition-colors">{c}</button>
        ))}
      </div>
      <button onClick={() => scrollRef.current?.scrollBy({ left: 120, behavior: "smooth" })} className="p-1 rounded hover:bg-muted/20 shrink-0">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
