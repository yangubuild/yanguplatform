import { Search, Mic } from "lucide-react";

export function SearchBar() {
  return (
    <div className="px-6 py-4">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-[hsl(0_0%_40%)]" />
        </div>
        <input
          type="text"
          placeholder="Search to buy, learn create or sell..."
          className="w-full h-12 pl-12 pr-12 rounded-full bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_20%)] text-white placeholder:text-[hsl(0_0%_40%)] focus:outline-none focus:border-[hsl(15_77%_60%)] focus:ring-1 focus:ring-[hsl(15_77%_60%)] transition-colors"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-4 flex items-center text-[hsl(0_0%_40%)] hover:text-white transition-colors"
        >
          <Mic className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
