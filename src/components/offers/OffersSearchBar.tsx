import { Search } from "lucide-react";

export function OffersSearchBar() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10 py-4">
      <div
        className="flex items-center gap-3 rounded-xl px-4 h-11"
        style={{

          border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search offers"
          className="flex-1 bg-transparent text-sm outline-none border-none placeholder:text-[rgba(255,255,255,0.35)] text-foreground"
        />
      </div>
    </div>
  );
}
