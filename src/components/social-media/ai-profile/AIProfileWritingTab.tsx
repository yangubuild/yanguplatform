import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAICaptionExamples } from "@/hooks/social/useAIProfileAnalyzer";

interface Props {
  profile: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export function AIProfileWritingTab({ profile, onUpdate, onSave, isSaving }: Props) {
  const [styleOpen, setStyleOpen] = useState(true);
  const [factsOpen, setFactsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [newRule, setNewRule] = useState("");
  const [newCta, setNewCta] = useState("");
  const [saved, setSaved] = useState(false);
  const { examples, isLoading: examplesLoading, generateExamples } = useAICaptionExamples();

  const captionRules = (profile.caption_rules as string[]) || [];
  const preferredCtas = (profile.preferred_ctas as string[]) || [];

  const handleSave = async () => {
    await onSave();
    setSaved(true);
    toast.success("Profile saved");
    setTimeout(() => setSaved(false), 3000);
  };

  const presetRules = [
    "No hashtags", "Keep captions short", "End with an engaging question",
    "Lots of vertical whitespace", "More emojis", "No emojis",
  ];

  const togglePresetRule = (rule: string) => {
    const current = [...captionRules];
    const idx = current.indexOf(rule);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(rule);
    onUpdate("caption_rules", current);
  };

  const addCustomRule = () => {
    if (!newRule.trim()) return;
    onUpdate("caption_rules", [...captionRules, newRule.trim()]);
    setNewRule("");
  };

  const removeRule = (idx: number) => {
    const next = captionRules.filter((_, i) => i !== idx);
    onUpdate("caption_rules", next);
  };

  const addCta = () => {
    if (!newCta.trim()) return;
    onUpdate("preferred_ctas", [...preferredCtas, newCta.trim()]);
    setNewCta("");
  };

  const removeCta = (idx: number) => {
    onUpdate("preferred_ctas", preferredCtas.filter((_, i) => i !== idx));
  };

  const handleRefreshExamples = () => {
    generateExamples(profile, 2);
  };

  // Split custom rules (not in presets)
  const customRules = captionRules.filter((r) => !presetRules.includes(r));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Left column */}
      <div className="space-y-4">
        {/* STYLE SECTION */}
        <Section
          title="Style"
          subtitle="Brand voice and caption preferences"
          open={styleOpen}
          onToggle={() => setStyleOpen(!styleOpen)}
          saved={saved}
          onSave={handleSave}
          isSaving={isSaving}
        >
          {/* Voice */}
          <label className="text-sm font-semibold text-foreground block mb-1.5">Voice</label>
          <textarea
            value={(profile.tone_of_voice as string) || ""}
            onChange={(e) => onUpdate("tone_of_voice", e.target.value)}
            placeholder="Describe your brand's tone of voice..."
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none resize-none mb-4"
          />

          {/* Caption rules chips */}
          <label className="text-sm font-semibold text-foreground block mb-2">Caption rules</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetRules.map((r) => (
              <button
                key={r}
                onClick={() => togglePresetRule(r)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  captionRules.includes(r)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                <Plus className="h-3 w-3" />
                {r}
              </button>
            ))}
          </div>

          {/* Custom rules list */}
          <div className="space-y-1.5 mb-3">
            {customRules.map((rule, idx) => {
              const realIdx = captionRules.indexOf(rule);
              return (
                <div key={idx} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/5 border border-accent/10">
                  <span className="text-sm text-foreground flex-1">{rule}</span>
                  <button onClick={() => setEditingRule(realIdx)} className="p-1 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removeRule(realIdx)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add rule */}
          <div className="flex items-center gap-2 mb-1">
            <input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomRule()}
              placeholder="Add a custom rule..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none"
            />
            <button onClick={addCustomRule} className="text-xs text-accent font-medium flex items-center gap-1 hover:underline">
              <Plus className="h-3 w-3" /> Add rule
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Rules you want followed when writing captions</p>

          {/* CTAs */}
          <label className="text-sm font-semibold text-foreground block mb-2">Call to actions</label>
          <div className="space-y-1.5 mb-2">
            {preferredCtas.map((cta, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border">
                <span className="text-sm text-foreground flex-1">{cta}</span>
                <button onClick={() => removeCta(idx)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <input
              value={newCta}
              onChange={(e) => setNewCta(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCta()}
              placeholder="Add a CTA..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none"
            />
            <button onClick={addCta} className="text-xs text-accent font-medium flex items-center gap-1 hover:underline">
              <Plus className="h-3 w-3" /> Add CTA
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">One CTA is chosen for the end of each caption</p>

          {/* Caption ending */}
          <label className="text-sm font-semibold text-foreground block mb-1.5">Caption ending</label>
          <input
            value={(profile.caption_ending as string) || ""}
            onChange={(e) => onUpdate("caption_ending", e.target.value)}
            placeholder="Provide a tagline or hashtags you always want included"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none"
          />
          <p className="text-xs text-muted-foreground mt-1">Text you always want at the end of your caption</p>
        </Section>

        {/* FACTS SECTION */}
        <Section
          title="Facts"
          subtitle="Business details and contact info"
          open={factsOpen}
          onToggle={() => setFactsOpen(!factsOpen)}
          saved={saved}
          onSave={handleSave}
          isSaving={isSaving}
        >
          <FieldGroup label="Business name" info>
            <input
              value={(profile.business_name as string) || ""}
              onChange={(e) => onUpdate("business_name", e.target.value)}
              className="input-field"
            />
          </FieldGroup>
          <FieldGroup label="Industry" info>
            <input
              value={(profile.industry as string) || ""}
              onChange={(e) => onUpdate("industry", e.target.value)}
              className="input-field"
            />
          </FieldGroup>
          <FieldGroup label="Business description" info>
            <textarea
              value={(profile.business_description as string) || ""}
              onChange={(e) => onUpdate("business_description", e.target.value)}
              rows={3}
              className="input-field resize-none"
            />
          </FieldGroup>
          <FieldGroup label="Audience" info>
            <textarea
              value={(profile.target_audience as string) || ""}
              onChange={(e) => onUpdate("target_audience", e.target.value)}
              rows={2}
              className="input-field resize-none"
            />
          </FieldGroup>
          <FieldGroup label="🌐 Website" info>
            <input
              value={(profile.website as string) || ""}
              onChange={(e) => onUpdate("website", e.target.value)}
              className="input-field"
            />
          </FieldGroup>
          <FieldGroup label="✉ Email">
            <input
              value={(profile.email as string) || ""}
              onChange={(e) => onUpdate("email", e.target.value)}
              placeholder="hello@yourbusiness.com"
              className="input-field"
            />
          </FieldGroup>
          <FieldGroup label="📞 Phone">
            <input
              value={(profile.phone as string) || ""}
              onChange={(e) => onUpdate("phone", e.target.value)}
              placeholder="(555) 123-4567"
              className="input-field"
            />
          </FieldGroup>
        </Section>

        {/* ADVANCED SECTION */}
        <Section
          title="Advanced"
          subtitle="Language, per-social prompts, AI snippets"
          open={advancedOpen}
          onToggle={() => setAdvancedOpen(!advancedOpen)}
          saved={saved}
          onSave={handleSave}
          isSaving={isSaving}
        >
          <FieldGroup label="Post language" info>
            <select
              value={(profile.language as string) || "English"}
              onChange={(e) => onUpdate("language", e.target.value)}
              className="input-field"
            >
              <option>English</option>
              <option>French</option>
              <option>Spanish</option>
              <option>Portuguese</option>
              <option>German</option>
              <option>Arabic</option>
              <option>Swahili</option>
            </select>
          </FieldGroup>

          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground mb-1">Optimize per social</p>
            <p className="text-xs text-muted-foreground">Connect social accounts to customize optimize settings for each platform.</p>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground mb-1">AI modify snippets</p>
            <p className="text-xs text-muted-foreground mb-3">
              While editing a post, use the modify button to edit the caption with AI. Snippets are a quick way to save modify prompts for later use.
            </p>
            <button className="w-full rounded-xl border-2 border-dashed border-border hover:border-accent/30 py-3 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
              <Plus className="h-4 w-4" /> Add Snippet
            </button>
          </div>
        </Section>
      </div>

      {/* Right column — Caption Examples */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Caption Example</h3>
            <button
              onClick={handleRefreshExamples}
              disabled={examplesLoading}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {examplesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>

          {examples.length > 0 ? (
            <div className="space-y-3">
              {examples.map((ex, i) => (
                <div key={i}>
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{ex.caption}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Using topic: {ex.topic}</p>
                </div>
              ))}
              <button
                onClick={() => generateExamples(profile, 4)}
                disabled={examplesLoading}
                className="text-xs text-accent font-medium hover:underline"
              >
                Load more examples
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-xs text-muted-foreground mb-3">Fill in your style and facts, then generate example captions to preview.</p>
              <Button size="sm" variant="outline" onClick={handleRefreshExamples} disabled={examplesLoading}>
                {examplesLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Generate Examples
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
        }
        .input-field::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .input-field:focus {
          outline: none;
          box-shadow: 0 0 0 1px hsl(var(--accent));
        }
      `}</style>
    </div>
  );
}

/* Collapsible section wrapper */
function Section({
  title, subtitle, open, onToggle, saved, onSave, isSaving, children,
}: {
  title: string; subtitle: string; open: boolean; onToggle: () => void;
  saved: boolean; onSave: () => void; isSaving: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2">
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {saved && <span className="text-xs text-green-500 font-medium">Saved</span>}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {children}
          <div className="flex justify-end mt-4">
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldGroup({ label, info, children }: { label: string; info?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1 block">
        {label}
        {info && <span className="text-muted-foreground text-xs">ⓘ</span>}
      </label>
      {children}
    </div>
  );
}
