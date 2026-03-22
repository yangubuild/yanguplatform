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
      {/* Product image */}
      <div className="overflow-hidden rounded-xl mb-4" style={{ aspectRatio: "4/3" }}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
        className="text-sm leading-relaxed mb-4 text-muted-foreground"
      >
        {product.description}
      </p>

      {/* Try it link */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium text-muted-foreground"
        >
          Try it
        </span>
        <ArrowUpRight
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-muted-foreground"
        />
      </div>
    </a>
  );
}
