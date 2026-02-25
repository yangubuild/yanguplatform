/**
 * AI Import Source Picker — Logo tile grid for choosing import source.
 */

import { ArrowRight, Sparkles } from "lucide-react";
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
    subtitle: "…and build via prompts",
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
        <h2 className="text-xl font-bold text-foreground">How would you like to create your {categoryLabel}?</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Build your site automatically by importing your business info from these
          social platforms, or create a site from scratch via prompting:
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SOURCES.map((source) => (
          <button
            key={source.key}
            onClick={() => onSelect(source.key)}
            className={cn(
              "group relative flex min-h-[116px] items-center justify-center rounded-xl border border-border/70 bg-[hsl(0_0%_100%)] p-5 text-left transition-all",
              "hover:border-border hover:shadow-md active:shadow-sm",
              source.key === "manual" && "col-span-1"
            )}
          >
            <div className="flex w-full flex-col items-center justify-center gap-2 text-center">
              {source.logo ? (
                <img
                  src={source.logo}
                  alt={source.label}
                  className="h-9 max-w-[190px] object-contain contrast-110"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-[hsl(222_47%_11%)]">{source.label}</span>
                  </div>
                  <span className="text-xs text-[hsl(215_16%_47%)]">{source.subtitle}</span>
                </div>
              )}
            </div>
            {source.key === "manual" && (
              <ArrowRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215_16%_47%)] transition-colors group-hover:text-[hsl(222_47%_11%)]" />
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Start for free, no credit card required.</p>
    </div>
  );
}
