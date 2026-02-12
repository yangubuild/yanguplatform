import { ArrowUpRight } from "lucide-react";
import type { BlogEvent } from "./blogData";

interface Props {
  event: BlogEvent;
}

export function BlogEventCard({ event }: Props) {
  return (
    <a
      href="#"
      className="group block transition-all duration-200 hover:-translate-y-0.5"
      style={{ textDecoration: "none" }}
    >
      {/* Image — tall 3:4 aspect ratio */}
      <div
        className="overflow-hidden rounded-lg mb-4"
        style={{ background: "#1a1a1a", aspectRatio: "3/4" }}
      >
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      {/* Title */}
      <h3
        className="font-medium leading-snug transition-colors duration-200 group-hover:text-white"
        style={{
          fontFamily: "'Lufga', sans-serif",
          fontSize: 18,
          color: "rgba(255,255,255,0.9)",
        }}
      >
        {event.title}
      </h3>

      {/* Date */}
      <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
        {event.date}
      </p>

      {/* Register Now link */}
      <div className="flex items-center justify-between mt-4">
        <span
          className="text-sm font-medium"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Register Now
        </span>
        <ArrowUpRight
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          style={{ color: "rgba(255,255,255,0.5)" }}
        />
      </div>
    </a>
  );
}
