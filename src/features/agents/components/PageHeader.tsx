import { useEffect } from "react";

export function PageHeader({ title, description, actions, seoTitle, seoDescription }: {
  title: string; description?: string; actions?: React.ReactNode;
  seoTitle?: string; seoDescription?: string;
}) {
  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
    document.title = seoTitle ?? `${title} · Yangu AI Agents`;
    const desc = seoDescription ?? description;
    if (desc) {
      let el = document.querySelector('meta[name="description"]');
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", "description"); document.head.appendChild(el); }
      el.setAttribute("content", desc);
    }
    return () => {
      document.title = prevTitle;
      if (prevDesc) document.querySelector('meta[name="description"]')?.setAttribute("content", prevDesc);
    };
  }, [title, description, seoTitle, seoDescription]);
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </>
  );
}

export function StatusDot({ status }: { status: "live" | "draft" | "paused" | string }) {
  const map: Record<string, string> = {
    live: "bg-emerald-500",
    draft: "bg-muted-foreground",
    paused: "bg-amber-500",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status] ?? "bg-muted-foreground"}`} />;
}