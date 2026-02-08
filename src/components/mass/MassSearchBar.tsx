import { Search } from "lucide-react";

export function MassSearchBar() {
  return (
    <div className="py-8">
      <div className="relative flex items-center w-full max-w-xl mx-auto">
        <Search className="absolute left-4 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search for resources..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#1c1c1c] border border-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/10 transition-colors text-sm"
        />
      </div>
    </div>
  );
}
