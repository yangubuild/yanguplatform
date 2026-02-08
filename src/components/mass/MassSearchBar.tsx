import { Search, Mic } from "lucide-react";

export function MassSearchBar() {
  return (
    <div className="max-w-2xl mx-auto mb-10">
      <div 
        className="relative rounded-full"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Search 
          className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" 
          style={{ color: 'rgba(255, 255, 255, 0.40)' }}
        />
        <input
          type="text"
          placeholder="Search to buy, learn create or sell..."
          className="w-full bg-transparent rounded-full py-4 pl-14 pr-14 text-white placeholder:text-white/40 focus:outline-none"
        />
        <Mic 
          className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 cursor-pointer hover:opacity-80 transition-opacity" 
          style={{ color: 'rgba(255, 255, 255, 0.40)' }}
        />
      </div>
    </div>
  );
}
