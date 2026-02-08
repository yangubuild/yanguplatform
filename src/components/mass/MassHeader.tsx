export function MassHeader() {
  return (
    <header className="flex items-center justify-end gap-4 mb-8">
      
      {/* Right side - Buttons */}
      <div className="flex items-center gap-3">
        <button 
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{
            background: '#152A20',
          }}
        >
          Sign in
        </button>
        <button 
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
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
