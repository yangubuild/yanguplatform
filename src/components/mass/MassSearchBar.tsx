import { Search } from "lucide-react";

export function MassSearchBar() {
  return (
    <div className="py-8">
      <div className="relative flex items-center w-full max-w-xl mx-auto">
        <Search className="absolute left-4 w-4 h-4 text-white/45" />
        <input
          type="text"
          placeholder="Search Yangu to buy, learn, create or sell ..."
          className="w-full pl-11 pr-4 py-3 rounded-xl text-white focus:outline-none transition-colors text-sm"
          style={{
            background: 'rgba(21,38,31,0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
      </div>
    </div>
  );
}
