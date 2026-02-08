import { Search } from "lucide-react";

export function MassSearchBar() {
  return (
    <div className="mb-10">
      <div className="relative flex items-center w-full max-w-2xl mx-auto">
        <Search className="absolute left-4 w-5 h-5 text-white/30" />
        <input
          type="text"
          placeholder="Search for resources..."
          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>
    </div>
  );
}
