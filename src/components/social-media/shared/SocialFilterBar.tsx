interface FilterTab {
  label: string;
  value: string;
  count?: number;
}

interface SocialFilterBarProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function SocialFilterBar({ tabs, activeTab, onTabChange }: SocialFilterBarProps) {
  return (
    <div className="flex gap-4 border-b border-border mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`pb-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.value
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
