import { useState } from "react";
import { X, Search, Bookmark, ChevronDown, AudioLines, Plus, Mic, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const VOICES = [
  { id: "1", name: "Emily", gender: "Female", age: "Adult", accent: "American English accent" },
  { id: "2", name: "Oscar", gender: "Male", age: "Adult", accent: "American English accent" },
  { id: "3", name: "Cecilia", gender: "Female", age: "Adult", accent: "American English accent" },
  { id: "4", name: "Emily", gender: "Female", age: "Adult", accent: "Australian English accent" },
  { id: "5", name: "Juan", gender: "Male", age: "Adult", accent: "American English accent" },
  { id: "6", name: "Fabian", gender: "Male", age: "Adult", accent: "American English accent" },
  { id: "7", name: "Emily", gender: "Female", age: "Adult", accent: "British English accent" },
  { id: "8", name: "Aria", gender: "Female", age: "Adult", accent: "Australian English accent" },
  { id: "9", name: "Owen", gender: "Male", age: "Adult", accent: "American English accent" },
  { id: "10", name: "Monica", gender: "Female", age: "Adult", accent: "American English accent" },
  { id: "11", name: "Alba", gender: "Female", age: "Adult", accent: "American English accent" },
  { id: "12", name: "Aria", gender: "Female", age: "Adult", accent: "British English accent" },
];

interface VoiceLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (voice: { id: string; name: string }) => void;
}

export function VoiceLibraryModal({ open, onClose, onSelect }: VoiceLibraryModalProps) {
  const [tab, setTab] = useState<"library" | "my" | "integration">("library");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newVoiceOpen, setNewVoiceOpen] = useState(false);

  if (!open) return null;

  const selected = VOICES.find((v) => v.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-[1100px] max-h-[85vh] mx-4 rounded-2xl border border-border/30 bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-foreground">Choose voice</h2>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="h-4 w-4 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[10px]">✎</span>
              Feedback
            </button>
            <div className="relative">
              <Button variant="accent" size="sm" onClick={() => setNewVoiceOpen(!newVoiceOpen)}>
                <Plus className="h-4 w-4" />
                New voice
              </Button>
              {newVoiceOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border/40 bg-card shadow-xl py-1 z-10">
                  <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors">
                    <Mic className="h-4 w-4" />
                    Clone voice
                  </button>
                  <button className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/40 transition-colors">
                    <Download className="h-4 w-4" />
                    Import ElevenLabs voices
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted/30 transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-border/20">
          {(["library", "my", "integration"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {t === "library" ? "Voice Library" : t === "my" ? "My Voices" : "Integration"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/20 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
            />
          </div>
          {["English", "Accents", "Gender"].map((f) => (
            <button
              key={f}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-muted/20 border border-border/30 text-sm text-foreground hover:bg-muted/30 transition-colors"
            >
              {f}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-foreground">
            <Bookmark className="h-4 w-4" />
            Saved
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-3">
          <div className="grid grid-cols-3 gap-3">
            {VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  selectedId === v.id
                    ? "border-primary bg-primary/5"
                    : "border-border/30 bg-card/50 hover:border-border/60"
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                  <AudioLines className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{v.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-muted/30 text-muted-foreground">{v.gender}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-muted/30 text-muted-foreground">{v.age}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-muted/30 text-muted-foreground">{v.accent}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/20">
          <div className="px-4 py-2 rounded-lg bg-muted/20 border border-border/30 text-sm text-muted-foreground min-w-[250px]">
            {selected ? selected.name : "Please select a new voice"}
          </div>
          <Button
            variant="accent"
            disabled={!selectedId}
            onClick={() => {
              if (selected) {
                onSelect({ id: selected.id, name: selected.name });
                onClose();
              }
            }}
          >
            Use this voice
          </Button>
        </div>
      </div>
    </div>
  );
}
