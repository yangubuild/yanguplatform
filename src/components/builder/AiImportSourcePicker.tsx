/**
 * AI Import Source Picker — Logo tile grid for choosing import source.
 * Matches the Brizy-style screenshot: 4 logo tiles + "Add manually" tile.
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
    key: "facebook",
    label: "Facebook",
    subtitle: "Import from your Facebook page",
    logo: "/assets/builder/facebook.png",
  },
  {
    key: "instagram",
    label: "Instagram",
    subtitle: "Import from your Instagram profile",
    logo: "/assets/builder/instagram.png",
  },
  {
    key: "tiktok",
    label: "TikTok",
    subtitle: "Import from your TikTok profile",
    logo: "/assets/builder/tiktok.png",
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
              "group relative flex items-center justify-between rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-md",
              source.key === "manual" && "col-span-1"
            )}
          >
            <div className="flex flex-col items-center justify-center w-full gap-2 min-h-[64px]">
              {source.logo ? (
                <img
                  src={source.logo}
                  alt={source.label}
                  className="h-8 max-w-[180px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground text-sm">{source.label}</span>
                </div>
              )}
              {source.key === "manual" && (
                <span className="text-xs text-muted-foreground">{source.subtitle}</span>
              )}
            </div>
            {source.key === "manual" && (
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 absolute right-4 top-1/2 -translate-y-1/2" />
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Start for free, no credit card required.</p>
    </div>
  );
}
