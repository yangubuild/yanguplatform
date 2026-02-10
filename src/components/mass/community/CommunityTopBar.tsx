export function CommunityTopBar() {
  return (
    <header className="w-full border-b" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#111827" />
            <circle cx="14" cy="14" r="6" fill="#FFFFFF" />
          </svg>
          <span className="text-lg font-semibold" style={{ color: "#111827" }}>Discover</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
            style={{ color: "#374151", borderColor: "#D1D5DB", backgroundColor: "transparent" }}
          >
            Create a Circle
          </button>
          <button
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
            style={{ color: "#374151", borderColor: "#D1D5DB", backgroundColor: "transparent" }}
          >
            List on Discover
          </button>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
            style={{ color: "#374151", borderColor: "#D1D5DB", backgroundColor: "transparent" }}
          >
            Login
          </button>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ backgroundColor: "#7C3AED" }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </header>
  );
}
