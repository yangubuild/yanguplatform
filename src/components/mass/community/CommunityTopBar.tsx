import { Search } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo-community.png";

export function CommunityTopBar() {
  return (
    <header className="w-full border-b" style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}>
      {/* Nav row */}
      <div className="mx-auto flex h-[48px] max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center">
            <img src={yanguLogo} alt="Yangu" className="h-[24px] w-auto" />
          </a>
          <a
            href="#"
            className="hidden text-[12px] text-gray-400 underline decoration-gray-300 underline-offset-2 hover:text-gray-600 sm:inline"
          >
            create a community
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hidden text-[12px] text-gray-500 hover:text-gray-700 sm:inline">
            List on community
          </a>
          <a href="#" className="text-[12px] text-gray-500 hover:text-gray-700">
            Login
          </a>
          <button
            className="rounded-md px-3.5 py-[5px] text-[12px] font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: "#F46D2A" }}
          >
            Subscribe
          </button>
        </div>
      </div>

      {/* Hero content inside header area */}
      <div className="mx-auto max-w-[1200px] px-6 pb-5 pt-4 text-center">
        <h1
          className="mx-auto max-w-[520px] text-[24px] font-extrabold leading-[1.2] tracking-tight sm:text-[30px]"
          style={{ color: "#111827" }}
        >
          Build and run your community
        </h1>
        <p className="mx-auto mt-1.5 max-w-[380px] text-[12px] leading-relaxed" style={{ color: "#9CA3AF" }}>
          Find communities, creators, and products that transform your life
        </p>

        {/* Search */}
        <div className="mx-auto mt-5 max-w-[420px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-2xl bg-white py-[12px] pl-11 pr-4 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none transition-all duration-200 hover:border-[#F46D2A] hover:shadow-[0_2px_16px_rgba(244,109,42,0.2)]"
              style={{
                border: "1.5px solid rgba(244,109,42,0.25)",
                boxShadow: "0 2px 12px rgba(244,109,42,0.1)",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
