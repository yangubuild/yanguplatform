import { Search } from "lucide-react";

export function CommunityHero() {
  return (
    <section
      className="w-full px-6 pb-6 pt-10 text-center sm:pt-14"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <h1
        className="mx-auto max-w-[600px] text-[28px] font-extrabold leading-[1.15] tracking-tight sm:text-[36px] lg:text-[42px]"
        style={{ color: "#111827" }}
      >
        Whatever it is, there's a Circle for that
      </h1>
      <p
        className="mx-auto mt-3 max-w-[420px] text-[14px] leading-relaxed sm:text-[15px]"
        style={{ color: "#6B7280" }}
      >
        Find communities, creators, and products that transform your life
      </p>

      {/* Search bar */}
      <div className="mx-auto mt-6 max-w-[400px]">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-[9px] pl-10 pr-4 text-[14px] text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200"
          />
        </div>
      </div>
    </section>
  );
}
