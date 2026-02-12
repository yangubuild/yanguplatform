import { Search, Puzzle, ArrowUpCircle, ChevronDown, Plus, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import adaLogo from "@/assets/ada-logo-full.png";

interface AdaCommandHeaderProps {
  isAdmin: boolean;
}

const models = ["gemini-3-flash-preview", "gemini-2.5-pro", "gpt-5-mini"];

export function AdaCommandHeader({ isAdmin }: AdaCommandHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <img src={adaLogo} alt="ADA AI" className="h-7 opacity-90" />
        {isAdmin && (
          <>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[hsl(var(--admin-text))] border border-[hsl(var(--admin-border)/0.4)] bg-[hsl(var(--admin-surface-elevated)/0.4)] hover:bg-[hsl(25,85%,45%/0.1)] transition-colors">
              <Plus className="h-3.5 w-3.5" />
              New Chat
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-[hsl(var(--admin-text-muted))] border border-[hsl(var(--admin-border)/0.3)] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
              <History className="h-3.5 w-3.5" />
              History
            </button>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-md hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
          <Search className="h-4 w-4 text-[hsl(var(--admin-text-muted))]" />
        </button>

        {isAdmin && (
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-[hsl(var(--admin-text-muted))] border border-[hsl(var(--admin-border)/0.3)] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
            {models[0]}
            <ChevronDown className="h-3 w-3" />
          </button>
        )}

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-[hsl(var(--admin-text-muted))] border border-[hsl(var(--admin-border)/0.3)] hover:bg-[hsl(var(--admin-surface-elevated)/0.4)] transition-colors">
          <Puzzle className="h-3.5 w-3.5" />
          Extensions
        </button>

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-[hsl(25,85%,45%/0.12)] text-[hsl(25,85%,45%)] border border-[hsl(25,85%,45%/0.25)] hover:bg-[hsl(25,85%,45%/0.2)] transition-colors">
          <ArrowUpCircle className="h-3.5 w-3.5" />
          Upgrade
        </button>

        <div className="h-7 w-7 rounded-md bg-[hsl(var(--admin-surface-elevated)/0.6)] border border-[hsl(var(--admin-border)/0.3)] flex items-center justify-center">
          <span className="text-[10px] font-bold text-[hsl(25,85%,45%)]">A</span>
        </div>
      </div>
    </div>
  );
}
