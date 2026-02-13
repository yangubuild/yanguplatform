import type { BlogArticle } from "./blogData";
import type { CSSProperties } from "react";

interface Props {
  article: BlogArticle;
  size?: "default" | "large";
  titleClamp?: number;
  excerptClamp?: number;
}

function clampStyle(lines: number): CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

export function BlogArticleCard({ article, size = "default", titleClamp, excerptClamp }: Props) {
  const isLarge = size === "large";

  return (
    <a
      href={article.url || "#"}
      target={article.url ? "_blank" : undefined}
      rel={article.url ? "noopener noreferrer" : undefined}
      className="group flex flex-col transition-all duration-200 hover:-translate-y-0.5"
      style={{ textDecoration: "none", height: "100%" }}
    >
      {/* Image — fixed aspect-ratio container */}
      <div
        className="overflow-hidden rounded-lg mb-4 flex-shrink-0"
        style={{
          background: "#1a1a1a",
          aspectRatio: isLarge ? "4/5" : "16/10",
        }}
      >
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          style={{ display: "block" }}
          onError={(e) => {
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
          ...(titleClamp ? clampStyle(titleClamp) : {}),
        }}
      >
        {article.title}
      </h3>

      {/* Subtitle */}
      {article.subtitle && (
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{
            color: "rgba(255,255,255,0.45)",
            ...(excerptClamp ? clampStyle(excerptClamp) : {}),
          }}
        >
          {article.subtitle}
        </p>
      )}

      {/* Author / Date */}
      <div className="flex items-center gap-2 mt-auto pt-4">
        <img
          src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(article.author)}`}
          alt={article.author}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
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
