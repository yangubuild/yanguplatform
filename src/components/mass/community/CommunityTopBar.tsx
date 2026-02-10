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
          Whatever it is, there's a community for that
        </h1>
        <p className="mx-auto mt-1.5 max-w-[380px] text-[12px] leading-relaxed" style={{ color: "#9CA3AF" }}>
          Find communities, creators, and products that transform your life
        </p>

        {/* Search */}
        <div className="mx-auto mt-4 max-w-[340px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-md border border-gray-200 bg-white py-[7px] pl-9 pr-3 text-[12px] text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
