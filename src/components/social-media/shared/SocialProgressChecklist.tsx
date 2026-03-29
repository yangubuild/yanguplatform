import { Check, Circle } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

interface SocialProgressChecklistProps {
  items: ChecklistItem[];
  title?: string;
}

export function SocialProgressChecklist({ items, title }: SocialProgressChecklistProps) {
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground">
            {completed}/{total} ({pct}%)
          </span>
        </div>
      )}
      <div className="w-full h-2 rounded-full bg-muted mb-4">
        <div
          className="h-2 rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.completed ? (
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <Check className="w-3 h-3 text-accent-foreground" />
              </div>
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <span
              className={`text-sm ${
                item.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
