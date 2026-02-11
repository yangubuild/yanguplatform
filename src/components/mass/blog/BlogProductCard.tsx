import { ArrowUpRight } from "lucide-react";
import type { BlogProduct } from "./blogData";

interface Props {
  product: BlogProduct;
}

export function BlogProductCard({ product }: Props) {
  return (
    <a
      href={product.link}
      className="group block transition-all duration-200 hover:-translate-y-0.5"
      style={{ textDecoration: "none" }}
    >
      <div
        className="overflow-hidden rounded-lg mb-3"
        style={{ background: "#1a1a1a", aspectRatio: "4/3" }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <h4 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
          {product.name}
        </h4>
        <ArrowUpRight
          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: "rgba(255,255,255,0.5)" }}
        />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
        {product.description}
      </p>
    </a>
  );
}
