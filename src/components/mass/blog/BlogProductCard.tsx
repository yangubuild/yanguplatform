import { ArrowUpRight } from "lucide-react";
import type { BlogProduct } from "./blogData";

const PRODUCT_COLORS: Record<string, { bg: string; gradient: string }> = {
  "Ada AI": {
    bg: "#3D2E10",
    gradient: "linear-gradient(135deg, #F4A83D 0%, #C4841F 60%, #3D2E10 100%)",
  },
  Foundaweb: {
    bg: "#2A1A4A",
    gradient: "linear-gradient(135deg, #9B59B6 0%, #6C3483 60%, #2A1A4A 100%)",
  },
  Visionaire: {
    bg: "#3A1010",
    gradient: "linear-gradient(135deg, #E74C3C 0%, #C0392B 60%, #3A1010 100%)",
  },
  "VLS AI": {
    bg: "#0A2A14",
    gradient: "linear-gradient(135deg, #27AE60 0%, #1E8449 60%, #0A2A14 100%)",
  },
};

interface Props {
  product: BlogProduct;
}

export function BlogProductCard({ product }: Props) {
  const colors = PRODUCT_COLORS[product.name] ?? {
    bg: "#1a1a1a",
    gradient: "linear-gradient(135deg, #444 0%, #222 100%)",
  };

  return (
    <a
      href={product.link}
      className="group block transition-all duration-200 hover:-translate-y-0.5"
      style={{ textDecoration: "none" }}
    >
      {/* Colored image area */}
      <div
        className="overflow-hidden rounded-xl mb-4 flex items-end justify-center"
        style={{
          background: colors.gradient,
          aspectRatio: "4/3",
        }}
      >
        <span
          className="text-white/80 text-2xl font-bold pb-6 drop-shadow-lg"
          style={{ fontFamily: "'Lufga', sans-serif" }}
        >
          {product.name}
        </span>
      </div>

      {/* Name */}
      <h4
        className="text-base font-semibold mb-1"
        style={{ color: "#FFFFFF", fontFamily: "'Lufga', sans-serif" }}
      >
        {product.name}
      </h4>

      {/* Description */}
      <p
        className="text-sm leading-relaxed mb-4"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {product.description}
      </p>

      {/* Try it link */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Try it
        </span>
        <ArrowUpRight
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: "rgba(255,255,255,0.5)" }}
        />
      </div>
    </a>
  );
}
