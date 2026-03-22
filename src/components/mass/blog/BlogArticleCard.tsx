import type { BlogArticle } from "./blogData";
import type { CSSProperties } from "react";

interface Props {
  article: BlogArticle;
  size?: "default" | "large";
  /** When true, the image fills available flex space instead of using a fixed aspect-ratio */
  fillImage?: boolean;
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

export function BlogArticleCard({ article, size = "default", fillImage, titleClamp, excerptClamp }: Props) {
  const isLarge = size === "large";

  return (
    <a
      href={article.url || "#"}
      target={article.url ? "_blank" : undefined}
      rel={article.url ? "noopener noreferrer" : undefined}
      className="group flex flex-col transition-all duration-200 hover:-translate-y-0.5"
      style={{ textDecoration: "none", height: "100%", minHeight: 0 }}
    >
      {/* Image container */}
      <div
        className="overflow-hidden rounded-lg"
        style={{
          background: "#1a1a1a",
          ...(fillImage
            ? { flex: "1 1 0%", minHeight: 0 }
            : { flexShrink: 0, aspectRatio: isLarge ? "4/5" : "3/4" }),
        }}
      >
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ display: "block", objectPosition: "center" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>

      {/* Text content — fixed height, won't push layout */}
      <div className="flex-shrink-0 mt-3">
        {/* Meta line: date + column */}
        <div className="mb-1 flex items-center gap-1.5">
          <span
            className="text-[11px] uppercase tracking-wide"
            style={{ letterSpacing: "0.06em" }}
          >
            {article.date || article.author}
          </span>
          {article.column && (
            <>
              <span className="text-muted-foreground" className="text-[11px]">IN</span>
              <span
                className="text-[11px] uppercase tracking-wide font-semibold"
                style={{ letterSpacing: "0.06em" }}
              >
                {article.column}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3
          className="font-medium leading-snug transition-colors duration-200 group-hover:text-foreground"
          style={{
            fontFamily: "'Lufga', sans-serif",
            fontSize: isLarge ? 28 : 18, ...(titleClamp ? clampStyle(titleClamp) : {}),
          }}
        >
          {article.title}
        </h3>

        {/* Subtitle */}
        {article.subtitle && (
          <p
            className="mt-1.5 text-sm leading-relaxed"
            style={{ ...(excerptClamp ? clampStyle(excerptClamp) : {}),
            }}
          >
            {article.subtitle}
          </p>
        )}

        {/* Author */}
        <div className="flex items-center gap-2 mt-2.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ letterSpacing: "0.08em" }}
          >
            {article.author}
          </span>
        </div>
      </div>
    </a>
  );
}
