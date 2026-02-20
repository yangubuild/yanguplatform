import { Search } from "lucide-react";

export function CommunityHero() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 pt-2 pb-6">
      {/* Title & Subtitle */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
          Build and run your community
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Find communities, creators, and products that transform your life
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center">
        <div
          className="relative flex items-center w-full max-w-md"
        >
          <Search className="absolute left-4 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-white/40 focus:outline-none text-sm"
            style={{
              background: '#152A20',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
