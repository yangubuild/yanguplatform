import type { BlogArticle } from "./blogData";

interface Props {
  article: BlogArticle;
  size?: "default" | "large";
}

export function BlogArticleCard({ article, size = "default" }: Props) {
  const isLarge = size === "large";

  return (
    <a
      href="#"
      className="group block transition-all duration-200 hover:-translate-y-0.5"
      style={{ textDecoration: "none" }}
    >
      {/* Image */}
      <div
        className="overflow-hidden rounded-lg mb-3"
        style={{
          background: "#1a1a1a",
          aspectRatio: isLarge ? "16/10" : "16/9",
        }}
      >
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          {article.date}
        </span>
        {article.column && (
          <>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
            >
              {article.column}
            </span>
          </>
        )}
      </div>

      {/* Title */}
      <h3
        className="font-medium leading-snug transition-colors duration-200 group-hover:text-white"
        style={{
          fontFamily: "'Lufga', sans-serif",
          fontSize: isLarge ? 22 : 16,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {article.title}
      </h3>

      {/* Subtitle */}
      {article.subtitle && (
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
          {article.subtitle}
        </p>
      )}

      {/* Author */}
      <div className="flex items-center gap-2 mt-3">
        <div
          className="w-6 h-6 rounded-full"
          style={{ background: "#333" }}
        />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          {article.author}
        </span>
      </div>
    </a>
  );
}
