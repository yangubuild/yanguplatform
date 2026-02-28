import { Search, Mic } from "lucide-react";

export function MassSearchBar() {
  return (
    <div className="py-8">
      <div className="relative flex items-center w-full max-w-lg mx-auto">
        <Search className="absolute left-4 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search yangu to buy, learn, create or sell ..."
          className="w-full pl-11 pr-12 py-3 rounded-full text-white placeholder:text-white/40 focus:outline-none text-base"
          style={{
            background: '#152A20',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <button 
          className="absolute right-3 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Mic className="w-4 h-4 text-white/50" />
        </button>
      </div>
    </div>
  );
}
