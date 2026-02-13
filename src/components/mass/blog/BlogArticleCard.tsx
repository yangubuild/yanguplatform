import type { BlogArticle } from "./blogData";

interface Props {
  article: BlogArticle;
  size?: "default" | "large";
}

export function BlogArticleCard({ article, size = "default" }: Props) {
  const isLarge = size === "large";

  return (
    <a
      href={article.url || "#"}
      target={article.url ? "_blank" : undefined}
      rel={article.url ? "noopener noreferrer" : undefined}
      className="group block transition-all duration-200 hover:-translate-y-0.5"
      style={{ textDecoration: "none" }}
    >
      {/* Image — fixed aspect-ratio container */}
      <div
        className="overflow-hidden rounded-lg mb-4"
        style={{
          background: "#1a1a1a",
          aspectRatio: isLarge ? "4/5" : "3/4",
        }}
      >
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          style={{ display: "block" }}
          onError={(e) => {
            // Fallback to a neutral placeholder on broken images
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Title */}
      <h3
        className="font-medium leading-snug transition-colors duration-200 group-hover:text-white"
        style={{
          fontFamily: "'Lufga', sans-serif",
          fontSize: isLarge ? 22 : 18,
          color: "rgba(255,255,255,0.9)",
        }}
      >
        {article.title}
      </h3>

      {/* Subtitle */}
      {article.subtitle && (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          {article.subtitle}
        </p>
      )}

      {/* Author */}
      <div className="flex items-center gap-2 mt-4">
        <img
          src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(article.author)}`}
          alt={article.author}
          className="w-7 h-7 rounded-full object-cover"
          style={{ background: "#222" }}
        />
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}
        >
          {article.author}
        </span>
      </div>
    </a>
  );
}
