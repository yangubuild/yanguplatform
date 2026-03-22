import { Rocket } from "lucide-react";

interface Props {
  columns: string[];
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AffEmptyTable({ columns, icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      {/* Header row */}
      <div className="flex items-center border-b border-white/[0.04] px-4 py-3">
        {columns.map((col, i) => (
          <div
            key={col}
            className={`text-xs text-muted-foreground font-medium ${i === 0 ? "flex-[2]" : "flex-1 text-center"}`}>
            {col}
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center mb-4">
          {icon || <Rocket className="w-8 h-8 text-muted-foreground" />}
        </div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mb-4 text-center max-w-xs">{subtitle}</p>}
        {actionLabel && (
          <button
            onClick={onAction}
            className="px-5 py-2 rounded-xl text-sm font-medium text-foreground"
            style={{ background: "linear-gradient(90deg, #b5622a 0%, #5c2a12 100%)" }}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
