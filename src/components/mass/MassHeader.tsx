export function MassHeader() {
  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      {/* Left side - Home title */}
      <h1 className="text-white/55 text-lg font-normal">Home</h1>
      
      {/* Right side - Buttons */}
      <div className="flex items-center gap-3">
        <button 
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors text-white"
          style={{
            background: 'rgba(21,38,31,0.55)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          Sign in
        </button>
        <button 
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors text-white"
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
