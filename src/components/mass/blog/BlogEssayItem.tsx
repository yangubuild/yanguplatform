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
      className="group flex items-start gap-4 py-4 transition-colors"
      style={{ textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div
        className="flex-shrink-0 rounded overflow-hidden"
        style={{ background: "#1a1a1a", width: 72, height: 72 }}>
        {essay.image ? (
          <img src={essay.image} alt={essay.title} className="w-full h-full object-cover" style={{ display: "block", objectPosition: "center" }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4
          className="text-[15px] leading-snug font-medium transition-colors duration-200 group-hover:text-foreground"
          style={{
            fontFamily: "'Lufga', sans-serif", ...(titleClamp ? clampStyle(titleClamp) : {}) }}>
          {essay.title}
        </h4>
        <span
          className="text-[11px] mt-1.5 block font-semibold uppercase tracking-wider"
          style={{ letterSpacing: "0.08em" }}>
          {essay.author}
        </span>
      </div>
    </a>
  );
}
