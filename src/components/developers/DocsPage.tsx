import { ReactNode } from "react";

interface DocsPageProps {
  breadcrumb: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function DocsPage({ breadcrumb, title, subtitle, children }: DocsPageProps) {
  return (
    <div>
      <p className="text-sm mb-2" className="text-muted-foreground">
        {breadcrumb}
      </p>
      <h1 className="text-3xl font-bold text-foreground mb-3">{title}</h1>
      <p className="text-base mb-10" className="text-muted-foreground">
        {subtitle}
      </p>
      {children}
    </div>
  );
}

interface DocsSectionProps {
  id?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function DocsSection({ id, title, description, children }: DocsSectionProps) {
  return (
    <div id={id} className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      {description && (
        <p className="text-sm mb-6" className="text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

interface DocsCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick?: () => void;
}

export function DocsCard({ icon: Icon, title, description, onClick }: DocsCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-5 transition-colors cursor-pointer hover:border-white/20"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <Icon className="w-6 h-6 mb-4" strokeWidth={1.5} style={{ color: "#F46D2A" }} />
      <h3 className="text-foreground font-semibold text-sm mb-2">{title}</h3>
      <p className="text-xs leading-relaxed" className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

interface PlaceholderBlockProps {
  title: string;
  items: string[];
}

export function PlaceholderBlock({ title, items }: PlaceholderBlockProps) {
  return (
    <div
      className="rounded-xl p-6 mb-6"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.10)",
      }}
    >
      <h3 className="text-muted-foreground text-sm font-semibold mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-muted-foreground text-xs flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-white/20" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-4 text-xs text-muted-foreground italic">Coming next</div>
    </div>
  );
}
