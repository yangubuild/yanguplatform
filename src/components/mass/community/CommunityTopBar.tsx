import yanguLogo from "@/assets/yangu-logo-community.png";

export function CommunityTopBar() {
  return (
    <header
      className="sticky top-0 z-30 w-full border-b"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}
    >
      <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between px-6">
        {/* Left: Logo + create a community */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center">
            <img src={yanguLogo} alt="Yangu" className="h-[28px] w-auto" />
          </a>
          <a
            href="#"
            className="hidden text-[13px] font-medium text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-700 sm:inline"
          >
            create a community
          </a>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden text-[13px] font-medium text-gray-600 hover:text-gray-900 sm:inline"
          >
            List on community
          </a>
          <a
            href="#"
            className="text-[13px] font-medium text-gray-600 hover:text-gray-900"
          >
            Login
          </a>
          <button
            className="rounded-lg px-4 py-[6px] text-[13px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#F46D2A" }}
          >
            Subscribe
          </button>
        </div>
      </div>
    </header>
  );
}
