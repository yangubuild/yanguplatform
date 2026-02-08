export function MassHeader() {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      {/* Left side - Home title */}
      <h1 className="text-white/60 text-lg font-normal">Home</h1>
      
      {/* Right side - Submit resource button */}
      <button 
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors bg-[#1a1a1a] text-white hover:bg-[#252525] border border-white/10"
      >
        Submit resource
      </button>
    </header>
  );
}
