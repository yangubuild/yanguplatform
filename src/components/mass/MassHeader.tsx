export function MassHeader() {
  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      {/* Left side - Home title */}
      <h1 className="text-white/50 text-lg font-normal">Home</h1>
      
      {/* Right side - Buttons */}
      <div className="flex items-center gap-3">
        <button 
          className="px-5 py-2.5 rounded-full text-sm font-medium text-white"
          style={{
            background: '#152A20',
          }}
        >
          Sign in
        </button>
        <button 
          className="px-5 py-2.5 rounded-full text-sm font-medium text-white"
          style={{
            background: '#F46D2A',
          }}
        >
          Start selling
        </button>
      </div>
    </header>
  );
}
