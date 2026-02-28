import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Preset definitions ───

interface HeaderStylePreset {
  key: string;
  label: string;
  heroLayout: string;
  avatarEnabled: boolean;
  socialPosition: string;
  bgStyle: string;
}

interface ColorSchemePreset {
  key: string;
  label: string;
  primary: string;
  background: string;
  foreground: string;
  accent: string;
  preview: [string, string]; // [bg, fg] for swatch
}

interface FontPreset {
  key: string;
  label: string;
  family: string;
  headingWeight: string;
  style: string; // preview class
}

interface ButtonStylePreset {
  key: string;
  label: string;
  cardStyle: string;
  borderRadius: string;
}

const HEADER_STYLES: HeaderStylePreset[] = [
  { key: "hero_image", label: "Hero Image", heroLayout: "link_bio_media_hero", avatarEnabled: false, socialPosition: "in_hero", bgStyle: "solid_dark" },
  { key: "profile_centered", label: "Profile Centered", heroLayout: "link_bio_profile", avatarEnabled: true, socialPosition: "below_name", bgStyle: "themed" },
  { key: "media_left", label: "Media Left", heroLayout: "link_bio_split", avatarEnabled: true, socialPosition: "below_name", bgStyle: "solid_light" },
  { key: "minimal_top", label: "Minimal Top", heroLayout: "link_bio_minimal", avatarEnabled: true, socialPosition: "below_name", bgStyle: "transparent" },
];

const COLOR_SCHEMES: ColorSchemePreset[] = [
  { key: "sage", label: "Sage", primary: "hsl(140 20% 35%)", background: "hsl(140 15% 92%)", foreground: "hsl(140 20% 15%)", accent: "hsl(70 50% 65%)", preview: ["hsl(140 20% 35%)", "hsl(70 50% 65%)"] },
  { key: "dark", label: "Dark", primary: "hsl(0 0% 95%)", background: "hsl(0 0% 8%)", foreground: "hsl(0 0% 95%)", accent: "hsl(0 0% 30%)", preview: ["hsl(0 0% 8%)", "hsl(0 0% 95%)"] },
  { key: "ocean", label: "Ocean", primary: "hsl(200 60% 45%)", background: "hsl(200 30% 95%)", foreground: "hsl(200 40% 15%)", accent: "hsl(160 50% 55%)", preview: ["hsl(200 60% 45%)", "hsl(160 50% 55%)"] },
  { key: "lavender", label: "Lavender", primary: "hsl(270 40% 55%)", background: "hsl(270 25% 95%)", foreground: "hsl(270 30% 15%)", accent: "hsl(300 30% 75%)", preview: ["hsl(270 40% 55%)", "hsl(300 30% 75%)"] },
  { key: "coral", label: "Coral", primary: "hsl(10 70% 55%)", background: "hsl(10 40% 96%)", foreground: "hsl(10 30% 15%)", accent: "hsl(35 80% 60%)", preview: ["hsl(10 70% 55%)", "hsl(35 80% 60%)"] },
  { key: "cream", label: "Cream", primary: "hsl(35 30% 25%)", background: "hsl(40 30% 93%)", foreground: "hsl(35 30% 15%)", accent: "hsl(35 50% 50%)", preview: ["hsl(40 30% 93%)", "hsl(35 30% 25%)"] },
];

const FONT_PRESETS: FontPreset[] = [
  { key: "classic", label: "Classic", family: "Georgia, serif", headingWeight: "700", style: "font-serif" },
  { key: "modern", label: "Modern", family: "'Inter', sans-serif", headingWeight: "600", style: "font-sans" },
  { key: "elegant", label: "Elegant", family: "'Playfair Display', serif", headingWeight: "700", style: "font-serif italic" },
  { key: "bold", label: "Bold", family: "'Space Grotesk', sans-serif", headingWeight: "800", style: "font-sans font-extrabold" },
];

const BUTTON_STYLES: ButtonStylePreset[] = [
  { key: "rounded_full", label: "Rounded", cardStyle: "rounded_full", borderRadius: "9999px" },
  { key: "rounded_md", label: "Soft", cardStyle: "rounded_md", borderRadius: "8px" },
  { key: "sharp", label: "Sharp", cardStyle: "sharp", borderRadius: "0px" },
  { key: "outlined", label: "Outlined", cardStyle: "outlined", borderRadius: "8px" },
  { key: "pill_shadow", label: "Shadow", cardStyle: "pill_shadow", borderRadius: "9999px" },
];

// ─── Types ───

export interface InfluencerCustomization {
  headerStyle: string;
  colorScheme: string;
  font: string;
  buttonStyle: string;
}

interface InfluencerTemplateCustomizerProps {
  open: boolean;
  onClose: () => void;
  current: InfluencerCustomization;
  onApply: (customization: InfluencerCustomization) => void;
}

// ─── Component ───

export function InfluencerTemplateCustomizer({ open, onClose, current, onApply }: InfluencerTemplateCustomizerProps) {
  const [headerStyle, setHeaderStyle] = useState(current.headerStyle);
  const [colorScheme, setColorScheme] = useState(current.colorScheme);
  const [font, setFont] = useState(current.font);
  const [buttonStyle, setButtonStyle] = useState(current.buttonStyle);

  if (!open) return null;

  const handleApply = () => {
    onApply({ headerStyle, colorScheme, font, buttonStyle });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Customize template</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Header Style */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Header style</h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {HEADER_STYLES.map((hs) => (
                <button
                  key={hs.key}
                  onClick={() => setHeaderStyle(hs.key)}
                  className={`shrink-0 w-28 h-36 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 p-2 ${
                    headerStyle === hs.key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  {/* Mini preview */}
                  <div className="w-full h-20 rounded bg-muted/60 flex flex-col items-center justify-center gap-0.5">
                    {hs.avatarEnabled && <div className="w-6 h-6 rounded-full bg-muted-foreground/20" />}
                    <div className="w-12 h-1.5 rounded bg-muted-foreground/20" />
                    <div className="w-8 h-1 rounded bg-muted-foreground/15" />
                    <div className="flex gap-0.5 mt-0.5">
                      {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/15" />)}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{hs.label}</span>
                  {headerStyle === hs.key && <Check className="h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Choose a color scheme</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {COLOR_SCHEMES.map((cs) => (
                <button
                  key={cs.key}
                  onClick={() => setColorScheme(cs.key)}
                  className={`shrink-0 w-16 h-20 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    colorScheme === cs.key ? "border-primary" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden flex flex-col">
                    <div className="flex-1" style={{ backgroundColor: cs.preview[0] }} />
                    <div className="h-3" style={{ backgroundColor: cs.preview[1] }}>
                      <div className="w-4 h-1 mx-auto mt-1 rounded" style={{ backgroundColor: cs.preview[0] }} />
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{cs.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Font</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {FONT_PRESETS.map((fp) => (
                <button
                  key={fp.key}
                  onClick={() => setFont(fp.key)}
                  className={`shrink-0 w-20 h-20 rounded-lg border-2 transition-all flex items-center justify-center ${
                    font === fp.key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <span className={`text-2xl ${fp.style}`} style={{ fontFamily: fp.family }}>Aa</span>
                </button>
              ))}
            </div>
          </div>

          {/* Button Style */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Buttons style</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {BUTTON_STYLES.map((bs) => (
                <button
                  key={bs.key}
                  onClick={() => setButtonStyle(bs.key)}
                  className={`shrink-0 w-20 h-20 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1.5 p-2 ${
                    buttonStyle === bs.key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  {[1,2,3].map(i => (
                    <div key={i} className="w-full h-3 bg-muted-foreground/20" style={{ borderRadius: bs.borderRadius }} />
                  ))}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 pt-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleApply}>Use this template</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Resolve helpers ───

export function getHeaderStylePreset(key: string): HeaderStylePreset {
  return HEADER_STYLES.find(h => h.key === key) || HEADER_STYLES[1];
}

export function getColorSchemePreset(key: string): ColorSchemePreset {
  return COLOR_SCHEMES.find(c => c.key === key) || COLOR_SCHEMES[0];
}

export function getFontPreset(key: string): FontPreset {
  return FONT_PRESETS.find(f => f.key === key) || FONT_PRESETS[0];
}

export function getButtonStylePreset(key: string): ButtonStylePreset {
  return BUTTON_STYLES.find(b => b.key === key) || BUTTON_STYLES[0];
}
