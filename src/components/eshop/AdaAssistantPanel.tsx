import { Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "Trending products this month",
  "Find viral TikTok items",
  "Products with 40% margin",
  "Find US warehouse suppliers",
  "Wireless earbuds under $20",
  "Phone accessories best sellers",
];

interface Props {
  onSuggestionClick: (query: string) => void;
}

export default function AdaAssistantPanel({ onSuggestionClick }: Props) {
  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <p className="text-xs text-muted-foreground">Click a suggestion to search</p>
      </div>
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSuggestionClick(s)}
          className="w-full text-left px-3 py-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-accent/10 hover:border-accent/30 text-sm text-foreground transition-colors">
          {s}
        </button>
      ))}
    </div>
  );
}
