import { MassTrendsBar } from "./MassTrendsBar";

export function MassHeader() {
  return (
    <header className="mb-8 lg:overflow-visible">
      {/* Top row - Buttons aligned right */}
      <div className="flex items-center justify-end gap-3">
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
            background: 'linear-gradient(180deg, #b5622a 0%, #5c2a12 100%)',
          }}
        >
          Start selling
        </button>
      </div>

      {/* Trends bar - directly below buttons */}
      <MassTrendsBar />
    </header>
  );
}
