import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Search, ArrowLeftRight, Plus } from "lucide-react";
import {
  PLATFORM_REGISTRY,
  DEFAULT_PRIMARY_IDS,
  getPlatform,
  searchPlatforms,
  type SocialSlot,
} from "@/lib/socialPlatformRegistry";

interface InfluencerLinksEditorProps {
  schema: Record<string, unknown>;
  update: (partial: Record<string, unknown>) => void;
}

/** Extract active slots from schema, always returning exactly 6 */
function getSlots(schema: Record<string, unknown>): SocialSlot[] {
  const stored = schema.active_social_links as SocialSlot[] | undefined;
  if (stored && Array.isArray(stored) && stored.length === 6) return stored;
  const legacy = schema.social_links as Record<string, string> | undefined;
  if (legacy && Object.keys(legacy).length> 0) {
    const entries = Object.entries(legacy).slice(0, 6);
    const slots: SocialSlot[] = entries.map(([platform, url], i) => ({ platform, url, slotIndex: i }));
    while (slots.length < 6) {
      const fill = DEFAULT_PRIMARY_IDS.find(id => !slots.some(s => s.platform === id));
      if (fill) slots.push({ platform: fill, url: "", slotIndex: slots.length });
      else break;
    }
    return slots;
  }
  return DEFAULT_PRIMARY_IDS.map((id, i) => ({ platform: id, url: "", slotIndex: i }));
}

export function InfluencerLinksEditor({ schema, update }: InfluencerLinksEditorProps) {
  const slots = getSlots(schema);
  const iconStyle = (schema.icon_style as string) || "original";

  const [searchQuery, setSearchQuery] = useState("");
  const [replaceTarget, setReplaceTarget] = useState<number | null>(null);
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);
  // Track URLs typed into search result cards before adding
  const [searchUrls, setSearchUrls] = useState<Record<string, string>>({});

  const save = (newSlots: SocialSlot[], extra?: Record<string, unknown>) => {
    const socialLinks: Record<string, string> = {};
    newSlots.forEach(s => { if (s.url) socialLinks[s.platform] = s.url; });
    update({ active_social_links: newSlots, social_links: socialLinks, ...extra });
  };

  const handleUrlChange = (index: number, url: string) => {
    const next = slots.map((s, i) => i === index ? { ...s, url } : s);
    save(next);
  };

  const handleClearSlot = (index: number) => {
    const next = slots.map((s, i) => i === index ? { ...s, url: "" } : s);
    save(next);
  };

  const handleAddPlatform = (platformId: string) => {
    const enteredUrl = searchUrls[platformId] || "";
    // Already in slots? Just focus it
    const existing = slots.findIndex(s => s.platform === platformId);
    if (existing>= 0) {
      if (enteredUrl) {
        const next = slots.map((s, i) => i === existing ? { ...s, url: enteredUrl } : s);
        save(next);
      }
      setSearchQuery("");
      setSearchUrls({});
      return;
    }
    // Check if there's an empty slot (no url)
    const emptyIdx = slots.findIndex(s => !s.url);
    if (emptyIdx>= 0) {
      const next = slots.map((s, i) => i === emptyIdx ? { platform: platformId, url: enteredUrl, slotIndex: i } : s);
      save(next);
      setSearchQuery("");
      setSearchUrls({});
      return;
    }
    // All 6 occupied — trigger replace flow
    setPendingPlatform(platformId);
    setReplaceTarget(null);
    setSearchQuery("");
  };

  const confirmReplace = () => {
    if (replaceTarget === null || !pendingPlatform) return;
    const enteredUrl = searchUrls[pendingPlatform] || "";
    const next = slots.map((s, i) =>
      i === replaceTarget ? { platform: pendingPlatform, url: enteredUrl, slotIndex: i } : s
    );
    save(next);
    setPendingPlatform(null);
    setReplaceTarget(null);
    setSearchUrls({});
  };

  const cancelReplace = () => {
    setPendingPlatform(null);
    setReplaceTarget(null);
  };

  const setIconStyle = (style: string) => {
    update({ icon_style: style });
  };

  const searchResults = searchQuery.length> 0
    ? searchPlatforms(searchQuery).filter(p => !slots.some(s => s.platform === p.id))
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold">Social Icons & Links</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          6 icons displayed on your page. Search to add or replace.
        </p>
      </div>

      {/* ── Replace Flow Modal ── */}
      {pendingPlatform && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">
              Replace a slot with {getPlatform(pendingPlatform)?.name}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            You can display only 6 social links. Choose one to replace:
          </p>
          <div className="space-y-1">
            {slots.map((slot, i) => {
              const p = getPlatform(slot.platform);
              if (!p) return null;
              return (
                <label
                  key={i}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-xs transition-colors ${
                    replaceTarget === i
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-muted/60"
                  }`}
                  onClick={() => setReplaceTarget(i)}>
                  <img
                    src={p.icon}
                    alt={p.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="flex-1">{p.name}</span>
                  {slot.url && (
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {slot.url}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmReplace}
              disabled={replaceTarget === null}
              className="flex-1 rounded-md bg-primary text-primary-foreground text-xs py-1.5 disabled:opacity-40 transition-opacity">
              Replace
            </button>
            <button
              onClick={cancelReplace}
              className="flex-1 rounded-md border border-border text-xs py-1.5 hover:bg-muted/60 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Primary 6 Slots ── */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Active Icons
        </Label>
        {slots.map((slot, index) => {
          const p = getPlatform(slot.platform);
          if (!p) return null;
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-muted/50 border border-border">
                <img
                  src={p.icon}
                  alt={p.name}
                  className={`w-full h-full object-cover ${
                    iconStyle === "white" ? "brightness-0 invert" :
                    iconStyle === "black" ? "brightness-0" : ""
                  }`}
                />
              </div>
              <Input
                value={slot.url}
                placeholder={p.placeholder}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                className="text-sm flex-1 h-8"
              />
              {slot.url && (
                <button
                  onClick={() => handleClearSlot(index)}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  title="Clear link">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Platform Search ── */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Add / Replace Platform
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platform..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        {searchResults.length> 0 && (
          <div className="rounded-md border border-border bg-popover max-h-[280px] overflow-y-auto space-y-1 p-1.5">
            {searchResults.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/10 transition-colors">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-muted/50 border border-border">
                  <img src={p.icon} alt={p.name} className="w-full h-full object-cover" title={p.name} />
                </div>
                <Input
                  value={searchUrls[p.id] || ""}
                  onChange={(e) => setSearchUrls(prev => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder={p.placeholder}
                  className="text-sm flex-1 h-8"
                />
                <button
                  onClick={() => handleAddPlatform(p.id)}
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                  title={`Add ${p.name}`}>
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {searchQuery.length> 0 && searchResults.length === 0 && (
          <p className="text-[11px] text-muted-foreground px-1">No platforms found.</p>
        )}
      </div>

      {/* ── Icon Style ── */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Icon Style
        </Label>
        <RadioGroup
          value={iconStyle}
          onValueChange={setIconStyle}
          className="flex gap-4">
          {[
            { value: "original", label: "Original" },
            { value: "white", label: "White" },
            { value: "black", label: "Black" },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-xs">
              <RadioGroupItem value={opt.value} />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

// Re-export for external use
export { PLATFORM_REGISTRY as SOCIAL_PLATFORMS };
