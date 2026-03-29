import { useState } from "react";
import { Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyzedProfile } from "@/hooks/social/useAIProfileAnalyzer";

interface Props {
  onAnalyzed: (profile: AnalyzedProfile) => void;
  analyzeUrl: (url: string) => Promise<AnalyzedProfile | null>;
  isAnalyzing: boolean;
  defaultUrl: string;
}

export function AIProfileUrlAnalyzer({ onAnalyzed, analyzeUrl, isAnalyzing, defaultUrl }: Props) {
  const [url, setUrl] = useState(defaultUrl);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http")) finalUrl = "https://" + finalUrl;
    const result = await analyzeUrl(finalUrl);
    if (result) onAnalyzed(result);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">Generate from URL</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Paste your website or YANGU page URL and AI will analyze it to fill your brand profile automatically.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yangu.io/your-page or https://yourbusiness.com"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-accent focus:outline-none"
        />
        <Button onClick={handleAnalyze} disabled={isAnalyzing || !url.trim()} size="sm" className="shrink-0">
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
          Analyze
        </Button>
      </div>
    </div>
  );
}
