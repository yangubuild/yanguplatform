export function CommunityTopBar() {
  return (
    <header
      className="sticky top-0 z-30 w-full border-b"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}
    >
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          {/* Circle ring icon matching discover.circle.so */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="15" stroke="#111827" strokeWidth="2" fill="none" />
            <circle cx="16" cy="16" r="7" fill="#111827" />
          </svg>
          <span
            className="text-[17px] font-semibold tracking-tight"
            style={{ color: "#111827" }}
          >
            Discover
          </span>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="hidden items-center rounded-lg border px-4 py-[7px] text-[14px] font-medium transition-colors hover:bg-gray-50 sm:inline-flex"
            style={{
              color: "#374151",
              borderColor: "#D1D5DB",
              backgroundColor: "transparent",
            }}
          >
            Create a Circle
          </button>
          <button
            className="hidden items-center rounded-lg border px-4 py-[7px] text-[14px] font-medium transition-colors hover:bg-gray-50 sm:inline-flex"
            style={{
              color: "#374151",
              borderColor: "#D1D5DB",
              backgroundColor: "transparent",
            }}
          >
            List on Discover
          </button>
          <button
            className="inline-flex items-center rounded-lg border px-4 py-[7px] text-[14px] font-medium transition-colors hover:bg-gray-50"
            style={{
              color: "#374151",
              borderColor: "#D1D5DB",
              backgroundColor: "transparent",
            }}
          >
            Login
          </button>
          <button
            className="inline-flex items-center rounded-lg px-4 py-[7px] text-[14px] font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#7C3AED" }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </header>
  );
}
