import { FileText, Newspaper, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { manageLink } from "@/lib/routing/managePathUtils";

const contentLinks = [
  {
    title: "Blog (Layout & Engine)",
    description: "Manage sections, content layout, and publishing for the public blog.",
    slug: "content/blog",
    icon: FileText,
  },
  {
    title: "Articles / News",
    description: "Create and manage articles that feed into blog sections.",
    slug: "content/news",
    icon: Newspaper,
  },
  {
    title: "Events (Registration)",
    description: "Create events with registration that appear in the Events blog section.",
    slug: "content/events",
    icon: Calendar,
  },
];

export default function ManageContentHome() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Content Engine</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create, edit, and submit content for review and publication.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contentLinks.map((link) => (
          <Link
            key={link.slug}
            to={manageLink(link.slug)}
            className="group rounded-xl border border-border bg-card p-5 hover:border-accent/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium group-hover:text-accent transition-colors">
                  {link.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
