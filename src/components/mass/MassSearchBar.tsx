import { Search, Mic } from "lucide-react";

export function MassSearchBar() {
  return (
    <div className="max-w-2xl mx-auto mb-10">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
        <input
          type="text"
          placeholder="Search Yangu to buy, learn, create or sell..."
          className="w-full bg-[#1a1a1a] border border-[#333333] rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-[#666666] focus:outline-none focus:border-[#444444] transition-colors"
        />
        <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666] cursor-pointer hover:text-white transition-colors" />
      </div>
    </div>
  );
}
