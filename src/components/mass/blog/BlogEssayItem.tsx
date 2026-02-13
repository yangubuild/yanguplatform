import type { BlogEssay } from "./blogData";
import type { CSSProperties } from "react";

interface Props {
  essay: BlogEssay;
  titleClamp?: number;
}

function clampStyle(lines: number): CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

export function BlogEssayItem({ essay, titleClamp }: Props) {
  return (
    <a
      href={essay.url || "#"}
      target={essay.url ? "_blank" : undefined}
      rel={essay.url ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-3 py-3 transition-colors"
      style={{ textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded overflow-hidden"
        style={{ background: "#1a1a1a", aspectRatio: "1/1" }}
      >
        <img src={essay.image} alt={essay.title} className="w-full h-full object-cover" style={{ display: "block" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4
          className="text-sm leading-snug transition-colors duration-200 group-hover:text-white"
          style={{
            fontFamily: "'Lufga', sans-serif",
            color: "rgba(255,255,255,0.8)",
            ...(titleClamp ? clampStyle(titleClamp) : {}),
          }}
        >
          {essay.title}
        </h4>
        <span className="text-xs mt-1 block" style={{ color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {essay.author}
        </span>
      </div>
    </a>
  );
}
