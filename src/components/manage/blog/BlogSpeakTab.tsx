import { Mic } from "lucide-react";

export function BlogSpeakTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
        <Mic className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold">Speak — Coming soon</h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        Audio content management for voice articles and narrations will be available in the next release.
      </p>
    </div>
  );
}
