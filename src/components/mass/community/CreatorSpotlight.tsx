import { ChevronLeft, ChevronRight } from "lucide-react";
import { creatorItems } from "./communityData";

export function CreatorSpotlight() {
  return (
    <section className="w-full" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="mx-auto max-w-[1200px] px-6 pb-4 pt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-bold" style={{ color: "#111827" }}>
            Creators you might like
          </h2>
          <div className="flex gap-1">
            <button className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-600">
              <ChevronLeft size={16} />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:text-gray-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <div
        className="flex gap-4 overflow-x-auto px-6 pb-6"
        style={{ scrollbarWidth: "none" }}
      >
        {creatorItems.map((creator) => (
          <a
            key={creator.id}
            href="#"
            className="group relative shrink-0 overflow-hidden rounded-2xl"
            style={{ width: "210px", height: "280px" }}
          >
            <img
              src={creator.image}
              alt={creator.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to top, rgba(234,120,50,0.7) 0%, rgba(234,120,50,0.3) 30%, rgba(0,0,0,0) 60%)",
              }}
            />
            <div className="absolute bottom-0 left-0 p-3">
              <h3 className="text-[14px] font-bold leading-tight text-white">
                {creator.name}
              </h3>
              <p className="mt-0.5 text-[11px] text-white/70">
                {creator.role}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
