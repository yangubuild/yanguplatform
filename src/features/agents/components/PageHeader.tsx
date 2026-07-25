import { Helmet } from "react-helmet-async";

export function PageHeader({ title, description, actions, seoTitle, seoDescription }: {
  title: string; description?: string; actions?: React.ReactNode;
  seoTitle?: string; seoDescription?: string;
}) {
  return (
    <>
      <Helmet>
        <title>{seoTitle ?? `${title} · Yangu AI Agents`}</title>
        {(seoDescription ?? description) && (
          <meta name="description" content={seoDescription ?? description!} />
        )}
      </Helmet>
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