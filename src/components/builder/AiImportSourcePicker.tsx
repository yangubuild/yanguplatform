/**
 * AI Import Source Picker — Logo tile grid for choosing import source.
 */

import { ArrowRight, Sparkles, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportSource = "google_business" | "facebook" | "instagram" | "tiktok" | "manual";

const SOURCES: {
  key: ImportSource;
  label: string;
  subtitle: string;
  logo?: string;
}[] = [
  {
    key: "google_business",
    label: "Google Business Profile",
    subtitle: "Import from your Google Business listing",
    logo: "/assets/builder/google-business.png",
  },
  {
    key: "tiktok",
    label: "TikTok",
    subtitle: "Import from your TikTok profile",
    logo: "/assets/builder/tiktok.png",
  },
  {
    key: "instagram",
    label: "Instagram",
    subtitle: "Import from your Instagram profile",
    logo: "/assets/builder/instagram.png",
  },
  {
    key: "facebook",
    label: "Facebook",
    subtitle: "Import from your Facebook page",
    logo: "/assets/builder/facebook.png",
  },
  {
    key: "manual",
    label: "Add info manually",
    subtitle: "Describe your business in a guided chat",
  },
];

interface Props {
  onSelect: (source: ImportSource) => void;
  categoryLabel: string;
}

export function AiImportSourcePicker({ onSelect, categoryLabel }: Props) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Import your business info</h2>
        <p className="text-sm text-muted-foreground mt-2">
          We'll auto-generate your {categoryLabel} from your existing profile — just pick a source:
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {SOURCES.map((source) => (
          <button
            key={source.key}
            onClick={() => onSelect(source.key)}
            className={cn(
              "group relative flex min-h-[100px] items-center rounded-xl border border-border/60 bg-card p-5 text-left transition-all",
              "hover:border-primary/40 hover:shadow-lg active:shadow-sm",
              source.key === "manual" && "col-span-2"
            )}>
            <div className="flex w-full items-center gap-4">
              {source.logo ? (
                <>
                  <img
                    src={source.logo}
                    alt={source.label}
                    className="h-10 w-10 object-contain shrink-0"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{source.label}</span>
                    <span className="text-xs text-muted-foreground">{source.subtitle}</span>
                  </div>
                </>
              ) : (
                <>
                  <PenLine className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{source.label}</span>
                    <span className="text-xs text-muted-foreground">{source.subtitle}</span>
                  </div>
                </>
              )}
            </div>
            <ArrowRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-hover:text-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
